import { Instagram, Facebook, Youtube, MapPin, Phone, Mail, ArrowUp } from 'lucide-react'

export function Footer() {
  const scrollTo = (href: string) => {
    const el = document.querySelector(href)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="relative bg-[#060D1A] text-stone-300 pt-20 pb-12 border-t border-[#162238] overflow-hidden">
      {/* Decorative top gold line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C5A059]/40 to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-16 border-b border-[#162238]">
          {/* Brand Col */}
          <div className="lg:col-span-5 space-y-4">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                scrollToTop()
              }}
              className="inline-block"
            >
              <span className="font-serif text-2xl font-bold tracking-[0.16em] text-[#F9F8F5]">
                PROJETO PANORAMA
              </span>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#C5A059] font-medium">
                Residências de Alto Padrão
              </p>
            </a>

            <p className="text-sm text-stone-400 max-w-sm leading-relaxed">
              Uma celebração à arquitetura contemporânea e à arte de morar bem. Exclusividade,
              conforto e vistas inesquecíveis no melhor ponto da cidade.
            </p>

            {/* Social Icons */}
            <div className="flex items-center space-x-3 pt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram Projeto Panorama"
                className="w-10 h-10 rounded-full bg-[#0B1528] border border-[#162238] hover:border-[#C5A059] text-stone-400 hover:text-[#C5A059] transition-colors flex items-center justify-center"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook Projeto Panorama"
                className="w-10 h-10 rounded-full bg-[#0B1528] border border-[#162238] hover:border-[#C5A059] text-stone-400 hover:text-[#C5A059] transition-colors flex items-center justify-center"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube Projeto Panorama"
                className="w-10 h-10 rounded-full bg-[#0B1528] border border-[#162238] hover:border-[#C5A059] text-stone-400 hover:text-[#C5A059] transition-colors flex items-center justify-center"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links Col */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs uppercase tracking-[0.25em] text-[#C5A059] font-bold">
              Navegação Rápida
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => scrollTo('#projeto')}
                  className="hover:text-[#C5A059] transition-colors"
                >
                  O Projeto
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('#tour')}
                  className="hover:text-[#C5A059] transition-colors"
                >
                  Tour Virtual 360°
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('#galeria')}
                  className="hover:text-[#C5A059] transition-colors"
                >
                  Galeria de Fotos
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('#bairro')}
                  className="hover:text-[#C5A059] transition-colors"
                >
                  Vizinhança & Bairro
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('#plantas')}
                  className="hover:text-[#C5A059] transition-colors"
                >
                  Plantas & Tipologias
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('#contato')}
                  className="hover:text-[#C5A059] transition-colors"
                >
                  Atendimento & Visitas
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Info Col */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-xs uppercase tracking-[0.25em] text-[#C5A059] font-bold">
              Informações de Contato
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#C5A059] flex-shrink-0 mt-1" />
                <span>Alameda dos Ipês Nobres, 1200 — Jardins, São Paulo - SP, CEP 01404-000</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
                <span>(11) 4003-8822 / (11) 99876-5432</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
                <span>contato@projetopanorama.com.br</span>
              </li>
            </ul>

            <div className="pt-2">
              <button
                onClick={scrollToTop}
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C5A059] hover:text-white transition-colors"
              >
                <span>Voltar ao Topo</span>
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom copyright strictly as requested */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© 2025 Projeto Panorama. Todos os direitos reservados.</p>
          <p className="text-[11px] text-stone-600">
            Imagens meramente ilustrativas. Acabamentos e especificações constantes no memorial de
            incorporação.
          </p>
        </div>
      </div>
    </footer>
  )
}
