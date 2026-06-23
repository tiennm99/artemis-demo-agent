import { error, type RequestEvent } from '@sveltejs/kit';
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
import type {
  ImageMetadata,
  ListingStatus,
  MarketplaceListing,
  ProfileSummary
} from '$lib/shared/types/domain';

type Row = Record<string, unknown>;

function profileFromUser(user: App.ArtemisUser): ProfileSummary {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    domain: user.domain,
    verifiedEmail: user.verifiedEmail
  };
}

function profileFromRow(row: Row, fallback?: ProfileSummary): ProfileSummary {
  const profile = (row.profiles ?? row.profile) as Row | undefined;
  return {
    id: String(row.owner_profile_id ?? profile?.id ?? fallback?.id ?? 'unknown'),
    email: String(profile?.email ?? fallback?.email ?? 'unknown@example.com'),
    displayName: String(profile?.display_name ?? fallback?.displayName ?? 'starter'),
    domain: String(profile?.domain ?? fallback?.domain ?? 'starter'),
    verifiedEmail: true
  };
}

function imageFromRow(row: Row): ImageMetadata | undefined {
  const metadata = row.image_metadata;
  if (!metadata || typeof metadata !== 'object') return undefined;
  return metadata as ImageMetadata;
}

function listingFromRow(row: Row, currentUserId?: string): MarketplaceListing {
  const interests = Array.isArray(row.marketplace_interests) ? row.marketplace_interests : [];
  return {
    id: String(row.id),
    owner: profileFromRow(row),
    name: String(row.name ?? ''),
    quantity: Number(row.quantity ?? 1),
    description: String(row.description ?? ''),
    priceText: String(row.price_text ?? ''),
    contact: String(row.contact ?? ''),
    status: String(row.status ?? 'pending') as ListingStatus,
    image: imageFromRow(row),
    careCount: Number(row.care_count ?? interests.length ?? 0),
    caredByCurrentUser: currentUserId
      ? interests.some((interest) => String((interest as Row).profile_id) === currentUserId)
      : false,
    payload: (row.payload as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? row.created_at ?? new Date().toISOString())
  };
}

async function ensureSupabaseProfile(event: RequestEvent, user: App.ArtemisUser) {
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

async function listSupabaseListings(event: RequestEvent, user?: App.ArtemisUser | null) {
  const supabase = createSupabaseServerClient(event);
  const { data, error: listError } = await supabase
    .from('marketplace_listings')
    .select('*, profiles:owner_profile_id(id,email,display_name,domain), marketplace_interests(profile_id)')
    .order('created_at', { ascending: false })
    .limit(60);

  if (listError) return listMemoryMarketplace(user);
  return (data ?? []).map((row) => listingFromRow(row as Row, user?.id));
}

export async function listMarketplace(event: RequestEvent, user?: App.ArtemisUser | null, query = '') {
  const listings = hasSupabaseConfig() ? await listSupabaseListings(event, user) : listMemoryMarketplace(user);
  return {
    listings: rankMarketplaceListings(listings, query),
    pendingListings: listings.filter((listing) => listing.status === 'pending')
  };
}

export async function createMarketplaceListing(event: RequestEvent, user: App.ArtemisUser, input: {
  id: string;
  name: string;
  quantity: number;
  description: string;
  priceText: string;
  contact: string;
  image?: ImageMetadata;
}) {
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
  return listingFromRow(data as Row, user.id);
}

export async function toggleMarketplaceCare(event: RequestEvent, user: App.ArtemisUser, listingId: string) {
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

export async function listMarketplaceAdmin(event: RequestEvent) {
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

export async function moderateMarketplaceListing(
  event: RequestEvent,
  actor: App.ArtemisUser,
  listingId: string,
  status: ListingStatus
) {
  if (!hasSupabaseConfig()) return updateMemoryListingStatus(listingId, status, actor);

  const supabase = hasSupabaseServiceConfig() ? createSupabaseServiceClient() : createSupabaseServerClient(event);
  const { data, error: updateError } = await supabase
    .from('marketplace_listings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', listingId)
    .select('*')
    .single();

  if (updateError) throw error(500, `Không thể cập nhật vật phẩm: ${updateError.message}`);
  return listingFromRow(data as Row, actor.id);
}
