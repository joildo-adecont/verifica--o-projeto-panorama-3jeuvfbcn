import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  BookMarked,
  CheckCircle2,
  ChevronRight,
  Database,
  FileCode2,
  FileSearch,
  FileStack,
  FileText,
  Folder,
  Scale,
  ClipboardList,
  ClipboardCheck,
  Layers,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Upload,
  XCircle,
} from 'lucide-react'
import { ParametrizadorAnalise } from '@/components/ParametrizadorAnalise'
import { ParametrizadorLote } from '@/components/ParametrizadorLote'
import { ParametrizadorTesteIndividual } from '@/components/ParametrizadorTesteIndividual'
import { ParametrizadorPastas } from '@/components/ParametrizadorPastas'
import { ParametrizadorAnalisador } from '@/components/ParametrizadorAnalisador'
import { ParametrizadorConferencia } from '@/components/ParametrizadorConferencia'
import { ParametrizadorNcm } from '@/components/ParametrizadorNcm'
import { ParametrizadorConferenciaPosicao } from '@/components/ParametrizadorConferenciaPosicao'

/**
 * PARAMETRIZADOR DE DOCUMENTOS FISCAIS DA REFORMA — Seção 31
 * ===========================================================
 * Pedido do CEO (03/11/2026): portal que busca os tipos de documentos fiscais
 * usados na apuração assistida e na base de lançamentos, importa e processa os
 * XMLs, quebra o arquivo em partes com especialistas, individualiza as
 * informações e produz análise, comparativo e auditoria, com classificação
 * fiscal e contábil, sempre de fontes oficiais.
 *
 * ── A DECISÃO DE ARQUITETURA QUE DEFINE ESTA TELA ──
 * O XML é lido por um parser no backend, não por um modelo de linguagem. Um
 * DF-e tem estrutura fixa: quem lê é o parser; o que é "inteligência" é a REGRA
 * de cada especialista — quais campos importam, o que é obrigatório, o que
 * conta como divergência. Isso é auditável. Pedir a uma IA que "entenda o
 * documento" introduziria erro onde existe certeza.
 *
 * ── O QUE O USUÁRIO VÊ, E POR QUE NESSA ORDEM ──
 * 1. O catálogo dos documentos — para saber o que o portal aceita e onde está
 *    o layout oficial.
 * 2. A importação — colar ou escolher o arquivo.
 * 3. A QUEBRA — cada especialista com o que encontrou e o que faltou. É aqui
 *    que a "segmentação" pedida fica visível: não é um resumo do arquivo, são
 *    os segmentos, um por um, com o resultado de cada um.
 * 4. Os itens individualizados — uma linha por item, com NCM, CFOP, CST e o
 *    tratamento da reforma.
 * 5. Os achados — divergências e lacunas, que é o que vira auditoria.
 */

const BACKEND =
  import.meta.env.VITE_POCKETBASE_URL?.replace(/\/$/, '') ||
  'https://verificacao-projeto-panorama-18549.shrd02.internal.goskip.dev'

const TOKEN_KEY = 'adecont_painel_token'

interface TipoDoc {
  modelo: string
  sigla: string
  nome: string
  finalidade: string
  orgao: string
  layoutUrl: string
  baseLegal: string
  temRT: 'sim' | 'parcial' | 'nao' | 'previsto'
  obs?: string
}

/**
 * CATÁLOGO DOS DOCUMENTOS FISCAIS ELETRÔNICOS
 *
 * Fonte: Portal Nacional dos DF-e (SVRS) — https://dfe-portal.svrs.rs.gov.br/Dfe/Documentos
 * e os layouts publicados por modelo. O campo `temRT` responde à pergunta que
 * interessa ao contador: este documento já carrega os campos da reforma?
 *
 * NÃO inventar modelos: cada linha aqui foi conferida no portal do SVRS ou no
 * próprio Manual de Orientação do Contribuinte (MOC) do respectivo DF-e.
 */
