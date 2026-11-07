import { describe, it, expect } from 'vitest'
import {
  escaparCampoCsv,
  formatarNumeroBr,
  extrairMetadadosNfeXml,
  gerarCsvLoteXml,
  type ItemLoteExportacao,
} from './exportarLoteXmlCsv'

describe('exportarLoteXmlCsv', () => {
  it('escapa adequadamente campos com aspas, quebras de linha e ponto-e-vírgula', () => {
    expect(escaparCampoCsv('Texto simples')).toBe('"Texto simples"')
    expect(escaparCampoCsv('Texto com "aspas"')).toBe('"Texto com ""aspas"""')
    expect(escaparCampoCsv('Linha 1\nLinha 2')).toBe('"Linha 1 Linha 2"')
    expect(escaparCampoCsv('Valor;com;ponto-e-virgula')).toBe('"Valor;com;ponto-e-virgula"')
    expect(escaparCampoCsv(null)).toBe('""')
    expect(escaparCampoCsv(undefined)).toBe('""')
  })

  it('formata número decimal com vírgula para Excel brasileiro', () => {
    expect(formatarNumeroBr(1234.56)).toBe('1234,56')
    expect(formatarNumeroBr(0)).toBe('0,00')
    expect(formatarNumeroBr(null)).toBe('')
  })

  it('extrai metadados do XML da NFe corretamente', () => {
    const xml = `
      <nfeProc xmlns="http://www.portalfiscal.inf.br/nfe">
        <NFe>
          <infNFe Id="NFe41260141844038000128550010000415601000415608">
            <ide>
              <nNF>41560</nNF>
              <serie>1</serie>
              <natOp>VENDA DE MERCADORIA</natOp>
              <dhEmi>2026-01-16T10:45:00-03:00</dhEmi>
              <tpNF>1</tpNF>
            </ide>
            <emit>
              <CNPJ>41844038000128</CNPJ>
              <xNome>EMITENTE TESTE LTDA</xNome>
            </emit>
            <dest>
              <CNPJ>00000000000191</CNPJ>
              <xNome>DESTINATARIO TESTE SA</xNome>
            </dest>
            <det nItem="1">
              <prod>
                <CFOP>5102</CFOP>
                <vProd>150.00</vProd>
              </prod>
            </det>
            <total>
              <ICMSTot>
                <vNF>150.00</vNF>
              </ICMSTot>
            </total>
          </infNFe>
        </NFe>
      </nfeProc>
    `

    const meta = extrairMetadadosNfeXml(xml)
    expect(meta.chaveAcesso).toBe('41260141844038000128550010000415601000415608')
    expect(meta.numero).toBe('41560')
    expect(meta.serie).toBe('1')
    expect(meta.naturezaOperacao).toBe('VENDA DE MERCADORIA')
    expect(meta.emitenteNome).toBe('EMITENTE TESTE LTDA')
    expect(meta.emitenteDoc).toBe('41844038000128')
    expect(meta.destinatarioNome).toBe('DESTINATARIO TESTE SA')
    expect(meta.destinatarioDoc).toBe('00000000000191')
    expect(meta.direcao).toBe('Saída')
    expect(meta.tipoOperacao).toBe('Venda')
    expect(meta.quantidadeItens).toBe(1)
    expect(meta.valorTotal).toBe(150.0)
  })

  it('gera CSV com BOM UTF-8, cabeçalho e linhas delimitadas por ponto-e-vírgula', () => {
    const itens: ItemLoteExportacao[] = [
      {
        nomeArquivo: 'nota-01.xml',
        statusFormatado: 'Processada',
        chaveAcesso: '41260141844038000128550010000415601000415608',
        numero: '41560',
        serie: '1',
        naturezaOperacao: 'VENDA',
        direcao: 'Saída',
        tipoOperacao: 'Venda',
        emitenteNome: 'EMITENTE',
        emitenteDoc: '11111111000111',
        destinatarioNome: 'DESTINATARIO',
        destinatarioDoc: '22222222000122',
        dataEmissao: '2026-01-16 10:45:00',
        quantidadeItens: 1,
        valorTotal: 250.75,
        motivoErro: '',
      },
      {
        nomeArquivo: 'nota-duplicada.xml',
        statusFormatado: 'Duplicada (Rejeitada)',
        chaveAcesso: '41260141844038000128550010000415601000415608',
        motivoErro: 'Nota já cadastrada (chave de 44 dígitos duplicada)',
      },
    ]

    const csv = gerarCsvLoteXml(itens)

    expect(csv.startsWith('\uFEFF')).toBe(true)
    const linhas = csv.replace('\uFEFF', '').split('\r\n')
    expect(linhas.length).toBe(3) // Cabeçalho + 2 linhas

    // Cabeçalho
    expect(linhas[0]).toContain('"Nome do Arquivo";"Status";"Chave de Acesso"')

    // Linha 1
    expect(linhas[1]).toContain('"nota-01.xml";"Processada"')
    expect(linhas[1]).toContain('"250,75"')

    // Linha 2
    expect(linhas[2]).toContain('"nota-duplicada.xml";"Duplicada (Rejeitada)"')
    expect(linhas[2]).toContain('"Nota já cadastrada (chave de 44 dígitos duplicada)"')
  })
})
