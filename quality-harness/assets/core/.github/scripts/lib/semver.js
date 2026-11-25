// 🔖 SemVer 2.0.0 — https://semver.org
const RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

function parse(v) {
  const m = RE.exec(String(v).replace(/^v/, ''));
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3], pre: m[4] ? m[4].split('.') : [], build: m[5] || '', raw: m[0] };
}
const valid = (v) => parse(v) !== null;

function compare(a, b) {
  const x = typeof a === 'string' ? parse(a) : a;
  const y = typeof b === 'string' ? parse(b) : b;
  for (const k of ['major', 'minor', 'patch']) if (x[k] !== y[k]) return x[k] > y[k] ? 1 : -1;
  if (!x.pre.length || !y.pre.length) return x.pre.length === y.pre.length ? 0 : x.pre.length ? -1 : 1;
  for (let i = 0; i < Math.max(x.pre.length, y.pre.length); i++) {
    const p = x.pre[i], q = y.pre[i];
    if (p === undefined) return -1;
    if (q === undefined) return 1;
    if (p === q) continue;
    const pn = /^\d+$/.test(p), qn = /^\d+$/.test(q);
    if (pn && qn) return +p > +q ? 1 : -1;
    if (pn !== qn) return pn ? -1 : 1;
    return p > q ? 1 : -1;
  }
  return 0;
}

// Tipo de bump entre duas versões estáveis: 'major' | 'minor' | 'patch' | null
function bumpType(from, to) {
  const a = parse(from), b = parse(to);
  if (b.major > a.major) return 'major';
  if (b.major === a.major && b.minor > a.minor) return 'minor';
  if (b.major === a.major && b.minor === a.minor && b.patch > a.patch) return 'patch';
  return null;
}

// Bump exigido levando em conta a fase 0.y.z (breaking pode ir no minor)
function requiredBump(kind, current) {
  if (!kind) return null;
  const v = parse(current);
  if (v && v.major === 0 && kind === 'major') return 'minor';
  return kind;
}

const RANK = { patch: 1, minor: 2, major: 3 };
const maxBump = (list) => list.filter(Boolean).sort((a, b) => RANK[b] - RANK[a])[0] || null;
const atLeast = (actual, needed) => !needed || (actual && RANK[actual] >= RANK[needed]);
const latest = (versions) => versions.filter(valid).sort(compare).at(-1) || null;

module.exports = { parse, valid, compare, bumpType, requiredBump, maxBump, atLeast, latest, RANK };
