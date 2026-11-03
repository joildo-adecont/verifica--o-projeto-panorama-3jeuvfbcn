import { describe, it, expect } from 'vitest'
import {
  normalizarParaBusca,
  extrairPalavrasChave,
  correspondePalavrasChave,
} from './destaqueBusca'

describe('destaqueBusca utils', () => {
  it('normalizarParaBusca remove acentos e converte para minúsculas', () => {
    expect(normalizarParaBusca('Crédito')).toBe('credito')
    expect(normalizarParaBusca('AÇÃO DE REVISÃO')).toBe('acao de revisao')
    expect(normalizarParaBusca('Alíquota Padrão')).toBe('aliquota padrao')
  })

  it('extrairPalavrasChave decompõe consultas em termos sem acento', () => {
    expect(extrairPalavrasChave('crédito presumido agro')).toEqual(['credito', 'presumido', 'agro'])
    expect(extrairPalavrasChave('   ')).toEqual([])
    expect(extrairPalavrasChave('')).toEqual([])
  })

  it('correspondePalavrasChave aplica regra "E" e ignora acentos/caixa', () => {
    const texto = 'Concessão de crédito presumido ao produtor rural do agronegócio'
    // Apenas "credito"
    expect(correspondePalavrasChave(texto, ['credito'])).toBe(true)
    // "credito" E "presumido"
    expect(correspondePalavrasChave(texto, ['credito', 'presumido'])).toBe(true)
    // "credito" E "inexistente" deve falhar
    expect(correspondePalavrasChave(texto, ['credito', 'inexistente'])).toBe(false)
    // Lista vazia deve retornar true (sem filtro)
    expect(correspondePalavrasChave(texto, [])).toBe(true)
  })

  it('correspondePalavrasChave funciona com array de campos de texto', () => {
    const campos = ['Resolução CGIBS 14', 'Regulamenta o IBS e a CBS', 'Tributação de cigarros']
    expect(correspondePalavrasChave(campos, ['cgibs', 'cigarros'])).toBe(true)
    expect(correspondePalavrasChave(campos, ['cgibs', 'petroleo'])).toBe(false)
  })
})
