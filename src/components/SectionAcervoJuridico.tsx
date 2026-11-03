import { useState, useMemo, useEffect } from 'react'
import {
  Scale,
  Landmark,
  Gavel,
  BookOpen,
  Building2,
  Briefcase,
  ShieldCheck,
  ShoppingBasket,
  FileText,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Bot,
  ArrowRight,
  CalendarClock,
  ListOrdered,
  ChevronDown,
  Database,
} from 'lucide-react'
import {
  TRIBUNAIS,
  CONSTITUICAO,
  CODIGOS,
  ACERVOS_LEGAIS,
  FONTES_JURIDICAS,
  CRONOLOGIA_JURIDICA,
  TOTAL_CODIGOS,
  TRIBUNais_RESPONDEM,
} from '@/data/acervoJuridico'
import { fetchAtosMunicipaisPorCodigo, type RadarAtoItem } from '@/services/radarMunicipios'
import { SumulasTeses } from '@/components/SumulasTeses'

/**
 * ACERVO JURÍDICO — Seção 30 (pedido do CEO, 02/11/2026)
 * =======================================================
 *
 * O que esta tela entrega, na ordem do pedido:
 *  1. A CONSTITUIÇÃO no TOPO da hierarquia, com as 141 emendas e as últimas
 *     quatro abertas (data + objeto + link).
 *  2. HIERARQUIA INSTITUCIONAL: STF → STJ/TST/TSE/STM → TRFs → TJs → CNJ,
 *     cada um com o que decide e o que vale citar.
 *  3. ACERVOS LEGAIS — os sub-ícones por área do Direito, cada um com o seu
 *     ícone, como o CEO pediu ("dando a cada segmento um ícone").
 *  4. CÓDIGOS: os 14 ramos (CC, CPC, CTN, CP, CPP, CLT, CDC, LRF, LEF…).
 *  5. CRONOLOGIA: os marcos em ordem, com a esfera de cada um.
 *  6. Acervo do Radar (federal/estadual/municipal), reaproveitado.
 *
 * ── A REGRA QUE GOVERNA OS LINKS DESTA TELA ──
 * Só se marca "abre" o que respondeu de fato deste servidor. O Planalto devolve
 * HTTP 200 com a página "Acesso Negado!" (814 bytes) — isso NÃO é sucesso, e a
 * tela diz isso em vez de fingir. A Câmara não fecha conexão daqui. Os dois
 * links ficam, com aviso, porque abrem no computador do usuário.
 */

type Aba =
  | 'constituicao'
  | 'sumulas'
  | 'hierarquia'
  | 'acervos'
  | 'codigos'
  | 'cronologia'
  | 'acervo-atos'

const ICONE_ACERVO: Record<string, React.ComponentType<{ className?: string }>> = {
  constitucional: Landmark,
  tributario: Scale,
  civil: FileText,
  trabalhista: Briefcase,
  penal: Gavel,
  administrativo: Building2,
  empresarial: Building2,
  consumidor: ShoppingBasket,
}

const ICONE_ESFERA: Record<string, React.ComponentType<{ className?: string }>> = {
  constitucional: Landmark,
  superior: Scale,
  federal: Building2,
  estadual: Building2,
  trabalhista: Briefcase,
  eleitoral: ShieldCheck,
  militar: ShieldCheck,
}

