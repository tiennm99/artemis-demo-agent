import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createSupabaseServerClient, hasSupabaseConfig } from '$lib/server/supabase/client';

export const load: PageServerLoad = ({ locals, url }) => {
  return {
    user: locals.user,
    reason: url.searchParams.get('reason'),
    authMode: hasSupabaseConfig() ? 'supabase-google' : 'local-dev'
  };
};

export const actions: Actions = {
  signIn: async (event) => {
    if (!hasSupabaseConfig()) {
      throw redirect(303, '/account');
    }

    const supabase = createSupabaseServerClient(event);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${event.url.origin}/account`
      }
    });

    if (error || !data.url) {
      return { message: error?.message ?? 'Không thể mở cổng Google OAuth.' };
    }

    throw redirect(303, data.url);
  },
  signOut: async (event) => {
    if (hasSupabaseConfig()) {
      const supabase = createSupabaseServerClient(event);
      await supabase.auth.signOut();
    }
    throw redirect(303, '/account');
  }
};
