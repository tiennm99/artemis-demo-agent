import { error } from '@sveltejs/kit';
import { createSupabaseServerClient, hasSupabaseConfig } from '$lib/server/supabase/client';
import { markMemoryNotificationRead } from '$lib/server/persistence/memory-store';

/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 * @param {App.ArtemisUser} user
 * @param {string} notificationId
 */
export async function markNotificationRead(event, user, notificationId) {
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
