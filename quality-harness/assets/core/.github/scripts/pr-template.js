// 🔀 Aplica o template de PR pelo prefixo da branch, valida seções ⭐ e rotula o PR.
// Executado por .github/workflows/pr-template.yml via actions/github-script.
const fs = require('fs');
const path = require('path');

const TPL_DIR = '.github/PULL_REQUEST_TEMPLATE';
const BOT = '<!-- pr-template-bot -->';
const AI_LABEL = '🤖 ia-assistida';
const TYPES = [
  { type: 'feature', re: /^(feature|feat)\//, label: '✨ feature' },
  { type: 'bugfix', re: /^(bugfix|fix)\//, label: '🐛 bug' },
  { type: 'hotfix', re: /^hotfix\//, label: '🚑️ hotfix' },
  { type: 'release', re: /^release\//, label: '🔖 release' },
  { type: 'chore', re: /^chore\//, label: '🔧 chore' },
];
const OTHER = { type: 'other', label: '🔀 outros' };

const detectType = (ref) => TYPES.find((t) => t.re.test(ref)) || OTHER;
const stripComments = (s) => s.replace(/<!--[\s\S]*?-->/g, '');
const isBox = (l) => /^\s*[-*]\s+\[[ xX]\]/.test(l);

function sections(body) {
  const out = [];
  let cur = null;
  for (const line of stripComments(body).split(/\r?\n/)) {
    const m = line.match(/^##\s+(.*)$/);
    if (m) out.push((cur = { title: m[1].trim(), lines: [] }));
    else if (cur) cur.lines.push(line);
  }
  return out;
}

const requiredTitles = (tpl) =>
  sections(tpl).filter((s) => s.title.startsWith('⭐')).map((s) => s.title);

function validate(body, tpl) {
  const errors = [];
  const secs = sections(body);
  const titles = secs.map((s) => s.title);
  for (const t of requiredTitles(tpl))
    if (!titles.includes(t)) errors.push(`Seção **${t.replace(/^⭐\s*/, '')}** foi removida — ela é obrigatória`);

  for (const s of secs) {
    if (!s.title.startsWith('⭐')) continue;
    const name = s.title.replace(/^⭐\s*/, '');
    const boxes = s.lines.filter(isBox);
    if (boxes.length) {
      const pending = boxes
        .filter((l) => /^\s*[-*]\s+\[ \]\s*⭐/.test(l))
        .map((l) => l.replace(/^\s*[-*]\s+\[ \]\s*⭐\s*/, '').trim());
      if (pending.length) errors.push(`**${name}** — marque os itens obrigatórios: ${pending.join(' · ')}`);
      else if (!boxes.some((l) => /\[[xX]\]/.test(l))) errors.push(`**${name}** — marque ao menos uma opção`);
      continue;
    }
    const lines = s.lines.map((l) => l.trim()).filter(Boolean);
    const emptyFields = lines.filter((l) => /^[-*]\s*[^:]+:\s*$/.test(l)).map((l) => l.replace(/^[-*]\s*|:\s*$/g, ''));
    if (emptyFields.length) errors.push(`**${name}** — preencha: ${emptyFields.join(', ')}`);
    const content = lines.filter((l) => !/^(\d+\.|[-*])$/.test(l) && !/^[-*]\s*[^:]+:\s*$/.test(l));
    if (!content.length && !emptyFields.length) errors.push(`**${name}** — está vazia`);
  }
  return errors;
}

// 🤖 IA usada = alguma linha da tabela da seção 🤖 com Ferramenta ou Modelo preenchido
function aiUsed(body) {
  const sec = sections(body).find((s) => s.title.includes('🤖'));
  if (!sec) return false;
  const rows = sec.lines.filter((l) => l.trim().startsWith('|')).slice(1)
    .filter((l) => !/^\|[\s|:-]+\|$/.test(l.trim()));
  return rows.some((r) => r.split('|').slice(2, -1).some((c) => c.trim()));
}

async function run({ github, context, core }) {
  const pr = context.payload.pull_request;
  const { owner, repo } = context.repo;
  const issue_number = pr.number;
  if (['main', 'test', 'sandbox'].includes(pr.head.ref) || pr.user?.type === 'Bot') {
    core.info('🔀 Back-merge entre trunks ou PR de bot — template não exigido');
    return;
  }
  const t = detectType(pr.head.ref);
  const read = (type) => fs.readFileSync(path.join(TPL_DIR, `${type}.md`), 'utf8');

  let body = pr.body || '';
  if (!body.trim() || body.includes('<!-- pr-template:default -->')) {
    body = read(t.type);
    await github.rest.pulls.update({ owner, repo, pull_number: issue_number, body });
    core.notice(`Template "${t.type}" aplicado pela branch ${pr.head.ref}`);
  }

  if (t === OTHER) core.warning(`Branch "${pr.head.ref}" fora do padrão — usando o template "outros"`);
  if (t.type === 'release' && !/^release\/v\d+\.\d+\.\d+(-[\w.]+)?$/.test(pr.head.ref))
    core.warning('Branch de release deveria seguir release/vX.Y.Z');

  await github.rest.issues.addLabels({ owner, repo, issue_number, labels: [t.label] });
  if (aiUsed(body)) {
    await github.rest.issues.addLabels({ owner, repo, issue_number, labels: [AI_LABEL] });
  } else {
    await github.rest.issues.removeLabel({ owner, repo, issue_number, name: AI_LABEL }).catch(() => {});
  }

  const comments = await github.paginate(github.rest.issues.listComments, { owner, repo, issue_number });
  const sticky = comments.find((c) => c.body.includes(BOT));

  if (pr.draft) {
    core.info('📝 PR em rascunho — validação será feita quando ficar pronto para revisão');
    return;
  }

  const marked = (body.match(/<!-- pr-template:(\w+) -->/) || [])[1];
  const tplType = marked && fs.existsSync(path.join(TPL_DIR, `${marked}.md`)) ? marked : t.type;
  const errors = validate(body, read(tplType));

  if (!errors.length) {
    if (sticky) await github.rest.issues.deleteComment({ owner, repo, comment_id: sticky.id });
    core.info('✅ Template preenchido corretamente');
    return;
  }

  const msg = `${BOT}\n### 🚧 Falta pouco para este PR ficar pronto\n\n` +
    errors.map((e) => `- ${e}`).join('\n') +
    `\n\n<sub>Seções com ⭐ são obrigatórias. Edite a descrição do PR e este aviso some sozinho ✨</sub>`;
  if (sticky) await github.rest.issues.updateComment({ owner, repo, comment_id: sticky.id, body: msg });
  else await github.rest.issues.createComment({ owner, repo, issue_number, body: msg });
  core.setFailed(`${errors.length} pendência(s) no template do PR`);
}

module.exports = run;
module.exports.detectType = detectType;
module.exports.validate = validate;
module.exports.aiUsed = aiUsed;
