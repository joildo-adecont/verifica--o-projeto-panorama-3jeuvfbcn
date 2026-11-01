import { useState } from 'react'
import {
  Printer,
  FileSpreadsheet,
  BookmarkPlus,
  Scale,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  PieChart as PieIcon,
  Layers,
  Calendar,
  FileText,
  Building2,
  ShieldCheck,
  Edit3,
  Check,
  Eye,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import { AdecontLogo } from '@/components/AdecontLogo'
import { RenderizadorTextoMarkdown } from '@/components/RenderizadorTextoMarkdown'
import type { LinhaComparativoAliquota } from '@/services/diagnosticoTributario'

export interface RelatorioDiagnosticoModernoProps {
  titulo: string
  atoOuTema: string
  numeroRelatorio?: string
  dataEmissao?: string
  parecerResumido: string
  pontosAtencao: string
  passoAPasso: string
  linhasTabela: LinhaComparativoAliquota[]
  sessaoSalvaId?: string | null
  salvandoSessao?: boolean
  onSalvarSessao: () => void
  onExportarCsv: () => void
  onAtualizarTitulo?: (novoTitulo: string) => void
  onAtualizarAto?: (novoAto: string) => void
  onAtualizarParecer?: (novoParecer: string) => void
  onAtualizarPontosAtencao?: (novosPontos: string) => void
  onAtualizarPassoAPasso?: (novoPasso: string) => void
}

/**
 * Folha de estilo de impressão escopada para o Relatório do Diagnóstico Tributário.
 * Garante que somente o contêiner do relatório formatado (#relatorio-diagnostico-imprimivel)
 * seja renderizado no papel/PDF, ocultando cabeçalhos de tela, menus, atalhos, botões etc.
 */
const CSS_IMPRESSAO_RELATORIO = `
@media print {
  @page {
    size: A4 portrait;
    margin: 12mm 10mm;
  }

  /* Oculta toda a moldura da plataforma */
  aside,
  header.fixed,
  .fixed,
  footer,
  #painel-atalhos,
  nav,
  [data-print="hide"],
  .no-print {
    display: none !important;
  }

  html, body {
    background: #ffffff !important;
    color: #0f172a !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Oculta outras seções */
  .lg\\:pl-60 { padding-left: 0 !important; }
  main { padding: 0 !important; max-width: none !important; }
  main > div, main > section { display: block !important; }

  /* Esconde todos os elementos da SectionDiagnosticoTributario, EXCETO o relatório */
  .secao-diagnostico-topo,
  .secao-diagnostico-botoes,
  .secao-diagnostico-chat,
  .secao-diagnostico-historico {
    display: none !important;
  }

  /* Relatório ocupa página limpa */
  #relatorio-diagnostico-imprimivel {
    display: block !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;
    background: #ffffff !important;
    width: 100% !important;
  }

  /* Cabeçalho e rodapé institucionais em cores exatas */
  .relatorio-header-impresso,
  .relatorio-footer-impresso {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Evitar quebra no meio de blocos críticos */
  .bloco-imprimivel,
  .bloco-imprimivel table,
  .bloco-imprimivel svg,
  .bloco-imprimivel .grafico-container {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  /* Barra de ações e botões não saem na impressão */
  .relatorio-barra-acoes {
    display: none !important;
  }

  /* Links limpos */
  a[href]::after {
    content: none !important;
  }
}
`

export function RelatorioDiagnosticoModerno({
  titulo,
  atoOuTema,
  numeroRelatorio = `REL-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-01`,
  dataEmissao = new Date().toLocaleDateString('pt-BR'),
  parecerResumido,
  pontosAtencao,
  passoAPasso,
  linhasTabela,
  sessaoSalvaId,
  salvandoSessao = false,
  onSalvarSessao,
  onExportarCsv,
  onAtualizarTitulo,
  onAtualizarAto,
  onAtualizarParecer,
  onAtualizarPontosAtencao,
  onAtualizarPassoAPasso,
}: RelatorioDiagnosticoModernoProps) {
  const [modoEdicao, setModoEdicao] = useState(false)

  // Injetar CSS de impressão sob demanda e chamar window.print()
  const handleImprimirPdf = () => {
    const idTag = 'css-impressao-diagnostico-adecont'
    if (!document.getElementById(idTag)) {
      const tag = document.createElement('style')
      tag.id = idTag
      tag.textContent = CSS_IMPRESSAO_RELATORIO
      document.head.appendChild(tag)
    }

    // Pequeno timeout para o navegador garantir layout pintado
    window.setTimeout(() => {
      window.print()
    }, 150)
  }

  return (
    <div
      id="relatorio-diagnostico-imprimivel"
      className="rounded-2xl border-2 border-indigo-200 bg-white shadow-xl overflow-hidden transition-all text-slate-800"
    >
      {/* ── BARRA SUPERIOR DE AÇÕES (NÃO IMPRESSA) ── */}
      <div
        data-print="hide"
        className="relatorio-barra-acoes px-6 py-4 bg-gradient-to-r from-slate-900 via-panorama-navy to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-900/50"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-panorama-gold text-panorama-navy flex items-center justify-center font-black shadow-md">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-panorama-gold">
                Relatório Formatado para Envio
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-indigo-200 font-mono">
                {numeroRelatorio}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              Parecer Executivo & Diagnóstico Tributário
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setModoEdicao(!modoEdicao)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              modoEdicao
                ? 'bg-amber-400 text-slate-900 border-amber-300 shadow-sm'
                : 'bg-white/10 hover:bg-white/20 text-indigo-100 border-white/20'
            }`}
            title="Alternar entre modo visualização e modo de edição rápida de textos"
          >
            {modoEdicao ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            <span>{modoEdicao ? 'Concluir Edição' : 'Ajustar Textos'}</span>
          </button>

          <button
            onClick={onExportarCsv}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            title="Exportar planilha completa em CSV com BOM UTF-8 (compatível com Excel)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Exportar CSV/Excel</span>
          </button>

          <button
            onClick={handleImprimirPdf}
            className="px-4 py-1.5 rounded-lg bg-panorama-gold hover:bg-panorama-gold-light text-panorama-navy text-xs font-black flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-[1.02]"
            title="Abre a janela de impressão do navegador para Salvar em PDF formatado"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Salvar em PDF</span>
          </button>

          <button
            onClick={onSalvarSessao}
            disabled={salvandoSessao}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            title="Persistir relatório na coleção diagnostico_sessoes"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>{salvandoSessao ? 'Gravando...' : 'Gravar Sessão'}</span>
          </button>
        </div>
      </div>

      {/* Alerta de sessão salva (na tela) */}
      {sessaoSalvaId && (
        <div
          data-print="hide"
          className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Sessão gravada com sucesso no banco de dados da ADECONT (ID:{' '}
            <strong className="font-mono">{sessaoSalvaId}</strong>). O relatório está pronto para
            apresentação e envio.
          </span>
        </div>
      )}

      {/* ── CORPO DO RELATÓRIO FORMATADO (IMPRESSO E NA TELA) ── */}
      <div className="p-6 sm:p-10 space-y-8">
        {/* CABEÇALHO INSTITUCIONAL ADECONT (LOGO + TÍTULO + METADADOS) */}
        <div className="relatorio-header-impresso border-b-2 border-indigo-900 pb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <AdecontLogo variant="color" className="h-14 sm:h-16 w-auto" />
              <div className="border-l-2 border-slate-200 pl-4">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-indigo-800 block">
                  ADECONT — Assessoria Contábil e Administrativa
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Diretoria Executiva · Diagnóstico Tributário da Reforma
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:items-end text-xs text-slate-600 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">Relatório Nº:</span>
                <span className="font-mono font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {numeroRelatorio}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-slate-800">Emissão:</span>
                <span>{dataEmissao}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-800 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Base Oficial: EC 132/2023 · LC 214/2025</span>
              </div>
            </div>
          </div>

          {/* TÍTULO E MATÉRIA DO RELATÓRIO */}
          <div className="pt-2">
            {modoEdicao ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                <div>
                  <label className="text-[10.5px] font-bold uppercase text-slate-600 block mb-1">
                    Título do Diagnóstico
                  </label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => onAtualizarTitulo?.(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-[10.5px] font-bold uppercase text-slate-600 block mb-1">
                    Matéria / Norma Analisada
                  </label>
                  <input
                    type="text"
                    value={atoOuTema}
                    onChange={(e) => onAtualizarAto?.(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-[10.5px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  <span>Parecer Técnico Institucional</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-tight">
                  {titulo}
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 flex items-center gap-1.5">
                  <span className="text-slate-400">Matéria analisada:</span>
                  <span className="text-indigo-900">{atoOuTema}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── 1. RESUMO EXECUTIVO & PARECER DOS ATOS ── */}
        <section className="bloco-imprimivel space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-800">
              <Scale className="w-4 h-4" />
            </span>
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wide text-slate-900">
              1. Resumo Executivo & Parecer da Matéria
            </h2>
          </div>

          {modoEdicao ? (
            <textarea
              rows={5}
              value={parecerResumido}
              onChange={(e) => onAtualizarParecer?.(e.target.value)}
              className="w-full p-3 text-xs leading-relaxed text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 font-mono"
            />
          ) : (
            <div className="p-4 sm:p-5 rounded-xl bg-slate-50/70 border border-slate-200/80">
              <RenderizadorTextoMarkdown texto={parecerResumido} />
            </div>
          )}
        </section>

        {/* ── 2. PONTOS DE ATENÇÃO (JURÍDICO, CONTÁBIL E FUSÃO ADMINISTRATIVA) ── */}
        <section className="bloco-imprimivel space-y-3">
          <div className="flex items-center gap-2 border-b border-amber-200 pb-2">
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wide text-amber-950">
              2. Pontos Críticos de Atenção & Fusão Administrativa
            </h2>
          </div>

          {modoEdicao ? (
            <textarea
              rows={4}
              value={pontosAtencao}
              onChange={(e) => onAtualizarPontosAtencao?.(e.target.value)}
              className="w-full p-3 text-xs leading-relaxed text-slate-800 bg-white border border-amber-300 rounded-xl focus:outline-none focus:border-amber-600 font-mono"
            />
          ) : (
            <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-amber-50/90 to-amber-100/40 border-2 border-amber-300 text-amber-950 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-amber-600" />
                <span>Recomendações e Riscos Operacionais para o Cliente</span>
              </div>
              <RenderizadorTextoMarkdown texto={pontosAtencao} />
            </div>
          )}
        </section>

        {/* ── 3. REFLEXOS TRIBUTÁRIOS & CRONOGRAMA DE IMPLEMENTAÇÃO ── */}
        <section className="bloco-imprimivel space-y-3">
          <div className="flex items-center gap-2 border-b border-emerald-200 pb-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
            </span>
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wide text-emerald-950">
              3. Reflexos Tributários & Passo a Passo de Implementação
            </h2>
          </div>

          {modoEdicao ? (
            <textarea
              rows={5}
              value={passoAPasso}
              onChange={(e) => onAtualizarPassoAPasso?.(e.target.value)}
              className="w-full p-3 text-xs leading-relaxed text-slate-800 bg-white border border-emerald-300 rounded-xl focus:outline-none focus:border-emerald-600 font-mono"
            />
          ) : (
            <div className="p-4 sm:p-5 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <RenderizadorTextoMarkdown texto={passoAPasso} />
            </div>
          )}
        </section>

        {/* ── 4. GRÁFICOS EXPLICATIVOS COM TÍTULOS E CORES INSTITUCIONAIS ── */}
        <section className="bloco-imprimivel space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-800">
                <TrendingUp className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-black uppercase tracking-wide text-slate-900">
                  4. Gráficos Explicativos: Carga Tributária e Repartição IVA Dual
                </h2>
                <p className="text-[11px] text-slate-500">
                  Modelagem visual para apresentação ao comitê diretivo e clientes
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Gráfico 1: Alíquota Efetiva Total por Regime vs. Teto */}
            <div className="grafico-container p-4 sm:p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
              <div className="border-b border-slate-100 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-900 block">
                  Comparativo de Alíquotas por Regime
                </span>
                <p className="text-[11.5px] text-slate-500 leading-snug">
                  Carga efetiva combinada (CBS + IBS) em relação ao teto referencial de 26,50% da LC
                  214/2025.
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={linhasTabela.map((r) => ({
                      nome: r.regime.split(' (')[0],
                      total: r.total,
                      cbs: r.cbs,
                      ibs: r.ibs,
                    }))}
                    margin={{ top: 20, right: 10, left: -20, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="nome"
                      stroke="#475569"
                      fontSize={10}
                      tickLine={false}
                      angle={-18}
                      textAnchor="end"
                    />
                    <YAxis
                      stroke="#475569"
                      fontSize={11}
                      tickLine={false}
                      unit="%"
                      domain={[0, 30]}
                    />
                    <RechartsTooltip
                      formatter={(val: unknown) => [
                        `${Number(val).toFixed(2).replace('.', ',')}%`,
                        'Alíquota Efetiva',
                      ]}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        color: '#f8fafc',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar
                      dataKey="total"
                      name="Alíquota Total"
                      radius={[4, 4, 0, 0]}
                      label={{
                        position: 'top',
                        formatter: (v: number) => `${v.toFixed(1).replace('.', ',')}%`,
                        fontSize: 10,
                        fill: '#0f172a',
                        fontWeight: 'bold',
                      }}
                    >
                      {linhasTabela.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.total === 0
                              ? '#059669' // Cesta Básica zero = esmeralda
                              : entry.total <= 10.6
                                ? '#2563eb' // Favorecido -60% = azul royal
                                : entry.total <= 18.55
                                  ? '#7c3aed' // Reduzido -30% = violeta
                                  : '#d97706' // Teto geral = âmbar
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> Cesta
                  Zero (0%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Favorecido
                  (10,60%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" /> Geral
                  (26,50%)
                </span>
              </div>
            </div>

            {/* Gráfico 2: Repartição IVA Dual na Referência */}
            <div className="grafico-container p-4 sm:p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2 flex flex-col justify-between">
              <div className="border-b border-slate-100 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-900 block">
                  Repartição do IVA Dual (União vs. Estados e Municípios)
                </span>
                <p className="text-[11.5px] text-slate-500 leading-snug">
                  Distribuição da arrecadação entre CBS Federal (11,3%) e IBS Subnacional (18,7%).
                </p>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'IBS (Estados e Municípios)', value: 18.7, fill: '#0284c7' },
                        { name: 'CBS (União Federal)', value: 11.3, fill: '#312e81' },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      innerRadius={30}
                      label={({ name, percent }: { name?: string; percent?: number }) =>
                        `${(name || '').split(' (')[0]}: ${((percent || 0) * 100).toFixed(0)}%`
                      }
                    />
                    <RechartsTooltip
                      formatter={(val: unknown) => [
                        `${Number(val).toFixed(2).replace('.', ',')}%`,
                        'Alíquota Estimada',
                      ]}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        color: '#f8fafc',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <RechartsLegend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="text-[10.5px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
                A CBS substitui PIS e Cofins (arrecadação federal); o IBS substitui ICMS e ISS
                (gestão unificada pelo Comitê Gestor do IBS - CGIBS).
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. TABELA COMPARATIVA COM CAPITULAÇÃO LEGAL, ZEBRA STRIPING E ALINHAMENTO NUMÉRICO ── */}
        <section className="bloco-imprimivel space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                <Layers className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-black uppercase tracking-wide text-slate-900">
                  5. Tabela Comparativa de Alíquotas e Capitulação Legal
                </h2>
                <p className="text-[11px] text-slate-500">
                  Valores numéricos e fundamentação na Lei Complementar 214/2025
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border-2 border-slate-200 shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-black uppercase text-[10.5px] tracking-wider border-b-2 border-indigo-950">
                  <th className="py-3 px-3.5">Regime / Setor</th>
                  <th className="py-3 px-3 text-right">CBS Federal</th>
                  <th className="py-3 px-3 text-right">IBS Est./Mun.</th>
                  <th className="py-3 px-3 text-right">Total IVA Dual</th>
                  <th className="py-3 px-3 text-right">Variação vs. Teto</th>
                  <th className="py-3 px-3.5">Capitulação Legal</th>
                  <th className="py-3 px-3.5">Observações Práticas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {linhasTabela.map((linha, idx) => (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'
                    } hover:bg-indigo-50/40`}
                  >
                    <td className="py-2.5 px-3.5 font-bold text-slate-950">{linha.regime}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700">
                      {linha.cbs.toFixed(2).replace('.', ',')}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-sky-700">
                      {linha.ibs.toFixed(2).replace('.', ',')}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950">
                      {linha.total.toFixed(2).replace('.', ',')}%
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-mono font-black ${
                          linha.diferencaRef === 0
                            ? 'bg-slate-200 text-slate-800'
                            : linha.diferencaRef < 0
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {linha.diferencaRef > 0 ? '+' : ''}
                        {linha.diferencaRef.toFixed(2).replace('.', ',')}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-700 font-mono text-[11px] font-semibold">
                      {linha.baseLegal}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-600 text-[11px] leading-snug">
                      {linha.observacao}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── 6. PARECER CONCLUSIVO & ASSINATURA INSTITUCIONAL ── */}
        <section className="bloco-imprimivel p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-panorama-navy text-white space-y-3">
          <div className="flex items-center gap-2 text-panorama-gold font-black uppercase text-xs tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>Conclusão e Parecer Diretivo ADECONT</span>
          </div>
          <p className="text-xs sm:text-[13px] text-slate-200 leading-relaxed text-justify">
            O presente diagnóstico consolida os impactos tributários e operacionais identificados
            pelo Agente de IA e equipe diretiva da ADECONT com base na legislação da Reforma
            Tributária (EC 132/2023, LC 214/2025 e regulamentações do Comitê Gestor do IBS).
            Recomenda-se a readequação dos cadastros de NCM/NBS, parametrização dos sistemas de ERP
            e alinhamento financeiro dos contratos até o encerramento do exercício de 2025.
          </p>
        </section>

        {/* ── RODAPÉ INSTITUCIONAL ADECONT (LOGO + TEXTO OBRIGATÓRIO) ── */}
        <div className="relatorio-footer-impresso pt-6 border-t-2 border-indigo-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <AdecontLogo variant="color" className="h-10 w-auto" />
            <div className="border-l border-slate-300 pl-3">
              <span className="font-bold text-slate-900 block">
                ADECONT — Assessoria Contábil e Administrativa
              </span>
              <span className="text-[11px] text-slate-500">
                Plataforma Panorama da Reforma Tributária · Todos os direitos reservados
              </span>
            </div>
          </div>

          <div className="text-right text-[11px] text-slate-500 font-mono">
            <div>Documento Nº {numeroRelatorio}</div>
            <div>Emitido em {dataEmissao}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
