import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Save,
  Printer,
  Shield,
  UserCheck,
} from 'lucide-react'
import type { ParecerFinalAnalise, ItemIndicador } from '@/types/analisesEmpresariaisModel'

interface Props {
  parecer: ParecerFinalAnalise
  indicadores: ItemIndicador[]
  scoreFinal: number
  salvando: boolean
  onUpdateCampo: (campo: keyof ParecerFinalAnalise, valor: any) => void
  onSalvar: () => void
  onImprimir: () => void
}

export const FerramentaParecerFinal: React.FC<Props> = ({
  parecer,
  indicadores,
  scoreFinal,
  salvando,
  onUpdateCampo,
  onSalvar,
  onImprimir,
}) => {
  const getBadgeOpiniao = (op: ParecerFinalAnalise['nivelOpiniao']) => {
    switch (op) {
      case 'Sem ressalvas':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs py-1 px-3">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Opinião Sem Ressalvas
          </Badge>
        )
      case 'Com ressalvas':
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs py-1 px-3">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            Opinião Com Ressalvas
          </Badge>
        )
      case 'Adverso':
        return (
          <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30 text-xs py-1 px-3">
            <XCircle className="w-3.5 h-3.5 mr-1" />
            Parecer Adverso
          </Badge>
        )
    }
  }

  const findInd = (id: string) => indicadores.find((i) => i.id === id)

  const liqCorrente = findInd('liq_corrente')?.valor || 0
  const margemLiquida = findInd('margem_liquida')?.valor || 0
  const roe = findInd('roe')?.valor || 0
  const divLiqEbitda = findInd('div_liq_ebitda')?.valor || 0
  const cicloFinanceiro = findInd('ciclo_financeiro')?.valor || 0
  const dscr = findInd('dscr')?.valor || 0

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Parecer */}
      <Card className="border-border bg-muted/10">
        <CardHeader className="py-4 px-6 border-b border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <CardTitle className="text-base font-bold text-foreground">
                  Parecer Técnico Final e Recomendação de Crédito
                </CardTitle>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Síntese conclusiva e posicionamento técnico formal da ADECONT Assessoria Contábil e
                Administrativa.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onImprimir}
                className="text-xs h-9 gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Imprimir Parecer A4
              </Button>
              <Button
                size="sm"
                onClick={onSalvar}
                disabled={salvando}
                className="text-xs h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5"
              >
                <Save className="w-4 h-4" />
                {salvando ? 'Salvando...' : 'Salvar Parecer Oficial'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Dados Gerais da Empresa e Escopo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-lg bg-card border border-border text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">Empresa Analisada:</span>
              <strong className="text-foreground text-sm font-bold block mt-0.5">
                {parecer.empresaNome}
              </strong>
              <span className="text-muted-foreground font-mono text-[11px]">{parecer.cnpj}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Período de Análise:</span>
              <strong className="text-foreground block mt-0.5 font-medium">
                {parecer.periodo}
              </strong>
              <span className="text-muted-foreground text-[11px]">3 exercícios financeiros</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Escopo da Auditoria:</span>
              <strong className="text-foreground block mt-0.5 font-medium">{parecer.escopo}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">
                Nível de Opinião Oficial:
              </span>
              <div className="mt-1">{getBadgeOpiniao(parecer.nivelOpiniao)}</div>
            </div>
          </div>

          {/* Indicadores Chave no Parecer */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Métricas Chave de Sustentação do Parecer
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              <div className="p-3 rounded-lg border border-border bg-card">
                <span className="text-[11px] text-muted-foreground block">Liq. Corrente</span>
                <span className="text-base font-bold font-mono text-foreground block mt-1">
                  {liqCorrente.toFixed(2)}x
                </span>
                <span className="text-[10px] text-muted-foreground">Ref: &gt; 1,5</span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-card">
                <span className="text-[11px] text-muted-foreground block">Margem Líquida</span>
                <span className="text-base font-bold font-mono text-foreground block mt-1">
                  {margemLiquida.toFixed(2)}%
                </span>
                <span className="text-[10px] text-muted-foreground">Ref: &gt; 5%</span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-card">
                <span className="text-[11px] text-muted-foreground block">ROE</span>
                <span className="text-base font-bold font-mono text-foreground block mt-1">
                  {roe.toFixed(2)}%
                </span>
                <span className="text-[10px] text-muted-foreground">Ref: &gt; 10%</span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-card">
                <span className="text-[11px] text-muted-foreground block">Dív. Liq / EBITDA</span>
                <span className="text-base font-bold font-mono text-foreground block mt-1">
                  {divLiqEbitda.toFixed(2)}x
                </span>
                <span className="text-[10px] text-muted-foreground">Ref: &lt; 2,0x</span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-card">
                <span className="text-[11px] text-muted-foreground block">Ciclo Financeiro</span>
                <span className="text-base font-bold font-mono text-foreground block mt-1">
                  {cicloFinanceiro.toFixed(0)}d
                </span>
                <span className="text-[10px] text-muted-foreground">Ref: &lt; 90 dias</span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-card">
                <span className="text-[11px] text-muted-foreground block">DSCR (Cobertura)</span>
                <span className="text-base font-bold font-mono text-foreground block mt-1">
                  {dscr.toFixed(2)}x
                </span>
                <span className="text-[10px] text-muted-foreground">Ref: &gt; 1,3x</span>
              </div>
              <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
                <span className="text-[11px] text-primary font-semibold block">Score Final</span>
                <span className="text-base font-extrabold font-mono text-primary block mt-1">
                  {scoreFinal.toFixed(1)} / 10
                </span>
                <span className="text-[10px] text-primary/80">Ponderado</span>
              </div>
            </div>
          </div>

          {/* Campos Editáveis do Parecer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Pontos Fortes Identificados:
              </label>
              <Textarea
                value={parecer.pontosFortes}
                onChange={(e) => onUpdateCampo('pontosFortes', e.target.value)}
                rows={3}
                className="text-xs"
                placeholder="Principais virtudes operacionais, financeiras ou patrimoniais..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Pontos de Atenção / Fragilidades:
              </label>
              <Textarea
                value={parecer.pontosAtencao}
                onChange={(e) => onUpdateCampo('pontosAtencao', e.target.value)}
                rows={3}
                className="text-xs"
                placeholder="Fragilidades, prazos de recebimento alongados, margens comprimidas..."
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-red-600" />
              Achados Críticos / Inconsistências Relevantes:
            </label>
            <Textarea
              value={parecer.achadosCriticos}
              onChange={(e) => onUpdateCampo('achadosCriticos', e.target.value)}
              rows={2}
              className="text-xs"
              placeholder="Inconsistências fiscais, passivos tributários em parcelamento, ausência de certidões..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Conclusão Técnica ADECONT:</label>
            <Textarea
              value={parecer.conclusao}
              onChange={(e) => onUpdateCampo('conclusao', e.target.value)}
              rows={4}
              className="text-xs font-medium"
              placeholder="Conclusão sintética sobre a capacidade de continuidade operacional e solidez..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Nível de Opinião:
              </label>
              <select
                value={parecer.nivelOpiniao}
                onChange={(e) =>
                  onUpdateCampo(
                    'nivelOpiniao',
                    e.target.value as ParecerFinalAnalise['nivelOpiniao'],
                  )
                }
                className="w-full h-9 px-3 rounded-md border border-input text-xs bg-background font-medium"
              >
                <option value="Sem ressalvas">Sem ressalvas (Sólida e Conforme)</option>
                <option value="Com ressalvas">Com ressalvas (Atenção a pontos específicos)</option>
                <option value="Adverso">
                  Adverso (Risco elevado de inadimplência/continuidade)
                </option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Recomendação de Crédito:
              </label>
              <select
                value={parecer.recomendacaoCredito}
                onChange={(e) => onUpdateCampo('recomendacaoCredito', e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input text-xs bg-background font-medium"
              >
                <option value="Conceder crédito (score alto e garantias ordinárias)">
                  Conceder crédito (score alto e garantias ordinárias)
                </option>
                <option value="Conceder crédito com garantias reais adicionais">
                  Conceder crédito com garantias reais adicionais
                </option>
                <option value="Crédito sob monitoramento rigoroso e prazos curtos">
                  Crédito sob monitoramento rigoroso e prazos curtos
                </option>
                <option value="Crédito negado ou fortemente restrito">
                  Crédito negado ou fortemente restrito
                </option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Responsável Técnico ADECONT:
              </label>
              <input
                type="text"
                value={parecer.responsavelTecnico}
                onChange={(e) => onUpdateCampo('responsavelTecnico', e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input text-xs bg-background font-medium"
                placeholder="Ex: Auditor Líder / Analista Contábil"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
