import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import { useLanguage } from '@/hooks/useLanguage';
import { radius, fontSize, fontWeight } from '@/constants/layout';

export function SectionHeader({ title, actionText, onAction }: { title: string; actionText?: string; onAction?: () => void }) {
  const { isRTL } = useLanguage();
  return (
    <View style={[styles.container, isRTL && styles.rowRTL]}>
      <Text style={styles.title}>{title}</Text>
      {actionText && (
        <Text style={styles.action} onPress={onAction}>
          {actionText}
        </Text>
      )}
    </View>
  );
}

export function Badge({ text, color, live }: { text: string; color?: string; live?: boolean }) {
  return (
    <View style={[styles.badge, { backgroundColor: color || colors.gold[600] + '30' }]}>
      {live && <View style={styles.liveDot} />}
      <Text style={[styles.badgeText, { color: color || colors.gold[400] }]}>{text}</Text>
    </View>
  );
}

export function TabBar({ tabs, activeIndex, onTabChange }: { tabs: string[]; activeIndex: number; onTabChange: (i: number) => void }) {
  const { isRTL } = useLanguage();
  return (
    <View style={[styles.tabBar, isRTL && styles.rowRTL]}>
      {tabs.map((tab, i) => (
        <View key={i} style={[styles.tabWrapper, isRTL ? styles.tabWrapperRTL : styles.tabWrapperLTR]}>
          <Text
            style={[styles.tabText, i === activeIndex && styles.tabTextActive]}
            onPress={() => onTabChange(i)}
          >
            {tab}
          </Text>
          {i === activeIndex && <View style={styles.tabIndicator} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  action: {
    fontSize: fontSize.sm,
    color: colors.gold[400],
    fontWeight: fontWeight.semibold,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.live,
    marginRight: 4,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowRTL: { flexDirection: 'row-reverse' },
  tabWrapper: {
    paddingVertical: 12,
    position: 'relative',
  },
  tabWrapperLTR: { marginRight: 20 },
  tabWrapperRTL: { marginLeft: 20 },
  /*
    paddingVertical: 12,
    position: 'relative',
  },
  */
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.gold[400],
    fontWeight: fontWeight.bold,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.gold[400],
    borderRadius: 1,
  },
});
