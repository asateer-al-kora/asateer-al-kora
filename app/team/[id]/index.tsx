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
import { PlayerCard } from '@/components/common/Cards';
import { MatchCard } from '@/components/match/MatchCards';
import { StandingsTable } from '@/components/competition/StandingsTable';
import { useResponsive, getContentMaxWidth } from '@/hooks/useResponsive';
import { ArrowLeft, Star } from 'lucide-react-native';

export default function TeamDetailsScreen() {
  const { id, leagueId: leagueIdParam, season: seasonParam } = useLocalSearchParams<{ id: string; leagueId?: string; season?: string }>();
  const router = useRouter();
  const { language } = useLanguage();
  const { user, isGuest } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { breakpoint, isLaptopUp } = useResponsive();
  const [activeTab, setActiveTab] = useState(0);
  const teamId = parseInt(id);
  const requestedLeagueId = leagueIdParam ? parseInt(leagueIdParam) : undefined;
  const requestedSeason = seasonParam ? parseInt(seasonParam) : undefined;

  const teamQuery = useQuery({
    queryKey: ['team-details', teamId],
    queryFn: () => footballApi.getTeamDetails(teamId),
    staleTime: 300_000,
  });
  const seasonQuery = useQuery({ queryKey: ['team-current-season', teamId], queryFn: () => footballApi.getCurrentSeason(), enabled: !requestedSeason, staleTime: 300_000 });
  const currentSeason = requestedSeason || seasonQuery.data;
  const teamLeaguesQuery = useQuery({ queryKey: ['team-leagues', teamId, currentSeason], queryFn: () => footballApi.getLeaguesByTeam(teamId, currentSeason), enabled: !requestedLeagueId && !!currentSeason, staleTime: 300_000 });

  const matchesQuery = useQuery({
    queryKey: ['team-matches', teamId],
    queryFn: () => footballApi.getMatchesByTeam(teamId, currentSeason!),
    enabled: activeTab === 1 && !!currentSeason,
    staleTime: 60_000,
  });

  const playersQuery = useQuery({
    queryKey: ['team-players', teamId],
    queryFn: () => footballApi.getPlayers(teamId, currentSeason!),
    enabled: activeTab === 3 && !!currentSeason,
    staleTime: 300_000,
  });

  const tabs = [t(language, 'overview'), t(language, 'matches'), t(language, 'standings'), t(language, 'players'), t(language, 'news')];
  const fav = isFavorite('teams', teamId);

  const handleFav = async () => {
    if (isGuest || !user) { router.push('/(auth)/login'); return; }
    const team = teamQuery.data?.[0]?.team;
    await toggleFavorite('teams', teamId, {
      team_name: team?.name || '',
      team_logo: team?.logo || '',
    });
  };

  const team = teamQuery.data?.[0]?.team;
  const teamLeagueId = requestedLeagueId || teamLeaguesQuery.data?.[0]?.id;

  const standingsQuery = useQuery({
    queryKey: ['team-standings', teamLeagueId, currentSeason!],
    queryFn: () => footballApi.getStandings(teamLeagueId!, currentSeason!),
    enabled: activeTab === 2 && !!teamLeagueId && !!currentSeason,
    staleTime: 300_000,
  });

  const contentMaxWidth = getContentMaxWidth(breakpoint);

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={isLaptopUp ? [styles.desktopScroll, { maxWidth: contentMaxWidth }] : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}><ArrowLeft color={colors.textPrimary} size={24} /></Pressable>
          <Pressable onPress={handleFav}><Star color={fav ? colors.gold[400] : colors.textSecondary} size={24} fill={fav ? colors.gold[400] : 'none'} /></Pressable>
        </View>

        <View style={styles.titleSection}>
          {team?.logo && <Image source={{ uri: team.logo }} style={styles.teamLogo} defaultSource={require('@/assets/images/icon.png')} />}
          <Text style={styles.teamName}>{team?.name || ''}</Text>
          {team?.country && <Text style={styles.teamCountry}>{team.country}</Text>}
        </View>

        <TabBar tabs={tabs} activeIndex={activeTab} onTabChange={setActiveTab} />

        <View style={styles.tabContent}>
          {activeTab === 0 && team && (
            <View style={styles.overview}>
              {team.founded && <InfoRow label={t(language, 'founded')} value={String(team.founded)} />}
              {team.country && <InfoRow label={t(language, 'country')} value={team.country} />}
              {team.venue?.name && <InfoRow label={t(language, 'stadium')} value={team.venue.name} />}
              {team.venue?.city && <InfoRow label={t(language, 'venue')} value={team.venue.city} />}
            </View>
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
            standingsQuery.error ? <ErrorState onRetry={() => standingsQuery.refetch()} message={(standingsQuery.error as any)?.message} /> :
            standingsQuery.data?.[0]?.league?.standings?.[0] ? (
              <StandingsTable standings={standingsQuery.data[0].league.standings[0]} />
            ) : <EmptyState message={t(language, 'noData')} />
          )}
          {activeTab === 3 && (
            playersQuery.isLoading ? <LoadingState /> :
            playersQuery.error ? <ErrorState onRetry={() => playersQuery.refetch()} /> :
            playersQuery.data?.[0]?.players?.length ? (
              <View style={styles.playersGrid}>
                {playersQuery.data[0].players.map((p: any) => (
                  <PlayerCard key={p.id} name={p.name} photo={p.photo} number={p.number} position={p.position} onPress={() => router.push(`/player/${p.id}`)} />
                ))}
              </View>
            ) : <EmptyState />
          )}
          {activeTab === 4 && <EmptyState message={t(language, 'noData')} />}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: 8 },
  titleSection: { alignItems: 'center', paddingVertical: 16, gap: 8 },
  teamLogo: { width: 64, height: 64, resizeMode: 'contain' },
  teamName: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  teamCountry: { fontSize: fontSize.sm, color: colors.textSecondary },
  tabContent: { padding: spacing.md, minHeight: 300 },
  desktopScroll: { width: '100%', alignSelf: 'center', padding: spacing.lg },
  overview: { gap: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radius.md, padding: 14 },
  infoLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  infoValue: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: fontWeight.medium },
  playersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
