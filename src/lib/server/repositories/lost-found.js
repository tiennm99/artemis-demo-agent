import { error } from '@sveltejs/kit';
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
  hasSupabaseConfig,
  hasSupabaseServiceConfig
} from '$lib/server/supabase/client';
import {
  createMemoryFoundItem,
  createMemoryLostItem,
  listMemoryLostFound,
  updateMemoryReportStatus
} from '$lib/server/persistence/memory-store';
import { findCandidateMatches } from '$lib/server/domain/lost-found/matching';

/** @typedef {import('$lib/shared/types/domain').FoundItem} FoundItem */
/** @typedef {import('$lib/shared/types/domain').ImageMetadata} ImageMetadata */
/** @typedef {import('$lib/shared/types/domain').LostItem} LostItem */
/** @typedef {import('$lib/shared/types/domain').ProfileSummary} ProfileSummary */
/** @typedef {import('$lib/shared/types/domain').ReportStatus} ReportStatus */

/** @typedef {'lost' | 'found'} ReportKind */
/** @typedef {Record<string, unknown>} Row */

/**
 * @param {App.ArtemisUser} user
 * @returns {ProfileSummary}
 */
function profileFromUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    domain: user.domain,
    verifiedEmail: user.verifiedEmail
  };
}

/**
 * @param {Row} row
 * @param {ProfileSummary} [fallback]
 * @returns {ProfileSummary}
 */
function profileFromRow(row, fallback) {
  const profile = /** @type {Row | undefined} */ (row.profiles ?? row.profile);
  return {
    id: String(row.owner_profile_id ?? row.finder_profile_id ?? profile?.id ?? fallback?.id ?? 'unknown'),
    email: String(profile?.email ?? fallback?.email ?? 'unknown@example.com'),
    displayName: String(profile?.display_name ?? fallback?.displayName ?? 'starter'),
    domain: String(profile?.domain ?? fallback?.domain ?? 'starter'),
    verifiedEmail: true
  };
}

/**
 * @param {Row} row
 * @returns {ImageMetadata | undefined}
 */
function imageFromRow(row) {
  const metadata = row.image_metadata;
  if (!metadata || typeof metadata !== 'object') return undefined;
  return /** @type {ImageMetadata} */ (metadata);
}

/**
 * @param {Row} row
 * @param {ProfileSummary} [fallback]
 * @returns {LostItem}
 */
function lostFromRow(row, fallback) {
  return {
    id: String(row.id),
    owner: profileFromRow(row, fallback),
    description: String(row.description ?? ''),
    lostAtText: String(row.occurred_at_text ?? ''),
    status: /** @type {ReportStatus} */ (String(row.status ?? 'open')),
    image: imageFromRow(row),
    payload: /** @type {Record<string, unknown>} */ (row.payload) ?? {},
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? row.created_at ?? new Date().toISOString())
  };
}

/**
 * @param {Row} row
 * @param {ProfileSummary} [fallback]
 * @returns {FoundItem}
 */
function foundFromRow(row, fallback) {
  return {
    id: String(row.id),
    finder: profileFromRow(row, fallback),
    description: String(row.description ?? ''),
    foundAtText: String(row.occurred_at_text ?? ''),
    location: String(row.location ?? ''),
    status: /** @type {ReportStatus} */ (String(row.status ?? 'open')),
    image: imageFromRow(row),
    payload: /** @type {Record<string, unknown>} */ (row.payload) ?? {},
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? row.created_at ?? new Date().toISOString())
  };
}

/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 * @param {App.ArtemisUser} user
 */
async function ensureSupabaseProfile(event, user) {
  const supabase = createSupabaseServerClient(event);
  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      email: user.email,
      auth_provider: 'google',
      display_name: user.displayName,
      domain: user.domain,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'id' }
  );

  if (profileError) throw error(500, `Không thể đồng bộ profile Artemis: ${profileError.message}`);
}

/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 * @param {App.ArtemisUser | null} [user]
 */
