import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BadgeCheck,
  BookOpenCheck,
  Building2,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  FileText,
  Info,
  Loader2,
  Printer,
  Receipt,
  RefreshCw,
  Scale,
  ShieldCheck,
  Upload,
  XCircle,
} from 'lucide-react'

/**
 * IMPORTAR E VALIDAR BALANCETES, BALANÇOS E DREs
 * ==============================================
 * Pedido do CEO (05/11/2026): "criar no módulo ... um ícone para importar e
 * validar as informações dos balancetes, balanços e DREs, com o agente
 * contábil especialista, para ser usado nas análises e cruzamentos".
 *
 * ── POR QUE A VALIDAÇÃO RODA NO SERVIDOR ──
 * O parsing e a classificação de conta poderiam rodar no navegador e a tela
 * ficaria mais leve. Mas aí cada lugar que precisasse do número contábil
 * (analisador, comparador, relatório) teria a SUA cópia da regra — e um dia
 * discordariam. O agente roda uma vez, no servidor, e todo mundo lê o mesmo
 * resultado.
 *
 * ── OS SEIS ESPECIALISTAS, VISÍVEIS NA TELA ──
 * O CEO pediu "com o agente contábil especialista". Aqui cada especialista
 * aparece com o que verificou: não é selo decorativo — é a diferença entre
 * "importou" e "conferiu".
 *
 * ── O QUE A TELA NÃO PROMETE ──
 * Não diz que o balanço está certo: diz o que conseguiu conferir e o que
 * sobrou sem classificação. Conta fora do plano padrão aparece na lista, com
 * código e descrição, para o contador decidir — nunca é chutada.
 */

const BACKEND =
  import.meta.env.VITE_POCKETBASE_URL?.replace(/\/$/, '') ||
  'https://verificacao-projeto-panorama-18549.shrd02.internal.goskip.dev'

const TOKEN_KEY = 'adecont_painel_token'

const brl = (v: number | null | undefined) =>
  Number(v || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  })

/** Um documento já importado. */
interface Documento {
  id: string
  cliente_cnpj: string
  cliente_nome: string
  tipo_documento: string
  competencia: string
  formato: string
  status: string
  linhas: number
  total_ativo: number
  receita_liquida: number
  lucro_liquido: number
  imobilizado: number
  importado_em: string
}

interface Resultado {
  ok: boolean
  documento_id: string
  substituiu: boolean
  tipo_documento: string
  formato: string
  status: string
  identificacao: {
    cnpj: string
    razao_social: string
    competencia: string
    periodo_inicio: string
    periodo_fim: string
  }
  totais: {
    linhas: number
    contas_reconhecidas: number
    ativo: number
    passivo: number
    patrimonio_liquido: number
    receita: number
    custo: number
    despesa: number
    lucro: number
    imobilizado: number
  }
  achados: { gravidade: string; item: string; detalhe: string }[]
  resumo: { alta: number; media: number; baixa: number; info: number }
}

/** Os seis especialistas do agente contábil. */
const ESPECIALISTAS = [
  {
    id: 'formato',
    nome: 'Formato',
    Icon: FileText,
    o_que: 'Descobre o que o arquivo é antes de ler: SPED-ECD, CSV, TXT delimitado ou HTML.',
    como: 'Procura o registro |0000| do SPED, tags de tabela, e conta os separadores na amostra.',
  },
  {
    id: 'identificacao',
    nome: 'Identificação',
    Icon: Building2,
    o_que: 'CNPJ, razão social e período saem do próprio arquivo.',
    como: 'Não confia no nome do arquivo nem em campo digitado: extrai do conteúdo.',
  },
  {
    id: 'plano',
    nome: 'Plano de contas',
    Icon: BookOpenCheck,
    o_que: 'Classifica cada conta em ativo, passivo, PL, receita, custo ou despesa.',
    como: 'Código (1=ativo, 2=passivo…) e, quando divergem, a descrição decide. Conflito vira «não classificada».',
  },
  {
    id: 'fechamento',
    nome: 'Fechamento',
    Icon: Calculator,
    o_que: 'Confere a equação patrimonial e se a DRE fecha.',
    como: 'Ativo = Passivo + PL, com tolerância de 1% para arredondamento de centavos.',
  },
  {
    id: 'reforma',
    nome: 'Efeito na reforma',
    Icon: Scale,
    o_que: 'Marca o que entra na base de IBS/CBS e o que gera crédito.',
    como: 'Receita → base; custo e insumo → crédito; imobilizado → crédito integral na aquisição.',
  },
  {
    id: 'procedencia',
    nome: 'Procedência',
    Icon: ShieldCheck,
    o_que: 'Diz o que foi lido do arquivo e o que foi inferido.',
    como: 'Cada número tem sua origem declarada — e o que não casou fica listado, não escondido.',
  },
]

