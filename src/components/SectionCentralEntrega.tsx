import { useState, useMemo } from 'react'
import {
  Printer,
  Search,
  Send,
  FileText,
  Calculator,
  Scale,
  Mail,
  MessageCircle,
  ExternalLink,
} from 'lucide-react'

const SIM_URL = '/simulador.html'
const ENVIOS_URL = '/envios.html'
const CONSOLIDADO_URL = '/consolidado.html'

type Item = {
  id: string
  titulo: string
  desc: string
  categoria: 'simulador' | 'relatorio' | 'legislacao' | 'topico'
  tecla?: string
  url: string
  acoes: ('print' | 'wa' | 'mail' | 'enviar')[]
}

const ITENS: Item[] = [
  // ===== SIMULADORES =====
  {
    id: 'sim-geral',
    titulo: 'Simulador Geral de Transição',
    desc: 'Busca de produtos/serviços (1.002 itens), componentes CBS/IBS/IS, resultado com capitulação legal e envio ao cliente com protocolo.',
    categoria: 'simulador',
    tecla: 'S',
    url: SIM_URL,
    acoes: ['print', 'wa', 'mail', 'enviar'],
  },
  {
    id: 'sim-6a',
    titulo: 'Simulador Imobiliário (6A)',
    desc: 'Venda e aluguel — redutores, enquadramento art. 251, RET. Tecla de atalho na seção: I.',
    categoria: 'simulador',
    tecla: 'I',
    url: SIM_URL + '?q=venda%20de%20im%C3%B3vel%20residencial%20novo&enviar=1',
    acoes: ['print', 'wa', 'mail', 'enviar'],
  },
  {
    id: 'sim-6b',
    titulo: 'Simulador do Agronegócio (6B)',
    desc: 'Produtor não contribuinte, insumos/diferimento, créditos presumidos, cooperativas. Tecla: G.',
    categoria: 'simulador',
    tecla: 'G',
    url: SIM_URL + '?q=produtos%20agropecu%C3%A1rios&enviar=1',
    acoes: ['print', 'wa', 'mail', 'enviar'],
  },
  {
    id: 'sim-6c',
    titulo: 'Simulador de Consórcios (6C)',
    desc: 'Taxa & lances, carta de crédito, garantia fiduciária, apuração. Tecla: C.',
    categoria: 'simulador',
    tecla: 'C',
    url: SIM_URL + '?q=taxa%20de%20administra%C3%A7%C3%A3o&enviar=1',
    acoes: ['print', 'wa', 'mail', 'enviar'],
  },
  {
    id: 'sim-6d',
    titulo: 'Simulador Financeiro (6D)',
    desc: 'Empréstimos, tarifas, sujeitos, obrigações banco × correntista. Tecla: F.',
    categoria: 'simulador',
    tecla: 'F',
    url: SIM_URL + '?q=empr%C3%A9stimos&enviar=1',
    acoes: ['print', 'wa', 'mail', 'enviar'],
  },
  {
    id: 'sim-6e',
    titulo: 'Simulador do Simples (6E)',
    desc: 'Regime híbrido DAS × regular, transição 2027–2033, prazos de opção. Tecla: P.',
    categoria: 'simulador',
    tecla: 'P',
    url: SIM_URL + '?enviar=1',
    acoes: ['print', 'wa', 'mail', 'enviar'],
  },
  {
    id: 'sim-6f',
    titulo: 'Simulador de Profissões e Plataformas (6F)',
    desc: '18 profissões regulamentadas (−30%) e plataformas digitais (art. 22). Tecla: R.',
    categoria: 'simulador',
    tecla: 'R',
    url: SIM_URL + '?q=servi%C3%A7os%20jur%C3%ADdicos&enviar=1',
    acoes: ['print', 'wa', 'mail', 'enviar'],
  },
  // ===== RELATÓRIOS =====
  {
    id: 'rel-consolidado',
    titulo: 'Relatório consolidado de simulações',
    desc: 'Todas as simulações enviadas, agrupadas por cliente, com KPIs e status de confirmação — pronto para PDF.',
    categoria: 'relatorio',
    url: CONSOLIDADO_URL,
    acoes: ['print', 'mail'],
  },
  {
    id: 'rel-envios',
    titulo: 'Painel Cadastro & Envios',
    desc: 'Cadastro de clientes, importação CSV, envio com protocolo SIM- e histórico completo de entregas.',
    categoria: 'relatorio',
    url: ENVIOS_URL,
    acoes: ['print'],
  },
  // ===== LEGISLAÇÃO =====
  {
    id: 'leg-panorama',
    titulo: 'Panorama completo da Reforma (legislação)',
    desc: 'Legislação cronológica, capítulos/artigos, incidência, exemplos, cronograma 2026–2033 — atualizado semanalmente.',
    categoria: 'legislacao',
    url: '/#s1',
    acoes: ['print', 'wa', 'mail'],
  },
  {
    id: 'leg-resolucoes',
    titulo: 'Resoluções CGIBS (18 atos)',
    desc: 'Inventário completo com links oficiais — seção 10 do Panorama.',
    categoria: 'legislacao',
    url: '/#s10',
    acoes: ['print', 'wa', 'mail'],
  },
  {
    id: 'leg-busca-res',
    titulo: 'Busca no texto integral das Resoluções',
    desc: '1.213 trechos pesquisáveis das 18 resoluções — ideal para extrair tópicos e enviar ao cliente.',
    categoria: 'legislacao',
    url: '/panorama-reforma/busca-resolucoes.html',
    acoes: ['print', 'wa', 'mail'],
  },
  {
    id: 'leg-7a',
    titulo: 'Tabela Geral dos Anexos (7A)',
    desc: '1.053 itens com tratamento e alíquotas — base para consultas rápidas e impressão. Tecla: A.',
    categoria: 'legislacao',
    tecla: 'A',
    url: '/#secao-7a',
    acoes: ['print', 'wa', 'mail'],
  },
  {
    id: 'leg-cronograma',
    titulo: 'Cronograma de transição 2026–2033',
    desc: 'Linha do tempo oficial da transição — seção 8. Tecla: 8.',
    categoria: 'legislacao',
    tecla: '8',
    url: '/#cronograma',
    acoes: ['print', 'wa', 'mail'],
  },
  // ===== TÓPICOS =====
  {
    id: 'top-fato',
    titulo: 'Fato gerador e incidência',
    desc: 'Seção 2 — quando incide IBS/CBS. Tecla: 2.',
    categoria: 'topico',
    tecla: '2',
    url: '/#fato-gerador',
    acoes: ['print', 'wa', 'mail'],
  },
  {
    id: 'top-cesta',
    titulo: 'Cesta básica — alíquota zero',
    desc: 'Seção 3 — produtos da Cesta Básica Nacional. Tecla: 3.',
    categoria: 'topico',
    tecla: '3',
    url: '/#cesta-basica',
    acoes: ['print', 'wa', 'mail'],
  },
  {
    id: 'top-imunidades',
    titulo: 'Imunidades e isenções',
    desc: 'Seções 4–5 — hipóteses constitucionais e legais. Teclas: 4/5.',
    categoria: 'topico',
    tecla: '4',
    url: '/#imunidades',
    acoes: ['print', 'wa', 'mail'],
  },
  {
    id: 'top-regimes',
    titulo: 'Regimes específicos — visão geral',
    desc: 'Seção 6 — mapa dos regimes com links para os simuladores. Tecla: 6.',
    categoria: 'topico',
    tecla: '6',
    url: '/#regimes-especificos',
    acoes: ['print', 'wa', 'mail'],
  },
  {
    id: 'top-anexos',
    titulo: 'Anexos individualizados (Seção 7)',
    desc: '23 anexos da LC 214 + 5 do RIBS + 5 do Decreto — itens consultáveis. Tecla: 7.',
    categoria: 'topico',
    tecla: '7',
    url: '/#secao-7',
    acoes: ['print', 'wa', 'mail'],
  },
  {
    id: 'top-fontes',
    titulo: 'Fontes oficiais primárias',
    desc: 'Seção 9 — 110 bases oficiais para citação em documentos. Tecla: 9.',
    categoria: 'topico',
    tecla: '9',
    url: '/#fontes',
    acoes: ['print', 'wa', 'mail'],
  },
]

