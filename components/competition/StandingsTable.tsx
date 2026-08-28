import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { colors } from '@/constants/colors';
import { radius, fontSize, fontWeight, spacing } from '@/constants/layout';
import type { StandingRow } from '@/types/football';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/services/i18n';
import { Image } from 'react-native';

export function StandingsTable({ standings }: { standings: StandingRow[] }) {
  const { language } = useLanguage();
  if (!standings?.length) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
      <View style={styles.table}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerCell, styles.posCell]}>{t(language, 'pos')}</Text>
          <Text style={[styles.headerCell, styles.teamCell]}>{t(language, 'teams')}</Text>
          <Text style={styles.headerCell}>{t(language, 'played')}</Text>
          <Text style={styles.headerCell}>{t(language, 'won')}</Text>
          <Text style={styles.headerCell}>{t(language, 'drawn')}</Text>
          <Text style={styles.headerCell}>{t(language, 'lost')}</Text>
          <Text style={styles.headerCell}>{t(language, 'gd')}</Text>
          <Text style={[styles.headerCell, styles.ptsCell]}>{t(language, 'pts')}</Text>
        </View>
        {standings.map((row) => {
          const isUcl = row.description?.includes('Champions League');
          const isRelegation = row.description?.includes('Relegation');
          const indicatorColor = isUcl ? colors.green : isRelegation ? colors.red : 'transparent';
          return (
            <View key={row.team.id} style={styles.row}>
              <View style={styles.posContainer}>
                <View style={[styles.indicator, { backgroundColor: indicatorColor }]} />
                <Text style={styles.posText}>{row.rank}</Text>
              </View>
              <View style={styles.teamCell}>
                <Image source={{ uri: row.team.logo }} style={styles.teamLogo} defaultSource={require('@/assets/images/icon.png')} />
                <Text style={styles.teamName} numberOfLines={1}>{row.team.name}</Text>
              </View>
              <Text style={styles.cell}>{row.all.played}</Text>
              <Text style={styles.cell}>{row.all.win}</Text>
              <Text style={styles.cell}>{row.all.draw}</Text>
              <Text style={styles.cell}>{row.all.lose}</Text>
              <Text style={styles.cell}>{row.goalsDiff > 0 ? '+' : ''}{row.goalsDiff}</Text>
              <Text style={[styles.cell, styles.ptsCell, styles.ptsText]}>{row.points}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  table: {
    minWidth: 400,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gold[600] + '40',
  },
  headerCell: {
    fontSize: fontSize.xs,
    color: colors.gold[400],
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    width: 36,
  },
  posCell: {
    width: 40,
  },
  teamCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 120,
  },
  ptsCell: {
    width: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  posContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 40,
  },
  indicator: {
    width: 3,
    height: 20,
    borderRadius: 2,
    marginRight: 6,
  },
  posText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },
  teamLogo: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    marginRight: 8,
  },
  teamName: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    flex: 1,
  },
  cell: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    width: 36,
  },
  ptsText: {
    color: colors.gold[400],
    fontWeight: fontWeight.bold,
  },
});
