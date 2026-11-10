/**
 * GERADOR DE PDF EM TEXTO PURO — relatório das análises dos balanços anexados
 * ===========================================================================
 * Por que texto puro (e não um gerador binário): o runtime da JSVM não tem
 * zlib, e o backend NÃO consegue ler os PDFs de balanço (fonte Type0/Identity-H
 * — ver leitorBalancetePDF.ts). O relatório aqui é o oposto do leitor: em vez
 * de ler um PDF, GRAVA um. A gravação em cliente_arquivos acontece no SERVIDOR
 * (hook), que recebe o texto pronto via POST /backend/v1/analise-gravar-relatorio.
 *
 * O PDF resultante é um documento de texto simples dentro de um envelope PDF
 * válido (com xref), 100% ASCII — abre em qualquer leitor, imprimível, e o
 * conteúdo é o que importa como "complemento do cadastro".
 */

const LARGURA = 84 // colunas

function linhaSeparadora(char = '='): string {
  return char.repeat(LARGURA)
}

function centralizar(texto: string): string {
  const t = texto.slice(0, LARGURA)
  const pad = Math.max(0, Math.floor((LARGURA - t.length) / 2))
  return ' '.repeat(pad) + t
}

function coluna(esq: string, dir: string): string {
  const e = esq.slice(0, LARGURA - dir.length - 2)
  return e + ' '.repeat(LARGURA - e.length - dir.length) + dir
}

/** Achata valores de moeda com separador de milhar pt-BR (sem símbolo R$, ASCII). */
export function fmtBRL(v: number | undefined | null): string {
  const n = Number(v || 0)
  const sinal = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  const int = Math.floor(abs).toLocaleString('en-US').replace(/,/g, '.')
  const dec = String(Math.round((abs - Math.floor(abs)) * 100)).padStart(2, '0')
  return `${sinal}${int},${dec}`
}

function quebrar(texto: string, largura = LARGURA - 2): string[] {
  const palavras = String(texto || '').split(/\s+/)
  const saida: string[] = []
  let atual = ''
  for (const p of palavras) {
    if ((atual + ' ' + p).trim().length > largura) {
      if (atual) saida.push(atual.trim())
      atual = p
    } else {
      atual = (atual + ' ' + p).trim()
    }
  }
  if (atual) saida.push(atual.trim())
  return saida
}

export interface DadosRelatorioAnaliseAnexos {
  tipo: 'individual' | 'tri_anual' | 'balancete'
  titulo: string
  empresaNome: string
  empresaDoc: string
  clienteCodigo: number
  dataEmissao: string
  exercicios: Array<{
    exercicio: string
    rotulo: string
    dataBase: string
    periodoEncerrado: boolean
  }>
  classicosPorExercicio: Record<string, any[]>
  avancadosPorExercicio: Record<string, any>
  dadosPorExercicio?: Record<string, any>
  parecerTexto?: string
}

function secaoIndicadoresClássicos(exercicio: string, inds: any[]): string[] {
  const out: string[] = []
  out.push(linhaSeparadora('-'))
  out.push(`INDICADORES CLASSICOS — EXERCICIO ${exercicio}`)
  out.push(linhaSeparadora('-'))
  if (!inds || inds.length === 0) {
    out.push('(sem indicadores apurados)')
    return out
  }
  for (const i of inds) {
    out.push(coluna(` ${i.nome}`, `${i.valor.toFixed(2)} [${(i.semaforo || '').toUpperCase()}]`))
  }
  out.push('')
  return out
}

function secaoDemaisContas(exercicio: string, dadosEx?: any): string[] {
  const out: string[] = []
  const contasExtras = (dadosEx?.contasDinamicas || []) as Array<{
    nome: string
    valor: number
    grupo: string
  }>
  if (!contasExtras || contasExtras.length === 0) return out

  out.push(linhaSeparadora('-'))
  out.push(`DEMAIS CONTAS DAS DEMONSTRACOES — EXERCICIO ${exercicio}`)
  out.push(linhaSeparadora('-'))
  for (const c of contasExtras) {
    const grp = c.grupo ? `[${c.grupo.toUpperCase()}]` : ''
    out.push(coluna(` ${c.nome} ${grp}`.trim(), fmtBRL(c.valor)))
  }
  out.push('')
  return out
}

