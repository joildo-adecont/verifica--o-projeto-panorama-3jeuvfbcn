import { Compass } from 'lucide-react'
import { TelaAgenteEspecialista } from '@/components/TelaAgenteEspecialista'

export function SectionEspecialistaGestaoEstrategica() {
  return (
    <TelaAgenteEspecialista
      segmento="gestao-estrategica"
      titulo="Especialista em Gestão Estratégica ADECONT"
      subtitulo="Decisões contábeis, fiscais e financeiras para a gestão estratégica"
      badge="Segmento Gestão Estratégica"
      descricao="Agente inteligente da ADECONT que orienta decisões contábeis, fiscais e financeiras no plano estratégico: planejamento tributário, precificação, investimento, capital de giro e risco, sempre encerrando em uma recomendação de decisão."
      Icon={Compass}
      corPrimaria="text-emerald-700 bg-emerald-50 border-emerald-200"
      exemplosProntos={[
        'Como comparar o regime atual e o IVA Dual pelo impacto na margem líquida?',
        'Quando devemos migrar créditos de PIS/Cofins durante a transição 2026–2033?',
        'Como provisionar o efeito do split payment no capital de giro da empresa?',
      ]}
    />
  )
}
