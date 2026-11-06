import React, { useState, useEffect } from 'react'
import { AdecontLogo } from '@/components/AdecontLogo'
import type { EmpresaRecord } from '@/types/cadastroEmpresas'
import {
  Printer,
  X,
  FileText,
  Calendar,
  Building2,
  CheckCircle2,
  XCircle,
  MapPin,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface RelatorioClientesImprimivelProps {
  empresas: EmpresaRecord[]
  termoBusca: string
  filtroTipoDoc: string
  filtroSituacao: string
  ordenacao: string
  totalBanco?: number
  aoFechar: () => void
}

/**
 * Folha de estilo escopada para impressão do Relatório Analítico de Clientes ADECONT.
 * Oculta todos os elementos do sistema (cabeçalhos, rodapés, menus, atalhos, modais e barra de botões)
 * e exibe exclusivamente o contêiner #relatorio-clientes-a4 em A4 portrait com margens milimétricas.
 */
const ESTILO_IMPRESSAO_A4_CLIENTES = `
@media print {
  @page {
    size: A4 portrait;
    margin: 10mm 10mm 12mm 10mm;
  }

  /* Oculta toda a moldura da plataforma e barras de ação */
  header,
  footer,
  aside,
  nav,
  .print\\:hidden,
  [data-print="hide"],
  #painel-atalhos {
    display: none !important;
  }

  html, body {
    background: #ffffff !important;
    color: #0f172a !important;
    font-size: 8.5pt !important;
    margin: 0 !important;
    padding: 0 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* O contêiner de impressão se expande como fluxo natural da folha */
  .relatorio-modal-overlay {
    position: static !important;
    inset: auto !important;
    background: transparent !important;
    padding: 0 !important;
    overflow: visible !important;
  }

  .relatorio-modal-card {
    max-width: 100% !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    background: #ffffff !important;
  }

  /* Quebras de página controladas */
  .tabela-relatorio-a4 {
    width: 100% !important;
    border-collapse: collapse !important;
  }

  .tabela-relatorio-a4 thead {
    display: table-header-group !important;
  }

  .tabela-relatorio-a4 tr {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  .bloco-cabecalho-a4,
  .bloco-resumo-a4,
  .bloco-rodape-a4 {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  a[href]::after {
    content: none !important;
  }
}
`

export const RelatorioClientesImprimivel: React.FC<RelatorioClientesImprimivelProps> = ({
  empresas,
  termoBusca,
  filtroTipoDoc,
  filtroSituacao,
  ordenacao,
  totalBanco,
  aoFechar,
}) => {
  const [dataHoraImpressao] = useState(() =>
    new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(new Date()),
  )

  // Injeta folha de estilo de impressão ao abrir
  useEffect(() => {
    const id = 'css-impressao-clientes-adecont'
    let styleEl = document.getElementById(id) as HTMLStyleElement | null
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = id
      styleEl.textContent = ESTILO_IMPRESSAO_A4_CLIENTES
      document.head.appendChild(styleEl)
    }

    return () => {
      // Deixa o estilo para não quebrar disparos assíncronos
    }
  }, [])

  const handleImprimir = () => {
    window.print()
  }

  // Estatísticas do conjunto impresso
  const total = empresas.length
  const totalAtivas = empresas.filter((e) => (e.situacao || '').toLowerCase() === 'ativa').length
  const totalInativas = empresas.filter(
    (e) => (e.situacao || '').toLowerCase() === 'inativa',
  ).length
  const totalCnpj = empresas.filter((e) => e.tipo_documento === 'CNPJ').length
  const totalCpf = empresas.filter((e) => e.tipo_documento === 'CPF').length
  const totalOutros = total - totalCnpj - totalCpf

  // Descrição amigável dos filtros ativos
  const filtrosDescricao: string[] = []
  if (termoBusca.trim()) {
    filtrosDescricao.push(`Busca: "${termoBusca.trim()}"`)
  }
  if (filtroTipoDoc !== 'TODOS') {
    filtrosDescricao.push(`Tipo de Documento: ${filtroTipoDoc}`)
  }
  if (filtroSituacao !== 'TODOS') {
    filtrosDescricao.push(`Situação: ${filtroSituacao}`)
  }
  if (ordenacao.startsWith('codigo')) {
    filtrosDescricao.push(
      `Ordem: Código (${ordenacao === 'codigo-desc' ? 'Decrescente' : 'Crescente'})`,
    )
  } else if (ordenacao.startsWith('nome')) {
    filtrosDescricao.push(`Ordem: Nome (${ordenacao === 'nome-desc' ? 'Z→A' : 'A→Z'})`)
  }

  return (
    <div className="relatorio-modal-overlay fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs p-3 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto">
      <div className="relatorio-modal-card max-w-5xl mx-auto bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-300 overflow-hidden print:shadow-none print:border-none print:rounded-none">
        {/* BARRA DE AÇÕES NA TELA (oculta na impressão) */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-100 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-800">
            <FileText className="h-4 w-4 text-[#0F294A]" />
            <span className="font-bold">
              Prévia do Relatório A4 — Cadastro Analítico de Clientes
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">
              ({total} registros prontos para emissão)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={aoFechar}
              className="text-slate-700 border-slate-300 hover:bg-slate-200 text-xs h-8 gap-1 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              <span>Fechar</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleImprimir}
              className="bg-[#0F294A] hover:bg-[#183b68] text-white text-xs h-8 gap-1.5 font-bold cursor-pointer shadow-sm"
            >
              <Printer className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>Imprimir / Salvar PDF</span>
            </Button>
          </div>
        </div>

        {/* CONTEÚDO FORMATADO A4 */}
        <div id="relatorio-clientes-a4" className="p-6 sm:p-10 print:p-0 space-y-4">
          {/* CABEÇALHO INSTITUCIONAL OFICIAL ADECONT */}
          <div className="bloco-cabecalho-a4 border-b-2 border-[#0F294A] pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AdecontLogo variant="color" showTagline={false} className="h-10 sm:h-12 w-auto" />
              <div className="border-l border-slate-300 pl-3">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#0F294A] block">
                  ADECONT — Assessoria Contábil e Administrativa
                </span>
                <h1 className="text-lg sm:text-xl font-serif font-black tracking-tight text-slate-900 uppercase">
                  Cadastro Analítico de Clientes
                </h1>
                <p className="text-[10px] text-slate-600 font-medium">
                  Relatório Operacional e Gerencial de Empresas e Contribuintes
                </p>
              </div>
            </div>

            <div className="text-right text-[10px] text-slate-600 sm:self-center shrink-0">
              <div className="font-bold text-slate-800 flex items-center justify-end gap-1">
                <Calendar className="w-3 h-3 text-[#0F294A]" />
                <span>Emissão: {dataHoraImpressao}</span>
              </div>
              <div className="text-slate-500">Documento Oficial ADECONT</div>
            </div>
          </div>

          {/* QUADRO DE RESUMO E FILTROS ATIVOS */}
          <div className="bloco-resumo-a4 bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-2 text-[10.5px]">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
              <div className="bg-white p-1.5 rounded border border-slate-200">
                <span className="text-[9px] text-slate-500 uppercase block font-semibold">
                  Listados no Relatório
                </span>
                <span className="text-sm font-black text-[#0F294A]">{total}</span>
              </div>
              <div className="bg-white p-1.5 rounded border border-slate-200">
                <span className="text-[9px] text-emerald-700 uppercase block font-semibold">
                  Situação Ativa
                </span>
                <span className="text-sm font-black text-emerald-800">{totalAtivas}</span>
              </div>
              <div className="bg-white p-1.5 rounded border border-slate-200">
                <span className="text-[9px] text-slate-600 uppercase block font-semibold">
                  Situação Inativa
                </span>
                <span className="text-sm font-black text-slate-800">{totalInativas}</span>
              </div>
              <div className="bg-white p-1.5 rounded border border-slate-200">
                <span className="text-[9px] text-blue-700 uppercase block font-semibold">
                  Pessoas Jurídicas (CNPJ)
                </span>
                <span className="text-sm font-black text-blue-800">{totalCnpj}</span>
              </div>
              <div className="bg-white p-1.5 rounded border border-slate-200">
                <span className="text-[9px] text-amber-700 uppercase block font-semibold">
                  Pessoas Físicas / Outros
                </span>
                <span className="text-sm font-black text-amber-800">{totalCpf + totalOutros}</span>
              </div>
            </div>

            {filtrosDescricao.length > 0 && (
              <div className="pt-1.5 border-t border-slate-200 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-600">
                <Filter className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="font-bold text-slate-700">Filtros da consulta:</span>
                {filtrosDescricao.map((f, i) => (
                  <span
                    key={i}
                    className="bg-slate-200/80 text-slate-800 px-1.5 py-0.5 rounded font-medium"
                  >
                    {f}
                  </span>
                ))}
                {totalBanco !== undefined && total !== totalBanco && (
                  <span className="text-slate-500 italic ml-auto">
                    (Base cadastral total: {totalBanco} registros)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* TABELA DE CLIENTES FORMATADA PARA A4 */}
          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <table className="tabela-relatorio-a4 w-full text-left text-[10px] border-collapse">
              <thead>
                <tr className="bg-[#0F294A] text-white font-bold uppercase tracking-wider text-[9px]">
                  <th className="py-2 px-2 w-12 text-center">Cód.</th>
                  <th className="py-2 px-2.5 w-32">Documento</th>
                  <th className="py-2 px-3">Razão Social / Nome</th>
                  <th className="py-2 px-2.5 w-36">Apelido / Fantasia</th>
                  <th className="py-2 px-2.5 w-32">Município / UF</th>
                  <th className="py-2 px-2 w-20 text-center">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {empresas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 italic text-xs">
                      Nenhum cliente atende aos critérios da consulta atual.
                    </td>
                  </tr>
                ) : (
                  empresas.map((empresa, idx) => {
                    const isAtiva = (empresa.situacao || '').toLowerCase() === 'ativa'
                    const localidade =
                      [empresa.municipio, empresa.uf].filter(Boolean).join(' / ') || '—'

                    return (
                      <tr
                        key={empresa.id || empresa.codigo || idx}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}
                      >
                        {/* Código */}
                        <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-800">
                          {empresa.codigo}
                        </td>

                        {/* Documento */}
                        <td className="py-1.5 px-2.5">
                          <div className="font-mono font-semibold text-slate-900 leading-tight">
                            {empresa.numero_documento || '—'}
                          </div>
                          {empresa.tipo_documento && (
                            <span className="text-[8.5px] uppercase font-bold text-slate-500">
                              {empresa.tipo_documento}
                            </span>
                          )}
                        </td>

                        {/* Razão Social */}
                        <td className="py-1.5 px-3">
                          <div className="font-bold text-slate-900 leading-tight">
                            {empresa.razao_social || empresa.nome || '—'}
                          </div>
                          {empresa.ramo_atividade && (
                            <div className="text-[8.5px] text-slate-500 truncate max-w-xs">
                              {empresa.ramo_atividade}
                            </div>
                          )}
                        </td>

                        {/* Apelido / Fantasia */}
                        <td className="py-1.5 px-2.5 text-slate-700">
                          <div className="font-medium text-slate-800 leading-tight">
                            {empresa.apelido || empresa.nome_fantasia || '—'}
                          </div>
                        </td>

                        {/* Município / UF */}
                        <td className="py-1.5 px-2.5 text-slate-700">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span className="truncate">{localidade}</span>
                          </div>
                          {empresa.telefone && (
                            <div className="text-[8.5px] text-slate-500 font-mono">
                              {empresa.telefone}
                            </div>
                          )}
                        </td>

                        {/* Situação */}
                        <td className="py-1.5 px-2 text-center">
                          <span
                            className={`inline-flex items-center gap-0.5 text-[8.5px] font-bold px-1.5 py-0.5 rounded border ${
                              isAtiva
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-slate-100 text-slate-600 border-slate-300'
                            }`}
                          >
                            {isAtiva ? (
                              <CheckCircle2 className="w-2 h-2 text-emerald-600" />
                            ) : (
                              <XCircle className="w-2 h-2 text-slate-500" />
                            )}
                            {empresa.situacao || 'Ativa'}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* RODAPÉ INSTITUCIONAL A4 */}
          <div className="bloco-rodape-a4 border-t border-slate-300 pt-3 mt-4 text-[9.5px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-1.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">ADECONT</span>
              <span>— Assessoria Contábil e Administrativa</span>
              <span className="text-slate-400">•</span>
              <span className="font-semibold text-slate-700">
                {total} {total === 1 ? 'cliente listado' : 'clientes listados'}
              </span>
            </div>

            <div className="text-right text-slate-500">
              <span>Cadastro Analítico de Clientes • Documento emitido em {dataHoraImpressao}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
