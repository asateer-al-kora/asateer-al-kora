import { StyleSheet, View, Text, ScrollView, Pressable, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { fontSize, fontWeight, spacing, radius } from '@/constants/layout';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/services/i18n';
import { ArrowLeft, ChevronRight, User as UserIcon, Star, Bell, Globe, Sun, Shield, FileText, Info, LogOut, Pencil } from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { user, profile, isGuest, signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert(t(language, 'confirmLogout'), '', [
      { text: t(language, 'cancel'), style: 'cancel' },
      { text: t(language, 'logout'), style: 'destructive', onPress: async () => { await signOut(); router.replace('/(auth)/welcome'); } },
    ]);
  };

  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const displayName = profile?.name || user?.user_metadata?.name || (isGuest ? t(language, 'guestUser') : '');
  const displayEmail = profile?.email || user?.email || '';

  const menuItems = [
    { icon: Pencil, label: t(language, 'editProfile'), action: () => {
      if (isGuest) { router.replace('/(auth)/login'); return; }
      Alert.alert(t(language, 'editProfile'), t(language, 'changePreferencesLater'));
    }},
    { icon: Star, label: t(language, 'favorites'), action: () => router.push('/(tabs)/favorites') },
    { icon: Bell, label: t(language, 'notifications'), action: () => router.push('/notifications') },
    { icon: Globe, label: t(language, 'language'), action: () => router.push('/settings') },
    { icon: Sun, label: t(language, 'theme'), action: () => router.push('/settings') },
    { icon: Shield, label: t(language, 'privacy'), action: () => Alert.alert(t(language, 'privacy'), t(language, 'privacyText')) },
    { icon: FileText, label: t(language, 'terms'), action: () => Alert.alert(t(language, 'terms'), t(language, 'termsText')) },
    { icon: Info, label: t(language, 'about'), action: () => Alert.alert(t(language, 'about'), t(language, 'aboutAppText')) },
  ];

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><ArrowLeft color={colors.textPrimary} size={24} /></Pressable>
        <Text style={styles.headerTitle}>{t(language, 'profile')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} defaultSource={require('@/assets/images/icon.png')} />
          ) : (
            <View style={styles.avatarPlaceholder}><UserIcon color={colors.gold[400]} size={36} /></View>
          )}
          <Text style={styles.name}>{displayName}</Text>
          {displayEmail && <Text style={styles.email}>{displayEmail}</Text>}
          {isGuest && <View style={styles.guestBadge}><Text style={styles.guestBadgeText}>{t(language, 'guestMode')}</Text></View>}
        </View>

        <View style={styles.menu}>
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <Pressable key={i} style={styles.menuItem} onPress={item.action}>
                <Icon color={colors.gold[400]} size={20} strokeWidth={2} />
                <Text style={styles.menuItemLabel}>{item.label}</Text>
                <ChevronRight color={colors.textTertiary} size={18} />
              </Pressable>
            );
          })}

          {!isGuest && (
            <Pressable style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
              <LogOut color={colors.red} size={20} strokeWidth={2} />
              <Text style={[styles.menuItemLabel, { color: colors.red }]}>{t(language, 'logout')}</Text>
            </Pressable>
          )}

          {isGuest && (
            <Pressable style={styles.loginPrompt} onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.loginPromptText}>{t(language, 'signIn')}</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.aboutSection}>
          <Text style={styles.aboutText}>{t(language, 'aboutAppText')}</Text>
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
  profileSection: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, resizeMode: 'cover', borderWidth: 2, borderColor: colors.gold[500] },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.black[700], justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.gold[500] },
  name: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  email: { fontSize: fontSize.sm, color: colors.textSecondary },
  guestBadge: { marginTop: 4, backgroundColor: colors.gold[600] + '30', paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.sm },
  guestBadgeText: { fontSize: fontSize.xs, color: colors.gold[400], fontWeight: fontWeight.semibold },
  menu: { paddingHorizontal: spacing.md, gap: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: 14, gap: 14, marginBottom: 4 },
  logoutItem: { marginTop: 8 },
  menuItemLabel: { flex: 1, fontSize: fontSize.md, color: colors.textPrimary, fontWeight: fontWeight.medium },
  loginPrompt: { alignItems: 'center', backgroundColor: colors.gold[500], borderRadius: radius.md, padding: 16, marginTop: 8 },
  loginPromptText: { color: colors.black[900], fontWeight: fontWeight.bold, fontSize: fontSize.md },
  aboutSection: { padding: spacing.lg, alignItems: 'center', marginTop: 16 },
  aboutText: { fontSize: fontSize.sm, color: colors.textTertiary, textAlign: 'center', lineHeight: 22 },
  version: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 8 },
});
