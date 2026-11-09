/**
 * Modal de Confirmação Individual com Campo de Motivo para Status
 * Sistema ADECONT — Projeto Panorama
 *
 * Utilizada para inativação e reativação individual de clientes pelo pill
 * de Status/Ação e pela Ficha Cadastral, gravando o motivo na auditoria.
 */

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog'
import { Button } from './ui/button'
import { UserX, UserCheck, Loader2, Building2, AlertCircle } from 'lucide-react'

export interface ClienteStatusAlvo {
  codigo: number
  razao_social?: string
  cpf_cnpj?: string
  numero_documento?: string
  situacao?: string
  id?: string
}

export interface ModalConfirmarStatusClienteProps {
  aberto: boolean
  acao: 'inativar' | 'reativar'
  cliente: ClienteStatusAlvo | null
  processando?: boolean
  aoConfirmar: (motivo: string) => Promise<void> | void
  aoCancelar: () => void
}

export const ModalConfirmarStatusCliente: React.FC<ModalConfirmarStatusClienteProps> = ({
  aberto,
  acao,
  cliente,
  processando = false,
  aoConfirmar,
  aoCancelar,
}) => {
  const [motivo, setMotivo] = useState('')

  // Limpa o motivo sempre que abrir para um novo cliente
  useEffect(() => {
    if (aberto) {
      setMotivo('')
    }
  }, [aberto, cliente?.codigo])

  if (!cliente) return null

  const ehInativar = acao === 'inativar'
  const nomeCliente = cliente.razao_social || `Cliente #${cliente.codigo}`
  const docCliente = cliente.cpf_cnpj || cliente.numero_documento || 'Não informado'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (processando) return
    aoConfirmar(motivo.trim())
  }

  return (
    <Dialog open={aberto} onOpenChange={(open) => !open && !processando && aoCancelar()}>
      <DialogContent className="max-w-md bg-white border border-slate-200 text-slate-800 shadow-2xl p-5 sm:p-6">
        <DialogHeader className="text-left space-y-2">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border shrink-0 ${
                ehInativar
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              {ehInativar ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {ehInativar ? 'Inativar Cliente' : 'Reativar Cliente'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                {ehInativar
                  ? 'Transferir cliente para o Cadastro Analítico de Inativos'
                  : 'Restaurar cliente para a carteira ativa de clientes'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Card identificador do cliente */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Código #{cliente.codigo}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  ehInativar ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                Status Atual: {cliente.situacao || (ehInativar ? 'Ativa' : 'Inativa')}
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span className="font-bold text-slate-900 line-clamp-2 leading-snug">
                {nomeCliente}
              </span>
            </div>
            <div className="text-[11px] text-slate-600 font-mono">
              Documento: <span className="font-semibold text-slate-800">{docCliente}</span>
            </div>
          </div>

          {/* Campo de Motivo */}
          <div className="space-y-1.5">
            <label
              htmlFor="motivo-status-individual"
              className="text-xs font-semibold text-slate-800 flex items-center justify-between"
            >
              <span>Motivo da alteração de status (opcional):</span>
              <span className="text-[10px] font-normal text-slate-400">Trilha de auditoria</span>
            </label>
            <textarea
              id="motivo-status-individual"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              disabled={processando}
              placeholder={
                ehInativar
                  ? 'Ex.: Encerramento de contrato, suspensão temporária a pedido do cliente, fusão ou baixa cadastral...'
                  : 'Ex.: Retomada das atividades contábeis, renovação contratual, regularização de pendências...'
              }
              className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F294A] focus:border-[#0F294A] placeholder:text-slate-400 transition-all resize-none disabled:opacity-60"
            />
            <p className="text-[10.5px] text-slate-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-[#D4AF37] shrink-0" />
              <span>
                O motivo e a data/hora serão gravados no histórico de auditoria da ADECONT.
              </span>
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={aoCancelar}
              disabled={processando}
              className="text-xs font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={processando}
              className={`text-xs font-bold text-white shadow-xs ${
                ehInativar
                  ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500'
                  : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500'
              }`}
            >
              {processando ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  {ehInativar ? 'Inativando cliente…' : 'Reativando cliente…'}
                </>
              ) : (
                <>
                  {ehInativar ? (
                    <>
                      <UserX className="w-3.5 h-3.5 mr-1.5" />
                      Inativar Cliente
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                      Reativar Cliente
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
