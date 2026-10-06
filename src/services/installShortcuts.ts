import pb from '@/lib/pocketbase/client'

export type ShortcutDeviceType = 'todos' | 'android' | 'iphone' | 'computador'

export interface InstallShortcutItem {
  id: string
  titulo: string
  device_type: ShortcutDeviceType
  url: string
  instrucoes: string
  observacoes?: string
  criado_por?: string
  envios_count?: number
  created?: string
  updated?: string
}

export interface CreateShortcutInput {
  titulo: string
  device_type: ShortcutDeviceType
  url: string
  instrucoes: string
  observacoes?: string
  criado_por?: string
}

const FALLBACK_SHORTCUTS: InstallShortcutItem[] = [
  {
    id: 'local-universal',
    titulo: 'Atalho Universal — Todos os Dispositivos',
    device_type: 'todos',
    url:
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://verificacao-projeto-panorama-18549.goskip.app/',
    instrucoes:
      '1. Celulares (Android/Chrome): Menu (⋮) → "Adicionar à tela inicial" ou "Instalar app".\n2. iPhone (Safari): Toque em Compartilhar (ícone do quadrado com seta para cima) → "Adicionar à Tela de Início".\n3. Computadores (Chrome/Edge): Clique no ícone de instalação na barra de navegação (computador com seta para baixo) ou Menu (...) → Aplicativos → "Instalar este site como app".',
    observacoes: 'Atalho mestre completo com passo a passo para todos os ambientes',
    criado_por: 'Sistema ADECONT',
    envios_count: 0,
    created: new Date().toISOString(),
  },
  {
    id: 'local-android',
    titulo: 'Instalação Mobile — Celulares Android (Chrome)',
    device_type: 'android',
    url:
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://verificacao-projeto-panorama-18549.goskip.app/',
    instrucoes:
      '1. Abra o link no navegador Google Chrome no Android.\n2. Toque no menu de três pontos (⋮) no canto superior direito.\n3. Selecione a opção "Adicionar à tela inicial" ou "Instalar aplicativo".\n4. Confirme tocando em "Instalar". O ícone ADECONT aparecerá na sua tela de aplicativos.',
    observacoes: 'Instalação PWA direta no Android com logo oficial',
    criado_por: 'Sistema ADECONT',
    envios_count: 0,
    created: new Date().toISOString(),
  },
  {
    id: 'local-iphone',
    titulo: 'Instalação Mobile — Celulares Apple iPhone (Safari)',
    device_type: 'iphone',
    url:
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://verificacao-projeto-panorama-18549.goskip.app/',
    instrucoes:
      '1. Abra o link no Safari do seu iPhone.\n2. Toque no botão Compartilhar (quadrado azul com seta para cima) na barra inferior.\n3. Role as opções e selecione "Adicionar à Tela de Início" (+).\n4. Toque em "Adicionar" no canto superior direito. O ícone ADECONT aparecerá junto aos seus apps.',
    observacoes: 'Suporte a Apple Touch Icon 180x180',
    criado_por: 'Sistema ADECONT',
    envios_count: 0,
    created: new Date().toISOString(),
  },
  {
    id: 'local-computador',
    titulo: 'Instalação Desktop — Computadores Windows e Mac (Chrome/Edge)',
    device_type: 'computador',
    url:
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://verificacao-projeto-panorama-18549.goskip.app/',
    instrucoes:
      '1. Abra o sistema no Google Chrome ou Microsoft Edge no computador.\n2. Na barra de endereços, clique no botão "Instalar aplicativo" (ícone com tela e seta ou monitor).\n3. Ou acesse Menu (...) → Aplicativos → "Instalar ADECONT Panorama".\n4. O sistema funcionará em janela dedicada, podendo ser fixado na Barra de Tarefas ou no Dock.',
    observacoes: 'Acesso rápido para trabalho contábil e consultoria no PC',
    criado_por: 'Sistema ADECONT',
    envios_count: 0,
    created: new Date().toISOString(),
  },
  {
    id: 'local-base-ncm',
    titulo: 'Base de Classificações NCM — Completa (15.240 itens oficiais)',
    device_type: 'todos',
    url: '/backend/v1/export-classifications?tipo=NCM&formato=csv',
    instrucoes:
      '1. Clique no link para baixar o arquivo CSV oficial da base NCM.\n2. Compatibilidade direta: arquivo codificado com BOM UTF-8 e separador ponto-e-vírgula (;), abrindo com acentuação e colunas perfeitas no Microsoft Excel e Google Planilhas.\n3. Contém a base integral NCM oficial (15.240 itens oficiais do Siscomex/MDIC, referência 01/10/2026) servida pelo backend seguro ADECONT (política anti-bloqueio).',
    observacoes:
      'Base oficial completa NCM (15.240 itens Siscomex/MDIC, ref. 01/10/2026) em CSV com BOM UTF-8 e ponto-e-vírgula.',
    criado_por: 'Equipe ADECONT',
    envios_count: 0,
    created: new Date().toISOString(),
  },
]

export async function fetchInstallShortcuts(): Promise<InstallShortcutItem[]> {
  try {
    const records = await pb.collection('install_shortcuts').getFullList<InstallShortcutItem>({
      sort: '-created',
    })
    if (records && records.length > 0) {
      return records
    }
    return FALLBACK_SHORTCUTS
  } catch (err) {
    console.warn('[install_shortcuts] Falha ao carregar do backend, usando sementes:', err)
    return FALLBACK_SHORTCUTS
  }
}

export async function createInstallShortcut(
  input: CreateShortcutInput,
): Promise<InstallShortcutItem> {
  try {
    const record = await pb.collection('install_shortcuts').create<InstallShortcutItem>({
      ...input,
      envios_count: 0,
    })
    return record
  } catch (err) {
    console.error('[install_shortcuts] Erro ao depositar atalho:', err)
    throw err
  }
}

export async function registerShortcutSend(id: string): Promise<void> {
  try {
    // Incrementa contagem de envios se não for local
    if (!id.startsWith('local-')) {
      const current = await pb.collection('install_shortcuts').getOne<InstallShortcutItem>(id)
      const novoTotal = (current.envios_count || 0) + 1
      await pb.collection('install_shortcuts').update(id, { envios_count: novoTotal })
    }
  } catch (err) {
    console.warn('[install_shortcuts] Não foi possível atualizar contador:', err)
  }
}
