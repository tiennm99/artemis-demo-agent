export type ProductScope = 'vutrudodac' | 'phienchotrenmay';
export type AdminScope = ProductScope | 'global';

export type MatchLevel = 'strong' | 'near' | 'none';
export type ReportStatus = 'open' | 'matched' | 'returned' | 'closed' | 'hidden';
export type ListingStatus = 'pending' | 'approved' | 'rejected' | 'hidden' | 'passed';
export type NotificationType = 'radar' | 'match' | 'marketplace' | 'admin';

export interface ProfileSummary {
  id: string;
  email: string;
  displayName: string;
  domain: string;
  verifiedEmail: boolean;
}

export interface LostItemDraft {
  description: string;
  lostAtText: string;
  imagePath?: string;
}

export interface FoundItemDraft {
  description: string;
  foundAtText: string;
  location: string;
  imagePath?: string;
}

export interface MarketplaceListingDraft {
  name: string;
  quantity: number;
  description: string;
  priceText: string;
  contact: string;
  imagePath?: string;
}

export interface ImageMetadata {
  path: string;
  bucket: string;
  mimeType: string;
  size: number;
  originalName: string;
  url?: string;
}

export interface LostItem {
  id: string;
  owner: ProfileSummary;
  description: string;
  lostAtText: string;
  status: ReportStatus;
  image?: ImageMetadata;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FoundItem {
  id: string;
  finder: ProfileSummary;
  description: string;
  foundAtText: string;
  location: string;
  status: ReportStatus;
  image?: ImageMetadata;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MatchCandidate {
  id: string;
  lostItemId: string;
  foundItemId: string;
  score: number;
  level: Exclude<MatchLevel, 'none'>;
  createdAt: string;
}

export interface MarketplaceListing {
  id: string;
  owner: ProfileSummary;
  name: string;
  quantity: number;
  description: string;
  priceText: string;
  contact: string;
  status: ListingStatus;
  image?: ImageMetadata;
  careCount: number;
  caredByCurrentUser: boolean;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  type: NotificationType;
  message: string;
  readAt: string | null;
  deliveryKey: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface AdminAction {
  id: string;
  actor: ProfileSummary;
  scope: AdminScope;
  action: string;
  targetType: string;
  targetId: string;
  payload: Record<string, unknown>;
  createdAt: string;
}
