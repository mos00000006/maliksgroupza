import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
const dir = dirname(fileURLToPath(import.meta.url));
const run = (args, cwd = dir) => spawnSync('git', args, { cwd, encoding: 'utf8' });
const root = run(['rev-parse', '--show-toplevel']);
if (root.status !== 0) throw new Error('Extract this folder inside your maliksgroupza Git repository.');
const repo = root.stdout.trim();
if (!existsSync(join(repo, 'app/catalogue.tsx')) || !existsSync(join(repo, 'infrastructure/wrangler.jsonc'))) throw new Error('Wrong repository. No changes made.');
const pending = [];
for (const name of ['catalogue-recovery.patch', 'r2-deployment-recovery.patch']) {
  const file = join(dir, name);
  if (run(['apply', '--reverse', '--check', file], repo).status === 0) {
    console.log(`${name}: already installed.`);
    continue;
  }
  const check = run(['apply', '--check', file], repo);
  if (check.status !== 0) throw new Error(`${name} conflicts with your current code. No changes made.\n${check.stderr}`);
  pending.push(file);
}
if (pending.length) {
  const apply = run(['apply', ...pending], repo);
  if (apply.status !== 0) throw new Error(apply.stderr || 'Git could not apply the patches.');
}
console.log('Recovery patch ready. No production resources changed. Run npm run check before pushing.');
console.log(run(['status', '--short', '--', 'app/catalogue.tsx', 'tests/catalogue-photo-print.test.mjs', '.github/workflows/deploy.yml', 'scripts/deploy-hub-r2-recovery.sh'], repo).stdout);
