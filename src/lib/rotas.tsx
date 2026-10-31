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
import { SectionCadastroEnvios } from '@/components/SectionCadastroEnvios'
import { SectionFontes } from '@/components/SectionFontes'
import { SectionFontesAgregador } from '@/components/SectionFontesAgregador'
import { SectionFontesPrimarias } from '@/components/SectionFontesPrimarias'
import { SectionMonitorLegislativo } from '@/components/SectionMonitorLegislativo'
import { SectionCentralEntrega } from '@/components/SectionCentralEntrega'
import { SectionAssistentesSeguranca } from '@/components/SectionAssistentesSeguranca'
import { SectionControleAcesso } from '@/components/SectionControleAcesso'
import { SectionResponsividade } from '@/components/SectionResponsividade'
import { SectionHistoricoAtualizacoes } from '@/components/SectionHistoricoAtualizacoes'
import { SectionLefisc } from '@/components/SectionLefisc'
import { NAVEGACAO } from '@/components/navegacao'
import type { TaxNormItem } from '@/types/panorama'

/**
 * ROTEADOR DE ABAS — uma seção por vez
 *
 * ── O PROBLEMA QUE ISTO RESOLVE (pedido do CEO, 29/10/2026) ──
 * "Coloque em cada aba o seu conteúdo. Não necessitando de rolagem de tela.
 *  Cada aba com o seu conteúdo interno."
 *
 * Antes: as 24 seções ficavam EMPILHADAS numa página única de rolagem enorme. Clicar
 * no menu era rolar até a âncora — o conteúdo anterior continuava ali, acima e abaixo,
 * e o CEO precisava atravessar tudo para chegar no que queria. Numa página de 24
 * seções, "ir para o Simples" significava rolar por dentro de outras dez.
 *
 * Agora: cada item do menu troca a SEÇÃO RENDERIZADA. Só existe no DOM a aba aberta.
 * A página não tem mais rolagem entre assuntos: a rolagem que restar é a do conteúdo
 * daquela aba, e nada mais.
 *
 * ── POR QUE HASH E NÃO ESTADO INTERNO ──
 * Os links internos que já existem (`href="#tabela-geral"` na Central de Indicadores,
 * no Monitor e no painel inicial) continuam funcionando sem alteração: mudar o hash
 * dispara o mesmo roteador. Estado interno quebraria esses 8 links espalhados.
 * Também dá link compartilhável e o botão Voltar do navegador funciona.
 */

/**
 * Props que o roteador injeta. Só a Seção 1 (Normas) precisa delas de fato — recebe
 * a lista de normas filtrada pela busca do header. As outras 25 não recebem nada, por
 * isso tudo é opcional: assim um único tipo serve para as 26 abas.
 */
export interface PropsAba {
  norms?: TaxNormItem[]
  loading?: boolean
}

export interface RotaAba {
  /** hash sem "#" — é a chave da rota */
  id: string
  /** componente que a aba renderiza */
  Componente: ComponentType<PropsAba>
  /** título da aba, para trilha e navegação */
  titulo: string
  /** número/identificação da seção, para o contexto na trilha */
  grupo: string
}

/**
 * Uma entrada por item de navegação — a fonte é `navegacao.ts`, sem lista paralela.
 * SectionNorms é a única que exige `norms`; o cast alinha a assinatura ao tipo comum
 * do roteador sem mentir sobre quem usa a prop (o Index sempre a passa).
 */
const COMPONENTES: Record<string, ComponentType<PropsAba>> = {
  '#secao-1': SectionNorms as ComponentType<PropsAba>,
  '#secao-2': SectionFatoGerador,
  '#secao-3': SectionCestaBasica,
  '#secao-4': SectionImunidades,
  '#secao-5': SectionIsencoesAlíquotas,
  '#secao-6': SectionRegimesEspecificos,
  '#regime-imobiliario': SectionRegimeImobiliario,
  '#agronegocio': SectionAgronegocio,
  '#consorcios': SectionConsorcios,
  '#financeiros': SectionFinanceiros,
  '#simples': SectionSimples,
  '#profissionais-plataformas': SectionProfissionaisPlataformas,
  '#secao-7': SectionAnexos,
  '#tabela-geral': SectionTabelaGeral,
  '#secao-8': SectionCronograma,
  '#indicadores': SectionIndicadores,
  '#secao-9': SectionFontes,
  '#fontes-agregador': SectionFontesAgregador,
  '#fontes-primarias': SectionFontesPrimarias,
  '#monitor-legislativo': SectionMonitorLegislativo,
  '#cadastro-envios': SectionCadastroEnvios,
  '#central-entrega': SectionCentralEntrega,
  '#assistentes-seguranca': SectionAssistentesSeguranca,
  '#controle-acesso': SectionControleAcesso,
  '#responsividade-celulares': SectionResponsividade,
  '#historico-atualizacoes': SectionHistoricoAtualizacoes,
  '#lefisc': SectionLefisc,
}

/**
 * Abas na ordem em que aparecem no menu — a mesma ordem de antes (grupo a grupo),
 * para o "próximo" e o "anterior" fazerem sentido.
 * Derivada de NAVEGACAO: nenhum item pode existir no menu e faltar aqui.
 */
export const ABAS: RotaAba[] = NAVEGACAO.map((item) => {
  const Componente = COMPONENTES[item.href]
  return {
    id: item.href.replace('#', ''),
    Componente,
    titulo: item.label,
    grupo: item.numero || '',
  }
}).filter((a) => Boolean(a.Componente))

/** Id da rota "Início" — painel de acompanhamento, não é uma seção de conteúdo. */
export const ID_INICIO = 'inicio'

/**
 * Âncoras internas que vivem DENTRO de uma aba. Como agora só a aba ativa é
 * montada, um link para #contato não pode abrir a seção sozinho — ele precisa
 * abrir a aba que o contém. Mapa explícito, curto, para não adivinhar.
 */
const DENTRO_DE_UMA_ABA: Record<string, string> = {
  contato: 'secao-9',
  inicio: ID_INICIO,
}

/**
 * Normaliza qualquer hash para uma rota conhecida. Desconhecida → Início, para
 * nunca deixar a tela em branco por causa de um link antigo.
 */
export function resolverRota(hash: string): RotaAba | null {
  const limpo = (hash || '').replace(/^#/, '').split('?')[0]
  if (!limpo || limpo === ID_INICIO) return null
  const direto = ABAS.find((a) => a.id === limpo)
  if (direto) return direto
  const dono = DENTRO_DE_UMA_ABA[limpo]
  if (dono) return ABAS.find((a) => a.id === dono) ?? null
  return null
}

/** Vizinhos para os botões de navegação no pé de cada aba. */
export function vizinhas(id: string): { anterior: RotaAba | null; proxima: RotaAba | null } {
  const i = ABAS.findIndex((a) => a.id === id)
  if (i < 0) return { anterior: null, proxima: null }
  return {
    anterior: i > 0 ? ABAS[i - 1] : null,
    proxima: i < ABAS.length - 1 ? ABAS[i + 1] : null,
  }
}
