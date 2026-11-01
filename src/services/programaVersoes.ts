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
      'Lançamento do Módulo Central do COU: Instalador e Controle de Versão, Radar Nacional (três níveis federativos), Busca Avançada NCM com mais de 15.240 classificações e política anti-bloqueio institucional ADECONT.',
    status: 'atual',
    url_instalador: '/#instalador-versao',
    canal_distribuicao: 'E-mail, WhatsApp e QR Code Seguro',
    controlado_por: 'COU — Centro de Operações Unificadas ADECONT',
    created: '2026-10-31T12:00:00.000Z',
  },
  {
    id: 'local-v284m',
    versao: 'v2.8.4-m',
    plataforma: 'celular',
    data_atualizacao: '2026-10-31',
    notas_versao:
      'Versão para Celular (PWA Mobile) homologada pelo COU: interface adaptada para toque, leitor de Classificações NCM no bolso, simuladores setoriais da Reforma Tributária otimizados para smartphone e atalho seguro na tela inicial.',
    status: 'atual',
    url_instalador: '/#instalador-versao?tipo=celular',
    canal_distribuicao: 'WhatsApp, QR Code Celular e E-mail',
    controlado_por: 'COU — Centro de Operações Unificadas ADECONT',
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
    controlado_por: 'COU — Centro de Operações Unificadas ADECONT',
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
    controlado_por: 'COU — Centro de Operações Unificadas ADECONT',
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

/** Cadastra nova versão pelo COU. Se o status for "atual", desmarca versões anteriores que estavam como "atual" na mesma plataforma */
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
      controlado_por: input.controlado_por || 'COU — Centro de Operações Unificadas ADECONT',
    })
    return record
  } catch (err) {
    console.error('[programaVersoes] Erro ao cadastrar versão pelo COU:', err)
    throw err
  }
}

/** Altera status da versão (ex.: marcar como atual pelo COU) respeitando a plataforma */
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
      enviado_por: input.enviado_por || 'COU — Centro de Operações Unificadas ADECONT',
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
🛡️ _Gerenciado e Controlado pelo COU (Centro de Operações Unificadas)_`
    : `*ADECONT — Assessoria Contábil e Administrativa*
💻 *Instalador e Controle de Versão do Programa Panorama (Desktop)*
🛡️ _Gerenciado e Controlado pelo COU (Centro de Operações Unificadas)_`

  const infoPlataforma = isCelular
    ? `• *Plataforma:* 📱 Celular (Smartphone Android & Apple iOS)`
    : `• *Plataforma:* 💻 Desktop / Computador de Mesa e Notebook`

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

📌 *Dados da Versão Homologada pelo COU:*
• *Versão do Programa:* ${versao}
${infoPlataforma}
• *Data da Atualização:* ${dataFmt}
• *Responsável pelo Controle:* COU — Centro de Operações Unificadas ADECONT

${notasVersao ? `📝 *O que mudou nesta atualização:*\n${notasVersao}\n\n` : ''}🔗 *Link Direto de Instalação (Anti-bloqueio Seguro):*
${urlInstalador}

${instrucoes}

🔒 _Acesso seguro via proxy institucional ADECONT com fontes primárias oficiais (CGIBS, LC 214/2025, LC 227/2026)._`
}
