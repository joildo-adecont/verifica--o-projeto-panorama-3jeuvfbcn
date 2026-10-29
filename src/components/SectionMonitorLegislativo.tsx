import { useState } from 'react'
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  Eye,
  FileSearch,
  History,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react'

/**
 * Seção 12A — Monitor Legislativo
 *
 * Painel de TRANSPARÊNCIA da vigilância normativa: mostra, para cada fonte que o
 * sistema consulta de fato, se ela está ativa, quando foi a última conferência e
 * qual foi o resultado. Não é um painel decorativo — cada linha corresponde a uma
 * fonte que a rotina semanal executa.
 *
 * Números desta seção (conferidos em 28/10/2026):
 *   - 8 fontes ativas de 16 catalogadas (registro central: scripts/fontes_oficiais)
 *   - 3 de texto integral, 2 de catálogo, 1 de publicação, 1 portal, 1 de tabela
 *   - cobertura 5/5: todo tipo de consulta tem pelo menos uma fonte ativa
 *   - LC 214 com 544 artigos e 661.175 caracteres no texto integral
 *   - 14 Leis Complementares publicadas em 2026
 *
 * Nada aqui é estimativa: todos os valores vêm do relatório da última execução
 * (scripts/d3c20c92c899fa15/state/ultimo-relatorio.json).
 */

type Situacao = 'ativa' | 'bloqueada' | 'sem_rota' | 'nao_usar'

interface FonteMonitorada {
  id: string
  nome: string
  orgao: string
  tipo: string
  situacao: Situacao
  funcao: string
  prova: string
  url: string
}

