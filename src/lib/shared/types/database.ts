import type { AdminScope, ImageMetadata, ListingStatus, NotificationType, ReportStatus } from './domain';

export interface ArtemisDatabaseProfile {
  id: string;
  email: string;
  auth_provider: 'google';
  display_name: string | null;
  domain: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArtemisDatabaseReport {
  id: string;
  owner_profile_id: string;
  description: string;
  occurred_at_text: string;
  location: string | null;
  status: ReportStatus;
  image_metadata: ImageMetadata | null;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ArtemisDatabaseListing {
  id: string;
  owner_profile_id: string;
  name: string;
  quantity: number;
  description: string;
  price_text: string;
  contact: string;
  status: ListingStatus;
  image_metadata: ImageMetadata | null;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ArtemisDatabaseMatchCandidate {
  id: string;
  lost_item_id: string;
  found_item_id: string;
  score: number;
  level: 'strong' | 'near';
  payload: Record<string, unknown>;
  created_at: string;
}

export interface ArtemisDatabaseMarketplaceInterest {
  listing_id: string;
  profile_id: string;
  created_at: string;
}

export interface ArtemisDatabaseNotification {
  id: string;
  recipient_profile_id: string;
  type: NotificationType;
  message: string;
  delivery_key: string;
  read_at: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface ArtemisDatabaseAdminRole {
  profile_id: string;
  scope: AdminScope;
  created_at: string;
}
