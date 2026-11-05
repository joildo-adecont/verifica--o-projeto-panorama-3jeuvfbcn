/**
 * LEVANTAMENTO DE CARTEIRA — quais clientes se enquadram em regime específico
 * ===========================================================================
 * Pedido do CEO (05/11/2026): "identificar quais clientes se enquadram em cada um
 * (combustível pelo CNAE, financeiro pela supervisão do Bacen, ZFM pela
 * localização) e sinalizar no cadastro. Isso é levantamento de carteira, não
 * tabela."
 *
 * ── A DECISÃO QUE GOVERNA ESTE ARQUIVO ──
 * Levantamento de carteira se faz com EVIDÊNCIA DO CADASTRO, não com palpite
 * sobre o nome. A base real (497 empresas, carga de 26/09/2026) NÃO TEM CNAE —
 * esse campo não veio na exportação do sistema contábil. Então:
 *
 *   · o que PODE ser afirmado, é afirmado com o campo que existe;
 *   · o que depende de CNAE é marcado como PENDENTE, com a razão;
 *   · o que só o nome sugere é marcado como INDÍCIO, nunca como enquadramento.
 *
 * ── AS TRÊS FORÇAS DE EVIDÊNCIA ──
 *   CONFIRMADO — o cadastro traz o dado que decide (ex.: natureza jurídica
 *                "Produtor Rural (Pessoa Física)", "Cooperativa", "Representação
 *                Diplomática Estrangeira"; SUFRAMA preenchido; município na ZFM).
 *   INDÍCIO    — o nome ou o ramo sugere, mas falta o campo que prova. Vai para
 *                conferência, não para o cadastro como fato.
 *   PENDENTE   — o critério depende de CNAE, que a base não tem. Não se classifica.
 */

/* ══════════════════════════════════════════════════════════════════
 * OS CRITÉRIOS DE ENQUADRAMENTO
 * ══════════════════════════════════════════════════════════════════ */

export type ForcaEvidencia = 'confirmado' | 'indicio' | 'pendente'

export interface Criterio {
  id: string
  regime: string
  base: string
  /** qual campo do cadastro decide */
  campoDecide: string
  /** como reconhecer */
  comoReconhecer: string
  /** o que fazer quando falta o campo */
  quandoFalta: string
  /** o dado existe na base atual? */
  dadoDisponivel: boolean
  /** por que não, quando não existe */
  motivoIndisponivel?: string
}

