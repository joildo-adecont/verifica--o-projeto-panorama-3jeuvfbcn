import { useState } from 'react'
import {
  FileText,
  ChevronDown,
  ExternalLink,
  Calculator,
  Link2,
  Landmark,
  Droplets,
  Ship,
  Factory,
  Tractor,
  ShieldCheck,
  Search,
  Layers,
} from 'lucide-react'
import { ANEXOS, NOTA_VERIFICACAO, type AnexoInfo } from '@/data/anexosCatalogo'

const INSTRUMENTO_META: Record<AnexoInfo['instrumento'], { cor: string; badge: string }> = {
  RIBS: { cor: 'text-emerald-700', badge: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  LC214: { cor: 'text-blue-700', badge: 'bg-blue-50 border-blue-200 text-blue-800' },
  DEC12955: { cor: 'text-violet-700', badge: 'bg-violet-50 border-violet-200 text-violet-800' },
}

const ICONES: Record<string, typeof FileText> = {
  'ribs-a1': Calculator,
  'ribs-a2': Ship,
  'ribs-a3': Droplets,
  'ribs-a4': Tractor,
  'ribs-a5': Factory,
  'lc214-a1': Landmark,
  'lc214-a2': FileText,
  'lc214-a3': FileText,
  'lc214-a4': FileText,
  'lc214-a5': FileText,
  'lc214-a6': FileText,
  'lc214-a7': FileText,
  'lc214-a8': FileText,
  'lc214-a9': FileText,
  'lc214-a12': FileText,
  'lc214-a15': FileText,
  'dec-a1': ShieldCheck,
  'dec-a2': ShieldCheck,
  'dec-a3': Layers,
  'dec-a4': ShieldCheck,
  'dec-a5': Layers,
}

export function SectionAnexos() {
  const [aberto, setAberto] = useState<string | null>(null)
  const [busca, setBusca] = useState('')

  const termo = busca.trim().toLowerCase()
  const filtrados = termo
    ? ANEXOS.filter((a) =>
        [a.anexo, a.tituloOficial, a.baseLegal, a.efeito, a.detalhe, a.instrumentoNome]
          .join(' ')
          .toLowerCase()
          .includes(termo),
      )
    : ANEXOS

  const toggle = (id: string) => setAberto((atual) => (atual === id ? null : id))

  return (
    <section id="secao-7" className="scroll-mt-24 space-y-4">
      <div className="border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-xs">
            7
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Anexos da reforma tributária — conteúdo analítico
          </h2>
        </div>
        <p className="text-sm text-slate-500 mt-2">
          Cada anexo é individualizado com base legal, efeito tributário e conexões com as demais
          seções e com o Simulador de Transição. Conteúdo extraído dos textos oficiais (Resolução
          CGIBS 6/2026, LC 214/2025 e Decreto 12.955/2026).
        </p>
      </div>

      {/* Busca nos anexos */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar anexo, artigo, NCM ou efeito…"
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="space-y-3">
        {filtrados.map((a) => {
          const Icone = ICONES[a.id] ?? FileText
          const meta = INSTRUMENTO_META[a.instrumento]
          const isOpen = aberto === a.id
          return (
            <div
              key={a.id}
              className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden"
            >
              <button
                onClick={() => toggle(a.id)}
                className="w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
                aria-expanded={isOpen}
              >
                <span
                  className={`flex items-center justify-center w-9 h-9 rounded-lg border shrink-0 ${meta.badge}`}
                >
                  <Icone className="w-4.5 h-4.5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={`font-bold text-sm ${meta.cor}`}>
                      {a.instrumentoNome.split('—')[0].trim()} · {a.anexo}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wide border rounded px-1.5 py-0.5 ${meta.badge}`}
                    >
                      {a.instrumento === 'RIBS'
                        ? 'IBS'
                        : a.instrumento === 'LC214'
                          ? 'LC 214/2025'
                          : 'CBS'}
                    </span>
                  </span>
                  <span className="block text-sm font-semibold text-slate-900 mt-0.5 leading-snug">
                    {a.tituloOficial}
                  </span>
                  <span className="block text-xs text-slate-500 mt-0.5">{a.baseLegal}</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 mt-1 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isOpen && (
                <div className="border-t border-slate-100 bg-slate-50/60 p-4 space-y-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                      Efeito tributário
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">{a.efeito}</p>
                  </div>

                  {a.tabelas && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                        Tabelas oficiais
                      </p>
                      <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
                        {a.tabelas.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {a.itens && (
                    <p className="text-xs text-slate-600">
                      <strong>Volume:</strong> {a.itens}
                    </p>
                  )}

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                      Conteúdo analítico
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">{a.detalhe}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      <Link2 className="w-3 h-3" /> Conexões
                    </span>
                    {a.conexoes.map((c, i) => (
                      <a
                        key={i}
                        href={c.alvo}
                        target={c.tipo === 'simulador' ? '_blank' : undefined}
                        rel={c.tipo === 'simulador' ? 'noopener noreferrer' : undefined}
                        className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-3 py-1 border transition-colors ${
                          c.tipo === 'simulador'
                            ? 'bg-lime-50 border-lime-300 text-lime-800 hover:bg-lime-100'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {c.tipo === 'simulador' && <Calculator className="w-3 h-3" />}
                        {c.rotulo}
                        {c.tipo === 'simulador' && <ExternalLink className="w-3 h-3" />}
                      </a>
                    ))}
                  </div>

                  <div className="flex items-start gap-1.5 text-xs text-slate-500 border-t border-slate-200 pt-2">
                    <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                    <span>
                      Fonte oficial:{' '}
                      <a
                        href={a.fonte.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:underline font-medium"
                      >
                        {a.fonte.nome}
                      </a>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!filtrados.length && (
        <p className="text-sm text-slate-500 py-6 text-center">
          Nenhum anexo encontrado para “{busca}”.
        </p>
      )}

      <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm leading-relaxed">
        <strong>Verificação de fidelidade (Parcela 1):</strong> {NOTA_VERIFICACAO}
      </div>

      <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm leading-relaxed">
        <strong>Parcelamento em andamento:</strong> esta parcela cobre os 5 anexos do RIBS (extração
        fiel do PDF oficial), os anexos da LC 214 referenciados pelo Regulamento do IBS (I, II, III,
        IV, V, VI, VII, VIII, IX, XII e XV) e os 5 anexos do Decreto 12.955/2026 (CBS). As próximas
        parcelas ampliam a extração item a item (Anexos VIII e XII da LC 214), aprofundam o índice
        geral de NCM/NBS e reforçam as interligações com o Simulador.
      </div>
    </section>
  )
}
