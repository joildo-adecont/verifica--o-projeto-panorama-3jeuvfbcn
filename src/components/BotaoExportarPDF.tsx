import { Printer } from 'lucide-react'

/**
 * EXPORTAR EM PDF — impressão da seção como documento
 *
 * ── COMO FUNCIONA ──
 * Injeta uma folha de estilo de impressão que, no momento de imprimir, esconde
 * tudo o que não é a seção (header fixo, menu lateral, sumário flutuante, rodapé,
 * o painel de atalhos) e deixa só o conteúdo do indicador em folha branca.
 * Depois chama window.print() — o navegador abre a caixa de impressão, onde o
 * usuário escolhe "Salvar como PDF".
 *
 * ── POR QUE ASSIM, E NÃO UM GERADOR DE PDF ──
 * Um gerador de PDF precisaria redesenhar cada gráfico fora do React, com risco de
 * o PDF divergir do que está na tela. Imprimir a própria tela elimina a divergência:
 * o documento é o que se vê. O CSS @media print é escopado e só vale na impressão.
 *
 * ── O QUE VAI PARA O PAPEL ──
 * Só a aba aberta. As outras cinco não são impressas — o que evita um PDF de 30
 * páginas com conteúdo repetido.
 */

const ESTILO_IMPRESSAO = `
@media print {
  @page { size: A4 portrait; margin: 12mm 10mm; }

  /* esconde a moldura do sistema */
  aside,
  header.fixed,
  .fixed,
  footer,
  #painel-atalhos,
  [data-print="hide"] { display: none !important; }

  html, body {
    background: #fff !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* o conteúdo ocupa a folha inteira, sem a margem do menu lateral */
  .lg\\:pl-60 { padding-left: 0 !important; }
  main { padding: 0 !important; max-width: none !important; }

  /* só a seção de indicadores aparece */
  main > section:not(#indicadores) { display: none !important; }

  #indicadores {
    border: none !important;
    box-shadow: none !important;
    break-inside: avoid;
  }

  /* o cabeçalho navy precisa sair colorido no papel */
  #indicadores > div > header {
    background: #0B1528 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* esconde as abas no papel — só a aba aberta é impressa */
  #indicadores [role="tablist"] { display: none !important; }

  /* evita quebrar bloco no meio */
  #indicadores .rounded-xl,
  #indicadores table,
  #indicadores svg { break-inside: avoid; }

  /* links não precisam de sublinhado nem de URL no papel */
  a[href]::after { content: none !important; }

  /* rodapé do documento */
  #indicadores::after {
    content: "Panorama da Reforma Tributária · ADECONT · documento gerado em " attr(data-gerado);
    display: block;
    margin-top: 8mm;
    padding-top: 2mm;
    border-top: 1px solid #CBD5E1;
    font-size: 8pt;
    color: #64748B;
  }
}
`

export function BotaoExportarPDF({ alvo = 'indicadores' }: { alvo?: string }) {
  const imprimir = () => {
    // injeta o estilo uma vez
    if (!document.getElementById('css-impressao-panorama')) {
      const tag = document.createElement('style')
      tag.id = 'css-impressao-panorama'
      tag.textContent = ESTILO_IMPRESSAO
      document.head.appendChild(tag)
    }

    // carimba a data no elemento, para o rodapé do papel
    const el = document.getElementById(alvo)
    if (el) {
      const hoje = new Date()
      const data = `${String(hoje.getDate()).padStart(2, '0')}/${String(
        hoje.getMonth() + 1,
      ).padStart(
        2,
        '0',
      )}/${hoje.getFullYear()} às ${String(hoje.getHours()).padStart(2, '0')}:${String(
        hoje.getMinutes(),
      ).padStart(2, '0')}`
      el.setAttribute('data-gerado', data)
    }

    // deixa o navegador pintar antes de abrir a caixa de impressão
    window.setTimeout(() => window.print(), 120)
  }

  return (
    <button
      onClick={imprimir}
      className="inline-flex items-center gap-1.5 rounded-lg bg-panorama-gold text-panorama-navy px-3 py-1.5 text-[11px] font-bold hover:bg-panorama-gold-light transition-colors cursor-pointer shrink-0"
      title="Imprimir esta aba ou salvar como PDF"
    >
      <Printer className="w-3.5 h-3.5" />
      Imprimir / PDF
    </button>
  )
}
