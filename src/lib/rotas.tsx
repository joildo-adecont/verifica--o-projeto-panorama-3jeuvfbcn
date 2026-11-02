import type { ComponentType } from 'react'
import { SectionNorms } from '@/components/SectionNorms'
import { SectionFatoGerador } from '@/components/SectionFatoGerador'
import { SectionCestaBasica } from '@/components/SectionCestaBasica'
import { SectionImunidades } from '@/components/SectionImunidades'
import { SectionIsencoesAlíquotas } from '@/components/SectionIsencoesAliquots'
import { SectionRegimesEspecificos } from '@/components/SectionRegimesEspecificos'
import { SectionRegimeImobiliario } from '@/components/SectionRegimeImobiliario'
import { SectionAgronegocio } from '@/components/SectionAgronegocio'
import { SectionConsorcios } from '@/components/SectionConsorcios'
import { SectionFinanceiros } from '@/components/SectionFinanceiros'
import { SectionSimples } from '@/components/SectionSimples'
import { SectionProfissionaisPlataformas } from '@/components/SectionProfissionaisPlataformas'
import { SectionAnexos } from '@/components/SectionAnexos'
import { SectionTabelaGeral } from '@/components/SectionTabelaGeral'
import { SectionCronograma } from '@/components/SectionCronograma'
import { SectionIndicadores } from '@/components/SectionIndicadores'
import { SectionFontes } from '@/components/SectionFontes'
import { SectionFontesPrimarias } from '@/components/SectionFontesPrimarias'
import { SectionFontesAgregador } from '@/components/SectionFontesAgregador'
import { SectionMonitorLegislativo } from '@/components/SectionMonitorLegislativo'
import { SectionDiagnosticoTributario } from '@/components/SectionDiagnosticoTributario'
import { SectionHistoricoAtualizacoes } from '@/components/SectionHistoricoAtualizacoes'
import { SectionCadastroEnvios } from '@/components/SectionCadastroEnvios'
import { SectionCentralEntrega } from '@/components/SectionCentralEntrega'
import { SectionAssistentesSeguranca } from '@/components/SectionAssistentesSeguranca'
import { SectionControleAcesso } from '@/components/SectionControleAcesso'
import { SectionResponsividade } from '@/components/SectionResponsividade'
import { SectionLefisc } from '@/components/SectionLefisc'
import { SectionRadarNacional } from '@/components/SectionRadarNacional'
import { SectionSetor } from '@/components/SectionSetor'
import { SectionBuscaAvancada } from '@/components/SectionBuscaAvancada'
import { SectionControleVersao } from '@/components/SectionControleVersao'
import { SectionEspecialistaJuridico } from '@/components/SectionEspecialistaJuridico'
import { SectionEspecialistaTributario } from '@/components/SectionEspecialistaTributario'
import { SectionEspecialistaContabil } from '@/components/SectionEspecialistaContabil'
import { SectionEspecialistaAdministrativo } from '@/components/SectionEspecialistaAdministrativo'

export interface AbaConfig {
  id: string
  titulo: string
  grupo: string
  Componente: ComponentType<any>
}

export const ID_INICIO = 'inicio'

/**
 * Mapeamento completo de abas do sistema Panorama ADECONT.
 */
