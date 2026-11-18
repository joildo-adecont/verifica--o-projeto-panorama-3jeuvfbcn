import React, { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

/**
 * Catálogo único dos módulos que são ROTAS do sistema (React Router).
 * Serve como fonte única de verdade para:
 *  - a trilha de navegação (breadcrumb) das páginas de módulo;
 *  - a troca rápida entre módulos em qualquer tela;
 *  - o destaque do módulo ativo no cabeçalho.
 * NÃO substitui a NAVEGACAO (abas/seções do Panorama) — complementa com
 * os módulos de rota dedicada, que antes só eram acessíveis por botões.
 */
export interface ModuloRotaInfo {
  id: string
  path: string
  label: string
  descricao: string
  /** Cor do ponto indicador do módulo ativo (tailwind) */
  cor: string
}

export const MODULOS_ROTA: ModuloRotaInfo[] = [
  {
    id: 'inicio',
    path: '/',
    label: 'Início — Panorama RT',
    descricao: 'Portal da Reforma Tributária',
    cor: 'bg-slate-800',
  },
  {
    id: 'clientes',
    path: '/cadastro-clientes',
    label: 'Cadastro de Clientes',
    descricao: 'Carteira ativa',
    cor: 'bg-emerald-600',
  },
  {
    id: 'inativos',
    path: '/cadastro-clientes-inativos',
    label: 'Clientes Inativos',
    descricao: 'Carteira inativa e arquivados',
    cor: 'bg-slate-500',
  },
  {
    id: 'nfes',
    path: '/documentos-fiscais',
    label: 'Documentos Fiscais',
    descricao: 'NFes & Pipeline',
    cor: 'bg-sky-600',
  },
  {
    id: 'analises',
    path: '/analises-empresariais',
    label: 'Análises Empresariais',
    descricao: 'Diagnósticos & Indicadores',
    cor: 'bg-emerald-700',
  },
  {
    id: 'email',
    path: '/email-marketing',
    label: 'E-mail Marketing',
    descricao: 'Mailchimp & Campanhas',
    cor: 'bg-sky-500',
  },
]

/** Alias de rota por módulo (mesma página, caminhos diferentes). */
const ALIASES_ROTA: Record<string, string> = {
  '/nfes': '/documentos-fiscais',
}

/** Resolve o módulo ativo a partir do pathname atual (prefixo de 1 nível).
 *  Usa a correspondência MAIS LONGA primeiro: /cadastro-clientes-inativos
 *  também é prefixo-casado por /cadastro-clientes, e sem isso a listagem de
 *  inativos apareceria com o módulo errado em destaque. */
export function moduloRotaAtual(pathname: string): ModuloRotaInfo {
  const normalizado = ALIASES_ROTA[pathname] ?? pathname
  const candidatos = MODULOS_ROTA.filter(
    (m) => m.path !== '/' && (normalizado === m.path || normalizado.startsWith(m.path + '/')),
  ).sort((a, b) => b.path.length - a.path.length)
  return candidatos[0] ?? MODULOS_ROTA[0]
}

interface TrilhaNavegacaoProps {
  /** id do módulo atual dentro de MODULOS_ROTA — opcional: quando omitido,
      o módulo é resolvido automaticamente do pathname da rota (padrão usado
      nas páginas de módulo, que só renderizam <TrilhaNavegacao />) */
  atual?: string
  /** Rótulo opcional do contexto atual (ex.: nome do cliente na ficha) */
  rotuloExtra?: string
}

/**
 * Trilha de navegação (breadcrumb) dos módulos de rota:
 *  - mostra onde o usuário está (Início ▸ Módulo ▸ contexto opcional);
 *  - permite trocar rápido de módulo sem voltar ao Início;
 *  - define o título da aba do navegador de forma consistente.
 * Barra simples no topo do conteúdo — não é sticky, para não interferir
 * com as barras de rolagem fixas e colunas congeladas das listagens.
 */
export function TrilhaNavegacao({ rotuloExtra }: TrilhaNavegacaoProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const moduloAtual = moduloRotaAtual(location.pathname)

  // Título da página consistente: "Módulo — ADECONT" (com contexto opcional)
  useEffect(() => {
    const rotulo = rotuloExtra ? `${rotuloExtra} · ${moduloAtual.label}` : moduloAtual.label
    document.title = `${rotulo} — ADECONT`
  }, [moduloAtual.label, rotuloExtra])

  const outrosModulos = MODULOS_ROTA.filter((m) => m.id !== moduloAtual.id && m.path !== '/')

  return (
    <div className="w-full bg-white/90 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 py-2">
      <div className="mx-auto max-w-7xl flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {/* Breadcrumb */}
        <nav
          aria-label="Trilha de navegação entre módulos"
          className="flex items-center gap-1.5 min-w-0 text-xs"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 hover:underline font-medium transition-colors"
            title="Voltar ao Portal Panorama da Reforma Tributária"
          >
            <Home className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Início</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span
            className={`inline-flex items-center gap-1.5 font-bold text-slate-800 min-w-0 ${rotuloExtra ? '' : 'truncate'}`}
            aria-current="page"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${moduloAtual.cor}`}
              aria-hidden="true"
            />
            <span className="truncate">{moduloAtual.label}</span>
          </span>
          {rotuloExtra && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <span className="truncate text-slate-600 font-semibold max-w-[220px] sm:max-w-xs">
                {rotuloExtra}
              </span>
            </>
          )}
        </nav>

        {/* Troca rápida de módulos (mobile/tablet: seletor nativo, sem depender do menu do portal) */}
        <div className="lg:hidden w-full flex items-center gap-2 pt-1">
          <label
            htmlFor="troca-modulo-rapida"
            className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0"
          >
            Módulo:
          </label>
          <select
            id="troca-modulo-rapida"
            value={moduloAtual.id}
            onChange={(e) => {
              const destino = MODULOS_ROTA.find((m) => m.id === e.target.value)
              if (destino) navigate(destino.path)
            }}
            className="w-full max-w-[280px] text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
          >
            {MODULOS_ROTA.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Troca rápida de módulos (desktop) */}
        <div className="hidden lg:flex items-center gap-1 ml-auto" aria-label="Trocar de módulo">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
            Módulos:
          </span>
          {outrosModulos.map((m) => (
            <Link
              key={m.id}
              to={m.path}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
              title={`${m.label} — ${m.descricao}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${m.cor}`} aria-hidden="true" />
              <span>{m.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
