import pb from '@/lib/pocketbase/client'
import { fetchClassifications, normalizeClassificationType } from '@/services/classifications'
import { fallbackNorms } from '@/services/panorama'
import { ANEXOS } from '@/data/anexosCatalogo'
import { VINCULOS_POR_BLOCO } from '@/data/vinculosLegislacao'
import { CBS_REF, IBS_REF, REF_TOTAL, HISTORICO_ALIQUOTAS, PROCEDENCIA } from '@/data/aliquotas'
import { CRONOLOGIA } from '@/data/legislacaoCronologica'
import {
  ASSUNTOS_ESPECIAIS_CATALOGO,
  type AssuntoEspecialItem,
  type CategoriaAssuntoEspecial,
} from '@/data/assuntosEspeciais'
import type { ClassificationItem, TaxNormItem } from '@/types/panorama'

export type { AssuntoEspecialItem, CategoriaAssuntoEspecial }

export interface RadarAtoBuscaItem {
  id: string
  titulo: string
  tipo_ato: string
  nivel: 'federal' | 'estadual' | 'municipal'
  ente_nome?: string
  uf?: string
  municipio_nome?: string
  data_publicacao?: string
  fonte_oficial?: string
  url?: string
  trecho?: string
  relacao?: string
}

export interface TaxTopicBuscaItem {
  id: string
  section: string
  title: string
  category: string
  treatment: string
  legal_basis: string
  description: string
}

export interface ConexaoLegalItem {
  id: string
  norma: string
  dispositivo: string
  remissao?: string
  anexo: string
  rotulo: string
  detalhe: string
  aliquotaOuEfeito: string
  confianca?: 'alta' | 'media' | 'baixa'
}

export interface AnaliseEspecialistaItem {
  id: string
  tema: string
  autoridadeOuFonte: string
  dataOuMarco: string
  resumo: string
  impactoOuProjecao: string
  linkSecao?: string
  tag: string
}

export interface AliquotaTratamentoItem {
  id: string
  tema: string
  tipoTratamento: string
  reducaoOuFator: string
  aliquotaEstimada: string
  fundamentoLegal: string
  observacao: string
  categoria:
    | 'Cesta Básica'
    | 'Redução 60%'
    | 'Redução 30%'
    | 'Imunidade'
    | 'Regime Específico'
    | 'Referência'
}

export interface ParametrosBuscaAvancada {
  termo: string
  tipoClassificacao?: string
  classifPage?: number
  classifPerPage?: number
  atosNivel?: 'todos' | 'federal' | 'estadual' | 'municipal'
  categoriaEspecial?: string
}

export interface ResultadoBuscaAvancada {
  termo: string
  timestamp: string
  totalGeralEncontrado: number
  // (0) Assuntos Especiais — fora da tributação geral (grupo de maior destaque)
  assuntosEspeciais: {
    items: AssuntoEspecialItem[]
    total: number
    categoriasPresentes: string[]
  }
  // (a) Atos normativos e radar de atos
  normas: {
    items: TaxNormItem[]
    total: number
  }
  radarAtos: {
    items: RadarAtoBuscaItem[]
    total: number
  }
  // (b) Classificações oficiais (NCM, cClassTrib, CST, cCredPres, CEST, etc.)
  classificacoes: {
    items: ClassificationItem[]
    totalItems: number
    page: number
    perPage: number
    totalPages: number
    source: 'database' | 'fallback'
  }
  // (c) Alíquotas e tratamentos diferenciados
  aliquotasTratamentos: AliquotaTratamentoItem[]
  // (d) Conexões e associações legais (cadeia de associação LC 214/2025, EC 132/2023, RIBS)
  conexoesLegais: ConexaoLegalItem[]
  // (e) Dados, projeções e análises de especialistas
  analisesEspecialistas: AnaliseEspecialistaItem[]
  // Dados para gráficos correlatos
  dadosGraficos: {
    composicaoAtos: Array<{ name: string; count: number; fill: string }>
    linhaDoTempoAliquota: Array<{
      ano: string
      cbs: number
      ibs: number
      total: number
      nota: string
    }>
    classificacoesPorTipo: Array<{ tipo: string; count: number }>
  }
}

