import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Home as HomeIcon } from 'lucide-react'
import { PanoramaHeader } from '@/components/PanoramaHeader'
import { PainelInicial } from '@/components/PainelInicial'
import { PanoramaSideMenu } from '@/components/PanoramaSideMenu'
import { SumarioFlutuante } from '@/components/SumarioFlutuante'
import { PainelAtalhos } from '@/components/PainelAtalhos'
import { PanoramaFooter } from '@/components/PanoramaFooter'
import { ID_INICIO, resolverRota, vizinhas } from '@/lib/rotas'
import { NAVEGACAO } from '@/components/navegacao'
import { fetchTaxNorms } from '@/services/panorama'
import type { TaxNormItem } from '@/types/panorama'

/**
 * PÁGINA ÚNICA → UMA ABA POR VEZ (29/10/2026)
 *
 * ── O QUE MUDOU ──
 * Antes este arquivo renderizava as 24 seções EMPILHADAS: uma página de rolagem
 * interminável, onde "ir para" era rolar até a âncora e o conteúdo anterior
 * continuava ocupando a tela. O CEO pediu: "coloque em cada aba o seu conteúdo,
 * não necessitando de rolagem de tela".
 *
 * Agora só a aba ativa é montada. Trocar de aba desmonta a anterior — não há mais
 * 24 seções no DOM nem rolagem entre assuntos. O que sobra de rolagem é a do
 * conteúdo daquela aba específica, e nada além dele.
 *
 * ── POR QUE O HASH MANDA ──
 * Os links internos já espalhados pelo sistema (`href="#tabela-geral"` dentro da
 * Central de Indicadores, do Monitor e do painel inicial) continuam valendo sem
 * tocar em nenhum deles, o botão Voltar do navegador funciona, e a aba aberta é
 * compartilhável por link.
 *
 * ── O QUE FICA FORA DAS ABAS ──
 * Header (busca e status) e menu lateral continuam fixos, como moldura. O painel
 * inicial é uma aba também — a rota "Início", que não é seção de conteúdo.
 */

