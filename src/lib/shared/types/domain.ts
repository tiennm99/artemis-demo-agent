export type ProductScope = 'vutrudodac' | 'phienchotrenmay';

export type MatchLevel = 'strong' | 'near' | 'none';

export interface ProfileSummary {
  id: string;
  email: string;
  displayName: string;
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
  imagePath: string;
}
