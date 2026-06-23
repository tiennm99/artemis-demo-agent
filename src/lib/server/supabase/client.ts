import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { RequestEvent } from '@sveltejs/kit';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

export const artemisSchema = privateEnv.ARTEMIS_SUPABASE_SCHEMA || 'artemis_preview';
export const artemisEnvironment = privateEnv.ARTEMIS_ENV || 'preview';
export const artemisStorageBucketPrefix = privateEnv.ARTEMIS_STORAGE_BUCKET_PREFIX || artemisSchema;

export function hasSupabaseConfig() {
  return Boolean(publicEnv.PUBLIC_SUPABASE_URL && publicEnv.PUBLIC_SUPABASE_ANON_KEY);
}

export function hasSupabaseServiceConfig() {
  return Boolean(publicEnv.PUBLIC_SUPABASE_URL && privateEnv.SUPABASE_SERVICE_ROLE_KEY);
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

export function createSupabaseServiceClient() {
  const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL;
  const serviceRoleKey = privateEnv.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service role env vars are required before using server-only Supabase access.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: artemisSchema
    }
  });
}
