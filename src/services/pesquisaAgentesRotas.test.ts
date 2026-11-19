import { describe, it, expect } from 'vitest'
import { NAVEGACAO, GRUPOS } from '@/components/navegacao'
import { resolverRota, ABAS, ROTAS_ORFAS } from '@/lib/rotas'

/**
 * Contrato da tela PESQUISA DOS AGENTES (pedido do CEO, 19/11/2026):
 * um único item de menu "Pesquisa dos Agentes", os 7 especialistas DENTRO dele
 * e a Central de Entregas num ícone exclusivo da própria tela.
 */
describe('Pesquisa dos Agentes', () => {
  it('o grupo Agentes tem UM item só, "Pesquisa dos Agentes"', () => {
    const grupo = GRUPOS.find((g) => g.id === 'agentes')
    expect(grupo).toBeDefined()
    expect(grupo!.itens).toHaveLength(1)
    expect(grupo!.itens[0].href).toBe('#pesquisa-agentes')
    expect(grupo!.itens[0].label).toBe('Pesquisa dos Agentes')
  })

  it('nenhum item #agente-* sobrou no menu (só na legada, fora da NAVEGACAO)', () => {
    const noMenu = NAVEGACAO.filter((i) => i.href.startsWith('#agente-'))
    expect(noMenu).toHaveLength(0)
  })

  it('a tecla do item não colide com nenhuma outra da NAVEGACAO', () => {
    const item = NAVEGACAO.find((i) => i.href === '#pesquisa-agentes')!
    expect(item).toBeDefined()
    const duplicadas = NAVEGACAO.filter((i) => i.tecla === item.tecla)
    expect(duplicadas).toHaveLength(1)
  })

  it('o roteador resolve #pesquisa-agentes (com e sem query) e não há rota órfã', () => {
    expect(resolverRota('#pesquisa-agentes')?.id).toBe('pesquisa-agentes')
    expect(resolverRota('#pesquisa-agentes?agente=tributario')?.id).toBe('pesquisa-agentes')
    expect(resolverRota('#pesquisa-agentes?central=1')?.id).toBe('pesquisa-agentes')
    expect(ABAS.some((a) => a.id === 'pesquisa-agentes')).toBe(true)
    expect(ROTAS_ORFAS).toHaveLength(0)
  })

  it('as rotas legadas #agente-* e #central-entregas-agentes continuam montadas', () => {
    expect(resolverRota('#agente-juridico')?.id).toBe('agente-juridico')
    expect(resolverRota('#agente-reforma-tributaria')?.id).toBe('agente-reforma-tributaria')
    expect(resolverRota('#central-entregas-agentes')?.id).toBe('central-entregas-agentes')
  })
})
