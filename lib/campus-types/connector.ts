import type { SourceCategory, ExternalConnection, SourceRefresh } from './profile'

/**
 * Provider-neutral connector model (Checkpoint §8). Stage A defines the
 * contract and the audit record only — no connector implements a live API
 * call yet (lib/services/profile/connectors.ts holds the Stage A
 * definitions/audits; live implementations are Stage C/D work, gated on
 * `implementationAllowed` below).
 */

export type ConnectorAuditStatus = 'audited' | 'stale' | 'not_audited'

/**
 * One audit per connector. Re-audit is required (1) immediately before
 * that connector's implementation, (2) immediately before production
 * release, (3) after a material terms/OAuth/API/permissions change, and
 * (4) after unexplained access failures suggesting a platform-policy
 * change — `nextAuditTrigger` names which of these applies next. This
 * record is a feasibility read, never a permanent legal clearance.
 */
export interface ConnectorAuditRecord {
  id: string
  sourceCategory: SourceCategory
  lastAuditedAt?: string
  auditStatus: ConnectorAuditStatus
  auditedBy?: string
  implementationAllowed: boolean
  officialDocumentationReference?: string
  termsReference?: string
  knownRestrictions: string[]
  requiredScopes: string[]
  retentionRequirements?: string
  deletionRequirements?: string
  commercialUseRestrictions?: string
  nextAuditTrigger: string
}

export type ConnectorIntegrationPath = 'official_oauth_api' | 'user_authorised_export' | 'document_upload' | 'native'

export interface ConnectorDefinition {
  sourceCategory: SourceCategory
  displayName: string
  integrationPath: ConnectorIntegrationPath
  auditId: string
}

/**
 * The one interface every connector implements, so no connector ships as
 * "an unrelated route with incompatible behaviour" (Checkpoint §9). Stage A
 * declares this contract only; nothing in this repository implements it
 * against a live external API yet.
 */
export interface ConnectorOperations {
  connect(studentId: string): Promise<ExternalConnection>
  disconnect(connectionId: string): Promise<void>
  inspectPermissions(connectionId: string): Promise<string[]>
  initialImport(connectionId: string): Promise<SourceRefresh>
  incrementalRefresh(connectionId: string): Promise<SourceRefresh>
  deleteImportedData(connectionId: string): Promise<void>
  reauthorise(connectionId: string): Promise<ExternalConnection>
  excludeRecord(sourceRecordId: string): Promise<void>
  includeRecord(sourceRecordId: string): Promise<void>
}
