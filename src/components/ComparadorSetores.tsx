import { useState } from 'react'
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  FileCheck2,
  Handshake,
  Home,
  Landmark,
  Percent,
  Smartphone,
  Tractor,
} from 'lucide-react'
import { REF_TOTAL, pct } from '@/data/aliquotas'

/**
 * COMPARADOR DE SETORES — dois regimes lado a lado
 *
 * ── POR QUE EXISTE ──
 * Os seis regimes setoriais (6A a 6F) vivem em seções separadas, cada uma com sua
 * própria tabela. Quem precisa decidir "meu caso é imobiliário ou é serviço
 * financeiro?" tinha de ler seis seções e comparar de cabeça. Aqui dois regimes
 * ficam na mesma linha, com a alíquota efetiva de cada tratamento e — o mais
 * importante — o ponto de atenção que muda a resposta.
 *
 * ── HONESTIDADE ──
 * Os fatores vêm das mesmas fontes dos simuladores (REF_TOTAL de src/data). Onde
 * o regime não se resolve por fator — o Simples, que tem DAS por faixa — a tela
 * não inventa percentual: mostra "DAS unificado" e diz por quê.
 */

interface Tratamento {
  rotulo: string
  /** multiplicador sobre a referência; ausente quando o regime não é fator */
  fator?: number
  nota: string
}

interface Setor {
  id: string
  nome: string
  num: string
  Icon: React.ComponentType<{ className?: string }>
  cor: string
  bg: string
  borda: string
  principal: Tratamento
  outros: Tratamento[]
  base: string
  atencao: string
  link: string
}

const SETORES: Setor[] = [
  {
    id: 'imobiliario',
    nome: 'Imobiliário',
    num: '6A',
    Icon: Home,
    cor: 'text-amber-700',
    bg: 'bg-amber-50',
    borda: 'border-amber-300',
    principal: { rotulo: 'Locação residencial', fator: 0.3, nota: '−70% (art. 255, §1º)' },
    outros: [
      { rotulo: 'Venda de imóvel novo', fator: 0.5, nota: '−50% (art. 255)' },
      {
        rotulo: 'Venda de lote',
        fator: 0.5,
        nota: '−50% + redutor de R$ 30 mil na base (art. 257)',
      },
      { rotulo: 'Locação comercial', fator: 1, nota: 'sem redução' },
    ],
    base: 'LC 214/2025, arts. 251-261 e 485-488',
    atencao:
      'O RET (2,08% / 0,53%) é opcional e substitui o regime regular — comparar os dois antes de optar.',
    link: '#regime-imobiliario',
  },
  {
    id: 'agro',
    nome: 'Agronegócio',
    num: '6B',
    Icon: Tractor,
    cor: 'text-emerald-700',
    bg: 'bg-emerald-50',
    borda: 'border-emerald-300',
    principal: { rotulo: 'Insumos agropecuários', fator: 0.4, nota: '−60% (art. 138)' },
    outros: [
      {
        rotulo: 'Produtor não contribuinte',
        fator: 0,
        nota: 'zero na produção própria (art. 164)',
      },
      { rotulo: 'Tratores e máquinas', fator: 0, nota: 'alíquota zero (art. 110)' },
      {
        rotulo: 'Créditos presumidos',
        nota: 'percentual definido por ato conjunto (art. 168, §4º)',
      },
    ],
    base: 'LC 214/2025, arts. 110, 137-138, 164-171 e 271-272',
    atencao:
      'O limite de R$ 3,6 mi do produtor não contribuinte soma a receita própria e das sociedades em que participa (§6º do art. 164).',
    link: '#agronegocio',
  },
  {
    id: 'consorcios',
    nome: 'Consórcios',
    num: '6C',
    Icon: Handshake,
    cor: 'text-violet-700',
    bg: 'bg-violet-50',
    borda: 'border-violet-300',
    principal: {
      rotulo: 'Taxa de administração',
      fator: 1,
      nota: 'regra geral, sem redução própria',
    },
    outros: [
      { rotulo: 'Carta de crédito contemplada', nota: 'contemplação não é fato gerador novo' },
      { rotulo: 'Garantias e fundo de reserva', fator: 1, nota: 'seguem a regra do serviço' },
    ],
    base: 'LC 214/2025, arts. 204-206',
    atencao:
      'A base é a taxa de administração, não o valor da carta de crédito — confundir os dois infla o tributo.',
    link: '#consorcios',
  },
  {
    id: 'financeiros',
    nome: 'Serviços financeiros',
    num: '6D',
    Icon: Landmark,
    cor: 'text-violet-700',
    bg: 'bg-violet-50',
    borda: 'border-violet-300',
    principal: { rotulo: 'Operação de crédito', fator: 1, nota: 'plena sobre o juro (art. 192)' },
    outros: [
      { rotulo: 'Tarifas bancárias', fator: 1, nota: 'plena sobre a tarifa (art. 184)' },
      { rotulo: 'Arranjos de pagamento', fator: 1, nota: 'split no momento da liquidação' },
      { rotulo: 'Leasing', fator: 1, nota: 'tratamento próprio (art. 194)' },
    ],
    base: 'LC 214/2025, arts. 182-214',
    atencao:
      'A base do empréstimo é o total pago menos o principal — quem calcula sobre o valor emprestado erra por muito.',
    link: '#financeiros',
  },
  {
    id: 'simples',
    nome: 'Simples Nacional',
    num: '6E',
    Icon: Percent,
    cor: 'text-blue-700',
    bg: 'bg-blue-50',
    borda: 'border-blue-300',
    principal: {
      rotulo: 'DAS unificado',
      nota: 'IBS e CBS recolhidos juntos no DAS (art. 343 da LC 214)',
    },
    outros: [
      {
        rotulo: '6 faixas de RBT12',
        nota: 'alíquota cresce com a receita bruta dos 12 meses anteriores',
      },
      { rotulo: 'Crédito ao adquirente', nota: 'limitado ao valor efetivamente recolhido no DAS' },
    ],
    base: 'LC 214/2025, art. 343 · LC 123/2006 · Res. CGSN 190/2026',
    atencao:
      'No Simples não há uma alíquota única de IBS/CBS: o valor sai da faixa. Comparar com o regime regular exige simular a faixa — não dá para usar percentual fixo.',
    link: '#simples',
  },
  {
    id: 'profissionais',
    nome: 'Profissionais e plataformas',
    num: '6F',
    Icon: Smartphone,
    cor: 'text-indigo-700',
    bg: 'bg-indigo-50',
    borda: 'border-indigo-300',
    principal: { rotulo: 'Profissão regulamentada', fator: 0.7, nota: '−30% (art. 127)' },
    outros: [
      { rotulo: 'Regra geral', fator: 1, nota: 'sem redução' },
      { rotulo: 'Plataforma estrangeira', nota: 'substituição tributária pelo intermediador' },
      { rotulo: 'Plataforma nacional', nota: 'responsabilidade solidária ou não contribuinte' },
    ],
    base: 'LC 214/2025, arts. 22, 127 e LC 227/2026',
    atencao:
      'Para PJ, o art. 127, §1º II exige cinco requisitos cumulativos. Faltando um, a redução não se aplica.',
    link: '#profissionais-plataformas',
  },
]