export default function Index() {
  const [norms, setNorms] = useState<TaxNormItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')

  /** Rota atual lida do hash. Vazio = Início (painel de acompanhamento). */
  const [hash, setHash] = useState<string>(() =>
    typeof window === 'undefined' ? '' : window.location.hash,
  )

  const loadData = async () => {
    setLoading(true)
    try {
      const items = await fetchTaxNorms()
      setNorms(items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  /**
   * O hash é a fonte de verdade da aba. Escutamos `hashchange` em vez de guardar
   * estado paralelo: assim um link interno, o botão Voltar e o menu lateral
   * convergem para o mesmo lugar.
   */
  useEffect(() => {
    const onHash = () => {
      setHash(window.location.hash)
      // aba nova sempre começa no topo do conteúdo — sem herdar a rolagem da anterior
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    }
    onHash()
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const navegar = useCallback((id: string) => {
    const destino = id === ID_INICIO ? '#inicio' : `#${id}`
    if (window.location.hash === destino) {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
      return
    }
    window.location.hash = destino
  }, [])

  const rota = resolverRota(hash)
  const idAtual = rota?.id ?? ID_INICIO
  const itemNav = rota ? NAVEGACAO.find((n) => n.href === `#${rota.id}`) : null
  const { anterior, proxima } = rota ? vizinhas(rota.id) : { anterior: null, proxima: null }

  // busca do header continua filtrando as normas da Seção 1
  const filteredNorms = norms.filter((n) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      n.code.toLowerCase().includes(term) ||
      n.title.toLowerCase().includes(term) ||
      n.summary.toLowerCase().includes(term) ||
      n.status_incidence.toLowerCase().includes(term)
    )
  })

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white flex flex-col font-sans">
      <PanoramaSideMenu />
      <SumarioFlutuante />
      <PainelAtalhos />

      <div className="lg:pl-60 flex flex-col min-h-screen">
        <PanoramaHeader
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onManualRefresh={loadData}
        />

        {/* Trilha: onde estou, e como voltar — substitui a rolagem como orientação */}
        {rota && (
          <div className="w-full border-b border-slate-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => navegar(ID_INICIO)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-panorama-navy cursor-pointer"
              >
                <HomeIcon className="w-3 h-3" />
                Início
              </button>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              {itemNav?.numero && (
                <>
                  <span className="text-[11px] font-bold text-slate-400">
                    Seção {itemNav.numero}
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-300" />
                </>
              )}
              <span className="text-[11px] font-bold text-panorama-navy">{rota.titulo}</span>
              {itemNav?.tecla && (
                <kbd className="ml-1 px-1 rounded bg-slate-100 text-[9px] font-mono text-slate-400">
                  {itemNav.tecla.toUpperCase()}
                </kbd>
              )}
              <button
                onClick={() => navegar(ID_INICIO)}
                className="ml-auto text-[10px] font-bold text-slate-400 hover:text-panorama-navy cursor-pointer"
              >
                ← voltar ao painel
              </button>
            </div>
          </div>
        )}

        {/* Feedback de busca ativa — só na aba de Normas, onde ela filtra de fato */}
        {searchTerm && idAtual === 'secao-1' && (
          <div className="bg-blue-50 border-b border-blue-200 py-2 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] text-blue-900">
              <span>
                Filtrando normas por: <strong>&quot;{searchTerm}&quot;</strong> —{' '}
                {filteredNorms.length} de {norms.length}
              </span>
              <button
                onClick={() => setSearchTerm('')}
                className="text-blue-700 hover:underline font-bold"
              >
                Limpar
              </button>
            </div>
          </div>
        )}

        {/*
          CONTEÚDO — UMA ABA POR VEZ.
          Só a aba ativa é montada. Sem `hidden` nas outras: montar as 24 e esconder
          manteria o custo de render e o risco de rolagem residual, que é exatamente
          o que o pedido elimina.
        */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex-1 w-full">
          {rota ? (
            <div key={rota.id}>
              <rota.Componente norms={filteredNorms} loading={loading} />
            </div>
          ) : (
            <div>
              <PainelInicial />
            </div>
          )}
        </main>

        {/* Navegação entre abas, no pé do conteúdo — sem precisar voltar ao menu */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full pb-6">
          <div className="flex items-stretch gap-2 border-t border-slate-200 pt-3">
            {anterior ? (
              <button
                onClick={() => navegar(anterior.id)}
                className="flex-1 flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-left hover:border-panorama-gold hover:bg-panorama-gold/5 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-[9px] font-bold uppercase tracking-wide text-slate-400">
                    Anterior
                  </span>
                  <span className="block text-[11.5px] font-bold text-slate-700 truncate">
                    {anterior.titulo}
                  </span>
                </span>
              </button>
            ) : (
              <button
                onClick={() => navegar(ID_INICIO)}
                className="flex-1 flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-left hover:border-panorama-gold hover:bg-panorama-gold/5 transition-colors cursor-pointer"
              >
                <HomeIcon className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-[9px] font-bold uppercase tracking-wide text-slate-400">
                    Anterior
                  </span>
                  <span className="block text-[11.5px] font-bold text-slate-700 truncate">
                    Painel inicial
                  </span>
                </span>
              </button>
            )}

            {proxima ? (
              <button
                onClick={() => navegar(proxima.id)}
                className="flex-1 flex items-center gap-2 justify-end rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-right hover:border-panorama-gold hover:bg-panorama-gold/5 transition-colors cursor-pointer"
              >
                <span className="min-w-0">
                  <span className="block text-[9px] font-bold uppercase tracking-wide text-slate-400">
                    Próxima
                  </span>
                  <span className="block text-[11.5px] font-bold text-slate-700 truncate">
                    {proxima.titulo}
                  </span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            ) : (
              <button
                onClick={() => navegar(ID_INICIO)}
                className="flex-1 flex items-center gap-2 justify-end rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-right hover:border-panorama-gold hover:bg-panorama-gold/5 transition-colors cursor-pointer"
              >
                <span className="min-w-0">
                  <span className="block text-[9px] font-bold uppercase tracking-wide text-slate-400">
                    Fim da lista
                  </span>
                  <span className="block text-[11.5px] font-bold text-slate-700 truncate">
                    Voltar ao painel
                  </span>
                </span>
                <HomeIcon className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            )}
          </div>
        </div>

        <PanoramaFooter />
      </div>
    </div>
  )
}
