import { ActivityIndicator, Image, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors } from '@/constants/colors';
import { fontSize, fontWeight, radius, spacing } from '@/constants/layout';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/services/i18n';
import { ArrowLeft, ExternalLink, Share2 } from 'lucide-react-native';
import { EmptyState, ErrorState } from '@/components/common/StateViews';
import { newsApi } from '@/services/newsApi';

export default function NewsDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { language } = useLanguage();
  const query = useQuery({ queryKey: ['news-detail', id], queryFn: () => newsApi.getById(String(id || '')), enabled: Boolean(id), staleTime: 900_000 });
  const article = query.data;

  if (query.isLoading) return <View style={styles.center}><ActivityIndicator color={colors.gold[500]} size="large" /></View>;
  if (query.error) return <View style={styles.screen}><Header onBack={() => router.back()} /><ErrorState onRetry={() => query.refetch()} message={(query.error as Error).message} /></View>;
  if (!article) return <View style={styles.screen}><Header onBack={() => router.back()} /><EmptyState message={t(language, 'newsNotFound')} /></View>;

  const date = new Date(article.publishedAt).toLocaleString(language === 'ar' ? 'ar' : 'en');
  const source = article.source || article.sourceName || '';
  return (
    <View style={styles.screen}>
      <Header onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Image source={article.image ? { uri: article.image } : require('@/assets/images/asateer-logo.png')} defaultSource={require('@/assets/images/asateer-logo.png')} style={styles.image} />
        <Text style={styles.category}>{article.category}</Text>
        <Text style={styles.title}>{article.title}</Text>
        <View style={styles.meta}><Text style={styles.source}>{source}</Text><Text style={styles.date}>{date}</Text></View>
        {article.description ? <Text style={styles.description}>{article.description}</Text> : null}
        <View style={styles.actions}>
          <Pressable style={styles.primaryAction} onPress={() => void Linking.openURL(article.url)}><ExternalLink color={colors.black[900]} size={18} /><Text style={styles.primaryText}>{t(language, 'openSource')}</Text></Pressable>
          <Pressable style={styles.secondaryAction} onPress={() => void Share.share({ message: `${article.title}\n${article.url}` })}><Share2 color={colors.gold[400]} size={18} /><Text style={styles.secondaryText}>{t(language, 'share')}</Text></Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function Header({ onBack }: { onBack: () => void }) { return <View style={styles.header}><Pressable onPress={onBack} accessibilityRole="button"><ArrowLeft color={colors.textPrimary} size={24} /></Pressable></View>; }

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.background }, center: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }, header: { paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: 8 }, content: { padding: spacing.md, paddingBottom: spacing.xxl }, image: { width: '100%', height: 220, borderRadius: radius.md, resizeMode: 'cover', backgroundColor: colors.card }, category: { color: colors.gold[400], fontSize: fontSize.sm, fontWeight: fontWeight.semibold, marginTop: spacing.md }, title: { color: colors.textPrimary, fontSize: fontSize.xl, lineHeight: 32, fontWeight: fontWeight.bold, marginTop: 8 }, meta: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: spacing.md }, source: { color: colors.gold[400], fontSize: fontSize.sm, flex: 1 }, date: { color: colors.textTertiary, fontSize: fontSize.xs }, description: { color: colors.textSecondary, fontSize: fontSize.md, lineHeight: 26, marginTop: spacing.lg }, actions: { gap: 10, marginTop: spacing.xl }, primaryAction: { backgroundColor: colors.gold[500], borderRadius: radius.md, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }, primaryText: { color: colors.black[900], fontWeight: fontWeight.bold }, secondaryAction: { borderWidth: 1, borderColor: colors.gold[500], borderRadius: radius.md, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }, secondaryText: { color: colors.gold[400], fontWeight: fontWeight.semibold } });
