import { useState, useEffect, useRef } from 'react'
import { Search, Table2, Calculator, X, ChevronDown } from 'lucide-react'
import type { LinhaTabelaGeral } from '@/data/tabelaGeralDados'

interface BlocoResumo {
  id: string
  instrumento: string
  anexo: string
  titulo: string
  baseLegal: string
  tratamento: string
  aliquota: string
  totalItens: number
  grupoSim?: string
  resumo: string
}

const RESUMO: BlocoResumo[] = [
  {
    id: 'ribs-a1',
    instrumento: 'RIBS',
    anexo: 'Anexo I',
    titulo: 'Taxas anuais de depreciação (Art. 48, § 1º)',
    baseLegal: 'RIBS, arts. 47–48',
    tratamento: 'Depreciação',
    aliquota: 'Vida útil + taxa anual (10% a 50%)',
    totalItens: 114,
    grupoSim: null,
    resumo: 'Parâmetro do estorno proporcional de créditos do IBS em bens do ativo imobilizado.',
  },
  {
    id: 'ribs-a2',
    instrumento: 'RIBS',
    anexo: 'Anexo II',
    titulo: 'Repetro (Art. 164)',
    baseLegal: 'RIBS, art. 164 e §§ 2º a 5º',
    tratamento: 'Suspensão',
    aliquota: 'Suspensão do IBS/CBS nas 4 modalidades',
    totalItens: 580,
    grupoSim: null,
    resumo:
      'Regime aduaneiro de exportação e importação — bens de capital e equipamentos (T1 86, T2 GNL 324, T3 151, T4 19).',
  },
  {
    id: 'ribs-a3',
    instrumento: 'RIBS',
    anexo: 'Anexo III',
    titulo: 'Suspensão no Reporto (Art. 186, § 5º)',
    baseLegal: 'RIBS, art. 186, § 5º',
    tratamento: 'Suspensão',
    aliquota: 'Suspensão do IBS (Reporto)',
    totalItens: 14,
    grupoSim: 'suspensao',
    resumo: 'Bens destinados ao ativo imobilizado dos beneficiários do Reporto (portos).',
  },
  {
    id: 'ribs-a4',
    instrumento: 'RIBS',
    anexo: 'Anexo IV',
    titulo: 'Bens de capital desonerados (Arts. 196 e 197)',
    baseLegal: 'RIBS, arts. 196–197',
    tratamento: 'Suspensão',
    aliquota: 'Suspensão CBS/IBS — bens de capital',
    totalItens: 98,
    grupoSim: 'bens_capital',
    resumo:
      'Tabelas I (bens de capital art. 196), II (tratores/máq. agrícolas) e III (veículos de carga).',
  },
  {
    id: 'ribs-a5',
    instrumento: 'RIBS',
    anexo: 'Anexo V',
    titulo: 'Bens ZFM com crédito presumido 100% (Art. 521, § 1º, IV)',
    baseLegal: 'RIBS, art. 521, § 1º, IV',
    tratamento: 'Crédito presumido',
    aliquota: 'Crédito presumido 100% — ZFM',
    totalItens: 49,
    grupoSim: 'zfm',
    resumo: 'Bens fabricados na Zona Franca de Manaus com crédito presumido integral.',
  },
  {
    id: 'lc214-a1',
    instrumento: 'LC214',
    anexo: 'Anexo I',
    titulo: 'Cesta Básica Nacional de Alimentos',
    baseLegal: 'LC 214, art. 125; art. 149',
    tratamento: 'Alíquota zero',
    aliquota: '0% (CBS e IBS)',
    totalItens: 35,
    grupoSim: 'cesta_zero',
    resumo:
      'Cesta Básica Nacional — alíquota zero constitucional sobre alimentos essenciais (itens do catálogo do Simulador com origem neste anexo).',
  },
  {
    id: 'lc214-a2',
    instrumento: 'LC214',
    anexo: 'Anexo II',
    titulo: 'Serviços de educação (redução 60%)',
    baseLegal: 'LC 214, art. 129',
    tratamento: 'Redução 60%',
    aliquota: '≈11,2% efetiva',
    totalItens: 9,
    grupoSim: 'reducao60',
    resumo: 'Educação em geral — redução de 60% das alíquotas.',
  },
  {
    id: 'lc214-a3',
    instrumento: 'LC214',
    anexo: 'Anexo III',
    titulo: 'Serviços de saúde (redução 60%)',
    baseLegal: 'LC 214, art. 130',
    tratamento: 'Redução 60%',
    aliquota: '≈11,2% efetiva',
    totalItens: 30,
    grupoSim: 'reducao60',
    resumo: 'Serviços de saúde — redução de 60%.',
  },
  {
    id: 'lc214-a4',
    instrumento: 'LC214',
    anexo: 'Anexo IV',
    titulo: 'Dispositivos médicos (redução 60%)',
    baseLegal: 'LC 214, arts. 131 e 144',
    tratamento: 'Redução 60%',
    aliquota: '≈11,2% efetiva',
    totalItens: 11,
    grupoSim: 'dispositivos60',
    resumo: 'Dispositivos médicos — redução 60%; alíquota zero para órgãos públicos e CEBAS-SUS.',
  },
  {
    id: 'lc214-a9',
    instrumento: 'LC214',
    anexo: 'Anexo IX',
    titulo: 'Insumos agropecuários e aquícolas (redução 60%)',
    baseLegal: 'LC 214, art. 138',
    tratamento: 'Redução 60%',
    aliquota: '≈11,2% efetiva + diferimento',
    totalItens: 34,
    grupoSim: 'insumos_agro',
    resumo: 'Insumos agropecuários — redução 60% com diferimento do crédito.',
  },
  {
    id: 'lc214-a5',
    instrumento: 'LC214',
    anexo: 'Anexo V',
    titulo: 'Dispositivos de acessibilidade (redução 60%)',
    baseLegal: 'LC 214, art. 132',
    tratamento: 'Redução 60%',
    aliquota: '≈11,2% efetiva',
    totalItens: 0,
    grupoSim: null,
    resumo:
      'Redução de 60% para dispositivos de acessibilidade — lista integral no texto oficial (LC 214, Anexo V).',
  },
  {
    id: 'lc214-a6',
    instrumento: 'LC214',
    anexo: 'Anexo VI',
    titulo: 'Nutrição enteral/parenteral e fórmulas especiais',
    baseLegal: 'LC 214, arts. 133 e 146',
    tratamento: 'Alíquota zero',
    aliquota: '0% (CBS e IBS)',
    totalItens: 0,
    grupoSim: null,
    resumo: 'Alíquota zero para composições de nutrição enteral/parenteral e fórmulas especiais.',
  },
  {
    id: 'lc214-a7',
    instrumento: 'LC214',
    anexo: 'Anexo VII',
    titulo: 'Alimentos para consumo humano (redução 60%)',
    baseLegal: 'LC 214, art. 135',
    tratamento: 'Redução 60%',
    aliquota: '≈11,2% efetiva',
    totalItens: 17,
    grupoSim: 'reducao60',
    resumo: 'Alimentos que ficam fora da cesta zero mas com redução de 60%.',
  },
  {
    id: 'lc214-a8',
    instrumento: 'LC214',
    anexo: 'Anexo VIII',
    titulo: 'Higiene e limpeza (baixa renda — redução 60%)',
    baseLegal: 'LC 214, art. 136',
    tratamento: 'Redução 60%',
    aliquota: '≈11,2% efetiva',
    totalItens: 7,
    grupoSim: 'reducao60',
    resumo:
      'Produtos de higiene pessoal e limpeza majoritariamente consumidos por famílias de baixa renda.',
  },
  {
    id: 'lc214-a10',
    instrumento: 'LC214',
    anexo: 'Anexo X',
    titulo: 'Produções artísticas, culturais e audiovisuais (redução 60%)',
    baseLegal: 'LC 214, art. 139',
    tratamento: 'Redução 60%',
    aliquota: '≈11,2% efetiva',
    totalItens: 0,
    grupoSim: null,
    resumo: 'Produções nacionais do setor cultural — redução 60% (lista NBS no texto oficial).',
  },
  {
    id: 'lc214-a11',
    instrumento: 'LC214',
    anexo: 'Anexo XI',
    titulo: 'Soberania e segurança nacional/cibernética (redução 60%)',
    baseLegal: 'LC 214, art. 142',
    tratamento: 'Redução 60%',
    aliquota: '≈11,2% efetiva',
    totalItens: 0,
    grupoSim: null,
    resumo: 'Defesa cibernética e segurança — redução 60% (itens 1.4 e 1.5 vetados na origem).',
  },
  {
    id: 'lc214-a12',
    instrumento: 'LC214',
    anexo: 'Anexo XII',
    titulo: 'Dispositivos médicos — alíquota zero',
    baseLegal: 'LC 214, art. 144, I',
    tratamento: 'Alíquota zero',
    aliquota: '0% (CBS e IBS)',
    totalItens: 20,
    grupoSim: null,
    resumo: 'Lista própria de dispositivos médicos com alíquota zero.',
  },
  {
    id: 'lc214-a13',
    instrumento: 'LC214',
    anexo: 'Anexo XIII',
    titulo: 'Dispositivos de acessibilidade — alíquota zero',
    baseLegal: 'LC 214, art. 145',
    tratamento: 'Alíquota zero',
    aliquota: '0% (CBS e IBS)',
    totalItens: 8,
    grupoSim: null,
    resumo: 'Lista própria de dispositivos de acessibilidade com alíquota zero.',
  },
  {
    id: 'lc214-a14',
    instrumento: 'LC214',
    anexo: 'Anexo XIV',
    titulo: '(Revogado pela LC 227/2026)',
    baseLegal: 'LC 214, Anexo XIV; LC 227/2026',
    tratamento: '—',
    aliquota: '— (revogado)',
    totalItens: 0,
    grupoSim: null,
    resumo: 'Anexo revogado pela LC 227/2026 — mantido apenas para referência histórica.',
  },
  {
    id: 'lc214-a15',
    instrumento: 'LC214',
    anexo: 'Anexo XV',
    titulo: 'Hortícolas, frutas e ovos — alíquota zero',
    baseLegal: 'LC 214, art. 148',
    tratamento: 'Alíquota zero',
    aliquota: '0% (CBS e IBS)',
    totalItens: 14,
    grupoSim: 'cesta_zero',
    resumo: 'Produtos hortícolas, frutas e ovos — alíquota zero.',
  },
  {
    id: 'lc214-a16',
    instrumento: 'LC214',
    anexo: 'Anexo XVI',
    titulo: 'Limite inferior da alíquota própria (2029–2040)',
    baseLegal: 'LC 214, Anexo XVI',
    tratamento: 'Regime pleno',
    aliquota: 'Limites percentuais por ano (81% a 90,5%)',
    totalItens: 0,
    grupoSim: null,
    resumo:
      'Tabela de limites para fixação de alíquotas próprias: 2029–2032 = 81,0%; 2033 = 90,5%; decrescendo até 2040 = 77,2%.',
  },
  {
    id: 'lc214-a17',
    instrumento: 'LC214',
    anexo: 'Anexo XVII',
    titulo: 'Bens e serviços sujeitos ao Imposto Seletivo',
    baseLegal: 'LC 214, Anexo XVII; Dec. 12.955, Anexo IV',
    tratamento: 'Imposto Seletivo',
    aliquota: 'IBS+CBS plena + IS por produto',
    totalItens: 13,
    grupoSim: 'imposto_seletivo',
    resumo:
      'Cigarros, bebidas alcoólicas e açucaradas, veículos de luxo, iates, aeronaves, minério e petróleo — IS além do IBS/CBS.',
  },
  {
    id: 'lc214-a18',
    instrumento: 'LC214',
    anexo: 'Anexos XVIII–XXIII',
    titulo: 'Simples Nacional (alíquotas e partilha)',
    baseLegal: 'LC 214, Anexos XVIII–XXIII',
    tratamento: 'Regime específico',
    aliquota: 'IBS/CBS no DAS (sublimite R$ 3,6 mi)',
    totalItens: 0,
    grupoSim: null,
    resumo: 'Alíquotas e partilha do Simples Nacional na reforma (2027–2028).',
  },
  {
    id: 'dec-a1',
    instrumento: 'DEC12955',
    anexo: 'Anexo I',
    titulo: 'CST da CBS',
    baseLegal: 'Decreto 12.955/2026, Anexo I',
    tratamento: 'Regime pleno',
    aliquota: 'Classificação tributária — sem alíquota própria',
    totalItens: 0,
    grupoSim: null,
    resumo: 'Códigos de Situação Tributária da CBS (cClassTrib).',
  },
  {
    id: 'dec-a2',
    instrumento: 'DEC12955',
    anexo: 'Anexo II',
    titulo: 'CST do IS',
    baseLegal: 'Decreto 12.955/2026, Anexo II',
    tratamento: 'Imposto Seletivo',
    aliquota: 'Classificação do IS — sem alíquota própria',
    totalItens: 0,
    grupoSim: null,
    resumo: 'Códigos de Situação Tributária do Imposto Seletivo.',
  },
  {
    id: 'dec-a3',
    instrumento: 'DEC12955',
    anexo: 'Anexo III',
    titulo: 'Classificações de bens e serviços (cesta/reduzidos CBS)',
    baseLegal: 'Decreto 12.955/2026, Anexo III',
    tratamento: 'Regime específico',
    aliquota: 'Classificação — cesta básica e reduzidos (CBS)',
    totalItens: 0,
    grupoSim: null,
    resumo: 'Classificações de bens e serviços para cesta básica e reduções (CBS).',
  },
  {
    id: 'dec-a4',
    instrumento: 'DEC12955',
    anexo: 'Anexo IV',
    titulo: 'Produtos sujeitos ao Imposto Seletivo',
    baseLegal: 'Decreto 12.955/2026, Anexo IV',
    tratamento: 'Imposto Seletivo',
    aliquota: 'IBS+CBS plena + IS por produto',
    totalItens: 0,
    grupoSim: 'imposto_seletivo',
    resumo: 'Anexo IV do Regulamento da CBS — produtos com IS (fumígenos, bebidas, veículos etc.).',
  },
  {
    id: 'dec-a5',
    instrumento: 'DEC12955',
    anexo: 'Anexo V',
    titulo: 'Disposições transitórias e vinculações (CBS)',
    baseLegal: 'Decreto 12.955/2026, Anexo V',
    tratamento: 'Regime específico',
    aliquota: 'Disposições transitórias',
    totalItens: 0,
    grupoSim: null,
    resumo: 'Disposições transitórias e vinculações da CBS.',
  },
]

