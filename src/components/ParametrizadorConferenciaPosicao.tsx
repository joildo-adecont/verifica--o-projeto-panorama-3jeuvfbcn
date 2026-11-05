/**
 * CONFERÊNCIA POR POSIÇÃO — versão mínima, para diagnosticar a quebra.
 * Se esta renderiza, o problema está no corpo do componente; se não, está no
 * módulo de dados importado.
 */
import { useMemo, useState, useEffect } from 'react'
import { ClipboardCheck } from 'lucide-react'
import { conferirPorPosicao } from '@/data/conferenciaPosicao'

export function ParametrizadorConferenciaPosicao() {
  const [itens] = useState<any[]>([])
  const lista = useMemo(
    () =>
      conferirPorPosicao(
        itens.map((i) => ({
          ncm: i.ncm || '',
          descricao: i.descricao || '',
          valor: Number(i.valor) || 0,
        })),
      ),
    [itens],
  )
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-900">
        <ClipboardCheck className="w-3.5 h-3.5" />
        Conferência por posição — {lista.length} caso(s)
      </p>
      <p className="text-[10px] text-slate-600">
        Componente carregado. O módulo de conferência respondeu.
      </p>
    </div>
  )
}
