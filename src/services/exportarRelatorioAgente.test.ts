import { describe, expect, it } from 'vitest'
import {
  blocosParaCsv,
  blocosParaTexto,
  nomeArquivoSeguroRelatorio,
  type MetaExportacaoRelatorio,
} from '@/services/exportarRelatorioAgente'
import { parseBlocosRelatorio } from '@/services/relatorioAgenteParser'

const meta: MetaExportacaoRelatorio = {
  titulo: 'Consultor da Reforma Tributária ADECONT — Relatório',
  agente: 'Consultor da Reforma Tributária ADECONT',
  dataEmissao: '19/11/2026 10:00',
}

// amostra no formato REAL devolvido pelo agente (títulos markdown, régua ---,
// tabela, bullets com valor e texto corrido) — mesma forma dos registros da
// coleção entregas_agentes
const RESPOSTA_REAL = [
  '**Consultor da Reforma Tributária – ADECONT**',
  '*Data: 19/11/2026*',
  '---',
  '## 1. Visão Geral das Alíquotas CBS e IBS',
  'A CBS incide sobre bens e serviços com alíquota padrão de 8,8%, enquanto o IBS é municipal.',
  '',
  '| Tributo | Alíquota | Início |',
  '| --- | --- | --- |',
  '| CBS | 8,8% | 2027 |',
  '| IBS | 26,5% | 2033 |',
  '',
  '- CBS: R$ 100 bilhões',
  '- IBS: R$ 200 bilhões',
  '',
  'Conclusão: o contribuinte deve revisar a parametrização antes de 2027.',
].join('\n')

describe('blocosParaTexto (TXT)', () => {
  it('leva TODO tipo de bloco: texto, título, tabela, comparativo e lista', () => {
    const txt = blocosParaTexto(parseBlocosRelatorio(RESPOSTA_REAL), meta, {
      pergunta: 'alíquotas CBS IBS 2026',
    })
    expect(txt).toContain('ADECONT — Assessoria Contábil e Administrativa')
    expect(txt).toContain('Consulta de origem: alíquotas CBS IBS 2026')
    expect(txt).toContain('1. VISÃO GERAL DAS ALÍQUOTAS CBS E IBS')
    expect(txt).toContain('A CBS incide sobre bens e serviços')
    expect(txt).toContain('Tributo | Alíquota | Início')
    expect(txt).toContain('CBS | 8,8% | 2027')
    expect(txt).toContain('CBS: R$ 100 bilhões')
    expect(txt).toContain('Consultor da Reforma Tributária – ADECONT')
    expect(txt).toContain('Conclusão: o contribuinte deve revisar')
  })

  it('nunca sai vazio quando há conteúdo', () => {
    const txt = blocosParaTexto(parseBlocosRelatorio('Apenas um parágrafo.'), meta)
    expect(txt.length).toBeGreaterThan(50)
  })
})

describe('blocosParaCsv (CSV)', () => {
  it('inclui texto corrido — não só tabelas/comparativos', () => {
    const csv = blocosParaCsv(parseBlocosRelatorio(RESPOSTA_REAL), meta)
    expect(csv.charCodeAt(0)).toBe(0xfeff) // BOM
    expect(csv).toContain('"A CBS incide sobre bens e serviços')
    expect(csv).toContain('"CBS";"8,8%";"2027"')
    expect(csv).toContain('"Item";"Valor"')
    expect(csv).toContain('"CBS";"R$ 100 bilhões"')
  })

  it('escapa aspas e quebras de linha', () => {
    const csv = blocosParaCsv(parseBlocosRelatorio('Texto com "aspas"'), meta)
    expect(csv).toContain('"""aspas"""')
  })
})

describe('nomeArquivoSeguroRelatorio', () => {
  it('remove acentos e caracteres proibidos', () => {
    expect(nomeArquivoSeguroRelatorio('Relatório: Alíquotas / CBS', 'pdf')).toMatch(
      /^ADECONT_Relatorio_Al_quotas_CBS_\d{4}-\d{2}-\d{2}\.pdf$/,
    )
  })
})
