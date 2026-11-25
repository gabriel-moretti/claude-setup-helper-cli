#!/usr/bin/env node
// Audit a repo's git history and release files with the kit validators (read-only).
// Usage: node audit_history.js [repo-root] [--commits 50] [--scripts <dir-with-lib/>]
// Uses <repo>/.github/scripts when present, else the skill copy in assets/core/.github/scripts.
// Output: Markdown sections appended to the detect_stacks.py report.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const root = path.resolve(args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--'))) || '.');
const limit = Number(opt('--commits', '50'));
const repoScripts = path.join(root, '.github/scripts');
const skillScripts = path.join(__dirname, '../assets/core/.github/scripts');
const scriptsDir = opt('--scripts', fs.existsSync(path.join(repoScripts, 'lib/gitmoji.js')) ? repoScripts : skillScripts);

const lib = (n) => require(path.join(scriptsDir, 'lib', n));
const gitmoji = lib('gitmoji');
const branch = lib('branch');
const changelog = lib('changelog');
const manifests = lib('manifests');
const sh = (c) => { try { return execSync(c, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64e6 }); } catch { return ''; } };

const OK = '✅', MISS = '❌', WARN = '⚠️';
const out = [];
const section = (title, rows) => { out.push(`### ${title}`, ...rows, ''); };

// Commits
const SEP = '\u001e';
const log = sh(`git log -n ${limit} --no-merges --format=%H%x1f%an%x1f%B${SEP}`).split(SEP).map((s) => s.trim()).filter(Boolean);
let bad = 0, ai = 0, conventional = 0;
const samples = [];
for (const entry of log) {
  const [sha, author, msg] = entry.split('\u001f');
  const r = gitmoji.validate(msg || '', { pr: true });
  if (r.skipped) continue;
  if (gitmoji.aiAttribution(msg).length || gitmoji.AI_TOOLS?.some?.((t) => new RegExp(`\\b${t}\\b`, 'i').test(author))) ai++;
  if (r.errors.length) {
    bad++;
    if (/^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?!?:/.test(msg)) conventional++;
    if (samples.length < 5) samples.push(`  - \`${sha.slice(0, 7)}\` ${msg.split('\n')[0].slice(0, 80)}`);
  }
}
section(`Commits (last ${log.length})`, log.length ? [
  `- ${bad ? MISS : OK} gitmoji spec: ${log.length - bad}/${log.length} valid` + (conventional ? ` — ${conventional} in Conventional Commits format (history stays; enforce from now on)` : ''),
  ...samples,
  `- ${ai ? MISS : OK} AI attribution: ${ai} commit(s) with AI trailers/mentions or AI-tool author`,
] : [`- ${WARN} no commits`]);

// Branches
const names = [...new Set([
  ...sh('git for-each-ref --format="%(refname:short)" refs/heads').split('\n'),
  ...sh('git for-each-ref --format="%(refname:lstrip=3)" refs/remotes').split('\n'),
].filter((n) => n && n !== 'HEAD'))];
const badBranches = names.map((n) => ({ n, r: branch.validate(n) })).filter((x) => !x.r.ok);
section('Branches', [
  `- ${names.includes('main') ? OK : MISS} trunk \`main\`` + (['test', 'sandbox'].filter((t) => names.includes(t)).length ? ` (+ ${['test', 'sandbox'].filter((t) => names.includes(t)).join(', ')})` : ''),
  `- ${badBranches.length ? MISS : OK} Conventional Branch: ${names.length - badBranches.length}/${names.length} valid`,
  ...badBranches.slice(0, 8).map((x) => `  - \`${x.n}\` — ${x.r.errors[0]}`),
]);

// Version + changelog + README
const v = manifests.version(root);
const clPath = path.join(root, 'CHANGELOG.md');
const clErrors = fs.existsSync(clPath) ? changelog.validate(fs.readFileSync(clPath, 'utf8'), v.version || undefined) : null;
const tags = sh('git tag --list "v*"').split('\n').filter(Boolean);
const bareTags = sh('git tag --list').split('\n').filter((t) => /^\d+\.\d+\.\d+/.test(t));
const badTags = tags.filter((t) => !/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-rc\.\d+)?$/.test(t) && !/^v\d+(\.\d+)?$/.test(t));
const readme = fs.existsSync(path.join(root, 'README.md')) ? fs.readFileSync(path.join(root, 'README.md'), 'utf8') : '';
section('Release', [
  `- ${v.error ? MISS : OK} VERSION / manifests: ${v.error || v.version}`,
  `- ${clErrors === null ? MISS : clErrors.length ? MISS : OK} CHANGELOG.md (Common Changelog)` + (clErrors === null ? ' — missing' : clErrors.length ? ` — ${clErrors.length} issue(s)` : ''),
  ...(clErrors || []).slice(0, 5).map((e) => `  - ${e}`),
  `- ${v.version && readme.includes(v.version) ? OK : WARN} README mentions current version`,
  `- ${badTags.length ? MISS : OK} tags: ${tags.length} \`v*\`` + (badTags.length ? `, non-SemVer: ${badTags.slice(0, 5).join(', ')}` : ''),
  ...(bareTags.length ? [`- ${WARN} ${bareTags.length} version tag(s) without \`v\` prefix (${bareTags.slice(-3).join(', ')}) — keep them; next release creates \`v<X.Y.Z>\` via the release flow`] : []),
]);

// Code/AI language (whole repo) — only when the repo already has the standards script
const standardsJs = path.join(repoScripts, 'standards.js');
if (fs.existsSync(standardsJs)) {
  let status = OK, detail = 'no findings';
  try { execSync(`node ${JSON.stringify(standardsJs)} --all`, { cwd: root, stdio: 'pipe', encoding: 'utf8' }); }
  catch (e) { status = MISS; detail = (e.stdout + e.stderr).split('\n').filter((l) => /::error|::warning|❌/.test(l)).length + ' finding line(s) — run `node .github/scripts/standards.js --all`'; }
  section('Standards (code English, AI files English, infra/DB policy)', [`- ${status} standards.js --all: ${detail}`]);
} else {
  section('Standards (code English, AI files English, infra/DB policy)', [`- ${MISS} .github/scripts/standards.js not installed — run after core is applied`]);
}

console.log(out.join('\n'));
