/**
 * MALIKS GROUP HUB: narrow cleanup for GitHub ESLint failures caused by
 * obsolete copies under new-files/. Works on Windows with Node.js and Git.
 * It does NOT apply permissions, update checkout, or deploy anything.
 *
 * Run ONLY from the GitHub repository root:
 *     node ./FIX-MALIKS-HUB-CI.mjs
 */
import { existsSync, copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const sourcePaths = [
  'app/lib/tills-route-policy.ts',
  'app/api/tills/shared.ts',
  'app/api/tills/session/route.ts',
  'app/api/tills/catalogue/route.ts',
  'app/tills/page.tsx',
  'app/tills/till-checkout.tsx',
  'app/tills/tills.module.css',
  'tests/tills-access.test.mjs',
  'tests/tills-full-access.test.mjs',
];
const duplicates = sourcePaths.map((p) => `new-files/${p}`);
const runGit = (args) => {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true });
  if (result.error) throw new Error(`Git could not run: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${result.stderr || result.stdout}`);
  return result.stdout;
};

try {
  if (!existsSync(join(root, 'package.json')))
    throw new Error('Open the Maliks Hub project folder containing package.json before running this script.');
  if (!existsSync(join(root, '.git')))
    throw new Error('This folder is not a Git repository. Open the GitHub-connected Maliks Hub folder.');
  for (const path of ['app/tills/page.tsx', 'app/tills/till-checkout.tsx']) {
    if (!existsSync(join(root, path))) {
      throw new Error(`STOP: Actual Hub file ${path} does not exist. Install the corrected Sales/Tills integration before removing staging copies.`);
    }
  }

  const present = duplicates.filter((p) => existsSync(join(root, p)));
  const tracked = new Set(runGit(['ls-files', '--', ...duplicates]).trim().split(/\r?\n/).filter(Boolean).map((p) => p.replaceAll('\\', '/')));
  const affected = duplicates.filter((p) => present.includes(p) || tracked.has(p));
  if (!affected.length) {
    console.log('No obsolete Sales / Tills staging copies found. No files changed.');
  } else {
    const backupRoot = join(tmpdir(), `maliks-hub-ci-staging-backup-${Date.now()}`);
    // Backup before changing anything, including a copy that was edited after staging.
    for (const path of present) {
      const backup = join(backupRoot, path);
      mkdirSync(dirname(backup), { recursive: true });
      copyFileSync(join(root, path), backup);
    }
    // `git rm` stages the deletion, which is essential: .gitignore does NOT
    // stop GitHub Actions from linting a file that remains tracked in Git.
    for (const path of affected) {
      if (tracked.has(path)) {
        runGit(['rm', '-f', '--', path]);
        console.log(`Removed tracked staging copy: ${path}`);
      } else if (existsSync(join(root, path))) {
        rmSync(join(root, path));
        console.log(`Removed untracked staging copy: ${path}`);
      }
    }
    console.log(`Backups of pre-existing staging files: ${backupRoot}`);
  }
  console.log('\nLive files preserved: app/tills/page.tsx, app/tills/till-checkout.tsx');
  console.log('NEXT: npm run check');
  console.log('THEN: git status --short');
  console.log('THEN (if checks pass): git add -A && git commit -m "Remove obsolete tills staging files" && git push');
  console.log('GitHub Actions checks the PUSHED commit, not unpublished VS Code edits.');
} catch (error) {
  console.error(`\nSTOPPED SAFELY: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
