import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAdmin } from '$lib/server/auth/admin-roles';
import { assertSameOrigin } from '$lib/server/security/origin-check';
import { listLostFoundAdmin, updateReportStatus } from '$lib/server/repositories/lost-found';
import type { ReportStatus } from '$lib/shared/types/domain';

const allowedStatuses = new Set<ReportStatus>(['open', 'matched', 'returned', 'closed', 'hidden']);

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

export const load: PageServerLoad = async (event) => {
  await requireAdmin(event, 'vutrudodac');
  return listLostFoundAdmin(event);
};

export const actions: Actions = {
  setStatus: async (event) => {
    assertSameOrigin(event);
    const actor = await requireAdmin(event, 'vutrudodac');
    const formData = await event.request.formData();
    const id = readText(formData, 'id');
    const kind = readText(formData, 'kind');
    const status = readText(formData, 'status') as ReportStatus;

    if (!id || (kind !== 'lost' && kind !== 'found') || !allowedStatuses.has(status)) {
      return fail(400, { message: 'Tín hiệu admin không hợp lệ.' });
    }

    await updateReportStatus(event, actor, kind, id, status);
    return { message: 'Radar admin đã cập nhật tín hiệu.' };
  }
};
