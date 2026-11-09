/**
 * Serviço de Persistência de Customização de Relatórios de Análise Empresarial
 * Sistema ADECONT — Portal Panorama RT
 *
 * Persiste as preferências de customização de relatórios do usuário:
 * 1. Tenta persistir no PocketBase (collection `analise_pareceres`, campo `notas_ajustadas` com envelope JSON ou no cliente)
 * 2. Mantém cache e fallback em localStorage para garantir funcionamento instantâneo e offline
 * 3. Permite recuperar por CNPJ do cliente e também preferências globais do operador
 */

import pb from '@/lib/pocketbase/client'
import { normalizarDocumento } from './analisesEmpresariais'
import {
  type ConfiguracaoRelatorioCustomizado,
  CONFIGURACAO_RELATORIO_PADRAO,
} from '@/types/customizacaoRelatorio'

const PREFIXO_LOCAL_STORAGE = 'adecont_relatorio_custom_'
const CHAVE_LOCAL_STORAGE_GLOBAL = 'adecont_relatorio_custom_global'

const MARCADOR_ENVELOPE = '__CUSTOM_RELATORIO_ADECONT__'

interface EnvelopeNotasAjustadas {
  marcador: string
  versao: number
  notasTextoOriginal?: string
  configuracao: ConfiguracaoRelatorioCustomizado
}

/**
 * Cria uma cópia profunda da configuração padrão para evitar mutações acidentais
 */
export function criarConfiguracaoPadrao(): ConfiguracaoRelatorioCustomizado {
  return JSON.parse(JSON.stringify(CONFIGURACAO_RELATORIO_PADRAO))
}

/**
 * Extrai o texto limpo das notas originais e a configuração customizada do campo notas_ajustadas
 */
export function decodificarNotasEAjustes(conteudoBruto: string | null | undefined): {
  notasTexto: string
  configuracao: ConfiguracaoRelatorioCustomizado | null
} {
  if (!conteudoBruto || typeof conteudoBruto !== 'string') {
    return { notasTexto: '', configuracao: null }
  }

  const trimmed = conteudoBruto.trim()
  if (!trimmed.includes(MARCADOR_ENVELOPE)) {
    return { notasTexto: trimmed, configuracao: null }
  }

  try {
    const envelope = JSON.parse(trimmed) as EnvelopeNotasAjustadas
    if (envelope.marcador === MARCADOR_ENVELOPE && envelope.configuracao) {
      return {
        notasTexto: envelope.notasTextoOriginal || '',
        configuracao: mesclarComPadrao(envelope.configuracao),
      }
    }
  } catch {
    // Se não for JSON válido apesar do marcador, tenta regex
    const regex = /__CUSTOM_RELATORIO_ADECONT__\s*({[\s\S]*})/
    const match = trimmed.match(regex)
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1])
        return {
          notasTexto: trimmed.replace(match[0], '').trim(),
          configuracao: mesclarComPadrao(parsed),
        }
      } catch {
        // Falha no fallback
      }
    }
  }

  return { notasTexto: trimmed, configuracao: null }
}

/**
 * Codifica o texto das notas e a configuração de customização em uma string
 * compatível com o campo notas_ajustadas da collection analise_pareceres
 */
export function codificarNotasComAjustes(
  notasTextoOriginal: string,
  configuracao: ConfiguracaoRelatorioCustomizado,
): string {
  const envelope: EnvelopeNotasAjustadas = {
    marcador: MARCADOR_ENVELOPE,
    versao: 1,
    notasTextoOriginal: notasTextoOriginal || '',
    configuracao,
  }
  return JSON.stringify(envelope)
}

/**
 * Mescla uma configuração parcial ou vinda do backend com o padrão do sistema
 */
export function mesclarComPadrao(
  parcial?: Partial<ConfiguracaoRelatorioCustomizado> | null,
): ConfiguracaoRelatorioCustomizado {
  const base = criarConfiguracaoPadrao()
  if (!parcial) return base

  return {
    tituloPersonalizado:
      typeof parcial.tituloPersonalizado === 'string'
        ? parcial.tituloPersonalizado
        : base.tituloPersonalizado,
    subtituloPersonalizado:
      typeof parcial.subtituloPersonalizado === 'string'
        ? parcial.subtituloPersonalizado
        : base.subtituloPersonalizado,
    observacoesFinais:
      typeof parcial.observacoesFinais === 'string'
        ? parcial.observacoesFinais
        : base.observacoesFinais,
    secoes: {
      ...base.secoes,
      ...(parcial.secoes || {}),
    },
    secoesCustomizadas: Array.isArray(parcial.secoesCustomizadas)
      ? parcial.secoesCustomizadas.map((s, idx) => ({
          id: s.id || `secao-custom-${idx}-${Date.now()}`,
          titulo: typeof s.titulo === 'string' ? s.titulo : '',
          conteudo: typeof s.conteudo === 'string' ? s.conteudo : '',
          ordem: typeof s.ordem === 'number' ? s.ordem : idx,
          ativa: typeof s.ativa === 'boolean' ? s.ativa : true,
        }))
      : base.secoesCustomizadas || [],
    incluirSecoesCustomizadas:
      typeof parcial.incluirSecoesCustomizadas === 'boolean'
        ? parcial.incluirSecoesCustomizadas
        : (base.incluirSecoesCustomizadas ?? true),
    incluirDadosEmpresa:
      typeof parcial.incluirDadosEmpresa === 'boolean'
        ? parcial.incluirDadosEmpresa
        : base.incluirDadosEmpresa,
    incluirQrCode:
      typeof parcial.incluirQrCode === 'boolean' ? parcial.incluirQrCode : base.incluirQrCode,
    incluirRodapeOficial:
      typeof parcial.incluirRodapeOficial === 'boolean'
        ? parcial.incluirRodapeOficial
        : base.incluirRodapeOficial,
  }
}

