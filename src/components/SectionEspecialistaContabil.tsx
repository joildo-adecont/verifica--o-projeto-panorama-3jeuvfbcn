import { Calculator } from 'lucide-react'
import { TelaAgenteEspecialista } from '@/components/TelaAgenteEspecialista'

export function SectionEspecialistaContabil() {
  return (
    <TelaAgenteEspecialista
      segmento="contabil"
      titulo="Especialista Contábil ADECONT"
      subtitulo="Lançamentos contábeis, cálculo por fora, plano de contas e conciliação"
      badge="Segmento Contábil"
      descricao="Agente especialista contábil da ADECONT para suporte em normas NBC TG / CPC, contabilização de créditos e débitos de IBS e CBS, reflexos na DRE e Balanço Patrimonial (cálculo por fora), compensação de saldos credores e estruturação do plano de contas para a Reforma."
      Icon={Calculator}
      corPrimaria="text-blue-700 bg-blue-50 border-blue-200"
      exemplosProntos={[
        'Como contabilizar os créditos financeiros de IBS e CBS na aquisição de bens do ativo imobilizado?',
        'Quais as contas contábeis recomendadas no Ativo e Passivo Circulante para o IVA Dual?',
        'Como demonstrar a receita bruta e líquida na DRE com o cálculo por fora do art. 15 da LC 214?',
      ]}
    />
  )
}
