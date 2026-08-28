import { StyleSheet, View, Text, ScrollView, Image, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { colors } from '@/constants/colors';
import { fontSize, fontWeight, spacing, radius } from '@/constants/layout';
import { useLanguage } from '@/hooks/useLanguage';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/services/i18n';
import { footballApi } from '@/services/footballApi';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/StateViews';
import { SectionHeader, TabBar } from '@/components/common/SectionHeader';
import { MatchCard } from '@/components/match/MatchCards';
import { useResponsive, getContentMaxWidth } from '@/hooks/useResponsive';
import { ArrowLeft, Star } from 'lucide-react-native';
import type { MatchEvent, MatchStatistic, MatchFixture } from '@/types/football';

export default function MatchDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { language } = useLanguage();
  const { user, isGuest } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { breakpoint, isLaptopUp } = useResponsive();
  const [activeTab, setActiveTab] = useState(0);
  const fixtureId = parseInt(id);

  const matchQuery = useQuery({
    queryKey: ['fixture', fixtureId],
    queryFn: () => footballApi.getFixtureDetails(fixtureId),
    staleTime: 300_000,
  });

  const match = matchQuery.data?.[0];
  const seasonQuery = useQuery({ queryKey: ['fixture-season', match?.league?.id], queryFn: () => footballApi.getCurrentSeason(match!.league.id), enabled: !!match?.league?.id, staleTime: 300_000 });
  const currentSeason = seasonQuery.data || match?.league?.currentSeason;

  const eventsQuery = useQuery({
    queryKey: ['events', fixtureId],
    queryFn: () => footballApi.getMatchEvents(fixtureId),
    enabled: activeTab === 1,
  });

  const statsQuery = useQuery({
    queryKey: ['stats', fixtureId],
    queryFn: () => footballApi.getMatchStatistics(fixtureId),
    enabled: activeTab === 2,
    staleTime: 300_000,
  });

  const lineupsQuery = useQuery({
    queryKey: ['lineups', fixtureId],
    queryFn: () => footballApi.getLineups(fixtureId),
    enabled: activeTab === 3,
    staleTime: 300_000,
  });

  const h2hQuery = useQuery({
    queryKey: ['h2h', match?.teams?.home?.id, match?.teams?.away?.id],
    queryFn: () => footballApi.getHeadToHead(match!.teams.home.id, match!.teams.away.id),
    enabled: activeTab === 5 && !!match?.teams?.home?.id && !!match?.teams?.away?.id,
    staleTime: 300_000,
  });

  const standingsQuery = useQuery({
    queryKey: ['match-standings', match?.league?.id, currentSeason!],
    queryFn: () => footballApi.getStandings(match!.league.id, currentSeason!),
    enabled: activeTab === 4 && !!match?.league?.id && !!currentSeason,
    staleTime: 300_000,
  });

  if (matchQuery.isLoading) return <View style={styles.screen}><LoadingState /></View>;
  if (matchQuery.error) return <View style={styles.screen}><ErrorState onRetry={() => matchQuery.refetch()} message={(matchQuery.error as any)?.message} /></View>;
  if (!match) return <View style={styles.screen}><EmptyState /></View>;

  const tabs = [t(language, 'overview'), t(language, 'events'), t(language, 'statistics'), t(language, 'lineups'), t(language, 'standings'), t(language, 'h2h')];
  const fav = isFavorite('matches', fixtureId);
  const contentMaxWidth = getContentMaxWidth(breakpoint);

  const handleFav = async () => {
    if (isGuest || !user) { router.push('/(auth)/login'); return; }
    await toggleFavorite('matches', fixtureId);
  };

  const mainContent = (
    <View style={isLaptopUp ? styles.desktopMain : undefined}>
      <View style={styles.scoreContainer}>
        <View style={styles.teamSide}>
          <Image source={{ uri: match.teams.home.logo }} style={styles.teamLogo} defaultSource={require('@/assets/images/icon.png')} />
          <Text style={styles.teamName} numberOfLines={2}>{match.teams.home.name}</Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.score}>{match.goals.home ?? 0} - {match.goals.away ?? 0}</Text>
          <Text style={styles.status}>{match.fixture.status.short === 'NS' ? new Date(match.fixture.date).toLocaleTimeString() : match.fixture.status.long || match.fixture.status.short}</Text>
        </View>
        <View style={styles.teamSide}>
          <Image source={{ uri: match.teams.away.logo }} style={styles.teamLogo} defaultSource={require('@/assets/images/icon.png')} />
          <Text style={styles.teamName} numberOfLines={2}>{match.teams.away.name}</Text>
        </View>
      </View>

      <TabBar tabs={tabs} activeIndex={activeTab} onTabChange={setActiveTab} />

      <View style={styles.tabContent}>
        {activeTab === 0 && <OverviewTab match={match} />}
        {activeTab === 1 && <EventsTab events={eventsQuery} />}
        {activeTab === 2 && <StatisticsTab stats={statsQuery} />}
        {activeTab === 3 && <LineupsTab lineups={lineupsQuery} />}
        {activeTab === 4 && (
          standingsQuery.isLoading ? <LoadingState /> :
          standingsQuery.error ? <ErrorState onRetry={() => standingsQuery.refetch()} message={(standingsQuery.error as any)?.message} /> :
          standingsQuery.data?.[0]?.league?.standings?.[0] ? (
            <View>{standingsQuery.data[0].league.standings[0].map((row: any, i: number) => (
              <View key={i} style={styles.standingRow}>
                <Text style={styles.standingRank}>{row.rank}</Text>
                <Image source={{ uri: row.team.logo }} style={styles.standingLogo} defaultSource={require('@/assets/images/icon.png')} />
                <Text style={styles.standingName} numberOfLines={1}>{row.team.name}</Text>
                <Text style={styles.standingPts}>{row.points}</Text>
              </View>
            ))}</View>
          ) : <EmptyState message={t(language, 'noData')} />
        )}
        {activeTab === 5 && (
          h2hQuery.isLoading ? <LoadingState /> :
          h2hQuery.error ? <ErrorState onRetry={() => h2hQuery.refetch()} message={(h2hQuery.error as any)?.message} /> :
          h2hQuery.data?.length ? (
            <View>{h2hQuery.data.slice(0, 15).map((m: MatchFixture, i: number) => (
              <MatchCard key={i} match={m} onPress={() => router.push(`/match/${m.fixture.id}`)} />
            ))}</View>
          ) : <EmptyState />
        )}
      </View>
    </View>
  );

  const sidebarContent = (
    <View style={styles.desktopSidebar}>
      <View style={styles.sidebarCard}>
        <Text style={styles.sidebarTitle}>{t(language, 'overview')}</Text>
        <InfoRow label={t(language, 'venue')} value={match.fixture.venue?.name || '-'} />
        <InfoRow label={t(language, 'referee')} value={match.fixture.referee || '-'} />
        <InfoRow label={t(language, 'date')} value={new Date(match.fixture.date).toLocaleDateString()} />
        <InfoRow label={t(language, 'round')} value={match.league.round || '-'} />
      </View>

      <Pressable style={styles.leagueCard} onPress={() => router.push(`/competition/${match.league.id}`)}>
        <Image source={{ uri: match.league.logo }} style={styles.sidebarLeagueLogo} defaultSource={require('@/assets/images/icon.png')} />
        <View style={styles.leagueInfo}>
          <Text style={styles.sidebarLeagueName} numberOfLines={1}>{match.league.name}</Text>
          <Text style={styles.sidebarLeagueSeason}>{t(language, 'season')} {currentSeason!}</Text>
        </View>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={isLaptopUp ? [styles.desktopScroll, { maxWidth: contentMaxWidth }] : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}><ArrowLeft color={colors.textPrimary} size={24} /></Pressable>
          <Pressable onPress={handleFav}><Star color={fav ? colors.gold[400] : colors.textSecondary} size={24} fill={fav ? colors.gold[400] : 'none'} /></Pressable>
        </View>

        <View style={styles.matchInfo}>
          <Image source={{ uri: match.league.logo }} style={styles.leagueLogo} defaultSource={require('@/assets/images/icon.png')} />
          <Text style={styles.leagueName}>{match.league.name}</Text>
          {match.fixture.venue?.name && <Text style={styles.venue}>{match.fixture.venue.name}</Text>}
        </View>

        {isLaptopUp ? (
          <View style={styles.desktopLayout}>
            {mainContent}
            {sidebarContent}
          </View>
        ) : (
          mainContent
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function OverviewTab({ match }: { match: any }) {
  const { language } = useLanguage();
  return (
    <View style={styles.overview}>
      <InfoRow label={t(language, 'venue')} value={match.fixture.venue?.name || '-'} />
      <InfoRow label={t(language, 'referee')} value={match.fixture.referee || '-'} />
      <InfoRow label={t(language, 'date')} value={new Date(match.fixture.date).toLocaleDateString()} />
      <InfoRow label={t(language, 'round')} value={match.league.round || '-'} />
    </View>
  );
}

function EventsTab({ events }: { events: any }) {
  const { language } = useLanguage();
  if (events.isLoading) return <LoadingState />;
  if (events.error) return <ErrorState onRetry={() => events.refetch()} message={(events.error as any)?.message} />;
  if (!events.data?.length) return <EmptyState />;
  return (
    <View style={styles.events}>
      {events.data.map((ev: MatchEvent, i: number) => (
        <View key={i} style={styles.eventRow}>
          <Text style={styles.eventTime}>{ev.time.elapsed}'</Text>
          <View style={styles.eventInfo}>
            <Text style={styles.eventType}>{ev.type === 'Goal' ? '⚽' : ev.type === 'Card' ? (ev.detail.includes('Red') ? '🟥' : '🟨') : '🔄'} {ev.player.name}</Text>
            {ev.assist?.name && <Text style={styles.eventAssist}>{t(language, 'assistLabel')}: {ev.assist.name}</Text>}
            <Text style={styles.eventTeam} numberOfLines={1}>{ev.team.name}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function StatisticsTab({ stats }: { stats: any }) {
  if (stats.isLoading) return <LoadingState />;
  if (stats.error) return <ErrorState onRetry={() => stats.refetch()} message={(stats.error as any)?.message} />;
  if (!stats.data?.length) return <EmptyState />;
  const home = stats.data[0];
  const away = stats.data[1];
  if (!home || !away) return <EmptyState />;
  return (
    <View style={styles.stats}>
      {home.statistics.map((stat: any, i: number) => {
        const homeVal = stat.value ?? 0;
        const awayVal = away.statistics[i]?.value ?? 0;
        const homeNum = typeof homeVal === 'string' ? parseInt(homeVal) || 0 : homeVal;
        const awayNum = typeof awayVal === 'string' ? parseInt(awayVal) || 0 : awayVal;
        const total = homeNum + awayNum || 1;
        const homePct = (homeNum / total) * 100;
        const awayPct = (awayNum / total) * 100;
        return (
          <View key={i} style={styles.statRow}>
            <Text style={styles.statValue}>{homeVal}</Text>
            <View style={styles.statBarContainer}>
              <Text style={styles.statLabel}>{stat.type}</Text>
              <View style={styles.statBarBg}>
                <View style={[styles.statBarHome, { width: `${homePct}%` }]} />
                <View style={[styles.statBarAway, { width: `${awayPct}%` }]} />
              </View>
            </View>
            <Text style={styles.statValue}>{awayVal}</Text>
          </View>
        );
      })}
    </View>
  );
}

function LineupsTab({ lineups }: { lineups: any }) {
  const { language } = useLanguage();
  if (lineups.isLoading) return <LoadingState />;
  if (lineups.error) return <ErrorState onRetry={() => lineups.refetch()} message={(lineups.error as any)?.message} />;
  if (!lineups.data?.length) return <EmptyState />;
  return (
    <View style={styles.lineups}>
      {lineups.data.map((lineup: any, i: number) => (
        <View key={i} style={styles.lineupTeam}>
          <Text style={styles.lineupTeamName}>{lineup.team.name}</Text>
          <Text style={styles.lineupFormation}>{lineup.formation}</Text>
          <Text style={styles.lineupSectionTitle}>{t(language, 'starter')}</Text>
          {lineup.startXI.map((p: any, j: number) => (
            <Text key={j} style={styles.lineupPlayer}>{p.player.number ?? ''} {p.player.name}</Text>
          ))}
          <Text style={styles.lineupSectionTitle}>{t(language, 'substitutes')}</Text>
          {lineup.substitutes.map((p: any, j: number) => (
            <Text key={j} style={styles.lineupPlayer}>{p.player.number ?? ''} {p.player.name}</Text>
          ))}
          {lineup.coach && <Text style={styles.lineupCoach}>{t(language, 'coach')}: {lineup.coach.name}</Text>}
        </View>
      ))}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  desktopScroll: { width: '100%', alignSelf: 'center', padding: spacing.lg },
  desktopLayout: { flexDirection: 'row', gap: 24 },
  desktopMain: { flex: 1, minWidth: 0 },
  desktopSidebar: { width: 320, flexShrink: 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: 8 },
  matchInfo: { alignItems: 'center', paddingVertical: 16 },
  leagueLogo: { width: 24, height: 24, resizeMode: 'contain', marginBottom: 8 },
  leagueName: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  venue: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 4 },
  scoreContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: 24 },
  teamSide: { flex: 1, alignItems: 'center', gap: 10 },
  teamLogo: { width: 56, height: 56, resizeMode: 'contain' },
  teamName: { fontSize: fontSize.sm, color: colors.textPrimary, textAlign: 'center', fontWeight: fontWeight.semibold },
  scoreBox: { alignItems: 'center', paddingHorizontal: 16 },
  score: { fontSize: fontSize.title, fontWeight: fontWeight.extrabold, color: colors.gold[400] },
  status: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 4 },
  tabContent: { padding: spacing.md, minHeight: 300 },
  overview: { gap: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radius.md, padding: 14 },
  infoLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  infoValue: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: fontWeight.medium },
  events: { gap: 8 },
  eventRow: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.card, borderRadius: radius.md, padding: 12, gap: 12 },
  eventTime: { fontSize: fontSize.sm, color: colors.gold[400], fontWeight: fontWeight.bold, minWidth: 36 },
  eventInfo: { flex: 1 },
  eventType: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: fontWeight.medium },
  eventAssist: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  eventTeam: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 2 },
  stats: { gap: 16 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statValue: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: fontWeight.bold, minWidth: 40, textAlign: 'center' },
  statBarContainer: { flex: 1 },
  statLabel: { fontSize: fontSize.xs, color: colors.textSecondary, textAlign: 'center', marginBottom: 6 },
  statBarBg: { height: 6, backgroundColor: colors.black[500], borderRadius: 3, flexDirection: 'row', overflow: 'hidden' },
  statBarHome: { backgroundColor: colors.gold[400], height: '100%' },
  statBarAway: { backgroundColor: colors.blue, height: '100%' },
  lineups: { gap: 20 },
  lineupTeam: { backgroundColor: colors.card, borderRadius: radius.md, padding: 16 },
  lineupTeamName: { fontSize: fontSize.md, color: colors.gold[400], fontWeight: fontWeight.bold },
  lineupFormation: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4 },
  lineupSectionTitle: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.semibold, marginTop: 12, marginBottom: 6 },
  lineupPlayer: { fontSize: fontSize.sm, color: colors.textPrimary, paddingVertical: 4 },
  lineupCoach: { fontSize: fontSize.sm, color: colors.gold[400], marginTop: 12, fontWeight: fontWeight.semibold },
  standingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.sm, padding: 10, gap: 10, marginBottom: 4 },
  standingRank: { fontSize: fontSize.sm, color: colors.gold[400], fontWeight: fontWeight.bold, minWidth: 24 },
  standingLogo: { width: 24, height: 24, resizeMode: 'contain' },
  standingName: { flex: 1, fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: fontWeight.medium },
  standingPts: { fontSize: fontSize.sm, color: colors.gold[400], fontWeight: fontWeight.bold },
  sidebarCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: 16, gap: 10, marginBottom: 16 },
  sidebarTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.gold[400], marginBottom: 4 },
  leagueCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: 14, gap: 12 },
  sidebarLeagueLogo: { width: 36, height: 36, resizeMode: 'contain' },
  leagueInfo: { flex: 1 },
  sidebarLeagueName: { fontSize: fontSize.md, color: colors.textPrimary, fontWeight: fontWeight.semibold },
  sidebarLeagueSeason: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 2 },
});
