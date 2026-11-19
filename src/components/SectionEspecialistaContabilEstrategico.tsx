import { Calculator } from 'lucide-react'
import { TelaAgenteEspecialista } from '@/components/TelaAgenteEspecialista'

export function SectionEspecialistaContabilEstrategico() {
  return (
    <TelaAgenteEspecialista
      segmento="consultor-contabil-estrategico"
      titulo="Consultor Contábil Estratégico ADECONT"
      subtitulo="Apoio à gestão, contabilidade, fiscal e materiais para equipes e clientes"
      badge="Segmento Consultoria Estratégica"
      descricao="Agente inteligente da ADECONT que apoia a gestão, a contabilidade e o fiscal da assessoria, traduzindo dados técnicos em recomendações e produzindo materiais — memorandos, checklists, FAQs e roteiros de treinamento — para equipes e clientes."
      Icon={Calculator}
      corPrimaria="text-cyan-700 bg-cyan-50 border-cyan-200"
      exemplosProntos={[
        'Prepare um memorando explicando o split payment para a equipe do cliente X.',
        'Quais materiais de treinamento aceleram a adaptação das equipes à LC 214/2025?',
        'Como transformar os dados de créditos de IBS/CBS em recomendações para a gestão?',
      ]}
    />
  )
}
