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
} from 'lucide-react'

/**
 * SÚMULAS E TESES EM TEXTO — aba do Acervo Jurídico
 * =================================================
 *
 * O texto integral dos verbetes, extraído das fontes oficiais e servido como
 * arquivo estático em /dados/ — NÃO dentro do bundle. Motivo: são ~1 MB de texto
 * e o app abriria 1 MB mais pesado para todo mundo que só quer ver o painel.
 * Aqui o arquivo só é baixado quando o usuário abre esta aba.
 *
 * ── DE ONDE VEM CADA CONJUNTO (todos extraídos em 02/11/2026) ──
 *  • STF vinculantes — 63, da SV 1 à 63. API de jurisprudência do STF.
 *  • STF simples — 736. Mesma API.
 *  • STJ súmulas — 649, da 1 à 649, sem lacuna. PDF oficial "SumulasSTJ.pdf".
 *  • TST súmulas — 363 vigentes de 463 históricas (123 marcadas canceladas).
 *    API jurisprudencia-backend.tst.jus.br.
 *  • Temas repetitivos do STJ — 1.152 com tese firmada. Portal de repetitivos.
 *    O número vai até 1.455: os que faltam não têm tese firmada (afetados,
 *    cancelados ou ainda em julgamento) — lacuna é o dado, não falha da coleta.
 */

type ConjuntoId = 'stf-vinculantes' | 'stf-simples' | 'stj-sumulas' | 'tst-sumulas' | 'stj-temas'

interface Conjunto {
  id: ConjuntoId
  nome: string
  arquivo: string
  tribunal: string
  descricao: string
  /** o que o campo `t` significa neste conjunto */
  rotuloTexto: string
  Icone: React.ComponentType<{ className?: string }>
  cor: string
  /** o que vale extra: 'vinculante' | 'cancelada' | 'ramo' */
  extra?: 'vinculante' | 'cancelada' | 'ramo'
}

const CONJUNTOS: Conjunto[] = [
  {
    id: 'stf-vinculantes',
    nome: 'Súmulas vinculantes',
    arquivo: 'dados/sumulas-stf.json',
    tribunal: 'STF',
    descricao:
      'As 63 súmulas vinculantes. Depois de editada, vinculam todo o Judiciário e a administração pública — é o grau mais alto de precedente que existe.',
    rotuloTexto: 'Enunciado',
    Icone: Landmark,
    cor: 'text-indigo-700',
    extra: 'vinculante',
  },
  {
    id: 'stf-simples',
    nome: 'Súmulas do STF',
    arquivo: 'dados/sumulas-stf.json',
    tribunal: 'STF',
    descricao:
      '736 súmulas simples: orientam, mas não vinculam. Continuam citáveis e mostram como o STF lê a Constituição.',
    rotuloTexto: 'Enunciado',
    Icone: Scale,
    cor: 'text-sky-700',
    extra: 'vinculante',
  },
  {
    id: 'stj-sumulas',
    nome: 'Súmulas do STJ',
    arquivo: 'dados/sumulas-stj.json',
    tribunal: 'STJ',
    descricao:
      '649 súmulas, da 1 à 649, do PDF oficial do STJ. É onde se confirma a leitura do CTN, do CPC e da lei federal.',
    rotuloTexto: 'Enunciado',
    Icone: FileText,
    cor: 'text-emerald-700',
  },
  {
    id: 'tst-sumulas',
    nome: 'Súmulas do TST',
    arquivo: 'dados/sumulas-tst.json',
    tribunal: 'TST',
    descricao:
      '363 súmulas vigentes da Justiça do Trabalho. As canceladas ficam marcadas — cancelada não se cita como se valesse.',
    rotuloTexto: 'Tese',
    Icone: Gavel,
    cor: 'text-amber-700',
    extra: 'cancelada',
  },
  {
    id: 'stj-temas',
    nome: 'Temas repetitivos (STJ)',
    arquivo: 'dados/temas-stj.json',
    tribunal: 'STJ',
    descricao:
      '1.152 teses firmadas em recursos repetitivos. É a jurisprudência que os tribunais são obrigados a seguir — a mais útil na prática.',
    rotuloTexto: 'Tese firmada',
    Icone: Scale,
    cor: 'text-rose-700',
    extra: 'ramo',
  },
]

