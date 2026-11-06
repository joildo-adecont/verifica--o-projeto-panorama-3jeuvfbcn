import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderOpen,
  Loader2,
  RefreshCw,
  Upload,
  X,
} from 'lucide-react'
import { extrairTextoPDF, lerContas } from '@/services/leitorBalancetePDF'

/**
 * PASTAS DE DADOS POR CLIENTE
 * ===========================
 * Pedido do CEO (06/11/2026): cada cliente analisado tem uma pasta com XMLs de
 * entrada, XMLs de saída, documentos contábeis (balanço, balancetes, DREs) e
 * demais documentos; os especialistas buscam nesse repositório para fazer a
 * análise tributária e os cruzamentos com a legislação.
 *
 * ── O QUE ESTA TELA É ──
 * O repositório, em forma de árvore. Cada cliente abre com suas pastas, cada
 * pasta mostra o que tem dentro e quanto vale. A importação de balancete em PDF
 * acontece aqui mesmo: escolhe-se o PDF, o navegador extrai o texto, o servidor
 * interpreta e confere os totais, e o documento entra na pasta escolhida.
 *
 * ── O QUE ELA NÃO É ──
 * Não é um navegador de arquivos genérico: cada pasta tem TIPO, e o tipo diz ao
 * especialista o que esperar dela. Um balancete em "XMLs Saídas" seria lixo bem
 * guardado.
 */

const BACKEND =
  import.meta.env.VITE_POCKETBASE_URL?.replace(/\/$/, '') ||
  'https://verificacao-projeto-panorama-18549.shrd02.internal.goskip.dev'

const brl = (v?: number | null) =>
  v === null || v === undefined || !isFinite(Number(v))
    ? '—'
    : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface Pasta {
  id: string
  nome: string
  cnpj: string
  cliente_id: string
  tipo: string
  pai: string
  cor: string
  documentos: number
  xmls: number
  contabeis: number
  total?: number
  filhas: Pasta[]
  observacao?: string
}

interface DocContabil {
  id: string
  nome: string
  tipo: string
  competencia: string
  periodo_inicio: string
  periodo_fim: string
  ativo: number
  passivo: number
  pl: number
  receita: number
  lucro: number
  linhas: number
  status: string
}

const CORES: Record<string, string> = {
  slate: 'text-slate-600',
  blue: 'text-blue-600',
  emerald: 'text-emerald-600',
  amber: 'text-amber-600',
  violet: 'text-violet-600',
  teal: 'text-teal-600',
}

/* Os tipos cabem em 12 caracteres (limite do campo no banco), por isso são
   curtos: balancete, balanco, dre, demais — todos filhos de `contabil`. */
const ICONE: Record<string, typeof Folder> = {
  xml_entrada: FileSpreadsheet,
  xml_saida: FileSpreadsheet,
  entrada: FileSpreadsheet,
  saida: FileSpreadsheet,
  contabil: Folder,
  balancete: FileText,
  balanco: FileText,
  dre: FileText,
  demais: FileText,
  relatorios: FileText,
}

/** Pastas que recebem documento contábil (aceitam PDF). */
const TIPOS_CONTABEIS = ['contabil', 'balancete', 'balanco', 'dre', 'demais']

