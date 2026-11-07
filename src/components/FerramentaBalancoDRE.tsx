import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle2, AlertTriangle, Save, Loader2, RefreshCw } from 'lucide-react'
import { calcularTotaisExercicio, calcularAH, calcularAV } from '@/services/motorAnaliseEmpresarial'
import type { ExercicioFinanceiroCompleto } from '@/types/analisesEmpresariaisModel'

interface Props {
  anoMenos2: ExercicioFinanceiroCompleto
  anoMenos1: ExercicioFinanceiroCompleto
  anoAtual: ExercicioFinanceiroCompleto
  onChangeAno: (
    exercicio: 'ano_menos_2' | 'ano_menos_1' | 'ano_atual',
    novosDados: ExercicioFinanceiroCompleto,
  ) => void
  onSalvar: (exercicio: 'ano_menos_2' | 'ano_menos_1' | 'ano_atual') => Promise<void>
  salvando: boolean
  clienteNome: string
  clienteCnpj: string
}

export const FerramentaBalancoDRE: React.FC<Props> = ({
  anoMenos2,
  anoMenos1,
  anoAtual,
  onChangeAno,
  onSalvar,
  salvando,
  clienteNome,
  clienteCnpj,
}) => {
  const [exercicioAtivo, setExercicioAtivo] = useState<'ano_menos_2' | 'ano_menos_1' | 'ano_atual'>(
    'ano_atual',
  )

  const calcMenos2 = calcularTotaisExercicio(anoMenos2)
  const calcMenos1 = calcularTotaisExercicio(anoMenos1)
  const calcAtual = calcularTotaisExercicio(anoAtual)

  const formatarMoeda = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const formatarPct = (val: number | null) => {
    if (val === null || !Number.isFinite(val)) return '—'
    return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`
  }

  // Helper para atualizar campo em exercício específico
  const atualizarCampo = (
    ex: 'ano_menos_2' | 'ano_menos_1' | 'ano_atual',
    secao:
      | 'ativoCirculante'
      | 'ativoNaoCirculante'
      | 'passivoCirculante'
      | 'passivoNaoCirculante'
      | 'patrimonioLiquido'
      | 'dre'
      | 'complementares',
    campo: string,
    valorStr: string,
  ) => {
    const valorNum = parseFloat(valorStr) || 0
    const target =
      ex === 'ano_menos_2'
        ? { ...anoMenos2 }
        : ex === 'ano_menos_1'
          ? { ...anoMenos1 }
          : { ...anoAtual }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(target as any)[secao] = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(target as any)[secao],
      [campo]: valorNum,
    }
    onChangeAno(ex, target)
  }

  const exTargetObj =
    exercicioAtivo === 'ano_menos_2'
      ? anoMenos2
      : exercicioAtivo === 'ano_menos_1'
        ? anoMenos1
        : anoAtual
  const calcTarget =
    exercicioAtivo === 'ano_menos_2'
      ? calcMenos2
      : exercicioAtivo === 'ano_menos_1'
        ? calcMenos1
        : calcAtual

  return (
    <div className="space-y-6">
      {/* Cabeçalho de Contexto */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-card border border-border">
        <div>
          <h3 className="text-lg font-bold text-foreground">
            Balanço Patrimonial & DRE (3 Exercícios Contábeis)
          </h3>
          <p className="text-xs text-muted-foreground">
            Empresa: <strong className="text-foreground">{clienteNome}</strong> (CNPJ: {clienteCnpj}
            ) — Cálculos automáticos de Análise Horizontal (AH%) e Análise Vertical (AV%)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => onSalvar(exercicioAtivo)}
            disabled={salvando}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar {exTargetObj.rotulo}
          </Button>
        </div>
      </div>

      {/* Seletor de Exercício para Edição Rápida */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <span className="text-xs font-semibold text-muted-foreground mr-2">Editar Exercício:</span>
        {(['ano_menos_2', 'ano_menos_1', 'ano_atual'] as const).map((ex) => {
          const rotulo =
            ex === 'ano_menos_2' ? 'Ano -2' : ex === 'ano_menos_1' ? 'Ano -1' : 'Ano Atual'
          const ativo = exercicioAtivo === ex
          return (
            <Button
              key={ex}
              size="sm"
              variant={ativo ? 'default' : 'outline'}
              onClick={() => setExercicioAtivo(ex)}
              className="text-xs"
            >
              {rotulo}
            </Button>
          )
        })}
      </div>

      {/* Alerta de Conferência Patrimonial */}
      {Math.abs(calcTarget.diferencaConferencia) < 0.01 ? (
        <Alert className="border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <AlertTitle className="text-sm font-semibold">
            Conferência Contábil Equilibrada
          </AlertTitle>
          <AlertDescription className="text-xs">
            Ativo Total ({formatarMoeda(calcTarget.ativoTotal)}) = Passivo Exigível + Patrimônio
            Líquido ({formatarMoeda(calcTarget.passivoTotalComPL)}). Diferença: R$ 0,00.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive" className="border-red-500/50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-sm font-semibold">
            Desequilíbrio Contábil Detectado ({exTargetObj.rotulo})
          </AlertTitle>
          <AlertDescription className="text-xs">
            Ativo Total: {formatarMoeda(calcTarget.ativoTotal)} | Passivo + PL:{' '}
            {formatarMoeda(calcTarget.passivoTotalComPL)} | Diferença de Conferência:{' '}
            <strong>{formatarMoeda(calcTarget.diferencaConferencia)}</strong>. Ajuste os lançamentos
            para fechar o balanço.
          </AlertDescription>
        </Alert>
      )}

      {/* TABELA COMPARATIVA DOS 3 EXERCÍCIOS COM AH% E AV% */}
      <Card className="border-border">
        <CardHeader className="py-3 px-4 border-b border-border bg-muted/30">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>Quadro Comparativo de 3 Exercícios Contábeis</span>
            <span className="text-xs font-normal text-muted-foreground">
              AH% calculado sobre Ano -2; AV% sobre o Ativo Total ou Receita Líquida do Ano Atual
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/60 text-muted-foreground border-b border-border text-left">
                <th className="p-2.5 font-semibold">Estrutura Patrimonial & DRE</th>
                <th className="p-2.5 text-right font-semibold">Ano -2</th>
                <th className="p-2.5 text-right font-semibold">Ano -1</th>
                <th className="p-2.5 text-right font-semibold">Ano Atual</th>
                <th className="p-2.5 text-right font-semibold">AH% (Histórico)</th>
                <th className="p-2.5 text-right font-semibold">AV% (Ano Atual)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* ATIVO CIRCULANTE */}
              <tr className="bg-primary/5 font-bold text-primary">
                <td className="p-2">1. ATIVO CIRCULANTE</td>
                <td className="p-2 text-right">{formatarMoeda(calcMenos2.totalAtivoCirculante)}</td>
                <td className="p-2 text-right">{formatarMoeda(calcMenos1.totalAtivoCirculante)}</td>
                <td className="p-2 text-right">{formatarMoeda(calcAtual.totalAtivoCirculante)}</td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAH(calcMenos2.totalAtivoCirculante, calcAtual.totalAtivoCirculante),
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(calcularAV(calcAtual.totalAtivoCirculante, calcAtual.ativoTotal))}
                </td>
              </tr>
              <tr>
                <td className="p-2 pl-6">Caixa e equivalentes de caixa</td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos2.ativoCirculante.caixaEquivalentes)}
                </td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos1.ativoCirculante.caixaEquivalentes)}
                </td>
                <td className="p-2 text-right font-medium">
                  {formatarMoeda(anoAtual.ativoCirculante.caixaEquivalentes)}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAH(
                      anoMenos2.ativoCirculante.caixaEquivalentes,
                      anoAtual.ativoCirculante.caixaEquivalentes,
                    ),
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAV(anoAtual.ativoCirculante.caixaEquivalentes, calcAtual.ativoTotal),
                  )}
                </td>
              </tr>
              <tr>
                <td className="p-2 pl-6">Aplicações financeiras</td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos2.ativoCirculante.aplicacoesFinanceiras)}
                </td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos1.ativoCirculante.aplicacoesFinanceiras)}
                </td>
                <td className="p-2 text-right font-medium">
                  {formatarMoeda(anoAtual.ativoCirculante.aplicacoesFinanceiras)}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAH(
                      anoMenos2.ativoCirculante.aplicacoesFinanceiras,
                      anoAtual.ativoCirculante.aplicacoesFinanceiras,
                    ),
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAV(
                      anoAtual.ativoCirculante.aplicacoesFinanceiras,
                      calcAtual.ativoTotal,
                    ),
                  )}
                </td>
              </tr>
              <tr>
                <td className="p-2 pl-6">Contas a receber de clientes</td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos2.ativoCirculante.contasReceber)}
                </td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos1.ativoCirculante.contasReceber)}
                </td>
                <td className="p-2 text-right font-medium">
                  {formatarMoeda(anoAtual.ativoCirculante.contasReceber)}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAH(
                      anoMenos2.ativoCirculante.contasReceber,
                      anoAtual.ativoCirculante.contasReceber,
                    ),
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAV(anoAtual.ativoCirculante.contasReceber, calcAtual.ativoTotal),
                  )}
                </td>
              </tr>
              <tr>
                <td className="p-2 pl-6">Estoques</td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos2.ativoCirculante.estoques)}
                </td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos1.ativoCirculante.estoques)}
                </td>
                <td className="p-2 text-right font-medium">
                  {formatarMoeda(anoAtual.ativoCirculante.estoques)}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAH(
                      anoMenos2.ativoCirculante.estoques,
                      anoAtual.ativoCirculante.estoques,
                    ),
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(calcularAV(anoAtual.ativoCirculante.estoques, calcAtual.ativoTotal))}
                </td>
              </tr>
              <tr>
                <td className="p-2 pl-6">Tributos a recuperar</td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos2.ativoCirculante.tributosRecuperar)}
                </td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos1.ativoCirculante.tributosRecuperar)}
                </td>
                <td className="p-2 text-right font-medium">
                  {formatarMoeda(anoAtual.ativoCirculante.tributosRecuperar)}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAH(
                      anoMenos2.ativoCirculante.tributosRecuperar,
                      anoAtual.ativoCirculante.tributosRecuperar,
                    ),
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAV(anoAtual.ativoCirculante.tributosRecuperar, calcAtual.ativoTotal),
                  )}
                </td>
              </tr>
              <tr>
                <td className="p-2 pl-6">Outros ativos circulantes</td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos2.ativoCirculante.outrosAtivosCirculantes)}
                </td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos1.ativoCirculante.outrosAtivosCirculantes)}
                </td>
                <td className="p-2 text-right font-medium">
                  {formatarMoeda(anoAtual.ativoCirculante.outrosAtivosCirculantes)}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAH(
                      anoMenos2.ativoCirculante.outrosAtivosCirculantes,
                      anoAtual.ativoCirculante.outrosAtivosCirculantes,
                    ),
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAV(
                      anoAtual.ativoCirculante.outrosAtivosCirculantes,
                      calcAtual.ativoTotal,
                    ),
                  )}
                </td>
              </tr>

              {/* ATIVO NÃO CIRCULANTE */}
              <tr className="bg-primary/5 font-bold text-primary">
                <td className="p-2">2. ATIVO NÃO CIRCULANTE</td>
                <td className="p-2 text-right">
                  {formatarMoeda(calcMenos2.totalAtivoNaoCirculante)}
                </td>
                <td className="p-2 text-right">
                  {formatarMoeda(calcMenos1.totalAtivoNaoCirculante)}
                </td>
                <td className="p-2 text-right">
                  {formatarMoeda(calcAtual.totalAtivoNaoCirculante)}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAH(
                      calcMenos2.totalAtivoNaoCirculante,
                      calcAtual.totalAtivoNaoCirculante,
                    ),
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(calcularAV(calcAtual.totalAtivoNaoCirculante, calcAtual.ativoTotal))}
                </td>
              </tr>
              <tr>
                <td className="p-2 pl-6">Realizável a longo prazo</td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos2.ativoNaoCirculante.realizavelLongoPrazo)}
                </td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos1.ativoNaoCirculante.realizavelLongoPrazo)}
                </td>
                <td className="p-2 text-right font-medium">
                  {formatarMoeda(anoAtual.ativoNaoCirculante.realizavelLongoPrazo)}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAH(
                      anoMenos2.ativoNaoCirculante.realizavelLongoPrazo,
                      anoAtual.ativoNaoCirculante.realizavelLongoPrazo,
                    ),
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAV(
                      anoAtual.ativoNaoCirculante.realizavelLongoPrazo,
                      calcAtual.ativoTotal,
                    ),
                  )}
                </td>
              </tr>
              <tr>
                <td className="p-2 pl-6">Investimentos</td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos2.ativoNaoCirculante.investimentos)}
                </td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos1.ativoNaoCirculante.investimentos)}
                </td>
                <td className="p-2 text-right font-medium">
                  {formatarMoeda(anoAtual.ativoNaoCirculante.investimentos)}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAH(
                      anoMenos2.ativoNaoCirculante.investimentos,
                      anoAtual.ativoNaoCirculante.investimentos,
                    ),
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAV(anoAtual.ativoNaoCirculante.investimentos, calcAtual.ativoTotal),
                  )}
                </td>
              </tr>
              <tr>
                <td className="p-2 pl-6">Imobilizado</td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos2.ativoNaoCirculante.imobilizado)}
                </td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos1.ativoNaoCirculante.imobilizado)}
                </td>
                <td className="p-2 text-right font-medium">
                  {formatarMoeda(anoAtual.ativoNaoCirculante.imobilizado)}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAH(
                      anoMenos2.ativoNaoCirculante.imobilizado,
                      anoAtual.ativoNaoCirculante.imobilizado,
                    ),
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAV(anoAtual.ativoNaoCirculante.imobilizado, calcAtual.ativoTotal),
                  )}
                </td>
              </tr>
              <tr>
                <td className="p-2 pl-6">Intangível</td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos2.ativoNaoCirculante.intangivel)}
                </td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos1.ativoNaoCirculante.intangivel)}
                </td>
                <td className="p-2 text-right font-medium">
                  {formatarMoeda(anoAtual.ativoNaoCirculante.intangivel)}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAH(
                      anoMenos2.ativoNaoCirculante.intangivel,
                      anoAtual.ativoNaoCirculante.intangivel,
                    ),
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAV(anoAtual.ativoNaoCirculante.intangivel, calcAtual.ativoTotal),
                  )}
                </td>
              </tr>

              {/* ATIVO TOTAL */}
              <tr className="bg-primary/15 font-bold text-foreground">
                <td className="p-2.5">ATIVO TOTAL</td>
                <td className="p-2.5 text-right">{formatarMoeda(calcMenos2.ativoTotal)}</td>
                <td className="p-2.5 text-right">{formatarMoeda(calcMenos1.ativoTotal)}</td>
                <td className="p-2.5 text-right">{formatarMoeda(calcAtual.ativoTotal)}</td>
                <td className="p-2.5 text-right">
                  {formatarPct(calcularAH(calcMenos2.ativoTotal, calcAtual.ativoTotal))}
                </td>
                <td className="p-2.5 text-right">100,0%</td>
              </tr>

              {/* PASSIVO CIRCULANTE */}
              <tr className="bg-amber-500/10 font-bold text-amber-900 dark:text-amber-200">
                <td className="p-2">3. PASSIVO CIRCULANTE</td>
                <td className="p-2 text-right">
                  {formatarMoeda(calcMenos2.totalPassivoCirculante)}
                </td>
                <td className="p-2 text-right">
                  {formatarMoeda(calcMenos1.totalPassivoCirculante)}
                </td>
                <td className="p-2 text-right">
                  {formatarMoeda(calcAtual.totalPassivoCirculante)}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAH(calcMenos2.totalPassivoCirculante, calcAtual.totalPassivoCirculante),
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(calcularAV(calcAtual.totalPassivoCirculante, calcAtual.ativoTotal))}
                </td>
              </tr>
              <tr>
                <td className="p-2 pl-6">Fornecedores</td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos2.passivoCirculante.fornecedores)}
                </td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos1.passivoCirculante.fornecedores)}
                </td>
                <td className="p-2 text-right font-medium">
                  {formatarMoeda(anoAtual.passivoCirculante.fornecedores)}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAH(
                      anoMenos2.passivoCirculante.fornecedores,
                      anoAtual.passivoCirculante.fornecedores,
                    ),
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAV(anoAtual.passivoCirculante.fornecedores, calcAtual.ativoTotal),
                  )}
                </td>
              </tr>
              <tr>
                <td className="p-2 pl-6">Empréstimos e financiamentos CP</td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos2.passivoCirculante.emprestimosCP)}
                </td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos1.passivoCirculante.emprestimosCP)}
                </td>
                <td className="p-2 text-right font-medium">
                  {formatarMoeda(anoAtual.passivoCirculante.emprestimosCP)}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAH(
                      anoMenos2.passivoCirculante.emprestimosCP,
                      anoAtual.passivoCirculante.emprestimosCP,
                    ),
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAV(anoAtual.passivoCirculante.emprestimosCP, calcAtual.ativoTotal),
                  )}
                </td>
              </tr>
              <tr>
                <td className="p-2 pl-6">Obrigações trabalhistas</td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos2.passivoCirculante.obrigacoesTrabalhistas)}
                </td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos1.passivoCirculante.obrigacoesTrabalhistas)}
                </td>
                <td className="p-2 text-right font-medium">
                  {formatarMoeda(anoAtual.passivoCirculante.obrigacoesTrabalhistas)}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAH(
                      anoMenos2.passivoCirculante.obrigacoesTrabalhistas,
                      anoAtual.passivoCirculante.obrigacoesTrabalhistas,
                    ),
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAV(
                      anoAtual.passivoCirculante.obrigacoesTrabalhistas,
                      calcAtual.ativoTotal,
                    ),
                  )}
                </td>
              </tr>
              <tr>
                <td className="p-2 pl-6">Obrigações tributárias</td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos2.passivoCirculante.obrigacoesTributarias)}
                </td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos1.passivoCirculante.obrigacoesTributarias)}
                </td>
                <td className="p-2 text-right font-medium">
                  {formatarMoeda(anoAtual.passivoCirculante.obrigacoesTributarias)}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAH(
                      anoMenos2.passivoCirculante.obrigacoesTributarias,
                      anoAtual.passivoCirculante.obrigacoesTributarias,
                    ),
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAV(
                      anoAtual.passivoCirculante.obrigacoesTributarias,
                      calcAtual.ativoTotal,
                    ),
                  )}
                </td>
              </tr>
              <tr>
                <td className="p-2 pl-6">Adiantamentos de clientes / Outras CP</td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(
                    anoMenos2.passivoCirculante.adiantamentosClientes +
                      anoMenos2.passivoCirculante.outrasObrigacoesCP,
                  )}
                </td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(
                    anoMenos1.passivoCirculante.adiantamentosClientes +
                      anoMenos1.passivoCirculante.outrasObrigacoesCP,
                  )}
                </td>
                <td className="p-2 text-right font-medium">
                  {formatarMoeda(
                    anoAtual.passivoCirculante.adiantamentosClientes +
                      anoAtual.passivoCirculante.outrasObrigacoesCP,
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAH(
                      anoMenos2.passivoCirculante.adiantamentosClientes,
                      anoAtual.passivoCirculante.adiantamentosClientes,
                    ),
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAV(
                      anoAtual.passivoCirculante.adiantamentosClientes,
                      calcAtual.ativoTotal,
                    ),
                  )}
                </td>
              </tr>

              {/* PASSIVO NÃO CIRCULANTE */}
              <tr className="bg-amber-500/10 font-bold text-amber-900 dark:text-amber-200">
                <td className="p-2">4. PASSIVO NÃO CIRCULANTE</td>
                <td className="p-2 text-right">
                  {formatarMoeda(calcMenos2.totalPassivoNaoCirculante)}
                </td>
                <td className="p-2 text-right">
                  {formatarMoeda(calcMenos1.totalPassivoNaoCirculante)}
                </td>
                <td className="p-2 text-right">
                  {formatarMoeda(calcAtual.totalPassivoNaoCirculante)}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAH(
                      calcMenos2.totalPassivoNaoCirculante,
                      calcAtual.totalPassivoNaoCirculante,
                    ),
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAV(calcAtual.totalPassivoNaoCirculante, calcAtual.ativoTotal),
                  )}
                </td>
              </tr>
              <tr>
                <td className="p-2 pl-6">Empréstimos e financiamentos LP</td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos2.passivoNaoCirculante.emprestimosLP)}
                </td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos1.passivoNaoCirculante.emprestimosLP)}
                </td>
                <td className="p-2 text-right font-medium">
                  {formatarMoeda(anoAtual.passivoNaoCirculante.emprestimosLP)}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAH(
                      anoMenos2.passivoNaoCirculante.emprestimosLP,
                      anoAtual.passivoNaoCirculante.emprestimosLP,
                    ),
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAV(anoAtual.passivoNaoCirculante.emprestimosLP, calcAtual.ativoTotal),
                  )}
                </td>
              </tr>
              <tr>
                <td className="p-2 pl-6">Provisões (CPC 25)</td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos2.passivoNaoCirculante.provisoesCPC25)}
                </td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos1.passivoNaoCirculante.provisoesCPC25)}
                </td>
                <td className="p-2 text-right font-medium">
                  {formatarMoeda(anoAtual.passivoNaoCirculante.provisoesCPC25)}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAH(
                      anoMenos2.passivoNaoCirculante.provisoesCPC25,
                      anoAtual.passivoNaoCirculante.provisoesCPC25,
                    ),
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAV(anoAtual.passivoNaoCirculante.provisoesCPC25, calcAtual.ativoTotal),
                  )}
                </td>
              </tr>
              <tr>
                <td className="p-2 pl-6">Tributos parcelados e outras LP</td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(
                    anoMenos2.passivoNaoCirculante.tributosParcelados +
                      anoMenos2.passivoNaoCirculante.outrasObrigacoesLP,
                  )}
                </td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(
                    anoMenos1.passivoNaoCirculante.tributosParcelados +
                      anoMenos1.passivoNaoCirculante.outrasObrigacoesLP,
                  )}
                </td>
                <td className="p-2 text-right font-medium">
                  {formatarMoeda(
                    anoAtual.passivoNaoCirculante.tributosParcelados +
                      anoAtual.passivoNaoCirculante.outrasObrigacoesLP,
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAH(
                      anoMenos2.passivoNaoCirculante.tributosParcelados,
                      anoAtual.passivoNaoCirculante.tributosParcelados,
                    ),
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAV(
                      anoAtual.passivoNaoCirculante.tributosParcelados,
                      calcAtual.ativoTotal,
                    ),
                  )}
                </td>
              </tr>

              {/* PATRIMÔNIO LÍQUIDO */}
              <tr className="bg-emerald-500/10 font-bold text-emerald-900 dark:text-emerald-200">
                <td className="p-2">5. PATRIMÔNIO LÍQUIDO (PL)</td>
                <td className="p-2 text-right">
                  {formatarMoeda(calcMenos2.totalPatrimonioLiquido)}
                </td>
                <td className="p-2 text-right">
                  {formatarMoeda(calcMenos1.totalPatrimonioLiquido)}
                </td>
                <td className="p-2 text-right">
                  {formatarMoeda(calcAtual.totalPatrimonioLiquido)}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAH(calcMenos2.totalPatrimonioLiquido, calcAtual.totalPatrimonioLiquido),
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(calcularAV(calcAtual.totalPatrimonioLiquido, calcAtual.ativoTotal))}
                </td>
              </tr>
              <tr>
                <td className="p-2 pl-6">Capital social</td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos2.patrimonioLiquido.capitalSocial)}
                </td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos1.patrimonioLiquido.capitalSocial)}
                </td>
                <td className="p-2 text-right font-medium">
                  {formatarMoeda(anoAtual.patrimonioLiquido.capitalSocial)}
                </td>
                <td className="p-2 text-right">—</td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAV(anoAtual.patrimonioLiquido.capitalSocial, calcAtual.ativoTotal),
                  )}
                </td>
              </tr>
              <tr>
                <td className="p-2 pl-6">Reservas de lucros / Ajustes</td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(
                    anoMenos2.patrimonioLiquido.reservasLucros +
                      anoMenos2.patrimonioLiquido.ajustesAvaliacaoPatrimonial,
                  )}
                </td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(
                    anoMenos1.patrimonioLiquido.reservasLucros +
                      anoMenos1.patrimonioLiquido.ajustesAvaliacaoPatrimonial,
                  )}
                </td>
                <td className="p-2 text-right font-medium">
                  {formatarMoeda(
                    anoAtual.patrimonioLiquido.reservasLucros +
                      anoAtual.patrimonioLiquido.ajustesAvaliacaoPatrimonial,
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAH(
                      anoMenos2.patrimonioLiquido.reservasLucros,
                      anoAtual.patrimonioLiquido.reservasLucros,
                    ),
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAV(anoAtual.patrimonioLiquido.reservasLucros, calcAtual.ativoTotal),
                  )}
                </td>
              </tr>
              <tr>
                <td className="p-2 pl-6">Prejuízos acumulados</td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos2.patrimonioLiquido.prejuizosAcumulados)}
                </td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos1.patrimonioLiquido.prejuizosAcumulados)}
                </td>
                <td className="p-2 text-right font-medium">
                  {formatarMoeda(anoAtual.patrimonioLiquido.prejuizosAcumulados)}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAH(
                      anoMenos2.patrimonioLiquido.prejuizosAcumulados,
                      anoAtual.patrimonioLiquido.prejuizosAcumulados,
                    ),
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAV(
                      anoAtual.patrimonioLiquido.prejuizosAcumulados,
                      calcAtual.ativoTotal,
                    ),
                  )}
                </td>
              </tr>

              {/* CONFERÊNCIA */}
              <tr className="bg-muted font-bold text-foreground">
                <td className="p-2.5">PASSIVO TOTAL + PL</td>
                <td className="p-2.5 text-right">{formatarMoeda(calcMenos2.passivoTotalComPL)}</td>
                <td className="p-2.5 text-right">{formatarMoeda(calcMenos1.passivoTotalComPL)}</td>
                <td className="p-2.5 text-right">{formatarMoeda(calcAtual.passivoTotalComPL)}</td>
                <td className="p-2.5 text-right">
                  {formatarPct(
                    calcularAH(calcMenos2.passivoTotalComPL, calcAtual.passivoTotalComPL),
                  )}
                </td>
                <td className="p-2.5 text-right">100,0%</td>
              </tr>

              {/* DRE */}
              <tr className="bg-blue-500/10 font-bold text-blue-900 dark:text-blue-200">
                <td className="p-2" colSpan={6}>
                  DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO (DRE)
                </td>
              </tr>
              <tr>
                <td className="p-2 pl-6">Receita bruta de vendas</td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos2.dre.receitaBruta)}
                </td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos1.dre.receitaBruta)}
                </td>
                <td className="p-2 text-right font-medium">
                  {formatarMoeda(anoAtual.dre.receitaBruta)}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(calcularAH(anoMenos2.dre.receitaBruta, anoAtual.dre.receitaBruta))}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(calcularAV(anoAtual.dre.receitaBruta, calcAtual.receitaLiquida))}
                </td>
              </tr>
              <tr>
                <td className="p-2 pl-6">(-) Deduções e impostos sobre vendas</td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos2.dre.deducoesImpostos)}
                </td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos1.dre.deducoesImpostos)}
                </td>
                <td className="p-2 text-right font-medium">
                  {formatarMoeda(anoAtual.dre.deducoesImpostos)}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAH(anoMenos2.dre.deducoesImpostos, anoAtual.dre.deducoesImpostos),
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(calcularAV(anoAtual.dre.deducoesImpostos, calcAtual.receitaLiquida))}
                </td>
              </tr>
              <tr className="font-bold bg-muted/40">
                <td className="p-2 pl-6">(=) Receita líquida de vendas</td>
                <td className="p-2 text-right">{formatarMoeda(calcMenos2.receitaLiquida)}</td>
                <td className="p-2 text-right">{formatarMoeda(calcMenos1.receitaLiquida)}</td>
                <td className="p-2 text-right">{formatarMoeda(calcAtual.receitaLiquida)}</td>
                <td className="p-2 text-right">
                  {formatarPct(calcularAH(calcMenos2.receitaLiquida, calcAtual.receitaLiquida))}
                </td>
                <td className="p-2 text-right">100,0%</td>
              </tr>
              <tr>
                <td className="p-2 pl-6">(-) Custo das Mercadorias/Serviços (CMV)</td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos2.dre.cmv)}
                </td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos1.dre.cmv)}
                </td>
                <td className="p-2 text-right font-medium">{formatarMoeda(anoAtual.dre.cmv)}</td>
                <td className="p-2 text-right">
                  {formatarPct(calcularAH(anoMenos2.dre.cmv, anoAtual.dre.cmv))}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(calcularAV(anoAtual.dre.cmv, calcAtual.receitaLiquida))}
                </td>
              </tr>
              <tr className="font-bold bg-muted/40">
                <td className="p-2 pl-6">(=) Lucro Bruto</td>
                <td className="p-2 text-right">{formatarMoeda(calcMenos2.lucroBruto)}</td>
                <td className="p-2 text-right">{formatarMoeda(calcMenos1.lucroBruto)}</td>
                <td className="p-2 text-right">{formatarMoeda(calcAtual.lucroBruto)}</td>
                <td className="p-2 text-right">
                  {formatarPct(calcularAH(calcMenos2.lucroBruto, calcAtual.lucroBruto))}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(calcularAV(calcAtual.lucroBruto, calcAtual.receitaLiquida))}
                </td>
              </tr>
              <tr>
                <td className="p-2 pl-6">(-) Despesas com vendas</td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos2.dre.despesasVendas)}
                </td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos1.dre.despesasVendas)}
                </td>
                <td className="p-2 text-right font-medium">
                  {formatarMoeda(anoAtual.dre.despesasVendas)}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAH(anoMenos2.dre.despesasVendas, anoAtual.dre.despesasVendas),
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(calcularAV(anoAtual.dre.despesasVendas, calcAtual.receitaLiquida))}
                </td>
              </tr>
              <tr>
                <td className="p-2 pl-6">(-) Despesas gerais e administrativas</td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos2.dre.despesasAdministrativas)}
                </td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos1.dre.despesasAdministrativas)}
                </td>
                <td className="p-2 text-right font-medium">
                  {formatarMoeda(anoAtual.dre.despesasAdministrativas)}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAH(
                      anoMenos2.dre.despesasAdministrativas,
                      anoAtual.dre.despesasAdministrativas,
                    ),
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAV(anoAtual.dre.despesasAdministrativas, calcAtual.receitaLiquida),
                  )}
                </td>
              </tr>
              <tr className="font-bold bg-muted/40">
                <td className="p-2 pl-6">(=) EBIT (Resultado Operacional)</td>
                <td className="p-2 text-right">{formatarMoeda(calcMenos2.ebit)}</td>
                <td className="p-2 text-right">{formatarMoeda(calcMenos1.ebit)}</td>
                <td className="p-2 text-right">{formatarMoeda(calcAtual.ebit)}</td>
                <td className="p-2 text-right">
                  {formatarPct(calcularAH(calcMenos2.ebit, calcAtual.ebit))}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(calcularAV(calcAtual.ebit, calcAtual.receitaLiquida))}
                </td>
              </tr>
              <tr className="font-bold bg-emerald-500/10 text-emerald-900 dark:text-emerald-100">
                <td className="p-2 pl-6">(=) EBITDA (Geração Operacional de Caixa)</td>
                <td className="p-2 text-right">{formatarMoeda(calcMenos2.ebitda)}</td>
                <td className="p-2 text-right">{formatarMoeda(calcMenos1.ebitda)}</td>
                <td className="p-2 text-right">{formatarMoeda(calcAtual.ebitda)}</td>
                <td className="p-2 text-right">
                  {formatarPct(calcularAH(calcMenos2.ebitda, calcAtual.ebitda))}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(calcularAV(calcAtual.ebitda, calcAtual.receitaLiquida))}
                </td>
              </tr>
              <tr>
                <td className="p-2 pl-6">(+/-) Resultado financeiro líquido</td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos2.dre.resultadoFinanceiro)}
                </td>
                <td className="p-2 text-right text-muted-foreground">
                  {formatarMoeda(anoMenos1.dre.resultadoFinanceiro)}
                </td>
                <td className="p-2 text-right font-medium">
                  {formatarMoeda(anoAtual.dre.resultadoFinanceiro)}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAH(anoMenos2.dre.resultadoFinanceiro, anoAtual.dre.resultadoFinanceiro),
                  )}
                </td>
                <td className="p-2 text-right">
                  {formatarPct(
                    calcularAV(anoAtual.dre.resultadoFinanceiro, calcAtual.receitaLiquida),
                  )}
                </td>
              </tr>
              <tr className="font-bold bg-primary/20 text-primary">
                <td className="p-2.5 pl-6">(=) LUCRO LÍQUIDO DO EXERCÍCIO</td>
                <td className="p-2.5 text-right">{formatarMoeda(calcMenos2.lucroLiquido)}</td>
                <td className="p-2.5 text-right">{formatarMoeda(calcMenos1.lucroLiquido)}</td>
                <td className="p-2.5 text-right">{formatarMoeda(calcAtual.lucroLiquido)}</td>
                <td className="p-2.5 text-right">
                  {formatarPct(calcularAH(calcMenos2.lucroLiquido, calcAtual.lucroLiquido))}
                </td>
                <td className="p-2.5 text-right">
                  {formatarPct(calcularAV(calcAtual.lucroLiquido, calcAtual.receitaLiquida))}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* FORMULÁRIO DE ENTRADA / EDIÇÃO MANUAL DO EXERCÍCIO ATIVO */}
      <Card className="border-border">
        <CardHeader className="py-3 px-4 border-b border-border bg-muted/20">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>Formulário de Entrada Manual — {exTargetObj.rotulo}</span>
            <Badge variant="outline" className="text-xs">
              Valores em R$ (Reais)
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-6">
          {/* Linha 1: Ativo Circulante */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">
              1. Contas do Ativo Circulante
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  Caixa e Equivalentes
                </label>
                <Input
                  type="number"
                  step="any"
                  value={exTargetObj.ativoCirculante.caixaEquivalentes || ''}
                  onChange={(e) =>
                    atualizarCampo(
                      exercicioAtivo,
                      'ativoCirculante',
                      'caixaEquivalentes',
                      e.target.value,
                    )
                  }
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  Aplicações Fin.
                </label>
                <Input
                  type="number"
                  step="any"
                  value={exTargetObj.ativoCirculante.aplicacoesFinanceiras || ''}
                  onChange={(e) =>
                    atualizarCampo(
                      exercicioAtivo,
                      'ativoCirculante',
                      'aplicacoesFinanceiras',
                      e.target.value,
                    )
                  }
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  Contas a Receber
                </label>
                <Input
                  type="number"
                  step="any"
                  value={exTargetObj.ativoCirculante.contasReceber || ''}
                  onChange={(e) =>
                    atualizarCampo(
                      exercicioAtivo,
                      'ativoCirculante',
                      'contasReceber',
                      e.target.value,
                    )
                  }
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  Estoques
                </label>
                <Input
                  type="number"
                  step="any"
                  value={exTargetObj.ativoCirculante.estoques || ''}
                  onChange={(e) =>
                    atualizarCampo(exercicioAtivo, 'ativoCirculante', 'estoques', e.target.value)
                  }
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  Tributos Recuperar
                </label>
                <Input
                  type="number"
                  step="any"
                  value={exTargetObj.ativoCirculante.tributosRecuperar || ''}
                  onChange={(e) =>
                    atualizarCampo(
                      exercicioAtivo,
                      'ativoCirculante',
                      'tributosRecuperar',
                      e.target.value,
                    )
                  }
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  Outros Ativos CP
                </label>
                <Input
                  type="number"
                  step="any"
                  value={exTargetObj.ativoCirculante.outrosAtivosCirculantes || ''}
                  onChange={(e) =>
                    atualizarCampo(
                      exercicioAtivo,
                      'ativoCirculante',
                      'outrosAtivosCirculantes',
                      e.target.value,
                    )
                  }
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Linha 2: Ativo Não Circulante & Passivo Circulante */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-border">
            <div>
              <h4 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">
                2. Ativo Não Circulante
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    Realizável LP
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={exTargetObj.ativoNaoCirculante.realizavelLongoPrazo || ''}
                    onChange={(e) =>
                      atualizarCampo(
                        exercicioAtivo,
                        'ativoNaoCirculante',
                        'realizavelLongoPrazo',
                        e.target.value,
                      )
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    Investimentos
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={exTargetObj.ativoNaoCirculante.investimentos || ''}
                    onChange={(e) =>
                      atualizarCampo(
                        exercicioAtivo,
                        'ativoNaoCirculante',
                        'investimentos',
                        e.target.value,
                      )
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    Imobilizado
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={exTargetObj.ativoNaoCirculante.imobilizado || ''}
                    onChange={(e) =>
                      atualizarCampo(
                        exercicioAtivo,
                        'ativoNaoCirculante',
                        'imobilizado',
                        e.target.value,
                      )
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    Intangível
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={exTargetObj.ativoNaoCirculante.intangivel || ''}
                    onChange={(e) =>
                      atualizarCampo(
                        exercicioAtivo,
                        'ativoNaoCirculante',
                        'intangivel',
                        e.target.value,
                      )
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">
                3. Passivo Circulante
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    Fornecedores
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={exTargetObj.passivoCirculante.fornecedores || ''}
                    onChange={(e) =>
                      atualizarCampo(
                        exercicioAtivo,
                        'passivoCirculante',
                        'fornecedores',
                        e.target.value,
                      )
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    Empréstimos CP
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={exTargetObj.passivoCirculante.emprestimosCP || ''}
                    onChange={(e) =>
                      atualizarCampo(
                        exercicioAtivo,
                        'passivoCirculante',
                        'emprestimosCP',
                        e.target.value,
                      )
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    Obrig. Trabalhistas
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={exTargetObj.passivoCirculante.obrigacoesTrabalhistas || ''}
                    onChange={(e) =>
                      atualizarCampo(
                        exercicioAtivo,
                        'passivoCirculante',
                        'obrigacoesTrabalhistas',
                        e.target.value,
                      )
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    Obrig. Tributárias
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={exTargetObj.passivoCirculante.obrigacoesTributarias || ''}
                    onChange={(e) =>
                      atualizarCampo(
                        exercicioAtivo,
                        'passivoCirculante',
                        'obrigacoesTributarias',
                        e.target.value,
                      )
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Linha 3: Passivo Não Circulante & Patrimônio Líquido */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-border">
            <div>
              <h4 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">
                4. Passivo Não Circulante
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    Empréstimos LP
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={exTargetObj.passivoNaoCirculante.emprestimosLP || ''}
                    onChange={(e) =>
                      atualizarCampo(
                        exercicioAtivo,
                        'passivoNaoCirculante',
                        'emprestimosLP',
                        e.target.value,
                      )
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    Provisões CPC 25
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={exTargetObj.passivoNaoCirculante.provisoesCPC25 || ''}
                    onChange={(e) =>
                      atualizarCampo(
                        exercicioAtivo,
                        'passivoNaoCirculante',
                        'provisoesCPC25',
                        e.target.value,
                      )
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    Tributos Parcelados
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={exTargetObj.passivoNaoCirculante.tributosParcelados || ''}
                    onChange={(e) =>
                      atualizarCampo(
                        exercicioAtivo,
                        'passivoNaoCirculante',
                        'tributosParcelados',
                        e.target.value,
                      )
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    Outras Obrig. LP
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={exTargetObj.passivoNaoCirculante.outrasObrigacoesLP || ''}
                    onChange={(e) =>
                      atualizarCampo(
                        exercicioAtivo,
                        'passivoNaoCirculante',
                        'outrasObrigacoesLP',
                        e.target.value,
                      )
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">
                5. Patrimônio Líquido (PL)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    Capital Social
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={exTargetObj.patrimonioLiquido.capitalSocial || ''}
                    onChange={(e) =>
                      atualizarCampo(
                        exercicioAtivo,
                        'patrimonioLiquido',
                        'capitalSocial',
                        e.target.value,
                      )
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    Reservas de Lucros
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={exTargetObj.patrimonioLiquido.reservasLucros || ''}
                    onChange={(e) =>
                      atualizarCampo(
                        exercicioAtivo,
                        'patrimonioLiquido',
                        'reservasLucros',
                        e.target.value,
                      )
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    Ajustes Patrimoniais
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={exTargetObj.patrimonioLiquido.ajustesAvaliacaoPatrimonial || ''}
                    onChange={(e) =>
                      atualizarCampo(
                        exercicioAtivo,
                        'patrimonioLiquido',
                        'ajustesAvaliacaoPatrimonial',
                        e.target.value,
                      )
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    Prejuízos Acumulados
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={exTargetObj.patrimonioLiquido.prejuizosAcumulados || ''}
                    onChange={(e) =>
                      atualizarCampo(
                        exercicioAtivo,
                        'patrimonioLiquido',
                        'prejuizosAcumulados',
                        e.target.value,
                      )
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Linha 4: DRE e Dados Complementares */}
          <div className="pt-2 border-t border-border">
            <h4 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">
              6. Demonstração do Resultado (DRE) & Complementares
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  Receita Bruta
                </label>
                <Input
                  type="number"
                  step="any"
                  value={exTargetObj.dre.receitaBruta || ''}
                  onChange={(e) =>
                    atualizarCampo(exercicioAtivo, 'dre', 'receitaBruta', e.target.value)
                  }
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  (-) Deduções/Impostos
                </label>
                <Input
                  type="number"
                  step="any"
                  value={exTargetObj.dre.deducoesImpostos || ''}
                  onChange={(e) =>
                    atualizarCampo(exercicioAtivo, 'dre', 'deducoesImpostos', e.target.value)
                  }
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  (-) CMV (Custos)
                </label>
                <Input
                  type="number"
                  step="any"
                  value={exTargetObj.dre.cmv || ''}
                  onChange={(e) => atualizarCampo(exercicioAtivo, 'dre', 'cmv', e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  (-) Desp. Vendas
                </label>
                <Input
                  type="number"
                  step="any"
                  value={exTargetObj.dre.despesasVendas || ''}
                  onChange={(e) =>
                    atualizarCampo(exercicioAtivo, 'dre', 'despesasVendas', e.target.value)
                  }
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  (-) Desp. Administrativas
                </label>
                <Input
                  type="number"
                  step="any"
                  value={exTargetObj.dre.despesasAdministrativas || ''}
                  onChange={(e) =>
                    atualizarCampo(exercicioAtivo, 'dre', 'despesasAdministrativas', e.target.value)
                  }
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  Depreciação/Amortização
                </label>
                <Input
                  type="number"
                  step="any"
                  value={exTargetObj.dre.depreciacaoAmortizacao || ''}
                  onChange={(e) =>
                    atualizarCampo(exercicioAtivo, 'dre', 'depreciacaoAmortizacao', e.target.value)
                  }
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  Resultado Financeiro
                </label>
                <Input
                  type="number"
                  step="any"
                  value={exTargetObj.dre.resultadoFinanceiro || ''}
                  onChange={(e) =>
                    atualizarCampo(exercicioAtivo, 'dre', 'resultadoFinanceiro', e.target.value)
                  }
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  IR e CSLL
                </label>
                <Input
                  type="number"
                  step="any"
                  value={exTargetObj.dre.irCsll || ''}
                  onChange={(e) => atualizarCampo(exercicioAtivo, 'dre', 'irCsll', e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  CAPEX (Investimentos)
                </label>
                <Input
                  type="number"
                  step="any"
                  value={exTargetObj.complementares.capex || ''}
                  onChange={(e) =>
                    atualizarCampo(exercicioAtivo, 'complementares', 'capex', e.target.value)
                  }
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  Despesas de Juros
                </label>
                <Input
                  type="number"
                  step="any"
                  value={exTargetObj.complementares.despesaJuros || ''}
                  onChange={(e) =>
                    atualizarCampo(exercicioAtivo, 'complementares', 'despesaJuros', e.target.value)
                  }
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  Amortização de Dívidas
                </label>
                <Input
                  type="number"
                  step="any"
                  value={exTargetObj.complementares.amortizacaoDividas || ''}
                  onChange={(e) =>
                    atualizarCampo(
                      exercicioAtivo,
                      'complementares',
                      'amortizacaoDividas',
                      e.target.value,
                    )
                  }
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  Compras de Insumos
                </label>
                <Input
                  type="number"
                  step="any"
                  value={exTargetObj.complementares.compras || ''}
                  onChange={(e) =>
                    atualizarCampo(exercicioAtivo, 'complementares', 'compras', e.target.value)
                  }
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
