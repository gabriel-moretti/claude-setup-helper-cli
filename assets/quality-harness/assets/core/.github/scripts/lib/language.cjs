// 🔤 Código 100% em inglês: identificadores (variáveis, funções, classes, colunas, tabelas)
//    sem acentos e sem palavras em português. Comentários e strings não entram.
//    Heurística: dicionário de palavras comuns em sistemas brasileiros que não existem em inglês.
const PT_WORDS = new Set(`
usuario usuarios cliente clientes pagamento pagamentos valor valores nome nomes endereco enderecos telefone
senha conta contas pedido pedidos produto produtos preco precos quantidade quantidades venda vendas compra
compras transacao transacoes cartao cartoes parcela parcelas taxa taxas saldo saldos recebivel recebiveis
estabelecimento estabelecimentos lojista lojistas credenciador adquirente subadquirente criar cria criado
criada buscar busca listar lista atualizar atualiza atualizado deletar excluir exclui remover salvar
salva obter pegar enviar envia receber recebe calcular calcula gerar gera validar valida verificar verifica
retorna retornar resultado resultados mensagem mensagens erro erros sucesso ativo ativa inativo inativa
aberto fechado inicio fim hora horas dia dias ano anos semana vencimento documento documentos arquivo
arquivos relatorio relatorios empresa empresas filial filiais loja lojas maquina maquininha banco bancos
registro registros situacao tipo tipos codigo codigos descricao observacao responsavel ultimo ultima
primeiro primeira novo antigo antiga atual proximo anterior pagina paginas tamanho quantia desconto
descontos cobranca cobrancas fatura faturas comissao comissoes vendedor vendedores parceiro parceiros
cadastro cadastrar consulta consultar conciliacao liquidacao repasse repasses estorno estornos
cancelamento cancelar aprovar aprovado aprovada negado negada pendente processar processamento
configuracao configuracoes lote lotes chave chaves acesso permissao permissoes perfil perfis grupo grupos
dados dado lancamento lancamentos movimento movimentacao extrato extratos agendamento recebimento
emissor bandeira bandeiras portador titular sacado cedente beneficiario pagador recebedor
producao ambiente ambientes homologacao desenvolvimento outros outro outra padrao comportamento passos
severidade frequencia versao versoes contexto solucao sugestao tela telas campo campos tabela tabelas coluna
colunas funcao funcoes metodo classe objeto objetos quantidade cidade estado estados pais bairro
numero numeros complemento nascimento sexo idade ativos inativos itens
`.trim().split(/\s+/));

const KIND = { '.js': 'c', '.jsx': 'c', '.ts': 'c', '.tsx': 'c', '.mjs': 'c', '.cjs': 'c', '.dart': 'c', '.java': 'c',
  '.kt': 'c', '.cs': 'c', '.go': 'c', '.swift': 'c', '.prisma': 'c', '.py': 'py', '.sql': 'sql', '.tf': 'hash', '.rb': 'hash', '.sh': 'hash' };

