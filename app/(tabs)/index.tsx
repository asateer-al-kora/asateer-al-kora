import { StyleSheet, View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { colors } from '@/constants/colors';
import { fontSize, fontWeight, spacing, radius } from '@/constants/layout';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/services/i18n';
import { footballApi } from '@/services/footballApi';
import { MatchCard, LiveMatchCard, FeaturedMatchCard } from '@/components/match/MatchCards';
import { NewsCard } from '@/components/common/Cards';
import { newsApi } from '@/services/newsApi';
import { SectionHeader } from '@/components/common/SectionHeader';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/StateViews';
import { MatchCardSkeleton } from '@/components/common/Skeleton';
import { useResponsive, getContentMaxWidth, getGridColumns } from '@/hooks/useResponsive';
import { Image } from 'react-native';

function getDateString(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

export default function HomeScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { breakpoint, isLaptopUp } = useResponsive();
  const [refreshing, setRefreshing] = useState(false);
  const [dayOffset, setDayOffset] = useState(0);

  const todayStr = getDateString(0);
  const leaguesQuery = useQuery({ queryKey: ['home-leagues'], queryFn: () => footballApi.getLeagues(), staleTime: 300_000 });

  const liveQuery = useQuery({
    queryKey: ['live-matches'],
    queryFn: () => footballApi.getLiveMatches(),
    refetchInterval: 30_000,
  });

  const todayQuery = useQuery({
    queryKey: ['matches-by-date', todayStr],
    queryFn: () => footballApi.getMatchesByDate(todayStr),
    staleTime: 60_000,
  });

  const newsQuery = useQuery({
    queryKey: ['home-news', language],
    queryFn: () => newsApi.getLatest('latest', language, 1),
    staleTime: 300_000,
  });

  const transfersQuery = useQuery({
    queryKey: ['home-transfers', language],
    queryFn: () => newsApi.getLatest('transfers', language, 1),
    staleTime: 900_000,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([liveQuery.refetch(), todayQuery.refetch()]);
    setRefreshing(false);
  }, []);

  const featuredMatch = todayQuery.data?.[0];
  const liveMatches = liveQuery.data || [];
  const todayMatches = todayQuery.data || [];

  const dayTabs = [
    { label: t(language, 'yesterday'), offset: -1 },
    { label: t(language, 'today'), offset: 0 },
    { label: t(language, 'tomorrow'), offset: 1 },
  ];

  const dayQuery = useQuery({
    queryKey: ['matches-by-date', getDateString(dayOffset)],
    queryFn: () => footballApi.getMatchesByDate(getDateString(dayOffset)),
    enabled: dayOffset !== 0,
    staleTime: 60_000,
  });

  const displayMatches = dayOffset === 0 ? todayMatches : (dayQuery.data || []);
  const matchColumns = getGridColumns(breakpoint, 'matches');
  const contentMaxWidth = getContentMaxWidth(breakpoint);

  const renderMainContent = () => (
    <View style={isLaptopUp ? styles.desktopMainInner : undefined}>
      {/* Featured Match */}
      {featuredMatch && (
        <View style={styles.section}>
          <SectionHeader title={t(language, 'featuredMatch')} />
          <FeaturedMatchCard match={featuredMatch} onPress={() => router.push(`/match/${featuredMatch.fixture.id}`)} />
        </View>
      )}

      {/* Day tabs */}
      <View style={styles.dayTabs}>
        {dayTabs.map(tab => (
          <Pressable
            key={tab.offset}
            style={[styles.dayTab, dayOffset === tab.offset && styles.dayTabActive]}
            onPress={() => setDayOffset(tab.offset)}
          >
            <Text style={[styles.dayTabText, dayOffset === tab.offset && styles.dayTabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Today's Matches */}
      <View style={styles.section}>
        <SectionHeader title={t(language, 'todaysMatches')} />
        {dayOffset !== 0 && dayQuery.isLoading ? (
          <LoadingState />
        ) : dayOffset !== 0 && dayQuery.error ? (
          <ErrorState onRetry={() => dayQuery.refetch()} message={(dayQuery.error as any)?.message || 'connectionError'} />
        ) : displayMatches.length > 0 ? (
          <View style={matchColumns > 1 ? styles.matchGrid : undefined}>
            {displayMatches.slice(0, 20).map(m => (
              <View key={m.fixture.id} style={matchColumns > 1 ? { flex: 1, minWidth: `${100 / matchColumns - 2}%` } : undefined}>
                <MatchCard match={m} onPress={() => router.push(`/match/${m.fixture.id}`)} />
              </View>
            ))}
          </View>
        ) : (
          <EmptyState message={t(language, 'noData')} />
        )}
      </View>

      {/* News section (desktop) */}
      {isLaptopUp && (
        <View style={styles.section}>
          <SectionHeader title={t(language, 'news')} actionText={t(language, 'viewAll')} onAction={() => router.push('/(tabs)/news')} />
          {newsQuery.isLoading ? <LoadingState /> : newsQuery.error ? <ErrorState onRetry={() => newsQuery.refetch()} message={(newsQuery.error as Error).message} /> : newsQuery.data?.articles?.length ? newsQuery.data.articles.slice(0, 5).map((article) => <NewsCard key={article.id} title={article.title} image={article.image || newsApi.placeholder} source={article.source || article.sourceName || ''} time={new Date(article.publishedAt).toLocaleString(language === 'ar' ? 'ar' : 'en')} onPress={() => router.push({ pathname: '/news/[id]', params: { id: article.id } })} />) : <EmptyState message={t(language, 'noData')} />}
        </View>
      )}
    </View>
  );

  const renderSidebar = () => (
    <View style={styles.desktopSidebar}>
      {/* Live Matches */}
      <View style={styles.sidebarSection}>
        <SectionHeader title={t(language, 'liveMatches')} actionText={t(language, 'viewAll')} onAction={() => router.push('/(tabs)/matches')} />
        {liveQuery.isLoading ? (
          <MatchCardSkeleton />
        ) : liveQuery.error ? (
          <ErrorState onRetry={() => liveQuery.refetch()} message={(liveQuery.error as any)?.message || 'connectionError'} />
        ) : liveMatches.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {liveMatches.slice(0, 5).map(m => (
              <LiveMatchCard key={m.fixture.id} match={m} onPress={() => router.push(`/match/${m.fixture.id}`)} />
            ))}
          </ScrollView>
        ) : (
          <EmptyState message={t(language, 'noLiveMatches')} />
        )}
      </View>

      {/* Popular Leagues */}
      <View style={styles.sidebarSection}>
        <SectionHeader title={t(language, 'leagues')} actionText={t(language, 'viewAll')} onAction={() => router.push('/(tabs)/competitions')} />
        <View style={styles.leagueList}>
          {leaguesQuery.data?.slice(0, 5).map((league) => (
            <Pressable key={league.id} style={styles.leagueItem} onPress={() => router.push(`/competition/${league.id}`)}>
              {league.logo ? <Image source={{ uri: league.logo }} style={styles.leagueLogo} defaultSource={require('@/assets/images/icon.png')} /> : <View style={styles.leaguePlaceholder}><Text style={styles.leagueEmoji}>🏆</Text></View>}
              <Text style={styles.leagueNameText} numberOfLines={1}>{league.name}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Transfers */}
      <View style={styles.sidebarSection}>
        <SectionHeader title={t(language, 'transfers')} actionText={t(language, 'viewAll')} onAction={() => router.push('/transfers')} />
        {transfersQuery.isLoading ? <LoadingState /> : transfersQuery.error ? <ErrorState onRetry={() => transfersQuery.refetch()} message={(transfersQuery.error as Error).message} /> : transfersQuery.data?.articles?.length ? transfersQuery.data.articles.slice(0, 5).map((article) => <NewsCard key={article.id} title={article.title} image={article.image || newsApi.placeholder} source={article.source || article.sourceName || ''} time={new Date(article.publishedAt).toLocaleString(language === 'ar' ? 'ar' : 'en')} onPress={() => router.push({ pathname: '/news/[id]', params: { id: article.id } })} />) : <EmptyState message={t(language, 'noData')} />}
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={isLaptopUp ? [styles.desktopScrollContent, { maxWidth: contentMaxWidth }] : undefined}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold[400]} />}
      >
        {isLaptopUp ? (
          <View style={styles.desktopLayout}>
            {renderMainContent()}
            {renderSidebar()}
          </View>
        ) : (
          <View>
            {/* Featured Match */}
            {featuredMatch && (
              <View style={styles.section}>
                <SectionHeader title={t(language, 'featuredMatch')} />
                <FeaturedMatchCard match={featuredMatch} onPress={() => router.push(`/match/${featuredMatch.fixture.id}`)} />
              </View>
            )}

            {/* Live Matches */}
            <View style={styles.section}>
              <SectionHeader title={t(language, 'liveMatches')} actionText={t(language, 'viewAll')} onAction={() => router.push('/(tabs)/matches')} />
              {liveQuery.isLoading ? (
                <MatchCardSkeleton />
              ) : liveQuery.error ? (
                <ErrorState onRetry={() => liveQuery.refetch()} message={(liveQuery.error as any)?.message || 'connectionError'} />
              ) : liveMatches.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                  {liveMatches.slice(0, 5).map(m => (
                    <LiveMatchCard key={m.fixture.id} match={m} onPress={() => router.push(`/match/${m.fixture.id}`)} />
                  ))}
                </ScrollView>
              ) : (
                <EmptyState message={t(language, 'noLiveMatches')} />
              )}
            </View>

            {/* Day tabs */}
            <View style={styles.dayTabs}>
              {dayTabs.map(tab => (
                <Pressable
                  key={tab.offset}
                  style={[styles.dayTab, dayOffset === tab.offset && styles.dayTabActive]}
                  onPress={() => setDayOffset(tab.offset)}
                >
                  <Text style={[styles.dayTabText, dayOffset === tab.offset && styles.dayTabTextActive]}>{tab.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Today's Matches */}
            <View style={styles.section}>
              <SectionHeader title={t(language, 'todaysMatches')} />
              {dayOffset !== 0 && dayQuery.isLoading ? (
                <LoadingState />
              ) : dayOffset !== 0 && dayQuery.error ? (
                <ErrorState onRetry={() => dayQuery.refetch()} message={(dayQuery.error as any)?.message || 'connectionError'} />
              ) : displayMatches.length > 0 ? (
                displayMatches.slice(0, 20).map(m => (
                  <MatchCard key={m.fixture.id} match={m} onPress={() => router.push(`/match/${m.fixture.id}`)} />
                ))
              ) : (
                <EmptyState message={t(language, 'noData')} />
              )}
            </View>

            <View style={styles.section}>
              <SectionHeader title={t(language, 'news')} actionText={t(language, 'viewAll')} onAction={() => router.push('/(tabs)/news')} />
              {newsQuery.isLoading ? <LoadingState /> : newsQuery.error ? <ErrorState onRetry={() => newsQuery.refetch()} message={(newsQuery.error as Error).message} /> : newsQuery.data?.articles?.length ? newsQuery.data.articles.slice(0, 5).map((article) => <NewsCard key={article.id} title={article.title} image={article.image || newsApi.placeholder} source={article.source || article.sourceName || ''} time={new Date(article.publishedAt).toLocaleString(language === 'ar' ? 'ar' : 'en')} onPress={() => router.push({ pathname: '/news/[id]', params: { id: article.id } })} />) : <EmptyState message={t(language, 'noData')} />}
            </View>

            <View style={styles.section}>
              <SectionHeader title={t(language, 'transfers')} actionText={t(language, 'viewAll')} onAction={() => router.push('/transfers')} />
              {transfersQuery.isLoading ? <LoadingState /> : transfersQuery.error ? <ErrorState onRetry={() => transfersQuery.refetch()} message={(transfersQuery.error as Error).message} /> : transfersQuery.data?.articles?.length ? transfersQuery.data.articles.slice(0, 5).map((article) => <NewsCard key={article.id} title={article.title} image={article.image || newsApi.placeholder} source={article.source || article.sourceName || ''} time={new Date(article.publishedAt).toLocaleString(language === 'ar' ? 'ar' : 'en')} onPress={() => router.push({ pathname: '/news/[id]', params: { id: article.id } })} />) : <EmptyState message={t(language, 'noData')} />}
            </View>

            <View style={{ height: 24 }} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  desktopScrollContent: {
    width: '100%',
    alignSelf: 'center',
    padding: spacing.lg,
  },
  desktopLayout: {
    flexDirection: 'row',
    gap: 24,
  },
  desktopMainInner: {
    flex: 1,
    minWidth: 0,
  },
  desktopSidebar: {
    width: 340,
    flexShrink: 0,
  },
  section: { paddingHorizontal: spacing.md, marginBottom: spacing.md },
  horizontalScroll: { paddingBottom: 8 },
  dayTabs: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: 8, marginBottom: 8 },
  dayTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.md, backgroundColor: colors.card },
  dayTabActive: { backgroundColor: colors.gold[500] },
  dayTabText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  dayTabTextActive: { color: colors.black[900], fontWeight: fontWeight.bold },
  matchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sidebarSection: { marginBottom: 24 },
  leagueList: { gap: 6 },
  leagueItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: radius.md, padding: 10 },
  leaguePlaceholder: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.black[700], justifyContent: 'center', alignItems: 'center' },
  leagueEmoji: { fontSize: 16 },
  leagueLogo: { width: 32, height: 32, resizeMode: 'contain' },
  leagueNameText: { flex: 1, fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: fontWeight.medium },
  transferList: { gap: 6 },
  transferItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: radius.md, padding: 10 },
  transferPhoto: { width: 36, height: 36, borderRadius: 18, resizeMode: 'cover' },
  transferPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.black[600], justifyContent: 'center', alignItems: 'center' },
  transferPlaceholderText: { fontSize: 14, color: colors.gold[400], fontWeight: fontWeight.bold },
  transferInfo: { flex: 1 },
  transferPlayerName: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: fontWeight.semibold },
  transferClub: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 2 },
  comingSoon: { fontSize: fontSize.sm, color: colors.textTertiary, padding: 16, textAlign: 'center' },
});
