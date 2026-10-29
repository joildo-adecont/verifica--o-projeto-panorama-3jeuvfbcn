import { useMemo, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  Calculator,
  CalendarClock,
  Database,
  FileCheck2,
  Gauge,
  Layers,
  Percent,
  Radio,
  Scale,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  ArrowLeftRight,
  BadgeAlert,
  Users,
} from 'lucide-react'
import {
  ACIMA_DO_TETO,
  ALIQUOTAS_ATUALIZADAS_EM,
  CBS_REF,
  HISTORICO_ALIQUOTAS,
  IBS_REF,
  PROCEDENCIA,
  REF_TOTAL,
  TETO_REFERENCIA,
  pct,
  totalDoAno,
  ibsDoAno,
  CBS_POR_ANO,
} from '@/data/aliquotas'
import {
  LINHAS_POR_DISPOSITIVO,
  TOTAL_ALTA,
  TOTAL_BAIXA,
  TOTAL_BLOCOS,
  TOTAL_LINHAS,
  TOTAL_MEDIA,
} from '@/data/vinculosLegislacao'
import {
  ALERTAS,
  CONTAGEM,
  EXECUCAO,
  HOUVE_MUDANCA,
  NORMAS_NO_PANORAMA,
  NORMAS_VIGIADAS,
  TOTAL_FONTES,
} from '@/data/agenteFontes'
import {
  CRONOLOGIA,
  INCORPORADAS,
  PENDENTES,
  TOTAL as TOTAL_NORMAS,
} from '@/data/legislacaoCronologica'
import { ANEXOS, SIM_TOTAL } from '@/data/anexosCatalogo'
import { ComparadorSetores } from '@/components/ComparadorSetores'
import { CustoDoErro } from '@/components/CustoDoErro'
import { BotaoExportarPDF } from '@/components/BotaoExportarPDF'
import { PainelCliente } from '@/components/PainelCliente'

/**
 * CENTRAL DE INDICADORES — Seção 8A
 *
 * ── POR QUE EXISTE ──
 * A pedido do CEO (29/10/2026): "evolução de alíquotas, gráficos, painéis,
 * molduras — tudo que for necessário para uma identificação rápida, centralizado
 * em um ícone separado, dentro de um grande grupo".
 *
 * Os números do sistema estavam espalhados: a referência de alíquota vivia nos
 * simuladores, a contagem de linhas na Tabela Geral, as fontes no Monitor, as
 * normas no Histórico. Quem quer *bater o olho e entender* tinha de visitar
 * cinco seções. Aqui todos aparecem juntos, com moldura e legenda.
 *
 * ── REGRA DE HONESTIDADE ──
 * Nada nesta tela é digitado: todo número vem de src/data. Se um dado faltar,
 * a tela mostra o que existe e diz o que não foi medido — nunca estima.
 *
 * ── ESTRUTURA ──
 * Quatro abas, porque uma única rolagem de gráficos não é "identificação rápida":
 *   Alíquotas — a evolução ano a ano, os redutores e a procedência de cada número
 *   Tabelas  — as 1.053 linhas, a confiança do vínculo e a distribuição por diploma
 *   Fontes   — o estado das 16 fontes vigiadas e as 23 normas acompanhadas
 *   Normas   — a linha do tempo por ano e por tipo de ato
 */

type Aba = 'aliquotas' | 'tabelas' | 'fontes' | 'normas' | 'comparar' | 'erro' | 'clientes'

const ABAS: { id: Aba; nome: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'aliquotas', nome: 'Alíquotas', Icon: Percent },
  { id: 'tabelas', nome: 'Tabelas', Icon: Layers },
  { id: 'fontes', nome: 'Fontes', Icon: Radio },
  { id: 'normas', nome: 'Normas', Icon: Scale },
  { id: 'comparar', nome: 'Comparar setores', Icon: ArrowLeftRight },
  { id: 'erro', nome: 'Custo do erro', Icon: BadgeAlert },
  { id: 'clientes', nome: 'Por cliente', Icon: Users },
]

/* ─────────────────────── séries calculadas ─────────────────────── */

const ANOS = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033]

const SERIE = ANOS.map((ano) => ({
  ano,
  ibs: ibsDoAno(ano),
  cbs: CBS_POR_ANO[ano] ?? 0,
  total: totalDoAno(ano),
}))

/** Fase da transição em cada ano — é o que dá sentido ao gráfico. */
function faseDoAno(ano: number): { rotulo: string; cor: string } {
  if (ano === 2026) return { rotulo: 'Teste', cor: 'text-slate-500' }
  if (ano <= 2028) return { rotulo: 'CBS plena', cor: 'text-amber-700' }
  if (ano === 2033) return { rotulo: 'Plena', cor: 'text-emerald-700' }
  return { rotulo: 'Transição', cor: 'text-indigo-700' }
}

