/**
 * BLOCOS → DOCUMENTO IMPRIMÍVEL (PDF via impressão do navegador)
 * Sistema ADECONT — Projeto Panorama
 *
 * O padrão antigo (CSS visibility escopado a um id fixo na página) só
 * funcionava na Central de Entregas — onde o id #relatorio-agente-impressao
 * existia. Na TELA DO AGENTE não havia nenhum elemento com esse id, então o
 * window.print() saía com a página inteira escondida: o PDF saía VAZIO.
 *
 * Nova abordagem: montamos um host dedicado no body com O RELATÓRIO COMPLETO
 * — cabeçalho ADECONT, citações das fontes e todos os blocos estruturados,
 * incluindo as tabelas com as bordas forçadas para o papel. Na tela ele fica
 * fora do viewport (não interfere no layout); na impressão ele é o ÚNICO
 * elemento visível (todo o resto do app é escondido via body > *:not(host)),
 * e o host volta a ficar vazio depois de imprimir.
 */

import type { BlocoRelatorio } from '@/services/relatorioAgenteParser'
import type { AgentCitation } from '@/lib/skipAi'
import { renderizarBlocosComoHtml } from '@/services/blocosParaHtml'

const CSS_IMPRESSAO_RELATORIO = `
#impressao-relatorio-agente-host {
  display: none;
}
@media print {
  @page { size: A4 portrait; margin: 12mm 10mm; }
  body > *:not(#impressao-relatorio-agente-host) { display: none !important; }
  #impressao-relatorio-agente-host {
    display: block !important;
    position: static;
  }
  #impressao-relatorio-agente-host .page {
    box-shadow: none !important;
    border: none !important;
    margin: 0 !important;
    padding: 0 !important;
    width: auto !important;
    max-width: none !important;
  }
  #impressao-relatorio-agente-host .page-header {
    background: #0B1528 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  #impressao-relatorio-agente-host .page-header * {
    color: #ffffff !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  #impressao-relatorio-agente-host table { break-inside: auto; }
  #impressao-relatorio-agente-host tr,
  #impressao-relatorio-agente-host td,
  #impressao-relatorio-agente-host th { break-inside: avoid; }
  #impressao-relatorio-agente-host h1,
  #impressao-relatorio-agente-host h2,
  #impressao-relatorio-agente-host h3,
  #impressao-relatorio-agente-host .no-quebra { break-inside: avoid; }
  #impressao-relatorio-agente-host thead { display: table-header-group; }
  #impressao-relatorio-agente-host tfoot { display: table-footer-group; }
  #impressao-relatorio-agente-host .pagina-rodape {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 8pt;
    color: #64748B;
  }
}
`

const CSS_CONTEUDO = `
#impressao-relatorio-agente-host {
  position: fixed;
  left: -99999px;
  top: 0;
  width: 794px;
  background: #ffffff;
  z-index: -1;
}
#impressao-relatorio-agente-host .page {
  width: 100%;
  background: #ffffff;
  color: #0f172a;
  font-family: ui-sans-serif, system-ui, 'Segoe UI', Roboto, Arial, sans-serif;
  padding: 24px;
}
#impressao-relatorio-agente-host .page-header {
  background: #0B1528;
  color: #ffffff;
  border-radius: 10px;
  padding: 18px 20px;
  margin-bottom: 18px;
}
#impressao-relatorio-agente-host .page-header h1 {
  font-size: 18px;
  font-weight: 800;
  margin: 0 0 4px 0;
  color: #ffffff;
}
#impressao-relatorio-agente-host .page-header .sub {
  font-size: 11px;
  color: #cbd5e1;
}
#impressao-relatorio-agente-host .page-header .meta {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 8px;
}
#impressao-relatorio-agente-host h2 {
  font-size: 14px;
  font-weight: 700;
  margin: 16px 0 6px 0;
  color: #0f172a;
}
#impressao-relatorio-agente-host h3 {
  font-size: 12.5px;
  font-weight: 700;
  margin: 12px 0 4px 0;
  color: #1e293b;
}
#impressao-relatorio-agente-host p {
  font-size: 11.5px;
  line-height: 1.55;
  margin: 0 0 8px 0;
  color: #1e293b;
  white-space: pre-wrap;
}
#impressao-relatorio-agente-host ul {
  margin: 0 0 8px 18px;
  padding: 0;
}
#impressao-relatorio-agente-host li {
  font-size: 11.5px;
  line-height: 1.5;
  margin-bottom: 3px;
  color: #1e293b;
}
#impressao-relatorio-agente-host table {
  width: 100%;
  border-collapse: collapse;
  margin: 6px 0 14px 0;
}
#impressao-relatorio-agente-host th,
#impressao-relatorio-agente-host td {
  border: 1px solid #94a3b8;
  padding: 4px 6px;
  font-size: 10.5px;
  text-align: left;
  vertical-align: top;
  word-break: break-word;
}
#impressao-relatorio-agente-host th {
  background: #e2e8f0;
  font-weight: 700;
  color: #0f172a;
}
#impressao-relatorio-agente-host .comparativo {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin: 6px 0 14px 0;
}
#impressao-relatorio-agente-host .comparativo .card {
  border: 1px solid #c7d2fe;
  background: #eef2ff;
  border-radius: 6px;
  padding: 8px 10px;
  break-inside: avoid;
}
#impressao-relatorio-agente-host .comparativo .rotulo {
  font-size: 9.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #3730a3;
  margin: 0 0 2px 0;
}
#impressao-relatorio-agente-host .comparativo .valor {
  font-size: 11.5px;
  color: #0f172a;
  margin: 0;
}
#impressao-relatorio-agente-host .fontes {
  border-top: 1px solid #cbd5e1;
  margin-top: 18px;
  padding-top: 10px;
}
#impressao-relatorio-agente-host .fontes h2 { margin-top: 0; }
#impressao-relatorio-agente-host .fontes li {
  font-size: 10px;
  color: #334155;
}
#impressao-relatorio-agente-host .pagina-rodape {
  border-top: 1px solid #cbd5e1;
  padding-top: 4px;
  margin-top: 14px;
}
`

