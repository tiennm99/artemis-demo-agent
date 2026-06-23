import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { RequestEvent } from '@sveltejs/kit';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

export const artemisSchema = privateEnv.ARTEMIS_SUPABASE_SCHEMA || 'artemis_preview';
export const artemisEnvironment = privateEnv.ARTEMIS_ENV || 'preview';
export const artemisStorageBucketPrefix = privateEnv.ARTEMIS_STORAGE_BUCKET_PREFIX || artemisSchema;

export function hasSupabaseConfig() {
  return Boolean(publicEnv.PUBLIC_SUPABASE_URL && publicEnv.PUBLIC_SUPABASE_ANON_KEY);
}

export function createSupabaseServerClient(event: RequestEvent) {
  const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = publicEnv.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase public env vars are required before using the Supabase server client.');
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => event.cookies.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          event.cookies.set(name, value, { ...options, path: options.path ?? '/' });
        });
      }
    },
    db: {
      schema: artemisSchema
    }
  });
}