export const CRITERIOS: Criterio[] = [
  {
    id: 'rural_pf',
    regime: 'Produtor rural — pessoa física não contribuinte',
    base: 'LC 214/2025, art. 164',
    campoDecide: 'legal_nature (natureza jurídica) + receita anual',
    comoReconhecer:
      'Natureza jurídica "Produtor Rural (Pessoa Física)". O limite de R$ 3,6 mi confirma se é ' +
      'não contribuinte — abaixo dele, não é contribuinte.',
    quandoFalta:
      'Sem a receita anual no cadastro, o enquadramento é provável mas não confirmado: marcar como ' +
      'candidato e conferir a receita.',
    dadoDisponivel: true,
  },
  {
    id: 'cooperativa',
    regime: 'Sociedade cooperativa — regime específico',
    base: 'LC 214/2025, art. 271',
    campoDecide: 'legal_nature = "Cooperativa"',
    comoReconhecer: 'Natureza jurídica "Cooperativa" — o campo basta para identificar.',
    quandoFalta: 'Cooperativa que não declarou a natureza não é identificável pelo cadastro.',
    dadoDisponivel: true,
  },
  {
    id: 'diplomatico',
    regime: 'Missão diplomática / repartição consular',
    base: 'LC 214/2025, art. 251',
    campoDecide: 'legal_nature = "Representação Diplomática Estrangeira"',
    comoReconhecer: 'Natureza jurídica específica — identificação direta.',
    quandoFalta: 'Missão que não declarou a natureza fica invisível ao levantamento.',
    dadoDisponivel: true,
  },
  {
    id: 'zfm',
    regime: 'Zona Franca de Manaus e áreas de livre comércio',
    base: 'LC 214/2025, arts. 439 a 461',
    campoDecide: 'suframa_registration preenchido + município na área de abrangência',
    comoReconhecer:
      'Registro SUFRAMA ativo é a prova documental. Sem ele, o município decide: Manaus e os ' +
      'municípios da área de abrangência da ZFM, mais as ALC (Bonfim/RR, Boa Vista/RR, ' +
      'Guajará-Mirim/RO, Brasiléia/AC, Epitaciolândia/AC, Macapá/AP e Santana/AP).',
    quandoFalta:
      'Base sem SUFRAMA e sem cliente na região: nenhum enquadramento. Zero não é falha — é o ' +
      'resultado honesto.',
    dadoDisponivel: true,
  },
  {
    id: 'combustivel',
    regime: 'Combustíveis — regime específico',
    base: 'LC 214/2025, arts. 174 a 181',
    campoDecide: 'CNAE do estabelecimento (comércio atacadista/varejista de combustíveis)',
    comoReconhecer:
      'CNAE 46.81/01 (atacadista de combustíveis), 47.32/01 (posto revendedor), ' +
      '47.32/02 (posto de gasolina), 19.xx (refino) ou 46.81/99.',
    quandoFalta:
      'A base não tem CNAE. Sem ele, só resta indício por nome/natureza — e indício não ' +
      'enquadra ninguém.',
    dadoDisponivel: false,
    motivoIndisponivel:
      'O campo CNAE não veio na exportação do sistema contábil (colunas exportadas: código, nome, ' +
      'documento, natureza, endereço, e-mail, telefone). Sem ele não há como afirmar atividade.',
  },
  {
    id: 'financeiro',
    regime: 'Serviços financeiros — regime específico',
    base: 'LC 214/2025, arts. 182 a 214',
    campoDecide:
      'Supervisão do Banco Central (autorização para funcionar) ou CNAE das divisões 64, 65 e 66',
    comoReconhecer:
      'Instituição autorizada pelo Bacen (banco, corretora, distribuidora, financeira, ' +
      'securitizadora) ou CNAE 64.xx, 65.xx, 66.xx.',
    quandoFalta:
      'Sem CNAE e sem lista de autorizadas, "investimento" no nome não é instituição financeira — ' +
      'holding e gestora de recursos próprios não são supervisionadas.',
    dadoDisponivel: false,
    motivoIndisponivel:
      'Sem CNAE no cadastro. E nome com "investimentos"/"capital" NÃO indica supervisão: a maioria ' +
      'é holding patrimonial, que segue o regime regular.',
  },
]

/* ══════════════════════════════════════════════════════════════════
 * MUNICÍPIOS DA ZFM E DAS ÁREAS DE LIVRE COMÉRCIO
 * ══════════════════════════════════════════════════════════════════ */

/**
 * As ALC são definidas em lei e são poucas — dá para listar com segurança.
 * A ZFM tem área de abrangência ampla (Manaus + municípios do AM, RR, RO e AC),
 * então o critério prático é: SUFRAMA preenchido, ou município da lista.
 */
export const MUNICIPIOS_ZFM_ALC: { cidade: string; uf: string; area: string }[] = [
  { cidade: 'MANAUS', uf: 'AM', area: 'ZFM — polo industrial' },
  { cidade: 'BONFIM', uf: 'RR', area: 'Área de Livre Comércio de Bonfim' },
  { cidade: 'BOA VISTA', uf: 'RR', area: 'Área de Livre Comércio de Boa Vista' },
  { cidade: 'GUAJARA-MIRIM', uf: 'RO', area: 'Área de Livre Comércio de Guajará-Mirim' },
  { cidade: 'BRASILEIA', uf: 'AC', area: 'Área de Livre Comércio de Brasiléia' },
  { cidade: 'EPITACIOLANDIA', uf: 'AC', area: 'Área de Livre Comércio de Epitaciolândia' },
  { cidade: 'MACAPA', uf: 'AP', area: 'Área de Livre Comércio de Macapá' },
  { cidade: 'SANTANA', uf: 'AP', area: 'Área de Livre Comércio de Santana' },
]

