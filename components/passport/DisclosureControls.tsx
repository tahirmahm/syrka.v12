import type { DisclosureSettings, PassportAudience, LinkExpiryPreference } from '@/lib/campus-types'
import { Badge } from '@/components/ui/Badge'
import { AUDIENCE_LABELS, LINK_EXPIRY_LABELS } from '@/lib/constants/passport'

const AUDIENCES: PassportAudience[] = ['general', 'employer', 'graduate_programme', 'custom']
const EXPIRY_OPTIONS: LinkExpiryPreference[] = ['never', '7_days', '30_days', '90_days']

const TOGGLES: { key: keyof Pick<DisclosureSettings, 'includeIdentity' | 'includeCourseContext' | 'includeReviewerInfo' | 'excludeStaleClaims' | 'excludeRevokedClaims'>; label: string }[] = [
  { key: 'includeIdentity', label: 'Show my name to viewers' },
  { key: 'includeCourseContext', label: 'Include course context for each claim' },
  { key: 'includeReviewerInfo', label: 'Include reviewer/issuing information' },
  { key: 'excludeStaleClaims', label: 'Exclude stale claims' },
  { key: 'excludeRevokedClaims', label: 'Exclude revoked claims' },
]

export interface DisclosureControlsProps {
  settings: DisclosureSettings
  onChange: (settings: DisclosureSettings) => void
}

export function DisclosureControls({ settings, onChange }: DisclosureControlsProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <Badge tone="purple">Demo sharing configuration</Badge>
        <p className="mt-2 font-campus-sans text-campus-xs text-campus-muted">
          These controls are a frontend-only preview of disclosure preferences. Prepare share settings here; link generation will require backend integration.
        </p>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Included information</legend>
        {TOGGLES.map((toggle) => (
          <label key={toggle.key} className="flex items-center gap-2 font-campus-sans text-campus-sm text-campus-text">
            <input
              type="checkbox"
              checked={settings[toggle.key]}
              onChange={(e) => onChange({ ...settings, [toggle.key]: e.target.checked })}
              className="h-4 w-4 rounded-campus-sm border-campus-border text-campus-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
            />
            {toggle.label}
          </label>
        ))}
      </fieldset>

      <div>
        <label htmlFor="audience" className="mb-1.5 block font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">
          Intended audience
        </label>
        <select
          id="audience"
          value={settings.audience}
          onChange={(e) => onChange({ ...settings, audience: e.target.value as PassportAudience })}
          className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
        >
          {AUDIENCES.map((audience) => (
            <option key={audience} value={audience}>
              {AUDIENCE_LABELS[audience]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="expiry" className="mb-1.5 block font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">
          Link expiry preference
        </label>
        <select
          id="expiry"
          value={settings.linkExpiryPreference}
          onChange={(e) => onChange({ ...settings, linkExpiryPreference: e.target.value as LinkExpiryPreference })}
          className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
        >
          {EXPIRY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {LINK_EXPIRY_LABELS[option]}
            </option>
          ))}
        </select>
        <p className="mt-1 font-campus-sans text-campus-xs text-campus-muted">A stated preference only — no live link exists yet.</p>
      </div>
    </div>
  )
}
