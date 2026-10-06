import { useState, useEffect, useMemo } from 'react'
import {
  FileSpreadsheet,
  Download,
  Share2,
  Copy,
  Check,
  QrCode,
  PlusCircle,
  Clock,
  ExternalLink,
  MessageCircle,
  Mail,
  X,
  Layers,
  Sparkles,
  ShieldCheck,
  Database,
  FileCode,
} from 'lucide-react'
import { AdecontLogo } from '@/components/AdecontLogo'
import { renderQrCodeSvg } from '@/lib/qrCode'
import {
  getExportClassificationsUrl,
  fetchClassificationCounts,
  type OfficialTableCountsResult,
} from '@/services/classifications'
import {
  fetchInstallShortcuts,
  createInstallShortcut,
  registerShortcutSend,
  type InstallShortcutItem,
} from '@/services/installShortcuts'
import type { ClassificationType } from '@/types/panorama'

export interface ModalBaseClassificacoesProps {
  isOpen: boolean
  onClose: () => void
  tabelaInicial?: ClassificationType | 'TODOS'
}

export interface OpcaoTabela {
  id: ClassificationType | 'TODOS'
  label: string
  sublabel: string
  orgao: string
  itensAprox: string
  cor: string
}

export const OPCOES_TABELAS_CLASSIFICACOES: OpcaoTabela[] = [
  {
    id: 'NCM',
    label: '2. NCM (Nomenclatura Comum Mercosul)',
    sublabel: 'Base completa Siscomex / MDIC com 15.240 itens oficiais',
    orgao: 'Siscomex / MDIC / RFB',
    itensAprox: '15.240 itens oficiais',
    cor: 'text-indigo-700 border-indigo-300 bg-indigo-50/50',
  },
  {
    id: 'CEST',
    label: '6. CEST (Substituição Tributária)',
    sublabel: 'Código Especificador da ST Estadual',
    orgao: 'CONFAZ (Conv. 142/18)',
    itensAprox: '100+ itens',
    cor: 'text-purple-700 border-purple-300 bg-purple-50/50',
  },
  {
    id: 'cClassTrib',
    label: '3. cClassTrib (Classificação Tributária)',
    sublabel: 'Classificação Tributária IBS/CBS na NF-e',
    orgao: 'CGIBS / RFB / ENCAT',
    itensAprox: '15 itens',
    cor: 'text-emerald-700 border-emerald-300 bg-emerald-50/50',
  },
  {
    id: 'CST',
    label: '4. CST (Situação Tributária IBS/CBS)',
    sublabel: 'Códigos de Tributação e Desoneração',
    orgao: 'RFB / CGIBS / SPED',
    itensAprox: '10 itens',
    cor: 'text-amber-700 border-amber-300 bg-amber-50/50',
  },
  {
    id: 'cCredPres',
    label: '5. cCredPres (Crédito Presumido)',
    sublabel: 'Hipóteses de crédito presumido na Reforma',
    orgao: 'SVRS / RFB / CGIBS',
    itensAprox: '7 itens',
    cor: 'text-teal-700 border-teal-300 bg-teal-50/50',
  },
  {
    id: 'CFOP',
    label: '8. CFOP (Operações e Prestações)',
    sublabel: 'Códigos Fiscais de Operações e Prestações',
    orgao: 'CONFAZ / SINIEF',
    itensAprox: '17 itens',
    cor: 'text-cyan-700 border-cyan-300 bg-cyan-50/50',
  },
  {
    id: 'NBS',
    label: '9. NBS (Nomenclatura Serviços)',
    sublabel: 'Serviços e intangíveis nacionais',
    orgao: 'RFB / MDIC / Codex',
    itensAprox: '10 itens',
    cor: 'text-violet-700 border-violet-300 bg-violet-50/50',
  },
  {
    id: 'CNAE 2.3',
    label: '10. CNAE 2.3 (Atividades Econômicas)',
    sublabel: 'Classificação Nacional de Atividades',
    orgao: 'IBGE / CONCLA',
    itensAprox: '13 itens',
    cor: 'text-orange-700 border-orange-300 bg-orange-50/50',
  },
  {
    id: 'cBenef',
    label: '11. cBenef (Benefícios Fiscais)',
    sublabel: 'Códigos estaduais de benefício fiscal',
    orgao: 'Sefaz Estaduais (SP/RS/PR...)',
    itensAprox: '8 itens',
    cor: 'text-fuchsia-700 border-fuchsia-300 bg-fuchsia-50/50',
  },
  {
    id: 'MVA-ST',
    label: '7. MVA-ST (Margem Valor Agregado)',
    sublabel: 'Margens originais e ajustadas por segmento',
    orgao: 'CONFAZ / Sefaz UFs',
    itensAprox: '10 itens',
    cor: 'text-rose-700 border-rose-300 bg-rose-50/50',
  },
  {
    id: 'Nome',
    label: '1. Nome / Especificação de Itens',
    sublabel: 'Produtos e serviços por denominação usual',
    orgao: 'RFB / MAPA / CFC',
    itensAprox: '12 itens',
    cor: 'text-blue-700 border-blue-300 bg-blue-50/50',
  },
  {
    id: 'TODOS',
    label: 'Todos (Consolidado de 11 Tabelas)',
    sublabel: 'Todas as tabelas reunidas em arquivo único',
    orgao: 'Consolidado Oficial',
    itensAprox: '15.350+ registros',
    cor: 'text-slate-800 border-slate-300 bg-slate-100',
  },
]

