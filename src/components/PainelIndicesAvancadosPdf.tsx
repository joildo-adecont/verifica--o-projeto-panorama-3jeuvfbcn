import React from 'react'
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  BookOpen,
  TrendingUp,
  Activity,
  ShieldCheck,
  Scale,
  Sparkles,
} from 'lucide-react'
import type {
  RelatorioIndicesAvancados,
  ItemIndiceAvancado,
} from '@/services/indicesAvancadosEmpresariais'
import type { StatusSemaforo } from '@/types/analisesEmpresariaisModel'

interface Props {
  relatorioAvancado: RelatorioIndicesAvancados
}

export const PainelIndicesAvancadosPdf: React.FC<Props> = ({ relatorioAvancado }) => {
  const { indices, dinamica, kanitz, altmanZ1, elizabetsky, duPont, exercicioRotulo } =
    relatorioAvancado

  const getSemaforoBadge = (status: StatusSemaforo) => {
    switch (status) {
      case 'saudavel':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Saudável
          </span>
        )
      case 'atencao':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Atenção
          </span>
        )
      case 'critico':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Crítico
          </span>
        )
    }
  }

  // Agrupa os índices adicionais por grupo temático
  const gruposMap: Record<string, ItemIndiceAvancado[]> = {}
  for (const item of indices) {
    if (!gruposMap[item.grupoTitulo]) {
      gruposMap[item.grupoTitulo] = []
    }
    gruposMap[item.grupoTitulo].push(item)
  }

  return (
    <div className="space-y-6 mt-6">
      {/* CABEÇALHO DO BLOCO DE ÍNDICES AVANÇADOS */}
      <div className="bg-gradient-to-r from-slate-900 via-primary/95 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-primary/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-sm mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Ampliação Pericial • Modelo Análise Financeira FMF
          </div>
          <h3 className="text-xl font-black tracking-tight text-white">
            Índices com Fontes Legais & Modelos Consagrados de Insolvência
          </h3>
          <p className="text-xs text-slate-200 mt-1 max-w-3xl">
            Apresentação estruturada com referências bibliográficas consagradas (Kanitz 1976, Altman
            1983/Z1, Elizabetsky 1976, Donaldson Brown/Du Pont 1914 e Michel Fleuriet 1978).
            Exercício: <strong className="text-amber-300 font-bold">{exercicioRotulo}</strong>.
          </p>
        </div>
      </div>

      {/* BLOCO EM DESTAQUE: MODELOS DE INSOLVÊNCIA & DECOMPOSIÇÃO DU PONT */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card Kanitz */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Kanitz (1976)
              </span>
              {getSemaforoBadge(
                kanitz.faixa === 'solvente'
                  ? 'saudavel'
                  : kanitz.faixa === 'penumbra'
                    ? 'atencao'
                    : 'critico',
              )}
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mt-2 text-sm">
              Termômetro de Insolvência
            </h4>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                {kanitz.fatorInsolvencia.toFixed(4).replace('.', ',')}
              </span>
              <span className="text-xs text-slate-500 font-semibold">fator K</span>
            </div>
            <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {kanitz.faixaTexto}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
            <p className="font-mono text-[10px] text-slate-400">
              K = 0,05·RP + 1,65·LG + 3,55·LS - 1,06·LC - 0,33·GE
            </p>
            <p className="text-[10px]">
              Faixa: Solvente (&gt; 0) | Penumbra (-3 a 0) | Insolvente (&lt; -3)
            </p>
          </div>
        </div>

        {/* Card Altman Z1 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-primary" />
                Altman Z1 (1983)
              </span>
              {getSemaforoBadge(
                altmanZ1.faixa === 'segura'
                  ? 'saudavel'
                  : altmanZ1.faixa === 'cinzenta'
                    ? 'atencao'
                    : 'critico',
              )}
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mt-2 text-sm">
              Altman Z-Score (Empresas Fechadas)
            </h4>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                {altmanZ1.zScore.toFixed(4).replace('.', ',')}
              </span>
              <span className="text-xs text-slate-500 font-semibold">Score Z1</span>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              {altmanZ1.faixaTexto}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
            <p className="font-mono text-[10px] text-slate-400">
              Z1 = 0,717·X1 + 0,847·X2 + 3,107·X3 + 0,420·X4 + 0,998·X5
            </p>
            <p className="text-[10px]">
              Faixa: Segura (&gt; 2,90) | Cinzenta (1,23 a 2,90) | Perigo (&lt; 1,23)
            </p>
          </div>
        </div>

        {/* Card Elizabetsky */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-primary" />
                Elizabetsky (1976)
              </span>
              {getSemaforoBadge(
                elizabetsky.faixa === 'solvente'
                  ? 'saudavel'
                  : elizabetsky.faixa === 'indefinida'
                    ? 'atencao'
                    : 'critico',
              )}
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mt-2 text-sm">
              Modelo Discriminante USP/FEA
            </h4>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                {elizabetsky.fator.toFixed(4).replace('.', ',')}
              </span>
              <span className="text-xs text-slate-500 font-semibold">fator E</span>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              {elizabetsky.faixaTexto}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
            <p className="font-mono text-[10px] text-slate-400">
              E = -1,44 + 4,03·X2 + 2,25·X3 + 0,14·X4 + 0,42·X5
            </p>
            <p className="text-[10px]">
              Faixa: Solvente (≥ 0,50) | Indefinida (0 a 0,50) | Risco (&lt; 0)
            </p>
          </div>
        </div>

        {/* Card Du Pont */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-primary" />
                Fórmula Du Pont (1914)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                Decomposição
              </span>
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mt-2 text-sm">
              Retorno sobre Ativos (ROA)
            </h4>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                {duPont.retornoAtivo.toFixed(4).replace('.', ',')}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                ({(duPont.retornoAtivo * 100).toFixed(2).replace('.', ',')}%)
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Margem: <strong>{duPont.margemLiquida.toFixed(2).replace('.', ',')}%</strong> × Giro:{' '}
              <strong>{duPont.giroAtivo.toFixed(4).replace('.', ',')}x</strong>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
            <p className="font-mono text-[10px] text-slate-400">
              ROA = Margem Líquida × Giro do Ativo
            </p>
            <p className="text-[10px]">
              Alavancagem: {duPont.alavancagemFinanceira.toFixed(2).replace('.', ',')}x | ROE:{' '}
              {duPont.retornoPatrimonioLiquido.toFixed(2).replace('.', ',')}%
            </p>
          </div>
        </div>
      </div>

      {/* BLOCO DA ANÁLISE DINÂMICA DO CAPITAL DE GIRO (FLEURIET) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Análise Dinâmica do Capital de Giro (Modelo Fleuriet / Braga)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Classificação estrutural do equilíbrio financeiro (CDG vs NCG) e diagnóstico do Efeito
              Tesoura
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              dinamica.efeitoTesoura
                ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300'
                : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
            }`}
          >
            {dinamica.efeitoTesoura
              ? '⚠️ Efeito Tesoura Detectado'
              : 'Equilíbrio Financeiro Assegurado'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Capital de Giro (CDG)
            </span>
            <span className="text-lg font-black font-mono text-slate-900 dark:text-white mt-1 block">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              }).format(dinamica.cdg)}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">Fórmula: (PL + PNC) - ANC</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Necessidade de Giro (NCG)
            </span>
            <span className="text-lg font-black font-mono text-slate-900 dark:text-white mt-1 block">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              }).format(dinamica.ncg)}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">
              Fórmula: Ativo Operacional - Passivo Operacional
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Saldo de Tesouraria (T)
            </span>
            <span
              className={`text-lg font-black font-mono mt-1 block ${
                dinamica.saldoTesouraria >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              }).format(dinamica.saldoTesouraria)}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">
              Fórmula: CDG - NCG (T = Tesouraria)
            </span>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs text-slate-700 dark:text-slate-300">
          <strong className="text-primary font-bold">Diagnóstico Fleuriet: </strong>
          {dinamica.classificacaoFleuriet} — {dinamica.descricaoFleuriet}
        </div>
      </div>

      {/* GRADE COMPLETA DOS ÍNDICES ADICIONAIS DO MODELO PDF FMF */}
      <div className="space-y-6">
        {Object.entries(gruposMap).map(([tituloGrupo, itens]) => (
          <div
            key={tituloGrupo}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm"
          >
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                {tituloGrupo}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Métricas calculadas com fontes acadêmicas e periciais reconhecidas
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {itens.map((ind) => (
                <div
                  key={ind.id}
                  className="bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:border-primary/40 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {ind.nome}
                      </span>
                      {getSemaforoBadge(ind.semaforo)}
                    </div>

                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                        {ind.valorFormatado}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        ref: {ind.referencia}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                      {ind.faixaInterpretada}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 text-[11px] space-y-1">
                    <p className="text-slate-500 font-mono text-[10px]">
                      <strong>Fórmula:</strong> {ind.formula}
                    </p>
                    <p className="text-primary dark:text-primary/90 font-medium text-[10px] flex items-center gap-1">
                      <BookOpen className="w-3 h-3 flex-shrink-0" />
                      Fonte: {ind.fonteLegalAcademica}
                    </p>
                    {ind.detalheAdicional && (
                      <p className="text-[10px] text-slate-400 italic">{ind.detalheAdicional}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
