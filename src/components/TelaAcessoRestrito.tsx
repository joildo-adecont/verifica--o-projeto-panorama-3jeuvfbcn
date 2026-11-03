import { AdecontLogo } from '@/components/AdecontLogo'
import { Button } from '@/components/ui/button'
import { ShieldAlert, ArrowLeft, Lock, LogIn } from 'lucide-react'
import { useState } from 'react'
import { ModalLogin } from '@/components/ModalLogin'
import { SistemaUsuario } from '@/services/sistemaUsuarios'

export interface TelaAcessoRestritoProps {
  segmentoNome?: string
  motivo?: string
  usuario?: SistemaUsuario | null
}

export function TelaAcessoRestrito({ segmentoNome, motivo, usuario }: TelaAcessoRestritoProps) {
  const [modalLoginAberto, setModalLoginAberto] = useState(false)

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 text-center space-y-6">
        <div className="flex justify-center pb-2">
          <AdecontLogo variante="colorido" tamanho="lg" />
        </div>

        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 flex items-center justify-center text-amber-700 dark:text-amber-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800">
            <Lock className="w-3.5 h-3.5" />
            Acesso Restrito Institucional
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
            Seu nível não permite este segmento
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {motivo ||
              (segmentoNome
                ? `O segmento "${segmentoNome}" é restrito a perfis autorizados da ADECONT Assessoria Contábil e Administrativa.`
                : 'Você tentou acessar uma seção que requer permissão específica de consulta ou administração.')}
          </p>
        </div>

        {usuario && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Usuário atual:
              </span>
              <span className="font-bold">{usuario.nome}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Nível de acesso:
              </span>
              <span className="font-black px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                {usuario.nivel}
              </span>
            </div>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              window.location.hash = '#inicio'
            }}
            className="w-full sm:w-auto text-xs gap-1.5 h-9"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao Painel Inicial
          </Button>

          {!usuario ? (
            <Button
              type="button"
              onClick={() => setModalLoginAberto(true)}
              className="w-full sm:w-auto text-xs gap-1.5 h-9 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
            >
              <LogIn className="w-3.5 h-3.5" />
              Identificar-se com Senha
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => {
                window.location.hash = '#nivel-acesso'
              }}
              className="w-full sm:w-auto text-xs gap-1.5 h-9 bg-panorama-navy hover:bg-panorama-navy-light text-white font-semibold"
            >
              Consultar Meus Níveis de Acesso
            </Button>
          )}
        </div>
      </div>

      <ModalLogin
        open={modalLoginAberto}
        onOpenChange={setModalLoginAberto}
        onSucessoLogin={() => {
          // Recarrega permissão na página
          window.location.reload()
        }}
      />
    </div>
  )
}
