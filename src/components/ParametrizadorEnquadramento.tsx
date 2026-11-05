import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Download,
  FileCheck2,
  Info,
  Printer,
  RefreshCw,
  Scale,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import {
  ATIVIDADES,
  REGIMES,
  RESSALVA_ENQUADRAMENTO,
  cruzar,
  type RegimeId,
} from '@/data/enquadramento'
import { CONFERENCIA_OFICIAL } from '@/data/conferenciaOficial'

/**
 * ENQUADRAMENTO TRIBUTÁRIO E ATIVIDADES — o cruzamento que orienta a escolha
 * =========================================================================
 * Pedido do CEO (05/11/2026): "tabela de enquadramento tributário e atividades
 * comerciais, para usar de cruzamento na construção da melhor opção tributária
 * para a reforma."
 *
 * ── AS TRÊS DIMENSÕES, E POR QUE UMA SÓ NÃO BASTA ──
 *   1. O QUE O CLIENTE VENDE  → NCM → tratamento (já existe no motor)
 *   2. COMO ELE ESTÁ ENQUADRADO → regime → o que muda na reforma (esta tela)
 *   3. O QUE ELE FAZ → atividade → anexos aplicáveis (esta tela)
 *
 * A melhor opção nasce do cruzamento das três. Uma tabela de regime sozinha
 * responde "o Simples perde vantagem" — e isso pode estar errado para quem vende
 * cesta básica para consumidor final, porque lá o crédito não importa.
 *
 * ── A REGRA QUE A TELA RESPEITA ──
 * Ela NÃO diz "este é o melhor regime". Mostra quais fatores pesam e em que
 * direção, e deixa a decisão com quem responde por ela. Prometer "melhor regime"
 * a partir de uma tabela seria vender certeza que a tabela não tem.
 */

const BACKEND =
  import.meta.env.VITE_POCKETBASE_URL?.replace(/\/$/, '') ||
  'https://verificacao-projeto-panorama-18549.shrd02.internal.goskip.dev'

const TOKEN_KEY = 'adecont_painel_token'

