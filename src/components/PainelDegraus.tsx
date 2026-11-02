import { useState } from 'react'
import {
  Scale,
  Factory,
  Calculator,
  Paperclip,
  Radio,
  Settings2,
  ChevronRight,
  ChevronDown,
  Search,
  ArrowRight,
  Layers,
  Fuel,
  HeartPulse,
  GraduationCap,
  UtensilsCrossed,
  UsersRound,
  Trophy,
  Ship,
  Globe,
  Building2,
  Tractor,
  Handshake,
  Landmark,
  Store,
  Users,
  Gauge,
  ShieldCheck,
  Wrench,
  BookOpen,
  History,
  ListChecks,
  Database,
  Eye,
  KeyRound,
  MonitorSmartphone,
  Printer,
  CalendarDays,
  BrainCircuit,
  Sparkles,
  PackageCheck,
} from 'lucide-react'
import { NAVEGACAO, DOMINIOS_HIERARQUIA, TOTAL_ITENS } from '@/components/navegacao'

/**
 * PAINEL DE DEGRAUS — o menu geral do sistema
 * =============================================
 *
 * Pedido do CEO (02/11/2026): "Vamos ter que remontar o sistema em degraus.
 * Partindo de um menu geral, e acoplando todos os demais menus, com indicativos
 * de fácil uso."
 *
 * ── A IDEIA ──
 * O menu lateral é bom para quem já sabe onde vai. Este painel é para quem
 * chega: mostra o sistema inteiro em DEGRAUS, do geral ao específico, sem
 * obrigar a abrir menu nenhum. É a planta da casa, não o corredor.
 *
 *   Degrau 1 — os 6 domínios (o mapa do sistema)
 *   Degrau 2 — os setores de cada domínio
 *   Degrau 3 — as seções de cada setor
 *
 * ── O INDICATIVO DE FÁCIL USO ──
 * Cada degrau mostra QUANTOS itens tem e QUAL o primeiro passo. Nada de ícone
 * solto sem texto: ícone + nome + contagem. Quem nunca viu o sistema entende
 * em uma olhada que existe "Núcleo Tributário" com 7 seções e por onde começar.
 *
 * ── POR QUE NÃO SUBSTITUI O MENU LATERAL ──
 * O lateral é atalho de quem usa todo dia; este é orientação de quem precisa
 * se localizar. Os dois leem a MESMA fonte (navegacao.ts), então nunca
 * divergem.
 */

const ICONES: Record<string, React.ComponentType<{ className?: string }>> = {
  Scale,
  Factory,
  Calculator,
  Paperclip,
  Radio,
  Settings2,
  Layers,
  Fuel,
  HeartPulse,
  GraduationCap,
  UtensilsCrossed,
  UsersRound,
  Trophy,
  Ship,
  Globe,
  Building2,
  Tractor,
  Handshake,
  Landmark,
  Store,
  Users,
  Gauge,
  ShieldCheck,
  Wrench,
  BookOpen,
  History,
  ListChecks,
  Database,
  Eye,
  KeyRound,
  MonitorSmartphone,
  Printer,
  CalendarDays,
  BrainCircuit,
  Sparkles,
  PackageCheck,
}

/** resumo curto de cada domínio — o "para que serve" em uma linha */
const PROPOSITO: Record<string, string> = {
  nucleo: 'A lei, o fato gerador e o que fica de fora',
  setores: 'Cada setor tem regra própria — ache a sua',
  simulacao: 'Calcular o impacto antes de decidir',
  tabelas: 'Onde o item está classificado e o quanto paga',
  fontes: 'De onde vem o dado e o que mudou',
  sistema: 'Gestão, entrega, segurança e manutenção',
}

