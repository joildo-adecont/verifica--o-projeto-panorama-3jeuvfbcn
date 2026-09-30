import { useState, useEffect } from 'react'
import {
  MapPin,
  Navigation,
  Trees,
  UtensilsCrossed,
  ShoppingBag,
  GraduationCap,
  Hospital,
  Clock,
} from 'lucide-react'
import type { NeighborhoodItem } from '@/types/panorama'
import { fetchNeighborhoodItems } from '@/services/panorama'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Trees,
  UtensilsCrossed,
  ShoppingBag,
  GraduationCap,
  Hospital,
}

export function NeighborhoodSection() {
  const [items, setItems] = useState<NeighborhoodItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    async function load() {
      const data = await fetchNeighborhoodItems()
      if (isMounted) {
        setItems(data)
        setLoading(false)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section id="bairro" className="relative py-24 sm:py-32 bg-[#060D1A] text-[#F9F8F5]">
      {/* Decorative background glow */}
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-[#C5A059]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#C5A059] mb-3">
            <MapPin className="w-4 h-4" />
            Localização Privilegiada
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#F9F8F5] mb-4">
            O Melhor da Cidade ao seu Redor
          </h2>
          <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
            Uma vizinhança arborizada, segura e cosmopolita, onde a conveniência de fazer tudo a pé
            encontra a tranquilidade de ruas calmas e arborizadas.
          </p>
        </div>

        {/* Content Layout: Left items list, Right contextual Urban image / map representation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: POI List from collection */}
          <div className="lg:col-span-7 space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="h-20 rounded-xl bg-[#162238]/60 animate-pulse" />
                ))}
              </div>
            ) : (
              items.map((item) => {
                const IconComponent =
                  item.icon && iconMap[item.icon] ? iconMap[item.icon] : Navigation
                return (
                  <div
                    key={item.id}
                    className="group p-5 rounded-2xl bg-[#0B1528] border border-[#162238] hover:border-[#C5A059]/50 transition-all duration-300 shadow-md flex items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-4">
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-xl bg-[#162238] border border-[#C5A059]/30 flex-shrink-0 flex items-center justify-center text-[#C5A059] group-hover:bg-[#C5A059] group-hover:text-[#0B1528] transition-colors">
                        <IconComponent className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div>
                        <h4 className="font-serif text-lg font-bold text-[#F9F8F5] group-hover:text-[#DFBE7C] transition-colors">
                          {item.name}
                        </h4>
                        {item.description && (
                          <p className="text-xs sm:text-sm text-stone-300 mt-0.5 line-clamp-1 sm:line-clamp-none font-normal">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Distance Badge */}
                    <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/30 text-xs text-[#C5A059] font-medium whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{item.distance}</span>
                    </div>
                  </div>
                )
              })
            )}

            {/* Address bar */}
            <div className="p-4 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center gap-3 text-xs sm:text-sm text-[#ECE8DF]">
              <MapPin className="w-5 h-5 text-[#C5A059] flex-shrink-0" />
              <span>
                <strong>Endereço do Stand de Vendas:</strong> Alameda dos Ipês Nobres, 1200 —
                Jardins, São Paulo - SP
              </span>
            </div>
          </div>

          {/* Right Column: High Quality Urban / Neighborhood Imagery */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border border-[#C5A059]/30 shadow-2xl group">
              <img
                src="https://img.usecurling.com/p/800/1000?q=luxury%20city%20neighborhood%20sunset%20aerial%20skyline"
                alt="Vista aérea da vizinhança nobre"
                className="w-full h-[450px] sm:h-[520px] object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#060D1A] via-transparent to-transparent" />

              {/* Pin overlay over city image */}
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C5A059] opacity-75" />
                  <div className="relative w-12 h-12 rounded-full bg-[#C5A059] text-[#0B1528] flex items-center justify-center font-bold shadow-2xl border-2 border-white">
                    <MapPin className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-2 px-3 py-1 bg-[#0B1528]/90 backdrop-blur-md border border-[#C5A059]/40 rounded-full text-[11px] font-bold text-white shadow-xl">
                  Projeto Panorama
                </div>
              </div>

              {/* Bottom detail pill */}
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-[#0B1528]/90 backdrop-blur-md border border-[#162238]">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#C5A059]">
                  Mobilidade & Qualidade de Vida
                </p>
                <p className="text-xs text-stone-200 mt-1 leading-snug">
                  Acesso facilitado às principais vias expressas e heliponto a menos de 4 minutos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
