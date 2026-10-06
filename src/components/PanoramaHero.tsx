import { ShieldCheck, Calendar, Layers, ArrowRight, Info, FileCheck } from 'lucide-react'
import { AdecontLogo } from '@/components/AdecontLogo'

export function PanoramaHero() {
  return (
    <div className="bg-gradient-to-br from-panorama-navy via-[#12244A] to-panorama-navy-dark text-white py-12 md:py-16 px-4 sm:px-6 relative overflow-hidden border-b-4 border-panorama-gold/80">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:22px_22px] pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-panorama-gold/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-5">
            {/* Tag institucional com logo ADECONT e selo do guia */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-white/95 rounded-lg px-3 py-1.5 shadow-sm inline-flex items-center">
                <AdecontLogo
                  variant="color"
                  showTagline={false}
                  className="h-8 w-auto max-w-[145px]"
                />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-semibold tracking-wide">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>PUBLICAÇÃO TÉCNICA OFICIAL • VERSÃO 2026/2027</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Panorama da Reforma Tributária —{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-panorama-gold-light via-panorama-gold to-amber-200">
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
                className="inline-flex items-center gap-2 bg-panorama-gold hover:bg-panorama-gold-light text-panorama-navy font-bold text-xs sm:text-sm px-5 py-2.5 rounded-lg shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Ver Arcabouço Normativo</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="#secao-8"
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/15 font-medium text-xs sm:text-sm px-4 py-2.5 rounded-lg backdrop-blur-sm transition-colors"
              >
                <Calendar className="w-4 h-4 text-panorama-gold-light" />
                <span>Cronograma de Transição</span>
              </a>

              <a
                href="#secao-6"
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/15 font-medium text-xs sm:text-sm px-4 py-2.5 rounded-lg backdrop-blur-sm transition-colors"
              >
                <Layers className="w-4 h-4 text-panorama-gold-light" />
                <span>Regimes Específicos (Consórcios & Imóveis)</span>
              </a>
            </div>
          </div>

          {/* Quick Metrics Card */}
          <div className="lg:col-span-4 bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4 ring-1 ring-panorama-gold/20 transition-shadow hover:shadow-[0_20px_60px_-15px_rgba(197,160,89,0.25)]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Status Operacional 2026
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-panorama-gold/20 text-panorama-gold-light border border-panorama-gold/40">
                Fase de Teste em Vigor
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="bg-panorama-navy-dark/70 p-3 rounded-lg border border-panorama-gold/20">
                <span className="text-[11px] text-slate-400 block font-medium">
                  IBS-Teste (2026)
                </span>
                <span className="text-xl font-bold text-panorama-gold-light">0,1%</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Compensável PIS/Cofins
                </span>
              </div>
              <div className="bg-panorama-navy-dark/70 p-3 rounded-lg border border-panorama-gold/20">
                <span className="text-[11px] text-slate-400 block font-medium">
                  CBS-Teste (2026)
                </span>
                <span className="text-xl font-bold text-panorama-gold-light">0,9%</span>
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

            <div className="p-2.5 rounded-lg bg-panorama-gold/10 border border-panorama-gold/30 text-[11px] text-panorama-gold-light flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-panorama-gold-light shrink-0 mt-0.5" />
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
