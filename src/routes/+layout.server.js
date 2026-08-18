import { hasAdminScope } from '$lib/server/auth/admin-roles';
import { hasSupabaseConfig } from '$lib/server/supabase/client';

/** @type {import('./$types').LayoutServerLoad} */
export const load = ({ locals, url }) => {
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
