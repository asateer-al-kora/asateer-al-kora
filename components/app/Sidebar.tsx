import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Home, Calendar, Trophy, Newspaper, Star, Search, Bell, User as UserIcon, LogOut } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { fontSize, fontWeight, spacing, radius } from '@/constants/layout';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/services/i18n';

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { language, isRTL } = useLanguage();
  const { profile, user, isGuest, signOut } = useAuth();

  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const displayName = profile?.name || user?.user_metadata?.name || (isGuest ? t(language, 'guestUser') : '');

  const navItems = [
    { icon: Home, label: t(language, 'home'), path: '/(tabs)' },
    { icon: Calendar, label: t(language, 'matches'), path: '/(tabs)/matches' },
    { icon: Trophy, label: t(language, 'competitions'), path: '/(tabs)/competitions' },
    { icon: Newspaper, label: t(language, 'news'), path: '/(tabs)/news' },
    { icon: Star, label: t(language, 'favorites'), path: '/(tabs)/favorites' },
  ];

  const utilItems = [
    { icon: Search, label: t(language, 'search'), path: '/search' },
    { icon: Bell, label: t(language, 'notifications'), path: '/notifications' },
    { icon: UserIcon, label: t(language, 'profile'), path: '/profile' },
  ];

  const isActive = (path: string) => {
    if (path === '/(tabs)') return pathname === '/' || pathname.startsWith('/(tabs)');
    return pathname.startsWith(path.replace('/(tabs)', ''));
  };

  return (
    <View style={[styles.sidebar, isRTL ? styles.sidebarRTL : styles.sidebarLTR, { direction: isRTL ? 'rtl' : 'ltr' } as any]}>
      {/* Logo */}
      <Pressable style={[styles.logoSection, isRTL && styles.rowRTL]} onPress={() => router.replace('/(tabs)')}>
        <View style={styles.logoCircle}>
          <Image source={require('@/assets/images/asateer-logo.png')} style={styles.logoImage} />
        </View>
        <View>
          <Text style={styles.appName}>{t(language, 'appName')}</Text>
          <Text style={styles.appTagline} numberOfLines={1}>{t(language, 'appTagline')}</Text>
        </View>
      </Pressable>

      {/* Nav */}
      <View style={styles.navSection}>
        {navItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Pressable
              key={item.path}
              style={[styles.navItem, isRTL && styles.rowRTL, active && styles.navItemActive]}
              onPress={() => router.push(item.path as any)}
            >
              {active && <View style={[styles.activeIndicator, isRTL ? styles.activeIndicatorRTL : styles.activeIndicatorLTR]} />}
              <Icon color={active ? colors.gold[400] : colors.textSecondary} size={20} strokeWidth={2} />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Utility */}
      <View style={styles.navSection}>
        {utilItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Pressable
              key={item.path}
              style={[styles.navItem, isRTL && styles.rowRTL, active && styles.navItemActive]}
              onPress={() => router.push(item.path as any)}
            >
              {active && <View style={[styles.activeIndicator, isRTL ? styles.activeIndicatorRTL : styles.activeIndicatorLTR]} />}
              <Icon color={active ? colors.gold[400] : colors.textSecondary} size={20} strokeWidth={2} />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* User section */}
      <View style={styles.spacer} />
      <Pressable style={[styles.userSection, isRTL && styles.rowRTL]} onPress={() => router.push('/profile')}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} defaultSource={require('@/assets/images/icon.png')} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <UserIcon color={colors.gold[400]} size={18} strokeWidth={2} />
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.userEmail} numberOfLines={1}>{isGuest ? t(language, 'guestMode') : user?.email || ''}</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 240,
    backgroundColor: colors.black[900],
    borderRightWidth: 0,
    borderLeftWidth: 0,
    paddingTop: 24,
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  sidebarLTR: { borderRightWidth: 1, borderRightColor: colors.border },
  sidebarRTL: { borderLeftWidth: 1, borderLeftColor: colors.border },
  rowRTL: { flexDirection: 'row-reverse' },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    marginBottom: 28,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.black[700],
    borderWidth: 1,
    borderColor: colors.gold[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: { width: '100%', height: '100%', borderRadius: 20 },
  appName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.gold[400],
  },
  appTagline: {
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 1,
  },
  navSection: {
    marginBottom: 12,
    gap: 2,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
  navItemActive: {
    backgroundColor: colors.black[800],
  },
  activeIndicator: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
    backgroundColor: colors.gold[400],
  },
  activeIndicatorLTR: { left: 0 },
  activeIndicatorRTL: { right: 0 },
  navLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  navLabelActive: {
    color: colors.gold[400],
    fontWeight: fontWeight.semibold,
  },
  spacer: { flex: 1 },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.black[700],
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: { flex: 1, alignItems: 'flex-start' },
  userName: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  userEmail: {
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 1,
  },
});
