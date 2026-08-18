export const imageUploadLimits = /** @type {const} */ ({
  maxBytes: 2 * 1024 * 1024,
  maxImagesPerRecord: 1,
  signedUrlTtlSeconds: 60 * 10,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
});

export const freshnessTargets = /** @type {const} */ ({
  notificationPollMs: 15000,
  adminQueuePollMs: 15000,
  maxAcceptedFreshnessMs: 30000
});

export const abuseLimits = /** @type {const} */ ({
  reportsPerUserPerDay: 20,
  listingsPerUserPerDay: 10,
  interestsPerUserPerDay: 60
});