export function ParametrizadorPastasDados() {
  const [token, setToken] = useState('')
  const [clientes, setClientes] = useState<Pasta[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const [abertos, setAbertos] = useState<Record<string, boolean>>({})
  const [conteudo, setConteudo] = useState<Record<string, DocContabil[]>>({})
  const [pastaAlvo, setPastaAlvo] = useState<Pasta | null>(null)
  const [importando, setImportando] = useState(false)
  const [novoCliente, setNovoCliente] = useState('')
  const [criando, setCriando] = useState(false)

  const chamar = useCallback(
    async (rota: string, init?: RequestInit) => {
      const r = await fetch(`${BACKEND}/backend/v1/${rota}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          'X-Painel-Token': token,
          ...(init?.headers || {}),
        },
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || `Falha ${r.status}`)
      return j
    },
    [token],
  )

  useEffect(() => {
    try {
      setToken(window.localStorage.getItem('adecont_painel_token') || '')
    } catch {
      /* sem storage */
    }
  }, [])

  const carregar = useCallback(async () => {
    if (!token) return
    setCarregando(true)
    setErro(null)
    try {
      const j = await chamar('param-pastas-dados')
      setClientes(j.clientes || [])
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [chamar, token])

  useEffect(() => {
    carregar()
  }, [carregar])

  const abrirPasta = async (p: Pasta) => {
    setAbertos((a) => ({ ...a, [p.id]: !a[p.id] }))
    if (conteudo[p.id]) return
    try {
      const j = await chamar(`param-pastas-dados-conteudo?pasta=${p.id}`)
      setConteudo((c) => ({ ...c, [p.id]: j.contabeis || [] }))
    } catch (e: any) {
      setErro(e.message)
    }
  }

  /** Cria a árvore de um cliente novo, pelo CNPJ (busca o nome no cadastro). */
  const criarCliente = async () => {
    const bruto = novoCliente.trim()
    if (!bruto) return
    setCriando(true)
    setErro(null)
    try {
      const soDigitos = bruto.replace(/\D/g, '')
      const corpo = soDigitos.length >= 11 ? { cnpj: soDigitos } : { nome: bruto }
      const j = await chamar('param-pastas-dados', {
        method: 'POST',
        body: JSON.stringify(corpo),
      })
      setAviso(
        `Pasta de "${j.cliente}" pronta: ${j.criadas.length} pasta(s) criada(s), ${j.reaproveitadas} reaproveitada(s).`,
      )
      setNovoCliente('')
      carregar()
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setCriando(false)
    }
  }

  /**
   * IMPORTA UM BALANCETE EM PDF PARA A PASTA ESCOLHIDA.
   * O navegador extrai o texto (pdf.js), o servidor interpreta e confere.
   */
  const importarPDF = async (arquivo: File) => {
    if (!pastaAlvo) return
    setImportando(true)
    setErro(null)
    setAviso(null)
    try {
      const lido = await extrairTextoPDF(arquivo)
      const contas = lerContas(lido.linhas)

      if (!contas.length) {
        throw new Error(
          'Nenhuma conta reconhecida neste PDF. Confira se é um balancete do sistema contábil.',
        )
      }

      const j = await chamar('contab-importar-pdf', {
        method: 'POST',
        body: JSON.stringify({
          arquivo_nome: arquivo.name,
          texto: lido.texto,
          pasta: pastaAlvo.id,
          pasta_nome: caminhoDe(pastaAlvo, clientes),
        }),
      })

      setAviso(
        `"${j.empresa}" · competência ${j.competencia}: ${j.contas} contas gravadas. ` +
          `Ativo ${brl(j.total_ativo)} · Receita acumulada ${brl(j.receita_bruta_acumulada)}.`,
      )
      setConteudo((c) => {
        const copia = { ...c }
        delete copia[pastaAlvo.id]
        return copia
      })
      carregar()
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setImportando(false)
    }
  }

  const totalDocumentos = clientes.reduce((s, c) => s + (c.total || 0), 0)
  const totalPastas = clientes.reduce((s, c) => s + contar(c), 0)

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-panorama-gold/40 bg-white p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-1.5 text-[13px] font-bold text-panorama-navy">
              <Folder className="h-4 w-4 text-panorama-gold" />
              Pastas de dados por cliente
            </h3>
            <p className="mt-0.5 max-w-3xl text-[11px] leading-relaxed text-slate-600">
              O repositório de cada cliente analisado: XMLs de entrada e saída, balanços,
              balancetes, DREs e demais documentos. É daqui que os especialistas puxam os dados para
              a análise tributária e os cruzamentos com a legislação da reforma.
            </p>
          </div>
          <div className="flex items-center gap-3 text-center">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                Clientes
              </p>
              <p className="text-[15px] font-bold text-panorama-navy">{clientes.length}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Pastas</p>
              <p className="text-[15px] font-bold text-panorama-navy">{totalPastas}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                Documentos
              </p>
              <p className="text-[15px] font-bold text-panorama-gold">{totalDocumentos}</p>
            </div>
            <button
              onClick={carregar}
              disabled={carregando}
              className="rounded-lg border border-slate-300 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
              title="Atualizar"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${carregando ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* criar cliente */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2.5">
          <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <input
            value={novoCliente}
            onChange={(e) => setNovoCliente(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && criarCliente()}
            placeholder="CNPJ ou razão social do cliente para criar a pasta…"
            className="min-w-[240px] flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11px] focus:border-panorama-navy focus:outline-none"
          />
          <button
            onClick={criarCliente}
            disabled={criando || !novoCliente.trim()}
            className="inline-flex items-center gap-1 rounded-lg bg-panorama-navy px-3 py-1.5 text-[11px] font-bold text-panorama-gold-light hover:bg-slate-900 disabled:opacity-50"
          >
            {criando ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Folder className="h-3 w-3" />
            )}
            Criar pasta do cliente
          </button>
        </div>
      </div>

      {erro && (
        <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-2.5 text-[11px] text-red-800">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">{erro}</span>
          <button onClick={() => setErro(null)}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {aviso && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-300 bg-emerald-50 p-2.5 text-[11px] text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">{aviso}</span>
          <button onClick={() => setAviso(null)}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* árvore */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {carregando && !clientes.length ? (
          <div className="p-8 text-center text-[12px] text-slate-500">Carregando pastas…</div>
        ) : !clientes.length ? (
          <div className="p-8 text-center">
            <p className="text-[12px] font-semibold text-slate-600">
              Nenhuma pasta de cliente ainda
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Informe o CNPJ acima para criar a estrutura completa.
            </p>
          </div>
        ) : (
          clientes.map((c) => (
            <div key={c.id} className="border-b border-slate-100 last:border-0">
              <button
                onClick={() => abrirPasta(c)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-50"
              >
                {abertos[c.id] ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                )}
                <FolderOpen className="h-4 w-4 shrink-0 text-panorama-gold" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-bold text-panorama-navy">{c.nome}</p>
                  <p className="text-[10px] text-slate-500">
                    {c.cnpj ? formatarCNPJ(c.cnpj) : 'sem CNPJ'}
                    {c.cliente_id && ` · cliente #${c.cliente_id}`}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {c.total || 0} doc(s)
                </span>
              </button>

              {abertos[c.id] && (
                <div className="bg-slate-50/50 pb-2 pl-9 pr-3">
                  {c.filhas.map((f) => (
                    <Filha
                      key={f.id}
                      pasta={f}
                      aberta={Boolean(abertos[f.id])}
                      onAbrir={() => abrirPasta(f)}
                      conteudo={conteudo[f.id]}
                      onImportar={() => setPastaAlvo(f)}
                    />
                  ))}
                  {!c.filhas.length && (
                    <p className="py-2 text-[10.5px] text-slate-400">
                      Estrutura ainda não criada para este cliente.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* modal de importação */}
      {pastaAlvo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9.5px] font-bold uppercase tracking-wide text-slate-400">
                  Importar para
                </p>
                <h4 className="text-[13px] font-bold text-panorama-navy">{pastaAlvo.nome}</h4>
                {pastaAlvo.cnpj && (
                  <p className="text-[10px] text-slate-500">{formatarCNPJ(pastaAlvo.cnpj)}</p>
                )}
              </div>
              <button
                onClick={() => setPastaAlvo(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-2 rounded-lg bg-slate-50 p-2 text-[10.5px] leading-relaxed text-slate-600">
              Envie o <strong>balancete em PDF</strong>. O texto é extraído no seu navegador, o
              servidor interpreta as contas e confere se o balancete fecha antes de gravar.
            </p>

            <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-3 py-5 text-[11.5px] font-semibold text-slate-600 hover:border-panorama-gold hover:bg-amber-50/40">
              {importando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {importando ? 'Lendo o PDF…' : 'Escolher arquivo PDF'}
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                disabled={importando}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) importarPDF(f)
                  e.target.value = ''
                }}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

function Filha({
  pasta,
  aberta,
  onAbrir,
  conteudo,
  onImportar,
}: {
  pasta: Pasta
  aberta: boolean
  onAbrir: () => void
  conteudo?: DocContabil[]
  onImportar: () => void
}) {
  const Icone = ICONE[pasta.tipo] || Folder
  const cor = CORES[pasta.cor] || 'text-slate-600'
  const contabil = TIPOS_CONTABEIS.includes(pasta.tipo)

  return (
    <div className="border-b border-slate-200/60 py-1 last:border-0">
      <div className="flex items-center gap-1.5">
        <button onClick={onAbrir} className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
          {pasta.filhas.length > 0 &&
            (aberta ? (
              <ChevronDown className="h-3 w-3 text-slate-400" />
            ) : (
              <ChevronRight className="h-3 w-3 text-slate-400" />
            ))}
          <Icone className={`h-3.5 w-3.5 shrink-0 ${cor}`} />
          <span className="truncate text-[11px] font-semibold text-slate-700">{pasta.nome}</span>
          <span className="shrink-0 rounded bg-white px-1.5 py-0.5 text-[9.5px] font-bold text-slate-500 ring-1 ring-slate-200">
            {pasta.documentos}
          </span>
        </button>
        {contabil && (
          <button
            onClick={onImportar}
            className="shrink-0 rounded bg-panorama-navy px-1.5 py-0.5 text-[9.5px] font-bold text-panorama-gold-light hover:bg-slate-900"
          >
            + PDF
          </button>
        )}
      </div>

      {aberta && (
        <div className="ml-5 mt-1">
          {pasta.filhas.map((f) => (
            <Filha
              key={f.id}
              pasta={f}
              aberta={false}
              onAbrir={() => {}}
              conteudo={undefined}
              onImportar={onImportar}
            />
          ))}

          {contabil && conteudo && conteudo.length > 0 && (
            <div className="mt-1 overflow-hidden rounded border border-slate-200 bg-white">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="bg-panorama-navy text-panorama-gold-light">
                    <th className="px-1.5 py-1 text-left font-bold">Competência</th>
                    <th className="px-1.5 py-1 text-right font-bold">Ativo</th>
                    <th className="px-1.5 py-1 text-right font-bold">Receita acum.</th>
                    <th className="px-1.5 py-1 text-right font-bold">Resultado</th>
                    <th className="px-1.5 py-1 text-center font-bold">Contas</th>
                  </tr>
                </thead>
                <tbody>
                  {conteudo.map((d) => (
                    <tr key={d.id} className="border-t border-slate-100">
                      <td className="px-1.5 py-1 font-semibold text-slate-700">{d.competencia}</td>
                      <td className="px-1.5 py-1 text-right tabular-nums">{brl(d.ativo)}</td>
                      <td className="px-1.5 py-1 text-right tabular-nums">{brl(d.receita)}</td>
                      <td
                        className={`px-1.5 py-1 text-right tabular-nums ${d.lucro >= 0 ? 'text-emerald-700' : 'text-red-600'}`}
                      >
                        {brl(d.lucro)}
                      </td>
                      <td className="px-1.5 py-1 text-center text-slate-500">{d.linhas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {contabil && conteudo && conteudo.length === 0 && (
            <p className="py-1 text-[10px] text-slate-400">
              Pasta vazia — use «+ PDF» para importar.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function contar(p: Pasta): number {
  return 1 + p.filhas.reduce((s, f) => s + contar(f), 0)
}

function caminhoDe(pasta: Pasta, clientes: Pasta[]): string {
  for (const c of clientes) {
    for (const f of c.filhas) {
      if (f.id === pasta.id) return `${c.nome} > ${f.nome}`
      for (const g of f.filhas) {
        if (g.id === pasta.id) return `${c.nome} > ${f.nome} > ${g.nome}`
      }
    }
  }
  return pasta.nome
}

function formatarCNPJ(c: string): string {
  const d = String(c || '').replace(/\D/g, '')
  if (d.length === 14) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  if (d.length === 11) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
  return c
}
