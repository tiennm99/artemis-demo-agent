import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  let payload: { message?: unknown } = {};

  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  const userId = request.headers.get('X-GreenNode-AgentBase-User-Id') || 'starter';
  const message = String(payload.message || '').trim();
  const response = message
    ? 'Minh da ghi nhan tin hieu cua ban. Radar se tiep tuc doi song va thong bao khi co ket qua phu hop.'
    : `Hey ${userId}, minh la Artemis - radar cua vu tru do dac. Ban muon tim do that lac hay tra lai do bi mat?`;

  return json({
    status: 'success',
    response
  });
};
