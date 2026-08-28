import { StyleSheet, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { colors } from '@/constants/colors';
import { fontSize, fontWeight, spacing, radius } from '@/constants/layout';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/services/i18n';

export function SplashScreen() {
  const { language } = useLanguage();

  return (
    <LinearGradient colors={[colors.black[900], colors.black[800], colors.black[900]]} style={styles.container}>
      <Animated.View entering={FadeIn.duration(800)} style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Image source={require('@/assets/images/asateer-logo.png')} style={styles.logoImage} contentFit="cover" />
        </View>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(400).duration(600)}>
        <Text style={styles.title}>{t(language, 'appName')}</Text>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(600).duration(600)}>
        <Text style={styles.subtitle}>{t(language, 'appTagline')}</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoContainer: { marginBottom: 20 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: colors.black[700],
    borderWidth: 2, borderColor: colors.gold[500], justifyContent: 'center', alignItems: 'center',
  },
  logoImage: { width: '100%', height: '100%', borderRadius: 40 },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.gold[400], marginTop: 16 },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: 8 },
});
