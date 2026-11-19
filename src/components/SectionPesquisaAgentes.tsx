/**
 * PESQUISA DOS AGENTES — tela exclusiva e ampla (pedido do usuário, 2026-11-19)
 *
 * "Crie ao lado do Consultar Especialista um ícone que chamaremos de PESQUISA DOS
 *  AGENTES, transfira todos os ícones laterais dos agentes para dentro deste ícone
 *  e quando acionados abram tela exclusiva e ampla para pesquisa com estes agentes."
 *
 * Esta tela reúne:
 *  - o seletor dos 7 agentes (antes itens próprios do menu lateral);
 *  - o chat do agente selecionado, REUSANDO TelaAgenteEspecialista — mesma rota
 *    de chat /backend/v1/agente-especialista/chat por segmento, mesmos blocos
 *    estruturados, mesma barra de exportação. Nenhuma lógica de chat duplicada;
 *  - o ícone EXCLUSIVO da Central de Entregas, na barra da tela, que abre a
 *    Central num painel lateral sobreposto — tudo dentro do mesmo ícone geral,
 *    como o usuário pediu.
 *
 * Layout "workbench": ocupa a largura máxima disponível e tem rolagem interna —
 * sem sidebar estreitando o conteúdo.
 * O histórico de cada agente é preservado ao trocar de agente: cada
 * TelaAgenteEspecialista permanece MONTADO (os 7 ficam no DOM, escondidos via
 * atributo hidden) — o conversation_id de cada um sobrevive à troca.
 *
 * O parâmetro opcional `agenteInicial` permite abrir a tela já num agente — é o
 * que os atalhos F1–F7 e os links antigos #agente-* usam (rotas.tsx).
 */
import { useEffect, useState } from 'react'
import { Inbox, X, Search } from 'lucide-react'
import { TelaAgenteEspecialista } from '@/components/TelaAgenteEspecialista'
import { SectionCentralEntregasAgentes } from '@/components/SectionCentralEntregasAgentes'
import { CONFIG_AGENTES } from '@/components/configAgentes'
import type { SegmentoEspecialista } from '@/services/agenteEspecialista'

interface PropsSectionPesquisaAgentes {
  /** slug do segmento a abrir pré-selecionado (compat: uso programático da tela) */
  agenteInicial?: string
}

/**
 * Lê ?agente=slug e ?central=1 do hash atual (o resolverRota corta no "?" e o
 * roteador não passa props — a tela lê os parâmetros direto do window.location).
 */
function lerParametrosHash(): { agente?: string; central: boolean } {
  if (typeof window === 'undefined') return { central: false }
  const query = window.location.hash.split('?')[1] ?? ''
  const params = new URLSearchParams(query)
  return {
    agente: params.get('agente') ?? undefined,
    central: params.get('central') === '1',
  }
}

export function SectionPesquisaAgentes({ agenteInicial }: PropsSectionPesquisaAgentes) {
  const inicial = agenteInicial ?? lerParametrosHash().agente
  const valido = CONFIG_AGENTES.some((a) => a.segmento === inicial)
  const [segmentoAtivo, setSegmentoAtivo] = useState<SegmentoEspecialista>(
    (valido ? inicial : CONFIG_AGENTES[0].segmento) as SegmentoEspecialista,
  )
  const [centralAberta, setCentralAberta] = useState(lerParametrosHash().central)

  const agenteAtivo = CONFIG_AGENTES.find((a) => a.segmento === segmentoAtivo)!

  // Atalhos F1–F7 (hash ?agente=slug), F8 (?central=1) e links antigos #agente-*
  // trocam o agente / abrem a Central DEPOIS de montado — reagem ao hashchange.
  useEffect(() => {
    const sincronizar = () => {
      const { agente, central } = lerParametrosHash()
      if (agente && CONFIG_AGENTES.some((a) => a.segmento === agente)) {
        setSegmentoAtivo(agente as SegmentoEspecialista)
      }
      setCentralAberta(central)
    }
    window.addEventListener('hashchange', sincronizar)
    return () => window.removeEventListener('hashchange', sincronizar)
  }, [])

  return (
    <div className="relative">
      {/* ── BARRA DE PESQUISA: seletor dos 7 agentes + ícone exclusivo da Central ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-3 sm:p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 pr-3 mr-1 border-r border-slate-200">
            <Search className="w-4 h-4 text-panorama-gold" />
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Pesquisa dos Agentes
            </span>
          </div>

          <div className="flex-1 min-w-[280px] flex items-center gap-1.5 flex-wrap">
            {CONFIG_AGENTES.map((ag) => {
              const ativo = ag.segmento === segmentoAtivo
              return (
                <button
                  key={ag.segmento}
                  onClick={() => setSegmentoAtivo(ag.segmento)}
                  title={ag.descricao}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    ativo
                      ? `${ag.corPrimaria} ring-2 ring-panorama-gold/40 shadow-sm`
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <ag.Icon className="w-3.5 h-3.5" />
                  <span>{ag.curto}</span>
                </button>
              )
            })}
          </div>

          {/* ÍCONE EXCLUSIVO DA CENTRAL DE ENTREGAS — tudo no mesmo ícone geral */}
          <button
            onClick={() => setCentralAberta(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer shrink-0"
            title="Central de Entregas dos Agentes"
          >
            <Inbox className="w-4 h-4" />
            <span className="hidden sm:inline">Central de Entregas</span>
          </button>
        </div>
      </div>

      {/* ── CHAT DO AGENTE ATIVO (os 7 permanecem montados: histórico preservado) ── */}
      <div className="mt-4 space-y-4">
        {CONFIG_AGENTES.map((ag) => (
          <div key={ag.segmento} hidden={ag.segmento !== segmentoAtivo}>
            <TelaAgenteEspecialista
              segmento={ag.segmento}
              titulo={ag.titulo}
              subtitulo={ag.subtitulo}
              badge={ag.badge}
              descricao={ag.descricao}
              exemplosProntos={ag.exemplosProntos}
              corPrimaria={ag.corPrimaria}
              Icon={ag.Icon}
            />
          </div>
        ))}
      </div>

      {/* ── PAINEL DA CENTRAL DE ENTREGAS (dentro da mesma tela ampla) ── */}
      {centralAberta && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setCentralAberta(false)}
            aria-label="Fechar Central de Entregas"
          />
          <div className="relative h-full w-full max-w-4xl bg-white shadow-2xl border-l border-slate-200 flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
              <span className="text-sm font-black text-slate-900">
                Central de Entregas dos Agentes
              </span>
              <button
                onClick={() => setCentralAberta(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <SectionCentralEntregasAgentes />
            </div>
          </div>
        </div>
      )}

      {/* Rodapé discreto indicando o agente ativo */}
      <p className="mt-2 text-[11px] text-slate-400">
        {agenteAtivo.curto} selecionado · o histórico de cada agente é mantido ao trocar de aba
        nesta tela.
      </p>
    </div>
  )
}