// Base consolidada de análises de especialistas presentes no acervo técnico do Panorama RT
const ANALISES_ESPECIALISTAS_BASE: AnaliseEspecialistaItem[] = [
  {
    id: 'an-01',
    tema: 'Alíquota de Referência e Trava do Art. 349 da LC 214',
    autoridadeOuFonte: 'Tribunal de Contas da União (TCU) & Secretaria Extraordinária da RT (MF)',
    dataOuMarco: '28/10/2026',
    resumo:
      'TCU fixou a alíquota da CBS em 11,30% para 2027 (cálculo de 11,3468%). Com IBS mantido em 18,70%, o IVA Dual totaliza 30,00%, superando a trava referencial de 26,50% prevista no art. 349 da LC 214.',
    impactoOuProjecao:
      'Executivo deverá submeter proposta de ajuste ou compensação no Congresso; projeção de impacto de R$ 38 bilhões em arrecadação federal.',
    linkSecao: '#indicadores',
    tag: 'Macroeconomia',
  },
  {
    id: 'an-02',
    tema: 'Cesta Básica Nacional e Impacto no Poder de Compra',
    autoridadeOuFonte: 'Comitê Gestor do IBS (CGIBS) / IPEA',
    dataOuMarco: '30/04/2026',
    resumo:
      'Desoneração integral (Alíquota Zero de IBS e CBS) de itens alimentares essenciais (arroz, feijão, carnes, leite, pão) no Anexo I da LC 214/2025 impede cumulatividade e repasse tributário ao consumidor final.',
    impactoOuProjecao:
      'Redução estimada de 4,2% no custo da alimentação básica das famílias das faixas de menor renda em relação ao modelo anterior de ICMS/PIS/Cofins.',
    linkSecao: '#secao-3',
    tag: 'Cesta Básica',
  },
  {
    id: 'an-03',
    tema: 'Agronegócio: Crédito Presumido e Desoneração de Insumos',
    autoridadeOuFonte: 'CNA / Ministério da Agricultura (MAPA)',
    dataOuMarco: 'Agosto/2026',
    resumo:
      'Mecanismo de crédito presumido concedido aos adquirentes de produtos agropecuários de produtores rurais PF não contribuintes (art. 168 da LC 214) preserva a competitividade das cadeias produtivas de grãos, carnes e leite.',
    impactoOuProjecao:
      'Manutenção de crédito em até 100% nas aquisições de insumos do Anexo II com redução de 60%, garantindo neutralidade na exportação.',
    linkSecao: '#agronegocio',
    tag: 'Agronegócio',
  },
  {
    id: 'an-04',
    tema: 'Setor Imobiliário: Redutores de Ajuste e RET',
    autoridadeOuFonte: 'CBIC / Secovi / Receita Federal',
    dataOuMarco: 'Julho/2026',
    resumo:
      'Regime específico de bens imóveis (arts. 222 a 248 da LC 214) com redutor de ajuste de 20% para incorporação/venda e 50% para locação, mantendo regime especial de tributação (RET) para patrimônio de afetação.',
    impactoOuProjecao:
      'Alíquota efetiva estimada entre 6,0% e 15,9% dependendo do valor do imóvel e dedução do terreno.',
    linkSecao: '#regime-imobiliario',
    tag: 'Imobiliário',
  },
  {
    id: 'an-05',
    tema: 'Simples Nacional: Sublimite de R$ 3,6 milhões e Opção Híbrida',
    autoridadeOuFonte: 'Comitê Gestor do Simples Nacional (CGSN)',
    dataOuMarco: 'Resoluções 190–192/2026',
    resumo:
      'Empresas optantes no intervalo entre R$ 3,6 mi e R$ 4,8 mi recolhem CBS pelo DAS unificado e apuram IBS no regime regular não-cumulativo, transferindo crédito amplo aos compradores.',
    impactoOuProjecao:
      'Exige controle contábil dual para cerca de 420 mil empresas em todo o território nacional.',
    linkSecao: '#simples',
    tag: 'Simples Nacional',
  },
  {
    id: 'an-06',
    tema: 'Serviços Financeiros e Split Payment Inteligente',
    autoridadeOuFonte: 'FEBRABAN / CGIBS / Banco Central',
    dataOuMarco: 'Outubro/2026',
    resumo:
      'Retenção automática no momento da liquidação financeira pelo arranjo de pagamento (split payment simplificado ou inteligente) elimina evasão e melhora fluxo de créditos tributários.',
    impactoOuProjecao:
      'Operações de cartão de crédito e PIX com retenção imediata em 2027 evitam débitos a descoberto.',
    linkSecao: '#financeiros',
    tag: 'Financeiro',
  },
  {
    id: 'an-07',
    tema: 'Zona Franca de Manaus e Crédito Presumido Diferencial',
    autoridadeOuFonte: 'SUFRAMA / SEFAZ-AM',
    dataOuMarco: 'Setembro/2026',
    resumo:
      'Garantia constitucional de competitividade da ZFM com crédito presumido integral (100% no Anexo V do RIBS) para produtos de TIC e incentivos de ICMS.',
    impactoOuProjecao:
      'Preservação do parque industrial com neutralidade frente ao Imposto Seletivo.',
    linkSecao: '#secao-6',
    tag: 'ZFM',
  },
  {
    id: 'an-08',
    tema: 'Profissões Regulamentadas: Redução de 30% para Sociedades PJ',
    autoridadeOuFonte: 'CFC / OAB / CFM',
    dataOuMarco: 'Maio/2026',
    resumo:
      'Redução de 30% da alíquota padrão (art. 136 e Anexo XIV da LC 214) para 18 profissões legalmente regulamentadas organizadas sob forma societária sem caráter empresarial puro.',
    impactoOuProjecao:
      'Alíquota final efetiva de 21,00% sobre base de cálculo de 30% da referência.',
    linkSecao: '#profissionais-plataformas',
    tag: 'Profissionais',
  },
]

