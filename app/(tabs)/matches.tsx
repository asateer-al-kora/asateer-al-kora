import { StyleSheet, View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { colors } from '@/constants/colors';
import { fontSize, fontWeight, spacing, radius } from '@/constants/layout';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/services/i18n';
import { footballApi } from '@/services/footballApi';
import { AppHeader } from '@/components/app/AppHeader';
import { MatchCard } from '@/components/match/MatchCards';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/StateViews';
import { useResponsive, getContentMaxWidth, getGridColumns } from '@/hooks/useResponsive';
import type { MatchStatus } from '@/types/football';

function getDateString(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

export default function MatchesScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { breakpoint, isLaptopUp } = useResponsive();
  const [tab, setTab] = useState<'live' | 'today' | 'upcoming' | 'finished'>('today');
  const [refreshing, setRefreshing] = useState(false);

  const todayStr = getDateString(0);

  const liveQuery = useQuery({
    queryKey: ['matches-live'],
    queryFn: () => footballApi.getLiveMatches(),
    refetchInterval: 30_000,
    enabled: tab === 'live',
  });

  const todayQuery = useQuery({
    queryKey: ['matches-today', todayStr],
    queryFn: () => footballApi.getMatchesByDate(todayStr),
    staleTime: 60_000,
  });

  const tomorrowQuery = useQuery({
    queryKey: ['matches-tomorrow', getDateString(1)],
    queryFn: () => footballApi.getMatchesByDate(getDateString(1)),
    staleTime: 60_000,
    enabled: tab === 'upcoming',
  });

  const yesterdayQuery = useQuery({
    queryKey: ['matches-yesterday', getDateString(-1)],
    queryFn: () => footballApi.getMatchesByDate(getDateString(-1)),
    staleTime: 60_000,
    enabled: tab === 'finished',
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const queries = [liveQuery, todayQuery, tomorrowQuery, yesterdayQuery];
    await Promise.all(queries.map(q => q.refetch()));
    setRefreshing(false);
  }, []);

  const tabs = [
    { key: 'live' as const, label: t(language, 'live') },
    { key: 'today' as const, label: t(language, 'today') },
    { key: 'upcoming' as const, label: t(language, 'upcoming') },
    { key: 'finished' as const, label: t(language, 'finished') },
  ];

  let matches: any[] = [];
  let isLoading = false;
  let error: any = null;
  let errorRefetch: () => void = () => {};

  if (tab === 'live') { matches = liveQuery.data || []; isLoading = liveQuery.isLoading; error = liveQuery.error; errorRefetch = () => liveQuery.refetch(); }
  else if (tab === 'today') { matches = todayQuery.data || []; isLoading = todayQuery.isLoading; error = todayQuery.error; errorRefetch = () => todayQuery.refetch(); }
  else if (tab === 'upcoming') { matches = tomorrowQuery.data || []; isLoading = tomorrowQuery.isLoading; error = tomorrowQuery.error; errorRefetch = () => tomorrowQuery.refetch(); }
  else if (tab === 'finished') { matches = yesterdayQuery.data || []; isLoading = yesterdayQuery.isLoading; error = yesterdayQuery.error; errorRefetch = () => yesterdayQuery.refetch(); }

  const columns = getGridColumns(breakpoint, 'matches');
  const contentMaxWidth = getContentMaxWidth(breakpoint);

  return (
    <View style={styles.screen}>
      {!isLaptopUp && <AppHeader title={t(language, 'matches')} />}
      <View style={[styles.tabs, isLaptopUp && styles.tabsDesktop]}>
        {tabs.map(tb => (
          <Pressable key={tb.key} style={[styles.tab, tab === tb.key && styles.tabActive]} onPress={() => setTab(tb.key)}>
            {tb.key === 'live' && <View style={styles.liveDot} />}
            <Text style={[styles.tabText, tab === tb.key && styles.tabTextActive]}>{tb.label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={isLaptopUp ? [styles.desktopScrollContent, { maxWidth: contentMaxWidth }] : undefined}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold[400]} />}
      >
        {isLoading ? <LoadingState /> :
         error ? <ErrorState onRetry={errorRefetch} message={(error as any)?.message || 'connectionError'} /> :
         matches.length > 0 ? (
          <View style={columns > 1 ? styles.matchGrid : styles.list}>
            {matches.slice(0, 50).map((m: any) => (
              <View key={m.fixture.id} style={columns > 1 ? { flex: 1, minWidth: `${100 / columns - 2}%` } : undefined}>
                <MatchCard match={m} onPress={() => router.push(`/match/${m.fixture.id}`)} />
              </View>
            ))}
          </View>
        ) : <EmptyState message={t(language, 'noData')} />}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: 8, marginBottom: 12 },
  tabsDesktop: { paddingHorizontal: 0, paddingTop: spacing.lg },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.card },
  tabActive: { backgroundColor: colors.gold[500] },
  tabText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  tabTextActive: { color: colors.black[900], fontWeight: fontWeight.bold },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.live },
  scroll: { flex: 1 },
  list: { padding: spacing.md, gap: 8 },
  matchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: spacing.sm },
  desktopScrollContent: {
    width: '100%',
    alignSelf: 'center',
  },
});
