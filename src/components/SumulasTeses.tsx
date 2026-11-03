import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Loader2,
  AlertTriangle,
  Scale,
  Landmark,
  Gavel,
  FileText,
  X,
  Download,
  Hash,
  Send,
} from 'lucide-react'
import { BuscaPorArtigo } from './BuscaPorArtigo'
import { verbeteParaJurisprudencia, type VerbeteLike } from '@/lib/verbeteParaJurisprudencia'
import type { Jurisprudencia } from '@/services/jurisprudencias'

/**
 * SÚMULAS E TESES EM TEXTO — aba do Acervo Jurídico
 * =================================================
 *
 * O texto integral dos verbetes, extraído das fontes oficiais e servido como
 * arquivo estático em /dados/ — NÃO dentro do bundle. Motivo: são ~1,1 MB de
 * texto; embutir deixaria o app mais pesado para quem só quer ver o painel.
 * Aqui o arquivo só é baixado quando a aba é aberta.
 *
 * ── DE ONDE VEM CADA CONJUNTO (extraídos em 02-03/11/2026) ──
 *  • STF vinculantes — 63 (SV 1 a 63). API de jurisprudência do STF.
 *  • STF simples — 736. Mesma API. (Os dois moram no MESMO arquivo: 799.)
 *  • STJ súmulas — 649, da 1 à 649, sem lacuna. PDF oficial SumulasSTJ.pdf.
 *  • TST súmulas — 363 vigentes de 463 históricas (123 canceladas marcadas).
 *  • Temas repetitivos do STJ — 1.152 com tese firmada (numeração até 1.455;
 *    os que faltam não têm tese — lacuna é o dado, não falha da coleta).
 *
 * ── BUG QUE JÁ DERRUBOU A PÁGINA (v0.0.437) ──
 * A aba "Por artigo de lei" foi montada referenciando <BuscaPorArtigo> sem que
 * o módulo entrasse no bundle publicado: ao clicar, o React lançava
 * "ReferenceError: BuscaPorArtigo is not defined" e a aplicação inteira ficava
 * em branco. Por isso o import está na PRIMEIRA linha do arquivo, junto do
 * React, e o componente é o único ponto de entrada dessa aba.
 */

type ConjuntoId =
  | 'stf-vinculantes'
  | 'stf-simples'
  | 'stj-sumulas'
  | 'tst-sumulas'
  | 'stj-temas'
  | 'por-artigo'

interface Conjunto {
  id: ConjuntoId
  nome: string
  /** caminho do JSON; vazio = a aba tem tela própria e não baixa arquivo */
  arquivo: string
  tribunal: string
  descricao: string
  Icone: React.ComponentType<{ className?: string }>
  cor: string
  /** filtro aplicado ao arquivo */
  filtro?: 'vinculante' | 'simples'
  /** selo extra na lista */
  extra?: 'cancelada' | 'ramo'
}

const ARQ_STF = 'dados/sumulas-stf.json'
const ARQ_STJ = 'dados/sumulas-stj.json'
const ARQ_TST = 'dados/sumulas-tst.json'
const ARQ_TEMAS = 'dados/temas-stj.json'

