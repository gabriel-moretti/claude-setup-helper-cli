// 🌳 Nomes de branch — https://conventionalbranch.org (v1.1.0), só com os tipos de propósito.
//    Prefixos de ferramentas de IA (ai/, claude/, codex/, copilot/, cursor/…) NÃO são usados.
const TRUNKS = ['main', 'test', 'sandbox'];
const TYPES = { feature: 'feature', feat: 'feature', bugfix: 'bugfix', fix: 'bugfix', hotfix: 'hotfix', release: 'release', chore: 'chore' };
const AI_PREFIXES = ['ai', 'ia', 'claude', 'codex', 'copilot', 'cursor', 'devin', 'jules', 'windsurf', 'aider', 'gemini', 'gpt', 'chatgpt'];
const BOT_PREFIXES = ['dependabot/', 'gh-readonly-queue/'];
const DESC = /^[a-z0-9]+(?:\.[a-z0-9]+)*(?:-[a-z0-9]+(?:\.[a-z0-9]+)*)*$/;
const RELEASE = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-[0-9a-z.-]+)?$/;

// Regex única (usada nos rulesets do Enterprise e no hook local)
const REGEX = `^(?:${TRUNKS.join('|')}|(?:${Object.keys(TYPES).join('|')})/[a-z0-9]+(?:\\.[a-z0-9]+)*(?:-[a-z0-9]+(?:\\.[a-z0-9]+)*)*|dependabot/.+|gh-readonly-queue/.+)$`;

function validate(name) {
  if (TRUNKS.includes(name)) return { ok: true, type: 'trunk', errors: [] };
  if (BOT_PREFIXES.some((p) => name.startsWith(p))) return { ok: true, type: 'bot', errors: [] };
  const [prefix, ...rest] = name.split('/');
  const desc = rest.join('/');
  const errors = [];
  if (AI_PREFIXES.includes(prefix.toLowerCase()))
    errors.push(`prefixo "${prefix}/" identifica ferramenta de IA — use o tipo da mudança (feature/, fix/, chore/…)`);
  else if (!TYPES[prefix]) errors.push(`prefixo "${prefix}/" inválido — use ${Object.keys(TYPES).map((t) => t + '/').join(', ')}`);
  if (!rest.length) errors.push('falta a descrição depois do prefixo');
  else if (!DESC.test(desc)) errors.push('descrição só com minúsculas, números, hífens e pontos, sem separadores duplos nem nas pontas');
  if (TYPES[prefix] === 'release' && desc && !RELEASE.test(desc)) errors.push('branch de release deve ser release/vX.Y.Z (SemVer)');
  return { ok: !errors.length, type: TYPES[prefix] || null, errors };
}

// Para onde cada tipo de branch pode abrir PR. hasTest = a branch `test` existe no repositório.
function allowedTarget(head, base, hasTest) {
  const h = validate(head);
  if (!h.ok) return null; // erro de nome já é reportado
  const work = ['feature', 'bugfix', 'chore', 'bot'];
  if (base === 'main') {
    if (['release', 'hotfix'].includes(h.type)) return true;
    if (!hasTest && work.includes(h.type)) return true;
    return `com a branch \`test\` ativa, \`main\` só recebe release/* e hotfix/* (abra contra \`test\`)`;
  }
  if (base === 'test') {
    if (work.includes(h.type) || head === 'main') return true;
    return '`test` recebe feature/, fix/, chore/ e o back-merge de `main`';
  }
  if (base === 'sandbox') return true;
  return true; // PRs empilhados entre branches de trabalho
}

const releaseVersion = (name) => (name.match(/^release\/v(.+)$/) || [])[1] || null;

module.exports = { validate, allowedTarget, releaseVersion, TRUNKS, TYPES, AI_PREFIXES, REGEX };
