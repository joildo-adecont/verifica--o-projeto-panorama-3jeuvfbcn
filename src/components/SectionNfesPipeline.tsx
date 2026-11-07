import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  FileText,
  UploadCloud,
  Layers,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  Building2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { AdecontLogo } from '@/components/AdecontLogo'
import { UploadNfeLote } from '@/components/UploadNfeLote'
import { NfeCardItem } from '@/components/ListagemNfes'
import { PainelAnaliseAgentes } from '@/components/PainelAnaliseAgentes'
import { listarNfes } from '@/services/nfeService'
import type { NfeRecord, ProcessamentoLoteResponse } from '@/types/nfes'

export const SectionNfesPipeline: React.FC = () => {
  const [abaAtiva, setAbaAtiva] = useState<'upload' | 'notas' | 'analise'>('upload')
  const [nfes, setNfes] = useState<NfeRecord[]>([])
  const [carregando, setCarregando] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'compra' | 'venda'>('todos')
  const [buscaTexto, setBuscaTexto] = useState('')
  const [nfeSelecionadaParaAnalise, setNfeSelecionadaParaAnalise] = useState<NfeRecord | null>(null)

  const carregarNfes = useCallback(async () => {
    setCarregando(true)
    try {
      const res = await listarNfes({
        tipo: filtroTipo === 'todos' ? '' : filtroTipo,
        busca: buscaTexto,
        limite: 100,
      })
      if (res.success && res.nfes) {
        setNfes(res.nfes)
        // Se ainda não tiver selecionado uma para análise, seleciona a primeira
        if (!nfeSelecionadaParaAnalise && res.nfes.length > 0) {
          setNfeSelecionadaParaAnalise(res.nfes[0])
        }
      }
    } catch (err) {
      console.error('Erro ao carregar NFes:', err)
    } finally {
      setCarregando(false)
    }
  }, [filtroTipo, buscaTexto, nfeSelecionadaParaAnalise])

  useEffect(() => {
    carregarNfes()
  }, [carregarNfes])

  const handleProcessamentoConcluido = (_resultado: ProcessamentoLoteResponse) => {
    carregarNfes()
  }

  const handleIrParaNotas = () => {
    setAbaAtiva('notas')
    carregarNfes()
  }

  const handleAnalisarNfe = (nfe: NfeRecord) => {
    setNfeSelecionadaParaAnalise(nfe)
    setAbaAtiva('analise')
  }

  // Totais rápidos
  const totalNotas = nfes.length
  const totalCompras = nfes.filter(
    (n) => (n.tipo_compra_venda || n.tipo_operacao) === 'compra',
  ).length
  const totalVendas = nfes.filter(
    (n) => (n.tipo_compra_venda || n.tipo_operacao) === 'venda',
  ).length
  const valorTotalGeral = nfes.reduce((acc, cur) => acc + (cur.valor_total_nfe || 0), 0)

  return (
    <section className="space-y-6 max-w-7xl mx-auto py-6 px-4">
      {/* Banner Superior com Identidade ADECONT */}
      <Card className="border-border/80 bg-gradient-to-r from-card via-card to-primary/5 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                <AdecontLogo variant="color" className="w-9 h-9" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Pipeline de Documentos Fiscais (NF-e)
                  </h1>
                  <Badge variant="outline" className="border-primary/30 text-primary text-xs">
                    Módulo Fiscal & Tributário
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                  ADECONT Assessoria Contábil e Administrativa — Ingestão em lote de XMLs modelo 55,
                  diferenciação automática de Compras × Vendas, tratamento de B2C/marketplace,
                  extração do bloco IBSCBS da Reforma Tributária e análise com 3 Agentes
                  Especialistas nativos Skip Cloud.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={carregarNfes}
                disabled={carregando}
                className="text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${carregando ? 'animate-spin' : ''}`} />
                Atualizar Dados
              </Button>
            </div>
          </div>

          {/* Cards de Métricas Rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-border/50 text-xs">
            <div className="p-3 rounded-lg bg-background border border-border/50">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Total de NFes</span>
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div className="text-xl font-bold mt-1">{totalNotas}</div>
              <span className="text-[10px] text-muted-foreground">Documentos importados</span>
            </div>

            <div className="p-3 rounded-lg bg-background border border-border/50">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Compras (Entrada)</span>
                <TrendingDown className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-xl font-bold mt-1 text-blue-600">{totalCompras}</div>
              <span className="text-[10px] text-muted-foreground">Aquisições de fornecedores</span>
            </div>

            <div className="p-3 rounded-lg bg-background border border-border/50">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Vendas (Saída)</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl font-bold mt-1 text-emerald-600">{totalVendas}</div>
              <span className="text-[10px] text-muted-foreground">Faturamento emitido / B2C</span>
            </div>

            <div className="p-3 rounded-lg bg-background border border-border/50">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Volume Financeiro</span>
                <Building2 className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl font-bold mt-1">
                R$ {valorTotalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-muted-foreground">Total acumulado das notas</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navegação Principal em Abas */}
      <Tabs
        value={abaAtiva}
        onValueChange={(v) => setAbaAtiva(v as 'upload' | 'notas' | 'analise')}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-3 max-w-xl h-11 p-1 bg-muted/60">
          <TabsTrigger value="upload" className="text-xs font-semibold flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            Upload em Lote
          </TabsTrigger>
          <TabsTrigger value="notas" className="text-xs font-semibold flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Notas Fiscais ({totalNotas})
          </TabsTrigger>
          <TabsTrigger value="analise" className="text-xs font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            Análise com Agentes
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: UPLOAD EM LOTE */}
        <TabsContent value="upload" className="space-y-4">
          <UploadNfeLote
            onProcessamentoConcluido={handleProcessamentoConcluido}
            onIrParaNotas={handleIrParaNotas}
          />
        </TabsContent>

        {/* ABA 2: LISTAGEM DE NOTAS */}
        <TabsContent value="notas" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader className="p-4 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative w-full">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por número, chave de 44 dígitos, cliente ou CNPJ..."
                      value={buscaTexto}
                      onChange={(e) => setBuscaTexto(e.target.value)}
                      className="pl-9 text-xs h-9"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <div className="flex rounded-lg border border-border/60 p-0.5 bg-muted/30">
                    <button
                      onClick={() => setFiltroTipo('todos')}
                      className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                        filtroTipo === 'todos'
                          ? 'bg-background shadow-xs text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      Todas
                    </button>
                    <button
                      onClick={() => setFiltroTipo('compra')}
                      className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                        filtroTipo === 'compra'
                          ? 'bg-background shadow-xs text-blue-600'
                          : 'text-muted-foreground'
                      }`}
                    >
                      Compras ({totalCompras})
                    </button>
                    <button
                      onClick={() => setFiltroTipo('venda')}
                      className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                        filtroTipo === 'venda'
                          ? 'bg-background shadow-xs text-emerald-600'
                          : 'text-muted-foreground'
                      }`}
                    >
                      Vendas ({totalVendas})
                    </button>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Lista de Cards de NF-e */}
          {nfes.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="py-12 text-center text-muted-foreground space-y-3">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/30" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Nenhuma Nota Fiscal encontrada com os filtros atuais
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Utilize a aba <strong>Upload em Lote</strong> para processar novos XMLs de
                    compra ou venda.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {nfes.map((nfe) => (
                <NfeCardItem key={nfe.id} nfe={nfe} onAnalisar={handleAnalisarNfe} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ABA 3: ANÁLISE COM AGENTES ESPECIALISTAS */}
        <TabsContent value="analise" className="space-y-4">
          <PainelAnaliseAgentes
            nfeSelecionada={nfeSelecionadaParaAnalise}
            onAnaliseConcluida={(nfeAtualizada) => {
              setNfeSelecionadaParaAnalise(nfeAtualizada)
              setNfes((prev) => prev.map((n) => (n.id === nfeAtualizada.id ? nfeAtualizada : n)))
            }}
          />
        </TabsContent>
      </Tabs>
    </section>
  )
}