const TRATAMENTO_META: Record<string, { badge: string; dot: string }> = {
  'Alíquota zero': {
    badge: 'bg-emerald-100 border-emerald-300 text-emerald-900',
    dot: 'bg-emerald-500',
  },
  'Redução 60%': { badge: 'bg-blue-100 border-blue-300 text-blue-900', dot: 'bg-blue-500' },
  'Redução 30%': { badge: 'bg-indigo-100 border-indigo-300 text-indigo-900', dot: 'bg-indigo-500' },
  'Imposto Seletivo': { badge: 'bg-red-100 border-red-300 text-red-900', dot: 'bg-red-500' },
  Suspensão: { badge: 'bg-amber-100 border-amber-300 text-amber-900', dot: 'bg-amber-500' },
  'Crédito presumido': { badge: 'bg-lime-100 border-lime-300 text-lime-900', dot: 'bg-lime-600' },
  Depreciação: { badge: 'bg-slate-100 border-slate-300 text-slate-800', dot: 'bg-slate-500' },
  'Regime pleno': { badge: 'bg-slate-100 border-slate-300 text-slate-800', dot: 'bg-slate-400' },
  'Regime específico': {
    badge: 'bg-violet-100 border-violet-300 text-violet-900',
    dot: 'bg-violet-500',
  },
  '—': { badge: 'bg-slate-100 border-slate-200 text-slate-500', dot: 'bg-slate-300' },
}

