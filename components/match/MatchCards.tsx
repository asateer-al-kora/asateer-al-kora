import { StyleSheet, Text, View, Pressable, Image } from 'react-native';
import { colors } from '@/constants/colors';
import { radius, fontSize, fontWeight, spacing } from '@/constants/layout';
import type { MatchFixture } from '@/types/football';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/services/i18n';

function getStatusText(status: string, lang: 'ar' | 'en', elapsed?: number | null): { text: string; isLive: boolean; color: string } {
  const liveStatuses = ['1H', '2H', 'ET', 'BT', 'LIVE'];
  const isLive = liveStatuses.includes(status);
  if (isLive) {
    return { text: `${elapsed || ''}'`, isLive: true, color: colors.live };
  }
  const map: Record<string, { ar: string; en: string }> = {
    NS: { ar: t(lang, 'notStarted'), en: t(lang, 'notStarted') },
    HT: { ar: t(lang, 'halfTime'), en: t(lang, 'halfTime') },
    FT: { ar: t(lang, 'fullTime'), en: t(lang, 'fullTime') },
    AET: { ar: t(lang, 'extraTime'), en: 'AET' },
    PEN: { ar: t(lang, 'penalties'), en: 'PEN' },
    PST: { ar: t(lang, 'postponed'), en: 'PPD' },
    CANC: { ar: t(lang, 'cancelled'), en: 'CANC' },
  };
  const entry = map[status];
  if (entry) return { text: entry[lang], isLive: false, color: colors.textSecondary };
  return { text: status, isLive: false, color: colors.textSecondary };
}

