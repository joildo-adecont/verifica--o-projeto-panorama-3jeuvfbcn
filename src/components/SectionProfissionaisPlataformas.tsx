import { useEffect, useState } from 'react'
import { Calculator } from 'lucide-react'

const SIM_URL = '/simulador.html'

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

const PROFISSIONAIS = [
  {
    titulo: 'Redução de 30%',
    badge: '−30%',
    detalhe:
      'Serviços prestados por profissionais com atividade intelectual de natureza científica, literária ou artística, submetidos a conselho profissional: administradores, advogados, arquitetos e urbanistas, assistentes sociais, bibliotecários, biólogos, contabilistas, economistas, economistas domésticos, profissionais de educação física, engenheiros e agrônomos, estatísticos, médicos veterinários e zootecnistas, museólogos, químicos, profissionais de relações públicas, técnicos industriais e técnicos agrícolas (art. 127).',
    base: 'LC 214, art. 127',
    sim: 'serviços jurídicos',
  },
  {
    titulo: 'Requisitos da pessoa jurídica',
    badge: 'Requisitos',
    detalhe:
      'A redução vale para PJ que cumpra cumulativamente: sócios com habilitação relacionada ao objeto social e submetidos a conselho; sem sócio pessoa jurídica; não ser sócia de outra PJ; não exercer atividade diversa das habilitações; serviços da atividade-fim prestados diretamente pelos sócios, admitido o concurso de auxiliares (art. 127, §1º, II). União de diferentes profissionais é permitida, cada sócio na sua habilitação (§2º, II). A natureza jurídica e a forma de distribuição de lucros não impedem (§2º, I e III).',
    base: 'LC 214, art. 127, §1º–§2º',
  },
  {
    titulo: 'Exceção (educação física)',
    badge: 'Exceção',
    detalhe:
      'A regra dos §1º e §2º não se aplica à prestação de serviços por pessoa jurídica relacionada à profissão de profissional de educação física (art. 127, §3º).',
    base: 'LC 214, art. 127, §3º',
  },
]

const PLATAFORMAS = [
  {
    titulo: 'Responsabilidade solidária',
    badge: 'Solidária',
    detalhe:
      'Plataformas digitais — mesmo domiciliadas no exterior — respondem pelo IBS/CBS das operações realizadas por seu intermédio: (I) em substituição ao fornecedor estrangeiro, solidariamente com o adquirente; (II) solidariamente com o fornecedor nacional que não forneça as informações exigidas ou que, sendo contribuinte, não emita documento fiscal eletrônico no valor da operação (art. 22).',
    base: 'LC 214, art. 22',
  },
  {
    titulo: 'O que é plataforma digital',
    badge: 'Definição',
    detalhe:
      'Intermediária entre fornecedores e adquirentes em operações não presenciais/eletrônicas que controle ao menos um elemento essencial: cobrança, pagamento, definição de termos e condições ou entrega (art. 22, §1º).',
    base: 'LC 214, art. 22, §1º',
  },
  {
    titulo: 'O que NÃO é plataforma',
    badge: 'Exclusões',
    detalhe:
      'Acesso à internet; serviços de pagamento de instituições autorizadas pelo Banco Central; publicidade; busca ou comparação de fornecedores, desde que não cobre pelo serviço com base nas vendas realizadas (art. 22, §2º).',
    base: 'LC 214, art. 22, §2º',
  },
  {
    titulo: 'Fornecedor estrangeiro dispensado de inscrição',
    badge: 'Dispensa',
    detalhe:
      'Na hipótese de substituição (inciso I do caput), o fornecedor residente no exterior fica dispensado da inscrição (art. 22, §3º) — a plataforma é a responsável direta.',
    base: 'LC 214, art. 22, §3º',
  },
]

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

const REF_TOTAL = 27.91

function fmtP(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 })
}

function KpiP({
  titulo,
  valor,
  sub,
  destaque,
}: {
  titulo: string
  valor: string
  sub?: string
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
      {sub && (
        <div className={`mt-0.5 text-[11px] ${destaque ? 'text-white/70' : 'text-slate-500'}`}>
          {sub}
        </div>
      )}
    </div>
  )
}