const INSTRUMENTO_ROTULO: Record<string, string> = {
  RIBS: 'RIBS — Res. CGIBS 6/2026',
  LC214: 'LC 214/2025',
  DEC12955: 'Decreto 12.955/2026',
}

const SIM_URL = 'https://verificacao-projeto-panorama-18549.goskip.app/simulador.html'

export function SectionTabelaGeral() {
  const [aberto, setAberto] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [tratamento, setTratamento] = useState<string | null>(null)
  const [instrumento, setInstrumento] = useState<string | null>(null)
  const [dados, setDados] = useState<Record<string, LinhaTabelaGeral[]> | null>(null)
  const [carregando, setCarregando] = useState(false)
  const buscaRef = useRef<HTMLInputElement>(null)

  // Tecla T foca a busca desta seção (fora de campos de texto)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (e.key.toLowerCase() === 't' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        buscaRef.current?.focus()
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Carga sob demanda: dados completos só quando um anexo é aberto
  const abrir = (id: string) => {
    const novo = aberto === id ? null : id
    setAberto(novo)
    if (novo && !dados && !carregando) {
      setCarregando(true)
      import('@/data/tabelaGeralDados')
        .then((m) => setDados(m.TABELA_GERAL_DADOS))
        .finally(() => setCarregando(false))
    }
  }

  const termo = busca.trim().toLowerCase()
  const trats = Array.from(new Set(RESUMO.map((r) => r.tratamento))).sort()
  const blocos = RESUMO.filter(
    (r) =>
      (!instrumento || r.instrumento === instrumento) &&
      (!tratamento || r.tratamento === tratamento) &&
      (!termo ||
        `${r.anexo} ${r.titulo} ${r.baseLegal} ${r.tratamento} ${r.aliquota}`
          .toLowerCase()
          .includes(termo) ||
        (dados?.[r.id] ?? []).some((l) =>
          `${l.item} ${l.descricao} ${l.codigo} ${l.tratamento} ${l.aliquota}`
            .toLowerCase()
            .includes(termo),
        )),
  )
  const totalLinhas = RESUMO.reduce((s, r) => s + r.totalItens, 0)

  return (
    <section id="tabela-geral" className="scroll-mt-24 space-y-4">
      <div className="border-b-2 border-panorama-gold/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-panorama-navy text-panorama-gold-light font-bold text-xs ring-1 ring-panorama-gold/50">
            7A
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Tabela Geral dos Anexos — itens e alíquotas da reforma
          </h2>
        </div>
        <p className="text-sm text-slate-500 mt-2">
          Uma tabela individual por anexo ({RESUMO.length} blocos, {totalLinhas} linhas extraídas
          dos textos oficiais): item, código NCM/NBS, tratamento e alíquota na reforma — com índice
          navegável, filtros por tratamento, busca global e botão de simulação por anexo. Atalhos:{' '}
          <kbd className="px-1 border rounded text-[10px]">T</kbd> foca esta busca ·{' '}
          <kbd className="px-1 border rounded text-[10px]">Esc</kbd> limpa.
        </p>
      </div>

      {/* Busca + filtros */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={buscaRef}
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setBusca('')
                setTratamento(null)
                setInstrumento(null)
              }
            }}
            placeholder="Buscar em todos os anexos — item, NCM/NBS, descrição, alíquota… (tecla T)"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-9 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {busca && (
            <button
              onClick={() => {
                setBusca('')
                setTratamento(null)
                setInstrumento(null)
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {busca && (
          <p className="mt-1 text-[11px] text-slate-500">
            {blocos.length} de {RESUMO.length} anexos correspondem a “{busca}” — Esc ou ✕ limpa a
            pesquisa
          </p>
        )}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400 self-center mr-1">
            Tratamento:
          </span>
          <button
            onClick={() => setTratamento(null)}
            className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${!tratamento ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
          >
            Todos
          </button>
          {trats.map((t) => {
            const meta = TRATAMENTO_META[t] ?? TRATAMENTO_META['—']
            const ativo = tratamento === t
            return (
              <button
                key={t}
                onClick={() => setTratamento(ativo ? null : t)}
                className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${ativo ? meta.badge + ' ring-2 ring-offset-1 ring-slate-400' : meta.badge}`}
              >
                {t}
              </button>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400 self-center mr-1">
            Instrumento:
          </span>
          {['RIBS', 'LC214', 'DEC12955'].map((i) => {
            const ativo = instrumento === i
            return (
              <button
                key={i}
                onClick={() => setInstrumento(ativo ? null : i)}
                className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${ativo ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
              >
                {INSTRUMENTO_ROTULO[i]}
              </button>
            )
          })}
          {(tratamento || instrumento || termo) && (
            <button
              onClick={() => {
                setTratamento(null)
                setInstrumento(null)
                setBusca('')
              }}
              className="px-2 py-0.5 rounded-full border border-red-200 bg-red-50 text-red-700 text-[11px] font-semibold hover:bg-red-100"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Índice + tabelas por anexo */}
      <div className="space-y-2">
        {blocos.map((r) => {
          const isOpen = aberto === r.id
          const meta = TRATAMENTO_META[r.tratamento] ?? TRATAMENTO_META['—']
          const linhas = (dados?.[r.id] ?? []).filter(
            (l) =>
              (!tratamento || l.tratamento === tratamento) &&
              (!termo ||
                `${l.item} ${l.descricao} ${l.codigo} ${l.tratamento} ${l.aliquota} ${l.detalhe ?? ''}`
                  .toLowerCase()
                  .includes(termo)),
          )
          return (
            <div
              key={r.id}
              className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden"
            >
              <button
                onClick={() => abrir(r.id)}
                className="w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
                aria-expanded={isOpen}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      {INSTRUMENTO_ROTULO[r.instrumento]} · {r.anexo}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold rounded-full border px-1.5 py-0.5 ${meta.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} /> {r.tratamento}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {r.totalItens} {r.totalItens === 1 ? 'item' : 'itens'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{r.titulo}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {r.baseLegal} · <strong>Alíquota:</strong> {r.aliquota}
                  </p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 mt-1 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-600 leading-relaxed">{r.resumo}</p>
                  {r.grupoSim && (
                    <a
                      href={`${SIM_URL}?grupo=${r.grupoSim}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-lime-800 bg-lime-50 border border-lime-300 rounded-full px-2.5 py-1 hover:bg-lime-100"
                    >
                      <Calculator className="w-3.5 h-3.5" /> 🧮 Abrir este grupo no Simulador de
                      Transição
                    </a>
                  )}
                  {!dados && carregando && (
                    <p className="text-xs text-slate-500 py-3">
                      <span className="inline-block animate-pulse">⏳</span> Carregando tabela geral
                      ({totalLinhas} linhas)…
                    </p>
                  )}
                  {dados && r.totalItens > 0 && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                        Itens extraídos da fonte oficial ({linhas.length}/{r.totalItens})
                      </p>
                      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white max-h-96 overflow-y-auto">
                        <table
                          className="w-full text-left border-collapse text-xs"
                          data-anexo={r.id}
                        >
                          <thead>
                            <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold sticky top-0">
                              <th className="py-2 px-3 w-16">Item</th>
                              <th className="py-2 px-3">Descrição</th>
                              <th className="py-2 px-3 w-40">NCM/NBS</th>
                              <th className="py-2 px-3 w-32">Tratamento</th>
                              <th className="py-2 px-3 w-56">Alíquota na reforma</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {linhas.map((l, i) => {
                              const m = TRATAMENTO_META[l.tratamento] ?? TRATAMENTO_META['—']
                              return (
                                <tr
                                  key={l.item + '-' + i}
                                  className="hover:bg-slate-50/70 align-top"
                                >
                                  <td className="py-1.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                                    {l.item}
                                  </td>
                                  <td className="py-1.5 px-3 text-slate-700 leading-snug">
                                    {l.descricao}
                                    {l.detalhe && (
                                      <span className="block text-[10px] text-slate-400">
                                        {l.detalhe}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-1.5 px-3 font-mono text-[11px] text-blue-800">
                                    {l.codigo}
                                  </td>
                                  <td className="py-1.5 px-3">
                                    <span
                                      className={`inline-block text-[10px] font-bold rounded-full border px-1.5 py-0.5 ${m.badge}`}
                                    >
                                      {l.tratamento}
                                    </span>
                                  </td>
                                  <td className="py-1.5 px-3 text-[11px] text-slate-700">
                                    {l.aliquota}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                        {!linhas.length && (
                          <p className="text-xs text-slate-500 py-4 text-center">
                            Nenhuma linha para o filtro atual.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {dados && r.totalItens === 0 && (
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
                      Lista integral no texto oficial — ver fonte:{' '}
                      <span className="font-semibold">{r.baseLegal}</span>. A extração item a item
                      deste anexo entra na rotina semanal de fontes oficiais.
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {!blocos.length && (
          <p className="text-sm text-slate-500 py-6 text-center">
            Nenhum anexo corresponde à busca/filtro atual.
          </p>
        )}
      </div>

      <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm leading-relaxed">
        <strong>Verificação de fidelidade:</strong> as linhas vêm da extração item a item dos textos
        oficiais (RIBS, LC 214/2025 e Decreto 12.955/2026) e do catálogo do Simulador de Transição.
        Alíquotas efetivas usam a referência de 27,91% (Res. CGIBS 14/2026) — estimativas até a
        fixação legal. As tabelas entram na rotina semanal de fontes oficiais, com registro no
        Histórico de Atualizações (Seção 13).
      </div>
    </section>
  )
}
