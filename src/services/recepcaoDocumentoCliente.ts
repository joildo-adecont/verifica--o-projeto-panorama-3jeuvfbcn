/**
 * SERVIÇO DE RECEPÇÃO DE DOCUMENTO E CRIAÇÃO DE CLIENTE
 * ======================================================
 * Usado na tela /analises-empresariais: recepciona um anexo (contrato social,
 * certidão, procuração etc.) e, a partir dessa recepção:
 * - localiza um cliente existente pelo CNPJ/CPF (documento limpo) OU pela
 *   combinação razão social + NIRE, e apenas VINCULA o documento à ficha dele
 *   (coleção `cliente_arquivos`, via clienteDadosComplementaresService);
 * - ou CRIA um cadastro novo na coleção `cadastro_empresas` quando nada casa,
 *   já com o documento vinculado, disponível na listagem /cadastro-clientes
 *   e no seletor de clientes das análises.
 *
 * Nunca inventa CNPJ: se o documento legível não traz número, o campo fica
 * vazio para preenchimento posterior na ficha do cliente.
 */
import pb from '@/lib/pocketbase/client'
import { mapearRegistro } from '@/services/cadastroEmpresas'
import type { EmpresaRecord } from '@/types/cadastroEmpresas'
import { uploadArquivoCliente, sanitizarDoc } from '@/services/clienteDadosComplementaresService'

export const CATEGORIAS_RECEPCAO = [
  'Contrato',
  'Documento Societário',
  'Procuração',
  'Fiscal',
  'Certidão',
  'Balanço/DRE',
  'Outro',
] as const

export interface DadosRecepcao {
  razaoSocial: string
  cnpjCpf?: string
  nire?: string
  uf?: string
  municipio?: string
  naturezaJuridica?: string
  dataRegistro?: string
  nomeFantasia?: string
  ramoAtividade?: string
}

export interface ResultadoRecepcao {
  cliente: EmpresaRecord
  criado: boolean
  arquivoId?: string
  mensagem: string
}

/** Extrai pistas legíveis do nome do arquivo recepcionado (ex.: "Nire 432...") */
export function extrairPistasDoNomeArquivo(nomeArquivo: string): DadosRecepcao {
  const pistas: DadosRecepcao = { razaoSocial: '' }
  const base = nomeArquivo.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ')

  const mNire = base.match(/nire\s*([0-9]{6,15})/i)
  if (mNire) pistas.nire = mNire[1]

  const mDoc = base.match(/\b(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})\b/)
  if (mDoc) {
    const digitos = mDoc[1].replace(/\D/g, '')
    if (digitos.length === 11 || digitos.length === 14) {
      pistas.cnpjCpf = digitos
    }
  }

  const mUf = base.match(
    /\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/i,
  )
  if (mUf) pistas.uf = mUf[1].toUpperCase()

  return pistas
}

/**
 * Procura cliente existente por documento limpo e, na falta, pela combinação
 * razão social + NIRE (caso de contratos sociais sem CNPJ legível).
 */
export async function localizarClienteExistente(
  dados: DadosRecepcao,
): Promise<EmpresaRecord | null> {
  const docLimpo = sanitizarDoc(dados.cnpjCpf)

  if (docLimpo) {
    try {
      const rec = await pb
        .collection('cadastro_empresas')
        .getFirstListItem(`documento_limpo = "${docLimpo}"`)
      return mapearRegistro(rec)
    } catch {
      /* segue para a busca por nome/NIRE */
    }
  }

  const razao = (dados.razaoSocial || '').trim()
  const nire = (dados.nire || '').replace(/\D/g, '')

  if (razao && nire) {
    const palavras = razao
      .split(/\s+/)
      .filter((p) => p.length > 2)
      .slice(0, 2)
    if (palavras.length) {
      try {
        const filtro = `${palavras.map((p) => `razao_social ~ "${p}"`).join(' && ')} && inscricao_junta_comercial ~ "${nire}"`
        const rec = await pb.collection('cadastro_empresas').getFirstListItem(filtro)
        return mapearRegistro(rec)
      } catch {
        /* nada casou */
      }
    }
  }

  return null
}

