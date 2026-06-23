import { error, type RequestEvent } from '@sveltejs/kit';
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
import type { FoundItem, ImageMetadata, LostItem, ProfileSummary, ReportStatus } from '$lib/shared/types/domain';

type ReportKind = 'lost' | 'found';
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
    id: String(row.owner_profile_id ?? row.finder_profile_id ?? profile?.id ?? fallback?.id ?? 'unknown'),
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

function lostFromRow(row: Row, fallback?: ProfileSummary): LostItem {
  return {
    id: String(row.id),
    owner: profileFromRow(row, fallback),
    description: String(row.description ?? ''),
    lostAtText: String(row.occurred_at_text ?? ''),
    status: String(row.status ?? 'open') as ReportStatus,
    image: imageFromRow(row),
    payload: (row.payload as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? row.created_at ?? new Date().toISOString())
  };
}

function foundFromRow(row: Row, fallback?: ProfileSummary): FoundItem {
  return {
    id: String(row.id),
    finder: profileFromRow(row, fallback),
    description: String(row.description ?? ''),
    foundAtText: String(row.occurred_at_text ?? ''),
    location: String(row.location ?? ''),
    status: String(row.status ?? 'open') as ReportStatus,
    image: imageFromRow(row),
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

async function listSupabaseReports(event: RequestEvent, user?: App.ArtemisUser | null) {
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

  const lostItems = (lostResponse.data ?? []).map((row) => lostFromRow(row as Row, user ? profileFromUser(user) : undefined));
  const foundItems = (foundResponse.data ?? []).map((row) =>
    foundFromRow(row as Row, user ? profileFromUser(user) : undefined)
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
      payload: (row.payload as Record<string, unknown>) ?? {},
      createdAt: String(row.created_at)
    }))
  };
}

export async function listLostFoundDashboard(event: RequestEvent, user?: App.ArtemisUser | null) {
  if (!hasSupabaseConfig()) return listMemoryLostFound(user);
  return listSupabaseReports(event, user);
}

export async function createLostReport(event: RequestEvent, user: App.ArtemisUser, input: {
  id: string;
  description: string;
  lostAtText: string;
  image?: ImageMetadata;
}) {
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
  return { item: lostFromRow(data as Row, profileFromUser(user)), candidates: [] };
}

export async function createFoundReport(event: RequestEvent, user: App.ArtemisUser, input: {
  id: string;
  description: string;
  foundAtText: string;
  location: string;
  image?: ImageMetadata;
}) {
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
  return { item: foundFromRow(data as Row, profileFromUser(user)), candidates: [] };
}

export async function listLostFoundAdmin(event: RequestEvent) {
  const dashboard = await listLostFoundDashboard(event, event.locals.user);
  return {
    ...dashboard,
    openLostCount: dashboard.lostItems.filter((item) => item.status === 'open').length,
    openFoundCount: dashboard.foundItems.filter((item) => item.status === 'open').length,
    matchCount: dashboard.matches.length
  };
}

export async function updateReportStatus(
  event: RequestEvent,
  actor: App.ArtemisUser,
  kind: ReportKind,
  id: string,
  status: ReportStatus
) {
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
  return kind === 'lost' ? lostFromRow(data as Row) : foundFromRow(data as Row);
}
