import { useState, useMemo } from 'react'
import {
  ShieldCheck,
  Database,
  Globe2,
  History,
  Paperclip,
  Percent,
  Search,
  ListChecks,
  Home,
  Layers,
} from 'lucide-react'

type Agente = {
  id: string
  nome: string
  papel: string
  funcoes: string[]
  tecla?: string
  lider?: boolean
  status: 'ATIVO' | 'MONITORANDO' | 'SOB LIBERAÇÃO'
}

const AGENTES: Agente[] = [
  {
    id: 'lider',
    nome: 'Assistente Líder — Maestro de Fontes Oficiais',
    papel: 'Coordena todos os assistentes e TODAS as interações com fontes externas',
    funcoes: [
      'Regra absoluta: buscar informações SOMENTE em fontes oficiais (Planalto, CGIBS, RFB, Bacen, IBGE, Diários) — nunca em fontes secundárias',
      'Valida cada atualização legislativa antes de entrar no sistema (URL oficial + conferência de texto)',
      'Autoriza e supervisiona as ações dos demais assistentes',
      'Registra toda decisão na Seção 13 — Histórico de Atualizações',
    ],
    tecla: 'M',
    lider: true,
    status: 'ATIVO',
  },
  {
    id: 'artefatos',
    nome: 'Guardião de Artefatos',
    papel: 'Controla os artefatos criados (documentos, desenhos, planilhas, PDFs)',
    funcoes: [
      'Inventário dos artefatos entregues (projetos, relatórios, catálogos)',
      'Verificação de integridade (hash SHA-256) nos uploads ao sistema',
      'Versionamento — nada é sobrescrito sem registro',
    ],
    status: 'ATIVO',
  },
  {
    id: 'conectores',
    nome: 'Conector de Integrações',
    papel: 'Interage com os conectores (MCP) do sistema',
    funcoes: [
      'Skip (arquivos, QA, publish), Gmail, Drive, Calendar, WhatsApp',
      'Só executa ações reversíveis sem aprovação; envio/cancelamento exige confirmação do diretor',
      'Credenciais nunca expostas em páginas públicas',
    ],
    status: 'MONITORANDO',
  },
  {
    id: 'automacoes',
    nome: 'Auditor de Automações',
    papel: 'Revisa as automações e rotinas agendadas',
    funcoes: [
      'Rotina semanal de fontes oficiais (seg 11h + 11h05) — verifica execução e resultado',
      'Crons de regeneração do catálogo e atualização do Panorama',
      'Falha detectada → alerta imediato ao diretor',
    ],
    status: 'MONITORANDO',
  },
  {
    id: 'memoria',
    nome: 'Curador de Memória',
    papel: 'Cuida da memória do sistema (contexto persistente)',
    funcoes: [
      'Memória de trabalho (projetos, decisões, runbooks) sempre atualizada',
      'Fatos do usuário e preferências separados do contexto de trabalho',
      'Prepara o acesso às atualizações — contexto pronto para cada sessão',
    ],
    status: 'ATIVO',
  },
  {
    id: 'seguranca',
    nome: 'Sentinela de Segurança',
    papel: 'Protege o sistema contra ataques e vazamento de informações',
    funcoes: [
      'Monitora endpoints públicos (relatórios por token, painel por X-Painel-Token)',
      'Bloqueia envio de dados para sistemas externos não autorizados',
      'Verifica integridade de arquivos (hash) e URLs de produção após cada publish',
      'Qualquer anomalia → alerta imediato ao diretor',
    ],
    status: 'ATIVO',
  },
]

type Alerta = {
  sev: 'ALTA' | 'MEDIA' | 'BAIXA' | 'INFO'
  titulo: string
  detalhe: string
  quando: string
  estado: 'ABERTO' | 'OBSERVANDO' | 'RESOLVIDO'
}

const ALERTAS: Alerta[] = [
  {
    sev: 'MEDIA',
    titulo: 'Rate-limit do Bacen pode derrubar o botão de sync',
    detalhe:
      'O sync de índices (IPCA/IGP-M/SELIC/TR) pode falhar por limite de requisições — clicar de novo resolve (upsert idempotente). Monitorado no módulo Honorários em Atraso.',
    quando: 'desde 28/09/2026',
    estado: 'OBSERVANDO',
  },
  {
    sev: 'BAIXA',
    titulo: 'CBS 2027 depende de resolução do Senado',
    detalhe:
      'A alíquota de referência da CBS em 2027 é estimativa de mercado (8,8% − 0,1 p.p.). O sistema marca como estimativa editável até a publicação oficial.',
    quando: 'desde 04/10/2026',
    estado: 'OBSERVANDO',
  },
  {
    sev: 'BAIXA',
    titulo: 'Percentuais dos créditos presumidos do agro pendentes',
    detalhe:
      'Aguardando ato conjunto Fazenda/CGIBS (art. 168, §4º) — campos editáveis nos simuladores da 6B.',
    quando: 'desde 04/10/2026',
    estado: 'OBSERVANDO',
  },
  {
    sev: 'INFO',
    titulo: 'Rotina semanal de fontes oficiais operando',
    detalhe:
      'Segundas 11h (fontes) + 11h05 (regeneração do catálogo) — últimas execuções registradas na Seção 13.',
    quando: 'semanal',
    estado: 'RESOLVIDO',
  },
  {
    sev: 'ALTA',
    titulo: 'Nenhum incidente de segurança registrado',
    detalhe:
      'Sem tentativas de acesso indevido, vazamento ou corrupção de arquivos até o momento. Sentinela em operação contínua.',
    quando: 'contínuo',
    estado: 'RESOLVIDO',
  },
]

