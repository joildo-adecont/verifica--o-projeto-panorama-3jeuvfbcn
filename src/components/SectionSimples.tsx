import { useState, useEffect } from 'react'
import { Calculator } from 'lucide-react'

const SIM_URL = '/simulador.html'

/** Seção 6E — Simples Nacional (LC 123, art. 13-A; LC 214, arts. 343–347 e 444).
 *  Layout de tabela uniformizado com a Seção 6A. IBS e CBS recolhidos no DAS (art. 343).
 *  Inclui SIMULADOR DO REGIME HÍBRIDO (opção pelo regime regular — LC 214, art. 41, §3º;
 *  LC 123, art. 13, §10; Res. CGSN 190/2026, arts. 40-C/40-D). */

const TRANSICAO = [
  {
    titulo: 'Alíquotas de teste — 2026',
    badge: '2026',
    detalhe:
      'Fatos geradores de 2026: IBS estadual 0,1% (arrecadação integral para o CGIBS e o Fundo de Compensação, sem repartição normal) e CBS 0,9%, compensável com PIS/Cofins (arts. 344 e 346). As alíquotas de teste NÃO se aplicam aos optantes do Simples (art. 348, III, "c") — para eles, IBS e CBS entram na guia a partir de 2027.',
    base: 'LC 214, arts. 344, 346 e 348, III, "c"',
  },
  {
    titulo: 'Alíquotas de teste — 2027 a 2028',
    badge: '2027–2028',
    detalhe:
      'IBS estadual 0,05% + municipal 0,05% (total 0,1%) e CBS com alíquota reduzida em 0,1 p.p. da alíquota fixada (arts. 344 e 347). As alíquotas aplicam-se aos regimes específicos observadas as respectivas bases de cálculo (art. 344, p.ú., II).',
    base: 'LC 214, arts. 344 e 347',
  },
  {
    titulo: 'Pleno regime — 2029 em diante',
    badge: '2029+',
    detalhe:
      'A partir de 2029, o IBS entra na fase de alíquotas plenas (10% → 40% → 100% da referência). O optante pelo Simples recolhe o IBS no DAS com a alíquota efetiva do seu anexo, acrescida da CBS.',
    base: 'LC 214 (sistemática); LC 123, art. 13-A',
  },
]

const REGRAS = [
  {
    titulo: 'IBS e CBS dentro do DAS',
    badge: 'DAS único',
    detalhe:
      'Os valores relativos ao IBS e à CBS devidos pelos optantes pelo Simples Nacional são recolhidos por meio de documento único de arrecadação (DAS), nos termos fixados pelo Comitê Gestor (LC 214, art. 343). Abrange empresas com receita até R$ 3,6 milhões/ano (LC 123, art. 13-A, incluído pela LC 214).',
    base: 'LC 214, art. 343; LC 123, art. 13-A',
  },
  {
    titulo: 'Opção e janelas',
    badge: 'Opção',
    detalhe:
      'A opção pelo regime de recolhimento do IBS no Simples segue as janelas da LC 123 (setembro, efeitos no ano seguinte). Resoluções CGSN 190–192/2026 regulamentam.',
    base: 'LC 123; Res. CGSN 190–192/2026',
  },
  {
    titulo: 'NF obrigatória com destaque',
    badge: 'Destaque',
    detalhe:
      'O optante deve emitir documento fiscal eletrônico com destaque do IBS/CBS nas operações — condição para o adquirente apropriar crédito.',
    base: 'LC 214 (sistemática); Res. CGSN',
  },
  {
    titulo: 'Crédito presumido de importação',
    badge: 'Crédito',
    detalhe:
      'Contribuinte habilitado sujeito ao regime regular ou ao Simples Nacional tem crédito presumido de IBS relativo à importação (arts. 444 e 462).',
    base: 'LC 214, arts. 444 e 462',
  },
]

