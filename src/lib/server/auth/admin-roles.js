import { error } from '@sveltejs/kit';
import { env as privateEnv } from '$env/dynamic/private';
import { requireVerifiedUser } from './session';

/** @typedef {import('$lib/shared/types/domain').AdminScope} AdminScope */

const defaultAdminEmails = ['minhtienit99@gmail.com', 'minhnguyetawf@gmail.com'];

export function configuredAdminEmails() {
  const fromEnv = privateEnv.ARTEMIS_ADMIN_EMAILS?.split(',').map((email) => email.trim().toLowerCase()).filter(Boolean);
  return fromEnv?.length ? fromEnv : defaultAdminEmails;
}

/**
 * @param {string} email
 * @returns {AdminScope[]}
 */
export function scopesForEmail(email) {
  if (!configuredAdminEmails().includes(email.toLowerCase())) return [];
  return ['global', 'vutrudodac', 'phienchotrenmay'];
}

/**
 * @param {App.ArtemisUser | null} user
 * @param {AdminScope} scope
 */
export function hasAdminScope(user, scope) {
  if (!user) return false;
  const scopes = scopesForEmail(user.email);
  return scopes.includes('global') || scopes.includes(scope);
}

/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 * @param {AdminScope} scope
 */
export async function requireAdmin(event, scope) {
  const user = await requireVerifiedUser(event);
  if (!hasAdminScope(user, scope)) {
    throw error(403, 'Bạn không có quyền admin cho khu vực này.');
  }
  return user;
}
