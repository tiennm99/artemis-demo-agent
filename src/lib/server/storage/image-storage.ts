import { error, type RequestEvent } from '@sveltejs/kit';
import {
  artemisStorageBucketPrefix,
  createSupabaseServerClient,
  hasSupabaseConfig
} from '$lib/server/supabase/client';
import { imageUploadLimits } from '$lib/shared/constants/limits';
import type { ImageMetadata, ProductScope } from '$lib/shared/types/domain';

function sanitizeFileName(fileName: string) {
  const fallback = 'artemis-upload';
  const safe = fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return safe || fallback;
}

export function bucketForProduct(scope: ProductScope) {
  return scope === 'phienchotrenmay'
    ? `${artemisStorageBucketPrefix}-marketplace-images`
    : `${artemisStorageBucketPrefix}-report-images`;
}

export function assertValidImageFile(file: File) {
  if (!imageUploadLimits.allowedMimeTypes.includes(file.type as (typeof imageUploadLimits.allowedMimeTypes)[number])) {
    throw error(400, 'Ảnh cần là JPEG, PNG, WebP hoặc GIF.');
  }

  if (file.size > imageUploadLimits.maxBytes) {
    throw error(400, 'Ảnh cần nhỏ hơn 2MB để Artemis gửi tín hiệu nhanh hơn.');
  }
}

export async function uploadImageFromForm(
  event: RequestEvent,
  user: App.ArtemisUser,
  scope: ProductScope,
  recordId: string,
  file: FormDataEntryValue | null
): Promise<ImageMetadata | undefined> {
  if (!(file instanceof File) || file.size === 0) return undefined;
  assertValidImageFile(file);

  const bucket = bucketForProduct(scope);
  const path = `${user.id}/${recordId}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const metadata: ImageMetadata = {
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

export async function resolveImageUrl(event: RequestEvent, image?: ImageMetadata) {
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
