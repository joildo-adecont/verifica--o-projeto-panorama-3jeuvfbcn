import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AdecontLogo } from '@/components/AdecontLogo'
import { Check, Copy, MessageSquare, Mail, KeyRound, ExternalLink } from 'lucide-react'
import {
  gerarTextoConfirmacaoWhatsApp,
  gerarTextoConfirmacaoEmail,
  DadosMensagemConfirmacao,
} from '@/services/sistemaUsuarios'

export interface ModalMensagemProntaProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dados: DadosMensagemConfirmacao | null
}

export function ModalMensagemPronta({ open, onOpenChange, dados }: ModalMensagemProntaProps) {
  const [copiadoWhats, setCopiadoWhats] = useState(false)
  const [copiadoEmail, setCopiadoEmail] = useState(false)

  if (!dados) return null

  const textoWhatsApp = gerarTextoConfirmacaoWhatsApp(dados)
  const { assunto, corpo } = gerarTextoConfirmacaoEmail(dados)

  const copiarParaWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(textoWhatsApp)
      setCopiadoWhats(true)
      setTimeout(() => setCopiadoWhats(false), 2500)
    } catch {
      /* fallback */
    }
  }

  const copiarParaEmail = async () => {
    try {
      const textoCompleto = `Assunto: ${assunto}\n\n${corpo}`
      await navigator.clipboard.writeText(textoCompleto)
      setCopiadoEmail(true)
      setTimeout(() => setCopiadoEmail(false), 2500)
    } catch {
      /* fallback */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <AdecontLogo variante="colorido" tamanho="md" />
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              Pendente de Confirmação
            </span>
          </div>

          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-600" />
            Mensagem Pronta de Ativação de Cadastro
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600 dark:text-slate-400">
            O usuário <strong>{dados.nome}</strong> foi registrado e seu acesso está{' '}
            <strong>pendente até a confirmação do código</strong>. Copie a mensagem institucional
            abaixo e envie diretamente via WhatsApp ou e-mail.
          </DialogDescription>
        </DialogHeader>

        {/* Destaque do Código Gerado */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Código de Ativação Gerado:
            </span>
            <span className="text-xl font-black font-mono tracking-wider text-emerald-700 dark:text-emerald-400">
              {dados.codigo}
            </span>
          </div>
          {dados.senhaTemporaria && (
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Senha Provisória:
              </span>
              <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-200">
                {dados.senhaTemporaria}
              </span>
            </div>
          )}
        </div>

        {/* Pré-visualização da Mensagem */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            Texto Institucional Formatado ADECONT:
          </label>
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-300 whitespace-pre-wrap max-h-52 overflow-y-auto leading-relaxed">
            {textoWhatsApp}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              onClick={copiarParaWhatsApp}
              className="flex-1 sm:flex-initial h-9 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {copiadoWhats ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiadoWhats ? 'Copiado para WhatsApp!' : 'Copiar mensagem para WhatsApp'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={copiarParaEmail}
              className="flex-1 sm:flex-initial h-9 text-xs gap-1.5 font-semibold"
            >
              {copiadoEmail ? <Check className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
              {copiadoEmail ? 'Copiado para E-mail!' : 'Copiar mensagem para e-mail'}
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8 text-slate-600 hover:text-slate-900"
          >
            Concluir e Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
