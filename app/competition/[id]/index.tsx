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
import { TabBar } from '@/components/common/SectionHeader';
import { StandingsTable } from '@/components/competition/StandingsTable';
import { MatchCard } from '@/components/match/MatchCards';
import { ArrowLeft, Star, ChevronRight } from 'lucide-react-native';
import type { TopScorer } from '@/types/football';

export default function CompetitionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { language } = useLanguage();
  const { user, isGuest } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [activeTab, setActiveTab] = useState(0);
  const leagueId = parseInt(id);

  const leagueQuery = useQuery({
    queryKey: ['league', leagueId],
    queryFn: () => footballApi.getLeagueById(leagueId),
  });
  const seasonQuery = useQuery({
    queryKey: ['current-season', leagueId],
    queryFn: () => footballApi.getCurrentSeason(leagueId),
    staleTime: 300_000,
  });
  const currentSeason = seasonQuery.data || leagueQuery.data?.[0]?.currentSeason;

  const standingsQuery = useQuery({
    queryKey: ['standings', leagueId, currentSeason!],
    queryFn: () => footballApi.getStandings(leagueId, currentSeason!),
    enabled: !!currentSeason && (activeTab === 2 || activeTab === 0),
  });

  const matchesQuery = useQuery({
    queryKey: ['league-matches', leagueId, currentSeason!],
    queryFn: () => footballApi.getMatchesByLeague(leagueId, currentSeason!),
    enabled: !!currentSeason && activeTab === 1,
    staleTime: 60_000,
  });

  const scorersQuery = useQuery({
    queryKey: ['scorers', leagueId, currentSeason!],
    queryFn: () => footballApi.getTopScorers(leagueId, currentSeason!),
    enabled: !!currentSeason && activeTab === 3,
    staleTime: 300_000,
  });

  const teamsQuery = useQuery({
    queryKey: ['competition-teams', leagueId, currentSeason!],
    queryFn: () => footballApi.getTeams(leagueId, currentSeason!),
    enabled: !!currentSeason && activeTab === 4,
    staleTime: 300_000,
  });

  const tabs = [t(language, 'overview'), t(language, 'matches'), t(language, 'standings'), t(language, 'topScorers'), t(language, 'teams'), t(language, 'news')];
  const fav = isFavorite('leagues', leagueId);

  const handleFav = async () => {
    if (isGuest || !user) { router.push('/(auth)/login'); return; }
    const league = leagueQuery.data?.[0];
    await toggleFavorite('leagues', leagueId, {
      league_name: league?.name || '',
      league_logo: league?.logo || '',
    });
  };

  const leagueName = leagueQuery.data?.[0]?.name || t(language, 'competitionFallback');
  const leagueLogo = leagueQuery.data?.[0]?.logo;

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}><ArrowLeft color={colors.textPrimary} size={24} /></Pressable>
          <Pressable onPress={handleFav}><Star color={fav ? colors.gold[400] : colors.textSecondary} size={24} fill={fav ? colors.gold[400] : 'none'} /></Pressable>
        </View>

        <View style={styles.titleSection}>
          {leagueLogo && <Image source={{ uri: leagueLogo }} style={styles.leagueLogo} defaultSource={require('@/assets/images/icon.png')} />}
          <Text style={styles.leagueName}>{leagueName}</Text>
          {leagueQuery.data?.[0]?.country && <Text style={styles.leagueCountry}>{leagueQuery.data[0].country}</Text>}
        </View>

        <TabBar tabs={tabs} activeIndex={activeTab} onTabChange={setActiveTab} />

        <View style={styles.tabContent}>
          {activeTab === 0 && (
            <OverviewTab standings={standingsQuery} />
          )}
          {activeTab === 1 && (
            matchesQuery.isLoading ? <LoadingState /> :
            matchesQuery.error ? <ErrorState onRetry={() => matchesQuery.refetch()} /> :
            matchesQuery.data?.length ? (
              <View>{matchesQuery.data.slice(0, 20).map((m: any) => <MatchCard key={m.fixture.id} match={m} onPress={() => router.push(`/match/${m.fixture.id}`)} />)}</View>
            ) : <EmptyState />
          )}
          {activeTab === 2 && (
            standingsQuery.isLoading ? <LoadingState /> :
            standingsQuery.error ? <ErrorState onRetry={() => standingsQuery.refetch()} /> :
            standingsQuery.data?.[0]?.league?.standings?.[0] ? (
              <StandingsTable standings={standingsQuery.data[0].league.standings[0]} />
            ) : <EmptyState />
          )}
          {activeTab === 3 && <ScorersTab scorers={scorersQuery} />}
          {activeTab === 4 && (
            teamsQuery.isLoading ? <LoadingState /> :
            teamsQuery.error ? <ErrorState onRetry={() => teamsQuery.refetch()} message={(teamsQuery.error as any)?.message} /> :
            teamsQuery.data?.length ? (
              <View style={styles.teamsList}>
                {teamsQuery.data.map((team: any) => (
                  <Pressable key={team.team.id} style={styles.teamRow} onPress={() => router.push(`/team/${team.team.id}?leagueId=${leagueId}&season=${currentSeason || ''}`)}>
                    {team.team.logo && <Image source={{ uri: team.team.logo }} style={styles.teamLogo} defaultSource={require('@/assets/images/icon.png')} />}
                    <Text style={styles.teamNameText} numberOfLines={1}>{team.team.name}</Text>
                    <ChevronRight color={colors.textTertiary} size={18} />
                  </Pressable>
                ))}
              </View>
            ) : <EmptyState message={t(language, 'noData')} />
          )}
          {activeTab === 5 && <EmptyState message={t(language, 'noData')} />}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function OverviewTab({ standings }: any) {
  const { language } = useLanguage();
  if (standings.isLoading) return <LoadingState />;
  if (standings.data?.[0]?.league?.standings?.[0]) {
    return <StandingsTable standings={standings.data[0].league.standings[0]} />;
  }
  return <EmptyState />;
}

