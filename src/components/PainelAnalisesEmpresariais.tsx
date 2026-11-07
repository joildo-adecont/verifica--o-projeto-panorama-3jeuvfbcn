import React, { useState, useEffect } from 'react'
import {
  TrendingUp,
  BarChart3,
  FileText,
  ShieldCheck,
  Scale,
  Printer,
  ArrowUpRight,
  ArrowDownRight,
  Database,
  Building2,
  DollarSign,
  PieChart,
  CheckSquare,
  AlertTriangle,
  Award,
  Layers,
  Sparkles,
} from 'lucide-react'
import type { SinteseAnaliseEmpresarial } from '@/services/analisesEmpresariais'
import type { EmpresaRecord } from '@/types/cadastroEmpresas'
import { RelatorioAnaliseEmpresarialA4 } from './RelatorioAnaliseEmpresarialA4'
import { FerramentaBalancoDRE } from './FerramentaBalancoDRE'
import { FerramentaIndicadoresComparativos } from './FerramentaIndicadoresComparativos'
import { FerramentaRelatorioComparativo } from './FerramentaRelatorioComparativo'
import { FerramentaGraficosComparativos } from './FerramentaGraficosComparativos'
import { FerramentaScoreInovacao } from './FerramentaScoreInovacao'
import { FerramentaChecklistDocumental } from './FerramentaChecklistDocumental'
import { FerramentaMatrizAchados } from './FerramentaMatrizAchados'
import { FerramentaParecerFinal } from './FerramentaParecerFinal'

import {
  carregarBalancoEmpresarial,
  carregarChecklistDocumental,
  carregarAchadosDueDiligence,
  carregarParecerFinal,
} from '@/services/analisesEmpresariaisPersistencia'
import {
  calcularTodosIndicadores,
  calcularScorePonderado,
  gerarParecerAutomatico,
} from '@/services/motorAnaliseEmpresarial'
import type {
  ExercicioFinanceiro,
  ItemIndicador,
  ScorePonderadoResultado,
  ItemChecklistDoc,
  AchadoDueDiligence,
  ParecerFinalAnalise,
  AnaliseBalanco3Exercicios,
  BlocoScorePonderado,
} from '@/types/analisesEmpresariaisModel'
import {
  salvarBalancoCliente,
  atualizarStatusItemChecklist,
  salvarAchadoCliente,
  excluirAchadoCliente,
  salvarParecerENotasCliente,
  carregarBalancoCliente,
} from '@/services/analisesEmpresariaisPersistencia'
import { criarExercicioVazio } from '@/services/motorAnaliseEmpresarial'

interface PainelAnalisesEmpresariaisProps {
  dossie: SinteseAnaliseEmpresarial
  todasEmpresas?: EmpresaRecord[]
}

type AbaFerramenta =
  | 'balanco'
  | 'indicadores'
  | 'relatorio'
  | 'graficos'
  | 'score'
  | 'checklist'
  | 'achados'
  | 'parecer'
  | 'visao_geral'

