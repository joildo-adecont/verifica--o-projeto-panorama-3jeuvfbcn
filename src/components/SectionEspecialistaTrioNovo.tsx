/**
 * Wrappers dos 3 NOVOS especialistas (trio sugerido, 19/11/2026) — mesmo
 * padrão dos 7 SectionEspecialista* originais: cada rota legada #agente-*
 * monta a TelaAgenteEspecialista com o segmento correspondente. A tela única
 * "Pesquisa dos Agentes" continua sendo o caminho principal (atalhos F9–F11);
 * estas rotas mantêm links antigos e a busca por tecla funcionando.
 */
import { HardHat, PackageCheck, Briefcase } from 'lucide-react'
import { TelaAgenteEspecialista } from '@/components/TelaAgenteEspecialista'

export function SectionEspecialistaTrabalhistaPrevidenciario() {
  return (
    <TelaAgenteEspecialista
      segmento="trabalhista-previdenciario"
      titulo="Especialista Trabalhista e Previdenciário ADECONT"
      subtitulo="CLT, encargos, eSocial, EFD-Reinf, DCTFWeb e contribuições previdenciárias"
      badge="Segmento Trabalhista e Previdenciário"
      descricao="Agente inteligente da ADECONT que apoia equipes e clientes em questões de CLT, encargos trabalhistas (INSS, FGTS, 13º, férias, adicionais e multas), eventos do eSocial, EFD-Reinf, DCTFWeb e contribuições previdenciárias, cobrindo todos os tipos de atos normativos — Resoluções, Decretos, Portarias, Atos e alterações legislativas."
      Icon={HardHat}
      corPrimaria="text-rose-700 bg-rose-50 border-rose-200"
      exemplosProntos={[
        'Como apurar o INSS e o FGTS sobre horas extras e adicionais?',
        'Quais eventos do eSocial enviar na rescisão de um empregado?',
        'Qual o impacto do FAP e do RAT no custo da folha da empresa?',
      ]}
    />
  )
}

export function SectionEspecialistaTributosIndiretos() {
  return (
    <TelaAgenteEspecialista
      segmento="tributos-indiretos"
      titulo="Especialista em Tributos Indiretos ADECONT"
      subtitulo="ICMS, IPI, ISS e a transição para IBS/CBS da Reforma Tributária"
      badge="Segmento Tributos Indiretos"
      descricao="Agente inteligente da ADECONT que orienta a apuração e o cumprimento de obrigações de ICMS (Convênios, ST, DIFAL), IPI (TIPI, créditos) e ISS (LC 116/2003), além da transição para IBS/CBS da Reforma Tributária — cobrindo todos os tipos de atos normativos, de Resoluções e Decretos a Portarias, Atos e alterações legislativas."
      Icon={PackageCheck}
      corPrimaria="text-teal-700 bg-teal-50 border-teal-200"
      exemplosProntos={[
        'Como tratar o DIFAL numa venda interestadual a consumidor final?',
        'Quais créditos de IPI são admitidos e quais são vedados?',
        'Como fica a apuração no período de teste de 2026 (0,9% CBS + 0,1% IBS)?',
      ]}
    />
  )
}

export function SectionEspecialistaSocietarioCompliance() {
  return (
    <TelaAgenteEspecialista
      segmento="societario-compliance"
      titulo="Especialista Societário e Compliance ADECONT"
      subtitulo="Registros societários, obrigações acessórias, ECD/ECF e governança"
      badge="Segmento Societário e Compliance"
      descricao="Agente inteligente da ADECONT que orienta registros societários (constituição, alterações, incorporação, fusão e cisão), obrigações acessórias (ECD, ECF, DCTFWeb, NIRF, LGPD) e governança para empresas e contadores — cobrindo todos os tipos de atos normativos, de Resoluções a Decretos, Portarias, Atos e alterações legislativas."
      Icon={Briefcase}
      corPrimaria="text-blue-700 bg-blue-50 border-blue-200"
      exemplosProntos={[
        'Quais os passos para incorporar uma subsidiária integralmente detida?',
        'Quais obrigações acessórias uma S.A. precisa cumprir anualmente?',
        'Como estruturar controles internos de compliance no escritório contábil?',
      ]}
    />
  )
}
