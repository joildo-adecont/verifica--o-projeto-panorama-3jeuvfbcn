import { useState, useEffect, useCallback, useMemo } from 'react'
import { ChevronRight, ChevronLeft, Home } from 'lucide-react'
import { PanoramaHeader } from '@/components/PanoramaHeader'
import { PanoramaSideMenu } from '@/components/PanoramaSideMenu'
import { MenuNavegacaoPortal } from '@/components/MenuNavegacaoPortal'
import { PanoramaHero } from '@/components/PanoramaHero'
import { PanoramaFooter } from '@/components/PanoramaFooter'
import { PainelInicial } from '@/components/PainelInicial'
import { SectionIndicadoresEconomicos } from '@/components/SectionIndicadoresEconomicos'
import { PainelAtalhos } from '@/components/PainelAtalhos'
import { SumarioFlutuante } from '@/components/SumarioFlutuante'
import { resolverRota, vizinhas, RotaAba } from '@/lib/rotas'
import { fetchTaxNorms, triggerSourceCheck } from '@/services/panorama'
import type { TaxNormItem } from '@/types/panorama'

export default function Index() {
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [norms, setNorms] = useState<TaxNormItem[]>([])
  const [loadingNorms, setLoadingNorms] = useState<boolean>(true)
  const [hash, setHash] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.hash : '',
  )

  // Escuta alteração do hash na URL (navegação por abas)
  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash)
      // Rola o miolo da aba para o topo
      const miolo = document.getElementById('miolo-aba')
      if (miolo) {
        miolo.scrollTop = 0
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Carrega normas para alimentar o roteador (SectionNorms recebe norms)
  const carregarNormas = useCallback(async () => {
    setLoadingNorms(true)
    try {
      const data = await fetchTaxNorms()
      setNorms(data)
    } catch (e) {
      console.error('Falha ao carregar normas fiscais:', e)
    } finally {
      setLoadingNorms(false)
    }
  }, [])

  useEffect(() => {
    carregarNormas()
  }, [carregarNormas])

  // Disparo manual de verificação no header
  const handleManualRefresh = async () => {
    await triggerSourceCheck()
    await carregarNormas()
  }

  // Resolve a rota atual com base no hash
  const rotaAtiva: RotaAba | null = useMemo(() => resolverRota(hash), [hash])
  const viz = useMemo(() => (rotaAtiva ? vizinhas(rotaAtiva.id) : null), [rotaAtiva])

  // Filtra normas com base no termo de busca digitado no header
  const normasFiltradas = useMemo(() => {
    if (!searchTerm.trim()) return norms
    const t = searchTerm.toLowerCase().trim()
    return norms.filter(
      (n) =>
        n.title.toLowerCase().includes(t) ||
        (n.summary && n.summary.toLowerCase().includes(t)) ||
        (n.code && n.code.toLowerCase().includes(t)) ||
        (n.status_incidence && n.status_incidence.toLowerCase().includes(t)) ||
        (n.norm_type && n.norm_type.toLowerCase().includes(t)) ||
        (n.origin && n.origin.toLowerCase().includes(t)),
    )
  }, [norms, searchTerm])
  const ComponenteAba = rotaAtiva ? rotaAtiva.Componente : null

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 antialiased font-sans">
      {/* CABEÇALHO GLOBAL COM LOGO ADECONT, BUSCA E ACESSO AO CADASTRO DE CLIENTES */}
      <PanoramaHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onManualRefresh={handleManualRefresh}
      />

      {/* MENU LATERAL FIXO (DESKTOP) E GAVETA (MOBILE) */}
      <PanoramaSideMenu hashAtivo={hash} />

      {/* CORPO DA PLATAFORMA (com recuo lg:pl-60 para acomodar o menu lateral) */}
      <div className="flex-1 flex flex-col lg:pl-60">
        <main
          id="miolo-aba"
          className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
        >
          {/* MENU DE NAVEGAÇÃO DO PORTAL — faixa visível em todas as telas da rota / */}
          <MenuNavegacaoPortal hashAtivo={hash} />

          {/* TRILHA DE NAVEGAÇÃO (BREADCRUMB) */}
          <nav
            aria-label="Trilha de navegação"
            className="flex items-center gap-1.5 text-xs text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-xs flex-wrap"
          >
            <a
              href="#inicio"
              className="inline-flex items-center gap-1 text-slate-600 hover:text-panorama-navy font-semibold transition-colors"
            >
              <Home className="w-3.5 h-3.5 text-panorama-gold" />
              <span>Início</span>
            </a>

            {rotaAtiva ? (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                {rotaAtiva.grupo && (
                  <>
                    <span className="text-slate-400 font-medium">Seção {rotaAtiva.grupo}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  </>
                )}
                <span className="text-panorama-navy font-bold truncate">{rotaAtiva.titulo}</span>
              </>
            ) : (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-panorama-navy font-bold">
                  Painel Inicial & Indicadores Econômicos
                </span>
              </>
            )}
          </nav>

          {/* RENDERIZAÇÃO DO CONTEÚDO */}
          {ComponenteAba ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 shadow-xs">
              <ComponenteAba norms={normasFiltradas} loading={loadingNorms} />

              {/* BOTÕES ANTERIOR E PRÓXIMA NO PÉ DA ABA */}
              {viz && (viz.anterior || viz.proxima) && (
                <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between gap-4 flex-wrap">
                  {viz.anterior ? (
                    <a
                      href={`#${viz.anterior.id}`}
                      className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-slate-500" />
                      <span>Anterior: {viz.anterior.titulo}</span>
                    </a>
                  ) : (
                    <a
                      href="#inicio"
                      className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <Home className="w-4 h-4 text-slate-500" />
                      <span>Voltar ao Início</span>
                    </a>
                  )}

                  {viz.proxima && (
                    <a
                      href={`#${viz.proxima.id}`}
                      className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-panorama-navy hover:bg-panorama-navy-dark rounded-lg transition-colors ml-auto shadow-xs"
                    >
                      <span>Próxima: {viz.proxima.titulo}</span>
                      <ChevronRight className="w-4 h-4 text-amber-300" />
                    </a>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ROTA INICIAL / PORTAL PANORAMA RT (Hero, Painel Inicial e Indicadores Econômicos) */
            <div className="space-y-8 animate-in fade-in duration-150">
              <PanoramaHero />
              <PainelInicial />
              <SectionIndicadoresEconomicos />
            </div>
          )}
        </main>

        {/* RODAPÉ INSTITUCIONAL (aparece apenas no Início / porta de entrada) */}
        {!rotaAtiva && <PanoramaFooter />}
      </div>

      {/* AUXILIARES FLUTUANTES DA PLATAFORMA */}
      <PainelAtalhos />
      <SumarioFlutuante />
    </div>
  )
}
