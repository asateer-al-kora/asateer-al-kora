import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { colors } from '@/constants/colors';
import { fontSize, fontWeight, spacing, radius } from '@/constants/layout';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/services/i18n';
import { AppHeader } from '@/components/app/AppHeader';
import { LeagueCard } from '@/components/common/Cards';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateViews';
import { footballApi } from '@/services/footballApi';
import { useResponsive, getContentMaxWidth, getGridColumns } from '@/hooks/useResponsive';

export default function CompetitionsScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { breakpoint, isLaptopUp } = useResponsive();
  const [tab, setTab] = useState<'leagues' | 'tournaments'>('leagues');
  const leaguesQuery = useQuery({ queryKey: ['leagues-catalog'], queryFn: () => footballApi.getLeagues(), staleTime: 300_000 });
  const tabs = [
    { key: 'leagues' as const, label: t(language, 'leagues') },
    { key: 'tournaments' as const, label: t(language, 'tournaments') },
  ];
  const items = (leaguesQuery.data || []).filter((league) => tab === 'leagues' ? league.type !== 'Cup' : league.type === 'Cup');
  const columns = getGridColumns(breakpoint, 'leagues');
  const contentMaxWidth = getContentMaxWidth(breakpoint);

  return (
    <View style={styles.screen}>
      {!isLaptopUp && <AppHeader title={t(language, 'competitions')} />}
      <View style={[styles.tabs, isLaptopUp && styles.tabsDesktop]}>
        {tabs.map((item) => <Pressable key={item.key} style={[styles.tab, tab === item.key && styles.tabActive]} onPress={() => setTab(item.key)}><Text style={[styles.tabText, tab === item.key && styles.tabTextActive]}>{item.label}</Text></Pressable>)}
      </View>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={isLaptopUp ? [styles.desktopScrollContent, { maxWidth: contentMaxWidth }] : undefined}>
        {leaguesQuery.isLoading ? <LoadingState /> : leaguesQuery.error ? <ErrorState onRetry={() => leaguesQuery.refetch()} message={(leaguesQuery.error as Error).message} /> : items.length === 0 ? <EmptyState message={t(language, 'noData')} /> : (
          <View style={columns > 1 ? styles.grid : styles.list}>
            {items.map((league) => <View key={league.id} style={columns > 1 ? styles.gridItem : undefined}><LeagueCard league={league} country={language === 'ar' ? league.country : league.country} season={league.currentSeason} onPress={() => router.push(`/competition/${league.id}`)} /></View>)}
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: 8, marginBottom: 12 },
  tabsDesktop: { paddingHorizontal: 0, paddingTop: spacing.lg },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.card },
  tabActive: { backgroundColor: colors.gold[500] },
  tabText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  tabTextActive: { color: colors.black[900], fontWeight: fontWeight.bold },
  scroll: { flex: 1 },
  list: { padding: spacing.md, gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: spacing.md },
  gridItem: { flex: 1, minWidth: 300, maxWidth: '48%' },
  desktopScrollContent: { width: '100%', alignSelf: 'center' },
});