export function SectionAcervoJuridico() {
  const [aba, setAba] = useState<Aba>('constituicao')
  const [acervoAberto, setAcervoAberto] = useState<string>('constitucional')
  const [buscaCodigo, setBuscaCodigo] = useState('')
  const [atos, setAtos] = useState<RadarAtoItem[]>([])
  const [carregandoAtos, setCarregandoAtos] = useState(true)

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

  const codigosVisiveis = useMemo(() => {
    const t = buscaCodigo
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
    if (!t) return CODIGOS
    return CODIGOS.filter((c) => {
      const alvo = `${c.nome} ${c.apelido} ${c.area} ${c.norma}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
      return alvo.includes(t)
    })
  }, [buscaCodigo])

  const consultarEspecialista = (texto: string) => {
    window.location.hash = `#agente-juridico?q=${encodeURIComponent(texto)}`
  }

  const abas: [Aba, string, React.ComponentType<{ className?: string }>][] = [
    ['constituicao', 'Constituição', Landmark],
    ['sumulas', 'Súmulas e teses', Gavel],
    ['hierarquia', 'Hierarquia e tribunais', Layers],
    ['acervos', 'Acervos legais', BookOpen],
    ['codigos', 'Códigos', FileText],
    ['cronologia', 'Cronologia', ListOrdered],
    ['acervo-atos', 'Acervo coletado', Database],
  ]

  return (
    <div className="space-y-4 pb-8">
      {/* ── CABEÇALHO ── */}
      <header className="rounded-2xl border-2 border-panorama-gold/60 bg-gradient-to-r from-slate-900 via-panorama-navy to-slate-900 p-5 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-panorama-gold px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-panorama-navy">
                <Scale className="h-3 w-3" />
                Setor 30 · Plataforma Jurídica
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-200">
                Constituição · Códigos · Jurisprudência
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white">Acervo Jurídico</h1>
            <p className="mt-1 max-w-3xl text-[12.5px] leading-relaxed text-slate-300">
              A Constituição no topo, os códigos por área e a jurisprudência dos tribunais —
              organizados por hierarquia institucional, com a fonte oficial de cada um.
            </p>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-center">
              <span className="block text-lg font-black text-panorama-gold">
                {CONSTITUICAO.emendas}
              </span>
              <span className="block text-[9px] uppercase tracking-wider text-slate-300">
                Emendas
              </span>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-center">
              <span className="block text-lg font-black text-emerald-300">{TOTAL_CODIGOS}</span>
              <span className="block text-[9px] uppercase tracking-wider text-slate-300">
                Códigos
              </span>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-center">
              <span className="block text-lg font-black text-sky-300">{TRIBUNais_RESPONDEM}</span>
              <span className="block text-[9px] uppercase tracking-wider text-slate-300">
                Tribunais ok
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

      {/* ══════════ ABA 1 — CONSTITUIÇÃO (o topo) ══════════ */}
      {aba === 'constituicao' && (
        <div className="space-y-3">
          <div className="rounded-xl border-2 border-panorama-gold bg-gradient-to-br from-amber-50 to-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 rounded-full bg-panorama-navy px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-panorama-gold-light">
                  <Landmark className="h-2.5 w-2.5" /> Topo da hierarquia
                </span>
                <h2 className="mt-1.5 text-[17px] font-black text-panorama-navy">
                  {CONSTITUICAO.nome}
                </h2>
                <p className="mt-1 text-[11.5px] text-slate-600">
                  Promulgada em <b>{CONSTITUICAO.promulgada}</b> · atualizada até a{' '}
                  <b>{CONSTITUICAO.ultimaEmenda}</b> ({CONSTITUICAO.dataUltimaEmenda})
                </p>
              </div>
              <div className="rounded-lg border border-panorama-gold/50 bg-white px-3 py-2 text-center">
                <span className="block text-2xl font-black text-panorama-navy">
                  {CONSTITUICAO.emendas}
                </span>
                <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  emendas desde 1988
                </span>
              </div>
            </div>
            <p className="mt-2.5 rounded-lg bg-white/70 p-2 text-[11px] leading-relaxed text-slate-700 ring-1 ring-amber-200">
              <b>Alterações, inclusões, supressões e exclusões:</b> o texto de 1988 já não é o de
              hoje — passou por 141 emendas constitucionais. Cada uma altera, inclui ou suprime
              dispositivos, e é por isso que a versão compilada precisa ser lida com a data ao lado.
            </p>
          </div>

          <div>
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
              As últimas emendas — o que mudou de fato
            </p>
            <div className="space-y-1.5">
              {CONSTITUICAO.ultimas.map((e) => (
                <a
                  key={e.numero}
                  href={e.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-slate-200 bg-white p-2.5 transition-colors hover:border-panorama-gold hover:bg-amber-50/40"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <span className="rounded bg-panorama-navy px-1.5 py-0.5 font-mono text-[10px] font-bold text-panorama-gold-light">
                        EC {e.numero}
                      </span>
                      <span className="font-mono text-[10.5px] text-slate-500">{e.data}</span>
                    </span>
                    <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" />
                  </span>
                  <span className="mt-1 block text-[11.5px] leading-snug text-slate-700">
                    {e.objeto}
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
              Onde ler o texto integral e o quadro completo
            </p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {CONSTITUICAO.ondeLer.map((f) => (
                <a
                  key={f.nome}
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-slate-200 bg-white p-2.5 transition-colors hover:border-panorama-gold"
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block text-[11.5px] font-bold text-panorama-navy">
                        {f.nome}
                      </span>
                      <span className="block text-[9.5px] font-semibold uppercase tracking-wide text-slate-400">
                        {f.orgao}
                      </span>
                    </span>
                    <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" />
                  </span>
                  <span className="mt-1 block text-[10.5px] leading-snug text-slate-600">
                    {f.nota}
                  </span>
                </a>
              ))}
            </div>
          </div>

          <button
            onClick={() =>
              consultarEspecialista(
                'No Acervo Jurídico: preciso da leitura constitucional de um caso. Qual dispositivo da CF/88 se aplica, qual emenda o alterou e o que o STF já decidiu sobre isso?',
              )
            }
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-panorama-navy bg-panorama-navy px-3 text-[11.5px] font-bold text-white hover:bg-slate-900"
          >
            <Bot className="h-3.5 w-3.5 text-panorama-gold" />
            Consultar o especialista jurídico
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ══════════ ABA — SÚMULAS E TESES EM TEXTO ══════════ */}
      {aba === 'sumulas' && <SumulasTeses />}

      {/* ══════════ ABA 2 — HIERARQUIA ══════════ */}
      {aba === 'hierarquia' && (
        <div className="space-y-2.5">
          <p className="rounded-lg border-l-4 border-panorama-gold bg-amber-50 p-2.5 text-[11.5px] leading-relaxed text-slate-700">
            <b>Hierarquia institucional:</b> a Constituição está no topo e vincula todos os demais.
            Abaixo, os tribunais superiores uniformizam a lei; depois vêm as segundas instâncias. Um
            acórdão de TJ não vincula o STJ — e nenhum deles passa por cima da Constituição.
          </p>
          {TRIBUNAIS.map((t, i) => {
            const Icon = ICONE_ESFERA[t.esfera] || Scale
            return (
              <article key={t.id} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap items-start gap-2.5">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      i === 0
                        ? 'bg-panorama-navy text-panorama-gold'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[9.5px] font-bold text-slate-400">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <h3 className="text-[12.5px] font-bold text-panorama-navy">{t.nome}</h3>
                      <span className="rounded bg-panorama-gold/15 px-1.5 py-0.5 text-[9.5px] font-black text-amber-800">
                        {t.sigla}
                      </span>
                      {t.responde ? (
                        <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                          <CheckCircle2 className="h-2.5 w-2.5" /> abre
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 ring-1 ring-amber-200">
                          <AlertTriangle className="h-2.5 w-2.5" /> {t.codigo || 'conferir'}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{t.papel}</p>
                    <p className="mt-1 text-[10.5px] leading-snug text-slate-500">
                      <b className="text-slate-700">O que vale citar:</b> {t.precedentes}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <a
                        href={t.buscaUrl || t.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[30px] items-center gap-1 rounded border border-slate-300 px-2 text-[10.5px] font-bold text-panorama-navy hover:border-panorama-gold"
                      >
                        {t.buscaUrl ? 'Buscar jurisprudência' : 'Abrir'}
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}

          <p className="rounded-lg bg-slate-100 p-2 text-[10.5px] leading-snug text-slate-600">
            <b>Disponibilidade medida em 02/11/2026:</b> {TRIBUNais_RESPONDEM} dos{' '}
            {TRIBUNAIS.length} tribunais responderam deste servidor. O TSE devolveu 403 (proteção
            anti-robô) — o link abre no seu navegador. Fonte de metadados processuais: DataJud/CNJ,
            que exige chave de API.
          </p>
        </div>
      )}

      {/* ══════════ ABA 3 — ACERVOS LEGAIS (sub-ícones) ══════════ */}
      {aba === 'acervos' && (
        <div className="space-y-2.5">
          <p className="text-[11.5px] leading-relaxed text-slate-600">
            Os <b>Acervos Legais</b> são os sub-ícones por área do Direito. Cada um reúne o código
            que o organiza e o tribunal que o decide.
          </p>
          {ACERVOS_LEGAIS.map((a) => {
            const Icon = ICONE_ACERVO[a.id] || BookOpen
            const aberto = acervoAberto === a.id
            return (
              <article
                key={a.id}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white"
              >
                <button
                  onClick={() => setAcervoAberto(aberto ? '' : a.id)}
                  className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-slate-50"
                  aria-expanded={aberto}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-panorama-navy text-panorama-gold">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-bold text-panorama-navy">{a.nome}</span>
                    <span className="block text-[11px] leading-snug text-slate-500">
                      {a.descricao}
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${aberto ? 'rotate-180' : ''}`}
                  />
                </button>
                {aberto && (
                  <div className="border-t border-slate-200 bg-slate-50/60 p-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <p className="mb-1 text-[9.5px] font-black uppercase tracking-wider text-slate-500">
                          Códigos e normas
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {a.codigos.map((c) => (
                            <span
                              key={c}
                              className="rounded bg-white px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-700 ring-1 ring-slate-200"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="mb-1 text-[9.5px] font-black uppercase tracking-wider text-slate-500">
                          Tribunais que decidem
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {a.tribunais.map((tid) => {
                            const t = TRIBUNAIS.find((x) => x.id === tid)
                            if (!t) return null
                            return (
                              <a
                                key={tid}
                                href={t.buscaUrl || t.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded bg-white px-1.5 py-0.5 text-[10.5px] font-bold text-panorama-navy ring-1 ring-slate-200 hover:ring-panorama-gold"
                              >
                                {t.sigla}
                              </a>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        consultarEspecialista(
                          `No Acervo Jurídico, área de ${a.nome}: ${a.descricao} Quais os dispositivos aplicáveis e o que a jurisprudência já firmou?`,
                        )
                      }
                      className="mt-2 inline-flex min-h-[32px] items-center gap-1 rounded border border-panorama-navy bg-panorama-navy px-2.5 text-[11px] font-bold text-white hover:bg-slate-900"
                    >
                      <Bot className="h-3 w-3 text-panorama-gold" />
                      Consultar nesta área
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      {/* ══════════ ABA 4 — CÓDIGOS ══════════ */}
      {aba === 'codigos' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={buscaCodigo}
                onChange={(e) => setBuscaCodigo(e.target.value)}
                placeholder="Filtrar: civil, tributário, consumidor, falência…"
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-panorama-navy focus:outline-none"
              />
            </div>
            {buscaCodigo && (
              <button
                onClick={() => setBuscaCodigo('')}
                className="min-h-[38px] rounded-lg border border-slate-300 bg-white px-3 text-[11.5px] font-bold text-slate-600 hover:border-panorama-gold"
              >
                Limpar
              </button>
            )}
            <span className="text-[11.5px] text-slate-600">
              <b>{codigosVisiveis.length}</b> de {TOTAL_CODIGOS}
            </span>
          </div>

          <div className="grid gap-1.5 md:grid-cols-2">
            {codigosVisiveis.map((c) => (
              <a
                key={c.id}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-slate-200 bg-white p-2.5 transition-colors hover:border-panorama-gold hover:bg-amber-50/40"
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block text-[12px] font-bold text-panorama-navy">{c.nome}</span>
                    <span className="mt-0.5 inline-block rounded bg-panorama-gold/15 px-1.5 text-[9.5px] font-black text-amber-800">
                      {c.apelido}
                    </span>
                  </span>
                  <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" />
                </span>
                <span className="mt-1 block text-[10.5px] leading-snug text-slate-500">
                  {c.area}
                </span>
                <span className="mt-0.5 block font-mono text-[10px] text-slate-400">{c.norma}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ══════════ ABA 5 — CRONOLOGIA ══════════ */}
      {aba === 'cronologia' && (
        <div className="space-y-2">
          <p className="text-[11.5px] leading-relaxed text-slate-600">
            A base legal em ordem cronológica, com a esfera de cada marco — nacional, estadual ou
            municipal. Como o CEO pediu.
          </p>
          {CRONOLOGIA_JURIDICA.map((m, i) => (
            <div key={i} className="flex gap-2.5">
              <div className="flex flex-col items-center">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-panorama-navy font-mono text-[9px] font-bold text-panorama-gold-light">
                  {i + 1}
                </span>
                {i < CRONOLOGIA_JURIDICA.length - 1 && (
                  <span className="mt-0.5 w-px flex-1 bg-slate-200" />
                )}
              </div>
              <div className="min-w-0 flex-1 pb-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[10px] font-bold text-slate-500">{m.data}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${
                      m.esfera === 'nacional'
                        ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                        : m.esfera === 'estadual'
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                          : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                    }`}
                  >
                    {m.esfera}
                  </span>
                </div>
                <h3 className="mt-0.5 text-[12px] font-bold text-panorama-navy">{m.titulo}</h3>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">{m.descricao}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════ ABA 6 — ACERVO COLETADO ══════════ */}
      {aba === 'acervo-atos' && (
        <div className="space-y-3">
          <div className="rounded-lg border-l-4 border-sky-500 bg-sky-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-sky-800">
              O acervo do Radar, reaproveitado
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-slate-700">
              Os atos que o Radar Nacional coleta (federal, estadual e municipal) entram aqui como
              base documental do Acervo Jurídico — sem um segundo coletor. É a leitura do pedido
              &quot;desconsidere a fonte já conectada, mas mantenha as informações&quot;.
            </p>
          </div>

          {carregandoAtos ? (
            <p className="text-[12px] text-slate-500">Lendo o acervo…</p>
          ) : atos.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5" /> Nenhum ato retornado
              </p>
              <p className="mt-1 text-[11px] text-amber-900">
                A coleção pode estar vazia ou a leitura falhou. O Radar mostra o estado real.
              </p>
              <a
                href="#radar-nacional"
                className="mt-2 inline-flex min-h-[32px] items-center gap-1 rounded border border-amber-300 bg-white px-2 text-[11px] font-bold text-amber-800"
              >
                Abrir o Radar Nacional <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          ) : (
            <>
              <p className="text-[11.5px] text-slate-600">
                <b>{atos.length}</b> atos no acervo, dos quais{' '}
                <b>{atos.filter((a) => a.nivel === 'federal').length}</b> federais,{' '}
                <b>{atos.filter((a) => a.nivel === 'estadual').length}</b> estaduais e{' '}
                <b>{atos.filter((a) => a.nivel === 'municipal').length}</b> municipais.
              </p>
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
                    {atos.slice(0, 50).map((a, i) => (
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
                          <span className="rounded bg-slate-100 px-1 text-[9px] font-bold uppercase text-slate-600">
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
            </>
          )}

          <div>
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
              Fontes jurídicas — disponibilidade medida
            </p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {FONTES_JURIDICAS.map((f) => (
                <a
                  key={f.nome}
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-slate-200 bg-white p-2.5 transition-colors hover:border-panorama-gold"
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block text-[11.5px] font-bold text-panorama-navy">
                        {f.nome}
                      </span>
                      <span className="block text-[9.5px] font-semibold uppercase tracking-wide text-slate-400">
                        {f.orgao}
                      </span>
                    </span>
                    {f.responde ? (
                      <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 shrink-0 text-amber-600" />
                    )}
                  </span>
                  <span className="mt-1 block text-[10.5px] leading-snug text-slate-600">
                    {f.o_que_tem}
                  </span>
                  {f.observacao && (
                    <span className="mt-1 block rounded bg-amber-50 p-1 text-[9.5px] leading-snug text-amber-800">
                      {f.observacao}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
