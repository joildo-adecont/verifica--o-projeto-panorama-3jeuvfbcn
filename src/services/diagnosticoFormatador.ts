/**
 * Extensões e utilitários de formatação de pareceres e relatórios tributários ADECONT
 */

export interface SecoesRelatorioFormatado {
  resumoExecutivo: string
  pontosAtencao: string
  passoAPasso: string
  interligacoes?: string
}

/**
 * Analisa uma resposta textual emitida pelo Agente de IA e tenta extrair
 * de forma inteligente as seções solicitadas pelo CEO:
 * 1. Resumo da matéria / parecer
 * 2. Pontos de atenção
 * 3. Passo a passo / orientações
 */
export function extrairSecoesDeRespostaAgente(texto: string): SecoesRelatorioFormatado {
  if (!texto || !texto.trim()) {
    return {
      resumoExecutivo: '',
      pontosAtencao: '',
      passoAPasso: '',
    }
  }

  // Divisão por cabeçalhos comuns (ex.: "1. ", "2. ", "## ", "Pontos de Atenção", etc.)
  const linhas = texto.split(/\r?\n/)
  let secaoAtual: 'resumo' | 'atencao' | 'passo' = 'resumo'

  const buffers: Record<'resumo' | 'atencao' | 'passo', string[]> = {
    resumo: [],
    atencao: [],
    passo: [],
  }

  for (const linha of linhas) {
    const limpa = linha.trim().toLowerCase()

    if (
      limpa.includes('ponto de atenção') ||
      limpa.includes('pontos de atenção') ||
      limpa.includes('ponto crítico') ||
      limpa.includes('fusão administrativa') ||
      limpa.startsWith('2. pontos de atenção') ||
      limpa.startsWith('## 2. pontos') ||
      limpa.startsWith('## pontos de atenção')
    ) {
      secaoAtual = 'atencao'
      buffers.atencao.push(linha)
      continue
    }

    if (
      limpa.includes('passo a passo') ||
      limpa.includes('orientações para implementação') ||
      limpa.includes('etapa 1') ||
      limpa.includes('plano de ação') ||
      limpa.startsWith('3. orientações') ||
      limpa.startsWith('3. passo a passo') ||
      limpa.startsWith('## 3. passo') ||
      limpa.startsWith('## passo a passo')
    ) {
      secaoAtual = 'passo'
      buffers.passo.push(linha)
      continue
    }

    if (
      limpa.startsWith('1. resumo') ||
      limpa.startsWith('1. parecer') ||
      limpa.startsWith('## 1. parecer') ||
      limpa.startsWith('## resumo')
    ) {
      secaoAtual = 'resumo'
      buffers.resumo.push(linha)
      continue
    }

    buffers[secaoAtual].push(linha)
  }

  const resumo = buffers.resumo.join('\n').trim()
  const atencao = buffers.atencao.join('\n').trim()
  const passo = buffers.passo.join('\n').trim()

  return {
    resumoExecutivo: resumo || texto,
    pontosAtencao: atencao,
    passoAPasso: passo,
  }
}
