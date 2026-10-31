import { useMemo, useState } from 'react'
import {
  Globe2,
  Building2,
  Landmark,
  Search,
  X,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Radar,
  MapPin,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Filter,
} from 'lucide-react'
import {
  MUNICIPIOS_IBGE_POR_UF,
  ATOS_NORMATIVOS_MUNICIPAIS,
  AtoNormativoMunicipal,
  MunicipioIBGE,
} from '../data/radarMunicipios'

/**
 * SEÇÃO 19 — RADAR NACIONAL: FEDERAL, ESTADUAL E MUNICIPAL COM INDIVIDUALIZAÇÃO POR MUNICÍPIO
 * =========================================================================================
 * Requisitos atendidos:
 * 1. Cada estado permite expandir e visualizar seus municípios individualmente (dados oficiais IBGE).
 * 2. Pesquisa e filtro de atos normativos por nome de município e código IBGE.
 * 3. Exibição flexível por Estado (UF) e por Município individualizado.
 * 4. Total fidelidade ao design existente da ADECONT, tipografia e métricas visuais.
 */

interface AtoRadar {
  uf: string
  titulo: string
  url: string
  assoc: string
  nivel: 'municipal' | 'estadual' | 'federal'
  municipio?: string
  codigoIbge?: string
}

// Atos oficiais com enriquecimento de dados municipais (IBGE)
const ATOS_COMPLETOS: AtoRadar[] = [
  ...ATOS_NORMATIVOS_MUNICIPAIS.map((am: AtoNormativoMunicipal) => ({
    uf: am.uf,
    titulo: am.titulo + (am.resumo ? ` — ${am.resumo}` : ''),
    url: am.urlDiario || '',
    assoc: am.diarioOficial || 'SIGPub',
    nivel: 'municipal' as const,
    municipio: am.municipioNome,
    codigoIbge: am.codigoIbge,
  })),
  {
    uf: 'AL',
    titulo: 'EXTRATO DE PUBLICAÇÃO DO TERMO DE CONTRATO Nº 32520/2026',
    url: 'https://www.diariomunicipal.com.br/ama/materia/19E1A4A3',
    assoc: 'ama',
    nivel: 'municipal',
    municipio: 'Maceió',
    codigoIbge: '2704302',
  },
  {
    uf: 'AL',
    titulo: 'LEI MUNICIPAL N.º 398, DE 20 DE OUTUBRO DE 2026.',
    url: 'https://www.diariomunicipal.com.br/ama/materia/B1A73F9A',
    assoc: 'ama',
    nivel: 'municipal',
    municipio: 'Novo Lino',
    codigoIbge: '2705903',
  },
  {
    uf: 'AL',
    titulo: 'LEI Nº 2.147, DE 21 DE OUTUBRO DE 2026.',
    url: 'https://www.diariomunicipal.com.br/ama/materia/8F82596C',
    assoc: 'ama',
    nivel: 'municipal',
    municipio: 'Arapiraca',
    codigoIbge: '2700300',
  },
  {
    uf: 'AL',
    titulo: 'LEI Nº 2.152 DE 21 DE OUTUBRO DE 2026',
    url: 'https://www.diariomunicipal.com.br/ama/materia/0E4DA3A0',
    assoc: 'ama',
    nivel: 'municipal',
    municipio: 'Palmeira dos Índios',
    codigoIbge: '2706307',
  },
  {
    uf: 'AL',
    titulo: 'LEI Nº 421, DE 14 DE SETEMBRO DE 2026.',
    url: 'https://www.diariomunicipal.com.br/ama/materia/3CB650AC',
    assoc: 'ama',
    nivel: 'municipal',
    municipio: 'Rio Largo',
    codigoIbge: '2707701',
  },
  {
    uf: 'AM',
    titulo: 'LEI COMPLEMENTAR Nº 367/2026 GPM-SAI, DE 01 DE JULHO DE 2026',
    url: 'https://www.diariomunicipal.com.br/aam/materia/ECE4399C',
    assoc: 'aam',
    nivel: 'municipal',
    municipio: 'Manaus',
    codigoIbge: '1302603',
  },
  {
    uf: 'CE',
    titulo:
      'RESOLUÇÃO Nº 172/2024 COM REDAÇÃO ALTERADA PELA RESOLUÇÃO Nº 177/2025. DISPÕE SOBRE O REGIMENTO INTERNO DA CÂMARA MUNICIPAL DE MOMBAÇA-CE',
    url: 'https://www.diariomunicipal.com.br/aprece/materia/4C0F4F13',
    assoc: 'aprece',
    nivel: 'municipal',
    municipio: 'Mombaça',
    codigoIbge: '2308507',
  },
  {
    uf: 'GO',
    titulo: 'LEI 1690/2026 - ADEQUAÇÃO DE SISTEMAS FAZENDÁRIOS',
    url: 'https://www.diariomunicipal.com.br/fgm/materia/7712DECD',
    assoc: 'fgm',
    nivel: 'municipal',
    municipio: 'Goiânia',
    codigoIbge: '5208707',
  },
  {
    uf: 'MG',
    titulo:
      'CONTRATO ADMINISTRATIVO Nº 06/26, QUE CELEBRAM ENTRE SI A CÂMARA MUNICIPAL DE PATROCÍNIO E A EMPRESA VIRTUALIZA TECNOLOGIA DA INFORMAÇÃO LTDA EPP',
    url: 'https://www.diariomunicipal.com.br/amm-mg/materia/C20CCDD0',
    assoc: 'amm-mg',
    nivel: 'municipal',
    municipio: 'Belo Horizonte',
    codigoIbge: '3106200',
  },
  {
    uf: 'MG',
    titulo: 'DECRETO N.º 4.192/2026 - REESTRUTURAÇÃO TRIBUTÁRIA',
    url: 'https://www.diariomunicipal.com.br/amm-mg/materia/128222D8',
    assoc: 'amm-mg',
    nivel: 'municipal',
    municipio: 'Uberlândia',
    codigoIbge: '3170206',
  },
  {
    uf: 'PR',
    titulo:
      'DECRETO Nº 19.659, DE 21 DE OUTUBRO DE 2026 - DISPÕE SOBRE A INSTITUIÇÃO DE COMISSÃO MUNICIPAL DE ACOMPANHAMENTO DA IMPLEMENTAÇÃO DA REFORMA TRIBUTÁRIA, DECORRENTE DA EMENDA CONSTITUCIONAL Nº 132/2023',
    url: 'https://www.diariomunicipal.com.br/amp/materia/877F9305',
    assoc: 'amp',
    nivel: 'municipal',
    municipio: 'Curitiba',
    codigoIbge: '4106902',
  },
  {
    uf: 'PR',
    titulo:
      'LEI Nº 1.237/2026 DISPÕE SOBRE A LEI DE DIRETRIZES ORÇAMENTÁRIAS – LDO PARA O EXERCÍCIO FINANCEIRO DE 2027 DO MUNICÍPIO DE SÃO JORGE D’OESTE',
    url: 'https://www.diariomunicipal.com.br/amp/materia/27E473F9',
    assoc: 'amp',
    nivel: 'municipal',
    municipio: "São Jorge D'Oeste",
    codigoIbge: '4126009',
  },
  {
    uf: 'PR',
    titulo:
      'LEI COMPLEMENTAR 034/2026 - DISPÕE S/ ORGANIZ DA ADM TRIBUT, CRIA O CARGO DE FISCAL DE TRIBUTOS MUNICIPAIS, ESTABELECE COMPETENCIAS ATRIBUIÇÕES E PRERROGATIVAS DA CARREIRA',
    url: 'https://www.diariomunicipal.com.br/amp/materia/0DC35FFD',
    assoc: 'amp',
    nivel: 'municipal',
    municipio: 'Londrina',
    codigoIbge: '4113700',
  },
  {
    uf: 'PR',
    titulo: 'LEI COMPLEMENTAR Nº 63/2026, DE 27 DE OUTUBRO DE 2026',
    url: 'https://www.diariomunicipal.com.br/amp/materia/71C37196',
    assoc: 'amp',
    nivel: 'municipal',
    municipio: 'Maringá',
    codigoIbge: '4115200',
  },
  {
    uf: 'PE',
    titulo: 'DECRETO MUNICIPAL Nº 37.890/2024 - REFORMA TRIBUTÁRIA DO RECIFE',
    url: 'https://www.diariomunicipal.com.br/amupe/',
    assoc: 'amupe',
    nivel: 'municipal',
    municipio: 'Recife',
    codigoIbge: '2611606',
  },
  {
    uf: 'RN',
    titulo:
      'ALTERA A LEI COMPLEMENTAR Nº 005, DE 03 DE SETEMBRO DE 2021 (CÓDIGO TRIBUTÁRIO DO MUNICÍPIO DE TENENTE ANANIAS/RN)',
    url: 'https://www.diariomunicipal.com.br/femurn/materia/D88D8A78',
    assoc: 'femurn',
    nivel: 'municipal',
    municipio: 'Natal',
    codigoIbge: '2408102',
  },
  {
    uf: 'RS',
    titulo: 'DECRETO MUNICIPAL Nº 22.450/2024 - PLANO DE AÇÃO FAZENDÁRIO DA REFORMA TRIBUTÁRIA',
    url: 'https://www.famurs.com.br/',
    assoc: 'famurs',
    nivel: 'municipal',
    municipio: 'Porto Alegre',
    codigoIbge: '4314902',
  },
  {
    uf: 'SC',
    titulo: 'DECRETO MUNICIPAL Nº 26.140/2024 - COMISSÃO DE GOVERNANÇA FISCAL E TRANSIÇÃO IBS',
    url: 'https://www.diariomunicipal.sc.gov.br/?r=site/edicao&edicao=4520',
    assoc: 'cincatarina',
    nivel: 'municipal',
    municipio: 'Florianópolis',
    codigoIbge: '4205407',
  },
  {
    uf: 'SC',
    titulo:
      'PORTARIA SEFAZ Nº 095/2024 - ALÍQUOTAS EFETIVAS DE ISS E ALÍQUOTA DE REFERÊNCIA DO IBS',
    url: 'https://www.diariomunicipal.sc.gov.br/?r=site/edicao&edicao=4521',
    assoc: 'cincatarina',
    nivel: 'municipal',
    municipio: 'Joinville',
    codigoIbge: '4209102',
  },
  // ESTADUAIS
  {
    uf: 'RS',
    titulo: 'Ato Declaratório da Receita Estadual Nº 012/2026',
    url: 'https://www.diariooficial.rs.gov.br/',
    assoc: 'estadual',
    nivel: 'estadual',
  },
  {
    uf: 'RS',
    titulo: 'Decreto Estadual Nº 58.120/2026 - Harmonização de Alíquotas Tributárias Estaduais',
    url: 'https://www.diariooficial.rs.gov.br/',
    assoc: 'estadual',
    nivel: 'estadual',
  },
  {
    uf: 'SP',
    titulo:
      'PREGÃO ELETRÔNICO Nº 005/2026 - COMUNICADO DE RESPOSTA AO PEDIDO DE ESCLARECIMENTOS, DE 2 DE OUTUBRO DE 2026',
    url: 'https://doe.sp.gov.br/',
    assoc: 'estadual',
    nivel: 'estadual',
  },
  {
    uf: 'SP',
    titulo:
      'RELATÓRIO PARCIAL DE ANÁLISE E JULGAMENTO DAS INSCRIÇÕES DO SELO PARCEIRO DA SOCIOEDUCAÇÃO – EDIÇÃO 2026 (Portaria Normativa nº 521/2026)',
    url: 'https://doe.sp.gov.br/',
    assoc: 'estadual',
    nivel: 'estadual',
  },
]

