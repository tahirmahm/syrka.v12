export type OdysseyProviderErrorKind = 'timeout' | 'rate_limited' | 'unavailable' | 'malformed_response' | 'unknown'

/** Thrown by provider adapters only — never rendered directly; callers map it to a safe OdysseyGenerationResult. */
export class OdysseyProviderError extends Error {
  kind: OdysseyProviderErrorKind
  constructor(kind: OdysseyProviderErrorKind, message: string) {
    super(message)
    this.name = 'OdysseyProviderError'
    this.kind = kind
  }
}