// Catálogo estruturado de tratamentos diferenciados e alíquotas da reforma
const TRATAMENTOS_BASE: AliquotaTratamentoItem[] = [
  {
    id: 'trat-01',
    tema: 'Cesta Básica Nacional de Alimentos',
    tipoTratamento: 'Alíquota Zero (100% Desoneração)',
    reducaoOuFator: 'Fator 0,00 (0%)',
    aliquotaEstimada: '0,00% (IBS: 0%, CBS: 0%)',
    fundamentoLegal: 'LC 214/2025, art. 125 e Anexo I; EC 132/2023, art. 8º; RIBS, art. 199',
    observacao:
      'Aplica-se a arroz, feijão, carnes bovina/suína/aves, leite pasteurizado/em pó, farinha de mandioca, café, óleo de soja, pão comum e itens da cesta.',
    categoria: 'Cesta Básica',
  },
  {
    id: 'trat-02',
    tema: 'Produtos Agropecuários, Pesqueiros e Insumos',
    tipoTratamento: 'Redução de 60% na Alíquota Geral',
    reducaoOuFator: 'Fator 0,40 (-60%)',
    aliquotaEstimada: '12,00% (CBS: 4,52% + IBS: 7,48%)',
    fundamentoLegal: 'LC 214/2025, art. 128 e Anexo II; RIBS, art. 203',
    observacao:
      'Alcança produtos agropecuários in natura, hortícolas, frutas, ovos, sementes, defensivos, fertilizantes e rações animais.',
    categoria: 'Redução 60%',
  },
  {
    id: 'trat-03',
    tema: 'Serviços de Saúde e Dispositivos Médicos',
    tipoTratamento: 'Redução de 60% na Alíquota Geral',
    reducaoOuFator: 'Fator 0,40 (-60%)',
    aliquotaEstimada: '12,00% (CBS: 4,52% + IBS: 7,48%)',
    fundamentoLegal: 'LC 214/2025, arts. 130–131, Anexos III e IV; RIBS, arts. 205–206',
    observacao:
      'Serviços hospitalares, consultas médicas, laboratoriais e cirúrgicos. Dispositivos têm alíquota zero para SUS/entidades públicas.',
    categoria: 'Redução 60%',
  },
  {
    id: 'trat-04',
    tema: 'Serviços de Educação e Ensino Regular',
    tipoTratamento: 'Redução de 60% na Alíquota Geral',
    reducaoOuFator: 'Fator 0,40 (-60%)',
    aliquotaEstimada: '12,00% (CBS: 4,52% + IBS: 7,48%)',
    fundamentoLegal: 'LC 214/2025, art. 129 e Anexo II; RIBS, art. 204',
    observacao:
      'Ensino infantil, fundamental, médio, técnico, superior e pós-graduação credenciados pelo MEC.',
    categoria: 'Redução 60%',
  },
  {
    id: 'trat-05',
    tema: 'Medicamentos Essenciais e Terapias Oncológicas',
    tipoTratamento: 'Isenção / Alíquota Zero (100% de Redução)',
    reducaoOuFator: 'Fator 0,00 (0%)',
    aliquotaEstimada: '0,00% (IBS: 0%, CBS: 0%)',
    fundamentoLegal: 'LC 214/2025, art. 143 e Anexo VI; RIBS, art. 219',
    observacao:
      'Medicamentos para câncer, doenças raras, vacinas, hemoderivados e fármacos adquiridos pelo poder público.',
    categoria: 'Cesta Básica',
  },
  {
    id: 'trat-06',
    tema: 'Profissões Intelectuais Regulamentadas',
    tipoTratamento: 'Redução de 30% na Alíquota Geral',
    reducaoOuFator: 'Fator 0,70 (-30%)',
    aliquotaEstimada: '21,00% (CBS: 7,91% + IBS: 13,09%)',
    fundamentoLegal: 'LC 214/2025, art. 136 e Anexo XIV; RIBS, art. 211',
    observacao:
      '18 profissões fiscalizadas por conselhos de classe: advogados, contadores, engenheiros, médicos, arquitetos, economistas, etc.',
    categoria: 'Redução 30%',
  },
  {
    id: 'trat-07',
    tema: 'Imunidades Constitucionais (Livros, Templos, Exportações)',
    tipoTratamento: 'Imunidade Constitucional Absoluta',
    reducaoOuFator: 'Não Incidência Plena',
    aliquotaEstimada: '0,00% (Não-incidência)',
    fundamentoLegal: 'CF/88, art. 156-A, § 5º; EC 132/2023; LC 214/2025, arts. 5º a 8º',
    observacao:
      'Exportações de bens e serviços mantêm crédito pleno; livros, periódicos, papel de imprensa, templos e entidades sem fins lucrativos.',
    categoria: 'Imunidade',
  },
  {
    id: 'trat-08',
    tema: 'Zona Franca de Manaus (ZFM) e Áreas de Livre Comércio',
    tipoTratamento: 'Crédito Presumido de até 100% do IBS/CBS',
    reducaoOuFator: 'Crédito Integral 55% a 100%',
    aliquotaEstimada: '0,00% a 13,50% efetiva',
    fundamentoLegal: 'CF/88, art. 92-B do ADCT; LC 214/2025, arts. 434–453; RIBS Anexo V',
    observacao:
      'Garante diferencial competitivo e manutenção de investimentos no Polo Industrial de Manaus.',
    categoria: 'Regime Específico',
  },
  {
    id: 'trat-09',
    tema: 'Combustíveis e Lubrificantes (Regime Monofásico)',
    tipoTratamento: 'Alíquota Específica / Monofásica por Unidade de Medida (ad rem)',
    reducaoOuFator: 'Tributação Concentrada',
    aliquotaEstimada: 'Ad rem fixada por ato conjunto MF/CGIBS',
    fundamentoLegal:
      'LC 214/2025, arts. 172–184; Portaria Conjunta MF/CGIBS 14/2026; Dec. 13.133/2026',
    observacao:
      'Gasolina, etanol anidro, diesel, biodiesel e GLP recolhidos uma única vez pelo produtor ou importador com vedação de apropriação.',
    categoria: 'Regime Específico',
  },
  {
    id: 'trat-10',
    tema: 'Alíquota Geral Padrão de Referência da Reforma',
    tipoTratamento: 'Regime Regular Não-cumulativo',
    reducaoOuFator: 'Fator 1,00 (100%)',
    aliquotaEstimada: `${REF_TOTAL.toFixed(2).replace('.', ',')}% (CBS: ${CBS_REF.toFixed(2).replace('.', ',')}% + IBS: ${IBS_REF.toFixed(2).replace('.', ',')}%)`,
    fundamentoLegal: 'LC 214/2025, art. 349; TCU Sessão 28/10/2026; Resolução CGIBS 14/2026',
    observacao:
      'Base de cálculo e ponto de partida de todos os redutores e incentivos diferenciados da reforma tributária.',
    categoria: 'Referência',
  },
]

