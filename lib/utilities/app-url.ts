/**
 * The stable, configured application base URL — used anywhere a link must
 * remain correct outside the request that generated it (a QR code, an
 * emailed link, a printed document), where deriving the destination from
 * the current request's Host header would be wrong the moment the page is
 * viewed from a different origin than it was rendered on.
 */
export function getAppBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL
  if (configured) return configured.replace(/\/$/, '')
  return process.env.NODE_ENV === 'production' ? 'https://campus.syrka.app' : 'http://localhost:3000'
}
