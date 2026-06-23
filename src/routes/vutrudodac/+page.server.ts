import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireVerifiedUserForAction } from '$lib/server/auth/session';
import { assertSameOrigin } from '$lib/server/security/origin-check';
import { createFoundReport, createLostReport, listLostFoundDashboard } from '$lib/server/repositories/lost-found';
import { markNotificationRead } from '$lib/server/repositories/notifications';
import { uploadImageFromForm } from '$lib/server/storage/image-storage';

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function validateDescription(description: string) {
  if (description.length < 3) return 'Mô tả cần rõ hơn để radar dò đúng tín hiệu.';
  if (description.length > 2000) return 'Mô tả đang quá dài cho một tín hiệu Artemis.';
  return null;
}

export const load: PageServerLoad = async (event) => {
  return {
    ...(await listLostFoundDashboard(event, event.locals.user)),
    user: event.locals.user
  };
};

export const actions: Actions = {
  createLost: async (event) => {
    assertSameOrigin(event);
    const authFailure = requireVerifiedUserForAction(event.locals.user);
    if (authFailure) return authFailure;
    const user = event.locals.user;
    if (!user) return fail(401, { message: 'Bạn cần đăng nhập Google để gửi tín hiệu.' });

    const formData = await event.request.formData();
    const description = readText(formData, 'description');
    const lostAtText = readText(formData, 'lostAtText');
    const descriptionError = validateDescription(description);

    if (descriptionError) return fail(400, { message: descriptionError });
    if (!lostAtText) return fail(400, { message: 'Cho Artemis biết bạn mất đồ khi nào.' });

    const id = globalThis.crypto.randomUUID();
    const image = await uploadImageFromForm(event, user, 'vutrudodac', id, formData.get('image'));
    const result = await createLostReport(event, user, { id, description, lostAtText, image });

    return {
      message: result.candidates.length
        ? `Radar thấy ${result.candidates.length} tín hiệu gần giống.`
        : 'Tín hiệu tìm đồ đã bay vào radar.',
      focus: 'lost'
    };
  },
  createFound: async (event) => {
    assertSameOrigin(event);
    const authFailure = requireVerifiedUserForAction(event.locals.user);
    if (authFailure) return authFailure;
    const user = event.locals.user;
    if (!user) return fail(401, { message: 'Bạn cần đăng nhập Google để gửi tín hiệu.' });

    const formData = await event.request.formData();
    const description = readText(formData, 'description');
    const foundAtText = readText(formData, 'foundAtText');
    const location = readText(formData, 'location');
    const descriptionError = validateDescription(description);

    if (descriptionError) return fail(400, { message: descriptionError });
    if (!foundAtText) return fail(400, { message: 'Cho Artemis biết bạn nhặt được khi nào.' });
    if (!location) return fail(400, { message: 'Vị trí nhặt được giúp chủ đồ tìm đường về.' });

    const id = globalThis.crypto.randomUUID();
    const image = await uploadImageFromForm(event, user, 'vutrudodac', id, formData.get('image'));
    const result = await createFoundReport(event, user, { id, description, foundAtText, location, image });

    return {
      message: result.candidates.length
        ? `Radar thấy ${result.candidates.length} chủ đồ có thể phù hợp.`
        : 'Tín hiệu trả đồ đã sáng trên mặt trăng.',
      focus: 'found'
    };
  },
  markNotification: async (event) => {
    assertSameOrigin(event);
    const authFailure = requireVerifiedUserForAction(event.locals.user);
    if (authFailure) return authFailure;
    const user = event.locals.user;
    if (!user) return fail(401, { message: 'Bạn cần đăng nhập Google để xử lý thông báo.' });

    const formData = await event.request.formData();
    const notificationId = readText(formData, 'notificationId');
    if (!notificationId) return fail(400, { message: 'Thiếu thông báo cần đánh dấu.' });
    await markNotificationRead(event, user, notificationId);
    return { message: 'Thông báo đã được đánh dấu.' };
  }
};