function BadgeP({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${ok ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-amber-50 text-amber-700 border-amber-300'}`}
    >
      {ok ? '✓' : '⚠'} {texto}
    </span>
  )
}

const PROFISSOES = [
  { nome: 'Administradores', conselho: 'CRA', sim: 'serviços de administração' },
  { nome: 'Advogados', conselho: 'OAB', sim: 'serviços jurídicos' },
  { nome: 'Arquitetos e urbanistas', conselho: 'CAU', sim: 'serviços de arquitetura' },
  { nome: 'Assistentes sociais', conselho: 'CRESS', sim: 'serviços de assistência social' },
  { nome: 'Bibliotecários', conselho: 'CFB', sim: 'serviços de biblioteca' },
  { nome: 'Biólogos', conselho: 'CRBio', sim: 'serviços de biologia' },
  { nome: 'Contabilistas', conselho: 'CRC', sim: 'serviços contábeis' },
  { nome: 'Economistas', conselho: 'CORECON', sim: 'serviços de economia' },
  { nome: 'Economistas domésticos', conselho: 'CAE', sim: 'economia doméstica' },
  { nome: 'Profissionais de educação física', conselho: 'CREF', sim: 'educação física' },
  { nome: 'Engenheiros e agrônomos', conselho: 'CREA', sim: 'serviços de engenharia' },
  { nome: 'Estatísticos', conselho: 'CONRE', sim: 'estatística' },
  { nome: 'Médicos veterinários e zootecnistas', conselho: 'CRMV', sim: 'serviços veterinários' },
  { nome: 'Museólogos', conselho: 'COBRAMUSEO', sim: 'museologia' },
  { nome: 'Químicos', conselho: 'CRQ', sim: 'serviços de química' },
  { nome: 'Profissionais de relações públicas', conselho: 'CONRERP', sim: 'relações públicas' },
  { nome: 'Técnicos industriais', conselho: 'CREA', sim: 'técnico industrial' },
  { nome: 'Técnicos agrícolas', conselho: 'CREA', sim: 'técnico agrícola' },
]

const LINHA_TEMPO = [
  {
    ano: '2026',
    cbs: '0,9% (teste, compensável c/ PIS/Cofins — art. 346)',
    ibs: '0,1% (teste — art. 343)',
    efetiva: '≈ 0,10% × redução (não incide de fato)',
  },
  {
    ano: '2027',
    cbs: '8,8% (estimativa −0,1 p.p. art. 347)',
    ibs: '0,05%+0,05% (teste — art. 344)',
    efetiva: '≈ 8,90% × 0,70 = 6,23%',
  },
  {
    ano: '2028',
    cbs: '8,8% (estimativa)',
    ibs: '0,05%+0,05% (teste)',
    efetiva: '≈ 8,90% × 0,70 = 6,23%',
  },
  {
    ano: '2029',
    cbs: '8,8% (estimativa)',
    ibs: '19,11% × 10% = 1,91%',
    efetiva: '≈ 10,71% × 0,70 = 7,50%',
  },
  {
    ano: '2030',
    cbs: '8,8% (estimativa)',
    ibs: '19,11% × 40% = 7,64%',
    efetiva: '≈ 16,44% × 0,70 = 11,51%',
  },
  {
    ano: '2031',
    cbs: '8,8% (estimativa)',
    ibs: '19,11% × 70% = 13,38%',
    efetiva: '≈ 22,18% × 0,70 = 15,53%',
  },
  {
    ano: '2032',
    cbs: '8,8% (estimativa)',
    ibs: '19,11% × 90% = 17,20%',
    efetiva: '≈ 26,00% × 0,70 = 18,20%',
  },
  {
    ano: '2033',
    cbs: '8,8% (estimativa)',
    ibs: '19,11% (pleno)',
    efetiva: '27,91% × 0,70 = 19,54%',
  },
]

function SimuladorProfissionais() {
  const [profissao, setProfissao] = useState('Advogados')
  const [tipoPrestador, setTipoPrestador] = useState<'pf' | 'pj'>('pj')
  const [receitaMes, setReceitaMes] = useState(50000)
  const [requisitosOk, setRequisitosOk] = useState(true)
  const [ano, setAno] = useState(2027)

  const prof = PROFISSOES.find((p) => p.nome === profissao)!
  const aliCheia = REF_TOTAL
  const cbsRef = 8.8
  const ibsRef = REF_TOTAL - cbsRef
  const reducaoOk = tipoPrestador === 'pf' || requisitosOk
  const aliEfetiva = reducaoOk ? aliCheia * 0.7 : aliCheia
  const base = receitaMes
  const ibsCbs = (base * aliEfetiva) / 100
  const ibsCbsAno = ibsCbs * 12

  // transição do ano selecionado
  const lt = LINHA_TEMPO.find((l) => l.ano === String(ano))
  const aliAno = lt ? aliCheia * 0.7 : aliEfetiva

  const requisitosLinhas = [
    {
      req: 'Sócios com habilitação profissional relacionada ao objeto social, submetidos a conselho',
      aplicavel: tipoPrestador === 'pj',
      base: 'art. 127, §1º, II, a',
    },
    {
      req: 'Sem sócio pessoa jurídica',
      aplicavel: tipoPrestador === 'pj',
      base: 'art. 127, §1º, II, b',
    },
    {
      req: 'Não ser sócia de outra pessoa jurídica',
      aplicavel: tipoPrestador === 'pj',
      base: 'art. 127, §1º, II, c',
    },
    {
      req: 'Não exercer atividade diversa das habilitações dos sócios',
      aplicavel: tipoPrestador === 'pj',
      base: 'art. 127, §1º, II, d',
    },
    {
      req: 'Serviços da atividade-fim prestados diretamente pelos sócios (auxiliares admitidos)',
      aplicavel: tipoPrestador === 'pj',
      base: 'art. 127, §1º, II, e',
    },
    {
      req: 'Serviços vinculados à habilitação profissional',
      aplicavel: tipoPrestador === 'pf',
      base: 'art. 127, §1º, I',
    },
    {
      req: 'União de profissionais diferentes é permitida (cada sócio na sua habilitação)',
      aplicavel: tipoPrestador === 'pj',
      base: 'art. 127, §2º, II',
    },
    {
      req: 'Natureza jurídica e distribuição de lucros não impedem a redução',
      aplicavel: tipoPrestador === 'pj',
      base: 'art. 127, §2º, I e III',
    },
  ]

  return (
    <div className="space-y-5">
      <HeroSim
        titulo="Simulador de Profissões Regulamentadas"
        sub="Alíquotas reduzidas em 30% (efetiva = referência 27,91% × 0,70 = 19,54%) para as 18 profissões regulamentadas. PF: serviços vinculados à habilitação (§1º, I). PJ: requisitos cumulativos (§1º, II)."
        teclas="Selecione a profissão e o ano — apuração imediata"
        capitulacao="LEI LC 214/2025, art. 127 (caput e §§1º–3º) · RESOLUÇÃO CGIBS 14/2026 (ref. 27,91%) · ARTS. 343–347 e 295–296 (transição)"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="block">
          <span className="text-xs font-semibold text-slate-700">Profissão</span>
          <select
            value={profissao}
            onChange={(e) => setProfissao(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PROFISSOES.map((p) => (
              <option key={p.nome} value={p.nome}>
                {p.nome} ({p.conselho})
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-700">Prestador</span>
          <select
            value={tipoPrestador}
            onChange={(e) => setTipoPrestador(e.target.value as 'pf' | 'pj')}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pf">Pessoa física (§1º, I)</option>
            <option value="pj">Pessoa jurídica (§1º, II)</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-700">
            Receita mensal com os serviços (R$)
          </span>
          <input
            type="number"
            value={receitaMes}
            min={0}
            onChange={(e) => setReceitaMes(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        {tipoPrestador === 'pj' && (
          <label className="flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              checked={requisitosOk}
              onChange={(e) => setRequisitosOk(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-xs font-semibold text-slate-700">
              Cumpre os requisitos cumulativos do §1º, II
            </span>
          </label>
        )}
      </div>

      <div>
        <BlocoH n="1" titulo={'Apuração do tributo — ' + profissao} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiP
            titulo="Alíquota de referência"
            valor={aliCheia.toFixed(2) + '%'}
            sub={`CBS ${cbsRef.toFixed(2)}% + IBS ${ibsRef.toFixed(2)}%`}
          />
          <KpiP
            titulo="Redução do art. 127"
            valor={reducaoOk ? '−30%' : 'Sem redução'}
            sub={reducaoOk ? 'profissional regulamentado' : 'requisitos do §1º, II não cumpridos'}
          />
          <KpiP
            titulo="Alíquota efetiva"
            valor={aliEfetiva.toFixed(2) + '%'}
            sub="27,91% × 0,70"
            destaque
          />
          <KpiP
            titulo="IBS+CBS a recolher (mês)"
            valor={fmtP(ibsCbs)}
            sub={`${fmtP(ibsCbsAno)}/ano`}
          />
        </div>
      </div>

      <div>
        <BlocoH n="2" titulo="⃣ Base de cálculo — passo a passo" capitulacao="art. 127, caput" />
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                <th className="py-3 px-4">Passo</th>
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4">Valor</th>
                <th className="py-3 px-3 w-52">Base legal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/70">
                <td className="py-2.5 px-4 font-bold text-slate-400">1</td>
                <td className="py-2.5 px-4 font-semibold text-slate-900">
                  Receita mensal com os serviços
                </td>
                <td className="py-2.5 px-4 text-slate-700 font-mono">{fmtP(base)}</td>
                <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                  art. 127, caput (prestação de serviços)
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="py-2.5 px-4 font-bold text-slate-400">2</td>
                <td className="py-2.5 px-4 font-semibold text-slate-900">Enquadramento</td>
                <td className="py-2.5 px-4 font-mono">
                  {reducaoOk ? 'Redução −30%' : 'Sem redução (requisitos)'}
                </td>
                <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                  {tipoPrestador === 'pf' ? 'art. 127, §1º, I' : 'art. 127, §1º, II'}
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="py-2.5 px-4 font-bold text-slate-400">×</td>
                <td className="py-2.5 px-4 font-semibold text-slate-900">Alíquota efetiva</td>
                <td className="py-2.5 px-4 text-slate-700 font-mono">{aliEfetiva.toFixed(2)}%</td>
                <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                  art. 127, caput
                </td>
              </tr>
              <tr className="bg-panorama-navy text-white">
                <td className="py-2.5 px-4 font-bold text-panorama-gold-light">=</td>
                <td className="py-2.5 px-4 font-bold">IBS + CBS a recolher (mensal)</td>
                <td className="py-2.5 px-4 font-bold font-mono text-panorama-gold-light">
                  {fmtP(ibsCbs)}
                </td>
                <td className="py-2.5 px-3 text-[11px] font-mono text-white/70">art. 127, caput</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <BlocoH
          n="3"
          titulo={
            'Requisitos por profissão — checklist ' + (tipoPrestador === 'pf' ? '(PF)' : '(PJ)')
          }
        />
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                <th className="py-3 px-3">Requisito</th>
                <th className="py-3 px-3">Aplicável</th>
                <th className="py-3 px-3 w-44">Base legal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requisitosLinhas.map((l, i) => (
                <tr key={i} className="hover:bg-slate-50/70 align-top">
                  <td className="py-2.5 px-3 text-slate-900 font-semibold">{l.req}</td>
                  <td className="py-2.5 px-3">
                    <BadgeP ok texto={l.aplicavel ? 'Sim' : '—'} />
                  </td>
                  <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">{l.base}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <BlocoH
          n="4"
          titulo="⃣ Simulação por profissão — as 18 do art. 127 (mesma receita)"
          capitulacao="art. 127, caput (18 profissões)"
        />
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                <th className="py-3 px-3">Profissão</th>
                <th className="py-3 px-3">Conselho</th>
                <th className="py-3 px-3">Alíquota efetiva</th>
                <th className="py-3 px-3">IBS+CBS (mês)</th>
                <th className="py-3 px-3">IBS+CBS (ano)</th>
                <th className="py-3 px-3">Simular</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PROFISSOES.map((p) => (
                <tr
                  key={p.nome}
                  className={
                    'align-top ' +
                    (p.nome === profissao
                      ? 'bg-panorama-gold/10 font-semibold'
                      : 'hover:bg-slate-50/70')
                  }
                >
                  <td className="py-2.5 px-3 text-slate-900">
                    {p.nome}
                    {p.nome === profissao ? ' ←' : ''}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700">{p.conselho}</td>
                  <td className="py-2.5 px-3 text-slate-700 font-mono">{aliEfetiva.toFixed(2)}%</td>
                  <td className="py-2.5 px-3 text-slate-700 font-mono">
                    {fmtP((receitaMes * aliEfetiva) / 100)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 font-mono">
                    {fmtP((receitaMes * aliEfetiva * 12) / 100)}
                  </td>
                  <td className="py-2.5 px-3">
                    <button
                      onClick={() => setProfissao(p.nome)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-panorama-navy hover:text-panorama-gold-dark cursor-pointer"
                    >
                      🧮 Simular
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <BlocoH
          n="5"
          titulo="⃣ Implantação na linha do tempo (2026–2033)"
          capitulacao="arts. 343–347 e 295–296 (LC 214/2025)"
        />
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                <th className="py-3 px-3">Ano</th>
                <th className="py-3 px-3">CBS</th>
                <th className="py-3 px-3">IBS</th>
                <th className="py-3 px-3">Efetiva c/ −30%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {LINHA_TEMPO.map((l) => (
                <tr
                  key={l.ano}
                  className={
                    'align-top ' +
                    (l.ano === String(ano)
                      ? 'bg-panorama-gold/10 font-semibold'
                      : 'hover:bg-slate-50/70')
                  }
                >
                  <td className="py-2.5 px-3 text-slate-900 font-bold">{l.ano}</td>
                  <td className="py-2.5 px-3 text-slate-700">{l.cbs}</td>
                  <td className="py-2.5 px-3 text-slate-700">{l.ibs}</td>
                  <td className="py-2.5 px-3 text-slate-700 font-mono">{l.efetiva}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Ano selecionado: <strong>{ano}</strong> — alíquota efetiva com redução:{' '}
          <strong>{aliAno.toFixed(2)}%</strong>. IBS 2029–2033: partilha 10-40-70-90-100% (arts.
          295–296). CBS 2027: estimativa 8,8% (−0,1 p.p. do art. 347) — resolução do Senado pendente
          (art. 349).
        </p>
        <div className="mt-2 flex gap-1.5 flex-wrap">
          {LINHA_TEMPO.map((l) => (
            <button
              key={l.ano}
              onClick={() => setAno(Number(l.ano))}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${ano === Number(l.ano) ? 'bg-panorama-navy text-panorama-gold-light border-panorama-navy' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'}`}
            >
              {l.ano}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
        ⚠️ <strong>Exceção do §3º:</strong> a regra dos §§1º-2º (requisitos da PJ) NÃO se aplica à
        profissão de educação física (inciso X) — PJ submetida a conselho tem a redução sem os
        requisitos. <strong>Atualização automática:</strong> os valores e a base legal deste
        simulador seguem a rotina semanal de fontes oficiais (segundas-feiras, 11h) — mudanças em
        legislação ou regulamento entram na Seção 13 — Histórico de Atualizações.
      </div>

      <RodapeCapitulacao
        itens={[
          'lei|LC 214/2025 — art. 127 (profissões regulamentadas)',
          'resolucao|Res. CGIBS 14/2026 — referência 27,91%',
          'ref|Transição — arts. 343–347 e 295–296 (LC 214/2025)',
        ]}
      />
    </div>
  )
}

function SimuladorPlataformas() {
  const [fornecedor, setFornecedor] = useState<'estrangeiro' | 'nacional-contrib' | 'nacional-nc'>(
    'estrangeiro',
  )
  const [receitaMes, setReceitaMes] = useState(100000)
  const [emiteDoc, setEmiteDoc] = useState(true)
  const [informa, setInforma] = useState(true)
  const [split, setSplit] = useState(true)
  const [produto, setProduto] = useState<'regular' | 'cesta' | 'reducao60' | 'servico'>('regular')

  const aliCheia = REF_TOTAL
  const cbsRef = 8.8
  const ibsRef = REF_TOTAL - cbsRef
  const fatores: Record<string, number> = { regular: 1, cesta: 0, reducao60: 0.4, servico: 1 }
  const fator = fatores[produto]
  const aliProduto = aliCheia * fator
  const ibsCbsProduto = (receitaMes * aliProduto) / 100

  // Responsabilidade da plataforma
  const responsavel =
    fornecedor === 'estrangeiro'
      ? 'Plataforma (substituição — inciso I)'
      : fornecedor === 'nacional-contrib' && (!emiteDoc || !informa)
        ? 'Plataforma (solidária — inciso II, a/b)'
        : 'Fornecedor nacional (plataforma sem responsabilidade)'
  const semResponsabilidade = fornecedor === 'nacional-contrib' && emiteDoc && informa && split

  const respLinhas = [
    {
      hip: 'Fornecedor residente/domiciliado NO EXTERIOR',
      resp: 'Plataforma responde em SUBSTITUIÇÃO, solidariamente com o adquirente',
      base: 'art. 22, caput, I',
      plataforma: true,
    },
    {
      hip: 'Fornecedor nacional que NÃO fornece as informações (§5º)',
      resp: 'Plataforma responde SOLIDARIAMENTE',
      base: 'art. 22, caput, II, a',
      plataforma: true,
    },
    {
      hip: 'Fornecedor nacional contribuinte que NÃO emite documento fiscal eletrônico no valor da operação',
      resp: 'Plataforma responde SOLIDARIAMENTE',
      base: 'art. 22, caput, II, b, 1-2',
      plataforma: true,
    },
    {
      hip: 'Fornecedor nacional contribuinte que emite documento e informa',
      resp: 'Sem responsabilidade adicional da plataforma (se split payment disponível e informado)',
      base: 'art. 22, §7º',
      plataforma: false,
    },
    {
      hip: 'Fornecedor nacional NÃO contribuinte (consumidor final eventual)',
      resp: 'Sem responsabilidade da plataforma — fornecedor não é contribuinte',
      base: 'art. 22, caput, II',
      plataforma: false,
    },
    {
      hip: 'Plataforma que NÃO controla nenhum elemento essencial (cobrança/pagamento/termos/entrega)',
      resp: 'NÃO é plataforma digital — sem responsabilidade tributária',
      base: 'art. 22, §1º e §11',
      plataforma: false,
    },
  ]

  const obrigLinhas = [
    {
      quem: 'Plataforma digital',
      tipo: 'INFORMAÇÃO',
      oque: 'Apresentar ao CGIBS/RFB informações sobre as operações e importações por seu intermédio, identificando o fornecedor, ainda que não contribuinte (§5º)',
    },
    {
      quem: 'Plataforma digital',
      tipo: 'SPLIT PAYMENT',
      oque: 'Se inicia o pagamento, apresentar as informações para segregação e recolhimento do IBS/CBS do fornecedor na liquidação financeira (§6º)',
    },
    {
      quem: 'Plataforma digital',
      tipo: 'OPÇÃO',
      oque: 'Emitir documentos fiscais em nome do fornecedor (inclusive consolidados) e pagar o IBS/CBS com base na operação intermediada (§12); pode ser substituta tributária com anuência do fornecedor (§13, LC 227/2026)',
    },
    {
      quem: 'Fornecedor estrangeiro',
      tipo: 'DISPENSA',
      oque: 'Dispensado de inscrição se opera exclusivamente por plataforma inscrita no regime regular (§3º)',
    },
    {
      quem: 'Fornecedor nacional contribuinte',
      tipo: 'OBRIGAÇÃO',
      oque: 'Emitir documento fiscal eletrônico no valor da operação e fornecer as informações — evita a solidariedade da plataforma (caput, II)',
    },
    {
      quem: 'Fornecedor nacional não contribuinte',
      tipo: '—',
      oque: 'Sem obrigação de documento fiscal; a plataforma informa as operações (§5º)',
    },
    {
      quem: 'CGIBS/RFB',
      tipo: 'ATRIBUIÇÃO',
      oque: 'Informar à plataforma a condição de contribuinte do fornecedor nacional não inscrito (§4º)',
    },
  ]

  const produtosLinhas = [
    {
      grupo: 'Produto/serviço regular (sem benefício)',
      fator: '100%',
      ali: '27,91%',
      base: 'LC 214, arts. 46-49',
    },
    {
      grupo: 'Cesta básica nacional de alimentos (Anexo I)',
      fator: 'Zero',
      ali: '0%',
      base: 'LC 214, art. 86 e Anexo I',
    },
    {
      grupo: 'Educação, saúde, dispositivos, medicamentos, alimentos (−60%)',
      fator: '40%',
      ali: '11,16%',
      base: 'LC 214, art. 128 e Anexos',
    },
    {
      grupo: 'Serviço regular (ex.: streaming, SaaS)',
      fator: '100%',
      ali: '27,91%',
      base: 'LC 214, arts. 46-49',
    },
  ]

  return (
    <div className="space-y-5">
      <HeroSim
        titulo="Simulador de Plataformas Digitais"
        sub="A plataforma responde pelo IBS/CBS das operações por seu intermédio quando o fornecedor é ESTRANGEIRO (substituição) ou nacional SEM documento fiscal / SEM informações (solidariedade). O tributo segue as regras do fornecedor (§10)."
        teclas="Selecione o perfil do fornecedor — responsabilidade imediata"
        capitulacao="LEI LC 214/2025, art. 22 · LEI LC 227/2026 (§§7º, 10–13) · RIBS Res. CGIBS 6/2026 (regulamentação)"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="block">
          <span className="text-xs font-semibold text-slate-700">Perfil do fornecedor</span>
          <select
            value={fornecedor}
            onChange={(e) =>
              setFornecedor(e.target.value as 'estrangeiro' | 'nacional-contrib' | 'nacional-nc')
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="estrangeiro">Residente/domiciliado no exterior</option>
            <option value="nacional-contrib">Nacional contribuinte (regime regular)</option>
            <option value="nacional-nc">Nacional não contribuinte</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-700">
            Receita mensal da operação (R$)
          </span>
          <input
            type="number"
            value={receitaMes}
            min={0}
            onChange={(e) => setReceitaMes(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-700">
            Produto/serviço comercializado
          </span>
          <select
            value={produto}
            onChange={(e) =>
              setProduto(e.target.value as 'regular' | 'cesta' | 'reducao60' | 'servico')
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="regular">Produto regular</option>
            <option value="cesta">Cesta básica (zero)</option>
            <option value="reducao60">Educação/saúde/medicamento (−60%)</option>
            <option value="servico">Serviço regular (SaaS/streaming)</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={emiteDoc}
            onChange={(e) => setEmiteDoc(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-xs font-semibold text-slate-700">
            Fornecedor emite documento fiscal eletrônico
          </span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={informa}
            onChange={(e) => setInforma(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-xs font-semibold text-slate-700">
            Fornecedor fornece as informações (§5º)
          </span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={split}
            onChange={(e) => setSplit(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-xs font-semibold text-slate-700">
            Split payment disponível na liquidação (§6º)
          </span>
        </label>
      </div>

      <div>
        <BlocoH n="1" titulo="⃣ Percentuais e valores do cenário" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiP
            titulo="Alíquota do produto/serviço"
            valor={aliProduto.toFixed(2) + '%'}
            sub={
              produto === 'cesta'
                ? 'zero — cesta básica'
                : produto === 'reducao60'
                  ? '27,91% × 0,40 (−60%)'
                  : 'referência 27,91%'
            }
            destaque
          />
          <KpiP
            titulo="Receita mensal"
            valor={fmtP(receitaMes)}
            sub="operação intermediada pela plataforma"
          />
          <KpiP
            titulo="IBS+CBS da operação (mês)"
            valor={fmtP(ibsCbsProduto)}
            sub={`${fmtP(ibsCbsProduto * 12)}/ano`}
          />
          <KpiP
            titulo="Responsável pelo pagamento"
            valor={responsavel}
            sub={semResponsabilidade ? 'plataforma sem responsabilidade (§7º)' : 'art. 22, caput'}
          />
        </div>
      </div>

      <div>
        <BlocoH
          n="2"
          titulo="⃣ Responsabilidade da plataforma — mapa do art. 22"
          capitulacao="art. 22, caput e §§7º, 10–11"
        />
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                <th className="py-3 px-3">Hipótese</th>
                <th className="py-3 px-3">Responsabilidade</th>
                <th className="py-3 px-3">Plataforma responde?</th>
                <th className="py-3 px-3 w-44">Base legal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {respLinhas.map((l, i) => (
                <tr key={i} className="hover:bg-slate-50/70 align-top">
                  <td className="py-2.5 px-3 text-slate-900 font-semibold">{l.hip}</td>
                  <td className="py-2.5 px-3 text-slate-700 leading-relaxed">{l.resp}</td>
                  <td className="py-2.5 px-3">
                    <BadgeP ok={!l.plataforma} texto={l.plataforma ? 'Sim' : 'Não'} />
                  </td>
                  <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">{l.base}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <BlocoH
          n="3"
          titulo="⃣ Obrigações — plataforma × fornecedor"
          capitulacao="art. 22, §§3º–6º, 12º–13º (LC 214/227)"
        />
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                <th className="py-3 px-3">Quem</th>
                <th className="py-3 px-3">Tipo</th>
                <th className="py-3 px-3">Obrigação / direito</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {obrigLinhas.map((l, i) => (
                <tr key={i} className="hover:bg-slate-50/70 align-top">
                  <td className="py-2.5 px-3 text-slate-900 font-semibold">{l.quem}</td>
                  <td className="py-2.5 px-3">
                    <BadgeP ok texto={l.tipo} />
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 leading-relaxed">{l.oque}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <BlocoH
          n="4"
          titulo="⃣ Tributação dos produtos/serviços comercializados — alíquotas e base legal"
          capitulacao="art. 22, §10, II + Anexos"
        />
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                <th className="py-3 px-3">Grupo do produto/serviço</th>
                <th className="py-3 px-3">Fator</th>
                <th className="py-3 px-3">Alíquota</th>
                <th className="py-3 px-3 w-48">Base legal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {produtosLinhas.map((l, i) => (
                <tr key={i} className="hover:bg-slate-50/70 align-top">
                  <td className="py-2.5 px-3 text-slate-900 font-semibold">{l.grupo}</td>
                  <td className="py-2.5 px-3 text-slate-700">{l.fator}</td>
                  <td className="py-2.5 px-3 text-slate-700 font-mono">{l.ali}</td>
                  <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">{l.base}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          O tributo da operação intermediada segue as <strong>regras do fornecedor</strong> (regime
          regular ou favorecido — art. 22, §10, II), inclusive regimes diferenciados/específicos do
          bem. Na solidariedade, a plataforma responde solidariamente pelos débitos do fornecedor
          inscrito (§10, I). A plataforma não responde por diferenças quando o split payment é
          possível e as informações são apresentadas (§7º). Consulta item a item no{' '}
          <a href="/tabela-geral" className="underline font-semibold">
            Índice das fontes e tabela geral (7A)
          </a>
          .
        </p>
      </div>

      <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
        ⚠️{' '}
        <strong>
          Pontos que dependem das próximas edições legislativas (monitorados na rotina semanal):
        </strong>{' '}
        (1) alíquota de referência da CBS 2027 — resolução do Senado (LC 214, art. 349); (2) IBS
        19,11% — Res. CGIBS 14/2026; (3) forma e leiaute das informações da plataforma ao CGIBS/RFB
        (§5º) e as regras do split payment (§6º) dependem de regulamento (RIBS — Res. CGIBS 6/2026);
        (4) critérios da opção de emitir documentos em nome do fornecedor e da substituição
        tributária (§§12-13, LC 227/2026) dependem de regulamento.{' '}
        <strong>Atualização automática:</strong> mudanças entram na Seção 13 — Histórico de
        Atualizações.
      </div>

      <RodapeCapitulacao
        itens={[
          'lei|LC 214/2025 — art. 22 (plataformas digitais)',
          'lei|LC 227/2026 — §§7º, 10–13 (responsabilidade)',
          'resolucao|RIBS Res. CGIBS 6/2026 — regulamentação',
        ]}
      />
    </div>
  )
}

export function SectionProfissionaisPlataformas() {
  const [tab, setTab] = useState<
    'profissionais' | 'plataformas' | 'simulador-prof' | 'simulador-plat'
  >('profissionais')

  return (
    <section id="profissionais-plataformas" className="scroll-mt-24 space-y-5">
      <div className="border-b-2 border-panorama-gold/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-panorama-navy text-panorama-gold-light font-bold text-xs ring-1 ring-panorama-gold/50">
            6F
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Profissionais regulamentados e plataformas digitais
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          Regime diferenciado dos profissionais (LC 214/2025, art. 127) e responsabilidade das
          plataformas (art. 22). Texto extraído da{' '}
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
        <AbaButton ativo={tab === 'profissionais'} onClick={() => setTab('profissionais')}>
          ⚖️ Profissionais regulamentados
        </AbaButton>
        <AbaButton ativo={tab === 'plataformas'} onClick={() => setTab('plataformas')}>
          📱 Plataformas digitais
        </AbaButton>
        <AbaButton ativo={tab === 'simulador-prof'} onClick={() => setTab('simulador-prof')}>
          🧮 Simulador de profissões
        </AbaButton>
        <AbaButton ativo={tab === 'simulador-plat'} onClick={() => setTab('simulador-plat')}>
          🧮 Simulador de plataformas
        </AbaButton>
      </div>

      {tab === 'profissionais' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-lg bg-panorama-gold/10 border border-panorama-gold/50 text-sm text-slate-800">
            <strong>Regra central (art. 127):</strong> redução de <strong>30%</strong> nas alíquotas
            — com requisitos objetivos para a pessoa jurídica.
          </div>
          <Tabela linhas={PROFISSIONAIS} />
        </div>
      )}

      {tab === 'plataformas' && (
        <div className="space-y-3">
          <Tabela linhas={PLATAFORMAS} />
          <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm">
            ℹ️ Fornecedor estrangeiro: dispensado de inscrição quando a plataforma responde em
            substituição (art. 22, §3º) — a plataforma é a responsável direta.
          </div>
        </div>
      )}

      {tab === 'simulador-prof' && <SimuladorProfissionais />}
      {tab === 'simulador-plat' && <SimuladorPlataformas />}
    </section>
  )
}
