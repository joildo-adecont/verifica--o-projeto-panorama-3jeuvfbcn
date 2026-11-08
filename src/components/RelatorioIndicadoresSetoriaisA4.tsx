/**
 * RELATÓRIO A4 — INDICADORES ECONÔMICOS SETORIAIS (ADECONT)
 *
 * Padrão de RelatorioDadosMercadoA4.tsx: cabeçalho com AdecontLogo + tagline
 * oficial "Assessoria Contábil e Administrativa", data de emissão, identificação
 * do cliente, tabela dos indicadores com fonte real e semáforo, rodapé oficial.
 */

import React from 'react'
import { AdecontLogo } from './AdecontLogo'
import { TrendingUp, TrendingDown, Minus, Database } from 'lucide-react'
import {
  ROTULO_SETOR,
  ORDEM_SETOR,
  formatarValorSetorial,
  obterStatusSemaforoSetorial,
  type ItemIndicadorSetorial,
} from '@/services/indicadoresSetoriais'

interface RelatorioIndicadoresSetoriaisA4Props {
  open: boolean
  onClose: () => void
  indicadores: ItemIndicadorSetorial[]
  clienteNome?: string
  clienteDoc?: string
  atualizadoEm?: string
}

const SetaVariacao: React.FC<{ variacao: number | null }> = ({ variacao }) => {
  const st = obterStatusSemaforoSetorial(variacao)
  const Icone = st.tipo === 'alta' ? TrendingUp : st.tipo === 'baixa' ? TrendingDown : Minus
  const cor =
    st.tipo === 'alta'
      ? 'text-emerald-600'
      : st.tipo === 'baixa'
        ? 'text-rose-600'
        : 'text-slate-400'
  return (
    <span className={`inline-flex items-center justify-center ${cor}`}>
      <Icone className="w-3.5 h-3.5 inline" />
    </span>
  )
}

