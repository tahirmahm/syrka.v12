#!/usr/bin/env node
/**
 * Structural regression test: no runtime application module may import
 * anything from lib/validation/. This is the exact class of bug that broke
 * the deployed Preview — a filesystem-scanning validator imported by
 * lib/utilities/ncert-curriculum-projection.ts and
 * lib/services/learning/route-guard.ts crashed every request that touched
 * either module with `ENOENT: no such file or directory, scandir
 * '/var/task/app'`, because Vercel's serverless function bundle does not
 * contain the full repo source tree. Repository/architecture validators run
 * as standalone scripts (scripts/*.mjs, scripts/*.ts via tsx) instead.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const RUNTIME_ROOTS = ['app', 'components', 'lib'].map((d) => join(REPO_ROOT, d))
const FORBIDDEN_IMPORT_PATTERN = /import\s+['"]@\/lib\/validation\//

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === '.next') continue
      walk(full, out)
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full)
    }
  }
  return out
}

const violations = []
for (const root of RUNTIME_ROOTS) {
  for (const file of walk(root)) {
    const content = readFileSync(file, 'utf8')
    if (FORBIDDEN_IMPORT_PATTERN.test(content)) {
      violations.push(file.replace(REPO_ROOT + '/', ''))
    }
  }
}

if (violations.length > 0) {
  console.error('validate-architecture failed: runtime code imports lib/validation (a filesystem-scanning module) into the request graph:')
  for (const v of violations) console.error(`  - ${v}`)
  console.error('Repository/architecture validators belong under scripts/, run via npm run validate:*, never imported by app/components/lib.')
  process.exit(1)
}

console.log('validate-architecture: no runtime module imports lib/validation')