const CONJUNTOS: Conjunto[] = [
  {
    id: 'por-artigo',
    nome: 'Por artigo de lei',
    arquivo: '',
    tribunal: 'STF · STJ · TST',
    descricao:
      'Escolha o dispositivo — art. 156 do CTN, art. 5º da CF — e veja todos os verbetes que o tratam. Normas revogadas (CF/1946, CPC/1973) ficam separadas das vigentes.',
    Icone: Hash,
    cor: 'text-slate-700',
  },
  {
    id: 'stf-vinculantes',
    nome: 'Súmulas vinculantes',
    arquivo: ARQ_STF,
    tribunal: 'STF',
    descricao:
      'As 63 súmulas vinculantes. Depois de editada, vinculam todo o Judiciário e a administração pública — é o grau mais alto de precedente que existe.',
    Icone: Landmark,
    cor: 'text-indigo-700',
    filtro: 'vinculante',
  },
  {
    id: 'stf-simples',
    nome: 'Súmulas do STF',
    arquivo: ARQ_STF,
    tribunal: 'STF',
    descricao:
      '736 súmulas simples: orientam, mas não vinculam. Continuam citáveis e mostram como o STF lê a Constituição.',
    Icone: Scale,
    cor: 'text-sky-700',
    filtro: 'simples',
  },
  {
    id: 'stj-sumulas',
    nome: 'Súmulas do STJ',
    arquivo: ARQ_STJ,
    tribunal: 'STJ',
    descricao:
      '649 súmulas, da 1 à 649, do PDF oficial do STJ. É onde se confirma a leitura do CTN, do CPC e da lei federal.',
    Icone: FileText,
    cor: 'text-emerald-700',
  },
  {
    id: 'tst-sumulas',
    nome: 'Súmulas do TST',
    arquivo: ARQ_TST,
    tribunal: 'TST',
    descricao:
      '363 súmulas vigentes da Justiça do Trabalho. As canceladas ficam marcadas — cancelada não se cita como se valesse.',
    Icone: Gavel,
    cor: 'text-amber-700',
    extra: 'cancelada',
  },
  {
    id: 'stj-temas',
    nome: 'Temas repetitivos (STJ)',
    arquivo: ARQ_TEMAS,
    tribunal: 'STJ',
    descricao:
      '1.152 teses firmadas em recursos repetitivos. É a jurisprudência que os tribunais são obrigados a seguir — a mais útil na prática.',
    Icone: Scale,
    cor: 'text-rose-700',
    extra: 'ramo',
  },
]

interface Verbete {
  n: number
  /** chave de identidade: 'SV1' (vinculante) x 'S1' (simples) — só no STF.
   *  Sem isto, SV 1 e Súmula 1 (decisões diferentes, mesmo número) se
   *  confundem na lista e no "Usar esta tese". */
  k?: string
  t: string
  v?: number
  o?: string
  d?: string
  a?: string
  c?: number
  r?: string
  s?: string
}

const semAcento = (s: string) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const ehStf = (c: Conjunto) => c.id === 'stf-vinculantes' || c.id === 'stf-simples'

/** conta os verbetes DO CONJUNTO — vinculantes e simples dividem o arquivo */
function contar(c: Conjunto, arr: Verbete[]): number {
  if (c.filtro === 'vinculante') return arr.filter((v) => v.v === 1).length
  if (c.filtro === 'simples') return arr.filter((v) => v.v === 0).length
  return arr.length
}

/** aplica o filtro do conjunto */
function filtrar(c: Conjunto, arr: Verbete[]): Verbete[] {
  if (c.filtro === 'vinculante') return arr.filter((v) => v.v === 1)
  if (c.filtro === 'simples') return arr.filter((v) => v.v === 0)
  return arr
}

