import { StyleSheet, View, Text, Pressable, Image, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { fontSize, fontWeight, spacing, radius } from '@/constants/layout';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/services/i18n';
import { useResponsive } from '@/hooks/useResponsive';

const HERO_IMAGE = require('@/assets/images/asateer-logo.png');

export default function WelcomeScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { signInWithGoogle, continueAsGuest } = useAuth();
  const { isLaptopUp } = useResponsive();

  const handleGoogle = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      // On web, OAuth redirect handles it; on error, fall through silently
    }
  };

  const handleGuest = () => {
    continueAsGuest();
  };

  const contentPanel = (
    <View style={isLaptopUp ? styles.desktopContentPanel : styles.content}>
      <Text style={isLaptopUp ? styles.desktopAppName : styles.appName}>{t(language, 'appName')}</Text>
      <Text style={isLaptopUp ? styles.desktopWelcomeTitle : styles.welcomeTitle}>{t(language, 'welcomeTitle')}</Text>
      <Text style={isLaptopUp ? styles.desktopWelcomeSubtitle : styles.welcomeSubtitle}>{t(language, 'welcomeSubtitle')}</Text>

      <View style={styles.buttons}>
        <Pressable style={styles.goldButton} onPress={() => router.push('/(auth)/signup')}>
          <Text style={styles.goldButtonText}>{t(language, 'createAccount')}</Text>
        </Pressable>

        <Pressable style={styles.outlineButton} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.outlineButtonText}>{t(language, 'login')}</Text>
        </Pressable>

        <Pressable style={styles.googleButton} onPress={handleGoogle}>
          <GoogleIcon />
          <Text style={styles.googleButtonText}>{t(language, 'continueWithGoogle')}</Text>
        </Pressable>
      </View>

      <Pressable style={styles.guestLink} onPress={handleGuest}>
        <Text style={styles.guestText}>{t(language, 'continueAsGuest')}</Text>
      </Pressable>
    </View>
  );

  if (isLaptopUp) {
    return (
      <View style={styles.desktopContainer}>
        <View style={styles.desktopHeroPanel}>
          <Image source={HERO_IMAGE} style={styles.desktopHeroImage} accessibilityLabel={t(language, 'appName')} />
          <LinearGradient
            colors={[colors.black[900] + '40', colors.black[900] + 'CC', colors.black[900]]}
            locations={[0, 0.5, 1]}
            style={styles.desktopHeroOverlay}
          />
        </View>
        <View style={styles.desktopContentOuter}>
          <ScrollView contentContainerStyle={styles.desktopScroll} bounces={false} showsVerticalScrollIndicator={false}>
            {contentPanel}
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false} showsVerticalScrollIndicator={false}>
        <View style={styles.heroContainer}>
          <Image source={HERO_IMAGE} style={styles.heroImage} accessibilityLabel={t(language, 'appName')} />
          <LinearGradient
            colors={['transparent', colors.black[900] + 'CC', colors.black[900]]}
            locations={[0, 0.6, 1]}
            style={styles.heroOverlay}
          />
        </View>
        {contentPanel}
      </ScrollView>
    </View>
  );
}

function GoogleIcon() {
  return (
    <View style={styles.googleIcon}>
      <Text style={styles.googleIconText}>G</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black[900] },
  scroll: { flexGrow: 1 },
  heroContainer: { width: '100%', aspectRatio: 2 / 3, maxHeight: 560, position: 'relative', backgroundColor: colors.black[900] },
  heroImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' },
  content: { padding: spacing.xl, paddingTop: spacing.xxl, alignItems: 'center' },
  appName: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.gold[400], marginBottom: 8 },
  welcomeTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary, textAlign: 'center', marginBottom: 12 },
  welcomeSubtitle: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  buttons: { width: '100%', gap: 12 },
  goldButton: { backgroundColor: colors.gold[500], borderRadius: radius.md, paddingVertical: 16, alignItems: 'center' },
  goldButtonText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.black[900] },
  outlineButton: { borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: colors.gold[500] },
  outlineButtonText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.gold[400] },
  googleButton: { flexDirection: 'row', borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.black[700], borderWidth: 1, borderColor: colors.border, gap: 10 },
  googleIcon: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' },
  googleIconText: { fontSize: 14, fontWeight: fontWeight.bold, color: colors.blue },
  googleButtonText: { fontSize: fontSize.md, color: colors.textPrimary, fontWeight: fontWeight.medium },
  guestLink: { marginTop: 24, padding: 12 },
  guestText: { fontSize: fontSize.sm, color: colors.textTertiary, textDecorationLine: 'underline' },
  // Desktop
  desktopContainer: { flex: 1, flexDirection: 'row', backgroundColor: colors.black[900] },
  desktopHeroPanel: { flex: 1, position: 'relative', backgroundColor: colors.black[850] },
  desktopHeroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  desktopHeroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  desktopContentOuter: { flex: 1, justifyContent: 'center' },
  desktopScroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xxl },
  desktopContentPanel: { maxWidth: 480, alignSelf: 'center' },
  desktopAppName: { fontSize: 36, fontWeight: fontWeight.extrabold, color: colors.gold[400], marginBottom: 12 },
  desktopWelcomeTitle: { fontSize: 24, fontWeight: fontWeight.bold, color: colors.textPrimary, textAlign: 'center', marginBottom: 16 },
  desktopWelcomeSubtitle: { fontSize: fontSize.lg, color: colors.textSecondary, textAlign: 'center', lineHeight: 28, marginBottom: 40 },
});
