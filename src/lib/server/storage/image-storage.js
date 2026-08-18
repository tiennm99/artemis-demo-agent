import { error } from '@sveltejs/kit';
import {
  artemisStorageBucketPrefix,
  createSupabaseServerClient,
  hasSupabaseConfig
} from '$lib/server/supabase/client';
import { imageUploadLimits } from '$lib/shared/constants/limits';

/** @typedef {import('$lib/shared/types/domain').ImageMetadata} ImageMetadata */
/** @typedef {import('$lib/shared/types/domain').ProductScope} ProductScope */

/** @param {string} fileName */
function sanitizeFileName(fileName) {
  const fallback = 'artemis-upload';
  const safe = fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return safe || fallback;
}

/** @param {ProductScope} scope */
export function bucketForProduct(scope) {
  return scope === 'phienchotrenmay'
    ? `${artemisStorageBucketPrefix}-marketplace-images`
    : `${artemisStorageBucketPrefix}-report-images`;
}

/** @param {File} file */
export function assertValidImageFile(file) {
  if (!imageUploadLimits.allowedMimeTypes.includes(/** @type {(typeof imageUploadLimits.allowedMimeTypes)[number]} */ (file.type))) {
    throw error(400, 'Ảnh cần là JPEG, PNG, WebP hoặc GIF.');
  }

  if (file.size > imageUploadLimits.maxBytes) {
    throw error(400, 'Ảnh cần nhỏ hơn 2MB để Artemis gửi tín hiệu nhanh hơn.');
  }
}

/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 * @param {App.ArtemisUser} user
 * @param {ProductScope} scope
 * @param {string} recordId
 * @param {FormDataEntryValue | null} file
 * @returns {Promise<ImageMetadata | undefined>}
 */
export async function uploadImageFromForm(event, user, scope, recordId, file) {
  if (!(file instanceof File) || file.size === 0) return undefined;
  assertValidImageFile(file);

  const bucket = bucketForProduct(scope);
  const path = `${user.id}/${recordId}/${Date.now()}-${sanitizeFileName(file.name)}`;
  /** @type {ImageMetadata} */
  const metadata = {
    path,
    bucket,
    mimeType: file.type,
    size: file.size,
    originalName: file.name
  };

  if (!hasSupabaseConfig()) return metadata;

  const supabase = createSupabaseServerClient(event);
  const body = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, body, {
    contentType: file.type,
    upsert: false
  });

  if (uploadError) {
    throw error(500, `Không thể gửi ảnh lên kho riêng của Artemis: ${uploadError.message}`);
  }

  return metadata;
}

/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 * @param {ImageMetadata} [image]
 */
export async function resolveImageUrl(event, image) {
  if (!image) return undefined;
  if (image.url) return image.url;
  if (!hasSupabaseConfig()) return undefined;

  const supabase = createSupabaseServerClient(event);
  const { data, error: signedUrlError } = await supabase.storage
    .from(image.bucket)
    .createSignedUrl(image.path, imageUploadLimits.signedUrlTtlSeconds);

  if (signedUrlError) return undefined;
  return data.signedUrl;
}
