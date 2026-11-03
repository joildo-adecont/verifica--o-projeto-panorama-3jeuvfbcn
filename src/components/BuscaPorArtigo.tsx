import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Loader2,
  AlertTriangle,
  Scale,
  Landmark,
  Gavel,
  FileText,
  Hash,
  Info,
} from 'lucide-react'

/**
 * BUSCA POR ARTIGO DE LEI — dentro das teses
 * ==========================================
 *
 * Pedido do CEO: "Buscar por artigo de lei dentro das teses".
 *
 * O usuário digita "156 do CTN" ou escolhe Código Tributário → art. 156, e vê
 * TODOS os verbetes que tratam daquele dispositivo — súmula do STF, do STJ, do
 * TST e tema repetitivo, cada um com o texto.
 *
 * ── A DECISÃO QUE DEFINE ESTA TELA ──
 * Uma súmula de 1963 que cita "Constituição Federal de 1946, art. 141" NÃO é
 * sobre o art. 141 da Constituição de 1988 — é outra carta, outro dispositivo.
 * O mesmo vale para CPC/1973 (revogado) e CC/1916. Por isso as normas antigas
 * têm chave PRÓPRIA (CF/1946, CPC/1973, CC/1916) e aparecem com selo de
 * "norma revogada / não vigente". Misturar as duas seria entregar ao advogado
 * a citação errada com cara de acerto.
 *
 * ── DE ONDE VEM A LIGAÇÃO ARTIGO → VERBETE ──
 *  0. STF: campo oficial `documental_legislacao_citada_texto` — dado curado.
 *  1. STJ: bloco "Referências Legislativas" do PDF oficial (LEG:/ART:).
 *  2. TST e 3. Temas do STJ: não têm campo; o artigo é lido do TEXTO da tese.
 * A tela mostra a origem de cada ligação: o usuário sabe o que é declaração do
 * tribunal e o que foi interpretado do texto.
 */

interface Indice {
  normas: Record<string, string>
  artigos: Record<string, Record<string, number[]>>
  origem: Record<string, string>
}

const GRUPOS = [
  { id: '0', rotulo: 'STF', Icone: Landmark, cor: 'text-indigo-700', bg: 'bg-indigo-50' },
  { id: '1', rotulo: 'STJ', Icone: FileText, cor: 'text-emerald-700', bg: 'bg-emerald-50' },
  { id: '2', rotulo: 'TST', Icone: Gavel, cor: 'text-amber-700', bg: 'bg-amber-50' },
  { id: '3', rotulo: 'Temas STJ', Icone: Scale, cor: 'text-rose-700', bg: 'bg-rose-50' },
]

/** Normas que não estão mais em vigor — o selo importa. */
const NAO_VIGENTES = new Set(['CF/1946', 'CF/1967', 'CPC/1973', 'CC/1916'])

/** Ordem de exibição: as vigentes primeiro, as revogadas depois. */
const ordemNorma = (k: string) => (NAO_VIGENTES.has(k) ? 1 : 0)

const semAcento = (s: string) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

