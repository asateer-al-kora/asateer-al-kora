import { StyleSheet, View, Text, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { colors } from '@/constants/colors';
import { fontSize, fontWeight, spacing, radius } from '@/constants/layout';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/services/i18n';
import { supabase } from '@/services/supabase';
import { registerPushToken } from '@/services/pushNotifications';
import { listUserNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification, type UserNotification } from '@/services/notificationCenter';
import { ArrowLeft, Trash2 } from 'lucide-react-native';

export default function NotificationsScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { user, isGuest } = useAuth();
  const [prefs, setPrefs] = useState({
    match_start: true,
    goals: true,
    half_time: true,
    match_end: true,
    red_cards: true,
    team_news: true,
    player_news: false,
    transfers: true,
    breaking_news: true,
  });
  const [loading, setLoading] = useState(true);
  const [centerItems, setCenterItems] = useState<UserNotification[]>([]);

  useEffect(() => {
    if (!user || isGuest) { setLoading(false); return; }
    loadPrefs();
    void registerPushToken(user.id);
    void loadCenter(user.id);
  }, [user, isGuest]);

  const loadCenter = async (userId: string) => {
    try { setCenterItems(await listUserNotifications(userId)); } catch { setCenterItems([]); }
  };

  const loadPrefs = async () => {
    if (!user) return;
    const { data } = await supabase.from('notification_preferences').select('match_start,goals,half_time,match_end,red_cards,team_news,player_news,transfers,breaking_news').eq('user_id', user.id).maybeSingle();
    if (data) setPrefs({ match_start: data.match_start ?? true, goals: data.goals ?? true, half_time: data.half_time ?? true, match_end: data.match_end ?? true, red_cards: data.red_cards ?? true, team_news: data.team_news ?? true, player_news: data.player_news ?? false, transfers: data.transfers ?? true, breaking_news: data.breaking_news ?? true });
    setLoading(false);
  };

  const togglePref = async (key: keyof typeof prefs, value: boolean) => {
    if (isGuest || !user) { router.push('/(auth)/login'); return; }
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    await supabase.from('notification_preferences').upsert({ user_id: user.id, [key]: value }, { onConflict: 'user_id' });
  };

  const setAll = async (value: boolean) => {
    if (isGuest || !user) { router.push('/(auth)/login'); return; }
    const newPrefs = { ...prefs, match_start: value, goals: value, half_time: value, match_end: value, red_cards: value, team_news: value, player_news: value, transfers: value, breaking_news: value };
    setPrefs(newPrefs);
    await supabase.from('notification_preferences').upsert({ user_id: user.id, match_start: value, goals: value, half_time: value, match_end: value, red_cards: value, team_news: value, player_news: value, transfers: value, breaking_news: value }, { onConflict: 'user_id' });
  };

  if (isGuest || !user) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}><ArrowLeft color={colors.textPrimary} size={24} /></Pressable>
          <Text style={styles.headerTitle}>{t(language, 'notifications')}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptText}>{t(language, 'guestModeMessage')}</Text>
          <Pressable style={styles.goldButton} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.goldButtonText}>{t(language, 'signIn')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const items = [
    { key: 'match_start' as const, label: t(language, 'matchStart') },
    { key: 'goals' as const, label: t(language, 'goals') },
    { key: 'half_time' as const, label: language === 'ar' ? 'نهاية الشوط الأول' : 'Half Time' },
    { key: 'match_end' as const, label: t(language, 'matchEnd') },
    { key: 'red_cards' as const, label: t(language, 'redCards') },
    { key: 'team_news' as const, label: t(language, 'teamNews') },
    { key: 'player_news' as const, label: t(language, 'playerNews') },
    { key: 'transfers' as const, label: t(language, 'transfers') },
    { key: 'breaking_news' as const, label: t(language, 'breakingNews') },
  ];

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><ArrowLeft color={colors.textPrimary} size={24} /></Pressable>
        <Text style={styles.headerTitle}>{t(language, 'notificationSettings')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.centerHeader}>
          <Text style={styles.sectionTitle}>{language === 'ar' ? 'مركز الإشعارات' : 'Notification Center'}</Text>
          <Pressable style={styles.readAllButton} onPress={async () => { if (user) { await markAllNotificationsRead(user.id); await loadCenter(user.id); } }}>
            <Text style={styles.readAllText}>{language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}</Text>
          </Pressable>
        </View>
        {centerItems.length ? centerItems.map((item) => (
          <Pressable key={item.id} style={[styles.notificationCard, !item.read && styles.unreadCard]} onPress={async () => { if (user && !item.read) { await markNotificationRead(user.id, item.id); setCenterItems((items) => items.map((entry) => entry.id === item.id ? { ...entry, read: true } : entry)); } const data = item.data || {}; if (data.fixtureId) router.push({ pathname: '/match/[id]', params: { id: String(data.fixtureId) } }); else if (data.articleId) router.push({ pathname: '/news/[id]', params: { id: String(data.articleId) } }); }}>
            <View style={styles.notificationText}>
              <Text style={styles.notificationTitle}>{item.title}</Text>
              <Text style={styles.notificationBody}>{item.body}</Text>
              <Text style={styles.notificationDate}>{new Date(item.created_at).toLocaleString(language === 'ar' ? 'ar' : 'en')}</Text>
            </View>
            <Pressable onPress={async () => { if (user) { await deleteNotification(user.id, item.id); setCenterItems((items) => items.filter((entry) => entry.id !== item.id)); } }} hitSlop={8}><Trash2 color={colors.gray[400]} size={18} /></Pressable>
          </Pressable>
        )) : <Text style={styles.emptyCenter}>{language === 'ar' ? 'لا توجد إشعارات سابقة' : 'No previous notifications'}</Text>}

        <View style={styles.actions}>
          <Pressable style={styles.actionButton} onPress={() => setAll(true)}>
            <Text style={styles.actionText}>{t(language, 'enableAll')}</Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={() => setAll(false)}>
            <Text style={styles.actionText}>{t(language, 'disableAll')}</Text>
          </Pressable>
        </View>

        <View style={styles.list}>
          {items.map(item => (
            <View key={item.key} style={styles.prefRow}>
              <Text style={styles.prefLabel}>{item.label}</Text>
              <Switch
                value={prefs[item.key]}
                onValueChange={(v) => togglePref(item.key, v)}
                trackColor={{ false: colors.black[500], true: colors.gold[600] }}
                thumbColor={prefs[item.key] ? colors.gold[400] : colors.gray[400]}
              />
            </View>
          ))}
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
  centerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, marginBottom: 10 },
  sectionTitle: { fontSize: fontSize.lg, color: colors.textPrimary, fontWeight: fontWeight.bold },
  readAllButton: { paddingVertical: 6, paddingHorizontal: 8 },
  readAllText: { fontSize: fontSize.xs, color: colors.gold[400] },
  notificationCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginHorizontal: spacing.md, marginBottom: 8, padding: 12, borderRadius: radius.md, backgroundColor: colors.card },
  unreadCard: { borderColor: colors.gold[600], borderWidth: 1 },
  notificationText: { flex: 1 },
  notificationTitle: { color: colors.textPrimary, fontWeight: fontWeight.bold, fontSize: fontSize.sm, marginBottom: 4 },
  notificationBody: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20 },
  notificationDate: { color: colors.gray[500], fontSize: fontSize.xs, marginTop: 5 },
  emptyCenter: { color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.md, paddingVertical: 12 },
  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.md, marginBottom: 16 },
  actionButton: { flex: 1, alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, paddingVertical: 12 },
  actionText: { fontSize: fontSize.sm, color: colors.gold[400], fontWeight: fontWeight.semibold },
  list: { paddingHorizontal: spacing.md, gap: 4 },
  prefRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: 14, marginBottom: 4 },
  prefLabel: { fontSize: fontSize.md, color: colors.textPrimary, fontWeight: fontWeight.medium },
  loginPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  loginPromptText: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  goldButton: { backgroundColor: colors.gold[500], borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center' },
  goldButtonText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.black[900] },
});