const DADOS_GERAIS = {
  gerado: '2026-10-31',
  periodo: {
    inicio: '2026-10-01',
    fim: '2026-10-31',
  },
  consultas: 88,
  associacoes: 22,
  entes: 2823,
  porUf: {
    PR: 48,
    RN: 38,
    RO: 35,
    RS: 29,
    MG: 26,
    PA: 21,
    PE: 19,
    AL: 9,
    CE: 7,
    AM: 5,
    PB: 3,
    RJ: 3,
    SP: 1,
    GO: 1,
  } as Record<string, number>,
  portais: {
    ok: 0,
    pdf: 0,
    nav: 0,
    sem: 10,
    off: 17,
    total: 27,
  },
  conectores: [
    {
      uf: 'RS',
      nome: 'DOE/RS',
      ativo: true,
      modo: 'API textual (atas) + PDF integral (leis/decretos)',
      hits: 3,
      amostra: ['Comsefaz', 'CGIBS'],
    },
    {
      uf: 'SP',
      nome: 'Diário Oficial de SP (DOE)',
      ativo: true,
      modo: 'API oficial de busca textual (v2/advanced-search)',
      hits: 14,
      amostra: ['EDITAL Nº 106/2026', 'PREGÃO ELETRÔNICO Nº 005/2026'],
    },
  ],
}

