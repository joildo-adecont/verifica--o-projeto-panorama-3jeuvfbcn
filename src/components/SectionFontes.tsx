import { useState, useEffect } from 'react'
import {
  ExternalLink,
  RotateCw,
  Clock,
  Calendar,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FileDown,
  UserCheck,
  ShieldCheck,
  Sparkles,
  Info,
  Download,
} from 'lucide-react'
import {
  submitInquiry,
  fetchLatestContentReview,
  fetchContentReviewsHistory,
  triggerWeeklyReview,
  officialDocumentsList,
  getOfficialDocProxyUrl,
} from '@/services/panorama'
import type { ContentReviewItem, OfficialDocumentItem } from '@/types/panorama'
import { Tag, History } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { AdecontLogo } from '@/components/AdecontLogo'

export function SectionFontes() {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Estado da rotina semanal de conteúdo e histórico de revisões
  const [latestReview, setLatestReview] = useState<ContentReviewItem | null>(null)
  const [reviewHistory, setReviewHistory] = useState<ContentReviewItem[]>([])
  const [reviewLoading, setReviewLoading] = useState<boolean>(true)
  const [refreshingReview, setRefreshingReview] = useState<boolean>(false)
  const [showHistory, setShowHistory] = useState<boolean>(false)
  const [selectedDocTypeFilter, setSelectedDocTypeFilter] = useState<string>('TODOS')

  const loadReviewData = async () => {
    try {
      const [review, history] = await Promise.all([
        fetchLatestContentReview(),
        fetchContentReviewsHistory(5),
      ])
      setLatestReview(review)
      setReviewHistory(history)
    } catch (err) {
      console.warn('Erro ao carregar revisão semanal:', err)
    } finally {
      setReviewLoading(false)
    }
  }

  useEffect(() => {
    loadReviewData()
  }, [])

  // Calcula a próxima segunda-feira às 11:00 UTC (08:00 Horário de Brasília)
  const getNextMondayFormatted = (): string => {
    const now = new Date()
    const dayOfWeek = now.getUTCDay() // 0 = Dom, 1 = Seg, ..., 6 = Sab
    let daysUntilMonday = (1 - dayOfWeek + 7) % 7
    // Se hoje é segunda e já passou das 11:00 UTC, a próxima é na semana que vem
    if (daysUntilMonday === 0 && now.getUTCHours() >= 11) {
      daysUntilMonday = 7
    }
    const nextMonday = new Date(now.getTime() + daysUntilMonday * 24 * 60 * 60 * 1000)
    nextMonday.setUTCHours(11, 0, 0, 0)

    try {
      return (
        new Intl.DateTimeFormat('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Sao_Paulo',
        }).format(nextMonday) + ' (horário de Brasília)'
      )
    } catch {
      return nextMonday.toLocaleDateString('pt-BR') + ' às 08:00 (Brasília)'
    }
  }

  // Formata a data da última revisão
  const formatReviewDate = (isoString?: string): string => {
    if (!isoString) {
      return 'Segunda-feira mais recente (08:00 Brasília)'
    }
    try {
      const d = new Date(isoString)
      return (
        new Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Sao_Paulo',
        }).format(d) + ' (horário de Brasília)'
      )
    } catch {
      return isoString
    }
  }

  const handleManualReview = async () => {
    try {
      setRefreshingReview(true)
      await triggerWeeklyReview()
      await loadReviewData()
      toast({
        title: 'Revisão executada com sucesso',
        description: 'As fontes oficiais foram checadas e o registro de revisão foi atualizado.',
      })
    } catch (err) {
      console.error(err)
      toast({
        title: 'Aviso na revisão',
        description:
          'Não foi possível rodar a revisão imediata. O agendamento automático às segundas permanece ativo.',
        variant: 'destructive',
      })
    } finally {
      setRefreshingReview(false)
    }
  }

  const fontes = [
    {
      orgao: 'Planalto',
      fonte: 'planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
      conteudo: 'Texto integral da LC 214/2025',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
    },
    {
      orgao: 'Planalto',
      fonte: 'planalto.gov.br/ccivil_03/leis/lcp/lcp227.htm',
      conteudo: 'LC 227/2026 (CGIBS, ITCMD)',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp227.htm',
    },
    {
      orgao: 'Planalto',
      fonte: 'Decreto 12.955/2026',
      conteudo: 'Regulamento da CBS + anexos',
      url: 'https://www.planalto.gov.br',
    },
    {
      orgao: 'CGIBS',
      fonte: 'cgibs.gov.br/resolucoes',
      conteudo: 'Resoluções do Comitê (Regulamento IBS 6/2026 e alterações)',
      url: 'https://cgibs.gov.br/resolucoes',
    },
    {
      orgao: 'Receita Federal',
      fonte: 'gov.br/receitafederal → Reforma Tributária',
      conteudo: 'Legislação, guias, cronogramas, programa RTC',
      url: 'https://www.gov.br/receitafederal/pt-br/assuntos/reforma-tributaria',
    },
    {
      orgao: 'RFB + CGIBS',
      fonte: 'Ato Conjunto RFB/CGIBS 4/2026',
      conteudo: 'Cronograma dos documentos fiscais eletrônicos',
      url: 'https://www.gov.br/receitafederal',
    },
    {
      orgao: 'IBSLab',
      fonte: 'ibslab.com.br/ferramentas/aliquotas-ibs-cbs',
      conteudo: 'Tabela de alíquotas 2026–2033 (estimativas)',
      url: 'https://ibslab.com.br/ferramentas/aliquotas-ibs-cbs',
    },
  ]

  const rotinas = [
    {
      modo: 'Automático',
      como: 'Botão "⏱️ Auto: ON" no topo',
      faz: 'Verifica a disponibilidade da fonte oficial (CGIBS) a cada 1 hora e sinaliza no status do topo',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    {
      modo: 'Manual',
      como: 'Botão "🔄 Atualizar agora" no topo (área visível)',
      faz: 'Faz a verificação imediata e registra data/hora no status',
      badge: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    {
      modo: 'Semanal',
      como: 'Rotina do assistente (toda segunda-feira, 11h)',
      faz: 'Verificação de novas normas nos órgãos oficiais; atualização do conteúdo e nova publicação no Skip quando houver novidades',
      badge: 'bg-purple-100 text-purple-800 border-purple-300',
    },
    {
      modo: 'Conteúdo',
      como: 'Solicitar ao assistente (Antonio Joildo)',
      faz: 'Nova versão do conteúdo base é publicada no Skip com QA e versionamento',
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
    },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.phone) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha nome, e-mail e telefone.',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)
      await submitInquiry(formData)
      setSubmitted(true)
      toast({
        title: 'Mensagem enviada com sucesso!',
        description: 'Sua dúvida/solicitação foi salva e direcionada à equipe tributária.',
      })
      setFormData({ name: '', email: '', phone: '', message: '' })
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao enviar',
        description: 'Não foi possível gravar sua consulta. Tente novamente em instantes.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="secao-9" className="scroll-mt-24 space-y-8">
      <div className="border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-xs">
            9
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Fontes oficiais e atualização
          </h2>
        </div>
      </div>

      {/* Tabela de Fontes */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-semibold">
              <th className="py-3 px-4 w-44">Órgão</th>
              <th className="py-3 px-4 w-72">Fonte</th>
              <th className="py-3 px-4">O que encontrar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fontes.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4 align-top font-bold text-slate-900">{item.orgao}</td>
                <td className="py-3 px-4 align-top font-mono text-xs text-blue-700">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:underline"
                  >
                    <span>{item.fonte}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </td>
                <td className="py-3 px-4 align-top text-slate-700 leading-relaxed">
                  {item.conteudo}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BLOCO: Documentos oficiais para download — Todos os tipos de atos */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-blue-50/80 via-white to-slate-50 border border-blue-200/90 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-100">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">
              <FileDown className="w-3.5 h-3.5 text-blue-700" />
              <span>DOWNLOAD INTERMEDIADO SEGURO</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <span>Documentos oficiais para download</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Acesso e download direto a <strong>todos os atos normativos</strong> da Reforma
              Tributária (Resoluções CGIBS, Decretos Federais, Portarias Conjuntas, Atos Conjuntos
              da Receita/CGIBS, Leis Complementares e Emenda Constitucional). A entrega é mediada
              pelo servidor próprio do Panorama da{' '}
              <strong>ADECONT Assessoria Contábil e Administrativa</strong>, contornando bloqueios
              locais de navegador como o <em>ERR_BLOCKED_BY_CLIENT</em> no Microsoft Edge.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{officialDocumentsList.length} documentos oficiais</span>
            </span>
          </div>
        </div>

        {/* Filtros rápidos por tipo de ato */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs font-semibold text-slate-600 mr-1 flex items-center gap-1">
            <Tag className="w-3 h-3 text-slate-500" />
            <span>Filtrar por tipo:</span>
          </span>
          {[
            'TODOS',
            'Resoluções CGIBS',
            'Decretos',
            'Portarias',
            'Atos Conjuntos',
            'Leis e EC',
          ].map((typeFilter) => (
            <button
              key={typeFilter}
              onClick={() => setSelectedDocTypeFilter(typeFilter)}
              className={`text-[11px] px-2.5 py-1 rounded font-bold transition-colors border cursor-pointer ${
                selectedDocTypeFilter === typeFilter
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {typeFilter}
            </button>
          ))}
        </div>

        {/* Agrupamento por tipo de ato normativo */}
        {(() => {
          const typeGroups = [
            {
              groupName: 'Resoluções CGIBS',
              categoryKey: 'Resoluções CGIBS',
              description:
                'Regulamento do IBS, governança administrativa e resoluções operacionais do Comitê Gestor',
              badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
              items: officialDocumentsList.filter(
                (d) => d.norm_type === 'Resolução' && d.origin === 'CGIBS',
              ),
            },
            {
              groupName: 'Decretos Federais',
              categoryKey: 'Decretos',
              description:
                'Regulamento da Contribuição Social sobre Bens e Serviços (CBS) e atos da Presidência',
              badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
              items: officialDocumentsList.filter((d) => d.norm_type === 'Decreto'),
            },
            {
              groupName: 'Portarias Conjuntas',
              categoryKey: 'Portarias',
              description:
                'Portarias entre Ministério da Fazenda e CGIBS sobre disposições comuns do IBS/CBS',
              badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
              items: officialDocumentsList.filter((d) => d.norm_type.includes('Portaria')),
            },
            {
              groupName: 'Atos Conjuntos RFB/CGIBS',
              categoryKey: 'Atos Conjuntos',
              description:
                'Documentos fiscais eletrônicos, regras de apuração 2026 e cronogramas de conformidade',
              badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
              items: officialDocumentsList.filter((d) => d.norm_type.includes('Ato Conjunto')),
            },
            {
              groupName: 'Emendas Constitucionais e Leis Complementares',
              categoryKey: 'Leis e EC',
              description:
                'Arcabouço legislativo primário aprovado pelo Congresso Nacional e Presidência',
              badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
              items: officialDocumentsList.filter(
                (d) =>
                  d.norm_type.includes('Emenda') ||
                  d.norm_type.includes('Lei Complementar') ||
                  d.origin === 'CGSN',
              ),
            },
          ]

          const filteredGroups = typeGroups.filter((g) => {
            if (selectedDocTypeFilter === 'TODOS') return true
            return g.categoryKey === selectedDocTypeFilter
          })

          return (
            <div className="space-y-6 pt-1">
              {filteredGroups.map((group) => {
                if (group.items.length === 0) return null
                return (
                  <div key={group.groupName} className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1.5 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                          {group.groupName}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${group.badgeColor}`}
                        >
                          {group.items.length} {group.items.length === 1 ? 'ato' : 'atos'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{group.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {group.items.map((doc) => {
                        const proxyDownloadUrl = doc.proxy_url || getOfficialDocProxyUrl(doc.id)
                        const isPdf = doc.format === 'pdf' || (doc.url && doc.url.endsWith('.pdf'))

                        return (
                          <div
                            key={doc.id}
                            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                                  <span>{doc.code}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                    {doc.origin}
                                  </span>
                                </div>
                                {doc.badge && (
                                  <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                                    {doc.badge}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs font-semibold text-blue-900">{doc.title}</div>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                {doc.summary}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-[11px] text-slate-500 font-mono">
                                Data: {doc.date}
                              </span>
                              <a
                                href={proxyDownloadUrl}
                                download={
                                  doc.filename || (isPdf ? `${doc.code}.pdf` : `${doc.code}.html`)
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                                title={`Baixar documento oficial: ${doc.code} (download mediado via domínio próprio Panorama ADECONT)`}
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>{isPdf ? 'Baixar PDF oficial' : 'Baixar texto oficial'}</span>
                              </a>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}

        {/* Nota explicativa de download servido pelo Panorama */}
        <div className="mt-2 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-[11px] sm:text-xs text-slate-700 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="leading-relaxed">
              <strong>Download mediado e contorno de bloqueios de rede:</strong> todos os arquivos e
              textos normativos são servidos diretamente pelo servidor do Panorama da{' '}
              <strong>ADECONT Assessoria Contábil e Administrativa</strong> pelo endpoint{' '}
              <code>/backend/v1/download-resolution</code>. O servidor realiza o download da fonte
              oficial (Planalto, Imprensa Nacional / DOU, CGIBS e RFB) e o entrega com cabeçalho de
              anexo ao seu computador, prevenindo falsos positivos de antivírus e bloqueios de
              domínio no Microsoft Edge (ex.: <em>ERR_BLOCKED_BY_CLIENT</em>).
            </p>
          </div>
        </div>
      </div>

      {/* Painel da Rotina Semanal de Conteúdo & Governança */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 text-white shadow-md border border-slate-800 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-bold">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>ROTINA SEMANAL DE CONTEÚDO & GOVERNANÇA</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Revisão de Novas Normas às Segundas-Feiras</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
                Ativo (08:00 Brasília)
              </span>
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl">
              O job semanal automatizado <code>weekly_content_review</code> e a equipe técnica da{' '}
              <strong className="text-white">ADECONT Assessoria Contábil e Administrativa</strong>{' '}
              inspecionam diários e regulamentos para consolidação no Panorama.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              title="Ver histórico de revisões publicadas"
            >
              <History className="w-3.5 h-3.5 text-blue-400" />
              <span>{showHistory ? 'Ocultar histórico' : 'Histórico de revisões'}</span>
            </button>

            <button
              onClick={handleManualReview}
              disabled={refreshingReview}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              title="Executar verificação semanal imediata das fontes e gravar registro"
            >
              <RotateCw className={`w-3.5 h-3.5 ${refreshingReview ? 'animate-spin' : ''}`} />
              <span>{refreshingReview ? 'Verificando fontes...' : 'Verificar agora'}</span>
            </button>
          </div>
        </div>

        {/* Faixa de Versionamento do Conteúdo Publicado */}
        <div className="p-3.5 rounded-xl bg-blue-950/70 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-400/30">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-2">
                <span>Conteúdo revisado em 30/09/2026</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Revisão nº 1 (v0.0.16)
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                5 novas normas consolidadas (Ato Conjunto 1/2025, Portaria MF/CGIBS 7/2026,
                Resoluções CGIBS 13, 14 e 16/2026) e marcos atualizados.
              </p>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 shrink-0 font-mono">
            Governança técnica: ADECONT
          </div>
        </div>

        {/* Cards de Status da Revisão: Última Revisão vs Próxima Revisão */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card Última Revisão */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/70 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                Última revisão registrada
              </span>
              {reviewLoading ? (
                <span className="text-slate-400 text-xs">Carregando...</span>
              ) : latestReview ? (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                    latestReview.status === 'ok'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : latestReview.status === 'warning'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Status: {latestReview.status === 'ok' ? 'Conforme (OK)' : 'Atenção'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  <Info className="w-3 h-3" />
                  Inicial
                </span>
              )}
            </div>

            <div className="text-base sm:text-lg font-bold text-white">
              {formatReviewDate(latestReview?.review_date)}
            </div>

            <div className="text-xs text-slate-300 leading-relaxed pt-1 border-t border-slate-700/60">
              <span className="text-slate-400">Resumo: </span>
              {latestReview?.summary ||
                'Revisão nº 1 (30/09/2026): inclusão de 5 novas normas oficiais e atualização dos marcos operacionais dos DFe.'}
            </div>

            {latestReview?.notes && (
              <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-300 font-semibold block mb-0.5">Notas detalhadas:</span>
                {latestReview.notes}
              </div>
            )}

            {latestReview?.sources_checked && latestReview.sources_checked.length > 0 && (
              <div className="pt-1 flex flex-wrap gap-1.5">
                {latestReview.sources_checked.map((src) => (
                  <span
                    key={src.key}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900/80 border border-slate-700 text-slate-200"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {src.name.split(' ')[0]}: {src.status} ({src.http_status || 200})
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Card Próxima Revisão */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/70 space-y-2 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  Próxima revisão agendada
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Clock className="w-3 h-3" />
                  Segundas, 08h
                </span>
              </div>

              <div className="text-base sm:text-lg font-bold text-blue-200 capitalize">
                {getNextMondayFormatted()}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed pt-1 border-t border-slate-700/60">
                Rotina semanal automática (job <code>weekly_content_review</code> às 11:00 UTC /
                08:00 BRT) + curadoria da equipe ADECONT para inclusão de novos regulamentos,
                decretos ou atos conjuntos emitidos pelos órgãos reguladores.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Garantia de conformidade com a legislação oficial vigente.</span>
            </div>
          </div>
        </div>

        {/* Histórico expandido de revisões */}
        {showHistory && reviewHistory.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <History className="w-4 h-4 text-blue-400" />
              <span>Histórico de revisões na base de dados</span>
            </div>
            <div className="divide-y divide-slate-800 text-xs">
              {reviewHistory.map((rev) => (
                <div key={rev.id} className="py-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">
                      {formatReviewDate(rev.review_date)}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        rev.status === 'ok'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {rev.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{rev.summary || rev.notes}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Como funciona a atualização deste panorama */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          Como funciona a atualização deste panorama
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-semibold">
                <th className="py-3 px-4 w-36">Modo</th>
                <th className="py-3 px-4 w-72">Como ativar</th>
                <th className="py-3 px-4">O que faz</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rotinas.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 align-top">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold border ${item.badge}`}
                    >
                      {item.modo}
                    </span>
                  </td>
                  <td className="py-3 px-4 align-top font-medium text-slate-800">{item.como}</td>
                  <td className="py-3 px-4 align-top text-slate-700 leading-relaxed">{item.faz}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Nota CORS e Atualização */}
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs sm:text-sm space-y-2">
          <p className="leading-relaxed">
            ⚠️ <strong>Sobre atualização automática de conteúdo:</strong> a leitura de normas por
            robôs a partir dos sites oficiais é bloqueada por segurança (CORS) — por isso a
            verificação automática confirma a <strong>disponibilidade da fonte</strong> e a{' '}
            <strong>data da última verificação</strong>, e a atualização do{' '}
            <strong>conteúdo</strong> das normas é feita pelo assistente (revisão semanal de
            segundas-feiras + sob demanda), com nova versão publicada no Skip.
          </p>
        </div>
      </div>
      {/* Formulário de Dúvidas / Contato Especializado (Integrado com PocketBase inquiries) */}
      <div
        id="contato"
        className="scroll-mt-24 p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6"
      >
        {/* Cabeçalho do formulário com logo oficial da ADECONT */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">
              <UserCheck className="w-3.5 h-3.5" />
              <span>CONSULTORIA TRIBUTÁRIA & PARECER ESPECIALIZADO</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Dúvidas sobre o impacto da Reforma no seu segmento?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Envie sua pergunta ou solicite análise sobre aplicação dos regimes específicos, split
              payment ou contratos de transição com a equipe da{' '}
              <strong>ADECONT Assessoria Contábil e Administrativa</strong>.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end shrink-0">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 shadow-xs flex flex-col items-center">
              <AdecontLogo
                variant="color"
                showTagline={true}
                className="h-16 sm:h-18 w-auto max-w-[250px]"
              />
              <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase mt-1.5 text-center">
                Assessoria Contábil e Administrativa
              </span>
            </div>
          </div>
        </div>

        {submitted ? (
          <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-col sm:flex-row items-start gap-4">
            <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-bold text-base">Mensagem enviada com sucesso à ADECONT!</h4>
              <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
                Seu contato foi registrado com sucesso em nosso sistema de atendimento e foi
                encaminhado diretamente aos consultores técnicos da{' '}
                <strong>ADECONT Assessoria Contábil e Administrativa</strong>. Retornaremos em breve
                no e-mail ou WhatsApp informado.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setSubmitted(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors"
                >
                  <span>Enviar nova dúvida</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome completo *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Dra. Juliana Menezes"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail corporativo *
              </label>
              <input
                type="email"
                required
                placeholder="Ex: juliana@empresa.com.br"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 bg-slate-50/50"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telefone / WhatsApp *
              </label>
              <input
                type="tel"
                required
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 bg-slate-50/50"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descrição da dúvida ou operação sob análise
              </label>
              <textarea
                rows={3}
                placeholder="Descreva a situação da sua empresa, contrato de consórcio, loteamento ou dúvida sobre split payment..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 bg-slate-50/50"
              />
            </div>

            <div className="sm:col-span-2 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors"
              >
                {loading ? (
                  <span>Salvando no banco de dados...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Consulta Técnica</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
