import { StyleSheet, View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { colors } from '@/constants/colors';
import { fontSize, fontWeight, spacing, radius } from '@/constants/layout';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/services/supabase';
import { t } from '@/services/i18n';
import * as Linking from 'expo-linking';
import { isWeb } from '@/lib/platformStorage';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) { setError(t(language, 'enterEmailPrompt')); return; }
    setLoading(true);
    setError(null);
    const redirectTo = isWeb() && typeof window !== 'undefined' ? `${window.location.origin}/oauth/callback?type=recovery` : Linking.createURL('oauth/callback', { scheme: 'asateer' });
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);
    if (err) setError(err.message);
    else setSent(true);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.black[900], colors.black[800]]} style={styles.gradient}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.content}>
            <Text style={styles.appName}>{t(language, 'appName')}</Text>
            <Text style={styles.pageTitle}>{t(language, 'resetPassword')}</Text>
            <Text style={styles.subtitle}>{t(language, 'resetPasswordSubtitle')}</Text>

            {sent ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>✓ {t(language, 'resetLinkSent')}</Text>
                <Pressable style={styles.goldButton} onPress={() => router.replace('/(auth)/login')}>
                  <Text style={styles.goldButtonText}>{t(language, 'backToLogin')}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t(language, 'email')}</Text>
                  <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="email@example.com" placeholderTextColor={colors.textTertiary} keyboardType="email-address" autoCapitalize="none" />
                </View>
                {error && <Text style={styles.errorText}>{error}</Text>}
                <Pressable style={styles.goldButton} onPress={handleReset} disabled={loading}>
                  <Text style={styles.goldButtonText}>{loading ? t(language, 'loading') : t(language, 'sendResetLink')}</Text>
                </Pressable>
                <Pressable onPress={() => router.replace('/(auth)/login')}>
                  <Text style={styles.backText}>{t(language, 'backToLogin')}</Text>
                </Pressable>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  content: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  appName: { fontSize: fontSize.sm, color: colors.gold[400], fontWeight: fontWeight.semibold, marginBottom: 8 },
  pageTitle: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: 32, lineHeight: 22 },
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: fontSize.sm, color: colors.textSecondary },
  input: { backgroundColor: colors.black[700], borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14, fontSize: fontSize.md, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border },
  errorText: { fontSize: fontSize.sm, color: colors.red, textAlign: 'center' },
  goldButton: { backgroundColor: colors.gold[500], borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  goldButtonText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.black[900] },
  backText: { fontSize: fontSize.sm, color: colors.gold[400], textAlign: 'center', marginTop: 16 },
  successBox: { gap: 20 },
  successText: { fontSize: fontSize.md, color: colors.green, textAlign: 'center', lineHeight: 22 },
});