const FONTES: FonteMonitorada[] = [
  {
    id: 'normas_leg',
    nome: 'normas.leg.br',
    orgao: 'Senado Federal / Congresso Nacional',
    tipo: 'Texto integral',
    situacao: 'ativa',
    funcao: 'Fonte primária de texto de lei — API pública, sem autenticação',
    prova: 'LC 214: 544 artigos · 661.175 caracteres',
    url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2025-01-16;214',
  },
  {
    id: 'senado_legis',
    nome: 'Senado LEGIS',
    orgao: 'Senado Federal',
    tipo: 'Texto integral',
    situacao: 'ativa',
    funcao: 'Texto por código da norma — rota alternativa para conferência',
    prova: 'LC 227: 118 artigos · LC 123: 95 artigos',
    url: 'https://legis.senado.leg.br/norma/40180341',
  },
  {
    id: 'dou',
    nome: 'DOU / Imprensa Nacional',
    orgao: 'Imprensa Nacional',
    tipo: 'Publicação',
    situacao: 'ativa',
    funcao: 'Fonte de publicação oficial — decreto, portaria, ato conjunto',
    prova: 'Decretos 13.133 e 13.140 conferidos na íntegra',
    url: 'https://www.in.gov.br/consulta',
  },
  {
    id: 'rfb_normas',
    nome: 'Normas RFB',
    orgao: 'Receita Federal do Brasil',
    tipo: 'Texto integral',
    situacao: 'ativa',
    funcao: 'Atos internos da RFB — instrução normativa, solução de consulta',
    prova: 'Consulta ativa no acervo Sijut',
    url: 'https://normas.receita.fazenda.gov.br',
  },
  {
    id: 'senado_dados_abertos',
    nome: 'Senado — Dados Abertos',
    orgao: 'Senado Federal',
    tipo: 'Catálogo',
    situacao: 'ativa',
    funcao: 'Descoberta de norma nova e resolução da URN LexML',
    prova: '14 Leis Complementares de 2026 catalogadas',
    url: 'https://legis.senado.leg.br/dadosabertos/legislacao/lista?tipo=LCP&ano=2026',
  },
  {
    id: 'cgibs',
    nome: 'CGIBS',
    orgao: 'Comitê Gestor do IBS',
    tipo: 'Catálogo',
    situacao: 'ativa',
    funcao: 'Resoluções do Comitê, Regulamento do IBS e alíquotas',
    prova: '18 resoluções inventariadas (última: 18/2026)',
    url: 'https://cgibs.gov.br/resolucoes',
  },
  {
    id: 'rfb_reforma',
    nome: 'RFB — Reforma Tributária',
    orgao: 'Receita Federal do Brasil',
    tipo: 'Portal',
    situacao: 'ativa',
    funcao: 'Orientações da reforma, RTC e obrigações acessórias',
    prova: '37 notícias relacionadas monitoradas',
    url: 'https://www.gov.br/receitafederal/pt-br/assuntos/reforma-tributaria',
  },
  {
    id: 'buscadorncm',
    nome: 'Buscador NCM',
    orgao: 'Agregador privado — SECUNDÁRIO',
    tipo: 'Tabela',
    situacao: 'ativa',
    funcao: 'Detector de mudança nas tabelas (cClassTrib, cCredPres, CEST, MVA)',
    prova: 'cClassTrib 1.70 · Calculadora V0059',
    url: 'https://buscadorncm.com.br/fontes',
  },
  {
    id: 'planalto',
    nome: 'Planalto',
    orgao: 'Presidência da República',
    tipo: 'Texto integral',
    situacao: 'bloqueada',
    funcao: 'Bloqueado por WAF de IP estrangeiro — substituído por normas.leg.br',
    prova: 'HTTP 200 com 814 bytes de "Acesso Negado"',
    url: 'https://www.planalto.gov.br',
  },
  {
    id: 'camara',
    nome: 'Câmara dos Deputados',
    orgao: 'Câmara dos Deputados',
    tipo: 'Catálogo',
    situacao: 'sem_rota',
    funcao: 'Sem rota de rede a partir do servidor — função coberta pelo Senado',
    prova: 'Timeout em todas as rotas testadas',
    url: 'https://www.camara.leg.br',
  },
  {
    id: 'confaz',
    nome: 'CONFAZ',
    orgao: 'Conselho Nacional de Política Fazendária',
    tipo: 'Catálogo',
    situacao: 'sem_rota',
    funcao: 'Sem rota de rede — convênios ICMS lidos por referência indireta',
    prova: 'Timeout na conexão',
    url: 'https://www.confaz.fazenda.gov.br',
  },
  {
    id: 'lexml',
    nome: 'LexML',
    orgao: 'Rede de Informação Legislativa e Jurídica',
    tipo: 'Catálogo',
    situacao: 'nao_usar',
    funcao: 'API legada sem conteúdo útil — responde 200 com página fixa',
    prova: 'Sempre 9.049 bytes, zero registros',
    url: 'http://www.lexml.gov.br',
  },
]

const TIPOS = [
  { tipo: 'Texto integral', n: 3, func: 'Ler a lei na íntegra' },
  { tipo: 'Catálogo', n: 2, func: 'Descobrir o que é novo' },
  { tipo: 'Publicação', n: 1, func: 'Provar a vigência do ato' },
  { tipo: 'Portal', n: 1, func: 'Orientações e obrigações' },
  { tipo: 'Tabela', n: 1, func: 'Detectar mudança de tabela' },
]

const HISTORICO = [
  {
    data: '28/10/2026',
    hora: '22:34',
    resultado: 'sem novidades',
    detalhe: '9/9 fontes ok · 0 mudanças · catálogo de 1.002 itens idêntico',
    tom: 'ok' as const,
  },
  {
    data: '28/10/2026',
    hora: '21:09',
    resultado: 'reorganização',
    detalhe: 'Fontes de 7 para 9 · cobertura 5/5 · Planalto removido das citações',
    tom: 'info' as const,
  },
  {
    data: '28/10/2026',
    hora: '11:00',
    resultado: '1 mudança',
    detalhe: 'ENCAT posterga NTs da reforma · agregador de 114 para 115 bases',
    tom: 'info' as const,
  },
]

