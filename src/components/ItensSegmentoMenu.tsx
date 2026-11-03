/**
 * BOTÕES DE SEGMENTO OFICIAL NO MENU LATERAL (06/11/2026)
 *
 * As quatro entradas do grupo "Segmentos Oficiais" (Reforma Tributária,
 * Plataforma Jurídica, Plataforma Contábil e Plataforma Administrativa) têm
 * agora tratamento próprio: ícone um passo acima do padrão do menu (caixa 36px
 * com glifo 18px, contra 28px/14px dos itens comuns), emblema institucional que
 * referencia o segmento (sigla + pino visual) e feedback de hover/ativo —
 * elevação, escala do ícone e realce dourado ADECONT.
 *
 * Layout vertical (ícone em cima, nome e emblema embaixo): a barra fixa do
 * desktop divide a linha em 4 colunas de ~51px — um botão horizontal com ícone
 * à esquerda não caberia ali sem cortar o nome ou sobrepor o vizinho.
 *
 * Só apresentação. Não toca teclas de atalho, busca, hierarquia nem permissões.
 */
import { Landmark, Gavel, Sigma, Briefcase } from 'lucide-react'
import type { SegmentoSistema } from '@/components/navegacao'

interface EmblemaSegmento {
  sigla: string
  Icon: React.ComponentType<{ className?: string }>
  /** classes do emblema em repouso */
  classes: string
  /** classes do emblema com o segmento ativo (fundo escuro) */
  classesAtivo: string
}

/* Sigla + pino visual de cada segmento oficial — cores da paleta já usada no
   menu, legíveis nos dois estados (fundo claro e ativo escuro). */
const EMBLEMAS_SEGMENTO: Record<string, EmblemaSegmento> = {
  'reforma-tributaria': {
    sigla: 'RT',
    Icon: Landmark,
    classes: 'bg-amber-100 text-amber-800 ring-1 ring-amber-300',
    classesAtivo: 'bg-amber-400/25 text-amber-300 ring-1 ring-amber-400/60',
  },
  juridica: {
    sigla: 'PJ',
    Icon: Gavel,
    classes: 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-300',
    classesAtivo: 'bg-white/20 text-indigo-200 ring-1 ring-indigo-300/60',
  },
  contabil: {
    sigla: 'PC',
    Icon: Sigma,
    classes: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300',
    classesAtivo: 'bg-white/20 text-emerald-200 ring-1 ring-emerald-300/60',
  },
  administrativa: {
    sigla: 'PA',
    Icon: Briefcase,
    classes: 'bg-slate-200 text-slate-700 ring-1 ring-slate-400',
    classesAtivo: 'bg-white/20 text-slate-200 ring-1 ring-white/50',
  },
}

interface BotaoSegmentoOficialProps {
  seg: SegmentoSistema
  ativo: boolean
  onClick: () => void
}

/**
 * Entrada de segmento oficial: ícone grande + emblema + hover/ativo em evidência.
 * Usada tanto na barra fixa (desktop) quanto na gaveta (mobile) do menu lateral.
 */
export function BotaoSegmentoOficial({ seg, ativo, onClick }: BotaoSegmentoOficialProps) {
  const SegIcon = seg.Icon
  const emblema = EMBLEMAS_SEGMENTO[seg.id]
  const EmblemaIcon = emblema?.Icon

  return (
    <button
      onClick={onClick}
      className={`group w-full flex flex-col items-center gap-1 px-1 py-2 rounded-xl border text-center transition-all duration-150 cursor-pointer ${
        ativo
          ? 'bg-slate-900 border-slate-900 shadow-md ring-2 ring-panorama-gold/60'
          : 'bg-white border-slate-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 hover:border-panorama-gold/60 hover:bg-amber-50/40'
      }`}
      title={`${seg.nome} — ${seg.descricao}`}
    >
      {/* Ícone do segmento: caixa 36px com glifo 18px — um passo acima do padrão
          do menu (28px/14px), exatamente para se destacar claramente dele. */}
      <span
        className={`w-9 h-9 rounded-lg border flex items-center justify-center shadow-sm transition-transform duration-150 ${
          ativo
            ? 'bg-white/10 border-white/25 text-amber-300'
            : `group-hover:scale-110 ${seg.bg} ${seg.borda} ${seg.cor}`
        }`}
      >
        <SegIcon className="w-[18px] h-[18px]" />
      </span>

      <span
        className={`w-full text-[9.5px] font-black leading-tight truncate ${
          ativo ? 'text-amber-300' : 'text-slate-800 group-hover:text-slate-950'
        }`}
      >
        {seg.nome}
      </span>

      {/* Emblema institucional: sigla + pino que referencia o nome do segmento */}
      {emblema && (
        <span
          className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${
            ativo ? emblema.classesAtivo : emblema.classes
          }`}
        >
          {EmblemaIcon && <EmblemaIcon className="w-2.5 h-2.5" />}
          {emblema.sigla}
        </span>
      )}
    </button>
  )
}
