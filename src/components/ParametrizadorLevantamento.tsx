import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Filter,
  Info,
  Loader2,
  MapPin,
  Printer,
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import {
  CRITERIOS,
  MUNICIPIOS_ZFM_ALC,
  RESSALVA_LEVANTAMENTO,
  levantarCarteira,
  type ClienteCarteira,
} from '@/data/levantamentoCarteira'
import { CAMPOS_AUSENTES, CARTEIRA, ORIGEM_CARTEIRA } from '@/data/carteiraRegimes'

/**
 * LEVANTAMENTO DE CARTEIRA — quem se enquadra em regime específico
 * ================================================================
 * Pedido do CEO (05/11/2026): "identificar quais clientes se enquadram em cada um
 * (combustível pelo CNAE, financeiro pela supervisão do Bacen, ZFM pela
 * localização) e sinalizar no cadastro. Isso é levantamento de carteira, não
 * tabela."
 *
 * ── A HONESTIDADE QUE A TELA CARREGA ──
 * O levantamento só afirma o que o CADASTRO prova. A base real (497 empresas) não
 * tem CNAE — o campo não veio na exportação. Então:
 *
 *   CONFIRMADO — natureza jurídica, SUFRAMA ou CNAE decidem. Vai para o cadastro.
 *   INDÍCIO    — o dado existe mas não basta (natureza de produtor rural sem a
 *                receita, município da ZFM sem SUFRAMA). Vai para conferência.
 *   PENDENTE   — o critério depende de CNAE, que não temos. Não se classifica.
 *
 * Marcar cliente no regime errado é PIOR que não marcar: ele passa a calcular
 * com a regra de outro regime. Por isso indício nunca vira cadastro.
 */

const BACKEND =
  import.meta.env.VITE_POCKETBASE_URL?.replace(/\/$/, '') ||
  'https://verificacao-projeto-panorama-18549.shrd02.internal.goskip.dev'

const TOKEN_KEY = 'adecont_painel_token'

