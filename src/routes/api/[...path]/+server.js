import { json } from '@sveltejs/kit';

const retired = () =>
  json(
    {
      status: 'retired',
      message: 'Legacy /api/* routes were retired in the SvelteKit/Supabase cutover. Use page actions instead.'
    },
    { status: 410 }
  );

/** @type {import('./$types').RequestHandler} */
export const GET = retired;
/** @type {import('./$types').RequestHandler} */
export const POST = retired;
/** @type {import('./$types').RequestHandler} */
export const PATCH = retired;
/** @type {import('./$types').RequestHandler} */
export const PUT = retired;
/** @type {import('./$types').RequestHandler} */
export const DELETE = retired;
