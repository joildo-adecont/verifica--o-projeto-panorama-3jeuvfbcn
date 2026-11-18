import React from 'react'
import { AlertTriangle, BadgeCheck } from 'lucide-react'
import { formatarCAEPF, validarDocumentoCadastral } from '@/services/validacaoDocumento'

interface BadgeDocumentoClienteProps {
  documento?: string
  tipoDocumento?: string
  className?: string
  mostrarMotivo?: boolean
}

/**
 * Badge de documento do cliente na coluna CNPJ/CPF.
 * Quando o número é reconhecido como CAEPF (declarado ou por amarração de
 * dígitos verificadores), exibe o selo "CAEPF" ao lado do número formatado
 * em vez de marcar o cliente como documento inválido.
 */
export const BadgeDocumentoCliente: React.FC<BadgeDocumentoClienteProps> = ({
  documento,
  tipoDocumento,
  className = '',
  mostrarMotivo = false,
}) => {
  const res = validarDocumentoCadastral(documento, tipoDocumento)
  const isCaepf = res.tipoEsperado === 'CAEPF'
  const valorExibicao = isCaepf ? formatarCAEPF(documento || '') : documento

  if (res.valido) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-mono text-[11px] text-slate-700 ${className}`}
        title={
          isCaepf && tipoDocumento?.toUpperCase().trim() !== 'CAEPF'
            ? 'CAEPF reconhecido automaticamente (mesma validação de dígitos do CNPJ)'
            : undefined
        }
      >
        {valorExibicao || '—'}
        {isCaepf && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold font-sans bg-emerald-100 text-emerald-800 border border-emerald-300">
            <BadgeCheck className="w-3 h-3 shrink-0" />
            <span>CAEPF</span>
          </span>
        )}
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