interface Verbete {
  n: number
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

export function SumulasTeses() {
  const [conjuntoId, setConjuntoId] = useState<ConjuntoId>('stf-vinculantes')
  const [dados, setDados] = useState<Record<string, Verbete[]>>({})
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string>('')
  const [busca, setBusca] = useState('')

  const conjunto = CONJUNTOS.find((c) => c.id === conjuntoId)!

  useEffect(() => {
    if (dados[conjunto.arquivo]) return
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
        if (ativo) setErro(String(e.message || e))
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [conjunto.arquivo, dados])

  const base = dados[conjunto.arquivo] || []

  /**
   * O selo de contagem tem de ser o número DO CONJUNTO, não do arquivo.
   * Vinculantes e simples do STF moram no mesmo arquivo (799 verbetes): usar
   * `base.length` no selo anunciava "Súmulas vinculantes 799" — e são 63. Um
   * número desses, na porta de entrada, é pior que nenhum.
   */
  const contagem = (c: Conjunto, arr: Verbete[]) => {
    if (c.id === 'stf-vinculantes') return arr.filter((v) => v.v === 1).length
    if (c.id === 'stf-simples') return arr.filter((v) => v.v === 0).length
    return arr.length
  }

  const itens = useMemo(() => {
    let lista = base
    // STF: o mesmo arquivo serve às vinculantes e às simples
    if (conjunto.id === 'stf-vinculantes') lista = base.filter((v) => v.v === 1)
    if (conjunto.id === 'stf-simples') lista = base.filter((v) => v.v === 0)

    const t = semAcento(busca).trim()
    if (!t) return lista
    const termos = t.split(/\s+/)
    return lista.filter((v) => {
      const alvo = semAcento(`${v.n} ${v.t} ${v.a || ''} ${v.r || ''} ${v.o || ''} ${v.s || ''}`)
      return termos.every((p) => alvo.includes(p))
    })
  }, [base, busca, conjunto.id])

  const amostra = itens.slice(0, 60)

  return (
    <div className="space-y-3">
      {/* seletor de conjunto */}
      <div className="flex flex-wrap gap-1.5">
        {CONJUNTOS.map((c) => {
          const ativo = conjuntoId === c.id
          const carregado = !!dados[c.arquivo]
          const I = c.Icone
          return (
            <button
              key={c.id}
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
              {carregado && (
                <span
                  className={`rounded px-1 text-[9px] ${ativo ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}
                >
                  {contagem(c, dados[c.arquivo] || [])}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* cabeçalho do conjunto */}
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

      {/* busca */}
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
          {base.length ? ` de ${contagem(conjunto, base)}` : ''}
        </span>
        {conjunto.id === 'tst-sumulas' && base.length > 0 && (
          <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700 ring-1 ring-red-200">
            {base.filter((v) => v.c === 1).length} canceladas
          </span>
        )}
      </div>

      {/* estados */}
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
          <p className="mt-1 text-[10.5px] text-red-700">
            O arquivo é servido de <code>/dados/</code>. Se ele responde 404, a publicação não o
            incluiu.
          </p>
        </div>
      )}

      {/* verbetes */}
      {!carregando && !erro && itens.length === 0 && busca && (
        <p className="rounded-lg bg-slate-100 p-2.5 text-[11.5px] text-slate-600">
          Nenhum verbete contém todos os termos. Tente uma palavra só — a busca exige que todas
          apareçam.
        </p>
      )}

      {!busca && itens.length === 0 && !carregando && !erro && base.length > 0 && (
        <p className="rounded-lg bg-amber-50 p-2.5 text-[11.5px] text-amber-800">
          O arquivo carregou {base.length} verbetes, mas nenhum entrou neste filtro.
        </p>
      )}

      <div className="space-y-1.5">
        {amostra.map((v) => (
          <article
            key={`${conjunto.id}-${v.n}`}
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
