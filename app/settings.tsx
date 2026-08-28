import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { fontSize, fontWeight, spacing, radius } from '@/constants/layout';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/services/i18n';
import { availableLanguages, type Language } from '@/constants/translations';
import { ArrowLeft, Check } from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const { signOut } = useAuth();

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><ArrowLeft color={colors.textPrimary} size={24} /></Pressable>
        <Text style={styles.headerTitle}>{t(language, 'settings')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t(language, 'selectLanguage')}</Text>
          {availableLanguages.map(lang => (
            <Pressable key={lang.code} style={styles.optionRow} onPress={() => setLanguage(lang.code)}>
              <Text style={styles.optionLabel}>{lang.label}</Text>
              {language === lang.code && <Check color={colors.gold[400]} size={20} />}
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t(language, 'theme')}</Text>
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>{t(language, 'darkMode')}</Text>
            <Check color={colors.gold[400]} size={20} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t(language, 'privacy')}</Text>
          <Text style={styles.infoText}>{t(language, 'privacyText')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t(language, 'terms')}</Text>
          <Text style={styles.infoText}>{t(language, 'termsText')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t(language, 'about')}</Text>
          <Text style={styles.infoText}>{t(language, 'aboutAppText')}</Text>
          <Text style={styles.version}>{t(language, 'version')} 1.0.0</Text>
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: 12 },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  section: { paddingHorizontal: spacing.md, marginBottom: 24 },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.gold[400], marginBottom: 12 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: 14, marginBottom: 4 },
  optionLabel: { fontSize: fontSize.md, color: colors.textPrimary, fontWeight: fontWeight.medium },
  infoText: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 22, backgroundColor: colors.card, borderRadius: radius.md, padding: 14 },
  version: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 8, textAlign: 'center' },
});
