import React from 'react'
import { AdecontLogo } from './AdecontLogo'
import type { SinteseAnaliseEmpresarial } from '@/services/analisesEmpresariais'
import type {
  ItemIndicador,
  ScorePonderadoResultado,
  ItemChecklistDoc,
  AchadoDueDiligence,
  ParecerFinalAnalise,
  AnaliseBalanco3Exercicios,
} from '@/types/analisesEmpresariaisModel'
import { calcular25Indicadores } from '@/services/motorAnaliseEmpresarial'
import {
  calcularTodosIndicesAvancados,
  type RelatorioIndicesAvancados,
} from '@/services/indicesAvancadosEmpresariais'
import {
  Printer,
  X,
  TrendingUp,
  ShieldCheck,
  Scale,
  FileText,
  AlertTriangle,
  Award,
  Activity,
  Layers,
} from 'lucide-react'

import type { ConfiguracaoRelatorioCustomizado } from '@/types/customizacaoRelatorio'
import { renderQrCodeSvg } from '@/lib/qrCode'
import { CheckCircle2 } from 'lucide-react'

interface RelatorioAnaliseEmpresarialA4Props {
  dossie: SinteseAnaliseEmpresarial
  indicadoresModelo?: ItemIndicador[]
  scoreResultado?: ScorePonderadoResultado | null
  checklistItens?: ItemChecklistDoc[]
  achados?: AchadoDueDiligence[]
  parecerFinal?: ParecerFinalAnalise | null
  balanco3Anos?: AnaliseBalanco3Exercicios
  regimeTributario?: string
  relatorioAvancado?: RelatorioIndicesAvancados | null
  customizacao?: ConfiguracaoRelatorioCustomizado | null
  onClose: () => void
}

