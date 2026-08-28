import { Tabs } from 'expo-router';
import { Home, Calendar, Trophy, Newspaper, Star } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/constants/colors';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/services/i18n';
import { useResponsive } from '@/hooks/useResponsive';
import { Sidebar } from '@/components/app/Sidebar';

export default function TabLayout() {
  const { language, isRTL } = useLanguage();
  const { isLaptopUp } = useResponsive();

  if (isLaptopUp) {
    return (
      <View style={[styles.desktopContainer, { flexDirection: isRTL ? 'row-reverse' : 'row', direction: isRTL ? 'rtl' : 'ltr' } as any]}>
        <Sidebar />
        <View style={styles.desktopContent}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: { display: 'none' },
            }}
          >
            <Tabs.Screen name="index" options={{ title: t(language, 'home') }} />
            <Tabs.Screen name="matches" options={{ title: t(language, 'matches') }} />
            <Tabs.Screen name="competitions" options={{ title: t(language, 'competitions') }} />
            <Tabs.Screen name="news" options={{ title: t(language, 'news') }} />
            <Tabs.Screen name="favorites" options={{ title: t(language, 'favorites') }} />
          </Tabs>
        </View>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.black[850],
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.gold[400],
        tabBarInactiveTintColor: colors.gray[400],
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t(language, 'home'),
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: t(language, 'matches'),
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="competitions"
        options={{
          title: t(language, 'competitions'),
          tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: t(language, 'news'),
          tabBarIcon: ({ color, size }) => <Newspaper color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: t(language, 'favorites'),
          tabBarIcon: ({ color, size }) => <Star color={color} size={size} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  desktopContent: {
    flex: 1,
  },
});
