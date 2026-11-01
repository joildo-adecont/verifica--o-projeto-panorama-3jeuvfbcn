import { useState, useMemo } from 'react'
import {
  FileSpreadsheet,
  Download,
  Search,
  ArrowUpDown,
  Filter,
  BadgeCheck,
  Scale,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Info,
  Check,
  Layers,
  Percent,
} from 'lucide-react'
import {
  ANEXOS_REFORMA_CATALOGO,
  type AnexoReformaItem,
  type ProdutoServicoAnexo,
} from '@/data/anexosReforma'
import { downloadOfficialDocViaProxy } from '@/services/panorama'
import { toast } from '@/hooks/use-toast'

export interface ConsultaCompletaAnexosProps {
  filtroReducao?: string[]
  filtroTabela?: string[]
  filtroFonte?: string[]
}

export function ConsultaCompletaAnexos({
  filtroReducao,
  filtroTabela,
  filtroFonte,
}: ConsultaCompletaAnexosProps = {}) {
  const [anexoSelecionadoId, setAnexoSelecionadoId] = useState<string>(
    ANEXOS_REFORMA_CATALOGO[0]?.id || '',
  )
  const [buscaInterna, setBuscaInterna] = useState<string>('')
  const [ordenacao, setOrdenacao] = useState<
    'item-asc' | 'item-desc' | 'desc-asc' | 'desc-desc' | 'cod-asc'
  >('item-asc')
  const [pagina, setPagina] = useState<number>(1)
  const [itensPorPagina, setItensPorPagina] = useState<number>(15)
  const [baixandoPdf, setBaixandoPdf] = useState<boolean>(false)
  const [exportandoCsv, setExportandoCsv] = useState<boolean>(false)

  // Anexo selecionado atual
  const anexoAtual = useMemo<AnexoReformaItem>(() => {
    return (
      ANEXOS_REFORMA_CATALOGO.find((a) => a.id === anexoSelecionadoId) || ANEXOS_REFORMA_CATALOGO[0]
    )
  }, [anexoSelecionadoId])

  // Filtragem e ordenação dos itens do anexo selecionado
  const itensFiltrados = useMemo(() => {
    if (!anexoAtual) return []
    const termo = buscaInterna.trim().toLowerCase()

    let lista = anexoAtual.produtosServicos.filter((p: ProdutoServicoAnexo) => {
      // Filtro de Redução / Alíquota herdado dos filtros avançados
      if (filtroReducao && filtroReducao.length > 0) {
        const itemPct = p.reducaoPct !== undefined ? p.reducaoPct : anexoAtual.reducaoAliquotaPct
        const itemRot = (p.reducaoRotulo || anexoAtual.reducaoRotulo).toLowerCase()
        const matchRed = filtroReducao.some((r) => {
          if (r === '0%' && (itemPct === 0 || itemRot.includes('0%') || itemRot.includes('zero')))
            return true
          if (r === '-30%' && (itemPct === -30 || itemRot.includes('30%'))) return true
          if (r === '-50%' && (itemPct === -50 || itemRot.includes('50%'))) return true
          if (r === '-60%' && (itemPct === -60 || itemRot.includes('60%'))) return true
          if (
            r === '-100%' &&
            (itemPct === -100 || itemRot.includes('100%') || itemRot.includes('zero'))
          )
            return true
          return itemRot.includes(r.toLowerCase())
        })
        if (!matchRed) return false
      }

      // Filtro de Tabela oficial (NCM, NBS, cClassTrib, cCredPres, CEST)
      if (filtroTabela && filtroTabela.length > 0) {
        const matchTab = filtroTabela.some((t) => {
          if (t === 'NCM' && (p.ncm || p.tipoCodigo === 'NCM')) return true
          if (t === 'NBS' && (p.nbs || p.tipoCodigo === 'NBS')) return true
          if (t === 'cClassTrib' && p.cClassTrib) return true
          if (t === 'cCredPres' && p.cCredPres) return true
          if (t === 'CEST' && p.cest) return true
          if (p.tipoCodigo === t) return true
          return false
        })
        if (!matchTab) return false
      }

      if (!termo) return true
      return (
        p.descricao.toLowerCase().includes(termo) ||
        (p.codigo && p.codigo.toLowerCase().includes(termo)) ||
        (p.ncm && p.ncm.toLowerCase().includes(termo)) ||
        (p.nbs && p.nbs.toLowerCase().includes(termo)) ||
        (p.cClassTrib && p.cClassTrib.toLowerCase().includes(termo)) ||
        (p.cCredPres && p.cCredPres.toLowerCase().includes(termo)) ||
        (p.cest && p.cest.toLowerCase().includes(termo)) ||
        (p.capitulacaoItem && p.capitulacaoItem.toLowerCase().includes(termo)) ||
        (p.detalhes && p.detalhes.toLowerCase().includes(termo)) ||
        p.item.toLowerCase().includes(termo)
      )
    })

    lista = [...lista].sort((a, b) => {
      if (ordenacao === 'item-asc') {
        const numA = parseInt(a.item, 10)
        const numB = parseInt(b.item, 10)
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB
        return a.item.localeCompare(b.item, 'pt-BR')
      }
      if (ordenacao === 'item-desc') {
        const numA = parseInt(a.item, 10)
        const numB = parseInt(b.item, 10)
        if (!isNaN(numA) && !isNaN(numB)) return numB - numA
        return b.item.localeCompare(a.item, 'pt-BR')
      }
      if (ordenacao === 'desc-asc') {
        return a.descricao.localeCompare(b.descricao, 'pt-BR')
      }
      if (ordenacao === 'desc-desc') {
        return b.descricao.localeCompare(a.descricao, 'pt-BR')
      }
      if (ordenacao === 'cod-asc') {
        const codA = a.codigo || a.ncm || a.nbs || ''
        const codB = b.codigo || b.ncm || b.nbs || ''
        return codA.localeCompare(codB, 'pt-BR')
      }
      return 0
    })

    return lista
  }, [anexoAtual, buscaInterna, ordenacao, filtroReducao, filtroTabela, filtroFonte])

  // Paginação
  const totalPaginas = Math.ceil(itensFiltrados.length / itensPorPagina) || 1
  const paginaAjustada = Math.min(pagina, totalPaginas)
  const itensPaginados = useMemo(() => {
    const inicio = (paginaAjustada - 1) * itensPorPagina
    return itensFiltrados.slice(inicio, inicio + itensPorPagina)
  }, [itensFiltrados, paginaAjustada, itensPorPagina])

  // Download do PDF oficial via proxy (/backend/v1/download-resolution)
  const handleBaixarPdfOficial = async () => {
    setBaixandoPdf(true)
    try {
      const docId = anexoAtual.documentoDownloadId || 'lc-214-2025'
      const nomeArquivo = `${anexoAtual.numero.replace(/\s+/g, '-')}-LC214-2025-Planalto.pdf`
      await downloadOfficialDocViaProxy(docId, nomeArquivo)
      toast({
        title: 'Download iniciado com sucesso',
        description: `O documento oficial (${anexoAtual.numero}) foi mediado pelo proxy seguro do servidor.`,
      })
    } catch (err) {
      toast({
        title: 'Falha no download via proxy',
        description: String(err),
        variant: 'destructive',
      })
    } finally {
      setBaixandoPdf(false)
    }
  }

  // Exportação CSV formatada para Microsoft Excel (UTF-8 com BOM, delimitador ponto-e-vírgula)
  const handleExportarCsv = () => {
    setExportandoCsv(true)
    try {
      const headers = [
        'Anexo',
        'Item',
        'Descrição do Produto/Serviço',
        'Tipo de Código',
        'Código Principal',
        'NCM',
        'NBS',
        'cClassTrib',
        'cCredPres',
        'CEST',
        'Redução / Alíquota Aplicável',
        'Percentual Redução (%)',
        'Capitulação Legal (LC 214/2025)',
        'Detalhes / Condição',
        'Fonte Oficial',
      ]

      const escapeCsv = (val?: string | number | null) => {
        if (val === undefined || val === null) return '""'
        const str = String(val).replace(/"/g, '""')
        return `"${str}"`
      }

      const linhas = itensFiltrados.map((it) => {
        return [
          escapeCsv(anexoAtual.numero),
          escapeCsv(it.item),
          escapeCsv(it.descricao),
          escapeCsv(it.tipoCodigo || '—'),
          escapeCsv(it.codigo || '—'),
          escapeCsv(it.ncm || (it.tipoCodigo === 'NCM' ? it.codigo : '') || '—'),
          escapeCsv(it.nbs || (it.tipoCodigo === 'NBS' ? it.codigo : '') || '—'),
          escapeCsv(it.cClassTrib || '—'),
          escapeCsv(it.cCredPres || '—'),
          escapeCsv(it.cest || '—'),
          escapeCsv(it.reducaoRotulo || anexoAtual.reducaoRotulo),
          escapeCsv(it.reducaoPct !== undefined ? it.reducaoPct : anexoAtual.reducaoAliquotaPct),
          escapeCsv(it.capitulacaoItem || anexoAtual.capitulacaoLegal),
          escapeCsv(it.detalhes || anexoAtual.baseCalculoTexto || '—'),
          escapeCsv(anexoAtual.fonteOficial.selo),
        ].join(';')
      })

      const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(';'), ...linhas].join('\r\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const safeAnexoNome = anexoAtual.numero.replace(/[^a-zA-Z0-9]/g, '_')
      link.href = url
      link.download = `Consulta_Completa_${safeAnexoNome}_LC214_2025.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: 'Exportação CSV gerada',
        description: `${itensFiltrados.length} itens do ${anexoAtual.numero} exportados no padrão Excel (UTF-8 com BOM).`,
      })
    } catch (err) {
      toast({
        title: 'Falha ao exportar CSV',
        description: String(err),
        variant: 'destructive',
      })
    } finally {
      setExportandoCsv(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-50/60 via-white to-sky-50/30 rounded-2xl border-2 border-blue-300 shadow-md p-5 sm:p-7 space-y-6">
      {/* Cabeçalho do Painel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b-2 border-blue-200 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-700 text-white shadow-xs">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Consulta Completa dos Anexos da LC 214/2025
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
              Planalto — Texto Compilado Oficial
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-100 text-blue-900 border border-blue-200">
              {ANEXOS_REFORMA_CATALOGO.length} anexos & regimes catalogados
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Consulta Livre dos Produtos e Serviços por Anexo
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
            Selecione qualquer anexo da Lei Complementar 214/2025 ou regime específico para
            visualizar
            <strong> todos os itens constantes na íntegra</strong> — sem necessidade de busca
            prévia. Exibe códigos vinculados (NCM, NBS, cClassTrib, cCredPres, CEST), capitulações
            legais exatas e alíquotas com desoneração oficial.
          </p>
        </div>

        {/* Botões de Ação Geral (Download Oficial por Proxy e Exportar CSV) */}
        <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
          <button
            onClick={handleExportarCsv}
            disabled={exportandoCsv || itensFiltrados.length === 0}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Exportar planilha CSV compatível com Microsoft Excel (UTF-8 com BOM e delimitador ';')"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV (Excel)</span>
          </button>

          <button
            onClick={handleBaixarPdfOficial}
            disabled={baixandoPdf}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-panorama-navy text-panorama-gold-light hover:bg-panorama-navy-light transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Download do ato oficial compilado mediado pelo proxy do backend (/backend/v1/download-resolution)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{baixandoPdf ? 'Baixando...' : 'PDF Oficial (Proxy)'}</span>
          </button>
        </div>
      </div>

      {/* SELETOR DE ANEXO: Pills Roláveis ou Dropdown Intuitivo */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5 text-blue-950 uppercase tracking-wide">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            1. Selecione o Anexo ou Regime Específico:
          </span>
          <span className="text-slate-500 font-normal hidden sm:inline">
            Clique no anexo desejado para carregar todos os seus itens
          </span>
        </div>

        {/* Grade de Botões Seletores dos Anexos */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {ANEXOS_REFORMA_CATALOGO.map((anexo) => {
            const isAtivo = anexo.id === anexoSelecionadoId
            return (
              <button
                key={anexo.id}
                onClick={() => {
                  setAnexoSelecionadoId(anexo.id)
                  setPagina(1)
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer border shrink-0 ${
                  isAtivo
                    ? 'bg-blue-900 text-white border-blue-900 shadow-md ring-2 ring-blue-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
                }`}
              >
                <FileSpreadsheet
                  className={`w-3.5 h-3.5 ${isAtivo ? 'text-panorama-gold-light' : 'text-blue-600'}`}
                />
                <span>{anexo.numero}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isAtivo
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100'
                  }`}
                >
                  {anexo.produtosServicos.length}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* CARD DETALHADO DO ANEXO SELECIONADO */}
      <div className="bg-white rounded-xl border-2 border-blue-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-md text-xs font-black uppercase tracking-wider bg-blue-900 text-white shadow-xs">
                {anexoAtual.numero}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-md text-xs font-extrabold ${
                  anexoAtual.reducaoAliquotaPct === -100
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : anexoAtual.reducaoAliquotaPct === -60
                      ? 'bg-blue-100 text-blue-900 border border-blue-300'
                      : anexoAtual.reducaoAliquotaPct === -30
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-slate-100 text-slate-800 border border-slate-300'
                }`}
              >
                {anexoAtual.reducaoRotulo}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {anexoAtual.categoria}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
              {anexoAtual.titulo}
            </h3>
            <p className="text-xs sm:text-sm font-medium text-slate-600 italic">
              {anexoAtual.subtitulo}
            </p>
          </div>

          <div className="bg-emerald-50/90 border border-emerald-300 rounded-xl p-3 text-xs space-y-1 shrink-0 md:max-w-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-emerald-950 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-emerald-700" />
                Alíquota Efetiva:
              </span>
              <span className="font-mono font-black text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-200">
                {anexoAtual.aliquotaEfetivaIbsCbs}
              </span>
            </div>
            <p className="text-[11px] text-emerald-900 leading-snug">
              {anexoAtual.baseCalculoTexto}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
          {anexoAtual.resumo}
        </p>

        {/* Capitulação Normativa Oficial */}
        <div className="bg-sky-50/80 border-l-4 border-sky-600 p-3 rounded-r-xl text-xs space-y-1.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-extrabold text-sky-950 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-sky-700" />
              Capitulação Legal Oficial (Texto Planalto):
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-sky-800">Remissões:</span>
              {anexoAtual.artigosRemissao.map((art, idx) => (
                <span
                  key={idx}
                  className="bg-sky-200/80 text-sky-950 font-bold px-2 py-0.5 rounded text-[10.5px]"
                >
                  {art}
                </span>
              ))}
            </div>
          </div>
          <p className="text-sky-950 font-mono font-bold text-xs sm:text-[13px] leading-relaxed">
            {anexoAtual.capitulacaoLegal}
          </p>
        </div>

        {/* Fonte Oficial e Selo */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs flex-wrap">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px]">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
              {anexoAtual.fonteOficial.selo}
            </span>
            <span className="text-slate-600 font-medium text-[11.5px]">
              {anexoAtual.fonteOficial.nome}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={anexoAtual.fonteOficial.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11.5px] font-bold text-blue-700 hover:text-blue-900 hover:underline"
            >
              <span>Ver Compilação no Planalto</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* FERRAMENTAS DA TABELA: Busca Interna, Ordenação e Contadores */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Campo de Busca Interna */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={buscaInterna}
              onChange={(e) => {
                setBuscaInterna(e.target.value)
                setPagina(1)
              }}
              placeholder={`Filtrar itens do ${anexoAtual.numero} por produto, serviço ou código NCM/NBS...`}
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 focus:border-blue-600 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
            />
            {buscaInterna && (
              <button
                onClick={() => {
                  setBuscaInterna('')
                  setPagina(1)
                }}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Limpar busca interna"
              >
                ✕
              </button>
            )}
          </div>

          {/* Ordenação e Itens por Página */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Ordenar por:</span>
            </div>
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value as any)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="item-asc">Número do Item (Crescente)</option>
              <option value="item-desc">Número do Item (Decrescente)</option>
              <option value="desc-asc">Descrição (A → Z)</option>
              <option value="desc-desc">Descrição (Z → A)</option>
              <option value="cod-asc">Código Oficial (NCM/NBS)</option>
            </select>

            <select
              value={itensPorPagina}
              onChange={(e) => {
                setItensPorPagina(Number(e.target.value))
                setPagina(1)
              }}
              className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-medium text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value={10}>10 por pág.</option>
              <option value={15}>15 por pág.</option>
              <option value={25}>25 por pág.</option>
              <option value={50}>50 por pág.</option>
            </select>
          </div>
        </div>

        {/* Resumo de Registros */}
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>
            Mostrando <strong>{itensFiltrados.length}</strong> itens catalogados no{' '}
            <strong>{anexoAtual.numero}</strong>
            {buscaInterna && ` (filtrado por "${buscaInterna}")`}
          </span>
          <span>
            Página <strong>{paginaAjustada}</strong> de <strong>{totalPaginas}</strong>
          </span>
        </div>
      </div>

      {/* TABELA COMPLETA DE ITENS DO ANEXO */}
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 text-slate-800 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 w-16 text-center">Item</th>
                <th className="py-3 px-4 min-w-[240px]">Produto / Serviço Constante do Anexo</th>
                <th className="py-3 px-3 min-w-[170px]">Códigos Oficiais Vinculados</th>
                <th className="py-3 px-3 min-w-[130px] text-center">Redução / Alíquota</th>
                <th className="py-3 px-3 min-w-[190px]">Capitulação Legal (LC 214)</th>
                <th className="py-3 px-3 min-w-[130px] text-center">Fonte Oficial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itensPaginados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 space-y-1">
                    <p className="font-semibold text-sm">
                      Nenhum item localizado com o filtro aplicado.
                    </p>
                    <p className="text-xs">
                      Tente limpar a busca interna para ver todos os itens deste anexo.
                    </p>
                  </td>
                </tr>
              ) : (
                itensPaginados.map((it, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                    {/* Item */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 bg-slate-50/50">
                      {it.item}
                    </td>

                    {/* Descrição e Detalhes */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 leading-snug block">
                          {it.descricao}
                        </span>
                        {it.detalhes && (
                          <span className="text-[11px] text-slate-500 italic block leading-tight">
                            {it.detalhes}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Códigos Oficiais Vinculados (NCM, NBS, cClassTrib, cCredPres, CEST) */}
                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        {it.codigo ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                              <span className="text-amber-700 mr-1">{it.tipoCodigo || 'CÓD'}:</span>
                              {it.codigo}
                            </span>
                          </div>
                        ) : null}

                        <div className="flex items-center gap-1 flex-wrap text-[10px] font-mono">
                          {it.cClassTrib && (
                            <span
                              className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-900 border border-blue-200 font-bold"
                              title="Código de Classificação Tributária"
                            >
                              cClassTrib: {it.cClassTrib}
                            </span>
                          )}
                          {it.cCredPres && (
                            <span
                              className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-900 border border-purple-200 font-bold"
                              title="Código de Crédito Presumido"
                            >
                              cCredPres: {it.cCredPres}
                            </span>
                          )}
                          {it.cest && (
                            <span
                              className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-800 border border-slate-200 font-bold"
                              title="Código Especificador da Substituição Tributária"
                            >
                              CEST: {it.cest}
                            </span>
                          )}
                          {!it.codigo && !it.cClassTrib && !it.cCredPres && !it.cest && (
                            <span className="text-slate-400 font-normal italic">
                              Regime especial por dispositivo legal
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Redução / Alíquota Aplicável */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-black leading-tight ${
                          (it.reducaoPct !== undefined
                            ? it.reducaoPct
                            : anexoAtual.reducaoAliquotaPct) === -100
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : (it.reducaoPct !== undefined
                                  ? it.reducaoPct
                                  : anexoAtual.reducaoAliquotaPct) === -60
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : (it.reducaoPct !== undefined
                                    ? it.reducaoPct
                                    : anexoAtual.reducaoAliquotaPct) === -30
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 text-slate-800 border border-slate-300'
                        }`}
                      >
                        {it.reducaoRotulo || anexoAtual.reducaoRotulo}
                      </span>
                    </td>

                    {/* Capitulação Legal do Item */}
                    <td className="py-3 px-3">
                      <span className="font-mono text-[11px] font-bold text-sky-950 block leading-snug">
                        {it.capitulacaoItem || anexoAtual.capitulacaoLegal}
                      </span>
                    </td>

                    {/* Selo da Fonte Oficial e Download */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <BadgeCheck className="w-3 h-3 text-emerald-600" />
                          Planalto
                        </span>
                        <button
                          onClick={handleBaixarPdfOficial}
                          disabled={baixandoPdf}
                          className="text-[10.5px] font-bold text-blue-700 hover:text-blue-900 underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          title="Download do PDF oficial mediado pelo proxy do backend"
                        >
                          <Download className="w-2.5 h-2.5" />
                          PDF (Proxy)
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Controles de Paginação */}
        {totalPaginas > 1 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <span className="text-slate-600">
              Página <strong>{paginaAjustada}</strong> de <strong>{totalPaginas}</strong> (total de{' '}
              {itensFiltrados.length} itens)
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={paginaAjustada <= 1}
                className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Anterior
              </button>

              {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPaginas || Math.abs(p - paginaAjustada) <= 2)
                .map((p, idx, arr) => {
                  const mostrarReticencias = idx > 0 && p - arr[idx - 1] > 1
                  return (
                    <span key={p} className="flex items-center">
                      {mostrarReticencias && <span className="px-1 text-slate-400">...</span>}
                      <button
                        onClick={() => setPagina(p)}
                        className={`w-7 h-7 rounded text-xs font-bold cursor-pointer ${
                          p === paginaAjustada
                            ? 'bg-blue-900 text-white'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  )
                })}

              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaAjustada >= totalPaginas}
                className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
              >
                Próxima
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Nota Informativa sobre Fontes Oficiais e Proxy */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-slate-600">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-800">
            Garantia de Autenticidade e Acesso Seguro sem Bloqueios
          </p>
          <p className="leading-relaxed">
            Todos os itens desta consulta completa são extraídos textualmente dos anexos da Lei
            Complementar nº 214/2025 publicada pelo Planalto. Todos os downloads de documentos são
            intermediados pelo servidor seguro da ADECONT via proxy oficial (
            <code className="text-[11px] font-mono text-slate-800 bg-white px-1 py-0.2 rounded border">
              /backend/v1/download-resolution
            </code>
            ), assegurando imunidade a bloqueios de cliente (ERR_BLOCKED_BY_CLIENT) e conformidade
            total com os padrões de segurança de dados.
          </p>
        </div>
      </div>
    </div>
  )
}
