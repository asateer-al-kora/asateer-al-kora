import { StyleSheet, Text, View, Pressable, Image } from 'react-native';
import { colors } from '@/constants/colors';
import { radius, fontSize, fontWeight, spacing } from '@/constants/layout';
import type { Team, League } from '@/types/football';

export function TeamCard({ team, onPress }: { team: Team; onPress?: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image source={{ uri: team.logo }} style={styles.logo} defaultSource={require('@/assets/images/icon.png')} />
      <Text style={styles.name} numberOfLines={2}>{team.name}</Text>
    </Pressable>
  );
}

export function LeagueCard({ league, country, season, onPress }: { league: League; country?: string; season?: number; onPress?: () => void }) {
  return (
    <Pressable style={styles.leagueCard} onPress={onPress}>
      <Image source={{ uri: league.logo }} style={styles.leagueLogo} defaultSource={require('@/assets/images/icon.png')} />
      <View style={styles.leagueInfo}>
        <Text style={styles.leagueName} numberOfLines={1}>{league.name}</Text>
        <Text style={styles.leagueCountry}>{country || league.country || ''}</Text>
        {season && <Text style={styles.leagueSeason}>{season}</Text>}
      </View>
    </Pressable>
  );
}

export function PlayerCard({ name, photo, number, position, nationality, onPress }: {
  name: string; photo?: string; number?: number | null; position?: string; nationality?: string; onPress?: () => void;
}) {
  return (
    <Pressable style={styles.playerCard} onPress={onPress}>
      <View style={styles.playerImageContainer}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.playerPhoto} defaultSource={require('@/assets/images/icon.png')} />
        ) : (
          <View style={styles.playerPlaceholder}>
            <Text style={styles.playerPlaceholderText}>{name.charAt(0)}</Text>
          </View>
        )}
        {number != null && <View style={styles.numberBadge}><Text style={styles.numberText}>{number}</Text></View>}
      </View>
      <Text style={styles.playerName} numberOfLines={1}>{name}</Text>
      {position && <Text style={styles.playerPosition}>{position}</Text>}
      {nationality && <Text style={styles.playerNationality} numberOfLines={1}>{nationality}</Text>}
    </Pressable>
  );
}

export function NewsCard({ title, description, image, source, time, category, onPress }: {
  title: string; description?: string; image?: string; source?: string; time: string; category?: string; onPress?: () => void;
}) {
  return (
    <Pressable style={styles.newsCard} onPress={onPress}>
      <Image source={image ? { uri: image } : require('@/assets/images/asateer-logo.png')} style={styles.newsImage} defaultSource={require('@/assets/images/asateer-logo.png')} />
      <View style={styles.newsContent}>
        <Text style={styles.newsTitle} numberOfLines={2}>{title}</Text>
        {description ? <Text style={styles.newsDescription} numberOfLines={2}>{description}</Text> : null}
        <View style={styles.newsMeta}>
          <Text style={styles.newsSource} numberOfLines={1}>{source || ''}</Text>
          <Text style={styles.newsTime}>{category ? `${category} · ` : ''}{time}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  logo: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  name: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: fontWeight.medium,
  },
  leagueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: 8,
    gap: 12,
  },
  leagueLogo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  leagueInfo: {
    flex: 1,
  },
  leagueName: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  leagueCountry: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  leagueSeason: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  playerCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  playerImageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  playerPhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
    resizeMode: 'cover',
  },
  playerPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.black[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerPlaceholderText: {
    fontSize: fontSize.xl,
    color: colors.gold[400],
    fontWeight: fontWeight.bold,
  },
  numberBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.gold[500],
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontSize: fontSize.xs,
    color: colors.black[900],
    fontWeight: fontWeight.bold,
  },
  playerName: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  playerPosition: {
    fontSize: fontSize.xs,
    color: colors.gold[400],
    marginTop: 2,
  },
  playerNationality: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  newsCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginBottom: 8,
    overflow: 'hidden',
  },
  newsImage: {
    width: 100,
    height: 80,
    resizeMode: 'cover',
  },
  newsContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  newsDescription: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },
  newsTitle: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  newsMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  newsSource: {
    fontSize: fontSize.xs,
    color: colors.gold[400],
  },
  newsTime: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
});