export function BuscaPorArtigo({ verbetes }: { verbetes: Record<string, any[]> }) {
  const [indice, setIndice] = useState<Indice | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [norma, setNorma] = useState<string>('')
  const [artigo, setArtigo] = useState('')
  const [buscaLivre, setBuscaLivre] = useState('')

  useEffect(() => {
    let ativo = true
    fetch('dados/indice-artigos.json')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((j: Indice) => {
        if (ativo) setIndice(j)
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
  }, [])

  /**
   * Busca livre: aceita "156 CTN", "art. 5 CF", "156 do CTN".
   * Extrai o número e tenta casar a norma pelo nome ou pela sigla.
   */
  const alvoLivre = useMemo(() => {
    const t = buscaLivre.trim()
    if (!t || !indice) return null
    const m = t.match(/(\d{1,4}(?:\.\d{3})?)/)
    if (!m) return null
    const num = parseInt(m[1].replace('.', ''), 10)
    const resto = semAcento(t.replace(m[0], ' '))

    let chave = ''
    for (const k of Object.keys(indice.normas)) {
      const nome = semAcento(indice.normas[k])
      const sig = semAcento(k)
      if (resto.includes(sig) || (nome.length > 3 && resto.includes(nome))) {
        chave = k
        break
      }
    }
    // apelidos frequentes
    if (!chave) {
      if (/tributario|ctn/.test(resto)) chave = 'CTN'
      else if (/constituicao|cf/.test(resto)) chave = 'CF'
      else if (/trabalho|clt/.test(resto)) chave = 'CLT'
      else if (/processo civil|cpc/.test(resto)) chave = 'CPC'
      else if (/penal|cpp/.test(resto)) chave = 'CPP'
      else if (/civil|cc/.test(resto)) chave = 'CC'
      else if (/consumidor|cdc/.test(resto)) chave = 'CDC'
    }
    return chave ? { chave, num } : null
  }, [buscaLivre, indice])

  const chaveAtiva = norma || (alvoLivre ? alvoLivre.chave : '')
  const artigoAtivo = artigo || (alvoLivre ? String(alvoLivre.num) : '')

  const normasLista = useMemo(() => {
    if (!indice) return [] as string[]
    return Object.keys(indice.normas).sort((a, b) => {
      const d = ordemNorma(a) - ordemNorma(b)
      return d !== 0 ? d : indice.normas[a].localeCompare(indice.normas[b])
    })
  }, [indice])

  /** artigos existentes para a norma escolhida */
  const artigosDaNorma = useMemo(() => {
    if (!indice || !chaveAtiva) return [] as number[]
    const nums = new Set<number>()
    for (const k of Object.keys(indice.artigos)) {
      if (k.startsWith(`${chaveAtiva}|`)) nums.add(parseInt(k.split('|')[1], 10))
    }
    return Array.from(nums).sort((a, b) => a - b)
  }, [indice, chaveAtiva])

  const resultado = useMemo(() => {
    if (!indice || !chaveAtiva || !artigoAtivo) return null
    const k = `${chaveAtiva}|${parseInt(artigoAtivo, 10)}`
    const grupos = indice.artigos[k]
    if (!grupos) return { vazio: true as const }
    return { vazio: false as const, grupos }
  }, [indice, chaveAtiva, artigoAtivo])

  const totalLigacoes = useMemo(() => {
    if (!indice) return 0
    return Object.values(indice.artigos).reduce(
      (acc, g) => acc + Object.values(g).reduce((a, n) => a + n.length, 0),
      0,
    )
  }, [indice])

  return (
    <div className="space-y-3">
      <div className="rounded-lg border-l-4 border-panorama-gold bg-amber-50/70 p-2.5">
        <p className="flex flex-wrap items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-800">
          <Hash className="h-3 w-3" />
          Buscar por artigo dentro das teses
          {indice && (
            <span className="rounded bg-panorama-navy px-1.5 py-0.5 text-panorama-gold-light">
              {Object.keys(indice.artigos).length} artigos · {totalLigacoes} ligações
            </span>
          )}
        </p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-slate-700">
          Digite o artigo e a norma — &quot;156 do CTN&quot;, &quot;art. 5º da CF&quot; — ou escolha
          abaixo. Aparecem todos os verbetes que tratam daquele dispositivo, com o texto.
        </p>
      </div>

      {/* busca livre */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={buscaLivre}
          onChange={(e) => {
            setBuscaLivre(e.target.value)
            setNorma('')
            setArtigo('')
          }}
          placeholder="Ex.: 156 do CTN · art. 5 CF · 927 CPC · 477 CLT"
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-[12.5px] text-slate-800 placeholder:text-slate-400 focus:border-panorama-navy focus:outline-none"
        />
      </div>

      {carregando && (
        <p className="flex items-center gap-1.5 text-[12px] text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando o índice de artigos…
        </p>
      )}

      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-2.5">
          <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-red-800">
            <AlertTriangle className="h-3.5 w-3.5" /> Índice indisponível
          </p>
          <p className="mt-0.5 font-mono text-[10.5px] text-red-700">
            dados/indice-artigos.json — {erro}
          </p>
        </div>
      )}

      {/* seletores */}
      {indice && (
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[9.5px] font-black uppercase tracking-wider text-slate-500">
              Norma
            </label>
            <select
              value={chaveAtiva}
              onChange={(e) => {
                setNorma(e.target.value)
                setArtigo('')
                setBuscaLivre('')
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-[12px] text-slate-800 focus:border-panorama-navy focus:outline-none"
            >
              <option value="">Todas as normas…</option>
              {normasLista.map((k) => (
                <option key={k} value={k}>
                  {indice.normas[k]}
                  {NAO_VIGENTES.has(k) ? ' — não vigente' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[9.5px] font-black uppercase tracking-wider text-slate-500">
              Artigo
            </label>
            <select
              value={artigoAtivo}
              onChange={(e) => {
                setArtigo(e.target.value)
                setBuscaLivre('')
              }}
              disabled={!chaveAtiva}
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-[12px] text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 focus:border-panorama-navy focus:outline-none"
            >
              <option value="">
                {chaveAtiva
                  ? `Escolha entre ${artigosDaNorma.length} artigos…`
                  : 'Escolha a norma primeiro'}
              </option>
              {artigosDaNorma.map((n) => (
                <option key={n} value={String(n)}>
                  art. {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* aviso de norma revogada */}
      {chaveAtiva && NAO_VIGENTES.has(chaveAtiva) && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-2.5">
          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-amber-900">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              <b>Norma não vigente.</b> Os verbetes abaixo citam a {indice?.normas[chaveAtiva]} —
              que <b>não é</b> a norma de hoje. Uma súmula que cita o art. 141 da Constituição de
              1946 não trata do art. 141 da Constituição de 1988. Use a referência histórica como
              contexto, nunca como dispositivo atual.
            </span>
          </p>
        </div>
      )}

      {/* resultado */}
      {resultado && resultado.vazio && chaveAtiva && artigoAtivo && (
        <div className="rounded-lg bg-slate-100 p-2.5 text-[11.5px] text-slate-600">
          Nenhum verbete do acervo foi ligado ao{' '}
          <b>
            art. {artigoAtivo} {indice?.normas[chaveAtiva] ? `— ${indice.normas[chaveAtiva]}` : ''}
          </b>
          . Isso pode significar que nenhuma tese trata desse dispositivo, ou que a citação não
          estava declarada na fonte.
        </div>
      )}

      {resultado && !resultado.vazio && (
        <div className="space-y-2">
          {GRUPOS.map((g) => {
            const nums = resultado.grupos[g.id] || []
            if (!nums.length) return null
            const I = g.Icone
            return (
              <div
                key={g.id}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white"
              >
                <div
                  className={`flex items-center gap-1.5 border-b border-slate-200 ${g.bg} px-2.5 py-1.5`}
                >
                  <I className={`h-3.5 w-3.5 ${g.cor}`} />
                  <span className={`text-[11.5px] font-black ${g.cor}`}>{g.rotulo}</span>
                  <span className="rounded bg-white/70 px-1.5 text-[10px] font-bold text-slate-600">
                    {nums.length}
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {nums.map((n) => {
                    const v = (verbetes[g.id] || []).find((x: any) => x.n === n)
                    return (
                      <div key={n} className="px-2.5 py-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded bg-panorama-navy px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-panorama-gold-light">
                            {g.id === '3' ? 'Tema' : 'Súmula'} {n}
                          </span>
                          {v?.v === 1 && (
                            <span className="rounded bg-emerald-50 px-1 py-0.5 text-[8.5px] font-black uppercase text-emerald-700 ring-1 ring-emerald-200">
                              vinculante
                            </span>
                          )}
                          {v?.c === 1 && (
                            <span className="rounded bg-red-50 px-1 py-0.5 text-[8.5px] font-black uppercase text-red-700 ring-1 ring-red-200">
                              cancelada
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[11.5px] leading-relaxed text-slate-800">
                          {v ? v.t : '— texto não carregado nesta aba; veja em Súmulas e teses —'}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
          <p className="flex items-start gap-1.5 rounded-lg bg-slate-50 p-2 text-[10px] leading-snug text-slate-500">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            <span>
              <b>Origem das ligações:</b> STF — {indice?.origem['0']}; STJ — {indice?.origem['1']};
              TST — {indice?.origem['2']}; temas — {indice?.origem['3']}. O que veio do campo
              oficial é declaração do tribunal; o que veio do texto foi lido na própria tese.
            </span>
          </p>
        </div>
      )}

      {!chaveAtiva && indice && (
        <p className="rounded-lg bg-slate-50 p-2.5 text-[11px] leading-snug text-slate-600">
          <b>{normasLista.filter((k) => !NAO_VIGENTES.has(k)).length}</b> normas vigentes e{' '}
          <b>{normasLista.filter((k) => NAO_VIGENTES.has(k)).length}</b> históricas no índice. As
          históricas aparecem separadas de propósito: a Constituição de 1946 e o CPC de 1973 não são
          a Constituição de 1988 nem o CPC de 2015.
        </p>
      )}
    </div>
  )
}