// Nomes de tabela/coluna escondidos em strings de ORM (Prisma, Django, SQLAlchemy, Drizzle, TypeORM)
const DB_NAME_PATTERNS = [
  /@@?map\(\s*["']([^"']+)/g, /db_(?:column|table)\s*=\s*["']([^"']+)/g, /__tablename__\s*=\s*["']([^"']+)/g,
  /\bColumn\(\s*["']([^"']+)/g, /\b(?:pg|mysql|sqlite)Table\(\s*["']([^"']+)/g,
  /\b(?:text|varchar|integer|serial|boolean|timestamp|numeric|uuid|bigint|jsonb?|date|decimal|real|char)\(\s*["']([^"']+)/g,
  /@(?:Entity|Table)\(\s*["']([^"']+)/g, /@(?:Column|JoinColumn|Entity|Table)\(\s*\{[^}]*name:\s*["']([^"']+)/g,
];

const kindOf = (file) => KIND[(file.match(/\.[^./]+$/) || [''])[0]] || null;

// Remove comentários e strings de uma linha, mantendo estado de bloco entre linhas
function stripLine(line, kind, state) {
  if (state.heredoc) { if (line.trim() === state.heredoc) state.heredoc = null; return ''; }
  if (kind === 'hash') { const h = line.match(/<<-?\s*['"]?([A-Za-z_]\w*)['"]?/); if (h) state.pendingHeredoc = h[1]; }
  const out = stripInline(line, kind, state);
  if (state.pendingHeredoc) { state.heredoc = state.pendingHeredoc; state.pendingHeredoc = null; }
  return out;
}

function stripInline(line, kind, state) {
  let out = '', i = 0;
  while (i < line.length) {
    if (state.block) { const end = line.indexOf(state.block, i); if (end < 0) return out; i = end + state.block.length; state.block = null; continue; }
    const rest = line.slice(i);
    if (kind === 'c' && rest.startsWith('/*')) { state.block = '*/'; i += 2; continue; }
    if (kind === 'py' && (rest.startsWith('"""') || rest.startsWith("'''"))) { state.block = rest.slice(0, 3); i += 3; continue; }
    if ((kind === 'c' && rest.startsWith('//')) || ((kind === 'py' || kind === 'hash') && rest[0] === '#') || (kind === 'sql' && rest.startsWith('--'))) return out;
    const q = rest[0];
    const isString = q === "'" || q === '`' || (q === '"' && kind !== 'sql'); // em SQL "x" é identificador
    if (isString) { let j = i + 1; while (j < line.length && line[j] !== q) { if (line[j] === '\\') j++; j++; } i = j + 1; out += ' '; continue; }
    out += line[i]; i++;
  }
  return out;
}

const splitWords = (id) => id.replace(/([a-z\u00e0-\u00ff])([A-Z\u00c0-\u00de])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
  .split(/[^A-Za-z\u00c0-\u00ff]+/).filter(Boolean).map((w) => w.toLowerCase());

function offending(identifier, allow) {
  const bad = [];
  for (const w of splitWords(identifier)) {
    if (allow.has(w)) continue;
    if (/[^\x00-\x7F]/.test(w)) bad.push(w);
    else if (PT_WORDS.has(w)) bad.push(w);
  }
  return bad;
}

// lines: [{ n, text }] — retorna [{ line, identifier, words }]
function checkLines(file, lines, domainTerms = []) {
  const kind = kindOf(file);
  if (!kind) return [];
  const allow = new Set(domainTerms.map((t) => t.toLowerCase()));
  const state = {}, found = [];
  for (const { n, text } of lines) {
    const ids = new Set();
    for (const re of DB_NAME_PATTERNS) for (const m of text.matchAll(re)) ids.add(m[1]);
    const code = stripLine(text, kind, state);
    for (const m of code.matchAll(/[A-Za-z_\u00c0-\u00ff][\w\u00c0-\u00ff]*/g)) ids.add(m[0]);
    for (const id of ids) { const words = offending(id, allow); if (words.length) found.push({ line: n, identifier: id, words }); }
  }
  return found;
}

// 🤖 Arquivos para IA em inglês: proporção de palavras-função do português
const PT_STOP = new Set('não nao que para com uma das dos pelo pela você voce está também isso quando mais seu sua deve sempre nunca código codigo arquivo então porque são foi tem já ao à é nos usar fazer'.split(' '));
function portugueseRatio(markdown) {
  const text = markdown.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`]*`/g, ' ').replace(/https?:\/\/\S+/g, ' ');
  const words = text.toLowerCase().match(/[a-z\u00e0-\u00ff]+/g) || [];
  const hits = words.filter((w) => PT_STOP.has(w)).length;
  return { words: words.length, hits, ratio: words.length ? hits / words.length : 0, portuguese: hits >= 10 || (words.length >= 30 && hits / words.length > 0.04) };
}

module.exports = { checkLines, portugueseRatio, splitWords, kindOf, stripLine, PT_WORDS };
