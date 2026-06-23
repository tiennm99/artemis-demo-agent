import type {
  AdminAction,
  AdminScope,
  FoundItem,
  ImageMetadata,
  ListingStatus,
  LostItem,
  MarketplaceListing,
  MatchCandidate,
  Notification,
  NotificationType,
  ProfileSummary,
  ReportStatus
} from '$lib/shared/types/domain';
import { findCandidateMatches } from '$lib/server/domain/lost-found/matching';

function randomId() {
  return globalThis.crypto.randomUUID();
}

interface MarketplaceInterest {
  listingId: string;
  profileId: string;
  createdAt: string;
}

export interface ArtemisMemoryState {
  profiles: ProfileSummary[];
  lostItems: LostItem[];
  foundItems: FoundItem[];
  matchCandidates: MatchCandidate[];
  listings: MarketplaceListing[];
  interests: MarketplaceInterest[];
  notifications: Notification[];
  adminActions: AdminAction[];
}

const now = () => new Date().toISOString();

const starterProfile: ProfileSummary = {
  id: 'seed-starter',
  email: 'starter@example.com',
  displayName: 'starter',
  domain: 'starter',
  verifiedEmail: true
};

function emptyState(): ArtemisMemoryState {
  return {
    profiles: [starterProfile],
    lostItems: [
      {
        id: 'seed-lost-water-bottle',
        owner: starterProfile,
        description: 'Bình nước màu xanh có sticker mặt trăng Artemis',
        lostAtText: 'Chiều thứ sáu ở pantry tầng 12',
        status: 'open',
        payload: { seed: true },
        createdAt: '2026-06-21T09:00:00.000Z',
        updatedAt: '2026-06-21T09:00:00.000Z'
      }
    ],
    foundItems: [
      {
        id: 'seed-found-water-bottle',
        finder: starterProfile,
        description: 'Bình nước xanh dán sticker hình trăng',
        foundAtText: 'Cuối ngày thứ sáu',
        location: 'Pantry tầng 12',
        status: 'open',
        payload: { seed: true },
        createdAt: '2026-06-21T10:00:00.000Z',
        updatedAt: '2026-06-21T10:00:00.000Z'
      }
    ],
    matchCandidates: [],
    listings: [
      {
        id: 'seed-market-keyboard',
        owner: starterProfile,
        name: 'Bàn phím cơ mini',
        quantity: 1,
        description: 'Layout nhỏ gọn, switch êm, hợp góc làm việc trên mây.',
        priceText: '250k hoặc đổi trà sữa',
        contact: 'starter@example.com',
        status: 'approved',
        careCount: 3,
        caredByCurrentUser: false,
        payload: { seed: true },
        createdAt: '2026-06-20T08:30:00.000Z',
        updatedAt: '2026-06-20T08:30:00.000Z'
      }
    ],
    interests: [],
    notifications: [],
    adminActions: []
  };
}

const memoryState = emptyState();
memoryState.matchCandidates = findCandidateMatches(memoryState.lostItems, memoryState.foundItems);

function toProfile(user: App.ArtemisUser): ProfileSummary {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    domain: user.domain,
    verifiedEmail: user.verifiedEmail
  };
}

function ensureProfile(user: App.ArtemisUser) {
  const existing = memoryState.profiles.find((profile) => profile.id === user.id);
  const next = toProfile(user);

  if (existing) {
    Object.assign(existing, next);
    return existing;
  }

  memoryState.profiles.push(next);
  return next;
}

function upsertMatchCandidates(candidates: MatchCandidate[]) {
  for (const candidate of candidates) {
    const existing = memoryState.matchCandidates.find(
      (match) => match.lostItemId === candidate.lostItemId && match.foundItemId === candidate.foundItemId
    );
    if (existing) {
      existing.score = Math.max(existing.score, candidate.score);
      existing.level = candidate.level;
      continue;
    }
    memoryState.matchCandidates.push(candidate);
  }
}

export function getMemoryState() {
  return memoryState;
}

