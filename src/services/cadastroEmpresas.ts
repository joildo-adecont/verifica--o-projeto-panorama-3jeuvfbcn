import pb from '@/lib/pocketbase/client'
import { EmpresaRecord } from '@/types/cadastroEmpresas'

export interface FiltrosEmpresas {
  busca?: string
  tipoDocumento?: string // 'TODOS' | 'CNPJ' | 'CPF' | 'CEI' | 'CAEPF' | 'SEM_DOC'
  situacao?: string // 'TODOS' | 'Ativa' | 'Inativa'
  ordenacao?: 'codigo-asc' | 'codigo-desc' | 'nome-asc' | 'nome-desc'
  pagina?: number
  porPagina?: number
}

export interface ResultadoListaEmpresas {
  items: EmpresaRecord[]
  totalItems: number
  totalPages: number
  page: number
  perPage: number
}

function mapearRegistro(r: any): EmpresaRecord {
  return {
    id: r.id,
    codigo: Number(r.codigo) || 0,
    tipo_documento: r.tipo_documento || '',
    numero_documento: r.numero_documento || '',
    documento_limpo: r.documento_limpo || '',
    razao_social: r.razao_social || r.nome || '',
    nome: r.nome || '',
    apelido: r.apelido || '',
    nome_fantasia: r.nome_fantasia || '',
    situacao: r.situacao || 'Ativa',
    natureza_juridica: r.natureza_juridica || '',
    cnae: r.cnae || '',
    cnae_divisao: r.cnae_divisao || '',
    ramo_atividade: r.ramo_atividade || '',
    inicio_atividades: r.inicio_atividades || '',
    cliente_desde: r.cliente_desde || '',
    tipo_endereco: r.tipo_endereco || '',
    endereco: r.endereco || '',
    numero_endereco: r.numero_endereco || '',
    bairro: r.bairro || '',
    complemento: r.complemento || '',
    municipio: r.municipio || '',
    uf: r.uf || '',
    cep: r.cep || '',
    pais: r.pais || '',
    telefone: r.telefone || '',
    fax: r.fax || '',
    email: r.email || '',
    pagina_internet: r.pagina_internet || '',
    data_inscricao: r.data_inscricao || '',
    inscricao_estadual: r.inscricao_estadual || '',
    inscricao_municipal: r.inscricao_municipal || '',
    inscricao_junta_comercial: r.inscricao_junta_comercial || '',
    inscricao_suframa: r.inscricao_suframa || '',
    capital_social: r.capital_social || '',
    contador: r.contador || '',
    responsavel_legal: r.responsavel_legal || '',
    foro_comarca: r.foro_comarca || '',
    duracao_contrato: r.duracao_contrato || '',
    pagina: r.pagina || 0,
    created: r.created,
    updated: r.updated,
  }
}

/**
 * Consulta registros da coleção `cadastro_empresas` no PocketBase com paginação e filtros.
 */
