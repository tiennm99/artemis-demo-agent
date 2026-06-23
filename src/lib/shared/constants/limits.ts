export const imageUploadLimits = {
  maxBytes: 2 * 1024 * 1024,
  maxImagesPerRecord: 1,
  signedUrlTtlSeconds: 60 * 10,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
} as const;

export const freshnessTargets = {
  notificationPollMs: 15000,
  adminQueuePollMs: 15000,
  maxAcceptedFreshnessMs: 30000
} as const;

export const abuseLimits = {
  reportsPerUserPerDay: 20,
  listingsPerUserPerDay: 10,
  interestsPerUserPerDay: 60
} as const;