const TIPOS: TipoDoc[] = [
  {
    modelo: '55',
    sigla: 'NF-e',
    nome: 'Nota Fiscal Eletrônica',
    finalidade: 'Circulação de mercadorias entre contribuintes e para consumidor final',
    orgao: 'Portal Nacional dos DF-e / SVRS (ENCAT)',
    layoutUrl: 'https://dfe-portal.svrs.rs.gov.br/Nfe/Documentos',
    baseLegal: 'Ajuste SINIEF 07/2005; MOC NF-e 4.00',
    temRT: 'parcial',
    obs: 'O layout 4.00 recebeu o grupo IBSCBS; a obrigatoriedade dos campos vem por ato conjunto.',
  },
  {
    modelo: '65',
    sigla: 'NFC-e',
    nome: 'Nota Fiscal de Consumidor Eletrônica',
    finalidade: 'Venda ao consumidor final no varejo',
    orgao: 'Portal Nacional dos DF-e / SVRS (ENCAT)',
    layoutUrl: 'https://dfe-portal.svrs.rs.gov.br/Nfce/Documentos',
    baseLegal: 'Ajuste SINIEF 07/2005; MOC NFC-e',
    temRT: 'parcial',
    obs: 'Mesma estrutura da NF-e, com campos de consumidor final e troco.',
  },
  {
    modelo: '57',
    sigla: 'CT-e',
    nome: 'Conhecimento de Transporte Eletrônico',
    finalidade: 'Prestação de serviço de transporte de cargas',
    orgao: 'Portal Nacional dos DF-e / SVRS (ENCAT)',
    layoutUrl: 'https://dfe-portal.svrs.rs.gov.br/Cte/Documentos',
    baseLegal: 'Ajuste SINIEF 09/2007; MOC CT-e',
    temRT: 'parcial',
    obs: 'O IBS/CBS sobre transporte incide no CT-e; layout em revisão pela reforma.',
  },
  {
    modelo: '67',
    sigla: 'CT-e OS',
    nome: 'Conhecimento de Transporte Eletrônico Outros Serviços',
    finalidade: 'Transporte de pessoas, valores e bagagem',
    orgao: 'Portal Nacional dos DF-e / SVRS (ENCAT)',
    layoutUrl: 'https://dfe-portal.svrs.rs.gov.br/Cte/Documentos',
    baseLegal: 'Ajuste SINIEF 09/2007',
    temRT: 'parcial',
  },
  {
    modelo: '58',
    sigla: 'MDF-e',
    nome: 'Manifesto Eletrônico de Documentos Fiscais',
    finalidade: 'Vinculação de documentos ao transporte (carga)',
    orgao: 'Portal Nacional dos DF-e / SVRS (ENCAT)',
    layoutUrl: 'https://dfe-portal.svrs.rs.gov.br/Mdfe/Documentos',
    baseLegal: 'Ajuste SINIEF 21/2010',
    temRT: 'nao',
    obs: 'Não é documento de tributação: vincula a carga ao CT-e.',
  },
  {
    modelo: '63',
    sigla: 'BPe',
    nome: 'Bilhete de Passagem Eletrônico',
    finalidade: 'Transporte de passageiros',
    orgao: 'Portal Nacional dos DF-e / SVRS (ENCAT)',
    layoutUrl: 'https://dfe-portal.svrs.rs.gov.br/BPE/Documentos',
    baseLegal: 'Ajuste SINIEF 16/2014',
    temRT: 'previsto',
  },
  {
    modelo: '66',
    sigla: 'NF3e',
    nome: 'Nota Fiscal de Energia Elétrica Eletrônica',
    finalidade: 'Fornecimento de energia elétrica',
    orgao: 'Portal Nacional dos DF-e / SVRS (ENCAT)',
    layoutUrl: 'https://dfe-portal.svrs.rs.gov.br/NF3E/Documentos',
    baseLegal: 'Ajuste SINIEF 19/2015',
    temRT: 'previsto',
    obs: 'Energia tem regime próprio na reforma; layout em adequação.',
  },
  {
    modelo: '62',
    sigla: 'NFCom',
    nome: 'Nota Fiscal de Serviços de Comunicação Eletrônica',
    finalidade: 'Serviços de telecomunicações',
    orgao: 'Portal Nacional dos DF-e / SVRS (ENCAT)',
    layoutUrl: 'https://dfe-portal.svrs.rs.gov.br/NFCOM/Documentos',
    baseLegal: 'Ajuste SINIEF 01/2016',
    temRT: 'previsto',
  },
  {
    modelo: '64',
    sigla: 'NFGás',
    nome: 'Nota Fiscal de Gás Canalizado Eletrônica',
    finalidade: 'Fornecimento de gás canalizado',
    orgao: 'Portal Nacional dos DF-e / SVRS (ENCAT)',
    layoutUrl: 'https://dfe-portal.svrs.rs.gov.br/NFGAS/Documentos',
    baseLegal: 'Ajuste SINIEF 02/2021',
    temRT: 'previsto',
  },
  {
    modelo: '54',
    sigla: 'NFABI',
    nome: 'Nota Fiscal de Água, Biodiesel e Infraestrutura',
    finalidade: 'Água, saneamento, biodiesel e obras de infraestrutura',
    orgao: 'Portal Nacional dos DF-e / SVRS (ENCAT)',
    layoutUrl: 'https://dfe-portal.svrs.rs.gov.br/NFABI/Documentos',
    baseLegal: 'Ajuste SINIEF 01/2023',
    temRT: 'previsto',
  },
  {
    modelo: '—',
    sigla: 'NFS-e',
    nome: 'Nota Fiscal de Serviço Eletrônica (padrão nacional)',
    finalidade: 'Prestação de serviços (ISS e, na reforma, IBS/CBS)',
    orgao: 'Receita Federal — Portal Nacional da NFS-e / SE/CGNFS-e',
    layoutUrl: 'https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/rtc',
    baseLegal: 'Resolução CGIBS e atos da NFS-e nacional; LC 214/2025',
    temRT: 'sim',
    obs: 'O padrão nacional da NFS-e já publica o grupo IBSCBS e o Anexo VIII de correlação.',
  },
  {
    modelo: '—',
    sigla: 'DERE',
    nome: 'Declaração de Regimes Específicos',
    finalidade: 'Declaração dos regimes específicos da reforma',
    orgao: 'Comitê Gestor do IBS (CGIBS)',
    layoutUrl: 'https://www.cgibs.gov.br/declaracao-de-regimes-especificos-dere',
    baseLegal: 'RIBS — Resolução CGIBS 6/2026',
    temRT: 'sim',
    obs: 'Documento criado pela própria reforma. Esquemas XSD no portal do CGIBS.',
  },
  {
    modelo: '—',
    sigla: 'CFF',
    nome: 'Conformidade Fácil — tabelas de classificação',
    finalidade: 'Consulta oficial de CST e cClassTrib do IBS/CBS',
    orgao: 'Portal Nacional dos DF-e / SVRS (ENCAT)',
    layoutUrl: 'https://dfe-portal.svrs.rs.gov.br/CFF/ClassificacaoTributaria',
    baseLegal: 'Ato Técnico Conjunto RFB/CGIBS; IT 2025.002',
    temRT: 'sim',
    obs: 'Fonte das 173 classificações tributárias carregadas na Fase 2.',
  },
]