const DISPOSITIVOS = [
  {
    icon: Database,
    titulo: 'Autenticação por token (X-Painel-Token)',
    desc: 'Painel de envios e endpoints administrativos exigem token secreto — validado inline em cada handler (JSVM).',
  },
  {
    icon: ShieldCheck,
    titulo: 'Páginas públicas só por token único',
    desc: 'Relatório de simulação e confirmação de recebimento acessíveis apenas por token de 48 chars gerado por envio.',
  },
  {
    icon: Database,
    titulo: 'Integridade de arquivos (hash SHA-256)',
    desc: 'Todo upload ao sistema é validado por hash — arquivos corrompidos/truncados são detectados antes de publicar.',
  },
  {
    icon: ShieldCheck,
    titulo: 'Regra de fonte única oficial',
    desc: 'Assistentes só consultam fontes oficiais primárias (Planalto, CGIBS, RFB, Bacen). Fontes secundárias são rotuladas e nunca usadas como base legal.',
  },
  {
    icon: Search,
    titulo: 'Auditoria de ações (audit_log)',
    desc: 'Envios, sincronizações e operações sensíveis registradas com entidade, operação e payload.',
  },
  {
    icon: ListChecks,
    titulo: 'Comunicação imediata ao diretor',
    desc: 'Alertas ALTA e liberações pendentes são comunicadas de imediato a Antonio Joildo da Silva (diretor) — joildo@adecont.com.br.',
  },
]

const sevCor: Record<string, string> = {
  ALTA: 'bg-red-50 text-red-700 border-red-300',
  MEDIA: 'bg-amber-50 text-amber-700 border-amber-300',
  BAIXA: 'bg-blue-50 text-blue-700 border-blue-300',
  INFO: 'bg-slate-50 text-slate-600 border-slate-300',
}
const estadoCor: Record<string, string> = {
  ABERTO: 'bg-red-100 text-red-800 border-red-300',
  OBSERVANDO: 'bg-amber-100 text-amber-800 border-amber-300',
  RESOLVIDO: 'bg-emerald-100 text-emerald-800 border-emerald-300',
}
const statusCor: Record<string, string> = {
  ATIVO: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  MONITORANDO: 'bg-blue-50 text-blue-700 border-blue-300',
  'SOB LIBERAÇÃO': 'bg-amber-50 text-amber-700 border-amber-300',
}

