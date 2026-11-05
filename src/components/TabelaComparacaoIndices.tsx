/**
 * TABELA DE COMPARAÇÃO DE ÍNDICES — aba Histórico (portal 9B).
 *
 * Compara NO MÍNIMO 5 índices selecionáveis com evolução e variações mensal,
 * anual e do período solicitado. Valores ausentes mostram "—" com aviso
 * (nunca erro cru). Impressão A4 com logo ADECONT no padrão dos relatórios.
 */
import { useEffect, useMemo, useState } from 'react'
import { Table2, Printer, X, Info, Loader2, ShieldCheck, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdecontLogo } from '@/components/AdecontLogo'
import { SeloNivelConfianca } from '@/components/SeloNivelConfianca'
import {
  CHAVES_COMPARACAO,
  MINIMO_COMPARACAO,
  SELECAO_INICIAL_COMPARACAO,
  SELECAO_TRIO_IBGE,
  SELECAO_TRIO_IFIX_IBOVESPA_DOLAR,
  SELECAO_TRIO_IFIX_IBOVESPA_SELIC,
  anosDisponiveisComparacao,
  compararIndices,
  seloFonteLinha,
  type GranularidadeComparacao,
  type LinhaComparacao,
} from '@/services/comparacaoSeries'
import type { ChaveSerieHistorica } from '@/services/seriesHistoricas'
import {
  obterUsuarioAtivoLocal,
  assinarMudancaUsuarioAtivo,
  type SistemaUsuario,
} from '@/services/sistemaUsuarios'

const ROTULO_GRAN: Record<GranularidadeComparacao, string> = {
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  anual: 'Anual',
}

function formatarPct(v: number | undefined): string {
  if (v === undefined || !isFinite(v)) return '—'
  const sinal = v > 0 ? '+' : ''
  return (
    sinal + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'
  )
}