async function listSupabaseReports(event, user) {
  const supabase = createSupabaseServerClient(event);
  const [lostResponse, foundResponse, notificationResponse] = await Promise.all([
    supabase
      .from('lost_items')
      .select('*, profiles:owner_profile_id(id,email,display_name,domain)')
      .neq('status', 'hidden')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('found_items')
      .select('*, profiles:owner_profile_id(id,email,display_name,domain)')
      .neq('status', 'hidden')
      .order('created_at', { ascending: false })
      .limit(20),
    user
      ? supabase
          .from('notifications')
          .select('*')
          .eq('recipient_profile_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [], error: null })
  ]);

  if (lostResponse.error || foundResponse.error || notificationResponse.error) {
    return { ...listMemoryLostFound(user), warning: 'Supabase chưa sẵn sàng, Artemis đang dùng dữ liệu local.' };
  }

  const lostItems = (lostResponse.data ?? []).map((row) => lostFromRow(/** @type {Row} */ (row), user ? profileFromUser(user) : undefined));
  const foundItems = (foundResponse.data ?? []).map((row) =>
    foundFromRow(/** @type {Row} */ (row), user ? profileFromUser(user) : undefined)
  );

  return {
    lostItems,
    foundItems,
    matches: findCandidateMatches(lostItems, foundItems),
    notifications: (notificationResponse.data ?? []).map((row) => ({
      id: String(row.id),
      recipientId: String(row.recipient_profile_id),
      type: row.type,
      message: String(row.message),
      readAt: row.read_at ? String(row.read_at) : null,
      deliveryKey: String(row.delivery_key),
      payload: /** @type {Record<string, unknown>} */ (row.payload) ?? {},
      createdAt: String(row.created_at)
    }))
  };
}

/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 * @param {App.ArtemisUser | null} [user]
 */
export async function listLostFoundDashboard(event, user) {
  if (!hasSupabaseConfig()) return listMemoryLostFound(user);
  return listSupabaseReports(event, user);
}

/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 * @param {App.ArtemisUser} user
 * @param {{ id: string, description: string, lostAtText: string, image?: ImageMetadata }} input
 */
export async function createLostReport(event, user, input) {
  if (!hasSupabaseConfig()) return createMemoryLostItem(user, input);

  await ensureSupabaseProfile(event, user);
  const supabase = createSupabaseServerClient(event);
  const { data, error: insertError } = await supabase
    .from('lost_items')
    .insert({
      id: input.id,
      owner_profile_id: user.id,
      description: input.description,
      occurred_at_text: input.lostAtText,
      status: 'open',
      image_metadata: input.image ?? null,
      payload: {}
    })
    .select('*')
    .single();

  if (insertError) throw error(500, `Không thể gửi tín hiệu tìm đồ: ${insertError.message}`);
  return { item: lostFromRow(/** @type {Row} */ (data), profileFromUser(user)), candidates: [] };
}

/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 * @param {App.ArtemisUser} user
 * @param {{ id: string, description: string, foundAtText: string, location: string, image?: ImageMetadata }} input
 */
export async function createFoundReport(event, user, input) {
  if (!hasSupabaseConfig()) return createMemoryFoundItem(user, input);

  await ensureSupabaseProfile(event, user);
  const supabase = createSupabaseServerClient(event);
  const { data, error: insertError } = await supabase
    .from('found_items')
    .insert({
      id: input.id,
      owner_profile_id: user.id,
      description: input.description,
      occurred_at_text: input.foundAtText,
      location: input.location,
      status: 'open',
      image_metadata: input.image ?? null,
      payload: {}
    })
    .select('*')
    .single();

  if (insertError) throw error(500, `Không thể gửi tín hiệu trả đồ: ${insertError.message}`);
  return { item: foundFromRow(/** @type {Row} */ (data), profileFromUser(user)), candidates: [] };
}

/** @param {import('@sveltejs/kit').RequestEvent} event */
export async function listLostFoundAdmin(event) {
  const dashboard = await listLostFoundDashboard(event, event.locals.user);
  return {
    ...dashboard,
    openLostCount: dashboard.lostItems.filter((item) => item.status === 'open').length,
    openFoundCount: dashboard.foundItems.filter((item) => item.status === 'open').length,
    matchCount: dashboard.matches.length
  };
}

/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 * @param {App.ArtemisUser} actor
 * @param {ReportKind} kind
 * @param {string} id
 * @param {ReportStatus} status
 */
export async function updateReportStatus(event, actor, kind, id, status) {
  if (!hasSupabaseConfig()) return updateMemoryReportStatus(kind, id, status, actor);

  const supabase = hasSupabaseServiceConfig() ? createSupabaseServiceClient() : createSupabaseServerClient(event);
  const table = kind === 'lost' ? 'lost_items' : 'found_items';
  const { data, error: updateError } = await supabase
    .from(table)
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (updateError) throw error(500, `Không thể cập nhật trạng thái tín hiệu: ${updateError.message}`);
  return kind === 'lost' ? lostFromRow(/** @type {Row} */ (data)) : foundFromRow(/** @type {Row} */ (data));
}
