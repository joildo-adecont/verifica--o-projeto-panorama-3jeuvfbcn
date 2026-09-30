import { useState, useEffect } from 'react'
import { Menu, X, PhoneCall } from 'lucide-react'
import { Button } from '@/components/ui/button'

const navLinks = [
  { label: 'O Projeto', href: '#projeto' },
  { label: 'Tour 360°', href: '#tour' },
  { label: 'Galeria', href: '#galeria' },
  { label: 'Bairro', href: '#bairro' },
  { label: 'Plantas', href: '#plantas' },
  { label: 'Contato', href: '#contato' },
]

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    const target = document.querySelector(href)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#0B1528]/90 backdrop-blur-md border-b border-[#C5A059]/20 shadow-xl py-3.5'
            : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent py-5 sm:py-6'
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex items-center justify-between">
          {/* Logo */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="group flex flex-col tracking-wider focus:outline-none"
          >
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-[0.18em] text-[#F9F8F5] group-hover:text-[#C5A059] transition-colors">
              PROJETO PANORAMA
            </span>
            <span className="text-[9px] uppercase tracking-[0.3em] text-[#C5A059] font-medium">
              Residências de Alto Padrão
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-7 lg:space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-sm font-medium tracking-wide text-[#ECE8DF]/85 hover:text-[#C5A059] transition-colors py-1 relative group"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#C5A059] transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* CTA Desktop */}
          <div className="hidden md:flex items-center">
            <Button
              asChild
              className="bg-[#C5A059] hover:bg-[#DFBE7C] text-[#0B1528] font-semibold text-xs uppercase tracking-widest px-6 py-2.5 rounded-full shadow-lg transition-transform hover:scale-105"
            >
              <a href="#contato" onClick={(e) => handleNavClick(e, '#contato')}>
                Agende uma Visita
              </a>
            </Button>
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu de navegação"
              className="p-2 text-[#F9F8F5] hover:text-[#C5A059] transition-colors focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative ml-auto w-[80%] max-w-sm h-full bg-[#0B1528] border-l border-[#C5A059]/30 p-6 flex flex-col justify-between shadow-2xl z-10 animate-fade-in-down">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-[#162238]">
                <div>
                  <span className="font-serif text-lg font-bold tracking-[0.16em] text-[#F9F8F5]">
                    PANORAMA
                  </span>
                  <p className="text-[10px] uppercase tracking-widest text-[#C5A059]">
                    Alto Padrão
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Fechar menu"
                  className="p-2 text-stone-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex flex-col space-y-4 mt-8">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="text-base font-medium tracking-wide text-stone-200 hover:text-[#C5A059] py-2 border-b border-[#162238]/60 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-[#162238] space-y-4">
              <Button
                asChild
                className="w-full bg-[#C5A059] hover:bg-[#DFBE7C] text-[#0B1528] font-semibold text-xs uppercase tracking-widest py-3 rounded-full shadow-lg"
              >
                <a href="#contato" onClick={(e) => handleNavClick(e, '#contato')}>
                  Agende uma Visita
                </a>
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-stone-400">
                <PhoneCall className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>(11) 4003-8822</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
