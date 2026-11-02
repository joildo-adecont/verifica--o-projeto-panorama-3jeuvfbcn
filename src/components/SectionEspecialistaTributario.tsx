import { Percent } from 'lucide-react'
import { TelaAgenteEspecialista } from '@/components/TelaAgenteEspecialista'

export function SectionEspecialistaTributario() {
  return (
    <TelaAgenteEspecialista
      segmento="tributario"
      titulo="Especialista Tributário ADECONT"
      subtitulo="Apuração de IBS, CBS, Imposto Seletivo, regimes específicos e classificações"
      badge="Segmento Tributário"
      descricao="Agente especialista tributário da ADECONT dedicado ao cálculo do IVA Dual, regimes favorecidos (-60% e -30%), alíquota zero da Cesta Básica Nacional, retenção via split payment, apuração no regime de destino e parametrização fiscal por NCM/NBS/cClassTrib."
      Icon={Percent}
      corPrimaria="text-emerald-700 bg-emerald-50 border-emerald-200"
      exemplosProntos={[
        'Como calcular a alíquota efetiva com redução de 60% para serviços de saúde e educação?',
        'Quais produtos compõem o Anexo I da LC 214/2025 com desoneração integral (alíquota zero)?',
        'Como funciona a retenção financeira via split payment nos recebíveis de cartão?',
      ]}
    />
  )
}
