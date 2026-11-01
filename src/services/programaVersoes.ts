import pb from '@/lib/pocketbase/client'

export type StatusVersao = 'atual' | 'anterior' | 'planejada'
export type PlataformaVersao = 'desktop' | 'celular'

export interface ProgramaVersaoItem {
  id: string
  versao: string
  plataforma?: PlataformaVersao
  data_atualizacao: string
  notas_versao: string
  status: StatusVersao
  url_instalador?: string
  canal_distribuicao?: string
  controlado_por?: string
  created?: string
  updated?: string
}

export interface CreateVersaoInput {
  versao: string
  plataforma?: PlataformaVersao
  data_atualizacao: string
  notas_versao: string
  status: StatusVersao
  url_instalador?: string
  canal_distribuicao?: string
  controlado_por?: string
}

export type CanalEnvioInstalacao = 'email' | 'whatsapp' | 'qr_code' | 'link_direto'
export type StatusEnvioInstalacao = 'ENVIADO' | 'RECEBIDO' | 'PENDENTE'

export interface ProgramaEnvioItem {
  id: string
  versao_ref: string
  plataforma?: PlataformaVersao
  data_atualizacao_ref?: string
  destinatario_nome: string
  destinatario_email?: string
  destinatario_whatsapp?: string
  destinatario_empresa?: string
  canal: CanalEnvioInstalacao
  status: StatusEnvioInstalacao
  protocolo?: string
  mensagem?: string
  url_instalador_enviada?: string
  enviado_por?: string
  data_envio?: string
  requer_atualizacao?: boolean
  created?: string
  updated?: string
}

export interface CreateEnvioInput {
  versao_ref: string
  plataforma?: PlataformaVersao
  data_atualizacao_ref?: string
  destinatario_nome: string
  destinatario_email?: string
  destinatario_whatsapp?: string
  destinatario_empresa?: string
  canal: CanalEnvioInstalacao
  status?: StatusEnvioInstalacao
  protocolo?: string
  mensagem?: string
  url_instalador_enviada?: string
  enviado_por?: string
  data_envio?: string
  requer_atualizacao?: boolean
}

export interface ProgramaAtualizacaoItem {
  id: string
  data_atualizacao: string
  origem: string
  versao_base: string
  descricao: string
  total_envios_afetados?: number
  executado_por?: string
  created?: string
  updated?: string
}

export interface ProgramaPropagacaoItem {
  id: string
  atualizacao_id: string
  envio_id: string
  protocolo_envio: string
  plataforma: PlataformaVersao
  destinatario_nome?: string
  data_propagacao: string // mesmo dia da atualização
  status: 'propagada' | 'pendente' | 'confirmada'
  created?: string
  updated?: string
}

export interface ProgramaManifestoResponse {
  sucesso: boolean
  mecanismo_atualizacao: {
    status: string
    tipo: string
    controlado_por: string
    politica: string
    manifesto_url: string
  }
  plataforma: PlataformaVersao
  versao_cliente: string | null
  versao_atual: string
  data_atualizacao: string
  notas_versao?: string
  url_instalador: string
  requires_update: boolean
  base_dados: {
    versao_mais_recente: string
    data_mais_recente: string
    atualizacoes_mesmo_dia: Array<{
      id: string
      data_atualizacao: string
      origem: string
      versao_base: string
      descricao: string
      total_envios_afetados?: number
      executado_por?: string
    }>
  }
  servidor_timestamp: string
}

export interface DestinatarioCliente {
  id: string
  nome: string
  email: string
  whatsapp?: string
  empresa?: string
  tipo_pessoa?: string
  regime_tributario?: string
}

