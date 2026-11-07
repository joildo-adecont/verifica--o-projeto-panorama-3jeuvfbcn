import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Building2,
  Calendar,
} from 'lucide-react'
import {
  gerarRelatorioComparativo,
  calcularTotaisExercicio,
  calcularIndicadoresExercicio,
} from '@/services/motorAnaliseEmpresarial'
import type { EmpresaRecord } from '@/types/cadastroEmpresas'
import type { AnaliseBalanco3Exercicios, ItemIndicador } from '@/types/analisesEmpresariaisModel'

interface Props {
  clienteAtual: EmpresaRecord
  listaClientes: EmpresaRecord[]
  balancoAtual: AnaliseBalanco3Exercicios
  carregarBalancoOutroCliente: (cnpj: string) => Promise<AnaliseBalanco3Exercicios | null>
}

export const FerramentaRelatorioComparativo: React.FC<Props> = ({
  clienteAtual,
  listaClientes,
  balancoAtual,
  carregarBalancoOutroCliente,
}) => {
  const [modoComparacao, setModoComparacao] = useState<'exercicios' | 'dois_clientes'>('exercicios')
  const [cnpjOutroCliente, setCnpjOutroCliente] = useState<string>('')
  const [balancoOutroCliente, setBalancoOutroCliente] = useState<AnaliseBalanco3Exercicios | null>(
    null,
  )
  const [carregandoOutro, setCarregandoOutro] = useState(false)

  // Opção A: Comparação entre exercícios do MESMO cliente (Ano -1 vs Ano Atual)
  const calcMenos1 = calcularTotaisExercicio(balancoAtual.anoMenos1)
  const calcAtual = calcularTotaisExercicio(balancoAtual.anoAtual)

  const indMenos1 = calcularIndicadoresExercicio(balancoAtual.anoMenos1)
  const indAtual = calcularIndicadoresExercicio(balancoAtual.anoAtual)

  // Opção B: Comparação entre DOIS clientes (Ano Atual de ambos)
  const handleSelecionarOutroCliente = async (cnpj: string) => {
    setCnpjOutroCliente(cnpj)
    setCarregandoOutro(true)
    const dados = await carregarBalancoOutroCliente(cnpj)
    setBalancoOutroCliente(dados)
    setCarregandoOutro(false)
  }

  const clienteDoc = (c: EmpresaRecord) => c.documento_limpo || c.numero_documento || ''
  const clienteB = listaClientes.find((c) => clienteDoc(c) === cnpjOutroCliente)

  let rotuloA = `${clienteAtual.razao_social || clienteAtual.nome || 'Cliente Atual'} (Ano Atual)`
  let rotuloB = `${clienteAtual.razao_social || clienteAtual.nome || 'Cliente Atual'} (Ano -1)`
  let exA = balancoAtual.anoAtual
  let exB = balancoAtual.anoMenos1

  if (modoComparacao === 'dois_clientes' && balancoOutroCliente && clienteB) {
    rotuloA = clienteAtual.razao_social || clienteAtual.nome || 'Cliente A'
    rotuloB = clienteB.razao_social || clienteB.nome || 'Cliente B'
    exA = balancoAtual.anoAtual
    exB = balancoOutroCliente.anoAtual
  }

  const totaisA = calcularTotaisBalancoDRE(exA)
  const totaisB = calcularTotaisBalancoDRE(exB)
  const indA = calcular25Indicadores(exA)
  const indB = calcular25Indicadores(exB)

  // Gera relatório comparativo estruturado (5 blocos do modelo)
  const relatorio = gerarRelatorioComparativo(rotuloA, rotuloB, totaisA, totaisB, indA, indB)

  const formatarValorQuadro = (item: string, val: number) => {
    if (
      item.includes('Receita') ||
      item.includes('EBITDA') ||
      item.includes('Lucro') ||
      item.includes('Ativo') ||
      item.includes('Patrimônio') ||
      item.includes('Dívida')
    ) {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
    }
    if (item.includes('Margem') || item.includes('ROE')) {
      return `${val.toFixed(2)}%`
    }
    if (item.includes('Ciclo')) {
      return `${val.toFixed(0)} dias`
    }
    return `${val.toFixed(2)}x`
  }

  return (
    <div className="space-y-6">
      {/* Controles de Modo de Comparação */}
      <Card className="border-border p-4 bg-muted/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
              Modo de Análise Comparativa (Metodologia ADECONT)
            </h4>
            <p className="text-xs text-muted-foreground">
              Compare a evolução temporal do cliente ou o benchmark com outra empresa da sua
              carteira.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={modoComparacao === 'exercicios' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setModoComparacao('exercicios')}
              className="text-xs h-8"
            >
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              Evolução Temporal (Ano Atual vs Ano -1)
            </Button>
            <Button
              variant={modoComparacao === 'dois_clientes' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setModoComparacao('dois_clientes')}
              className="text-xs h-8"
            >
              <Building2 className="w-3.5 h-3.5 mr-1.5" />
              Dois Clientes Lado a Lado
            </Button>
          </div>
        </div>

        {modoComparacao === 'dois_clientes' && (
          <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-xs font-semibold text-foreground">
              Selecionar 2º Cliente para confronto:
            </span>
            <div className="w-full sm:w-80">
              <Select value={cnpjOutroCliente} onValueChange={handleSelecionarOutroCliente}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Escolha um cliente da carteira..." />
                </SelectTrigger>
                <SelectContent>
                  {listaClientes
                    .filter((c) => clienteDoc(c) !== clienteDoc(clienteAtual))
                    .map((cli) => (
                      <SelectItem key={clienteDoc(cli)} value={clienteDoc(cli)} className="text-xs">
                        {cli.razao_social || cli.nome} ({clienteDoc(cli)})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {carregandoOutro && (
              <span className="text-xs text-muted-foreground animate-pulse">
                Carregando dados...
              </span>
            )}
          </div>
        )}
      </Card>

      {/* BLOCO 1: QUADRO-RESUMO */}
      <Card className="border-border">
        <CardHeader className="py-2.5 px-4 border-b border-border bg-muted/20">
          <CardTitle className="text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              BLOCO 1 — Quadro-Resumo de Indicadores Críticos
            </span>
            <Badge variant="outline" className="text-[10px]">
              Vantagem por Métrica
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground border-b border-border text-left">
                <th className="p-2.5 font-semibold">Métrica Chave</th>
                <th className="p-2.5 text-right font-semibold">{rotuloA}</th>
                <th className="p-2.5 text-right font-semibold">{rotuloB}</th>
                <th className="p-2.5 text-center font-semibold">Vantagem Apurada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {relatorio.quadroResumo.map((linha) => (
                <tr key={linha.item} className="hover:bg-muted/30">
                  <td className="p-2.5 font-medium text-foreground">{linha.item}</td>
                  <td className="p-2.5 text-right font-mono font-bold text-foreground">
                    {formatarValorQuadro(linha.item, linha.valorA)}
                  </td>
                  <td className="p-2.5 text-right font-mono font-medium text-muted-foreground">
                    {formatarValorQuadro(linha.item, linha.valorB)}
                  </td>
                  <td className="p-2.5 text-center">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold ${
                        linha.vantagem === 'A'
                          ? 'border-emerald-500 text-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20'
                          : linha.vantagem === 'B'
                            ? 'border-blue-500 text-blue-600 bg-blue-50/40 dark:bg-blue-950/20'
                            : 'border-muted text-muted-foreground'
                      }`}
                    >
                      {linha.vantagem === 'A'
                        ? rotuloA
                        : linha.vantagem === 'B'
                          ? rotuloB
                          : 'Empate'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* BLOCO 2: DIAGNÓSTICO POR DIMENSÃO */}
      <Card className="border-border">
        <CardHeader className="py-2.5 px-4 border-b border-border bg-muted/20">
          <CardTitle className="text-xs font-bold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            BLOCO 2 — Diagnóstico Analítico por Dimensão
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground border-b border-border text-left">
                <th className="p-2.5 font-semibold w-36">Dimensão</th>
                <th className="p-2.5 font-semibold">Situação: {rotuloA}</th>
                <th className="p-2.5 font-semibold">Situação: {rotuloB}</th>
                <th className="p-2.5 font-semibold">Conclusão Comparativa Automatizada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {relatorio.diagnosticoDimensoes.map((d) => (
                <tr key={d.dimensao} className="hover:bg-muted/30">
                  <td className="p-2.5 font-bold text-foreground">{d.dimensao}</td>
                  <td className="p-2.5 text-muted-foreground">{d.conclusaoA}</td>
                  <td className="p-2.5 text-muted-foreground">{d.conclusaoB || '—'}</td>
                  <td className="p-2.5 font-medium text-primary">{d.conclusaoComparativa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* BLOCO 4 & 5: CONCLUSÃO GERAL E RECOMENDAÇÃO DE CRÉDITO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="py-2.5 px-4 border-b border-border bg-muted/20">
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              BLOCO 4 — Conclusão Geral Comparativa
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-xs text-foreground leading-relaxed whitespace-pre-line">
            {relatorio.conclusaoGeral}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="py-2.5 px-4 border-b border-border bg-muted/20">
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              BLOCO 5 — Parecer e Recomendação de Crédito
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="p-3 rounded-md border border-border bg-muted/30 space-y-1">
              <span className="font-bold text-foreground block">{rotuloA}:</span>
              <p className="text-muted-foreground">{relatorio.recomendacaoCreditoA}</p>
            </div>
            <div className="p-3 rounded-md border border-border bg-muted/30 space-y-1">
              <span className="font-bold text-foreground block">{rotuloB}:</span>
              <p className="text-muted-foreground">{relatorio.recomendacaoCreditoB}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
