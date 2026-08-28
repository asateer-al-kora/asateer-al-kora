import { ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { colors } from '@/constants/colors';
import { spacing, fontSize, fontWeight, radius } from '@/constants/layout';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/services/i18n';
import { AppHeader } from '@/components/app/AppHeader';
import { NewsCard } from '@/components/common/Cards';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateViews';
import { newsApi } from '@/services/newsApi';

export default function TransfersScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const query = useInfiniteQuery({ queryKey: ['news', 'transfers', language], queryFn: ({ pageParam }) => newsApi.getLatest('transfers', language, pageParam), initialPageParam: 1, getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined, staleTime: 900_000 });
  const articles = query.data?.pages.flatMap((page) => page.articles) || [];
  return (
    <View style={styles.screen}>
      <AppHeader title={t(language, 'transfers')} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {query.isLoading ? <LoadingState /> : query.error ? <ErrorState onRetry={() => query.refetch()} message={(query.error as Error).message} /> : !articles.length ? <EmptyState message={t(language, 'noData')} /> : articles.map((article) => <NewsCard key={article.id} title={article.title} description={article.description || article.summary} image={article.image} source={article.source || article.sourceName} category={article.category} time={new Date(article.publishedAt).toLocaleString(language === 'ar' ? 'ar' : 'en')} onPress={() => router.push({ pathname: '/news/[id]', params: { id: article.id } })} />)}
        {query.hasNextPage && <Pressable style={styles.loadMore} onPress={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}><Text style={styles.loadMoreText}>{query.isFetchingNextPage ? t(language, 'loading') : t(language, 'loadMore')}</Text></Pressable>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.background }, content: { padding: spacing.md, paddingBottom: spacing.xxl }, loadMore: { marginTop: spacing.md, borderWidth: 1, borderColor: colors.gold[500], borderRadius: radius.md, paddingVertical: 12, alignItems: 'center' }, loadMoreText: { color: colors.gold[400], fontWeight: fontWeight.semibold, fontSize: fontSize.sm } });