function ScorersTab({ scorers }: any) {
  const { language } = useLanguage();
  if (scorers.isLoading) return <LoadingState />;
  if (scorers.error) return <ErrorState onRetry={() => scorers.refetch()} />;
  if (!scorers.data?.length) return <EmptyState />;
  return (
    <View style={styles.scorers}>
      {scorers.data.slice(0, 20).map((scorer: TopScorer, i: number) => (
        <View key={scorer.player.id} style={styles.scorerRow}>
          <Text style={styles.scorerRank}>{i + 1}</Text>
          {scorer.player.photo ? (
            <Image source={{ uri: scorer.player.photo }} style={styles.scorerPhoto} defaultSource={require('@/assets/images/icon.png')} />
          ) : (
            <View style={styles.scorerPlaceholder}><Text style={styles.scorerPlaceholderText}>{scorer.player.name.charAt(0)}</Text></View>
          )}
          <View style={styles.scorerInfo}>
            <Text style={styles.scorerName} numberOfLines={1}>{scorer.player.name}</Text>
            <Text style={styles.scorerTeam} numberOfLines={1}>{scorer.statistics[0]?.team?.name || ''}</Text>
          </View>
          <View style={styles.scorerStats}>
            <Text style={styles.scorerGoals}>{scorer.statistics[0]?.goals?.total || 0}</Text>
            <Text style={styles.scorerGoalsLabel}>{t(language, 'goals')}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: 8 },
  titleSection: { alignItems: 'center', paddingVertical: 16, gap: 8 },
  leagueLogo: { width: 56, height: 56, resizeMode: 'contain' },
  leagueName: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  leagueCountry: { fontSize: fontSize.sm, color: colors.textSecondary },
  tabContent: { padding: spacing.md, minHeight: 300 },
  scorers: { gap: 8 },
  scorerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: 12, gap: 12 },
  scorerRank: { fontSize: fontSize.md, color: colors.gold[400], fontWeight: fontWeight.bold, minWidth: 24 },
  scorerPhoto: { width: 40, height: 40, borderRadius: 20, resizeMode: 'cover' },
  scorerPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.black[600], justifyContent: 'center', alignItems: 'center' },
  scorerPlaceholderText: { fontSize: 16, color: colors.gold[400], fontWeight: fontWeight.bold },
  scorerInfo: { flex: 1 },
  scorerName: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: fontWeight.semibold },
  scorerTeam: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  scorerStats: { alignItems: 'center' },
  scorerGoals: { fontSize: fontSize.xl, color: colors.gold[400], fontWeight: fontWeight.extrabold },
  scorerGoalsLabel: { fontSize: 10, color: colors.textTertiary },
  teamsList: { gap: 8 },
  teamRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: 12, gap: 12 },
  teamLogo: { width: 32, height: 32, resizeMode: 'contain' },
  teamNameText: { flex: 1, fontSize: fontSize.md, color: colors.textPrimary, fontWeight: fontWeight.medium },
});
