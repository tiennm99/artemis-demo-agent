import { error } from '@sveltejs/kit';
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
  hasSupabaseConfig,
  hasSupabaseServiceConfig
} from '$lib/server/supabase/client';
import {
  createMemoryListing,
  listMemoryMarketplace,
  toggleMemoryMarketplaceInterest,
  updateMemoryListingStatus
} from '$lib/server/persistence/memory-store';
import { rankMarketplaceListings } from '$lib/server/domain/marketplace/ranking';

/** @typedef {import('$lib/shared/types/domain').ImageMetadata} ImageMetadata */
/** @typedef {import('$lib/shared/types/domain').ListingStatus} ListingStatus */
/** @typedef {import('$lib/shared/types/domain').MarketplaceListing} MarketplaceListing */
/** @typedef {import('$lib/shared/types/domain').ProfileSummary} ProfileSummary */

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
    id: String(row.owner_profile_id ?? profile?.id ?? fallback?.id ?? 'unknown'),
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
 * @param {string} [currentUserId]
 * @returns {MarketplaceListing}
 */
function listingFromRow(row, currentUserId) {
  const interests = Array.isArray(row.marketplace_interests) ? row.marketplace_interests : [];
  return {
    id: String(row.id),
    owner: profileFromRow(row),
    name: String(row.name ?? ''),
    quantity: Number(row.quantity ?? 1),
    description: String(row.description ?? ''),
    priceText: String(row.price_text ?? ''),
    contact: String(row.contact ?? ''),
    status: /** @type {ListingStatus} */ (String(row.status ?? 'pending')),
    image: imageFromRow(row),
    careCount: Number(row.care_count ?? interests.length ?? 0),
    caredByCurrentUser: currentUserId
      ? interests.some((interest) => String(/** @type {Row} */ (interest).profile_id) === currentUserId)
      : false,
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
async function listSupabaseListings(event, user) {
  const supabase = createSupabaseServerClient(event);
  const { data, error: listError } = await supabase
    .from('marketplace_listings')
    .select('*, profiles:owner_profile_id(id,email,display_name,domain), marketplace_interests(profile_id)')
    .order('created_at', { ascending: false })
    .limit(60);

  if (listError) return listMemoryMarketplace(user);
  return (data ?? []).map((row) => listingFromRow(/** @type {Row} */ (row), user?.id));
}

/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 * @param {App.ArtemisUser | null} [user]
 * @param {string} [query]
 */
export async function listMarketplace(event, user, query = '') {
  const listings = hasSupabaseConfig() ? await listSupabaseListings(event, user) : listMemoryMarketplace(user);
  return {
    listings: rankMarketplaceListings(listings, query),
    pendingListings: listings.filter((listing) => listing.status === 'pending')
  };
}

/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 * @param {App.ArtemisUser} user
 * @param {{ id: string, name: string, quantity: number, description: string, priceText: string, contact: string, image?: ImageMetadata }} input
 */
export async function createMarketplaceListing(event, user, input) {
  if (!hasSupabaseConfig()) return createMemoryListing(user, input);

  await ensureSupabaseProfile(event, user);
  const supabase = createSupabaseServerClient(event);
  const { data, error: insertError } = await supabase
    .from('marketplace_listings')
    .insert({
      id: input.id,
      owner_profile_id: user.id,
      name: input.name,
      quantity: input.quantity,
      description: input.description,
      price_text: input.priceText,
      contact: input.contact,
      status: 'pending',
      image_metadata: input.image ?? null,
      payload: {}
    })
    .select('*')
    .single();

  if (insertError) throw error(500, `Không thể phóng vật phẩm lên chợ: ${insertError.message}`);
  return listingFromRow(/** @type {Row} */ (data), user.id);
}

/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 * @param {App.ArtemisUser} user
 * @param {string} listingId
 */
export async function toggleMarketplaceCare(event, user, listingId) {
  if (!hasSupabaseConfig()) return toggleMemoryMarketplaceInterest(user, listingId);

  await ensureSupabaseProfile(event, user);
  const supabase = createSupabaseServerClient(event);
  const existing = await supabase
    .from('marketplace_interests')
    .select('listing_id')
    .eq('listing_id', listingId)
    .eq('profile_id', user.id)
    .maybeSingle();

  if (existing.error) throw error(500, `Không thể kiểm tra lượt quan tâm: ${existing.error.message}`);

  if (existing.data) {
    const { error: deleteError } = await supabase
      .from('marketplace_interests')
      .delete()
      .eq('listing_id', listingId)
      .eq('profile_id', user.id);
    if (deleteError) throw error(500, `Không thể gỡ care star: ${deleteError.message}`);
    return null;
  }

  const { error: insertError } = await supabase
    .from('marketplace_interests')
    .insert({ listing_id: listingId, profile_id: user.id });
  if (insertError) throw error(500, `Không thể gửi care star: ${insertError.message}`);
  return null;
}

/** @param {import('@sveltejs/kit').RequestEvent} event */
export async function listMarketplaceAdmin(event) {
  const listings = hasSupabaseConfig()
    ? await listSupabaseListings(event, event.locals.user)
    : listMemoryMarketplace(event.locals.user);
  return {
    listings,
    pendingCount: listings.filter((listing) => listing.status === 'pending').length,
    approvedCount: listings.filter((listing) => listing.status === 'approved').length,
    hiddenCount: listings.filter((listing) => listing.status === 'hidden').length
  };
}

/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 * @param {App.ArtemisUser} actor
 * @param {string} listingId
 * @param {ListingStatus} status
 */
export async function moderateMarketplaceListing(event, actor, listingId, status) {
  if (!hasSupabaseConfig()) return updateMemoryListingStatus(listingId, status, actor);

  const supabase = hasSupabaseServiceConfig() ? createSupabaseServiceClient() : createSupabaseServerClient(event);
  const { data, error: updateError } = await supabase
    .from('marketplace_listings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', listingId)
    .select('*')
    .single();

  if (updateError) throw error(500, `Không thể cập nhật vật phẩm: ${updateError.message}`);
  return listingFromRow(/** @type {Row} */ (data), actor.id);
}
