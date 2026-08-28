import { supabase } from '@/services/supabase';

export type UserNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  target_id: string | null;
  data: Record<string, unknown>;
  created_at: string;
};

export async function listUserNotifications(userId: string, limit = 50) {
  const { data, error } = await supabase.from('user_notifications').select('id,title,body,type,read,target_id,data,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data || []) as UserNotification[];
}

export async function countUnreadNotifications(userId: string) {
  const { count, error } = await supabase.from('user_notifications').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('read', false);
  if (error) throw error;
  return count || 0;
}

export async function markNotificationRead(userId: string, id: string) {
  return supabase.from('user_notifications').update({ read: true }).eq('user_id', userId).eq('id', id);
}

export async function markAllNotificationsRead(userId: string) {
  return supabase.from('user_notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
}

export async function deleteNotification(userId: string, id: string) {
  return supabase.from('user_notifications').delete().eq('user_id', userId).eq('id', id);
}
