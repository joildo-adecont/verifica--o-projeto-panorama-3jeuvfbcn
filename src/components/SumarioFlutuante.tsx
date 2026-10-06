import { useState, useEffect } from 'react'
import { ArrowUp, Compass } from 'lucide-react'

/**
 * Sumário flutuante — praticidade de navegação (SOMENTE apresentação):
 * - Botão "voltar ao topo" que aparece após rolar a página.
 * - Indicador discreto da seção atual (lido do menu lateral, sem lógica nova).
 * Não altera nenhuma função, cálculo ou dado do sistema.
 */

// Mesmos ids/labels do PanoramaSideMenu (fonte única de verdade visual)
const SECOES: { id: string; label: string }[] = [
  { id: 'secao-1', label: 'Normas' },
  { id: 'secao-2', label: 'Fato Gerador' },
  { id: 'secao-3', label: 'Cesta Básica' },
  { id: 'secao-4', label: 'Imunidades' },
  { id: 'secao-5', label: 'Isenções e Alíquotas' },
  { id: 'secao-6', label: 'Regimes Específicos' },
  { id: 'regime-imobiliario', label: '6A Imobiliário' },
  { id: 'agronegocio', label: '6B Agronegócio' },
  { id: 'consorcios', label: '6C Consórcios' },
  { id: 'financeiros', label: '6D Financeiros' },
  { id: 'simples', label: '6E Simples' },
  { id: 'profissionais-plataformas', label: '6F Profissionais' },
  { id: 'secao-7', label: 'Anexos' },
  { id: 'tabela-geral', label: '7A Tabela Geral' },
  { id: 'secao-8', label: 'Cronograma' },
  { id: 'fontes-agregador', label: 'Agregadores (Buscador)' },
  { id: 'secao-9', label: 'Fontes' },
  { id: 'fontes-primarias', label: 'Fontes primárias' },
  { id: 'central-entrega', label: 'Central de Entrega' },
  { id: 'assistentes-seguranca', label: 'Assistentes & Segurança' },
  { id: 'controle-acesso', label: 'Níveis de Acesso' },
  { id: 'responsividade-celulares', label: 'Responsividade' },
  { id: 'historico-atualizacoes', label: 'Histórico' },
]

export function SumarioFlutuante() {
  const [visivel, setVisivel] = useState(false)
  const [atual, setAtual] = useState('')

  useEffect(() => {
    const onScroll = () => {
      setVisivel(window.scrollY > 600)
      let nome = ''
      for (const s of SECOES) {
        const el = document.getElementById(s.id)
        if (el && el.getBoundingClientRect().top < 200) nome = s.label
      }
      setAtual(nome)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* Indicador discreto da seção atual (desktop) */}
      {visivel && atual && (
        <div className="hidden lg:flex fixed bottom-6 left-72 z-40 items-center gap-2 px-3 py-1.5 rounded-full bg-panorama-navy/90 backdrop-blur-sm text-panorama-gold-light text-[11px] font-semibold shadow-lg border border-panorama-gold/30 animate-fade-in">
          <Compass className="w-3.5 h-3.5" />
          <span>{atual}</span>
        </div>
      )}

      {/* Botão voltar ao topo */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-6 right-6 z-50 inline-flex items-center justify-center w-11 h-11 rounded-full bg-panorama-navy hover:bg-panorama-navy-light text-panorama-gold-light shadow-lg border border-panorama-gold/40 transition-all hover:-translate-y-0.5 hover:shadow-xl ${
          visivel ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        aria-label="Voltar ao topo"
        title="Voltar ao topo"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </>
  )
}
