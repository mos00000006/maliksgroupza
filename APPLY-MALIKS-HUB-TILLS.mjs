/** Maliks Group Hub — Sales/Tills GitHub-safe merge utility.
 * Run from the Hub repository root: node APPLY-MALIKS-HUB-TILLS.mjs
 * This does not deploy, enable checkout or modify financial/stock data.
 */
import { existsSync, readFileSync, mkdirSync, copyFileSync, rmSync, appendFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const root = process.cwd();
const packageRoot = dirname(fileURLToPath(import.meta.url));
const sourceFiles = [
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
const duplicatePaths = sourceFiles.map(path => 'new-files/' + path);

function git(args, allowFailure = false) {
  const p = spawnSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true });
  if (p.error) throw new Error('Git is required: ' + p.error.message);
  if (!allowFailure && p.status !== 0) throw new Error(`git ${args.join(' ')} failed:\n${p.stderr || p.stdout}`);
  return p;
}
function fail(message) { throw new Error(message); }

try {
  for (const required of ['package.json', 'worker/index.ts', 'app/page.tsx', '.git']) {
    if (!existsSync(join(root, required))) fail(`Run this from the Maliks Hub Git repository root (missing ${required}).`);
  }
  const packageRelative = relative(root, packageRoot);
  if (packageRelative && !packageRelative.startsWith('..' + sep) && packageRelative !== '..') {
    fail('The extracted patch folder is INSIDE the repository. Move it outside the Hub, or copy the CONTENTS of the ZIP directly into the repository root before running this command.');
  }
  for (const path of sourceFiles) {
    if (!existsSync(join(packageRoot, path))) fail(`Patch package is incomplete: ${path}`);
  }
  const patchPath = join(packageRoot, 'hub-tills-assignment.patch');
  if (!existsSync(patchPath)) fail('hub-tills-assignment.patch is missing.');

  // Existing Hub files are updated via a guarded Git patch only.
  // Reverse check identifies an already-installed integration: do not apply twice.
  const installed = git(['apply', '--reverse', '--check', patchPath], true).status === 0;
  if (installed) {
    console.log('Hub role/menu/Worker changes: already applied. Skipping duplicate patch.');
  } else {
    const compatible = git(['apply', '--check', patchPath], true);
    if (compatible.status !== 0) {
      fail('Your existing Hub source differs from the known integration patch. No files were changed.\n' +
        'Do NOT force or overwrite app/page.tsx, worker/index.ts, app/api/access.ts or app/api/team/route.ts.\n' +
        (compatible.stderr || compatible.stdout));
    }
    git(['apply', patchPath]);
    console.log('Hub role/menu/Worker changes: applied.');
  }

  const backupRoot = join(tmpdir(), 'maliks-hub-tills-backup-' + new Date().toISOString().replaceAll(/[:.]/g, '-'));
  let backedUp = 0;
  let copied = 0;
  if (resolve(packageRoot) !== resolve(root)) {
    for (const path of sourceFiles) {
      const destination = join(root, path);
      if (existsSync(destination)) {
        const backup = join(backupRoot, path);
        mkdirSync(dirname(backup), { recursive: true });
        copyFileSync(destination, backup);
        backedUp++;
      }
      mkdirSync(dirname(destination), { recursive: true });
      copyFileSync(join(packageRoot, path), destination);
      copied++;
    }
    console.log(`Installed ${copied} files at app/ and tests/. Existing copies backed up: ${backedUp}.`);
  } else {
    console.log('Corrected files are already in the Hub root (pasted directly).');
  }

  // Only remove the known outdated files left by the original ZIP. Do not
  // touch unrelated folders under new-files/, app/, or existing Hub modules.
  let removed = 0;
  for (const path of duplicatePaths) {
    const absolute = join(root, path);
    if (!existsSync(absolute)) continue;
    const backup = join(backupRoot, 'staging', path);
    mkdirSync(dirname(backup), { recursive: true });
    copyFileSync(absolute, backup);
    const tracked = git(['ls-files', '--error-unmatch', '--', path], true).status === 0;
    if (tracked) git(['rm', '-f', '--', path]);
    else rmSync(absolute, { force: true });
    removed++;
  }
  if (removed) console.log(`Removed ${removed} known duplicate staging files from new-files/ (backed up outside repository).`);

  const ignorePath = join(root, '.gitignore');
  const ignoreContents = existsSync(ignorePath) ? readFileSync(ignorePath, 'utf8') : '';
  if (!/^\/new-files\/?\s*$/m.test(ignoreContents)) {
    appendFileSync(ignorePath, '\n# Temporary ZIP installation staging, never live source\n/new-files/\n');
    console.log('Added /new-files/ to .gitignore.');
  }
  if (backedUp || removed) console.log('Backup directory: ' + backupRoot);
  console.log('\nPatch application complete. NEXT:');
  console.log('  npm run check');
  console.log('  npm run build');
  console.log('  git status');
  console.log('Do not push to the live branch until the tests and build have passed.');
} catch (error) {
  console.error('\nINSTALL STOPPED SAFELY: ' + (error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
}
