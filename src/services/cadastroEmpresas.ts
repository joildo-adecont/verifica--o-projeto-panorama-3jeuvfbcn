import pb from '@/lib/pocketbase/client'
import { EmpresaRecord } from '@/types/cadastroEmpresas'

export interface FiltrosEmpresas {
  busca?: string
  tipoDocumento?: string // 'TODOS' | 'CNPJ' | 'CPF' | 'CEI' | 'CAEPF' | 'SEM_DOC'
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

/**
 * Consulta registros da coleção `cadastro_empresas` no PocketBase.
 */
export async function listarEmpresas(
  filtros: FiltrosEmpresas = {},
): Promise<ResultadoListaEmpresas> {
  const page = filtros.pagina && filtros.pagina > 0 ? filtros.pagina : 1
  const perPage = filtros.porPagina && filtros.porPagina > 0 ? filtros.porPagina : 25

  const conditions: string[] = []

  if (filtros.busca && filtros.busca.trim()) {
    const q = filtros.busca.trim().replace(/['"\\]/g, '')
    const numLimpo = q.replace(/\D/g, '')

    const subConds: string[] = [
      `razao_social ~ '${q}'`,
      `apelido ~ '${q}'`,
      `numero_documento ~ '${q}'`,
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

  const filterString = conditions.join(' && ')

  try {
    const res = await pb.collection('cadastro_empresas').getList(page, perPage, {
      filter: filterString || undefined,
      sort: 'codigo',
    })

    return {
      items: res.items.map((r: any) => ({
        codigo: r.codigo,
        tipo_documento: r.tipo_documento || '',
        numero_documento: r.numero_documento || '',
        documento_limpo: r.documento_limpo || '',
        razao_social: r.razao_social || '',
        apelido: r.apelido || '',
        data_inscricao: r.data_inscricao || '',
        inscricao_estadual: r.inscricao_estadual || '',
        inscricao_suframa: r.inscricao_suframa || '',
        pagina: r.pagina || 0,
      })),
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
    return {
      codigo: res.codigo,
      tipo_documento: res.tipo_documento || '',
      numero_documento: res.numero_documento || '',
      documento_limpo: res.documento_limpo || '',
      razao_social: res.razao_social || '',
      apelido: res.apelido || '',
      data_inscricao: res.data_inscricao || '',
      inscricao_estadual: res.inscricao_estadual || '',
      inscricao_suframa: res.inscricao_suframa || '',
      pagina: res.pagina || 0,
    }
  } catch (err) {
    return null
  }
}
