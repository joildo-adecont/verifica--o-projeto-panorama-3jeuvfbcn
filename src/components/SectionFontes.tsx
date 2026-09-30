import { useState } from 'react'
import {
  ExternalLink,
  RotateCw,
  Clock,
  Calendar,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
} from 'lucide-react'
import { submitInquiry } from '@/services/panorama'
import { useToast } from '@/hooks/use-toast'

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
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Bases documentais primárias e mecânica de governança para atualização deste repositório.
        </p>
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
        <div className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs sm:text-sm space-y-2 border border-slate-800">
          <div className="flex items-center gap-2 font-bold text-amber-400">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Sobre atualização automática de conteúdo</span>
          </div>
          <p className="leading-relaxed text-slate-300">
            A leitura direta de normas por robôs a partir dos portais oficiais é restrita por
            segurança (política CORS) — por isso a rotina automática confirma a{' '}
            <strong className="text-white">disponibilidade da fonte</strong> e a{' '}
            <strong className="text-white">data da última verificação</strong>, enquanto a
            atualização do <strong className="text-white">conteúdo</strong> das normas é conduzida
            pelo assistente responsável (<strong>Antonio Joildo</strong> — revisão semanal de
            segundas-feiras + sob demanda), com nova versão publicada no Skip com QA e
            versionamento.
          </p>
        </div>
      </div>

      {/* Formulário de Dúvidas / Contato Especializado (Integrado com PocketBase inquiries) */}
      <div
        id="contato"
        className="scroll-mt-24 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6"
      >
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold mb-2">
            <UserCheck className="w-3.5 h-3.5" />
            <span>CONSULTORIA TRIBUTÁRIA & PARECER</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Dúvidas sobre o impacto da Reforma no seu segmento?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Envie sua pergunta ou solicite análise sobre aplicação dos regimes específicos, split
            payment ou contratos de transição.
          </p>
        </div>

        {submitted ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm">Mensagem enviada com sucesso!</h4>
              <p className="text-xs">
                Seu contato foi registrado no banco de dados e será analisado pela equipe técnica.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-xs text-blue-700 underline font-semibold mt-2 inline-block"
              >
                Enviar nova dúvida
              </button>
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
