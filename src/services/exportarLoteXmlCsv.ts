/**
 * Utilitário para extração de metadados em memória de XMLs de NF-e e
 * geração de arquivos CSV compatíveis com Excel (UTF-8 com BOM, delimitador ';').
 */

export interface ItemLoteExportacao {
  nomeArquivo: string
  statusFormatado: string
  chaveAcesso?: string
  numero?: string
  serie?: string
  naturezaOperacao?: string
  direcao?: string // 'Entrada' | 'Saída' | 'Mista' | 'Não identificada'
  tipoOperacao?: string // 'Compra' | 'Venda'
  emitenteNome?: string
  emitenteDoc?: string
  destinatarioNome?: string
  destinatarioDoc?: string
  dataEmissao?: string
  quantidadeItens?: number
  valorTotal?: number
  motivoErro?: string
}

/**
 * Escapa strings para formato CSV:
 * - Se contiver aspas, ponto-e-vírgula ou quebras de linha, envolve em aspas duplas dobrando aspas internas.
 * - Converte quebras de linha em espaço simples para não quebrar linhas no Excel.
 */
export function escaparCampoCsv(valor: unknown): string {
  if (valor === null || valor === undefined) return '""'
  const s = String(valor)
    .replace(/"/g, '""')
    .replace(/\r\n|\n|\r/g, ' ')
    .trim()
  return `"${s}"`
}

/**
 * Formata número no padrão monetário / numérico brasileiro (vírgula como decimal)
 */
export function formatarNumeroBr(valor: number | undefined | null): string {
  if (valor === undefined || valor === null || isNaN(Number(valor))) return ''
  return Number(valor).toFixed(2).replace('.', ',')
}

/**
 * Extrai tags básicas de um XML de NFe sem precisar de bibliotecas externas pesadas.
 */
export function extrairMetadadosNfeXml(xml: string): Partial<ItemLoteExportacao> {
  if (!xml || typeof xml !== 'string' || xml.indexOf('<') < 0) {
    return {}
  }

  const extrairTag = (conteudo: string, tag: string): string => {
    const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i')
    const m = re.exec(conteudo)
    return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : ''
  }

  const extrairTodasTags = (conteudo: string, tag: string): string[] => {
    const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'gi')
    const out: string[] = []
    let m: RegExpExecArray | null
    while ((m = re.exec(conteudo)) !== null) {
      out.push(m[1])
    }
    return out
  }

  // Chave de acesso: <infNFe Id="NFe...">
  let chaveAcesso = ''
  const mChave = /<infNFe[^>]*\sId="([^"]*)"/i.exec(xml)
  if (mChave) {
    chaveAcesso = mChave[1].replace(/^NFe/i, '').replace(/\D/g, '')
  }

  const ide = extrairTag(xml, 'ide')
  const emit = extrairTag(xml, 'emit')
  const dest = extrairTag(xml, 'dest')
  const total = extrairTag(xml, 'total')
  const icmsTot = extrairTag(total, 'ICMSTot')

  const numero = extrairTag(ide, 'nNF')
  const serie = extrairTag(ide, 'serie')
  const natOp = extrairTag(ide, 'natOp')
  const tpNF = extrairTag(ide, 'tpNF') // 0 = Entrada, 1 = Saída
  let dhEmi = extrairTag(ide, 'dhEmi') || extrairTag(ide, 'dEmi')
  if (dhEmi) {
    dhEmi = dhEmi.slice(0, 19).replace('T', ' ')
  }

  const emitCnpj = extrairTag(emit, 'CNPJ') || extrairTag(emit, 'CPF')
  const emitNome = extrairTag(emit, 'xNome')

  const destCnpj = extrairTag(dest, 'CNPJ') || extrairTag(dest, 'CPF')
  const destNome = extrairTag(dest, 'xNome')

  // Itens e CFOP
  const dets = extrairTodasTags(xml, 'det')
  let qtdItens = dets.length
  let cfopPredominante = ''

  let contEntrada = 0
  let contSaida = 0

  for (const d of dets) {
    const prod = extrairTag(d, 'prod')
    const cfop = extrairTag(prod, 'CFOP').replace(/\D/g, '')
    if (!cfopPredominante && cfop) {
      cfopPredominante = cfop
    }
    const primeiroDigito = cfop.charAt(0)
    if (primeiroDigito === '1' || primeiroDigito === '2' || primeiroDigito === '3') {
      contEntrada++
    } else if (primeiroDigito === '5' || primeiroDigito === '6' || primeiroDigito === '7') {
      contSaida++
    }
  }

  // Direção pela regra fiscal do CFOP e tpNF
  let direcao = ''
  if (contEntrada > 0 && contSaida === 0) {
    direcao = 'Entrada'
  } else if (contSaida > 0 && contEntrada === 0) {
    direcao = 'Saída'
  } else if (contEntrada > 0 && contSaida > 0) {
    direcao = 'Mista'
  } else if (tpNF === '0') {
    direcao = 'Entrada'
  } else if (tpNF === '1') {
    direcao = 'Saída'
  }

  // Tipo Operação (Compra / Venda)
  let tipoOperacao = ''
  if (direcao === 'Entrada') {
    tipoOperacao = 'Compra'
  } else if (direcao === 'Saída') {
    tipoOperacao = 'Venda'
  }

  // Valor total da NFe
  let valorTotal: number | undefined
  const vNFStr = extrairTag(icmsTot, 'vNF') || extrairTag(total, 'vNF')
  if (vNFStr) {
    const parsed = parseFloat(vNFStr.replace(',', '.'))
    if (!isNaN(parsed)) {
      valorTotal = parsed
    }
  }

  return {
    chaveAcesso,
    numero,
    serie,
    naturezaOperacao: natOp,
    direcao,
    tipoOperacao,
    emitenteNome: emitNome,
    emitenteDoc: emitCnpj,
    destinatarioNome: destNome,
    destinatarioDoc: destCnpj,
    dataEmissao: dhEmi,
    quantidadeItens: qtdItens > 0 ? qtdItens : undefined,
    valorTotal,
  }
}

