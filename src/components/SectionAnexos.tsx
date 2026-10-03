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
import {
  ANEXOS,
  NOTA_VERIFICACAO,
  MAPA_SIMULADOR,
  SIM_TOTAL,
  type AnexoInfo,
} from '@/data/anexosCatalogo'

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

  // Parcela 3: contagem de itens do Simulador mapeados a cada anexo
  const mapaPorAnexo = new Map(MAPA_SIMULADOR.map((m) => [m.anexoId, m]))
  const totalMapeados = MAPA_SIMULADOR.reduce((s, m) => s + m.qtd, 0)

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

      {/* Parcela 3: faixa de interligação com o Simulador */}
      <div className="rounded-lg border-l-4 border-lime-500 bg-lime-50 p-4 text-sm text-lime-900 flex items-start gap-2">
        <Calculator className="w-4 h-4 mt-0.5 shrink-0 text-lime-600" />
        <p>
          <strong>Interligação com o Simulador de Transição:</strong> {totalMapeados} dos{' '}
          {SIM_TOTAL} itens do catálogo do Simulador estão mapeados aos anexos desta seção — cada
          item do Simulador cita a origem oficial (anexo + item). Os demais itens (regime regular,
          regimes especiais, agro e acessibilidade) derivam das Seções 5, 6 e dos arts. 127, 287 ss.
          da LC 214. Anexos com mapeamento direto exibem o selo{' '}
          <span className="inline-flex items-center gap-1 text-[10px] font-bold rounded-full bg-lime-100 border border-lime-300 text-lime-800 px-1.5 py-0.5 align-middle">
            <Calculator className="w-3 h-3" /> N no Simulador
          </span>
          .
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
                {mapaPorAnexo.get(a.id) && (
                  <span className="inline-flex items-center gap-1 shrink-0 text-[10px] font-bold rounded-full bg-lime-100 border border-lime-300 text-lime-800 px-2 py-1 mt-1">
                    <Calculator className="w-3 h-3" />
                    {mapaPorAnexo.get(a.id)!.qtd} no Simulador
                  </span>
                )}
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

                  {a.itensDetalhados && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                        Itens extraídos da fonte oficial
                      </p>
                      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white max-h-80 overflow-y-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-semibold sticky top-0">
                              <th className="py-2 px-3 w-16">Item</th>
                              <th className="py-2 px-3">Descrição</th>
                              <th className="py-2 px-3 w-56">NCM/SH · NBS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {a.itensDetalhados.map((it, i) => (
                              <tr key={i} className="hover:bg-slate-50/70">
                                <td className="py-1.5 px-3 font-bold text-slate-900 align-top">
                                  {it.item}
                                </td>
                                <td className="py-1.5 px-3 text-slate-700 align-top leading-snug">
                                  {it.descricao}
                                </td>
                                <td className="py-1.5 px-3 font-mono text-[11px] text-blue-800 align-top">
                                  {it.codigo ?? '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                      Conteúdo analítico
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">{a.detalhe}</p>
                  </div>

                  {mapaPorAnexo.get(a.id) && (
                    <p className="text-xs text-lime-900 bg-lime-50 border border-lime-200 rounded-lg px-3 py-2">
                      <strong>No Simulador ({mapaPorAnexo.get(a.id)!.qtd} itens):</strong>{' '}
                      {mapaPorAnexo.get(a.id)!.nota}
                    </p>
                  )}

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
        <strong>Parcelamento em andamento:</strong> a Parcela 1 cobriu os 5 anexos do RIBS (extração
        fiel do PDF oficial), os anexos da LC 214 referenciados pelo Regulamento do IBS e os 5
        anexos do Decreto 12.955/2026 (CBS). A Parcela 2 ampliou o índice para os 23 anexos da LC
        214 (XVIII–XXIII inclusos) e trouxe a extração item a item dos Anexos VIII, XII, XIII, XV,
        VII, II, III e IX — com tabelas de itens consultáveis dentro de cada anexo. A Parcela 3
        reforçará as interligações com o Simulador (mapeamento dos 118 itens do catálogo aos
        anexos).
      </div>
    </section>
  )
}
