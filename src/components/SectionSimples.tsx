import { useState } from 'react'
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

/** Simulador do Regime Híbrido — compara Simples normal (DAS) × Simples híbrido (regime regular). */
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

  // Cenário A — DAS: crédito ao cliente = efetiva × partilha CBS+IBS (art. 47, §9º, II)
  const dasTotal = (receita * efetiva) / 100
  const dasCbsIbs = ((receita * efetiva * partilha) / 100 / 100) * 100 // efetiva × partilha
  const creditoDAS = ((receita * efetiva * partilha) / 10000) * 100 // = receita × efetiva × partilha /100
  // Cenário B — Híbrido: CBS ref (estimativa) + IBS 0,1% sobre receita; crédito sobre compras
  const aliHib = cbsRef + 0.1
  const hibDebito = (receita * aliHib) / 100
  const hibCreditoCompras = (((receita * custoPct) / 100) * aliHib) / 100
  const hibLiquido = hibDebito - hibCreditoCompras
  const creditoHib = hibDebito
  const difCusto = hibLiquido - dasCbsIbs
  const difCredito = creditoHib - creditoDAS

  return (
    <div className="space-y-4">
      <div className="p-3.5 rounded-lg bg-panorama-gold/10 border border-panorama-gold/50 text-sm text-slate-800">
        <strong>O que compara:</strong> recolher IBS/CBS <strong>dentro do DAS</strong> (Simples
        normal) × <strong>pelo regime regular</strong> (Simples híbrido — LC 214, art. 41, §3º).
        Premissas 2027–2028: partilha CBS+IBS do anexo; alíquota de referência da CBS estimada em{' '}
        <strong>{cbsRef.toFixed(1)}%</strong> (editável — a oficial depende de resolução do Senado)
        e IBS de <strong>0,1%</strong> (art. 344). Simulação didática — não substitui apuração
        contábil.
      </div>

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

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
              <th className="py-3 px-4">Indicador</th>
              <th className="py-3 px-4">📋 Simples normal (DAS)</th>
              <th className="py-3 px-4">🔀 Simples híbrido (regime regular)</th>
              <th className="py-3 px-3 w-36">Diferença (híbrido − DAS)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr className="hover:bg-slate-50/70 align-top">
              <td className="py-3 px-4 font-semibold text-slate-900">Alíquota aplicada</td>
              <td className="py-3 px-4 text-slate-700">
                Efetiva do DAS: <strong>{efetiva.toFixed(2)}%</strong> × partilha CBS+IBS{' '}
                <strong>{partilha.toFixed(2)}%</strong>
              </td>
              <td className="py-3 px-4 text-slate-700">
                CBS {cbsRef.toFixed(1)}% + IBS 0,1% = <strong>{aliHib.toFixed(1)}%</strong> (cheia,
                com destaque)
              </td>
              <td className="py-3 px-3 text-slate-600 font-mono">—</td>
            </tr>
            <tr className="hover:bg-slate-50/70 align-top bg-amber-50/40">
              <td className="py-3 px-4 font-semibold text-slate-900">IBS + CBS a recolher (mês)</td>
              <td className="py-3 px-4 text-slate-700">{fmt(dasCbsIbs)}</td>
              <td className="py-3 px-4 text-slate-700">
                {fmt(hibLiquido)}{' '}
                <span className="text-[11px] text-slate-500">
                  (débito {fmt(hibDebito)} − crédito compras {fmt(hibCreditoCompras)})
                </span>
              </td>
              <td className="py-3 px-3">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${
                    difCusto <= 0
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-red-100 text-red-800 border-red-300'
                  }`}
                >
                  {difCusto <= 0 ? '−' : '+'} {fmt(Math.abs(difCusto))}
                </span>
              </td>
            </tr>
            <tr className="hover:bg-slate-50/70 align-top">
              <td className="py-3 px-4 font-semibold text-slate-900">
                Crédito que o cliente (regime regular) apropria
              </td>
              <td className="py-3 px-4 text-slate-700">
                {fmt(creditoDAS)}{' '}
                <span className="text-[11px] text-slate-500">
                  (limitado ao devido no DAS — art. 47, §9º, II)
                </span>
              </td>
              <td className="py-3 px-4 text-slate-700">
                {fmt(creditoHib)}{' '}
                <span className="text-[11px] text-slate-500">(integral — art. 47, caput)</span>
              </td>
              <td className="py-3 px-3">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${
                    difCredito >= 0
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-red-100 text-red-800 border-red-300'
                  }`}
                >
                  {difCredito >= 0 ? '+' : '−'} {fmt(Math.abs(difCredito))}
                </span>
              </td>
            </tr>
            <tr className="hover:bg-slate-50/70 align-top">
              <td className="py-3 px-4 font-semibold text-slate-900">
                DAS total do mês (referência)
              </td>
              <td className="py-3 px-4 text-slate-700" colSpan={2}>
                {fmt(dasTotal)} (todos os tributos, alíquota efetiva {efetiva.toFixed(2)}%) — no
                híbrido, a parcela de CBS+IBS sai do DAS e vira guia própria
              </td>
              <td className="py-3 px-3 text-slate-600 font-mono">—</td>
            </tr>
          </tbody>
        </table>
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
