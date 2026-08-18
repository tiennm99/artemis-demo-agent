import { getSessionUser } from '$lib/server/auth/session';

/** @type {import('@sveltejs/kit').Handle} */
export const handle = async ({ event, resolve }) => {
  event.locals.user = await getSessionUser(event);
  return resolve(event);
};