const brl = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function ParametrizadorLevantamento() {
  const [clientes, setClientes] = useState<ClienteCarteira[]>([])
  const [origem, setOrigem] = useState<string>('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [filtroForca, setFiltroForca] = useState<'confirmado' | 'indicio' | 'pendente' | ''>(
    'confirmado',
  )
  const [filtroCriterio, setFiltroCriterio] = useState('')

  /**
   * A CARTEIRA VEM COMO DADO ESTÁTICO, e isso é decisão técnica, não preguiça.
   *
   * A coleção `clients` vive no projeto 56819 e este app roda no 62493 —
   * backends separados. Testado: /api/collections/clients devolve 404 daqui.
   * Pedir ao backend algo que ele não tem faria a tela dizer "nenhum cliente se
   * enquadra", que é mentira.
   *
   * O CSV da carga do sistema contábil é a fonte real disponível — e é a MESMA
   * que alimentou o cadastro.
   */
  useEffect(() => {
    setClientes(CARTEIRA)
    setOrigem(ORIGEM_CARTEIRA)
    setCarregando(false)
  }, [])

  const resultado = useMemo(() => levantarCarteira(clientes), [clientes])

  const filtrados = useMemo(() => {
    let l = resultado.enquadrados
    if (filtroForca) {
      l = l.filter((e) => e.enquadramentos.some((x) => x.forca === filtroForca))
    }
    if (filtroCriterio) {
      l = l.filter((e) => e.enquadramentos.some((x) => x.criterioId === filtroCriterio))
    }
    const t = busca
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
    if (t) {
      const termos = t.split(/\s+/)
      l = l.filter((e) => {
        const alvo =
          `${e.codigo} ${e.nome} ${e.fantasia} ${e.documento} ${e.cidade} ${e.uf} ${e.natureza}`
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
        return termos.every((x) => alvo.indexOf(x) >= 0)
      })
    }
    return l
  }, [resultado, filtroForca, filtroCriterio, busca])

  const confirmados = resultado.enquadrados.filter((e) =>
    e.enquadramentos.some((x) => x.forca === 'confirmado'),
  )

  const imprimir = () => {
    const L: string[] = []
    L.push('LEVANTAMENTO DE CARTEIRA — REGIMES ESPECÍFICOS DA LC 214')
    L.push('='.repeat(76))
    L.push('')
    L.push('Gerado em: ' + new Date().toLocaleString('pt-BR'))
    L.push('Carteira analisada: ' + resultado.resumo.total + ' clientes')
    if (origem) L.push('Origem: ' + origem)
    L.push('')
    L.push('RESUMO POR CRITÉRIO')
    for (const p of resultado.resumo.porCriterio) {
      L.push(
        `  ${p.regime}: ${p.confirmado} confirmado(s) · ${p.indicio} indício(s) · ${p.pendente} pendente(s)`,
      )
    }
    L.push('')
    L.push('='.repeat(76))
    L.push('CONFIRMADOS — o cadastro prova, pode sinalizar')
    L.push('='.repeat(76))
    for (const e of confirmados) {
      L.push('')
      L.push(`${e.codigo} — ${e.nome}`)
      if (e.documento) L.push('  CNPJ/CPF: ' + e.documento)
      if (e.cidade) L.push('  ' + e.cidade + '/' + e.uf)
      if (e.natureza) L.push('  Natureza: ' + e.natureza)
      for (const x of e.enquadramentos.filter((y) => y.forca === 'confirmado')) {
        L.push('  → ' + x.regime + ': ' + x.evidencia)
      }
    }
    L.push('')
    L.push('='.repeat(76))
    L.push('INDÍCIOS — vão para conferência, NÃO para o cadastro')
    L.push('='.repeat(76))
    for (const e of resultado.enquadrados) {
      const ind = e.enquadramentos.filter((x) => x.forca === 'indicio')
      if (!ind.length) continue
      L.push('')
      L.push(`${e.codigo} — ${e.nome}`)
      for (const x of ind) {
        L.push('  → ' + x.regime + ': ' + x.evidencia)
        if (x.falta) L.push('     falta: ' + x.falta)
      }
    }
    L.push('')
    L.push('='.repeat(76))
    L.push(RESSALVA_LEVANTAMENTO)
    L.push('')
    L.push('Fonte: LC 214/2025 (arts. 164, 251, 271, 439-461, 174-181, 182-214).')
    L.push('ADECONT — Parametrizador de Documentos Fiscais.')

    const janela = window.open('', '_blank', 'width=900,height=1000')
    if (!janela) return
    janela.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Levantamento de carteira</title><style>
@page{size:A4;margin:15mm}
body{font-family:ui-monospace,"Courier New",monospace;font-size:9.5px;line-height:1.45;white-space:pre-wrap}
</style></head><body>${L.join('\n')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')}</body></html>`)
    janela.document.close()
    setTimeout(() => janela.print(), 350)
  }

  const baixarCsv = () => {
    const cab = [
      'codigo',
      'nome',
      'documento',
      'natureza',
      'cidade',
      'uf',
      'regime',
      'forca',
      'evidencia',
      'falta',
    ]
    const linhas = [cab]
    for (const e of filtrados) {
      for (const x of e.enquadramentos) {
        linhas.push([
          e.codigo,
          `"${e.nome.replace(/"/g, '')}"`,
          e.documento || '',
          `"${(e.natureza || '').replace(/"/g, '')}"`,
          e.cidade || '',
          e.uf || '',
          x.regime,
          x.forca,
          `"${x.evidencia.replace(/"/g, '')}"`,
          `"${(x.falta || '').replace(/"/g, '')}"`,
        ])
      }
    }
    const csv = linhas.map((l) => l.join(';')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'levantamento-carteira-regimes.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const corForca = (f: string) =>
    f === 'confirmado'
      ? 'bg-emerald-600 text-white'
      : f === 'indicio'
        ? 'bg-amber-500 text-white'
        : 'bg-slate-500 text-white'

  return (
    <div className="space-y-3">
      {/* ── o que é isto ── */}
      <div className="rounded-xl border-2 border-panorama-navy/40 bg-slate-50 p-3">
        <p className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          Levantamento de carteira — quem se enquadra em regime específico
        </p>
        <p className="mt-0.5 text-[10px] leading-snug text-slate-600">
          Cruza a <b>carteira real</b> com os critérios da LC 214. Só afirma o que o cadastro prova:{' '}
          <b className="text-emerald-700">confirmado</b> vem de natureza jurídica, SUFRAMA ou CNAE;{' '}
          <b className="text-amber-700">indício</b> é o que o dado sugere mas não prova;
          <b className="text-slate-600"> pendente</b> é o que depende de campo que a base não tem.
        </p>
      </div>

      {erro && (
        <p className="flex items-start gap-1.5 rounded-lg border border-rose-300 bg-rose-50 p-2 text-[10.5px] text-rose-900">
          <XCircle className="mt-0.5 w-3.5 h-3.5 shrink-0" />
          {erro}
        </p>
      )}

      {/* ── barra ── */}
      <div className="rounded-xl border-2 border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setClientes([])
              setTimeout(() => setClientes(CARTEIRA), 60)
            }}
            disabled={carregando}
            className="inline-flex items-center gap-1.5 rounded-lg bg-panorama-navy px-3 py-1.5 text-[11px] font-bold text-panorama-gold-light hover:bg-slate-900 disabled:opacity-40 cursor-pointer"
          >
            {carregando ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Levantar carteira
          </button>

          <label className="flex flex-1 min-w-[180px] items-center gap-1.5 rounded-lg border-2 border-slate-300 px-2 py-[7px]">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="nome, código, documento ou cidade"
              className="w-full text-[10.5px] bg-transparent focus:outline-none"
            />
            {busca && (
              <button
                onClick={() => setBusca('')}
                className="shrink-0 cursor-pointer text-slate-400"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </label>

          <div className="flex gap-1">
            {(['confirmado', 'indicio', 'pendente', ''] as const).map((f) => (
              <button
                key={f || 'todos'}
                type="button"
                onClick={() => setFiltroForca(f)}
                className={`rounded-lg px-2 py-1 text-[10px] font-bold border-2 cursor-pointer ${
                  filtroForca === f
                    ? 'bg-panorama-navy text-panorama-gold-light border-panorama-navy'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                {f === 'confirmado'
                  ? 'Confirmados'
                  : f === 'indicio'
                    ? 'Indícios'
                    : f === 'pendente'
                      ? 'Pendentes'
                      : 'Todos'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={imprimir}
            disabled={!resultado.enquadrados.length}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-slate-300 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir
          </button>
          <button
            type="button"
            onClick={baixarCsv}
            disabled={!filtrados.length}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-slate-300 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>
        {origem && (
          <p className="mt-1.5 text-[9px] text-slate-500">
            <b>Origem dos dados:</b> {origem}
          </p>
        )}
        {CAMPOS_AUSENTES.length > 0 && (
          <p className="mt-0.5 text-[9px] text-amber-800">
            <b>Campos ausentes no cadastro:</b> {CAMPOS_AUSENTES.join(', ')} — os critérios que
            dependem deles saem como <b>pendente</b>, nunca como «não é».
          </p>
        )}
      </div>

      {/* ── resumo ── */}
      {resultado.resumo.total > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-xl border-2 border-slate-200 bg-white p-2.5">
              <p className="text-[9px] font-bold uppercase text-slate-500">Carteira</p>
              <p className="text-[18px] font-bold tabular-nums text-slate-900">
                {resultado.resumo.total}
              </p>
              <p className="text-[8.5px] text-slate-500">clientes analisados</p>
            </div>
            <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-2.5">
              <p className="text-[9px] font-bold uppercase text-emerald-800">Confirmados</p>
              <p className="text-[18px] font-bold tabular-nums text-emerald-900">
                {confirmados.length}
              </p>
              <p className="text-[8.5px] text-emerald-700">cadastro prova</p>
            </div>
            <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-2.5">
              <p className="text-[9px] font-bold uppercase text-amber-800">Indícios</p>
              <p className="text-[18px] font-bold tabular-nums text-amber-900">
                {
                  resultado.enquadrados.filter((e) =>
                    e.enquadramentos.some((x) => x.forca === 'indicio'),
                  ).length
                }
              </p>
              <p className="text-[8.5px] text-amber-700">conferir antes</p>
            </div>
            <div className="rounded-xl border-2 border-slate-300 bg-slate-50 p-2.5">
              <p className="text-[9px] font-bold uppercase text-slate-600">Sem enquadramento</p>
              <p className="text-[18px] font-bold tabular-nums text-slate-700">
                {resultado.resumo.semEnquadramento}
              </p>
              <p className="text-[8.5px] text-slate-500">regime regular</p>
            </div>
          </div>

          {/* por critério */}
          <div className="rounded-xl border-2 border-slate-200 bg-white p-3">
            <p className="text-[11px] font-bold text-slate-900">Por regime</p>
            <div className="mt-1 space-y-1">
              {resultado.resumo.porCriterio.map((p) => (
                <div key={p.criterioId} className="flex items-center gap-2">
                  <p className="flex-1 min-w-0 truncate text-[10px] font-bold text-slate-800">
                    {p.regime}
                  </p>
                  {p.confirmado > 0 && (
                    <span className="shrink-0 rounded bg-emerald-600 px-1.5 py-0.5 text-[8.5px] font-bold text-white">
                      {p.confirmado} confirmado
                    </span>
                  )}
                  {p.indicio > 0 && (
                    <span className="shrink-0 rounded bg-amber-500 px-1.5 py-0.5 text-[8.5px] font-bold text-white">
                      {p.indicio} indício
                    </span>
                  )}
                  {p.pendente > 0 && (
                    <span className="shrink-0 rounded bg-slate-500 px-1.5 py-0.5 text-[8.5px] font-bold text-white">
                      {p.pendente} pendente
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* o que falta para completar */}
          <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-3">
            <p className="flex items-start gap-1.5 text-[10.5px] font-bold text-amber-900">
              <ShieldAlert className="mt-0.5 w-3.5 h-3.5 shrink-0" />
              O que impede classificar combustível e financeiro
            </p>
            <p className="mt-0.5 text-[9.5px] leading-snug text-amber-800">
              {CRITERIOS.find((c) => c.id === 'combustivel')?.motivoIndisponivel}
            </p>
            <p className="mt-1 text-[9.5px] leading-snug text-amber-800">
              <b>Para destravar:</b> incluir a coluna <b>CNAE</b> na exportação do sistema contábil.
              Com ela, o levantamento passa a classificar combustível e financeiro por evidência, e
              não por nome.
            </p>
          </div>
        </>
      )}

      {/* ── lista ── */}
      {filtrados.length === 0 && !carregando && resultado.resumo.total > 0 && (
        <p className="rounded-xl border-2 border-slate-200 bg-slate-50 p-6 text-center text-[11px] text-slate-600">
          Nenhum cliente neste filtro.
        </p>
      )}

      {filtrados.length > 0 && (
        <div className="space-y-1.5">
          {filtrados.map((e, i) => (
            <div key={i} className="rounded-xl border-2 border-slate-200 bg-white p-2.5">
              <div className="flex flex-wrap items-start gap-2">
                <span className="shrink-0 rounded bg-slate-200 px-1.5 py-0.5 text-[8.5px] font-bold text-slate-700">
                  {e.codigo}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-slate-900 leading-tight truncate">
                    {e.nome}
                  </p>
                  <p className="text-[9px] text-slate-500">
                    {e.documento || 'sem documento'}
                    {e.cidade ? ` · ${e.cidade}/${e.uf}` : ''}
                    {e.natureza ? ` · ${e.natureza}` : ''}
                  </p>
                </div>
              </div>
              <div className="mt-1 space-y-0.5">
                {e.enquadramentos.map((x, j) => (
                  <div key={j} className="flex flex-wrap items-start gap-1.5">
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold ${corForca(x.forca)}`}
                    >
                      {x.forca.toUpperCase()}
                    </span>
                    <p className="min-w-0 flex-1 text-[9.5px] text-slate-700">
                      <b>{x.regime}:</b> {x.evidencia}
                      {x.falta && (
                        <span className="block text-[8.5px] text-amber-800">falta: {x.falta}</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── critérios e municípios ── */}
      <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
        <div className="px-3 py-2 border-b-2 border-panorama-gold/40 bg-slate-50">
          <p className="text-[11px] font-bold text-slate-900">
            Critérios de enquadramento ({CRITERIOS.length})
          </p>
        </div>
        <div className="p-2 space-y-1">
          {CRITERIOS.map((c) => (
            <div key={c.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
              <p className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-900">
                {c.dadoDisponivel ? (
                  <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-700" />
                ) : (
                  <AlertTriangle className="w-3 h-3 shrink-0 text-amber-600" />
                )}
                {c.regime}
                <span className="ml-auto shrink-0 text-[8.5px] font-normal text-slate-500">
                  {c.base}
                </span>
              </p>
              <p className="mt-0.5 text-[9px] text-slate-600">
                <b>Campo que decide:</b> {c.campoDecide}
              </p>
              <p className="text-[9px] leading-snug text-slate-700">{c.comoReconhecer}</p>
              {c.motivoIndisponivel && (
                <p className="mt-0.5 rounded bg-amber-100 p-1 text-[8.5px] leading-snug text-amber-900">
                  <b>Indisponível:</b> {c.motivoIndisponivel}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border-2 border-slate-200 bg-white p-3">
        <p className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          Municípios de ZFM e Áreas de Livre Comércio ({MUNICIPIOS_ZFM_ALC.length})
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          {MUNICIPIOS_ZFM_ALC.map((m, i) => (
            <span
              key={i}
              className="rounded bg-panorama-navy/10 px-1.5 py-0.5 text-[8.5px] font-bold text-panorama-navy"
            >
              {m.cidade}/{m.uf}
            </span>
          ))}
        </div>
        <p className="mt-1 text-[8.5px] leading-snug text-slate-500">
          O município indica a área; a fruição do benefício exige o <b>registro SUFRAMA</b>. Sem
          ele, o enquadramento fica como indício.
        </p>
      </div>

      <p className="rounded-lg border border-rose-300 bg-rose-50 px-2 py-1.5 text-[9px] leading-snug text-rose-900">
        <b>Atenção:</b> {RESSALVA_LEVANTAMENTO}
      </p>
    </div>
  )
}
