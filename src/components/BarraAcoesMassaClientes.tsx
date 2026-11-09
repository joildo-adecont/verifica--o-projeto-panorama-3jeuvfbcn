import React, { useState } from 'react'
import {
  CheckSquare,
  X,
  Edit3,
  UserX,
  UserCheck,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Building2,
  MapPin,
  Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { OPCOES_REGIME_TRIBUTARIO, OPCOES_SITUACAO_CADASTRO } from '@/types/cadastroEmpresas'
import { UFS_BRASIL } from '@/services/radarMunicipios'
import type { EmpresaRecord } from '@/types/cadastroEmpresas'
import type {
  DadosEdicaoEmMassa,
  DadosAlteracaoStatusEmMassa,
  DadosAlteracaoRegimeEmMassa,
} from '@/services/cadastroEmpresasMassa'

export interface BarraAcoesMassaClientesProps {
  clientesSelecionados: EmpresaRecord[]
  modo: 'ativos' | 'inativos'
  processando: boolean
  onLimparSelecao: () => void
  onExecutarInativacaoEmMassa?: (clientes: EmpresaRecord[], motivo?: string) => Promise<void>
  onExecutarReativacaoEmMassa?: (clientes: EmpresaRecord[]) => Promise<void>
  onExecutarEdicaoEmMassa: (clientes: EmpresaRecord[], dados: DadosEdicaoEmMassa) => Promise<void>
  onExecutarAlteracaoStatusEmMassa?: (
    clientes: EmpresaRecord[],
    dados: DadosAlteracaoStatusEmMassa,
  ) => Promise<void>
  onExecutarAlteracaoRegimeEmMassa?: (
    clientes: EmpresaRecord[],
    dados: DadosAlteracaoRegimeEmMassa,
  ) => Promise<void>
}

type ModalAcao = 'edicao' | 'regime' | 'status' | 'inativar' | 'reativar' | null

export const BarraAcoesMassaClientes: React.FC<BarraAcoesMassaClientesProps> = ({
  clientesSelecionados,
  modo,
  processando,
  onLimparSelecao,
  onExecutarInativacaoEmMassa,
  onExecutarReativacaoEmMassa,
  onExecutarEdicaoEmMassa,
  onExecutarAlteracaoStatusEmMassa,
  onExecutarAlteracaoRegimeEmMassa,
}) => {
  const [modalAberto, setModalAberto] = useState<ModalAcao>(null)

  // Estados dos campos de edição em massa (campos comuns)
  const [alterarRegime, setAlterarRegime] = useState(false)
  const [novoRegime, setNovoRegime] = useState('')
  const [alterarMunicipio, setAlterarMunicipio] = useState(false)
  const [novoMunicipio, setNovoMunicipio] = useState('')
  const [alterarUf, setAlterarUf] = useState(false)
  const [novaUf, setNovaUf] = useState('')

  // Estados da ação dedicada: Alterar Regime Tributário
  const [regimeDedicado, setRegimeDedicado] = useState('')
  const [motivoRegime, setMotivoRegime] = useState('')

  // Estados da ação de status e inativação
  const [novoStatus, setNovoStatus] = useState<string>('')
  const [motivoStatus, setMotivoStatus] = useState('')
  const [motivoInativacao, setMotivoInativacao] = useState('')

  const count = clientesSelecionados.length
  if (count === 0) return null

  const abrirModalEdicao = () => {
    setAlterarRegime(false)
    setNovoRegime('')
    setAlterarMunicipio(false)
    setNovoMunicipio('')
    setAlterarUf(false)
    setNovaUf('')
    setModalAberto('edicao')
  }

  const abrirModalRegime = () => {
    setRegimeDedicado('')
    setMotivoRegime('')
    setModalAberto('regime')
  }

  const abrirModalStatus = () => {
    // Sugestão padrão coerente com o modo:
    // Se ativos, sugere 'Suspensa' ou primeiro diferente; se inativos, sugere 'Ativa'
    setNovoStatus(modo === 'inativos' ? 'Ativa' : 'Suspensa')
    setMotivoStatus('')
    setModalAberto('status')
  }

  const fecharModal = () => {
    if (processando) return
    setModalAberto(null)
  }

  const handleConfirmarAcao = async () => {
    if (modalAberto === 'edicao') {
      const dados: DadosEdicaoEmMassa = {}
      if (alterarRegime && novoRegime) dados.regime_tributario = novoRegime
      if (alterarMunicipio && novoMunicipio) dados.municipio = novoMunicipio
      if (alterarUf && novaUf) dados.uf = novaUf

      await onExecutarEdicaoEmMassa(clientesSelecionados, dados)
      setModalAberto(null)
    } else if (modalAberto === 'regime' && regimeDedicado) {
      if (onExecutarAlteracaoRegimeEmMassa) {
        await onExecutarAlteracaoRegimeEmMassa(clientesSelecionados, {
          novoRegime: regimeDedicado,
          motivo: motivoRegime,
        })
      } else {
        // Fallback transparente usando onExecutarEdicaoEmMassa caso a prop dedicada não tenha sido passada
        await onExecutarEdicaoEmMassa(clientesSelecionados, {
          regime_tributario: regimeDedicado,
        })
      }
      setModalAberto(null)
    } else if (modalAberto === 'status' && onExecutarAlteracaoStatusEmMassa && novoStatus) {
      await onExecutarAlteracaoStatusEmMassa(clientesSelecionados, {
        novaSituacao: novoStatus,
        motivo: motivoStatus,
      })
      setModalAberto(null)
    } else if (modalAberto === 'inativar' && onExecutarInativacaoEmMassa) {
      await onExecutarInativacaoEmMassa(clientesSelecionados, motivoInativacao)
      setModalAberto(null)
    } else if (modalAberto === 'reativar' && onExecutarReativacaoEmMassa) {
      await onExecutarReativacaoEmMassa(clientesSelecionados)
      setModalAberto(null)
    }
  }

  const temCamposEdicaoSelecionados =
    (alterarRegime && !!novoRegime) ||
    (alterarMunicipio && !!novoMunicipio.trim()) ||
    (alterarUf && !!novaUf)

  return (
    <>
      {/* Barra de Ações em Massa - Padrão ADECONT */}
      <div className="sticky top-2 z-30 mb-4 bg-gradient-to-r from-[#0E2038] via-[#13335A] to-[#1A4574] text-white rounded-xl shadow-lg border border-[#2D5A8E]/60 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm sm:text-base text-white">
                {count} {count === 1 ? 'cliente selecionado' : 'clientes selecionados'}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/10 font-medium">
                Edição em Massa
              </span>
            </div>
            <p className="text-[11px] text-slate-300 hidden sm:block">
              Aplique alterações ou movimentações de uma só vez aos clientes marcados
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Botão Dedicado: Alterar Regime Tributário em Massa */}
          <Button
            type="button"
            size="sm"
            onClick={abrirModalRegime}
            disabled={processando}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm h-8 px-3 shadow-sm border border-emerald-400/30"
            title="Alterar o regime tributário de todos os clientes selecionados"
          >
            <Building2 className="w-3.5 h-3.5 mr-1.5" />
            Alterar Regime
          </Button>

          {/* Botão de Edição de Campos Comuns */}
          <Button
            type="button"
            size="sm"
            onClick={abrirModalEdicao}
            disabled={processando}
            className="bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs sm:text-sm h-8 px-3 shadow-sm border border-sky-400/30"
          >
            <Edit3 className="w-3.5 h-3.5 mr-1.5" />
            Editar Campos
          </Button>

          {/* Botão de Alterar Status em Massa */}
          {onExecutarAlteracaoStatusEmMassa && (
            <Button
              type="button"
              size="sm"
              onClick={abrirModalStatus}
              disabled={processando}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm h-8 px-3 shadow-sm border border-indigo-400/30"
              title="Alterar a situação cadastral (status) de todos os clientes selecionados"
            >
              <Tag className="w-3.5 h-3.5 mr-1.5" />
              Alterar Status
            </Button>
          )}

          {/* Botão de Inativar em Massa (somente ativos) */}
          {modo === 'ativos' && onExecutarInativacaoEmMassa && (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setMotivoInativacao('')
                setModalAberto('inativar')
              }}
              disabled={processando}
              className="bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs sm:text-sm h-8 px-3 shadow-sm border border-amber-400/30"
            >
              <UserX className="w-3.5 h-3.5 mr-1.5" />
              Inativar em Massa
            </Button>
          )}

          {/* Botão de Reativar em Massa (somente inativos) */}
          {modo === 'inativos' && onExecutarReativacaoEmMassa && (
            <Button
              type="button"
              size="sm"
              onClick={() => setModalAberto('reativar')}
              disabled={processando}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm h-8 px-3 shadow-sm border border-emerald-400/30"
            >
              <UserCheck className="w-3.5 h-3.5 mr-1.5" />
              Reativar em Massa
            </Button>
          )}

          {/* Botão para Limpar Seleção */}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onLimparSelecao}
            disabled={processando}
            className="text-slate-300 hover:text-white hover:bg-white/10 text-xs sm:text-sm h-8 px-2.5"
            title="Limpar seleção atual"
          >
            <X className="w-4 h-4 mr-1" />
            Limpar
          </Button>
        </div>
      </div>

      {/* Modal de Confirmação: Edição em Massa de Campos */}
      <Dialog open={modalAberto === 'edicao'} onOpenChange={(open) => !open && fecharModal()}>
        <DialogContent className="max-w-lg bg-white border border-slate-200 text-slate-800 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-sky-100 text-sky-700">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
                  Edição em Massa de Clientes
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Selecione os campos que deseja alterar nos {count}{' '}
                  {count === 1 ? 'cliente selecionado' : 'clientes selecionados'}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs sm:text-sm">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Apenas os campos marcados abaixo serão sobrescritos nos registros selecionados. Os
                demais dados permanecerão inalterados.
              </span>
            </div>

            {/* Opção 1: Regime Tributário */}
            <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={alterarRegime}
                  onChange={(e) => setAlterarRegime(e.target.checked)}
                  className="rounded border-slate-300 text-[#13335A] focus:ring-[#13335A] h-4 w-4"
                />
                <Building2 className="w-4 h-4 text-slate-500" />
                <span>Atualizar Regime Tributário</span>
              </label>

              {alterarRegime && (
                <div className="pl-6 pt-1">
                  <select
                    value={novoRegime}
                    onChange={(e) => setNovoRegime(e.target.value)}
                    className="w-full text-xs sm:text-sm rounded-md border border-slate-300 bg-white px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#13335A]"
                  >
                    <option value="">Selecione o novo regime...</option>
                    {OPCOES_REGIME_TRIBUTARIO.map((reg) => (
                      <option key={reg} value={reg}>
                        {reg}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Opção 2: Município */}
            <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={alterarMunicipio}
                  onChange={(e) => setAlterarMunicipio(e.target.checked)}
                  className="rounded border-slate-300 text-[#13335A] focus:ring-[#13335A] h-4 w-4"
                />
                <MapPin className="w-4 h-4 text-slate-500" />
                <span>Atualizar Município</span>
              </label>

              {alterarMunicipio && (
                <div className="pl-6 pt-1">
                  <Input
                    type="text"
                    value={novoMunicipio}
                    onChange={(e) => setNovoMunicipio(e.target.value)}
                    placeholder="Nome do município (ex.: Flores da Cunha, Caxias do Sul)"
                    className="text-xs sm:text-sm h-8"
                  />
                </div>
              )}
            </div>

            {/* Opção 3: UF */}
            <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={alterarUf}
                  onChange={(e) => setAlterarUf(e.target.checked)}
                  className="rounded border-slate-300 text-[#13335A] focus:ring-[#13335A] h-4 w-4"
                />
                <MapPin className="w-4 h-4 text-slate-500" />
                <span>Atualizar Unidade Federativa (UF)</span>
              </label>

              {alterarUf && (
                <div className="pl-6 pt-1">
                  <select
                    value={novaUf}
                    onChange={(e) => setNovaUf(e.target.value)}
                    className="w-full text-xs sm:text-sm rounded-md border border-slate-300 bg-white px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#13335A]"
                  >
                    <option value="">Selecione o estado (UF)...</option>
                    {UFS_BRASIL.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={fecharModal}
              disabled={processando}
              className="text-xs sm:text-sm"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmarAcao}
              disabled={processando || !temCamposEdicaoSelecionados}
              className="bg-[#13335A] hover:bg-[#0E2038] text-white text-xs sm:text-sm"
            >
              {processando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando alterações...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar e Aplicar ({count})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Dedicado: Alterar Regime Tributário em Massa */}
      <Dialog open={modalAberto === 'regime'} onOpenChange={(open) => !open && fecharModal()}>
        <DialogContent className="max-w-md bg-white border border-slate-200 text-slate-800 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
                  Alterar Regime Tributário em Massa
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Selecione o novo regime para os {count}{' '}
                  {count === 1 ? 'cliente selecionado' : 'clientes selecionados'}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs sm:text-sm">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                O regime tributário de todos os <strong>{count} clientes selecionados</strong> será
                atualizado de uma só vez, com registro de histórico para auditoria.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <span>Novo Regime Tributário:</span>
                <span className="text-rose-500">*</span>
              </label>
              <select
                aria-label="Selecionar novo regime tributário em massa"
                value={regimeDedicado}
                onChange={(e) => setRegimeDedicado(e.target.value)}
                className="w-full text-xs sm:text-sm rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
              >
                <option value="">Selecione o novo regime...</option>
                {OPCOES_REGIME_TRIBUTARIO.map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-800">
                Motivo da alteração de regime (opcional):
              </label>
              <Input
                type="text"
                value={motivoRegime}
                onChange={(e) => setMotivoRegime(e.target.value)}
                placeholder="Ex.: Opção pelo Simples Nacional exercício 2026 / Planejamento Tributário"
                className="text-xs sm:text-sm h-8"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={fecharModal}
              disabled={processando}
              className="text-xs sm:text-sm"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmarAcao}
              disabled={processando || !regimeDedicado}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold"
            >
              {processando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando regime...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar e Aplicar ({count})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação: Alterar Status em Massa */}
      <Dialog open={modalAberto === 'status'} onOpenChange={(open) => !open && fecharModal()}>
        <DialogContent className="max-w-md bg-white border border-slate-200 text-slate-800 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
                  Alterar Status em Massa
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Defina a nova situação cadastral para os {count}{' '}
                  {count === 1 ? 'cliente selecionado' : 'clientes selecionados'}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs sm:text-sm">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                A situação dos {count} clientes será alterada para o valor escolhido abaixo.
                {modo === 'ativos' && (
                  <>
                    {' '}
                    Caso escolha "Inativa", os clientes serão transferidos para o Cadastro de
                    Inativos.
                  </>
                )}
                {modo === 'inativos' && (
                  <> Caso escolha "Ativa", os clientes serão restaurados para o Cadastro Ativo.</>
                )}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <span>Novo Status / Situação Cadastral:</span>
                <span className="text-rose-500">*</span>
              </label>
              <select
                value={novoStatus}
                onChange={(e) => setNovoStatus(e.target.value)}
                className="w-full text-xs sm:text-sm rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
              >
                <option value="">Selecione o novo status...</option>
                {OPCOES_SITUACAO_CADASTRO.map((sit) => (
                  <option key={sit} value={sit}>
                    {sit}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-800">
                Motivo da alteração de status (opcional):
              </label>
              <Input
                type="text"
                value={motivoStatus}
                onChange={(e) => setMotivoStatus(e.target.value)}
                placeholder="Ex.: Auditoria periódica da carteira de clientes"
                className="text-xs sm:text-sm h-8"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={fecharModal}
              disabled={processando}
              className="text-xs sm:text-sm"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmarAcao}
              disabled={processando || !novoStatus}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold"
            >
              {processando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Atualizando status...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar e Aplicar ({count})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação: Inativar em Massa */}
      <Dialog open={modalAberto === 'inativar'} onOpenChange={(open) => !open && fecharModal()}>
        <DialogContent className="max-w-md bg-white border border-slate-200 text-slate-800 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
                  Inativar {count} {count === 1 ? 'Cliente' : 'Clientes'}?
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Os clientes selecionados serão transferidos para o Cadastro Analítico de Clientes
                  Inativos.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs sm:text-sm">
            <p className="text-slate-700">
              Você está prestes a mover <strong>{count} clientes</strong> da carteira ativa. Eles
              deixarão de ser listados nesta tela e poderão ser reativados a qualquer momento pelo
              Cadastro de Inativos.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Motivo da inativação (opcional):
              </label>
              <Input
                type="text"
                value={motivoInativacao}
                onChange={(e) => setMotivoInativacao(e.target.value)}
                placeholder="Ex.: Inativação em lote solicitada pela diretoria"
                className="text-xs sm:text-sm h-8"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={fecharModal}
              disabled={processando}
              className="text-xs sm:text-sm"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmarAcao}
              disabled={processando}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm"
            >
              {processando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Inativando clientes...
                </>
              ) : (
                <>
                  <UserX className="w-4 h-4 mr-2" />
                  Confirmar Inativação ({count})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação: Reativar em Massa */}
      <Dialog open={modalAberto === 'reativar'} onOpenChange={(open) => !open && fecharModal()}>
        <DialogContent className="max-w-md bg-white border border-slate-200 text-slate-800 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
                  Reativar {count} {count === 1 ? 'Cliente' : 'Clientes'}?
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Os clientes selecionados serão restaurados para o Cadastro Analítico de Clientes
                  Ativos.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs sm:text-sm">
            <p className="text-slate-700">
              Você está prestes a reativar <strong>{count} clientes</strong>. Eles voltarão com a
              situação "Ativa" no cadastro principal do sistema ADECONT.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={fecharModal}
              disabled={processando}
              className="text-xs sm:text-sm"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmarAcao}
              disabled={processando}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm"
            >
              {processando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Reativando clientes...
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Confirmar Reativação ({count})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
