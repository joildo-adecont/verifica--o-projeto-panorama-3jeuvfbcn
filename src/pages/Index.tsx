import { useState, useEffect } from 'react'
import { PanoramaHeader } from '@/components/PanoramaHeader'
import { PanoramaHero } from '@/components/PanoramaHero'
import { PanoramaSideMenu } from '@/components/PanoramaSideMenu'
import { SectionNorms } from '@/components/SectionNorms'
import { SectionFatoGerador } from '@/components/SectionFatoGerador'
import { SectionCestaBasica } from '@/components/SectionCestaBasica'
import { SectionImunidades } from '@/components/SectionImunidades'
import { SectionIsencoesAlíquotas } from '@/components/SectionIsencoesAliquots'
import { SectionRegimesEspecificos } from '@/components/SectionRegimesEspecificos'
import { SectionRegimeImobiliario } from '@/components/SectionRegimeImobiliario'
import { SectionAgronegocio } from '@/components/SectionAgronegocio'
import { SectionConsorcios } from '@/components/SectionConsorcios'
import { SectionFinanceiros } from '@/components/SectionFinanceiros'
import { SectionSimples } from '@/components/SectionSimples'
import { SectionProfissionaisPlataformas } from '@/components/SectionProfissionaisPlataformas'
import { SectionAnexos } from '@/components/SectionAnexos'
import { SectionTabelaGeral } from '@/components/SectionTabelaGeral'
import { SectionCronograma } from '@/components/SectionCronograma'
import { SectionFontes } from '@/components/SectionFontes'
import { SectionFontesAgregador } from '@/components/SectionFontesAgregador'
import { SectionFontesPrimarias } from '@/components/SectionFontesPrimarias'
import { SectionCentralEntrega } from '@/components/SectionCentralEntrega'
import { SectionAssistentesSeguranca } from '@/components/SectionAssistentesSeguranca'
import { SectionControleAcesso } from '@/components/SectionControleAcesso'
import { SectionResponsividade } from '@/components/SectionResponsividade'
import { SectionHistoricoAtualizacoes } from '@/components/SectionHistoricoAtualizacoes'
import { SumarioFlutuante } from '@/components/SumarioFlutuante'
import { PanoramaFooter } from '@/components/PanoramaFooter'
import { fetchTaxNorms } from '@/services/panorama'
import type { TaxNormItem } from '@/types/panorama'
import { Search } from 'lucide-react'

export default function Index() {
  const [norms, setNorms] = useState<TaxNormItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')

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

  // Filtragem global pelo termo de busca digitado no header
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
      {/* Menu lateral fixo de acesso rápido (teclas 1-9, Q, W, H) */}
      <PanoramaSideMenu />

      <SumarioFlutuante />
      <div className="lg:pl-60 flex flex-col min-h-screen">
        {/* 1. Header fixo com status de atualização, botões automáticos e busca */}
        <PanoramaHeader
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onManualRefresh={loadData}
        />

        {/* 2. Hero Banner com status 2026, destaque IBS/CBS e métricas de transição */}
        <PanoramaHero />

        {/* Feedback de busca ativa */}
        {searchTerm && (
          <div className="bg-blue-50 border-b border-blue-200 py-2.5 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-blue-900">
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  Filtrando visualização por: <strong>&quot;{searchTerm}&quot;</strong>
                </span>
              </div>
              <button
                onClick={() => setSearchTerm('')}
                className="text-blue-700 hover:underline font-bold"
              >
                Limpar busca
              </button>
            </div>
          </div>
        )}

        {/* Conteúdo principal com as 13 seções */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-16 flex-1 w-full">
          {/* Seção 1: Arcabouço normativo */}
          <SectionNorms norms={filteredNorms} loading={loading} />

          {/* Seção 2: Fato gerador, fornecimento e incidência */}
          <SectionFatoGerador />

          {/* Seção 3: Cesta Básica Nacional e exemplos */}
          <SectionCestaBasica />

          {/* Seção 4: Imunidades, não incidências e não tributações */}
          <SectionImunidades />

          {/* Seção 5: Isenções, diferimentos e reduções de alíquota */}
          <SectionIsencoesAlíquotas />

          {/* Seção 6: Regimes específicos e diferenciados */}
          <SectionRegimesEspecificos />

          {/* Seção 6A: Regime imobiliário — venda, locação, redutores e RET */}
          <SectionRegimeImobiliario />

          {/* Seção 6B: Regime do agronegócio — produtor rural, créditos presumidos e cooperativas */}
          <SectionAgronegocio />

          {/* Seção 6C: Consórcios */}
          <SectionConsorcios />

          {/* Seção 6D: Serviços financeiros */}
          <SectionFinanceiros />

          {/* Seção 6E: Simples Nacional */}
          <SectionSimples />

          {/* Seção 6F: Profissionais regulamentados e plataformas digitais */}
          <SectionProfissionaisPlataformas />

          {/* Seção 7: Anexos da reforma tributária */}
          <SectionAnexos />

          {/* Seção 7A: Tabela Geral dos Anexos — itens e alíquotas por anexo */}
          <SectionTabelaGeral />

          {/* Seção 8: Cronograma 2026–2033, simulador e pontos de atenção */}
          <SectionCronograma />

          {/* Seção 9: Fontes oficiais, governança de atualização e formulário de contato */}
          <SectionFontes />

          {/* Seção 11: Fontes de referência — agregadores especializados (Buscador NCM) */}
          <SectionFontesAgregador />

          {/* Seção 12: Índice das fontes oficiais primárias — 110 bases */}
          <SectionFontesPrimarias />

          {/* Seção 14: Central de Entrega — impressão e envio ao cliente */}
          <SectionCentralEntrega />

          {/* Seção 15: Central de Assistentes & Segurança */}
          <SectionAssistentesSeguranca />

          {/* Seção 16: Níveis de Acesso (CRUD) & Autorizações de Uso */}
          <SectionControleAcesso />

          {/* Seção 17: Responsividade em Celulares */}
          <SectionResponsividade />

          {/* Seção 13: Histórico de Atualizações — registro cronológico */}
          <SectionHistoricoAtualizacoes />
        </main>

        {/* Footer consolidado */}
        <PanoramaFooter />
      </div>
    </div>
  )
}