export const ABAS: AbaConfig[] = [
  // Topo CEO & Busca
  {
    id: 'instalador-versao',
    titulo: 'Instalador e Controle de Versão do Programa',
    grupo: '1',
    Componente: SectionControleVersao,
  },
  {
    id: 'busca-avancada',
    titulo: 'Busca Avançada',
    grupo: 'BUSCA',
    Componente: SectionBuscaAvancada,
  },

  // Segmento Jurídico
  {
    id: 'agente-juridico',
    titulo: 'Especialista Jurídico ADECONT',
    grupo: 'JUR',
    Componente: SectionEspecialistaJuridico,
  },
  {
    id: 'secao-1',
    titulo: 'Normas',
    grupo: '1',
    Componente: SectionNorms,
  },
  {
    id: 'secao-4',
    titulo: 'Imunidades',
    grupo: '4',
    Componente: SectionImunidades,
  },
  {
    id: 'secao-9',
    titulo: 'Fontes & Atualização',
    grupo: '9',
    Componente: SectionFontes,
  },
  {
    id: 'fontes-primarias',
    titulo: 'Fontes Primárias (115 Bases)',
    grupo: '12',
    Componente: SectionFontesPrimarias,
  },
  {
    id: 'lefisc',
    titulo: 'Acesso Lefisc',
    grupo: '18',
    Componente: SectionLefisc,
  },

  // Segmento Tributário
  {
    id: 'agente-tributario',
    titulo: 'Especialista Tributário ADECONT',
    grupo: 'TRIB',
    Componente: SectionEspecialistaTributario,
  },
  {
    id: 'monitor-legislativo',
    titulo: 'Monitor Legislativo',
    grupo: '12A',
    Componente: SectionMonitorLegislativo,
  },
  {
    id: 'diagnostico-tributario',
    titulo: 'Diagnóstico Tributário',
    grupo: '12B',
    Componente: SectionDiagnosticoTributario,
  },
  {
    id: 'radar-nacional',
    titulo: 'Radar Nacional',
    grupo: '19',
    Componente: SectionRadarNacional,
  },
  {
    id: 'secao-2',
    titulo: 'Fato Gerador',
    grupo: '2',
    Componente: SectionFatoGerador,
  },
  {
    id: 'secao-3',
    titulo: 'Cesta Básica',
    grupo: '3',
    Componente: SectionCestaBasica,
  },
  {
    id: 'secao-5',
    titulo: 'Isenções e Alíquotas',
    grupo: '5',
    Componente: SectionIsencoesAlíquotas,
  },
  {
    id: 'secao-6',
    titulo: 'Regimes Específicos',
    grupo: '6',
    Componente: SectionRegimesEspecificos,
  },
  {
    id: 'regime-imobiliario',
    titulo: 'Regime Imobiliário',
    grupo: '6A',
    Componente: SectionRegimeImobiliario,
  },
  {
    id: 'agronegocio',
    titulo: 'Agronegócio',
    grupo: '6B',
    Componente: SectionAgronegocio,
  },
  {
    id: 'consorcios',
    titulo: 'Consórcios',
    grupo: '6C',
    Componente: SectionConsorcios,
  },
  {
    id: 'financeiros',
    titulo: 'Financeiros',
    grupo: '6D',
    Componente: SectionFinanceiros,
  },
  {
    id: 'simples',
    titulo: 'Simples Nacional',
    grupo: '6E',
    Componente: SectionSimples,
  },
  {
    id: 'profissionais-plataformas',
    titulo: 'Profissionais e Plataformas',
    grupo: '6F',
    Componente: SectionProfissionaisPlataformas,
  },
  {
    id: 'setor-combustiveis',
    titulo: 'Combustíveis e Energia',
    grupo: '20',
    Componente: () => <SectionSetor id="combustiveis" />,
  },
  {
    id: 'setor-saude',
    titulo: 'Saúde e Planos',
    grupo: '21',
    Componente: () => <SectionSetor id="saude" />,
  },
  {
    id: 'setor-educacao',
    titulo: 'Educação',
    grupo: '22',
    Componente: () => <SectionSetor id="educacao" />,
  },
  {
    id: 'setor-turismo',
    titulo: 'Bares, Restaurantes e Turismo',
    grupo: '23',
    Componente: () => <SectionSetor id="turismo" />,
  },
  {
    id: 'setor-cooperativas',
    titulo: 'Cooperativas',
    grupo: '24',
    Componente: () => <SectionSetor id="cooperativas" />,
  },
  {
    id: 'setor-futebol',
    titulo: 'Sociedade Anônima do Futebol',
    grupo: '25',
    Componente: () => <SectionSetor id="futebol" />,
  },
  {
    id: 'setor-exterior',
    titulo: 'Comércio Exterior e ZFM',
    grupo: '26',
    Componente: () => <SectionSetor id="exterior" />,
  },
  {
    id: 'setor-diplomatico',
    titulo: 'Missões Diplomáticas',
    grupo: '27',
    Componente: () => <SectionSetor id="diplomatico" />,
  },

  // Segmento Contábil
  {
    id: 'agente-contabil',
    titulo: 'Especialista Contábil ADECONT',
    grupo: 'CONT',
    Componente: SectionEspecialistaContabil,
  },
  {
    id: 'tabela-geral',
    titulo: 'Tabela Geral dos Anexos',
    grupo: '7A',
    Componente: SectionTabelaGeral,
  },
  {
    id: 'secao-7',
    titulo: 'Anexos',
    grupo: '7',
    Componente: SectionAnexos,
  },
  {
    id: 'secao-8',
    titulo: 'Cronograma 2026–2033',
    grupo: '8',
    Componente: SectionCronograma,
  },
  {
    id: 'indicadores',
    titulo: 'Central de Indicadores',
    grupo: '8A',
    Componente: SectionIndicadores,
  },
  {
    id: 'fontes-agregador',
    titulo: 'Fontes de Referência (Agregadores)',
    grupo: '11',
    Componente: SectionFontesAgregador,
  },

  // Segmento Administrativo
  {
    id: 'agente-administrativo',
    titulo: 'Especialista Administrativo ADECONT',
    grupo: 'ADM',
    Componente: SectionEspecialistaAdministrativo,
  },
  {
    id: 'cadastro-envios',
    titulo: 'Cadastro de Clientes & Envios',
    grupo: '9A',
    Componente: SectionCadastroEnvios,
  },
  {
    id: 'central-entrega',
    titulo: 'Central de Entrega',
    grupo: '14',
    Componente: SectionCentralEntrega,
  },
  {
    id: 'assistentes-seguranca',
    titulo: 'Assistentes & Segurança',
    grupo: '15',
    Componente: SectionAssistentesSeguranca,
  },
  {
    id: 'controle-acesso',
    titulo: 'Níveis de Acesso (CRUD)',
    grupo: '16',
    Componente: SectionControleAcesso,
  },
  {
    id: 'responsividade-celulares',
    titulo: 'Responsividade em Celulares',
    grupo: '17',
    Componente: SectionResponsividade,
  },
  {
    id: 'historico-atualizacoes',
    titulo: 'Histórico de Atualizações',
    grupo: '13',
    Componente: SectionHistoricoAtualizacoes,
  },
]

/**
 * Resolve o hash da URL (ex: '#secao-1' ou '#diagnostico-tributario') para a configuração de aba.
 * Retorna null se for o Início ('', '#', '#inicio') ou rota desconhecida.
 */
export function resolverRota(hash: string): AbaConfig | null {
  if (!hash || hash === '#' || hash === '#inicio' || hash === '#0') {
    return null
  }
  const limpo = hash.startsWith('#') ? hash.slice(1) : hash
  return ABAS.find((a) => a.id === limpo) ?? null
}

/**
 * Retorna as abas vizinhas (anterior e próxima) para navegação sequencial no rodapé.
 */
export function vizinhas(id: string): { anterior: AbaConfig | null; proxima: AbaConfig | null } {
  const idx = ABAS.findIndex((a) => a.id === id)
  if (idx < 0) return { anterior: null, proxima: null }
  return {
    anterior: idx > 0 ? ABAS[idx - 1] : null,
    proxima: idx < ABAS.length - 1 ? ABAS[idx + 1] : null,
  }
}
