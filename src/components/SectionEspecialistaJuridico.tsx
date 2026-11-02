import { Scale } from 'lucide-react'
import { TelaAgenteEspecialista } from '@/components/TelaAgenteEspecialista'

export function SectionEspecialistaJuridico() {
  return (
    <TelaAgenteEspecialista
      segmento="juridico"
      titulo="Especialista Jurídico ADECONT"
      subtitulo="Análise de conformidade legal, segurança jurídica e teses normativas"
      badge="Segmento Jurídico"
      descricao="Agente inteligente de consultoria jurídica da ADECONT especializado em controle de legalidade, interpretação sistemática do Direito Tributário e Administrativo, hermenêutica das Leis Complementares 214/2025 e 227/2026, limites regulatórios do CGIBS e garantias de segurança jurídica dos contribuintes."
      Icon={Scale}
      corPrimaria="text-indigo-700 bg-indigo-50 border-indigo-200"
      exemplosProntos={[
        'Qual o alcance constitucional da imunidade do art. 150, VI da CF para IBS e CBS?',
        'O Comitê Gestor do IBS pode criar obrigações acessórias sem amparo em Lei Complementar?',
        'Como a EC 132/2023 protege os contratos de longo prazo e a segurança jurídica?',
      ]}
    />
  )
}
