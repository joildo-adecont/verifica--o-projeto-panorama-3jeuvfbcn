import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  SlidersHorizontal,
  FileText,
  Building2,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Calculator,
  Activity,
  FileCheck,
  Layers,
  Save,
  Check,
} from 'lucide-react'
import {
  type ConfiguracaoRelatorioCustomizado,
  TITULO_PADRAO_RELATORIO,
} from '@/types/customizacaoRelatorio'
import { criarConfiguracaoPadrao } from '@/services/customizacaoRelatorio'

interface ModalCustomizacaoRelatorioProps {
  aberto: boolean
  onFechar: () => void
  configuracaoAtual?: ConfiguracaoRelatorioCustomizado | null
  configInicial?: ConfiguracaoRelatorioCustomizado | null
  onSalvarConfiguracao?: (novaConfig: ConfiguracaoRelatorioCustomizado) => Promise<void> | void
  onSalvarConfig?: (novaConfig: ConfiguracaoRelatorioCustomizado) => Promise<void> | void
  clienteNome?: string
  clienteCnpj?: string
  totalIndicadores?: number
  onExportarDiretoAposSalvar?: (
    tipo: 'pdf' | 'xlsx' | 'csv',
    config: ConfiguracaoRelatorioCustomizado,
  ) => void
  onAplicarEExportar?: (
    config: ConfiguracaoRelatorioCustomizado,
    formato?: 'pdf' | 'xlsx' | 'csv',
  ) => void
  formatoPendente?: 'pdf' | 'xlsx' | 'csv' | null
}

