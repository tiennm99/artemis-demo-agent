import { fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth/admin-roles';
import { assertSameOrigin } from '$lib/server/security/origin-check';
import { listMarketplaceAdmin, moderateMarketplaceListing } from '$lib/server/repositories/marketplace';

/** @typedef {import('$lib/shared/types/domain').ListingStatus} ListingStatus */

/** @type {Set<ListingStatus>} */
const allowedStatuses = new Set(['pending', 'approved', 'rejected', 'hidden', 'passed']);

/**
 * @param {FormData} formData
 * @param {string} key
 */
function readText(formData, key) {
  return String(formData.get(key) ?? '').trim();
}

/** @type {import('./$types').PageServerLoad} */
export const load = async (event) => {
  await requireAdmin(event, 'phienchotrenmay');
  return listMarketplaceAdmin(event);
};

/** @type {import('./$types').Actions} */
export const actions = {
  setStatus: async (event) => {
    assertSameOrigin(event);
    const actor = await requireAdmin(event, 'phienchotrenmay');
    const formData = await event.request.formData();
    const id = readText(formData, 'id');
    const status = /** @type {ListingStatus} */ (readText(formData, 'status'));

    if (!id || !allowedStatuses.has(status)) return fail(400, { message: 'Vật phẩm admin không hợp lệ.' });
    await moderateMarketplaceListing(event, actor, id, status);
    return { message: 'Admin chợ đã cập nhật vật phẩm.' };
  }
};