const CATS: { id: Item['categoria'] | 'todos'; label: string; cor: string }[] = [
  {
    id: 'todos',
    label: 'Todos',
    cor: 'bg-panorama-navy text-panorama-gold-light border-panorama-navy',
  },
  { id: 'simulador', label: '🧮 Simuladores', cor: 'bg-blue-50 text-blue-800 border-blue-300' },
  {
    id: 'relatorio',
    label: '📊 Relatórios',
    cor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  },
  {
    id: 'legislacao',
    label: '⚖️ Legislação',
    cor: 'bg-purple-50 text-purple-800 border-purple-300',
  },
  { id: 'topico', label: '📄 Tópicos', cor: 'bg-amber-50 text-amber-800 border-amber-300' },
]

function norm(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function acaoUrl(item: Item, acao: string) {
  const txt = encodeURIComponent(
    item.titulo + ' — ADECONT Panorama da Reforma Tributária: ' + location.origin + item.url,
  )
  if (acao === 'wa') return 'https://wa.me/?text=' + txt
  if (acao === 'mail')
    return 'mailto:?subject=' + encodeURIComponent(item.titulo + ' — ADECONT') + '&body=' + txt
  return ''
}

export function SectionCentralEntrega() {
  const [busca, setBusca] = useState('')
  const [cat, setCat] = useState<Item['categoria'] | 'todos'>('todos')

  const filtrados = useMemo(() => {
    const t = norm(busca.trim())
    return ITENS.filter((i) => {
      if (cat !== 'todos' && i.categoria !== cat) return false
      if (!t) return true
      const alvo = norm(i.titulo + ' ' + i.desc + ' ' + i.categoria)
      return t.split(/\s+/).every((p) => alvo.indexOf(p) >= 0)
    })
  }, [busca, cat])

  return (
    <section id="central-entrega" className="scroll-mt-24 space-y-5">
      <div className="border-b-2 border-panorama-gold/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-panorama-navy text-panorama-gold-light font-bold text-xs ring-1 ring-panorama-gold/50">
            14
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Central de Entrega — impressão e envio ao cliente
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          Todo o material imprimível e transmissível do sistema em um só lugar: simuladores,
          relatórios, legislação atualizada e tópicos. Use a busca (tecla{' '}
          <kbd className="px-1 rounded bg-slate-100 border border-slate-300 text-[10px] font-mono">
            E
          </kbd>{' '}
          abre esta seção;
          <kbd className="px-1 rounded bg-slate-100 border border-slate-300 text-[10px] font-mono">
            /
          </kbd>{' '}
          foca a busca abaixo) e escolha a ação:
          <strong> 🖨️ Imprimir/PDF</strong>, <strong>💬 WhatsApp</strong>,{' '}
          <strong>✉️ E-mail</strong> ou <strong>📤 Enviar ao cliente</strong> (canal único com
          protocolo SIM-).
        </p>
      </div>

      {/* Busca + filtros */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setBusca('')
                ;(e.target as HTMLInputElement).blur()
              }
            }}
            placeholder="Buscar material para imprimir ou enviar… (ex.: consórcio, cesta, resoluções, aluguel)"
            className="w-full rounded-lg border border-slate-300 pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-panorama-gold/60"
            id="busca-central"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold"
              title="Limpar (Esc)"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATS.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors cursor-pointer ${
                cat === c.id ? c.cor : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {c.label}
            </button>
          ))}
          <span className="text-[11px] text-slate-500 self-center ml-1">
            {filtrados.length} de {ITENS.length} itens
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtrados.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-shadow space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                {item.categoria === 'simulador' && <Calculator className="w-4 h-4 text-blue-600" />}
                {item.categoria === 'relatorio' && (
                  <FileText className="w-4 h-4 text-emerald-600" />
                )}
                {item.categoria === 'legislacao' && <Scale className="w-4 h-4 text-purple-600" />}
                {item.categoria === 'topico' && <FileText className="w-4 h-4 text-amber-600" />}
                {item.titulo}
              </h4>
              {item.tecla && (
                <span className="shrink-0 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-[10px] font-mono font-bold text-slate-600">
                  tecla {item.tecla}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {item.acoes.includes('print') && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-panorama-navy text-white text-[11px] font-bold hover:bg-panorama-navy-light"
                  title="Abrir e imprimir / salvar em PDF"
                >
                  <Printer className="w-3 h-3" /> Imprimir/PDF
                </a>
              )}
              {item.acoes.includes('enviar') && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-panorama-gold to-panorama-gold-dark text-panorama-navy text-[11px] font-bold hover:shadow-md"
                  title="Enviar ao cliente com protocolo (canal único)"
                >
                  <Send className="w-3 h-3" /> Enviar ao cliente
                </a>
              )}
              {item.acoes.includes('wa') && (
                <a
                  href={acaoUrl(item, 'wa')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-700 text-[11px] font-bold hover:bg-emerald-100"
                >
                  <MessageCircle className="w-3 h-3" /> WhatsApp
                </a>
              )}
              {item.acoes.includes('mail') && (
                <a
                  href={acaoUrl(item, 'mail')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-300 text-blue-700 text-[11px] font-bold hover:bg-blue-100"
                >
                  <Mail className="w-3 h-3" /> E-mail
                </a>
              )}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-500 text-[11px] font-semibold hover:text-panorama-navy"
              >
                <ExternalLink className="w-3 h-3" /> Abrir
              </a>
            </div>
          </div>
        ))}
        {!filtrados.length && (
          <div className="p-6 rounded-xl border border-slate-200 bg-white text-center text-sm text-slate-500 md:col-span-2">
            Nenhum material encontrado — ajuste a busca ou o filtro.
          </div>
        )}
      </div>

      <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm">
        ℹ️ <strong>Como usar:</strong> "Imprimir/PDF" abre o material pronto para impressão (Ctrl+P
        salva em PDF). "Enviar ao cliente" abre o Simulador Geral com o painel de envio (cadastro de
        clientes + protocolo SIM- + e-mail oficial). "WhatsApp/E-mail" compartilha o link direto. A
        legislação e os tópicos refletem a última atualização da rotina semanal (seg 11h) —
        registrada na Seção 13.
      </div>
    </section>
  )
}