/**
 * Constrói o conteúdo CSV completo com cabeçalho padrão e linhas de dados.
 */
export function gerarCsvLoteXml(itens: ItemLoteExportacao[]): string {
  const colunas = [
    'Nome do Arquivo',
    'Status',
    'Chave de Acesso',
    'Número NFe',
    'Série',
    'Natureza da Operação',
    'Direção',
    'Tipo (Compra/Venda)',
    'Emitente (Razão Social)',
    'Emitente (CNPJ/CPF)',
    'Destinatário (Razão Social)',
    'Destinatário (CNPJ/CPF)',
    'Data de Emissão',
    'Quantidade de Itens',
    'Valor Total (R$)',
    'Mensagem / Motivo',
  ]

  const linhas: string[] = []
  linhas.push(colunas.map(escaparCampoCsv).join(';'))

  for (const item of itens) {
    const linha = [
      escaparCampoCsv(item.nomeArquivo || ''),
      escaparCampoCsv(item.statusFormatado || ''),
      escaparCampoCsv(item.chaveAcesso || ''),
      escaparCampoCsv(item.numero || ''),
      escaparCampoCsv(item.serie || ''),
      escaparCampoCsv(item.naturezaOperacao || ''),
      escaparCampoCsv(item.direcao || ''),
      escaparCampoCsv(item.tipoOperacao || ''),
      escaparCampoCsv(item.emitenteNome || ''),
      escaparCampoCsv(item.emitenteDoc || ''),
      escaparCampoCsv(item.destinatarioNome || ''),
      escaparCampoCsv(item.destinatarioDoc || ''),
      escaparCampoCsv(item.dataEmissao || ''),
      escaparCampoCsv(item.quantidadeItens !== undefined ? String(item.quantidadeItens) : ''),
      escaparCampoCsv(item.valorTotal !== undefined ? formatarNumeroBr(item.valorTotal) : ''),
      escaparCampoCsv(item.motivoErro || ''),
    ]
    linhas.push(linha.join(';'))
  }

  // BOM UTF-8 (\uFEFF) para garantir abertura automática no Microsoft Excel brasileiro
  return '\uFEFF' + linhas.join('\r\n')
}

/**
 * Dispara o download de um arquivo CSV gerado no navegador via Blob temporário.
 */
export function baixarArquivoCsv(conteudoCsv: string, nomeArquivo: string): void {
  const blob = new Blob([conteudoCsv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', nomeArquivo)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
