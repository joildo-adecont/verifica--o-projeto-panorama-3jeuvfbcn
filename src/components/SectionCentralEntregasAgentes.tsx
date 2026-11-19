/**
 * SEÇÃO — CENTRAL DE ENTREGAS DOS AGENTES (Sistema ADECONT — Projeto Panorama)
 *
 * Lista as entregas registradas (coleção entregas_agentes): data, agente, título
 * e tipo de conteúdo. Permite visualizar o conteúdo estruturado do relatório
 * (mesmos blocos da tela do agente) e re-exportar em PDF/TXT/CSV/XLSX.
 * Rota: #central-entregas-agentes
 */
import { useEffect, useMemo, useState } from 'react'
import {
  Bot,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  FileText,
  Inbox,
  Loader2,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RenderizadorBlocosRelatorio } from '@/components/RenderizadorBlocosRelatorio'
import { BarraExportacaoRelatorio } from '@/components/BarraExportacaoRelatorio'
import {
  blocosDaEntrega,
  excluirEntrega,
  listarEntregas,
  type EntregaAgente,
} from '@/services/centralEntregas'
import { parseBlocosRelatorio, type BlocoRelatorio } from '@/services/relatorioAgenteParser'
import type { SegmentoEspecialista } from '@/services/agenteEspecialista'

const NOMES_AGENTES: Record<string, string> = {
  juridico: 'Agente Jurídico',
  tributario: 'Agente Tributário',
  contabil: 'Agente Contábil',
  administrativo: 'Agente Administrativo',
  'consultor-contabil-estrategico': 'Consultor Contábil Estratégico',
  'gestao-estrategica': 'Consultor de Gestão Estratégica',
  'reforma-tributaria': 'Consultor da Reforma Tributária',
}

function nomeAgente(e: EntregaAgente): string {
  return e.agente_nome || NOMES_AGENTES[e.agente_segmento] || e.agente_segmento
}

export function SectionCentralEntregasAgentes() {
  const [entregas, setEntregas] = useState<EntregaAgente[]>([])
  const [carregando, setCarregando] = useState(true)
  const [abertaId, setAbertaId] = useState<string | null>(null)
  const [filtro, setFiltro] = useState('')

  const carregar = async () => {
    setCarregando(true)
    const lista = await listarEntregas(200)
    setEntregas(lista)
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  const entregasFiltradas = useMemo(() => {
    const f = filtro.trim().toLowerCase()
    if (!f) return entregas
    return entregas.filter(
      (e) =>
        e.titulo.toLowerCase().includes(f) ||
        nomeAgente(e).toLowerCase().includes(f) ||
        (e.pergunta_origem || '').toLowerCase().includes(f),
    )
  }, [entregas, filtro])

  const handleExcluir = async (id: string) => {
    const ok = await excluirEntrega(id)
    if (ok) {
      setEntregas((prev) => prev.filter((e) => e.id !== id))
    }
  }

  return (
    <div className="space-y-5 pb-8">
      {/* ── TOPO ── */}
      <div className="rounded-2xl border-2 border-slate-200 bg-gradient-to-r from-slate-900 via-panorama-navy to-slate-900 p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-panorama-gold text-panorama-navy">
              <Inbox className="w-3.5 h-3.5" />
              Central de Entregas
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Entregas dos Agentes Especialistas
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
              Todo relatório exportado pelos 7 especialistas fica registrado aqui — com data,
              agente, título e conteúdo estruturado — pronto para visualizar e re-exportar em PDF,
              TXT, CSV ou planilha (XLSX).
            </p>
          </div>
        </div>
      </div>

      {/* ── FILTRO + ATUALIZAR ── */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Filtrar por título, agente ou pergunta de origem..."
          className="flex-1 min-w-[220px] bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-panorama-navy"
        />
        <Button variant="outline" size="sm" onClick={carregar} disabled={carregando}>
          {carregando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Atualizar
        </Button>
      </div>

      {/* ── LISTAGEM ── */}
      {carregando && entregas.length === 0 ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-10 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando entregas...
        </div>
      ) : entregasFiltradas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Nenhuma entrega registrada ainda. Exporte um relatório na tela de um agente especialista
          (botões PDF, TXT, CSV ou XLSX) e ele aparecerá aqui.
        </div>
      ) : (
        <div className="space-y-2.5">
          {entregasFiltradas.map((entrega) => {
            const aberta = abertaId === entrega.id
            return (
              <div
                key={entrega.id}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Bot className="w-3 h-3" />
                        {nomeAgente(entrega)}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <FileText className="w-3 h-3" />
                        {entrega.tipo_conteudo || 'N/A'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                        <CalendarDays className="w-3 h-3" />
                        {entrega.created ? new Date(entrega.created).toLocaleString('pt-BR') : '—'}
                      </span>
                    </div>
                    <p
                      className="mt-1 text-sm font-semibold text-slate-900 truncate"
                      title={entrega.titulo}
                    >
                      {entrega.titulo}
                    </p>
                    {entrega.pergunta_origem && (
                      <p
                        className="text-[11px] text-slate-500 truncate"
                        title={entrega.pergunta_origem}
                      >
                        Origem: {entrega.pergunta_origem}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 nao-imprimir">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAbertaId(aberta ? null : entrega.id)}
                    >
                      {aberta ? (
                        <>
                          <ChevronUp className="mr-1 h-3.5 w-3.5" /> Fechar
                        </>
                      ) : (
                        <>
                          <ChevronDown className="mr-1 h-3.5 w-3.5" /> Visualizar
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => handleExcluir(entrega.id)}
                      title="Excluir entrega"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {aberta && <ConteudoEntrega entrega={entrega} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Conteúdo aberto de uma entrega: relatório estruturado + re-exportação. */
function ConteudoEntrega({ entrega }: { entrega: EntregaAgente }) {
  const blocos: BlocoRelatorio[] = useMemo(() => {
    const doRegistro = blocosDaEntrega(entrega)
    if (doRegistro.length > 0) return doRegistro
    // compat: entrega antiga gravada como markdown cru
    return parseBlocosRelatorio(entrega.conteudo_json || '')
  }, [entrega])

  return (
    <div
      className="border-t border-slate-200 bg-slate-50/40 px-4 py-4 space-y-3"
      id="relatorio-agente-impressao"
    >
      <BarraExportacaoRelatorio
        blocos={blocos}
        meta={{
          titulo: entrega.titulo,
          agente: nomeAgente(entrega),
          dataEmissao: entrega.created
            ? new Date(entrega.created).toLocaleString('pt-BR')
            : undefined,
        }}
        agenteSegmento={(entrega.agente_segmento as SegmentoEspecialista) || 'juridico'}
        perguntaOrigem={entrega.pergunta_origem || undefined}
        entregaJaRegistrada
      />
      <RenderizadorBlocosRelatorio blocos={blocos} />
      {blocos.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Esta entrega não possui blocos estruturados legíveis (conteúdo antigo ou corrompido).
        </div>
      )}
    </div>
  )
}
