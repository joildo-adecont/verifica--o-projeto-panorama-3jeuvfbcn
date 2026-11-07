import React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  LineChart,
  FileSpreadsheet,
  Clock,
  Sparkles,
  Users2,
  Layers,
  ChevronRight,
} from 'lucide-react'
import { AdecontLogo } from '@/components/AdecontLogo'

/**
 * Página: Análises Empresariais
 *
 * Ponto de partida para o novo módulo administrativo da ADECONT (Projeto Panorama).
 * Conforme solicitação do usuário:
 * "Crie um icone que chamaremos de Análises Empresarial a qual enviarei um modelo para iniciarmos uma adequação."
 *
 * Estrutura profissional seguindo estritamente as diretrizes ADECONT:
 * - Sem dados falsos inventados.
 * - Identidade visual oficial: #0F294A (navy) e #D4AF37 (gold).
 * - Tagline oficial: "Assessoria Contábil e Administrativa".
 * - Logo AdecontLogo em destaque.
 * - Estado de espera elegante e informativo aguardando o modelo de referência do cliente.
 */
export const AnalisesEmpresariaisPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 flex flex-col">
      {/* Cabeçalho padrão ADECONT */}
      <header className="bg-[#0F294A] border-b border-[#0A1D34] shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <AdecontLogo variant="white" showTagline={false} className="h-10 sm:h-12 w-auto" />
            <div className="border-l border-white/20 pl-3">
              <h1 className="text-base sm:text-lg font-serif font-bold tracking-wide text-white leading-tight">
                Análises Empresariais
              </h1>
              <p className="text-[11px] sm:text-xs text-[#D4AF37] font-semibold tracking-wider uppercase">
                Assessoria Contábil e Administrativa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-wrap">
            <Link
              to="/cadastro-clientes"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-100 transition-colors border border-white/10"
              title="Ir para o Cadastro Analítico de Clientes"
            >
              <Users2 className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Cadastro de Clientes</span>
            </Link>
            <Link
              to="/nfes"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-100 transition-colors border border-white/10"
              title="Ir para Documentos Fiscais (NF-e)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-purple-300" />
              <span>Documentos Fiscais</span>
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Trilha de navegação / Breadcrumb */}
        <nav
          aria-label="Trilha de navegação"
          className="flex items-center gap-1.5 text-xs text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-xs"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-slate-600 hover:text-[#0F294A] font-semibold transition-colors"
          >
            <span>Início</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-400 font-medium">Plataforma Administrativa</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-[#0F294A] font-bold">Análises Empresariais</span>
        </nav>

        {/* Card principal com estado vazio elegante */}
        <div className="bg-white rounded-2xl border-2 border-slate-200/80 p-6 sm:p-10 shadow-xs">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Ícone de destaque do módulo */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-[#0F294A] text-white shadow-md ring-8 ring-emerald-50">
              <BarChart3 className="w-10 h-10 text-emerald-200" />
            </div>

            {/* Cabeçalho do módulo */}
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Módulo em estruturação
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0F294A] tracking-tight">
                Análises Empresariais
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-[#D4AF37] tracking-wider uppercase">
                Assessoria Contábil e Administrativa
              </p>
              <p className="text-sm text-slate-600 max-w-xl mx-auto pt-2 leading-relaxed">
                Este módulo está em estruturação — aguardando modelo de referência para iniciarmos a
                adequação completa das análises, relatórios e indicadores.
              </p>
            </div>

            {/* Caixa informativa com padrão ADECONT */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 sm:p-6 text-left space-y-4">
              <div className="flex items-center gap-2.5 text-[#0F294A] font-bold text-sm">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <span>Próxima etapa: Adequação com base no modelo corporativo</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                O módulo já está integrado ao menu da plataforma administrativa e pronto para
                receber o layout analítico, gráficos de evolução patrimonial, índices de liquidez,
                rentabilidade e diagnósticos de saúde financeira da carteira de clientes.
              </p>

              {/* Pilares previstos para o módulo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-white p-3 rounded-lg border border-slate-200/80 flex items-start gap-2.5">
                  <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">Evolução Econômica</h3>
                    <p className="text-[11px] text-slate-500">
                      Indicadores de desempenho e faturamento
                    </p>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200/80 flex items-start gap-2.5">
                  <div className="p-1.5 rounded-md bg-blue-50 text-blue-700 shrink-0">
                    <LineChart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">Diagnóstico Gerencial</h3>
                    <p className="text-[11px] text-slate-500">Métricas analíticas personalizadas</p>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200/80 flex items-start gap-2.5">
                  <div className="p-1.5 rounded-md bg-purple-50 text-purple-700 shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">Visão por Empresa</h3>
                    <p className="text-[11px] text-slate-500">
                      Cruzamento com o cadastro de clientes
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ações auxiliares */}
            <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F294A] hover:bg-[#163b65] text-white text-xs font-bold transition-colors shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao Portal</span>
              </Link>
              <Link
                to="/cadastro-clientes"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors"
              >
                <Users2 className="w-4 h-4 text-slate-500" />
                <span>Acessar Cadastro de Clientes</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Rodapé institucional */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ADECONT Assessoria Contábil e Administrativa • Análises Empresariais</span>
          <span className="text-[11px] text-slate-400 font-mono">
            Módulo em Estruturação • Versão Inicial
          </span>
        </div>
      </footer>
    </div>
  )
}

export default AnalisesEmpresariaisPage
