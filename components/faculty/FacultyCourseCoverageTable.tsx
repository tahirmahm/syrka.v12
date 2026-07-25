import { Badge } from '@/components/ui/Badge'
import type { CourseCapabilityCoverage } from '@/lib/campus-types'

export function FacultyCourseCoverageTable({ coverage }: { coverage: CourseCapabilityCoverage[] }) {
  return (
    <div className="overflow-x-auto rounded-campus-md border border-campus-border">
      <table className="w-full text-left font-campus-sans text-campus-sm">
        <caption className="sr-only">Capability coverage for this course — intended versus observed Evidence</caption>
        <thead className="border-b border-campus-border bg-campus-surface-raised">
          <tr>
            <th scope="col" className="px-4 py-2 font-medium text-campus-text">
              Capability
            </th>
            <th scope="col" className="px-4 py-2 font-medium text-campus-text">
              Intended
            </th>
            <th scope="col" className="px-4 py-2 font-medium text-campus-text">
              Evidence produced
            </th>
            <th scope="col" className="px-4 py-2 font-medium text-campus-text">
              Awaiting review
            </th>
            <th scope="col" className="px-4 py-2 font-medium text-campus-text">
              Requirement
            </th>
          </tr>
        </thead>
        <tbody>
          {coverage.map((row) => (
            <tr key={row.capabilityId} className="border-b border-campus-border last:border-0">
              <td className="px-4 py-3 font-medium text-campus-text">{row.capabilityName}</td>
              <td className="px-4 py-3">
                <Badge tone={row.intended ? 'blue' : 'neutral'}>{row.intended ? 'Yes' : 'Not formally tracked'}</Badge>
              </td>
              <td className="px-4 py-3">
                <Badge tone={row.evidenceProducedCount > 0 ? 'green' : 'amber'}>{row.evidenceProducedCount}</Badge>
              </td>
              <td className="px-4 py-3 text-campus-muted">{row.claimsAwaitingReview}</td>
              <td className="px-4 py-3 text-campus-muted">{row.evidenceRequirementDescription}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
