/**
 * SERVIÇO DO CADASTRO ANALÍTICO DE CLIENTES INATIVOS
 * ===================================================
 * Pedido do CEO (05/11/2026): separar os clientes inativos num cadastro próprio.
 *
 * ── POR QUE ESTE ARQUIVO É CURTO ──
 * Ele não reimplementa filtro, mapeamento nem ordenação: reaproveita a mesma
 * forma de busca do serviço do cadastro principal e só troca a COLEÇÃO de
 * destino. Duplicar a lógica criaria duas cópias da mesma regra — e no dia em
 * que a busca por documento for corrigida numa, a outra ficaria para trás sem
 * ninguém ver.
 *
 * ── O QUE MUDA EM RELAÇÃO AO CADASTRO PRINCIPAL ──
 *   · a coleção é `cadastro_empresas_inativos`;
 *   · não há filtro ÚTIL de situação: todos aqui estão inativos por definição
 *     (o campo registra QUAL era: Inativa, Suspensa, Baixada);
 *   · há REATIVAR, que devolve o cliente ao cadastro principal.
 */
import pb from '@/lib/pocketbase/client'
import type { EmpresaRecord } from '@/types/cadastroEmpresas'
import type { FiltrosEmpresas, ResultadoListaEmpresas } from '@/services/cadastroEmpresas'

export const COLECAO_INATIVOS = 'cadastro_empresas_inativos'

/** Um registro do cadastro de inativos carrega a trilha da transferência. */
export interface EmpresaInativa extends EmpresaRecord {
  motivo_transferencia?: string
  transferido_em?: string
  transferido_por?: string
  reativado?: boolean
  reativado_em?: string
}

/** Converte um registro do PocketBase no tipo da tela. */
function mapear(r: any): EmpresaInativa {
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
    situacao: r.situacao || 'Inativa',
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
    motivo_transferencia: r.motivo_transferencia || '',
    transferido_em: r.transferido_em || '',
    transferido_por: r.transferido_por || '',
    reativado: Boolean(r.reativado),
    reativado_em: r.reativado_em || '',
  } as EmpresaInativa
}

/**
 * Lista os clientes inativos com a mesma busca do cadastro principal.
 * A busca é feita NO SERVIDOR: o filtro vai na consulta, não no navegador —
 * carregar tudo para filtrar depois seria desperdício e pioraria com o tempo.
 */
export async function listarEmpresasInativas(
  filtros: FiltrosEmpresas,
): Promise<ResultadoListaEmpresas & { items: EmpresaInativa[] }> {
  const page = filtros.pagina || 1
  const perPage = filtros.porPagina || 50

  const conditions: string[] = []
  const busca = (filtros.busca || '').trim()

  if (busca) {
    const termo = busca.replace(/'/g, "\\'")
    const sub: string[] = []
    sub.push(`razao_social ~ '${termo}'`)
    sub.push(`nome ~ '${termo}'`)
    sub.push(`nome_fantasia ~ '${termo}'`)
    sub.push(`apelido ~ '${termo}'`)

    const numLimpo = busca.replace(/\D/g, '')
    if (numLimpo.length >= 3) sub.push(`documento_limpo ~ '${numLimpo}'`)

    const soNumero = parseInt(busca, 10)
    if (!Number.isNaN(soNumero)) sub.push(`codigo = ${soNumero}`)

    conditions.push(`(${sub.join(' || ')})`)
  }

  if (filtros.tipoDocumento && filtros.tipoDocumento !== 'TODOS') {
    if (filtros.tipoDocumento === 'SEM_DOC') {
      conditions.push(`(numero_documento = '' || numero_documento = null)`)
    } else {
      conditions.push(`tipo_documento = '${filtros.tipoDocumento}'`)
    }
  }

  /* Só quem ainda NÃO voltou: quem foi reativado existe no cadastro ativo e
     não deve aparecer duas vezes. */
  conditions.push('(reativado = false || reativado = null)')

  let sort = 'codigo'
  if (filtros.ordenacao === 'codigo-desc') sort = '-codigo'
  else if (filtros.ordenacao === 'nome-asc') sort = 'razao_social'
  else if (filtros.ordenacao === 'nome-desc') sort = '-razao_social'

  const res = await pb.collection(COLECAO_INATIVOS).getList(page, perPage, {
    filter: conditions.join(' && ') || undefined,
    sort,
  })

  return {
    items: res.items.map(mapear),
    totalItems: res.totalItems,
    totalPages: res.totalPages,
    page: res.page,
    perPage: res.perPage,
  }
}

/** Todos os inativos, para o relatório A4. */
export async function listarEmpresasInativasParaRelatorio(
  filtros: FiltrosEmpresas,
): Promise<EmpresaInativa[]> {
  const todas: EmpresaInativa[] = []
  let pagina = 1
  let totalPaginas = 1

  do {
    const res = await listarEmpresasInativas({ ...filtros, pagina, porPagina: 200 })
    todas.push(...res.items)
    totalPaginas = res.totalPages || 1
    pagina++
  } while (pagina <= totalPaginas && pagina <= 20)

  return todas
}

/** Devolve o cliente ao cadastro ativo. */
export async function reativarCliente(codigo: number): Promise<{ ok: boolean; mensagem?: string }> {
  const backend =
    import.meta.env.VITE_POCKETBASE_URL?.replace(/\/$/, '') ||
    'https://verificacao-projeto-panorama-18549.shrd02.internal.goskip.dev'

  const token =
    (typeof window !== 'undefined' && window.localStorage.getItem('adecont_painel_token')) || ''

  const r = await fetch(`${backend}/backend/v1/inativos-reativar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Painel-Token': token },
    body: JSON.stringify({ codigo }),
  })
  const j = await r.json()
  if (!r.ok) throw new Error(j.erro || `Falha (${r.status})`)
  return j
}
