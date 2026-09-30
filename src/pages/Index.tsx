import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { ProjectSection } from '@/components/ProjectSection'
import { VirtualTourSection } from '@/components/VirtualTourSection'
import { GallerySection } from '@/components/GallerySection'
import { NeighborhoodSection } from '@/components/NeighborhoodSection'
import { FloorplansSection } from '@/components/FloorplansSection'
import { ContactSection } from '@/components/ContactSection'
import { Footer } from '@/components/Footer'

export default function Index() {
  return (
    <div className="min-h-screen bg-[#0B1528] text-[#F9F8F5] selection:bg-[#C5A059] selection:text-[#0B1528]">
      {/* 1. Header Fixo com blur e drawer mobile */}
      <Header />

      {/* 2. Hero full-viewport */}
      <Hero />

      {/* 3. O Projeto (duas colunas + 4 diferenciais) */}
      <ProjectSection />

      {/* 4. Tour Virtual 360° incorporado */}
      <VirtualTourSection />

      {/* 5. Galeria com dados do PocketBase e Lightbox */}
      <GallerySection />

      {/* 6. Bairro com pontos de interesse e distâncias */}
      <NeighborhoodSection />

      {/* 7. Plantas das tipologias Duplex, Garden, Sky e Loft */}
      <FloorplansSection />

      {/* 8. Formulário de Contato gravando em inquiries no PocketBase */}
      <ContactSection />

      {/* 9. Footer escuro com copyright oficial */}
      <Footer />
    </div>
  )
}
