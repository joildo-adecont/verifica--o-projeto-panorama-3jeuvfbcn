import { describe, it, expect } from 'vitest'
import { carregarDiagnosticoClientePastore } from './diagnosticoPastore'

describe('diagnosticoPastore - receita e recomendação', () => {
  it('não deve conter menção a 12,5 milhões como faturamento atual', async () => {
    const diag = await carregarDiagnosticoClientePastore()

    // Valida que o motivo principal traz a receita acumulada real e não "fatura ~R$ 12,5 milhões/ano"
    expect(diag.recomendacao.motivoPrincipal).not.toContain('12,5 milhões')
    expect(diag.recomendacao.motivoPrincipal).not.toContain('12.5')
    expect(diag.recomendacao.motivoPrincipal).toContain('R$ 6.303.501,27')
    expect(diag.recomendacao.motivoPrincipal).toContain('R$ 6,3 milhões')
    expect(diag.recomendacao.motivoPrincipal).toContain('projeção anualizada')

    // Valida pontos-chave
    for (const ponto of diag.recomendacao.pontosChave) {
      expect(ponto).not.toContain('12,5')
      expect(ponto).not.toContain('12.5')
    }

    // Valida linhas comparativas
    for (const linha of diag.linhasComparativo) {
      expect(linha.criterio).not.toContain('12,5')
      expect(linha.criterio).not.toContain('12.5')
      expect(linha.lucroPresumido.detalhe).not.toContain('12,5')
      expect(linha.lucroReal.detalhe).not.toContain('12,5')
      expect(linha.reforma2027.detalhe).not.toContain('12,5')
      expect(linha.reforma2027.detalhe).not.toContain('> R$ 12 mi')
    }

    // Valida economia frente ao Presumido e margem
    expect(diag.recomendacao.motivoPrincipal).toContain('margem retida líquida de apenas ~1,1%')
    expect(diag.recomendacao.motivoPrincipal).toContain(
      'economia anual estimada de mais de R$ 500 mil',
    )
    expect(diag.recomendacao.motivoPrincipal).toContain('Regime Regular de IBS/CBS')
    expect(diag.recomendacao.motivoPrincipal).toContain('Lucro Real')
  })
})
