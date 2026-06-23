import { json } from '@sveltejs/kit';

export const GET = () => {
  return json({
    status: 'ok',
    service: 'artemis-sveltekit',
    runtime: 'sveltekit'
  });
};
