import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/services/i18n';

export function LoadingState({ message }: { message?: string }) {
  const { language } = useLanguage();
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.gold[400]} />
      <Text style={styles.text}>{message || t(language, 'loading')}</Text>
    </View>
  );
}

const ERROR_KEYS = new Set([
  'connectionError', 'somethingWrong', 'error401', 'error403',
  'error404', 'error429', 'error500', 'noInternet',
]);
const ERROR_ALIASES: Record<string, string> = {
  news_unauthorized: 'error401',
  news_forbidden: 'error403',
  news_rate_limited: 'error429',
  news_server_error: 'error500',
  news_timeout: 'connectionError',
  news_request_failed: 'connectionError',
  news_api_not_configured: 'connectionError',
};

export function ErrorState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  const { language } = useLanguage();
  const normalizedMessage = message ? ERROR_ALIASES[message] || message : undefined;
  const displayMessage = normalizedMessage
    ? (ERROR_KEYS.has(normalizedMessage) ? t(language, normalizedMessage as any) : normalizedMessage)
    : t(language, 'somethingWrong');
  return (
    <View style={styles.container}>
      <Text style={styles.errorIcon}>⚠</Text>
      <Text style={styles.text}>{displayMessage}</Text>
      {onRetry && (
        <Text style={styles.retry} onPress={onRetry}>
          {t(language, 'retry')}
        </Text>
      )}
    </View>
  );
}

export function EmptyState({ message }: { message?: string }) {
  const { language } = useLanguage();
  return (
    <View style={styles.container}>
      <Text style={styles.emptyIcon}>⚽</Text>
      <Text style={styles.text}>{message || t(language, 'noData')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 200,
  },
  text: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 12,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  retry: {
    color: colors.gold[400],
    fontSize: 15,
    fontWeight: '600',
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: colors.gold[400],
    borderRadius: 8,
    overflow: 'hidden',
  },
});
