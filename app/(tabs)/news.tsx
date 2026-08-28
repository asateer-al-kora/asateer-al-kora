import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { colors } from '@/constants/colors';
import { fontSize, fontWeight, spacing, radius } from '@/constants/layout';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/services/i18n';
import { AppHeader } from '@/components/app/AppHeader';
import { NewsCard } from '@/components/common/Cards';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateViews';
import { newsApi, type NewsCategory } from '@/services/newsApi';
import { useResponsive, getContentMaxWidth, getGridColumns } from '@/hooks/useResponsive';

const NEWS_CATEGORIES: { key: NewsCategory; labelKey: keyof typeof import('@/constants/translations/ar').ar }[] = [
  { key: 'latest', labelKey: 'latestNews' },
  { key: 'transfers', labelKey: 'transfers' },
];

export default function NewsScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { breakpoint, isLaptopUp } = useResponsive();
  const [activeCategory, setActiveCategory] = useState<NewsCategory>('latest');
  const query = useInfiniteQuery({
    queryKey: ['news', activeCategory, language],
    queryFn: ({ pageParam }) => newsApi.getLatest(activeCategory, language, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
    staleTime: 300_000,
  });
  const articles = query.data?.pages.flatMap((page) => page.articles) || [];
  const columns = getGridColumns(breakpoint, 'news');
  const contentMaxWidth = getContentMaxWidth(breakpoint);
  return (
    <View style={styles.screen}>
      {!isLaptopUp && <AppHeader title={t(language, 'news')} />}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll} contentContainerStyle={[styles.categoriesContent, isLaptopUp && { paddingHorizontal: 0, paddingTop: spacing.lg }]}>
        {NEWS_CATEGORIES.map((category) => <Pressable key={category.key} style={[styles.category, activeCategory === category.key && styles.categoryActive]} onPress={() => setActiveCategory(category.key)}><Text style={[styles.categoryText, activeCategory === category.key && styles.categoryTextActive]}>{t(language, category.labelKey)}</Text></Pressable>)}
      </ScrollView>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={isLaptopUp ? [styles.desktopScrollContent, { maxWidth: contentMaxWidth }] : undefined}>
        {query.isLoading ? <LoadingState /> : query.error ? <ErrorState onRetry={() => query.refetch()} message={(query.error as Error).message} /> : !articles.length ? <EmptyState message={t(language, 'noData')} /> : <View style={columns > 1 ? styles.newsGrid : styles.list}>{articles.map((news) => <View key={news.id} style={columns > 1 ? styles.newsGridItem : undefined}><NewsCard title={news.title} description={news.description || news.summary} image={news.image} source={news.source || news.sourceName} category={news.category} time={new Date(news.publishedAt).toLocaleString(language === 'ar' ? 'ar' : 'en')} onPress={() => router.push({ pathname: '/news/[id]', params: { id: news.id } })} /></View>)}</View>}
        {query.hasNextPage && <Pressable style={styles.loadMore} onPress={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}><Text style={styles.loadMoreText}>{query.isFetchingNextPage ? t(language, 'loading') : t(language, 'loadMore')}</Text></Pressable>}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, categoriesScroll: { maxHeight: 50, paddingVertical: 8 }, categoriesContent: { paddingHorizontal: spacing.md, gap: 8 }, category: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.sm, backgroundColor: colors.card, marginRight: 8 }, categoryActive: { backgroundColor: colors.gold[500] }, categoryText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium }, categoryTextActive: { color: colors.black[900], fontWeight: fontWeight.bold }, scroll: { flex: 1 }, list: { padding: spacing.md, gap: 8 }, newsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: spacing.md }, newsGridItem: { flex: 1, minWidth: 250, maxWidth: '48%' }, desktopScrollContent: { width: '100%', alignSelf: 'center' }, loadMore: { marginHorizontal: spacing.md, marginTop: spacing.md, borderWidth: 1, borderColor: colors.gold[500], borderRadius: radius.md, paddingVertical: 12, alignItems: 'center' }, loadMoreText: { color: colors.gold[400], fontWeight: fontWeight.semibold },
});
