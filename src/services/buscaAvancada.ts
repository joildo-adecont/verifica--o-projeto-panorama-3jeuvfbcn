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
import { ANEXOS_REFORMA_CATALOGO, type AnexoReformaItem } from '@/data/anexosReforma'
import type { ClassificationItem, TaxNormItem } from '@/types/panorama'
import {
  fetchIndicadoresEconomicos,
  fetchFontesEstatisticas,
  buscarIndicadoresPorPalavraChave,
  itensFontesEstatisticasParaBusca,
  itensIndicadoresParaBusca,
  respostaFallback,
  type ItemIndicadorBusca,
  type RespostaIndicadores,
  type RespostaFontesEstatisticas,
} from '@/services/indicadoresEconomicos'

export type { AssuntoEspecialItem, CategoriaAssuntoEspecial }
export type { AnexoReformaItem }

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

export type GrupoResultadoId =
  | 'normas'
  | 'classificacoes'
  | 'assuntos-especiais'
  | 'anexos'
  | 'aliquotas'
  | 'analises'
  | 'indicadores'

export type EsferaFederativaId = 'federal' | 'estadual' | 'municipal'

export interface FiltrosAvancados {
  grupos?: GrupoResultadoId[] // se vazio ou undefined = todos
  esferas?: EsferaFederativaId[] // se vazio = todas
  fontes?: string[] // CGIBS, Planalto, RFB, CONFAZ, IBGE, Siscomex, CGSN, SUFRAMA, etc.
  tiposAto?: string[] // Resolução, Decreto, Portaria, Ato, Lei, Emenda Constitucional
  tabelas?: string[] // as 11 tabelas (NCM, cClassTrib, CST, cCredPres, CEST, etc.)
  reducoes?: string[] // '0%', '-30%', '-50%', '-60%', '-100%'
}

export interface ParametrosBuscaAvancada {
  termo: string
  tipoClassificacao?: string
  classifPage?: number
  classifPerPage?: number
  atosNivel?: 'todos' | 'federal' | 'estadual' | 'municipal'
  categoriaEspecial?: string
  filtroAnexo?: string
  filtros?: FiltrosAvancados
}

