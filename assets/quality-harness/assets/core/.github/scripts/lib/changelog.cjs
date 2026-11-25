// 📝 CHANGELOG no formato https://common-changelog.org
const semver = require('./semver.cjs');
const CATEGORIES = ['Changed', 'Added', 'Removed', 'Fixed'];
// ## [1.2.0] - 2026-01-31 (link de referência no fim)  ·  ## [1.2.0](https://…) - 2026-01-31 (link inline)  ·  ## 1.2.0 - 2026-01-31
const RELEASE_RE = /^## (?:\[([^\]\s]+)\](\([^)\s]+\))?|([^\s\[]+)) - (\d{4}-\d{2}-\d{2})\s*$/;

function parse(text) {
  const lines = text.split(/\r?\n/);
  const releases = [];
  const links = new Map();
  let cur = null;
  lines.forEach((line, i) => {
    const link = line.match(/^\[([^\]]+)\]:\s*(\S+)/);
    if (link) { links.set(link[1], link[2]); return; }
    if (/^## /.test(line)) {
      const m = line.match(RELEASE_RE);
      cur = { heading: line, line: i + 1, version: m ? m[1] || m[3] : null, date: m ? m[4] : null, needsRef: !!(m && m[1] && !m[2]), body: [] };
      releases.push(cur);
    } else if (cur) cur.body.push({ text: line, line: i + 1 });
  });
  return { lines, releases, links };
}

function validateRelease(r) {
  const errors = [];
  const at = `linha ${r.line}`;
  if (!r.version) return [`${at}: cabeçalho deve ser "## [X.Y.Z] - AAAA-MM-DD"`];
  if (!semver.valid(r.version)) errors.push(`${at}: "${r.version}" não é SemVer válido (sem "v")`);
  if (r.date && isNaN(Date.parse(r.date))) errors.push(`${at}: data inválida ${r.date}`);
  const body = r.body.filter((l) => l.text.trim() !== '');
  let idx = 0, lastCat = -1, sawGroup = false, notice = false;
  if (body[0] && /^_.+_$/.test(body[0].text.trim())) { notice = true; idx = 1; }
  for (; idx < body.length; idx++) {
    const { text, line } = body[idx];
    const h = text.match(/^### (.+)$/);
    if (h) {
      const c = CATEGORIES.indexOf(h[1].trim());
      if (c < 0) errors.push(`linha ${line}: categoria "${h[1]}" inválida — use ${CATEGORIES.join(', ')}`);
      else if (c <= lastCat) errors.push(`linha ${line}: categorias fora de ordem (${CATEGORIES.join(' → ')})`);
      lastCat = Math.max(lastCat, c); sawGroup = true; continue;
    }
    if (!sawGroup) { errors.push(`linha ${line}: conteúdo fora de um grupo (### Changed/Added/Removed/Fixed)`); continue; }
    if (!/^- \S/.test(text)) { errors.push(`linha ${line}: grupos aceitam apenas itens de lista "- …"`); continue; }
    if (!/\(\[[^\]]+\]\([^)]+\)/.test(text)) errors.push(`linha ${line}: mudança sem referência em link (commit, PR ou ticket)`);
  }
  if (!sawGroup && !notice) errors.push(`${at}: release sem grupos de mudança e sem aviso (_…_)`);
  if (/^unreleased$/i.test(r.version)) errors.push(`${at}: Common Changelog não usa seção Unreleased`);
  return errors;
}

// Valida o arquivo inteiro e, se `version` for passado, exige a entrada dela no topo.
function validate(text, version) {
  const { lines, releases, links } = parse(text);
  const errors = [];
  if ((lines.find((l) => l.trim()) || '') !== '# Changelog') errors.push('a primeira linha deve ser "# Changelog"');
  if (/^## \[?unreleased/im.test(text)) errors.push('Common Changelog não usa seção "Unreleased"');
  for (const r of releases) errors.push(...validateRelease(r));
  const versions = releases.map((r) => r.version).filter(semver.valid);
  for (let i = 1; i < versions.length; i++)
    if (semver.compare(versions[i - 1], versions[i]) <= 0) errors.push(`versões fora de ordem: ${versions[i - 1]} antes de ${versions[i]}`);
  for (const r of releases) if (r.needsRef && !links.has(r.version)) errors.push(`falta o link de referência "[${r.version}]: …" no fim do arquivo`);
  if (version) {
    if (!releases.length || releases[0].version !== version) errors.push(`a entrada mais recente deve ser "## [${version}] - AAAA-MM-DD"`);
  }
  return errors;
}

function section(text, version) {
  const r = parse(text).releases.find((x) => x.version === version);
  return r ? r.body.map((l) => l.text).join('\n').trim() : null;
}

module.exports = { parse, validate, section, CATEGORIES };