export function MatchCard({ match, onPress }: { match: MatchFixture; onPress?: () => void }) {
  const { language, isRTL } = useLanguage();
  const status = getStatusText(match.fixture.status.short, language, match.fixture.status.elapsed);
  const homeGoal = match.goals.home;
  const awayGoal = match.goals.away;
  const matchTime = new Date(match.fixture.date).toLocaleTimeString(language === 'ar' ? 'ar' : 'en', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={[styles.header, isRTL && styles.rowRTL]}>
        <Text style={[styles.leagueName, isRTL ? styles.leagueNameRTL : styles.leagueNameLTR]} numberOfLines={1}>{match.league.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
          {status.isLive && <View style={styles.liveDot} />}
          <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={[styles.teamRow, isRTL && styles.rowRTL]}>
          <Image source={{ uri: match.teams.home.logo }} style={styles.teamLogo} defaultSource={require('@/assets/images/icon.png')} />
          <Text style={styles.teamName} numberOfLines={1}>{match.teams.home.name}</Text>
          <Text style={styles.score}>{homeGoal !== null ? homeGoal : '-'}</Text>
        </View>
        <View style={[styles.teamRow, isRTL && styles.rowRTL]}>
          <Image source={{ uri: match.teams.away.logo }} style={styles.teamLogo} defaultSource={require('@/assets/images/icon.png')} />
          <Text style={styles.teamName} numberOfLines={1}>{match.teams.away.name}</Text>
          <Text style={styles.score}>{awayGoal !== null ? awayGoal : '-'}</Text>
        </View>
      </View>

      <View style={[styles.footer, isRTL && styles.rowRTL]}>
        <Text style={[styles.footerText, isRTL ? styles.footerTextRTL : styles.footerTextLTR]}>{matchTime}</Text>
        {match.fixture.venue?.name && (
          <Text style={styles.footerText} numberOfLines={1}>{match.fixture.venue.name}</Text>
        )}
      </View>
    </Pressable>
  );
}

export function LiveMatchCard({ match, onPress }: { match: MatchFixture; onPress?: () => void }) {
  const { language, isRTL } = useLanguage();
  const status = getStatusText(match.fixture.status.short, language, match.fixture.status.elapsed);

  return (
    <Pressable style={[styles.liveCard, isRTL ? styles.liveCardRTL : styles.liveCardLTR]} onPress={onPress}>
      <View style={[styles.liveBadge, isRTL && styles.rowRTL]}>
        <View style={styles.liveDot} />
        <Text style={[styles.liveText, isRTL ? styles.liveTextRTL : styles.liveTextLTR]}>{t(language, 'live')} {status.text}</Text>
      </View>
      <View style={styles.liveBody}>
        <View style={styles.liveTeam}>
          <Image source={{ uri: match.teams.home.logo }} style={styles.teamLogo} defaultSource={require('@/assets/images/icon.png')} />
          <Text style={styles.liveTeamName} numberOfLines={1}>{match.teams.home.name}</Text>
        </View>
        <Text style={styles.liveScore}>{match.goals.home ?? 0} - {match.goals.away ?? 0}</Text>
        <View style={styles.liveTeam}>
          <Image source={{ uri: match.teams.away.logo }} style={styles.teamLogo} defaultSource={require('@/assets/images/icon.png')} />
          <Text style={styles.liveTeamName} numberOfLines={1}>{match.teams.away.name}</Text>
        </View>
      </View>
      <Text style={styles.leagueText} numberOfLines={1}>{match.league.name}</Text>
    </Pressable>
  );
}

export function FeaturedMatchCard({ match, onPress }: { match: MatchFixture; onPress?: () => void }) {
  const { language, isRTL } = useLanguage();
  const status = getStatusText(match.fixture.status.short, language, match.fixture.status.elapsed);
  const matchTime = new Date(match.fixture.date).toLocaleTimeString(language === 'ar' ? 'ar' : 'en', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Pressable style={styles.featuredCard} onPress={onPress}>
      <View style={styles.featuredHeader}>
        <View style={styles.featuredLeagueInfo}>
          <Image source={{ uri: match.league.logo }} style={styles.leagueLogo} defaultSource={require('@/assets/images/icon.png')} />
          <Text style={styles.featuredLeagueName} numberOfLines={1}>{match.league.name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
          {status.isLive && <View style={styles.liveDot} />}
          <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
        </View>
      </View>

      <View style={styles.featuredBody}>
        <View style={styles.featuredTeam}>
          <Image source={{ uri: match.teams.home.logo }} style={styles.featuredLogo} defaultSource={require('@/assets/images/icon.png')} />
          <Text style={styles.featuredTeamName} numberOfLines={2}>{match.teams.home.name}</Text>
        </View>
        <View style={styles.featuredScoreContainer}>
          <Text style={styles.featuredScore}>{match.goals.home ?? 0}</Text>
          <Text style={styles.featuredScoreDivider}>-</Text>
          <Text style={styles.featuredScore}>{match.goals.away ?? 0}</Text>
        </View>
        <View style={styles.featuredTeam}>
          <Image source={{ uri: match.teams.away.logo }} style={styles.featuredLogo} defaultSource={require('@/assets/images/icon.png')} />
          <Text style={styles.featuredTeamName} numberOfLines={2}>{match.teams.away.name}</Text>
        </View>
      </View>

      <View style={styles.featuredFooter}>
        <Text style={styles.featuredFooterText}>{matchTime}</Text>
        {match.fixture.venue?.name && (
          <Text style={styles.featuredFooterText} numberOfLines={1}>{match.fixture.venue.name}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leagueName: { fontSize: fontSize.xs, color: colors.textSecondary, flex: 1 },
  leagueNameLTR: { marginRight: 8 },
  leagueNameRTL: { marginLeft: 8 },
  rowRTL: { flexDirection: 'row-reverse' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.live,
    marginRight: 4,
  },
  body: {
    gap: 10,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  teamLogo: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  teamName: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  score: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.gold[400],
    minWidth: 24,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: { fontSize: fontSize.xs, color: colors.textTertiary, flex: 1 },
  footerTextLTR: { textAlign: 'left' },
  footerTextRTL: { textAlign: 'right' },
  liveCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, width: 260, borderWidth: 1, borderColor: colors.gold[600] + '40' },
  liveCardLTR: { marginRight: 12 },
  liveCardRTL: { marginLeft: 12 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveText: { color: colors.live, fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  liveTextLTR: { marginLeft: 4 },
  liveTextRTL: { marginRight: 4 },
  liveBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  liveTeam: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  liveTeamName: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: fontWeight.medium,
  },
  liveScore: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.extrabold,
    color: colors.gold[400],
    paddingHorizontal: 12,
  },
  leagueText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  featuredCard: {
    backgroundColor: colors.black[800],
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gold[600] + '30',
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  featuredLeagueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  leagueLogo: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  featuredLeagueName: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  featuredBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredTeam: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
  },
  featuredLogo: {
    width: 56,
    height: 56,
    resizeMode: 'contain',
  },
  featuredTeamName: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: fontWeight.semibold,
  },
  featuredScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  featuredScore: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.extrabold,
    color: colors.gold[400],
  },
  featuredScoreDivider: {
    fontSize: fontSize.title,
    color: colors.textTertiary,
    marginHorizontal: 8,
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  featuredFooterText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    flex: 1,
  },
});
