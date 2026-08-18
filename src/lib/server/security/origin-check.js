import { error } from '@sveltejs/kit';

/** @param {import('@sveltejs/kit').RequestEvent} event */
export function assertSameOrigin(event) {
  const origin = event.request.headers.get('origin');
  if (!origin) return;
  if (origin !== event.url.origin) {
    throw error(403, 'Nguồn request không hợp lệ.');
  }
}