export const RelatorioAnaliseEmpresarialA4: React.FC<RelatorioAnaliseEmpresarialA4Props> = ({
  dossie,
  indicadoresModelo,
  scoreResultado,
  checklistItens,
  achados,
  parecerFinal,
  balanco3Anos,
  regimeTributario,
  relatorioAvancado,
  customizacao,
  onClose,
}) => {
  const { cliente, indicadores, parecerEspecialistas, dataAnalise } = dossie

  // Flags de customização com fallbacks seguros (tudo ativo por padrão)
  const incluirSintese = customizacao?.secoes?.sinteseExecutiva ?? true
  const incluirBalanco3Anos = customizacao?.secoes?.balanco3Anos ?? true
  const incluirClassicos = customizacao?.secoes?.indicesClassicos ?? true
  const incluirAvancados = customizacao?.secoes?.modelosAvancados ?? true
  const incluirParecer = customizacao?.secoes?.parecerTecnico ?? true
  const incluirNotas = customizacao?.secoes?.achadosCriticos ?? true
  const incluirAgentes = customizacao?.secoes?.agentesEspecialistas ?? true
  const incluirChecklist = customizacao?.secoes?.checklistDocumental ?? true
  const incluirDadosEmpresa = customizacao?.incluirDadosEmpresa ?? true
  const incluirQrCode = customizacao?.incluirQrCode ?? true
  const tituloRelatorio =
    customizacao?.tituloPersonalizado?.trim() || 'Parecer Técnico & Dossiê Empresarial Integrado'
  const subtituloRelatorio = customizacao?.subtituloPersonalizado?.trim()
  const observacoesFinais = customizacao?.observacoesFinais?.trim()

  // Títulos personalizados das seções (com fallback para os títulos padrão numerados do relatório A4)
  const titulos = customizacao?.titulosSecoes
  const tituloSecaoParecer =
    titulos?.parecerTecnico?.trim() || '1. Parecer Técnico Oficial & Recomendação de Crédito'
  const tituloSecaoBalanco =
    titulos?.balanco3Anos?.trim() || '2. Balanço Patrimonial & DRE Comparativo (3 Exercícios)'
  const tituloSecaoClassicos =
    titulos?.indicesClassicos?.trim() ||
    '3. Matriz dos Indicadores Contábeis com Semáforo & Comparativo Trienal'
  const tituloSecaoAvancados =
    titulos?.modelosAvancados?.trim() ||
    '3.1 Modelos de Insolvência, Decomposição Du Pont & Dinâmica Financeira'
  const tituloSecaoScore = titulos?.sinteseExecutiva?.trim() || 'Score Ponderado (0 a 10)'
  const tituloSecaoChecklist =
    titulos?.checklistDocumental?.trim() || 'Checklist Documental & Due Diligence'
  const tituloSecaoAchados =
    titulos?.achadosCriticos?.trim() || '5. Matriz de Achados e Recomendações (Due Diligence)'
  const tituloSecaoAgentes =
    titulos?.agentesEspecialistas?.trim() || '6. Síntese Técnica dos Agentes Especialistas ADECONT'

  // Obter ou calcular relatório avançado a partir do balanço mais recente
  const avancadoCalculado: RelatorioIndicesAvancados | null = React.useMemo(() => {
    if (relatorioAvancado) return relatorioAvancado
    if (balanco3Anos?.anoAtual) {
      try {
        return calcularTodosIndicesAvancados(balanco3Anos.anoAtual)
      } catch {
        return null
      }
    }
    return null
  }, [relatorioAvancado, balanco3Anos?.anoAtual])

  const brl = (v?: number | null) =>
    Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const handlePrint = () => {
    window.print()
  }

  const checklistTotal = checklistItens?.length || 0
  const checklistRecebidos = checklistItens?.filter((i) => i.recebido).length || 0
  const checklistPct = checklistTotal > 0 ? (checklistRecebidos / checklistTotal) * 100 : 0

  return (
    <div className="fixed inset-0 z-50 bg-white text-slate-900 overflow-y-auto print:p-0 print:overflow-visible">
      {/* Barra superior de controle (oculta na impressão) */}
      <div className="sticky top-0 bg-slate-900 text-white p-3.5 flex justify-between items-center shadow-lg print:hidden z-10">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-base text-amber-400">
            Dossiê de Análise Empresarial Integrada — Relatório Técnico A4 Completo
          </span>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
            ADECONT · Confidencial
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded shadow transition-colors text-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Salvar PDF
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors text-xs cursor-pointer"
          >
            <X className="w-4 h-4" />
            Fechar Visualização
          </button>
        </div>
      </div>

      {/* Folha A4 formatada */}
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
                {tituloRelatorio}
              </h1>
              {subtituloRelatorio ? (
                <p className="text-[11px] text-amber-900 font-bold tracking-tight">
                  {subtituloRelatorio}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {incluirQrCode ? (
              <div
                className="w-14 h-14 bg-white p-1 rounded border border-slate-300 shrink-0 flex items-center justify-center"
                title="QRCode de Autenticidade e Rastreabilidade ADECONT"
                dangerouslySetInnerHTML={{
                  __html: renderQrCodeSvg(
                    `ADECONT|DOSSIE|${cliente.documento_limpo || cliente.numero_documento || 'DOC'}|${dataAnalise}`,
                    52,
                  ),
                }}
              />
            ) : null}
            <div className="text-right text-[11px] text-slate-600 leading-tight">
              <p className="font-bold text-slate-900">Emissão: {dataAnalise}</p>
              <p>Assessoria Contábil e Administrativa</p>
              <p className="text-[10px] text-amber-800 font-medium">Metodologia Oficial ADECONT</p>
            </div>
          </div>
        </div>

        {/* Identificação do Cliente (condicionado a incluirDadosEmpresa) */}
        {incluirDadosEmpresa && (
          <div className="bg-slate-50 border border-slate-300 rounded p-3">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Razão Social</p>
                <p className="text-xs font-black text-slate-900">
                  {cliente.razao_social || cliente.nome}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">CNPJ / CPF</p>
                <p className="text-xs font-mono font-bold text-slate-800">
                  {cliente.documento_limpo || cliente.numero_documento}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Regime Tributário</p>
                <p className="text-xs font-semibold text-slate-800">
                  {regimeTributario ||
                    cliente.enquadramento_tributario ||
                    cliente.regime_tributario ||
                    'Não Definido'}
                </p>{' '}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">CNAE Principal</p>
                <p className="text-xs text-slate-800">
                  {cliente.cnae || 'N/D'} - {cliente.ramo_atividade || 'Ramo não especificado'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Localização</p>
                <p className="text-xs text-slate-800">
                  {cliente.municipio || 'N/D'} - {cliente.uf || 'N/D'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Quadro Funcional</p>
                <p className="text-xs text-slate-800">
                  {cliente.num_funcionarios || 0} colaborador(es) · Folha:{' '}
                  {brl(cliente.folha_salarial_mensal)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quadro de Síntese Financeira Executiva */}
        {incluirSintese && (
          <div className="border border-slate-300 rounded p-2.5 bg-white">
            <p className="text-[10px] font-black uppercase text-slate-600 tracking-wider mb-1.5">
              Síntese Financeira & Patrimonial Consolidada
            </p>
            <div className="grid grid-cols-4 gap-2 text-center divide-x divide-slate-200">
              <div className="p-1">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">
                  Receita Anualizada
                </span>
                <span className="text-xs font-mono font-black text-slate-900 block mt-0.5">
                  {brl(indicadores.receitaAnualizada)}
                </span>
                <span className="text-[8px] text-slate-400">Projeção anual de faturamento</span>
              </div>
              <div className="p-1">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">
                  Último Mês Faturado
                </span>
                <span className="text-xs font-mono font-black text-emerald-800 block mt-0.5">
                  {brl(indicadores.receitaUltimoMes)}
                </span>
                <span className="text-[8px] text-slate-400">Ref. contábil mais recente</span>
              </div>
              <div className="p-1">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">
                  Crescimento Médio
                </span>
                <span
                  className={`text-xs font-mono font-black block mt-0.5 ${indicadores.crescimentoMedioReceitaPct >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}
                >
                  {indicadores.crescimentoMedioReceitaPct >= 0 ? '+' : ''}
                  {indicadores.crescimentoMedioReceitaPct.toFixed(1)}%
                </span>
                <span className="text-[8px] text-slate-400">Tendência de faturamento</span>
              </div>
              <div className="p-1">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">
                  Patrimônio Líquido
                </span>
                <span className="text-xs font-mono font-black text-blue-900 block mt-0.5">
                  {brl(indicadores.patrimonioLiquidoAtual)}
                </span>
                <span className="text-[8px] text-slate-400">Base patrimonial</span>
              </div>
            </div>
          </div>
        )}

        {/* SEÇÃO 1: PARECER TÉCNICO OFICIAL & RECOMENDAÇÃO DE CRÉDITO */}
        {parecerFinal &&
          (incluirParecer || (incluirNotas && Boolean(parecerFinal.achadosCriticos))) && (
            <div className="border border-slate-300 rounded p-3 bg-slate-50/50">
              <div className="flex justify-between items-center mb-2 border-b border-slate-200 pb-1.5">
                <h2 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  {tituloSecaoParecer}
                </h2>
                {incluirParecer && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                    Opinião: {parecerFinal.nivelOpiniao}
                  </span>
                )}
              </div>
              <div className="space-y-2 text-[11px]">
                {incluirParecer && (
                  <>
                    <div>
                      <strong className="text-slate-900">Conclusão Técnica: </strong>
                      <span className="text-slate-700 leading-relaxed">
                        {parecerFinal.conclusao}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                      <div>
                        <strong className="text-emerald-800">Pontos Fortes: </strong>
                        <span className="text-slate-700">{parecerFinal.pontosFortes}</span>
                      </div>
                      <div>
                        <strong className="text-amber-800">Pontos de Atenção: </strong>
                        <span className="text-slate-700">{parecerFinal.pontosAtencao}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-[10px] text-slate-600">
                      <span>
                        Recomendação de Crédito:{' '}
                        <strong className="text-slate-900">
                          {parecerFinal.recomendacaoCredito}
                        </strong>
                      </span>
                      <span>
                        Responsável:{' '}
                        <strong className="text-slate-900">
                          {parecerFinal.responsavelTecnico}
                        </strong>
                      </span>
                    </div>
                  </>
                )}
                {incluirNotas && parecerFinal.achadosCriticos && (
                  <div
                    className={`text-[10px] ${incluirParecer ? 'pt-1.5 border-t border-slate-200' : ''}`}
                  >
                    <strong className="text-slate-900">
                      Achados Críticos e Notas do Cliente:{' '}
                    </strong>
                    <span className="text-slate-700 italic">{parecerFinal.achadosCriticos}</span>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* SEÇÃO 2: SÍNTESE PATRIMONIAL & DRE (3 EXERCÍCIOS) */}
        {balanco3Anos && incluirBalanco3Anos && (
          <div>
            <h2 className="text-xs font-black uppercase text-slate-800 border-b border-slate-300 pb-1 mb-2 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-primary" />
              {tituloSecaoBalanco}
            </h2>
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-[9px] text-left">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase">
                  <tr>
                    <th className="p-1">Grande Conta Contábil</th>
                    <th className="p-1 text-right">Ano -2</th>
                    <th className="p-1 text-right">Ano -1</th>
                    <th className="p-1 text-right">Ano Atual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-1 font-bold text-slate-900">Receita Bruta</td>
                    <td className="p-1 text-right font-mono text-slate-700">
                      {brl(balanco3Anos.anoMenos2.dre.receitaBruta)}
                    </td>
                    <td className="p-1 text-right font-mono text-slate-700">
                      {brl(balanco3Anos.anoMenos1.dre.receitaBruta)}
                    </td>
                    <td className="p-1 text-right font-mono font-bold text-slate-900">
                      {brl(balanco3Anos.anoAtual.dre.receitaBruta)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-1 font-semibold text-slate-800">
                      (-) Deduções e Impostos S/ Vendas
                    </td>
                    <td className="p-1 text-right font-mono text-slate-600">
                      {brl(balanco3Anos.anoMenos2.dre.deducoesImpostos)}
                    </td>
                    <td className="p-1 text-right font-mono text-slate-600">
                      {brl(balanco3Anos.anoMenos1.dre.deducoesImpostos)}
                    </td>
                    <td className="p-1 text-right font-mono text-slate-800">
                      {brl(balanco3Anos.anoAtual.dre.deducoesImpostos)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td className="p-1 text-slate-900">Receita Operacional Líquida</td>
                    <td className="p-1 text-right font-mono text-emerald-800">
                      {brl(
                        (balanco3Anos.anoMenos2.dre.receitaBruta || 0) -
                          (balanco3Anos.anoMenos2.dre.deducoesImpostos || 0),
                      )}
                    </td>
                    <td className="p-1 text-right font-mono text-emerald-800">
                      {brl(
                        (balanco3Anos.anoMenos1.dre.receitaBruta || 0) -
                          (balanco3Anos.anoMenos1.dre.deducoesImpostos || 0),
                      )}
                    </td>
                    <td className="p-1 text-right font-mono text-emerald-900">
                      {brl(
                        (balanco3Anos.anoAtual.dre.receitaBruta || 0) -
                          (balanco3Anos.anoAtual.dre.deducoesImpostos || 0),
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-1 font-semibold text-slate-800">Ativo Circulante (AC)</td>
                    <td className="p-1 text-right font-mono text-slate-600">
                      {brl(
                        (balanco3Anos.anoMenos2.ativoCirculante.caixaEquivalentes || 0) +
                          (balanco3Anos.anoMenos2.ativoCirculante.aplicacoesFinanceiras || 0) +
                          (balanco3Anos.anoMenos2.ativoCirculante.contasReceber || 0) +
                          (balanco3Anos.anoMenos2.ativoCirculante.estoques || 0) +
                          (balanco3Anos.anoMenos2.ativoCirculante.tributosRecuperar || 0) +
                          (balanco3Anos.anoMenos2.ativoCirculante.outrosAtivosCirculantes || 0),
                      )}
                    </td>
                    <td className="p-1 text-right font-mono text-slate-600">
                      {brl(
                        (balanco3Anos.anoMenos1.ativoCirculante.caixaEquivalentes || 0) +
                          (balanco3Anos.anoMenos1.ativoCirculante.aplicacoesFinanceiras || 0) +
                          (balanco3Anos.anoMenos1.ativoCirculante.contasReceber || 0) +
                          (balanco3Anos.anoMenos1.ativoCirculante.estoques || 0) +
                          (balanco3Anos.anoMenos1.ativoCirculante.tributosRecuperar || 0) +
                          (balanco3Anos.anoMenos1.ativoCirculante.outrosAtivosCirculantes || 0),
                      )}
                    </td>
                    <td className="p-1 text-right font-mono font-bold text-slate-900">
                      {brl(
                        (balanco3Anos.anoAtual.ativoCirculante.caixaEquivalentes || 0) +
                          (balanco3Anos.anoAtual.ativoCirculante.aplicacoesFinanceiras || 0) +
                          (balanco3Anos.anoAtual.ativoCirculante.contasReceber || 0) +
                          (balanco3Anos.anoAtual.ativoCirculante.estoques || 0) +
                          (balanco3Anos.anoAtual.ativoCirculante.tributosRecuperar || 0) +
                          (balanco3Anos.anoAtual.ativoCirculante.outrosAtivosCirculantes || 0),
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-1 font-semibold text-slate-800">Passivo Circulante (PC)</td>
                    <td className="p-1 text-right font-mono text-slate-600">
                      {brl(
                        (balanco3Anos.anoMenos2.passivoCirculante.fornecedores || 0) +
                          (balanco3Anos.anoMenos2.passivoCirculante.emprestimosCP || 0) +
                          (balanco3Anos.anoMenos2.passivoCirculante.obrigacoesTrabalhistas || 0) +
                          (balanco3Anos.anoMenos2.passivoCirculante.obrigacoesTributarias || 0) +
                          (balanco3Anos.anoMenos2.passivoCirculante.adiantamentosClientes || 0) +
                          (balanco3Anos.anoMenos2.passivoCirculante.outrasObrigacoesCP || 0),
                      )}
                    </td>
                    <td className="p-1 text-right font-mono text-slate-600">
                      {brl(
                        (balanco3Anos.anoMenos1.passivoCirculante.fornecedores || 0) +
                          (balanco3Anos.anoMenos1.passivoCirculante.emprestimosCP || 0) +
                          (balanco3Anos.anoMenos1.passivoCirculante.obrigacoesTrabalhistas || 0) +
                          (balanco3Anos.anoMenos1.passivoCirculante.obrigacoesTributarias || 0) +
                          (balanco3Anos.anoMenos1.passivoCirculante.adiantamentosClientes || 0) +
                          (balanco3Anos.anoMenos1.passivoCirculante.outrasObrigacoesCP || 0),
                      )}
                    </td>
                    <td className="p-1 text-right font-mono font-bold text-slate-900">
                      {brl(
                        (balanco3Anos.anoAtual.passivoCirculante.fornecedores || 0) +
                          (balanco3Anos.anoAtual.passivoCirculante.emprestimosCP || 0) +
                          (balanco3Anos.anoAtual.passivoCirculante.obrigacoesTrabalhistas || 0) +
                          (balanco3Anos.anoAtual.passivoCirculante.obrigacoesTributarias || 0) +
                          (balanco3Anos.anoAtual.passivoCirculante.adiantamentosClientes || 0) +
                          (balanco3Anos.anoAtual.passivoCirculante.outrasObrigacoesCP || 0),
                      )}
                    </td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td className="p-1 text-slate-900">Patrimônio Líquido (PL)</td>
                    <td className="p-1 text-right font-mono text-slate-800">
                      {brl(
                        (balanco3Anos.anoMenos2.patrimonioLiquido.capitalSocial || 0) +
                          (balanco3Anos.anoMenos2.patrimonioLiquido.reservasLucros || 0) +
                          (balanco3Anos.anoMenos2.patrimonioLiquido.ajustesAvaliacaoPatrimonial ||
                            0) -
                          (balanco3Anos.anoMenos2.patrimonioLiquido.prejuizosAcumulados || 0),
                      )}
                    </td>
                    <td className="p-1 text-right font-mono text-slate-800">
                      {brl(
                        (balanco3Anos.anoMenos1.patrimonioLiquido.capitalSocial || 0) +
                          (balanco3Anos.anoMenos1.patrimonioLiquido.reservasLucros || 0) +
                          (balanco3Anos.anoMenos1.patrimonioLiquido.ajustesAvaliacaoPatrimonial ||
                            0) -
                          (balanco3Anos.anoMenos1.patrimonioLiquido.prejuizosAcumulados || 0),
                      )}
                    </td>
                    <td className="p-1 text-right font-mono text-slate-900">
                      {brl(
                        (balanco3Anos.anoAtual.patrimonioLiquido.capitalSocial || 0) +
                          (balanco3Anos.anoAtual.patrimonioLiquido.reservasLucros || 0) +
                          (balanco3Anos.anoAtual.patrimonioLiquido.ajustesAvaliacaoPatrimonial ||
                            0) -
                          (balanco3Anos.anoAtual.patrimonioLiquido.prejuizosAcumulados || 0),
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SEÇÃO 3: 25 INDICADORES COM SEMÁFORO & COMPARATIVO DOS 3 EXERCÍCIOS */}
        {indicadoresModelo && indicadoresModelo.length > 0 && incluirClassicos && (
          <div>
            <h2 className="text-xs font-black uppercase text-slate-800 border-b border-slate-300 pb-1 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                {tituloSecaoClassicos}
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                Exercícios: {balanco3Anos?.anoMenos2?.rotulo || 'Ano -2'} •{' '}
                {balanco3Anos?.anoMenos1?.rotulo || 'Ano -1'} •{' '}
                {balanco3Anos?.anoAtual?.rotulo || 'Ano Atual'}
              </span>
            </h2>
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-[9px] text-left">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase">
                  <tr>
                    <th className="p-1">Indicador</th>
                    <th className="p-1 text-center">Referência</th>
                    <th className="p-1 text-right">
                      {balanco3Anos?.anoMenos2?.rotulo || 'Ano -2'}
                    </th>
                    <th className="p-1 text-right">
                      {balanco3Anos?.anoMenos1?.rotulo || 'Ano -1'}
                    </th>
                    <th className="p-1 text-right">
                      {balanco3Anos?.anoAtual?.rotulo || 'Ano Atual'}
                    </th>
                    <th className="p-1 text-center">Semáforo</th>
                    <th className="p-1">Diagnóstico Executivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const mapMenos1 = new Map<string, number>()
                    const mapMenos2 = new Map<string, number>()
                    if (balanco3Anos?.anoMenos1) {
                      for (const m of calcular25Indicadores(balanco3Anos.anoMenos1)) {
                        mapMenos1.set(m.id, m.valor)
                      }
                    }
                    if (balanco3Anos?.anoMenos2) {
                      for (const m of calcular25Indicadores(balanco3Anos.anoMenos2)) {
                        mapMenos2.set(m.id, m.valor)
                      }
                    }

                    const formatarItem = (val: number | undefined, unidade: string) => {
                      if (val === undefined || isNaN(val)) return '—'
                      if (unidade === 'moeda') return brl(val)
                      if (unidade === 'percentual') return `${val.toFixed(2).replace('.', ',')}%`
                      if (unidade === 'dias') return `${Math.round(val)}d`
                      return `${val.toFixed(2).replace('.', ',')}x`
                    }

                    return indicadoresModelo.map((ind) => {
                      const vMenos2 = mapMenos2.get(ind.id)
                      const vMenos1 = mapMenos1.get(ind.id)

                      return (
                        <tr key={ind.id} className="hover:bg-slate-50">
                          <td className="p-1 font-semibold text-slate-900">{ind.nome}</td>
                          <td className="p-1 text-center text-slate-500 font-medium">
                            {ind.referencia}
                          </td>
                          <td className="p-1 text-right font-mono text-slate-500">
                            {formatarItem(vMenos2, ind.unidade)}
                          </td>
                          <td className="p-1 text-right font-mono text-slate-600">
                            {formatarItem(vMenos1, ind.unidade)}
                          </td>
                          <td className="p-1 text-right font-mono font-bold text-slate-900">
                            {formatarItem(ind.valor, ind.unidade)}
                          </td>
                          <td className="p-1 text-center">
                            <span
                              className={`px-1.5 py-0.2 rounded font-bold text-[8px] ${
                                ind.semaforo === 'saudavel'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : ind.semaforo === 'atencao'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {ind.semaforo.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-1 text-slate-600 truncate max-w-[180px]">
                            {ind.explicacao}
                          </td>
                        </tr>
                      )
                    })
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SEÇÃO 3.1: GRUPOS AVANÇADOS (KANITZ, ALTMAN Z1, ELIZABETSKY, DU PONT, DINÂMICA CDG/NCG/EFEITO TESOURA) */}
        {avancadoCalculado && incluirAvancados && (
          <div className="space-y-2 border border-slate-300 rounded p-2.5 bg-slate-50/40">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1">
              <h2 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                {tituloSecaoAvancados}
              </h2>
              <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                Ref.: {avancadoCalculado.exercicioRotulo}
              </span>
            </div>

            {/* Destaque dos 4 Modelos Canônicos de Insolvência e Retorno */}
            <div className="grid grid-cols-4 gap-2 text-[10px]">
              {/* Kanitz */}
              <div className="bg-white border border-slate-200 rounded p-2 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-500 block">
                    Termômetro de Kanitz
                  </span>
                  <span className="text-xs font-mono font-black text-slate-900 block mt-0.5">
                    {avancadoCalculado.kanitz.fatorInsolvencia.toFixed(4).replace('.', ',')}
                  </span>
                  <span
                    className={`inline-block px-1.5 py-0.2 mt-1 rounded font-bold text-[8px] ${
                      avancadoCalculado.kanitz.faixa === 'solvente'
                        ? 'bg-emerald-100 text-emerald-800'
                        : avancadoCalculado.kanitz.faixa === 'penumbra'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {avancadoCalculado.kanitz.faixaTexto.toUpperCase()}
                  </span>
                </div>
                <p className="text-[8px] text-slate-500 mt-1">Stephen Charles Kanitz (USP, 1974)</p>
              </div>

              {/* Altman Z1 */}
              <div className="bg-white border border-slate-200 rounded p-2 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-500 block">
                    Altman Z1 (Emergentes)
                  </span>
                  <span className="text-xs font-mono font-black text-slate-900 block mt-0.5">
                    {avancadoCalculado.altmanZ1.zScore.toFixed(4).replace('.', ',')}
                  </span>
                  <span
                    className={`inline-block px-1.5 py-0.2 mt-1 rounded font-bold text-[8px] ${
                      avancadoCalculado.altmanZ1.faixa === 'segura'
                        ? 'bg-emerald-100 text-emerald-800'
                        : avancadoCalculado.altmanZ1.faixa === 'cinzenta'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {avancadoCalculado.altmanZ1.faixaTexto.toUpperCase()}
                  </span>
                </div>
                <p className="text-[8px] text-slate-500 mt-1">Edward I. Altman (NYU, 1968/1983)</p>
              </div>

              {/* Elizabetsky */}
              <div className="bg-white border border-slate-200 rounded p-2 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-500 block">
                    Fator Elizabetsky
                  </span>
                  <span className="text-xs font-mono font-black text-slate-900 block mt-0.5">
                    {avancadoCalculado.elizabetsky.fator.toFixed(4).replace('.', ',')}
                  </span>
                  <span
                    className={`inline-block px-1.5 py-0.2 mt-1 rounded font-bold text-[8px] ${
                      avancadoCalculado.elizabetsky.faixa === 'solvente'
                        ? 'bg-emerald-100 text-emerald-800'
                        : avancadoCalculado.elizabetsky.faixa === 'indefinida'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {avancadoCalculado.elizabetsky.faixaTexto.toUpperCase()}
                  </span>
                </div>
                <p className="text-[8px] text-slate-500 mt-1">Roberto Elizabetsky (USP, 1976)</p>
              </div>

              {/* Du Pont */}
              <div className="bg-white border border-slate-200 rounded p-2 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-500 block">
                    Decomposição Du Pont (ROA)
                  </span>
                  <span className="text-xs font-mono font-black text-slate-900 block mt-0.5">
                    {avancadoCalculado.duPont.retornoAtivo.toFixed(4).replace('.', ',')}{' '}
                    <span className="text-[9px] text-slate-500">
                      ({(avancadoCalculado.duPont.retornoAtivo * 100).toFixed(2).replace('.', ',')}
                      %)
                    </span>
                  </span>
                  <span className="text-[8px] text-slate-700 block mt-1">
                    Margem: {avancadoCalculado.duPont.margemLiquida.toFixed(2).replace('.', ',')}% ×
                    Giro: {avancadoCalculado.duPont.giroAtivo.toFixed(4).replace('.', ',')}x
                  </span>
                </div>
                <p className="text-[8px] text-slate-500 mt-1">
                  Du Pont (1914) · ROE:{' '}
                  {avancadoCalculado.duPont.retornoPatrimonioLiquido.toFixed(2).replace('.', ',')}%
                </p>
              </div>
            </div>

            {/* Dinâmica Financeira Modelo Fleuriet (CDG / NCG / Efeito Tesoura / Saldo de Tesouraria) */}
            <div className="border border-slate-200 rounded bg-white p-2 text-[10px]">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold uppercase text-slate-700 text-[9px] flex items-center gap-1">
                  <Activity className="w-3 h-3 text-emerald-700" />
                  Dinâmica Financeira e Capital de Giro (Modelo Fleuriet)
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded font-bold text-[8px] ${
                    avancadoCalculado.dinamica.efeitoTesoura
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {avancadoCalculado.dinamica.efeitoTesoura
                    ? 'EFEITO TESOURA ATIVO'
                    : 'EQUILÍBRIO FINANCEIRO ADEQUADO'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center divide-x divide-slate-100">
                <div>
                  <span className="text-[8px] uppercase text-slate-500 block">
                    Capital de Giro (CDG)
                  </span>
                  <span className="font-mono font-bold text-slate-900 block mt-0.5">
                    {brl(avancadoCalculado.dinamica.cdg)}
                  </span>
                </div>
                <div>
                  <span className="text-[8px] uppercase text-slate-500 block">
                    Nec. Capital Giro (NCG)
                  </span>
                  <span className="font-mono font-bold text-slate-900 block mt-0.5">
                    {brl(avancadoCalculado.dinamica.ncg)}
                  </span>
                </div>
                <div>
                  <span className="text-[8px] uppercase text-slate-500 block">
                    Saldo Tesouraria (ST)
                  </span>
                  <span
                    className={`font-mono font-bold block mt-0.5 ${
                      avancadoCalculado.dinamica.saldoTesouraria >= 0
                        ? 'text-emerald-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {brl(avancadoCalculado.dinamica.saldoTesouraria)}
                  </span>
                </div>
                <div>
                  <span className="text-[8px] uppercase text-slate-500 block">
                    Classificação Fleuriet
                  </span>
                  <span className="text-[9px] font-semibold text-slate-800 block mt-0.5 truncate px-1">
                    {avancadoCalculado.dinamica.classificacaoFleuriet}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabela dos Grupos Avançados (Estrutura, Liquidez, Atividade, Rentabilidade e Insolvência) */}
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-[9px] text-left">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase">
                  <tr>
                    <th className="p-1">Grupo Avançado</th>
                    <th className="p-1">Índice / Sigla</th>
                    <th className="p-1 text-center">Fórmula / Fonte Acadêmica</th>
                    <th className="p-1 text-right">Valor Apurado</th>
                    <th className="p-1 text-center">Referência</th>
                    <th className="p-1 text-center">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {avancadoCalculado.indices.map((ind) => (
                    <tr key={ind.id} className="hover:bg-slate-50">
                      <td className="p-1 font-bold text-slate-700">{ind.grupoTitulo}</td>
                      <td className="p-1 font-semibold text-slate-900">
                        {ind.sigla ? `${ind.sigla} - ${ind.nome}` : ind.nome}
                      </td>
                      <td className="p-1 text-center text-slate-500 text-[8px] max-w-[150px] truncate">
                        {ind.formula}
                      </td>
                      <td className="p-1 text-right font-mono font-bold text-slate-900">
                        {ind.valorFormatado}
                      </td>
                      <td className="p-1 text-center text-slate-500 text-[8px]">
                        {ind.referencia}
                      </td>
                      <td className="p-1 text-center">
                        <span
                          className={`px-1.5 py-0.2 rounded font-bold text-[8px] ${
                            ind.semaforo === 'saudavel'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ind.semaforo === 'atencao'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {ind.faixaInterpretada || ind.semaforo.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SEÇÃO 4: SCORE PONDERADO MULTICRITÉRIO & COMPLETUDE DOCUMENTAL */}
        {(incluirSintese || incluirChecklist) && (
          <div className="grid grid-cols-2 gap-3">
            {scoreResultado && incluirSintese && (
              <div className="border border-slate-200 rounded p-2.5 bg-white">
                <h3 className="font-bold text-[11px] text-slate-900 uppercase mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Award className="w-3 h-3 text-amber-600" />
                    {tituloSecaoScore}
                  </span>
                  <span className="text-primary font-bold font-mono">
                    Nota: {scoreResultado.notaFinal.toFixed(2)}
                  </span>
                </h3>
                <div className="space-y-1 text-[10px]">
                  {scoreResultado.blocos.map((b) => (
                    <div
                      key={b.bloco}
                      className="flex justify-between border-b border-slate-100 pb-0.5"
                    >
                      <span className="text-slate-600">
                        {b.bloco} ({(b.peso * 100).toFixed(0)}%):
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {b.nota.toFixed(1)} (Pond: {b.notaPonderada.toFixed(2)})
                      </span>
                    </div>
                  ))}
                  <div className="pt-1 flex justify-between font-bold text-slate-900 text-[11px]">
                    <span>Classificação:</span>
                    <span className="text-primary">{scoreResultado.classificacao}</span>
                  </div>
                </div>
              </div>
            )}

            {incluirChecklist && (
              <div className="border border-slate-200 rounded p-2.5 bg-white flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-[11px] text-slate-900 uppercase mb-1.5 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-blue-600" />
                    {tituloSecaoChecklist}
                  </h3>
                  <div className="space-y-2 text-[10px]">
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-600">Total de Documentos Auditados:</span>
                      <span className="font-bold text-slate-900">{checklistTotal} itens</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-600">Documentos Validados / Entregues:</span>
                      <span className="font-bold text-emerald-700">{checklistRecebidos} itens</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-600">Pendências Documentais:</span>
                      <span className="font-bold text-amber-700">
                        {checklistTotal - checklistRecebidos} itens
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 font-bold text-[11px]">
                      <span className="text-slate-900">Taxa de Completude:</span>
                      <span className="text-primary">{checklistPct.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-[9px] text-slate-500 italic">
                  Conforme as 8 categorias normativas (Societário, Contábil, Fiscal, Trabalhista,
                  Patrimonial, Financeiro, Operacional e Governança).
                </div>
              </div>
            )}
          </div>
        )}

        {/* SEÇÃO 5: MATRIZ DE ACHADOS (APONTAMENTOS) */}
        {achados && achados.length > 0 && incluirNotas && (
          <div>
            <h2 className="text-xs font-black uppercase text-slate-800 border-b border-slate-300 pb-1 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              {tituloSecaoAchados}
            </h2>
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-[9px] text-left">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase">
                  <tr>
                    <th className="p-1 w-6 text-center">Nº</th>
                    <th className="p-1 w-20">Área</th>
                    <th className="p-1">Achado / Inconsistência</th>
                    <th className="p-1 text-center w-16">Impacto</th>
                    <th className="p-1">Recomendação Técnica ADECONT</th>
                    <th className="p-1 text-center w-20">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {achados.slice(0, 8).map((a, idx) => (
                    <tr key={a.id || idx}>
                      <td className="p-1 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="p-1 font-bold text-slate-900">{a.area}</td>
                      <td className="p-1 text-slate-800">{a.achado}</td>
                      <td className="p-1 text-center">
                        <span
                          className={`px-1 py-0.2 rounded font-semibold text-[8px] ${
                            a.impacto === 'Alto'
                              ? 'bg-red-100 text-red-800'
                              : a.impacto === 'Médio'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {a.impacto}
                        </span>
                      </td>
                      <td className="p-1 text-slate-700">{a.recomendacao}</td>
                      <td className="p-1 text-center font-medium text-slate-600">{a.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pareceres dos 4 Agentes Especialistas Integrados */}
        {incluirAgentes && (
          <div>
            <h2 className="text-xs font-black uppercase text-slate-800 border-b border-slate-300 pb-1 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              {tituloSecaoAgentes}
            </h2>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="border border-slate-200 rounded p-2 bg-slate-50/50">
                <span className="font-bold text-slate-900 block mb-0.5">
                  Parecer Tributário (LC 214/2025):
                </span>
                <p className="text-slate-700 line-clamp-3">{parecerEspecialistas.tributario}</p>
              </div>
              <div className="border border-slate-200 rounded p-2 bg-slate-50/50">
                <span className="font-bold text-slate-900 block mb-0.5">
                  Parecer Contábil (Balancetes):
                </span>
                <p className="text-slate-700 line-clamp-3">{parecerEspecialistas.contabil}</p>
              </div>
              <div className="border border-slate-200 rounded p-2 bg-slate-50/50">
                <span className="font-bold text-slate-900 block mb-0.5">
                  Parecer Administrativo / Trabalhista:
                </span>
                <p className="text-slate-700 line-clamp-3">{parecerEspecialistas.administrativo}</p>
              </div>
              <div className="border border-slate-200 rounded p-2 bg-slate-50/50">
                <span className="font-bold text-slate-900 block mb-0.5">
                  Parecer Macroeconômico de Mercado:
                </span>
                <p className="text-slate-700 line-clamp-3">{parecerEspecialistas.economico}</p>
              </div>
            </div>
          </div>
        )}

        {/* Seções Customizadas Adicionadas pelo Usuário */}
        {(customizacao?.incluirSecoesCustomizadas ?? true) &&
          (customizacao?.secoesCustomizadas || [])
            .filter((s) => s.ativa !== false && (s.titulo.trim() || s.conteudo.trim()))
            .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
            .map((secao, idx) => (
              <div
                key={secao.id || `secao-custom-${idx}`}
                className="border-2 border-indigo-900/40 rounded p-3 bg-indigo-50/30 dark:bg-slate-800/40"
              >
                <h2 className="text-xs font-black uppercase text-indigo-950 dark:text-indigo-200 border-b border-indigo-200 dark:border-indigo-800 pb-1 mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-400" />
                  {secao.titulo.trim() || `Seção Customizada ${idx + 1}`}
                </h2>
                <div className="text-[11px] text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {secao.conteudo}
                </div>
              </div>
            ))}

        {/* Seção de Observações e Considerações Finais Livres */}
        {observacoesFinais && (
          <div className="border-2 border-amber-800/40 rounded p-3 bg-amber-50/50">
            <h2 className="text-xs font-black uppercase text-amber-950 border-b border-amber-300 pb-1 mb-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
              Considerações & Observações Finais Personalizadas
            </h2>
            <p className="text-[11px] text-slate-800 leading-relaxed whitespace-pre-wrap">
              {observacoesFinais}
            </p>
          </div>
        )}

        {/* Rodapé Oficial com carimbo */}
        <div className="border-t border-slate-300 pt-2 text-[10px] text-slate-500 flex justify-between items-center">
          <div>
            <p className="font-bold text-slate-700">
              ADECONT — Assessoria Contábil e Administrativa
            </p>
            <p>
              Documento gerado automaticamente pelo Sistema Panorama RT · Responsabilidade Técnica
              Restrita
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-slate-600">Autenticidade Garantida · Sistema ADECONT</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RelatorioAnaliseEmpresarialA4
