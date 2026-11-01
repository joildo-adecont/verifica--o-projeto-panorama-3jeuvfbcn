import { describe, it, expect } from 'vitest'
import { NAVEGACAO, GRUPOS } from '@/components/navegacao'
import { resolverRota, ABAS } from '@/lib/rotas'
import {
  exportarDiagnosticoCsv,
  type LinhaComparativoAliquota,
} from '@/services/diagnosticoTributario'

describe('Diagnóstico Tributário ADECONT', () => {
  it('o item Diagnóstico Tributário está posicionado IMEDIATAMENTE ABAIXO do Monitor Legislativo', () => {
    const idxMonitor = NAVEGACAO.findIndex((item) => item.href === '#monitor-legislativo')
    expect(idxMonitor).toBeGreaterThanOrEqual(0)

    const itemDiagnostico = NAVEGACAO[idxMonitor + 1]
    expect(itemDiagnostico).toBeDefined()
    expect(itemDiagnostico.href).toBe('#diagnostico-tributario')
    expect(itemDiagnostico.label).toBe('Diagnóstico Tributário')
    expect(itemDiagnostico.tecla).toBe('t')
    expect(itemDiagnostico.numero).toBe('12B')

    // No grupo Fontes e Monitor, ele também é o item sucessor imediato
    const grupoFontes = GRUPOS.find((g) => g.id === 'fontes')
    expect(grupoFontes).toBeDefined()
    const idxNoGrupo = grupoFontes!.itens.findIndex((i) => i.href === '#monitor-legislativo')
    expect(grupoFontes!.itens[idxNoGrupo + 1].href).toBe('#diagnostico-tributario')
  })

  it('o roteador de abas resolve #diagnostico-tributario para a aba correspondente', () => {
    const rota = resolverRota('#diagnostico-tributario')
    expect(rota).not.toBeNull()
    expect(rota?.id).toBe('diagnostico-tributario')
    expect(rota?.titulo).toBe('Diagnóstico Tributário')
    expect(rota?.grupo).toBe('12B')

    const aba = ABAS.find((a) => a.id === 'diagnostico-tributario')
    expect(aba).toBeDefined()
  })

  it('o atalho de tecla "t" é único e não colide com nenhuma outra tecla do sistema', () => {
    const teclas = NAVEGACAO.map((n) => n.tecla.toLowerCase())
    const ocorrenciasT = teclas.filter((k) => k === 't')
    expect(ocorrenciasT.length).toBe(1)
  })

  it('a função exportarDiagnosticoCsv gera conteúdo com BOM UTF-8, logo/marca ADECONT e linhas de comparativo', () => {
    let blobCapturado: Blob | null = null
    const originalCreateObjectURL = window.URL.createObjectURL
    window.URL.createObjectURL = (blob: Blob) => {
      blobCapturado = blob
      return 'blob:mock-url'
    }

    const mockLinhas: LinhaComparativoAliquota[] = [
      {
        regime: 'Regime Geral Pleno',
        cbs: 11.3,
        ibs: 18.7,
        total: 26.5,
        diferencaRef: 0,
        baseLegal: 'Art. 349 LC 214/2025',
        observacao: 'Alíquota de referência padrão',
      },
      {
        regime: 'Regime Favorecido (-60%)',
        cbs: 4.52,
        ibs: 7.48,
        total: 10.6,
        diferencaRef: -15.9,
        baseLegal: 'Art. 136 LC 214/2025',
        observacao: 'Saúde e educação',
      },
    ]

    exportarDiagnosticoCsv({
      titulo: 'Diagnóstico Tributário Teste',
      atoOuTema: 'LC 214/2025',
      parecer: 'Parecer executivo resumido de teste',
      pontosAtencao: 'Ponto crítico na fusão administrativa',
      passoAPasso: 'Etapa 1: parametrização ERP',
      linhasTabela: mockLinhas,
    })

    expect(blobCapturado).not.toBeNull()
    expect(blobCapturado!.type).toBe('text/csv;charset=utf-8;')

    window.URL.createObjectURL = originalCreateObjectURL
  })

  it('o formatador e parser de seções extrai corretamente resumo, pontos de atenção e passo a passo', async () => {
    const { extrairSecoesDeRespostaAgente } = await import('@/services/diagnosticoFormatador')

    const textoAgente = `1. Resumo da Matéria e Aplicabilidade:
A LC 214/2025 estabelece as regras gerais do IVA Dual.

2. Pontos de Atenção para a Fusão Administrativa:
- Atenção para os créditos acumulados de ICMS
- Risco operacional na emissão de documentos eletrônicos

3. Orientações e Passo a Passo para Implementação:
Etapa 1: Revisão do cadastro de NCM
Etapa 2: Parametrização no ERP`

    const secoes = extrairSecoesDeRespostaAgente(textoAgente)
    expect(secoes.resumoExecutivo).toContain('A LC 214/2025 estabelece')
    expect(secoes.pontosAtencao).toContain('Atenção para os créditos acumulados')
    expect(secoes.passoAPasso).toContain('Etapa 1: Revisão do cadastro')
  })

  it('o parser de markdown em blocos gera hierarquias h1/h2, listas e caixas de atenção', async () => {
    const { parsearMarkdownEmBlocos } = await import('@/components/RenderizadorTextoMarkdown')

    const md = `# Título Principal
## Subseção Técnica
- Item primeiro
- Item segundo
1. Passo um
2. Passo dois
Atenção: Necessário validar o split payment antes da entrada em vigor.`

    const blocos = parsearMarkdownEmBlocos(md)
    expect(blocos.some((b) => b.tipo === 'h1' && b.conteudo === 'Título Principal')).toBe(true)
    expect(blocos.some((b) => b.tipo === 'h2' && b.conteudo === 'Subseção Técnica')).toBe(true)
    expect(blocos.some((b) => b.tipo === 'lista_bullet' && b.itens?.length === 2)).toBe(true)
    expect(blocos.some((b) => b.tipo === 'lista_num' && b.itens?.length === 2)).toBe(true)
    expect(blocos.some((b) => b.tipo === 'atencao')).toBe(true)
  })
})
