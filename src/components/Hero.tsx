import { ChevronDown, Sparkles, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Hero() {
  const scrollTo = (id: string) => {
    const el = document.querySelector(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-[#0B1528]">
      {/* Background Image full-bleed */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://img.usecurling.com/p/1920/1080?q=modern%20luxury%20glass%20tower%20architecture%20sunset"
          alt="Projeto Panorama - Fachada Monumental"
          className="w-full h-full object-cover object-center scale-105 animate-fade-in"
        />
        {/* Deep navy & black overlay gradients for pristine legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1528] via-[#0B1528]/60 to-[#060D1A]/70" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#0B1528]/40 to-[#060D1A]/90" />
      </div>

      {/* Floating Badge Top Right: "Entrega 2026" */}
      <div className="absolute top-24 sm:top-28 right-4 sm:right-8 lg:right-16 z-20 animate-fade-in-down">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0B1528]/80 backdrop-blur-md border border-[#C5A059]/40 shadow-xl">
          <Sparkles className="w-3.5 h-3.5 text-[#C5A059] animate-pulse" />
          <span className="text-xs uppercase font-medium tracking-widest text-[#ECE8DF]">
            Entrega <strong className="text-[#C5A059] font-bold">2026</strong>
          </span>
        </div>
      </div>

      {/* Hero Content */}
      <div className="container relative z-20 mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl text-center pt-24 pb-20">
        {/* Eyebrow */}
        <div className="inline-block mb-4 sm:mb-6">
          <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-[0.35em] text-[#C5A059] bg-[#C5A059]/10 border border-[#C5A059]/30 px-4 py-1.5 rounded-full backdrop-blur-sm">
            <Building2 className="w-3.5 h-3.5" />
            Empreendimento de Alto Padrão
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-[#F9F8F5] leading-[1.08] mb-6 sm:mb-8 drop-shadow-md">
          Viva o Panorama <br className="hidden sm:inline" />
          <span className="italic font-light text-[#ECE8DF]">da sua Vida</span>
        </h1>

        {/* Subheadline */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-stone-300 font-normal leading-relaxed mb-10 sm:mb-12 font-sans drop-shadow">
          Apartamentos de 2 a 4 suítes com vista privilegiada, lazer completo e arquitetura
          contemporânea no coração da cidade.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <Button
            size="lg"
            onClick={() => scrollTo('#projeto')}
            className="w-full sm:w-auto bg-[#C5A059] hover:bg-[#DFBE7C] text-[#0B1528] font-semibold text-sm uppercase tracking-widest px-8 py-6 rounded-full shadow-2xl transition-all duration-300 hover:scale-105"
          >
            Conheça o Projeto
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => scrollTo('#contato')}
            className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-[#F9F8F5] border border-[#C5A059]/50 hover:border-[#C5A059] text-sm uppercase tracking-widest px-8 py-6 rounded-full backdrop-blur-md shadow-xl transition-all duration-300 hover:scale-105"
          >
            Fale com um Corretor
          </Button>
        </div>
      </div>

      {/* Floating mini stat card bottom-right: "98% vendido" */}
      <div className="hidden sm:flex absolute bottom-8 right-6 lg:right-12 z-20 animate-fade-in-up">
        <div className="bg-[#0B1528]/85 backdrop-blur-md border border-[#C5A059]/30 rounded-2xl p-4 sm:p-5 shadow-2xl flex items-center gap-4 max-w-xs">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C5A059] to-[#8C6D2C] flex items-center justify-center text-[#0B1528] font-bold text-lg shadow-inner">
            98%
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-[#F9F8F5] uppercase tracking-wider">
              Fase de Vendas
            </p>
            <p className="text-[11px] text-stone-300 leading-snug">
              Unidades exclusivas restantes na torre principal
            </p>
          </div>
        </div>
      </div>

      {/* Scroll indicator chevron bottom center */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 text-center">
        <button
          onClick={() => scrollTo('#projeto')}
          aria-label="Rolar para a seção O Projeto"
          className="group flex flex-col items-center text-stone-400 hover:text-[#C5A059] transition-colors focus:outline-none"
        >
          <span className="text-[10px] uppercase tracking-[0.25em] font-medium mb-1 opacity-70 group-hover:opacity-100">
            Explorar
          </span>
          <ChevronDown className="w-5 h-5 animate-bounce text-[#C5A059]" />
        </button>
      </div>
    </section>
  )
}