function formatarValor(v: number | undefined): string {
  if (v === undefined || !isFinite(v)) return '—'
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

export function TabelaComparacaoIndices() {
  const [aberto, setAberto] = useState(false)
  const [imprimindo, setImprimindo] = useState(false)
  const [selecionadas, setSelecionadas] = useState<ChaveSerieHistorica[]>(
    SELECAO_INICIAL_COMPARACAO,
  )
  const [granularidade, setGranularidade] = useState<GranularidadeComparacao>('mensal')
  const anos = useMemo(() => anosDisponiveisComparacao(), [])
  const [anoInicio, setAnoInicio] = useState(anos[0])
  const [anoFim, setAnoFim] = useState(anos[anos.length - 1])
  const [linhas, setLinhas] = useState<LinhaComparacao[]>([])
  const [carregando, setCarregando] = useState(false)
  const [algumFallback, setAlgumFallback] = useState(false)
  const [usuarioAtivo, setUsuarioAtivo] = useState<SistemaUsuario | null>(null)

  useEffect(() => {
    setUsuarioAtivo(obterUsuarioAtivoLocal())
    const off = assinarMudancaUsuarioAtivo((u) => setUsuarioAtivo(u))
    return () => off()
  }, [])

  const carregar = async () => {
    setCarregando(true)
    const res = await compararIndices(selecionadas, granularidade, anoInicio, anoFim)
    setLinhas(res)
    setAlgumFallback(res.some((l) => l.baseInterna))
    setCarregando(false)
  }

  const alternar = (chave: ChaveSerieHistorica) => {
    setSelecionadas((atual) =>
      atual.includes(chave) ? atual.filter((c) => c !== chave) : [...atual, chave],
    )
  }

  /**
   * Atalho: seleciona EXATAMENTE o trio informado (IFIX × Ibovespa × Selic,
   * IFIX × Ibovespa × Dólar ou População × PMS × Construção Civil) e plota na hora.
   */
  const selecionarTrio = (trio: ChaveSerieHistorica[]) => {
    setSelecionadas([...trio])
    setAberto(true)
    // carregar usa o estado "selecionadas", que ainda não refletiu o trio —
    // passamos a lista explícita para não comparar a seleção antiga.
    void (async () => {
      setCarregando(true)
      const res = await compararIndices(trio, granularidade, anoInicio, anoFim)
      setLinhas(res)
      setAlgumFallback(res.some((l) => l.baseInterna))
      setCarregando(false)
    })()
  }

  const agoraFormatado = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(new Date())

  const periodoRotulo = `${granularidade === 'mensal' ? 'Mensal' : granularidade === 'trimestral' ? 'Trimestral' : 'Anual'} · ${anoInicio} a ${anoFim}`

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => {
          setAberto(true)
          void carregar()
        }}
        className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 bg-white hover:border-panorama-gold hover:bg-slate-50 transition-colors cursor-pointer group text-left"
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="p-2 rounded-xl bg-panorama-gold/10 shrink-0">
            <Table2 className="w-4 h-4 text-panorama-gold" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-black text-slate-900">
              Comparação de índices (mínimo 2)
            </span>
            <span className="block text-[11px] text-slate-500 mt-0.5">
              Evolução e variações mensal, anual e por período — comparáveis lado a lado e
              imprimíveis em A4.
            </span>
          </span>
        </span>
        <SeloNivelConfianca tier="oficial_institucional" compacto />
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 min-w-0">
          <Table2 className="w-4 h-4 text-panorama-gold shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-black text-slate-900">Comparação de índices</h3>
            <p className="text-[11px] text-slate-500">
              Selecione ao menos 2 índices, o recorte e o período.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAberto(false)}
          className="text-slate-600 border-slate-300 hover:bg-slate-100 shrink-0"
        >
          <X className="w-3.5 h-3.5" /> Fechar
        </Button>
      </div>

      {/* Seleção de índices */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
          Índices ({selecionadas.length} selecionados — mínimo {MINIMO_COMPARACAO})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CHAVES_COMPARACAO.map((c) => {
            const ativo = selecionadas.includes(c)
            return (
              <button
                key={c}
                type="button"
                onClick={() => alternar(c)}
                className={
                  'px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ' +
                  (ativo
                    ? 'bg-panorama-gold text-slate-950'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
                }
              >
                {c === 'usd' ? 'Dólar (PTAX)' : c === 'eur' ? 'Euro (PTAX)' : c.toUpperCase()}
              </button>
            )
          })}
        </div>

        {/* Atalho do trio pedido — IFIX × Ibovespa × Selic, IFIX × Ibovespa × Dólar e IBGE (fontes oficiais) */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => selecionarTrio(SELECAO_TRIO_IFIX_IBOVESPA_SELIC)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            IFIX × Ibovespa × Selic
          </button>
          <button
            type="button"
            onClick={() => selecionarTrio(SELECAO_TRIO_IFIX_IBOVESPA_DOLAR)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            IFIX × Ibovespa × Dólar
          </button>
          <button
            type="button"
            onClick={() => selecionarTrio(SELECAO_TRIO_IBGE)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            População × PMS × Construção Civil
          </button>
          <span className="text-[10.5px] text-slate-400">
            Atalho: seleciona exatamente os 3 índices do atalho escolhido (IFIX — B3; Ibovespa — B3,
            BCB e IPEA; Selic — BCB SGS 432; Dólar — BCB SGS 10813; População — IBGE SIDRA t6579;
            PMS — IBGE SIDRA t5906; Construção Civil — IBGE SIDRA t8886) e plota a comparação com as
            fontes reais.
          </span>
        </div>

        {/* Recorte e período */}
        <div className="flex flex-wrap items-end gap-3 pt-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide space-y-1">
            Granularidade
            <select
              value={granularidade}
              onChange={(e) => setGranularidade(e.target.value as GranularidadeComparacao)}
              className="block px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-normal normal-case tracking-normal text-slate-800 bg-white"
            >
              {(Object.keys(ROTULO_GRAN) as GranularidadeComparacao[]).map((g) => (
                <option key={g} value={g}>
                  {ROTULO_GRAN[g]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide space-y-1">
            De (ano)
            <select
              value={anoInicio}
              onChange={(e) => setAnoInicio(Number(e.target.value))}
              className="block px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-normal normal-case tracking-normal text-slate-800 bg-white"
            >
              {anos.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide space-y-1">
            Até (ano)
            <select
              value={anoFim}
              onChange={(e) => setAnoFim(Number(e.target.value))}
              className="block px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-normal normal-case tracking-normal text-slate-800 bg-white"
            >
              {anos.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <Button
            size="sm"
            onClick={() => void carregar()}
            disabled={carregando || selecionadas.length < MINIMO_COMPARACAO}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            {carregando ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Table2 className="w-3.5 h-3.5" />
            )}
            Comparar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void carregar().then(() => setImprimindo(true))
            }}
            disabled={carregando || selecionadas.length < MINIMO_COMPARACAO}
            className="text-slate-600 border-slate-300 hover:bg-slate-100 gap-2"
          >
            <Printer className="w-3.5 h-3.5" /> Imprimir A4
          </Button>
        </div>
        {selecionadas.length < MINIMO_COMPARACAO && (
          <p className="text-[11px] text-amber-700 flex items-center gap-1">
            <Info className="w-3 h-3" /> Selecione no mínimo {MINIMO_COMPARACAO} índices para
            comparar.
          </p>
        )}
      </div>

      {/* Tabela */}
      {linhas.length > 0 && (
        <div className="p-4 rounded-2xl border border-slate-200 bg-white overflow-x-auto">
          {algumFallback && (
            <p className="mb-3 text-[11px] text-amber-700 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Uma ou mais séries estão indisponíveis na fonte oficial neste momento — os valores
              dessas linhas vêm da base interna aproximada do sistema.
            </p>
          )}
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300 text-left">
                <th className="py-2 pr-3 font-black text-slate-700">Índice</th>
                <th className="py-2 pr-3 font-black text-slate-700">Unidade</th>
                <th className="py-2 pr-3 font-black text-slate-700 text-right">Valor inicial</th>
                <th className="py-2 pr-3 font-black text-slate-700 text-right">Valor final</th>
                <th className="py-2 pr-3 font-black text-slate-700 text-right">
                  Evolução no período
                </th>
                <th className="py-2 pr-3 font-black text-slate-700 text-right">
                  Variação {ROTULO_GRAN[granularidade].toLowerCase()} anterior
                </th>
                <th className="py-2 font-black text-slate-700 text-right">Variação 12 meses</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.chave} className="border-b border-slate-100">
                  <td className="py-2 pr-3">
                    <span className="font-black text-slate-900">{l.nome}</span>
                    <span className="block text-[9.5px] text-slate-400">{l.fonte}</span>
                  </td>
                  <td className="py-2 pr-3 text-slate-500">{l.unidade || '—'}</td>
                  <td className="py-2 pr-3 text-right text-slate-800">
                    {formatarValor(l.valorInicial)}
                  </td>
                  <td className="py-2 pr-3 text-right text-slate-800">
                    {formatarValor(l.valorFinal)}
                  </td>
                  <td
                    className={
                      'py-2 pr-3 text-right font-bold ' +
                      ((l.evolucaoPeriodo ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700')
                    }
                  >
                    {formatarPct(l.evolucaoPeriodo)}
                  </td>
                  <td
                    className={
                      'py-2 pr-3 text-right ' +
                      ((l.variacaoPeriodoAnterior ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700')
                    }
                  >
                    {formatarPct(l.variacaoPeriodoAnterior)}
                  </td>
                  <td
                    className={
                      'py-2 text-right ' +
                      ((l.variacaoAnual ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700')
                    }
                  >
                    {formatarPct(l.variacaoAnual)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-[10.5px] text-slate-400">
            "—" indica valor ausente na fonte oficial no recorte escolhido. Séries de variação %
            (IPCA, IGP-M, Selic…) acumulam de forma composta; séries de nível usam média do período.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <SeloNivelConfianca tier="oficial_institucional" compacto />
            <span className="text-[10.5px] text-slate-400">{periodoRotulo}</span>
          </div>
        </div>
      )}

      {/* Visualização de impressão A4 */}
      {imprimindo && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto">
          <div className="max-w-4xl mx-auto bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:rounded-none">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-100 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Printer className="h-4 w-4 text-emerald-600" />
                <span>Visualização para Impressão / Exportação A4 Oficial</span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImprimindo(false)}
                  className="text-slate-600 border-slate-300 hover:bg-slate-200"
                >
                  Fechar Visualização
                </Button>
                <Button
                  size="sm"
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  <Printer className="h-4 w-4" /> Imprimir Documento
                </Button>
              </div>
            </div>
            <div className="p-8 sm:p-12 print:p-8 space-y-6 min-h-[1100px] flex flex-col justify-between">
              <div>
                <div className="border-b-2 border-emerald-800 pb-6 flex items-start justify-between gap-6">
                  <div className="space-y-1">
                    <div className="mb-2">
                      <AdecontLogo variant="color" className="h-10 w-auto" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                      Comparação Evolutiva de Índices Econômicos
                    </h1>
                    <p className="text-xs text-slate-600">
                      Portal de Indicadores Econômicos e Financeiros — evolução e variações mensal,
                      anual e por período solicitado
                    </p>
                  </div>
                  <div className="text-right space-y-1 text-xs text-slate-500">
                    <div className="font-semibold text-slate-700">
                      Relatório nº ADECONT-CMP-{new Date().getFullYear()}
                    </div>
                    <div>Emissão: {agoraFormatado}</div>
                    <div className="inline-flex items-center gap-1 font-medium text-emerald-700">
                      <ShieldCheck className="h-3.5 w-3.5" /> Fontes Oficiais Compiladas
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500 pb-2 border-b border-slate-200">
                  <span className="font-medium text-slate-700">Parâmetros:</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                    Granularidade: {ROTULO_GRAN[granularidade]}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                    Período: {anoInicio} a {anoFim}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                    {linhas.length} índice(s)
                  </span>
                </div>

                {algumFallback && (
                  <p className="mt-3 text-[11px] text-amber-700">
                    Aviso: séries marcadas com "—" não tiveram valor disponível na fonte oficial
                    para o recorte; índices indicados como base interna usam valores aproximados do
                    sistema.
                  </p>
                )}

                <table className="mt-6 w-full text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-400 text-left">
                      <th className="py-2 pr-3 font-black text-slate-800">Índice</th>
                      <th className="py-2 pr-3 font-black text-slate-800">Fonte</th>
                      <th className="py-2 pr-3 font-black text-slate-800 text-right">Inicial</th>
                      <th className="py-2 pr-3 font-black text-slate-800 text-right">Final</th>
                      <th className="py-2 pr-3 font-black text-slate-800 text-right">
                        Evolução período
                      </th>
                      <th className="py-2 pr-3 font-black text-slate-800 text-right">
                        Var. {ROTULO_GRAN[granularidade].toLowerCase()} anterior
                      </th>
                      <th className="py-2 font-black text-slate-800 text-right">Var. 12 meses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.map((l) => (
                      <tr key={l.chave} className="border-b border-slate-200 break-inside-avoid">
                        <td className="py-2 pr-3 font-bold text-slate-900">{l.nome}</td>
                        <td className="py-2 pr-3">
                          <span
                            className={
                              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ' +
                              (l.fonteViva
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-300')
                            }
                          >
                            {l.fonteViva ? (
                              <ShieldCheck className="h-3 w-3" />
                            ) : (
                              <Info className="h-3 w-3" />
                            )}
                            {seloFonteLinha(l)}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-right">{formatarValor(l.valorInicial)}</td>
                        <td className="py-2 pr-3 text-right">{formatarValor(l.valorFinal)}</td>
                        <td className="py-2 pr-3 text-right font-bold">
                          {formatarPct(l.evolucaoPeriodo)}
                        </td>
                        <td className="py-2 pr-3 text-right">
                          {formatarPct(l.variacaoPeriodoAnterior)}
                        </td>
                        <td className="py-2 text-right">{formatarPct(l.variacaoAnual)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-300 pt-6 mt-12 text-center text-xs text-slate-500 space-y-1.5">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-800 inline-block">
                  Gerado por:{' '}
                  <span className="font-bold text-slate-900">
                    {usuarioAtivo ? usuarioAtivo.nome : 'Administrador ADECONT'}
                  </span>{' '}
                  — {agoraFormatado}
                </div>
                <div className="font-semibold text-slate-700">
                  ADECONT — Assessoria Contábil e Administrativa
                </div>
                <div>
                  Plataforma Panorama da Reforma Tributária — Sistema de Gestão e Monitoramento
                  Normativo
                </div>
                <div className="text-[10px] text-slate-400">
                  Documento emitido para controle técnico interno e conformidade legal
                  institucional.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