export const RelatorioIndicadoresSetoriaisA4: React.FC<RelatorioIndicadoresSetoriaisA4Props> = ({
  open,
  onClose,
  indicadores,
  clienteNome,
  clienteDoc,
  atualizadoEm,
}) => {
  if (!open) return null

  const ordenados = [...indicadores].sort((a, b) => {
    const oa = ORDEM_SETOR.indexOf(a.setor)
    const ob = ORDEM_SETOR.indexOf(b.setor)
    if (oa !== ob) return oa - ob
    return a.nome.localeCompare(b.nome, 'pt-BR')
  })

  const dataEmissao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const totalComDado = indicadores.filter(
    (i) => i.valorAtual !== null && i.valorAtual !== undefined,
  ).length
  const totalContingencia = indicadores.filter((i) => i.baseInterna).length

  // Agrupa por setor para imprimir subtítulos
  const gruposAgrupados: { setor: string; itens: typeof ordenados }[] = []
  for (const ind of ordenados) {
    const rotulo = ROTULO_SETOR[ind.setor]
    const ultimo = gruposAgrupados[gruposAgrupados.length - 1]
    if (ultimo && ultimo.setor === rotulo) {
      ultimo.itens.push(ind)
    } else {
      gruposAgrupados.push({ setor: rotulo, itens: [ind] })
    }
  }

  const handleImprimir = () => window.print()

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4 print:p-0 print:static print:bg-white print:block">
      <div
        className="bg-white w-full max-w-[820px] my-8 shadow-2xl rounded-lg print:rounded-none print:shadow-none print:my-0"
        id="relatorio-indicadores-setoriais-a4"
      >
        {/* Barra de ações (não imprime) */}
        <div className="flex items-center justify-between gap-2 px-5 py-3 bg-slate-900 rounded-t-lg print:hidden sticky top-0 z-10">
          <span className="text-[11px] font-bold text-white uppercase tracking-wider">
            Pré-visualização A4 — Indicadores Setoriais
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleImprimir}
              className="text-xs font-semibold px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
            >
              Imprimir / Salvar PDF
            </button>
            <button
              onClick={onClose}
              className="text-xs font-semibold px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-white cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>

        {/* Folha A4 */}
        <div className="p-8 print:p-0 space-y-5 text-slate-900">
          {/* Cabeçalho institucional */}
          <div className="flex items-start justify-between gap-4 border-b-2 border-slate-900 pb-4">
            <div className="flex items-center gap-3">
              <AdecontLogo className="h-11 w-auto" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
                  Assessoria Contábil e Administrativa
                </p>
                <p className="text-[9px] text-slate-500">Portal Panorama — Análises Empresariais</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase font-bold text-slate-500">Data de Emissão</p>
              <p className="text-xs font-bold text-slate-900">{dataEmissao}</p>
              {atualizadoEm && (
                <p className="text-[9px] text-slate-500 mt-0.5">Sincronização: {atualizadoEm}</p>
              )}
            </div>
          </div>

          {/* Título + cliente */}
          <div className="space-y-1">
            <h1 className="text-lg font-black text-slate-900">
              Relatório de Indicadores Econômicos Setoriais
            </h1>
            <p className="text-[11px] text-slate-600">
              Painel macrosetorial: agronegócio, construção civil, comércio e serviços, crédito e
              finanças — fontes oficiais com contingência na base interna ADECONT.
            </p>
            {(clienteNome || clienteDoc) && (
              <div className="mt-2 text-[11px] bg-slate-100 rounded-md px-3 py-2 inline-block">
                <span className="font-bold text-slate-700">Cliente: </span>
                <span className="text-slate-800">{clienteNome || '—'}</span>
                {clienteDoc && (
                  <>
                    <span className="font-bold text-slate-700"> · CNPJ/CPF: </span>
                    <span className="text-slate-800 font-mono">{clienteDoc}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="border border-slate-200 rounded-md py-2">
              <p className="text-lg font-black text-slate-900">{indicadores.length}</p>
              <p className="text-[9px] uppercase font-bold text-slate-500">Indicadores</p>
            </div>
            <div className="border border-slate-200 rounded-md py-2">
              <p className="text-lg font-black text-emerald-700">{totalComDado}</p>
              <p className="text-[9px] uppercase font-bold text-slate-500">Com dado atual</p>
            </div>
            <div className="border border-slate-200 rounded-md py-2">
              <p className="text-lg font-black text-amber-700">{totalContingencia}</p>
              <p className="text-[9px] uppercase font-bold text-slate-500">
                Base interna (contingência)
              </p>
            </div>
          </div>

          {/* Tabela por setor */}
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="text-left px-2 py-1.5 font-bold">Índice</th>
                <th className="text-right px-2 py-1.5 font-bold">Valor</th>
                <th className="text-left px-2 py-1.5 font-bold">Unid.</th>
                <th className="text-left px-2 py-1.5 font-bold">Data do Dado</th>
                <th className="text-left px-2 py-1.5 font-bold">Fonte</th>
                <th className="text-center px-2 py-1.5 font-bold">Var.</th>
                <th className="text-left px-2 py-1.5 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {gruposAgrupados.map((grupo) => (
                <React.Fragment key={grupo.setor}>
                  <tr>
                    <td
                      colSpan={7}
                      className="px-2 py-1 bg-slate-100 font-black text-[9px] uppercase tracking-wider text-slate-700 border-b border-slate-300"
                    >
                      {grupo.setor}
                    </td>
                  </tr>
                  {grupo.itens.map((ind) => {
                    const st = obterStatusSemaforoSetorial(ind.variacao)
                    const valorFmt = formatarValorSetorial(
                      ind.valorAtual,
                      ind.formato,
                      ind.casasDecimais,
                    )
                    const fonteReal = ind.baseInterna
                      ? `Base Interna ADECONT${ind.fonte ? ` (origem: ${ind.fonte})` : ''}`
                      : ind.fonteRota || ind.fonte || '—'
                    return (
                      <tr key={ind.chave} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="px-2 py-1.5 font-semibold text-slate-800">{ind.nome}</td>
                        <td className="px-2 py-1.5 text-right font-mono font-bold tabular-nums text-slate-900">
                          {valorFmt}
                        </td>
                        <td className="px-2 py-1.5 text-slate-600">{ind.unidade || '—'}</td>
                        <td className="px-2 py-1.5 text-slate-600">
                          {ind.periodoFormatado || ind.dataReferencia || '—'}
                        </td>
                        <td
                          className="px-2 py-1.5 text-slate-600 max-w-[180px] truncate"
                          title={fonteReal}
                        >
                          {ind.baseInterna && (
                            <Database className="w-3 h-3 inline mr-0.5 text-amber-600 -mt-0.5" />
                          )}
                          {fonteReal}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <SetaVariacao variacao={ind.variacao} />
                        </td>
                        <td
                          className={`px-2 py-1.5 font-semibold ${
                            st.tipo === 'alta'
                              ? 'text-emerald-600'
                              : st.tipo === 'baixa'
                                ? 'text-rose-600'
                                : 'text-slate-500'
                          }`}
                        >
                          {st.statusTexto}
                        </td>
                      </tr>
                    )
                  })}
                </React.Fragment>
              ))}
              {indicadores.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-slate-500">
                    Nenhum indicador carregado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Aviso de contingência */}
          {totalContingencia > 0 && (
            <p className="text-[9px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
              <strong>Nota de transparência:</strong> {totalContingencia} indicador(es) exibem dado
              proveniente da base interna de contingência ADECONT, pois a fonte oficial remota está
              temporariamente indisponível. Os valores serão substituídos automaticamente pelo dado
              vivo quando a fonte responder.
            </p>
          )}

          {/* Rodapé oficial */}
          <div className="border-t border-slate-300 pt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AdecontLogo className="h-6 w-auto" />
              <span className="text-[9px] font-semibold text-slate-600">
                ADECONT — Assessoria Contábil e Administrativa
              </span>
            </div>
            <span className="text-[9px] text-slate-400">
              Documento gerado pelo Portal Panorama · Uso interno
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RelatorioIndicadoresSetoriaisA4
