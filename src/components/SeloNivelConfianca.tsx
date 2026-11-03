import { useEffect, useState, useMemo } from 'react'
import { ShieldCheck, Landmark, Layers, Info } from 'lucide-react'
import { fetchSourceStatuses } from '@/services/panorama'
import type { ConfidenceTier, SourceStatusItem } from '@/types/panorama'

export interface ConfidenceTierMeta {
  tier: ConfidenceTier
  rotulo: string
  subtitulo: string
  descricao: string
  badgeClass: string
  icon: typeof ShieldCheck
  avisoLegal?: string
}

export const METADADOS_CONFIDENCE_TIER: Record<ConfidenceTier, ConfidenceTierMeta> = {
  diario_oficial: {
    tier: 'diario_oficial',
    rotulo: 'Diário Oficial — confiável',
    subtitulo: 'Validade legal primária',
    descricao:
      'Publicação oficial primária e autoritativa. Prevalece sobre quaisquer outras fontes.',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/40',
    icon: ShieldCheck,
  },
  oficial_institucional: {
    tier: 'oficial_institucional',
    rotulo: 'Oficial institucional',
    subtitulo: 'Órgão de Estado',
    descricao: 'Publicação de órgão público oficial (RFB, CGIBS, Senado, Planalto, Ministérios).',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-300 ring-1 ring-blue-400/30',
    icon: Landmark,
  },
  comparacao: {
    tier: 'comparacao',
    rotulo: 'Comparação — não oficial',
    subtitulo: 'Serviço privado sem valor jurídico',
    descricao:
      'Serviço privado comercial de confronto (ex.: Lefisc, agregadores). Sem validade jurídica legal.',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-400/40',
    icon: Layers,
    avisoLegal:
      'Serviço privado de confronto sem validade jurídica. Serve para localização rápida e conferência com o Diário Oficial.',
  },
}

let cachedSources: SourceStatusItem[] | null = null
let promiseEmAndamento: Promise<SourceStatusItem[]> | null = null

/**
 * Busca e guarda em cache os status das fontes do banco source_status
 */
export async function obterStatusFontesComCache(): Promise<SourceStatusItem[]> {
  if (cachedSources && Array.isArray(cachedSources) && cachedSources.length > 0) {
    return cachedSources
  }
  if (!promiseEmAndamento) {
    promiseEmAndamento = fetchSourceStatuses()
      .then((res) => {
        if (Array.isArray(res)) {
          cachedSources = res
        }
        return cachedSources || []
      })
      .catch((err) => {
        console.warn('Erro ao carregar source_status:', err)
        return []
      })
      .finally(() => {
        promiseEmAndamento = null
      })
  }
  return promiseEmAndamento
}

/**
 * Normaliza texto para correspondência segura e tolerante a acentos e maiúsculas
 */