export function SectionAssistentesSeguranca() {
  const [busca, setBusca] = useState('')

  const agentesFiltrados = useMemo(() => {
    const t = busca
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    if (!t) return AGENTES
    return AGENTES.filter(
      (a) =>
        (a.nome + ' ' + a.papel + ' ' + a.funcoes.join(' '))
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .indexOf(t) >= 0,
    )
  }, [busca])

  const alertasFiltrados = useMemo(() => {
    const t = busca
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    if (!t) return ALERTAS
    return ALERTAS.filter(
      (a) =>
        (a.titulo + ' ' + a.detalhe)
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .indexOf(t) >= 0,
    )
  }, [busca])

  return (
    <section id="assistentes-seguranca" className="scroll-mt-24 space-y-5">
      <div className="border-b-2 border-panorama-gold/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-panorama-navy text-panorama-gold-light font-bold text-xs ring-1 ring-panorama-gold/50">
            15
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Central de Assistentes & Segurança
          </h2>
          <span className="px-2 py-0.5 rounded bg-panorama-navy text-panorama-gold-light text-[10px] font-black tracking-wider">
            ACESSO RÁPIDO: TECLA X
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          Agentes especializados que controlam os artefatos, interagem com os conectores, revisam as
          automações, cuidam da memória e preparam as atualizações — coordenados pelo{' '}
          <strong>Assistente Líder</strong>, que só consulta <strong>fontes oficiais</strong>.
          Dispositivos de segurança contra ataques e vazamento, relatório de alertas e pontos de
          atenção/observação.
          <strong> Liberações sensíveis exigem acompanhamento da empresa</strong> e comunicação
          imediata ao diretor <strong>Antonio Joildo da Silva</strong>.
        </p>
      </div>

      {/* Busca única */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setBusca('')
            }}
            placeholder="Buscar assistente, dispositivo ou alerta… (Esc limpa)"
            className="w-full rounded-lg border border-slate-300 pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-panorama-gold/60"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Assistentes */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Layers className="w-4 h-4 text-panorama-gold-dark" /> Assistentes especializados (
          {agentesFiltrados.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {agentesFiltrados.map((a) => (
            <div
              key={a.id}
              className={`p-4 rounded-xl border shadow-xs space-y-2 ${
                a.lider
                  ? 'border-panorama-gold bg-gradient-to-br from-panorama-navy to-panorama-navy-light text-white'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h4
                  className={`text-sm font-bold flex items-center gap-1.5 ${a.lider ? 'text-panorama-gold-light' : 'text-slate-900'}`}
                >
                  {a.lider ? (
                    <ShieldCheck className="w-4 h-4 text-panorama-gold" />
                  ) : (
                    <Layers className="w-4 h-4 text-panorama-gold-dark" />
                  )}
                  {a.nome}
                </h4>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusCor[a.status]} ${a.lider ? 'bg-white/10 !text-white !border-white/30' : ''}`}
                >
                  {a.status}
                </span>
              </div>
              <p className={`text-xs ${a.lider ? 'text-white/80' : 'text-slate-600'}`}>{a.papel}</p>
              <ul
                className={`text-[11px] space-y-1 ${a.lider ? 'text-white/70' : 'text-slate-600'}`}
              >
                {a.funcoes.map((f) => (
                  <li key={f} className="flex gap-1.5">
                    <span className={a.lider ? 'text-panorama-gold' : 'text-panorama-gold-dark'}>
                      ▸
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Dispositivos de segurança */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-panorama-gold-dark" /> Dispositivos de segurança (
          {DISPOSITIVOS.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {DISPOSITIVOS.map((d) => (
            <div
              key={d.titulo}
              className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <d.icon className="w-4 h-4 text-panorama-navy" />
                <span className="text-xs font-bold text-slate-900">{d.titulo}</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">{d.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Relatório de alertas + pontos de atenção/observação */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Percent className="w-4 h-4 text-panorama-gold-dark" /> Relatório de alertas, pontos de
          atenção e observação ({alertasFiltrados.length})
        </h3>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                <th className="py-3 px-4 w-20">Severidade</th>
                <th className="py-3 px-4">Alerta / Ponto</th>
                <th className="py-3 px-3 w-28">Estado</th>
                <th className="py-3 px-3 w-32">Desde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alertasFiltrados.map((al) => (
                <tr key={al.titulo} className="hover:bg-slate-50/70 align-top">
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${sevCor[al.sev]}`}
                    >
                      {al.sev}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{al.titulo}</div>
                    <div className="text-slate-600 text-xs leading-relaxed mt-0.5">
                      {al.detalhe}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${estadoCor[al.estado]}`}
                    >
                      {al.estado}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 text-xs">{al.quando}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Política de liberação */}
      <div className="p-4 rounded-xl border-2 border-panorama-gold/60 bg-gradient-to-br from-panorama-cream to-white">
        <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Home className="w-4 h-4 text-panorama-gold-dark" /> Política de liberação —
          acompanhamento da empresa
        </h3>
        <ul className="text-xs text-slate-700 space-y-1.5">
          <li>
            ▸ <strong>Ações reversíveis</strong> (consultar fontes, gerar relatórios, atualizar
            conteúdo): executadas pelos assistentes com registro no Histórico.
          </li>
          <li>
            ▸ <strong>Ações sensíveis</strong> (envio em massa a clientes, alteração de alíquotas
            oficiais, mudança de endpoints/segredos): exigem <strong>liberação do diretor</strong>.
          </li>
          <li>
            ▸ <strong>Comunicação imediata:</strong> alertas de severidade ALTA e pedidos de
            liberação são comunicados de imediato a{' '}
            <strong>Antonio Joildo da Silva — Diretor</strong> (joildo@adecont.com.br), por e-mail e
            canal ativo.
          </li>
          <li>
            ▸ <strong>Proibição absoluta:</strong> nenhuma informação buscada em fonte secundária
            entra como base legal; nenhum dado do sistema é compartilhado com serviços externos não
            autorizados.
          </li>
        </ul>
        <div className="flex flex-wrap gap-2 mt-3">
          <a
            href={
              'mailto:joildo@adecont.com.br?subject=' +
              encodeURIComponent('[ADECONT] Solicitação de liberação — Central de Assistentes') +
              '&body=' +
              encodeURIComponent('Solicito liberação para a ação: ')
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-panorama-navy text-white text-xs font-bold hover:bg-panorama-navy-light"
          >
            <Mail className="w-3.5 h-3.5" /> Solicitar liberação ao diretor
          </a>
          <a
            href="/#historico-atualizacoes"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
          >
            <History className="w-3.5 h-3.5" /> Ver Histórico de Atualizações
          </a>
        </div>
      </div>
    </section>
  )
}
