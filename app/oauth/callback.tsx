import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/services/supabase';
import { colors } from '@/constants/colors';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/services/i18n';

export default function OAuthCallbackScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const url = Linking.useURL();
  useEffect(() => {
    let active = true;
    const complete = async () => {
      const callbackUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
      if (!callbackUrl) return;
      const parsed = Linking.parse(callbackUrl);
      const params = parsed.queryParams || {};
      const hash = callbackUrl.split('#')[1] || '';
      const hashParams = new URLSearchParams(hash);
      try {
        if (typeof params.code === 'string') {
          const result = await supabase.auth.exchangeCodeForSession(params.code);
          if (result.error) throw result.error;
        } else {
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          if (accessToken && refreshToken) {
            const result = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
            if (result.error) throw result.error;
          }
        }
        const recovery = params.type === 'recovery' || hashParams.get('type') === 'recovery';
        if (active) router.replace(recovery ? '/(auth)/reset-password' : '/(tabs)');
      } catch (callbackError) {
        if (active) setError(callbackError instanceof Error ? callbackError.message : t(language, 'somethingWrong'));
      }
    };
    void complete();
    return () => { active = false; };
  }, [url]);
  return <View style={styles.screen}>{error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator color={colors.gold[400]} size="large" />}</View>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 }, error: { color: colors.red, textAlign: 'center' } });
