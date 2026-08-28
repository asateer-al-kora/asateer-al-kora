import { StyleSheet, View, Text, ScrollView, Image, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors } from '@/constants/colors';
import { fontSize, fontWeight, spacing, radius } from '@/constants/layout';
import { useLanguage } from '@/hooks/useLanguage';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/services/i18n';
import { footballApi } from '@/services/footballApi';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/StateViews';
import { ArrowLeft, Star } from 'lucide-react-native';

export default function PlayerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { language } = useLanguage();
  const { user, isGuest } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const playerId = parseInt(id);

  const seasonQuery = useQuery({ queryKey: ['player-current-season'], queryFn: () => footballApi.getCurrentSeason(), staleTime: 300_000 });
  const currentSeason = seasonQuery.data;
  const playerQuery = useQuery({
    queryKey: ['player-details', playerId, currentSeason],
    queryFn: () => footballApi.getPlayerDetails(playerId, currentSeason!),
    enabled: !!currentSeason,
  });

  const fav = isFavorite('players', playerId);

  const handleFav = async () => {
    if (isGuest || !user) { router.push('/(auth)/login'); return; }
    const player = playerQuery.data?.[0]?.player;
    await toggleFavorite('players', playerId, {
      player_name: player?.name || '',
      player_photo: player?.photo || '',
    });
  };

  if (playerQuery.isLoading) return <View style={styles.screen}><LoadingState /></View>;
  if (playerQuery.error || !playerQuery.data?.length) return <View style={styles.screen}><ErrorState onRetry={() => playerQuery.refetch()} /></View>;

  const player = playerQuery.data[0].player;
  const stats = playerQuery.data[0].statistics?.[0];

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}><ArrowLeft color={colors.textPrimary} size={24} /></Pressable>
          <Pressable onPress={handleFav}><Star color={fav ? colors.gold[400] : colors.textSecondary} size={24} fill={fav ? colors.gold[400] : 'none'} /></Pressable>
        </View>

        <View style={styles.profileSection}>
          {player.photo ? (
            <Image source={{ uri: player.photo }} style={styles.playerPhoto} defaultSource={require('@/assets/images/icon.png')} />
          ) : (
            <View style={styles.playerPlaceholder}><Text style={styles.playerPlaceholderText}>{player.name?.charAt(0)}</Text></View>
          )}
          <Text style={styles.playerName}>{player.name}</Text>
          {stats?.team?.logo && <View style={styles.teamRow}><Image source={{ uri: stats.team.logo }} style={styles.teamLogo} defaultSource={require('@/assets/images/icon.png')} /><Text style={styles.teamName}>{stats.team.name}</Text></View>}
        </View>

        {stats && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>{t(language, 'seasonStatistics')}</Text>

            {stats.games?.position && <InfoRow label={t(language, 'position')} value={stats.games.position} />}
            {stats.games?.number != null && <InfoRow label={t(language, 'number')} value={String(stats.games.number)} />}
            {stats.games?.appearances != null && <InfoRow label={t(language, 'appearances')} value={String(stats.games.appearances)} />}
            {stats.games?.lineups != null && <InfoRow label={t(language, 'lineupsLabel')} value={String(stats.games.lineups)} />}
            {stats.games?.minutes != null && <InfoRow label={t(language, 'minutes')} value={String(stats.games.minutes)} />}
            {stats.goals?.total != null && <InfoRow label={t(language, 'goals')} value={String(stats.goals.total)} />}
            {stats.cards && <InfoRow label={t(language, 'yellowCards')} value={String(stats.cards.yellow)} />}

            <View style={styles.statCards}>
              <StatCard label={t(language, 'goals')} value={stats.goals?.total || 0} />
              <StatCard label={t(language, 'appearances')} value={stats.games?.appearances || 0} />
              <StatCard label={t(language, 'minutes')} value={stats.games?.minutes || 0} />
            </View>
          </View>
        )}
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: 8 },
  profileSection: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  playerPhoto: { width: 96, height: 96, borderRadius: 48, resizeMode: 'cover' },
  playerPlaceholder: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.black[600], justifyContent: 'center', alignItems: 'center' },
  playerPlaceholderText: { fontSize: 36, color: colors.gold[400], fontWeight: fontWeight.bold },
  playerName: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  teamLogo: { width: 20, height: 20, resizeMode: 'contain' },
  teamName: { fontSize: fontSize.sm, color: colors.textSecondary },
  statsSection: { padding: spacing.md, gap: 12 },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.gold[400], marginBottom: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radius.md, padding: 14 },
  infoLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  infoValue: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: fontWeight.medium },
  statCards: { flexDirection: 'row', gap: 8, marginTop: 8 },
  statCard: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.gold[600] + '30' },
  statValue: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.gold[400] },
  statLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 4 },
});
