import { describe, expect, it } from 'vitest';
import { footerAttribution, publicRoutes } from './app';

describe('Artemis app constants', () => {
  it('keeps required public routes and footer attribution', () => {
    expect(publicRoutes.map((route) => route.href)).toEqual([
      '/',
      '/vutrudodac',
      '/phienchotrenmay',
      '/account'
    ]);
    expect(footerAttribution).toContain('Made by miti99');
    expect(footerAttribution).toContain('iamminhnguyet.com');
  });
});
