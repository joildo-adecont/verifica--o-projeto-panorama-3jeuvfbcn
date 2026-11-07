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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { BarChart3, PieChart, Layers, Building2, Calendar } from 'lucide-react'
import { calcularTotaisExercicio } from '@/services/motorAnaliseEmpresarial'
import type { EmpresaRecord } from '@/types/cadastroEmpresas'
import type { AnaliseBalanco3Exercicios } from '@/types/analisesEmpresariaisModel'

interface Props {
  clienteAtual: EmpresaRecord
  listaClientes: EmpresaRecord[]
  balancoAtual: AnaliseBalanco3Exercicios
  carregarBalancoOutroCliente: (cnpj: string) => Promise<AnaliseBalanco3Exercicios | null>
}

export const FerramentaGraficosComparativos: React.FC<Props> = ({
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

  const calcMenos2 = calcularTotaisExercicio(balancoAtual.anoMenos2)
  const calcMenos1 = calcularTotaisExercicio(balancoAtual.anoMenos1)
  const calcAtual = calcularTotaisExercicio(balancoAtual.anoAtual)

  const handleSelecionarOutro = async (cnpj: string) => {
    setCnpjOutroCliente(cnpj)
    setCarregandoOutro(true)
    const dados = await carregarBalancoOutroCliente(cnpj)
    setBalancoOutroCliente(dados)
    setCarregandoOutro(false)
  }

  const clienteDoc = (c: EmpresaRecord) => c.documento_limpo || c.numero_documento || ''
  const clienteB = listaClientes.find((c) => clienteDoc(c) === cnpjOutroCliente)

  let rotuloObjetoA = 'Ano Atual'
  let rotuloObjetoB = 'Ano -1'
  let objetoA = calcAtual
  let objetoB = calcMenos1

  if (modoComparacao === 'dois_clientes' && balancoOutroCliente && clienteB) {
    rotuloObjetoA = clienteAtual.razao_social || 'Cliente A'
    rotuloObjetoB = clienteB.razao_social || 'Cliente B'
    objetoA = calcAtual
    objetoB = calcularTotaisExercicio(balancoOutroCliente.anoAtual)
  }

  // Dados para Gráfico de Barras: Métricas Principais (Receita Líquida, EBITDA, Lucro Líquido)
  const dadosMetricas = [
    {
      metrica: 'Receita Líquida',
      [rotuloObjetoA]: Math.round(objetoA.receitaLiquida),
      [rotuloObjetoB]: Math.round(objetoB.receitaLiquida),
    },
    {
      metrica: 'EBITDA',
      [rotuloObjetoA]: Math.round(objetoA.ebitda),
      [rotuloObjetoB]: Math.round(objetoB.ebitda),
    },
    {
      metrica: 'Lucro Líquido',
      [rotuloObjetoA]: Math.round(objetoA.lucroLiquido),
      [rotuloObjetoB]: Math.round(objetoB.lucroLiquido),
    },
  ]

  // Dados para Gráfico de Estrutura de Capital (PC, PNC, PL)
  const dadosEstrutura = [
    {
      estrutura: 'Passivo Circulante (PC)',
      [rotuloObjetoA]: Math.round(objetoA.totalPassivoCirculante),
      [rotuloObjetoB]: Math.round(objetoB.totalPassivoCirculante),
    },
    {
      estrutura: 'Passivo Não Circulante (PNC)',
      [rotuloObjetoA]: Math.round(objetoA.totalPassivoNaoCirculante),
      [rotuloObjetoB]: Math.round(objetoB.totalPassivoNaoCirculante),
    },
    {
      estrutura: 'Patrimônio Líquido (PL)',
      [rotuloObjetoA]: Math.round(objetoA.totalPatrimonioLiquido),
      [rotuloObjetoB]: Math.round(objetoB.totalPatrimonioLiquido),
    },
  ]

  // Evolução 3 Exercícios do Cliente Atual
  const dadosEvolucao3Anos = [
    {
      ano: 'Ano -2',
      'Receita Líquida': Math.round(calcMenos2.receitaLiquida),
      EBITDA: Math.round(calcMenos2.ebitda),
      'Lucro Líquido': Math.round(calcMenos2.lucroLiquido),
    },
    {
      ano: 'Ano -1',
      'Receita Líquida': Math.round(calcMenos1.receitaLiquida),
      EBITDA: Math.round(calcMenos1.ebitda),
      'Lucro Líquido': Math.round(calcMenos1.lucroLiquido),
    },
    {
      ano: 'Ano Atual',
      'Receita Líquida': Math.round(calcAtual.receitaLiquida),
      EBITDA: Math.round(calcAtual.ebitda),
      'Lucro Líquido': Math.round(calcAtual.lucroLiquido),
    },
  ]

  const formatarValorTooltip = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value)

  return (
    <div className="space-y-6">
      {/* Controles do Gráfico */}
      <Card className="border-border p-4 bg-muted/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
              Gráficos Comparativos Executivos
            </h4>
            <p className="text-xs text-muted-foreground">
              Visualização visual de resultados operacionais e fontes de financiamento (Estrutura de
              Capital).
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
              Ano Atual vs Ano -1
            </Button>
            <Button
              variant={modoComparacao === 'dois_clientes' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setModoComparacao('dois_clientes')}
              className="text-xs h-8"
            >
              <Building2 className="w-3.5 h-3.5 mr-1.5" />
              Comparar 2 Clientes
            </Button>
          </div>
        </div>

        {modoComparacao === 'dois_clientes' && (
          <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-xs font-semibold text-foreground">
              Selecionar 2º Cliente para confrontar no gráfico:
            </span>
            <div className="w-full sm:w-80">
              <Select value={cnpjOutroCliente} onValueChange={handleSelecionarOutro}>
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
              <span className="text-xs text-muted-foreground animate-pulse">Carregando...</span>
            )}
          </div>
        )}
      </Card>

      {/* Gráficos lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRÁFICO 1: MÉTRICAS DE RESULTADO */}
        <Card className="border-border">
          <CardHeader className="py-2.5 px-4 border-b border-border bg-muted/20">
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Métricas Operacionais (Receita Líquida, EBITDA e Lucro)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosMetricas} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="metrica" tick={{ fontSize: 11 }} />
                  <YAxis
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip formatter={formatarValorTooltip} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey={rotuloObjetoA} fill="#1F3864" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={rotuloObjetoB} fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* GRÁFICO 2: ESTRUTURA DE CAPITAL */}
        <Card className="border-border">
          <CardHeader className="py-2.5 px-4 border-b border-border bg-muted/20">
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Estrutura de Capital (PC, PNC e Patrimônio Líquido)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dadosEstrutura}
                  margin={{ top: 20, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="estrutura" tick={{ fontSize: 10 }} />
                  <YAxis
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip formatter={formatarValorTooltip} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey={rotuloObjetoA} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={rotuloObjetoB} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GRÁFICO 3: EVOLUÇÃO TEMPORAL DOS 3 EXERCÍCIOS DO CLIENTE ATUAL */}
      <Card className="border-border">
        <CardHeader className="py-2.5 px-4 border-b border-border bg-muted/20">
          <CardTitle className="text-xs font-bold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Evolução Histórica nos 3 Exercícios ({clienteAtual.razao_social})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dadosEvolucao3Anos}
                margin={{ top: 20, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={formatarValorTooltip} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Receita Líquida" fill="#1F3864" radius={[4, 4, 0, 0]} />
                <Bar dataKey="EBITDA" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Lucro Líquido" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