export interface ResultadoBuscaAvancada {
  termo: string
  timestamp: string
  totalGeralEncontrado: number
  filtrosAplicados?: FiltrosAvancados
  // (0) Assuntos Especiais — fora da tributação geral (grupo de maior destaque)
  assuntosEspeciais: {
    items: AssuntoEspecialItem[]
    total: number
    categoriasPresentes: string[]
  }
  // (0b) Anexos da Reforma Tributária (LC 214/2025 e regimes específicos com produtos, reduções e capitulações)
  anexosReforma: {
    items: AnexoReformaItem[]
    total: number
    categoriasPresentes: string[]
    resumoReducoes: Array<{
      numero: string
      titulo: string
      reducaoPct: number
      rotulo: string
      totalProdutos: number
      baseLegal: string
    }>
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
  // (f) Indicadores Econômicos e Financeiros — BCB (oficial institucional), via proxy do backend
  indicadoresEconomicos: ItemIndicadorBusca[]
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
  const filtroAnexo = params.filtroAnexo || 'TODOS'
  const f = params.filtros

  // Helpers de compatibilidade e facetamento
  const gruposAtivos = f?.grupos && f.grupos.length > 0 ? new Set(f.grupos) : null
  const esferasAtivas = f?.esferas && f.esferas.length > 0 ? new Set(f.esferas) : null
  const fontesAtivas = f?.fontes && f.fontes.length > 0 ? f.fontes.map((x) => normalizar(x)) : null
  const tiposAtoAtivos =
    f?.tiposAto && f.tiposAto.length > 0 ? f.tiposAto.map((x) => normalizar(x)) : null
  const tabelasAtivas = f?.tabelas && f.tabelas.length > 0 ? new Set(f.tabelas) : null
  const reducoesAtivas = f?.reducoes && f.reducoes.length > 0 ? new Set(f.reducoes) : null

  // 0. Assuntos Especiais — fora da tributação geral
  const assuntosEspeciaisFiltrados =
    gruposAtivos && !gruposAtivos.has('assuntos-especiais')
      ? []
      : ASSUNTOS_ESPECIAIS_CATALOGO.filter((item) => {
          if (filtroCategoriaEspecial !== 'TODAS' && item.categoria !== filtroCategoriaEspecial) {
            return false
          }

          // Filtro de fonte nas fontes oficiais do assunto
          if (fontesAtivas) {
            const matchFonte = item.fontesOficiais.some((fo) => {
              const norm = normalizar(`${fo.orgao} ${fo.nome}`)
              return fontesAtivas.some((fa) => norm.includes(fa) || fa.includes(norm))
            })
            if (!matchFonte) return false
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
            termoNorm === 'periodico' ||
            termoNorm === 'periodicos' ||
            termoNorm === 'jornal' ||
            termoNorm === 'jornais' ||
            termoNorm === 'exportacao' ||
            termoNorm === 'exportacoes' ||
            termoNorm === 'templo' ||
            termoNorm === 'templos' ||
            termoNorm === 'templo religioso' ||
            termoNorm === 'igreja' ||
            termoNorm === 'religioso' ||
            termoNorm === 'ouro' ||
            termoNorm === 'ativo financeiro' ||
            termoNorm === 'reciprocidade' ||
            termoNorm === 'partido' ||
            termoNorm === 'partidos' ||
            termoNorm === 'partido politico' ||
            termoNorm === 'fundo partidario' ||
            termoNorm === 'assistencia social' ||
            termoNorm === 'instituicoes de educacao' ||
            termoNorm === 'filantropia' ||
            termoNorm === 'cebas' ||
            termoNorm === 'nutricao enteral' ||
            termoNorm === 'acessibilidade' ||
            termoNorm === 'petroleo' ||
            termoNorm === 'gas natural' ||
            termoNorm === 'horticolas' ||
            termoNorm === 'hortifruti' ||
            termoNorm === 'frutas' ||
            termoNorm === 'ovos'
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

  // 0b. Anexos da Reforma Tributária (LC 214/2025, EC 132/2023, RIBS)
  const anexosReformaFiltrados =
    gruposAtivos && !gruposAtivos.has('anexos')
      ? []
      : ANEXOS_REFORMA_CATALOGO.filter((anexo) => {
          if (filtroAnexo !== 'TODOS' && anexo.id !== filtroAnexo && anexo.numero !== filtroAnexo) {
            return false
          }

          // Filtro de redução/alíquota (0%, -30%, -50%, -60%, -100%)
          if (reducoesAtivas) {
            const pct = anexo.reducaoAliquotaPct
            const rot = anexo.reducaoRotulo
            const matchReducao = Array.from(reducoesAtivas).some((r) => {
              if (r === '0%' && (pct === 0 || rot.includes('0%') || rot.includes('Zero')))
                return true
              if (r === '-30%' && (pct === -30 || rot.includes('30%'))) return true
              if (r === '-50%' && (pct === -50 || rot.includes('50%'))) return true
              if (r === '-60%' && (pct === -60 || rot.includes('60%'))) return true
              if (r === '-100%' && (pct === -100 || rot.includes('100%') || rot.includes('Zero')))
                return true
              return rot.includes(r)
            })
            if (!matchReducao) return false
          }

          // Filtro de fontes oficiais
          if (fontesAtivas) {
            const seloNorm = normalizar(`${anexo.fonteOficial.nome} ${anexo.fonteOficial.selo}`)
            const matchFonte = fontesAtivas.some(
              (fa) => seloNorm.includes(fa) || fa.includes(seloNorm),
            )
            if (!matchFonte) return false
          }

          // Filtro de tabela quando o usuário filtrar por uma tabela específica de classificações
          if (tabelasAtivas) {
            const matchTabela = anexo.produtosServicos.some((p) => {
              if (p.tipoCodigo && tabelasAtivas.has(p.tipoCodigo)) return true
              if (tabelasAtivas.has('NCM') && p.ncm) return true
              if (tabelasAtivas.has('NBS') && p.nbs) return true
              if (tabelasAtivas.has('cClassTrib') && p.cClassTrib) return true
              if (tabelasAtivas.has('cCredPres') && p.cCredPres) return true
              if (tabelasAtivas.has('CEST') && p.cest) return true
              return false
            })
            if (!matchTabela) return false
          }

          if (!termoNorm) return true

          // Monta espaço de busca textual contendo título, capitulação, produtos, NCMs e tags
          const produtosStr = anexo.produtosServicos
            .map(
              (p) =>
                `${p.item} ${p.descricao} ${p.codigo || ''} ${p.tipoCodigo || ''} ${p.detalhes || ''}`,
            )
            .join(' ')
          const searchSpace = normalizar(
            `${anexo.numero} ${anexo.titulo} ${anexo.subtitulo} ${anexo.capitulacaoLegal} ${anexo.artigosRemissao.join(' ')} ${anexo.reducaoRotulo} ${anexo.aliquotaEfetivaIbsCbs} ${anexo.resumo} ${anexo.tags.join(' ')} ${anexo.categoria} ${produtosStr}`,
          )

          if (searchSpace.includes(termoNorm)) return true

          // Sinônimos tributários e de produtos
          if (
            termoNorm === 'arroz' ||
            termoNorm === 'feijao' ||
            termoNorm === 'leite' ||
            termoNorm === 'pao'
          ) {
            return anexo.numero === 'Anexo I'
          }
          if (
            termoNorm === 'medicina' ||
            termoNorm === 'medico' ||
            termoNorm === 'hospital' ||
            termoNorm === 'clinica' ||
            termoNorm === 'saude'
          ) {
            return (
              anexo.numero === 'Anexo III' ||
              anexo.numero === 'Anexo IV' ||
              anexo.numero === 'Anexo XII' ||
              anexo.id.includes('saude')
            )
          }
          if (
            termoNorm === 'dispositivo medico' ||
            termoNorm === 'dispositivo' ||
            termoNorm === 'tomografo' ||
            termoNorm === 'respirador' ||
            termoNorm === 'marcapasso'
          ) {
            return anexo.numero === 'Anexo IV' || anexo.numero === 'Anexo XII'
          }
          if (
            termoNorm === 'insumo' ||
            termoNorm === 'insumo agropecuario' ||
            termoNorm === 'fertilizante' ||
            termoNorm === 'defensivo' ||
            termoNorm === 'semente' ||
            termoNorm === 'racao'
          ) {
            return anexo.numero === 'Anexo IX'
          }
          if (
            termoNorm === 'educacao' ||
            termoNorm === 'servico de educacao' ||
            termoNorm === 'escola' ||
            termoNorm === 'faculdade' ||
            termoNorm === 'universidade'
          ) {
            return anexo.numero === 'Anexo II'
          }
          if (
            termoNorm === 'acessibilidade' ||
            termoNorm === 'pcd' ||
            termoNorm === 'cadeirante' ||
            termoNorm === 'cadeira de rodas'
          ) {
            return anexo.numero === 'Anexo V' || anexo.numero === 'Anexo XIII'
          }
          if (
            termoNorm === 'cooperativa' ||
            termoNorm === 'cooperativas' ||
            termoNorm === 'sociedade cooperativa' ||
            termoNorm === 'cooperado'
          ) {
            return anexo.id === 'anexo-regime-cooperativas'
          }
          if (
            termoNorm === 'intercambio' ||
            termoNorm === 'intercambio internacional' ||
            termoNorm === 'estudante' ||
            termoNorm === 'turismo'
          ) {
            return anexo.id === 'anexo-regime-intercambio'
          }
          if (
            termoNorm === 'combustivel' ||
            termoNorm === 'combustiveis' ||
            termoNorm === 'gasolina' ||
            termoNorm === 'diesel' ||
            termoNorm === 'etanol' ||
            termoNorm === 'glp' ||
            termoNorm === 'mineral' ||
            termoNorm === 'monofasico'
          ) {
            return anexo.id === 'anexo-regime-combustiveis'
          }
          if (
            termoNorm === 'plano de saude' ||
            termoNorm === 'planos de saude' ||
            termoNorm === 'planos privados' ||
            termoNorm === 'convenio'
          ) {
            return anexo.id === 'anexo-regime-planos-saude' || anexo.numero === 'Anexo III'
          }
          if (
            termoNorm === 'cultura' ||
            termoNorm === 'incentivo a cultura' ||
            termoNorm === 'audiovisual' ||
            termoNorm === 'teatro' ||
            termoNorm === 'cinema'
          ) {
            return anexo.numero === 'Anexo X'
          }
          if (
            termoNorm === 'profissao' ||
            termoNorm === 'profissoes' ||
            termoNorm === 'advogado' ||
            termoNorm === 'contador' ||
            termoNorm === 'engenheiro'
          ) {
            return anexo.id === 'anexo-profissoes-30'
          }
          if (
            termoNorm === 'imposto seletivo' ||
            termoNorm === 'seletivo' ||
            termoNorm === 'cigarro' ||
            termoNorm === 'cerveja'
          ) {
            return anexo.numero === 'Anexo XVII'
          }

          return false
        })

  const categoriasAnexosPresentes = Array.from(
    new Set(anexosReformaFiltrados.map((item) => item.categoria)),
  )

  const resumoReducoes = anexosReformaFiltrados.map((a) => ({
    numero: a.numero,
    titulo: a.titulo,
    reducaoPct: a.reducaoAliquotaPct,
    rotulo: a.reducaoRotulo,
    totalProdutos: a.produtosServicos.length,
    baseLegal: a.capitulacaoLegal,
  }))

  // 1. Classificações oficiais (NCM, cClassTrib, CST, CEST, cCredPres, etc.)
  // Se o grupo Classificações estiver desmarcado, pula a busca server-side pesada
  const classifDesativado = gruposAtivos && !gruposAtivos.has('classificacoes')
  // Se houver filtro de tabela selecionado via filtros facetados, aplica se for único ou mantém TODOS
  const tipoParaBuscar =
    tabelasAtivas && tabelasAtivas.size === 1 ? Array.from(tabelasAtivas)[0] : tipoClassif

  const classifPromise = classifDesativado
    ? Promise.resolve({
        items: [] as ClassificationItem[],
        totalItems: 0,
        page: 1,
        perPage: classifPerPage,
        totalPages: 0,
        source: 'database' as const,
      })
    : fetchClassifications({
        tipo: tipoParaBuscar,
        termo: rawTerm,
        page: classifPage,
        perPage: classifPerPage,
        sortBy: 'codigo',
        sortDirection: 'asc',
      }).then((res) => {
        let items = res.items
        if (tabelasAtivas && tabelasAtivas.size > 0) {
          items = items.filter((it) => tabelasAtivas.has(it.tipo))
        }
        if (fontesAtivas && fontesAtivas.length > 0) {
          items = items.filter((it) => {
            const fonteNorm = normalizar(`${it.fonte} ${it.tabela_origem || ''}`)
            return fontesAtivas.some((fa) => fonteNorm.includes(fa) || fa.includes(fonteNorm))
          })
        }
        return {
          ...res,
          items,
          totalItems: tabelasAtivas || fontesAtivas ? items.length : res.totalItems,
        }
      })

  // 2. Normas centrais (tax_norms do PocketBase ou fallback oficial)
  // Se o grupo normas estiver desativado, retorna lista vazia
  const normasDesativadas = gruposAtivos && !gruposAtivos.has('normas')

  const normasPromise = (async (): Promise<TaxNormItem[]> => {
    if (normasDesativadas) return []
    // Se esferas não incluir 'federal', normas centrais federais não aparecem
    if (esferasAtivas && !esferasAtivas.has('federal')) return []

    let base: TaxNormItem[] = []
    try {
      if (rawTerm) {
        const sanitized = rawTerm.replace(/"/g, '\\"')
        const filter = `code ~ "${sanitized}" || title ~ "${sanitized}" || summary ~ "${sanitized}" || status_incidence ~ "${sanitized}" || norm_type ~ "${sanitized}"`
        const res = await pb.collection('tax_norms').getList<TaxNormItem>(1, 50, {
          filter,
          sort: 'order',
          requestKey: null,
        })
        if (res.items && res.items.length > 0) {
          base = res.items
        }
      }
      if (base.length === 0) {
        const all = await pb.collection('tax_norms').getFullList<TaxNormItem>({
          sort: 'order',
          requestKey: null,
        })
        base = all.length > 0 ? all : fallbackNorms
      }
    } catch {
      base = fallbackNorms
    }

    return base.filter((n) => {
      if (termoNorm) {
        const str = normalizar(
          `${n.code} ${n.title} ${n.summary} ${n.status_incidence} ${n.norm_type || ''} ${n.origin || ''}`,
        )
        if (!str.includes(termoNorm)) return false
      }
      // Filtro de tipo de ato normativo
      if (tiposAtoAtivos) {
        const tipoNorm = normalizar(n.norm_type || '')
        const matchTipo = tiposAtoAtivos.some(
          (ta) => tipoNorm.includes(ta) || ta.includes(tipoNorm),
        )
        if (!matchTipo) return false
      }
      // Filtro de fonte oficial
      if (fontesAtivas) {
        const fonteNorm = normalizar(n.origin || '')
        const matchFonte = fontesAtivas.some(
          (fa) => fonteNorm.includes(fa) || fa.includes(fonteNorm),
        )
        if (!matchFonte) return false
      }
      return true
    })
  })()

  // 3. Radar de Atos dos 3 Níveis (radar_atos do PocketBase)
  const radarAtosPromise = (async (): Promise<RadarAtoBuscaItem[]> => {
    if (normasDesativadas) return []
    try {
      const filterParts: string[] = []
      // Se houver esferas facetadas ativas
      if (esferasAtivas && esferasAtivas.size > 0) {
        const esferasFiltro = Array.from(esferasAtivas)
          .map((esf) => `nivel = "${esf}"`)
          .join(' || ')
        filterParts.push(`(${esferasFiltro})`)
      } else if (atosNivel !== 'todos') {
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
      let items = res.items || []

      // Filtro de tipo de ato em radar_atos
      if (tiposAtoAtivos) {
        items = items.filter((a) => {
          const tNorm = normalizar(`${a.tipo_ato} ${a.titulo}`)
          return tiposAtoAtivos.some((ta) => tNorm.includes(ta) || ta.includes(tNorm))
        })
      }

      // Filtro de fontes oficiais
      if (fontesAtivas) {
        items = items.filter((a) => {
          const fNorm = normalizar(`${a.fonte_oficial || ''} ${a.ente_nome || ''}`)
          return fontesAtivas.some((fa) => fNorm.includes(fa) || fa.includes(fNorm))
        })
      }

      return items
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

  // 4b. Indicadores Econômicos e Financeiros (BCB via proxy do backend; nunca falha — tem fallback interno)
  // 4c. Fontes estatísticas oficiais (IBGE / Tesouro Nacional / IPEA via proxy do backend)
  const indicadoresDesativado = gruposAtivos && !gruposAtivos.has('indicadores')
  const indicadoresPromise: Promise<RespostaIndicadores> = indicadoresDesativado
    ? Promise.resolve(respostaFallback(''))
    : fetchIndicadoresEconomicos()
  const estatisticasPromise: Promise<RespostaFontesEstatisticas> = indicadoresDesativado
    ? Promise.resolve({ ok: true, geradoEm: '', fontes: [] })
    : fetchFontesEstatisticas('todas')

  // Aguarda buscas assíncronas paralelas
  const [
    classifResult,
    normasResult,
    radarAtosResult,
    taxTopicsResult,
    respostaIndicadores,
    respostaEstatisticas,
  ] = await Promise.all([
    classifPromise,
    normasPromise,
    radarAtosPromise,
    taxTopicsPromise,
    indicadoresPromise,
    estatisticasPromise,
  ])

  const indicadoresFiltrados: ItemIndicadorBusca[] = indicadoresDesativado
    ? []
    : (termoNorm
        ? buscarIndicadoresPorPalavraChave(rawTerm, respostaIndicadores, respostaEstatisticas)
        : [
            ...itensIndicadoresParaBusca(respostaIndicadores),
            ...itensFontesEstatisticasParaBusca(respostaEstatisticas),
          ]
      ).filter((item) => {
        if (!fontesAtivas) return true
        const fNorm = normalizar(item.fonte)
        return fontesAtivas.some((fa) => fNorm.includes(fa) || fa.includes(fNorm))
      })

  // 5. Filtrar e correlacionar tratamentos e alíquotas
  const tratamentosCorrelatos =
    gruposAtivos && !gruposAtivos.has('aliquotas')
      ? []
      : TRATAMENTOS_BASE.filter((item) => {
          // Filtro de reduções/alíquotas
          if (reducoesAtivas) {
            const matchReducao = Array.from(reducoesAtivas).some((r) => {
              if (
                r === '0%' &&
                (item.reducaoOuFator.includes('0%') ||
                  item.tipoTratamento.includes('Zero') ||
                  item.tipoTratamento.includes('Isenção'))
              )
                return true
              if (
                r === '-30%' &&
                (item.reducaoOuFator.includes('30%') || item.tipoTratamento.includes('30%'))
              )
                return true
              if (
                r === '-50%' &&
                (item.reducaoOuFator.includes('50%') || item.tipoTratamento.includes('50%'))
              )
                return true
              if (
                r === '-60%' &&
                (item.reducaoOuFator.includes('60%') || item.tipoTratamento.includes('60%'))
              )
                return true
              if (
                r === '-100%' &&
                (item.reducaoOuFator.includes('100%') ||
                  item.tipoTratamento.includes('100%') ||
                  item.tipoTratamento.includes('Zero'))
              )
                return true
              return item.reducaoOuFator.includes(r) || item.tipoTratamento.includes(r)
            })
            if (!matchReducao) return false
          }

          if (!termoNorm) return true
          const searchSpace = normalizar(
            `${item.tema} ${item.tipoTratamento} ${item.fundamentoLegal} ${item.observacao} ${item.categoria}`,
          )
          // Sinônimos contextuais
          if (termoNorm === 'arroz' || termoNorm === 'feijao' || termoNorm === 'alimento') {
            return item.categoria === 'Cesta Básica' || item.tema.includes('Agro')
          }
          if (termoNorm === 'isencao' || termoNorm === 'isencao' || termoNorm === 'isencoes') {
            return item.tipoTratamento.includes('Isenção') || item.tipoTratamento.includes('Zero')
          }
          if (
            termoNorm === 'imunidade' ||
            termoNorm === 'imunidades' ||
            termoNorm === 'templo' ||
            termoNorm === 'templo religioso' ||
            termoNorm === 'livro' ||
            termoNorm === 'livros' ||
            termoNorm === 'exportacao' ||
            termoNorm === 'exportacoes' ||
            termoNorm === 'ouro' ||
            termoNorm === 'reciprocidade'
          ) {
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
  const analisesFiltradas =
    gruposAtivos && !gruposAtivos.has('analises')
      ? []
      : ANALISES_ESPECIALISTAS_BASE.filter((an) => {
          if (fontesAtivas) {
            const fNorm = normalizar(an.autoridadeOuFonte)
            const matchFonte = fontesAtivas.some((fa) => fNorm.includes(fa) || fa.includes(fNorm))
            if (!matchFonte) return false
          }

          if (!termoNorm) return true
          const searchSpace = normalizar(
            `${an.tema} ${an.autoridadeOuFonte} ${an.resumo} ${an.impactoOuProjecao} ${an.tag}`,
          )
          if ((termoNorm === 'arroz' || termoNorm === 'cesta basica') && an.tag === 'Cesta Básica')
            return true
          if (termoNorm === 'agronegocio' && an.tag === 'Agronegócio') return true
          if (
            termoNorm === 'aliquota' &&
            (an.tag === 'Macroeconomia' || an.tag === 'Profissionais')
          )
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
    anexosReformaFiltrados.length +
    normasResult.length +
    radarAtosResult.length +
    classifResult.totalItems +
    tratamentosCorrelatos.length +
    conexoesFiltradas.length +
    analisesFiltradas.length +
    indicadoresFiltrados.length

  return {
    termo: rawTerm,
    timestamp: new Date().toLocaleTimeString('pt-BR'),
    totalGeralEncontrado: totalGeral,
    filtrosAplicados: f,
    assuntosEspeciais: {
      items: assuntosEspeciaisFiltrados,
      total: assuntosEspeciaisFiltrados.length,
      categoriasPresentes,
    },
    anexosReforma: {
      items: anexosReformaFiltrados,
      total: anexosReformaFiltrados.length,
      categoriasPresentes: categoriasAnexosPresentes,
      resumoReducoes,
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
    indicadoresEconomicos: indicadoresFiltrados,
    dadosGraficos: {
      composicaoAtos,
      linhaDoTempoAliquota,
      classificacoesPorTipo,
    },
  }
}
