/**
 * BLOCO "INDICADORES PANORAMA RT" DO MENU LATERAL
 *
 * Completa o PanoramaSideMenu (desktop e gaveta mobile) com as abas do portal
 * de Indicadores Econômicos — antes eram estado interno da seção, invisíveis
 * para o menu. Usa a MESMA fonte de dados da faixa MenuNavegacaoPortal
 * (ITENS_MENU_PORTAL), então faixa e menu lateral nunca divergem.
 *
 * Destaque do item ativo: lido do hash (#indicadores-economicos?aba=X),
 * igual ao comportamento de destaque do restante do menu lateral.
 */
import { ChevronRight, TrendingUp } from 'lucide-react'
import {
  ITENS_MENU_PORTAL,
  hashDoItemPortal,
  type ItemMenuPortal,
} from '@/components/MenuNavegacaoPortal'

interface BlocoMenuIndicadoresProps {
  /** hash atual da URL — define o item destacado */
  hashAtivo: string
  /** chamado ao clicar (fecha a gaveta no mobile) */
  aoNavegar: (href: string) => void
}

/** Deduz qual item do bloco está ativo a partir do hash (mesma regra da faixa). */
function itemAtivoDoHash(hash: string): string | null {
  const limpo = (hash || '').replace(/^#/, '')
  const [rota, query] = limpo.split('?')
  if (!rota || rota === 'inicio') return 'inicio'
  if (rota === 'indicadores-economicos') {
    const aba = new URLSearchParams(query || '').get('aba')
    const valido = ITENS_MENU_PORTAL.find((i) => i.aba && i.aba === aba)
    return valido ? valido.id : 'inflacao'
  }
  return null
}

export function BlocoMenuIndicadores({ hashAtivo, aoNavegar }: BlocoMenuIndicadoresProps) {
  const ativoId = itemAtivoDoHash(hashAtivo)
  const IconePortal = TrendingUp

  const renderItem = (item: ItemMenuPortal) => {
    const Icone = item.Icon
    const ativo = ativoId === item.id
    return (
      <button
        key={item.id}
        onClick={() => aoNavegar(hashDoItemPortal(item))}
        className={`w-full p-2 rounded-xl text-left transition-all flex items-center justify-between gap-2 cursor-pointer border ${
          ativo
            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`p-1 rounded-lg border text-xs shrink-0 ${
              ativo
                ? 'bg-white/10 border-white/20 text-amber-300'
                : 'bg-panorama-navy/5 border-slate-200 text-panorama-navy'
            }`}
          >
            <Icone className="w-3.5 h-3.5" />
          </span>
          <div className="min-w-0">
            <span
              className={`text-xs font-bold block truncate ${ativo ? 'text-white' : 'text-slate-800'}`}
            >
              {item.label}
            </span>
            <span
              className={`text-[10px] block truncate ${ativo ? 'text-slate-300' : 'text-slate-400'}`}
            >
              {item.descricao}
            </span>
          </div>
        </div>
        <ChevronRight
          className={`w-3.5 h-3.5 shrink-0 ${ativo ? 'text-amber-300' : 'text-slate-300'}`}
        />
      </button>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 px-1">
        <span className="flex items-center justify-center w-5 h-5 rounded-md bg-panorama-navy/5 text-panorama-navy">
          <IconePortal className="w-3.5 h-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 block truncate">
            Portal Panorama RT
          </span>
          <span className="text-[9.5px] text-slate-400 block truncate">
            Indicadores econômicos e financeiros
          </span>
        </div>
        <span className="text-[10px] font-bold text-slate-400">{ITENS_MENU_PORTAL.length}</span>
      </div>
      <div className="space-y-1 pl-1">{ITENS_MENU_PORTAL.map(renderItem)}</div>
    </div>
  )
}