const ID_HOST = 'impressao-relatorio-agente-host'

function htmlEscape(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function esc(st?: string): string {
  return htmlEscape(st)
}

interface MetaDoc {
  titulo: string
  agente: string
  dataEmissao?: string
  pergunta?: string
}

interface PropsDoc {
  meta: MetaDoc
  blocos: BlocoRelatorio[]
  citations?: AgentCitation[]
}

function htmlCabecalho(meta: MetaDoc): string {
  const agencia = 'ADECONT — Assessoria Contábil e Administrativa'
  return (
    `<div class="page-header">` +
    `<h1>${esc(meta.titulo)}</h1>` +
    `<div class="sub">${esc(agencia)} · Agente: ${esc(meta.agente)}</div>` +
    `<div class="meta">Data de emissão: ${esc(
      meta.dataEmissao || new Date().toLocaleString('pt-BR'),
    )}${meta.pergunta ? ` · Consulta: “${esc(meta.pergunta)}”` : ''}</div>` +
    `</div>`
  )
}

function htmlFontes(citations?: AgentCitation[]): string {
  if (!citations || citations.length === 0) return ''
  const itens = citations
    .slice(0, 20)
    .map(
      (c, i) =>
        `<li>[${c.n ?? i + 1}] ${esc((c.excerpt || '').slice(0, 220))}${
          (c.excerpt || '').length > 220 ? '…' : ''
        }</li>`,
    )
    .join('')
  return `<div class="fontes"><h2>Fontes do sistema citadas</h2><ul>${itens}</ul></div>`
}

function htmlDocCompleto({ meta, blocos, citations }: PropsDoc): string {
  return (
    `<div class="page">` +
    htmlCabecalho(meta) +
    renderizarBlocosComoHtml(blocos) +
    htmlFontes(citations) +
    `<div class="pagina-rodape">Sistema ADECONT · Projeto Panorama · documento gerado por agente especialista nativo</div>` +
    `</div>`
  )
}

/** Monta o host de impressão dedicado com o documento completo. */
export function montarHostImpressao(props: PropsDoc): HTMLElement {
  let host = document.getElementById(ID_HOST)
  if (!host) {
    host = document.createElement('div')
    host.id = ID_HOST
    document.body.appendChild(host)
  }
  host.innerHTML = htmlDocCompleto(props)

  if (!document.getElementById('css-conteudo-impressao-relatorio')) {
    const tagC = document.createElement('style')
    tagC.id = 'css-conteudo-impressao-relatorio'
    tagC.textContent = CSS_CONTEUDO
    document.head.appendChild(tagC)
  }
  if (!document.getElementById('css-impressao-relatorio-agente')) {
    const tag = document.createElement('style')
    tag.id = 'css-impressao-relatorio-agente'
    tag.textContent = CSS_IMPRESSAO_RELATORIO
    document.head.appendChild(tag)
  }
  return host
}

/** PDF: gera o documento completo e abre a caixa de impressão (retrato A4). */
export function imprimirRelatorioAgente(
  props: PropsDoc,
  opts?: { aoFinalizar?: () => void },
): void {
  montarHostImpressao(props)
  const limpar = () => {
    const host = document.getElementById(ID_HOST)
    if (host) host.innerHTML = ''
  }
  window.setTimeout(() => {
    try {
      window.print()
    } finally {
      window.setTimeout(limpar, 400)
      opts?.aoFinalizar?.()
    }
  }, 250)
}