export function ParametrizadorEnquadramento() {
  const [token, setToken] = useState('')
  const [regimeSel, setRegimeSel] = useState<RegimeId>('simples')
  const [atividadeSel, setAtividadeSel] = useState('alimentacao')
  const [busca, setBusca] = useState('')

  useEffect(() => {
    try {
      setToken(window.localStorage.getItem(TOKEN_KEY) || '')
    } catch {
      setToken('')
    }
  }, [])

  /* O resultado da conferência vem como DADO ESTÁTICO, não por rota: o backend
     roda em outro host e não lê os arquivos que o script gera. Gerar em build
     (import direto) é o único caminho que não depende de transporte. */
  const conferencia = CONFERENCIA_OFICIAL

  const regime = REGIMES.find((r) => r.id === regimeSel)!
  const atividade = ATIVIDADES.find((a) => a.id === atividadeSel)!
  const cruz = useMemo(() => cruzar(regimeSel, atividadeSel), [regimeSel, atividadeSel])

  const atividadesFiltradas = useMemo(() => {
    const t = busca
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
    if (!t) return ATIVIDADES
    return ATIVIDADES.filter((a) =>
      `${a.nome} ${a.cnaeGrupos.join(' ')}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(t),
    )
  }, [busca])

  const imprimir = () => {
    const L: string[] = []
    L.push('ENQUADRAMENTO TRIBUTÁRIO × ATIVIDADE — CRUZAMENTO PARA A REFORMA')
    L.push('='.repeat(76))
    L.push('')
    L.push('Gerado em: ' + new Date().toLocaleString('pt-BR'))
    L.push('')
    L.push('REGIME: ' + regime.nome)
    L.push('  ' + regime.resumo)
    L.push('  Limites e condições:')
    for (const c of regime.condicoes) L.push('    · ' + c)
    L.push('')
    L.push('  NA REFORMA:')
    L.push('    ' + regime.naReforma.o_que_muda)
    L.push('    Base: ' + regime.naReforma.base)
    L.push('    ATENÇÃO: ' + regime.naReforma.alerta)
    L.push('')
    L.push('ATIVIDADE: ' + atividade.nome)
    L.push('  CNAE (grupos): ' + atividade.cnaeGrupos.join(', '))
    L.push('  Anexos típicos: ' + atividade.anexosTipicos.join(' | '))
    L.push('')
    L.push('  O QUE PESA: ' + atividade.o_que_pesa)
    L.push('  ATENÇÃO: ' + atividade.alerta)
    L.push('')
    if (cruz) {
      L.push('='.repeat(76))
      L.push('CRUZAMENTO — peso: ' + cruz.peso.toUpperCase())
      L.push('='.repeat(76))
      L.push('')
      for (const f of cruz.fatores) L.push('  · ' + f)
      L.push('')
      L.push('  OLHAR PRIMEIRO: ' + cruz.prioridade)
    }
    L.push('')
    L.push('='.repeat(76))
    L.push(RESSALVA_ENQUADRAMENTO)
    L.push('')
    L.push('Fontes: LC 123/2006 · LC 214/2025 (arts. 41, 127, 164-171, 252-261, 343) ·')
    L.push('CNAE 2.3 (IBGE). ADECONT — Parametrizador de Documentos Fiscais.')

    const janela = window.open('', '_blank', 'width=900,height=1000')
    if (!janela) return
    janela.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Enquadramento tributário</title><style>
@page{size:A4;margin:16mm 14mm}
body{font-family:ui-monospace,"Courier New",monospace;font-size:10px;line-height:1.5;white-space:pre-wrap}
@media print{body{font-size:8.5pt}}
</style></head><body>${L.join('\n')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')}</body></html>`)
    janela.document.close()
    setTimeout(() => janela.print(), 350)
  }

  const corPeso = (p: string) =>
    p === 'favoravel'
      ? 'border-emerald-300 bg-emerald-50'
      : p === 'desfavoravel'
        ? 'border-rose-300 bg-rose-50'
        : 'border-amber-300 bg-amber-50'

  return (
    <div className="space-y-3">
      {/* ── conferência da fonte oficial ── */}
      <div className="rounded-xl border-2 border-panorama-navy/30 bg-white p-3">
        <div className="flex flex-wrap items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-panorama-navy shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-slate-900 leading-tight">
              Conferência da tabela NCM contra a fonte oficial
            </p>
            <p className="text-[9px] text-slate-500 leading-tight">
              Anexo I da Res. Gecex 272/2021 — PDF oficial do MDIC, 453 páginas
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[8.5px] font-bold text-emerald-800">
            conferido
          </span>
        </div>

        {true ? (
          <div className="mt-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <p className="text-[8.5px] font-bold uppercase text-slate-500">Base do sistema</p>
                <p className="text-[15px] font-bold tabular-nums text-slate-900">
                  {Number(conferencia.base_total).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <p className="text-[8.5px] font-bold uppercase text-slate-500">Fonte oficial</p>
                <p className="text-[15px] font-bold tabular-nums text-slate-900">
                  {Number(conferencia.oficial_total).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-2">
                <p className="text-[8.5px] font-bold uppercase text-emerald-800">Conferem</p>
                <p className="text-[15px] font-bold tabular-nums text-emerald-900">
                  {Number(conferencia.conferem).toLocaleString('pt-BR')}
                </p>
              </div>
              <div
                className={`rounded-lg border p-2 ${
                  conferencia.faltando_8_digitos > 0
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <p className="text-[8.5px] font-bold uppercase text-slate-500">Divergências</p>
                <p className="text-[15px] font-bold tabular-nums text-slate-900">
                  {conferencia.faltando_8_digitos}
                </p>
              </div>
            </div>
            <p className="mt-1.5 text-[9px] leading-snug text-slate-600">
              <b>Itens de 8 dígitos ausentes:</b> {conferencia.faltando_8_digitos}
              <span className="ml-2 text-slate-500">{conferencia.nota}</span>
            </p>
          </div>
        ) : (
        )}
      </div>

      {/* ── seleção do cruzamento ── */}
      <div className="rounded-xl border-2 border-panorama-navy/30 bg-white p-3">
        <p className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5" />
          Cruzamento: regime × atividade
        </p>
        <p className="mt-0.5 text-[10px] leading-snug text-slate-500">
          A melhor opção tributária nasce do cruzamento de três dimensões: o que o cliente{' '}
          <b>vende</b> (NCM), como está <b>enquadrado</b> (regime) e o que ele <b>faz</b>{' '}
          (atividade). Esta tela cruza as duas últimas.
        </p>

        <div className="mt-2 flex flex-wrap items-end gap-2">
          <label className="min-w-[220px] flex-1">
            <span className="text-[10px] font-bold text-slate-600">Regime atual</span>
            <select
              value={regimeSel}
              onChange={(e) => setRegimeSel(e.target.value as RegimeId)}
              className="mt-0.5 w-full rounded-lg border-2 border-slate-300 px-2 py-1.5 text-[11px] bg-white focus:outline-none focus:border-panorama-gold"
            >
              {REGIMES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-[220px] flex-1">
            <span className="text-[10px] font-bold text-slate-600">Atividade</span>
            <select
              value={atividadeSel}
              onChange={(e) => setAtividadeSel(e.target.value)}
              className="mt-0.5 w-full rounded-lg border-2 border-slate-300 px-2 py-1.5 text-[11px] bg-white focus:outline-none focus:border-panorama-gold"
            >
              {ATIVIDADES.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={imprimir}
            className="inline-flex items-center gap-1.5 rounded-lg bg-panorama-navy px-3 py-2 text-[11px] font-bold text-panorama-gold-light hover:bg-slate-900 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir análise
          </button>
        </div>
      </div>

      {/* ── o cruzamento ── */}
      {cruz && (
        <>
          <div className={`rounded-xl border-2 ${corPeso(cruz.peso)} p-3`}>
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-900">
              {cruz.peso === 'favoravel' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              ) : cruz.peso === 'desfavoravel' ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
              ) : (
                <Info className="w-3.5 h-3.5 text-amber-700" />
              )}
              {regime.nome} × {atividade.nome}
              <span className="ml-1 rounded bg-white/70 px-1.5 py-0.5 text-[8.5px] font-bold uppercase">
                {cruz.peso}
              </span>
            </p>
            <ul className="mt-1.5 space-y-1">
              {cruz.fatores.map((f, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[10px] leading-snug text-slate-700">
                  <ArrowRight className="mt-0.5 w-3 h-3 shrink-0 text-slate-400" />
                  {f}
                </li>
              ))}
            </ul>
            <p className="mt-2 rounded bg-white/70 p-1.5 text-[9.5px] leading-snug text-slate-800">
              <b>Olhar primeiro:</b> {cruz.prioridade}
            </p>
          </div>

          {/* regime em detalhe */}
          <div className="rounded-xl border-2 border-slate-200 bg-white p-3">
            <p className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              {regime.nome}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-600">{regime.resumo}</p>

            <p className="mt-2 text-[9px] font-bold uppercase text-slate-500">Limites e condições</p>
            <ul className="mt-0.5 space-y-0.5">
              {regime.condicoes.map((c, i) => (
                <li key={i} className="text-[9.5px] leading-snug text-slate-700">
                  · {c}
                </li>
              ))}
            </ul>

            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
              <p className="text-[9px] font-bold uppercase text-slate-500">Na reforma</p>
              <p className="mt-0.5 text-[10px] leading-snug text-slate-800">
                {regime.naReforma.o_que_muda}
              </p>
              <p className="mt-1 text-[9px] text-slate-500">{regime.naReforma.base}</p>
              <p className="mt-1.5 rounded border border-amber-300 bg-amber-50 p-1.5 text-[9.5px] leading-snug text-amber-900">
                <b>Atenção:</b> {regime.naReforma.alerta}
              </p>
            </div>

            <p className="mt-2 text-[9.5px] leading-snug text-slate-700">
              <b>Ação:</b> {regime.acao}
            </p>
          </div>

          {/* atividade em detalhe */}
          <div className="rounded-xl border-2 border-slate-200 bg-white p-3">
            <p className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
              <BadgeCheck className="w-3.5 h-3.5" />
              {atividade.nome}
            </p>
            <p className="mt-0.5 text-[9.5px] text-slate-500">
              CNAE (grupos): <b>{atividade.cnaeGrupos.join(', ')}</b> · seções{' '}
              {atividade.cnaeSecoes.join(', ')}
            </p>

            <p className="mt-2 text-[9px] font-bold uppercase text-slate-500">Anexos típicos da LC 214</p>
            <div className="mt-0.5 flex flex-wrap gap-1">
              {atividade.anexosTipicos.map((a, i) => (
                <span
                  key={i}
                  className="rounded bg-panorama-navy/10 px-1.5 py-0.5 text-[8.5px] font-bold text-panorama-navy"
                >
                  {a}
                </span>
              ))}
            </div>

            <p className="mt-2 text-[10px] leading-snug text-slate-700">
              <b>O que pesa:</b> {atividade.o_que_pesa}
            </p>
            <p className="mt-1 rounded border border-amber-300 bg-amber-50 p-1.5 text-[9.5px] leading-snug text-amber-900">
              <b>Atenção:</b> {atividade.alerta}
            </p>
            <p className="mt-1 text-[9px] leading-snug text-slate-500">
              Capítulos NCM típicos: {atividade.capitulosTipicos.join(' · ')}
            </p>
          </div>
        </>
      )}

      {/* ── matriz completa ── */}
      <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
        <div className="px-3 py-2 border-b-2 border-panorama-gold/40 bg-slate-50">
          <p className="text-[11px] font-bold text-slate-900">
            Matriz de enquadramento × atividade ({REGIMES.length} × {ATIVIDADES.length})
          </p>
          <p className="text-[9px] text-slate-500">
            visão de conjunto — verde favorece, vermelho pesa, âmbar depende
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[9px] min-w-[700px]">
            <thead>
              <tr className="bg-panorama-navy text-white">
                <th className="text-left px-2 py-1.5 font-bold">Atividade</th>
                {REGIMES.map((r) => (
                  <th key={r.id} className="text-center px-1.5 py-1.5 font-bold">
                    {r.nome.split(' ')[0].replace('—', '')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {atividadesFiltradas.map((a, i) => (
                <tr key={a.id} className={i % 2 ? 'bg-slate-50' : 'bg-white'}>
                  <td
                    className="px-2 py-1 border-b border-slate-100 cursor-pointer hover:font-bold"
                    onClick={() => setAtividadeSel(a.id)}
                  >
                    {a.nome}
                  </td>
                  {REGIMES.map((r) => {
                    const c = cruzar(r.id, a.id)
                    const cor =
                      c?.peso === 'favoravel'
                        ? 'bg-emerald-500'
                        : c?.peso === 'desfavoravel'
                          ? 'bg-rose-500'
                          : 'bg-amber-400'
                    return (
                      <td key={r.id} className="px-1.5 py-1 border-b border-slate-100 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setRegimeSel(r.id)
                            setAtividadeSel(a.id)
                          }}
                          title={c?.prioridade}
                          className={`w-4 h-4 rounded-sm ${cor} cursor-pointer hover:ring-2 hover:ring-slate-400`}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-1.5 text-[9px] leading-snug text-amber-900">
        <ShieldCheck className="mr-1 inline w-3 h-3" />
        <b>Como ler:</b> {RESSALVA_ENQUADRAMENTO}
      </p>
    </div>
  )
}
