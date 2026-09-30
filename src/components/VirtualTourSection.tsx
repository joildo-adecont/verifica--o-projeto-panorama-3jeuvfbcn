import { useState } from 'react'
import { Eye, Maximize2, Compass, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function VirtualTourSection() {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <section
      id="tour"
      className="relative py-24 sm:py-32 bg-[#060D1A] text-[#F9F8F5] overflow-hidden"
    >
      {/* Golden gradient aura behind the iframe */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#C5A059]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10 text-center">
        {/* Header Tag */}
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#C5A059] mb-3">
          <Eye className="w-4 h-4" />
          Experiência Imersiva
        </div>

        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#F9F8F5] mb-4">
          Tour Virtual 360°
        </h2>

        <p className="max-w-2xl mx-auto text-stone-300 text-sm sm:text-base leading-relaxed mb-10">
          Navegue pelas áreas comuns, piscina suspensa e conheça a imponência do living decorado
          antes mesmo de agendar sua visita presencial.
        </p>

        {/* 360 Embed Container */}
        <div className="relative mx-auto rounded-2xl sm:rounded-3xl overflow-hidden border border-[#C5A059]/40 shadow-[0_0_50px_rgba(197,160,89,0.15)] bg-[#0B1528] aspect-[16/9] max-w-5xl">
          {isPlaying ? (
            <iframe
              src="https://momento360.com/e/u/06b1076bca954e339d672ea594192b0e?utm_campaign=embed&utm_source=other&heading=0&pitch=0&field-of-view=75&size=medium"
              title="Tour Virtual 360 Projeto Panorama"
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <div
              className="relative w-full h-full group cursor-pointer"
              onClick={() => setIsPlaying(true)}
            >
              {/* Cover preview image */}
              <img
                src="https://img.usecurling.com/p/1600/900?q=luxury%20modern%20penthouse%20living%20room%20360%20panorama"
                alt="Prévia do Tour 360"
                className="w-full h-full object-cover object-center filter brightness-90 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#060D1A] via-black/40 to-black/20" />

              {/* Play Badge Center */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#C5A059] text-[#0B1528] flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:bg-[#DFBE7C] transition-all duration-300 mb-4">
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1 fill-current" />
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mb-2">
                  Clique para Iniciar a Imersão 360°
                </h3>
                <p className="text-xs sm:text-sm text-stone-200 max-w-md">
                  Controle a câmera com o mouse ou toque para visualizar todos os ângulos da
                  residência
                </p>

                <div className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-[#C5A059]/40 text-xs text-[#C5A059]">
                  <Compass className="w-4 h-4 animate-spin" />
                  Navegação 360° interativa
                </div>
              </div>
            </div>
          )}

          {/* Golden Corner Accents */}
          <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#C5A059] pointer-events-none" />
          <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#C5A059] pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#C5A059] pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#C5A059] pointer-events-none" />
        </div>

        {/* Legend */}
        <p className="mt-6 text-xs sm:text-sm text-[#C5A059] tracking-wider font-medium">
          Explore cada detalhe do empreendimento em realidade virtual.
        </p>
      </div>
    </section>
  )
}
