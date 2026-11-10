/**
 * Serviço de Ficha Estendida e Dados Complementares do Cliente
 * Sistema ADECONT — Projeto Panorama
 *
 * Gerencia:
 * 1. CRUD de definições de campos personalizados (cliente_campos_def)
 * 2. CRUD de valores preenchidos por cliente (cliente_campos_valores)
 * 3. CRUD de contatos e redes sociais (cliente_contatos)
 * 4. CRUD de arquivos anexos (cliente_arquivos) com storage do PocketBase
 *
 * Inclui cache local resiliente para contingência e registro em auditoria.
 */

import pb from '@/lib/pocketbase/client'
import {
  CampoPersonalizadoDef,
  CampoPersonalizadoValor,
  ClienteContato,
  ClienteArquivo,
  DadosComplementaresCliente,
  TipoCanalContato,
} from '@/types/clienteDadosComplementares'

// Evento customizado para sincronização de tela
export const EVENTO_DADOS_COMPLEMENTARES_ATUALIZADOS = 'adecont:dados_complementares_atualizados'

const STORAGE_CAMPOS_DEF = 'adecont_cliente_campos_def_cache'
const STORAGE_CAMPOS_VALORES = 'adecont_cliente_campos_valores_cache'
const STORAGE_CONTATOS = 'adecont_cliente_contatos_cache'
const STORAGE_ARQUIVOS = 'adecont_cliente_arquivos_cache'

export function sanitizarDoc(doc?: string): string {
  if (!doc) return ''
  return String(doc).replace(/\D/g, '').trim()
}

/**
 * Normaliza links e identificadores de canais de contato
 */
export function formatarLinkContato(tipo: TipoCanalContato, identificador: string): string {
  const limpo = (identificador || '').trim()
  if (!limpo) return ''

  switch (tipo) {
    case 'email':
      return limpo.startsWith('mailto:') ? limpo : `mailto:${limpo}`
    case 'whatsapp': {
      const digitos = limpo.replace(/\D/g, '')
      // Se não tiver DDI brasileiro (55), adiciona se tiver 10 ou 11 dígitos
      const numeroCompleto =
        digitos.length === 10 || digitos.length === 11 ? `55${digitos}` : digitos
      return `https://wa.me/${numeroCompleto}`
    }
    case 'instagram': {
      if (limpo.startsWith('http://') || limpo.startsWith('https://')) return limpo
      const usuario = limpo.replace(/^@/, '')
      return `https://instagram.com/${usuario}`
    }
    case 'facebook': {
      if (limpo.startsWith('http://') || limpo.startsWith('https://')) return limpo
      return `https://facebook.com/${limpo}`
    }
    case 'linkedin': {
      if (limpo.startsWith('http://') || limpo.startsWith('https://')) return limpo
      return `https://linkedin.com/in/${limpo}`
    }
    case 'telegram': {
      if (limpo.startsWith('http://') || limpo.startsWith('https://')) return limpo
      const usuario = limpo.replace(/^@/, '')
      return `https://t.me/${usuario}`
    }
    case 'site': {
      if (limpo.startsWith('http://') || limpo.startsWith('https://')) return limpo
      return `https://${limpo}`
    }
    default:
      return limpo
  }
}

// ==========================================
// 1. DEFINIÇÕES DE CAMPOS PERSONALIZADOS
// ==========================================

function lerCache<T>(key: string): T[] {
  if (typeof window === 'undefined' || !window.localStorage) return []
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function salvarCache<T>(key: string, dados: T[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(key, JSON.stringify(dados))
  } catch {
    // quota
  }
}

function dispararAtualizacao(detalhes?: any) {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent(EVENTO_DADOS_COMPLEMENTARES_ATUALIZADOS, { detail: detalhes }),
      )
    } catch {
      /* intentionally ignored */
    }
  }
}

/**
 * Lista todas as definições de campos personalizados
 */
export async function listarCamposPersonalizados(
  apenasAtivos = false,
): Promise<CampoPersonalizadoDef[]> {
  try {
    const records = await pb.collection('cliente_campos_def').getFullList<any>({
      sort: 'ordem,created',
    })
    const defs: CampoPersonalizadoDef[] = records.map((r) => ({
      id: r.id,
      chave: r.chave,
      rotulo: r.rotulo,
      tipo: r.tipo,
      opcoes: r.opcoes || '',
      descricao: r.descricao || '',
      ordem: r.ordem ?? 0,
      ativo: r.ativo !== false,
      criado_por: r.criado_por,
      created: r.created,
      updated: r.updated,
    }))
    salvarCache(STORAGE_CAMPOS_DEF, defs)
    return defs
  } catch (err) {
    console.warn(
      '[clienteDadosComplementares] Falha ao listar campos def do PocketBase, usando cache:',
      err,
    )
    return lerCache<CampoPersonalizadoDef>(STORAGE_CAMPOS_DEF)
  }
}

