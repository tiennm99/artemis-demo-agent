import { fail, redirect } from '@sveltejs/kit';
import { env as privateEnv } from '$env/dynamic/private';
import { createSupabaseServerClient, hasSupabaseConfig } from '$lib/server/supabase/client';

const defaultDevEmail = 'minhtienit99@gmail.com';

/** @param {string} email */
function domainFromEmail(email) {
  return email.split('@')[0]?.toLowerCase().replace(/[^a-z0-9._-]/g, '') || 'starter';
}

/**
 * @param {string} email
 * @param {string} [id]
 * @returns {App.ArtemisUser}
 */
function makeUser(email, id = `dev-${domainFromEmail(email)}`) {
  const domain = domainFromEmail(email);
  return {
    id,
    email,
    displayName: domain,
    domain,
    verifiedEmail: true,
    authProvider: 'google'
  };
}

/** @returns {App.ArtemisUser} */
export function getFallbackDevUser() {
  const configured = privateEnv.ARTEMIS_DEV_USER_EMAIL || privateEnv.ARTEMIS_ADMIN_EMAILS?.split(',')[0];
  return makeUser((configured || defaultDevEmail).trim().toLowerCase());
}

/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 * @returns {Promise<App.ArtemisUser | null>}
 */
export async function getSessionUser(event) {
  if (!hasSupabaseConfig()) return getFallbackDevUser();

  const supabase = createSupabaseServerClient(event);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email) return null;

  const email = data.user.email.toLowerCase();
  const provider = data.user.app_metadata?.provider;
  const providerVerified = data.user.user_metadata?.email_verified;
  const verifiedEmail = Boolean(data.user.email_confirmed_at || providerVerified);

  if (provider !== 'google' || !verifiedEmail) {
    return {
      id: data.user.id,
      email,
      displayName: data.user.user_metadata?.name || domainFromEmail(email),
      domain: domainFromEmail(email),
      verifiedEmail: false,
      authProvider: 'google'
    };
  }

  return {
    id: data.user.id,
    email,
    displayName: data.user.user_metadata?.name || domainFromEmail(email),
    domain: domainFromEmail(email),
    verifiedEmail: true,
    authProvider: 'google'
  };
}

/** @param {import('@sveltejs/kit').RequestEvent} event */
export async function requireVerifiedUser(event) {
  const user = event.locals.user ?? (await getSessionUser(event));
  if (!user) throw redirect(303, '/account?reason=signin');
  if (!user.verifiedEmail) throw redirect(303, '/account?reason=verified-email');
  return user;
}

/** @param {App.ArtemisUser | null} user */
export function requireVerifiedUserForAction(user) {
  if (!user) return fail(401, { message: 'Bạn cần đăng nhập Google để gửi tín hiệu.' });
  if (!user.verifiedEmail) return fail(403, { message: 'Email Google cần được xác minh trước khi dùng Artemis.' });
  return null;
}
