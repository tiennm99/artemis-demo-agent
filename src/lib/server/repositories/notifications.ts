import { error, type RequestEvent } from '@sveltejs/kit';
import { createSupabaseServerClient, hasSupabaseConfig } from '$lib/server/supabase/client';
import { markMemoryNotificationRead } from '$lib/server/persistence/memory-store';

export async function markNotificationRead(event: RequestEvent, user: App.ArtemisUser, notificationId: string) {
  if (!hasSupabaseConfig()) return markMemoryNotificationRead(user.id, notificationId);

  const supabase = createSupabaseServerClient(event);
  const { data, error: updateError } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('recipient_profile_id', user.id)
    .select('*')
    .maybeSingle();

  if (updateError) throw error(500, `Không thể đánh dấu thông báo: ${updateError.message}`);
  return data;
}
