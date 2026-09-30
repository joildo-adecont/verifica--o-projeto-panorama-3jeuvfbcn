import { Compass, Sparkles, Leaf, MapPin, CheckCircle2 } from 'lucide-react'

const differentials = [
  {
    icon: Compass,
    title: 'Arquitetura Assinada',
    desc: 'Traços autorais inspirados no modernismo internacional, assinados por renomados arquitetos brasileiros com esquadrias piso-teto.',
  },
  {
    icon: Sparkles,
    title: 'Lazer Completo',
    desc: 'Mais de 3.500 m² de áreas de convivência decoradas e equipadas com piscina de borda infinita, quadra de tênis e spa de classe mundial.',
  },
  {
    icon: Leaf,
    title: 'Sustentabilidade',
    desc: 'Certificação ambiental internacional, reuso de águas pluviais, placas solares para áreas comuns e infraestrutura para carros elétricos.',
  },
  {
    icon: MapPin,
    title: 'Localização Estratégica',
    desc: 'Situado no quadrilátero mais cobiçado da cidade, combinando tranquilidade de bairro nobre com acesso imediato a polos de negócios.',
  },
]

export function ProjectSection() {
  return (
    <section
      id="projeto"
      className="relative py-24 sm:py-32 bg-[#0B1528] text-[#F9F8F5] overflow-hidden"
    >
      {/* Decorative ambient background */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#C5A059]/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Monumental Architecture Image */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              {/* Outer decorative frame */}
              <div className="absolute -inset-4 rounded-3xl border border-[#C5A059]/25 -rotate-1 hidden sm:block pointer-events-none" />

              {/* Image card */}
              <div className="relative rounded-2xl overflow-hidden border border-[#C5A059]/30 shadow-2xl group">
                <img
                  src="https://img.usecurling.com/p/1000/1200?q=luxury%20modern%20architecture%20building%20facade"
                  alt="Arquitetura do Projeto Panorama"
                  className="w-full h-[450px] sm:h-[560px] object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#060D1A]/80 via-transparent to-transparent" />

                {/* Card tag */}
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-[#0B1528]/85 backdrop-blur-md border border-[#C5A059]/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-[#C5A059] font-medium">
                        Design & Arquitetura
                      </p>
                      <h4 className="font-serif text-lg font-bold text-[#F9F8F5]">
                        Conceito Aberto & Luz Natural
                      </h4>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#C5A059]/20 flex items-center justify-center text-[#C5A059]">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Title, Value Proposition & Differentials */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            {/* Section Tag */}
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#C5A059] mb-3">
              <span className="w-8 h-[1px] bg-[#C5A059]" />
              O Empreendimento
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#F9F8F5] leading-tight mb-6">
              Onde o requinte encontra a perfeita harmonia urbana
            </h2>

            <div className="space-y-4 text-stone-300 text-base sm:text-lg leading-relaxed mb-10 font-normal">
              <p>
                O <strong className="text-white font-semibold">Projeto Panorama</strong> nasce como
                um marco na silhueta urbana. Planejado nos mínimos detalhes para quem busca
                exclusividade, conforto inegociável e uma conexão rara com os melhores horizontes.
              </p>
              <p>
                Com apenas duas residências por andar e plantas generosas de 145 m² a 385 m², cada
                espaço foi concebido para elevar a experiência diária do viver bem, aliando
                privacidade e acolhimento em um endereço nobre.
              </p>
            </div>

            {/* 4 Differentials with stagger animation and icons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-[#162238]">
              {differentials.map((item, idx) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.title}
                    className="group p-4 rounded-xl bg-[#060D1A]/50 border border-[#162238] hover:border-[#C5A059]/50 transition-all duration-300 hover:bg-[#162238]/40"
                    style={{ animationDelay: `${idx * 150}ms` }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] mb-3 group-hover:scale-110 group-hover:bg-[#C5A059] group-hover:text-[#0B1528] transition-all duration-300">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-serif font-bold text-lg text-[#F9F8F5] mb-1.5 group-hover:text-[#DFBE7C] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-normal">
                      {item.desc}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