/** Os seis tratamentos possíveis, com a alíquota efetiva sobre a referência. */
const REDUTORES = [
  { rotulo: 'Alíquota zero', fator: 0, base: 'Cesta básica, imunidades' },
  { rotulo: 'Redução de 70%', fator: 0.3, base: 'Locação residencial, 6A' },
  { rotulo: 'Redução de 60%', fator: 0.4, base: 'Saúde, educação, 6B' },
  { rotulo: 'Redução de 50%', fator: 0.5, base: 'Imóvel novo, 6A' },
  { rotulo: 'Redução de 30%', fator: 0.7, base: 'Profissões regulamentadas' },
  { rotulo: 'Regime pleno', fator: 1, base: 'Regra geral' },
]

/* ─────────────────────── componentes de apoio ─────────────────────── */

/** Moldura: card com filete interno, para o número saltar aos olhos. */
function Moldura({
  rotulo,
  valor,
  detalhe,
  tom = 'navy',
  Icon,
}: {
  rotulo: string
  valor: string
  detalhe: string
  tom?: 'navy' | 'verde' | 'ambar' | 'rosa'
  Icon: React.ComponentType<{ className?: string }>
}) {
  const tons = {
    navy: 'from-slate-50 to-white border-slate-300 text-slate-900',
    verde: 'from-emerald-50 to-white border-emerald-300 text-emerald-900',
    ambar: 'from-amber-50 to-white border-amber-300 text-amber-900',
    rosa: 'from-rose-50 to-white border-rose-300 text-rose-900',
  }[tom]

  return (
    <div className={`relative rounded-xl border-2 bg-gradient-to-br p-3 ${tons}`}>
      <div className="absolute inset-1.5 rounded-lg border border-current opacity-[0.07] pointer-events-none" />
      <div className="relative">
        <div className="flex items-center gap-1.5 opacity-80">
          <Icon className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-wide">{rotulo}</span>
        </div>
        <p className="text-2xl font-extrabold mt-1 leading-none tabular-nums">{valor}</p>
        <p className="text-[10px] mt-1.5 leading-tight opacity-70">{detalhe}</p>
      </div>
    </div>
  )
}

/** Título de bloco, com medalha dourada e a capitulação legal. */
function BlocoH({
  n,
  titulo,
  capitulacao,
  Icon,
}: {
  n: string
  titulo: string
  capitulacao: string
  Icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-panorama-navy text-panorama-gold-light ring-1 ring-panorama-gold/50 shrink-0">
        <Icon className="w-3.5 h-3.5" />
      </span>
      <div className="min-w-0">
        <h4 className="text-[13px] font-bold text-slate-900 leading-tight">
          <span className="text-slate-400 font-mono mr-1">{n}</span>
          {titulo}
        </h4>
        <p className="text-[10px] text-slate-500 leading-tight truncate">{capitulacao}</p>
      </div>
    </div>
  )
}