/**
 * Salva ou atualiza uma definição de campo personalizado
 */
export async function salvarCampoPersonalizado(
  campo: Omit<CampoPersonalizadoDef, 'created' | 'updated'>,
): Promise<CampoPersonalizadoDef> {
  const chaveSanitizada =
    (campo.chave || campo.rotulo || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/^_+|_+$/g, '') || `campo_${Date.now()}`

  const dadosGravar = {
    chave: chaveSanitizada,
    rotulo: campo.rotulo.trim(),
    tipo: campo.tipo,
    opcoes: campo.opcoes || '',
    descricao: campo.descricao || '',
    ordem: campo.ordem ?? 0,
    ativo: campo.ativo !== false,
    criado_por: campo.criado_por || 'ADECONT Operador',
  }

  let recordFinal: CampoPersonalizadoDef = { ...dadosGravar, id: campo.id }

  try {
    if (campo.id) {
      const updated = await pb.collection('cliente_campos_def').update(campo.id, dadosGravar)
      recordFinal = {
        ...recordFinal,
        id: updated.id,
        created: updated.created,
        updated: updated.updated,
      }
    } else {
      // Verifica se já existe por chave
      try {
        const existente = await pb
          .collection('cliente_campos_def')
          .getFirstListItem(`chave = "${chaveSanitizada}"`)
        const updated = await pb.collection('cliente_campos_def').update(existente.id, dadosGravar)
        recordFinal = {
          ...recordFinal,
          id: updated.id,
          created: updated.created,
          updated: updated.updated,
        }
      } catch {
        const created = await pb.collection('cliente_campos_def').create(dadosGravar)
        recordFinal = {
          ...recordFinal,
          id: created.id,
          created: created.created,
          updated: created.updated,
        }
      }
    }
  } catch (err) {
    console.warn(
      '[clienteDadosComplementares] Erro no PB ao salvar campo def, salvando no cache local:',
      err,
    )
    if (!recordFinal.id) {
      recordFinal.id = `def_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    }
  }

  // Atualiza cache
  const cache = lerCache<CampoPersonalizadoDef>(STORAGE_CAMPOS_DEF)
  const idx = cache.findIndex(
    (c) => c.chave === recordFinal.chave || (recordFinal.id && c.id === recordFinal.id),
  )
  if (idx >= 0) {
    cache[idx] = recordFinal
  } else {
    cache.push(recordFinal)
  }
  salvarCache(STORAGE_CAMPOS_DEF, cache)
  dispararAtualizacao({ tipo: 'campo_def', campo: recordFinal })

  return recordFinal
}

/**
 * Exclui uma definição de campo personalizado
 */
export async function excluirCampoPersonalizado(idOuChave: string): Promise<boolean> {
  let ok = false
  try {
    // Tenta por ID
    try {
      await pb.collection('cliente_campos_def').delete(idOuChave)
      ok = true
    } catch {
      // Tenta buscar por chave
      const r = await pb.collection('cliente_campos_def').getFirstListItem(`chave = "${idOuChave}"`)
      await pb.collection('cliente_campos_def').delete(r.id)
      ok = true
    }
  } catch (err) {
    console.warn('[clienteDadosComplementares] Erro ao excluir campo def no PB:', err)
  }

  const cache = lerCache<CampoPersonalizadoDef>(STORAGE_CAMPOS_DEF)
  const novoCache = cache.filter((c) => c.id !== idOuChave && c.chave !== idOuChave)
  salvarCache(STORAGE_CAMPOS_DEF, novoCache)
  dispararAtualizacao({ tipo: 'campo_def_excluido', idOuChave })

  return ok || true
}

// ==========================================
// 2. VALORES DOS CAMPOS PERSONALIZADOS POR CLIENTE
// ==========================================

export async function carregarValoresCamposCliente(
  cnpjCpf: string,
  codigo?: number,
): Promise<Record<string, string>> {
  const docLimpo = sanitizarDoc(cnpjCpf)
  const mapa: Record<string, string> = {}

  // Lê do cache local primeiro
  const cache = lerCache<CampoPersonalizadoValor>(STORAGE_CAMPOS_VALORES)
  cache.forEach((v) => {
    if (v.cliente_cnpj === docLimpo || (codigo && v.cliente_codigo === codigo)) {
      mapa[v.campo_chave] = v.valor
    }
  })

  try {
    let filtro = `cliente_cnpj = "${docLimpo}"`
    if (codigo) {
      filtro = `cliente_cnpj = "${docLimpo}" || cliente_codigo = ${codigo}`
    }
    const records = await pb.collection('cliente_campos_valores').getFullList<any>({
      filter: filtro,
    })
    records.forEach((r) => {
      mapa[r.campo_chave] = r.valor || ''
    })
  } catch (err) {
    console.warn('[clienteDadosComplementares] Falha ao carregar valores do PB, usando cache:', err)
  }

  return mapa
}

export async function salvarValoresCamposCliente(
  cnpjCpf: string,
  valores: Record<string, string>,
  codigo?: number,
  operador?: string,
): Promise<void> {
  const docLimpo = sanitizarDoc(cnpjCpf)
  if (!docLimpo && !codigo) return

  const chaves = Object.keys(valores)
  const agora = new Date().toISOString()
  const cache = lerCache<CampoPersonalizadoValor>(STORAGE_CAMPOS_VALORES)

  for (const chave of chaves) {
    const valStr = String(valores[chave] ?? '')

    // Atualiza cache local
    const idx = cache.findIndex(
      (c) =>
        (c.cliente_cnpj === docLimpo || (codigo && c.cliente_codigo === codigo)) &&
        c.campo_chave === chave,
    )
    if (idx >= 0) {
      cache[idx].valor = valStr
      cache[idx].updated = agora
    } else {
      cache.push({
        id: `val_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        cliente_cnpj: docLimpo,
        cliente_codigo: codigo,
        campo_chave: chave,
        valor: valStr,
        atualizado_por: operador || 'ADECONT Operador',
        created: agora,
        updated: agora,
      })
    }

    // Tenta persistir no PB
    try {
      const filtro = `cliente_cnpj = "${docLimpo}" && campo_chave = "${chave}"`
      try {
        const existente = await pb.collection('cliente_campos_valores').getFirstListItem(filtro)
        await pb.collection('cliente_campos_valores').update(existente.id, {
          valor: valStr,
          cliente_codigo: codigo ?? existente.cliente_codigo,
          atualizado_por: operador || 'ADECONT Operador',
        })
      } catch {
        await pb.collection('cliente_campos_valores').create({
          cliente_cnpj: docLimpo,
          cliente_codigo: codigo,
          campo_chave: chave,
          valor: valStr,
          atualizado_por: operador || 'ADECONT Operador',
        })
      }
    } catch (err) {
      console.warn(
        `[clienteDadosComplementares] Erro ao gravar valor do campo ${chave} no PB:`,
        err,
      )
    }
  }

  salvarCache(STORAGE_CAMPOS_VALORES, cache)
  dispararAtualizacao({ tipo: 'valores_atualizados', cnpj: docLimpo, codigo })
}

