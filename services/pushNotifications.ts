import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from '@/services/supabase';

type NotificationsModule = typeof import('expo-notifications');
let notifications: NotificationsModule | null = null;
let notificationsUnavailable = false;

async function getNotifications(): Promise<NotificationsModule | null> {
  if (Platform.OS === 'web' || notificationsUnavailable) return null;
  if (notifications) return notifications;
  try {
    notifications = await import('expo-notifications');
    notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowAlert: true, shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: true }) });
    return notifications;
  } catch {
    notificationsUnavailable = true;
    return null;
  }
}

export async function registerPushToken(userId: string): Promise<{ token: string | null; error: string | null }> {
  const module = await getNotifications();
  if (!module) return { token: null, error: null };
  if (!Device.isDevice) return { token: null, error: 'physicalDeviceRequired' };
  if (Platform.OS === 'android') {
    for (const channel of [
      { id: 'matches', name: 'Matches', importance: module.AndroidImportance.HIGH },
      { id: 'goals', name: 'Goals', importance: module.AndroidImportance.HIGH },
      { id: 'news', name: 'News', importance: module.AndroidImportance.DEFAULT },
      { id: 'transfers', name: 'Transfers', importance: module.AndroidImportance.DEFAULT },
    ]) await module.setNotificationChannelAsync(channel.id, { name: channel.name, importance: channel.importance, vibrationPattern: [0, 250, 250, 250], lightColor: '#D4AF37' });
  }
  const permissions = await module.getPermissionsAsync();
  let status = permissions.status;
  if (status !== 'granted') status = (await module.requestPermissionsAsync()).status;
  if (status !== 'granted') return { token: null, error: 'notificationsPermissionDenied' };
  const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
  if (!projectId) return { token: null, error: 'easProjectIdMissing' };
  const token = (await module.getExpoPushTokenAsync({ projectId })).data;
  const { error } = await supabase.from('push_tokens').upsert({ user_id: userId, token, platform: Platform.OS, device_name: Device.deviceName || null, updated_at: new Date().toISOString() }, { onConflict: 'user_id,token' });
  return { token, error: error?.message || null };
}

export async function subscribeToNotificationResponses(onData: (data: Record<string, unknown>) => void) {
  const module = await getNotifications();
  if (!module) return () => undefined;
  const subscription = module.addNotificationResponseReceivedListener((response) => onData((response.notification.request.content.data || {}) as Record<string, unknown>));
  const initial = await module.getLastNotificationResponseAsync();
  if (initial) onData((initial.notification.request.content.data || {}) as Record<string, unknown>);
  return () => subscription.remove();
}

export async function removePushToken(userId: string, token: string) {
  await supabase.from('push_tokens').delete().eq('user_id', userId).eq('token', token);
}
