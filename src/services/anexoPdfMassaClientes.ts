/**
 * SERVIÇO DE ANEXO DE PDFs EM MASSA AOS CLIENTES
 * ===============================================
 * Sistema ADECONT — Projeto Panorama
 *
 * Persistência pela MESMA coleção/serviço do anexo individual:
 * coleção `cliente_arquivos` via `uploadArquivoCliente` (clienteDadosComplementaresService).
 *
 * Regras:
 *  - Limite unificado do sistema: 10.000 arquivos por lote (mesmo padrão de
 *    UploadNfeLote / ParametrizadorLote);
 *  - Tipos aceitos: somente PDF;
 *  - Identificação do cliente por CNPJ/CPF no nome do arquivo (com ou sem
 *    máscara) ou por código de cliente (ex.: COD94109);
 *  - Duplicidade: arquivo com MESMO título já anexado ao mesmo cliente é
 *    IGNORADO (não duplica) e reportado no resumo.
 */
import {
  listarArquivosCliente,
  uploadArquivoCliente,
} from '@/services/clienteDadosComplementaresService'

export const LIMITE_MAXIMO_ANEXO_MASSA = 10000

export type StatusItemAnexoMassa =
  | 'pendente' // aguardando definição de cliente na revisão
  | 'pronto' // cliente definido, pronto para processar
  | 'sem_cliente' // processado e sem cliente correspondente
  | 'enviando'
  | 'anexado'
  | 'duplicado' // mesmo título já anexado ao mesmo cliente
  | 'falha'

export interface AlvoClienteMassa {
  codigo: number
  razao_social: string
  documento_limpo: string
}

export interface ItemAnexoMassa {
  id: string
  file: File
  nomeOriginal: string
  titulo: string
  categoria: string
  observacao: string
  cliente: AlvoClienteMassa | null
  autoIdentificado: boolean
  pista?: string // como o cliente foi identificado
  status: StatusItemAnexoMassa
  motivo?: string
}

export interface ResumoAnexoMassa {
  anexados: number
  duplicados: number
  pendentes: number
  falhas: number
  itens: ItemAnexoMassa[]
}

/** Dados mínimos de cliente usados para o índice de identificação */
export interface ClienteParaIndice {
  id?: string | number
  codigo: number
  razao_social?: string
  nome?: string
  documento_limpo?: string
  numero_documento?: string
}

/** Índice de clientes por documento (CNPJ/CPF sem máscara) e por código */
export interface IndiceClientes {
  porDocumento: Map<string, ClienteParaIndice>
  porCodigo: Map<string, ClienteParaIndice>
}

export function construirIndiceClientes(clientes: ClienteParaIndice[]): IndiceClientes {
  const porDocumento = new Map<string, ClienteParaIndice>()
  const porCodigo = new Map<string, ClienteParaIndice>()
  for (const c of clientes) {
    const doc = (c.documento_limpo || c.numero_documento || '').replace(/\D/g, '')
    if (doc) porDocumento.set(doc, c)
    if (c.codigo != null) porCodigo.set(String(c.codigo), c)
  }
  return { porDocumento, porCodigo }
}

/** Extrai possíveis chaves de cliente (documentos e código) do nome do arquivo */
export function extrairChavesDeNomeArquivo(nome: string): {
  documentos: string[]
  codigo: number | null
} {
  const documentos = new Set<string>()

  // CNPJ: 12.345.678/0001-90 (com máscara, separadores . / - ou nada)
  const cnpjComMascara = nome.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/)
  if (cnpjComMascara) documentos.add(cnpjComMascara[0].replace(/\D/g, ''))

  // CPF: 123.456.789-09 (com máscara)
  const cpfComMascara = nome.match(/\d{3}\.\d{3}\.\d{3}-\d{2}/)
  if (cpfComMascara) documentos.add(cpfComMascara[0].replace(/\D/g, ''))

  // Sem máscara: apenas sequências longas de dígitos (evita confundir datas/anos)
  const digitos = nome.match(/\d{11,14}/g) || []
  for (const seq of digitos) {
    if (seq.length === 11 || seq.length === 14) documentos.add(seq)
    // CNPJ às vezes vem sem os 4 dígitos finais da filial... não inferir.
  }

  // Código do cliente: COD94109, cod-94109, Código 94109
  const codigoMatch = nome.match(/cod[a-zç]*\s*[-_]?\s*(\d{1,9})/i)
  const codigo = codigoMatch ? parseInt(codigoMatch[1], 10) : null

  return { documentos: Array.from(documentos), codigo }
}

