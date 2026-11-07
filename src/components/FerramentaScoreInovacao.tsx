import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  ShieldCheck,
  TrendingUp,
  LineChart,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import {
  simularCenariosSensibilidade,
  projetarForecast3Anos,
  calcularTotaisExercicio,
} from '@/services/motorAnaliseEmpresarial'
import type {
  ScorePonderadoResultado,
  BlocoScorePonderado,
  ExercicioFinanceiroCompleto,
} from '@/types/analisesEmpresariaisModel'

interface Props {
  scoreResultado: ScorePonderadoResultado
  notasCustom: Partial<Record<BlocoScorePonderado['bloco'], number>>
  onChangeNota: (bloco: BlocoScorePonderado['bloco'], novaNota: number) => void
  anoMenos2: ExercicioFinanceiroCompleto
  anoMenos1: ExercicioFinanceiroCompleto
  anoAtual: ExercicioFinanceiroCompleto
  clienteNome: string
}

export const FerramentaScoreInovacao: React.FC<Props> = ({
  scoreResultado,
  notasCustom,
  onChangeNota,
  anoMenos2,
  anoMenos1,
  anoAtual,
  clienteNome,
}) => {
  const calcMenos2 = calcularTotaisExercicio(anoMenos2)
  const calcMenos1 = calcularTotaisExercicio(anoMenos1)
  const calcAtual = calcularTotaisExercicio(anoAtual)

  const servicoDividaAtual =
    (anoAtual.complementares.despesaJuros || 0) + (anoAtual.complementares.amortizacaoDividas || 0)

  // 1. Simulador de Cenários de Sensibilidade
  const cenarios = simularCenariosSensibilidade(
    calcAtual.receitaLiquida,
    calcAtual.ebitda,
    servicoDividaAtual,
  )

  // 2. Projeção de 3 Anos (FORECAST Linear)
  const projecao = projetarForecast3Anos(
    [calcMenos2.receitaLiquida, calcMenos1.receitaLiquida, calcAtual.receitaLiquida],
    [calcMenos2.ebitda, calcMenos1.ebitda, calcAtual.ebitda],
  )

  const formatarMoeda = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="space-y-6">
      {/* SEÇÃO A: SCORE PONDERADO MULTICRITÉRIO */}
      <Card className="border-border">
        <CardHeader className="py-3 px-4 border-b border-border bg-muted/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Score Ponderado Multicritério (0 a 10) — Metodologia ADECONT
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                8 blocos analíticos ponderados por SUMPRODUCT. Notas automáticas dos indicadores
                ajustáveis pelo analista.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-sm px-3 py-1 font-bold ${
                  scoreResultado.notaFinal >= 7
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : scoreResultado.notaFinal >= 5
                      ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
                      : 'border-red-500 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20'
                }`}
              >
                Nota Final: {scoreResultado.notaFinal.toFixed(2)} / 10,0
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {scoreResultado.blocos.map((bloco) => {
              return (
                <Card
                  key={bloco.bloco}
                  className="border-border bg-card p-3 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{bloco.bloco}</span>
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        Peso {(bloco.peso * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-lg font-extrabold text-foreground font-mono">
                        {bloco.nota.toFixed(1)}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        Pond: {bloco.notaPonderada.toFixed(3)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Ajustar nota:</span>
                      <span className="font-mono font-bold text-foreground">{bloco.nota}</span>
                    </div>
                    <Slider
                      value={[bloco.nota]}
                      min={0}
                      max={10}
                      step={0.5}
                      onValueChange={(val) => onChangeNota(bloco.bloco, val[0])}
                    />
                  </div>
                </Card>
              )
            })}
          </div>

          <div className="p-3 rounded-lg bg-muted/40 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-semibold text-foreground">
                Classificação de Risco Oficial:{' '}
              </span>
              <strong className="text-primary font-bold">{scoreResultado.classificacao}</strong>
            </div>
            <div className="text-muted-foreground text-[11px]">
              Empresa analisada: <strong className="text-foreground">{clienteNome}</strong>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO B: SIMULADOR DE CENÁRIOS DE SENSIBILIDADE */}
      <Card className="border-border">
        <CardHeader className="py-3 px-4 border-b border-border bg-muted/20">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary" />
            Simulador de Cenários de Sensibilidade (Otimista, Base, Pessimista)
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Testa a resiliência do negócio aplicando estresses de mercado sobre a receita líquida e
            recalculando o EBITDA e o DSCR (Índice de Cobertura da Dívida).
          </p>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground border-b border-border text-left">
                <th className="p-2.5 font-semibold">Cenário</th>
                <th className="p-2.5 text-center font-semibold">Multiplicador</th>
                <th className="p-2.5 text-right font-semibold">Receita Projetada</th>
                <th className="p-2.5 text-right font-semibold">EBITDA Projetado</th>
                <th className="p-2.5 text-center font-semibold">DSCR Resultante</th>
                <th className="p-2.5 text-center font-semibold">Classificação de Resiliência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cenarios.map((c) => (
                <tr key={c.cenario} className="hover:bg-muted/30">
                  <td className="p-2.5 font-bold text-foreground flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        c.cenario === 'Otimista'
                          ? 'bg-emerald-500'
                          : c.cenario === 'Base'
                            ? 'bg-blue-500'
                            : 'bg-amber-500'
                      }`}
                    />
                    {c.cenario}
                  </td>
                  <td className="p-2.5 text-center font-mono font-medium">
                    ×{c.multiplicador.toFixed(2)}
                  </td>
                  <td className="p-2.5 text-right font-mono font-medium">
                    {formatarMoeda(c.receita)}
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-foreground">
                    {formatarMoeda(c.ebitda)}
                  </td>
                  <td className="p-2.5 text-center font-mono font-bold">
                    <Badge
                      variant="outline"
                      className={`text-[11px] ${
                        c.dscr >= 1.3
                          ? 'border-emerald-500 text-emerald-600'
                          : c.dscr >= 1.0
                            ? 'border-amber-500 text-amber-600'
                            : 'border-red-500 text-red-600'
                      }`}
                    >
                      {c.dscr.toFixed(2)}x
                    </Badge>
                  </td>
                  <td className="p-2.5 text-center font-medium">{c.classificacao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* SEÇÃO C: PROJEÇÃO 3 ANOS (FORECAST LINEAR) */}
      <Card className="border-border">
        <CardHeader className="py-3 px-4 border-b border-border bg-muted/20">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Projeção 3 Anos — Análise Preditiva de Tendência (Equivalente FORECAST/TREND)
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Regressão linear calculada sobre a série histórica dos 3 exercícios analisados (Ano -2,
            Ano -1 e Ano Atual) para antecipar receitas e margens futuras.
          </p>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {projecao.map((p, idx) => (
              <div
                key={p.ano}
                className="p-4 rounded-lg border border-border bg-muted/20 space-y-2 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">
                    {p.ano} (+{idx + 1} ano)
                  </span>
                  <LineChart className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="pt-1">
                  <span className="text-[11px] text-muted-foreground block">
                    Receita Projetada:
                  </span>
                  <span className="text-base font-bold text-foreground font-mono">
                    {formatarMoeda(p.receita)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">EBITDA Projetado:</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatarMoeda(p.ebitda)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