// ==========================================
// 3. CANAIS DE CONTATO E MENSAGENS (CRUD)
// ==========================================

export async function listarContatosCliente(
  cnpjCpf: string,
  codigo?: number,
): Promise<ClienteContato[]> {
  const docLimpo = sanitizarDoc(cnpjCpf)

  try {
    let filtro = `cliente_cnpj = "${docLimpo}"`
    if (codigo) {
      filtro = `cliente_cnpj = "${docLimpo}" || cliente_codigo = ${codigo}`
    }
    const records = await pb.collection('cliente_contatos').getFullList<any>({
      filter: filtro,
      sort: '-principal,tipo,created',
    })
    const contatos: ClienteContato[] = records.map((r) => ({
      id: r.id,
      cliente_cnpj: r.cliente_cnpj,
      cliente_codigo: r.cliente_codigo,
      tipo: r.tipo,
      identificador: r.identificador,
      rotulo: r.rotulo || '',
      nome_responsavel: r.nome_responsavel || '',
      cargo_responsavel: r.cargo_responsavel || '',
      principal: Boolean(r.principal),
      observacao: r.observacao || '',
      created: r.created,
      updated: r.updated,
    }))
    return contatos
  } catch (err) {
    console.warn(
      '[clienteDadosComplementares] Falha ao carregar contatos do PB, usando cache:',
      err,
    )
    const cache = lerCache<ClienteContato>(STORAGE_CONTATOS)
    return cache.filter(
      (c) => c.cliente_cnpj === docLimpo || (codigo && c.cliente_codigo === codigo),
    )
  }
}