export const ModalCustomizacaoRelatorio: React.FC<ModalCustomizacaoRelatorioProps> = ({
  aberto,
  onFechar,
  configuracaoAtual,
  configInicial,
  onSalvarConfiguracao,
  onSalvarConfig,
  clienteNome = '',
  clienteCnpj: _clienteCnpj,
  totalIndicadores = 0,
  onExportarDiretoAposSalvar,
  onAplicarEExportar,
  formatoPendente = null,
}) => {
  const cfgEfetiva = configInicial || configuracaoAtual || criarConfiguracaoPadrao()
  const [config, setConfig] = useState<ConfiguracaoRelatorioCustomizado>(cfgEfetiva)
  const [salvando, setSalvando] = useState(false)
  const [sucessoSalvo, setSucessoSalvo] = useState(false)

  // Sincroniza estado quando modal abre ou configuração externa muda
  useEffect(() => {
    if (aberto) {
      const fonte = configInicial || configuracaoAtual || criarConfiguracaoPadrao()
      setConfig(JSON.parse(JSON.stringify(fonte)))
      setSucessoSalvo(false)
    }
  }, [aberto, configuracaoAtual, configInicial])

  const alternarSecao = (chave: keyof ConfiguracaoRelatorioCustomizado['secoes']) => {
    setConfig((anterior) => ({
      ...anterior,
      secoes: {
        ...anterior.secoes,
        [chave]: !anterior.secoes[chave],
      },
    }))
  }

  const handleRestaurarPadrao = () => {
    setConfig(criarConfiguracaoPadrao())
  }

  const salvarEfetivo = async (novaCfg: ConfiguracaoRelatorioCustomizado) => {
    if (onSalvarConfiguracao) {
      await onSalvarConfiguracao(novaCfg)
    } else if (onSalvarConfig) {
      await onSalvarConfig(novaCfg)
    }
  }

  const handleSalvarAplicar = async (tipoAcao?: 'salvar' | 'exportar') => {
    try {
      setSalvando(true)
      await salvarEfetivo(config)
      setSucessoSalvo(true)
      setTimeout(() => setSucessoSalvo(false), 2000)

      if (tipoAcao === 'exportar') {
        if (formatoPendente && onExportarDiretoAposSalvar) {
          onExportarDiretoAposSalvar(formatoPendente, config)
        } else if (onAplicarEExportar) {
          onAplicarEExportar(config, formatoPendente || undefined)
        }
        onFechar()
      } else {
        onFechar()
      }
    } finally {
      setSalvando(false)
    }
  }

  // Contagem de seções selecionadas
  const secoesAtivasCount = Object.values(config.secoes).filter(Boolean).length

  return (
    <Dialog open={aberto} onOpenChange={(ab) => !ab && onFechar()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl">
        {/* Cabeçalho do Modal */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border-b border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  Personalizar Conteúdo do Relatório
                  <Badge
                    variant="outline"
                    className="text-[10px] border-amber-400/40 text-amber-300 bg-amber-400/10 font-mono py-0"
                  >
                    ADECONT A4 & Planilhas
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-300 mt-0.5">
                  {clienteNome
                    ? `Configurações de emissão para ${clienteNome}`
                    : 'Ajuste seções, título e observações antes da exportação'}
                </DialogDescription>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRestaurarPadrao}
              className="text-xs text-slate-300 hover:text-white hover:bg-slate-800 gap-1.5 h-8 px-2.5"
              title="Restaurar todas as opções para o padrão do sistema"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Padrão</span>
            </Button>
          </div>
        </div>

        {/* Corpo com Configurações */}
        <div className="p-5 space-y-6">
          {/* BLOCO 1: Título e Identificação do Relatório */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-primary" />
                Título e Identificação do Documento
              </Label>
              <span className="text-[11px] text-slate-400">
                Aparece no topo do PDF, Excel e CSV
              </span>
            </div>

            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    Título Principal Personalizado
                  </span>
                  {config.tituloPersonalizado ? (
                    <button
                      type="button"
                      onClick={() => setConfig((c) => ({ ...c, tituloPersonalizado: '' }))}
                      className="text-[11px] text-primary hover:underline"
                    >
                      Usar padrão
                    </button>
                  ) : null}
                </div>
                <Input
                  value={config.tituloPersonalizado || ''}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      tituloPersonalizado: e.target.value,
                    }))
                  }
                  placeholder={`Padrão: ${TITULO_PADRAO_RELATORIO}`}
                  className="text-xs h-9 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
                <p className="text-[10px] text-slate-500">
                  Deixe vazio para manter o título oficial do sistema Panorama RT.
                </p>
              </div>

              <div className="space-y-1 pt-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Subtítulo / Escopo Específico (Opcional)
                </span>
                <Input
                  value={config.subtituloPersonalizado || ''}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      subtituloPersonalizado: e.target.value,
                    }))
                  }
                  placeholder="Ex.: Relatório Gerencial Trimestral para Reunião de Sócios"
                  className="text-xs h-9 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>
          </div>

          {/* BLOCO 2: Seleção de Seções Ativas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary" />
                Seções Inclusas no Relatório ({secoesAtivasCount} ativas)
              </Label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setConfig((c) => ({
                      ...c,
                      secoes: {
                        sinteseExecutiva: true,
                        balanco3Anos: true,
                        indicesClassicos: true,
                        modelosAvancados: true,
                        parecerTecnico: true,
                        achadosCriticos: true,
                        agentesEspecialistas: true,
                        checklistDocumental: true,
                      },
                    }))
                  }
                  className="text-[11px] text-primary hover:underline px-1"
                >
                  Marcar todas
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={() =>
                    setConfig((c) => ({
                      ...c,
                      secoes: {
                        sinteseExecutiva: false,
                        balanco3Anos: false,
                        indicesClassicos: true, // Mantém ao menos 1
                        modelosAvancados: false,
                        parecerTecnico: false,
                        achadosCriticos: false,
                        agentesEspecialistas: false,
                        checklistDocumental: false,
                      },
                    }))
                  }
                  className="text-[11px] text-slate-500 hover:underline px-1"
                >
                  Mínimo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Índices Clássicos */}
              <div
                onClick={() => alternarSecao('indicesClassicos')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  config.secoes.indicesClassicos
                    ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Calculator className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Índices Clássicos
                    </p>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      Liquidez, Endividamento, Rentabilidade, Atividade e Cobertura (
                      {totalIndicadores} índices)
                    </p>
                  </div>
                </div>
                <Switch
                  checked={config.secoes.indicesClassicos}
                  onCheckedChange={() => alternarSecao('indicesClassicos')}
                  className="shrink-0"
                />
              </div>

              {/* Modelos Avançados de Insolvência */}
              <div
                onClick={() => alternarSecao('modelosAvancados')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  config.secoes.modelosAvancados
                    ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Modelos Avançados
                    </p>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      Kanitz, Altman Z1, Elizabetsky, Du Pont e Dinâmica Fleuriet (CDG/NCG/Efeito
                      Tesoura)
                    </p>
                  </div>
                </div>
                <Switch
                  checked={config.secoes.modelosAvancados}
                  onCheckedChange={() => alternarSecao('modelosAvancados')}
                  className="shrink-0"
                />
              </div>

              {/* Parecer Técnico Final */}
              <div
                onClick={() => alternarSecao('parecerTecnico')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  config.secoes.parecerTecnico
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                    <FileCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Parecer Técnico Oficial
                    </p>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      Opinião, Conclusão Executiva, Recomendação de Crédito e Responsável Técnico
                    </p>
                  </div>
                </div>
                <Switch
                  checked={config.secoes.parecerTecnico}
                  onCheckedChange={() => alternarSecao('parecerTecnico')}
                  className="shrink-0"
                />
              </div>

              {/* Notas e Achados Críticos */}
              <div
                onClick={() => alternarSecao('achadosCriticos')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  config.secoes.achadosCriticos
                    ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Notas & Achados Críticos
                    </p>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      Notas ajustadas da tela e Matriz de Achados / Due Diligence de Riscos
                    </p>
                  </div>
                </div>
                <Switch
                  checked={config.secoes.achadosCriticos}
                  onCheckedChange={() => alternarSecao('achadosCriticos')}
                  className="shrink-0"
                />
              </div>

              {/* Síntese Executiva & Balanço Trienal (aplica-se ao A4) */}
              <div
                onClick={() => alternarSecao('sinteseExecutiva')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  config.secoes.sinteseExecutiva
                    ? 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-800'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Síntese Executiva (A4)
                    </p>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      Score ponderado, cards de liquidez e diagnóstico estratégico
                    </p>
                  </div>
                </div>
                <Switch
                  checked={config.secoes.sinteseExecutiva}
                  onCheckedChange={() => alternarSecao('sinteseExecutiva')}
                  className="shrink-0"
                />
              </div>

              {/* Agentes Especialistas e Checklist */}
              <div
                onClick={() => alternarSecao('agentesEspecialistas')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  config.secoes.agentesEspecialistas
                    ? 'bg-purple-50/60 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Agentes & Checklist (A4)
                    </p>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      Pareceres dos 4 Agentes ADECONT e conferência de due diligence
                    </p>
                  </div>
                </div>
                <Switch
                  checked={config.secoes.agentesEspecialistas}
                  onCheckedChange={() => alternarSecao('agentesEspecialistas')}
                  className="shrink-0"
                />
              </div>
            </div>
          </div>

          {/* BLOCO 3: Dados da Empresa e QRCode no Relatório A4 */}
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              Apresentação e Elementos Visuais no Relatório A4
            </Label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div
                onClick={() =>
                  setConfig((c) => ({
                    ...c,
                    incluirDadosEmpresa: !c.incluirDadosEmpresa,
                  }))
                }
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  config.incluirDadosEmpresa
                    ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700'
                    : 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Dados Cadastrais da Empresa
                    </p>
                    <p className="text-[10px] text-slate-500">
                      CNPJ, Razão Social, Regime e Localidade
                    </p>
                  </div>
                </div>
                <Switch
                  checked={config.incluirDadosEmpresa}
                  onCheckedChange={(v) => setConfig((c) => ({ ...c, incluirDadosEmpresa: v }))}
                />
              </div>

              <div
                onClick={() =>
                  setConfig((c) => ({
                    ...c,
                    incluirQrCode: !c.incluirQrCode,
                  }))
                }
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  config.incluirQrCode
                    ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700'
                    : 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <QrCode className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      QRCode de Autenticidade
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Selo oficial de rastreabilidade ADECONT
                    </p>
                  </div>
                </div>
                <Switch
                  checked={config.incluirQrCode}
                  onCheckedChange={(v) => setConfig((c) => ({ ...c, incluirQrCode: v }))}
                />
              </div>
            </div>
          </div>

          {/* BLOCO 4: Observações e Considerações Finais Livres */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-primary" />
                Considerações / Observações Finais Livres
              </Label>
              <span className="text-[11px] text-slate-400">
                Aparece no encerramento (A4, Excel e CSV)
              </span>
            </div>

            <Textarea
              value={config.observacoesFinais || ''}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  observacoesFinais: e.target.value,
                }))
              }
              placeholder="Ex.: Relatório emitido para fins de pleito de linha de crédito bancário. Recomenda-se acompanhamento mensal da liquidez seca e revisão dos prazos médios de recebimento com o setor comercial."
              rows={3}
              className="text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Rodapé com Ações */}
        <DialogFooter className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between sm:justify-between w-full">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {sucessoSalvo ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                <Check className="w-3.5 h-3.5" />
                Preferências gravadas com sucesso!
              </span>
            ) : (
              <span>Preferências salvas para as próximas emissões.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onFechar}
              disabled={salvando}
              className="text-xs"
            >
              Cancelar
            </Button>

            <Button
              onClick={() => handleSalvarAplicar('salvar')}
              disabled={salvando}
              className="text-xs gap-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Preferências</span>
            </Button>

            {formatoPendente || onAplicarEExportar ? (
              <Button
                onClick={() => handleSalvarAplicar('exportar')}
                disabled={salvando}
                className="text-xs gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {formatoPendente
                    ? `Salvar e Exportar ${formatoPendente === 'pdf' ? 'A4' : formatoPendente === 'xlsx' ? 'Excel' : 'CSV'}`
                    : 'Salvar e Aplicar'}
                </span>
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ModalCustomizacaoRelatorio
