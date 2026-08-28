import { useEffect, useState } from 'react';
import { Stack, router, usePathname } from 'expo-router';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { LanguageProvider, useLanguage } from '@/hooks/useLanguage';
import { QueryProvider } from '@/hooks/useQueryProvider';
import { SplashScreen } from '@/components/app/SplashScreen';
import { subscribeToNotificationResponses } from '@/services/pushNotifications';

const SPLASH_MIN_DURATION = 2000;

function RootNavigator() {
  const { session, isGuest, loading } = useAuth();
  const pathname = usePathname();
  const [minSplashDone, setMinSplashDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinSplashDone(true), SPLASH_MIN_DURATION);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    void subscribeToNotificationResponses((data) => {
      const type = String(data.type || '');
      const fixtureId = data.fixtureId ? String(data.fixtureId) : '';
      const articleId = data.articleId ? String(data.articleId) : '';
      const teamId = data.teamId ? String(data.teamId) : '';
      if (fixtureId && ['match_start', 'goal', 'half_time', 'second_half', 'red_card', 'match_end', 'postponed', 'cancelled', 'suspended'].includes(type)) router.push({ pathname: '/match/[id]', params: { id: fixtureId } });
      else if (articleId && ['breaking_news', 'transfer_news'].includes(type)) router.push({ pathname: '/news/[id]', params: { id: articleId } });
      else if (teamId) router.push({ pathname: '/team/[id]', params: { id: teamId } });
      else if (type === 'test-push' || data.url === '/notifications') router.push('/notifications');
    }).then((unsubscribe) => { cleanup = unsubscribe; });
    return () => cleanup?.();
  }, []);

  useEffect(() => {
    if (loading || !minSplashDone) return;

    const isPublicRoute = ['/welcome', '/login', '/signup', '/forgot-password', '/oauth/callback', '/reset-password'].some((route) => pathname.includes(route));
    const isAuthenticated = Boolean(session || isGuest);

    // Redirect only when the current route is not allowed for the current auth state.
    if (!isAuthenticated && !isPublicRoute) {
      router.replace('/(auth)/welcome');
      return;
    }

    if (isAuthenticated && (pathname === '/' || pathname.includes('/welcome') || pathname.includes('/login') || pathname.includes('/signup') || pathname.includes('/forgot-password'))) {
      router.replace('/(tabs)');
    }
  }, [session, isGuest, loading, minSplashDone, pathname]);

  if (loading || !minSplashDone) {
    return <SplashScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="oauth/callback" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="match/[id]" />
      <Stack.Screen name="competition/[id]" />
      <Stack.Screen name="team/[id]" />
      <Stack.Screen name="player/[id]" />
      <Stack.Screen name="news/[id]" />
      <Stack.Screen name="search" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="transfers" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

function DirectionRoot() {
  const { isRTL } = useLanguage();
  return <View style={[{ flex: 1 }, { direction: isRTL ? 'rtl' : 'ltr' } as any]}><AuthProvider><QueryProvider><RootNavigator /><StatusBar style="light" /></QueryProvider></AuthProvider></View>;
}

export default function RootLayout() {
  useFrameworkReady();
  return <LanguageProvider><DirectionRoot /></LanguageProvider>;
}