export function resetMemoryStateForTests() {
  const next = emptyState();
  memoryState.profiles = next.profiles;
  memoryState.lostItems = next.lostItems;
  memoryState.foundItems = next.foundItems;
  memoryState.matchCandidates = findCandidateMatches(next.lostItems, next.foundItems);
  memoryState.listings = next.listings;
  memoryState.interests = next.interests;
  memoryState.notifications = next.notifications;
  memoryState.adminActions = next.adminActions;
}

export function createMemoryLostItem(user: App.ArtemisUser, input: {
  id?: string;
  description: string;
  lostAtText: string;
  image?: ImageMetadata;
}) {
  const profile = ensureProfile(user);
  const timestamp = now();
  const item: LostItem = {
    id: input.id ?? randomId(),
    owner: profile,
    description: input.description,
    lostAtText: input.lostAtText,
    status: 'open',
    image: input.image,
    payload: {},
    createdAt: timestamp,
    updatedAt: timestamp
  };

  memoryState.lostItems.unshift(item);
  const candidates = findCandidateMatches([item], memoryState.foundItems);
  upsertMatchCandidates(candidates);
  for (const candidate of candidates) {
    createMemoryNotification(user.id, 'match', `Radar tìm thấy tín hiệu trả đồ gần với "${item.description}".`, {
      candidateId: candidate.id,
      lostItemId: candidate.lostItemId,
      foundItemId: candidate.foundItemId
    });
  }

  return { item, candidates };
}

export function createMemoryFoundItem(user: App.ArtemisUser, input: {
  id?: string;
  description: string;
  foundAtText: string;
  location: string;
  image?: ImageMetadata;
}) {
  const profile = ensureProfile(user);
  const timestamp = now();
  const item: FoundItem = {
    id: input.id ?? randomId(),
    finder: profile,
    description: input.description,
    foundAtText: input.foundAtText,
    location: input.location,
    status: 'open',
    image: input.image,
    payload: {},
    createdAt: timestamp,
    updatedAt: timestamp
  };

  memoryState.foundItems.unshift(item);
  const candidates = findCandidateMatches(memoryState.lostItems, [item]);
  upsertMatchCandidates(candidates);
  for (const candidate of candidates) {
    const lost = memoryState.lostItems.find((lostItem) => lostItem.id === candidate.lostItemId);
    if (!lost) continue;
    createMemoryNotification(lost.owner.id, 'match', `Radar có tín hiệu trả đồ gần với "${lost.description}".`, {
      candidateId: candidate.id,
      lostItemId: candidate.lostItemId,
      foundItemId: candidate.foundItemId
    });
  }

  return { item, candidates };
}

export function listMemoryLostFound(user?: App.ArtemisUser | null) {
  const profileId = user?.id;
  return {
    lostItems: memoryState.lostItems.filter((item) => item.status !== 'hidden').slice(0, 20),
    foundItems: memoryState.foundItems.filter((item) => item.status !== 'hidden').slice(0, 20),
    matches: memoryState.matchCandidates.slice(0, 20),
    notifications: profileId
      ? memoryState.notifications.filter((notification) => notification.recipientId === profileId).slice(0, 10)
      : []
  };
}

export function updateMemoryReportStatus(
  kind: 'lost' | 'found',
  id: string,
  status: ReportStatus,
  actor: App.ArtemisUser
) {
  const collection = kind === 'lost' ? memoryState.lostItems : memoryState.foundItems;
  const item = collection.find((entry) => entry.id === id);
  if (!item) return null;
  item.status = status;
  item.updatedAt = now();
  createMemoryAdminAction(actor, 'vutrudodac', `set-${kind}-${status}`, kind, id, { status });
  return item;
}