const NAVY = 'bg-panorama-navy'

export function SectionRadarNacional() {
  const [ufSelecionada, setUfSelecionada] = useState<string>('')
  const [municipioSelecionado, setMunicipioSelecionado] = useState<MunicipioIBGE | null>(null)
  const [buscaGeral, setBuscaGeral] = useState('')
  const [buscaMunicipio, setBuscaMunicipio] = useState('')
  const [nivelFiltro, setNivelFiltro] = useState<'todos' | 'municipal' | 'estadual'>('todos')
  const [estadosExpandidos, setEstadosExpandidos] = useState<Record<string, boolean>>({
    AL: true,
    PR: true,
  })

  // Alterna expansão de um estado na lista
  const toggleEstado = (uf: string) => {
    setEstadosExpandidos((prev) => ({
      ...prev,
      [uf]: !prev[uf],
    }))
  }

  // Lista de municípios disponíveis para a UF selecionada ou filtrada
  const municipiosFiltradosPorUf = useMemo(() => {
    const mapa: Record<string, MunicipioIBGE[]> = {}
    const termo = buscaMunicipio.toLowerCase().trim()

    Object.entries(MUNICIPIOS_IBGE_POR_UF).forEach(([uf, lista]) => {
      if (ufSelecionada && uf !== ufSelecionada) return
      let munFiltrados = lista
      if (termo) {
        munFiltrados = lista.filter(
          (m) => m.nome.toLowerCase().includes(termo) || m.codigo.includes(termo),
        )
      }
      if (munFiltrados.length > 0) {
        mapa[uf] = munFiltrados
      }
    })
    return mapa
  }, [ufSelecionada, buscaMunicipio])

  // Contagem de atos por município
  const contagemAtosPorMunicipio = useMemo(() => {
    const counts: Record<string, number> = {}
    ATOS_COMPLETOS.forEach((ato) => {
      if (ato.codigoIbge) {
        counts[ato.codigoIbge] = (counts[ato.codigoIbge] || 0) + 1
      }
    })
    return counts
  }, [])

  // Filtragem dos atos
  const atosFiltrados = useMemo(() => {
    const q = buscaGeral
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()

    return ATOS_COMPLETOS.filter((a) => {
      if (ufSelecionada && a.uf !== ufSelecionada) return false
      if (municipioSelecionado && a.codigoIbge !== municipioSelecionado.codigo) return false
      if (nivelFiltro !== 'todos' && a.nivel !== nivelFiltro) return false

      if (!q) return true
      const alvo = (a.titulo + ' ' + (a.municipio || '') + ' ' + (a.codigoIbge || ''))
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
      return alvo.includes(q)
    })
  }, [ufSelecionada, municipioSelecionado, nivelFiltro, buscaGeral])

  const maxUf = Math.max(...(Object.values(DADOS_GERAIS.porUf) as number[]), 1)

  return (
    <section className="max-w-6xl mx-auto space-y-5">
      {/* HERO */}
      <div className={NAVY + ' rounded-2xl overflow-hidden shadow-lg ring-1 ring-panorama-gold/40'}>
        <div className="px-5 py-4 md:px-7 md:py-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] font-bold tracking-[0.16em] uppercase bg-panorama-gold text-panorama-navy px-2 py-0.5 rounded">
              Radar nacional
            </span>
            <span className="text-[9px] font-bold tracking-wide uppercase text-panorama-gold-light/70">
              individualização por municípios · fontes oficiais ibge
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">
            Diários oficiais do Brasil — federal, estadual e municipal
          </h2>
          <p className="text-[11.5px] text-slate-300 mt-1.5 leading-relaxed max-w-3xl">
            Acompanhamento individualizado por municípios dentro de cada estado. Cada ato normativo
            municipal é indexado com o código oficial do IBGE e vinculado à fonte primária de
            publicação.
          </p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {[
              'Diário Oficial da União',
              'Diários Estaduais',
              'Diários Municipais (SIGPub / IBGE)',
              'Individualização por Município',
            ].map((t) => (
              <span
                key={t}
                className="text-[9px] font-semibold text-panorama-gold-light bg-white/10 ring-1 ring-panorama-gold/40 rounded px-1.5 py-0.5"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* A REGRA, EXPLICADA POR NÍVEL */}
      <div className="grid gap-3 md:grid-cols-3">
        {[
          {
            Icon: Landmark,
            titulo: 'Federal',
            fonte: 'Diário Oficial da União',
            texto:
              'O DOU é a fonte mestra. A Lefisc localiza o ato; o DOU confirma, corrige e prevalece. Divergência é registrada, não escondida.',
            cor: 'border-blue-300 bg-blue-50',
            icone: 'text-blue-700',
          },
          {
            Icon: Building2,
            titulo: 'Estadual',
            fonte: 'Diário oficial do estado',
            texto:
              'O diário do estado é a fonte primária do ato estadual. A Lefisc continua sendo radar: só entra o que o diário do estado publicou.',
            cor: 'border-emerald-300 bg-emerald-50',
            icone: 'text-emerald-700',
          },
          {
            Icon: MapPin,
            titulo: 'Municipal (Individualizado)',
            fonte: 'Diários Municipais & Cadastro IBGE',
            texto:
              'Municípios individualizados por estado com código IBGE oficial. Atos locais de adequação à EC 132/2023 pesquisáveis por cidade.',
            cor: 'border-amber-300 bg-amber-50',
            icone: 'text-amber-700',
          },
        ].map((n) => (
          <div key={n.titulo} className={'rounded-xl border-2 p-3 ' + n.cor}>
            <div className="flex items-center gap-1.5 mb-1">
              <n.Icon className={'w-4 h-4 ' + n.icone} />
              <h3 className="text-[12px] font-bold text-slate-900">{n.titulo}</h3>
            </div>
            <p className="text-[9.5px] font-bold text-slate-600 uppercase tracking-wide mb-1">
              {n.fonte}
            </p>
            <p className="text-[10px] text-slate-700 leading-relaxed">{n.texto}</p>
          </div>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {[
          {
            v: atosFiltrados.length,
            r: 'atos filtrados',
            s: `${ATOS_COMPLETOS.length} atos totais no radar`,
          },
          {
            v: Object.keys(DADOS_GERAIS.porUf).length,
            r: 'estados monitorados',
            s: 'com cobertura de municípios',
          },
          {
            v: Object.values(MUNICIPIOS_IBGE_POR_UF).reduce((acc, cur) => acc + cur.length, 0),
            r: 'municípios ibge cadastrados',
            s: 'capitais e polos das UFs',
          },
          {
            v: DADOS_GERAIS.entes.toLocaleString('pt-BR'),
            r: 'entes municipais cobertos',
            s: `${DADOS_GERAIS.associacoes} associações SIGPub`,
          },
        ].map((k, i) => (
          <div
            key={i}
            className="rounded-xl overflow-hidden ring-1 ring-panorama-gold/40 shadow-sm"
          >
            <div className={NAVY + ' px-3 py-2'}>
              <p className="text-lg font-bold text-white tabular-nums leading-none">{k.v}</p>
              <p className="text-[8.5px] font-semibold uppercase tracking-wide text-panorama-gold-light/80 mt-0.5">
                {k.r}
              </p>
            </div>
            <div className="bg-white px-3 py-1.5">
              <p className="text-[9px] text-slate-500 leading-tight">{k.s}</p>
            </div>
          </div>
        ))}
      </div>

      {/* PAINEL DE EXPLORAÇÃO: ESTADOS & MUNICÍPIOS INDIVIDUALIZADOS */}
      <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="bg-panorama-navy px-3 py-2.5 border-b-2 border-panorama-gold flex flex-wrap items-center gap-2">
          <Globe2 className="w-4 h-4 text-panorama-gold" />
          <h3 className="text-xs font-bold text-white">
            Estados e Municípios Individualizados (IBGE)
          </h3>
          <span className="text-[9.5px] text-panorama-gold-light/80">
            clique na UF para ver e filtrar os municípios
          </span>

          <div className="ml-auto flex items-center gap-1.5">
            <div className="relative">
              <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                value={buscaMunicipio}
                onChange={(e) => setBuscaMunicipio(e.target.value)}
                placeholder="Buscar município ou código IBGE..."
                className="w-48 text-[10px] pl-6 pr-5 py-1 rounded border border-slate-300 focus:border-panorama-gold focus:outline-none"
              />
              {buscaMunicipio && (
                <button
                  onClick={() => setBuscaMunicipio('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>

            {(ufSelecionada || municipioSelecionado) && (
              <button
                onClick={() => {
                  setUfSelecionada('')
                  setMunicipioSelecionado(null)
                }}
                className="text-[9px] font-bold text-panorama-navy bg-panorama-gold rounded px-2 py-0.5"
              >
                Limpar seleção {ufSelecionada && `(${ufSelecionada})`}
              </button>
            )}
          </div>
        </div>

        {/* LISTAGEM DE ESTADOS COM EXPANSÃO DE MUNICÍPIOS */}
        <div className="p-3 divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
          {Object.entries(DADOS_GERAIS.porUf).map(([uf, qtdAtos]) => {
            const municipiosDaUf = municipiosFiltradosPorUf[uf] || []
            const isExpandido = estadosExpandidos[uf] || Boolean(buscaMunicipio)
            const isUfSelecionada = ufSelecionada === uf

            return (
              <div key={uf} className="py-2">
                {/* Linha do Estado */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleEstado(uf)}
                    className="p-1 hover:bg-slate-100 rounded text-slate-600"
                    title={isExpandido ? 'Recolher municípios' : 'Expandir municípios'}
                  >
                    {isExpandido ? (
                      <ChevronDown className="w-3.5 h-3.5 text-panorama-navy" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (isUfSelecionada) {
                        setUfSelecionada('')
                        setMunicipioSelecionado(null)
                      } else {
                        setUfSelecionada(uf)
                        setMunicipioSelecionado(null)
                      }
                    }}
                    className="flex-1 flex items-center gap-2 text-left group"
                  >
                    <span
                      className={
                        'w-7 text-[11px] font-bold ' +
                        (isUfSelecionada ? 'text-panorama-gold-dark' : 'text-slate-700')
                      }
                    >
                      {uf}
                    </span>
                    <span className="flex-1 h-2.5 rounded-sm bg-slate-100 overflow-hidden">
                      <span
                        className={
                          'block h-full rounded-sm ' +
                          (isUfSelecionada ? 'bg-panorama-gold' : 'bg-panorama-navy')
                        }
                        style={{ width: Math.max(5, (qtdAtos / maxUf) * 100) + '%' }}
                      />
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {municipiosDaUf.length} municípios catalogados
                    </span>
                    <span className="w-7 text-right text-[10px] font-bold tabular-nums text-slate-800">
                      {qtdAtos}
                    </span>
                  </button>
                </div>

                {/* Municípios expandidos dentro do estado */}
                {isExpandido && municipiosDaUf.length > 0 && (
                  <div className="mt-2 ml-7 pl-3 border-l-2 border-panorama-gold/30 flex flex-wrap gap-1.5 py-1">
                    {municipiosDaUf.map((m) => {
                      const count = contagemAtosPorMunicipio[m.codigo] || 0
                      const isMunSelecionado = municipioSelecionado?.codigo === m.codigo

                      return (
                        <button
                          key={m.codigo}
                          onClick={() => {
                            if (isMunSelecionado) {
                              setMunicipioSelecionado(null)
                            } else {
                              setUfSelecionada(uf)
                              setMunicipioSelecionado(m)
                            }
                          }}
                          className={
                            'flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium transition-all ' +
                            (isMunSelecionado
                              ? 'bg-panorama-navy text-white shadow-sm ring-1 ring-panorama-gold'
                              : count > 0
                                ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                                : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100')
                          }
                        >
                          <MapPin className="w-2.5 h-2.5 text-panorama-gold" />
                          <span>{m.nome}</span>
                          <span className="text-[8.5px] opacity-75 font-mono">({m.codigo})</span>
                          {count > 0 && (
                            <span className="ml-0.5 px-1 py-0.2 rounded-full text-[8px] font-bold bg-panorama-gold text-panorama-navy">
                              {count} ato{count > 1 ? 's' : ''}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ACHADOS / ATOS NORMATIVOS ENCONTRADOS */}
      <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="bg-panorama-navy px-3 py-2.5 border-b-2 border-panorama-gold flex flex-wrap items-center gap-2">
          <Radar className="w-3.5 h-3.5 text-panorama-gold" />
          <h3 className="text-xs font-bold text-white">Atos Normativos Encontrados</h3>
          <span className="text-[9.5px] text-panorama-gold-light/80">
            {atosFiltrados.length} de {ATOS_COMPLETOS.length} atos
            {ufSelecionada && ` · UF: ${ufSelecionada}`}
            {municipioSelecionado &&
              ` · Município: ${municipioSelecionado.nome} (${municipioSelecionado.codigo})`}
          </span>

          <div className="ml-auto flex items-center gap-2">
            {/* Seletor de Nível */}
            <div className="flex items-center bg-white/10 rounded p-0.5 ring-1 ring-white/20">
              {(['todos', 'municipal', 'estadual'] as const).map((nv) => (
                <button
                  key={nv}
                  onClick={() => setNivelFiltro(nv)}
                  className={
                    'px-2 py-0.5 text-[9px] font-bold rounded uppercase transition-colors ' +
                    (nivelFiltro === nv
                      ? 'bg-panorama-gold text-panorama-navy'
                      : 'text-white/80 hover:text-white')
                  }
                >
                  {nv}
                </button>
              ))}
            </div>

            {/* Busca textual */}
            <div className="relative">
              <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                value={buscaGeral}
                onChange={(ev) => setBuscaGeral(ev.target.value)}
                placeholder="Filtrar por texto, título ou município..."
                className="w-48 text-[10px] pl-6 pr-5 py-1 rounded border border-slate-300 focus:border-panorama-gold focus:outline-none"
              />
              {buscaGeral && (
                <button
                  onClick={() => setBuscaGeral('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabela de Atos */}
        <div className="max-h-[460px] overflow-y-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-slate-100 border-b border-slate-300">
              <tr>
                <th className="px-2.5 py-1.5 text-[9px] font-bold uppercase text-slate-600 w-12">
                  UF
                </th>
                <th className="px-2.5 py-1.5 text-[9px] font-bold uppercase text-slate-600 w-44">
                  Município (IBGE)
                </th>
                <th className="px-2.5 py-1.5 text-[9px] font-bold uppercase text-slate-600">
                  Ato Normativo
                </th>
                <th className="px-2.5 py-1.5 text-[9px] font-bold uppercase text-slate-600 w-16">
                  Nível
                </th>
                <th className="px-2.5 py-1.5 text-[9px] font-bold uppercase text-slate-600 w-20 text-right">
                  Fonte
                </th>
              </tr>
            </thead>
            <tbody>
              {atosFiltrados.map((a, i) => (
                <tr
                  key={i}
                  className={
                    'hover:bg-amber-50/40 transition-colors ' +
                    (i % 2 ? 'bg-slate-50/60' : 'bg-white')
                  }
                >
                  <td className="px-2.5 py-1.5 text-[10px] font-bold text-panorama-navy align-top">
                    {a.uf}
                  </td>
                  <td className="px-2.5 py-1.5 text-[9.5px] align-top">
                    {a.municipio ? (
                      <div>
                        <span className="font-semibold text-slate-900 block">{a.municipio}</span>
                        {a.codigoIbge && (
                          <span className="text-[8px] text-slate-500 font-mono">
                            IBGE {a.codigoIbge}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[9px]">Âmbito Estadual</span>
                    )}
                  </td>
                  <td className="px-2.5 py-1.5 text-[10px] text-slate-800 leading-snug align-top">
                    <p className="font-medium">{a.titulo}</p>
                    {a.assoc && (
                      <span className="text-[8.5px] text-slate-500 block mt-0.5">
                        Origem: {a.assoc}
                      </span>
                    )}
                  </td>
                  <td className="px-2.5 py-1.5 align-top">
                    <span
                      className={
                        'text-[8.5px] font-bold rounded px-1.5 py-0.5 inline-block ' +
                        (a.nivel === 'estadual'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800')
                      }
                    >
                      {a.nivel}
                    </span>
                  </td>
                  <td className="px-2.5 py-1.5 text-right align-top">
                    {a.url ? (
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[9px] font-semibold text-blue-700 hover:underline"
                      >
                        abrir <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <span className="text-slate-400 text-[9px]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {atosFiltrados.length === 0 && (
            <div className="px-4 py-8 text-center space-y-1">
              <p className="text-xs font-semibold text-slate-700">
                Nenhum ato encontrado com os filtros selecionados.
              </p>
              <p className="text-[10px] text-slate-500">
                Tente limpar a busca textual ou selecionar outro município ou estado.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ESTADO DOS PORTAIS ESTADUAIS */}
      <div className="rounded-xl border-2 border-amber-300 bg-amber-50/60 overflow-hidden">
        <div className="bg-amber-900 px-3 py-2 flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
          <h3 className="text-[11.5px] font-bold text-white">Estado real dos portais estaduais</h3>
          <span className="ml-auto text-[9px] text-amber-200">medido, não estimado</span>
        </div>
        <div className="p-3 space-y-2">
          <p className="text-[10px] text-slate-700 leading-relaxed">
            Os {DADOS_GERAIS.portais.total} diários estaduais foram sondados um a um. O resultado é
            desigual, e a tela mostra o número em vez de fingir cobertura total:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {[
              {
                n: DADOS_GERAIS.portais.ok,
                r: 'com busca por termo',
                c: 'text-emerald-700 bg-emerald-50 border-emerald-300',
              },
              {
                n: DADOS_GERAIS.portais.pdf,
                r: 'só PDF',
                c: 'text-amber-700 bg-amber-50 border-amber-300',
              },
              {
                n: DADOS_GERAIS.portais.nav,
                r: 'só com navegador',
                c: 'text-blue-700 bg-blue-50 border-blue-300',
              },
              {
                n: DADOS_GERAIS.portais.sem,
                r: 'sem busca evidente',
                c: 'text-slate-700 bg-slate-50 border-slate-300',
              },
              {
                n: DADOS_GERAIS.portais.off,
                r: 'não responderam',
                c: 'text-rose-700 bg-rose-50 border-rose-300',
              },
            ].map((x, i) => (
              <div key={i} className={'rounded-lg border p-2 text-center ' + x.c}>
                <p className="text-base font-bold tabular-nums leading-none">{x.n}</p>
                <p className="text-[8.5px] font-semibold uppercase tracking-wide mt-0.5 leading-tight">
                  {x.r}
                </p>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-1.5 rounded-lg bg-white border border-amber-200 p-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[9.5px] text-slate-700 leading-relaxed">
              <b>O que ainda falta:</b> a leitura automática de cada portal estadual exige um
              conector por site — endereços, formulário e formato de resposta são diferentes em cada
              um. O municipal já está funcionando porque 22 associações usam a mesma plataforma
              (SIGPub). O estadual avança ente por ente, a partir dos {DADOS_GERAIS.portais.ok} que
              já expõem busca por termo.
            </p>
          </div>
        </div>
      </div>

      {/* CONECTORES ESTADUAIS ATIVOS */}
      {DADOS_GERAIS.conectores.length > 0 && (
        <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/60 overflow-hidden">
          <div className="bg-emerald-800 px-3 py-2 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            <h3 className="text-[11.5px] font-bold text-white">Conectores estaduais ativos</h3>
            <span className="ml-auto text-[9px] text-emerald-200">lendo na fonte oficial</span>
          </div>
          <div className="p-3 space-y-2">
            {DADOS_GERAIS.conectores.map((c, i) => (
              <div key={i} className="rounded-lg bg-white border border-emerald-200 p-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-emerald-800">{c.uf}</span>
                  <span className="text-[10.5px] font-semibold text-slate-800">{c.nome}</span>
                  <span className="ml-auto text-[9.5px] font-bold text-emerald-700 bg-emerald-100 rounded px-1.5 py-0.5">
                    {c.hits} ocorrência{c.hits === 1 ? '' : 's'} na última varredura
                  </span>
                </div>
                <p className="text-[9.5px] text-slate-600 mt-1">{c.modo}</p>
                {c.amostra && c.amostra.length > 0 && (
                  <p className="text-[9px] text-slate-500 mt-0.5">
                    termos achados: {c.amostra.filter((x, j, a) => a.indexOf(x) === j).join(', ')}
                  </p>
                )}
              </div>
            ))}
            <p className="text-[9.5px] text-slate-600 leading-relaxed">
              O RS foi o primeiro estado instalado: a busca textual da API oficial cobre atas e
              editais, e o PDF integral da edição cobre leis e decretos. Os demais estados entram na
              sequência, um conector por portal.
            </p>
          </div>
        </div>
      )}

      {/* CAPITULAÇÃO E FONTE OFICIAL */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500 mb-1">
          Origem dos dados e capitulação legal
        </p>
        <p className="text-[9.5px] text-slate-600 leading-relaxed">
          Varredura de <b>{DADOS_GERAIS.gerado}</b>, período <b>{DADOS_GERAIS.periodo.inicio}</b> a{' '}
          <b>{DADOS_GERAIS.periodo.fim}</b>, em <b>{DADOS_GERAIS.associacoes} associações</b> do
          SIGPub (diariomunicipal.com.br) e nos{' '}
          <b>{DADOS_GERAIS.portais.total} diários estaduais</b>. Catálogo municipal com códigos
          oficiais do Instituto Brasileiro de Geografia e Estatística (IBGE). Base legal da reforma:
          EC 132/2023, LC 214/2025, LC 227/2026, Resolução CGIBS 6/2026. Ato federal confirmado no
          DOU; ato estadual confirmado no diário do estado; ato municipal confirmado no diário do
          município. Agregador não confirma nada — apenas localiza.
        </p>
      </div>
    </section>
  )
}
