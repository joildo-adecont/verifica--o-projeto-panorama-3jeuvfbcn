import {
  Scale,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  TrendingDown,
  Info,
  Building2,
  FileCheck,
} from 'lucide-react'

export function PanoramaHero() {
  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white py-12 md:py-16 px-4 sm:px-6 relative overflow-hidden border-b border-slate-800">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-semibold tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>GUIA PRÁTICO OFICIAL & CONSOLIDADO — VERSÃO 2026/2027</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Panorama da Reforma Tributária —{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300">
                IBS / CBS & Imposto Seletivo
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
              Consolidação técnica completa de todas as normas da nova tributação sobre o consumo:
              fato gerador, split payment, regras da Cesta Básica Nacional, regimes específicos
              (consórcios, imobiliário, serviços financeiros), cronograma detalhado de transição
              2026–2033 e monitoramento contínuo das resoluções do Comitê Gestor (CGIBS).
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#secao-1"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-lg shadow-sm transition-all"
              >
                <span>Ver Arcabouço Normativo</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="#secao-8"
                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs sm:text-sm px-4 py-2.5 rounded-lg transition-colors"
              >
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>Cronograma de Transição</span>
              </a>

              <a
                href="#secao-6"
                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs sm:text-sm px-4 py-2.5 rounded-lg transition-colors"
              >
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Regimes Específicos (Consórcios & Imóveis)</span>
              </a>
            </div>
          </div>

          {/* Quick Metrics Card */}
          <div className="lg:col-span-4 bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Status Operacional 2026
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Fase de Teste em Vigor
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/40">
                <span className="text-[11px] text-slate-400 block font-medium">
                  IBS-Teste (2026)
                </span>
                <span className="text-xl font-bold text-white">0,1%</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Compensável PIS/Cofins
                </span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/40">
                <span className="text-[11px] text-slate-400 block font-medium">
                  CBS-Teste (2026)
                </span>
                <span className="text-xl font-bold text-white">0,9%</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Total teste: 1,0%</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-start gap-2 text-xs text-slate-300">
                <FileCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>03/08/2026:</strong> Preenchimento obrigatório nos documentos fiscais do
                  regime regular.
                </span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-300">
                <Calendar className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  <strong>2027:</strong> Extinção do PIS/Cofins e início da CBS plena e Imposto
                  Seletivo.
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-900/60 text-[11px] text-blue-200 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <span>
                Alíquota estimada 2033 (IBSLab): <strong>≈ 26,5%</strong> (17,7% IBS + 8,8% CBS).
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
