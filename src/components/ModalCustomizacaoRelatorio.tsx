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
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Edit3,
  BookmarkPlus,
} from 'lucide-react'
import {
  type ConfiguracaoRelatorioCustomizado,
  type SecaoCustomizada,
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

  // Estado para nova seção em edição / criação rápida
  const [editandoSecaoId, setEditandoSecaoId] = useState<string | null>(null)
  const [novoTitulo, setNovoTitulo] = useState('')
  const [novoSubtitulo, setNovoSubtitulo] = useState('')
  const [novoConteudo, setNovoConteudo] = useState('')
  const [mostrarFormNovaSecao, setMostrarFormNovaSecao] = useState(false)

  // Sincroniza estado quando modal abre ou configuração externa muda
  useEffect(() => {
    if (aberto) {
      const fonte = configInicial || configuracaoAtual || criarConfiguracaoPadrao()
      setConfig(JSON.parse(JSON.stringify(fonte)))
      setSucessoSalvo(false)
      setEditandoSecaoId(null)
      setMostrarFormNovaSecao(false)
      setNovoTitulo('')
      setNovoSubtitulo('')
      setNovoConteudo('')
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

  const handleAlterarTituloSecao = (
    chave: keyof import('@/types/customizacaoRelatorio').TitulosSecoesCustomizacao,
    valor: string,
  ) => {
    setConfig((anterior) => ({
      ...anterior,
      titulosSecoes: {
        ...(anterior.titulosSecoes || {}),
        [chave]: valor,
      },
    }))
  }

  const handleAlterarSubtituloSecao = (
    chave: keyof import('@/types/customizacaoRelatorio').SubtitulosSecoesCustomizacao,
    valor: string,
  ) => {
    setConfig((anterior) => ({
      ...anterior,
      subtitulosSecoes: {
        ...(anterior.subtitulosSecoes || {}),
        [chave]: valor,
      },
    }))
  }

  const handleRestaurarPadrao = () => {
    setConfig(criarConfiguracaoPadrao())
    setMostrarFormNovaSecao(false)
    setEditandoSecaoId(null)
  }

  // --- Gerenciador de Seções Customizadas ---
  const handleAdicionarOuAtualizarSecao = () => {
    const tituloLimpo = novoTitulo.trim()
    const subtituloLimpo = novoSubtitulo.trim()
    const conteudoLimpo = novoConteudo.trim()

    if (!tituloLimpo && !subtituloLimpo && !conteudoLimpo) {
      return
    }

    setConfig((anterior) => {
      const listaAtual = [...(anterior.secoesCustomizadas || [])]

      if (editandoSecaoId) {
        // Atualiza existente
        const atualizada = listaAtual.map((s) => {
          if (s.id === editandoSecaoId) {
            return {
              ...s,
              titulo: tituloLimpo || 'Seção Sem Título',
              subtitulo: subtituloLimpo,
              conteudo: conteudoLimpo,
            }
          }
          return s
        })
        return { ...anterior, secoesCustomizadas: atualizada, incluirSecoesCustomizadas: true }
      }

      // Adiciona nova
      const nova: SecaoCustomizada = {
        id: `secao-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        titulo: tituloLimpo || `Nova Seção ${listaAtual.length + 1}`,
        subtitulo: subtituloLimpo,
        conteudo: conteudoLimpo,
        ordem: listaAtual.length,
        ativa: true,
      }

      return {
        ...anterior,
        secoesCustomizadas: [...listaAtual, nova],
        incluirSecoesCustomizadas: true,
      }
    })

    // Limpa formulário
    setNovoTitulo('')
    setNovoSubtitulo('')
    setNovoConteudo('')
    setEditandoSecaoId(null)
    setMostrarFormNovaSecao(false)
  }

  const handleIniciarEdicao = (secao: SecaoCustomizada) => {
    setEditandoSecaoId(secao.id)
    setNovoTitulo(secao.titulo)
    setNovoSubtitulo(secao.subtitulo || '')
    setNovoConteudo(secao.conteudo)
    setMostrarFormNovaSecao(true)
  }

  const handleRemoverSecao = (id: string) => {
    setConfig((anterior) => {
      const filtrada = (anterior.secoesCustomizadas || []).filter((s) => s.id !== id)
      // Reordena índices
      const reordenada = filtrada.map((s, idx) => ({ ...s, ordem: idx }))
      return { ...anterior, secoesCustomizadas: reordenada }
    })
    if (editandoSecaoId === id) {
      setEditandoSecaoId(null)
      setMostrarFormNovaSecao(false)
      setNovoTitulo('')
      setNovoSubtitulo('')
      setNovoConteudo('')
    }
  }

  const handleMoverSecao = (index: number, direcao: 'cima' | 'baixo') => {
    setConfig((anterior) => {
      const lista = [...(anterior.secoesCustomizadas || [])]
      const alvoIndex = direcao === 'cima' ? index - 1 : index + 1
      if (alvoIndex < 0 || alvoIndex >= lista.length) return anterior

      // Troca posições
      const temp = lista[index]
      lista[index] = lista[alvoIndex]
      lista[alvoIndex] = temp

      // Atualiza índices de ordem
      const reordenada = lista.map((s, idx) => ({ ...s, ordem: idx }))
      return { ...anterior, secoesCustomizadas: reordenada }
    })
  }

  const handleAlternarSecaoCustomizada = (id: string) => {
    setConfig((anterior) => {
      const lista = (anterior.secoesCustomizadas || []).map((s) => {
        if (s.id === id) {
          return { ...s, ativa: s.ativa === false }
        }
        return s
      })
      return { ...anterior, secoesCustomizadas: lista }
    })
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
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                  config.secoes.indicesClassicos
                    ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div
                    onClick={() => alternarSecao('indicesClassicos')}
                    className="flex items-start gap-2.5 cursor-pointer flex-1"
                  >
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
                {config.secoes.indicesClassicos && (
                  <div className="pt-2 border-t border-blue-200/60 dark:border-blue-800/50 space-y-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block">
                        Título personalizado da seção:
                      </label>
                      <Input
                        value={config.titulosSecoes?.indicesClassicos || ''}
                        onChange={(e) =>
                          handleAlterarTituloSecao('indicesClassicos', e.target.value)
                        }
                        placeholder="Padrão: Índices Clássicos"
                        className="text-xs h-7.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block">
                        Subtítulo opcional da seção:
                      </label>
                      <Input
                        value={config.subtitulosSecoes?.indicesClassicos || ''}
                        onChange={(e) =>
                          handleAlterarSubtituloSecao('indicesClassicos', e.target.value)
                        }
                        placeholder="Ex.: Indicadores de Liquidez, Endividamento e Rentabilidade"
                        className="text-xs h-7.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modelos Avançados de Insolvência */}
              <div
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                  config.secoes.modelosAvancados
                    ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div
                    onClick={() => alternarSecao('modelosAvancados')}
                    className="flex items-start gap-2.5 cursor-pointer flex-1"
                  >
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
                {config.secoes.modelosAvancados && (
                  <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/50 space-y-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block">
                        Título personalizado da seção:
                      </label>
                      <Input
                        value={config.titulosSecoes?.modelosAvancados || ''}
                        onChange={(e) =>
                          handleAlterarTituloSecao('modelosAvancados', e.target.value)
                        }
                        placeholder="Padrão: Modelos Avançados"
                        className="text-xs h-7.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block">
                        Subtítulo opcional da seção:
                      </label>
                      <Input
                        value={config.subtitulosSecoes?.modelosAvancados || ''}
                        onChange={(e) =>
                          handleAlterarSubtituloSecao('modelosAvancados', e.target.value)
                        }
                        placeholder="Ex.: Análise Preditiva de Solvência, Du Pont e Modelo Dinâmico Fleuriet"
                        className="text-xs h-7.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Parecer Técnico Final */}
              <div
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                  config.secoes.parecerTecnico
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div
                    onClick={() => alternarSecao('parecerTecnico')}
                    className="flex items-start gap-2.5 cursor-pointer flex-1"
                  >
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
                {config.secoes.parecerTecnico && (
                  <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/50 space-y-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block">
                        Título personalizado da seção:
                      </label>
                      <Input
                        value={config.titulosSecoes?.parecerTecnico || ''}
                        onChange={(e) => handleAlterarTituloSecao('parecerTecnico', e.target.value)}
                        placeholder="Padrão: Parecer Técnico Oficial"
                        className="text-xs h-7.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block">
                        Subtítulo opcional da seção:
                      </label>
                      <Input
                        value={config.subtitulosSecoes?.parecerTecnico || ''}
                        onChange={(e) =>
                          handleAlterarSubtituloSecao('parecerTecnico', e.target.value)
                        }
                        placeholder="Ex.: Conclusão Executiva e Recomendação para Comitê de Crédito"
                        className="text-xs h-7.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Notas e Achados Críticos */}
              <div
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                  config.secoes.achadosCriticos
                    ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div
                    onClick={() => alternarSecao('achadosCriticos')}
                    className="flex items-start gap-2.5 cursor-pointer flex-1"
                  >
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
                {config.secoes.achadosCriticos && (
                  <div className="pt-2 border-t border-rose-200/60 dark:border-rose-800/50 space-y-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block">
                        Título personalizado da seção:
                      </label>
                      <Input
                        value={config.titulosSecoes?.achadosCriticos || ''}
                        onChange={(e) =>
                          handleAlterarTituloSecao('achadosCriticos', e.target.value)
                        }
                        placeholder="Padrão: Notas & Achados Críticos"
                        className="text-xs h-7.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block">
                        Subtítulo opcional da seção:
                      </label>
                      <Input
                        value={config.subtitulosSecoes?.achadosCriticos || ''}
                        onChange={(e) =>
                          handleAlterarSubtituloSecao('achadosCriticos', e.target.value)
                        }
                        placeholder="Ex.: Matriz de Riscos, Auditoria Contábil e Apontamentos"
                        className="text-xs h-7.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Síntese Executiva & Balanço Trienal (aplica-se ao A4) */}
              <div
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                  config.secoes.sinteseExecutiva
                    ? 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-800'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div
                    onClick={() => alternarSecao('sinteseExecutiva')}
                    className="flex items-start gap-2.5 cursor-pointer flex-1"
                  >
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
                {config.secoes.sinteseExecutiva && (
                  <div className="pt-2 border-t border-indigo-200/60 dark:border-indigo-800/50 space-y-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block">
                        Título personalizado da seção:
                      </label>
                      <Input
                        value={config.titulosSecoes?.sinteseExecutiva || ''}
                        onChange={(e) =>
                          handleAlterarTituloSecao('sinteseExecutiva', e.target.value)
                        }
                        placeholder="Padrão: Síntese Executiva & Score Ponderado"
                        className="text-xs h-7.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block">
                        Subtítulo opcional da seção:
                      </label>
                      <Input
                        value={config.subtitulosSecoes?.sinteseExecutiva || ''}
                        onChange={(e) =>
                          handleAlterarSubtituloSecao('sinteseExecutiva', e.target.value)
                        }
                        placeholder="Ex.: Resumo Executivo e Avaliação Multicritério Global"
                        className="text-xs h-7.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Agentes Especialistas e Checklist */}
              <div
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                  config.secoes.agentesEspecialistas
                    ? 'bg-purple-50/60 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div
                    onClick={() => alternarSecao('agentesEspecialistas')}
                    className="flex items-start gap-2.5 cursor-pointer flex-1"
                  >
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
                {config.secoes.agentesEspecialistas && (
                  <div className="pt-2 border-t border-purple-200/60 dark:border-purple-800/50 space-y-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block">
                        Título personalizado da seção:
                      </label>
                      <Input
                        value={config.titulosSecoes?.agentesEspecialistas || ''}
                        onChange={(e) =>
                          handleAlterarTituloSecao('agentesEspecialistas', e.target.value)
                        }
                        placeholder="Padrão: Síntese Técnica dos Agentes Especialistas"
                        className="text-xs h-7.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block">
                        Subtítulo opcional da seção:
                      </label>
                      <Input
                        value={config.subtitulosSecoes?.agentesEspecialistas || ''}
                        onChange={(e) =>
                          handleAlterarSubtituloSecao('agentesEspecialistas', e.target.value)
                        }
                        placeholder="Ex.: Recomendações dos Especialistas Contábil, Tributário e Jurídico"
                        className="text-xs h-7.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                      />
                    </div>
                  </div>
                )}
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

          {/* BLOCO 4: Seções Customizadas Próprias do Usuário */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <BookmarkPlus className="w-3.5 h-3.5 text-primary" />
                  Seções Customizadas Próprias (
                  {(config.secoesCustomizadas || []).filter((s) => s.ativa !== false).length}{' '}
                  ativas)
                </Label>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Incluir nos relatórios:
                  </span>
                  <Switch
                    checked={config.incluirSecoesCustomizadas ?? true}
                    onCheckedChange={(v) =>
                      setConfig((c) => ({ ...c, incluirSecoesCustomizadas: v }))
                    }
                  />
                </div>

                {!mostrarFormNovaSecao && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditandoSecaoId(null)
                      setNovoTitulo('')
                      setNovoConteudo('')
                      setMostrarFormNovaSecao(true)
                    }}
                    className="h-7 text-xs px-2.5 gap-1 border-primary/40 text-primary hover:bg-primary/10"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar Seção</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Formulário de Adicionar / Editar Seção */}
            {mostrarFormNovaSecao && (
              <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 dark:bg-primary/10 space-y-3 animate-in fade-in-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    {editandoSecaoId ? (
                      <>
                        <Edit3 className="w-3.5 h-3.5 text-primary" />
                        Editar Seção Customizada
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="w-3.5 h-3.5 text-primary" />
                        Criar Nova Seção Customizada
                      </>
                    )}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMostrarFormNovaSecao(false)
                      setEditandoSecaoId(null)
                      setNovoTitulo('')
                      setNovoConteudo('')
                    }}
                    className="h-6 px-2 text-[11px] text-slate-500 hover:text-slate-900"
                  >
                    Cancelar
                  </Button>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Título da Seção
                  </Label>
                  <Input
                    value={novoTitulo}
                    onChange={(e) => setNovoTitulo(e.target.value)}
                    placeholder="Ex.: Análise Setorial & Competitiva / Garantias Vinculadas / Parecer ESG"
                    className="text-xs h-8 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Subtítulo da Seção (opcional)
                  </Label>
                  <Input
                    value={novoSubtitulo}
                    onChange={(e) => setNovoSubtitulo(e.target.value)}
                    placeholder="Ex.: Contexto de Mercado, Avaliação de Colaterais e Due Diligence"
                    className="text-xs h-8 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Conteúdo / Texto Livre (multi-linha)
                  </Label>
                  <Textarea
                    value={novoConteudo}
                    onChange={(e) => setNovoConteudo(e.target.value)}
                    placeholder="Escreva livremente as conclusões, métricas adicionais, pareceres do comitê de crédito ou notas específicas..."
                    rows={4}
                    className="text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 resize-none leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMostrarFormNovaSecao(false)
                      setEditandoSecaoId(null)
                      setNovoTitulo('')
                      setNovoSubtitulo('')
                      setNovoConteudo('')
                    }}
                    className="h-7 text-xs"
                  >
                    Descartar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!novoTitulo.trim() && !novoSubtitulo.trim() && !novoConteudo.trim()}
                    onClick={handleAdicionarOuAtualizarSecao}
                    className="h-7 text-xs gap-1 bg-primary text-primary-foreground font-semibold"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{editandoSecaoId ? 'Atualizar Seção' : 'Salvar Seção'}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Lista de Seções Customizadas Cadastradas */}
            {(!config.secoesCustomizadas || config.secoesCustomizadas.length === 0) &&
            !mostrarFormNovaSecao ? (
              <div className="text-center py-5 px-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <BookmarkPlus className="w-7 h-7 mx-auto text-slate-400 mb-1.5 opacity-60" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nenhuma seção customizada adicionada ainda
                </p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5">
                  Adicione tópicos livres como Análise de Garantias, Notas de ESG, Comparativo de
                  Filiais ou Parecer de Comitê para figurarem no relatório.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMostrarFormNovaSecao(true)}
                  className="mt-3 h-7 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10"
                >
                  <Plus className="w-3 h-3" />
                  <span>Criar Primeira Seção Customizada</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {(config.secoesCustomizadas || []).map((secao, idx) => {
                  const ativa = secao.ativa !== false
                  const total = (config.secoesCustomizadas || []).length
                  return (
                    <div
                      key={secao.id}
                      className={`p-3 rounded-xl border transition-all flex flex-col gap-2 ${
                        ativa
                          ? 'bg-slate-50 dark:bg-slate-800/70 border-slate-300 dark:border-slate-700'
                          : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 px-1.5 font-mono shrink-0 bg-white dark:bg-slate-900"
                          >
                            #{idx + 1}
                          </Badge>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate block">
                              {secao.titulo || 'Seção Sem Título'}
                            </span>
                            {secao.subtitulo && (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 italic truncate block">
                                {secao.subtitulo}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Reordenação */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={idx === 0}
                            onClick={() => handleMoverSecao(idx, 'cima')}
                            className="h-6 w-6 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            title="Mover para cima"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={idx === total - 1}
                            onClick={() => handleMoverSecao(idx, 'baixo')}
                            className="h-6 w-6 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            title="Mover para baixo"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </Button>

                          {/* Editar */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleIniciarEdicao(secao)}
                            className="h-6 w-6 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            title="Editar título e conteúdo"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>

                          {/* Excluir */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoverSecao(secao.id)}
                            className="h-6 w-6 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Remover seção"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>

                          {/* Toggle ativação */}
                          <Switch
                            checked={ativa}
                            onCheckedChange={() => handleAlternarSecaoCustomizada(secao.id)}
                            className="ml-1"
                          />
                        </div>
                      </div>

                      {secao.conteudo && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                          {secao.conteudo}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* BLOCO 5: Observações e Considerações Finais Livres */}
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
