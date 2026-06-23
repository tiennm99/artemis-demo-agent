import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireVerifiedUserForAction } from '$lib/server/auth/session';
import { assertSameOrigin } from '$lib/server/security/origin-check';
import {
  createMarketplaceListing,
  listMarketplace,
  toggleMarketplaceCare
} from '$lib/server/repositories/marketplace';
import { uploadImageFromForm } from '$lib/server/storage/image-storage';

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

export const load: PageServerLoad = async (event) => {
  const query = event.url.searchParams.get('q')?.trim() ?? '';
  return {
    ...(await listMarketplace(event, event.locals.user, query)),
    query,
    user: event.locals.user
  };
};

export const actions: Actions = {
  createListing: async (event) => {
    assertSameOrigin(event);
    const authFailure = requireVerifiedUserForAction(event.locals.user);
    if (authFailure) return authFailure;
    const user = event.locals.user;
    if (!user) return fail(401, { message: 'Bạn cần đăng nhập Google để phóng vật phẩm.' });

    const formData = await event.request.formData();
    const name = readText(formData, 'name');
    const description = readText(formData, 'description');
    const priceText = readText(formData, 'priceText');
    const contact = readText(formData, 'contact');
    const quantity = Number(readText(formData, 'quantity') || '1');

    if (name.length < 2) return fail(400, { message: 'Tên vật phẩm cần rõ hơn.' });
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
      return fail(400, { message: 'Số lượng cần nằm trong khoảng 1-999.' });
    }
    if (description.length < 3) return fail(400, { message: 'Mô tả vật phẩm cần rõ hơn.' });
    if (!priceText) return fail(400, { message: 'Điền giá hoặc cách trao đổi.' });
    if (!contact) return fail(400, { message: 'Cần contact để người quan tâm bắt sóng.' });

    const id = globalThis.crypto.randomUUID();
    const image = await uploadImageFromForm(event, user, 'phienchotrenmay', id, formData.get('image'));
    await createMarketplaceListing(event, user, { id, name, quantity, description, priceText, contact, image });
    return { message: 'Vật phẩm đã bay lên hàng chờ duyệt.', focus: 'listing' };
  },
  toggleCare: async (event) => {
    assertSameOrigin(event);
    const authFailure = requireVerifiedUserForAction(event.locals.user);
    if (authFailure) return authFailure;
    const user = event.locals.user;
    if (!user) return fail(401, { message: 'Bạn cần đăng nhập Google để gửi care star.' });

    const formData = await event.request.formData();
    const listingId = readText(formData, 'listingId');
    if (!listingId) return fail(400, { message: 'Thiếu vật phẩm cần care.' });
    await toggleMarketplaceCare(event, user, listingId);
    return { message: 'Care star đã cập nhật.', focus: 'care' };
  }
};
