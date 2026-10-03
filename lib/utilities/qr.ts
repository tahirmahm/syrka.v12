import QRCode from 'qrcode'

/**
 * Server-only QR generation for the Career Passport wallet card. Renders a
 * real, scannable QR (not a decorative placeholder) as inline SVG markup —
 * no client bundle cost, since this only ever runs in a server component.
 */
export async function generatePassportQrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { type: 'svg', margin: 1, width: 128, color: { dark: '#0c0a09', light: '#00000000' } })
}