function normalizar(txt?: string): string {
  return (txt || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Deduz o nível de confiança com base nos registros do banco e com fallback defensivo
 */
export function deduzirConfidenceTier(
  fonteIdOuNome?: string,
  fontesBanco?: SourceStatusItem[],
): ConfidenceTier | undefined {
  if (!fonteIdOuNome) return undefined
  const alvo = normalizar(fonteIdOuNome)

  // 1. Tentar encontrar correspondência exata ou aproximada nos dados reais do PocketBase
  if (Array.isArray(fontesBanco) && fontesBanco.length > 0) {
    const achado = fontesBanco.find((f) => {
      if (!f) return false
      const keyNorm = normalizar(f.source_key)
      const nomeNorm = normalizar(f.name)
      const urlNorm = normalizar(f.url)

      return (
        keyNorm === alvo ||
        nomeNorm === alvo ||
        alvo.includes(keyNorm) ||
        keyNorm.includes(alvo) ||
        nomeNorm.includes(alvo) ||
        alvo.includes(nomeNorm) ||
        urlNorm.includes(alvo)
      )
    })

    if (achado?.confidence_tier) {
      return achado.confidence_tier
    }
  }

  // 2. Regras defensivas sem quebrar quando ainda não carregou do banco ou id genérico:
  if (alvo.includes('lefisc')) {
    return 'comparacao'
  }
  if (
    alvo.includes('dou') ||
    alvo.includes('imprensa nacional') ||
    alvo.includes('diario oficial da uniao') ||
    alvo.includes('diariomunicipal') ||
    alvo.includes('diario municipal') ||
    alvo.includes('diarios municipais') ||
    alvo.includes('amm') ||
    alvo.includes('famep')
  ) {
    return 'diario_oficial'
  }
  if (
    alvo.includes('receita') ||
    alvo.includes('rfb') ||
    alvo.includes('cgibs') ||
    alvo.includes('senado') ||
    alvo.includes('planalto') ||
    alvo.includes('confaz') ||
    alvo.includes('camara') ||
    alvo.includes('presidencia') ||
    alvo.includes('ibge') ||
    alvo.includes('siscomex') ||
    alvo.includes('mdic') ||
    alvo.includes('suframa') ||
    alvo.includes('cgsn') ||
    alvo.includes('serpro') ||
    alvo.includes('fazenda') ||
    alvo.includes('mef') ||
    alvo.includes('carf') ||
    alvo.includes('stf') ||
    alvo.includes('stj') ||
    alvo.includes('anp')
  ) {
    return 'oficial_institucional'
  }

  return undefined
}

/**
 * Hook para acessar a lista de fontes e resolver o nível de confiança
 */
export function useSourceConfidence() {
  const [sources, setSources] = useState<SourceStatusItem[]>(() => cachedSources || [])
  const [carregando, setCarregando] = useState<boolean>(!cachedSources)

  useEffect(() => {
    let montado = true
    obterStatusFontesComCache().then((lista) => {
      if (montado && Array.isArray(lista)) {
        setSources(lista)
        setCarregando(false)
      }
    })
    return () => {
      montado = false
    }
  }, [])

  const resolverTier = useMemo(() => {
    return (fonteIdOuNome?: string, tierDireto?: ConfidenceTier): ConfidenceTier | undefined => {
      if (tierDireto && METADADOS_CONFIDENCE_TIER[tierDireto]) {
        return tierDireto
      }
      return deduzirConfidenceTier(fonteIdOuNome, sources)
    }
  }, [sources])

  return {
    sources,
    carregando,
    resolverTier,
  }
}

export interface SeloNivelConfiancaProps {
  /** Nível de confiança explícito (se já vier de source_status.confidence_tier) */
  tier?: ConfidenceTier
  /** Ou nome/chave da fonte para resolver dinamicamente nos dados do PocketBase */
  fonte?: string
  /** Compatibilidade com código legado que passa nomeFonte */
  nomeFonte?: string
  /** Se deve mostrar versão compacta (apenas ícone e rótulo curto) */
  compacto?: boolean
  /** Compatibilidade com código legado que passa tamanho="compacto" */
  tamanho?: 'compacto' | 'normal' | 'sm' | 'md'
  /** Compatibilidade com código legado que passa permitirModal */
  permitirModal?: boolean
  /** Se deve mostrar o aviso/nota jurídica (especialmente importante para Lefisc) */
  exibirAvisoJuridico?: boolean
  /** Classes CSS adicionais */
  className?: string
}

/**
 * Componente visual do Selo de Nível de Confiança
 * - "Diário Oficial — confiável" (DOU / Imprensa Nacional)
 * - "Oficial institucional" (Receita Federal / RFB, CGIBS, Senado, Planalto)
 * - "Comparação — não oficial" (Lefisc e serviços privados de confronto)
 * - Rótulo neutro se não identificado (defensivo: nunca quebra)
 */
export function SeloNivelConfianca({
  tier,
  fonte,
  nomeFonte,
  compacto = false,
  tamanho,
  permitirModal: _permitirModal,
  exibirAvisoJuridico = false,
  className = '',
}: SeloNivelConfiancaProps) {
  const { resolverTier } = useSourceConfidence()
  const fonteEfetiva = fonte || nomeFonte
  const tierEfetivo = tier || resolverTier(fonteEfetiva)
  const isCompacto = compacto || tamanho === 'compacto' || tamanho === 'sm'

  if (!tierEfetivo || !METADADOS_CONFIDENCE_TIER[tierEfetivo]) {
    // Rótulo neutro defensivo padrão
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
        title="Fonte de referência catalogada"
      >
        <Info className="w-2.5 h-2.5 text-slate-500 shrink-0" />
        <span>Referência</span>
      </span>
    )
  }

  const meta = METADADOS_CONFIDENCE_TIER[tierEfetivo]
  const Icone = meta.icon

  return (
    <div className={`inline-flex flex-col gap-0.5 ${className}`}>
      <span
        className={`inline-flex items-center gap-1 rounded font-bold border transition-colors ${
          isCompacto ? 'px-1.5 py-0.2 text-[9.5px]' : 'px-2 py-0.5 text-[10.5px]'
        } ${meta.badgeClass}`}
        title={`${meta.rotulo} — ${meta.descricao}`}
      >
        <Icone className={isCompacto ? 'w-2.5 h-2.5 shrink-0' : 'w-3 h-3 shrink-0'} />
        <span>{meta.rotulo}</span>
      </span>

      {exibirAvisoJuridico && meta.avisoLegal && (
        <span className="text-[9.5px] text-amber-800 leading-tight flex items-start gap-1 mt-0.5 font-normal max-w-xs">
          <Info className="w-2.5 h-2.5 shrink-0 text-amber-600 mt-0.5" />
          <span>{meta.avisoLegal}</span>
        </span>
      )}
    </div>
  )
}
