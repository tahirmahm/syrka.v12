/**
 * The pure invariant check: production must never run Learning
 * authoring against the in-memory repository. Factored out of
 * learning-ingestion-repository.ts's module-load-time guard so it can be
 * exercised directly with literal booleans — the real guard just calls
 * this and throws if it fails.
 */
export function assertRepositoryConfigurationSafe(isProduction: boolean, authoringEnabled: boolean): string[] {
  if (isProduction && authoringEnabled) {
    return [
      'Configuration failure: LEARNING_AUTHORING_ENABLED=true in production, but the only repository wired up is inMemoryLearningIngestionRepository (process-local, non-durable). Refusing to start. See the Learning Persistence and Tenancy Architecture Checkpoint for the required durable repository before enabling production authoring.',
    ]
  }
  return []
}
