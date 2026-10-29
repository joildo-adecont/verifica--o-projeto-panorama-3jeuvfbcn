import { useMemo, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  Calculator,
  ChevronRight,
  Eye,
  FileCheck2,
  Layers,
  Mail,
  Radio,
  RefreshCw,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import {
  GRUPOS,
  HOME,
  TOTAL_GRUPOS,
  TOTAL_ITENS,
  type GrupoNavegacao,
  type LinkNavegacao,
} from '@/components/navegacao'
import { ALERTAS, FONTES_VIGIADAS, HOUVE_MUDANCA, TOTAL_ATIVAS } from '@/data/agenteFontes'
import { LINHAS_POR_DISPOSITIVO, TOTAL_ALTA, TOTAL_LINHAS } from '@/data/vinculosLegislacao'
import { CRONOLOGIA, INCORPORADAS, TOTAL as TOTAL_NORMAS } from '@/data/legislacaoCronologica'
import { CBS_REF, IBS_REF, REF_TOTAL, ACIMA_DO_TETO, pct } from '@/data/aliquotas'

/**
 * PAINEL INICIAL — a primeira tela do Panorama
 *
 * Por que existe: antes, o sistema abria direto no hero e o visitante caía numa
 * rolagem de 24 seções, sem saber onde está o quê. Este painel responde três
 * perguntas antes de qualquer rolagem:
 *
 *   1. "Onde eu vou?"        — cinco grupos com ícones grandes e a frase do que
 *                              há dentro de cada um.
 *   2. "O que está acontecendo?" — acompanhamento medido: normas, linhas de
 *                              tabela, fontes vigiadas, alíquotas em vigor.
 *   3. "A informação está atualizada?" — quando foi a última conferência e se
 *                              alguma fonte mudou.
 *
 * Todos os números vêm das mesmas fontes que o resto do sistema usa. Nenhum é
 * digitado aqui — se um dado não existe, o card mostra zero em vez de inventar.
 */

const COR_GRUPO: Record<string, { card: string; icone: string; seta: string; barra: string }> = {
  indicadores: {
    card: 'hover:border-amber-400 hover:bg-amber-50/40',
    icone: 'bg-amber-100 text-amber-700 border-amber-300',
    seta: 'text-amber-600',
    barra: 'bg-amber-500',
  },
  fundamentos: {
    card: 'hover:border-indigo-400 hover:bg-indigo-50/40',
    icone: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    seta: 'text-indigo-500',
    barra: 'bg-indigo-500',
  },
  simulacao: {
    card: 'hover:border-emerald-400 hover:bg-emerald-50/40',
    icone: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    seta: 'text-emerald-500',
    barra: 'bg-emerald-500',
  },
  tabelas: {
    card: 'hover:border-rose-400 hover:bg-rose-50/40',
    icone: 'bg-rose-100 text-rose-700 border-rose-200',
    seta: 'text-rose-500',
    barra: 'bg-rose-500',
  },
  fontes: {
    card: 'hover:border-fuchsia-400 hover:bg-fuchsia-50/40',
    icone: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
    seta: 'text-fuchsia-500',
    barra: 'bg-fuchsia-500',
  },
  sistema: {
    card: 'hover:border-slate-400 hover:bg-slate-50',
    icone: 'bg-slate-200 text-slate-700 border-slate-300',
    seta: 'text-slate-500',
    barra: 'bg-slate-500',
  },
}

function norm(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/** Card grande de um item dentro da aba ativa — ícone grande, tecla e descrição. */
function CardItem({ item, corBarra }: { item: LinkNavegacao; corBarra: string }) {
  return (
    <a
      href={item.href}
      className="group relative overflow-hidden rounded-xl border-2 border-slate-200 bg-white p-3.5 hover:border-slate-400 hover:shadow-md transition-all"
    >
      <span className={`absolute left-0 top-0 bottom-0 w-1 ${corBarra}`} />
      <div className="flex items-start gap-2.5 pl-1.5">
        <span
          className={`flex items-center justify-center w-11 h-11 rounded-xl border-2 shrink-0 ${item.bg} ${item.borda}`}
        >
          <item.Icon className={`w-5 h-5 ${item.cor}`} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 font-mono">{item.numero}</span>
            <span className="text-sm font-bold text-slate-900 leading-tight">{item.curto}</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug mt-1">{item.descricao}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2.5 pl-1.5">
        <kbd className="text-[9px] font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">
          tecla {item.tecla.toUpperCase()}
        </kbd>
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-400 group-hover:text-slate-800">
          abrir
          <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </a>
  )
}

/** Indicador compacto do topo do painel. */
function Kpi({
  Icon,
  rotulo,
  valor,
  detalhe,
  cor,
}: {
  Icon: React.ComponentType<{ className?: string }>
  rotulo: string
  valor: string
  detalhe: string
  cor: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className={`flex items-center gap-1.5 ${cor}`}>
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-wide">{rotulo}</span>
      </div>
      <p className="text-xl font-bold text-slate-900 mt-1 leading-none tabular-nums">{valor}</p>
      <p className="text-[10px] text-slate-500 mt-1 leading-tight">{detalhe}</p>
    </div>
  )
}

export function PainelInicial() {
  const [filtro, setFiltro] = useState('')
  const [abaAtiva, setAbaAtiva] = useState<string | null>(null)

  // ── dados medidos, das mesmas fontes que o resto do sistema ──
  const normasVigiadas = TOTAL_NORMAS
  const normasNoPanorama = INCORPORADAS
  const linhasTabela = TOTAL_LINHAS
  const linhasAlta = TOTAL_ALTA
  const fontesAtivas = TOTAL_ATIVAS
  const fontesTotal = FONTES_VIGIADAS.length
  const alertasAltos = ALERTAS.filter((a) => a.gravidade === 'alta').length

  // distribuição das linhas por diploma — o gráfico de acompanhamento
  const porNorma = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const d of LINHAS_POR_DISPOSITIVO) {
      acc[d.norma] = (acc[d.norma] || 0) + d.linhas
    }
    return Object.entries(acc).sort((a, b) => b[1] - a[1])
  }, [])
  const maiorNorma = porNorma[0]?.[1] ?? 1

  // linha do tempo por ano — segundo gráfico
  const porAno = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const n of CRONOLOGIA) {
      const a = n.data.slice(0, 4)
      acc[a] = (acc[a] || 0) + 1
    }
    return Object.entries(acc).sort((a, b) => a[0].localeCompare(b[0]))
  }, [])
  const maiorAno = Math.max(...porAno.map(([, v]) => v), 1)

  /**
   * A BUSCA NÃO MEXE NAS ABAS.
   *
   * Antes, filtrar removia grupos da lista de abas. Consequência: a aba ativa
   * (calculada como "a primeira visível") mudava sozinha a cada tecla e a altura
   * do painel variava — a tela pulava no momento da busca. Era exatamente o que
   * incomodava.
   *
   * Agora as cinco abas ficam sempre no lugar. A busca age DENTRO da aba aberta,
   * filtrando os cards; cada aba mostra quantos resultados tem, e uma aba sem
   * resultado avisa ali mesmo, sem trocar a aba debaixo do usuário.
   */
  const termo = norm(filtro.trim())

  const itensDoGrupo = (g: (typeof GRUPOS)[number]) => {
    if (!termo) return g.itens
    return g.itens.filter((i) =>
      norm(`${i.label} ${i.curto} ${i.descricao} ${i.numero}`).includes(termo),
    )
  }

  const contagemPorGrupo = GRUPOS.reduce<Record<string, number>>((acc, g) => {
    acc[g.id] = itensDoGrupo(g).length
    return acc
  }, {})

  const totalEncontrado = Object.values(contagemPorGrupo).reduce((s, n) => s + n, 0)

  // a aba escolhida; se o usuário nunca escolheu, a primeira
  const abaCorrente = abaAtiva ?? GRUPOS[0].id
  const grupoCorrente = GRUPOS.find((g) => g.id === abaCorrente) ?? GRUPOS[0]
  const itensCorrentes = itensDoGrupo(grupoCorrente)

  return (
    <section id="inicio" className="scroll-mt-24">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 md:p-7 shadow-sm">
        {/* ── Cabeçalho + busca ── */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3">
            <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-panorama-navy text-panorama-gold-light ring-1 ring-panorama-gold/50 shrink-0">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                Painel de acompanhamento
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
                Onde você quer ir, o que está acontecendo na legislação e se a informação está
                atualizada. {TOTAL_ITENS} seções organizadas em {TOTAL_GRUPOS} grupos temáticos.
              </p>
            </div>
          </div>
          <a
            href="#secao-1"
            className="inline-flex items-center gap-1.5 rounded-lg bg-panorama-navy text-panorama-gold-light px-3 py-2 text-xs font-bold hover:bg-panorama-navy/90 shrink-0"
          >
            <Scale className="w-3.5 h-3.5" />
            Começar pelas normas
          </a>
        </div>

        {/* ── Busca dentro do painel ── */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={filtro}
            onChange={(e) => {
              // guarda a posição: digitar não pode fazer a tela correr
              const y = window.scrollY
              setFiltro(e.target.value)
              window.requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'instant' }))
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                const y = window.scrollY
                setFiltro('')
                window.requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'instant' }))
              }
            }}
            placeholder="Buscar seção, assunto ou simulação (ex.: combustível, imóvel, Simples)…"
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-panorama-gold/50"
          />
          {filtro && (
            <button
              onClick={() => setFiltro('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              aria-label="Limpar"
            >
              ✕
            </button>
          )}
        </div>

        {/* ── KPIs de acompanhamento ── */}
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <Kpi
            Icon={Scale}
            rotulo="Normas"
            valor={String(normasVigiadas)}
            detalhe={`${normasNoPanorama} incorporadas ao Panorama`}
            cor="text-indigo-700"
          />
          <Kpi
            Icon={Layers}
            rotulo="Linhas de tabela"
            valor={linhasTabela.toLocaleString('pt-BR')}
            detalhe={`${linhasAlta.toLocaleString('pt-BR')} com vínculo confirmado`}
            cor="text-rose-700"
          />
          <Kpi
            Icon={Radio}
            rotulo="Fontes vigiadas"
            valor={`${fontesAtivas}/${fontesTotal}`}
            detalhe={HOUVE_MUDANCA ? `${alertasAltos} alerta(s) ativo(s)` : 'todas estáveis'}
            cor={HOUVE_MUDANCA ? 'text-rose-700' : 'text-emerald-700'}
          />
          <Kpi
            Icon={Calculator}
            rotulo="Referência"
            valor={pct(REF_TOTAL)}
            detalhe={`CBS ${pct(CBS_REF)} + IBS ${pct(IBS_REF)}`}
            cor="text-amber-700"
          />
        </div>

        {/* ── Alerta de teto, quando aplicável ── */}
        {ACIMA_DO_TETO && (
          <p className="mt-2.5 text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 leading-snug">
            <b>Atenção:</b> a soma das referências ({pct(REF_TOTAL)}) supera o teto de 26,5% do art.
            349 da LC 214/2025. É referência de regime pleno, não alíquota de 2027.
          </p>
        )}

        {/* ── Gráficos de acompanhamento ── */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Distribuição das linhas de tabela por diploma */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <BarChart3 className="w-3.5 h-3.5 text-rose-600" />
              <p className="text-[11px] font-bold text-slate-900">Linhas de tabela por diploma</p>
            </div>
            <div className="space-y-1.5">
              {porNorma.map(([nome, qtd]) => (
                <div key={nome}>
                  <div className="flex items-center justify-between text-[10px] mb-0.5">
                    <span className="text-slate-600 truncate pr-2">{nome}</span>
                    <span className="font-bold text-slate-900 tabular-nums shrink-0">{qtd}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-600"
                      style={{ width: `${Math.round((qtd / maiorNorma) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <a
              href="#tabela-geral"
              className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 hover:underline mt-2"
            >
              Ver a Tabela Geral
              <ArrowRight className="w-2.5 h-2.5" />
            </a>
          </div>

          {/* Normas por ano */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              <p className="text-[11px] font-bold text-slate-900">Normas acompanhadas por ano</p>
            </div>
            <div className="flex items-end gap-2 h-24">
              {porAno.map(([ano, qtd]) => (
                <div
                  key={ano}
                  className="flex-1 flex flex-col items-center justify-end h-full gap-1"
                >
                  <span className="text-[10px] font-bold text-slate-900 tabular-nums">{qtd}</span>
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-indigo-600 to-indigo-400 min-h-[4px]"
                    style={{ height: `${Math.round((qtd / maiorAno) * 100)}%` }}
                  />
                  <span className="text-[9px] text-slate-500 font-mono">{ano}</span>
                </div>
              ))}
            </div>
            <a
              href="#monitor-legislativo"
              className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 hover:underline mt-2"
            >
              Ver o Monitor Legislativo
              <ArrowRight className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>

        {/* ── ABAS: cinco grupos fixos, ícones grandes ── */}
        <div className="mt-5">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-xs font-bold text-slate-900">Por onde navegar</span>
            <div className="flex-1 h-px bg-slate-200" />
            {filtro && (
              <span className="text-[10px] text-slate-600 font-bold tabular-nums">
                {totalEncontrado === 0
                  ? 'nenhum resultado'
                  : `${totalEncontrado} resultado${totalEncontrado === 1 ? '' : 's'}`}
              </span>
            )}
          </div>

          {/* Barra de abas — SEMPRE as cinco, sem filtrar */}
          <div role="tablist" className="flex gap-1.5 overflow-x-auto pb-1.5 -mx-1 px-1">
            {GRUPOS.map((g) => {
              const cores = COR_GRUPO[g.id] ?? COR_GRUPO.sistema
              const ativa = abaCorrente === g.id
              const n = contagemPorGrupo[g.id] ?? 0
              const vazia = termo !== '' && n === 0
              return (
                <button
                  key={g.id}
                  role="tab"
                  aria-selected={ativa}
                  onClick={() => setAbaAtiva(g.id)}
                  className={`flex items-center gap-2 rounded-t-xl border-2 border-b-0 px-3.5 py-2.5 shrink-0 transition-colors cursor-pointer ${
                    ativa
                      ? `bg-white border-slate-300 ${cores.seta}`
                      : vazia
                        ? 'bg-slate-50/70 border-transparent text-slate-400 opacity-60 hover:opacity-100'
                        : 'bg-slate-100/70 border-transparent text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-9 h-9 rounded-lg border-2 shrink-0 ${cores.icone}`}
                  >
                    <g.Icon style={{ width: 18, height: 18 }} />
                  </span>
                  <span className="text-left">
                    <span className="block text-[13px] font-bold leading-tight whitespace-nowrap">
                      {g.nome}
                    </span>
                    <span className="block text-[10px] leading-tight whitespace-nowrap opacity-70">
                      {termo ? `${n} de ${g.itens.length}` : `${g.itens.length} seções`}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          {/* Conteúdo: só a aba aberta, com altura mínima para a tela não pular */}
          <div
            role="tabpanel"
            className="rounded-b-2xl rounded-tr-2xl border-2 border-slate-300 bg-white p-3.5 min-h-[168px]"
          >
            <div className="flex items-center gap-2 mb-3">
              <grupoCorrente.Icon className={`w-4 h-4 ${grupoCorrente.cor}`} />
              <p className="text-[11px] text-slate-600">
                <b className="text-slate-900">{grupoCorrente.nome}</b> — {grupoCorrente.proposito}
              </p>
            </div>

            {itensCorrentes.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-[12px] font-bold text-slate-700">
                  Nenhuma seção de {grupoCorrente.nome} corresponde a “{filtro}”
                </p>
                <p className="text-[10.5px] text-slate-500 mt-1 leading-snug">
                  As outras abas mostram acima quantos resultados têm. Escolha uma delas, ou{' '}
                  <button
                    onClick={() => setFiltro('')}
                    className="font-bold text-slate-700 underline cursor-pointer"
                  >
                    limpar a busca
                  </button>
                  .
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {itensCorrentes.map((item) => (
                  <CardItem
                    key={item.href + item.tecla}
                    item={item}
                    corBarra={(COR_GRUPO[grupoCorrente.id] ?? COR_GRUPO.sistema).barra}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Ações rápidas ── */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            {
              href: '#simulador',
              label: 'Simulador',
              Icon: Calculator,
              cor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
            },
            {
              href: '#monitor-legislativo',
              label: 'Monitor',
              Icon: Eye,
              cor: 'text-fuchsia-700 bg-fuchsia-50 border-fuchsia-200',
            },
            {
              href: '#central-entrega',
              label: 'Entregar',
              Icon: Mail,
              cor: 'text-rose-700 bg-rose-50 border-rose-200',
            },
            {
              href: '#historico-atualizacoes',
              label: 'Histórico',
              Icon: RefreshCw,
              cor: 'text-slate-700 bg-slate-100 border-slate-300',
            },
          ].map((a) => (
            <a
              key={a.label}
              href={a.href}
              className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-[11px] font-bold hover:shadow-sm transition-shadow ${a.cor}`}
            >
              <a.Icon className="w-3.5 h-3.5" />
              {a.label}
            </a>
          ))}
        </div>

        {/* ── Rodapé do painel: procedência ── */}
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400 flex-wrap">
          <FileCheck2 className="w-3 h-3" />
          <span>
            Números medidos das mesmas fontes do sistema · alíquotas em{' '}
            <a href="#secao-1" className="underline hover:text-slate-700">
              src/data/aliquotas.ts
            </a>{' '}
            · {TOTAL_ITENS} seções em {TOTAL_GRUPOS} grupos
          </span>
        </div>
      </div>
    </section>
  )
}
