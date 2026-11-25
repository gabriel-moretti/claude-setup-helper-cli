#!/usr/bin/env node
// 📐 Check "standards": código em inglês · arquivos de IA em inglês · políticas de infra/banco/idiomas.
//   node standards.cjs --base main   → só linhas ADICIONADAS no PR (legado não trava ninguém)
//   node standards.cjs --all         → auditoria do repositório inteiro
const fs = require('fs');
const { execSync } = require('child_process');
const standards = require('./lib/standards.cjs');
const language = require('./lib/language.cjs');

const args = process.argv.slice(2);
const base = (() => { const i = args.indexOf('--base'); return i >= 0 ? args[i + 1] : null; })();
const all = args.includes('--all');
const sh = (c) => execSync(c, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const cfg = standards.load();

// { arquivo: [{ n, text }] } com as linhas a verificar
function collect() {
  const files = {};
  if (all) {
    for (const f of sh('git ls-files').split('\n').filter(Boolean)) {
      if (!fs.existsSync(f) || fs.statSync(f).size > 1e6) continue;
      files[f] = fs.readFileSync(f, 'utf8').split('\n').map((text, i) => ({ n: i + 1, text }));
    }
    return files;
  }
  let file = null, n = 0;
  for (const line of sh(`git diff -U0 --no-color --diff-filter=AM origin/${base}...HEAD`).split('\n')) {
    if (line.startsWith('+++ ')) { file = line.slice(4).replace(/^b\//, ''); files[file] = files[file] || []; continue; }
    const h = line.match(/^@@ -\S+ \+(\d+)/);
    if (h) { n = +h[1]; continue; }
    if (file && line.startsWith('+')) files[file].push({ n: n++, text: line.slice(1) });
  }
  return files;
}

const errors = [], warnings = [];
const files = collect();
const codeHits = [];
for (const [file, lines] of Object.entries(files)) {
  if (standards.matchAny(file, cfg.code.ignore)) continue;
  if (standards.matchAny(file, cfg.ai.files) && /\.(md|mdc|txt)$/.test(file) && fs.existsSync(file)) {
    const r = language.portugueseRatio(fs.readFileSync(file, 'utf8'));
    if (r.portuguese) errors.push(`🤖 \`${file}\` parece estar em português (${r.hits} palavras-função): arquivos para IA ficam em inglês`);
  }
  for (const hit of language.checkLines(file, lines, cfg.code.domainTerms)) codeHits.push({ file, ...hit });
}
const shown = codeHits.slice(0, 50).map((h) => `💻 \`${h.file}:${h.line}\` — \`${h.identifier}\` (${h.words.join(', ')})`);
if (codeHits.length > 50) shown.push(`… e mais ${codeHits.length - 50}`);
(cfg.code.enforcement === 'error' ? errors : warnings).push(...shown);

const p = standards.policy(cfg);
errors.push(...p.errors); warnings.push(...p.warnings);

const md = [`## 📐 Standards ${all ? '(repositório inteiro)' : `(linhas novas vs ${base})`}`, '',
  errors.length ? '### 🚧 Pendências' : '### ✅ Tudo dentro do padrão', ...errors.map((e) => `- ${e}`),
  ...(warnings.length ? ['', '### ⚠️ Avisos', ...warnings.map((w) => `- ${w}`)] : []),
  '', '<sub>Código em inglês · docs em ' + cfg.docs.languages.join(' + ') + ' · IA em inglês · hosting ' + cfg.infra.hosting + ' (' + cfg.infra.criticality + ') — ver CONTRIBUTING.md. Termos de domínio liberados em `.github/standards.json → code.domainTerms`.</sub>'].join('\n');
console.log(md);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n');
process.exit(errors.length ? 1 : 0);
