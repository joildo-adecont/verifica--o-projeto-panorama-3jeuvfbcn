import { useState, useMemo, useEffect } from 'react'
import {
  Building2,
  Landmark,
  MapPin,
  Scale,
  FileText,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Bot,
  ArrowRight,
  Database,
  CalendarClock,
  TrendingDown,
} from 'lucide-react'
import {
  ESFERAS_FISCAIS,
  LEIS_ICMS,
  COBERTURA_SEFAZ,
  SEFAZ_RESPONDEM,
  SEFAZ_COM_ROTA_ALTERNATIVA,
  SEFAZ_SEM_CAMINHO,
  SEFAZ_ALCANCAVEIS,
  ISS_ESTRUTURA,
} from '@/data/departamentoFiscal'
import { fetchAtosMunicipaisPorCodigo, type RadarAtoItem } from '@/services/radarMunicipios'

/**
 * DEPARTAMENTO FISCAL — Seção 29 (pedido do CEO, 02/11/2026)
 * ===========================================================
 *
 * O QUE ESTA TELA FAZ, na ordem do pedido:
 *  1. SETOR com ícone próprio na Plataforma Contábil.
 *  2. TRÊS SUB-ÍCONES por esfera: Federal, Estadual, Municipal — cada um com o
 *     que se guarda ali e onde o ato é publicado.
 *  3. ICMS de TODO o país: a lei matriz de cada UF, a alíquota modal e o link
 *     para a SEFAZ, com a cobertura MEDIDA (quem respondeu e quem não).
 *  4. ISS/ISSQN: a estrutura nacional (LC 116/2003), piso e teto, e a transição
 *     ano a ano até a extinção em 2033.
 *  5. Os ATOS já coletados pelo Radar Nacional, reorganizados por esfera e por
 *     tributo — o CEO pediu para não descartar a fonte conectada, e sim alimentar
 *     esta base com ela.
 *
 * ── POR QUE NÃO HÁ UM SEGUNDO COLETOR AQUI ──
 * O Radar Nacional já varre 12 UFs estaduais e 20 UFs municipais, grava em
 * `radar_atos` com `nivel` e `relacao`, e roda em cron. Criar outro coletor seria
 * duplicar custo e risco. Esta seção LÊ a mesma coleção e a organiza por tributo
 * (ICMS / ISS / IBS-CBS), que é o recorte que o fisco usa.
 */

type Aba = 'esferas' | 'icms' | 'iss' | 'acervo'

const ICONE_ESFERA: Record<string, React.ComponentType<{ className?: string }>> = {
  federal: Landmark,
  estadual: Building2,
  municipal: MapPin,
}