export function ParametrizadorContabil() {
  const [token, setToken] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [conteudo, setConteudo] = useState('')
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [arrastando, setArrastando] = useState(false)
  const [abertos, setAbertos] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try {
      setToken(window.localStorage.getItem(TOKEN_KEY) || '')
    } catch {
      setToken('')
    }
  }, [])

  const chamar = useCallback(
    async (rota: string, opcoes?: RequestInit) => {
      const r = await fetch(`${BACKEND}/backend/v1/${rota}`, {
        ...opcoes,
        headers: { 'X-Painel-Token': token, ...(opcoes?.headers || {}) },
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.erro || j.error || `Falha (${r.status})`)
      return j
    },
    [token],
  )

  const carregarDocumentos = useCallback(async () => {
    if (!token) return
    try {
      const j = await chamar('contab-documentos')
      setDocumentos(j.documentos || [])
    } catch {
      setDocumentos([])
    }
  }, [token, chamar])

  useEffect(() => {
    if (token) carregarDocumentos()
  }, [token, carregarDocumentos])

  /** Lê o arquivo no navegador e manda o texto para o agente. */
  const importar = useCallback(
    async (f: File) => {
      if (!token) {
        setErro('Informe o token do painel (salvo no navegador em «adecont_painel_token»).')
        return
      }
      setOcupado(true)
      setErro(null)
      setResultado(null)
      try {
        const texto = await new Promise<string>((resolve, reject) => {
          const leitor = new FileReader()
          leitor.onload = () => resolve(String(leitor.result || ''))
          leitor.onerror = () => reject(new Error('não consegui ler o arquivo'))
          leitor.readAsText(f)
        })

        if (!texto.trim()) {
          throw new Error(
            'O arquivo está vazio ou é binário (xlsx/docx). Salve como CSV ou TXT delimitado e importe de novo.',
          )
        }

        setConteudo(texto)
        const j = await chamar('contab-importar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ arquivo_nome: f.name, conteudo: texto }),
        })
        setResultado(j)
        setAbertos({ formato: true, identificacao: true, fechamento: true })
        carregarDocumentos()
      } catch (e: any) {
        setErro(e.message)
      } finally {
        setOcupado(false)
      }
    },
    [token, chamar, carregarDocumentos],
  )

  const escolher = (lista: FileList | null) => {
    if (!lista || !lista.length) return
    const f = lista[0]
    setArquivo(f)
    importar(f)
  }

  const soltar = (ev: React.DragEvent) => {
    ev.preventDefault()
    setArrastando(false)
    if (ev.dataTransfer.files?.length) {
      const f = ev.dataTransfer.files[0]
      setArquivo(f)
      importar(f)
    }
  }

  const exportarCsv = () => {
    if (!resultado) return
    const t = resultado.totais
    const linhas = [
      ['Indicador', 'Valor'],
      ['Documento', resultado.tipo_documento],
      ['Formato', resultado.formato],
      ['Competência', resultado.identificacao.competencia],
      ['CNPJ', resultado.identificacao.cnpj],
      ['Razão social', resultado.identificacao.razao_social],
      ['Linhas lidas', String(t.linhas)],
      ['Contas reconhecidas', String(t.contas_reconhecidas)],
      ['Ativo', String(t.ativo)],
      ['Passivo', String(t.passivo)],
      ['Patrimônio líquido', String(t.patrimonio_liquido)],
      ['Receita', String(t.receita)],
      ['Custo', String(t.custo)],
      ['Despesa', String(t.despesa)],
      ['Lucro', String(t.lucro)],
      ['Imobilizado', String(t.imobilizado)],
    ]
    const csv = linhas.map((l) => l.join(';')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `validacao-contabil-${resultado.identificacao.competencia || 'periodo'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const corStatus = useMemo(() => {
    if (!resultado) return ''
    if (resultado.status === 'ok') return 'bg-emerald-50 border-emerald-300 text-emerald-900'
    if (resultado.status === 'alerta') return 'bg-amber-50 border-amber-300 text-amber-900'
    return 'bg-red-50 border-red-300 text-red-900'
  }, [resultado])

  const IconeStatus =
    resultado?.status === 'ok'
      ? CheckCircle2
      : resultado?.status === 'alerta'
        ? AlertTriangle
        : XCircle

  return (
    <div className="space-y-4">
      {/* cabeçalho */}
      <div className="rounded-xl bg-gradient-to-r from-panorama-navy to-[#132a4a] p-4 ring-1 ring-panorama-gold/40">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-panorama-gold-light" />
              <h2 className="text-base font-bold text-white">
                Balancetes, balanços e DREs — agente contábil
              </h2>
            </div>
            <p className="mt-1 max-w-3xl text-[12px] text-slate-300">
              Importa, valida e classifica a escrituração. O resultado alimenta o analisador
              tributário e o comparador de regimes — sem digitar número à mão e sem adivinhar grupo
              de conta.
            </p>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={carregarDocumentos}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-white/20 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Atualizar
            </button>
            {resultado && (
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-white/20 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir
              </button>
            )}
          </div>
        </div>
      </div>

      {/* zona de importação */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setArrastando(true)
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={soltar}
        className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          arrastando ? 'border-panorama-gold bg-panorama-gold/5' : 'border-slate-300 bg-white'
        }`}
      >
        <input
          id="contabil-arquivo"
          type="file"
          accept=".csv,.txt,.sped,.ecd,.xml,.html,.htm,text/plain,text/csv"
          className="hidden"
          onChange={(e) => escolher(e.target.files)}
        />

        {ocupado ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-7 h-7 animate-spin text-panorama-navy" />
            <p className="text-[12px] font-semibold text-panorama-navy">
              O agente contábil está lendo e conferindo…
            </p>
          </div>
        ) : (
          <>
            <Upload className="mx-auto w-7 h-7 text-slate-400" />
            <p className="mt-2 text-[12px] font-semibold text-panorama-navy">
              Arraste o balancete, balanço ou DRE aqui
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Aceita CSV, TXT delimitado e arquivo SPED-ECD (.txt). Para Excel, exporte a planilha
              como CSV antes.
            </p>
            <label
              htmlFor="contabil-arquivo"
              className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-panorama-navy px-4 py-2 text-[11px] font-bold text-white hover:opacity-90"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Escolher arquivo
            </label>
            {arquivo && (
              <p className="mt-2 text-[10px] text-slate-500">
                Último: {arquivo.name} ({Math.round(arquivo.size / 1024)} KB)
              </p>
            )}
          </>
        )}
      </div>

      {erro && (
        <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-[11px] text-red-800">
          <AlertTriangle className="mt-0.5 w-3.5 h-3.5 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* resultado */}
      {resultado && (
        <>
          {/* veredito */}
          <div className={`rounded-xl border p-4 ${corStatus}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <IconeStatus className="mt-0.5 w-5 h-5 shrink-0" />
                <div>
                  <h3 className="text-[13px] font-bold">
                    {resultado.status === 'ok'
                      ? 'Documento lido e conferido'
                      : resultado.status === 'alerta'
                        ? 'Documento lido, com pontos a conferir'
                        : 'Documento lido, com erro que impede o uso'}
                  </h3>
                  <p className="mt-0.5 text-[11px] opacity-90">
                    {resultado.tipo_documento} · formato {resultado.formato} ·{' '}
                    {resultado.totais.contas_reconhecidas} de {resultado.totais.linhas} contas
                    classificadas
                    {resultado.substituiu && ' · substituiu a importação anterior deste período'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={exportarCsv}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/70 px-3 py-1.5 text-[11px] font-bold hover:bg-white cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>
          </div>

          {/* identificação */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="text-[12px] font-bold text-panorama-navy">
              O que o agente leu do arquivo
            </h4>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <CampoInfo rotulo="CNPJ" valor={resultado.identificacao.cnpj || '—'} />
              <CampoInfo
                rotulo="Razão social"
                valor={resultado.identificacao.razao_social || '—'}
              />
              <CampoInfo rotulo="Competência" valor={resultado.identificacao.competencia || '—'} />
              <CampoInfo
                rotulo="Período"
                valor={
                  resultado.identificacao.periodo_inicio
                    ? `${resultado.identificacao.periodo_inicio} a ${resultado.identificacao.periodo_fim || '?'}`
                    : '—'
                }
              />
            </div>
          </div>

          {/* números */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="text-[12px] font-bold text-panorama-navy">Números apurados</h4>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi rotulo="Ativo" valor={brl(resultado.totais.ativo)} />
              <Kpi
                rotulo="Passivo + PL"
                valor={brl(resultado.totais.passivo + resultado.totais.patrimonio_liquido)}
              />
              <Kpi rotulo="Patrimônio líquido" valor={brl(resultado.totais.patrimonio_liquido)} />
              <Kpi
                rotulo="Lucro do período"
                valor={brl(resultado.totais.lucro)}
                cor={resultado.totais.lucro < 0 ? 'text-red-700' : 'text-emerald-700'}
              />
              <Kpi rotulo="Receita" valor={brl(resultado.totais.receita)} />
              <Kpi rotulo="Custo" valor={brl(resultado.totais.custo)} />
              <Kpi rotulo="Despesa" valor={brl(resultado.totais.despesa)} />
              <Kpi rotulo="Ativo imobilizado" valor={brl(resultado.totais.imobilizado)} destaque />
            </div>
          </div>

          {/* achados */}
          {resultado.achados.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h4 className="text-[12px] font-bold text-panorama-navy">
                O que o agente encontrou ({resultado.achados.length})
              </h4>
              <div className="mt-2 space-y-1.5">
                {resultado.achados.map((a, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border p-2 ${
                      a.gravidade === 'ALTA'
                        ? 'border-red-200 bg-red-50'
                        : a.gravidade === 'MEDIA'
                          ? 'border-amber-200 bg-amber-50'
                          : a.gravidade === 'BAIXA'
                            ? 'border-sky-200 bg-sky-50'
                            : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-1.5">
                      <span
                        className={`mt-0.5 rounded px-1 py-0.5 text-[9px] font-bold ${
                          a.gravidade === 'ALTA'
                            ? 'bg-red-600 text-white'
                            : a.gravidade === 'MEDIA'
                              ? 'bg-amber-500 text-white'
                              : a.gravidade === 'BAIXA'
                                ? 'bg-sky-500 text-white'
                                : 'bg-slate-400 text-white'
                        }`}
                      >
                        {a.gravidade}
                      </span>
                      <div>
                        <p className="text-[11px] font-bold text-slate-800">{a.item}</p>
                        <p className="text-[10.5px] text-slate-600">{a.detalhe}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* os seis especialistas */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <BadgeCheck className="w-4 h-4 text-panorama-navy" />
          <h4 className="text-[12px] font-bold text-panorama-navy">
            O agente contábil — seis especialistas
          </h4>
        </div>
        <div className="mt-2 space-y-1">
          {ESPECIALISTAS.map((esp) => {
            const aberto = abertos[esp.id]
            return (
              <div key={esp.id} className="rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setAbertos((p) => ({ ...p, [esp.id]: !p[esp.id] }))}
                  className="flex w-full items-center gap-2 px-2.5 py-2 text-left cursor-pointer hover:bg-slate-50"
                >
                  {aberto ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <esp.Icon className="w-3.5 h-3.5 text-panorama-navy" />
                  <span className="text-[11.5px] font-semibold text-panorama-navy">{esp.nome}</span>
                  <span className="ml-1 truncate text-[10.5px] text-slate-500">{esp.o_que}</span>
                </button>
                {aberto && (
                  <div className="border-t border-slate-100 px-9 py-2">
                    <p className="text-[10.5px] text-slate-600">{esp.como}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* documentos importados */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-panorama-navy" />
            <h4 className="text-[12px] font-bold text-panorama-navy">
              Documentos contábeis importados ({documentos.length})
            </h4>
          </div>
          <button
            type="button"
            onClick={carregarDocumentos}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-200 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Atualizar
          </button>
        </div>

        {documentos.length === 0 ? (
          <div className="mt-2 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-[11px] text-slate-600">
            <Info className="mt-0.5 w-3.5 h-3.5 shrink-0" />
            <span>
              Nenhum documento contábil importado ainda. Sem ele, a comparação de regimes continua
              sobre receita e crédito estimados — com ele, passa a ser sobre os números da
              escrituração.
            </span>
          </div>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-panorama-navy text-white">
                  <th className="border-b-2 border-panorama-gold px-2 py-1.5 text-left font-bold">
                    Cliente
                  </th>
                  <th className="border-b-2 border-panorama-gold px-2 py-1.5 text-left font-bold">
                    Tipo
                  </th>
                  <th className="border-b-2 border-panorama-gold px-2 py-1.5 text-left font-bold">
                    Comp.
                  </th>
                  <th className="border-b-2 border-panorama-gold px-2 py-1.5 text-right font-bold">
                    Ativo
                  </th>
                  <th className="border-b-2 border-panorama-gold px-2 py-1.5 text-right font-bold">
                    Receita
                  </th>
                  <th className="border-b-2 border-panorama-gold px-2 py-1.5 text-right font-bold">
                    Lucro
                  </th>
                  <th className="border-b-2 border-panorama-gold px-2 py-1.5 text-left font-bold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {documentos.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100">
                    <td className="px-2 py-1.5 font-semibold text-panorama-navy">
                      {d.cliente_nome || d.cliente_cnpj || '—'}
                    </td>
                    <td className="px-2 py-1.5">{d.tipo_documento}</td>
                    <td className="px-2 py-1.5">{d.competencia || '—'}</td>
                    <td className="px-2 py-1.5 text-right">{brl(d.total_ativo)}</td>
                    <td className="px-2 py-1.5 text-right">{brl(d.receita_liquida)}</td>
                    <td className="px-2 py-1.5 text-right">{brl(d.lucro_liquido)}</td>
                    <td className="px-2 py-1.5">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                          d.status === 'ok'
                            ? 'bg-emerald-100 text-emerald-800'
                            : d.status === 'alerta'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* rodapé */}
      <div className="flex items-start gap-2 rounded-lg border border-slate-300 bg-slate-50 p-3 text-[10.5px] text-slate-600">
        <Scale className="mt-0.5 w-3.5 h-3.5 shrink-0" />
        <span>
          O resultado desta validação alimenta o <strong>Comparador de regimes</strong> e o{' '}
          <strong>Analisador tributário</strong>: receita vira base de IBS/CBS, custo e insumo viram
          crédito, e imobilizado entra com crédito integral na aquisição. Conta sem classificação{' '}
          <strong>não entra em nenhum total</strong> — fica listada para o contador decidir.
        </span>
      </div>
    </div>
  )
}

/* ── auxiliares ── */

function CampoInfo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
      <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">{rotulo}</p>
      <p className="truncate text-[11px] font-semibold text-panorama-navy" title={valor}>
        {valor}
      </p>
    </div>
  )
}

function Kpi({
  rotulo,
  valor,
  cor,
  destaque,
}: {
  rotulo: string
  valor: string
  cor?: string
  destaque?: boolean
}) {
  return (
    <div
      className={`rounded-lg border px-2 py-1.5 ${
        destaque ? 'border-panorama-gold bg-panorama-gold/10' : 'border-slate-200 bg-slate-50'
      }`}
    >
      <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">{rotulo}</p>
      <p className={`text-[12px] font-bold ${cor || 'text-panorama-navy'}`}>{valor}</p>
    </div>
  )
}

export default ParametrizadorContabil
