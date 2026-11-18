/**
 * TEMPORARY INVESTIGATION SCRIPT — DO NOT COMMIT
 * Runs the same typecheck QA runs (tsc --noEmit -p tsconfig.app.json)
 * and prints every error verbatim.
 */
import { execSync } from 'node:child_process'

try {
  const out = execSync(
    '[ ! -f tsconfig.app.json ] || pnpm -s exec tsc --noEmit --pretty false -p tsconfig.app.json',
    { stdio: 'pipe', encoding: 'utf8' },
  )
  console.log('TYPECHECK OK (no output)')
  if (out.trim()) console.log(out)
} catch (e) {
  console.log('=== TYPECHECK FAILED ===')
  console.log(e.stdout?.toString?.() ?? '(no stdout)')
  console.log(e.stderr?.toString?.() ?? '(no stderr)')
  console.log('exit code:', e.status)
}