export function createMemoryListing(user: App.ArtemisUser, input: {
  id?: string;
  name: string;
  quantity: number;
  description: string;
  priceText: string;
  contact: string;
  image?: ImageMetadata;
}) {
  const profile = ensureProfile(user);
  const timestamp = now();
  const listing: MarketplaceListing = {
    id: input.id ?? randomId(),
    owner: profile,
    name: input.name,
    quantity: input.quantity,
    description: input.description,
    priceText: input.priceText,
    contact: input.contact,
    status: 'pending',
    image: input.image,
    careCount: 0,
    caredByCurrentUser: false,
    payload: {},
    createdAt: timestamp,
    updatedAt: timestamp
  };
  memoryState.listings.unshift(listing);
  createMemoryNotification(user.id, 'marketplace', `Vật phẩm "${listing.name}" đang chờ duyệt trên mây.`, {
    listingId: listing.id
  });
  return listing;
}

export function listMemoryMarketplace(user?: App.ArtemisUser | null) {
  const profileId = user?.id;
  return memoryState.listings.map((listing) => ({
    ...listing,
    caredByCurrentUser: Boolean(
      profileId &&
        memoryState.interests.some((interest) => interest.listingId === listing.id && interest.profileId === profileId)
    ),
    careCount:
      listing.careCount +
      memoryState.interests.filter((interest) => interest.listingId === listing.id).length
  }));
}

export function toggleMemoryMarketplaceInterest(user: App.ArtemisUser, listingId: string) {
  ensureProfile(user);
  const listing = memoryState.listings.find((entry) => entry.id === listingId);
  if (!listing) return null;

  const existingIndex = memoryState.interests.findIndex(
    (interest) => interest.listingId === listingId && interest.profileId === user.id
  );
  const cared = existingIndex === -1;

  if (existingIndex === -1) {
    memoryState.interests.push({ listingId, profileId: user.id, createdAt: now() });
    createMemoryNotification(listing.owner.id, 'marketplace', `${user.displayName} quan tâm "${listing.name}".`, {
      listingId
    });
  } else {
    memoryState.interests.splice(existingIndex, 1);
  }

  return {
    ...listing,
    caredByCurrentUser: cared,
    careCount: memoryState.interests.filter((interest) => interest.listingId === listing.id).length + listing.careCount
  };
}

export function updateMemoryListingStatus(id: string, status: ListingStatus, actor: App.ArtemisUser) {
  const listing = memoryState.listings.find((entry) => entry.id === id);
  if (!listing) return null;
  listing.status = status;
  listing.updatedAt = now();
  createMemoryNotification(listing.owner.id, 'admin', `Admin đã chuyển "${listing.name}" sang trạng thái ${status}.`, {
    listingId: id,
    status
  });
  createMemoryAdminAction(actor, 'phienchotrenmay', `set-listing-${status}`, 'marketplace_listing', id, { status });
  return listing;
}

export function createMemoryNotification(
  recipientId: string,
  type: NotificationType,
  message: string,
  payload: Record<string, unknown>
) {
  const deliveryKey = `${type}:${recipientId}:${JSON.stringify(payload)}`;
  const existing = memoryState.notifications.find((notification) => notification.deliveryKey === deliveryKey);
  if (existing) return existing;

  const notification: Notification = {
    id: randomId(),
    recipientId,
    type,
    message,
    readAt: null,
    deliveryKey,
    payload,
    createdAt: now()
  };
  memoryState.notifications.unshift(notification);
  return notification;
}

export function markMemoryNotificationRead(recipientId: string, notificationId: string) {
  const notification = memoryState.notifications.find(
    (entry) => entry.id === notificationId && entry.recipientId === recipientId
  );
  if (!notification) return null;
  notification.readAt = now();
  return notification;
}

export function createMemoryAdminAction(
  actor: App.ArtemisUser,
  scope: AdminScope,
  action: string,
  targetType: string,
  targetId: string,
  payload: Record<string, unknown>
) {
  const adminAction: AdminAction = {
    id: randomId(),
    actor: ensureProfile(actor),
    scope,
    action,
    targetType,
    targetId,
    payload,
    createdAt: now()
  };
  memoryState.adminActions.unshift(adminAction);
  return adminAction;
}
