import { useState, useMemo } from 'react'
import {
  Users,
  Briefcase,
  ShieldCheck,
  HeartHandshake,
  HardHat,
  ExternalLink,
  ArrowRight,
  Scale,
  Search,
  MapPin,
  Building2,
  UsersRound,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Layers,
  BookOpen,
  Bot,
  ChevronDown,
} from 'lucide-react'
import {
  MATERIAS_RH,
  RAMOS_SINDICAIS,
  SINDICATOS_POR_UF,
  NOMES_UF,
  TOTAL_SINDICATOS,
  ABRANGENCIA_SINDICAL,
  FONTES_RH,
  NOTA_REFORMA_E_RH,
} from '@/data/rhTrabalhista'

/**
 * RECURSOS HUMANOS — Seção 28 (novo setor, pedido do CEO em 02/11/2026)
 * =====================================================================
 *
 * O que esta tela entrega, na ordem em que o CEO pediu:
 *  1. Um SETOR com ícone próprio dentro da Plataforma Contábil.
 *  2. Quatro SUB-ÍCONES (matérias): trabalhista, previdenciária, sindical e
 *     normas regulamentadoras — cada um com os seus diplomas.
 *  3. BUSCA nas fontes oficiais, com o endereço certo de cada órgão.
 *  4. Os SINDICATOS de todo o país, por categoria/ramo e por estado, com a
 *     base territorial e a abrangência — a partir da base real do MTE.
 *  5. Acionamento do ESPECIALISTA (agente nativo) com a consulta já montada.
 *
 * ── POR QUE NÃO HÁ CAMPO DE BUSCA LIVRE AQUI ──
 * A tentação é pôr uma caixa de texto e mandar para o Google. Seria mentira: o
 * que o sistema tem é (a) o catálogo verificado das fontes oficiais e (b) o
 * agente especialista, que consulta Senado, DOU e Câmara de verdade. A busca
 * livre manda a consulta para o agente; o catálogo diz onde conferir.
 */

const ICONES: Record<string, React.ComponentType<{ className?: string }>> = {
  trabalhista: Briefcase,
  previdenciario: HeartHandshake,
  sindical: UsersRound,
  'normas-regulamentadoras': HardHat,
}

type Aba = 'materias' | 'sindicatos' | 'fontes' | 'reforma'

