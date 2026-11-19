/**
 * AGENTES ESPECIALISTAS — itens de menu do grupo "Agentes" (área segregada).
 *
 * Os 7 agentes nativos respondem via POST /backend/v1/agente-especialista/chat,
 * cada um pelo SEU segmento (mapa de slugs no hook agente_especialista). As telas
 * são os wrappers SectionEspecialista* montados no roteador de abas (rotas.tsx)
 * pelos hrefs abaixo — o padrão `#agente-*` é o que o menu usa para aplicar o
 * selo "Agente" (PanoramaSideMenu, isAgente).
 *
 * `tecla` fica vazia de propósito: o handler de atalhos faz NAVEGACAO.find por
 * tecla e a colisão silenciosa (primeiro item vence) é um bug conhecido — melhor
 * nenhum atalho do que roubar o atalho de uma seção existente.
 */
import { Building2, Calculator, Compass, Landmark, Percent, Scale } from 'lucide-react'
import type { LinkNavegacao } from '@/components/navegacao'

export const AGENTES: LinkNavegacao[] = [
  {
    href: '#agente-juridico',
    label: 'Especialista Jurídico',
    curto: 'Jurídico',
    tecla: '',
    Icon: Scale,
    cor: 'text-indigo-700',
    bg: 'bg-indigo-50',
    borda: 'border-indigo-200',
    descricao: 'Conformidade legal, segurança jurídica e teses normativas',
    tags: ['agente', 'juridico', 'jurídico', 'legal', 'normas', 'segurança jurídica'],
  },
  {
    href: '#agente-tributario',
    label: 'Especialista Tributário',
    curto: 'Tributário',
    tecla: '',
    Icon: Percent,
    cor: 'text-emerald-700',
    bg: 'bg-emerald-50',
    borda: 'border-emerald-200',
    descricao: 'IBS, CBS, Imposto Seletivo, regimes específicos e classificações',
    tags: ['agente', 'tributario', 'tributário', 'ibs', 'cbs', 'imposto seletivo'],
  },
  {
    href: '#agente-contabil',
    label: 'Especialista Contábil',
    curto: 'Contábil',
    tecla: '',
    Icon: Calculator,
    cor: 'text-blue-700',
    bg: 'bg-blue-50',
    borda: 'border-blue-200',
    descricao: 'Lançamentos, cálculo por fora, plano de contas e conciliação',
    tags: ['agente', 'contabil', 'contábil', 'lançamentos', 'dre', 'balanço'],
  },
  {
    href: '#agente-administrativo',
    label: 'Especialista Administrativo',
    curto: 'Administrativo',
    tecla: '',
    Icon: Building2,
    cor: 'text-sky-700',
    bg: 'bg-sky-50',
    borda: 'border-sky-200',
    descricao: 'Fusão administrativa, fluxos de entrega, clientes e governança',
    tags: ['agente', 'administrativo', 'gestão', 'entrega', 'governança'],
  },
  {
    href: '#agente-consultor-contabil-estrategico',
    label: 'Consultor Contábil Estratégico',
    curto: 'Consultor Contábil',
    tecla: '',
    Icon: Calculator,
    cor: 'text-cyan-700',
    bg: 'bg-cyan-50',
    borda: 'border-cyan-200',
    descricao: 'Apoia gestão, contabilidade, fiscal e materiais para equipes e clientes.',
    tags: ['agente', 'consultor', 'materiais', 'memorandos', 'treinamento', 'equipes'],
  },
  {
    href: '#agente-gestao-estrategica',
    label: 'Especialista em Gestão Estratégica',
    curto: 'Gestão Estratégica',
    tecla: '',
    Icon: Compass,
    cor: 'text-emerald-700',
    bg: 'bg-emerald-50',
    borda: 'border-emerald-200',
    descricao: 'Orienta decisões contábeis, fiscais e financeiras para gestão estratégica.',
    tags: ['agente', 'gestão', 'estratégia', 'decisões', 'planejamento', 'precificação'],
  },
  {
    href: '#agente-reforma-tributaria',
    label: 'Consultor da Reforma Tributária',
    curto: 'Reforma Tributária',
    tecla: '',
    Icon: Landmark,
    cor: 'text-violet-700',
    bg: 'bg-violet-50',
    borda: 'border-violet-200',
    descricao: 'Orienta empresas e contadores sobre impactos e transição da Reforma Tributária.',
    tags: [
      'agente',
      'reforma',
      'transição',
      'atos normativos',
      'resoluções',
      'decretos',
      'portarias',
      'cgibs',
    ],
  },
]
