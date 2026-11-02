import { useState, useEffect } from 'react'
import { X, Search, ChevronRight, ChevronDown } from 'lucide-react'
import { GRUPOS, HOME, DOMINIOS_HIERARQUIA } from '@/components/navegacao'

/**
 * MENU LATERAL — agora NAVEGA ENTRE ABAS (29/10/2026)
 *
 * Mudança ligada ao pedido "cada aba com o seu conteúdo, sem rolagem de tela".
 *
 * Antes: clicar no menu fazia `scrollIntoView` até a âncora de uma seção que já
 * estava renderizada logo abaixo das outras 23. A página era uma pilha; o menu
 * era um atalho de rolagem.
 *
 * Agora: clicar TROCA A ABA. O hash muda, o Index desmonta a aba anterior e monta
 * a nova. Não existe mais conteúdo alheio na tela, e o item ativo é lido do hash
 * em vez de ser deduzido pela posição de rolagem — o que também elimina o
 * "destaque errado" que aparecia quando duas seções ficavam visíveis ao mesmo tempo.
 *
 * MENU LATERAL — AGRUPADO
 *
 * Antes: 24 itens em lista plana, com uma duplicata ("Fontes primárias" duas
 * vezes, uma dizendo 115 e outra 110 bases). Numa coluna estreita, 24 linhas do
 * mesmo peso visual não têm hierarquia: o olho não acha nada.
 *
 * Agora: os mesmos itens, com as mesmas teclas, organizados nos cinco grupos.
 * Cada grupo abre e fecha, e o que está aberto mostra os itens. Os grupos já
 * começam abertos quando não há filtro, para nada ficar escondido.
 */

const GRUPOS_UI = GRUPOS.map((g) => ({
  ...g,
  /* dominioId liga o grupo a um domínio da hierarquia, para o nível setor
   * saber onde buscar o nome e o ícone de cada setor. Sem este campo o
   * segundo nível não teria como resolver 'combustiveis' -> "Combustíveis". */
  /* O id do grupo NÃO é sempre o id do domínio ('fundamentos' contém seções do
   * domínio 'nucleo'). Deduzimos o domínio do próprio item — é a fonte de
   * verdade — e o grupo só agrupa. */
  dominioId: g.itens.find((i) => i.dominio)?.dominio || g.id,
  itens: g.itens.map((n) => ({
    id: n.href,
    tecla: n.tecla,
    numero: n.numero || '',
    label: n.label,
    setor: n.setor,
    Icon: n.Icon,
    cor: n.cor,
    bg: n.bg,
    borda: n.borda,
    tags: n.tags,
  })),
}))

const TODOS = GRUPOS_UI.flatMap((g) => g.itens)

// Não há mais seção "no DOM" para rolar: o hash é a rota da aba.
const irPara = (id: string) => {
  const destino = id || '#inicio'
  if (window.location.hash === destino) {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  } else {
    window.location.hash = destino
  }
}