/** Identifica o cliente de destino a partir do nome do arquivo */
export function identificarClientePorNome(
  nome: string,
  indice: IndiceClientes,
): { cliente: AlvoClienteMassa | null; pista: string } {
  const { documentos, codigo } = extrairChavesDeNomeArquivo(nome)

  // 1) Documento (CNPJ/CPF) tem prioridade
  for (const doc of documentos) {
    const c = indice.porDocumento.get(doc)
    if (c) {
      const tipo = doc.length === 14 ? 'CNPJ' : 'CPF'
      return { cliente: alvoDe(c), pista: `${tipo} no nome do arquivo` }
    }
  }

  // 2) Código de cliente
  if (codigo != null) {
    const c = indice.porCodigo.get(String(codigo))
    if (c) {
      return { cliente: alvoDe(c), pista: `código de cliente no nome do arquivo` }
    }
  }

  return { cliente: null, pista: '' }
}

function alvoDe(c: ClienteParaIndice): AlvoClienteMassa {
  return {
    codigo: c.codigo,
    razao_social: c.razao_social || c.nome || `Cliente ${c.codigo}`,
    documento_limpo: (c.documento_limpo || c.numero_documento || '').replace(/\D/g, ''),
  }
}

/** Título padrão do anexo: nome do arquivo sem a extensão .pdf */
export function tituloPadraoDoArquivo(file: File): string {
  return file.name.replace(/\.pdf$/i, '')
}

/** Filtro de tipos aceitos: somente PDF */
export function filtrarPdfsValidos(arquivos: File[]): {
  validos: File[]
  rejeitados: { nome: string; motivo: string }[]
} {
  const validos: File[] = []
  const rejeitados: { nome: string; motivo: string }[] = []
  for (const f of arquivos) {
    const ehPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name)
    if (ehPdf) {
      validos.push(f)
    } else {
      rejeitados.push({
        nome: f.name,
        motivo: 'Formato não suportado — aceitos apenas arquivos PDF.',
      })
    }
  }
  return { validos, rejeitados }
}

/**
 * Processa a lista de itens sequencialmente (sem travar a interface):
 *  - item sem cliente → pendência (status `sem_cliente`), não anexa;
 *  - título já anexado ao mesmo cliente → `duplicado`, ignora;
 *  - falha no upload → `falha` com motivo;
 *  - sucesso → `anexado`.
 */
export async function processarAnexosEmMassa(
  itens: ItemAnexoMassa[],
  callbacks?: {
    onItemAtualizado?: (item: ItemAnexoMassa) => void
    onProgresso?: (concluidos: number, total: number) => void
  },
): Promise<ResumoAnexoMassa> {
  const resumo: ResumoAnexoMassa = {
    anexados: 0,
    duplicados: 0,
    pendentes: 0,
    falhas: 0,
    itens: [],
  }

  let concluidos = 0
  const total = itens.length

  for (const item of itens) {
    // Sem cliente: pendência, não anexa e não trava os demais
    if (!item.cliente) {
      const atualizado: ItemAnexoMassa = {
        ...item,
        status: 'sem_cliente',
        motivo: 'Nenhum cliente correspondente encontrado no nome do arquivo.',
      }
      resumo.pendentes++
      resumo.itens.push(atualizado)
      callbacks?.onItemAtualizado?.(atualizado)
      concluidos++
      callbacks?.onProgresso?.(concluidos, total)
      continue
    }

    callbacks?.onItemAtualizado?.({ ...item, status: 'enviando' })

    try {
      // Verificação de duplicidade: mesmo título já anexado ao mesmo cliente
      const existentes = await listarArquivosCliente(
        item.cliente.documento_limpo || String(item.cliente.codigo),
        item.cliente.codigo,
      )
      const jaExiste = existentes.some(
        (a: { titulo?: string }) =>
          (a.titulo || '').trim().toLowerCase() === item.titulo.trim().toLowerCase(),
      )

      if (jaExiste) {
        const atualizado: ItemAnexoMassa = {
          ...item,
          status: 'duplicado',
          motivo: 'Já existe anexo com este título para este cliente.',
        }
        resumo.duplicados++
        resumo.itens.push(atualizado)
        callbacks?.onItemAtualizado?.(atualizado)
      } else {
        await uploadArquivoCliente({
          clienteCnpj: item.cliente.documento_limpo,
          clienteCodigo: item.cliente.codigo,
          titulo: item.titulo,
          file: item.file,
          categoria: item.categoria || 'Contrato',
          observacao: item.observacao || undefined,
        })
        const atualizado: ItemAnexoMassa = {
          ...item,
          status: 'anexado',
          motivo: undefined,
        }
        resumo.anexados++
        resumo.itens.push(atualizado)
        callbacks?.onItemAtualizado?.(atualizado)
      }
    } catch (e: any) {
      const atualizado: ItemAnexoMassa = {
        ...item,
        status: 'falha',
        motivo: e?.message || 'Falha ao gravar o anexo no servidor.',
      }
      resumo.falhas++
      resumo.itens.push(atualizado)
      callbacks?.onItemAtualizado?.(atualizado)
    }

    concluidos++
    callbacks?.onProgresso?.(concluidos, total)
  }

  return resumo
}
