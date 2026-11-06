/**
 * MENU DE NAVEGAÇÃO DO PORTAL PANORAMA RT
 *
 * O usuário pediu: "Adicionar menu de navegação ao portal" — uma navegação clara
 * e visível entre os módulos do sistema, que antes exigia abrir o menu lateral
 * completo (ou não existia por hash: as abas de indicadores eram estado interno).
 *
 * É uma faixa horizontal de chips, sempre visível no topo do miolo (abaixo da
 * trilha de navegação), em TODAS as telas da rota /:
 *   · Painel Inicial (volta ao portal, limpa o hash)
 *   · as 6 abas de Indicadores Econômicos (Inflação, Taxas, Estatísticas,
 *     Mercado, Câmbio, Histórico) — endereçáveis por hash
 *     (#indicadores-economicos?aba=estatisticas etc.)
 *   · Cadastro de Clientes (rota /cadastro-clientes, via react-router Link)
 *
 * Padrão visual ADECONT: panorama-navy + panorama-gold (as mesmas cores do
 * header e do menu lateral), tipografia bold/tracking do portal.
 * Responsivo: no estreito vira uma faixa com rolagem horizontal (chips inteiros,
 * sem quebra de texto), com os mesmos alvos e o mesmo destaque do item ativo.
 */
import { Link } from 'react-router-dom'
import {
  Home,
  TrendingUp,
  Percent,
  BarChart3,
  LineChart,
  Coins,
  History,
  Users2,
  ChevronRight,
} from 'lucide-react'
import type { ComponentType } from 'react'

/** Chaves válidas da aba de indicadores — espelham o AbaId de SectionIndicadoresEconomicos. */
export type AbaIndicadoresId =
  | 'inflacao'
  | 'taxas'
  | 'estatisticas'
  | 'mercado'
  | 'cambio'
  | 'historico'

export interface ItemMenuPortal {
  id: string
  label: string
  descricao: string
  Icon: ComponentType<{ className?: string }>
  /** null = Painel Inicial (hash #inicio); senão = aba de indicadores */
  aba: AbaIndicadoresId | null
}

/** Itens do menu do portal, na ordem de exibição — fonte única para faixa e menu lateral. */
export const ITENS_MENU_PORTAL: ItemMenuPortal[] = [
  {
    id: 'inicio',
    label: 'Painel Inicial',
    descricao: 'Visão geral do portal Panorama RT',
    Icon: Home,
    aba: null,
  },
  {
    id: 'inflacao',
    label: 'Inflação',
    descricao: 'IPCA, IGP-M, INPC e índices de correção',
    Icon: TrendingUp,
    aba: 'inflacao',
  },
  {
    id: 'taxas',
    label: 'Taxas',
    descricao: 'Selic, CDI, TR e poupança',
    Icon: Percent,
    aba: 'taxas',
  },
  {
    id: 'estatisticas',
    label: 'Estatísticas',
    descricao: 'IBGE, Tesouro e IPEA — séries oficiais',
    Icon: BarChart3,
    aba: 'estatisticas',
  },
  {
    id: 'mercado',
    label: 'Mercado',
    descricao: 'Ibovespa, IFIX e mercado financeiro',
    Icon: LineChart,
    aba: 'mercado',
  },
  {
    id: 'cambio',
    label: 'Câmbio',
    descricao: 'PTAX, dólar e moedas estrangeiras',
    Icon: Coins,
    aba: 'cambio',
  },
  {
    id: 'historico',
    label: 'Histórico',
    descricao: 'Séries evolutivas e comparação de índices',
    Icon: History,
    aba: 'historico',
  },
]

/** Monta o hash de navegação do portal para um item do menu. */
export function hashDoItemPortal(item: ItemMenuPortal): string {
  if (item.aba === null) return '#inicio'
  return `#indicadores-economicos?aba=${item.aba}`
}

interface MenuNavegacaoPortalProps {
  /** hash atual da URL — define o item destacado como ativo */
  hashAtivo: string
}

