/**
 * RELATÓRIO IMPRIMÍVEL A4 DE DADOS DE MERCADO (ADECONT)
 *
 * Exibe a pré-visualização A4 e controle de impressão nativo (window.print / @media print)
 * contendo:
 * - Marca oficial ADECONT (AdecontLogo) e tagline oficial ("Assessoria Contábil e Administrativa")
 * - Identificação do cliente selecionado (Razão Social, CNPJ/CPF, Regime Tributário) quando houver
 * - Data de emissão e horário de sincronização dos dados
 * - Tabela completa dos índices de mercado carregados com:
 *   - Índice (nome e código curto)
 *   - Valor atual formatado em pt-BR
 *   - Unidade
 *   - Data do Dado (período de referência)
 *   - Fonte real (selo oficial ou rota, nunca selo genérico)
 *   - Variação e Semáforo (Alta / Baixa / Estável / Indisponível) com indicador visual
 *   - Aviso de sincronização transparente para dados vindos da base interna
 * - Totalizadores e notas de rodapé de conformidade metodológica
 */

import React from 'react'
import { AdecontLogo } from './AdecontLogo'
import {
  Printer,
  X,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react'
import type { ItemIndiceMercado } from '@/services/dadosMercadoAnalises'
import {
  prepararLinhasExportacaoMercado,
  obterStatusSemaforoMercado,
  type ItemExportacaoMercado,
} from '@/services/exportarDadosMercado'

interface RelatorioDadosMercadoA4Props {
  indices: ItemIndiceMercado[]
  clienteNome?: string
  clienteDoc?: string
  regimeTributario?: string
  atualizadoEm?: string
  onClose: () => void
}

export const RelatorioDadosMercadoA4: React.FC<RelatorioDadosMercadoA4Props> = ({
  indices,
  clienteNome,
  clienteDoc,
  regimeTributario,
  atualizadoEm,
  onClose,
}) => {
  const linhas: ItemExportacaoMercado[] = prepararLinhasExportacaoMercado(indices)
  const dataEmissao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const handlePrint = () => {
    window.print()
  }

  // Estatísticas rápidas para o cabeçalho
  const totalIndices = linhas.length
  const qtdOficiais = indices.filter((i) => !i.baseInterna).length
  const qtdBaseInterna = indices.filter((i) => i.baseInterna).length

  return (
    <div className="fixed inset-0 z-50 bg-white text-slate-900 overflow-y-auto print:p-0 print:overflow-visible">
      {/* Barra superior de controle (oculta na impressão) */}
      <div className="sticky top-0 bg-slate-900 text-white p-3.5 flex justify-between items-center shadow-lg print:hidden z-10">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="font-semibold text-sm text-emerald-400 block">
              Relatório Oficial de Dados de Mercado & Índices Econômicos
            </span>
            <span className="text-[11px] text-slate-300">
              ADECONT · Padrão Executivo A4 para Dossiê Empresarial
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm transition-colors text-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Salvar PDF
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors text-xs cursor-pointer"
          >
            <X className="w-4 h-4" />
            Fechar Visualização
          </button>
        </div>
      </div>

      {/* Folha A4 formatada para tela e impressora */}
      <div className="max-w-[210mm] mx-auto p-8 print:p-0 text-xs font-sans space-y-4">
        {/* Cabeçalho Oficial ADECONT */}
        <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <AdecontLogo tamanho="medio" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold">
                Portal Panorama RT · Módulo de Análises Empresariais
              </p>
              <h1 className="text-base font-black text-slate-950 uppercase tracking-tight">
                Painel Oficial de Dados de Mercado & Indicadores Macro
              </h1>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-600 leading-tight">
            <p className="font-bold text-slate-900">Emissão: {dataEmissao}</p>
            <p>Assessoria Contábil e Administrativa</p>
            <p className="text-[10px] text-emerald-800 font-medium">Metodologia Oficial ADECONT</p>
          </div>
        </div>

        {/* Identificação do Cliente (quando houver) */}
        {clienteNome && (
          <div className="bg-slate-50 border border-slate-300 rounded-lg p-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Cliente Vinculado</p>
                <p className="text-xs font-black text-slate-900">{clienteNome}</p>
              </div>
              {clienteDoc && (
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">CNPJ / CPF</p>
                  <p className="text-xs font-mono font-bold text-slate-800">{clienteDoc}</p>
                </div>
              )}
              {regimeTributario && (
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">
                    Regime Tributário
                  </p>
                  <p className="text-xs font-semibold text-slate-800">{regimeTributario}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resumo de Cobertura e Sincronização */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Total de Índices
            </span>
            <span className="text-lg font-black text-slate-900 font-mono">{totalIndices}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Cotações e taxas ativas</span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">
              Fontes Vivas / Oficiais
            </span>
            <span className="text-lg font-black text-emerald-900 font-mono">{qtdOficiais}</span>
            <span className="text-[10px] text-emerald-700 block mt-0.5">
              BCB, B3, IBGE, IPEADATA
            </span>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
            <span className="text-[10px] uppercase font-bold text-amber-800 block">
              Base Interna ADECONT
            </span>
            <span className="text-lg font-black text-amber-900 font-mono">{qtdBaseInterna}</span>
            <span className="text-[10px] text-amber-700 block mt-0.5">
              Sincronização de contingência
            </span>
          </div>
        </div>

        {/* Tabela Principal de Índices de Mercado */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase text-slate-900 tracking-wide flex items-center gap-1.5">
              <span>Tabela Comparativa de Índices de Mercado</span>
            </h2>
            {atualizadoEm && (
              <span className="text-[10px] text-slate-500">
                Última sincronização do repositório: <strong>{atualizadoEm}</strong>
              </span>
            )}
          </div>

          <table className="w-full border-collapse border border-slate-300 text-[11px]">
            <thead>
              <tr className="bg-slate-900 text-white font-bold">
                <th className="border border-slate-700 p-2 text-left">Índice</th>
                <th className="border border-slate-700 p-2 text-right">Valor Atual</th>
                <th className="border border-slate-700 p-2 text-center">Unidade</th>
                <th className="border border-slate-700 p-2 text-center">Data do Dado</th>
                <th className="border border-slate-700 p-2 text-left">Fonte Oficial / Rota</th>
                <th className="border border-slate-700 p-2 text-right">Variação</th>
                <th className="border border-slate-700 p-2 text-center">Semáforo</th>
              </tr>
            </thead>
            <tbody>
              {indices.map((ind, idx) => {
                const { statusTexto, tipo } = obterStatusSemaforoMercado(ind)
                const linhaTab = linhas[idx]

                // Indicador visual do semáforo
                let badgeClass = 'bg-slate-100 text-slate-700 border-slate-300'
                let IconeSemaforo = Minus
                if (tipo === 'alta') {
                  // Respeita a semântica econômica
                  if (ind.interpretacao === 'baixa_boa') {
                    badgeClass = 'bg-rose-100 text-rose-800 border-rose-300 font-bold'
                  } else {
                    badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                  }
                  IconeSemaforo = ArrowUpRight
                } else if (tipo === 'baixa') {
                  if (ind.interpretacao === 'baixa_boa') {
                    badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                  } else {
                    badgeClass = 'bg-rose-100 text-rose-800 border-rose-300 font-bold'
                  }
                  IconeSemaforo = ArrowDownRight
                } else if (tipo === 'estavel') {
                  badgeClass = 'bg-slate-100 text-slate-700 border-slate-300'
                  IconeSemaforo = Minus
                } else {
                  badgeClass = 'bg-slate-100 text-slate-400 border-slate-200'
                  IconeSemaforo = HelpCircle
                }

                return (
                  <tr key={ind.chave} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="border border-slate-300 p-2 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black font-mono px-1 py-0.5 rounded bg-slate-200 text-slate-800">
                          {ind.codigoCurto}
                        </span>
                        <span className="font-bold text-slate-900">{ind.nome}</span>
                      </div>
                      <p className="text-[9.5px] text-slate-500 mt-0.5 leading-tight">
                        {ind.descricao}
                      </p>
                    </td>

                    <td className="border border-slate-300 p-2 text-right font-mono font-black text-slate-900 text-xs tabular-nums whitespace-nowrap">
                      {linhaTab?.valor || '—'}
                    </td>

                    <td className="border border-slate-300 p-2 text-center font-mono font-medium text-slate-600 whitespace-nowrap">
                      {ind.unidade || '—'}
                    </td>

                    <td className="border border-slate-300 p-2 text-center font-medium text-slate-700 whitespace-nowrap">
                      {ind.periodoFormatado || ind.dataReferencia || '—'}
                    </td>

                    <td className="border border-slate-300 p-2">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 text-[10.5px]">
                          {linhaTab?.fonte || 'Fonte Oficial'}
                        </span>
                        {ind.baseInterna && (
                          <span className="text-[9px] text-amber-800 flex items-center gap-1 font-medium mt-0.5">
                            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                            Base interna (contingência)
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="border border-slate-300 p-2 text-right font-mono font-bold text-slate-800 tabular-nums whitespace-nowrap">
                      {linhaTab?.variacao || '—'}
                    </td>

                    <td className="border border-slate-300 p-2 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] ${badgeClass}`}
                      >
                        <IconeSemaforo className="w-3 h-3" />
                        {statusTexto}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Quadro de Avisos e Transparência de Sincronização */}
        {qtdBaseInterna > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 space-y-1 text-[10.5px] text-amber-900">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Aviso de Sincronização — Dados da Base Interna ADECONT</span>
            </div>
            <p className="text-[10px] text-amber-800 leading-relaxed">
              Alguns índices foram consolidados a partir do repositório histórico interno devido à
              indisponibilidade momentânea ou latência dos servidores das fontes oficiais externas.
              As referências preservam os valores da última sincronização válida e não comprometem
              as análises de tendência.
            </p>
          </div>
        )}

        {/* Metodologia e Notas Explicativas */}
        <div className="border-t border-slate-200 pt-3 text-[10px] text-slate-500 space-y-1 leading-relaxed">
          <p className="font-semibold text-slate-700 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Notas Metodológicas ADECONT:
          </p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>
              <strong>Taxas e Inflação:</strong> Selic Meta (Banco Central - SGS 432); IPCA (IBGE -
              SGS 433); Juros Pessoal (BCB SGS 20746); Inadimplência total da carteira (BCB SGS
              21114).
            </li>
            <li>
              <strong>Mercado Acionário e Câmbio:</strong> Ibovespa (B3 / IPEADATA); IFIX (B3 /
              Fundos Imobiliários); Dólar Comercial PTAX (BCB SGS 10813).
            </li>
            <li>
              <strong>Semáforo Inteligente:</strong> respeita a semântica econômica — índices de
              mercado (Bolsa/FII) em alta indicam cenário favorável (verde), enquanto taxas de
              juros, inflação e inadimplência em alta sinalizam alerta ou pressão sobre o custo de
              capital (vermelho).
            </li>
          </ul>
        </div>

        {/* Assinatura e Carimbo Institucional ADECONT */}
        <div className="border-t-2 border-slate-900 pt-3 flex justify-between items-center text-[10px] text-slate-600">
          <div>
            <p className="font-bold text-slate-900">
              ADECONT — Assessoria Contábil e Administrativa
            </p>
            <p>Portal Panorama RT · Relatório de Inteligência de Mercado</p>
          </div>
          <div className="text-right">
            <p className="font-mono">Documento emitido eletronicamente</p>
            <p className="font-bold text-slate-900">Uso Interno e de Apoio à Tomada de Decisão</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RelatorioDadosMercadoA4