/**
 * Salva as preferências de customização no localStorage (imediato e resiliente)
 */
export function salvarConfiguracaoLocalStorage(
  cnpj: string | null | undefined,
  configuracao: ConfiguracaoRelatorioCustomizado,
): void {
  try {
    const json = JSON.stringify(configuracao)
    localStorage.setItem(CHAVE_LOCAL_STORAGE_GLOBAL, json)
    const docLimpo = normalizarDocumento(cnpj)
    if (docLimpo) {
      localStorage.setItem(`${PREFIXO_LOCAL_STORAGE}${docLimpo}`, json)
    }
  } catch (err) {
    console.warn('[CustomRelatorio] Erro ao salvar no localStorage:', err)
  }
}

/**
 * Carrega as preferências de customização do localStorage
 */
export function carregarConfiguracaoLocalStorage(
  cnpj?: string | null,
): ConfiguracaoRelatorioCustomizado {
  const docLimpo = normalizarDocumento(cnpj)
  if (docLimpo) {
    try {
      const salvo = localStorage.getItem(`${PREFIXO_LOCAL_STORAGE}${docLimpo}`)
      if (salvo) {
        return mesclarComPadrao(JSON.parse(salvo))
      }
    } catch {
      // Ignora erro
    }
  }

  try {
    const globalSalvo = localStorage.getItem(CHAVE_LOCAL_STORAGE_GLOBAL)
    if (globalSalvo) {
      return mesclarComPadrao(JSON.parse(globalSalvo))
    }
  } catch {
    // Ignora erro
  }

  return criarConfiguracaoPadrao()
}

/**
 * Carrega a configuração do relatório a partir do PocketBase (ou fallback localStorage)
 */
export function carregarConfiguracaoRelatorio(
  cnpj?: string | null,
  notasAjustadasPocketBase?: string | null,
): ConfiguracaoRelatorioCustomizado {
  // Se recebemos notas_ajustadas do PocketBase, tenta decodificar
  if (notasAjustadasPocketBase) {
    const { configuracao } = decodificarNotasEAjustes(notasAjustadasPocketBase)
    if (configuracao) {
      // Atualiza também o cache local
      salvarConfiguracaoLocalStorage(cnpj, configuracao)
      return configuracao
    }
  }

  // Fallback para localStorage
  return carregarConfiguracaoLocalStorage(cnpj)
}

/**
 * Salva a configuração de customização no PocketBase na collection analise_pareceres
 * (mantendo os dados existentes do parecer caso existam) e sincroniza no localStorage
 */
export async function salvarConfiguracaoRelatorioPocketBase(
  cnpj: string,
  configuracao: ConfiguracaoRelatorioCustomizado,
  notasTextoAtuais = '',
): Promise<boolean> {
  const docLimpo = normalizarDocumento(cnpj)
  // Sempre salva no localStorage primeiro para feedback instantâneo
  salvarConfiguracaoLocalStorage(docLimpo, configuracao)

  if (!docLimpo) {
    return true
  }

  try {
    const novoConteudoNotas = codificarNotasComAjustes(notasTextoAtuais, configuracao)

    // Busca se já existe registro de parecer para este cliente
    const registros = await pb.collection('analise_pareceres').getList(1, 1, {
      filter: `cliente_cnpj = "${docLimpo}"`,
      sort: '-created',
    })

    if (registros.items.length > 0) {
      const registroExistente = registros.items[0]
      // Se não passou notasTextoAtuais, tenta reaproveitar as notas existentes
      let textoPreservar = notasTextoAtuais
      if (!textoPreservar && registroExistente.notas_ajustadas) {
        const dec = decodificarNotasEAjustes(registroExistente.notas_ajustadas)
        textoPreservar = dec.notasTexto
      }
      const conteudoFinal = codificarNotasComAjustes(textoPreservar, configuracao)

      await pb.collection('analise_pareceres').update(registroExistente.id, {
        notas_ajustadas: conteudoFinal,
      })
      return true
    }

    // Se não existe registro ainda, cria com os dados da customização
    await pb.collection('analise_pareceres').create({
      cliente_cnpj: docLimpo,
      notas_ajustadas: novoConteudoNotas,
    })
    return true
  } catch (err) {
    console.warn(
      '[CustomRelatorio] Falha ao persistir no PocketBase, mantido no localStorage:',
      err,
    )
    return false
  }
}

/**
 * Atalho conveniente unificado para salvar configuração de relatório
 * (sincroniza localStorage e tenta PocketBase se houver CNPJ)
 */
export async function salvarConfiguracaoRelatorio(
  cnpj: string | null | undefined,
  configuracao: ConfiguracaoRelatorioCustomizado,
  notasTextoAtuais = '',
): Promise<boolean> {
  const docLimpo = normalizarDocumento(cnpj)
  salvarConfiguracaoLocalStorage(docLimpo, configuracao)
  if (!docLimpo) return true
  return salvarConfiguracaoRelatorioPocketBase(docLimpo, configuracao, notasTextoAtuais)
}