/**
 * Cria um cliente novo a partir dos dados recepcionados (sem inventar documento).
 * O código do contribuinte é único por construção — usa o maior código vivo + 1.
 */
export async function criarClienteDaRecepcao(dados: DadosRecepcao): Promise<EmpresaRecord> {
  const limpar = (v?: string) =>
    String(v || '')
      .replace(/\s+/g, ' ')
      .trim()
  const razao = limpar(dados.razaoSocial)
  if (!razao) throw new Error('Razão social obrigatória para criar o cliente.')

  const docLimpo = sanitizarDoc(dados.cnpjCpf)
  const tipoDoc = docLimpo.length === 11 ? 'CPF' : docLimpo.length === 14 ? 'CNPJ' : ''

  let codigo = 1
  try {
    const ultimo = await pb.collection('cadastro_empresas').getList(1, 1, {
      sort: '-codigo',
    })
    const primeiro: any = ultimo.items[0]
    const maior = primeiro ? Number(primeiro.codigo ?? primeiro.get?.('codigo')) || 0 : 0
    codigo = maior + 1
  } catch {
    codigo = Math.floor(Date.now() / 1000) % 100000000
  }

  const payload: Record<string, any> = {
    codigo,
    razao_social: razao,
    nome: razao,
    apelido: limpar(dados.nomeFantasia) || razao.split(/\s+/).slice(0, 2).join(' '),
    tipo_documento: tipoDoc,
    numero_documento: docLimpo,
    documento_limpo: docLimpo,
    documento: docLimpo,
    situacao: 'Ativa',
    natureza_juridica: limpar(dados.naturezaJuridica),
    pais: 'BRASIL',
    uf: limpar(dados.uf).slice(0, 2).toUpperCase(),
    municipio: limpar(dados.municipio),
    nome_fantasia: limpar(dados.nomeFantasia),
    ramo_atividade: limpar(dados.ramoAtividade),
    arquivado: false,
  }
  if (dados.nire) {
    payload.inscricao_junta_comercial = `NIRE ${limpar(dados.nire)}${dados.dataRegistro ? ` — Registro em ${limpar(dados.dataRegistro)}` : ''}`
  }

  const criado = await pb.collection('cadastro_empresas').create(payload)
  return mapearRegistro(criado)
}

/**
 * Fluxo completo de recepção: localiza (ou cria) o cliente e anexa o arquivo
 * à ficha dele na coleção `cliente_arquivos`.
 */
export async function recepcionarDocumentoECriarCliente(params: {
  dados: DadosRecepcao
  file: File
  titulo: string
  categoria?: string
  observacao?: string
}): Promise<ResultadoRecepcao> {
  const { dados, file, titulo, categoria, observacao } = params

  const existente = await localizarClienteExistente(dados)
  const cliente = existente || (await criarClienteDaRecepcao(dados))
  const criado = !existente

  const docVinculo =
    sanitizarDoc(cliente.documento_limpo || cliente.numero_documento) ||
    sanitizarDoc(dados.cnpjCpf) ||
    `COD${cliente.codigo}`

  const anexo = await uploadArquivoCliente({
    clienteCnpj: docVinculo,
    clienteCodigo: cliente.codigo,
    titulo: titulo.trim() || file.name,
    categoria: categoria || 'Contrato',
    file,
    observacao,
    enviadoPor: 'Recepção Análises Empresariais',
  })

  return {
    cliente,
    criado,
    arquivoId: anexo.id,
    mensagem: criado
      ? `Cliente "${cliente.razao_social}" cadastrado (código ${cliente.codigo}) com o documento "${titulo}" vinculado à ficha.`
      : `Cliente "${cliente.razao_social}" já existia — documento "${titulo}" vinculado à ficha existente.`,
  }
}
