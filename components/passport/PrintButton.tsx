'use client'

import { Printer } from '@phosphor-icons/react/dist/ssr'
import { Button } from '@/components/ui/Button'

export function PrintButton() {
  return (
    <Button variant="secondary" size="sm" icon={<Printer size={16} aria-hidden="true" />} onClick={() => window.print()} className="print:hidden">
      Print or save as PDF
    </Button>
  )
}
