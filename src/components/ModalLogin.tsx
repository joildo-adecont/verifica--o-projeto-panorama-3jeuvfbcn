import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AdecontLogo } from '@/components/AdecontLogo'
import {
  loginSistemaUsuario,
  confirmarCodigoUsuario,
  definirUsuarioAtivoLocal,
  SistemaUsuario,
} from '@/services/sistemaUsuarios'
import { Lock, Mail, KeyRound, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react'

export interface ModalLoginProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSucessoLogin?: (usuario: SistemaUsuario) => void
}

export function ModalLogin({ open, onOpenChange, onSucessoLogin }: ModalLoginProps) {
  const [identificador, setIdentificador] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  // Estado para confirmação de código quando o login informa que está pendente
  const [modoConfirmacao, setModoConfirmacao] = useState(false)
  const [codigoConfirmacao, setCodigoConfirmacao] = useState('')
  const [emailPendente, setEmailPendente] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    setSucesso(null)

    if (!identificador.trim() || !senha.trim()) {
      setErro('Por favor, informe seu e-mail e senha para acessar.')
      return
    }

    setCarregando(true)
    try {
      const res = await loginSistemaUsuario(identificador, senha)

      if (res.sucesso && res.usuario) {
        definirUsuarioAtivoLocal(res.usuario)
        setSucesso(res.mensagem || 'Login realizado com sucesso!')
        if (onSucessoLogin) {
          onSucessoLogin(res.usuario)
        }
        setTimeout(() => {
          onOpenChange(false)
          setSucesso(null)
          setSenha('')
        }, 900)
      } else if (res.pendente_confirmacao) {
        setModoConfirmacao(true)
        setEmailPendente(res.email || identificador)
        if (res.codigo_confirmacao) {
          setCodigoConfirmacao(res.codigo_confirmacao)
        }
        setErro(res.mensagem)
      } else {
        setErro(res.mensagem || 'Credenciais inválidas. Verifique seu e-mail e senha.')
      }
    } catch {
      setErro('Não foi possível conectar ao serviço de autenticação ADECONT. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  const handleConfirmarCodigo = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    setSucesso(null)

    if (!codigoConfirmacao.trim()) {
      setErro('Informe o código de confirmação recebido por WhatsApp ou e-mail.')
      return
    }

    setCarregando(true)
    try {
      const res = await confirmarCodigoUsuario(codigoConfirmacao, emailPendente)
      if (res.sucesso && res.usuario) {
        definirUsuarioAtivoLocal(res.usuario)
        setSucesso(res.mensagem || 'Cadastro confirmado com sucesso! Você já está autenticado.')
        if (onSucessoLogin) {
          onSucessoLogin(res.usuario)
        }
        setTimeout(() => {
          onOpenChange(false)
          setModoConfirmacao(false)
          setSucesso(null)
          setSenha('')
        }, 1200)
      } else {
        setErro(res.mensagem || 'Código de confirmação incorreto ou expirado.')
      }
    } catch {
      setErro('Erro ao validar código. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  const preencherAdminDemo = () => {
    setIdentificador('joildo@adecont.com.br')
    setSenha('Adecont@2026')
    setErro(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
        <DialogHeader className="space-y-3 text-center sm:text-left">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <AdecontLogo variante="colorido" tamanho="md" />
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <Sparkles className="w-3 h-3" />
              Portal Corporativo
            </div>
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-600" />
            {modoConfirmacao ? 'Ativação de Cadastro' : 'Identificação do Usuário'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600 dark:text-slate-400">
            {modoConfirmacao
              ? 'Insira o código de confirmação recebido por WhatsApp ou e-mail para desbloquear seu acesso.'
              : 'Informe seu e-mail corporativo e senha cadastrados no sistema Panorama RT.'}
          </DialogDescription>
        </DialogHeader>

        {erro && (
          <Alert variant="destructive" className="py-2 px-3 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <AlertDescription className="text-xs leading-relaxed">{erro}</AlertDescription>
          </Alert>
        )}

        {sucesso && (
          <Alert className="py-2 px-3 text-xs bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <AlertDescription className="text-xs">{sucesso}</AlertDescription>
          </Alert>
        )}

        {!modoConfirmacao ? (
          <form onSubmit={handleLogin} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="login-identificador"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                E-mail ou Usuário Corporativo
              </Label>
              <Input
                id="login-identificador"
                type="text"
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                placeholder="ex: joildo@adecont.com.br"
                className="h-9 text-xs"
                autoComplete="username"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="login-senha"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                  Senha de Acesso
                </Label>
              </div>
              <Input
                id="login-senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="h-9 text-xs font-mono"
                autoComplete="current-password"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
              <button
                type="button"
                onClick={preencherAdminDemo}
                className="text-emerald-700 hover:underline dark:text-emerald-400"
              >
                Preencher Administrador ADECONT
              </button>
              <button
                type="button"
                onClick={() => setModoConfirmacao(true)}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 underline"
              >
                Tenho um código de ativação
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={carregando}
                className="h-8 text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={carregando}
                className="h-8 text-xs bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 font-medium"
              >
                {carregando ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    Entrar no Sistema
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleConfirmarCodigo} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="conf-email"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                E-mail Vinculado ao Cadastro (opcional)
              </Label>
              <Input
                id="conf-email"
                type="email"
                value={emailPendente}
                onChange={(e) => setEmailPendente(e.target.value)}
                placeholder="seu.email@adecont.com.br"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="conf-codigo"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                Código de Confirmação (WhatsApp / E-mail)
              </Label>
              <Input
                id="conf-codigo"
                type="text"
                value={codigoConfirmacao}
                onChange={(e) => setCodigoConfirmacao(e.target.value.toUpperCase())}
                placeholder="Ex: ADEC-7K2X9P"
                className="h-10 text-center font-mono font-bold tracking-wider text-sm border-emerald-300 uppercase"
                required
              />
              <p className="text-[11px] text-slate-500">
                Copie o código exatamente como enviado na mensagem da ADECONT.
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  setModoConfirmacao(false)
                  setErro(null)
                }}
                className="text-xs text-slate-600 hover:text-slate-900 underline"
              >
                ← Voltar para login com senha
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={carregando}
                className="h-8 text-xs"
              >
                Fechar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={carregando}
                className="h-8 text-xs bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 font-medium"
              >
                {carregando ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Validando Código...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Ativar Cadastro
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
