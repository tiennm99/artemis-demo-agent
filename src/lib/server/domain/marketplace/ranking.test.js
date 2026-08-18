import { describe, expect, it } from 'vitest';
import { rankMarketplaceListings } from './ranking';

/** @typedef {import('$lib/shared/types/domain').MarketplaceListing} MarketplaceListing */

const owner = {
  id: 'starter-1',
  email: 'starter@example.com',
  displayName: 'starter',
  domain: 'starter',
  verifiedEmail: true
};

/**
 * @param {Partial<MarketplaceListing>} overrides
 * @returns {MarketplaceListing}
 */
function listing(overrides) {
  return {
    id: 'listing-1',
    owner,
    name: 'Bàn phím cơ',
    quantity: 1,
    description: 'Switch êm',
    priceText: '250k',
    contact: 'starter@example.com',
    status: 'approved',
    careCount: 0,
    caredByCurrentUser: false,
    payload: {},
    createdAt: '2026-06-20T08:00:00.000Z',
    updatedAt: '2026-06-20T08:00:00.000Z',
    ...overrides
  };
}

describe('marketplace ranking', () => {
  it('puts matching cloud cards ahead of unrelated listings', () => {
    const ranked = rankMarketplaceListings(
      [
        listing({ id: 'book', name: 'Sách clean code', description: 'Sách cũ', careCount: 5 }),
        listing({ id: 'keyboard', name: 'Bàn phím cơ mini', description: 'Layout nhỏ gọn' })
      ],
      'phim mini'
    );

    expect(ranked[0].id).toBe('keyboard');
  });

  it('hides pending listings from public ranking', () => {
    const ranked = rankMarketplaceListings([
      listing({ id: 'pending', status: 'pending' }),
      listing({ id: 'approved', status: 'approved' })
    ]);

    expect(ranked.map((item) => item.id)).toEqual(['approved']);
  });
});
