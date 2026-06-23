import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAdmin } from '$lib/server/auth/admin-roles';
import { assertSameOrigin } from '$lib/server/security/origin-check';
import { listMarketplaceAdmin, moderateMarketplaceListing } from '$lib/server/repositories/marketplace';
import type { ListingStatus } from '$lib/shared/types/domain';

const allowedStatuses = new Set<ListingStatus>(['pending', 'approved', 'rejected', 'hidden', 'passed']);

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

export const load: PageServerLoad = async (event) => {
  await requireAdmin(event, 'phienchotrenmay');
  return listMarketplaceAdmin(event);
};

export const actions: Actions = {
  setStatus: async (event) => {
    assertSameOrigin(event);
    const actor = await requireAdmin(event, 'phienchotrenmay');
    const formData = await event.request.formData();
    const id = readText(formData, 'id');
    const status = readText(formData, 'status') as ListingStatus;

    if (!id || !allowedStatuses.has(status)) return fail(400, { message: 'Vật phẩm admin không hợp lệ.' });
    await moderateMarketplaceListing(event, actor, id, status);
    return { message: 'Admin chợ đã cập nhật vật phẩm.' };
  }
};
