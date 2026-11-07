import React from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { validarDocumentoCadastral } from '@/services/validacaoDocumento'

interface BadgeDocumentoClienteProps {
  documento?: string
  tipoDocumento?: string
  className?: string
  mostrarMotivo?: boolean
}

export const BadgeDocumentoCliente: React.FC<BadgeDocumentoClienteProps> = ({
  documento,
  tipoDocumento,
  className = '',
  mostrarMotivo = false,
}) => {
  const res = validarDocumentoCadastral(documento, tipoDocumento)

  if (res.valido) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-mono text-[11px] text-slate-700 ${className}`}
      >
        <span>{documento || '—'}</span>
      </span>
    )
  }

  // Documento ausente ou inválido
  return (
    <div className={`inline-flex flex-col gap-0.5 ${className}`}>
      <div className="inline-flex items-center gap-1.5">
        <span className="font-mono text-[11px] text-amber-900 font-semibold line-through opacity-80">
          {documento || '(vazio)'}
        </span>
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300"
          title={res.motivoInvalido || 'Documento inválido — corrigir manualmente no cadastro'}
        >
          <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0" />
          <span>Documento inválido — corrigir manualmente</span>
        </span>
      </div>
      {mostrarMotivo && res.motivoInvalido && (
        <span className="text-[10px] text-amber-700 italic">{res.motivoInvalido}</span>
      )}
    </div>
  )
}
