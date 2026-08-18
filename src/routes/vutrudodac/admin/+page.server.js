import { fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth/admin-roles';
import { assertSameOrigin } from '$lib/server/security/origin-check';
import { listLostFoundAdmin, updateReportStatus } from '$lib/server/repositories/lost-found';

/** @typedef {import('$lib/shared/types/domain').ReportStatus} ReportStatus */

/** @type {Set<ReportStatus>} */
const allowedStatuses = new Set(['open', 'matched', 'returned', 'closed', 'hidden']);

/**
 * @param {FormData} formData
 * @param {string} key
 */
function readText(formData, key) {
  return String(formData.get(key) ?? '').trim();
}

/** @type {import('./$types').PageServerLoad} */
export const load = async (event) => {
  await requireAdmin(event, 'vutrudodac');
  return listLostFoundAdmin(event);
};

/** @type {import('./$types').Actions} */
export const actions = {
  setStatus: async (event) => {
    assertSameOrigin(event);
    const actor = await requireAdmin(event, 'vutrudodac');
    const formData = await event.request.formData();
    const id = readText(formData, 'id');
    const kind = readText(formData, 'kind');
    const status = /** @type {ReportStatus} */ (readText(formData, 'status'));

    if (!id || (kind !== 'lost' && kind !== 'found') || !allowedStatuses.has(status)) {
      return fail(400, { message: 'Tín hiệu admin không hợp lệ.' });
    }

    await updateReportStatus(event, actor, kind, id, status);
    return { message: 'Radar admin đã cập nhật tín hiệu.' };
  }
};
