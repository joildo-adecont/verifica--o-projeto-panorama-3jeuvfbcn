import { ChevronRight, Building2, X } from 'lucide-react'

/**
 * Trilha de volta (breadcrumb) da FICHA do cliente.
 *
 * Pedido "Melhorar navegação entre módulos" (fase ficha): dentro da ficha
 * ModalFichaClienteDetalhada o usuário ficava "preso" — não havia referência
 * de onde ele veio nem caminho de volta para a listagem além do X.
 *
 * Componente SEPARADO para NÃO crescer ModalFichaClienteDetalhada.tsx
 * (que já passa de 1000 linhas) nem CadastroClientes.tsx (~1700 linhas).
 *
 * Ação "voltar" = fechar a ficha e voltar à listagem preservando posição
 * (a listagem nunca desmonta — a ficha é modal — então filtro/página/aba
 * e a posição da BarraRolagemHorizontalFixa permanecem como estavam).
 */
interface TrilhaFichaClienteProps {
  /** Razão social / nome do cliente em ficha */
  nomeCliente: string
  /** Módulo de origem: listagem ativa ou de inativos (rótulo do 1º nível) */
  rotuloListagem: string
  /** Fechar a ficha e voltar à listagem */
  aoVoltar: () => void
}

export function TrilhaFichaCliente({
  nomeCliente,
  rotuloListagem,
  aoVoltar,
}: TrilhaFichaClienteProps) {
  return (
    <nav
      aria-label="Trilha de volta para a listagem de clientes"
      className="flex items-center gap-1.5 min-w-0 text-xs bg-white/10 rounded-lg px-2.5 py-1 border border-white/10"
    >
      <button
        onClick={aoVoltar}
        className="inline-flex items-center gap-1.5 font-bold text-[#D4AF37] hover:text-amber-200 transition-colors cursor-pointer shrink-0"
        title="Fechar a ficha e voltar à listagem (posição e filtros preservados)"
      >
        <Building2 className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate max-w-[140px] sm:max-w-[200px]">{rotuloListagem}</span>
      </button>
      <ChevronRight className="w-3.5 h-3.5 text-white/40 shrink-0" aria-hidden="true" />
      <span
        className="text-white font-semibold truncate max-w-[180px] sm:max-w-[280px]"
        aria-current="page"
      >
        {nomeCliente}
      </span>
      <button
        onClick={aoVoltar}
        className="ml-1 p-1 rounded text-slate-300 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
        aria-label="Fechar ficha e voltar à listagem"
        title="Voltar à listagem"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </nav>
  )
}
