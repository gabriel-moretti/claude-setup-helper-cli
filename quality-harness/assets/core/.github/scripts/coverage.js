#!/usr/bin/env node
// 📊 Gate de cobertura a partir de lcov (Jest/Vitest, pytest-cov, flutter test --coverage).
//    Uso: node coverage.js <lcov.info | clover.xml> --min 75 [--label app] [--advisory]
//    Clover (PHPUnit/Pest --coverage-clover): usa as métricas do <project> (statements ≈ linhas).
const fs = require('fs');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const file = args[0];
const min = Number(opt('--min', '75'));
const label = opt('--label', '.');
const advisory = args.includes('--advisory');

function lcov(text) {
  let lf = 0, lh = 0, bf = 0, bh = 0;
  for (const l of text.split('\n')) {
    const [k, v] = l.split(':');
    if (k === 'LF') lf += +v; else if (k === 'LH') lh += +v; else if (k === 'BRF') bf += +v; else if (k === 'BRH') bh += +v;
  }
  return { lines: lf ? (lh / lf) * 100 : 0, branches: bf ? (bh / bf) * 100 : null, lf };
}

function clover(text) {
  const metrics = [...text.matchAll(/<metrics\b([^>]*)\/?>/g)].map((m) => m[1]);
  const attr = (a, k) => { const m = a.match(new RegExp(`\\b${k}="(\\d+)"`)); return m ? +m[1] : 0; };
  // métricas do projeto (têm o atributo files=); sem elas, soma as de arquivo (têm loc=)
  const project = metrics.filter((a) => /\bfiles="/.test(a)).pop();
  const pick = project ? [project] : metrics.filter((a) => /\bloc="/.test(a));
  let sf = 0, sh = 0, cf = 0, ch = 0;
  for (const a of pick) { sf += attr(a, 'statements'); sh += attr(a, 'coveredstatements'); cf += attr(a, 'conditionals'); ch += attr(a, 'coveredconditionals'); }
  return { lines: sf ? (sh / sf) * 100 : 0, branches: cf ? (ch / cf) * 100 : null, lf: sf };
}
const isClover = (text) => /<coverage\b/.test(text) && /<metrics\b/.test(text);
const parse = (text) => (isClover(text) ? clover(text) : lcov(text));

if (require.main === module) {
  if (!file || !fs.existsSync(file)) {
    console.log(`::error::📊 ${label}: relatório de cobertura não encontrado em ${file} (gere em lcov)`);
    process.exit(advisory ? 0 : 1);
  }
  const c = parse(fs.readFileSync(file, 'utf8'));
  const ok = c.lf > 0 && c.lines >= min;
  const line = `| ${ok ? '✅' : '❌'} | \`${label}\` | ${c.lines.toFixed(2)}% | ${c.branches === null ? '—' : c.branches.toFixed(2) + '%'} | ${min}% |`;
  if (process.env.GITHUB_STEP_SUMMARY)
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### 📊 Cobertura\n| | Projeto | Linhas | Branches | Mínimo |\n|---|---|---|---|---|\n${line}\n`);
  console.log(line);
  if (!ok) {
    const msg = `📊 ${label}: cobertura de linhas ${c.lines.toFixed(2)}% abaixo do mínimo ${min}%`;
    console.log(`::${advisory ? 'warning' : 'error'}::${msg}`);
    process.exit(advisory ? 0 : 1);
  }
}
module.exports = { lcov, clover, parse };