export async function listarEmpresas(
  filtros: FiltrosEmpresas = {},
): Promise<ResultadoListaEmpresas> {
  const page = filtros.pagina && filtros.pagina > 0 ? filtros.pagina : 1
  const perPage = filtros.porPagina && filtros.porPagina > 0 ? filtros.porPagina : 50

  const conditions: string[] = []

  if (filtros.busca && filtros.busca.trim()) {
    const q = filtros.busca.trim().replace(/['"\\]/g, '')
    const numLimpo = q.replace(/\D/g, '')

    const subConds: string[] = [
      `razao_social ~ '${q}'`,
      `nome ~ '${q}'`,
      `apelido ~ '${q}'`,
      `nome_fantasia ~ '${q}'`,
      `numero_documento ~ '${q}'`,
      `municipio ~ '${q}'`,
      `ramo_atividade ~ '${q}'`,
      `cnae ~ '${q}'`,
    ]

    if (/^\d+$/.test(q)) {
      subConds.push(`codigo = ${parseInt(q, 10)}`)
    }

    if (numLimpo.length >= 3) {
      subConds.push(`documento_limpo ~ '${numLimpo}'`)
    }

    conditions.push(`(${subConds.join(' || ')})`)
  }

  if (filtros.tipoDocumento && filtros.tipoDocumento !== 'TODOS') {
    if (filtros.tipoDocumento === 'SEM_DOC') {
      conditions.push(`(numero_documento = '' || numero_documento = null)`)
    } else {
      conditions.push(`tipo_documento = '${filtros.tipoDocumento}'`)
    }
  }

  if (filtros.situacao && filtros.situacao !== 'TODOS') {
    conditions.push(`situacao ~ '${filtros.situacao}'`)
  }

  let sort = 'codigo'
  if (filtros.ordenacao === 'codigo-desc') sort = '-codigo'
  else if (filtros.ordenacao === 'nome-asc') sort = 'razao_social'
  else if (filtros.ordenacao === 'nome-desc') sort = '-razao_social'

  const filterString = conditions.join(' && ')

  try {
    const res = await pb.collection('cadastro_empresas').getList(page, perPage, {
      filter: filterString || undefined,
      sort,
    })

    return {
      items: res.items.map(mapearRegistro),
      totalItems: res.totalItems,
      totalPages: res.totalPages,
      page: res.page,
      perPage: res.perPage,
    }
  } catch (err) {
    console.error('Erro ao listar empresas do PocketBase:', err)
    return {
      items: [],
      totalItems: 0,
      totalPages: 0,
      page,
      perPage,
    }
  }
}

/**
 * Busca detalhe de um cliente por código
 */
export async function obterEmpresaPorCodigo(codigo: number): Promise<EmpresaRecord | null> {
  try {
    const res = await pb.collection('cadastro_empresas').getFirstListItem(`codigo = ${codigo}`)
    return mapearRegistro(res)
  } catch (err) {
    return null
  }
}

/**
 * Busca todos os registros correspondentes aos filtros informados (até um limite seguro, ex.: 1500)
 * para emissão do relatório A4 impresso/PDF completo da consulta atual.
 */
export async function listarEmpresasParaRelatorio(
  filtros: FiltrosEmpresas = {},
  limite: number = 1000,
): Promise<EmpresaRecord[]> {
  const conditions: string[] = []

  if (filtros.busca && filtros.busca.trim()) {
    const q = filtros.busca.trim().replace(/['"\\]/g, '')
    const numLimpo = q.replace(/\D/g, '')

    const subConds: string[] = [
      `razao_social ~ '${q}'`,
      `nome ~ '${q}'`,
      `apelido ~ '${q}'`,
      `nome_fantasia ~ '${q}'`,
      `numero_documento ~ '${q}'`,
      `municipio ~ '${q}'`,
      `ramo_atividade ~ '${q}'`,
      `cnae ~ '${q}'`,
    ]

    if (/^\d+$/.test(q)) {
      subConds.push(`codigo = ${parseInt(q, 10)}`)
    }

    if (numLimpo.length >= 3) {
      subConds.push(`documento_limpo ~ '${numLimpo}'`)
    }

    conditions.push(`(${subConds.join(' || ')})`)
  }

  if (filtros.tipoDocumento && filtros.tipoDocumento !== 'TODOS') {
    if (filtros.tipoDocumento === 'SEM_DOC') {
      conditions.push(`(numero_documento = '' || numero_documento = null)`)
    } else {
      conditions.push(`tipo_documento = '${filtros.tipoDocumento}'`)
    }
  }

  if (filtros.situacao && filtros.situacao !== 'TODOS') {
    conditions.push(`situacao ~ '${filtros.situacao}'`)
  }

  let sort = 'codigo'
  if (filtros.ordenacao === 'codigo-desc') sort = '-codigo'
  else if (filtros.ordenacao === 'nome-asc') sort = 'razao_social'
  else if (filtros.ordenacao === 'nome-desc') sort = '-razao_social'

  const filterString = conditions.join(' && ')

  try {
    const items = await pb.collection('cadastro_empresas').getFullList({
      filter: filterString || undefined,
      sort,
      batch: limite,
    })

    return items.map(mapearRegistro)
  } catch (err) {
    console.error('Erro ao listar empresas para relatório:', err)
    return []
  }
}