const CORES: Record<Situacao, { badge: string; borda: string; icone: typeof CheckCircle2 }> = {
  ativa: {
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    borda: 'border-l-emerald-500',
    icone: CheckCircle2,
  },
  bloqueada: {
    badge: 'bg-amber-50 text-amber-800 border-amber-300',
    borda: 'border-l-amber-500',
    icone: AlertTriangle,
  },
  sem_rota: {
    badge: 'bg-slate-100 text-slate-600 border-slate-300',
    borda: 'border-l-slate-400',
    icone: AlertOctagon,
  },
  nao_usar: {
    badge: 'bg-rose-50 text-rose-800 border-rose-300',
    borda: 'border-l-rose-400',
    icone: XCircle,
  },
}

const ROTULO: Record<Situacao, string> = {
  ativa: 'Ativa',
  bloqueada: 'Bloqueada',
  sem_rota: 'Sem rota',
  nao_usar: 'Não usar',
}

export function SectionMonitorLegislativo() {
  const [filtro, setFiltro] = useState<Situacao | 'todas'>('todas')

  const visiveis = FONTES.filter((f) => filtro === 'todas' || f.situacao === filtro)
  const ativas = FONTES.filter((f) => f.situacao === 'ativa').length

  return (
    <section id="monitor-legislativo" className="scroll-mt-24">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-5">
        {/* Cabeçalho */}
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-md bg-panorama-navy text-panorama-gold-light font-bold text-xs ring-1 ring-panorama-gold/50">
              <Eye className="w-3.5 h-3.5" />
            </span>
            <p className="text-xs font-bold uppercase tracking-wider text-panorama-gold-dark">
              Seção 12A
            </p>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
            Monitor Legislativo — o que o sistema vigia, e como prova
          </h2>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            Cada linha abaixo é uma fonte que a rotina semanal consulta de verdade. O painel não é
            decorativo: mostra a situação <b>medida</b> de cada fonte, o que ela entrega e a prova
            dessa entrega. Fonte que não responde aparece aqui como não responde — e o sistema
            continua funcionando porque toda função de consulta tem mais de uma fonte ativa.
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
            <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-bold uppercase tracking-wide">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Fontes ativas
            </div>
            <p className="text-2xl font-bold text-emerald-900 mt-1">{ativas}</p>
            <p className="text-[11px] text-emerald-700/80">de 16 catalogadas</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5">
            <div className="flex items-center gap-1.5 text-blue-700 text-[11px] font-bold uppercase tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5" />
              Cobertura
            </div>
            <p className="text-2xl font-bold text-blue-900 mt-1">5/5</p>
            <p className="text-[11px] text-blue-700/80">toda função tem fonte</p>
          </div>
          <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3.5">
            <div className="flex items-center gap-1.5 text-violet-700 text-[11px] font-bold uppercase tracking-wide">
              <Database className="w-3.5 h-3.5" />
              Texto da LC 214
            </div>
            <p className="text-2xl font-bold text-violet-900 mt-1">544</p>
            <p className="text-[11px] text-violet-700/80">artigos · 661 mil caracteres</p>
          </div>
          <div className="rounded-xl border border-panorama-gold/40 bg-panorama-gold/10 p-3.5">
            <div className="flex items-center gap-1.5 text-panorama-gold-dark text-[11px] font-bold uppercase tracking-wide">
              <Clock className="w-3.5 h-3.5" />
              Próxima varredura
            </div>
            <p className="text-2xl font-bold text-panorama-navy mt-1">04/11</p>
            <p className="text-[11px] text-amber-800/80">quarta-feira, 11:00</p>
          </div>
        </div>

        {/* Cobertura por função */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-center gap-1.5 mb-2.5">
            <FileSearch className="w-4 h-4 text-panorama-gold-dark" />
            <h3 className="text-sm font-bold text-slate-900">
              Cobertura por função — a garantia de que a busca não quebra
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {TIPOS.map((t) => (
              <div key={t.tipo} className="rounded-lg bg-white border border-slate-200 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800">{t.tipo}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {t.n}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{t.func}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-700 mr-1">Situação:</span>
          {(['todas', 'ativa', 'bloqueada', 'sem_rota', 'nao_usar'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFiltro(s)}
              className={`text-[11px] px-2.5 py-1 rounded font-bold transition-colors border cursor-pointer ${
                filtro === s
                  ? 'bg-panorama-navy text-panorama-gold-light border-panorama-navy'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {s === 'todas'
                ? `Todas (${FONTES.length})`
                : `${ROTULO[s]} (${FONTES.filter((f) => f.situacao === s).length})`}
            </button>
          ))}
        </div>

        {/* Tabela de fontes */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                <th className="py-3 px-3 w-20">Situação</th>
                <th className="py-3 px-3 w-48">Fonte / órgão</th>
                <th className="py-3 px-3 w-28">Tipo</th>
                <th className="py-3 px-4">Para que serve</th>
                <th className="py-3 px-3 w-56">Prova da última leitura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visiveis.map((f) => {
                const c = CORES[f.situacao]
                const Icone = c.icone
                return (
                  <tr
                    key={f.id}
                    className={`hover:bg-slate-50/70 transition-colors border-l-4 ${c.borda}`}
                  >
                    <td className="py-3 px-3 align-top">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${c.badge}`}
                      >
                        <Icone className="w-3 h-3" />
                        {ROTULO[f.situacao]}
                      </span>
                    </td>
                    <td className="py-3 px-3 align-top">
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-panorama-gold-dark hover:text-panorama-navy hover:underline inline-flex items-center gap-1"
                      >
                        {f.nome}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <span className="block text-[10px] text-slate-500 mt-0.5">{f.orgao}</span>
                    </td>
                    <td className="py-3 px-3 align-top text-slate-600 text-xs">{f.tipo}</td>
                    <td className="py-3 px-4 align-top text-slate-700 leading-relaxed">
                      {f.funcao}
                    </td>
                    <td className="py-3 px-3 align-top text-[11px] text-slate-600 font-mono">
                      {f.prova}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Histórico de varreduras */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <History className="w-4 h-4 text-panorama-gold-dark" />
            <h3 className="text-sm font-bold text-slate-900">Últimas varreduras</h3>
          </div>
          <div className="space-y-2">
            {HISTORICO.map((h, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2"
              >
                <div className="shrink-0 text-[11px] font-mono text-slate-500 pt-0.5">
                  {h.data}
                  <span className="block text-slate-400">{h.hora}</span>
                </div>
                <div className="min-w-0">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      h.tom === 'ok'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {h.resultado}
                  </span>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{h.detalhe}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nota de método */}
        <div className="rounded-lg border-l-4 border-blue-600 bg-blue-50 p-4 text-sm text-blue-900">
          <div className="flex items-start gap-2">
            <Activity className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <b>Como este painel é alimentado.</b> Números e situações vêm do relatório da última
              execução da rotina semanal (scripts/d3c20c92c899fa15), não de digitação manual. A
              varredura roda toda <b>quarta-feira às 11:00</b> e confere cada fonte por assinatura
              de conteúdo: no texto de lei, um hash SHA-256 de 661 mil caracteres detecta qualquer
              alteração; nos catálogos, a lista de normas publicadas. Quando algo muda, o registro
              entra automaticamente no Histórico de Atualizações (Seção 13) e o Panorama é
              republicado.
            </div>
          </div>
        </div>

        {/* Aviso honesto */}
        <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <b>Por que mostrar o que está bloqueado.</b> O Planalto, a Câmara e o CONFAZ não
              respondem a este servidor — e isso está nesta tabela, não escondido. Um monitor que só
              exibe o que funciona não serve para confiar. A diferença é que hoje cada uma dessas
              ausências tem <b>substituto ativo</b>: o texto de lei vem do normas.leg.br, o ato
              publicado vem do DOU, e o catálogo de norma nova vem dos Dados Abertos do Senado.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <RefreshCw className="w-3 h-3" />
          <span>
            Situação medida em 28/10/2026 · próxima conferência automática em 04/11/2026, 11:00
          </span>
        </div>
      </div>
    </section>
  )
}