export async function salvarContatoCliente(
  contato: Omit<ClienteContato, 'created' | 'updated'>,
): Promise<ClienteContato> {
  const docLimpo = sanitizarDoc(contato.cliente_cnpj)
  const dados = {
    cliente_cnpj: docLimpo,
    cliente_codigo: contato.cliente_codigo,
    tipo: contato.tipo,
    identificador: (contato.identificador || '').trim(),
    rotulo: (contato.rotulo || '').trim(),
    nome_responsavel: (contato.nome_responsavel || '').trim(),
    cargo_responsavel: (contato.cargo_responsavel || '').trim(),
    principal: Boolean(contato.principal),
    observacao: (contato.observacao || '').trim(),
  }

  let finalObj: ClienteContato = { ...dados, id: contato.id }

  try {
    if (contato.id && !contato.id.startsWith('cache_')) {
      const updated = await pb.collection('cliente_contatos').update(contato.id, dados)
      finalObj = { ...finalObj, id: updated.id, created: updated.created, updated: updated.updated }
    } else {
      const created = await pb.collection('cliente_contatos').create(dados)
      finalObj = { ...finalObj, id: created.id, created: created.created, updated: created.updated }
    }
  } catch (err) {
    console.warn(
      '[clienteDadosComplementares] Erro no PB ao salvar contato, salvando no cache:',
      err,
    )
    if (!finalObj.id) {
      finalObj.id = `cache_ctt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    }
  }

  // Atualiza cache local
  const cache = lerCache<ClienteContato>(STORAGE_CONTATOS)
  const idx = cache.findIndex((c) => c.id === finalObj.id)
  if (idx >= 0) {
    cache[idx] = finalObj
  } else {
    cache.push(finalObj)
  }
  salvarCache(STORAGE_CONTATOS, cache)
  dispararAtualizacao({ tipo: 'contato_salvo', contato: finalObj })

  return finalObj
}

export async function excluirContatoCliente(id: string): Promise<boolean> {
  let ok = false
  try {
    await pb.collection('cliente_contatos').delete(id)
    ok = true
  } catch (err) {
    console.warn('[clienteDadosComplementares] Erro ao excluir contato no PB:', err)
  }

  const cache = lerCache<ClienteContato>(STORAGE_CONTATOS)
  salvarCache(
    STORAGE_CONTATOS,
    cache.filter((c) => c.id !== id),
  )
  dispararAtualizacao({ tipo: 'contato_excluido', id })
  return ok || true
}

// ==========================================
// 4. ARQUIVOS ANEXOS (CRUD)
// ==========================================

export async function listarArquivosCliente(
  cnpjCpf: string,
  codigo?: number,
): Promise<ClienteArquivo[]> {
  const docLimpo = sanitizarDoc(cnpjCpf)

  try {
    let filtro = `cliente_cnpj = "${docLimpo}"`
    if (codigo) {
      filtro = `cliente_cnpj = "${docLimpo}" || cliente_codigo = ${codigo}`
    }
    const records = await pb.collection('cliente_arquivos').getFullList<any>({
      filter: filtro,
      sort: '-created',
    })
    const arquivos: ClienteArquivo[] = records.map((r) => {
      let url = ''
      try {
        if (r.arquivo) {
          url = pb.files.getUrl(r, r.arquivo)
        }
      } catch {
        /* intentionally ignored */
      }

      return {
        id: r.id,
        cliente_cnpj: r.cliente_cnpj,
        cliente_codigo: r.cliente_codigo,
        titulo: r.titulo,
        categoria: r.categoria || 'Outro',
        arquivo: r.arquivo,
        nome_original: r.nome_original || r.titulo,
        tamanho_bytes: r.tamanho_bytes || 0,
        tipo_mime: r.tipo_mime || '',
        observacao: r.observacao || '',
        enviado_por: r.enviado_por || '',
        url,
        created: r.created,
        updated: r.updated,
      }
    })
    return arquivos
  } catch (err) {
    console.warn(
      '[clienteDadosComplementares] Falha ao carregar arquivos do PB, usando cache:',
      err,
    )
    const cache = lerCache<ClienteArquivo>(STORAGE_ARQUIVOS)
    return cache.filter(
      (a) => a.cliente_cnpj === docLimpo || (codigo && a.cliente_codigo === codigo),
    )
  }
}

export async function uploadArquivoCliente(params: {
  clienteCnpj: string
  clienteCodigo?: number
  titulo: string
  categoria?: string
  file: File
  observacao?: string
  enviadoPor?: string
}): Promise<ClienteArquivo> {
  const docLimpo = sanitizarDoc(params.clienteCnpj)
  // Campo obrigatório na coleção: cliente sem CNPJ/CPF preenchido (ex.:
  // cadastro por recepção de documento) usa o CÓDIGO de cliente como chave de
  // vínculo — mesmo padrão do anexo que já grava com sucesso (sanitizarDoc
  // reduz "COD94109" a "94109") e do fluxo de recepção.
  const chaveVinculo = docLimpo || (params.clienteCodigo ? String(params.clienteCodigo) : '')
  if (!chaveVinculo) {
    throw new Error('Cliente sem CNPJ/CPF e sem código — não é possível vincular o anexo à ficha.')
  }
  const formData = new FormData()
  formData.append('cliente_cnpj', chaveVinculo)
  if (params.clienteCodigo) {
    formData.append('cliente_codigo', String(params.clienteCodigo))
  }
  formData.append('titulo', params.titulo.trim() || params.file.name)
  formData.append('categoria', params.categoria || 'Outro')
  formData.append('arquivo', params.file)
  formData.append('nome_original', params.file.name)
  formData.append('tamanho_bytes', String(params.file.size))
  formData.append('tipo_mime', params.file.type || 'application/octet-stream')
  formData.append('observacao', params.observacao || '')
  formData.append('enviado_por', params.enviadoPor || 'ADECONT Operador')

  try {
    const record = await pb.collection('cliente_arquivos').create<any>(formData)
    let url = ''
    try {
      if (record.arquivo) {
        url = pb.files.getUrl(record, record.arquivo)
      }
    } catch {
      /* intentionally ignored */
    }

    const arq: ClienteArquivo = {
      id: record.id,
      cliente_cnpj: record.cliente_cnpj,
      cliente_codigo: record.cliente_codigo,
      titulo: record.titulo,
      categoria: record.categoria,
      arquivo: record.arquivo,
      nome_original: record.nome_original,
      tamanho_bytes: record.tamanho_bytes,
      tipo_mime: record.tipo_mime,
      observacao: record.observacao,
      enviado_por: record.enviado_por,
      url,
      created: record.created,
      updated: record.updated,
    }

    const cache = lerCache<ClienteArquivo>(STORAGE_ARQUIVOS)
    cache.unshift(arq)
    salvarCache(STORAGE_ARQUIVOS, cache)
    dispararAtualizacao({ tipo: 'arquivo_anexado', arquivo: arq })

    return arq
  } catch (err: any) {
    console.error('[clienteDadosComplementares] Erro no upload de arquivo para PB:', err)
    throw new Error(err?.message || 'Falha ao fazer upload do arquivo para a ficha do cliente.')
  }
}

export async function excluirArquivoCliente(id: string): Promise<boolean> {
  let ok = false
  try {
    await pb.collection('cliente_arquivos').delete(id)
    ok = true
  } catch (err) {
    console.warn('[clienteDadosComplementares] Erro ao excluir arquivo no PB:', err)
  }

  const cache = lerCache<ClienteArquivo>(STORAGE_ARQUIVOS)
  salvarCache(
    STORAGE_ARQUIVOS,
    cache.filter((a) => a.id !== id),
  )
  dispararAtualizacao({ tipo: 'arquivo_excluido', id })
  return ok || true
}

/**
 * Carrega todos os dados complementares consolidados de um cliente
 */
export async function carregarDadosComplementaresCliente(
  cnpjCpf: string,
  codigo?: number,
): Promise<DadosComplementaresCliente> {
  const [camposValores, contatos, arquivos] = await Promise.all([
    carregarValoresCamposCliente(cnpjCpf, codigo),
    listarContatosCliente(cnpjCpf, codigo),
    listarArquivosCliente(cnpjCpf, codigo),
  ])

  return { camposValores, contatos, arquivos }
}
