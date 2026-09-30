import { useState, useEffect } from 'react'
import { Images, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'
import type { GalleryItem } from '@/types/panorama'
import { fetchGalleryItems } from '@/services/panorama'

export function GallerySection() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('Todos')

  useEffect(() => {
    let isMounted = true
    async function load() {
      const data = await fetchGalleryItems()
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

  const categories = [
    'Todos',
    ...(Array.from(new Set(items.map((i) => i.category).filter(Boolean))) as string[]),
  ]

  const filteredItems =
    filterCategory === 'Todos' ? items : items.filter((i) => i.category === filterCategory)

  // Lightbox handlers
  const openLightbox = (index: number) => {
    setLightboxIndex(index)
  }

  const closeLightbox = () => {
    setLightboxIndex(null)
  }

  const showNext = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % filteredItems.length)
    }
  }

  const showPrev = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + filteredItems.length) % filteredItems.length)
    }
  }

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') showNext()
      if (e.key === 'ArrowLeft') showPrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxIndex, filteredItems.length])

  return (
    <section id="galeria" className="relative py-24 sm:py-32 bg-[#0B1528] text-[#F9F8F5]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#C5A059] mb-3">
            <Images className="w-4 h-4" />
            Galeria de Imagens
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#F9F8F5] mb-4">
            Cada Ângulo, Uma Obra de Arte
          </h2>
          <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
            Descubra os ambientes planejados com sofisticação atemporal, materiais nobres e
            acabamentos artesanais de altíssimo padrão.
          </p>

          {/* Filter Pills */}
          {categories.length > 2 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`text-xs uppercase tracking-wider px-4 py-2 rounded-full transition-all duration-300 font-medium ${
                    filterCategory === cat
                      ? 'bg-[#C5A059] text-[#0B1528] shadow-md scale-105'
                      : 'bg-[#162238] text-stone-300 hover:text-white hover:bg-[#162238]/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Responsive Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-72 rounded-2xl bg-[#162238]/50 animate-pulse border border-[#162238]"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                onClick={() => openLightbox(index)}
                className={`group relative rounded-2xl overflow-hidden cursor-pointer border border-[#162238] hover:border-[#C5A059]/50 shadow-xl transition-all duration-500 hover:-translate-y-1.5 ${
                  // Make the first and 5th items span 2 columns on larger screens for masonry feel
                  index === 0 || index === 5 ? 'sm:col-span-2 sm:row-span-2' : ''
                }`}
              >
                <div className="w-full h-full min-h-[260px] sm:min-h-[300px] overflow-hidden bg-[#162238]">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                </div>

                {/* Hover overlay with title & zoom icon */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1528]/90 via-[#0B1528]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      {item.category && (
                        <span className="text-[10px] uppercase font-bold tracking-widest text-[#C5A059]">
                          {item.category}
                        </span>
                      )}
                      <h3 className="font-serif text-lg font-bold text-white mt-0.5">
                        {item.title}
                      </h3>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-[#C5A059] text-[#0B1528] flex items-center justify-center shadow-md">
                      <ZoomIn className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Subdued corner badge when not hovered */}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-[#0B1528]/70 backdrop-blur-sm border border-white/10 text-[10px] text-stone-300 group-hover:opacity-0 transition-opacity">
                  {item.category || 'Panorama'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && filteredItems[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 select-none animate-fade-in"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            aria-label="Fechar ampliação"
            className="absolute top-6 right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-[#C5A059] text-white hover:text-[#0B1528] transition-all flex items-center justify-center z-50 focus:outline-none"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous Button */}
          <button
            onClick={showPrev}
            aria-label="Imagem anterior"
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-[#C5A059] text-white hover:text-[#0B1528] transition-all flex items-center justify-center z-50 focus:outline-none"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>

          {/* Next Button */}
          <button
            onClick={showNext}
            aria-label="Próxima imagem"
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-[#C5A059] text-white hover:text-[#0B1528] transition-all flex items-center justify-center z-50 focus:outline-none"
          >
            <ChevronRight className="w-7 h-7" />
          </button>

          {/* Active Image Box */}
          <div
            className="relative max-w-5xl max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={filteredItems[lightboxIndex].image_url}
              alt={filteredItems[lightboxIndex].title}
              className="max-h-[72vh] max-w-full w-auto object-contain rounded-xl border border-[#C5A059]/40 shadow-2xl"
            />
            {/* Caption */}
            <div className="mt-4 text-center">
              <span className="text-xs uppercase tracking-widest text-[#C5A059] font-medium">
                {filteredItems[lightboxIndex].category} • {lightboxIndex + 1} de{' '}
                {filteredItems.length}
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mt-1">
                {filteredItems[lightboxIndex].title}
              </h3>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