const ROTULO_RT: Record<string, { txt: string; cls: string }> = {
  sim: {
    txt: 'já tem campos da reforma',
    cls: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  parcial: {
    txt: 'layout aceita campos da reforma',
    cls: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  previsto: { txt: 'adequação prevista', cls: 'bg-blue-100 text-blue-800 border-blue-300' },
  nao: { txt: 'sem tributação própria', cls: 'bg-slate-100 text-slate-700 border-slate-300' },
}

export function SectionParametrizador() {
  const [token, setToken] = useState('')
  const [aba, setAba] = useState<
    | 'catalogo'
    | 'importar'
    | 'documentos'
    | 'analise'
    | 'lote'
    | 'teste'
    | 'pastas'
    | 'analisador'
    | 'conferencia'
    | 'ncm'
    | 'posicao'
  >('catalogo')
  const [xml, setXml] = useState('')
  const [nomeArquivo, setNomeArquivo] = useState('documento.xml')
  const [resultado, setResultado] = useState<any>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [processando, setProcessando] = useState(false)
  const [docs, setDocs] = useState<any[]>([])
  const [carregandoDocs, setCarregandoDocs] = useState(false)

  useEffect(() => {
    try {
      setToken(window.localStorage.getItem(TOKEN_KEY) || '')
    } catch {
      setToken('')
    }
  }, [])

  const importar = useCallback(async () => {
    setErro(null)
    setResultado(null)
    if (!xml.trim()) {
      setErro('Cole o conteúdo do XML ou escolha o arquivo.')
      return
    }
    if (!token) {
      setErro('Informe o token do painel para gravar o documento.')
      return
    }
    setProcessando(true)
    try {
      const r = await fetch(`${BACKEND}/backend/v1/param-importar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Painel-Token': token },
        body: JSON.stringify({ xml, nome_arquivo: nomeArquivo }),
      })
      const j = await r.json()
      if (!r.ok) {
        setErro(j.error || `Falha ao processar (${r.status}).`)
        return
      }
      setResultado(j)
      if (j.gravado) carregarDocs(token)
    } catch {
      setErro('Não foi possível falar com o servidor.')
    } finally {
      setProcessando(false)
    }
  }, [xml, token, nomeArquivo])

  const carregarDocs = async (tok: string) => {
    if (!tok) return
    setCarregandoDocs(true)
    try {
      const r = await fetch(`${BACKEND}/backend/v1/param-documentos`, {
        headers: { 'X-Painel-Token': tok },
      })
      if (r.ok) {
        const j = await r.json()
        setDocs(j.documentos || [])
      }
    } catch {
      /* lista vazia não impede o trabalho */
    } finally {
      setCarregandoDocs(false)
    }
  }

  useEffect(() => {
    if (token) carregarDocs(token)
  }, [token])

  /** Lê o arquivo escolhido direto no navegador — o conteúdo vai ao backend. */
  const lerArquivo = (f: File | null) => {
    if (!f) return
    setNomeArquivo(f.name)
    const leitor = new FileReader()
    leitor.onload = () => setXml(String(leitor.result || ''))
    leitor.readAsText(f)
  }

  const brl = (v: number) =>
    v === null || v === undefined || !isFinite(Number(v))
      ? '—'
      : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const gruposAchados = useMemo(() => {
    if (!resultado?.achados) return { divergencia: [], lacuna: [], faltando: [] }
    const g: Record<string, any[]> = { divergencia: [], lacuna: [], faltando: [] }
    for (const a of resultado.achados) {
      const k = String(a.tipo || '').toLowerCase()
      if (g[k]) g[k].push(a)
    }
    return g
  }, [resultado])

  return (
    <section id="parametrizador" className="scroll-mt-24">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* cabeçalho */}
        <header className="bg-panorama-navy px-4 sm:px-5 py-4 border-b-2 border-panorama-gold/60">
          <div className="flex items-start gap-3 flex-wrap">
            <div className="flex items-center gap-3 shrink-0">
              <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-panorama-gold/15 text-panorama-gold-light ring-1 ring-panorama-gold/50 shrink-0">
                <ScanLine className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-[15px] sm:text-base font-bold text-white leading-tight">
                  Parametrizador de Documentos Fiscais da Reforma
                </h2>
                <p className="text-[11px] text-slate-300 leading-tight">
                  Importa, quebra e classifica XMLs · análise, comparativo e auditoria
                </p>
              </div>
            </div>
          </div>

          {/* abas */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {[
              { id: 'catalogo' as const, nome: 'Catálogo de documentos', Icon: FileText },
              { id: 'importar' as const, nome: 'Importar e quebrar', Icon: Upload },
              { id: 'documentos' as const, nome: 'Documentos processados', Icon: Database },
              /* FASE 3 (03/11/2026): auditoria, comparativo e concentração vivem
                 aqui, e não numa seção nova, porque só fazem sentido sobre os
                 documentos que ESTA seção importa. Seção separada obrigaria o
                 usuário a pular de tela para ver o resultado do que acabou de
                 subir. */
              { id: 'analise' as const, nome: 'Análise e auditoria', Icon: BarChart3 },
              /* FASE 4 (03/11/2026): importador em lotes, totalizadores por
                 período e analisador do IBS por ano. */
              { id: 'lote' as const, nome: 'Lotes e totalizadores', Icon: FileStack },
              /* FASE 5 (03/11/2026): classificação efetiva por NCM, testada
                 documento a documento — onde um erro não se dilui no lote. */
              { id: 'teste' as const, nome: 'Teste por documento', Icon: FileSearch },
              /* FASE 6 (03/11/2026): pastas por cliente. "Não misturar" exige
                 trava na gravação, não só separação visual. */
              { id: 'pastas' as const, nome: 'Pastas por cliente', Icon: Folder },
              /* ANALISADOR TRIBUTÁRIO (04/11/2026): comparação fina entre a
                 tributação de hoje e a da reforma, por produto, grupo e ramo,
                 com simulação da transição e o melhor caminho. */
              { id: 'analisador' as const, nome: 'Analisador tributário', Icon: Scale },
              /* LISTA DE CONFERÊNCIA (04/11/2026): os NCMs sem regra de alíquota,
                 separados por rendimento da conferência (caso A × caso B). */
              { id: 'conferencia' as const, nome: 'Conferência de NCM', Icon: ClipboardList },
              /* TABELA NCM (04/11/2026): os 15.040 códigos vigentes, com ato de
                 origem por linha e monitoramento pelos agentes de fontes. */
              { id: 'ncm' as const, nome: 'Tabela NCM', Icon: BookMarked },
              { id: 'posicao' as const, nome: 'Posição · conferir', Icon: ClipboardCheck },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setAba(t.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors cursor-pointer ${
                  aba === t.id
                    ? 'bg-panorama-gold text-panorama-navy'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                <t.Icon className="w-3.5 h-3.5" />
                {t.nome}
              </button>
            ))}
          </div>
        </header>

        <div className="p-3 sm:p-4 space-y-3">
          {/* ══════════ CATÁLOGO ══════════ */}
          {aba === 'catalogo' && (
            <>
              <div className="rounded-xl border-2 border-slate-200 bg-slate-50/60 p-3">
                <p className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  {TIPOS.length} tipos de documento fiscal eletrônico
                </p>
                <p className="mt-1 text-[10.5px] leading-snug text-slate-600">
                  Cada linha foi conferida no portal oficial do documento. A coluna <b>Reforma</b>{' '}
                  responde o que interessa: este documento já carrega os campos do IBS/CBS?
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-[10.5px] min-w-[860px]">
                  <thead>
                    <tr className="bg-panorama-navy text-white">
                      <th className="text-left px-2.5 py-1.5 font-bold">Documento</th>
                      <th className="text-left px-2 py-1.5 font-bold">Finalidade</th>
                      <th className="text-left px-2 py-1.5 font-bold">Órgão / layout</th>
                      <th className="text-left px-2 py-1.5 font-bold">Reforma</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TIPOS.map((t, i) => (
                      <tr key={t.sigla + t.modelo} className={i % 2 ? 'bg-slate-50' : 'bg-white'}>
                        <td className="px-2.5 py-1.5 border-b border-slate-100">
                          <p className="font-bold text-slate-900 leading-tight">
                            {t.sigla}
                            {t.modelo !== '—' && (
                              <span className="ml-1 rounded bg-slate-100 px-1 text-[9px] font-mono text-slate-600">
                                mod. {t.modelo}
                              </span>
                            )}
                          </p>
                          <p className="text-[9px] text-slate-500 leading-tight">{t.nome}</p>
                        </td>
                        <td className="px-2 py-1.5 border-b border-slate-100 text-slate-700 leading-snug">
                          {t.finalidade}
                        </td>
                        <td className="px-2 py-1.5 border-b border-slate-100">
                          <p className="text-slate-700 leading-tight">{t.orgao}</p>
                          <a
                            href={t.layoutUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9.5px] font-bold text-blue-700 hover:underline"
                          >
                            abrir layout oficial ↗
                          </a>
                          <p className="text-[9px] text-slate-400 leading-tight">{t.baseLegal}</p>
                        </td>
                        <td className="px-2 py-1.5 border-b border-slate-100">
                          <span
                            className={`inline-block rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${ROTULO_RT[t.temRT].cls}`}
                          >
                            {ROTULO_RT[t.temRT].txt}
                          </span>
                          {t.obs && (
                            <p className="mt-0.5 text-[9px] leading-tight text-slate-500">
                              {t.obs}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ══════════ IMPORTAR ══════════ */}
          {aba === 'importar' && (
            <>
              <div className="rounded-xl border-2 border-slate-200 bg-white p-3">
                <p className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  Importar XML do documento fiscal
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500 leading-snug">
                  O arquivo é lido por <b>parser</b>, não por interpretação de texto: cada campo vem
                  do próprio documento, e o que faltar é registrado como lacuna — nunca preenchido
                  por suposição.
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 rounded-lg bg-panorama-navy px-3 py-1.5 text-[11px] font-bold text-panorama-gold-light hover:bg-slate-900 cursor-pointer">
                    <FileCode2 className="w-3.5 h-3.5" />
                    Escolher arquivo XML
                    <input
                      type="file"
                      accept=".xml,text/xml,application/xml"
                      className="hidden"
                      onChange={(e) => lerArquivo(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono truncate max-w-[240px]">
                    {nomeArquivo}
                  </span>
                </div>

                <label className="block mt-2">
                  <span className="text-[10px] font-bold text-slate-600">
                    ou cole o conteúdo do XML
                  </span>
                  <textarea
                    value={xml}
                    onChange={(e) => setXml(e.target.value)}
                    className="mt-1 w-full min-h-[110px] rounded-lg border-2 border-slate-300 px-2 py-1.5 text-[10px] font-mono bg-white focus:outline-none focus:border-panorama-gold"
                    placeholder='<?xml version="1.0"?><nfeProc>...</nfeProc>'
                  />
                </label>

                <label className="block mt-1.5 max-w-[280px]">
                  <span className="text-[10px] font-bold text-slate-600">Token do painel</span>
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="mt-0.5 w-full rounded-lg border-2 border-slate-300 px-2 py-1.5 text-[11px] font-mono bg-white focus:outline-none focus:border-panorama-gold"
                    placeholder="X-Painel-Token"
                  />
                </label>

                <button
                  type="button"
                  onClick={importar}
                  disabled={processando}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-panorama-navy px-3.5 py-2 text-[11.5px] font-bold text-panorama-gold-light hover:bg-slate-900 disabled:opacity-40 cursor-pointer"
                >
                  <ScanLine className={`w-3.5 h-3.5 ${processando ? 'animate-pulse' : ''}`} />
                  {processando ? 'Quebrando o documento…' : 'Processar e quebrar'}
                </button>

                {erro && (
                  <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-rose-300 bg-rose-50 p-2 text-[10.5px] text-rose-900">
                    <XCircle className="mt-0.5 w-3.5 h-3.5 shrink-0" />
                    {erro}
                  </p>
                )}
              </div>

              {/* ── resultado da quebra ── */}
              {resultado && (
                <div className="space-y-3">
                  {/* veredito */}
                  <div
                    className={`rounded-xl border-2 p-3 ${
                      resultado.total_achados === 0
                        ? 'border-emerald-300 bg-emerald-50'
                        : 'border-amber-300 bg-amber-50'
                    }`}
                  >
                    <p className="flex items-center gap-1.5 text-[12px] font-bold text-slate-900">
                      {resultado.total_achados === 0 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-700" />
                      )}
                      {resultado.identificacao?.modelo
                        ? `Documento modelo ${resultado.identificacao.modelo}`
                        : 'Documento'}{' '}
                      · {resultado.itens?.length ?? 0} itens ·{' '}
                      {resultado.total_achados === 0
                        ? 'sem divergência'
                        : `${resultado.total_achados} achado(s)`}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-600 leading-snug">
                      {resultado.gravado
                        ? 'Gravado e individualizado no banco — os itens ficam disponíveis para análise.'
                        : 'Não gravado: ' + (resultado.erro_gravacao || 'modo conferência')}
                    </p>
                  </div>

                  {/* a quebra, segmento por segmento */}
                  <div className="rounded-xl border-2 border-slate-200 bg-white p-3">
                    <p className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      A quebra, especialista por especialista
                    </p>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        {
                          nome: 'Identificação',
                          ok: (resultado.identificacao?.faltando ?? []).length === 0,
                          dados: [
                            ['chave', resultado.identificacao?.chave?.slice(0, 20) + '…'],
                            ['modelo', resultado.identificacao?.modelo],
                            ['série', resultado.identificacao?.serie],
                            ['número', resultado.identificacao?.numero],
                            ['emissão', resultado.identificacao?.data_emissao?.slice(0, 10)],
                          ],
                        },
                        {
                          nome: 'Emitente',
                          ok: (resultado.emitente?.faltando ?? []).length === 0,
                          dados: [
                            ['CNPJ', resultado.emitente?.cnpj],
                            ['nome', resultado.emitente?.nome],
                            ['UF', resultado.emitente?.uf],
                          ],
                        },
                        {
                          nome: 'Destinatário',
                          ok: true,
                          dados: [
                            ['CNPJ', resultado.destinatario?.cnpj],
                            ['nome', resultado.destinatario?.nome],
                          ],
                        },
                        {
                          nome: 'Totais',
                          ok: !resultado.totais?.estrutura_quebrada,
                          dados: [
                            ['valor total', brl(resultado.totais?.valor_total)],
                            ['produtos', brl(resultado.totais?.valor_produtos)],
                            ['IBS', brl(resultado.totais?.valor_ibs)],
                            ['CBS', brl(resultado.totais?.valor_cbs)],
                          ],
                        },
                        {
                          nome: 'Tributário',
                          ok: (resultado.tributario?.achados ?? []).length === 0,
                          dados: [
                            ['itens', resultado.tributario?.itens_total],
                            ['com campos RT', resultado.tributario?.itens_com_campos_rt],
                            ['% com RT', `${resultado.tributario?.percentual_com_rt ?? 0}%`],
                          ],
                        },
                        {
                          nome: 'Contábil',
                          ok: true,
                          dados: [
                            ['natureza', resultado.contabil?.natureza],
                            ['base', brl(resultado.contabil?.base_aquisicao)],
                            ['total', brl(resultado.contabil?.total_documento)],
                          ],
                        },
                      ].map((s) => (
                        <div
                          key={s.nome}
                          className={`rounded-lg border p-2 ${
                            s.ok ? 'border-slate-200 bg-slate-50' : 'border-amber-300 bg-amber-50'
                          }`}
                        >
                          <p className="flex items-center gap-1 text-[10px] font-bold text-slate-800">
                            {s.ok ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 text-amber-700" />
                            )}
                            {s.nome}
                          </p>
                          <dl className="mt-1 space-y-0.5">
                            {s.dados
                              .filter(([, v]) => v !== undefined && v !== null && v !== '')
                              .map(([k, v]) => (
                                <div key={String(k)} className="flex gap-1 text-[9.5px]">
                                  <dt className="text-slate-500 shrink-0">{k}:</dt>
                                  <dd className="text-slate-800 font-medium truncate">
                                    {String(v)}
                                  </dd>
                                </div>
                              ))}
                          </dl>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* itens individualizados */}
                  {resultado.itens?.length > 0 && (
                    <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
                      <p className="px-3 py-2 text-[11px] font-bold text-slate-900 border-b-2 border-panorama-gold/40 bg-slate-50 flex items-center gap-1.5">
                        <FileSearch className="w-3.5 h-3.5" />
                        Itens individualizados ({resultado.itens.length})
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[10px] min-w-[820px]">
                          <thead>
                            <tr className="bg-panorama-navy text-white">
                              <th className="text-left px-2 py-1.5 font-bold">#</th>
                              <th className="text-left px-2 py-1.5 font-bold">Descrição</th>
                              <th className="text-left px-2 py-1.5 font-bold">NCM</th>
                              <th className="text-left px-2 py-1.5 font-bold">CFOP</th>
                              <th className="text-left px-2 py-1.5 font-bold">CST</th>
                              <th className="text-left px-2 py-1.5 font-bold">cClassTrib</th>
                              <th className="text-right px-2 py-1.5 font-bold">Valor</th>
                              <th className="text-right px-2 py-1.5 font-bold">IBS</th>
                              <th className="text-right px-2 py-1.5 font-bold">CBS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {resultado.itens.map((it: any, i: number) => (
                              <tr key={i} className={i % 2 ? 'bg-slate-50' : 'bg-white'}>
                                <td className="px-2 py-1.5 border-b border-slate-100 text-slate-500">
                                  {it.numero_item}
                                </td>
                                <td className="px-2 py-1.5 border-b border-slate-100 text-slate-800 max-w-[220px] truncate">
                                  {it.descricao}
                                </td>
                                <td className="px-2 py-1.5 border-b border-slate-100 font-mono text-[9.5px]">
                                  {it.ncm || <span className="text-rose-600">—</span>}
                                </td>
                                <td className="px-2 py-1.5 border-b border-slate-100 font-mono text-[9.5px]">
                                  {it.cfop || <span className="text-rose-600">—</span>}
                                </td>
                                <td className="px-2 py-1.5 border-b border-slate-100 font-mono text-[9.5px]">
                                  {it.cst_icms}
                                </td>
                                <td className="px-2 py-1.5 border-b border-slate-100">
                                  {it.cclasstrib ? (
                                    <span className="rounded bg-emerald-100 px-1 text-[9px] font-bold text-emerald-800">
                                      {it.cclasstrib}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-slate-400">não traz</span>
                                  )}
                                </td>
                                <td className="px-2 py-1.5 border-b border-slate-100 text-right tabular-nums">
                                  {brl(it.valor_total)}
                                </td>
                                <td className="px-2 py-1.5 border-b border-slate-100 text-right tabular-nums text-slate-600">
                                  {it.valor_ibs ? brl(it.valor_ibs) : '—'}
                                </td>
                                <td className="px-2 py-1.5 border-b border-slate-100 text-right tabular-nums text-slate-600">
                                  {it.valor_cbs ? brl(it.valor_cbs) : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* achados */}
                  {resultado.total_achados > 0 && (
                    <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-3">
                      <p className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Achados da auditoria ({resultado.total_achados})
                      </p>
                      <p className="mt-0.5 text-[9.5px] text-amber-800 leading-snug">
                        Isto <b>não é erro do leitor</b>: é o que o documento não traz. É exatamente
                        esse o insumo da parametrização para a apuração assistida.
                      </p>
                      <ul className="mt-1.5 space-y-1">
                        {resultado.achados.map((a: any, i: number) => (
                          <li
                            key={i}
                            className="flex items-start gap-1.5 text-[10px] text-amber-900"
                          >
                            <ChevronRight className="mt-0.5 w-3 h-3 shrink-0" />
                            <span>
                              <b className="uppercase text-[9px]">[{a.tipo}]</b> {a.campo}:{' '}
                              {a.detalhe}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ══════════ DOCUMENTOS PROCESSADOS ══════════ */}
          {aba === 'documentos' && (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  {docs.length} documento(s) processado(s)
                </p>
                <button
                  type="button"
                  onClick={() => carregarDocs(token)}
                  disabled={carregandoDocs || !token}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-panorama-navy text-panorama-gold-light px-2.5 py-1 text-[10.5px] font-bold disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${carregandoDocs ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>
              </div>

              {!token && (
                <p className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-[10.5px] text-amber-900">
                  Informe o token do painel na aba <b>Importar</b> para ver os documentos.
                </p>
              )}

              {token && docs.length === 0 && (
                <p className="rounded-xl border-2 border-slate-200 bg-slate-50 p-5 text-center text-[11px] text-slate-600">
                  Nenhum documento importado ainda. Vá em <b>Importar e quebrar</b> e envie um XML.
                </p>
              )}

              {docs.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-[10.5px] min-w-[820px]">
                    <thead>
                      <tr className="bg-panorama-navy text-white">
                        <th className="text-left px-2 py-1.5 font-bold">Documento</th>
                        <th className="text-left px-2 py-1.5 font-bold">Emitente</th>
                        <th className="text-left px-2 py-1.5 font-bold">Chave</th>
                        <th className="text-right px-2 py-1.5 font-bold">Valor</th>
                        <th className="text-center px-2 py-1.5 font-bold">Itens</th>
                        <th className="text-center px-2 py-1.5 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {docs.map((d: any, i: number) => (
                        <tr key={d.id} className={i % 2 ? 'bg-slate-50' : 'bg-white'}>
                          <td className="px-2 py-1.5 border-b border-slate-100">
                            <p className="font-bold text-slate-900">
                              mod. {d.modelo} · nº {d.numero}
                            </p>
                            <p className="text-[9px] text-slate-500">{d.nome_arquivo}</p>
                          </td>
                          <td className="px-2 py-1.5 border-b border-slate-100">
                            <p className="text-slate-800 truncate max-w-[180px]">{d.emitente}</p>
                            <p className="text-[9px] text-slate-500 font-mono">
                              {d.cnpj} {d.uf ? `· ${d.uf}` : ''}
                            </p>
                          </td>
                          <td className="px-2 py-1.5 border-b border-slate-100 font-mono text-[9px] text-slate-500">
                            {String(d.chave || '').slice(0, 22)}…
                          </td>
                          <td className="px-2 py-1.5 border-b border-slate-100 text-right tabular-nums font-bold">
                            {brl(d.valor_total)}
                          </td>
                          <td className="px-2 py-1.5 border-b border-slate-100 text-center">
                            {d.qtd_itens}
                          </td>
                          <td className="px-2 py-1.5 border-b border-slate-100 text-center">
                            <span
                              className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                                d.status === 'conferido'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {d.status}
                              {d.divergencias ? ` · ${d.divergencias}` : ''}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ══════════ FASE 3: ANÁLISE E AUDITORIA ══════════ */}
          {aba === 'analise' && <ParametrizadorAnalise />}

          {/* ══════════ FASE 4: LOTES, TOTALIZADORES E IBS POR ANO ══════════ */}
          {aba === 'lote' && <ParametrizadorLote />}

          {/* ══════════ FASE 5: TESTE POR DOCUMENTO INDIVIDUAL ══════════ */}
          {aba === 'teste' && <ParametrizadorTesteIndividual />}

          {/* ══════════ FASE 6: PASTAS POR CLIENTE ══════════ */}
          {aba === 'pastas' && <ParametrizadorPastas />}

          {/* ══════════ ANALISADOR TRIBUTÁRIO ══════════ */}
          {aba === 'analisador' && <ParametrizadorAnalisador />}

          {/* ══════════ LISTA DE CONFERÊNCIA DE NCM ══════════ */}
          {aba === 'conferencia' && <ParametrizadorConferencia />}

          {/* ══════════ TABELA NCM COMPLETA ══════════ */}
          {aba === 'ncm' && <ParametrizadorNcm />}

          {/* ══════════ CONFERÊNCIA POR POSIÇÃO ══════════ */}
          {aba === 'posicao' && <ParametrizadorConferenciaPosicao />}

          {/* rodapé */}
          <div className="flex items-center gap-1.5 flex-wrap rounded-lg bg-slate-50 px-2 py-1.5 text-[9px] text-slate-500">
            <ShieldCheck className="w-3 h-3" />
            <span>
              Leitura por parser determinístico · catálogo conferido no Portal Nacional dos DF-e
            </span>
            <span className="ml-auto">param_documentos · param_itens (PocketBase)</span>
          </div>
        </div>
      </div>
    </section>
  )
}
