import { useMemo, useState } from 'react'
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  Eye,
  FileSearch,
  GitBranch,
  History,
  Layers,
  Link2,
  ListTree,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  Table2,
  XCircle,
} from 'lucide-react'
import {
  ANOS,
  CONEXOES,
  CRONOLOGIA,
  INCORPORADAS,
  PENDENTES,
  POR_ANO,
  TOTAL,
  ULTIMA,
  type Conexao,
  type ItemCronologia,
  type SituacaoNorma,
  type TipoNorma,
} from '@/data/legislacaoCronologica'

/**
 * Seção 12A — MONITOR LEGISLATIVO
 *
 * Central de controle da legislação da reforma. Quatro funções:
 *
 *   1. LINHA DO TEMPO — toda a legislação em ordem cronológica, com data de
 *      assinatura, URN oficial e situação (vigente / alterada / revogada).
 *   2. PAINEL DE CONTROLE — atalhos para cada lei da reforma, um por vez.
 *   3. CONEXÕES — os "pinos" que ligam esta legislação às tabelas, células e
 *      seções que dependem dela.
 *   4. CONTROLE DE ACESSO — quem pode ver, criar, editar e apagar, no modelo
 *      N1–N4 já existente no sistema (Seção 16).
 *
 * Os dados vêm de src/data/legislacaoCronologica.ts, conferidos em 28/10/2026
 * contra o Senado Dados Abertos, o DOU e o CGIBS. Nenhum item aqui é inventado:
 * norma sem data confirmada fica fora até ser conferida.
 */

const CORES_SITUACAO: Record<SituacaoNorma, string> = {
  vigente: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  alterada: 'bg-amber-50 text-amber-800 border-amber-300',
  revogada: 'bg-rose-50 text-rose-800 border-rose-300',
}

const BORDA_SITUACAO: Record<SituacaoNorma, string> = {
  vigente: 'border-l-emerald-500',
  alterada: 'border-l-amber-500',
  revogada: 'border-l-rose-500',
}

const CORES_TIPO: Record<TipoNorma, string> = {
  'Emenda Constitucional': 'bg-indigo-100 text-indigo-800',
  'Lei Complementar': 'bg-sky-100 text-sky-800',
  Decreto: 'bg-purple-100 text-purple-800',
  'Portaria Conjunta': 'bg-amber-100 text-amber-800',
  'Ato Conjunto': 'bg-emerald-100 text-emerald-800',
  Resolução: 'bg-blue-100 text-blue-800',
}

const ICONE_GRUPO: Record<Conexao['grupo'], typeof Table2> = {
  tabela: Table2,
  secao: Layers,
  simulador: Activity,
  fonte: Database,
}

const ROTULO_GRUPO: Record<Conexao['grupo'], string> = {
  tabela: 'Tabelas e células',
  secao: 'Seções do sistema',
  simulador: 'Simulador',
  fonte: 'Fontes',
}

