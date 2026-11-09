import { describe, it, expect } from 'vitest'
import { extrairEmailValido, extrairNomes } from './mailchimpSyncService'
import type { EmpresaRecord } from '@/types/cadastroEmpresas'

describe('mailchimpSyncService', () => {
  describe('extrairEmailValido', () => {
    it('retorna null para valores vazios ou indefinidos', () => {
      expect(extrairEmailValido(null)).toBeNull()
      expect(extrairEmailValido('')).toBeNull()
      expect(extrairEmailValido('   ')).toBeNull()
      expect(extrairEmailValido('invalido')).toBeNull()
    })

    it('sanitiza e aceita emails válidos', () => {
      expect(extrairEmailValido('  contato@adecont.com.br  ')).toBe('contato@adecont.com.br')
      expect(extrairEmailValido('FINANCEIRO@EMPRESA.COM')).toBe('financeiro@empresa.com')
    })

    it('extrai o primeiro email quando múltiplos forem informados', () => {
      expect(extrairEmailValido('contato@empresa.com, financeiro@empresa.com')).toBe(
        'contato@empresa.com',
      )
      expect(extrairEmailValido(' fiscal@empresa.com.br ; diretor@empresa.com.br ')).toBe(
        'fiscal@empresa.com.br',
      )
    })
  })

  describe('extrairNomes', () => {
    it('divide corretamente primeiro nome e sobrenome da razão social', () => {
      const cliente = {
        id: '1',
        codigo: 10,
        tipo_documento: 'CNPJ',
        numero_documento: '00.000.000/0001-00',
        documento_limpo: '00000000000100',
        razao_social: 'ADECONT ASSESSORIA CONTABIL LTDA',
        apelido: '',
      } as EmpresaRecord
      const nomes = extrairNomes(cliente)
      expect(nomes.firstName).toBe('ADECONT')
      expect(nomes.lastName).toBe('ASSESSORIA CONTABIL LTDA')
    })

    it('prioriza nome fantasia quando preenchido', () => {
      const cliente = {
        id: '2',
        codigo: 20,
        tipo_documento: 'CNPJ',
        numero_documento: '11.111.111/0001-11',
        documento_limpo: '11111111000111',
        razao_social: 'JOAO DA SILVA ME',
        nome_fantasia: 'SILVA CONTABILIDADE',
        apelido: '',
      } as EmpresaRecord
      const nomes = extrairNomes(cliente)
      expect(nomes.firstName).toBe('SILVA')
      expect(nomes.lastName).toBe('CONTABILIDADE')
    })

    it('fornece fallback quando nenhum nome estiver disponível', () => {
      const cliente = {
        id: '3',
        codigo: 30,
        tipo_documento: 'CPF',
        numero_documento: '000.000.000-00',
        documento_limpo: '00000000000',
        razao_social: '',
        apelido: '',
      } as EmpresaRecord
      const nomes = extrairNomes(cliente)
      expect(nomes.firstName).toBe('Cliente')
      expect(nomes.lastName).toBe('ADECONT')
    })
  })
})
