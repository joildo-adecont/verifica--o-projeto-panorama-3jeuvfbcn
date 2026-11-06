/**
 * LEITURA DE BALANCETE EM PDF — no navegador
 * ===========================================
 * Os documentos contábeis do cliente chegam em PDF, e o backend NÃO consegue
 * lê-los: o runtime do PocketBase não expõe zlib nem executa processos (testado
 * com `$os.exec` e `$os.cmd` — os dois devolvem a própria string de comando).
 * Além disso, os PDFs do sistema contábil usam fonte **Type0 / Identity-H**, em
 * que cada glifo é um CID — sem o mapa `ToUnicode`, o arquivo é ilegível por
 * qualquer leitura direta de bytes.
 *
 * A solução honesta é ler no NAVEGADOR, com pdf.js, que já traz o decodificador
 * completo, e mandar o TEXTO para o servidor. É o único lugar do fluxo onde a
 * extração é confiável.
 *
 * ── POR QUE O TEXTO EXTRAÍDO AINDA PRECISA DE TRATAMENTO ──
 * pdf.js devolve os itens na ordem do desenho, não na ordem das colunas. Um
 * balancete tem 6 colunas alinhadas por posição (código, descrição, saldo
 * anterior, débito, crédito, saldo atual) — ler os itens em sequência crua
 * embaralharia os valores. Por isso reconstruímos as LINHAS pela coordenada Y
 * e, dentro de cada linha, ordenamos por X. Só então a linha pode ser
 * interpretada pelo mesmo parser que o servidor usa.
 */

import * as pdfjsLib from 'pdfjs-dist'

/* O worker sai do próprio pacote. Sem `?url` o Vite tenta empacotar o worker
   como módulo e o navegador falha ao instanciá-lo em produção. */
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

export interface ContaPDF {
  codigo: string
  descricao: string
  saldo_anterior: number
  debito: number
  credito: number
  saldo_atual: number
  natureza: 'devedora' | 'credora' | ''
}

export interface ResultadoPDF {
  texto: string
  linhas: string[]
  empresa: string
  cnpj: string
  periodo: string
  competencia: string
  paginas: number
  caracteres: number
}

/** Converte "1.994.882,26D" em número + natureza. */
export function valorBR(tok: string): { valor: number; natureza: 'devedora' | 'credora' | '' } {
  let t = String(tok || '').trim()
  let natureza: 'devedora' | 'credora' | '' = ''
  if (t.endsWith('D')) {
    natureza = 'devedora'
    t = t.slice(0, -1)
  } else if (t.endsWith('C')) {
    natureza = 'credora'
    t = t.slice(0, -1)
  }
  t = t.replace(/\./g, '').replace(',', '.')
  const v = parseFloat(t)
  return { valor: isNaN(v) ? 0 : Math.round(v * 100) / 100, natureza }
}

const EH_VALOR = /^-?[\d.]+,\d{2}[DC]?$/

/**
 * Extrai o texto do PDF reconstruindo linhas por coordenada.
 *
 * A tolerância de 2 pontos agrupa itens que estão na mesma linha visual — o
 * suficiente para separar as linhas do balancete e pequeno o bastante para não
 * juntar duas linhas vizinhas (a entrelinha do relatório é ~11 pontos).
 */
export async function extrairTextoPDF(arquivo: File): Promise<ResultadoPDF> {
  const buffer = await arquivo.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise

  const linhasVisuais: string[] = []

  for (let p = 1; p <= pdf.numPages; p++) {
    const pagina = await pdf.getPage(p)
    const conteudo = await pagina.getTextContent()

    /* agrupa por Y arredondado; pdf.js usa origem embaixo, então Y maior = topo */
    const porLinha = new Map<number, { x: number; texto: string }[]>()

    for (const item of conteudo.items as any[]) {
      if (!item.str || !item.str.trim()) continue
      const y = Math.round(item.transform[5] / 2) * 2
      const x = item.transform[4]

      /* procura uma linha próxima (tolerância de 2pt) */
      let chave = y
      for (const k of porLinha.keys()) {
        if (Math.abs(k - y) <= 2) {
          chave = k
          break
        }
      }
      if (!porLinha.has(chave)) porLinha.set(chave, [])
      porLinha.get(chave)!.push({ x, texto: item.str })
    }

    const ordenadas = [...porLinha.entries()].sort((a, b) => b[0] - a[0])

    for (const [, itens] of ordenadas) {
      const linha = itens
        .sort((a, b) => a.x - b.x)
        .map((i) => i.texto)
        /* pdf.js às vezes separa "1.994.882,26" e "D"; o join sem espaço
           preserva o sufixo colado que o parser espera */
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (linha) linhasVisuais.push(linha)
    }
  }

  const texto = linhasVisuais.join('\n')

  /* cabeçalho: Empresa / CNPJ / Período */
  let empresa = ''
  let cnpj = ''
  let periodo = ''

  for (const L of linhasVisuais) {
    if (!empresa && L.includes('Empresa:')) {
      empresa = L.split('Empresa:')[1].split('Folha:')[0].trim()
    }
    if (!cnpj && L.includes('C.N.P.J.')) {
      cnpj = L.split('C.N.P.J.:')[1].replace(/\D/g, '')
    }
    if (!periodo && /Per[ií]odo:/.test(L)) {
      periodo = L.split(/Per[ií]odo:/)[1].trim()
    }
  }

  let competencia = ''
  const m = periodo.match(/(\d{2})\/(\d{2})\/(\d{4})\s*-\s*(\d{2})\/(\d{2})\/(\d{4})/)
  if (m) competencia = `${m[6]}-${m[5]}`

  return {
    texto,
    linhas: linhasVisuais,
    empresa,
    cnpj,
    periodo,
    competencia,
    paginas: pdf.numPages,
    caracteres: texto.length,
  }
}

/**
 * Interpreta as linhas e devolve as contas.
 * Mesma regra do servidor: ancora nos QUATRO últimos valores da linha.
 */
export function lerContas(linhas: string[]): ContaPDF[] {
  const contas: ContaPDF[] = []

  for (const bruta of linhas) {
    const limpa = bruta.trim()
    if (!limpa) continue
    if (limpa.startsWith('Sistema licenciado')) continue
    if (limpa.startsWith('Empresa:')) continue
    if (limpa.startsWith('C.N.P.J.')) continue
    if (/^Per[ií]odo:/.test(limpa)) continue
    if (limpa.startsWith('Código Descrição')) continue
    if (limpa.includes('BALANCETE') && !limpa.includes('Código')) continue

    const campos = limpa.split(/\s+/)
    if (campos.length < 6) continue

    const u = campos.slice(-4)
    if (!u.every((t) => EH_VALOR.test(t))) continue

    const cabeca = campos.slice(0, -4)
    if (cabeca.length < 2) continue

    const codigo = cabeca[0]
    if (!/^\d{1,9}$/.test(codigo)) continue

    const descricao = cabeca.slice(1).join(' ').replace(/\s+/g, ' ').trim()
    if (!descricao) continue

    const sa = valorBR(u[0])
    const db = valorBR(u[1])
    const cr = valorBR(u[2])
    const at = valorBR(u[3])

    contas.push({
      codigo,
      descricao,
      saldo_anterior: sa.valor,
      debito: db.valor,
      credito: cr.valor,
      saldo_atual: at.valor,
      natureza: at.natureza,
    })
  }

  return contas
}
