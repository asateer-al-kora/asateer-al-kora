import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Image, View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '@/constants/colors';
import { fontSize, fontWeight, spacing, radius } from '@/constants/layout';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/services/i18n';
import { footballApi } from '@/services/footballApi';
import { supabase } from '@/services/supabase';
import { ErrorState, EmptyState } from '@/components/common/StateViews';

export default function OnboardingScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [selectedLeagues, setSelectedLeagues] = useState<number[]>([]);
  const leaguesQuery = useQuery({ queryKey: ['onboarding-leagues'], queryFn: () => footballApi.getLeagues(), staleTime: 300_000 });
  const leagues = (leaguesQuery.data || []).slice(0, 30);
  const toggleLeague = (id: number) => setSelectedLeagues((previous) => previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id]);
  const finish = async () => {
    if (user && selectedLeagues.length) {
      const selected = leagues.filter((league) => selectedLeagues.includes(league.id));
      await supabase.from('favorite_leagues').upsert(selected.map((league) => ({ user_id: user.id, league_id: league.id, league_name: league.name, league_logo: league.logo || '' })), { onConflict: 'user_id,league_id' });
    }
    router.replace('/(tabs)');
  };
  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.black[900], colors.black[800]]} style={styles.gradient}>
        <View style={styles.header}><Text style={styles.appName}>{t(language, 'appName')}</Text><Pressable onPress={() => void finish()}><Text style={styles.skipText}>{t(language, 'skip')}</Text></Pressable></View>
        <View style={styles.progress}><View style={[styles.progressBar, step === 0 && styles.progressBarActive]} /><View style={[styles.progressBar, step === 1 && styles.progressBarActive]} /></View>
        {step === 0 && <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{t(language, 'selectFavoriteLeagues')}</Text>
          {leaguesQuery.isLoading ? <ActivityIndicator color={colors.gold[400]} /> : leaguesQuery.error ? <ErrorState onRetry={() => leaguesQuery.refetch()} /> : leagues.length === 0 ? <EmptyState message={t(language, 'noData')} /> : <View style={styles.grid}>{leagues.map((league) => <Pressable key={league.id} style={[styles.leagueItem, selectedLeagues.includes(league.id) && styles.leagueItemSelected]} onPress={() => toggleLeague(league.id)}>{league.logo ? <Image source={{ uri: league.logo }} style={styles.leagueLogo} /> : <View style={styles.leaguePlaceholder}><Text style={styles.leagueEmoji}>🏆</Text></View>}<Text style={styles.leagueItemName} numberOfLines={2}>{league.name}</Text>{league.country ? <Text style={styles.country} numberOfLines={1}>{league.country}</Text> : null}{selectedLeagues.includes(league.id) && <Text style={styles.checkmark}>✓</Text>}</Pressable>)}</View>}
          <Pressable style={styles.goldButton} onPress={() => setStep(1)}><Text style={styles.goldButtonText}>{t(language, 'continue')}</Text></Pressable>
        </ScrollView>}
        {step === 1 && <View style={styles.finalStep}><Text style={styles.title}>{t(language, 'accountReady')}</Text><Text style={styles.subtitle}>{t(language, 'changePreferencesLater')}</Text><Pressable style={styles.goldButton} onPress={() => void finish()}><Text style={styles.goldButtonText}>{t(language, 'getStarted')}</Text></Pressable></View>}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 }, gradient: { flex: 1 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.xl }, appName: { fontSize: fontSize.sm, color: colors.gold[400], fontWeight: fontWeight.semibold }, skipText: { fontSize: fontSize.sm, color: colors.textTertiary }, progress: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.lg, marginTop: 16 }, progressBar: { flex: 1, height: 3, backgroundColor: colors.black[500], borderRadius: 2 }, progressBarActive: { backgroundColor: colors.gold[500] }, scroll: { padding: spacing.lg, paddingBottom: spacing.xxl }, title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: 20 }, subtitle: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginBottom: 32, lineHeight: 22 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }, leagueItem: { width: '47%', backgroundColor: colors.card, borderRadius: radius.md, padding: 16, alignItems: 'center', position: 'relative', flexGrow: 1, borderWidth: 1, borderColor: colors.border }, leagueItemSelected: { borderColor: colors.gold[500], backgroundColor: colors.gold[600] + '15' }, leagueLogo: { width: 48, height: 48, marginBottom: 8 }, leaguePlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.black[600], justifyContent: 'center', alignItems: 'center', marginBottom: 8 }, leagueEmoji: { fontSize: 24 }, leagueItemName: { fontSize: fontSize.xs, color: colors.textPrimary, textAlign: 'center', fontWeight: fontWeight.medium }, country: { fontSize: 10, color: colors.textTertiary, marginTop: 3 }, checkmark: { position: 'absolute', top: 8, right: 8, color: colors.gold[400], fontSize: 16, fontWeight: fontWeight.bold }, goldButton: { backgroundColor: colors.gold[500], borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', marginTop: 16 }, goldButtonText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.black[900] }, finalStep: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
});
