import { describe, it, expect } from 'vitest'
import pb from './pocketbase/client'

describe('Inspecionar cliente_arquivos Cardoso', () => {
  it('lista e baixa os PDFs anexados à Cardoso', async () => {
    const list = await pb.collection('cliente_arquivos').getFullList({
      filter: 'cliente_codigo = 94109 || cliente_cnpj = "94109" || cliente_cnpj = "COD94109"',
    })
    console.log(`Encontrados ${list.length} arquivos`)
    for (const r of list) {
      console.log(`ID: ${r.id}, titulo: ${r.titulo}, arq: ${r.arquivo}, tamanho: ${r.tamanho_bytes}, cnpj: ${r.cliente_cnpj}`)
    }
    expect(list.length).toBeGreaterThan(0)
  })
})