/**
 * Faixa de navegação do portal. O item ativo é deduzido do hash:
 *   · #inicio (ou sem hash)  → Painel Inicial
 *   · #indicadores-economicos?aba=X → aba X (sem ?aba= → Inflação, padrão da seção)
 *   · outra aba (rotas do roteador) → nenhum chip de aba ativo, só a faixa visível
 */
export function MenuNavegacaoPortal({ hashAtivo }: MenuNavegacaoPortalProps) {
  const limpo = (hashAtivo || '').replace(/^#/, '')
  const [rota, query] = limpo.split('?')

  let ativoId: string | null = null
  if (!rota || rota === 'inicio') {
    ativoId = 'inicio'
  } else if (rota === 'indicadores-economicos') {
    const params = new URLSearchParams(query || '')
    const abaParam = params.get('aba')
    const valido = ITENS_MENU_PORTAL.find((i) => i.aba && i.aba === abaParam)
    ativoId = valido ? valido.id : 'inflacao'
  }

  return (
    <nav
      aria-label="Menu de navegação do portal"
      className="bg-white rounded-2xl border-2 border-panorama-gold/50 shadow-xs p-2"
    >
      {/* Faixa rolável no estreito: cada chip é whitespace-nowrap, sem quebra. */}
      <ul className="flex items-center gap-1.5 overflow-x-auto py-0.5">
        {ITENS_MENU_PORTAL.map((item, idx) => {
          const Icone = item.Icon
          const ativo = ativoId === item.id
          const conteudo = (
            <>
              <span
                className={`inline-flex items-center justify-center w-6 h-6 rounded-md border shrink-0 transition-colors ${
                  ativo
                    ? 'bg-panorama-gold border-panorama-gold text-panorama-navy'
                    : 'bg-panorama-navy/5 border-slate-200 text-panorama-navy group-hover:bg-panorama-navy/10'
                }`}
              >
                <Icone className="w-3.5 h-3.5" />
              </span>
              <span className="whitespace-nowrap leading-tight">{item.label}</span>
              <span
                className={`hidden xl:inline text-[10.5px] font-medium truncate max-w-[180px] ${
                  ativo ? 'text-slate-300' : 'text-slate-400'
                }`}
              >
                {item.descricao}
              </span>
            </>
          )

          const className = `group inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border-2 cursor-pointer shrink-0 ${
            ativo
              ? 'bg-panorama-navy text-white border-panorama-navy shadow-sm'
              : 'bg-white text-slate-700 border-transparent hover:border-panorama-gold/60 hover:bg-slate-50'
          }`

          return (
            <li key={item.id} className="flex items-center gap-1.5 shrink-0">
              {item.aba === null ? (
                <a href={hashDoItemPortal(item)} className={className} title={item.descricao}>
                  {conteudo}
                </a>
              ) : (
                /* Chip de aba: navega por hash (mesma rota, ?aba= diferente) */
                <a href={hashDoItemPortal(item)} className={className} title={item.descricao}>
                  {conteudo}
                </a>
              )}
              {/* Separa o Painel Inicial do grupo de indicadores e este do Cadastro */}
              {(idx === 0 || idx === ITENS_MENU_PORTAL.length - 2) && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" aria-hidden="true" />
              )}
            </li>
          )
        })}
        {/* Módulo fora do hash — rota própria no react-router */}
        <li className="shrink-0">
          <Link
            to="/cadastro-clientes"
            className="group inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border-2 bg-white text-slate-700 border-transparent hover:border-panorama-gold/60 hover:bg-slate-50 cursor-pointer shrink-0"
            title="Cadastro Analítico de Clientes ADECONT (consulta, busca, ficha e relatório A4)"
          >
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#0F294A] border border-[#0F294A] text-[#D4AF37] shrink-0 group-hover:scale-105 transition-transform">
              <Users2 className="w-3.5 h-3.5" />
            </span>
            <span className="whitespace-nowrap leading-tight">Cadastro de Clientes</span>
            <span className="hidden xl:inline text-[10.5px] font-medium text-slate-400 truncate max-w-[180px]">
              Consulta analítica ADECONT
            </span>
          </Link>
        </li>
      </ul>
    </nav>
  )
}
