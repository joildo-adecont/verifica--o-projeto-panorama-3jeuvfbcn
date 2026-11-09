import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  sanitizarDoc,
  formatarLinkContato,
  salvarCampoPersonalizado,
  listarCamposPersonalizados,
  excluirCampoPersonalizado,
  salvarValoresCamposCliente,
  carregarValoresCamposCliente,
  salvarContatoCliente,
  listarContatosCliente,
  excluirContatoCliente,
} from './clienteDadosComplementaresService'
import pb from '@/lib/pocketbase/client'

// Mock simples do PocketBase para testes unitários
vi.mock('@/lib/pocketbase/client', () => {
  const store: Record<string, any[]> = {
    cliente_campos_def: [],
    cliente_campos_valores: [],
    cliente_contatos: [],
    cliente_arquivos: [],
  }

  return {
    default: {
      collection: (name: string) => ({
        getFullList: vi.fn(async () => store[name] || []),
        getFirstListItem: vi.fn(async (filter: string) => {
          const list = store[name] || []
          if (list.length > 0) return list[0]
          throw new Error('Not found')
        }),
        create: vi.fn(async (data: any) => {
          const id = `mock_${Date.now()}_${Math.random()}`
          const item = { ...data, id, created: new Date().toISOString() }
          store[name] = store[name] || []
          store[name].push(item)
          return item
        }),
        update: vi.fn(async (id: string, data: any) => {
          const list = store[name] || []
          const idx = list.findIndex((i) => i.id === id)
          if (idx >= 0) {
            list[idx] = { ...list[idx], ...data, updated: new Date().toISOString() }
            return list[idx]
          }
          return { id, ...data }
        }),
        delete: vi.fn(async (id: string) => {
          store[name] = (store[name] || []).filter((i) => i.id !== id)
          return true
        }),
      }),
      files: {
        getUrl: vi.fn((rec: any, filename: string) => `http://mock.pb/files/${rec.id}/${filename}`),
      },
    },
  }
})

describe('clienteDadosComplementaresService', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('sanitizarDoc remove caracteres não numéricos', () => {
    expect(sanitizarDoc('12.345.678/0001-90')).toBe('12345678000190')
    expect(sanitizarDoc('123.456.789-00')).toBe('12345678900')
    expect(sanitizarDoc(undefined)).toBe('')
  })

  it('formatarLinkContato gera links corretos para canais', () => {
    // E-mail
    expect(formatarLinkContato('email', 'contato@adecont.com.br')).toBe(
      'mailto:contato@adecont.com.br',
    )
    expect(formatarLinkContato('email', 'mailto:financeiro@adecont.com.br')).toBe(
      'mailto:financeiro@adecont.com.br',
    )

    // WhatsApp
    expect(formatarLinkContato('whatsapp', '(11) 98765-4321')).toBe('https://wa.me/5511987654321')
    expect(formatarLinkContato('whatsapp', '5511987654321')).toBe('https://wa.me/5511987654321')

    // Redes sociais
    expect(formatarLinkContato('instagram', '@adecont_assessoria')).toBe(
      'https://instagram.com/adecont_assessoria',
    )
    expect(formatarLinkContato('instagram', 'adecont_assessoria')).toBe(
      'https://instagram.com/adecont_assessoria',
    )
    expect(formatarLinkContato('facebook', 'adecont')).toBe('https://facebook.com/adecont')
    expect(formatarLinkContato('linkedin', 'empresa/adecont')).toBe(
      'https://linkedin.com/in/empresa/adecont',
    )
    expect(formatarLinkContato('telegram', '@adecont_bot')).toBe('https://t.me/adecont_bot')
    expect(formatarLinkContato('site', 'www.adecont.com.br')).toBe('https://www.adecont.com.br')
  })

  it('permite criar e listar definições de campos personalizados', async () => {
    const campo = await salvarCampoPersonalizado({
      chave: 'tributacao_especial',
      rotulo: 'Tributação Especial',
      tipo: 'texto',
      descricao: 'Campo de teste',
      ativo: true,
    })

    expect(campo.chave).toBe('tributacao_especial')
    expect(campo.rotulo).toBe('Tributação Especial')

    const campos = await listarCamposPersonalizados()
    expect(campos.length).toBeGreaterThan(0)
    expect(campos.some((c) => c.chave === 'tributacao_especial')).toBe(true)
  })

  it('permite salvar e carregar valores de campos de um cliente', async () => {
    const cnpj = '12.345.678/0001-90'
    await salvarValoresCamposCliente(
      cnpj,
      {
        tributacao_especial: 'Incentivo Fiscal Sudene',
        observacao_interna: 'Cliente VIP',
      },
      101,
    )

    const valores = await carregarValoresCamposCliente(cnpj, 101)
    expect(valores.tributacao_especial).toBe('Incentivo Fiscal Sudene')
    expect(valores.observacao_interna).toBe('Cliente VIP')
  })

  it('permite criar, listar e excluir contatos do cliente', async () => {
    const cnpj = '12345678000190'
    const c1 = await salvarContatoCliente({
      cliente_cnpj: cnpj,
      cliente_codigo: 101,
      tipo: 'whatsapp',
      identificador: '(11) 98765-4321',
      rotulo: 'Diretoria',
      principal: true,
    })

    expect(c1.id).toBeDefined()
    expect(c1.tipo).toBe('whatsapp')

    const contatos = await listarContatosCliente(cnpj, 101)
    expect(contatos.length).toBeGreaterThan(0)

    if (c1.id) {
      const ok = await excluirContatoCliente(c1.id)
      expect(ok).toBe(true)
    }
  })
})