export function SectionDepartamentoFiscal() {
  const [aba, setAba] = useState<Aba>('esferas')
  const [esferaAberta, setEsferaAberta] = useState<string>('federal')
  const [buscaIcms, setBuscaIcms] = useState('')
  const [atos, setAtos] = useState<RadarAtoItem[]>([])
  const [carregandoAtos, setCarregandoAtos] = useState(true)
  const [filtroEsfera, setFiltroEsfera] = useState<'todos' | 'federal' | 'estadual' | 'municipal'>(
    'todos',
  )

  /* Lê o acervo que o Radar já coletou. Nunca lança: se falhar, a seção continua
     útil com a base legal, e o card de acervo diz que a leitura não veio. */
  useEffect(() => {
    let ativo = true
    fetchAtosMunicipaisPorCodigo()
      .then((r) => {
        if (ativo) setAtos(r.todos || [])
      })
      .catch(() => {
        if (ativo) setAtos([])
      })
      .finally(() => {
        if (ativo) setCarregandoAtos(false)
      })
    return () => {
      ativo = false
    }
  }, [])

  const atosPorEsfera = useMemo(() => {
    const conta = { federal: 0, estadual: 0, municipal: 0 }
    for (const a of atos) {
      const n = (a.nivel || 'municipal') as keyof typeof conta
      if (conta[n] !== undefined) conta[n]++
    }
    return conta
  }, [atos])

  const atosFiltrados = useMemo(() => {
    const base = filtroEsfera === 'todos' ? atos : atos.filter((a) => a.nivel === filtroEsfera)
    return base.slice(0, 60)
  }, [atos, filtroEsfera])

  const leisVisiveis = useMemo(() => {
    const t = buscaIcms
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
    if (!t) return LEIS_ICMS
    return LEIS_ICMS.filter((l) => {
      const alvo = `${l.uf} ${l.lei} ${l.fonte}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
      return alvo.includes(t)
    })
  }, [buscaIcms])

  const consultarEspecialista = (texto: string) => {
    window.location.hash = `#agente-contabil?q=${encodeURIComponent(texto)}`
  }

  const abas: [Aba, string, React.ComponentType<{ className?: string }>][] = [
    ['esferas', 'As três esferas', Layers],
    ['icms', 'ICMS por estado', Building2],
    ['iss', 'ISS / ISSQN', MapPin],
    ['acervo', 'Acervo coletado', Database],
  ]

  return (
    <div className="space-y-4 pb-8">
      {/* ── CABEÇALHO ── */}
      <header className="rounded-2xl border-2 border-panorama-gold/60 bg-gradient-to-r from-slate-900 via-panorama-navy to-slate-900 p-5 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-panorama-gold px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-panorama-navy">
                <Building2 className="h-3 w-3" />
                Setor 29 · Plataforma Contábil
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-200">
                Federal · Estadual · Municipal
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white">
              Departamento Fiscal
            </h1>
            <p className="mt-1 max-w-3xl text-[12.5px] leading-relaxed text-slate-300">
              Recepciona leis, decretos e normas reguladoras das três esferas, com o ICMS de todos
              os estados e o ISS/ISSQN na estrutura nacional — e alimenta-se do acervo que o Radar
              Nacional já coleta.
            </p>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-center">
              <span className="block text-lg font-black text-panorama-gold">27</span>
              <span className="block text-[9px] uppercase tracking-wider text-slate-300">
                UFs ICMS
              </span>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-center">
              <span className="block text-lg font-black text-emerald-300">5.570</span>
              <span className="block text-[9px] uppercase tracking-wider text-slate-300">
                Municípios ISS
              </span>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-center">
              <span className="block text-lg font-black text-sky-300">{SEFAZ_ALCANCAVEIS}/27</span>
              <span className="block text-[9px] uppercase tracking-wider text-slate-300">
                UFs c/ rota
              </span>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-center">
              <span className="block text-lg font-black text-amber-300">
                {carregandoAtos ? '—' : atos.length}
              </span>
              <span className="block text-[9px] uppercase tracking-wider text-slate-300">Atos</span>
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

      {/* ══════════ ABA 1 — AS TRÊS ESFERAS ══════════ */}
      {aba === 'esferas' && (
        <div className="space-y-2.5">
          {ESFERAS_FISCAIS.map((esf) => {
            const Icon = ICONE_ESFERA[esf.id] || FileText
            const aberta = esferaAberta === esf.id
            const qtd = atosPorEsfera[esf.id as keyof typeof atosPorEsfera] || 0
            return (
              <article
                key={esf.id}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white"
              >
                <button
                  onClick={() => setEsferaAberta(aberta ? '' : esf.id)}
                  className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-slate-50"
                  aria-expanded={aberta}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-panorama-navy text-panorama-gold">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-bold text-panorama-navy">
                      {esf.nome}
                    </span>
                    <span className="block text-[11.5px] text-slate-500">
                      {esf.tributos.join(' · ')}
                    </span>
                  </span>
                  <span className="hidden shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 sm:block">
                    {qtd} atos no acervo
                  </span>
                  <ArrowRight
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${aberta ? 'rotate-90' : ''}`}
                  />
                </button>

                {aberta && (
                  <div className="border-t border-slate-200 bg-slate-50/60 p-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                          O que se guarda nesta esfera
                        </p>
                        <ul className="space-y-1">
                          {esf.o_que_se_guarda.map((item, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-1.5 text-[11.5px] text-slate-700"
                            >
                              <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 rounded bg-white p-2 text-[10.5px] leading-snug text-slate-600 ring-1 ring-slate-200">
                          <b>Onde nasce:</b> {esf.onde_publica}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                          Onde consultar
                        </p>
                        <div className="space-y-1.5">
                          {esf.orgaos.map((o, i) => (
                            <a
                              key={i}
                              href={o.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block rounded-lg border border-slate-200 bg-white p-2 transition-colors hover:border-panorama-gold hover:bg-amber-50/40"
                            >
                              <span className="flex items-center justify-between gap-2">
                                <span className="text-[11.5px] font-bold text-panorama-navy">
                                  {o.nome}
                                </span>
                                <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" />
                              </span>
                              <span className="mt-0.5 block text-[10.5px] leading-snug text-slate-500">
                                {o.o_que_tem}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      {/* ══════════ ABA 2 — ICMS POR ESTADO ══════════ */}
      {aba === 'icms' && (
        <div className="space-y-3">
          <div className="rounded-lg border-l-4 border-panorama-gold bg-amber-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-800">
              A lei matriz de cada estado
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-slate-700">
              O ICMS é estadual: cada UF tem a sua própria lei, o seu RICMS e as suas alíquotas. A
              alíquota mostrada é a <b>modal interna de 2026</b>. Ela não substitui a leitura do
              RICMS — serve para localizar a norma certa e abrir na fonte.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={buscaIcms}
                onChange={(e) => setBuscaIcms(e.target.value)}
                placeholder="Filtrar por UF ou número da lei…"
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-panorama-navy focus:outline-none"
              />
            </div>
            {buscaIcms && (
              <button
                onClick={() => setBuscaIcms('')}
                className="min-h-[38px] rounded-lg border border-slate-300 bg-white px-3 text-[11.5px] font-bold text-slate-600 hover:border-panorama-gold"
              >
                Limpar
              </button>
            )}
            <span className="text-[11.5px] text-slate-600">
              <b>{leisVisiveis.length}</b> de {LEIS_ICMS.length} UFs
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-[11.5px]">
              <thead className="bg-panorama-navy text-white">
                <tr>
                  <th className="px-2 py-2 font-bold">UF</th>
                  <th className="px-2 py-2 font-bold">Lei do ICMS</th>
                  <th className="px-2 py-2 text-right font-bold">Modal 2026</th>
                  <th className="px-2 py-2 font-bold">Observação</th>
                  <th className="px-2 py-2 text-center font-bold">SEFAZ</th>
                </tr>
              </thead>
              <tbody>
                {leisVisiveis.map((l, i) => {
                  const cobertura = COBERTURA_SEFAZ.find((c) => c.uf === l.uf)
                  return (
                    <tr
                      key={l.uf}
                      className={`border-b border-slate-100 ${i % 2 ? 'bg-slate-50/60' : ''}`}
                    >
                      <td className="px-2 py-1.5 font-black text-panorama-navy">{l.uf}</td>
                      <td className="px-2 py-1.5">
                        <span className="font-semibold text-slate-800">{l.lei}</span>
                        {l.ano && (
                          <span className="ml-1 rounded bg-slate-100 px-1 text-[9.5px] font-bold text-slate-500">
                            {l.ano}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono font-bold text-slate-700">
                        {l.aliquota !== undefined
                          ? `${l.aliquota.toString().replace('.', ',')}%`
                          : '—'}
                      </td>
                      <td className="px-2 py-1.5 text-[10.5px] leading-snug text-slate-500">
                        {l.obs || '—'}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        {cobertura ? (
                          /* Três estados: abre direto · abre por rota alternativa ·
                             não abre daqui. O terceiro só aparece quando de fato não
                             há caminho — antes ele era o rótulo de todo mundo que
                             falhava, mesmo quando o portal do estado respondia. */
                          cobertura.responde ? (
                            <a
                              href={`https://${cobertura.host}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-700 ring-1 ring-emerald-200"
                              title={`${cobertura.host} — respondeu ${cobertura.codigo}`}
                            >
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              abrir
                            </a>
                          ) : cobertura.rota ? (
                            <a
                              href={cobertura.rota}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded bg-sky-50 px-1.5 py-0.5 text-[9.5px] font-bold text-sky-700 ring-1 ring-sky-200"
                              title={cobertura.via}
                            >
                              <ArrowRight className="h-2.5 w-2.5" />
                              {cobertura.busca ? 'legislação' : 'via gov'}
                            </a>
                          ) : cobertura.rotaOficial ? (
                            /* Tem endereço oficial, mas NÃO foi possível abrir daqui.
                               O rótulo diz isso: "oficial" e não "via gov", que
                               sugeriria caminho aberto. */
                            <a
                              href={cobertura.rotaOficial}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[9.5px] font-bold text-rose-700 ring-1 ring-rose-200"
                              title="Endereço oficial da legislação do ICMS. Não respondeu deste servidor (nem em HTTP) — no seu computador abre normalmente. Não conta como cobertura medida."
                            >
                              <AlertTriangle className="h-2.5 w-2.5" />
                              oficial*
                            </a>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[9.5px] font-bold text-rose-700 ring-1 ring-rose-200"
                              title={`${cobertura.host} — não responde deste servidor e não há rota alternativa medida`}
                            >
                              <AlertTriangle className="h-2.5 w-2.5" />
                              sem rota
                            </span>
                          )
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
              <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" /> {SEFAZ_RESPONDEM} abrem direto
              </p>
              <p className="mt-1 text-[10.5px] leading-snug text-emerald-900">
                O portal da SEFAZ respondeu deste servidor agora. É por onde se confirma o RICMS.
              </p>
            </div>
            <div className="rounded-lg border border-sky-200 bg-sky-50 p-2.5">
              <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-sky-800">
                <ArrowRight className="h-3.5 w-3.5" /> {SEFAZ_COM_ROTA_ALTERNATIVA} por rota oficial
              </p>
              <p className="mt-1 text-[10.5px] leading-snug text-sky-900">
                A SEFAZ não abre daqui, mas o <b>portal do governo do estado</b> — ou o portal de
                legislação, como o LegisOn de Sergipe — responde 200. Está na tabela como{' '}
                <b>via gov</b>.
              </p>
            </div>
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5">
              <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-rose-800">
                <AlertTriangle className="h-3.5 w-3.5" /> {SEFAZ_SEM_CAMINHO} sem caminho daqui
              </p>
              <p className="mt-1 text-[10.5px] leading-snug text-rose-900">
                Nem a SEFAZ nem o portal do estado responderam deste servidor. O link oficial
                continua na tabela — no seu computador abre.
              </p>
            </div>
          </div>

          <p className="rounded-lg bg-slate-100 p-2 text-[11px] font-semibold text-slate-700">
            Cobertura alcançável: <b>{SEFAZ_ALCANCAVEIS} de 27</b> UFs por um caminho oficial que
            respondeu agora (direto ou por rota alternativa).
          </p>

          <button
            onClick={() =>
              consultarEspecialista(
                'No Departamento Fiscal, preciso do ICMS de um estado específico: qual é a lei matriz, onde está o RICMS vigente e como confirmo a alíquota aplicável à minha operação?',
              )
            }
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-panorama-navy bg-panorama-navy px-3 text-[11.5px] font-bold text-white hover:bg-slate-900"
          >
            <Bot className="h-3.5 w-3.5 text-panorama-gold" />
            Consultar o especialista sobre ICMS
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ══════════ ABA 3 — ISS / ISSQN ══════════ */}
      {aba === 'iss' && (
        <div className="space-y-3">
          <div className="rounded-lg border-l-4 border-panorama-gold bg-amber-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-800">
              O ISS é municipal — e tem prazo
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-slate-700">
              Não existe &quot;a alíquota do ISS do Brasil&quot;. A lei nacional fixa a{' '}
              <b>lista de serviços</b>, o <b>piso de {ISS_ESTRUTURA.piso}%</b> e o{' '}
              <b>teto de {ISS_ESTRUTURA.teto}%</b>; a alíquota é de cada um dos{' '}
              <b>5.570 municípios</b>. E a LC 214/2025 programou a extinção: quem não revisar a lei
              municipal até 2028 fica com a alíquota congelada na trajetória de redução.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-2.5">
              <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                Lei nacional
              </span>
              <span className="mt-0.5 block text-[13px] font-bold text-panorama-navy">
                {ISS_ESTRUTURA.leiNacional}
              </span>
              <span className="mt-0.5 block text-[10.5px] leading-snug text-slate-500">
                {ISS_ESTRUTURA.listaServicos}
              </span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-2.5">
              <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                Piso
              </span>
              <span className="mt-0.5 block text-[13px] font-bold text-emerald-700">
                {ISS_ESTRUTURA.piso}%
              </span>
              <span className="mt-0.5 block text-[10px] leading-snug text-slate-500">
                {ISS_ESTRUTURA.pisoBaseLegal}
              </span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-2.5">
              <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                Teto
              </span>
              <span className="mt-0.5 block text-[13px] font-bold text-rose-700">
                {ISS_ESTRUTURA.teto}%
              </span>
              <span className="mt-0.5 block text-[10px] leading-snug text-slate-500">
                {ISS_ESTRUTURA.tetoBaseLegal}
              </span>
            </div>
          </div>

          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
              <TrendingDown className="h-3.5 w-3.5" /> Transição até a extinção
            </p>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-left text-[11.5px]">
                <thead className="bg-panorama-navy text-white">
                  <tr>
                    <th className="px-2 py-2 font-bold">Ano</th>
                    <th className="px-2 py-2 text-right font-bold">Redução do ISS</th>
                    <th className="px-2 py-2 text-right font-bold">IBS</th>
                    <th className="px-2 py-2 font-bold">Base legal</th>
                  </tr>
                </thead>
                <tbody>
                  {ISS_ESTRUTURA.transicao.map((t, i) => (
                    <tr
                      key={t.ano}
                      className={`border-b border-slate-100 ${i % 2 ? 'bg-slate-50/60' : ''}`}
                    >
                      <td className="px-2 py-1.5 font-black text-panorama-navy">{t.ano}</td>
                      <td className="px-2 py-1.5 text-right font-mono text-slate-700">
                        {t.reducao}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono text-emerald-700">{t.ibs}</td>
                      <td className="px-2 py-1.5 text-[10.5px] text-slate-500">{t.base}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
              {ISS_ESTRUTURA.nota}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Onde está a lei municipal de cada um dos 5.570
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-slate-700">
              Na esfera municipal desta seção: o Diário Oficial do município é a fonte primária. O
              Radar Nacional já percorre as instâncias do SIGPub em <b>20 das 27 UFs</b> (2.823
              entes alcançáveis). O acervo coletado aparece na aba <b>Acervo coletado</b>.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <a
                href="https://www.diariomunicipal.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-slate-300 px-2.5 text-[11px] font-bold text-panorama-navy hover:border-panorama-gold"
              >
                Diários Municipais (SIGPub) <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="#radar-nacional"
                className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-slate-300 px-2.5 text-[11px] font-bold text-panorama-navy hover:border-panorama-gold"
              >
                Radar Nacional <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </div>

          <button
            onClick={() =>
              consultarEspecialista(
                'No Departamento Fiscal, preciso do ISS de um município: qual lei municipal consultar, qual a alíquota vigente e como fica a redução a partir de 2029?',
              )
            }
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-panorama-navy bg-panorama-navy px-3 text-[11.5px] font-bold text-white hover:bg-slate-900"
          >
            <Bot className="h-3.5 w-3.5 text-panorama-gold" />
            Consultar o especialista sobre ISS
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ══════════ ABA 4 — ACERVO COLETADO ══════════ */}
      {aba === 'acervo' && (
        <div className="space-y-3">
          <div className="rounded-lg border-l-4 border-sky-500 bg-sky-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-sky-800">
              O acervo que o Radar já coleta, reorganizado por esfera
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-slate-700">
              Esta aba <b>lê</b> a mesma coleção do Radar Nacional (<code>radar_atos</code>) — não é
              um segundo coletor. Assim a coleta continua sendo uma só, e o Departamento Fiscal
              ganha o recorte por esfera, que é como o fisco trabalha.
            </p>
          </div>

          {carregandoAtos ? (
            <p className="text-[12px] text-slate-500">Lendo o acervo…</p>
          ) : atos.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5" /> Nenhum ato retornado na leitura
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-900">
                A coleção pode estar vazia no ambiente ou a leitura falhou. O Radar Nacional mostra
                o estado real da coleta.
              </p>
              <a
                href="#radar-nacional"
                className="mt-2 inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-amber-300 bg-white px-2.5 text-[11px] font-bold text-amber-800"
              >
                Abrir o Radar Nacional <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          ) : (
            <>
              <div className="grid gap-2 sm:grid-cols-3">
                {(['federal', 'estadual', 'municipal'] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => setFiltroEsfera(filtroEsfera === n ? 'todos' : n)}
                    className={`rounded-lg border p-2.5 text-left transition-colors ${
                      filtroEsfera === n
                        ? 'border-panorama-navy bg-panorama-navy text-white'
                        : 'border-slate-200 bg-white hover:border-panorama-gold'
                    }`}
                  >
                    <span className="block text-[10px] font-black uppercase tracking-wider opacity-70">
                      {n}
                    </span>
                    <span className="block text-lg font-black">{atosPorEsfera[n]}</span>
                  </button>
                ))}
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-panorama-navy text-white">
                    <tr>
                      <th className="px-2 py-2 font-bold">Data</th>
                      <th className="px-2 py-2 font-bold">Esfera</th>
                      <th className="px-2 py-2 font-bold">Ente</th>
                      <th className="px-2 py-2 font-bold">Ato</th>
                      <th className="px-2 py-2 text-center font-bold">Abrir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {atosFiltrados.map((a, i) => (
                      <tr
                        key={a.id || i}
                        className={`border-b border-slate-100 ${i % 2 ? 'bg-slate-50/60' : ''}`}
                      >
                        <td className="whitespace-nowrap px-2 py-1.5 font-mono text-[10px] text-slate-500">
                          {a.data
                            ? String(a.data).slice(0, 10).split('-').reverse().join('/')
                            : '—'}
                        </td>
                        <td className="px-2 py-1.5">
                          <span className="rounded bg-slate-100 px-1 text-[9.5px] font-bold uppercase text-slate-600">
                            {a.nivel || 'municipal'}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-[10.5px] text-slate-600">
                          {a.municipio_nome || a.ente_nome || a.uf || '—'}
                        </td>
                        <td className="px-2 py-1.5 text-slate-800">{a.titulo}</td>
                        <td className="px-2 py-1.5 text-center">
                          {a.url ? (
                            <a
                              href={a.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex text-panorama-navy hover:text-panorama-gold"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {atos.length > 60 && (
                <p className="text-[10.5px] text-slate-500">
                  Mostrando os 60 mais recentes de {atos.length}. O acervo completo fica no Radar
                  Nacional.
                </p>
              )}
            </>
          )}

          <div className="flex flex-wrap gap-1.5">
            <a
              href="#radar-nacional"
              className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 text-[11px] font-bold text-panorama-navy hover:border-panorama-gold"
            >
              <CalendarClock className="h-3 w-3" />
              Radar Nacional (coletor)
            </a>
            <a
              href="#historico-atualizacoes"
              className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 text-[11px] font-bold text-panorama-navy hover:border-panorama-gold"
            >
              <Scale className="h-3 w-3" />
              Histórico de Atualizações
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
