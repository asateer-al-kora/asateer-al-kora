import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { colors } from '@/constants/colors';
import { fontSize, fontWeight, spacing, radius } from '@/constants/layout';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { t } from '@/services/i18n';
import { supabase } from '@/services/supabase';
import { AppHeader } from '@/components/app/AppHeader';
import { EmptyState, LoadingState } from '@/components/common/StateViews';
import { useResponsive, getContentMaxWidth } from '@/hooks/useResponsive';
import { Image } from 'react-native';

export default function FavoritesScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { user, isGuest } = useAuth();
  const { loading, reload } = useFavorites();
  const { isLaptopUp, breakpoint } = useResponsive();
  const [tab, setTab] = useState<'teams' | 'players' | 'matches' | 'leagues' | 'competitions'>('teams');
  const [items, setItems] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const tabs = [
    { key: 'teams' as const, label: t(language, 'favoritesTeams') },
    { key: 'players' as const, label: t(language, 'favoritesPlayers') },
    { key: 'matches' as const, label: t(language, 'favoritesMatches') },
    { key: 'leagues' as const, label: t(language, 'favoritesLeagues') },
  ];

  useEffect(() => {
    if (isGuest || !user) { setDataLoading(false); return; }
    loadItems();
  }, [user, isGuest, tab]);

  const loadItems = async () => {
    if (!user) return;
    setDataLoading(true);
    const tableMap: Record<string, string> = {
      teams: 'favorite_teams',
      players: 'favorite_players',
      matches: 'favorite_matches',
      leagues: 'favorite_leagues',
    };
    const table = tableMap[tab];
    if (!table) { setDataLoading(false); return; }
    const { data } = await supabase.from(table).select('*').eq('user_id', user.id);
    setItems(data || []);
    setDataLoading(false);
  };

  const contentMaxWidth = getContentMaxWidth(breakpoint);
  const useGrid = isLaptopUp && (tab === 'teams' || tab === 'players' || tab === 'leagues');

  if (isGuest || !user) {
    return (
      <View style={styles.screen}>
        {!isLaptopUp && <AppHeader title={t(language, 'favorites')} />}
        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptIcon}>⭐</Text>
          <Text style={styles.loginPromptTitle}>{t(language, 'loginRequired')}</Text>
          <Text style={styles.loginPromptText}>{t(language, 'guestModeMessage')}</Text>
          <Pressable style={styles.goldButton} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.goldButtonText}>{t(language, 'signIn')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {!isLaptopUp && <AppHeader title={t(language, 'favorites')} />}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={[styles.tabsContent, isLaptopUp && { paddingHorizontal: 0, paddingTop: spacing.lg }]}>
        {tabs.map(tb => (
          <Pressable key={tb.key} style={[styles.tab, tab === tb.key && styles.tabActive]} onPress={() => setTab(tb.key)}>
            <Text style={[styles.tabText, tab === tb.key && styles.tabTextActive]}>{tb.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={isLaptopUp ? [styles.desktopScrollContent, { maxWidth: contentMaxWidth }] : undefined}>
        {dataLoading ? <LoadingState /> :
         items.length > 0 ? (
          <View style={useGrid ? styles.favGrid : styles.list}>
            {items.map(item => {
              const name = item.team_name || item.player_name || item.league_name || `#${item.match_id}`;
              const logo = item.team_logo || item.player_photo || item.league_logo;
              return (
                <Pressable
                  key={item.id}
                  style={useGrid ? styles.favGridItem : styles.favItem}
                  onPress={() => {
                    if (tab === 'teams') router.push(`/team/${item.team_id}`);
                    else if (tab === 'players') router.push(`/player/${item.player_id}`);
                    else if (tab === 'leagues') router.push(`/competition/${item.league_id}`);
                  }}
                >
                  {logo ? (
                    <Image source={{ uri: logo }} style={styles.favLogo} defaultSource={require('@/assets/images/icon.png')} />
                  ) : (
                    <View style={styles.favPlaceholder}><Text style={styles.favPlaceholderText}>⚽</Text></View>
                  )}
                  <Text style={styles.favName} numberOfLines={1}>{name}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : <EmptyState message={t(language, 'emptyFavorites')} />}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  tabsScroll: { maxHeight: 50, paddingVertical: 8 },
  tabsContent: { paddingHorizontal: spacing.md, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.sm, backgroundColor: colors.card, marginRight: 8 },
  tabActive: { backgroundColor: colors.gold[500] },
  tabText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  tabTextActive: { color: colors.black[900], fontWeight: fontWeight.bold },
  scroll: { flex: 1 },
  list: { padding: spacing.md, gap: 8 },
  favItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: 12, gap: 12, marginBottom: 8 },
  favGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: spacing.md },
  favGridItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: 12, gap: 12, flex: 1, minWidth: 280, maxWidth: '48%' },
  favLogo: { width: 40, height: 40, resizeMode: 'contain' },
  favPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.black[600], justifyContent: 'center', alignItems: 'center' },
  favPlaceholderText: { fontSize: 20 },
  favName: { flex: 1, fontSize: fontSize.md, color: colors.textPrimary, fontWeight: fontWeight.medium },
  loginPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  loginPromptIcon: { fontSize: 48, marginBottom: 16 },
  loginPromptTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: 8 },
  loginPromptText: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  goldButton: { backgroundColor: colors.gold[500], borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center' },
  goldButtonText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.black[900] },
  desktopScrollContent: { width: '100%', alignSelf: 'center' },
});
