import { error, type RequestEvent } from '@sveltejs/kit';

export function assertSameOrigin(event: RequestEvent) {
  const origin = event.request.headers.get('origin');
  if (!origin) return;
  if (origin !== event.url.origin) {
    throw error(403, 'Nguồn request không hợp lệ.');
  }
}