/** Fallbacks locais seguros caso o backend esteja inacessível */
const FALLBACK_VERSOES: ProgramaVersaoItem[] = [
  {
    id: 'local-v284',
    versao: 'v2.8.4',
    plataforma: 'desktop',
    data_atualizacao: '2026-10-31',
    notas_versao:
      'Lançamento do Módulo Central do CEO: Instalador e Controle de Versão, Radar Nacional (três níveis federativos), Busca Avançada NCM com mais de 15.240 classificações e política anti-bloqueio institucional ADECONT.',
    status: 'atual',
    url_instalador: '/#instalador-versao',
    canal_distribuicao: 'E-mail, WhatsApp e QR Code Seguro',
    controlado_por: 'CEO — Direção Executiva ADECONT',
    created: '2026-10-31T12:00:00.000Z',
  },
  {
    id: 'local-v290m',
    versao: 'v2.9.0-m',
    plataforma: 'celular',
    data_atualizacao: '2026-10-31',
    notas_versao:
      'Versão para Celular (PWA Mobile) homologada pelo CEO: interface adaptada para toque, leitor de Classificações NCM no bolso, simuladores setoriais da Reforma Tributária otimizados para smartphone e atalho seguro na tela inicial.',
    status: 'atual',
    url_instalador: '/#instalador-versao?tipo=celular',
    canal_distribuicao: 'WhatsApp, QR Code Celular e E-mail',
    controlado_por: 'CEO — Direção Executiva ADECONT',
    created: '2026-10-31T12:30:00.000Z',
  },
  {
    id: 'local-v271',
    versao: 'v2.7.1',
    plataforma: 'desktop',
    data_atualizacao: '2026-10-15',
    notas_versao:
      'Implementação dos simuladores setoriais da Reforma Tributária (LC 214/2025, LC 227/2026), cálculo de alíquotas de referência CBS/IBS e catálogo de anexos 1 a 28.',
    status: 'anterior',
    url_instalador: '/#instalador-versao',
    canal_distribuicao: 'E-mail Oficial e PWA',
    controlado_por: 'CEO — Direção Executiva ADECONT',
    created: '2026-10-15T12:00:00.000Z',
  },
  {
    id: 'local-v270m',
    versao: 'v2.7.0-m',
    plataforma: 'celular',
    data_atualizacao: '2026-10-10',
    notas_versao:
      'Compilação mobile inicial: consulta ágil de alíquotas CBS/IBS, visualização responsiva de notas técnicas e suporte a telas de Android e iOS.',
    status: 'anterior',
    url_instalador: '/#instalador-versao?tipo=celular',
    canal_distribuicao: 'PWA Mobile e QR Code',
    controlado_por: 'CEO — Direção Executiva ADECONT',
    created: '2026-10-10T12:00:00.000Z',
  },
]

/** Busca histórico de versões ordenado por data decrescente */
export async function fetchProgramaVersoes(): Promise<ProgramaVersaoItem[]> {
  try {
    const records = await pb.collection('programa_versoes').getFullList<ProgramaVersaoItem>({
      sort: '-data_atualizacao',
    })
    if (records && records.length > 0) {
      return records
    }
    return FALLBACK_VERSOES
  } catch (err) {
    console.warn('[programaVersoes] Falha ao ler programa_versoes, usando fallback:', err)
    return FALLBACK_VERSOES
  }
}

/** Cadastra nova versão pelo CEO. Se o status for "atual", desmarca versões anteriores que estavam como "atual" na mesma plataforma */
export async function createProgramaVersao(input: CreateVersaoInput): Promise<ProgramaVersaoItem> {
  const plataforma = input.plataforma || 'desktop'
  try {
    if (input.status === 'atual') {
      // Garantir unicidade da versão atual dentro da plataforma (desktop ou celular)
      const existentes = await pb.collection('programa_versoes').getFullList<ProgramaVersaoItem>({
        filter: `status = 'atual' && plataforma = '${plataforma}'`,
      })
      for (const item of existentes) {
        await pb.collection('programa_versoes').update(item.id, { status: 'anterior' })
      }
    }

    const record = await pb.collection('programa_versoes').create<ProgramaVersaoItem>({
      ...input,
      plataforma,
      controlado_por: input.controlado_por || 'CEO — Direção Executiva ADECONT',
    })
    return record
  } catch (err) {
    console.error('[programaVersoes] Erro ao cadastrar versão pelo CEO:', err)
    throw err
  }
}

/** Altera status da versão (ex.: marcar como atual pelo CEO) respeitando a plataforma */
export async function setVersaoComoAtual(id: string, plataforma?: PlataformaVersao): Promise<void> {
  try {
    // Descobre a plataforma do registro se não for informada
    let targetPlataforma = plataforma
    if (!targetPlataforma) {
      const rec = await pb.collection('programa_versoes').getOne<ProgramaVersaoItem>(id)
      targetPlataforma = rec.plataforma || 'desktop'
    }

    const existentes = await pb.collection('programa_versoes').getFullList<ProgramaVersaoItem>({
      filter: `status = 'atual' && plataforma = '${targetPlataforma}'`,
    })
    for (const item of existentes) {
      if (item.id !== id) {
        await pb.collection('programa_versoes').update(item.id, { status: 'anterior' })
      }
    }
    await pb.collection('programa_versoes').update(id, { status: 'atual' })
  } catch (err) {
    console.error('[programaVersoes] Erro ao promover versão para atual:', err)
    throw err
  }
}

