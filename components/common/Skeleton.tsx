import { StyleSheet, View } from 'react-native';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/layout';

export function Skeleton({ width, height, style }: { width?: number | string; height?: number; style?: any }) {
  return <View style={[styles.skeleton, { width, height }, style]} />;
}

export function MatchCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width={80} height={12} style={{ marginBottom: 12 }} />
      <View style={styles.row}>
        <Skeleton width={40} height={40} style={{ borderRadius: 20 }} />
        <Skeleton width={60} height={12} />
        <Skeleton width={30} height={20} />
        <Skeleton width={60} height={12} />
        <Skeleton width={40} height={40} style={{ borderRadius: 20 }} />
      </View>
    </View>
  );
}

export function TeamCardSkeleton() {
  return (
    <View style={styles.teamCard}>
      <Skeleton width={48} height={48} style={{ borderRadius: 24 }} />
      <Skeleton width={80} height={12} style={{ marginTop: 8 }} />
      <Skeleton width={60} height={10} style={{ marginTop: 4 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.black[500],
    borderRadius: radius.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  teamCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
});
