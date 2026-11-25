#!/usr/bin/env node
// 🔍️ Descobre os projetos do repositório para a matriz do CI.
//    Override manual: .github/ci-projects.json → [{ "dir": "apps/web", "stack": "node" }]
const fs = require('fs');
const path = require('path');
const IGNORE = new Set(['vendor', 'node_modules', '.git', '.venv', 'venv', 'build', 'dist', '.dart_tool', '.next', 'coverage', '.github']);
const MARKERS = { 'package.json': 'node', 'pyproject.toml': 'python', 'pubspec.yaml': 'flutter', 'composer.json': 'php' };

function detect(root = '.', maxDepth = 3) {
  const override = path.join(root, '.github/ci-projects.json');
  if (fs.existsSync(override)) return JSON.parse(fs.readFileSync(override, 'utf8'));
  const out = [];
  const pnpmWorkspace = fs.existsSync(path.join(root, 'pnpm-workspace.yaml'));
  (function walk(dir, depth) {
    const entries = fs.readdirSync(path.join(root, dir), { withFileTypes: true });
    for (const [file, stack] of Object.entries(MARKERS)) {
      if (!entries.some((e) => e.isFile() && e.name === file)) continue;
      if (stack === 'node' && pnpmWorkspace && dir !== '.') continue; // workspace roda pela raiz
      out.push({ dir, stack });
    }
    if (depth >= maxDepth) return;
    for (const e of entries) if (e.isDirectory() && !IGNORE.has(e.name) && !e.name.startsWith('.')) walk(dir === '.' ? e.name : `${dir}/${e.name}`, depth + 1);
  })('.', 0);
  return out;
}

// ⏱️ Só os projetos tocados pelo PR. Mudança "global" (CI, lockfile raiz, config compartilhada) roda todos.
const GLOBAL = [/^\.github\/workflows\/ci\.yml$/, /^\.github\/scripts\/(coverage|projects)\.js$/, /^\.github\/ci-projects\.json$/,
  /^pnpm-(lock|workspace)\.yaml$/, /^uv\.lock$/, /^composer\.lock$/, /^(tsconfig|biome)(\.base)?\.json$/, /^\.(nvmrc|node-version|python-version)$/];
const DOCS_ONLY = /(\.md$|^docs\/|^\.github\/(ISSUE_TEMPLATE|PULL_REQUEST_TEMPLATE)\/|^LICENSE)/;

function changedOnly(list, changed) {
  if (changed.some((f) => GLOBAL.some((re) => re.test(f)))) return list;
  const nested = list.filter((p) => p.dir !== '.').map((p) => p.dir + '/');
  return list.filter((p) => p.dir === '.'
    ? changed.some((f) => !DOCS_ONLY.test(f) && !nested.some((d) => f.startsWith(d)))
    : changed.some((f) => f.startsWith(p.dir + '/') && !DOCS_ONLY.test(f)));
}

if (require.main === module) {
  let list = detect();
  const i = process.argv.indexOf('--base');
  if (i >= 0 && process.argv[i + 1]) {
    const { execSync } = require('child_process');
    const changed = execSync(`git diff --name-only origin/${process.argv[i + 1]}...HEAD`, { encoding: 'utf8' }).split('\n').filter(Boolean);
    const all = list.length;
    list = changedOnly(list, changed);
    console.error(`⏱️ ${list.length}/${all} projeto(s) afetados por ${changed.length} arquivo(s) alterados`);
  }
  console.log(`matrix=${JSON.stringify(list)}`);
  console.error(`🔍️ ${list.length} projeto(s): ${list.map((p) => `${p.stack}:${p.dir}`).join(', ') || 'nenhum'}`);
}
module.exports = { detect, changedOnly };