/** Busca clientes/usuários cadastrados para envio de instalação */
export async function fetchDestinatariosCadastro(): Promise<DestinatarioCliente[]> {
  try {
    const records = await pb.collection('simul_clientes').getFullList<DestinatarioCliente>({
      filter: 'is_active = true',
      sort: 'nome',
    })
    return records || []
  } catch {
    try {
      const records = await pb.collection('simul_clientes').getFullList<DestinatarioCliente>({
        sort: 'nome',
      })
      return records || []
    } catch (err) {
      console.warn('[programaVersoes] Falha ao carregar simul_clientes:', err)
      return []
    }
  }
}

/** Registra um envio de instalação com versão, data de atualização e destinatário */
export async function registrarEnvioInstalacao(
  input: CreateEnvioInput,
): Promise<ProgramaEnvioItem> {
  const agora = new Date()
  const dataEnvioStr = agora.toISOString().slice(0, 10)
  const prefixo = input.plataforma === 'celular' ? 'CEL' : 'INST'
  const protocolo =
    input.protocolo ||
    `${prefixo}-${agora.getFullYear()}${String(agora.getMonth() + 1).padStart(2, '0')}${String(agora.getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

  try {
    const record = await pb.collection('programa_envios').create<ProgramaEnvioItem>({
      ...input,
      plataforma: input.plataforma || 'desktop',
      protocolo,
      status: input.status || 'ENVIADO',
      enviado_por: input.enviado_por || 'CEO — Direção Executiva ADECONT',
      data_envio: input.data_envio || dataEnvioStr,
    })
    return record
  } catch (err) {
    console.error('[programaVersoes] Erro ao registrar envio:', err)
    throw err
  }
}

/** Busca histórico de envios ordenado pelo mais recente */
export async function fetchProgramaEnvios(): Promise<ProgramaEnvioItem[]> {
  try {
    const records = await pb.collection('programa_envios').getFullList<ProgramaEnvioItem>({
      sort: '-created',
    })
    return records || []
  } catch (err) {
    console.warn('[programaVersoes] Falha ao ler programa_envios:', err)
    return []
  }
}

/**
 * Ordena atualizações de forma estritamente cronológica com a mais recente no topo.
 * Critério: data_atualizacao DESC, com desempate em created DESC e id DESC.
 */
export function ordenarAtualizacoesCronologico<
  T extends { data_atualizacao?: string; created?: string; id?: string },
>(lista: T[]): T[] {
  return [...lista].sort((a, b) => {
    const dataA = a.data_atualizacao || ''
    const dataB = b.data_atualizacao || ''
    if (dataA !== dataB) {
      return dataB.localeCompare(dataA)
    }
    const createdA = a.created || ''
    const createdB = b.created || ''
    if (createdA !== createdB) {
      return createdB.localeCompare(createdA)
    }
    return (b.id || '').localeCompare(a.id || '')
  })
}

/**
 * Ordena propagações de forma estritamente cronológica com a mais recente no topo.
 * Critério: data_propagacao DESC, com desempate em created DESC e id DESC.
 */
export function ordenarPropagacoesCronologico<
  T extends { data_propagacao?: string; created?: string; id?: string },
>(lista: T[]): T[] {
  return [...lista].sort((a, b) => {
    const dataA = a.data_propagacao || ''
    const dataB = b.data_propagacao || ''
    if (dataA !== dataB) {
      return dataB.localeCompare(dataA)
    }
    const createdA = a.created || ''
    const createdB = b.created || ''
    if (createdA !== createdB) {
      return createdB.localeCompare(createdA)
    }
    return (b.id || '').localeCompare(a.id || '')
  })
}

/** Busca atualizações da base registradas no sistema (sempre ordenadas pela mais recente no topo) */
export async function fetchProgramaAtualizacoes(): Promise<ProgramaAtualizacaoItem[]> {
  try {
    const records = await pb
      .collection('programa_atualizacoes')
      .getFullList<ProgramaAtualizacaoItem>({
        sort: '-data_atualizacao,-created',
      })
    return records && records.length > 0 ? ordenarAtualizacoesCronologico(records) : []
  } catch (err) {
    console.warn('[programaVersoes] Falha ao ler programa_atualizacoes:', err)
    return []
  }
}

/** Busca propagações registradas (sempre ordenadas pela mais recente no topo) */
export async function fetchProgramaPropagacoes(
  atualizacaoId?: string,
): Promise<ProgramaPropagacaoItem[]> {
  try {
    const filter = atualizacaoId ? `atualizacao_id = '${atualizacaoId}'` : ''
    const records = await pb
      .collection('programa_propagacoes')
      .getFullList<ProgramaPropagacaoItem>({
        filter,
        sort: '-data_propagacao,-created',
      })
    return records && records.length > 0 ? ordenarPropagacoesCronologico(records) : []
  } catch (err) {
    console.warn('[programaVersoes] Falha ao ler programa_propagacoes:', err)
    return []
  }
}

/**
 * Registra uma atualização de base pelo CEO ou rotina e PROPAGA PARA TODOS OS ENVIOS NO MESMO DIA.
 * Garante que a data da propagação seja estritamente o MESMO DIA da atualização.
 */
export async function registrarAtualizacaoBaseEPropagar(params: {
  origem: string
  versaoBase: string
  descricao: string
  dataAtualizacao?: string // YYYY-MM-DD
  executadoPor?: string
}): Promise<{
  atualizacao: ProgramaAtualizacaoItem
  propagacoesCriadas: number
  dataPropagacao: string
}> {
  const dataHoje = params.dataAtualizacao || new Date().toISOString().slice(0, 10)
  const executadoPor = params.executadoPor || 'CEO — Direção Executiva ADECONT'

  // 1. Criar registro de atualização da base
  const attRecord = await pb.collection('programa_atualizacoes').create<ProgramaAtualizacaoItem>({
    data_atualizacao: dataHoje,
    origem: params.origem,
    versao_base: params.versaoBase,
    descricao: params.descricao,
    total_envios_afetados: 0,
    executado_por: executadoPor,
  })

  // 2. Buscar todos os envios emitidos (desktop e celular)
  const envios = await pb.collection('programa_envios').getFullList<ProgramaEnvioItem>({
    sort: '-created',
  })

  let propagacoesCriadas = 0

  // 3. Criar registro de propagação datado no MESMO DIA para cada envio
  for (const envio of envios) {
    try {
      await pb.collection('programa_propagacoes').create<ProgramaPropagacaoItem>({
        atualizacao_id: attRecord.id,
        envio_id: envio.id,
        protocolo_envio: envio.protocolo || envio.id,
        plataforma: envio.plataforma || 'desktop',
        destinatario_nome: envio.destinatario_nome,
        data_propagacao: dataHoje, // MESMO DIA DA ATUALIZAÇÃO
        status: 'propagada',
      })

      // Marcar envio como requer_atualizacao
      await pb.collection('programa_envios').update(envio.id, {
        requer_atualizacao: true,
      })

      propagacoesCriadas++
    } catch (err) {
      console.warn(`[programaVersoes] Falha ao propagar para o envio ${envio.id}:`, err)
    }
  }

  // 4. Atualizar total de afetados
  const atualizacaoFinal = await pb
    .collection('programa_atualizacoes')
    .update<ProgramaAtualizacaoItem>(attRecord.id, {
      total_envios_afetados: propagacoesCriadas,
    })

  return {
    atualizacao: atualizacaoFinal,
    propagacoesCriadas,
    dataPropagacao: dataHoje,
  }
}

/**
 * Consulta o Manifesto Oficial de Atualização consumido pelo programa instalado.
 */
export async function consultarProgramaManifesto(params?: {
  plataforma?: PlataformaVersao
  versaoCliente?: string
}): Promise<ProgramaManifestoResponse> {
  const base = import.meta.env.VITE_POCKETBASE_URL || ''
  const plat = params?.plataforma || 'desktop'
  const vParam = params?.versaoCliente ? `&versao=${encodeURIComponent(params.versaoCliente)}` : ''
  const url = `${base}/backend/v1/programa-manifesto?plataforma=${plat}${vParam}`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Falha ao obter manifesto de atualização: HTTP ${res.status}`)
  }
  return (await res.json()) as ProgramaManifestoResponse
}