/* ══════════════════════════════════════════════════════════════════
 * O LEVANTAMENTO
 * ══════════════════════════════════════════════════════════════════ */

/** Um cliente como vem da carga do sistema contábil. */
export interface ClienteCarteira {
  codigo: string
  nome: string
  fantasia?: string
  documento?: string
  natureza?: string
  cidade?: string
  uf?: string
  suframa?: string
  /** receita anual, quando existir no cadastro */
  receita?: number
  /** CNAE, quando existir */
  cnae?: string
}

export interface Enquadramento {
  criterioId: string
  regime: string
  forca: ForcaEvidencia
  /** o que provou */
  evidencia: string
  /** o que falta, quando não é confirmado */
  falta?: string
}

export interface ClienteEnquadrado extends ClienteCarteira {
  enquadramentos: Enquadramento[]
}

/** Normaliza texto para comparação. */
function norm(s: string | undefined): string {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * INDÍCIOS POR NOME — usados SÓ quando o campo que prova não existe.
 * Ficam separados de propósito: indício serve para dirigir a conferência,
 * nunca para gravar enquadramento no cadastro.
 */
const INDICIO_COMBUSTIVEL = /posto|combustiv|petr[oó]l|gasolina|etanol|diesel|auto ?posto|fuel/i
const INDICIO_FINANCEIRO =
  /banco |banc[oá]rio|financeir|corretora|distribuidora de t[ií]tulos|securitizadora|factoring|cons[oó]rcio/i

/** Um cliente "investimentos/capital/participações" é holding, não instituição. */
const HOLDING = /investiment|participa[cç][oõ]es|capital|holding|patrimonial/i

export function enquadrarCliente(c: ClienteCarteira): Enquadramento[] {
  const out: Enquadramento[] = []
  const nat = norm(c.natureza)
  const cid = norm(c.cidade)
  const uf = String(c.uf || '')
    .toUpperCase()
    .trim()

  /* ── PRODUTOR RURAL PF — natureza jurídica decide ── */
  if (nat.indexOf('produtor rural') >= 0) {
    const temReceita = typeof c.receita === 'number' && c.receita > 0
    const abaixo = temReceita && c.receita < 3_600_000
    out.push({
      criterioId: 'rural_pf',
      regime: 'Produtor rural — PF',
      forca: temReceita ? 'confirmado' : 'indicio',
      evidencia: temReceita
        ? `Natureza "${c.natureza}" e receita ${abaixo ? 'abaixo' : 'acima'} de R$ 3,6 mi`
        : `Natureza jurídica "${c.natureza}"`,
      falta: temReceita
        ? undefined
        : 'Receita anual: sem ela não se confirma se está abaixo do limite de R$ 3,6 mi (art. 164)',
    })
  }

  /* ── COOPERATIVA — natureza decisiva ── */
  if (nat.indexOf('cooperativa') >= 0) {
    out.push({
      criterioId: 'cooperativa',
      regime: 'Sociedade cooperativa',
      forca: 'confirmado',
      evidencia: `Natureza jurídica "${c.natureza}"`,
    })
  }

  /* ── MISSÃO DIPLOMÁTICA — natureza decisiva ── */
  if (nat.indexOf('diplomatic') >= 0 || nat.indexOf('consular') >= 0) {
    out.push({
      criterioId: 'diplomatico',
      regime: 'Missão diplomática / repartição consular',
      forca: 'confirmado',
      evidencia: `Natureza jurídica "${c.natureza}"`,
    })
  }

  /* ── ZFM / ALC — SUFRAMA prova; município confirma ── */
  const municipalc = MUNICIPIOS_ZFM_ALC.find((m) => norm(m.cidade) === cid && m.uf === uf)
  if (c.suframa && String(c.suframa).trim()) {
    out.push({
      criterioId: 'zfm',
      regime: 'ZFM / Área de Livre Comércio',
      forca: 'confirmado',
      evidencia: `Registro SUFRAMA ${c.suframa}`,
    })
  } else if (municipalc) {
    out.push({
      criterioId: 'zfm',
      regime: 'ZFM / Área de Livre Comércio',
      forca: 'indicio',
      evidencia: `Município ${c.cidade}/${uf} — ${municipalc.area}`,
      falta: 'Sem registro SUFRAMA: o município indica a área, mas a fruição exige o registro',
    })
  }

  /* ── COMBUSTÍVEL — CNAE prova; nome só indica ── */
  const cnae = String(c.cnae || '').replace(/\D/g, '')
  const cnaeComb = cnae.startsWith('4681') || cnae.startsWith('4732') || cnae.startsWith('19')
  if (cnaeComb) {
    out.push({
      criterioId: 'combustivel',
      regime: 'Combustíveis',
      forca: 'confirmado',
      evidencia: `CNAE ${c.cnae}`,
    })
  } else if (!cnae && INDICIO_COMBUSTIVEL.test(c.nome + ' ' + (c.fantasia || ''))) {
    out.push({
      criterioId: 'combustivel',
      regime: 'Combustíveis',
      forca: 'indicio',
      evidencia: 'Nome sugere posto/combustível',
      falta: 'CNAE ausente no cadastro — indício não enquadra; confirmar a atividade',
    })
  }

  /* ── FINANCEIRO — CNAE prova; nome com "investimento" NÃO prova ── */
  const cnaeFin = /^(64|65|66)/.test(cnae)
  if (cnaeFin) {
    out.push({
      criterioId: 'financeiro',
      regime: 'Serviços financeiros',
      forca: 'confirmado',
      evidencia: `CNAE ${c.cnae}`,
    })
  } else if (!cnae && INDICIO_FINANCEIRO.test(c.nome)) {
    out.push({
      criterioId: 'financeiro',
      regime: 'Serviços financeiros',
      forca: 'indicio',
      evidencia: 'Nome sugere atividade financeira',
      falta: 'CNAE ausente — confirmar se é instituição supervisionada pelo Bacen',
    })
  } else if (!cnae && HOLDING.test(c.nome)) {
    /* Aqui o indício aponta para o CONTRÁRIO: holding não é instituição. */
    out.push({
      criterioId: 'financeiro',
      regime: 'Serviços financeiros',
      forca: 'pendente',
      evidencia: 'Nome sugere holding/investimento — ATENÇÃO: não é instituição financeira',
      falta:
        'Holding patrimonial e gestora de recursos próprios seguem o regime regular. Só é regime ' +
        'financeiro quem é supervisionado pelo Bacen.',
    })
  }

  return out
}

export function levantarCarteira(clientes: ClienteCarteira[]): {
  enquadrados: ClienteEnquadrado[]
  resumo: {
    total: number
    porCriterio: {
      criterioId: string
      regime: string
      confirmado: number
      indicio: number
      pendente: number
    }[]
    comEnquadramento: number
    semEnquadramento: number
  }
} {
  const enquadrados: ClienteEnquadrado[] = []
  const contagem: Record<
    string,
    { regime: string; confirmado: number; indicio: number; pendente: number }
  > = {}

  for (const c of clientes) {
    const e = enquadrarCliente(c)
    if (e.length === 0) continue
    enquadrados.push({ ...c, enquadramentos: e })
    for (const x of e) {
      if (!contagem[x.criterioId]) {
        contagem[x.criterioId] = { regime: x.regime, confirmado: 0, indicio: 0, pendente: 0 }
      }
      contagem[x.criterioId][x.forca]++
    }
  }

  return {
    enquadrados,
    resumo: {
      total: clientes.length,
      porCriterio: Object.entries(contagem).map(([criterioId, v]) => ({ criterioId, ...v })),
      comEnquadramento: enquadrados.length,
      semEnquadramento: clientes.length - enquadrados.length,
    },
  }
}

/** Aviso que acompanha o levantamento. */
export const RESSALVA_LEVANTAMENTO =
  'Indício NÃO enquadra. Só vai para o cadastro o que tem campo que prova — natureza jurídica, ' +
  'SUFRAMA ou CNAE. O resto vira lista de conferência. Marcar um cliente no regime errado é pior ' +
  'que não marcar: ele passa a calcular com a regra de outro regime.'
