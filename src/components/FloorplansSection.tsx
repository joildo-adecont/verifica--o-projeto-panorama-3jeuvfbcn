import { useState, useEffect } from 'react'
import { LayoutGrid, Check, Maximize2, Car, BedDouble, Download, PhoneCall } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FloorplanItem } from '@/types/panorama'
import { fetchFloorplans } from '@/services/panorama'

export function FloorplansSection() {
  const [plans, setPlans] = useState<FloorplanItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    async function load() {
      const data = await fetchFloorplans()
      if (isMounted) {
        setPlans(data)
        setLoading(false)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [])

  const currentPlan = plans[selectedIndex]

  return (
    <section id="plantas" className="relative py-24 sm:py-32 bg-[#0B1528] text-[#F9F8F5]">
      {/* Background accents */}
      <div className="absolute top-1/3 left-10 w-96 h-96 bg-[#C5A059]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#C5A059] mb-3">
            <LayoutGrid className="w-4 h-4" />
            Tipologias Exclusivas
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#F9F8F5] mb-4">
            Plantas Inteligentes e Sob Medida
          </h2>
          <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
            Quatro concepções arquitetônicas que valorizam a amplitude, a iluminação natural e o
            máximo aproveitamento de cada metro quadrado.
          </p>

          {/* Typology Switcher Tabs */}
          {!loading && plans.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-8">
              {plans.map((p, idx) => {
                const isSelected = selectedIndex === idx
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedIndex(idx)}
                    className={`relative px-6 py-3 rounded-full text-sm font-semibold tracking-wider uppercase transition-all duration-300 ${
                      isSelected
                        ? 'bg-[#C5A059] text-[#0B1528] shadow-lg shadow-[#C5A059]/20 scale-105'
                        : 'bg-[#162238] text-stone-300 hover:text-white hover:bg-[#162238]/80 border border-[#162238]'
                    }`}
                  >
                    {p.name}
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-[#C5A059]" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Selected Typology Showcase */}
        {loading ? (
          <div className="h-96 rounded-3xl bg-[#162238]/40 animate-pulse border border-[#162238]" />
        ) : currentPlan ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center bg-[#060D1A]/90 rounded-3xl border border-[#C5A059]/30 p-6 sm:p-10 shadow-2xl">
            {/* Left Col: Floorplan Blueprint/Drawing */}
            <div className="lg:col-span-7 relative group">
              <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-[#162238] p-4 sm:p-6 flex items-center justify-center min-h-[380px] sm:min-h-[440px]">
                <img
                  src={currentPlan.image_url}
                  alt={`Planta ${currentPlan.name} - Projeto Panorama`}
                  className="max-h-[360px] sm:max-h-[420px] w-auto object-contain transition-transform duration-500 group-hover:scale-105 filter invert brightness-90 contrast-125"
                />

                {/* Tag on blueprint */}
                <div className="absolute top-4 left-4 px-3 py-1 rounded-md bg-[#0B1528]/90 border border-[#C5A059]/40 text-xs text-[#C5A059] font-medium tracking-wider">
                  Tipologia {currentPlan.name}
                </div>

                <div className="absolute bottom-4 right-4 px-3 py-1 rounded-md bg-[#0B1528]/90 border border-white/10 text-[11px] text-stone-300">
                  Ilustração artística da planta
                </div>
              </div>
            </div>

            {/* Right Col: Specifications & Features */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              <div>
                <div className="inline-block px-3 py-1 rounded-full bg-[#C5A059]/15 border border-[#C5A059]/30 text-xs font-semibold text-[#C5A059] tracking-widest uppercase mb-3">
                  {currentPlan.tagline || 'Exclusividade'}
                </div>

                <h3 className="font-serif text-3xl sm:text-4xl font-bold text-[#F9F8F5]">
                  Residência {currentPlan.name}
                </h3>

                <p className="text-stone-300 text-sm sm:text-base leading-relaxed mt-4 font-normal">
                  {currentPlan.description}
                </p>
              </div>

              {/* Key Specs Pills */}
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-[#162238]">
                <div className="p-3.5 rounded-xl bg-[#0B1528] border border-[#162238]">
                  <div className="flex items-center gap-2 text-xs text-stone-300 mb-1">
                    <Maximize2 className="w-4 h-4 text-[#C5A059]" />
                    <span>Área Privativa</span>
                  </div>
                  <div className="font-serif text-2xl font-bold text-[#F9F8F5]">
                    {currentPlan.area}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0B1528] border border-[#162238]">
                  <div className="flex items-center gap-2 text-xs text-stone-300 mb-1">
                    <BedDouble className="w-4 h-4 text-[#C5A059]" />
                    <span>Configuração</span>
                  </div>
                  <div className="font-serif text-sm font-bold text-[#F9F8F5] leading-tight">
                    {currentPlan.suites_parking.split('•')[0]?.trim()}
                  </div>
                </div>
              </div>

              {/* Additional highlights list */}
              <div className="space-y-2 text-xs sm:text-sm text-stone-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#C5A059]" />
                  <span>{currentPlan.suites_parking}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#C5A059]" />
                  <span>Elevador privativo com biometria facial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#C5A059]" />
                  <span>Infraestrutura completa para automação residencial</span>
                </div>
              </div>

              {/* CTA */}
              <div className="pt-2">
                <Button
                  asChild
                  className="w-full bg-[#C5A059] hover:bg-[#DFBE7C] text-[#0B1528] font-bold text-xs uppercase tracking-widest py-6 rounded-full shadow-lg"
                >
                  <a href="#contato">Solicitar Memorial Descritivo & Preços</a>
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