function normalizar(texto?: string): string {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Motor central de busca integrada da Reforma Tributária.
 * Executa pesquisas simultâneas no banco PocketBase e nos acervos consolidados.
 */
export async function buscarAvancado(
  params: ParametrosBuscaAvancada,
): Promise<ResultadoBuscaAvancada> {
  const rawTerm = (params.termo || '').trim()
  const termoNorm = normalizar(rawTerm)
  const classifPage = params.classifPage || 1
  const classifPerPage = params.classifPerPage || 25
  const tipoClassif = params.tipoClassificacao || 'TODOS'
  const atosNivel = params.atosNivel || 'todos'
  const filtroCategoriaEspecial = params.categoriaEspecial || 'TODAS'

  // 0. Assuntos Especiais — fora da tributação geral
  const assuntosEspeciaisFiltrados = ASSUNTOS_ESPECIAIS_CATALOGO.filter((item) => {
    if (filtroCategoriaEspecial !== 'TODAS' && item.categoria !== filtroCategoriaEspecial) {
      return false
    }
    if (!termoNorm) return true

    const searchSpace = normalizar(
      `${item.titulo} ${item.subtitulo} ${item.categoria} ${item.descricao} ${item.oQueMuda} ${item.baseLegal} ${item.aliquotaOuTratamento} ${item.termosChave.join(' ')} ${item.produtosOuSegmentosAfetados.join(' ')}`,
    )

    // Correspondência direta por inclusão ou por termo-chave exato
    if (searchSpace.includes(termoNorm)) return true

    // Correspondências semânticas e flexões comuns
    if (
      termoNorm === 'cigarro' ||
      termoNorm === 'cigarros' ||
      termoNorm === 'fumo' ||
      termoNorm === 'tabaco'
    ) {
      return item.categoria === 'Imposto do Pecado'
    }
    if (
      termoNorm === 'alcool' ||
      termoNorm === 'alcoolicas' ||
      termoNorm === 'cerveja' ||
      termoNorm === 'bebida' ||
      termoNorm === 'bebidas'
    ) {
      return item.categoria === 'Imposto do Pecado'
    }
    if (
      termoNorm === 'simples' ||
      termoNorm === 'simples nacional' ||
      termoNorm === 'cgsn' ||
      termoNorm === 'das'
    ) {
      return item.categoria === 'Simples Nacional' || item.categoria === 'ME e EPP'
    }
    if (
      termoNorm === 'me' ||
      termoNorm === 'epp' ||
      termoNorm === 'microempresa' ||
      termoNorm === 'mei'
    ) {
      return item.categoria === 'ME e EPP' || item.categoria === 'Simples Nacional'
    }
    if (
      termoNorm === 'lucro presumido' ||
      termoNorm === 'lucro real' ||
      termoNorm === 'presumido' ||
      termoNorm === 'real'
    ) {
      return item.categoria === 'Regimes Societários'
    }
    if (
      termoNorm === 'entidades associativas' ||
      termoNorm === 'associacao' ||
      termoNorm === 'associacoes' ||
      termoNorm === 'ong' ||
      termoNorm === 'terceiro setor'
    ) {
      return item.categoria === 'Entidades Associativas'
    }
    if (
      termoNorm === 'sindicato' ||
      termoNorm === 'sindicatos' ||
      termoNorm === 'sindical' ||
      termoNorm === 'contribuicao sindical'
    ) {
      return item.categoria === 'Sindicatos'
    }
    if (
      termoNorm === 'comite gestor' ||
      termoNorm === 'comite gestor do ibs' ||
      termoNorm === 'cgibs' ||
      termoNorm === 'aliquota de referencia' ||
      termoNorm === '26,5' ||
      termoNorm === '26.5'
    ) {
      return item.categoria === 'Comitê Gestor'
    }
    if (
      termoNorm === 'combustivel' ||
      termoNorm === 'combustiveis' ||
      termoNorm === 'gasolina' ||
      termoNorm === 'diesel' ||
      termoNorm === 'financeiro' ||
      termoNorm === 'banco' ||
      termoNorm === 'zfm' ||
      termoNorm === 'zona franca'
    ) {
      return item.categoria === 'Regras Especiais'
    }
    if (
      termoNorm === 'imunidade' ||
      termoNorm === 'imunidades' ||
      termoNorm === 'livro' ||
      termoNorm === 'livros' ||
      termoNorm === 'exportacao'
    ) {
      return (
        item.categoria === 'Imunidades por Produtos e Segmentos' ||
        item.categoria === 'Entidades Associativas' ||
        item.categoria === 'Sindicatos'
      )
    }

    return false
  })

  const categoriasPresentes = Array.from(
    new Set(assuntosEspeciaisFiltrados.map((item) => item.categoria)),
  )

  // 1. Classificações oficiais (NCM, cClassTrib, CST, CEST, cCredPres, etc.)
  const classifPromise = fetchClassifications({
    tipo: tipoClassif,
    termo: rawTerm,
    page: classifPage,
    perPage: classifPerPage,
    sortBy: 'codigo',
    sortDirection: 'asc',
  })

  // 2. Normas centrais (tax_norms do PocketBase ou fallback oficial)
  const normasPromise = (async (): Promise<TaxNormItem[]> => {
    try {
      if (rawTerm) {
        const sanitized = rawTerm.replace(/"/g, '\\"')
        const filter = `code ~ "${sanitized}" || title ~ "${sanitized}" || summary ~ "${sanitized}" || status_incidence ~ "${sanitized}" || norm_type ~ "${sanitized}"`
        const res = await pb.collection('tax_norms').getList<TaxNormItem>(1, 50, {
          filter,
          sort: 'order',
          requestKey: null,
        })
        if (res.items && res.items.length > 0) return res.items
      }
      // Se não encontrou no filtro de banco ou termo vazio, busca geral e filtra
      const all = await pb.collection('tax_norms').getFullList<TaxNormItem>({
        sort: 'order',
        requestKey: null,
      })
      const base = all.length > 0 ? all : fallbackNorms
      if (!termoNorm) return base
      return base.filter((n) => {
        const str = normalizar(
          `${n.code} ${n.title} ${n.summary} ${n.status_incidence} ${n.norm_type || ''} ${n.origin || ''}`,
        )
        return str.includes(termoNorm)
      })
    } catch {
      if (!termoNorm) return fallbackNorms
      return fallbackNorms.filter((n) =>
        normalizar(`${n.code} ${n.title} ${n.summary}`).includes(termoNorm),
      )
    }
  })()

  // 3. Radar de Atos dos 3 Níveis (radar_atos do PocketBase)
  const radarAtosPromise = (async (): Promise<RadarAtoBuscaItem[]> => {
    try {
      const filterParts: string[] = []
      if (atosNivel !== 'todos') {
        filterParts.push(`nivel = "${atosNivel}"`)
      }
      if (rawTerm) {
        const sanitized = rawTerm.replace(/"/g, '\\"')
        filterParts.push(
          `(titulo ~ "${sanitized}" || tipo_ato ~ "${sanitized}" || ente_nome ~ "${sanitized}" || uf ~ "${sanitized}" || trecho ~ "${sanitized}" || termos ~ "${sanitized}")`,
        )
      }
      const res = await pb.collection('radar_atos').getList<RadarAtoBuscaItem>(1, 50, {
        filter: filterParts.length > 0 ? filterParts.join(' && ') : undefined,
        sort: '-data_publicacao',
        requestKey: null,
      })
      return res.items || []
    } catch (err) {
      console.warn('Erro ao consultar radar_atos na busca avançada:', err)
      return []
    }
  })()

  // 4. Tax Topics conceituais do PocketBase
  const taxTopicsPromise = (async (): Promise<TaxTopicBuscaItem[]> => {
    try {
      const all = await pb.collection('tax_topics').getFullList<TaxTopicBuscaItem>({
        sort: 'order',
        requestKey: null,
      })
      if (!termoNorm) return all
      return all.filter((t) => {
        const str = normalizar(
          `${t.title} ${t.category} ${t.treatment} ${t.legal_basis} ${t.description}`,
        )
        return str.includes(termoNorm)
      })
    } catch {
      return []
    }
  })()

  // Aguarda buscas assíncronas paralelas
  const [classifResult, normasResult, radarAtosResult, taxTopicsResult] = await Promise.all([
    classifPromise,
    normasPromise,
    radarAtosPromise,
    taxTopicsPromise,
  ])

  // 5. Filtrar e correlacionar tratamentos e alíquotas
  const tratamentosCorrelatos = TRATAMENTOS_BASE.filter((item) => {
    if (!termoNorm) return true
    const searchSpace = normalizar(
      `${item.tema} ${item.tipoTratamento} ${item.fundamentoLegal} ${item.observacao} ${item.categoria}`,
    )
    // Sinônimos contextuais
    if (termoNorm === 'arroz' || termoNorm === 'feijao' || termoNorm === 'alimento') {
      return item.categoria === 'Cesta Básica' || item.tema.includes('Agro')
    }
    if (termoNorm === 'isencao' || termoNorm === 'isencao') {
      return item.tipoTratamento.includes('Isenção') || item.tipoTratamento.includes('Zero')
    }
    if (termoNorm === 'imunidade') {
      return item.categoria === 'Imunidade'
    }
    if (termoNorm === 'zfm' || termoNorm === 'zona franca') {
      return item.tema.includes('Zona Franca')
    }
    return searchSpace.includes(termoNorm)
  })

  // 6. Conexões Legais (cadeia legal: LC 214/2025, EC 132/2023, RIBS, Anexos)
  const conexoesFiltradas: ConexaoLegalItem[] = []

  // Conexões derivadas de VINCULOS_POR_BLOCO e ANEXOS
  Object.entries(VINCULOS_POR_BLOCO).forEach(([blocoKey, bloco]) => {
    const anexoRef = ANEXOS.find((a) => a.id === blocoKey)
    const confiancaAlta = (bloco.linhas.match(/a/g) || []).length
    const total = bloco.linhas.length
    const matchTermo =
      !termoNorm ||
      normalizar(
        `${bloco.norma} ${bloco.dispositivo} ${bloco.anexo} ${anexoRef?.tituloOficial || ''} ${anexoRef?.detalhe || ''}`,
      ).includes(termoNorm)

    if (matchTermo) {
      conexoesFiltradas.push({
        id: `conex-${blocoKey}`,
        norma: bloco.norma,
        dispositivo: bloco.dispositivo,
        remissao: bloco.remissao,
        anexo: bloco.anexo,
        rotulo: anexoRef?.tituloOficial || bloco.anexo,
        detalhe:
          anexoRef?.detalhe || `Bloco normativo com ${total} itens (${confiancaAlta} confirmados)`,
        aliquotaOuEfeito: anexoRef?.efeito || 'Associação direta à legislação complementar',
        confianca: confiancaAlta / total > 0.8 ? 'alta' : 'media',
      })
    }
  })

  // Inclui tópicos de lei (tax_topics) nas conexões legais quando relevantes
  taxTopicsResult.forEach((top) => {
    conexoesFiltradas.push({
      id: `top-${top.id}`,
      norma: 'LC 214/2025 (Fato Gerador / Regras Gerais)',
      dispositivo: top.legal_basis,
      remissao: 'EC 132/2023, art. 156-A e 195 V',
      anexo: top.category,
      rotulo: top.title,
      detalhe: top.description,
      aliquotaOuEfeito: top.treatment,
      confianca: 'alta',
    })
  })

  // 7. Análises e Projeções de Especialistas
  const analisesFiltradas = ANALISES_ESPECIALISTAS_BASE.filter((an) => {
    if (!termoNorm) return true
    const searchSpace = normalizar(
      `${an.tema} ${an.autoridadeOuFonte} ${an.resumo} ${an.impactoOuProjecao} ${an.tag}`,
    )
    if ((termoNorm === 'arroz' || termoNorm === 'cesta basica') && an.tag === 'Cesta Básica')
      return true
    if (termoNorm === 'agronegocio' && an.tag === 'Agronegócio') return true
    if (termoNorm === 'aliquota' && (an.tag === 'Macroeconomia' || an.tag === 'Profissionais'))
      return true
    return searchSpace.includes(termoNorm)
  })

  // 8. Gráficos correlatos:
  // (a) Composição dos Atos por nível/tipo
  const countFederal =
    normasResult.length + radarAtosResult.filter((a) => a.nivel === 'federal').length
  const countEstadual = radarAtosResult.filter((a) => a.nivel === 'estadual').length
  const countMunicipal = radarAtosResult.filter((a) => a.nivel === 'municipal').length

  const composicaoAtos = [
    { name: 'Federais', count: countFederal, fill: '#1e3a8a' }, // navy
    { name: 'Estaduais', count: Math.max(countEstadual, 1), fill: '#0d9488' }, // teal
    { name: 'Municipais', count: Math.max(countMunicipal, 1), fill: '#d97706' }, // amber
  ]

  // (b) Linha do tempo das alíquotas (cronograma de transição)
  const linhaDoTempoAliquota = [
    { ano: '2026', cbs: 0.9, ibs: 0.1, total: 1.0, nota: 'Ano-teste informativo' },
    { ano: '2027', cbs: CBS_REF, ibs: 0.1, total: CBS_REF + 0.1, nota: 'CBS plena (TCU)' },
    { ano: '2028', cbs: CBS_REF, ibs: 0.1, total: CBS_REF + 0.1, nota: 'IBS teste 0,1%' },
    {
      ano: '2029',
      cbs: CBS_REF,
      ibs: Number((IBS_REF * 0.1).toFixed(2)),
      total: Number((CBS_REF + IBS_REF * 0.1).toFixed(2)),
      nota: '10% do IBS',
    },
    {
      ano: '2030',
      cbs: CBS_REF,
      ibs: Number((IBS_REF * 0.4).toFixed(2)),
      total: Number((CBS_REF + IBS_REF * 0.4).toFixed(2)),
      nota: '40% do IBS',
    },
    {
      ano: '2031',
      cbs: CBS_REF,
      ibs: Number((IBS_REF * 0.7).toFixed(2)),
      total: Number((CBS_REF + IBS_REF * 0.7).toFixed(2)),
      nota: '70% do IBS',
    },
    {
      ano: '2032',
      cbs: CBS_REF,
      ibs: Number((IBS_REF * 0.9).toFixed(2)),
      total: Number((CBS_REF + IBS_REF * 0.9).toFixed(2)),
      nota: '90% do IBS',
    },
    { ano: '2033', cbs: CBS_REF, ibs: IBS_REF, total: REF_TOTAL, nota: 'Regime pleno 30%' },
  ]

  // (c) Classificações agrupadas por tipo
  const mapTipos: Record<string, number> = {}
  classifResult.items.forEach((item) => {
    const t = item.tipo || 'NCM'
    mapTipos[t] = (mapTipos[t] || 0) + 1
  })
  const classificacoesPorTipo = Object.entries(mapTipos).map(([tipo, count]) => ({
    tipo,
    count,
  }))

  const totalGeral =
    assuntosEspeciaisFiltrados.length +
    normasResult.length +
    radarAtosResult.length +
    classifResult.totalItems +
    tratamentosCorrelatos.length +
    conexoesFiltradas.length +
    analisesFiltradas.length

  return {
    termo: rawTerm,
    timestamp: new Date().toLocaleTimeString('pt-BR'),
    totalGeralEncontrado: totalGeral,
    assuntosEspeciais: {
      items: assuntosEspeciaisFiltrados,
      total: assuntosEspeciaisFiltrados.length,
      categoriasPresentes,
    },
    normas: {
      items: normasResult,
      total: normasResult.length,
    },
    radarAtos: {
      items: radarAtosResult,
      total: radarAtosResult.length,
    },
    classificacoes: {
      items: classifResult.items,
      totalItems: classifResult.totalItems,
      page: classifResult.page,
      perPage: classifResult.perPage,
      totalPages: classifResult.totalPages,
      source: classifResult.source,
    },
    aliquotasTratamentos: tratamentosCorrelatos,
    conexoesLegais: conexoesFiltradas,
    analisesEspecialistas: analisesFiltradas,
    dadosGraficos: {
      composicaoAtos,
      linhaDoTempoAliquota,
      classificacoesPorTipo,
    },
  }
}