export function PanoramaSideMenu() {
  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState<string>('')
  const [filtro, setFiltro] = useState('')
  const [fechados, setFechados] = useState<Record<string, boolean>>({})

  const filtrando = filtro.trim() !== ''
  const norm = (s: string) =>
    (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

  const gruposVisiveis = GRUPOS_UI.map((g) => {
    if (!filtrando) return { ...g, visiveis: g.itens }
    const t = norm(filtro)
    // filtro por rótulo, número e sinônimos (mesmas tags do painel inicial)
    const doGrupo = g.itens.filter((i) =>
      norm(`${i.label} ${i.numero} ${(i.tags || []).join(' ')}`).includes(t),
    )
    const grupoCasa = norm(g.nome).includes(t) || norm(g.proposito).includes(t)
    return { ...g, visiveis: grupoCasa && !doGrupo.length ? g.itens : doGrupo }
  }).filter((g) => g.visiveis.length > 0)

  // Teclas de atalho — inalteradas
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      const digitando = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT'
      if (e.key === 'Escape') {
        setAberto(false)
        return
      }
      if (digitando) return
      if (e.key === '/') {
        e.preventDefault()
        const busca = document.querySelector<HTMLInputElement>('input[type="text"]')
        if (busca) busca.focus()
        return
      }
      if (e.altKey || e.ctrlKey || e.metaKey) return
      const item = TODOS.find((i) => i.tecla === e.key.toLowerCase())
      if (item) {
        e.preventDefault()
        setAberto(false)
        irPara(item.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Item ativo = a aba aberta, lida do hash. Não depende mais de rolagem.
  useEffect(() => {
    const ler = () => setAtivo((window.location.hash || '#inicio').replace('#', ''))
    ler()
    window.addEventListener('hashchange', ler)
    return () => window.removeEventListener('hashchange', ler)
  }, [])

  const ir = (item: { id: string }) => {
    setAberto(false)
    irPara(item.id)
  }

  const conteudo = (
    <div className="flex flex-col h-full">
      <div className="px-3 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Navegação
          </span>
          <button
            onClick={() => setAberto(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-slate-700"
            aria-label="Fechar menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Filtrar seções…"
            className="w-full pl-8 pr-2 py-2 text-[13px] rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 bg-slate-50"
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
          Teclas <b>1–9</b> e letras · <b>/</b> busca · <b>Esc</b> fecha
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto py-1.5">
        {/* DESTAQUE MÁXIMO BEM NO INÍCIO: INSTALADOR E CONTROLE DE VERSÃO DO PROGRAMA */}
        {(() => {
          const itemInstalador = TODOS.find((i) => i.id === '#instalador-versao')
          if (!itemInstalador) return null
          const isAtivo = ativo === 'instalador-versao'
          return (
            <div className="px-2 py-1 mb-1">
              <button
                onClick={() => ir(itemInstalador)}
                className={`w-full flex items-center gap-2 px-2.5 py-2.5 rounded-xl text-left transition-all border-2 shadow-xs group cursor-pointer ${
                  isAtivo
                    ? 'bg-gradient-to-r from-panorama-navy via-slate-900 to-[#0F294A] text-white border-panorama-gold shadow-md'
                    : 'bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-blue-500/10 text-slate-900 border-panorama-gold/80 hover:border-panorama-gold hover:bg-amber-100/50 hover:shadow-md'
                }`}
                title="Atalho: Tecla U — Instalador e Controle de Versão (CEO)"
              >
                <div
                  className={`inline-flex items-center justify-center w-8 h-8 shrink-0 rounded-lg shadow-sm border ${
                    isAtivo
                      ? 'bg-panorama-gold text-panorama-navy border-panorama-gold-light'
                      : 'bg-gradient-to-br from-panorama-gold via-amber-400 to-panorama-gold-dark text-panorama-navy border-amber-300'
                  }`}
                >
                  <itemInstalador.Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-panorama-gold text-panorama-navy">
                      #1 CEO
                    </span>
                    <span
                      className={`text-[9px] font-bold ${
                        isAtivo ? 'text-amber-300' : 'text-amber-800'
                      }`}
                    >
                      INSTALADOR
                    </span>
                  </div>
                  <div
                    className={`text-[12px] font-black leading-tight truncate ${
                      isAtivo ? 'text-white' : 'text-slate-900 group-hover:text-panorama-navy'
                    }`}
                  >
                    Instalador & Versão
                  </div>
                </div>

                <kbd
                  className={`px-1.5 py-0.5 rounded text-[10px] font-black font-mono shrink-0 shadow-xs ${
                    isAtivo
                      ? 'bg-panorama-gold text-panorama-navy'
                      : 'bg-white text-panorama-navy border border-panorama-gold/60'
                  }`}
                >
                  U
                </kbd>
              </button>
            </div>
          )
        })()}

        {/* Início */}
        <button
          onClick={() => ir({ id: HOME.href })}
          className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[12px] font-bold transition-colors ${
            ativo === '' || ativo === 'inicio'
              ? 'bg-panorama-gold/10 text-panorama-gold-dark border-l-2 border-panorama-gold'
              : 'text-slate-700 hover:bg-slate-100 border-l-2 border-transparent'
          }`}
        >
          <span className="inline-flex items-center justify-center w-6 h-6 shrink-0 rounded-md border bg-slate-100 border-slate-300 text-slate-800">
            <HOME.Icon className="w-3.5 h-3.5" />
          </span>
          <span className="flex-1">Início</span>
          <kbd className="px-1 rounded text-[9px] font-mono bg-slate-100 text-slate-400">0</kbd>
        </button>

        {gruposVisiveis.map((g) => {
          const fechado = !filtrando && fechados[g.id]
          return (
            <div key={g.id} className="mt-1">
              <button
                onClick={() => setFechados((v) => ({ ...v, [g.id]: !v[g.id] }))}
                className="w-full flex items-center gap-1.5 px-3 py-1.5 text-left hover:bg-slate-50 cursor-pointer"
              >
                <ChevronDown
                  className={`w-3 h-3 text-slate-400 transition-transform shrink-0 ${fechado ? '-rotate-90' : ''}`}
                />
                <g.Icon className={`w-3.5 h-3.5 shrink-0 ${g.cor}`} />
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 flex-1">
                  {g.nome}
                </span>
                <span className="text-[9px] font-mono text-slate-400">{g.visiveis.length}</span>
              </button>

              {!fechado &&
                /* ── NÍVEL 2: SETOR (02/11/2026) ──
                 * Antes de listar as seções, agrupa por setor. Sem isto, o
                 * grupo "Setores da Economia" abriria 14 rótulos soltos e a
                 * hierarquia existiria só no papel. Com isto, o usuário vê
                 * "Combustíveis", "Saúde", "Educação"… e abre o que interessa.
                 * Quando o grupo tem menos de 7 itens, o nível setor é omitido:
                 * um degrau a mais para 2 itens só atrapalharia. */
                (() => {
                  const setoresDoGrupo = Array.from(
                    new Set(g.visiveis.map((i) => i.setor).filter(Boolean)),
                  ) as string[]
                  const usarNivelSetor = setoresDoGrupo.length > 1 && g.visiveis.length >= 7
                  const blocos: { setor: string | null; itens: typeof g.visiveis }[] =
                    usarNivelSetor
                      ? setoresDoGrupo.map((s) => ({
                          setor: s,
                          itens: g.visiveis.filter((i) => i.setor === s),
                        }))
                      : [{ setor: null, itens: g.visiveis }]

                  return blocos.map((bloco) => {
                    const nomeSetor = bloco.setor
                      ? DOMINIOS_HIERARQUIA.find((d) => d.id === g.dominioId)?.setores.find(
                          (s) => s.id === bloco.setor,
                        )
                      : null
                    const SetorIcon = nomeSetor?.Icon
                    const setorFechado = !!fechados[`${g.id}:${bloco.setor}`]
                    /* Não repete o nome: quando o setor tem UMA seção só e o
                     * rótulo dela é igual ao nome do setor, o cabeçalho seria
                     * uma linha idêntica em cima do item. Medido na tela em
                     * 02/11/2026: aparecia "Combustíveis e Energia" duas vezes
                     * seguidas. Nesse caso o item sozinho já diz tudo. */
                    const repetiria =
                      bloco.itens.length === 1 && bloco.itens[0].label === nomeSetor?.nome
                    return (
                      <div key={bloco.setor || 'flat'}>
                        {nomeSetor && !repetiria && (
                          <button
                            onClick={() =>
                              setFechados((v) => ({
                                ...v,
                                [`${g.id}:${bloco.setor}`]: !v[`${g.id}:${bloco.setor}`],
                              }))
                            }
                            className="flex w-full items-center gap-1.5 px-3 py-1 pl-5 text-left hover:bg-slate-50"
                          >
                            <ChevronDown
                              className={`h-2.5 w-2.5 shrink-0 text-slate-400 transition-transform ${
                                setorFechado ? '-rotate-90' : ''
                              }`}
                            />
                            {SetorIcon && <SetorIcon className="h-3 w-3 shrink-0 text-slate-500" />}
                            <span className="flex-1 truncate text-[10.5px] font-bold text-slate-600">
                              {nomeSetor.nome}
                            </span>
                            <span className="font-mono text-[9px] text-slate-400">
                              {bloco.itens.length}
                            </span>
                          </button>
                        )}
                        {(!nomeSetor || !setorFechado) &&
                          bloco.itens.map((item) => {
                            const { Icon } = item
                            const isAtivo = ativo === item.id.replace('#', '')
                            return (
                              <button
                                key={item.id}
                                onClick={() => ir(item)}
                                className={`w-full flex items-center gap-2 pl-6 pr-3 py-1.5 text-left text-[12px] font-semibold transition-colors ${
                                  isAtivo
                                    ? 'bg-panorama-gold/10 text-panorama-gold-dark border-l-2 border-panorama-gold'
                                    : 'text-slate-700 hover:bg-slate-100 hover:text-panorama-gold-dark border-l-2 border-transparent'
                                }`}
                                title={`Tecla ${item.tecla.toUpperCase()} — ${item.label}`}
                              >
                                <span
                                  className={`inline-flex items-center justify-center w-6 h-6 shrink-0 rounded-md border ${item.bg} ${item.borda} ${item.cor}`}
                                >
                                  <Icon className="w-3.5 h-3.5" />
                                </span>
                                <span className="flex-1 leading-tight truncate">{item.label}</span>
                                <kbd
                                  className={`px-1 rounded text-[9px] font-mono shrink-0 ${
                                    isAtivo
                                      ? 'bg-panorama-gold/20 text-panorama-gold-dark'
                                      : 'bg-slate-100 text-slate-400'
                                  }`}
                                >
                                  {item.tecla.toUpperCase()}
                                </kbd>
                              </button>
                            )
                          })}
                      </div>
                    )
                  })
                })()}
            </div>
          )
        })}

        {!gruposVisiveis.length && (
          <p className="px-3 py-4 text-xs text-slate-400">Nenhuma seção encontrada.</p>
        )}
      </nav>

      <div className="px-3 py-2 border-t border-slate-200 text-[10px] text-slate-400 flex items-center justify-between">
        <span>Panorama · ADECONT</span>
        <button
          onClick={() => ir({ id: '#inicio' })}
          className="hover:text-slate-700 font-bold cursor-pointer"
        >
          ⌂ início
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Menu fixo lateral — somente telas grandes */}
      <aside className="hidden lg:block fixed left-0 top-[64px] bottom-0 w-60 bg-white border-r border-slate-200 z-40 shadow-sm border-t-2 border-t-panorama-gold/60">
        {conteudo}
      </aside>

      {/* Botão flutuante para abrir a gaveta (telas menores) */}
      <button
        onClick={() => setAberto(true)}
        className="lg:hidden fixed bottom-4 left-4 z-50 inline-flex items-center gap-2 bg-panorama-navy hover:bg-panorama-navy-light text-panorama-gold-light text-xs font-bold px-4 py-3 rounded-full shadow-lg border border-panorama-gold/40"
        aria-label="Abrir menu de seções"
      >
        ☰ Seções
      </button>

      {/* Gaveta — telas menores */}
      {aberto && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setAberto(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-2xl">{conteudo}</div>
        </div>
      )}
    </>
  )
}