function BarraComparativa({ a, b, c }: { a: Setor; b: Setor; c: Setor }) {
  const fa = a.principal.fator
  const fb = b.principal.fator
  const fc = c.principal.fator
  const max = REF_TOTAL
  const wA = fa === undefined ? 0 : Math.round(((REF_TOTAL * fa) / max) * 100)
  const wB = fb === undefined ? 0 : Math.round(((REF_TOTAL * fb) / max) * 100)
  const wC = fc === undefined ? 0 : Math.round(((REF_TOTAL * fc) / max) * 100)

  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white p-3.5">
      <div className="flex items-center gap-1.5 mb-2.5">
        <ArrowLeftRight className="w-3.5 h-3.5 text-slate-600" />
        <p className="text-[12px] font-bold text-slate-900">
          Alíquota efetiva sobre a referência de {pct(REF_TOTAL)}
        </p>
      </div>

      {[
        {
          s: a,
          w: wA,
          f: fa,
          corBarra: 'bg-gradient-to-r from-amber-400 to-amber-600',
          letra: 'A',
        },
        {
          s: b,
          w: wB,
          f: fb,
          corBarra: 'bg-gradient-to-r from-indigo-400 to-indigo-600',
          letra: 'B',
        },
        { s: c, w: wC, f: fc, corBarra: 'bg-gradient-to-r from-teal-400 to-teal-600', letra: 'C' },
      ].map(({ s, w, f, corBarra, letra }) => (
        <div key={s.id} className="mb-2.5">
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <span className="text-[11px] font-bold text-slate-800">
              <span className="text-slate-400 font-mono mr-1">{s.num}</span>
              {s.nome}
              <span className="font-normal text-slate-500"> — {s.principal.rotulo}</span>
            </span>
            <span className="text-[12px] font-extrabold text-slate-900 tabular-nums shrink-0">
              {f === undefined ? 'DAS por faixa' : pct(REF_TOTAL * f)}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
            {f === undefined ? (
              <div className="h-full rounded-full bg-[repeating-linear-gradient(45deg,#CBD5E1_0_6px,#E2E8F0_6px_12px)]" />
            ) : (
              <div className={`h-full rounded-full ${corBarra}`} style={{ width: `${w}%` }} />
            )}
          </div>
        </div>
      ))}

      <p className="text-[10px] text-slate-500 leading-snug bg-slate-50 rounded px-2 py-1.5">
        <b>Regra geral sem redução</b> = {pct(REF_TOTAL)}. Quanto menor a barra, menor a alíquota
        sobre a operação — mas alíquota menor não significa carga menor: depende da base de cálculo,
        dos créditos e das obrigações acessórias de cada regime.
      </p>
    </div>
  )
}

