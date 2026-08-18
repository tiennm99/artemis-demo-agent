import { describe, expect, it, beforeEach } from 'vitest';
import {
  createMemoryNotification,
  resetMemoryStateForTests,
  toggleMemoryMarketplaceInterest,
  updateMemoryListingStatus
} from './memory-store';

/** @type {App.ArtemisUser} */
const user = {
  id: 'dev-user',
  email: 'dev@example.com',
  displayName: 'dev',
  domain: 'dev',
  verifiedEmail: true,
  authProvider: 'google'
};

describe('memory store idempotency helpers', () => {
  beforeEach(() => {
    resetMemoryStateForTests();
  });

  it('dedupes notifications by delivery key', () => {
    const first = createMemoryNotification('dev-user', 'match', 'Radar found a signal', { match: 'one' });
    const second = createMemoryNotification('dev-user', 'match', 'Radar found a signal', { match: 'one' });

    expect(second.id).toBe(first.id);
  });

  it('toggles marketplace care without duplicating interest rows', () => {
    const cared = toggleMemoryMarketplaceInterest(user, 'seed-market-keyboard');
    const removed = toggleMemoryMarketplaceInterest(user, 'seed-market-keyboard');

    expect(cared?.caredByCurrentUser).toBe(true);
    expect(removed?.caredByCurrentUser).toBe(false);
  });

  it('updates marketplace moderation status', () => {
    const listing = updateMemoryListingStatus('seed-market-keyboard', 'hidden', user);

    expect(listing?.status).toBe('hidden');
  });
});
