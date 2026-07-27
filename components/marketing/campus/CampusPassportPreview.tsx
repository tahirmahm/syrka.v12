import { PassportWalletCard } from '@/components/passport/PassportWalletCard'
import { generatePassportQrSvg } from '@/lib/utilities/qr'

/**
 * The real, reconstructed Career Passport wallet card, fed synthetic
 * marketing-demo data — the same component students see, not a screenshot
 * or a miniature inside a feature card.
 */
export async function CampusPassportPreview() {
  const qrSvgMarkup = await generatePassportQrSvg('https://campus.syrka.app/verify/passport/demo-passport-1')

  return (
    <PassportWalletCard
      holderName="Jordan Rivera"
      initials="JR"
      passportId="demo-passport-1"
      institutionName="Meridian University"
      programmeName="BSc Computer Science"
      issueDate="Demonstration data"
      version={3}
      verificationLabel="Institutionally reviewed"
      qrSvgMarkup={qrSvgMarkup}
      verifyUrl="https://campus.syrka.app/verify/passport/demo-passport-1"
    />
  )
}
