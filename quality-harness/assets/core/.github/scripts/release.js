#!/usr/bin/env node
// 🔖 Release: valida PRs de release/hotfix e prepara tags.
//   node release.js check  --head <branch> --base <branch>     → valida o PR (SemVer, CHANGELOG, README, gitmoji)
//   node release.js info   --ref <branch>                      → outputs para o workflow de release
//   node release.js notes  <versão>                            → seção do CHANGELOG (notas da GitHub Release)
const fs = require('fs');
const { execSync } = require('child_process');
const semver = require('./lib/semver');
const gitmoji = require('./lib/gitmoji');
const changelog = require('./lib/changelog');
const manifests = require('./lib/manifests');
const branchLib = require('./lib/branch');
const standards = require('./lib/standards');

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const sh = (c) => { try { return execSync(c, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };
const read = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null);

const tags = () => sh('git tag --list "v*"').split('\n').filter(Boolean);
const latestStable = () => semver.latest(tags().map((t) => t.slice(1)).filter((v) => !semver.parse(v).pre.length));

// Bump mínimo exigido pelos gitmojis dos commits desde a última tag estável (campo semver do gitmoji)
function expectedBump(since, ref = 'HEAD') {
  const range = since ? `v${since}..${ref}` : ref;
  const subjects = sh(`git log ${range} --no-merges --format=%s`).split('\n').filter(Boolean);
  const kinds = subjects.map((s) => gitmoji.parseHeader(s).gitmoji?.semver || null);
  const driver = {};
  subjects.forEach((s, i) => { if (kinds[i] && !driver[kinds[i]]) driver[kinds[i]] = s; });
  return { kind: semver.maxBump(kinds), driver };
}

function check(head, base) {
  const errors = [], notes = [];
  const type = branchLib.validate(head).type;
  if (base !== 'main' || !['release', 'hotfix'].includes(type)) return { skip: true, errors, notes };

  const m = manifests.version();
  if (m.error) errors.push(`📦️ ${m.error}`);
  const version = m.version;
  if (type === 'release') {
    const bv = branchLib.releaseVersion(head);
    if (bv !== version) errors.push(`🔖 a branch diz ${bv} mas os manifestos dizem ${version} (${Object.keys(m.found).join(', ')})`);
  }
  if (version && !semver.valid(version)) errors.push(`🔖 "${version}" não é SemVer válido`);
  else if (version) {
    if (semver.parse(version).pre.length) errors.push('🔖 produção só recebe versões estáveis (sem -rc, -beta…)');
    const prev = latestStable();
    if (prev) {
      const actual = semver.bumpType(prev, version);
      if (!actual) errors.push(`🔖 ${version} precisa ser maior que a última versão em produção (${prev})`);
      const exp = expectedBump(prev);
      const need = semver.requiredBump(exp.kind, prev);
      if (actual && !semver.atLeast(actual, need))
        errors.push(`💥 os commits pedem bump **${need}** (ex.: "${exp.driver[exp.kind]}"), mas ${prev} → ${version} é ${actual}`);
      if (type === 'hotfix' && actual && actual !== 'patch') notes.push(`⚠️ hotfix com bump ${actual} — confira se não deveria ser uma release`);
      notes.push(`Última versão em produção: ${prev} → ${version} (${actual || '?'})`);
    } else notes.push(`Primeira versão em produção: ${version}`);
  }

  const cl = read('CHANGELOG.md');
  if (!cl) errors.push('📝 CHANGELOG.md não existe');
  else for (const e of changelog.validate(cl, version)) errors.push(`📝 CHANGELOG: ${e}`);

  const changed = sh(`git diff --name-only origin/${base}...HEAD`).split('\n');
  if (!changed.includes('CHANGELOG.md')) errors.push('📝 CHANGELOG.md não foi alterado neste PR');
  // 📖 README de cada idioma do projeto: README.md (principal) + README.<idioma>.md
  const langs = standards.load().docs.languages || [];
  const readmes = ['README.md', ...langs.slice(1).map((l) => `README.${l}.md`)];
  for (const f of readmes) {
    if (!changed.includes(f)) errors.push(`📖 ${f} não foi atualizado neste PR (obrigatório em toda release)`);
    const text = read(f) || '';
    if (version && !text.includes(version)) errors.push(`📖 ${f} não menciona a versão ${version}`);
  }
  return { version, errors, notes };
}

function info(ref) {
  const out = {};
  const remoteHas = (b) => sh(`git ls-remote --heads origin ${b}`) !== '';
  if (ref === 'main') {
    const m = manifests.version();
    if (m.error || !semver.valid(m.version)) throw new Error(m.error || `versão inválida ${m.version}`);
    Object.assign(out, { version: m.version, tag: `v${m.version}`, prerelease: 'false', environment: 'production' });
  } else {
    const v = branchLib.releaseVersion(ref);
    if (!v || !semver.valid(v)) throw new Error(`branch de release inválida: ${ref}`);
    const n = tags().filter((t) => t.startsWith(`v${v}-rc.`)).length + 1;
    Object.assign(out, { version: `${v}-rc.${n}`, tag: `v${v}-rc.${n}`, prerelease: 'true', environment: remoteHas('test') ? 'test' : 'sandbox' });
  }
  out.exists = tags().includes(out.tag) ? 'true' : 'false';
  const p = semver.parse(out.version);
  out.major_tag = `v${p.major}`;
  out.minor_tag = `v${p.major}.${p.minor}`;
  out.trunks = ['test', 'sandbox'].filter(remoteHas).join(' ');
  return out;
}

function notes(version) {
  const base = version.replace(/-rc\.\d+$/, '');
  const s = changelog.section(read('CHANGELOG.md') || '', base);
  return s || `_Release candidate de ${base}. Ainda sem entrada no CHANGELOG._`;
}

if (require.main === module) {
  const cmd = args[0];
  try {
    if (cmd === 'check') {
      const r = check(opt('--head'), opt('--base'));
      if (r.skip) { console.log('ℹ️ Não é PR de release/hotfix para main — nada a validar.'); process.exit(0); }
      const md = [`## 🔖 Release check — ${r.version || '?'}`, ...r.notes.map((n) => `- ${n}`), '',
        r.errors.length ? '### 🚧 Pendências' : '### ✅ Tudo certo para produção', ...r.errors.map((e) => `- ${e}`)].join('\n');
      console.log(md);
      if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n');
      process.exit(r.errors.length ? 1 : 0);
    } else if (cmd === 'info') {
      for (const [k, v] of Object.entries(info(opt('--ref')))) console.log(`${k}=${v}`);
    } else if (cmd === 'notes') {
      console.log(notes(args[1]));
    } else { console.error('comandos: check | info | notes'); process.exit(2); }
  } catch (e) { console.error(`::error::${e.message}`); process.exit(1); }
}
module.exports = { check, info, notes, expectedBump };
