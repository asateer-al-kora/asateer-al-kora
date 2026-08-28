import { StyleSheet, View, Text, TextInput, ScrollView, Pressable, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { colors } from '@/constants/colors';
import { fontSize, fontWeight, spacing, radius } from '@/constants/layout';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/services/i18n';
import { footballApi } from '@/services/footballApi';
import { ArrowLeft, Search as SearchIcon } from 'lucide-react-native';
import { MatchCard } from '@/components/match/MatchCards';

interface SearchResults { teams: any[]; players: any[]; leagues: any[]; matches: any[]; news: any[] }
const emptyResults: SearchResults = { teams: [], players: [], leagues: [], matches: [], news: [] };

export default function SearchScreen() {
  const router = useRouter();
  const { language, isRTL } = useLanguage();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>(emptyResults);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(false);

  const handleSearch = async (value = query) => {
    const term = value.trim();
    if (!term) return;
    setLoading(true); setError(false); setSearched(true);
    try { setResults(await footballApi.searchAll(term, language)); } catch { setResults(emptyResults); setError(true); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!query.trim()) { setSearched(false); setResults(emptyResults); return; }
    const timer = setTimeout(() => { void handleSearch(query); }, 450);
    return () => clearTimeout(timer);
  }, [query]);

  const hasResults = Object.values(results).some((items) => items.length > 0);
  return (
    <View style={styles.screen}>
      <View style={[styles.header, isRTL && styles.rowRTL]}>
        <Pressable onPress={() => router.back()}><ArrowLeft color={colors.textPrimary} size={24} /></Pressable>
        <View style={[styles.searchBox, isRTL && styles.rowRTL]}><SearchIcon color={colors.textTertiary} size={18} /><TextInput style={styles.input} value={query} onChangeText={setQuery} placeholder={t(language, 'searchPlaceholder')} placeholderTextColor={colors.textTertiary} onSubmitEditing={() => void handleSearch()} returnKeyType="search" autoFocus /></View>
      </View>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading && <ActivityIndicator size="large" color={colors.gold[400]} style={styles.loader} />}
        {!loading && error && <View style={styles.empty}><Text style={styles.emptyText}>{t(language, 'somethingWrong')}</Text></View>}
        {!loading && !error && searched && !hasResults && <View style={styles.empty}><Text style={styles.emptyText}>{t(language, 'noResults')}</Text></View>}
        {!loading && !error && <>
          <ResultSection title={t(language, 'teams')} items={results.teams} render={(team) => <Pressable style={[styles.resultItem, isRTL && styles.rowRTL]} onPress={() => router.push(`/team/${team.id}`)}><Image source={{ uri: team.logo }} style={styles.resultLogo} defaultSource={require('@/assets/images/icon.png')} /><View style={styles.resultInfo}><Text style={styles.resultName}>{team.name}</Text><Text style={styles.resultSub}>{team.country || ''}</Text></View></Pressable>} />
          <ResultSection title={t(language, 'players')} items={results.players} render={(item) => { const player = item.player || item; return <Pressable style={[styles.resultItem, isRTL && styles.rowRTL]} onPress={() => router.push(`/player/${player.id}`)}>{player.photo ? <Image source={{ uri: player.photo }} style={styles.resultLogo} defaultSource={require('@/assets/images/icon.png')} /> : <View style={styles.playerPlaceholder}><Text style={styles.placeholderText}>{(player.name || '?').charAt(0)}</Text></View>}<View style={styles.resultInfo}><Text style={styles.resultName}>{player.name}</Text><Text style={styles.resultSub}>{item.statistics?.[0]?.team?.name || ''}</Text></View></Pressable>; }} />
          <ResultSection title={t(language, 'leagues')} items={results.leagues} render={(league) => <Pressable style={[styles.resultItem, isRTL && styles.rowRTL]} onPress={() => router.push(`/competition/${league.id}`)}><Image source={{ uri: league.logo }} style={styles.resultLogo} defaultSource={require('@/assets/images/icon.png')} /><View style={styles.resultInfo}><Text style={styles.resultName}>{league.name}</Text><Text style={styles.resultSub}>{league.country || ''}</Text></View></Pressable>} />
          <ResultSection title={t(language, 'matches')} items={results.matches} render={(match) => <MatchCard match={match} onPress={() => router.push(`/match/${match.fixture.id}`)} />} />
          <ResultSection title={t(language, 'news')} items={results.news} render={(news) => <Pressable style={[styles.resultItem, isRTL && styles.rowRTL]} onPress={() => router.push({ pathname: '/news/[id]', params: { id: news.id } })}><Image source={news.image ? { uri: news.image } : require('@/assets/images/asateer-logo.png')} style={styles.resultLogo} defaultSource={require('@/assets/images/asateer-logo.png')} /><View style={styles.resultInfo}><Text style={styles.resultName} numberOfLines={2}>{news.title}</Text><Text style={styles.resultSub} numberOfLines={1}>{news.source || news.sourceName || ''}</Text></View></Pressable>} />
        </>}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function ResultSection({ title, items, render }: { title: string; items: any[]; render: (item: any) => ReactNode }) {
  if (!items.length) return null;
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{items.slice(0, 10).map((item, index) => <View key={item.id || item.fixture?.id || `${title}-${index}`}>{render(item)}</View>)}</View>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.background }, header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: 12 }, rowRTL: { flexDirection: 'row-reverse' }, searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.black[700], borderRadius: radius.md, paddingHorizontal: 12, gap: 8, borderWidth: 1, borderColor: colors.border }, input: { flex: 1, color: colors.textPrimary, fontSize: fontSize.md, paddingVertical: 12, textAlign: 'auto' }, scroll: { flex: 1, padding: spacing.md }, loader: { marginTop: 40 }, empty: { alignItems: 'center', marginTop: 40 }, emptyText: { color: colors.textSecondary, fontSize: fontSize.md }, section: { marginBottom: 24 }, sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.gold[400], marginBottom: 12 }, resultItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: 12, gap: 12, marginBottom: 8 }, resultLogo: { width: 40, height: 40, resizeMode: 'contain' }, playerPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.black[600], alignItems: 'center', justifyContent: 'center' }, placeholderText: { color: colors.gold[400], fontWeight: fontWeight.bold, fontSize: fontSize.md }, resultInfo: { flex: 1 }, resultName: { fontSize: fontSize.md, color: colors.textPrimary, fontWeight: fontWeight.semibold }, resultSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
});
