import { Building2 } from 'lucide-react'
import { TelaAgenteEspecialista } from '@/components/TelaAgenteEspecialista'

export function SectionEspecialistaAdministrativo() {
  return (
    <TelaAgenteEspecialista
      segmento="administrativo"
      titulo="Especialista Administrativo ADECONT"
      subtitulo="Fusão administrativa, fluxos de entrega, gestão de clientes e governança"
      badge="Segmento Administrativo"
      descricao="Agente especialista administrativo da ADECONT focado na reestruturação operacional e fusão administrativa das rotinas fiscais dos clientes, protocolos de envio e relatórios executivos na Central de Entrega, governança de acessos e alinhamento departamental."
      Icon={Building2}
      corPrimaria="text-sky-700 bg-sky-50 border-sky-200"
      exemplosProntos={[
        'Como conduzir a fusão administrativa das rotinas fiscais federal e municipal nos clientes?',
        'Qual o checklist operacional para parametrização do faturamento e compras antes de 2026?',
        'Como organizar o fluxo de protocolo e confirmação de entrega de relatórios para clientes?',
      ]}
    />
  )
}
