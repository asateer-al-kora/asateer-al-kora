import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Search, Bell, User as UserIcon } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { fontSize, fontWeight, spacing } from '@/constants/layout';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/services/i18n';
import { countUnreadNotifications } from '@/services/notificationCenter';

export function AppHeader({ title, showActions = true }: { title?: string; showActions?: boolean }) {
  const router = useRouter();
  const { language } = useLanguage();
  const { profile, isGuest, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;
    if (user && !isGuest) void countUnreadNotifications(user.id).then((count) => { if (active) setUnreadCount(count); }).catch(() => { if (active) setUnreadCount(0); });
    else setUnreadCount(0);
    return () => { active = false; };
  }, [user?.id, isGuest]);

  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const displayName = profile?.name || user?.user_metadata?.name || (isGuest ? t(language, 'guestUser') : '');

  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        <View style={styles.logoCircle}>
          <Image source={require('@/assets/images/asateer-logo.png')} style={styles.logoImage} />
        </View>
        <View>
          <Text style={styles.appName}>{title || t(language, 'appName')}</Text>
          {displayName ? <Text style={styles.welcome}>{t(language, 'welcomeBack')}, {displayName}</Text> : null}
        </View>
      </View>
      {showActions && (
        <View style={styles.actions}>
          <Pressable style={styles.iconButton} onPress={() => router.push('/search')}>
            <Search color={colors.textSecondary} size={20} strokeWidth={2} />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => router.push('/notifications')}>
            <Bell color={colors.textSecondary} size={20} strokeWidth={2} />
            {unreadCount > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text></View> : null}
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => router.push('/profile')}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} defaultSource={require('@/assets/images/icon.png')} />
            ) : (
              <UserIcon color={colors.gold[400]} size={20} strokeWidth={2} />
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.black[900],
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.black[700],
    borderWidth: 1,
    borderColor: colors.gold[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: { width: '100%', height: '100%', borderRadius: 18 },
  appName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.gold[400],
  },
  welcome: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.black[700],
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: colors.black[900], fontSize: 9, fontWeight: '700' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    resizeMode: 'cover',
  },
});