export function SectionRecursosHumanos() {
  const [aba, setAba] = useState<Aba>('materias')
  const [materiaAberta, setMateriaAberta] = useState<string>('trabalhista')
  const [ufFiltro, setUfFiltro] = useState<string>('')
  const [ramoFiltro, setRamoFiltro] = useState<string>('')
  const [buscaSindicato, setBuscaSindicato] = useState('')

  const totalFiltrado = useMemo(() => {
    if (ufFiltro) return SINDICATOS_POR_UF[ufFiltro] || 0
    if (ramoFiltro) {
      const r = RAMOS_SINDICAIS.find((x) => x.ramo === ramoFiltro)
      return r ? r.total : 0
    }
    return TOTAL_SINDICATOS
  }, [ufFiltro, ramoFiltro])

  const ramosVisiveis = useMemo(() => {
    const termo = buscaSindicato
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
    return RAMOS_SINDICAIS.filter((r) => {
      if (!termo) return true
      const alvo = r.ramo
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
      return alvo.includes(termo)
    })
  }, [buscaSindicato])

  /** Manda a consulta para o agente contábil, já com o contexto do setor. */
  const consultarEspecialista = (texto: string) => {
    const q = encodeURIComponent(texto)
    window.location.hash = `#agente-contabil?q=${q}`
  }

  const abas: [Aba, string, React.ComponentType<{ className?: string }>][] = [
    ['materias', 'Matérias e diplomas', Layers],
    ['sindicatos', 'Sindicatos do país', UsersRound],
    ['fontes', 'Fontes oficiais', BookOpen],
    ['reforma', 'Reforma × RH', AlertTriangle],
  ]

  return (
    <div className="space-y-4 pb-8">
      {/* ── CABEÇALHO DO SETOR ── */}
      <header className="rounded-2xl border-2 border-panorama-gold/60 bg-gradient-to-r from-slate-900 via-panorama-navy to-slate-900 p-5 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-panorama-gold px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-panorama-navy">
                <Users className="h-3 w-3" />
                Setor 28 · Plataforma Contábil
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-200">
                Trabalhista · Previdenciário · Sindical · SST
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white">Recursos Humanos</h1>
            <p className="mt-1 max-w-3xl text-[12.5px] leading-relaxed text-slate-300">
              Recepciona a legislação trabalhista, previdenciária, sindical e as normas
              regulamentadoras do trabalho, com o caminho de consulta em cada órgão oficial e a base
              territorial dos sindicatos de todo o país.
            </p>
          </div>
          <div className="grid shrink-0 grid-cols-3 gap-2">
            <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-center">
              <span className="block text-lg font-black text-panorama-gold">38</span>
              <span className="block text-[9px] uppercase tracking-wider text-slate-300">NRs</span>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-center">
              <span className="block text-lg font-black text-emerald-300">
                {TOTAL_SINDICATOS.toLocaleString('pt-BR')}
              </span>
              <span className="block text-[9px] uppercase tracking-wider text-slate-300">
                Sindicatos
              </span>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-center">
              <span className="block text-lg font-black text-sky-300">27</span>
              <span className="block text-[9px] uppercase tracking-wider text-slate-300">UFs</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── ABAS ── */}
      <div className="flex flex-wrap gap-1.5">
        {abas.map(([k, rotulo, I]) => (
          <button
            key={k}
            onClick={() => setAba(k)}
            className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 text-[12px] font-bold transition-colors ${
              aba === k
                ? 'border-panorama-navy bg-panorama-navy text-white'
                : 'border-slate-300 bg-white text-slate-600 hover:border-panorama-gold'
            }`}
          >
            <I className="h-3.5 w-3.5" />
            {rotulo}
          </button>
        ))}
      </div>

      {/* ══════════════ ABA 1 — MATÉRIAS E DIPLOMAS ══════════════ */}
      {aba === 'materias' && (
        <div className="space-y-2.5">
          {MATERIAS_RH.map((m) => {
            const Icon = ICONES[m.id] || FileText
            const aberta = materiaAberta === m.id
            return (
              <article
                key={m.id}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white"
              >
                <button
                  onClick={() => setMateriaAberta(aberta ? '' : m.id)}
                  className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-slate-50"
                  aria-expanded={aberta}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-panorama-navy text-panorama-gold">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-bold text-panorama-navy">
                      {m.nome}
                    </span>
                    <span className="block text-[11.5px] leading-relaxed text-slate-500">
                      {m.descricao}
                    </span>
                  </span>
                  <span className="hidden shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 sm:block">
                    {m.recepciona.length} itens
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${aberta ? 'rotate-180' : ''}`}
                  />
                </button>

                {aberta && (
                  <div className="border-t border-slate-200 bg-slate-50/60 p-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                          O que é recepcionado aqui
                        </p>
                        <ul className="space-y-1">
                          {m.recepciona.map((item, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-1.5 text-[11.5px] text-slate-700"
                            >
                              <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                          Diplomas estruturantes — consultar na fonte
                        </p>
                        <div className="space-y-1.5">
                          {m.diplomas.map((d, i) => (
                            <a
                              key={i}
                              href={d.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block rounded-lg border border-slate-200 bg-white p-2 transition-colors hover:border-panorama-gold hover:bg-amber-50/40"
                            >
                              <span className="flex items-center justify-between gap-2">
                                <span className="text-[11.5px] font-bold text-panorama-navy">
                                  {d.nome}
                                </span>
                                <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" />
                              </span>
                              {d.apelido && (
                                <span className="mt-0.5 inline-block rounded bg-panorama-gold/15 px-1.5 text-[9.5px] font-bold text-amber-800">
                                  {d.apelido}
                                </span>
                              )}
                              <span className="mt-0.5 block text-[10.5px] leading-snug text-slate-500">
                                {d.base}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        consultarEspecialista(
                          `No setor de Recursos Humanos, matéria de ${m.nome}: ${m.descricao} Quais são os pontos de atenção e o que devo conferir na legislação vigente?`,
                        )
                      }
                      className="mt-3 inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-panorama-navy bg-panorama-navy px-3 text-[11.5px] font-bold text-white transition-colors hover:bg-slate-900"
                    >
                      <Bot className="h-3.5 w-3.5 text-panorama-gold" />
                      Consultar o especialista sobre {m.curto}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      {/* ══════════════ ABA 2 — SINDICATOS ══════════════ */}
      {aba === 'sindicatos' && (
        <div className="space-y-3">
          <div className="rounded-lg border-l-4 border-panorama-gold bg-amber-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-800">
              De onde saem estes números
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-slate-700">
              Base oficial do <b>MTE / CNES</b> (arquivo &quot;Sindicatos do Brasil&quot;) —{' '}
              <b>{TOTAL_SINDICATOS.toLocaleString('pt-BR')} sindicatos</b> registrados, com
              categoria, abrangência e a base territorial município a município. O arquivo publicado
              é de <b>28/07/2021</b>: os totais são dessa data e a situação de um sindicato
              específico deve ser confirmada no CNES, que é on-line.
            </p>
          </div>

          {/* filtros */}
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex-1 min-w-[180px]">
              <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                Ramo de atividade
              </span>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={buscaSindicato}
                  onChange={(e) => setBuscaSindicato(e.target.value)}
                  placeholder="Filtrar ramo: rural, saúde, transporte…"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-panorama-navy focus:outline-none"
                />
              </div>
            </label>
            <label className="min-w-[150px]">
              <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                Estado (sede)
              </span>
              <select
                value={ufFiltro}
                onChange={(e) => {
                  setUfFiltro(e.target.value)
                  setRamoFiltro('')
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-[12px] text-slate-800 focus:border-panorama-navy focus:outline-none"
              >
                <option value="">Todos os estados</option>
                {Object.keys(SINDICATOS_POR_UF).map((uf) => (
                  <option key={uf} value={uf}>
                    {uf} — {NOMES_UF[uf]}
                  </option>
                ))}
              </select>
            </label>
            {(ufFiltro || ramoFiltro || buscaSindicato) && (
              <button
                onClick={() => {
                  setUfFiltro('')
                  setRamoFiltro('')
                  setBuscaSindicato('')
                }}
                className="min-h-[38px] rounded-lg border border-slate-300 bg-white px-3 text-[11.5px] font-bold text-slate-600 hover:border-panorama-gold"
              >
                Limpar
              </button>
            )}
          </div>

          <p className="text-[11.5px] text-slate-600">
            Mostrando <b>{totalFiltrado.toLocaleString('pt-BR')}</b> sindicatos
            {ufFiltro ? ` com sede em ${ufFiltro} — ${NOMES_UF[ufFiltro]}` : ' em todo o país'}
            {ramoFiltro && !ufFiltro ? ` do ramo ${ramoFiltro}` : ''}.
          </p>

          {/* por ramo */}
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-[11.5px]">
              <thead className="bg-panorama-navy text-white">
                <tr>
                  <th className="px-2.5 py-2 font-bold">Ramo de atividade</th>
                  <th className="px-2 py-2 text-right font-bold">Sindicatos</th>
                  <th className="px-2 py-2 text-right font-bold">Trabalhadores</th>
                  <th className="px-2 py-2 text-right font-bold">Patronais</th>
                  <th className="px-2 py-2 text-right font-bold">Ver</th>
                </tr>
              </thead>
              <tbody>
                {ramosVisiveis.map((r, i) => (
                  <tr
                    key={r.ramo}
                    className={`border-b border-slate-100 ${i % 2 ? 'bg-slate-50/60' : ''}`}
                  >
                    <td className="px-2.5 py-1.5 font-semibold text-slate-800">{r.ramo}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-slate-700">
                      {r.total.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono text-slate-500">
                      {r.trabalhadores.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono text-slate-500">
                      {r.patronais.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <button
                        onClick={() => {
                          setRamoFiltro(r.ramo)
                          setUfFiltro('')
                        }}
                        className="rounded border border-slate-300 px-1.5 py-0.5 text-[10px] font-bold text-panorama-navy hover:border-panorama-gold hover:bg-amber-50"
                      >
                        filtrar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* por UF */}
          <div>
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
              Sindicatos por estado (sede)
            </p>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 lg:grid-cols-7">
              {Object.entries(SINDICATOS_POR_UF).map(([uf, n]) => (
                <button
                  key={uf}
                  onClick={() => {
                    setUfFiltro(uf)
                    setRamoFiltro('')
                  }}
                  className={`rounded-lg border px-2 py-1.5 text-left transition-colors ${
                    ufFiltro === uf
                      ? 'border-panorama-navy bg-panorama-navy text-white'
                      : 'border-slate-200 bg-white hover:border-panorama-gold hover:bg-amber-50/40'
                  }`}
                  title={NOMES_UF[uf]}
                >
                  <span className="block text-[11px] font-black">{uf}</span>
                  <span
                    className={`block font-mono text-[10px] ${ufFiltro === uf ? 'text-amber-300' : 'text-slate-500'}`}
                  >
                    {n.toLocaleString('pt-BR')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* abrangencia */}
          <div>
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
              Como o sindicato se espalha pelo território
            </p>
            <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {ABRANGENCIA_SINDICAL.map((a) => (
                <div key={a.tipo} className="rounded-lg border border-slate-200 bg-white p-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[11.5px] font-bold text-panorama-navy">
                      <MapPin className="h-3 w-3 text-panorama-gold" />
                      {a.tipo}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-slate-700">
                      {a.total.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10.5px] leading-snug text-slate-500">
                    {a.significado}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="https://cnes.trabalho.gov.br/app/publico/consultas"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-panorama-navy bg-panorama-navy px-3 text-[11.5px] font-bold text-white hover:bg-slate-900"
            >
              <Building2 className="h-3.5 w-3.5 text-panorama-gold" />
              Consultar um sindicato no CNES (situação atual)
              <ExternalLink className="h-3 w-3" />
            </a>
            <button
              onClick={() =>
                consultarEspecialista(
                  `Preciso identificar o sindicato da categoria e a base territorial aplicável. Como confirmo o enquadramento sindical e a Convenção Coletiva vigente?`,
                )
              }
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-[11.5px] font-bold text-panorama-navy hover:border-panorama-gold"
            >
              <Bot className="h-3.5 w-3.5 text-panorama-gold" />
              Perguntar ao especialista
            </button>
          </div>
        </div>
      )}

      {/* ══════════════ ABA 3 — FONTES OFICIAIS ══════════════ */}
      {aba === 'fontes' && (
        <div className="space-y-2">
          <p className="text-[11.5px] leading-relaxed text-slate-600">
            Cada diploma tem de ser lido onde foi publicado. Esta é a régua de consulta — todas
            verificadas em 02/11/2026.
          </p>
          {(['primaria', 'complementar'] as const).map((tipo) => (
            <div key={tipo}>
              <p className="mb-1.5 mt-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                {tipo === 'primaria'
                  ? 'Fontes primárias — o texto oficial'
                  : 'Fontes complementares — interpretação e prática'}
              </p>
              <div className="grid gap-1.5 md:grid-cols-2">
                {FONTES_RH.filter((f) => f.tipo === tipo).map((f) => (
                  <a
                    key={f.nome}
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-slate-200 bg-white p-2.5 transition-colors hover:border-panorama-gold hover:bg-amber-50/40"
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block text-[12px] font-bold text-panorama-navy">
                          {f.nome}
                        </span>
                        <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          {f.orgao}
                        </span>
                      </span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" />
                    </span>
                    <span className="mt-1 block text-[11px] leading-snug text-slate-600">
                      {f.o_que_tem}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════ ABA 4 — REFORMA × RH ══════════════ */}
      {aba === 'reforma' && (
        <div className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <h2 className="flex items-center gap-2 text-[13.5px] font-bold text-panorama-navy">
              <Scale className="h-4 w-4 text-panorama-gold" />
              {NOTA_REFORMA_E_RH.titulo}
            </h2>
            <p className="mt-1 text-[11.5px] leading-relaxed text-slate-600">
              Esta é a separação que evita o erro mais comum: tratar a reforma do consumo como se
              ela tivesse mexido na relação de emprego. Não mexeu.
            </p>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <div className="rounded-lg border-t-4 border-amber-500 bg-white p-3 shadow-sm">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" /> O que mudou de fato
              </p>
              <ul className="space-y-1.5">
                {NOTA_REFORMA_E_RH.mudou.map((t, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-1.5 text-[11.5px] leading-relaxed text-slate-700"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border-t-4 border-emerald-600 bg-white p-3 shadow-sm">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" /> O que continua igual
              </p>
              <ul className="space-y-1.5">
                {NOTA_REFORMA_E_RH.naoMudou.map((t, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-1.5 text-[11.5px] leading-relaxed text-slate-700"
                  >
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <button
            onClick={() =>
              consultarEspecialista(
                'Como a Reforma Tributária (IBS/CBS) afeta a folha de pagamento e as contribuições sobre o trabalho a partir de 2027? Quero a distinção entre o que é tributo sobre consumo e o que é contribuição previdenciária.',
              )
            }
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-panorama-navy bg-panorama-navy px-3 text-[11.5px] font-bold text-white hover:bg-slate-900"
          >
            <Bot className="h-3.5 w-3.5 text-panorama-gold" />
            Consultar o especialista sobre folha e reforma
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