function norm(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function dataBR(iso: string) {
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

export function SectionMonitorLegislativo() {
  const [busca, setBusca] = useState('')
  const [tipo, setTipo] = useState<TipoNorma | 'todos'>('todos')
  const [situacao, setSituacao] = useState<SituacaoNorma | 'todas'>('todas')
  const [soPendentes, setSoPendentes] = useState(false)
  const [aberta, setAberta] = useState<string | null>(null)

  const filtrados = useMemo(() => {
    const t = norm(busca.trim())
    return CRONOLOGIA.filter((i) => {
      if (tipo !== 'todos' && i.tipo !== tipo) return false
      if (situacao !== 'todas' && i.situacao !== situacao) return false
      if (soPendentes && i.incorporada) return false
      if (!t) return true
      const alvo = norm(`${i.codigo} ${i.titulo} ${i.objeto} ${i.secao || ''} ${i.nota || ''}`)
      return t.split(/\s+/).every((p) => alvo.includes(p))
    })
  }, [busca, tipo, situacao, soPendentes])

  const porAnoFiltrado = useMemo(() => {
    return filtrados.reduce<Record<string, ItemCronologia[]>>((acc, i) => {
      const ano = i.data.slice(0, 4)
      ;(acc[ano] = acc[ano] || []).push(i)
      return acc
    }, {})
  }, [filtrados])

  const anosVisiveis = Object.keys(porAnoFiltrado).sort((a, b) => Number(b) - Number(a))
  const conexoesPorGrupo = CONEXOES.reduce<Record<string, Conexao[]>>((acc, c) => {
    ;(acc[c.grupo] = acc[c.grupo] || []).push(c)
    return acc
  }, {})

  const tipos: (TipoNorma | 'todos')[] = [
    'todos',
    'Emenda Constitucional',
    'Lei Complementar',
    'Decreto',
    'Resolução',
    'Portaria Conjunta',
    'Ato Conjunto',
  ]

  return (
    <section id="monitor-legislativo" className="scroll-mt-24">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-6">
        {/* ─────────────── Cabeçalho ─────────────── */}
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-md bg-panorama-navy text-panorama-gold-light ring-1 ring-panorama-gold/50">
              <Eye className="w-3.5 h-3.5" />
            </span>
            <p className="text-xs font-bold uppercase tracking-wider text-panorama-gold-dark">
              Seção 12A
            </p>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
            Monitor Legislativo — controle da legislação e das tabelas da reforma
          </h2>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            Este painel é o encarregado de manter e controlar a legislação da reforma tributária do
            consumo. Reúne a <b>linha do tempo completa</b> em ordem cronológica, o{' '}
            <b>atalho para cada lei</b>, as <b>conexões</b> entre a norma e as tabelas que dela
            dependem, e o<b> controle de acesso</b> a essas alterações.
          </p>
        </div>

        {/* ─────────────── KPIs ─────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5">
            <div className="flex items-center gap-1.5 text-blue-700 text-[11px] font-bold uppercase tracking-wide">
              <ListTree className="w-3.5 h-3.5" />
              Normas na linha do tempo
            </div>
            <p className="text-2xl font-bold text-blue-900 mt-1">{TOTAL}</p>
            <p className="text-[11px] text-blue-700/80">{ANOS.length} anos cobertos</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
            <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-bold uppercase tracking-wide">
              <CheckCircle2 className="w-3.5 h-3.5" />
              No Panorama
            </div>
            <p className="text-2xl font-bold text-emerald-900 mt-1">{INCORPORADAS}</p>
            <p className="text-[11px] text-emerald-700/80">
              {PENDENTES} fora, por não tratarem de IBS/CBS
            </p>
          </div>
          <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3.5">
            <div className="flex items-center gap-1.5 text-violet-700 text-[11px] font-bold uppercase tracking-wide">
              <Link2 className="w-3.5 h-3.5" />
              Conexões mapeadas
            </div>
            <p className="text-2xl font-bold text-violet-900 mt-1">{CONEXOES.length}</p>
            <p className="text-[11px] text-violet-700/80">tabelas, seções, simulador e fontes</p>
          </div>
          <div className="rounded-xl border border-panorama-gold/40 bg-panorama-gold/10 p-3.5">
            <div className="flex items-center gap-1.5 text-panorama-gold-dark text-[11px] font-bold uppercase tracking-wide">
              <Clock className="w-3.5 h-3.5" />
              Ato mais recente
            </div>
            <p className="text-lg font-bold text-panorama-navy mt-1">{ULTIMA.codigo}</p>
            <p className="text-[11px] text-amber-800/80">{dataBR(ULTIMA.data)}</p>
          </div>
        </div>

        {/* ─────────────── Painel de controle: atalhos às leis ─────────────── */}
        <div className="rounded-xl border border-panorama-gold/40 bg-gradient-to-br from-panorama-gold/10 to-amber-50/60 p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <GitBranch className="w-4 h-4 text-panorama-gold-dark" />
            <h3 className="text-sm font-bold text-slate-900">
              Painel de controle — atalho para cada lei da reforma
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {CRONOLOGIA.filter((i) => i.papel === 'estrutura' || i.papel === 'regulamento').map(
              (i) => (
                <a
                  key={i.codigo}
                  href={i.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-lg bg-white border border-slate-200 hover:border-panorama-gold px-3 py-2.5 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-panorama-navy">{i.codigo}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-panorama-gold-dark shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-tight line-clamp-2">
                    {i.objeto}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-mono text-slate-400">
                    {dataBR(i.data)}
                  </span>
                </a>
              ),
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-2.5">
            Cada atalho abre o texto integral na fonte que responde — normas.leg.br para lei e
            decreto, DOU para ato publicado, CGIBS para resolução.
          </p>
        </div>

        {/* ─────────────── Conexões: os pinos do sistema ─────────────── */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Link2 className="w-4 h-4 text-panorama-gold-dark" />
            <h3 className="text-sm font-bold text-slate-900">
              Conexões — onde esta legislação encosta no resto do sistema
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mb-3">
            Cada pino liga a norma ao dado que depende dela. É por aqui que uma alteração de lei se
            propaga para as tabelas e para o simulador.
          </p>
          <div className="space-y-3">
            {(Object.keys(conexoesPorGrupo) as Conexao['grupo'][]).map((g) => {
              const Icone = ICONE_GRUPO[g]
              return (
                <div key={g}>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5 flex items-center gap-1">
                    <Icone className="w-3 h-3" />
                    {ROTULO_GRUPO[g]}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {conexoesPorGrupo[g].map((c) => (
                      <a
                        key={c.id}
                        href={c.alvo}
                        {...(c.externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        className="group flex items-start gap-2 rounded-lg bg-white border border-slate-200 hover:border-panorama-gold px-3 py-2 transition-colors"
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-panorama-gold-dark shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-slate-800">{c.rotulo}</span>
                            {c.volume && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                {c.volume}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                            {c.descricao}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ─────────────── Filtros da linha do tempo ─────────────── */}
        <div className="border-t border-slate-100 pt-4 space-y-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mr-1">
              <Search className="w-3 h-3 text-slate-500" />
              Tipo:
            </span>
            {tipos.map((t) => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className={`text-[11px] px-2.5 py-1 rounded font-bold transition-colors border cursor-pointer ${
                  tipo === t
                    ? 'bg-panorama-navy text-panorama-gold-light border-panorama-navy'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {t === 'todos' ? `Todos (${TOTAL})` : t}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-700 mr-1">Situação:</span>
            {(['todas', 'vigente', 'alterada', 'revogada'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSituacao(s)}
                className={`text-[11px] px-2.5 py-1 rounded font-bold transition-colors border cursor-pointer ${
                  situacao === s
                    ? 'bg-panorama-navy text-panorama-gold-light border-panorama-navy'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {s === 'todas'
                  ? 'Todas'
                  : `${s.charAt(0).toUpperCase()}${s.slice(1)} (${
                      CRONOLOGIA.filter((i) => i.situacao === s).length
                    })`}
              </button>
            ))}
            <button
              onClick={() => setSoPendentes((v) => !v)}
              className={`text-[11px] px-2.5 py-1 rounded font-bold transition-colors border cursor-pointer ml-1 ${
                soPendentes
                  ? 'bg-rose-700 text-white border-rose-700'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              Só fora do Panorama ({PENDENTES})
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por norma, objeto ou seção (ex.: combustível, MEI, ITCMD, art. 172)…"
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-panorama-gold/50"
            />
            {busca && (
              <button
                onClick={() => setBusca('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                aria-label="Limpar busca"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ─────────────── Linha do tempo ─────────────── */}
        <div className="space-y-4">
          {anosVisiveis.length === 0 && (
            <p className="text-sm text-slate-500 py-6 text-center">
              Nenhuma norma encontrada com esses filtros.
            </p>
          )}
          {anosVisiveis.map((ano) => (
            <div key={ano}>
              <div className="flex items-center gap-2 mb-2">
                <span className="flex items-center justify-center w-6 h-6 rounded bg-panorama-navy text-panorama-gold-light text-[11px] font-bold">
                  {ano}
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {porAnoFiltrado[ano].length} ato{porAnoFiltrado[ano].length > 1 ? 's' : ''}
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <div className="space-y-1.5">
                {porAnoFiltrado[ano].map((i) => {
                  const isOpen = aberta === i.codigo
                  return (
                    <div
                      key={i.codigo}
                      className={`rounded-lg border border-slate-200 bg-white border-l-4 ${
                        BORDA_SITUACAO[i.situacao]
                      } overflow-hidden`}
                    >
                      <button
                        onClick={() => setAberta(isOpen ? null : i.codigo)}
                        className="w-full text-left px-3 py-2.5 hover:bg-slate-50/70 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start gap-2 flex-wrap">
                          <span className="text-[10px] font-mono text-slate-500 shrink-0 pt-0.5 w-20">
                            {dataBR(i.data)}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                              CORES_TIPO[i.tipo]
                            }`}
                          >
                            {i.tipo}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{i.codigo}</span>
                          {i.incorporada ? (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              no Panorama
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">
                              fora
                            </span>
                          )}
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                              CORES_SITUACAO[i.situacao]
                            }`}
                          >
                            {i.situacao}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-snug pl-0 sm:pl-20">
                          {i.objeto}
                        </p>
                      </button>

                      {isOpen && (
                        <div className="px-3 pb-3 pt-1 border-t border-slate-100 bg-slate-50/50 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="text-slate-400 font-bold uppercase text-[9px]">
                                Título
                              </span>
                              <p className="text-slate-800">{i.titulo}</p>
                            </div>
                            <div>
                              <span className="text-slate-400 font-bold uppercase text-[9px]">
                                Data de assinatura
                              </span>
                              <p className="text-slate-800 font-mono">
                                {dataBR(i.data)}
                                {i.publicacao && i.publicacao !== i.data && (
                                  <span className="text-slate-500">
                                    {' '}
                                    · publicado em {dataBR(i.publicacao)}
                                  </span>
                                )}
                              </p>
                            </div>
                            {i.secao && (
                              <div>
                                <span className="text-slate-400 font-bold uppercase text-[9px]">
                                  Onde aparece
                                </span>
                                <p className="text-slate-800">{i.secao}</p>
                              </div>
                            )}
                            {i.urn && (
                              <div className="sm:col-span-2">
                                <span className="text-slate-400 font-bold uppercase text-[9px]">
                                  URN oficial (LexML)
                                </span>
                                <p className="text-slate-700 font-mono text-[10px] break-all">
                                  {i.urn}
                                </p>
                              </div>
                            )}
                          </div>
                          {i.nota && (
                            <div className="rounded border-l-2 border-panorama-gold bg-white px-2.5 py-1.5 text-[11px] text-slate-700">
                              <b className="text-panorama-gold-dark">Conferência:</b> {i.nota}
                            </div>
                          )}
                          <a
                            href={i.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-panorama-gold-dark hover:text-panorama-navy hover:underline"
                          >
                            Abrir o texto oficial
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ─────────────── Controle de acesso ─────────────── */}
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Lock className="w-4 h-4 text-indigo-700" />
            <h3 className="text-sm font-bold text-slate-900">Controle de acesso às alterações</h3>
          </div>
          <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
            A legislação é dado público e pode ser lida por qualquer pessoa. O que o acesso controla
            é a <b>alteração</b> — quem pode incluir norma, editar registro ou apagar item, e fica
            registrado quem fez o quê e quando.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              {
                n: 'N1',
                nome: 'Ver',
                desc: 'Ler a legislação e a linha do tempo',
                borda: 'border-blue-200',
                selo: 'bg-blue-100 text-blue-800',
              },
              {
                n: 'N2',
                nome: 'Criar',
                desc: 'Incluir norma ou item novo',
                borda: 'border-emerald-200',
                selo: 'bg-emerald-100 text-emerald-800',
              },
              {
                n: 'N3',
                nome: 'Editar',
                desc: 'Alterar dado já registrado',
                borda: 'border-amber-200',
                selo: 'bg-amber-100 text-amber-800',
              },
              {
                n: 'N4',
                nome: 'Apagar',
                desc: 'Excluir e autorizar níveis',
                borda: 'border-rose-200',
                selo: 'bg-rose-100 text-rose-800',
              },
            ].map((n) => (
              <div key={n.n} className={`rounded-lg bg-white border ${n.borda} px-3 py-2`}>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${n.selo}`}>
                    {n.n}
                  </span>
                  <span className="text-[11px] font-bold text-slate-800">{n.nome}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{n.desc}</p>
              </div>
            ))}
          </div>
          <a
            href="#controle-acesso"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:underline mt-2.5"
          >
            Gerenciar usuários e níveis — Seção 16
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>

        {/* ─────────────── Notas de método ─────────────── */}
        <div className="rounded-lg border-l-4 border-blue-600 bg-blue-50 p-4 text-sm text-blue-900">
          <div className="flex items-start gap-2">
            <Activity className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <b>Como esta linha do tempo se mantém.</b> A varredura roda toda{' '}
              <b>quarta-feira às 11:00</b>. Ela confere o catálogo de Leis Complementares do Senado,
              o DOU e as resoluções do CGIBS, e compara o texto integral de cada lei por assinatura
              de conteúdo — na LC 214, um hash de 661 mil caracteres detecta qualquer alteração. Ato
              novo entra na linha do tempo; ato alterado muda de situação; e o registro do que mudou
              vai para o Histórico (Seção 13).
            </div>
          </div>
        </div>

        <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <b>Por que {PENDENTES} normas aparecem como “fora do Panorama”.</b> Dez Leis
              Complementares de 2026 foram baixadas e lidas na íntegra. Nenhuma tem dispositivo de
              IBS, CBS ou CGIBS — tratam de seguro rural, Fundo de Segurança Pública, desmembramento
              de município. Ficam na linha do tempo porque são legislação federal do período, mas
              marcadas como fora: incluí-las no corpo do Panorama daria a impressão de que alteram a
              reforma, e elas não alteram.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <RefreshCw className="w-3 h-3" />
          <span>
            Linha do tempo conferida em 28/10/2026 · próxima conferência automática em 04/11/2026,
            11:00
          </span>
        </div>
      </div>
    </section>
  )
}