function secaoModelosAvancados(exercicio: string, adv: any): string[] {
  const out: string[] = []
  out.push(linhaSeparadora('-'))
  out.push(`MODELOS AVANCADOS (FMF) — EXERCICIO ${exercicio}`)
  out.push(linhaSeparadora('-'))
  if (!adv) {
    out.push('(nao apurado)')
    out.push('')
    return out
  }
  if (adv.kanitz) {
    out.push(coluna(' Termometro de Kanitz (K)', adv.kanitz.fatorInsolvencia.toFixed(4)))
    out.push(coluna('   Faixa', adv.kanitz.faixaTexto || adv.kanitz.faixa))
  }
  if (adv.altmanZ1) {
    out.push(coluna(' Altman Z1', adv.altmanZ1.zScore.toFixed(4)))
    out.push(coluna('   Faixa', adv.altmanZ1.faixaTexto || adv.altmanZ1.faixa))
  }
  if (adv.elizabetsky) {
    out.push(coluna(' Elizabetsky (E)', adv.elizabetsky.fator.toFixed(4)))
    out.push(coluna('   Faixa', adv.elizabetsky.faixaTexto || adv.elizabetsky.faixa))
  }
  if (adv.duPont) {
    out.push(
      coluna(
        ' Du Pont (ROA)',
        `${(adv.duPont.retornoAtivo * 100).toFixed(2)}%  (Margem ${(adv.duPont.margemLiquida || 0).toFixed(2)}% x Giro ${(adv.duPont.giroAtivo || 0).toFixed(4)})`,
      ),
    )
    out.push(coluna('   ROE', `${(adv.duPont.retornoPatrimonioLiquido || 0).toFixed(2)}%`))
  }
  if (adv.dinamica) {
    out.push(coluna(' CDG (Fleuriet)', fmtBRL(adv.dinamica.cdg)))
    out.push(coluna(' NCG', fmtBRL(adv.dinamica.ncg)))
    out.push(coluna(' Saldo de Tesouraria', fmtBRL(adv.dinamica.saldoTesouraria)))
    out.push(coluna('   Efeito Tesoura', adv.dinamica.efeitoTesoura ? 'SIM' : 'NAO'))
    out.push(coluna('   Classificacao', adv.dinamica.classificacaoFleuriet || ''))
  }
  out.push('')
  return out
}

export function gerarPdfTextoRelatorio(dados: DadosRelatorioAnaliseAnexos): Uint8Array {
  const L: string[] = []

  L.push(linhaSeparadora())
  L.push(centralizar('ADECONT - ASSESSORIA CONTABIL E ADMINISTRATIVA'))
  L.push(centralizar('Portal Panorama RT - Modulo de Analises Empresariais'))
  L.push(linhaSeparadora())
  L.push(centralizar(dados.titulo.toUpperCase()))
  L.push('')
  L.push(coluna(' Empresa: ', dados.empresaNome))
  L.push(coluna(' Documento: ', dados.empresaDoc || `(vinculo por codigo ${dados.clienteCodigo})`))
  L.push(coluna(' Codigo do cliente: ', String(dados.clienteCodigo)))
  L.push(coluna(' Data de emissao: ', dados.dataEmissao))
  L.push(coluna(' Exercicios utilizados: ', dados.exercicios.map((e) => e.exercicio).join(', ')))
  for (const e of dados.exercicios) {
    L.push(
      coluna(
        `   ${e.exercicio}: `,
        e.periodoEncerrado
          ? `data-base ${e.dataBase} (periodo ENCERRADO - nao e exercicio completo)`
          : `data-base ${e.dataBase}`,
      ),
    )
  }
  L.push('')

  for (const e of dados.exercicios) {
    L.push(...secaoIndicadoresClássicos(e.exercicio, dados.classicosPorExercicio[e.exercicio]))
    L.push(...secaoModelosAvancados(e.exercicio, dados.avancadosPorExercicio[e.exercicio]))
    if (dados.dadosPorExercicio?.[e.exercicio]) {
      L.push(...secaoDemaisContas(e.exercicio, dados.dadosPorExercicio[e.exercicio]))
    }
  }

  if (dados.parecerTexto && dados.parecerTexto.trim()) {
    L.push(linhaSeparadora('-'))
    L.push('PARECER / OBSERVACOES (espaco para texto livre do analista)')
    L.push(linhaSeparadora('-'))
    for (const l of quebrar(dados.parecerTexto.trim())) L.push(' ' + l)
    L.push('')
  } else {
    L.push(linhaSeparadora('-'))
    L.push('PARECER / OBSERVACOES')
    L.push(linhaSeparadora('-'))
    L.push(' ________________________________________________ ')
    L.push(' ________________________________________________ ')
    L.push(' ________________________________________________ ')
    L.push('')
  }

  L.push(linhaSeparadora('-'))
  L.push(
    centralizar(
      'Documento complementar ao cadastro da cliente - gerado automaticamente pelo Panorama RT',
    ),
  )
  L.push(linhaSeparadora('-'))

  const texto = L.join('\n')

  // ── Envelope PDF mínimo (fonte Helvetica, texto em múltiplas linhas) ──
  const escapar = (s: string) =>
    s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')

  const conteudoFinal = L.map(
    (l, i) => `BT /F1 8 Tf 40 ${792 - 40 - i * 9} Td (${escapar(l)}) Tj ET`,
  ).join('\n')

  const objetos: string[] = []
  objetos.push('<< /Type /Catalog /Pages 2 0 R >>')
  objetos.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
  objetos.push(
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
  )
  objetos.push(`<< /Length ${conteudoFinal.length} >>\nstream\n${conteudoFinal}\nendstream`)
  objetos.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []
  objetos.forEach((obj, i) => {
    offsets.push(pdf.length)
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`
  })
  const xrefPos = pdf.length
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`
  for (const off of offsets) {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`

  const bytes = new Uint8Array(pdf.length)
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff
  return bytes
}