export function SumulasTeses({
  onUsarTese,
}: {
  /** leva o verbete escolhido para o formulário de publicação */
  onUsarTese?: (dados: Partial<Jurisprudencia>) => void
} = {}) {
  const [conjuntoId, setConjuntoId] = useState<ConjuntoId>('stf-vinculantes')
  const [dados, setDados] = useState<Record<string, Verbete[]>>({})
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')

  const conjunto = CONJUNTOS.find((c) => c.id === conjuntoId) ?? CONJUNTOS[1]

  /* ── carrega o arquivo do conjunto ativo ── */
  useEffect(() => {
    if (!conjunto.arquivo) {
      setCarregando(false)
      return
    }
    if (dados[conjunto.arquivo]) {
      setCarregando(false)
      return
    }
    let ativo = true
    setCarregando(true)
    setErro('')
    fetch(conjunto.arquivo)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((j: Verbete[]) => {
        if (ativo) setDados((d) => ({ ...d, [conjunto.arquivo]: j }))
      })
      .catch((e) => {
        if (ativo) setErro(String((e && e.message) || e))
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [conjunto.arquivo, dados])

  /* ── a aba por artigo precisa dos quatro arquivos ao mesmo tempo ── */
  useEffect(() => {
    if (conjuntoId !== 'por-artigo') return
    const faltam = [ARQ_STF, ARQ_STJ, ARQ_TST, ARQ_TEMAS].filter((a) => !dados[a])
    if (!faltam.length) return
    let ativo = true
    Promise.all(
      faltam.map((a) =>
        fetch(a)
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => []),
      ),
    ).then((listas) => {
      if (!ativo) return
      setDados((d) => {
        const novo = { ...d }
        faltam.forEach((a, i) => {
          novo[a] = listas[i]
        })
        return novo
      })
    })
    return () => {
      ativo = false
    }
  }, [conjuntoId, dados])

  const base = dados[conjunto.arquivo] || []
  const doConjunto = useMemo(() => filtrar(conjunto, base), [base, conjunto])
  const total = contar(conjunto, base)

  const itens = useMemo(() => {
    const t = semAcento(busca).trim()
    if (!t) return doConjunto
    const termos = t.split(/\s+/)
    return doConjunto.filter((v) => {
      const alvo = semAcento(`${v.n} ${v.t} ${v.a || ''} ${v.r || ''} ${v.o || ''} ${v.s || ''}`)
      return termos.every((p) => alvo.includes(p))
    })
  }, [doConjunto, busca])

  const amostra = itens.slice(0, 60)

  const seletor = (
    <div className="flex flex-wrap gap-1.5">
      {CONJUNTOS.map((c) => {
        const ativo = conjuntoId === c.id
        const I = c.Icone
        const n = dados[c.arquivo] ? contar(c, dados[c.arquivo]) : null
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              setConjuntoId(c.id)
              setBusca('')
            }}
            className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-2.5 text-[11.5px] font-bold transition-colors ${
              ativo
                ? 'border-panorama-navy bg-panorama-navy text-white'
                : 'border-slate-300 bg-white text-slate-600 hover:border-panorama-gold'
            }`}
          >
            <I className={`h-3.5 w-3.5 ${ativo ? 'text-panorama-gold' : c.cor}`} />
            {c.nome}
            {n !== null && (
              <span
                className={`rounded px-1 text-[9px] ${
                  ativo ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {n}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )

  /* ══════════ ABA: POR ARTIGO DE LEI ══════════ */
  if (conjuntoId === 'por-artigo') {
    return (
      <div className="space-y-3">
        {seletor}
        <BuscaPorArtigo
          verbetes={{
            '0': dados[ARQ_STF] || [],
            '1': dados[ARQ_STJ] || [],
            '2': dados[ARQ_TST] || [],
            '3': dados[ARQ_TEMAS] || [],
          }}
          onUsarTese={onUsarTese}
        />
      </div>
    )
  }

  /* ══════════ ABAS DE TEXTO ══════════ */
  return (
    <div className="space-y-3">
      {seletor}

      <div className="rounded-lg border-l-4 border-panorama-gold bg-amber-50/70 p-2.5">
        <p className="flex flex-wrap items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-800">
          <span className="rounded bg-panorama-navy px-1.5 py-0.5 text-panorama-gold-light">
            {conjunto.tribunal}
          </span>
          texto integral
          <span className="font-mono font-normal normal-case text-slate-500">
            extraído da fonte oficial em 02/11/2026
          </span>
        </p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-slate-700">{conjunto.descricao}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar no texto: ICMS, prescrição, penhora, dano moral…"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-8 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-panorama-navy focus:outline-none"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              aria-label="Limpar busca"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <span className="text-[11.5px] text-slate-600">
          <b>{itens.length}</b>
          {base.length ? ` de ${total}` : ''}
        </span>
        {conjunto.extra === 'cancelada' && base.length > 0 && (
          <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700 ring-1 ring-red-200">
            {base.filter((v) => v.c === 1).length} canceladas
          </span>
        )}
      </div>

      {carregando && (
        <p className="flex items-center gap-1.5 text-[12px] text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Baixando o texto integral…
        </p>
      )}

      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-2.5">
          <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-red-800">
            <AlertTriangle className="h-3.5 w-3.5" /> Não consegui carregar o arquivo
          </p>
          <p className="mt-0.5 font-mono text-[10.5px] text-red-700">
            {conjunto.arquivo} — {erro}
          </p>
        </div>
      )}

      {!carregando && !erro && itens.length === 0 && busca && (
        <p className="rounded-lg bg-slate-100 p-2.5 text-[11.5px] text-slate-600">
          Nenhum verbete contém todos os termos. Tente uma palavra só — a busca exige que todas
          apareçam.
        </p>
      )}

      <div className="space-y-1.5">
        {amostra.map((v) => (
          <article
            key={`${conjunto.id}-${v.k || v.n}`}
            className="rounded-lg border border-slate-200 bg-white p-2.5"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded bg-panorama-navy px-1.5 py-0.5 font-mono text-[10px] font-bold text-panorama-gold-light">
                {conjunto.extra === 'ramo' ? 'Tema' : 'Súmula'} {v.n}
              </span>
              {v.v === 1 && (
                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-black uppercase text-emerald-700 ring-1 ring-emerald-200">
                  vinculante
                </span>
              )}
              {v.c === 1 && (
                <span className="rounded bg-red-50 px-1.5 py-0.5 text-[9px] font-black uppercase text-red-700 ring-1 ring-red-200">
                  cancelada — não citar como vigente
                </span>
              )}
              {v.d && <span className="font-mono text-[9.5px] text-slate-400">{v.d}</span>}
              {v.o && (
                <span className="truncate text-[9.5px] text-slate-400" title={v.o}>
                  {v.o.length > 60 ? `${v.o.slice(0, 60)}…` : v.o}
                </span>
              )}
            </div>
            {v.a && (
              <p className="mt-1 text-[9.5px] font-bold uppercase tracking-wide text-slate-400">
                {v.a}
              </p>
            )}
            {v.r && (
              <p className="mt-0.5 text-[9.5px] font-bold uppercase tracking-wide text-slate-400">
                {v.r}
              </p>
            )}
            <p className="mt-1 text-[12px] leading-relaxed text-slate-800">{v.t}</p>
            {onUsarTese && (
              <button
                type="button"
                onClick={() => {
                  const t =
                    conjunto.id === 'stf-vinculantes' || conjunto.id === 'stf-simples'
                      ? 'STF'
                      : conjunto.id === 'stj-temas'
                        ? 'STJ'
                        : conjunto.id === 'stj-sumulas'
                          ? 'STJ'
                          : 'TST'
                  const tipo =
                    conjunto.id === 'stj-temas'
                      ? 'tema repetitivo'
                      : conjunto.id === 'stf-vinculantes'
                        ? 'súmula vinculante'
                        : 'súmula'
                  onUsarTese(verbeteParaJurisprudencia(t, tipo, v as VerbeteLike))
                }}
                className="mt-1.5 inline-flex min-h-[30px] items-center gap-1 rounded border border-panorama-navy bg-panorama-navy px-2 text-[10.5px] font-bold text-white hover:bg-slate-900"
              >
                <Send className="h-3 w-3 text-panorama-gold" /> Usar esta tese
              </button>
            )}
          </article>
        ))}
      </div>

      {itens.length > amostra.length && (
        <p className="rounded-lg bg-slate-100 p-2 text-[11px] text-slate-600">
          Mostrando os <b>{amostra.length}</b> primeiros de <b>{itens.length}</b>. Use a busca para
          chegar ao verbete que interessa.
        </p>
      )}

      <p className="flex items-start gap-1.5 rounded-lg bg-slate-50 p-2 text-[10px] leading-snug text-slate-500">
        <Download className="mt-0.5 h-3 w-3 shrink-0" />
        <span>
          Texto extraído das fontes oficiais e guardado em <code>/dados/</code>. Para atualizar,
          rode os scripts de extração e suba os arquivos de novo — não se copia súmula de memória:
          uma vírgula muda o sentido.
        </span>
      </p>
    </div>
  )
}