export function ComparadorSetores() {
  const [a, setA] = useState('imobiliario')
  const [b, setB] = useState('agro')
  const [c, setC] = useState('financeiros')

  const setorA = SETORES.find((s) => s.id === a) ?? SETORES[0]
  const setorB = SETORES.find((s) => s.id === b) ?? SETORES[1]
  const setorC = SETORES.find((s) => s.id === c) ?? SETORES[3]

  const select = (valor: string, onChange: (v: string) => void, rotulo: string) => (
    <label className="flex-1 min-w-[190px]">
      <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">
        {rotulo}
      </span>
      <select
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border-2 border-slate-300 bg-white px-2.5 py-2 text-[12px] font-semibold text-slate-900 focus:outline-none focus:border-panorama-gold cursor-pointer"
      >
        {SETORES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.num} — {s.nome}
          </option>
        ))}
      </select>
    </label>
  )

  const CardSetor = ({ s }: { s: Setor }) => (
    <div className={`rounded-xl border-2 bg-white p-3.5 ${s.borda}`}>
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`flex items-center justify-center w-10 h-10 rounded-xl border-2 ${s.bg} ${s.borda} shrink-0`}
        >
          <s.Icon className={`w-5 h-5 ${s.cor}`} />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-mono font-bold text-slate-400">{s.num}</p>
          <p className="text-[13px] font-bold text-slate-900 leading-tight">{s.nome}</p>
        </div>
      </div>

      <div className={`rounded-lg px-2 py-1.5 ${s.bg} border ${s.borda} mb-2`}>
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
          Tratamento de referência
        </p>
        <p className="text-[11px] font-bold text-slate-900 mt-0.5">{s.principal.rotulo}</p>
        <p className="text-[10px] text-slate-600 leading-tight">{s.principal.nota}</p>
      </div>

      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">
        Outros tratamentos
      </p>
      <ul className="space-y-1 mb-2">
        {s.outros.map((o) => (
          <li key={o.rotulo} className="flex items-start gap-1.5">
            <ArrowRight className="w-2.5 h-2.5 text-slate-300 shrink-0 mt-1" />
            <span className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-800">{o.rotulo}</span>
              {o.fator !== undefined && (
                <span className="text-[10px] font-bold text-slate-500 tabular-nums">
                  {' '}
                  · {pct(REF_TOTAL * o.fator)}
                </span>
              )}
              <span className="block text-[10px] text-slate-500 leading-tight">{o.nota}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="rounded-lg bg-amber-50 border border-amber-200 px-2 py-1.5 mb-2">
        <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-amber-800">
          <AlertTriangle className="w-2.5 h-2.5" />
          Ponto de atenção
        </p>
        <p className="text-[10px] text-amber-900 leading-snug mt-0.5">{s.atencao}</p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] text-slate-400 leading-tight flex items-center gap-1">
          <FileCheck2 className="w-2.5 h-2.5 shrink-0" />
          {s.base}
        </p>
        <a
          href={s.link}
          className={`inline-flex items-center gap-0.5 text-[10px] font-bold hover:underline shrink-0 ${s.cor}`}
        >
          abrir
          <ArrowRight className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="rounded-xl border-2 border-slate-200 bg-white p-3.5">
        <div className="flex items-center gap-1.5 mb-2.5">
          <ArrowLeftRight className="w-4 h-4 text-panorama-gold-dark" />
          <p className="text-[12px] font-bold text-slate-900">Comparar até três regimes</p>
          <span className="text-[10px] text-slate-400 ml-auto">escolha os regimes</span>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          {select(a, setA, 'Setor A')}
          {select(b, setB, 'Setor B')}
          {select(c, setC, 'Setor C')}
        </div>
        {(a === b || a === c || b === c) && (
          <p className="text-[10px] text-amber-900 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mt-2 leading-snug">
            Há setores repetidos na comparação. Escolha regimes diferentes para ver a diferença.
          </p>
        )}
      </div>

      <BarraComparativa a={setorA} b={setorB} c={setorC} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <CardSetor s={setorA} />
        <CardSetor s={setorB} />
        <CardSetor s={setorC} />
      </div>

      <div className="rounded-xl border-2 border-slate-200 bg-white p-3.5">
        <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-900 mb-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          O que a comparação não resolve
        </p>
        <ul className="space-y-1 text-[10px] text-slate-600 leading-snug">
          <li>
            <b>Base de cálculo.</b> Dois regimes com a mesma alíquota podem ter bases diferentes —
            no financeiro, a base é o juro, não o valor emprestado.
          </li>
          <li>
            <b>Créditos.</b> A alíquota do fornecedor vira crédito do adquirente. Um regime com
            alíquota menor pode gerar menos crédito e custar mais na cadeia.
          </li>
          <li>
            <b>Obrigações.</b> Simples recolhe no DAS e tem menos deveres acessórios; o regular
            exige apuração por operação. Custo de conformidade não aparece em nenhuma alíquota.
          </li>
        </ul>
      </div>
    </div>
  )
}
