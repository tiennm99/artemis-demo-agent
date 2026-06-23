import { json, type RequestHandler } from '@sveltejs/kit';

const retired = () =>
  json(
    {
      status: 'retired',
      message: 'Legacy /api/* routes were retired in the SvelteKit/Supabase cutover. Use page actions instead.'
    },
    { status: 410 }
  );

export const GET: RequestHandler = retired;
export const POST: RequestHandler = retired;
export const PATCH: RequestHandler = retired;
export const PUT: RequestHandler = retired;
export const DELETE: RequestHandler = retired;