/** Barra horizontal rotulada — usada para distribuições. */
function BarraH({
  rotulo,
  valor,
  max,
  cor,
  sufixo = '',
  nota,
}: {
  rotulo: string
  valor: number
  max: number
  cor: string
  sufixo?: string
  nota?: string
}) {
  const p = max > 0 ? Math.round((valor / max) * 100) : 0
  return (
    <div className="mb-2">
      <div className="flex items-baseline justify-between gap-2 mb-0.5">
        <span className="text-[11px] text-slate-700 truncate">{rotulo}</span>
        <span className="text-[11px] font-bold text-slate-900 tabular-nums shrink-0">
          {valor.toLocaleString('pt-BR')}
          {sufixo}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${cor}`} style={{ width: `${p}%` }} />
      </div>
      {nota && <p className="text-[9px] text-slate-400 mt-0.5 truncate">{nota}</p>}
    </div>
  )
}

/* ─────────────────── aba 1: evolução das alíquotas ─────────────────── */

function GraficoEvolucao() {
  // plot: 760x320, área útil 56..720 x 24..240
  const L = 58
  const R = 724
  const T = 26
  const B = 238
  const MAXV = 32
  const altura = B - T
  const largura = R - L
  const faixa = largura / SERIE.length
  const larguraBarra = Math.min(46, faixa * 0.58)
  const yDe = (v: number) => B - (v / MAXV) * altura

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox="0 0 760 300"
        className="w-full min-w-[620px] h-auto"
        role="img"
        aria-label="Evolução das alíquotas do IBS e da CBS de 2026 a 2033"
      >
        {/* grades horizontais */}
        {[0, 10, 20, 30].map((v) => (
          <g key={v}>
            <line x1={L} y1={yDe(v)} x2={R} y2={yDe(v)} stroke="#E2E8F0" strokeWidth="1" />
            <text x={L - 8} y={yDe(v) + 3.5} textAnchor="end" fontSize="9" fill="#94A3B8">
              {v}%
            </text>
          </g>
        ))}

        {/* trava do art. 349 */}
        <line
          x1={L}
          y1={yDe(TETO_REFERENCIA)}
          x2={R}
          y2={yDe(TETO_REFERENCIA)}
          stroke="#DC2626"
          strokeWidth="1.5"
          strokeDasharray="5 4"
        />
        <rect
          x={R - 96}
          y={yDe(TETO_REFERENCIA) - 15}
          width="96"
          height="13"
          rx="2"
          fill="#FEF2F2"
        />
        <text
          x={R - 52}
          y={yDe(TETO_REFERENCIA) - 5.5}
          textAnchor="middle"
          fontSize="8.5"
          fill="#B91C1C"
          fontWeight="700"
        >
          teto 26,5% (art. 349)
        </text>

        {/* barras empilhadas: IBS embaixo, CBS em cima */}
        {SERIE.map((s, i) => {
          const cx = L + faixa * i + faixa / 2
          const x = cx - larguraBarra / 2
          const altIbs = (s.ibs / MAXV) * altura
          const altCbs = (s.cbs / MAXV) * altura
          const yIbs = B - altIbs
          const yCbs = yIbs - altCbs
          return (
            <g key={s.ano}>
              <rect x={x} y={yIbs} width={larguraBarra} height={altIbs} fill="#0B1528" rx="1" />
              <rect x={x} y={yCbs} width={larguraBarra} height={altCbs} fill="#C5A059" rx="1" />
              <text
                x={cx}
                y={Math.min(yCbs, yIbs) - 5}
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="700"
                fill="#0F172A"
              >
                {s.total.toFixed(1).replace('.', ',')}
              </text>
              <text
                x={cx}
                y={B + 14}
                textAnchor="middle"
                fontSize="10"
                fill="#334155"
                fontWeight="600"
              >
                {s.ano}
              </text>
              <text x={cx} y={B + 26} textAnchor="middle" fontSize="7.5" fill="#94A3B8">
                {faseDoAno(s.ano).rotulo}
              </text>
            </g>
          )
        })}

        <line x1={L} y1={B} x2={R} y2={B} stroke="#CBD5E1" strokeWidth="1.5" />
      </svg>
    </div>
  )
}

function AbaAliquotas() {
  const maxRed = REF_TOTAL
  return (
    <div className="space-y-4">
      {/* molduras de identificação rápida */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <Moldura
          Icon={Calculator}
          rotulo="Referência plena"
          valor={pct(REF_TOTAL)}
          detalhe={`CBS ${pct(CBS_REF)} + IBS ${pct(IBS_REF)}`}
          tom="navy"
        />
        <Moldura
          Icon={CalendarClock}
          rotulo="Em 2027"
          valor={pct(totalDoAno(2027))}
          detalhe="Só a CBS é cobrada; IBS em teste (0,1%)"
          tom="ambar"
        />
        <Moldura
          Icon={Gauge}
          rotulo="Teto legal"
          valor={pct(TETO_REFERENCIA)}
          detalhe={ACIMA_DO_TETO ? 'Soma atual excede o teto' : 'Soma dentro do teto'}
          tom={ACIMA_DO_TETO ? 'rosa' : 'verde'}
        />
        <Moldura
          Icon={Percent}
          rotulo="Atualizado em"
          valor={ALIQUOTAS_ATUALIZADAS_EM.split('-').reverse().slice(0, 2).join('/')}
          detalhe={PROCEDENCIA.cbs.fixadoPor.split('—')[0].trim()}
          tom="verde"
        />
      </div>

      {ACIMA_DO_TETO && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
          <p className="text-[11px] text-rose-900 leading-snug">
            <b>
              A soma de {pct(REF_TOTAL)} supera o teto de {pct(TETO_REFERENCIA)}
            </b>{' '}
            do art. 349 da LC 214/2025. Pela lei, o Executivo deve propor ao Congresso medidas para
            reduzir a referência a esse patamar. Não é erro de cálculo: é consequência de a CBS ter
            subido para {pct(CBS_REF)} com o IBS mantido em {pct(IBS_REF)}.
          </p>
        </div>
      )}

      {/* gráfico de evolução */}
      <div className="rounded-xl border-2 border-slate-200 bg-white p-3.5">
        <BlocoH
          n="1"
          Icon={TrendingUp}
          titulo="Evolução das alíquotas — 2026 a 2033"
          capitulacao="LC 214/2025, arts. 343 (CBS) e 344 (IBS) · referência: TCU 28/10/2026 e Res. CGIBS 14/2026"
        />
        <GraficoEvolucao />
        <div className="flex items-center gap-4 mt-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-600">
            <span className="w-3 h-3 rounded-sm bg-panorama-navy" /> IBS
          </span>
          <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-600">
            <span className="w-3 h-3 rounded-sm bg-panorama-gold" /> CBS
          </span>
          <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-600">
            <span className="w-3 h-0.5 bg-rose-600" /> teto do art. 349
          </span>
          <span className="text-[10px] text-slate-400 ml-auto">valores em % sobre a operação</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-2 leading-snug bg-slate-50 rounded px-2 py-1.5">
          <b>Como ler:</b> em 2026 e 2027–2028 há apenas teste (1,0% e 11,4%). O IBS entra em 2029
          com 10% da referência e sobe por degraus até 2033, quando a soma chega aos{' '}
          {pct(REF_TOTAL)}. Comparar 2027 com 2033 é comparar coisas diferentes — o gráfico mostra a
          construção, não um salto.
        </p>
      </div>

      {/* redutores */}
      <div className="rounded-xl border-2 border-slate-200 bg-white p-3.5">
        <BlocoH
          n="2"
          Icon={Percent}
          titulo="Redutores — a alíquota efetiva de cada tratamento"
          capitulacao={`aplicados sobre a referência de ${pct(REF_TOTAL)} · LC 214/2025, arts. 125 a 138`}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5">
          {REDUTORES.map((r) => (
            <BarraH
              key={r.rotulo}
              rotulo={r.rotulo}
              valor={Number((REF_TOTAL * r.fator).toFixed(2))}
              max={maxRed}
              sufixo="%"
              cor={
                r.fator === 0
                  ? 'bg-emerald-500'
                  : r.fator <= 0.4
                    ? 'bg-teal-500'
                    : r.fator <= 0.5
                      ? 'bg-amber-500'
                      : r.fator < 1
                        ? 'bg-orange-500'
                        : 'bg-slate-600'
              }
              nota={r.base}
            />
          ))}
        </div>
        <p className="text-[10px] text-slate-500 mt-2 leading-snug">
          Um mesmo produto pode ter mais de um tratamento (por exemplo, redução de 60% e depois
          crédito presumido). O valor acima é a alíquota antes de qualquer crédito.
        </p>
      </div>

      {/* histórico e procedência */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-xl border-2 border-slate-200 bg-white p-3.5">
          <BlocoH
            n="3"
            Icon={BarChart3}
            titulo="O que mudou na referência"
            capitulacao="série histórica — src/data/aliquotas.ts"
          />
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-panorama-navy text-white">
                <th className="text-left px-2 py-1.5 font-bold rounded-tl">Vigência</th>
                <th className="text-right px-2 py-1.5 font-bold">CBS</th>
                <th className="text-right px-2 py-1.5 font-bold">IBS</th>
                <th className="text-right px-2 py-1.5 font-bold rounded-tr">Total</th>
              </tr>
            </thead>
            <tbody>
              {HISTORICO_ALIQUOTAS.map((h, i) => (
                <tr key={h.de} className={i % 2 ? 'bg-slate-50' : 'bg-white'}>
                  <td className="px-2 py-1.5 text-slate-700 border-b border-slate-100">
                    {h.de.split('-').reverse().join('/')}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-slate-700 border-b border-slate-100">
                    {pct(h.cbs)}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-slate-700 border-b border-slate-100">
                    {pct(h.ibs)}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums font-bold text-slate-900 border-b border-slate-100">
                    {pct(h.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[9px] text-slate-400 mt-1.5 leading-snug">
            {HISTORICO_ALIQUOTAS[HISTORICO_ALIQUOTAS.length - 1].nota}
          </p>
        </div>

        <div className="rounded-xl border-2 border-slate-200 bg-white p-3.5">
          <BlocoH
            n="4"
            Icon={FileCheck2}
            titulo="Procedência de cada número"
            capitulacao="quem fixou, como foi calculado e o que ainda está pendente"
          />
          <div className="space-y-2">
            {[
              { nome: 'CBS', p: PROCEDENCIA.cbs },
              { nome: 'IBS', p: PROCEDENCIA.ibs },
            ].map(({ nome, p }) => (
              <div key={nome} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-900">{nome}</span>
                  <span className="text-[11px] font-bold text-panorama-gold-dark tabular-nums">
                    {pct(p.valor)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 leading-snug mt-0.5">{p.fixadoPor}</p>
                <p className="text-[10px] text-slate-500 leading-snug mt-1">
                  <b>Vigência:</b> {p.vigencia}
                </p>
                <p className="text-[10px] text-amber-800 leading-snug mt-0.5">
                  <b>Pendente:</b> {p.pendente}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────── aba 2: as tabelas ─────────────────── */

function AbaTabelas() {
  const porDiploma = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const d of LINHAS_POR_DISPOSITIVO) acc[d.norma] = (acc[d.norma] || 0) + d.linhas
    return Object.entries(acc).sort((a, b) => b[1] - a[1])
  }, [])

  const porInstrumento = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const a of ANEXOS) acc[a.instrumento] = (acc[a.instrumento] || 0) + 1
    return Object.entries(acc).sort((a, b) => b[1] - a[1])
  }, [])

  const confianca = [
    { rotulo: 'Confirmada', v: TOTAL_ALTA, cor: '#059669' },
    { rotulo: 'Parcial', v: TOTAL_MEDIA, cor: '#D97706' },
    { rotulo: 'Sem vínculo', v: TOTAL_BAIXA, cor: '#DC2626' },
  ]

  // donut
  const r = 46
  const circ = 2 * Math.PI * r
  let acumulado = 0
  const arcos = confianca.map((c) => {
    const frac = TOTAL_LINHAS > 0 ? c.v / TOTAL_LINHAS : 0
    const dash = frac * circ
    const arco = { ...c, dash, offset: acumulado }
    acumulado += dash
    return arco
  })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <Moldura
          Icon={Layers}
          rotulo="Linhas de tabela"
          valor={TOTAL_LINHAS.toLocaleString('pt-BR')}
          detalhe={`em ${TOTAL_BLOCOS} blocos de anexo`}
          tom="navy"
        />
        <Moldura
          Icon={ShieldCheck}
          rotulo="Vínculo confirmado"
          valor={`${Math.round((TOTAL_ALTA / TOTAL_LINHAS) * 100)}%`}
          detalhe={`${TOTAL_ALTA.toLocaleString('pt-BR')} linhas com dispositivo`}
          tom="verde"
        />
        <Moldura
          Icon={Scale}
          rotulo="Anexos catalogados"
          valor={String(ANEXOS.length)}
          detalhe="RIBS, LC 214 e Decreto 12.955"
          tom="ambar"
        />
        <Moldura
          Icon={Calculator}
          rotulo="No simulador"
          valor={String(SIM_TOTAL)}
          detalhe="itens com atalho de cálculo"
          tom="rosa"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* confiança do vínculo */}
        <div className="rounded-xl border-2 border-slate-200 bg-white p-3.5">
          <BlocoH
            n="1"
            Icon={ShieldCheck}
            titulo="Confiança do vínculo item a item"
            capitulacao="como cada linha foi ancorada no dispositivo legal"
          />
          <div className="flex items-center gap-4">
            <svg
              viewBox="0 0 120 120"
              className="w-28 h-28 shrink-0"
              role="img"
              aria-label="Distribuição das 1.053 linhas por grau de confiança"
            >
              <circle cx="60" cy="60" r={r} fill="none" stroke="#F1F5F9" strokeWidth="14" />
              {arcos.map((a) => (
                <circle
                  key={a.rotulo}
                  cx="60"
                  cy="60"
                  r={r}
                  fill="none"
                  stroke={a.cor}
                  strokeWidth="14"
                  strokeDasharray={`${a.dash} ${circ - a.dash}`}
                  strokeDashoffset={-a.offset}
                  transform="rotate(-90 60 60)"
                />
              ))}
              <text x="60" y="57" textAnchor="middle" fontSize="17" fontWeight="800" fill="#0F172A">
                {TOTAL_LINHAS.toLocaleString('pt-BR')}
              </text>
              <text x="60" y="71" textAnchor="middle" fontSize="8" fill="#64748B">
                linhas
              </text>
            </svg>
            <div className="flex-1 space-y-1.5">
              {confianca.map((c) => (
                <div key={c.rotulo} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: c.cor }} />
                  <span className="text-[11px] text-slate-700 flex-1">{c.rotulo}</span>
                  <span className="text-[11px] font-bold text-slate-900 tabular-nums">{c.v}</span>
                  <span className="text-[10px] text-slate-400 tabular-nums w-9 text-right">
                    {Math.round((c.v / TOTAL_LINHAS) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 leading-snug">
            <b>O que é cada grau:</b> confirmada = o item cita o dispositivo expressamente; parcial
            = o dispositivo foi inferido do bloco; sem vínculo = a linha é cabeçalho de capítulo ou
            código ausente do catálogo.
          </p>
        </div>

        {/* linhas por diploma */}
        <div className="rounded-xl border-2 border-slate-200 bg-white p-3.5">
          <BlocoH
            n="2"
            Icon={BarChart3}
            titulo="Linhas por diploma"
            capitulacao="de onde vem cada linha da Tabela Geral"
          />
          {porDiploma.map(([nome, qtd]) => (
            <BarraH
              key={nome}
              rotulo={nome}
              valor={qtd}
              max={porDiploma[0]?.[1] ?? 1}
              cor="bg-gradient-to-r from-indigo-400 to-indigo-600"
            />
          ))}
          <div className="mt-2 pt-2 border-t border-slate-100">
            <p className="text-[10px] text-slate-500 leading-snug">
              A Tabela Geral é a fonte única dos itens. As seções 2C/2D e a Seção 7 apontam para ela
              em vez de repetir os códigos.
            </p>
            <a
              href="#tabela-geral"
              className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 hover:underline mt-1"
            >
              Abrir a Tabela Geral
              <ArrowRight className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>

        {/* anexos por instrumento */}
        <div className="rounded-xl border-2 border-slate-200 bg-white p-3.5">
          <BlocoH
            n="3"
            Icon={Layers}
            titulo="Anexos por instrumento"
            capitulacao={`${ANEXOS.length} anexos: RIBS, LC 214/2025 e Decreto 12.955/2026`}
          />
          {porInstrumento.map(([inst, qtd]) => (
            <BarraH
              key={inst}
              rotulo={
                inst === 'RIBS'
                  ? 'Resolução CGIBS 6/2026 (RIBS)'
                  : inst === 'LC214'
                    ? 'LC 214/2025'
                    : 'Decreto 12.955/2026'
              }
              valor={qtd}
              max={porInstrumento[0]?.[1] ?? 1}
              cor="bg-gradient-to-r from-rose-400 to-rose-600"
              sufixo=" anexos"
            />
          ))}
          <a
            href="#secao-7"
            className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 hover:underline mt-1"
          >
            Ver o catálogo dos anexos
            <ArrowRight className="w-2.5 h-2.5" />
          </a>
        </div>

        {/* o que os números significam */}
        <div className="rounded-xl border-2 border-slate-200 bg-white p-3.5">
          <BlocoH
            n="4"
            Icon={Gauge}
            titulo="Como interpretar"
            capitulacao="três leituras que evitam erro"
          />
          <ul className="space-y-1.5 text-[11px] text-slate-700 leading-snug">
            <li className="flex gap-1.5">
              <span className="text-emerald-600 font-bold shrink-0">1.</span>
              <span>
                <b>1.053 linhas</b> é o total da Tabela Geral; <b>1.002 itens</b> é o catálogo do
                Simulador. Não são o mesmo conjunto — o segundo é curado para cálculo.
              </span>
            </li>
            <li className="flex gap-1.5">
              <span className="text-emerald-600 font-bold shrink-0">2.</span>
              <span>
                <b>95% de vínculo confirmado</b> não significa 95% revisado por humano: o vínculo
                foi casado por código de item, não conferido linha a linha.
              </span>
            </li>
            <li className="flex gap-1.5">
              <span className="text-emerald-600 font-bold shrink-0">3.</span>
              <span>
                <b>Anexo não é artigo.</b> O item sabe em qual anexo está; abrir o artigo exato
                ainda é um passo manual em parte dos casos.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────── aba 3: fontes ─────────────────── */

function AbaFontes() {
  const status = [
    {
      rotulo: 'Ativas',
      v: CONTAGEM.ativa,
      cor: 'bg-emerald-500',
      nota: 'respondem e são conferidas toda semana',
    },
    {
      rotulo: 'Bloqueadas (WAF)',
      v: CONTAGEM.bloqueada,
      cor: 'bg-amber-500',
      nota: 'recusam acesso automático; têm substituto',
    },
    {
      rotulo: 'Sem rota',
      v: CONTAGEM.sem_rota,
      cor: 'bg-slate-400',
      nota: 'cadastradas, mas sem caminho técnico',
    },
    {
      rotulo: 'Não usar',
      v: CONTAGEM.nao_usar,
      cor: 'bg-rose-500',
      nota: 'descartadas por não serem fonte primária',
    },
  ]

  const porStatusNorma = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const n of CRONOLOGIA) acc[n.situacao] = (acc[n.situacao] || 0) + 1
    return acc
  }, [])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <Moldura
          Icon={Radio}
          rotulo="Fontes vigiadas"
          valor={`${CONTAGEM.ativa}/${TOTAL_FONTES}`}
          detalhe="ativas e conferidas na última varredura"
          tom="verde"
        />
        <Moldura
          Icon={Scale}
          rotulo="Normas vigiadas"
          valor={String(NORMAS_VIGIADAS)}
          detalhe={`${NORMAS_NO_PANORAMA} já incorporadas ao Panorama`}
          tom="navy"
        />
        <Moldura
          Icon={HOUVE_MUDANCA ? ShieldAlert : ShieldCheck}
          rotulo="Última varredura"
          valor={HOUVE_MUDANCA ? 'Mudou' : 'Estável'}
          detalhe={`${ALERTAS.length} alerta(s) registrado(s)`}
          tom={HOUVE_MUDANCA ? 'rosa' : 'verde'}
        />
        <Moldura
          Icon={CalendarClock}
          rotulo="Executada em"
          valor={EXECUCAO.slice(8, 10) + '/' + EXECUCAO.slice(5, 7)}
          detalhe={`${EXECUCAO.slice(11, 16)} UTC · rotina de quarta 11h`}
          tom="ambar"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-xl border-2 border-slate-200 bg-white p-3.5">
          <BlocoH
            n="1"
            Icon={Radio}
            titulo="Estado das fontes"
            capitulacao="16 fontes no registro central · 8 ativas, 2 bloqueadas, 4 sem rota, 2 descartadas"
          />
          {status.map((s) => (
            <BarraH
              key={s.rotulo}
              rotulo={s.rotulo}
              valor={s.v}
              max={Math.max(...status.map((x) => x.v), 1)}
              cor={s.cor}
              nota={s.nota}
            />
          ))}
          <p className="text-[10px] text-slate-500 mt-2 leading-snug bg-slate-50 rounded px-2 py-1.5">
            <b>Regra do agente:</b> fonte que não responde nunca é tratada como estável. Ela vira
            alerta branco com o substituto indicado — e o substituto é sempre a fonte que
            <i> publica</i> o ato, não a que o consolida.
          </p>
          <a
            href="#monitor-legislativo"
            className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:underline mt-1.5"
          >
            Abrir o Monitor Legislativo
            <ArrowRight className="w-2.5 h-2.5" />
          </a>
        </div>

        <div className="rounded-xl border-2 border-slate-200 bg-white p-3.5">
          <BlocoH
            n="2"
            Icon={Database}
            titulo="As 23 normas por situação"
            capitulacao="vigentes, alteradas e revogadas — linha do tempo completa"
          />
          <div className="space-y-1.5">
            {[
              { k: 'vigente', rotulo: 'Vigente', cor: 'bg-emerald-500' },
              { k: 'alterada', rotulo: 'Alterada por norma posterior', cor: 'bg-amber-500' },
              { k: 'revogada', rotulo: 'Revogada', cor: 'bg-rose-500' },
            ].map((s) => {
              const v = porStatusNorma[s.k] || 0
              return (
                <BarraH
                  key={s.k}
                  rotulo={s.rotulo}
                  valor={v}
                  max={TOTAL_NORMAS}
                  cor={s.cor}
                  sufixo={` de ${TOTAL_NORMAS}`}
                />
              )
            })}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1.5">
              <p className="text-[9px] font-bold text-emerald-800 uppercase">Incorporadas</p>
              <p className="text-lg font-extrabold text-emerald-900 tabular-nums leading-none mt-0.5">
                {INCORPORADAS}
              </p>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-2 py-1.5">
              <p className="text-[9px] font-bold text-amber-800 uppercase">Fora do Panorama</p>
              <p className="text-lg font-extrabold text-amber-900 tabular-nums leading-none mt-0.5">
                {PENDENTES}
              </p>
            </div>
          </div>
          <a
            href="#fontes-primarias"
            className="inline-flex items-center gap-1 text-[10px] font-bold text-fuchsia-700 hover:underline mt-1.5"
          >
            Ver as fontes primárias
            <ArrowRight className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────── aba 4: normas ─────────────────── */

function AbaNormas() {
  const porAno = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const n of CRONOLOGIA) {
      const a = n.data.slice(0, 4)
      acc[a] = (acc[a] || 0) + 1
    }
    return Object.entries(acc).sort((a, b) => a[0].localeCompare(b[0]))
  }, [])

  const porTipo = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const n of CRONOLOGIA) acc[n.tipo] = (acc[n.tipo] || 0) + 1
    return Object.entries(acc).sort((a, b) => b[1] - a[1])
  }, [])

  const porPapel = useMemo(() => {
    const rotulos: Record<string, string> = {
      estrutura: 'Estrutura o tributo',
      regulamento: 'Regulamenta',
      alteracao: 'Altera norma anterior',
      combustivel: 'Combustíveis',
      simples: 'Simples Nacional / MEI',
      organizacao: 'Organização do CGIBS',
    }
    const acc: Record<string, number> = {}
    for (const n of CRONOLOGIA)
      acc[rotulos[n.papel] || n.papel] = (acc[rotulos[n.papel] || n.papel] || 0) + 1
    return Object.entries(acc).sort((a, b) => b[1] - a[1])
  }, [])

  const maxAno = Math.max(...porAno.map(([, v]) => v), 1)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <Moldura
          Icon={Scale}
          rotulo="Normas na linha do tempo"
          valor={String(TOTAL_NORMAS)}
          detalhe="de 2023 a 2026"
          tom="navy"
        />
        <Moldura
          Icon={FileCheck2}
          rotulo="Dentro do Panorama"
          valor={String(INCORPORADAS)}
          detalhe={`${Math.round((INCORPORADAS / TOTAL_NORMAS) * 100)}% do total acompanhado`}
          tom="verde"
        />
        <Moldura
          Icon={CalendarClock}
          rotulo="Anos cobertos"
          valor={String(porAno.length)}
          detalhe={`${porAno[0]?.[0]} a ${porAno[porAno.length - 1]?.[0]}`}
          tom="ambar"
        />
        <Moldura
          Icon={Layers}
          rotulo="Tipos de ato"
          valor={String(porTipo.length)}
          detalhe="EC, LC, decretos, resoluções e atos"
          tom="rosa"
        />
      </div>

      <div className="rounded-xl border-2 border-slate-200 bg-white p-3.5">
        <BlocoH
          n="1"
          Icon={TrendingUp}
          titulo="Produção normativa por ano"
          capitulacao="quantas normas a reforma gerou em cada ano — a curva mostra o pico de regulamentação"
        />
        <div className="flex items-end gap-1.5 h-32 mt-2">
          {porAno.map(([ano, qtd]) => (
            <div key={ano} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
              <span className="text-[10px] font-bold text-slate-900 tabular-nums">{qtd}</span>
              <div
                className="w-full rounded-t bg-gradient-to-t from-panorama-navy to-indigo-500 min-h-[4px] relative group"
                style={{ height: `${Math.round((qtd / maxAno) * 100)}%` }}
              >
                <span className="absolute inset-x-0 -top-5 text-center text-[8px] text-slate-400 opacity-0 group-hover:opacity-100">
                  {qtd}
                </span>
              </div>
              <span className="text-[9px] text-slate-500 font-mono">{ano}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-500 mt-2 leading-snug">
          O volume cresce porque a reforma saiu da Constituição para a lei complementar e, depois,
          para os regulamentos — cada camada acrescenta atos.
        </p>
        {porAno.length < 4 && (
          <p className="text-[10px] text-amber-900 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mt-1.5 leading-snug">
            <b>Por que 2024 está vazio:</b> não é falha de medição. Em 2024 a reforma tramitou no
            Congresso (PLP 68/2024) e nenhum ato foi publicado — a lei complementar só saiu em
            janeiro de 2025. O gráfico mostra anos com ato publicado, não anos com trabalho
            legislativo.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-xl border-2 border-slate-200 bg-white p-3.5">
          <BlocoH
            n="2"
            Icon={Scale}
            titulo="Por tipo de ato"
            capitulacao="hierarquia normativa da reforma"
          />
          {porTipo.map(([tipo, qtd]) => (
            <BarraH
              key={tipo}
              rotulo={tipo}
              valor={qtd}
              max={porTipo[0]?.[1] ?? 1}
              cor="bg-gradient-to-r from-slate-500 to-slate-700"
            />
          ))}
        </div>

        <div className="rounded-xl border-2 border-slate-200 bg-white p-3.5">
          <BlocoH
            n="3"
            Icon={Layers}
            titulo="Por função na reforma"
            capitulacao="o que cada norma faz, não o que ela é"
          />
          {porPapel.map(([papel, qtd]) => (
            <BarraH
              key={papel}
              rotulo={papel}
              valor={qtd}
              max={porPapel[0]?.[1] ?? 1}
              cor="bg-gradient-to-r from-emerald-400 to-emerald-600"
            />
          ))}
        </div>
      </div>

      <div className="rounded-xl border-2 border-slate-200 bg-white p-3.5">
        <BlocoH
          n="4"
          Icon={CalendarClock}
          titulo="Últimas normas acompanhadas"
          capitulacao="as cinco mais recentes — o resto está no Monitor Legislativo"
        />
        <div className="space-y-1">
          {CRONOLOGIA.slice(0, 5).map((n) => (
            <div
              key={n.codigo}
              className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5"
            >
              <span className="text-[9px] font-mono text-slate-400 shrink-0 mt-0.5 tabular-nums">
                {n.data.split('-').reverse().join('/')}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-slate-900 leading-tight">{n.titulo}</p>
                <p className="text-[10px] text-slate-500 leading-tight truncate">{n.objeto}</p>
              </div>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                  n.incorporada ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {n.incorporada ? 'no Panorama' : 'fora'}
              </span>
            </div>
          ))}
        </div>
        <a
          href="#monitor-legislativo"
          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:underline mt-1.5"
        >
          Ver as 23 normas no Monitor
          <ArrowRight className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  )
}

/* ─────────────────── seção ─────────────────── */

export function SectionIndicadores() {
  const [aba, setAba] = useState<Aba>('aliquotas')

  return (
    <section id="indicadores" className="scroll-mt-24">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* cabeçalho navy + dourado */}
        <header className="bg-panorama-navy px-4 sm:px-5 py-4 border-b-2 border-panorama-gold/60">
          <div className="flex items-start gap-3 flex-wrap">
            <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-panorama-gold/15 text-panorama-gold-light ring-1 ring-panorama-gold/50 shrink-0">
              <Gauge className="w-6 h-6" />
            </span>
            <div className="flex-1 min-w-[220px]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-panorama-navy bg-panorama-gold rounded px-1.5 py-0.5">
                  Seção 8A
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-panorama-gold-light/80">
                  Central de Indicadores
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mt-1 leading-tight">
                Todos os números do sistema em uma tela
              </h3>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed max-w-3xl">
                Alíquotas, tabelas, fontes e normas — com gráfico, moldura e a procedência ao lado
                de cada valor. Sete abas: os números, a comparação entre setores, o custo do regime
                errado e o diagnóstico por cliente.
              </p>
            </div>
            <div className="shrink-0 self-start mt-1">
              <BotaoExportarPDF alvo="indicadores" />
            </div>
          </div>

          {/* abas internas */}
          <div role="tablist" className="flex gap-1.5 mt-3 overflow-x-auto pb-0.5">
            {ABAS.map((a) => {
              const ativa = aba === a.id
              return (
                <button
                  key={a.id}
                  role="tab"
                  aria-selected={ativa}
                  onClick={() => setAba(a.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold shrink-0 transition-colors cursor-pointer ${
                    ativa
                      ? 'bg-panorama-gold text-panorama-navy'
                      : 'bg-white/10 text-slate-200 hover:bg-white/20'
                  }`}
                >
                  <a.Icon className="w-3.5 h-3.5" />
                  {a.nome}
                </button>
              )
            })}
          </div>
        </header>

        <div className="p-3.5 sm:p-4">
          <div role="tabpanel">
            {aba === 'aliquotas' && <AbaAliquotas />}
            {aba === 'tabelas' && <AbaTabelas />}
            {aba === 'fontes' && <AbaFontes />}
            {aba === 'normas' && <AbaNormas />}
            {aba === 'comparar' && <ComparadorSetores />}
            {aba === 'erro' && <CustoDoErro />}
            {aba === 'clientes' && <PainelCliente />}
          </div>

          {/* rodapé de capitulação */}
          <div className="mt-3.5 pt-2.5 border-t border-slate-200 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              <FileCheck2 className="w-3 h-3" />
              Fontes dos números:
            </span>
            <span>LC 214/2025 arts. 343-344 e 349</span>
            <span>·</span>
            <span>TCU 28/10/2026</span>
            <span>·</span>
            <span>Res. CGIBS 6/2026 e 14/2026</span>
            <span>·</span>
            <span>Decreto 12.955/2026</span>
            <span className="ml-auto">
              atualizado em {ALIQUOTAS_ATUALIZADAS_EM.split('-').reverse().join('/')}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
