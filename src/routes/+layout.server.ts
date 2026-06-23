import type { LayoutServerLoad } from './$types';
import { hasAdminScope } from '$lib/server/auth/admin-roles';
import { hasSupabaseConfig } from '$lib/server/supabase/client';

export const load: LayoutServerLoad = ({ locals, url }) => {
  return {
    currentPath: url.pathname,
    user: locals.user,
    authMode: hasSupabaseConfig() ? 'supabase-google' : 'local-dev',
    adminScopes: {
      vutrudodac: hasAdminScope(locals.user, 'vutrudodac'),
      phienchotrenmay: hasAdminScope(locals.user, 'phienchotrenmay')
    }
  };
};