/** Prazos do regime híbrido — LC 123, art. 13, §10 (red. LC 227/2026); Res. CGSN 190/2026, arts. 40-C/40-D; Res. CGSN 186 e 194/2026 (janela especial 2026). */
const HIBRIDO_PRAZOS = [
  {
    titulo: 'Janela de setembro — 1º semestre do ano seguinte',
    badge: '1–30/09',
    detalhe:
      'Opção (ou renúncia) formalizada entre 1º e 30 de setembro produz efeitos de 1º de janeiro a 30 de junho do ano seguinte. Cancelamento (irretratável) até 30 de novembro do ano da solicitação. Em 2026, prazo prorrogado até 30/10 pela Res. CGSN 194/2026.',
    base: 'LC 123, art. 13, §10; Res. CGSN 190/2026, art. 40-D; Res. 194/2026',
  },
  {
    titulo: 'Janela de março — 2º semestre do mesmo ano',
    badge: '1–31/03',
    detalhe:
      'Opção (ou renúncia) formalizada entre 1º e 31 de março produz efeitos de 1º de julho a 31 de dezembro do mesmo ano. Cancelamento até 31 de maio.',
    base: 'LC 123, art. 13, §10; Res. CGSN 190/2026, art. 40-D',
  },
  {
    titulo: 'Irretratável por semestre',
    badge: 'Irretratável',
    detalhe:
      'Iniciados os efeitos no semestre, a opção é irretratável pelo período (art. 40-C). Quem não se manifesta permanece recolhendo IBS e CBS dentro do DAS. MEI (SIMEI) não participa da opção — recolhe em valores fixos.',
    base: 'Res. CGSN 190/2026, arts. 40-C/40-D',
  },
  {
    titulo: 'Como optar',
    badge: 'Portal',
    detalhe:
      'Pelo Portal do Simples Nacional / Portal da Tributação sobre o Consumo (gov.br prata ou ouro): "Escolher Regime de Apuração IBS/CBS". O sistema verifica a elegibilidade automaticamente.',
    base: 'Manual RFB — Opção pelo Regime Regular IBS/CBS no Simples',
  },
]

/** Tabelas 2027–2028 (Anexos XVIII–XXII da LC 214 = Anexos I–V da LC 123): nominal e parcela a deduzir; partilha CBS+IBS. */
const ANEXOS: Record<
  string,
  { nome: string; nominal: number[]; deduz: number[]; partilha: number }
