import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { colors } from '@/constants/colors';
import { fontSize, fontWeight, spacing, radius } from '@/constants/layout';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/services/i18n';
import { supabase } from '@/services/supabase';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (password.length < 6) return setError(t(language, 'passwordTooShort'));
    if (password !== confirm) return setError(t(language, 'passwordMismatch'));
    setLoading(true); setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) setError(updateError.message); else setSaved(true);
  };
  return <View style={styles.container}><LinearGradient colors={[colors.black[900], colors.black[800]]} style={styles.gradient}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}><ScrollView contentContainerStyle={styles.content}><Text style={styles.appName}>{t(language, 'appName')}</Text><Text style={styles.title}>{t(language, 'resetPassword')}</Text>{saved ? <><Text style={styles.success}>{t(language, 'passwordUpdated')}</Text><Pressable style={styles.button} onPress={() => router.replace('/(auth)/login')}><Text style={styles.buttonText}>{t(language, 'backToLogin')}</Text></Pressable></> : <View style={styles.form}><TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder={t(language, 'newPassword')} placeholderTextColor={colors.textTertiary} secureTextEntry /><TextInput style={styles.input} value={confirm} onChangeText={setConfirm} placeholder={t(language, 'confirmPassword')} placeholderTextColor={colors.textTertiary} secureTextEntry />{error && <Text style={styles.error}>{error}</Text>}<Pressable style={styles.button} onPress={() => void submit()} disabled={loading}><Text style={styles.buttonText}>{loading ? t(language, 'loading') : t(language, 'save')}</Text></Pressable></View>}</ScrollView></KeyboardAvoidingView></LinearGradient></View>;
}

const styles = StyleSheet.create({ container: { flex: 1 }, gradient: { flex: 1 }, flex: { flex: 1 }, content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl }, appName: { color: colors.gold[400], fontSize: fontSize.sm, fontWeight: fontWeight.semibold, marginBottom: 8 }, title: { color: colors.textPrimary, fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, marginBottom: 24 }, form: { gap: 14 }, input: { backgroundColor: colors.black[700], borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border }, button: { backgroundColor: colors.gold[500], borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', marginTop: 10 }, buttonText: { color: colors.black[900], fontSize: fontSize.md, fontWeight: fontWeight.bold }, error: { color: colors.red, textAlign: 'center' }, success: { color: colors.green, textAlign: 'center', fontSize: fontSize.md, marginBottom: 20 },
});
