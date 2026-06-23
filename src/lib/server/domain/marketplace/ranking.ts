import type { MarketplaceListing } from '$lib/shared/types/domain';
import { normalizeSearchText, tokenizeReport } from '$lib/server/domain/lost-found/matching';

export interface RankedListing extends MarketplaceListing {
  rankScore: number;
}

export function marketplaceSearchScore(listing: MarketplaceListing, query: string) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return listing.careCount;

  const queryTokens = tokenizeReport(normalizedQuery);
  const searchable = tokenizeReport(`${listing.name} ${listing.description} ${listing.priceText}`);
  const searchableSet = new Set(searchable);
  const exactNameBoost = normalizeSearchText(listing.name).includes(normalizedQuery) ? 40 : 0;
  const tokenScore = queryTokens.reduce((score, token) => score + (searchableSet.has(token) ? 15 : 0), 0);

  return exactNameBoost + tokenScore + Math.min(20, listing.careCount * 2);
}

export function rankMarketplaceListings(listings: MarketplaceListing[], query = ''): RankedListing[] {
  return listings
    .filter((listing) => listing.status === 'approved')
    .map((listing) => ({ ...listing, rankScore: marketplaceSearchScore(listing, query) }))
    .sort((left, right) => {
      if (right.rankScore !== left.rankScore) return right.rankScore - left.rankScore;
      if (right.careCount !== left.careCount) return right.careCount - left.careCount;
      return right.createdAt.localeCompare(left.createdAt);
    });
}
