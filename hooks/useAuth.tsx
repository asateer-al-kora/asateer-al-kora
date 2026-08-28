import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/services/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { platformStorage, isWeb } from '@/lib/platformStorage';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { registerPushToken } from '@/services/pushNotifications';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isGuest: boolean;
  loading: boolean;
  profile: { id: string; name: string; email: string; avatar_url: string; language: string } | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_KEY = 'asateer_guest';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AuthContextType['profile']>(null);

  async function ensureProfile(u: User) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url, language')
      .eq('id', u.id)
      .maybeSingle();

    if (existing) {
      setProfile(existing);
      // Sync saved language preference from profile to local storage + apply direction
      if (existing.language === 'ar' || existing.language === 'en') {
        await platformStorage.setItem('asateer_lang', existing.language);
        if (isWeb() && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('asateer-lang-sync', { detail: existing.language }));
        }
      }
      return;
    }

    const meta = u.user_metadata || {};
    const newProfile = {
      id: u.id,
      name: meta.name || meta.full_name || '',
      email: u.email || meta.email || '',
      avatar_url: meta.avatar_url || meta.picture || '',
      language: 'ar',
    };
    const { data: created } = await supabase
      .from('profiles')
      .upsert(newProfile, { onConflict: 'id' })
      .select('id, name, email, avatar_url, language')
      .maybeSingle();
    if (created) setProfile(created);
    else setProfile(newProfile as any);
  }

  useEffect(() => {
    let mounted = true;

    // Timeout fallback: if getSession never resolves within 5s, force loading=false
    const timeoutId = setTimeout(async () => {
      if (mounted) {
        const guest = (await platformStorage.getItem(GUEST_KEY)) === 'true';
        if (mounted) setIsGuest(guest);
        if (mounted) setLoading(false);
      }
    }, 5000);

    supabase.auth.getSession()
      .then(async ({ data }) => {
        if (!mounted) return;
        clearTimeout(timeoutId);
        setSession(data.session);
        setUser(data.session?.user ?? null);
        if (data.session?.user) {
          ensureProfile(data.session.user);
          void registerPushToken(data.session.user.id).catch(() => undefined);
        } else if (!data.session) {
          const guest = (await platformStorage.getItem(GUEST_KEY)) === 'true';
          setIsGuest(guest);
        }
        setLoading(false);
      })
      .catch(async () => {
        if (!mounted) return;
        clearTimeout(timeoutId);
        const guest = (await platformStorage.getItem(GUEST_KEY)) === 'true';
        setIsGuest(guest);
        setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      (async () => {
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession) {
          setIsGuest(false);
          await platformStorage.removeItem(GUEST_KEY);
          await ensureProfile(newSession.user);
          void registerPushToken(newSession.user.id).catch(() => undefined);
        } else {
          setProfile(null);
        }
        setLoading(false);
      })();
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      listener.subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) await ensureProfile(user);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return { error: error.message };
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        name,
        email,
        language: 'ar',
      }, { onConflict: 'id' });
      if (profileError) {
        // Profile creation failed but auth succeeded — not blocking
      }
    }
    return { error: null };
  };

  const signInWithGoogle = async () => {
    const redirectTo = isWeb() && typeof window !== 'undefined' ? window.location.origin : Linking.createURL('oauth/callback', { scheme: 'asateer' });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: !isWeb() },
    });
    if (error) return { error: error.message };
    if (!isWeb() && data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === 'success') {
        const callback = Linking.parse(result.url);
        const code = typeof callback.queryParams?.code === 'string' ? callback.queryParams.code : null;
        if (code) {
          const exchanged = await supabase.auth.exchangeCodeForSession(code);
          return { error: exchanged.error?.message || null };
        }
      }
    }
    return { error: null };
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    void platformStorage.setItem(GUEST_KEY, 'true');
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsGuest(false);
    setProfile(null);
    await platformStorage.removeItem(GUEST_KEY);
  };

  return (
    <AuthContext.Provider
      value={{ session, user, isGuest, loading, profile, signIn, signUp, signInWithGoogle, continueAsGuest, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
