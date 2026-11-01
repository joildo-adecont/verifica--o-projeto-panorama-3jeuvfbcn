import pb from '@/lib/pocketbase/client'

export type StatusVersao = 'atual' | 'anterior' | 'planejada'

export interface ProgramaVersaoItem {
  id: string
  versao: string
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
    id: 'local-v271',
    versao: 'v2.7.1',
    data_atualizacao: '2026-10-15',
    notas_versao:
      'Implementação dos simuladores setoriais da Reforma Tributária (LC 214/2025, LC 227/2026), cálculo de alíquotas de referência CBS/IBS e catálogo de anexos 1 a 28.',
    status: 'anterior',
    url_instalador: '/#instalador-versao',
    canal_distribuicao: 'E-mail Oficial e PWA',
    controlado_por: 'COU — Centro de Operações Unificadas ADECONT',
    created: '2026-10-15T12:00:00.000Z',
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

/** Cadastra nova versão pelo COU. Se o status for "atual", desmarca versões anteriores que estavam como "atual" */
export async function createProgramaVersao(input: CreateVersaoInput): Promise<ProgramaVersaoItem> {
  try {
    if (input.status === 'atual') {
      // Garantir unicidade da versão atual
      const existentes = await pb.collection('programa_versoes').getFullList<ProgramaVersaoItem>({
        filter: "status = 'atual'",
      })
      for (const item of existentes) {
        await pb.collection('programa_versoes').update(item.id, { status: 'anterior' })
      }
    }

    const record = await pb.collection('programa_versoes').create<ProgramaVersaoItem>({
      ...input,
      controlado_por: input.controlado_por || 'COU — Centro de Operações Unificadas ADECONT',
    })
    return record
  } catch (err) {
    console.error('[programaVersoes] Erro ao cadastrar versão pelo COU:', err)
    throw err
  }
}

/** Altera status da versão (ex.: marcar como atual pelo COU) */
export async function setVersaoComoAtual(id: string): Promise<void> {
  try {
    const existentes = await pb.collection('programa_versoes').getFullList<ProgramaVersaoItem>({
      filter: "status = 'atual'",
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
  const protocolo =
    input.protocolo ||
    `INST-${agora.getFullYear()}${String(agora.getMonth() + 1).padStart(2, '0')}${String(agora.getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

  try {
    const record = await pb.collection('programa_envios').create<ProgramaEnvioItem>({
      ...input,
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
  dataAtualizacao: string
  notasVersao?: string
  destinatarioNome?: string
  destinatarioEmpresa?: string
  urlInstalador: string
  canal: CanalEnvioInstalacao
}): string {
  const {
    versao,
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

  return `*ADECONT — Assessoria Contábil e Administrativa*
📦 *Instalador e Controle de Versão do Programa Panorama*
🛡️ _Gerenciado e Controlado pelo COU (Centro de Operações Unificadas)_

${saudacao}

Informamos a disponibilização do link oficial para instalação e atualização do sistema *Panorama da Reforma Tributária*.

📌 *Dados da Versão Homologada pelo COU:*
• *Versão do Programa:* ${versao}
• *Data da Atualização:* ${dataFmt}
• *Responsável pelo Controle:* COU — Centro de Operações Unificadas ADECONT

${notasVersao ? `📝 *O que mudou nesta atualização:*\n${notasVersao}\n\n` : ''}🔗 *Link Direto de Instalação (Anti-bloqueio Seguro):*
${urlInstalador}

📱 *Instruções de Instalação Direta:*
1. Celulares Android (Chrome): Menu (⋮) → "Adicionar à tela inicial" ou "Instalar app".
2. Apple iPhone (Safari): Botão Compartilhar (quadrado com seta para cima) → "Adicionar à Tela de Início".
3. Computadores (Chrome/Edge): Clique no ícone de instalação na barra de navegação ou Menu (...) → Aplicativos → "Instalar este site como app".

🔒 _Acesso seguro via proxy institucional ADECONT com fontes primárias oficiais (CGIBS, LC 214/2025, LC 227/2026)._`
}
