import { Landmark } from 'lucide-react'
import { TelaAgenteEspecialista } from '@/components/TelaAgenteEspecialista'

export function SectionEspecialistaReformaTributaria() {
  return (
    <TelaAgenteEspecialista
      segmento="reforma-tributaria"
      titulo="Consultor da Reforma Tributária ADECONT"
      subtitulo="Impactos, transição e atos normativos da Reforma para empresas e contadores"
      badge="Segmento Consultoria RT"
      descricao="Agente inteligente da ADECONT que orienta empresas e contadores sobre os impactos e a transição da Reforma Tributária, com cobertura de TODOS os tipos de atos normativos — Resoluções, Decretos, Portarias, Atos e demais espécies, incluindo alterações, inclusões e exclusões legislativas — não apenas Resoluções CGIBS."
      Icon={Landmark}
      corPrimaria="text-violet-700 bg-violet-50 border-violet-200"
      exemplosProntos={[
        'Quais os impactos da transição 2026–2033 para uma indústria do nosso setor?',
        'Quais decretos e portarias recentes alteraram as regras da Reforma Tributária?',
        'Como acompanhar alterações, inclusões e exclusões legislativas da Reforma?',
      ]}
    />
  )
}
