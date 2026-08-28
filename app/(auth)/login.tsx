import { StyleSheet, View, Text, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { colors } from '@/constants/colors';
import { fontSize, fontWeight, spacing, radius } from '@/constants/layout';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/services/i18n';

export default function LoginScreen() {
  const router = useRouter();
  const { language, isRTL } = useLanguage();
  const { signIn, signInWithGoogle, continueAsGuest } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError(t(language, 'pleaseFillAllFields')); return; }
    setLoading(true);
    setError(null);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) setError(err);
  };

  const handleGoogle = async () => {
    const { error: err } = await signInWithGoogle();
    if (err) setError(err);
  };

  const handleGuest = () => { continueAsGuest(); };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.black[900], colors.black[800]]} style={styles.gradient}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.appName}>{t(language, 'appName')}</Text>
              <Text style={styles.pageTitle}>{t(language, 'login')}</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t(language, 'email')}</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email@example.com"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t(language, 'password')}</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry
                />
              </View>

              <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
                <Text style={[styles.forgotText, { textAlign: isRTL ? 'right' : 'left' }]}>{t(language, 'forgotPassword')}</Text>
              </Pressable>

              {error && <Text style={styles.errorText}>{error}</Text>}

              <Pressable style={styles.goldButton} onPress={handleLogin} disabled={loading}>
                <Text style={styles.goldButtonText}>{loading ? t(language, 'loading') : t(language, 'signIn')}</Text>
              </Pressable>

              <Pressable style={styles.googleButton} onPress={handleGoogle}>
                <View style={styles.googleIcon}><Text style={styles.googleIconText}>G</Text></View>
                <Text style={styles.googleButtonText}>{t(language, 'continueWithGoogle')}</Text>
              </Pressable>

              <Pressable style={styles.guestButton} onPress={handleGuest}>
                <Text style={styles.guestText}>{t(language, 'continueAsGuest')}</Text>
              </Pressable>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t(language, 'noAccount')} </Text>
              <Pressable onPress={() => router.push('/(auth)/signup')}>
                <Text style={styles.footerLink}>{t(language, 'signUp')}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scroll: { flexGrow: 1, padding: spacing.xl },
  header: { marginTop: spacing.xl, marginBottom: spacing.xxl },
  appName: { fontSize: fontSize.sm, color: colors.gold[400], fontWeight: fontWeight.semibold, marginBottom: 8 },
  pageTitle: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.textPrimary },
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  input: {
    backgroundColor: colors.black[700], borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: fontSize.md, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
  },
  forgotText: { fontSize: fontSize.sm, color: colors.gold[400], marginTop: 4 },
  errorText: { fontSize: fontSize.sm, color: colors.red, textAlign: 'center' },
  goldButton: {
    backgroundColor: colors.gold[500], borderRadius: radius.md, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  goldButtonText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.black[900] },
  googleButton: {
    flexDirection: 'row', borderRadius: radius.md, paddingVertical: 16, alignItems: 'center',
    justifyContent: 'center', backgroundColor: colors.black[700], borderWidth: 1, borderColor: colors.border, gap: 10,
  },
  googleIcon: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: colors.white,
    justifyContent: 'center', alignItems: 'center',
  },
  googleIconText: { fontSize: 14, fontWeight: fontWeight.bold, color: colors.blue },
  googleButtonText: { fontSize: fontSize.md, color: colors.textPrimary, fontWeight: fontWeight.medium },
  guestButton: { alignItems: 'center', paddingVertical: 12 },
  guestText: { fontSize: fontSize.sm, color: colors.textTertiary, textDecorationLine: 'underline' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xxl, paddingBottom: spacing.xl },
  footerText: { fontSize: fontSize.sm, color: colors.textSecondary },
  footerLink: { fontSize: fontSize.sm, color: colors.gold[400], fontWeight: fontWeight.semibold },
});