export const PainelAnalisesEmpresariais: React.FC<PainelAnalisesEmpresariaisProps> = ({
  dossie,
  todasEmpresas = [],
}) => {
  const [abaAtiva, setAbaAtiva] = useState<AbaFerramenta>('balanco')
  const [modalRelatorioA4, setModalRelatorioA4] = useState(false)

  const { cliente, indicadores, normasRelevantes, indicesMacro, parecerEspecialistas } = dossie

  // Estados completos das 3 abas de exercícios e ferramentas nativas
  const [balanco3Anos, setBalanco3Anos] = useState<AnaliseBalanco3Exercicios>({
    anoMenos2: criarExercicioVazio('ano_menos_2'),
    anoMenos1: criarExercicioVazio('ano_menos_1'),
    anoAtual: criarExercicioVazio('ano_atual'),
  })
  const [salvandoBalanco, setSalvandoBalanco] = useState(false)
  const [salvandoChecklist, setSalvandoChecklist] = useState(false)
  const [notasCustomScore, setNotasCustomScore] = useState<
    Partial<Record<BlocoScorePonderado['bloco'], number>>
  >({})

  const [indicadoresApurados, setIndicadoresApurados] = useState<ItemIndicador[]>([])
  const [scoreResultado, setScoreResultado] = useState<ScorePonderadoResultado | null>(null)
  const [checklistItens, setChecklistItens] = useState<ItemChecklistDoc[]>([])
  const [achados, setAchados] = useState<AchadoDueDiligence[]>([])
  const [parecerFinal, setParecerFinal] = useState<ParecerFinalAnalise | null>(null)

  // Carrega dados persistidos ao trocar de cliente
  useEffect(() => {
    let ativo = true
    const carregarTudo = async () => {
      try {
        const docLimpo = cliente.documento_limpo || cliente.numero_documento || ''
        const balancoCarregado = await carregarBalancoEmpresarial(docLimpo)

        const exAtual = balancoCarregado?.anoAtual || criarExercicioVazio('ano_atual')
        const exMenos1 = balancoCarregado?.anoMenos1 || criarExercicioVazio('ano_menos_1')
        const exMenos2 = balancoCarregado?.anoMenos2 || criarExercicioVazio('ano_menos_2')

        if (!ativo) return
        setBalanco3Anos({
          anoMenos2: exMenos2,
          anoMenos1: exMenos1,
          anoAtual: exAtual,
        })

        const inds = calcularTodosIndicadores(exAtual)
        const score = calcularScorePonderado(notasCustomScore, inds)
        setIndicadoresApurados(inds)
        setScoreResultado(score)

        const [checkDocs, achadosList, parecerSalvo] = await Promise.all([
          carregarChecklistDocumental(docLimpo),
          carregarAchadosDueDiligence(docLimpo),
          carregarParecerFinal(docLimpo),
        ])

        if (!ativo) return
        setChecklistItens(checkDocs)
        setAchados(achadosList)

        if (parecerSalvo) {
          setParecerFinal(parecerSalvo as ParecerFinalAnalise)
        } else {
          const auto = gerarParecerAutomatico(
            cliente.razao_social || cliente.nome,
            inds,
            score.notaFinal,
          )
          setParecerFinal(auto as ParecerFinalAnalise)
        }
      } catch (err) {
        console.error('[PainelAnalisesEmpresariais] Erro ao carregar dados complementares:', err)
      }
    }
    carregarTudo()
    return () => {
      ativo = false
    }
  }, [cliente.id])

  const brl = (v?: number | null) =>
    Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const temBalancetes = indicadores.mesesDisponiveis > 0

  const abasNavegacao: {
    id: AbaFerramenta
    label: string
    icon: React.ReactNode
    badge?: string
  }[] = [
    {
      id: 'balanco',
      label: '1. Balanço & DRE (3 Exercícios)',
      icon: <Layers className="w-4 h-4" />,
    },
    {
      id: 'indicadores',
      label: '2. 25 Indicadores & Semáforo',
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      id: 'relatorio',
      label: '3. Relatório Comparativo',
      icon: <Scale className="w-4 h-4" />,
    },
    {
      id: 'graficos',
      label: '4. Gráficos Comparativos',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'score',
      label: '5. Score & Projeções',
      icon: <Award className="w-4 h-4" />,
    },
    {
      id: 'checklist',
      label: '6. Checklist Documental',
      icon: <CheckSquare className="w-4 h-4" />,
    },
    {
      id: 'achados',
      label: '7. Matriz de Achados',
      icon: <AlertTriangle className="w-4 h-4" />,
    },
    {
      id: 'parecer',
      label: '8. Parecer Final',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      id: 'visao_geral',
      label: '9. Visão Geral & Agentes',
      icon: <Sparkles className="w-4 h-4" />,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Barra de Ações e Resumo do Cliente */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
              {cliente.regime_tributario || cliente.enquadramento_tributario || 'Regime a Definir'}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              CNPJ: {cliente.documento_limpo || cliente.numero_documento}
            </span>
          </div>
          <h2 className="text-lg font-black text-slate-900 mt-1">
            {cliente.razao_social || cliente.nome}
          </h2>
          <p className="text-xs text-slate-500">
            {cliente.municipio
              ? `${cliente.municipio} - ${cliente.uf}`
              : 'Localidade não informada'}{' '}
            · CNAE: {cliente.cnae || 'N/D'} ({cliente.ramo_atividade || 'Ramo Geral'})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalRelatorioA4(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-lg shadow-sm text-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Emitir Relatório Técnico A4 Completo
          </button>
        </div>
      </div>

      {/* Barra de Navegação das Ferramentas Nativas (Baseadas no Modelo) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1.5 flex flex-wrap gap-1">
        {abasNavegacao.map((aba) => {
          const ativa = abaAtiva === aba.id
          return (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                ativa
                  ? 'bg-slate-900 text-amber-400 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {aba.icon}
              <span>{aba.label}</span>
            </button>
          )
        })}
      </div>

      {/* Conteúdo Dinâmico por Ferramenta */}
      {abaAtiva === 'balanco' && (
        <FerramentaBalancoDRE
          anoMenos2={balanco3Anos.anoMenos2}
          anoMenos1={balanco3Anos.anoMenos1}
          anoAtual={balanco3Anos.anoAtual}
          onChangeAno={(ex, novosDados) => {
            const novo = {
              ...balanco3Anos,
              [ex === 'ano_menos_2'
                ? 'anoMenos2'
                : ex === 'ano_menos_1'
                  ? 'anoMenos1'
                  : 'anoAtual']: novosDados,
            }
            setBalanco3Anos(novo)
            if (ex === 'ano_atual') {
              const inds = calcularTodosIndicadores(novosDados)
              const score = calcularScorePonderado(notasCustomScore, inds)
              setIndicadoresApurados(inds)
              setScoreResultado(score)
            }
          }}
          onSalvar={async (ex) => {
            setSalvandoBalanco(true)
            try {
              const docLimpo = cliente.documento_limpo || cliente.numero_documento || ''
              const dados =
                ex === 'ano_menos_2'
                  ? balanco3Anos.anoMenos2
                  : ex === 'ano_menos_1'
                    ? balanco3Anos.anoMenos1
                    : balanco3Anos.anoAtual
              await salvarBalancoCliente(docLimpo, ex, dados)
            } finally {
              setSalvandoBalanco(false)
            }
          }}
          salvando={salvandoBalanco}
          clienteNome={cliente.razao_social || cliente.nome}
          clienteCnpj={cliente.documento_limpo || cliente.numero_documento || ''}
        />
      )}

      {abaAtiva === 'indicadores' && (
        <FerramentaIndicadoresComparativos
          indicadores={indicadoresApurados}
          clienteNome={cliente.razao_social || cliente.nome}
        />
      )}

      {abaAtiva === 'relatorio' && (
        <FerramentaRelatorioComparativo
          clienteAtual={cliente}
          listaClientes={todasEmpresas}
          balancoAtual={balanco3Anos}
          carregarBalancoOutroCliente={async (cnpj) => {
            return carregarBalancoCliente(cnpj)
          }}
        />
      )}

      {abaAtiva === 'graficos' && (
        <FerramentaGraficosComparativos
          clienteAtual={cliente}
          listaClientes={todasEmpresas}
          balancoAtual={balanco3Anos}
          carregarBalancoOutroCliente={async (cnpj) => {
            return carregarBalancoCliente(cnpj)
          }}
        />
      )}

      {abaAtiva === 'score' && (
        <FerramentaScoreInovacao
          scoreResultado={
            scoreResultado || calcularScorePonderado(notasCustomScore, indicadoresApurados)
          }
          notasCustom={notasCustomScore}
          onChangeNota={(bloco, novaNota) => {
            const novas = { ...notasCustomScore, [bloco]: novaNota }
            setNotasCustomScore(novas)
            const novoScore = calcularScorePonderado(novas, indicadoresApurados)
            setScoreResultado(novoScore)
            const docLimpo = cliente.documento_limpo || cliente.numero_documento || ''
            if (parecerFinal) {
              salvarParecerENotasCliente(docLimpo, parecerFinal, novas)
            }
          }}
          anoMenos2={balanco3Anos.anoMenos2}
          anoMenos1={balanco3Anos.anoMenos1}
          anoAtual={balanco3Anos.anoAtual}
          clienteNome={cliente.razao_social || cliente.nome}
        />
      )}

      {abaAtiva === 'checklist' && (
        <FerramentaChecklistDocumental
          itens={checklistItens}
          clienteNome={cliente.razao_social || cliente.nome}
          salvando={salvandoChecklist}
          onToggleRecebido={async (docId, recebido) => {
            const novos = checklistItens.map((i) => (i.id === docId ? { ...i, recebido } : i))
            setChecklistItens(novos)
            const docLimpo = cliente.documento_limpo || cliente.numero_documento || ''
            await atualizarStatusItemChecklist(docLimpo, docId, recebido)
          }}
          onUpdateObs={async (docId, observacao) => {
            const novos = checklistItens.map((i) => (i.id === docId ? { ...i, observacao } : i))
            setChecklistItens(novos)
            const item = novos.find((i) => i.id === docId)
            if (item) {
              const docLimpo = cliente.documento_limpo || cliente.numero_documento || ''
              await atualizarStatusItemChecklist(docLimpo, docId, item.recebido, observacao)
            }
          }}
          onSalvar={() => {}}
        />
      )}

      {abaAtiva === 'achados' && (
        <FerramentaMatrizAchados
          achados={achados}
          clienteNome={cliente.razao_social || cliente.nome}
          onSalvarAchado={async (achado) => {
            const docLimpo = cliente.documento_limpo || cliente.numero_documento || ''
            const salvo = await salvarAchadoCliente(docLimpo, achado)
            setAchados((prev) => {
              const idx = prev.findIndex((a) => a.id === salvo.id)
              if (idx >= 0) {
                const next = [...prev]
                next[idx] = salvo
                return next
              }
              return [salvo, ...prev]
            })
          }}
          onExcluirAchado={async (achadoId) => {
            await excluirAchadoCliente(achadoId)
            setAchados((prev) => prev.filter((a) => a.id !== achadoId))
          }}
        />
      )}

      {abaAtiva === 'parecer' && (
        <FerramentaParecerFinal
          parecer={
            parecerFinal ||
            (gerarParecerAutomatico(
              cliente.razao_social || cliente.nome,
              indicadoresApurados,
              scoreResultado?.notaFinal || 7.0,
            ) as ParecerFinalAnalise)
          }
          indicadores={indicadoresApurados}
          scoreFinal={scoreResultado?.notaFinal || 7.0}
          salvando={false}
          onUpdateCampo={(campo, valor) => {
            if (!parecerFinal) return
            const novo = { ...parecerFinal, [campo]: valor }
            setParecerFinal(novo)
          }}
          onSalvar={async () => {
            if (!parecerFinal) return
            const docLimpo = cliente.documento_limpo || cliente.numero_documento || ''
            await salvarParecerENotasCliente(docLimpo, parecerFinal, notasCustomScore)
          }}
          onImprimir={() => {
            window.print()
          }}
        />
      )}

      {abaAtiva === 'visao_geral' && (
        <div className="space-y-6">
          {/* Grid de Métricas Chave (Microeconômicas) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">
                  Receita Anualizada
                </span>
                <div className="p-2 bg-emerald-100/70 text-emerald-700 rounded-lg">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-xl font-black text-slate-900">
                  {brl(indicadores.receitaAnualizada)}
                </span>
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  Base: {indicadores.mesesDisponiveis} mês(es) escriturado(s)
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">
                  Último Mês Faturado
                </span>
                <div className="p-2 bg-blue-100/70 text-blue-700 rounded-lg">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-xl font-black text-blue-800">
                  {brl(indicadores.receitaUltimoMes)}
                </span>
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  Competência mais recente: {indicadores.mesMaisRecente || 'N/A'}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">
                  Crescimento Médio
                </span>
                <div
                  className={`p-2 rounded-lg ${
                    indicadores.crescimentoMedioReceitaPct >= 0
                      ? 'bg-emerald-100/70 text-emerald-700'
                      : 'bg-rose-100/70 text-rose-700'
                  }`}
                >
                  {indicadores.crescimentoMedioReceitaPct >= 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                </div>
              </div>
              <div className="mt-2">
                <span
                  className={`text-xl font-black ${
                    indicadores.crescimentoMedioReceitaPct >= 0
                      ? 'text-emerald-700'
                      : 'text-rose-700'
                  }`}
                >
                  {indicadores.crescimentoMedioReceitaPct >= 0 ? '+' : ''}
                  {indicadores.crescimentoMedioReceitaPct.toFixed(1)}%
                </span>
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  Variação média de faturamento a.m.
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">
                  Patrimônio Líquido
                </span>
                <div className="p-2 bg-purple-100/70 text-purple-700 rounded-lg">
                  <PieChart className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-xl font-black text-purple-900">
                  {brl(indicadores.patrimonioLiquidoAtual)}
                </span>
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  Ativo: {brl(indicadores.ativoTotalAtual)} · Passivo:{' '}
                  {brl(indicadores.passivoTotalAtual)}
                </span>
              </div>
            </div>
          </div>

          {/* Histórico e Tabela de Balancetes Decupados */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Escrituração Contábil Mensalizada (Correção de Balancetes Cumulativos)
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {indicadores.seriesMensalizadas.length} competência(s) encontrada(s)
              </span>
            </div>

            {temBalancetes ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Competência</th>
                      <th className="p-2.5">Arquivo Origem</th>
                      <th className="p-2.5 text-right">Rec. Cumulativa</th>
                      <th className="p-2.5 text-right font-black text-emerald-800">
                        Rec. Líquida Mensal
                      </th>
                      <th className="p-2.5 text-right">Ativo Total</th>
                      <th className="p-2.5 text-right">Passivo Total</th>
                      <th className="p-2.5 text-right">Patrimônio Líquido</th>
                      <th className="p-2.5 text-right">Margem Líquida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {indicadores.seriesMensalizadas.map((s) => (
                      <tr key={s.documentoId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-2.5 font-bold font-mono text-slate-900">
                          {s.competencia}
                        </td>
                        <td className="p-2.5 text-slate-500 truncate max-w-[160px]">
                          {s.arquivoNome}
                        </td>
                        <td className="p-2.5 text-right text-slate-500">
                          {brl(s.receitaCumulativa)}
                        </td>
                        <td className="p-2.5 text-right font-black text-emerald-800 bg-emerald-50/40">
                          {brl(s.receitaMensalLiquida)}
                        </td>
                        <td className="p-2.5 text-right text-slate-700">{brl(s.totalAtivo)}</td>
                        <td className="p-2.5 text-right text-slate-700">{brl(s.totalPassivo)}</td>
                        <td className="p-2.5 text-right text-slate-700">
                          {brl(s.patrimonioLiquido)}
                        </td>
                        <td className="p-2.5 text-right font-semibold text-slate-800">
                          {s.margemLucroLiquido.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">
                  Nenhum balancete ou DRE importado para este cliente
                </p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
                  Utilize o importador ou a aba Balanço & DRE para cadastrar os 3 exercícios (Ano
                  -2, Ano -1 e Ano Atual).
                </p>
              </div>
            )}
          </div>

          {/* Parecer dos 4 Agentes Especialistas */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Síntese Técnica dos Agentes Especialistas ADECONT
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/60">
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-emerald-600" />
                  Especialista Tributário (LC 214/2025 & CBS/IBS)
                </span>
                <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                  {parecerEspecialistas.tributario}
                </p>
              </div>

              <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/60">
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  Especialista Contábil & Demonstrações Financeiras
                </span>
                <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                  {parecerEspecialistas.contabil}
                </p>
              </div>

              <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/60">
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-purple-600" />
                  Especialista Administrativo, Fator R & Folha
                </span>
                <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                  {parecerEspecialistas.administrativo}
                </p>
              </div>

              <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/60">
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                  Especialista Macroeconômico & Mercado
                </span>
                <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                  {parecerEspecialistas.economico}
                </p>
              </div>
            </div>
          </div>

          {/* Fundamentação Legislativa & Índices Macroeconômicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2.5">
                <Scale className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Fundamentação Legislativa (norm_reviews_history)
                </h3>
              </div>

              {normasRelevantes.length > 0 ? (
                <div className="space-y-2.5">
                  {normasRelevantes.slice(0, 4).map((norma) => (
                    <div
                      key={norma.id}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800">
                          Revisão Semanal: {norma.review_date}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold px-2 py-0.5 rounded bg-emerald-100">
                          {norma.status || 'Concluída'}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-tight">
                        {norma.observations ||
                          norma.highlights ||
                          'Análise de conformidade e novas resoluções da Reforma Tributária.'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded">
                  Nenhuma revisão legislativa recente pendente. Repositório normativo atualizado.
                </p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Índices Econômicos Oficiais (Fontes Estatísticas)
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {indicesMacro.indicadores.slice(0, 6).map((ind) => (
                  <div
                    key={ind.chave}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block truncate">
                      {ind.nome}
                    </span>
                    <span className="text-sm font-black text-slate-900 mt-0.5 block">
                      {ind.valorAtual} {ind.unidade}
                    </span>
                    <span className="text-[9px] text-slate-400 block truncate">
                      Ref: {ind.dataReferencia || 'Atual'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Relatório Técnico A4 Completo */}
      {modalRelatorioA4 && (
        <RelatorioAnaliseEmpresarialA4
          dossie={dossie}
          indicadoresModelo={indicadoresApurados}
          scoreResultado={scoreResultado || undefined}
          checklistItens={checklistItens}
          achados={achados}
          parecerFinal={parecerFinal || undefined}
          balanco3Anos={balanco3Anos}
          onClose={() => setModalRelatorioA4(false)}
        />
      )}
    </div>
  )
}
export default PainelAnalisesEmpresariais