/** Gera a mensagem institucional completa da ADECONT para instalação */
export function formatarMensagemInstalacao(params: {
  versao: string
  plataforma?: PlataformaVersao
  dataAtualizacao: string
  notasVersao?: string
  destinatarioNome?: string
  destinatarioEmpresa?: string
  urlInstalador: string
  canal: CanalEnvioInstalacao
}): string {
  const {
    versao,
    plataforma = 'desktop',
    dataAtualizacao,
    notasVersao,
    destinatarioNome,
    destinatarioEmpresa,
    urlInstalador,
  } = params

  const dataFmt = dataAtualizacao
    ? dataAtualizacao.split('-').reverse().join('/')
    : new Date().toLocaleDateString('pt-BR')

  const saudacao = destinatarioNome
    ? `Prezado(a) ${destinatarioNome}${destinatarioEmpresa ? ` (${destinatarioEmpresa})` : ''},`
    : 'Prezado cliente e usuário cadastrado,'

  const isCelular = plataforma === 'celular'

  const cabecalho = isCelular
    ? `*ADECONT — Assessoria Contábil e Administrativa*
📱 *Instalador Oficial para Celular — Programa Panorama Mobile*
🛡️ _Gerenciado e Controlado pelo CEO (Direção Executiva ADECONT)_`
    : `*ADECONT — Assessoria Contábil e Administrativa*
💻 *Instalador e Controle de Versão do Programa Panorama (Desktop)*
🛡️ _Gerenciado e Controlado pelo CEO (Direção Executiva ADECONT)_`

  const infoPlataforma = isCelular
    ? `• *Plataforma:* 📱 Celular (Smartphone Android & Apple iOS)`
    : `• *Plataforma:* 💻 Desktop / Computador de Mesa e Notebook`

  const blocoMecanismoAtualizacao = `🔄 *Mecanismo de Atualização Automática no Mesmo Dia:*
O programa instalado inclui mecanismo inteligente de verificação contínua: à medida que a base legislativa e de classificações da ADECONT é atualizada, a nova versão propaga automaticamente para todos os sistemas enviados no mesmo dia. O programa consulta o Manifesto Oficial (/backend/v1/programa-manifesto) para validar integridade, normas vigentes e aplicar novas bases sem necessidade de reinstalação manual.`

  const instrucoes = isCelular
    ? `📱 *Instalação Rápida no seu Celular:*
1. Abra o link seguro no celular (Chrome ou Safari).
2. Android: toque no Menu (⋮) → "Adicionar à tela inicial" ou "Instalar app".
3. iPhone (iOS): toque em Compartilhar (ícone com seta) → "Adicionar à Tela de Início".
4. O ícone oficial do Panorama ADECONT fica pronto no seu smartphone para consultas instantâneas!`
    : `💻 *Instruções de Instalação no Computador:*
1. Abra o link seguro no Google Chrome, Microsoft Edge ou Brave.
2. Clique no ícone de instalação na barra de endereço ou Menu (...) → Aplicativos → "Instalar este site como app".
3. O Panorama fica acessível diretamente na sua área de trabalho e barra de tarefas.`

  return `${cabecalho}

${saudacao}

Informamos a disponibilização do link oficial para instalação e atualização ${isCelular ? 'da *Versão para Celular*' : 'do sistema'} *Panorama da Reforma Tributária*.

📌 *Dados da Versão Homologada pelo CEO:*
• *Versão do Programa:* ${versao}
${infoPlataforma}
• *Data da Atualização:* ${dataFmt}
• *Responsável pelo Controle:* CEO — Direção Executiva ADECONT

${notasVersao ? `📝 *O que mudou nesta atualização:*\n${notasVersao}\n\n` : ''}🔗 *Link Direto de Instalação (Anti-bloqueio Seguro):*
${urlInstalador}

${blocoMecanismoAtualizacao}

${instrucoes}

🔒 _Acesso seguro via proxy institucional ADECONT com fontes primárias oficiais (CGIBS, LC 214/2025, LC 227/2026)._`
}