export function ModalBaseClassificacoes({
  isOpen,
  onClose,
  tabelaInicial = 'NCM',
}: ModalBaseClassificacoesProps) {
  const [activeTab, setActiveTab] = useState<'gerar_enviar' | 'depositar' | 'historico'>(
    'gerar_enviar',
  )
  const [tabelaSelecionada, setTabelaSelecionada] = useState<ClassificationType | 'TODOS'>(
    tabelaInicial || 'NCM',
  )
  const [formato, setFormato] = useState<'csv' | 'json'>('csv')
  const [shortcuts, setShortcuts] = useState<InstallShortcutItem[]>([])
  const [loadingShortcuts, setLoadingShortcuts] = useState(false)
  const [counts, setCounts] = useState<OfficialTableCountsResult | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Formulário de depósito no banco
  const [depTitulo, setDepTitulo] = useState('')
  const [depAutor, setDepAutor] = useState('Equipe ADECONT')
  const [depObs, setDepObs] = useState('')
  const [saving, setSaving] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    if (isOpen) {
      carregarHistorico()
      fetchClassificationCounts().then((res) => {
        setCounts(res)
      })
    }
  }, [isOpen])

  useEffect(() => {
    if (tabelaInicial) {
      setTabelaSelecionada(tabelaInicial)
    }
  }, [tabelaInicial])

  async function carregarHistorico() {
    setLoadingShortcuts(true)
    try {
      const data = await fetchInstallShortcuts()
      setShortcuts(data)
    } finally {
      setLoadingShortcuts(false)
    }
  }

  const infoTabela = useMemo(() => {
    return (
      OPCOES_TABELAS_CLASSIFICACOES.find((t) => t.id === tabelaSelecionada) ||
      OPCOES_TABELAS_CLASSIFICACOES[0]
    )
  }, [tabelaSelecionada])

  // URL direta oficial servida pelo próprio backend ADECONT (política anti-bloqueio)
  const downloadUrl = useMemo(() => {
    return getExportClassificationsUrl(tabelaSelecionada, formato)
  }, [tabelaSelecionada, formato])

  // QR Code SVG renderizado
  const qrSvgString = useMemo(() => {
    if (!downloadUrl) return ''
    return renderQrCodeSvg(downloadUrl, 180, '#2E2260')
  }, [downloadUrl])

  function copiarParaClipboard(texto: string, key: string) {
    navigator.clipboard.writeText(texto)
    setCopiedKey(key)
    setTimeout(() => {
      setCopiedKey(null)
    }, 2500)
  }

  // Estatística dinâmica ou oficial
  const qtdItensTexto = useMemo(() => {
    if (tabelaSelecionada === 'NCM') {
      const ncmTotal = counts?.counts?.['NCM'] || 15240
      return `${ncmTotal.toLocaleString('pt-BR')} itens oficiais do Siscomex/MDIC (referência 01/10/2026)`
    }
    if (tabelaSelecionada === 'TODOS') {
      const grandTotal = counts?.grandTotal || 15350
      return `${grandTotal.toLocaleString('pt-BR')} registros consolidados nas 11 tabelas oficiais`
    }
    const c = counts?.counts?.[tabelaSelecionada as string]
    return c ? `${c.toLocaleString('pt-BR')} itens oficiais cadastrados` : infoTabela.itensAprox
  }, [tabelaSelecionada, counts, infoTabela])

  function gerarTextoMensagem(customUrl?: string, customTitulo?: string) {
    const url = customUrl || downloadUrl
    const tit = customTitulo || `Download da Base Oficial de Classificações (${tabelaSelecionada})`

    const detalheFormato =
      formato === 'csv'
        ? 'Arquivo formatado em CSV com BOM UTF-8 e separador ponto-e-vírgula (;), abrindo perfeitamente no Microsoft Excel e Google Planilhas.'
        : 'Arquivo estruturado em JSON para integração em ERPs, sistemas contábeis e fiscais.'

    return `*ADECONT — Assessoria Contábil e Administrativa*
📊 *${tit}*

Prezado cliente,
Disponibilizamos o download da base completa de classificações fiscais oficiais do sistema *ADECONT Panorama da Reforma Tributária*:

📁 *Tabela:* ${infoTabela.label}
🏛️ *Fonte Oficial:* ${infoTabela.orgao}
📦 *Volume:* ${qtdItensTexto}
⚙️ *Compatibilidade:* ${detalheFormato}

🔗 *Link Oficial de Download Direto:*
${url}

🛡️ *Segurança & Garantia:*
- Arquivo servido diretamente pelos servidores seguros da ADECONT (sem bloqueios governamentais).
- Atualizado e revisado conforme a rotina semanal das normas da Reforma Tributária (LC 214/2025 e resoluções vigentes).

Em caso de dúvidas na parametrização contábil do seu sistema, nossa equipe de Assessoria Contábil e Administrativa está à disposição.`
  }

  function formatarUrlDownload(rawUrl?: string): string {
    if (!rawUrl) return downloadUrl
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      return rawUrl
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return rawUrl.startsWith('/') ? `${origin}${rawUrl}` : `${origin}/${rawUrl}`
  }

  async function handleEnviarWhatsApp(shortcutItem?: InstallShortcutItem) {
    const urlFinal = formatarUrlDownload(shortcutItem?.url)
    const texto = gerarTextoMensagem(urlFinal, shortcutItem?.titulo)
    const waUrl = 'https://wa.me/?text=' + encodeURIComponent(texto)
    if (shortcutItem?.id) {
      await registerShortcutSend(shortcutItem.id)
      setShortcuts((prev) =>
        prev.map((s) =>
          s.id === shortcutItem.id ? { ...s, envios_count: (s.envios_count || 0) + 1 } : s,
        ),
      )
    }
    window.open(waUrl, '_blank')
  }

  async function handleEnviarEmail(shortcutItem?: InstallShortcutItem) {
    const urlFinal = formatarUrlDownload(shortcutItem?.url)
    const texto = gerarTextoMensagem(urlFinal, shortcutItem?.titulo)
    const assunto = `Base Oficial de Classificações (${tabelaSelecionada}) — ADECONT`
    const mailto = `mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(texto)}`
    if (shortcutItem?.id) {
      await registerShortcutSend(shortcutItem.id)
      setShortcuts((prev) =>
        prev.map((s) =>
          s.id === shortcutItem.id ? { ...s, envios_count: (s.envios_count || 0) + 1 } : s,
        ),
      )
    }
    window.location.href = mailto
  }

  async function handleDepositarNoBanco(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFeedbackMsg(null)

    const tituloFinal =
      depTitulo.trim() ||
      `Base ${tabelaSelecionada} Completa (${formato.toUpperCase()}) — ${qtdItensTexto}`

    const instrucoesTexto =
      `1. Clique no link para baixar a base oficial (${formato.toUpperCase()}).\n` +
      `2. No Microsoft Excel: Arquivo → Abrir (arquivo codificado com BOM UTF-8 e ponto-e-vírgula).\n` +
      `3. Fonte: ${infoTabela.orgao} — Sistema ADECONT (atualização semanal contínua).`

    const obsTexto =
      depObs.trim() ||
      `Depósito de link de download da base oficial ${tabelaSelecionada} (${formato.toUpperCase()}) com ${qtdItensTexto}.`

    try {
      await createInstallShortcut({
        titulo: tituloFinal,
        device_type: 'todos',
        url: downloadUrl,
        instrucoes: instrucoesTexto,
        observacoes: obsTexto,
        criado_por: depAutor.trim() || 'Equipe ADECONT',
      })

      setFeedbackMsg({
        text: '✔ Link de download da base depositado com sucesso no banco de dados!',
        ok: true,
      })
      setDepTitulo('')
      setDepObs('')
      await carregarHistorico()

      setTimeout(() => {
        setActiveTab('historico')
        setFeedbackMsg(null)
      }, 1400)
    } catch {
      setFeedbackMsg({
        text: 'Erro ao depositar no banco de dados. Tente novamente.',
        ok: false,
      })
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Topo / Cabeçalho ADECONT */}
        <div className="bg-gradient-to-r from-panorama-navy via-[#2E2260] to-[#1E1643] text-white p-5 border-b border-panorama-gold/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs border border-white/20">
              <FileSpreadsheet className="w-6 h-6 text-panorama-gold-light" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  Central de Entrega — Base de Classificações
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-panorama-gold text-panorama-navy uppercase tracking-wider">
                  NCM &amp; 11 Tabelas Oficiais
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-0.5">
                Gere o link seguro de download, QR Code e envie aos clientes via WhatsApp ou E-mail
                com mensagem institucional ADECONT.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:block bg-white/95 px-2.5 py-1 rounded-lg shadow-xs">
              <AdecontLogo className="h-6 w-auto" />
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Abas */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-200 bg-slate-50 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('gerar_enviar')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'gerar_enviar'
                ? 'border-panorama-navy text-panorama-navy bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Share2 className="w-4 h-4 text-panorama-gold-dark" />
            1. Gerar Link &amp; Enviar para Clientes
          </button>
          <button
            onClick={() => setActiveTab('depositar')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'depositar'
                ? 'border-panorama-navy text-panorama-navy bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            2. Depositar Link no Banco de Dados
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'historico'
                ? 'border-panorama-navy text-panorama-navy bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-blue-600" />
            3. Histórico da Central ({shortcuts.length})
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-800 text-sm">
          {/* ABA 1: GERAR LINK E ENVIAR AO CLIENTE */}
          {activeTab === 'gerar_enviar' && (
            <div className="space-y-5">
              {/* Seletor de Tabela */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-panorama-navy" />
                    Selecione a Tabela Oficial para Download:
                  </label>
                  <span className="text-[11px] font-semibold text-panorama-navy bg-panorama-navy/10 px-2 py-0.5 rounded">
                    Padrão: NCM (15.240 itens)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {OPCOES_TABELAS_CLASSIFICACOES.map((op) => {
                    const sel = tabelaSelecionada === op.id
                    return (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => setTabelaSelecionada(op.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                          sel
                            ? 'border-panorama-navy bg-panorama-navy/5 ring-2 ring-panorama-navy text-panorama-navy shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold flex items-center justify-between">
                            <span>{op.label}</span>
                            {op.id === 'NCM' && (
                              <span className="text-[9px] bg-indigo-100 text-indigo-900 font-extrabold px-1.5 py-0.2 rounded">
                                Principal
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                            {op.sublabel}
                          </p>
                        </div>
                        <div className="mt-1.5 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>{op.orgao}</span>
                          <span className="font-bold text-slate-700">{op.itensAprox}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Seletor de Formato (CSV x JSON) */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Formato de Exportação:</span>
                  <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-white">
                    <button
                      type="button"
                      onClick={() => setFormato('csv')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        formato === 'csv'
                          ? 'bg-panorama-navy text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-panorama-gold-light" />
                      CSV (Excel BR com BOM UTF-8)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormato('json')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        formato === 'json'
                          ? 'bg-panorama-navy text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5 text-blue-600" />
                      JSON (API / ERP)
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Download direto do sistema ADECONT (anti-bloqueio seguro)</span>
                </div>
              </div>

              {/* Painel Central: QR Code + Detalhes + Ações */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                {/* Coluna QR Code (5 cols) */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200 shadow-2xs text-center space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-panorama-navy">
                    <QrCode className="w-4 h-4 text-panorama-gold-dark" />
                    QR Code do Link de Download
                  </div>

                  <div
                    className="p-2 border border-slate-200 rounded-xl bg-white shadow-xs inline-flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: qrSvgString }}
                  />

                  <div className="text-[11px] text-slate-500 max-w-[240px]">
                    Aponte a câmera do celular para baixar o arquivo{' '}
                    <strong>{formato.toUpperCase()}</strong> diretamente no aparelho.
                  </div>

                  <div className="flex items-center gap-1.5 w-full pt-1">
                    <button
                      onClick={() => copiarParaClipboard(downloadUrl, 'link_download')}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedKey === 'link_download' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      Copiar Link
                    </button>

                    <a
                      href={downloadUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-colors"
                      title="Baixar Agora"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Baixar
                    </a>
                  </div>
                </div>

                {/* Coluna de Envio e Mensagem (7 cols) */}
                <div className="md:col-span-7 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Database className="w-4 h-4 text-indigo-600" />
                        {infoTabela.label}
                      </h4>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                        {formato.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-2 p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1.5 font-sans leading-relaxed">
                      <div className="flex items-start gap-1.5">
                        <strong className="text-slate-900 shrink-0">Origem:</strong>
                        <span>{infoTabela.orgao}</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <strong className="text-slate-900 shrink-0">Volume oficial:</strong>
                        <span>{qtdItensTexto}</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <strong className="text-slate-900 shrink-0">Excel / Planilhas:</strong>
                        <span>
                          {formato === 'csv'
                            ? 'BOM UTF-8 + ponto-e-vírgula (abre direto sem desconfigurar acentos ou colunas).'
                            : 'Arquivo estruturado JSON padrão REST UTF-8.'}
                        </span>
                      </div>
                      <div className="flex items-start gap-1.5 text-slate-500 text-[11px] pt-1 border-t border-slate-100">
                        <strong className="text-slate-700 shrink-0">URL de Saída:</strong>
                        <span className="font-mono break-all text-[10px] text-slate-600">
                          {downloadUrl}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Disparos para Clientes */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="text-xs font-bold text-slate-700">
                      Disparo Imediato para Clientes (ADECONT):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={() => handleEnviarWhatsApp()}
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Enviar no WhatsApp
                      </button>

                      <button
                        onClick={() => handleEnviarEmail()}
                        className="w-full py-2.5 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        <Mail className="w-4 h-4" />
                        Enviar por E-mail
                      </button>
                    </div>

                    <button
                      onClick={() =>
                        copiarParaClipboard(gerarTextoMensagem(), 'msg_classificacao_completa')
                      }
                      className="w-full py-2 px-3 rounded-xl bg-panorama-navy hover:bg-panorama-navy-light text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      {copiedKey === 'msg_classificacao_completa' ? (
                        <>
                          <Check className="w-4 h-4 text-panorama-gold" />
                          Mensagem Institucional Copiada com Sucesso!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-panorama-gold-light" />
                          Copiar Mensagem Institucional Formatada
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Alerta Institucional de Garantia & Anti-bloqueio */}
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-panorama-gold-dark shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Política Anti-Bloqueio ADECONT:</strong> Os arquivos são gerados e
                  servidos diretamente pelo endpoint seguro{' '}
                  <code>/backend/v1/export-classifications</code> mantido pela ADECONT, evitando
                  erros de certificado ou bloqueios que ocorrem ao linkar diretamente em portais
                  governamentais como Siscomex ou CGIBS.
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: DEPOSITAR LINK NO BANCO DE DADOS */}
          {activeTab === 'depositar' && (
            <form onSubmit={handleDepositarNoBanco} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-start gap-2">
                <Download className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Depósito Permanente na Coleção da Central:</strong> O link da base
                  selecionada ({tabelaSelecionada}) será persistido na coleção{' '}
                  <code>install_shortcuts</code> com instruções completas, data e autor. Aparecerá
                  no histórico da Central e poderá ser reutilizado em novos disparos a qualquer
                  momento.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Título do Depósito / Envio *
                  </label>
                  <input
                    type="text"
                    value={depTitulo}
                    onChange={(e) => setDepTitulo(e.target.value)}
                    placeholder={`Base ${tabelaSelecionada} Completa (${formato.toUpperCase()}) — ${qtdItensTexto}`}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-panorama-gold/70 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400">
                    Se vazio, será usado o título padrão oficial com contagem e formato.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Tabela e Formato</label>
                  <input
                    type="text"
                    readOnly
                    value={`${infoTabela.label} • Formato ${formato.toUpperCase()}`}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-xs text-slate-600 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  URL Direta de Download (Gerada Automaticamente)
                </label>
                <input
                  type="text"
                  readOnly
                  value={downloadUrl}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-xs text-slate-600 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Identificação do Autor</label>
                  <input
                    type="text"
                    value={depAutor}
                    onChange={(e) => setDepAutor(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-panorama-gold/70 focus:outline-none"
                    placeholder="Equipe ADECONT"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Observações Internas (Opcional)
                  </label>
                  <input
                    type="text"
                    value={depObs}
                    onChange={(e) => setDepObs(e.target.value)}
                    placeholder={`Base oficial com ${qtdItensTexto} para download de clientes`}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-panorama-gold/70 focus:outline-none"
                  />
                </div>
              </div>

              {feedbackMsg && (
                <div
                  className={`p-3 rounded-lg text-xs font-semibold ${
                    feedbackMsg.ok
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-50 text-rose-800 border border-rose-300'
                  }`}
                >
                  {feedbackMsg.text}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('gerar_enviar')}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-panorama-navy hover:bg-panorama-navy-light text-white text-xs font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-panorama-gold" />
                  {saving ? 'Depositando no banco...' : 'Depositar Link no Banco'}
                </button>
              </div>
            </form>
          )}

          {/* ABA 3: HISTÓRICO DA CENTRAL */}
          {activeTab === 'historico' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Links e Depósitos Registrados ({shortcuts.length}):
                </h4>
                <button
                  onClick={carregarHistorico}
                  disabled={loadingShortcuts}
                  className="text-xs font-semibold text-panorama-navy hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Atualizar Lista
                </button>
              </div>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                {shortcuts.map((item) => {
                  const isBaseClassificacao =
                    item.url.includes('/backend/v1/export-classifications') ||
                    item.titulo.toLowerCase().includes('base') ||
                    item.titulo.toLowerCase().includes('ncm')

                  return (
                    <div
                      key={item.id}
                      className={`p-4 transition-colors space-y-2 ${
                        isBaseClassificacao
                          ? 'bg-indigo-50/30 hover:bg-indigo-50/60'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{item.titulo}</span>
                            {isBaseClassificacao ? (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 border border-indigo-200 flex items-center gap-1">
                                <FileSpreadsheet className="w-3 h-3" /> Base Oficial
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {item.device_type}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5 break-all">
                            {item.url}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              copiarParaClipboard(
                                gerarTextoMensagem(formatarUrlDownload(item.url), item.titulo),
                                `hist_${item.id}`,
                              )
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            title="Copiar mensagem"
                          >
                            {copiedKey === `hist_${item.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            Copiar
                          </button>
                          <button
                            onClick={() => handleEnviarWhatsApp(item)}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                            title="Enviar no WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <a
                            href={formatarUrlDownload(item.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                            title="Abrir URL / Testar Download"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 whitespace-pre-line bg-white/70 p-2.5 rounded-lg border border-slate-200/80 font-sans">
                        {item.instrucoes}
                      </p>

                      <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 pt-1 gap-2">
                        <span>Autor: {item.criado_por || 'Sistema ADECONT'}</span>
                        <span>Envios registrados: {item.envios_count || 0}</span>
                        {item.created && (
                          <span>
                            Depositado em: {new Date(item.created).toLocaleDateString('pt-BR')} às{' '}
                            {new Date(item.created).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé institucional com branding ADECONT */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-panorama-navy">
              ADECONT — Assessoria Contábil e Administrativa
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] text-slate-500">
              Central de Entrega de Bases Oficiais &amp; Tabelas
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
