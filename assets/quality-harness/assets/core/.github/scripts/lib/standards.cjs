// 📐 Leitura do .github/standards.json e validação das políticas do projeto
//    (idiomas, hospedagem × criticidade, IaC, ORM).
const fs = require('fs');
const path = require('path');

const DEFAULTS = {
  code: { language: 'en', enforcement: 'error', domainTerms: [], ignore: [] },
  docs: { languages: ['pt-BR'] },
  ai: { language: 'en', files: ['AGENTS.md', 'CLAUDE.md', '.claude/**', '**/SKILL.md'] },
  infra: { criticality: 'medium', hosting: 'aws', iac: 'terraform', pciScope: false, exceptionAdr: null },
  database: { engine: null, orm: null, rawSqlAdr: null },
  modules: [],
};

// Módulos opcionais do quality-harness (mesmas chaves do modules.json da skill)
const KNOWN_MODULES = ['nextjs', 'nestjs', 'fastapi', 'flutter', 'php', 'terraform', 'aws', 'azure', 'github',
  'api-contracts', 'database', 'observability', 'qa-e2e'];

function load(root = '.') {
  const p = path.join(root, '.github/standards.json');
  const user = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {};
  const out = {};
  for (const k of Object.keys(DEFAULTS))
    out[k] = Array.isArray(DEFAULTS[k])
      ? (user[k] === undefined ? [...DEFAULTS[k]] : user[k])
      : { ...DEFAULTS[k], ...(user[k] || {}) };
  return out;
}

// glob simples: ** = qualquer caminho, * = qualquer coisa sem "/"
function globToRegex(g) {
  const re = g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*\//g, '\u0000').replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*').replace(/\u0000/g, '(?:.*/)?');
  return new RegExp(`^${re}$`);
}
const matchAny = (file, globs) => globs.some((g) => globToRegex(g).test(file));

const HOSTING = ['aws', 'azure', 'vps'];
const IAC = { aws: ['terraform', 'cdk'], azure: ['terraform'], vps: ['terraform'] };

// Retorna { errors, warnings } das políticas (idiomas, infra, banco)
function policy(cfg, root = '.') {
  const errors = [], warnings = [];
  const exists = (f) => f && fs.existsSync(path.join(root, f));
  const { infra, database, docs, code, ai } = cfg;
  const modules = cfg.modules === undefined ? [] : cfg.modules;

  if (!Array.isArray(modules)) errors.push('📦 modules deve ser uma lista (ex.: ["github", "nextjs"])');
  else for (const m of modules)
    if (!KNOWN_MODULES.includes(m)) errors.push(`📦 módulo desconhecido "${m}" — use: ${KNOWN_MODULES.join(', ')}`);

  if (code.language !== 'en') errors.push('💻 code.language deve ser "en": código (variáveis, funções, colunas) sempre em inglês');
  if (ai.language !== 'en') warnings.push('🤖 ai.language diferente de "en": arquivos para IA em inglês economizam tokens');

  if (!docs.languages?.length) errors.push('🌐 docs.languages vazio: defina o idioma dos docs (ex.: ["pt-BR"] ou ["en", "pt-BR"])');
  for (const lang of (docs.languages || []).slice(1))
    if (!exists(`README.${lang}.md`)) errors.push(`🌐 docs em ${lang} declarados, mas README.${lang}.md não existe`);

  if (!HOSTING.includes(infra.hosting)) {
    if (!exists(infra.exceptionAdr)) errors.push(`☁️ hosting "${infra.hosting}" fora da prioridade (AWS, Azure, VPS): registre a decisão num ADR e aponte em infra.exceptionAdr`);
    else warnings.push(`☁️ hosting "${infra.hosting}" aceito pela exceção ${infra.exceptionAdr}`);
  }
  if (!['low', 'medium', 'high'].includes(infra.criticality)) errors.push('🎚️ infra.criticality deve ser low, medium ou high');
  if (infra.hosting === 'vps') {
    if (infra.criticality !== 'low') errors.push('🖥️ VPS só para projetos de criticidade low — use AWS ou Azure');
    if (infra.pciScope) errors.push('💳 escopo PCI DSS não pode rodar em VPS — use AWS ou Azure');
  }
  const iacOk = IAC[infra.hosting];
  if (iacOk && !iacOk.includes(infra.iac))
    (infra.hosting === 'vps' ? warnings : errors).push(`🏗️ infra.iac "${infra.iac}" — para ${infra.hosting} use ${iacOk.join(' ou ')}`);

  if (database.engine && !database.orm) {
    if (exists(database.rawSqlAdr)) warnings.push(`🗃️ banco sem ORM, justificado em ${database.rawSqlAdr}`);
    else errors.push(`🗃️ banco ${database.engine} sem ORM declarado: priorize um ORM (database.orm) ou justifique em database.rawSqlAdr`);
  }
  return { errors, warnings };
}

module.exports = { load, policy, matchAny, globToRegex, DEFAULTS, KNOWN_MODULES };