export function PainelDegraus() {
  const [aberto, setAberto] = useState<string | null>('setores')
  const [busca, setBusca] = useState('')

  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

  const filtro = busca.trim()
  const casa = (txt: string) => norm(txt).includes(norm(filtro))

  // monta o degrau 2 e 3 a partir da fonte única
  const dominios = DOMINIOS_HIERARQUIA.map((d) => {
    const setores = d.setores
      .map((s) => ({
        ...s,
        itens: NAVEGACAO.filter((n) => n.dominio === d.id && n.setor === s.id),
      }))
      .filter((s) => s.itens.length > 0)
    return { ...d, setores, total: setores.reduce((n, s) => n + s.itens.length, 0) }
  }).filter((d) => d.total > 0)

  const visiveis = filtro
    ? dominios
        .map((d) => ({
          ...d,
          setores: d.setores
            .map((s) => ({
              ...s,
              itens: s.itens.filter((i) => casa(`${i.label} ${(i.tags || []).join(' ')}`)),
            }))
            .filter((s) => s.itens.length > 0 || casa(s.nome)),
        }))
        .filter((d) => d.setores.length > 0 || casa(d.nome))
    : dominios

  return (
    <section className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
      <header className="mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-panorama-navy text-[11px] font-bold text-panorama-gold ring-1 ring-panorama-gold/50">
            ⌂
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Mapa do sistema
          </h1>
        </div>
        <p className="mt-1 text-[12.5px] leading-relaxed text-slate-600">
          {TOTAL_ITENS} seções em {dominios.length} domínios. Abra o degrau que interessa — cada um
          mostra suas seções e o atalho de teclado.
        </p>
      </header>

      {/* busca — o caminho mais rápido para quem sabe o que procura */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar seção, setor ou sinônimo (ex.: combustível, imóvel, radar)…"
          className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-[13px] focus:border-panorama-gold focus:outline-none"
        />
      </div>

      {/* DEGRAU 1 — os domínios */}
      <div className="space-y-2">
        {visiveis.map((d) => {
          const Icone = ICONES[(d.Icon as unknown as { name?: string })?.name || ''] || d.Icon
          const estaAberto = aberto === d.id || (filtro !== '' && visiveis.length <= 2)
          return (
            <div
              key={d.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
            >
              {/* linha do degrau 1 — clicável inteira */}
              <button
                onClick={() => setAberto(estaAberto && !filtro ? null : d.id)}
                className="flex min-h-[56px] w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${d.bg} ${d.cor}`}
                >
                  {Icone ? <Icone className="h-4.5 w-4.5" /> : <Layers className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-1.5">
                    <span className="font-mono text-[10px] font-bold text-slate-400">
                      {d.numero}
                    </span>
                    <span className="truncate text-[14px] font-bold text-slate-900">{d.nome}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                    {PROPOSITO[d.id] || d.proposito}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600">
                  {d.total}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${estaAberto ? '' : '-rotate-90'}`}
                />
              </button>

              {/* DEGRAU 2 — setores */}
              {estaAberto && (
                <div className="border-t border-slate-100 bg-slate-50/60 px-2 py-2">
                  {d.setores.map((s) => {
                    const SIcon = s.Icon
                    return (
                      <div key={s.id} className="mb-1.5 last:mb-0">
                        <div className="flex items-center gap-1.5 px-1.5 py-1">
                          {SIcon && <SIcon className="h-3 w-3 shrink-0 text-slate-500" />}
                          <span className="text-[11px] font-bold text-slate-700">{s.nome}</span>
                          <span className="rounded bg-white px-1 font-mono text-[9px] text-slate-400 ring-1 ring-slate-200">
                            {s.itens.length}
                          </span>
                          <span className="ml-auto hidden truncate text-[9.5px] text-slate-400 sm:block">
                            {s.base}
                          </span>
                        </div>

                        {/* DEGRAU 3 — seções */}
                        <div className="mt-0.5 grid gap-1 sm:grid-cols-2">
                          {s.itens.map((i) => {
                            const IIcon = i.Icon
                            return (
                              <a
                                key={i.href}
                                href={i.href}
                                className="group flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 transition-colors hover:border-panorama-gold hover:bg-panorama-gold/5"
                              >
                                {IIcon && <IIcon className={`h-3.5 w-3.5 shrink-0 ${i.cor}`} />}
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-[11.5px] font-semibold text-slate-800">
                                    {i.label}
                                  </span>
                                  {i.numero && (
                                    <span className="font-mono text-[9px] text-slate-400">
                                      seção {i.numero}
                                    </span>
                                  )}
                                </span>
                                <kbd className="shrink-0 rounded border border-slate-300 bg-slate-50 px-1 font-mono text-[9px] text-slate-500">
                                  {i.tecla.toUpperCase()}
                                </kbd>
                                <ArrowRight className="h-3 w-3 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-panorama-gold" />
                              </a>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!visiveis.length && (
        <p className="rounded-lg border border-slate-200 bg-white p-4 text-center text-[12px] text-slate-500">
          Nada encontrado para “{busca}”. Tente o sinônimo: imóvel, combustível, remédio, escola,
          radar.
        </p>
      )}

      <p className="mt-4 rounded-lg bg-slate-100 p-2.5 text-[10.5px] leading-relaxed text-slate-500">
        <b>Como usar:</b> o degrau 1 mostra os domínios; ao abrir, aparecem os setores e, dentro
        deles, as seções. A tecla ao lado de cada seção é o atalho direto — funciona em qualquer
        tela. O menu lateral continua sendo o caminho de quem já sabe onde vai.
      </p>
    </section>
  )
}