> = {
  I: {
    nome: 'Anexo I — Comércio',
    nominal: [4, 7.3, 9.5, 10.7, 14.3, 19],
    deduz: [0, 5940, 13860, 22500, 87300, 378000],
    partilha: 15.5,
  },
  II: {
    nome: 'Anexo II — Indústria',
    nominal: [4.5, 6.8, 9.1, 10.9, 13.8, 19.1],
    deduz: [0, 8100, 17640, 28320, 98400, 828000],
    partilha: 15.5,
  },
  III: {
    nome: 'Anexo III — Serviços (§5º-B)',
    nominal: [6, 11.2, 13.5, 16, 21, 23],
    deduz: [0, 9360, 17640, 35640, 125640, 648000],
    partilha: 17.15,
  },
  IV: {
    nome: 'Anexo IV — Serviços (§5º-C)',
    nominal: [4.5, 9, 10.2, 14, 22, 24],
    deduz: [0, 8100, 12420, 39780, 183780, 828000],
    partilha: 17.15,
  },
  V: {
    nome: 'Anexo V — Serviços (§5º-I, Fator R)',
    nominal: [15.5, 18, 19.5, 23, 31, 32.5],
    deduz: [0, 45000, 99000, 210000, 720000, 1260000],
    partilha: 17.15,
  },
}
const FAIXAS = [
  '1ª (até 180 mil)',
  '2ª (180–360 mil)',
  '3ª (360–720 mil)',
  '4ª (720 mil–1,8 mi)',
  '5ª (1,8–3,6 mi)',
  '6ª (3,6–4,8 mi)',
]

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function AbaButton({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors cursor-pointer ${
        ativo
          ? 'bg-panorama-navy text-panorama-gold-light border-panorama-navy'
          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  )
}

function Tabela({
  linhas,
}: {
  linhas: { titulo: string; badge: string; detalhe: string; base: string; sim?: string }[]
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
            <th className="py-3 px-4">Operação</th>
            <th className="py-3 px-3 w-32">Redução</th>
            <th className="py-3 px-4">Detalhe</th>
            <th className="py-3 px-3 w-44">Base legal</th>
            <th className="py-3 px-3 w-24">Simular</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {linhas.map((o) => (
            <tr key={o.titulo} className="hover:bg-slate-50/70 align-top">
              <td className="py-3 px-4 font-semibold text-slate-900">{o.titulo}</td>
              <td className="py-3 px-3">
                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {o.badge}
                </span>
              </td>
              <td className="py-3 px-4 text-slate-700 leading-relaxed">{o.detalhe}</td>
              <td className="py-3 px-3 text-slate-600 text-xs font-mono">{o.base}</td>
              <td className="py-3 px-3">
                {o.sim ? (
                  <a
                    href={`${SIM_URL}?q=${encodeURIComponent(o.sim)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-panorama-navy hover:text-panorama-gold-dark"
                  >
                    <Calculator className="w-3 h-3" /> Simular
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-300">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ============ DESIGN SYSTEM v2 — Simuladores Modernos (04/10/2026) ============
// Capitulação legal como indicador de origem em cada bloco.

const ORIGENS: Record<string, { rotulo: string; cor: string }> = {
  lei: { rotulo: 'LEI COMPLEMENTAR', cor: 'bg-blue-100 text-blue-800 border-blue-300' },
  decreto: {
    rotulo: 'DECRETO / REGULAMENTO',
    cor: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  resolucao: {
    rotulo: 'RESOLUÇÃO CGIBS/CGSN',
    cor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  ato: { rotulo: 'ATO CONJUNTO', cor: 'bg-orange-100 text-orange-800 border-orange-300' },
  ref: { rotulo: 'REFERÊNCIA', cor: 'bg-slate-100 text-slate-700 border-slate-300' },
}

function Origem({ tipo, texto }: { tipo: keyof typeof ORIGENS; texto: string }) {
  const o = ORIGENS[tipo]
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${o.cor}`}
    >
      📎 {o.rotulo}: {texto}
    </span>
  )
}

function HeroSim({
  titulo,
  sub,
  teclas,
  capitulacao,
}: {
  titulo: string
  sub: string
  teclas: string
  capitulacao: string
}) {
  return (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-panorama-navy via-panorama-navy to-panorama-navy-light text-white shadow-lg">
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-lg bg-panorama-gold text-panorama-navy text-[11px] font-black tracking-wider">
            SIMULADOR
          </span>
          <span className="text-[11px] font-semibold text-white/70">{teclas}</span>
        </div>
        <h3 className="mt-2 text-xl sm:text-2xl font-bold tracking-tight">{titulo}</h3>
        <p className="mt-1.5 text-xs sm:text-sm text-white/80 leading-relaxed">{sub}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {capitulacao.split(' · ').map((c) => (
            <span
              key={c}
              className="px-2 py-0.5 rounded-md bg-white/10 border border-white/20 text-[10px] font-mono font-semibold"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function ModoChips<T extends string>({
  modos,
  modo,
  setModo,
}: {
  modos: { id: T; label: string; icone: string }[]
  modo: T
  setModo: (m: T) => void
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {modos.map((m, i) => (
        <button
          key={m.id}
          onClick={() => setModo(m.id)}
          className={`group relative px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
            modo === m.id
              ? 'bg-gradient-to-br from-panorama-navy to-panorama-navy-light text-white border-panorama-navy shadow-md'
              : 'bg-white border-slate-200 text-slate-700 hover:border-panorama-gold hover:bg-panorama-cream'
          }`}
        >
          <div className="text-base leading-none">{m.icone}</div>
          <div
            className={`mt-1 text-xs font-bold leading-tight ${modo === m.id ? 'text-white' : 'text-slate-800'}`}
          >
            {m.label}
          </div>
          <div
            className={`absolute top-1.5 right-1.5 px-1.5 rounded text-[9px] font-black ${modo === m.id ? 'bg-panorama-gold text-panorama-navy' : 'bg-slate-100 text-slate-400 group-hover:text-panorama-gold-dark'}`}
          >
            ⌥{i + 1}
          </div>
        </button>
      ))}
    </div>
  )
}

function useModoTeclado<T extends string>(setModo: (m: T) => void, ids: T[]) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey) return
      const n = Number(e.key)
      if (n >= 1 && n <= ids.length) {
        e.preventDefault()
        setModo(ids[n - 1])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setModo, ids])
}

function BlocoH({ n, titulo, capitulacao }: { n: string; titulo: string; capitulacao?: string }) {
  return (
    <div className="flex items-center gap-2 flex-wrap mb-2">
      <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-panorama-gold to-panorama-gold-dark text-panorama-navy font-black text-[11px] shadow-sm">
        {n}
      </span>
      <h4 className="text-sm font-bold text-slate-900">{titulo}</h4>
      {capitulacao && <Origem tipo="lei" texto={capitulacao} />}
    </div>
  )
}

function RodapeCapitulacao({ itens }: { itens: string[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold text-slate-900">
          📚 Capitulação legal — origem de cada cálculo
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {itens.map((it) => {
          const [tipo, texto] = it.split('|')
          return <Origem key={it} tipo={tipo as keyof typeof ORIGENS} texto={texto} />
        })}
      </div>
      <p className="mt-2 text-[10px] text-slate-500">
        Fontes monitoradas na rotina semanal (seg 11h) — atualizações registradas na Seção 13 —
        Histórico.
      </p>
    </div>
  )
}

/** Simulador do Regime Híbrido — compara Simples normal (DAS) × Simples híbrido (regime regular). */
const PARTILHA_ANOS: Record<string, number[]> = {
  '1ª–2ª faixa': [15.5, 15.5, 18.9, 22.3, 25.7, 29.1, 49.5],
  '3ª–5ª faixa': [15.5, 15.5, 18.85, 22.2, 25.55, 28.9, 49.0],
}
const IBS_ANOS = [0.1, 0.1, 0.3, 0.6, 0.9, 1.2, 19.11]
const ANOS_LABEL = ['2027', '2028', '2029', '2030', '2031', '2032', '2033']
const LIMITES_FAIXA = [
  'até R$ 180 mil',
  'R$ 180 mil – R$ 360 mil',
  'R$ 360 mil – R$ 720 mil',
  'R$ 720 mil – R$ 1,8 mi',
  'R$ 1,8 mi – R$ 3,6 mi (sublimite)',
  'R$ 3,6 mi – R$ 4,8 mi (teto)',
]

function Kpi({
  titulo,
  valor,
  sub,
  destaque,
}: {
  titulo: string
  valor: string
  sub: string
  destaque?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-3.5 transition-shadow hover:shadow-md ${destaque ? 'bg-gradient-to-br from-panorama-navy to-panorama-navy-light text-white border-panorama-navy shadow-md' : 'bg-white border-slate-200'}`}
    >
      <div
        className={`text-[10px] font-bold uppercase tracking-wider ${destaque ? 'text-panorama-gold-light' : 'text-slate-500'}`}
      >
        {titulo}
      </div>
      <div
        className={`mt-1 text-xl font-black tabular-nums ${destaque ? 'text-panorama-gold-light' : 'text-slate-900'}`}
      >
        {valor}
      </div>
      <div className={`mt-0.5 text-[11px] ${destaque ? 'text-white/70' : 'text-slate-500'}`}>
        {sub}
      </div>
    </div>
  )
}

function Badge({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${ok ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-red-50 text-red-700 border-red-300'}`}
    >
      {ok ? '✓' : '⚠'} {texto}
    </span>
  )
}

function SimuladorHibrido() {
  const [receita, setReceita] = useState(50000)
  const [anexo, setAnexo] = useState('I')
  const [faixa, setFaixa] = useState(2)
  const [custoPct, setCustoPct] = useState(50)
  const [cbsRef, setCbsRef] = useState(8.8)

  const A = ANEXOS[anexo]
  const rbt12 = [180000, 360000, 720000, 1800000, 3600000, 4800000][faixa]
  const efetiva = Math.max(0, (rbt12 * A.nominal[faixa] - A.deduz[faixa]) / rbt12)
  const partilha = A.partilha
  const aliHib = cbsRef + 0.1

  const creditoDasPct = (efetiva * partilha) / 100
  const hibLiquidoPct = aliHib * (1 - custoPct / 100)
  const difPct = hibLiquidoPct - creditoDasPct

  const dasCbsIbs = (receita * creditoDasPct) / 100
  const hibDebito = (receita * aliHib) / 100
  const hibCredCompras = (receita * (custoPct / 100) * aliHib) / 100
  const hibLiquido = hibDebito - hibCredCompras
  const difMes = hibLiquido - dasCbsIbs
  const difCredito = hibDebito - dasCbsIbs

  const grupoPartilha = faixa <= 1 ? PARTILHA_ANOS['1ª–2ª faixa'] : PARTILHA_ANOS['3ª–5ª faixa']
  const nomeGrupo = faixa <= 1 ? '1ª–2ª' : '3ª–5ª'

  return (
    <div className="space-y-5">
      <HeroSim
        titulo="Simulador do Regime Híbrido — DAS × regime regular"
        sub={
          'Recolher IBS/CBS dentro do DAS (Simples normal) × pelo regime regular (LC 214, art. 41, §3º). Premissas 2027–2028: partilha do anexo; CBS de referência ' +
          cbsRef.toFixed(1) +
          '% (editável) e IBS 0,1% (art. 344).'
        }
        teclas="Simulação única — resultados imediatos"
        capitulacao="LEI LC 214/2025, art. 41 §3º · LEI LC 123/2006, art. 13 §10 (red. LC 227/2026) · RESOLUÇÃO CGSN 190/2026, arts. 40-C/40-D"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <label className="block">
          <span className="text-xs font-semibold text-slate-700">Receita mensal (R$)</span>
          <input
            type="number"
            value={receita}
            min={0}
            onChange={(e) => setReceita(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-700">Anexo</span>
          <select
            value={anexo}
            onChange={(e) => setAnexo(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.keys(ANEXOS).map((k) => (
              <option key={k} value={k}>
                {ANEXOS[k].nome}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-700">Faixa (RBT12)</span>
          <select
            value={faixa}
            onChange={(e) => setFaixa(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {FAIXAS.map((f, i) => (
              <option key={i} value={i}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-700">
            % de custo com direito a crédito
          </span>
          <input
            type="number"
            value={custoPct}
            min={0}
            max={100}
            onChange={(e) => setCustoPct(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-700">CBS referência (%)</span>
          <input
            type="number"
            step="0.1"
            value={cbsRef}
            onChange={(e) => setCbsRef(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
      </div>

      <div>
        <h4 className="text-sm font-bold text-slate-900 mb-2">1️⃣ Percentuais do cenário</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi
            titulo="Alíquota efetiva (DAS)"
            valor={efetiva.toFixed(2) + '%'}
            sub={A.nome + ' · ' + FAIXAS[faixa]}
          />
          <Kpi
            titulo="Partilha CBS+IBS (DAS)"
            valor={partilha.toFixed(2) + '%'}
            sub="2027–2028 · Anexos XVIII–XXII"
          />
          <Kpi
            titulo="Crédito ao cliente (DAS)"
            valor={creditoDasPct.toFixed(2) + '%'}
            sub="efetiva × partilha (art. 47, §9º, II)"
          />
          <Kpi
            titulo="Alíquota híbrida"
            valor={aliHib.toFixed(1) + '%'}
            sub={'CBS ' + cbsRef.toFixed(1) + '% + IBS 0,1% · crédito integral'}
            destaque
          />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold text-slate-900 mb-2">
          2️⃣ Comparativo do mês (R$) — DAS × híbrido
        </h4>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                <th className="py-3 px-4">Indicador</th>
                <th className="py-3 px-4">📋 Simples normal (DAS)</th>
                <th className="py-3 px-4">🔀 Simples híbrido (regime regular)</th>
                <th className="py-3 px-3 w-44">Diferença (híbrido − DAS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/70 align-top bg-amber-50/40">
                <td className="py-3 px-4 font-semibold text-slate-900">
                  IBS + CBS a recolher (líquido)
                </td>
                <td className="py-3 px-4 text-slate-700">
                  {fmt(dasCbsIbs)}
                  <div className="text-[11px] text-slate-500">
                    sem crédito nas compras (art. 47, §9º, I)
                  </div>
                </td>
                <td className="py-3 px-4 text-slate-700">
                  {fmt(hibLiquido)}
                  <div className="text-[11px] text-slate-500">
                    débito {fmt(hibDebito)} − crédito compras {fmt(hibCredCompras)}
                  </div>
                </td>
                <td className="py-3 px-3">
                  <Badge
                    ok={difMes <= 0}
                    texto={(difMes <= 0 ? '− ' : '+ ') + fmt(Math.abs(difMes))}
                  />
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70 align-top">
                <td className="py-3 px-4 font-semibold text-slate-900">
                  Crédito que o cliente apropria
                </td>
                <td className="py-3 px-4 text-slate-700">
                  {fmt(dasCbsIbs)}
                  <div className="text-[11px] text-slate-500">limitado ao devido no DAS</div>
                </td>
                <td className="py-3 px-4 text-slate-700">
                  {fmt(hibDebito)}
                  <div className="text-[11px] text-slate-500">integral (art. 47, caput)</div>
                </td>
                <td className="py-3 px-3">
                  <Badge
                    ok={difCredito >= 0}
                    texto={(difCredito >= 0 ? '+ ' : '− ') + fmt(Math.abs(difCredito))}
                  />
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70 align-top">
                <td className="py-3 px-4 font-semibold text-slate-900">
                  Custo líquido (% da receita)
                </td>
                <td className="py-3 px-4 text-slate-700">{creditoDasPct.toFixed(2)}%</td>
                <td className="py-3 px-4 text-slate-700">{hibLiquidoPct.toFixed(2)}%</td>
                <td className="py-3 px-3">
                  <Badge
                    ok={difPct <= 0}
                    texto={(difPct <= 0 ? '− ' : '+ ') + Math.abs(difPct).toFixed(2) + ' p.p.'}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold text-slate-900 mb-2">
          3️⃣ Comparativo por faixa — {A.nome} (% da receita)
        </h4>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                <th className="py-3 px-3">Faixa</th>
                <th className="py-3 px-3">Limite (RBT12)</th>
                <th className="py-3 px-3">Efetiva no teto</th>
                <th className="py-3 px-3">Crédito DAS</th>
                <th className="py-3 px-3">Híbrido</th>
                <th className="py-3 px-3">Dif. custo líquido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {FAIXAS.map((f, i) => {
                const lim = [180000, 360000, 720000, 1800000, 3600000, 4800000][i]
                const e_i = Math.max(0, (lim * A.nominal[i] - A.deduz[i]) / lim)
                const cd_i = (e_i * partilha) / 100
                const dif_i = hibLiquidoPct - cd_i
                const atual = i === faixa
                return (
                  <tr
                    key={i}
                    className={
                      'align-top ' +
                      (atual ? 'bg-panorama-gold/10 font-semibold' : 'hover:bg-slate-50/70')
                    }
                  >
                    <td className="py-2.5 px-3 text-slate-900">
                      {f}
                      {atual ? ' ←' : ''}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{LIMITES_FAIXA[i]}</td>
                    <td className="py-2.5 px-3 text-slate-700">{e_i.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 text-slate-700">{cd_i.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 text-slate-700">{aliHib.toFixed(1)}%</td>
                    <td className="py-2.5 px-3">
                      <Badge
                        ok={dif_i <= 0}
                        texto={(dif_i <= 0 ? '− ' : '+ ') + Math.abs(dif_i).toFixed(2) + ' p.p.'}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Efetiva calculada no teto de cada faixa; 6ª faixa: alíquota nominal −0,1 p.p. em 2027–2028
          (art. 347). "Dif. custo líquido" = custo do híbrido − crédito DAS, em pontos percentuais
          da receita.
        </p>
      </div>

      <div>
        <h4 className="text-sm font-bold text-slate-900 mb-2">
          4️⃣ Transição ano a ano — {nomeGrupo} faixa (% da receita)
        </h4>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                <th className="py-3 px-3">Ano</th>
                <th className="py-3 px-3">Partilha CBS+IBS no DAS</th>
                <th className="py-3 px-3">Crédito DAS</th>
                <th className="py-3 px-3">Híbrido (CBS ref + IBS)</th>
                <th className="py-3 px-3">Diferença (p.p.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ANOS_LABEL.map((ano, i) => {
                const p = grupoPartilha[i]
                const cd = (efetiva * p) / 100
                const h = cbsRef + IBS_ANOS[i]
                const d = h - cd
                return (
                  <tr key={ano} className="hover:bg-slate-50/70 align-top">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{ano}</td>
                    <td className="py-2.5 px-3 text-slate-700">{p.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 text-slate-700">{cd.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 text-slate-700">{h.toFixed(2)}%</td>
                    <td className="py-2.5 px-3">
                      <Badge
                        ok={d >= 0}
                        texto={(d >= 0 ? '+ ' : '− ') + Math.abs(d).toFixed(2) + ' p.p.'}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Partilha dos Anexos XVIII–XXII da LC 214 (IBS: 0,17% em 2027–28; 3,35%→13,40% em 2029–32;
          33,50% em 2033, faixas 3ª–5ª; 1ª–2ª ligeiramente maior). IBS do híbrido: art. 344 (0,1% em
          2027–28; 0,3/0,6/0,9/1,2% em 2029–32) e pleno em 2033 (referência total 27,91% da Res.
          14/2026 − CBS ref estimada). 6ª faixa: tratamento próprio.
        </p>
      </div>

      <div>
        <h4 className="text-sm font-bold text-slate-900 mb-2">
          5️⃣ Faixas e limites do Simples Nacional
        </h4>
        <div className="p-3.5 rounded-lg bg-white border border-slate-200 flex flex-wrap gap-2">
          {FAIXAS.map((f, i) => (
            <span
              key={i}
              className={
                'px-2.5 py-1 rounded-full border text-[11px] font-semibold ' +
                (i === faixa
                  ? 'bg-panorama-navy text-panorama-gold-light border-panorama-navy'
                  : 'bg-slate-50 border-slate-300 text-slate-600')
              }
            >
              {f.split(' ')[0]} · {LIMITES_FAIXA[i]}
            </span>
          ))}
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Receita bruta em 12 meses (LC 123, art. 3º). Sublimite R$ 3,6 mi; teto R$ 4,8 mi. MEI
          (SIMEI): valores fixos mensais — não participa do híbrido.
        </p>
      </div>

      <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm">
        ℹ️ <strong>Leitura do resultado:</strong> o híbrido tende a compensar quando a carteira é
        B2B (cliente no regime regular aproveita crédito integral) e há custos creditáveis
        relevantes. Para venda a consumidor final, o modelo adiciona custo de controle sem retorno
        de crédito. O crédito presumido de PIS/Cofins (9,25%) que o cliente aproveitava até 2026 é
        extinto em 2027 nos dois cenários.
      </div>
      <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
        ⚠️ A alíquota de referência da CBS 2027 ainda depende de resolução do Senado (LC 214, art.
        349). O valor {cbsRef.toFixed(1)}% é estimativa de mercado (8,8% − 0,1 p.p. do art. 347) e é
        editável acima. Os percentuais de partilha seguem os Anexos XVIII–XXII da LC 214 (tabelas
        2027–2028).
      </div>

      <RodapeCapitulacao
        itens={[
          'lei|LC 214/2025 — art. 41, §3º (opção pelo regime regular)',
          'lei|LC 123/2006 — art. 13, §10 (red. LC 227/2026 — janelas)',
          'resolucao|Res. CGSN 190/2026 — arts. 40-C/40-D',
          'resolucao|Res. CGSN 194/2026 — janela 2026 até 30/10',
          'ref|Partilha — Anexos XVIII–XXII da LC 214/2025',
        ]}
      />
    </div>
  )
}

export function SectionSimples() {
  const [tab, setTab] = useState<'transicao' | 'regras' | 'hibrido'>('transicao')

  return (
    <section id="simples" className="scroll-mt-24 space-y-5">
      <div className="border-b-2 border-panorama-gold/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-panorama-navy text-panorama-gold-light font-bold text-xs ring-1 ring-panorama-gold/50">
            6E
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Simples Nacional — IBS e CBS no DAS e transição
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          Regime do Simples Nacional (LC 123, art. 13-A; LC 214/2025, arts. 343–347 e 444; Res. CGSN
          190–192/2026). Texto extraído da{' '}
          <a
            href="https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold text-panorama-navy"
          >
            LC 214 compilada do Planalto
          </a>{' '}
          (conferido em 04/10/2026).
        </p>
      </div>

      {/* Abas */}
      <div className="flex flex-wrap gap-1.5">
        <AbaButton ativo={tab === 'transicao'} onClick={() => setTab('transicao')}>
          📅 Transição (2026–2029+)
        </AbaButton>
        <AbaButton ativo={tab === 'regras'} onClick={() => setTab('regras')}>
          📋 Regras do regime
        </AbaButton>
        <AbaButton ativo={tab === 'hibrido'} onClick={() => setTab('hibrido')}>
          🧮 Simulação — regime híbrido
        </AbaButton>
      </div>

      {tab === 'transicao' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-lg bg-panorama-gold/10 border border-panorama-gold/50 text-sm text-slate-800">
            <strong>Regra central (art. 343):</strong> o <strong>IBS e a CBS</strong> devidos pelos
            optantes do Simples são recolhidos juntos no <strong>DAS</strong> (documento único), com
            alíquotas de teste na transição — 0,1% + 0,9% (2026), 0,1% + CBS −0,1 p.p. (2027–2028) e
            alíquotas plenas a partir de 2029.
          </div>
          <Tabela linhas={TRANSICAO} />
        </div>
      )}

      {tab === 'regras' && (
        <div className="space-y-3">
          <Tabela linhas={REGRAS} />
          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
            ⚠️ Sem documento fiscal com destaque do IBS/CBS, o adquirente não apropria crédito —
            exigência central para os optantes do Simples na transição.
          </div>
        </div>
      )}

      {tab === 'hibrido' && (
        <div className="space-y-4">
          <SimuladorHibrido />
          <div className="border-t-2 border-panorama-gold/60 pt-4">
            <h4 className="text-sm font-bold text-slate-900 mb-2">
              📆 Como e quando optar — forma e prazos (opção semestral, irretratável)
            </h4>
            <Tabela linhas={HIBRIDO_PRAZOS} />
          </div>
        </div>
      )}
    </section>
  )
}
