import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  Bot,
  Scale,
  DollarSign,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  RefreshCw,
  Info,
} from 'lucide-react'
import type { NfeRecord, NfeAnalise } from '@/types/nfes'
import { analisarNfeComAgentes } from '@/services/nfeService'
import { RenderizadorTextoMarkdown } from '@/components/RenderizadorTextoMarkdown'

interface PainelAnaliseAgentesProps {
  nfeSelecionada: NfeRecord | null
  onAnaliseConcluida?: (nfeAtualizada: NfeRecord) => void
}

export const PainelAnaliseAgentes: React.FC<PainelAnaliseAgentesProps> = ({
  nfeSelecionada,
  onAnaliseConcluida,
}) => {
  const [analisando, setAnalisando] = useState(false)
  const [analiseAtual, setAnaliseAtual] = useState<NfeAnalise | null>(
    nfeSelecionada?.analise || null,
  )
  const [erroAnalise, setErroAnalise] = useState<string | null>(null)
  const [abaAgente, setAbaAgente] = useState<'consolidado' | 'icms' | 'pis_cofins' | 'reforma'>(
    'consolidado',
  )

  // Sincroniza quando muda a NFe selecionada
  React.useEffect(() => {
    setAnaliseAtual(nfeSelecionada?.analise || null)
    setErroAnalise(null)
  }, [nfeSelecionada])

  const handleDispararAnalise = async () => {
    if (!nfeSelecionada) return

    setAnalisando(true)
    setErroAnalise(null)

    try {
      const res = await analisarNfeComAgentes({
        nfe_id: nfeSelecionada.id,
        chave_acesso: nfeSelecionada.chave_acesso,
      })

      if (res.success && res.analise) {
        setAnaliseAtual(res.analise)
        if (onAnaliseConcluida) {
          onAnaliseConcluida({
            ...nfeSelecionada,
            analise_status: 'analisado',
            analise: res.analise,
          })
        }
      } else {
        setErroAnalise(
          res.error || 'Não foi possível concluir a análise dos 3 agentes especialistas.',
        )
      }
    } catch (err) {
      console.error('Erro na análise dos agentes:', err)
      setErroAnalise(err instanceof Error ? err.message : 'Falha ao acionar agentes.')
    } finally {
      setAnalisando(false)
    }
  }

  if (!nfeSelecionada) {
    return (
      <Card className="border-border/60">
        <CardContent className="py-12 text-center text-muted-foreground space-y-3">
          <Bot className="w-12 h-12 mx-auto text-primary/40" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Nenhuma Nota Fiscal selecionada para análise
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Vá para a aba <strong>Notas Fiscais</strong> e clique em{' '}
              <em>"Analisar com Agentes"</em> em uma NF-e.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { emit_razao_social, dest_razao_social, numero, tipo_operacao, valor_total_nfe } =
    nfeSelecionada

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Nota em Análise */}
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Análise Tributária com Agentes Especialistas Nativo Skip Cloud
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-xs border-purple-500/30 bg-purple-500/10 text-purple-600"
                >
                  NF-e nº {numero} ({tipo_operacao === 'compra' ? 'Compra/Entrada' : 'Venda/Saída'})
                </Badge>
              </div>
              <CardDescription className="mt-1">
                3 Agentes dedicados com inteligência técnica ADECONT cruzando a tributação atual
                (ICMS/PIS/COFINS) com a Reforma Tributária (IBS/CBS e cClassTrib).
              </CardDescription>
            </div>

            <Button
              onClick={handleDispararAnalise}
              disabled={analisando}
              className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
            >
              {analisando ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Consultando Agentes...
                </>
              ) : analiseAtual ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reanalisar com Agentes
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Executar Análise com 3 Agentes
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 text-xs">
            <div className="p-2 rounded bg-muted/40">
              <span className="text-muted-foreground block">Fornecedor (Emitente)</span>
              <span className="font-semibold text-foreground truncate block">
                {emit_razao_social}
              </span>
            </div>
            <div className="p-2 rounded bg-muted/40">
              <span className="text-muted-foreground block">Destinatário (Adquirente)</span>
              <span className="font-semibold text-foreground truncate block">
                {dest_razao_social}
              </span>
            </div>
            <div className="p-2 rounded bg-muted/40">
              <span className="text-muted-foreground block">Total da Operação</span>
              <span className="font-semibold text-foreground block">
                R$ {Number(valor_total_nfe).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (
                {nfeSelecionada.quantidade_itens} itens)
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {erroAnalise && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{erroAnalise}</span>
        </div>
      )}

      {/* Painel com as respostas dos agentes e Parecer Consolidado */}
      {analiseAtual ? (
        <div className="space-y-4">
          {/* Card de Síntese Executiva */}
          <Card className="border-purple-500/30 bg-purple-500/5 shadow-sm">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-bold text-foreground">
                  Recomendação Estratégica Sintética ADECONT
                </span>
                <Badge variant="outline" className="text-[10px] ml-auto border-purple-500/30">
                  {new Date(analiseAtual.data_analise).toLocaleDateString('pt-BR')} às{' '}
                  {new Date(analiseAtual.data_analise).toLocaleTimeString('pt-BR')}
                </Badge>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed font-medium">
                {analiseAtual.recomendacao_resumida}
              </p>
            </CardContent>
          </Card>

          {/* Abas com Parecer Consolidado e Detalhe de Cada Agente */}
          <Card className="border-border/70">
            <CardHeader className="p-4 pb-2">
              <Tabs
                value={abaAgente}
                onValueChange={(v) =>
                  setAbaAgente(v as 'consolidado' | 'icms' | 'pis_cofins' | 'reforma')
                }
              >
                <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto p-1 gap-1">
                  <TabsTrigger
                    value="consolidado"
                    className="text-xs py-1.5 flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Parecer Consolidado
                  </TabsTrigger>
                  <TabsTrigger value="icms" className="text-xs py-1.5 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-blue-500" />
                    ICMS / ST / CFOP
                  </TabsTrigger>
                  <TabsTrigger
                    value="pis_cofins"
                    className="text-xs py-1.5 flex items-center gap-1.5"
                  >
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    PIS / COFINS
                  </TabsTrigger>
                  <TabsTrigger value="reforma" className="text-xs py-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    Reforma (CBS/IBS)
                  </TabsTrigger>
                </TabsList>

                {/* Conteúdo Aba Consolidado */}
                <TabsContent value="consolidado" className="pt-4 space-y-4">
                  <div className="p-4 rounded-lg bg-muted/20 border border-border/50 text-xs leading-relaxed">
                    <RenderizadorTextoMarkdown texto={analiseAtual.parecer_consolidado} />
                  </div>
                </TabsContent>

                {/* Conteúdo Aba ICMS */}
                <TabsContent value="icms" className="pt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs pb-1">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-blue-500" />
                      Agente Especialista: ICMS, ICMS-ST, CEST e CFOP
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] text-blue-600 border-blue-500/30"
                    >
                      Status:{' '}
                      {analiseAtual.agentes.icms.status === 'ok' ? 'Agente Nativo' : 'Base Técnica'}
                    </Badge>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/20 border border-border/50 text-xs leading-relaxed">
                    <RenderizadorTextoMarkdown texto={analiseAtual.agentes.icms.conteudo} />
                  </div>
                </TabsContent>

                {/* Conteúdo Aba PIS/COFINS */}
                <TabsContent value="pis_cofins" className="pt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs pb-1">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      Agente Especialista: PIS e COFINS (Monofásico e Créditos)
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] text-emerald-600 border-emerald-500/30"
                    >
                      Status:{' '}
                      {analiseAtual.agentes.pis_cofins.status === 'ok'
                        ? 'Agente Nativo'
                        : 'Base Técnica'}
                    </Badge>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/20 border border-border/50 text-xs leading-relaxed">
                    <RenderizadorTextoMarkdown texto={analiseAtual.agentes.pis_cofins.conteudo} />
                  </div>
                </TabsContent>

                {/* Conteúdo Aba Reforma */}
                <TabsContent value="reforma" className="pt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs pb-1">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      Agente Especialista: Reforma Tributária (CBS, IBS e cClassTrib)
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] text-purple-600 border-purple-500/30"
                    >
                      Status:{' '}
                      {analiseAtual.agentes.reforma.status === 'ok'
                        ? 'Agente Nativo'
                        : 'Base Técnica'}
                    </Badge>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/20 border border-border/50 text-xs leading-relaxed">
                    <RenderizadorTextoMarkdown texto={analiseAtual.agentes.reforma.conteudo} />
                  </div>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>
      ) : (
        <Card className="border-border/60">
          <CardContent className="py-12 text-center text-muted-foreground space-y-3">
            <Bot className="w-12 h-12 mx-auto text-purple-400" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Esta NF-e ainda não foi analisada pelos agentes especialistas
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                Clique no botão <strong>"Executar Análise com 3 Agentes"</strong> acima para acionar
                os agentes nativos de ICMS/ST, PIS/COFINS e Reforma Tributária.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
