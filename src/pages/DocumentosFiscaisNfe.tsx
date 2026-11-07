import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { AdecontLogo } from '@/components/AdecontLogo'
import { SectionNfesPipeline } from '@/components/SectionNfesPipeline'

export const DocumentosFiscaisNfePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 flex flex-col">
      {/* Cabeçalho padrão ADECONT */}
      <header className="bg-[#0F294A] border-b border-[#0A1D34] shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <AdecontLogo variant="white" showTagline={false} className="h-10 sm:h-12 w-auto" />
            <div className="border-l border-white/20 pl-3">
              <h1 className="text-base sm:text-lg font-serif font-bold tracking-wide text-white leading-tight">
                Pipeline de Documentos Fiscais (NF-e)
              </h1>
              <p className="text-[11px] sm:text-xs text-[#D4AF37] font-semibold tracking-wider uppercase">
                Assessoria Contábil e Administrativa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <Link
              to="/cadastro-clientes"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-100 transition-colors border border-white/10"
              title="Ir para o Cadastro Analítico de Clientes"
            >
              <span>Cadastro de Clientes</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#c29f2f] text-xs font-bold text-[#0F294A] transition-colors shadow-sm"
              title="Voltar ao portal Panorama RT"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Portal Panorama RT</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <SectionNfesPipeline />
      </main>

      {/* Rodapé institucional */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ADECONT Assessoria Contábil e Administrativa • Pipeline Inteligente de NF-e</span>
          <span className="text-[11px] text-slate-400 font-mono">
            Agentes Nativos de Inteligência Tributária
          </span>
        </div>
      </footer>
    </div>
  )
}

export default DocumentosFiscaisNfePage
