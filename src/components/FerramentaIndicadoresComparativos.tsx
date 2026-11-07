import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, HelpCircle } from 'lucide-react'
import type { ItemIndicador, StatusSemaforo } from '@/types/analisesEmpresariaisModel'

interface Props {
  indicadores: ItemIndicador[]
  clienteNome: string
  exercicioRotulo?: string
}

export const FerramentaIndicadoresComparativos: React.FC<Props> = ({
  indicadores,
  clienteNome,
  exercicioRotulo = 'Ano Atual',
}) => {
  const getSemaforoBadge = (status: StatusSemaforo) => {
    switch (status) {
      case 'saudavel':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Saudável
          </Badge>
        )
      case 'atencao':
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 flex items-center gap-1 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Atenção
          </Badge>
        )
      case 'critico':
        return (
          <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30 flex items-center gap-1 font-semibold">
            <XCircle className="w-3.5 h-3.5 text-red-500" />
            Crítico
          </Badge>
        )
    }
  }

  const formatarValor = (indicador: ItemIndicador) => {
    const val = indicador.valor
    if (indicador.unidade === 'moeda') {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
    }
    if (indicador.unidade === 'percentual') {
      return `${val.toFixed(2)}%`
    }
    if (indicador.unidade === 'dias') {
      return `${val.toFixed(0)} dias`
    }
    return `${val.toFixed(2)}x`
  }

  // Agrupamento por dimensões para leitura executiva
  const grupos = [
    {
      titulo: '1. Índices de Liquidez (Capacidade de Pagamento)',
      ids: ['liq_corrente', 'liq_seca', 'liq_imediata', 'liq_geral', 'ccl'],
    },
    {
      titulo: '2. Estrutura de Capital & Endividamento',
      ids: [
        'pct',
        'comp_endividamento',
        'grau_endividamento',
        'divida_liquida',
        'div_liq_ebitda',
        'div_liq_pl',
      ],
    },
    {
      titulo: '3. Rentabilidade & Retorno',
      ids: ['margem_bruta', 'margem_ebitda', 'margem_operacional', 'margem_liquida', 'roa', 'roe'],
    },
    {
      titulo: '4. Atividade & Ciclos Operacionais',
      ids: ['giro_ativo', 'pmr', 'pmp', 'pme', 'ciclo_operacional', 'ciclo_financeiro'],
    },
    {
      titulo: '5. Cobertura de Dívida & Investimentos',
      ids: ['dscr', 'capex_receita'],
    },
  ]

  const totalSaudavel = indicadores.filter((i) => i.semaforo === 'saudavel').length
  const totalAtencao = indicadores.filter((i) => i.semaforo === 'atencao').length
  const totalCritico = indicadores.filter((i) => i.semaforo === 'critico').length

  return (
    <div className="space-y-6">
      {/* Resumo do Semáforo */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-border p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Indicadores Monitorados</p>
            <h4 className="text-2xl font-bold mt-1 text-foreground">25 Indicadores</h4>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Metodologia ADECONT / {exercicioRotulo} ({clienteNome})
          </p>
        </Card>
        <Card className="border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 p-4">
          <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Nível Saudável
          </p>
          <h4 className="text-2xl font-bold mt-1 text-emerald-700 dark:text-emerald-400">
            {totalSaudavel} / 25
          </h4>
          <p className="text-[11px] text-emerald-600/80 mt-1">Conformes com a referência</p>
        </Card>
        <Card className="border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/20 p-4">
          <p className="text-xs text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Nível de Atenção
          </p>
          <h4 className="text-2xl font-bold mt-1 text-amber-700 dark:text-amber-400">
            {totalAtencao} / 25
          </h4>
          <p className="text-[11px] text-amber-600/80 mt-1">Margem próxima ao limite</p>
        </Card>
        <Card className="border-red-500/30 bg-red-50/30 dark:bg-red-950/20 p-4">
          <p className="text-xs text-red-800 dark:text-red-300 font-medium flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-red-600" />
            Nível Crítico
          </p>
          <h4 className="text-2xl font-bold mt-1 text-red-700 dark:text-red-400">
            {totalCritico} / 25
          </h4>
          <p className="text-[11px] text-red-600/80 mt-1">Exige intervenção imediata</p>
        </Card>
      </div>

      {/* Tabelas por Grupos */}
      {grupos.map((grupo) => {
        const itensGrupo = grupo.ids
          .map((id) => indicadores.find((i) => i.id === id))
          .filter(Boolean) as ItemIndicador[]

        if (itensGrupo.length === 0) return null

        return (
          <Card key={grupo.titulo} className="border-border">
            <CardHeader className="py-2.5 px-4 border-b border-border bg-muted/20">
              <CardTitle className="text-xs font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                {grupo.titulo}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground border-b border-border text-left">
                    <th className="p-2.5 font-semibold">Indicador</th>
                    <th className="p-2.5 font-semibold hidden md:table-cell">Fórmula Aplicada</th>
                    <th className="p-2.5 text-center font-semibold">Referência</th>
                    <th className="p-2.5 text-right font-semibold">Valor Apurado</th>
                    <th className="p-2.5 text-center font-semibold">Semáforo</th>
                    <th className="p-2.5 font-semibold hidden lg:table-cell">Diagnóstico Rápido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {itensGrupo.map((ind) => (
                    <tr key={ind.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-2.5 font-medium text-foreground">{ind.nome}</td>
                      <td className="p-2.5 text-muted-foreground font-mono text-[11px] hidden md:table-cell">
                        {ind.formula}
                      </td>
                      <td className="p-2.5 text-center font-medium text-muted-foreground">
                        {ind.referencia}
                      </td>
                      <td className="p-2.5 text-right font-bold text-foreground font-mono">
                        {formatarValor(ind)}
                      </td>
                      <td className="p-2.5 text-center">{getSemaforoBadge(ind.semaforo)}</td>
                      <td className="p-2.5 text-muted-foreground text-[11px] hidden lg:table-cell max-w-xs truncate">
                        {ind.explicacao}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
