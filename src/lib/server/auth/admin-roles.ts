import { error, type RequestEvent } from '@sveltejs/kit';
import { env as privateEnv } from '$env/dynamic/private';
import type { AdminScope } from '$lib/shared/types/domain';
import { requireVerifiedUser } from './session';

const defaultAdminEmails = ['minhtienit99@gmail.com', 'minhnguyetawf@gmail.com'];

export function configuredAdminEmails() {
  const fromEnv = privateEnv.ARTEMIS_ADMIN_EMAILS?.split(',').map((email) => email.trim().toLowerCase()).filter(Boolean);
  return fromEnv?.length ? fromEnv : defaultAdminEmails;
}

export function scopesForEmail(email: string): AdminScope[] {
  if (!configuredAdminEmails().includes(email.toLowerCase())) return [];
  return ['global', 'vutrudodac', 'phienchotrenmay'];
}

export function hasAdminScope(user: App.ArtemisUser | null, scope: AdminScope) {
  if (!user) return false;
  const scopes = scopesForEmail(user.email);
  return scopes.includes('global') || scopes.includes(scope);
}

export async function requireAdmin(event: RequestEvent, scope: AdminScope) {
  const user = await requireVerifiedUser(event);
  if (!hasAdminScope(user, scope)) {
    throw error(403, 'Bạn không có quyền admin cho khu vực này.');
  }
  return user;
}
