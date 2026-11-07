import pb from '@/lib/pocketbase/client'
import { DOCUMENTOS_CHECKLIST_PADRAO } from '@/data/checklistDocumentalPadrao'
import { criarExercicioVazio } from '@/services/motorAnaliseEmpresarial'
import type {
  ExercicioFinanceiroCompleto,
  ChecklistDocumentalItem,
  ResumoCompletudeChecklist,
  AchadoDueDiligence,
  ParecerFinalEstruturado,
  BlocoScorePonderado,
} from '@/types/analisesEmpresariaisModel'

/**
 * Normaliza CNPJ (somente números)
 */
export function limparCnpj(cnpj: string): string {
  return (cnpj || '').replace(/\D/g, '')
}

/**
 * 1. BALANÇOS & DRE DE 3 EXERCÍCIOS
 */
export async function carregarBalancosTresExercicios(cnpj: string): Promise<{
  anoMenos2: ExercicioFinanceiroCompleto
  anoMenos1: ExercicioFinanceiroCompleto
  anoAtual: ExercicioFinanceiroCompleto
}> {
  const cnpjLimpo = limparCnpj(cnpj)
  const defaultRes = {
    anoMenos2: criarExercicioVazio('Ano -2'),
    anoMenos1: criarExercicioVazio('Ano -1'),
    anoAtual: criarExercicioVazio('Ano Atual'),
  }

  if (!cnpjLimpo) return defaultRes

  try {
    const records = await pb.collection('analise_balancos').getFullList({
      filter: `cliente_cnpj = "${cnpjLimpo}"`,
      sort: 'exercicio',
    })

    for (const rec of records) {
      const ex = rec.exercicio
      const payload: ExercicioFinanceiroCompleto = {
        rotulo: ex === 'ano_menos_2' ? 'Ano -2' : ex === 'ano_menos_1' ? 'Ano -1' : 'Ano Atual',
        anoCalendario: rec.ano_calendario || '',
        ativoCirculante: rec.dados_balanco?.ativoCirculante || defaultRes.anoAtual.ativoCirculante,
        ativoNaoCirculante:
          rec.dados_balanco?.ativoNaoCirculante || defaultRes.anoAtual.ativoNaoCirculante,
        passivoCirculante:
          rec.dados_balanco?.passivoCirculante || defaultRes.anoAtual.passivoCirculante,
        passivoNaoCirculante:
          rec.dados_balanco?.passivoNaoCirculante || defaultRes.anoAtual.passivoNaoCirculante,
        patrimonioLiquido:
          rec.dados_balanco?.patrimonioLiquido || defaultRes.anoAtual.patrimonioLiquido,
        dre: rec.dados_dre || defaultRes.anoAtual.dre,
        complementares: rec.dados_complementares || defaultRes.anoAtual.complementares,
      }

      if (ex === 'ano_menos_2') defaultRes.anoMenos2 = payload
      else if (ex === 'ano_menos_1') defaultRes.anoMenos1 = payload
      else if (ex === 'ano_atual') defaultRes.anoAtual = payload
    }
  } catch (err) {
    console.warn('[analisesEmpresariaisService] Erro ao carregar balancos:', err)
  }

  return defaultRes
}

export async function salvarExercicioBalanco(
  cnpj: string,
  exercicioTipo: 'ano_menos_2' | 'ano_menos_1' | 'ano_atual',
  dados: ExercicioFinanceiroCompleto,
): Promise<void> {
  const cnpjLimpo = limparCnpj(cnpj)
  if (!cnpjLimpo) return

  const payload = {
    cliente_cnpj: cnpjLimpo,
    exercicio: exercicioTipo,
    ano_calendario: dados.anoCalendario || '',
    dados_balanco: {
      ativoCirculante: dados.ativoCirculante,
      ativoNaoCirculante: dados.ativoNaoCirculante,
      passivoCirculante: dados.passivoCirculante,
      passivoNaoCirculante: dados.passivoNaoCirculante,
      patrimonioLiquido: dados.patrimonioLiquido,
    },
    dados_dre: dados.dre,
    dados_complementares: dados.complementares,
    atualizado_por: 'Analista ADECONT',
  }

  try {
    const existing = await pb
      .collection('analise_balancos')
      .getFirstListItem(`cliente_cnpj = "${cnpjLimpo}" && exercicio = "${exercicioTipo}"`)
      .catch(() => null)

    if (existing) {
      await pb.collection('analise_balancos').update(existing.id, payload)
    } else {
      await pb.collection('analise_balancos').create(payload)
    }
  } catch (err) {
    console.error('[analisesEmpresariaisService] Erro ao salvar balanço:', err)
    throw err
  }
}

/**
 * 2. CHECKLIST DOCUMENTAL (51 itens)
 */
export async function carregarChecklistCliente(cnpj: string): Promise<ChecklistDocumentalItem[]> {
  const cnpjLimpo = limparCnpj(cnpj)
  // Monta lista inicial com os 51 itens padrão não recebidos
  const catalogo: ChecklistDocumentalItem[] = DOCUMENTOS_CHECKLIST_PADRAO.map((doc) => ({
    ...doc,
    recebido: false,
    observacao: '',
  }))

  if (!cnpjLimpo) return catalogo

  try {
    const records = await pb.collection('analise_checklist').getFullList({
      filter: `cliente_cnpj = "${cnpjLimpo}"`,
    })

    const recMap = new Map(records.map((r) => [r.item_id, r]))

    return catalogo.map((item) => {
      const salvo = recMap.get(item.id)
      if (salvo) {
        return {
          ...item,
          recebido: !!salvo.recebido,
          observacao: salvo.observacao || '',
        }
      }
      return item
    })
  } catch (err) {
    console.warn('[analisesEmpresariaisService] Erro ao carregar checklist:', err)
    return catalogo
  }
}

export async function atualizarStatusItemChecklist(
  cnpj: string,
  itemId: string,
  recebido: boolean,
  observacao?: string,
): Promise<void> {
  const cnpjLimpo = limparCnpj(cnpj)
  if (!cnpjLimpo) return

  const itemPadrao = DOCUMENTOS_CHECKLIST_PADRAO.find((d) => d.id === itemId)
  if (!itemPadrao) return

  try {
    const existing = await pb
      .collection('analise_checklist')
      .getFirstListItem(`cliente_cnpj = "${cnpjLimpo}" && item_id = "${itemId}"`)
      .catch(() => null)

    const payload = {
      cliente_cnpj: cnpjLimpo,
      item_id: itemId,
      categoria: itemPadrao.categoria,
      documento: itemPadrao.documento,
      obrigatorio: itemPadrao.obrigatorio,
      recebido,
      observacao: observacao ?? existing?.observacao ?? '',
      data_recebimento: recebido ? new Date().toISOString() : '',
    }

    if (existing) {
      await pb.collection('analise_checklist').update(existing.id, payload)
    } else {
      await pb.collection('analise_checklist').create(payload)
    }
  } catch (err) {
    console.error('[analisesEmpresariaisService] Erro ao atualizar item checklist:', err)
    throw err
  }
}

export function calcularResumoChecklist(
  itens: ChecklistDocumentalItem[],
): ResumoCompletudeChecklist {
  const itensTotais = itens.length
  const itensRecebidos = itens.filter((i) => i.recebido).length
  const percentualCompletude =
    itensTotais > 0 ? Number(((itensRecebidos / itensTotais) * 100).toFixed(1)) : 0

  const obrigatorios = itens.filter((i) => i.obrigatorio)
  const obrigatoriosTotais = obrigatorios.length
  const obrigatoriosRecebidos = obrigatorios.filter((i) => i.recebido).length
  const percentualObrigatorios =
    obrigatoriosTotais > 0
      ? Number(((obrigatoriosRecebidos / obrigatoriosTotais) * 100).toFixed(1))
      : 0

  return {
    itensTotais,
    itensRecebidos,
    percentualCompletude,
    obrigatoriosTotais,
    obrigatoriosRecebidos,
    percentualObrigatorios,
  }
}

/**
 * 3. MATRIZ DE ACHADOS (DUE DILIGENCE)
 */
export async function carregarAchadosCliente(cnpj: string): Promise<AchadoDueDiligence[]> {
  const cnpjLimpo = limparCnpj(cnpj)
  if (!cnpjLimpo) return []

  try {
    const records = await pb.collection('analise_achados').getFullList({
      filter: `cliente_cnpj = "${cnpjLimpo}"`,
      sort: '-created',
    })

    return records.map((r) => ({
      id: r.id,
      cliente_cnpj: r.cliente_cnpj,
      area: r.area || 'Contábil',
      achado: r.achado || '',
      evidencia: r.evidencia || '',
      impacto: (r.impacto as AchadoDueDiligence['impacto']) || 'Médio',
      risco: (r.risco as AchadoDueDiligence['risco']) || 'Médio',
      recomendacao: r.recomendacao || '',
      responsavel: r.responsavel || '',
      prazo: r.prazo || '',
      status: (r.status as AchadoDueDiligence['status']) || 'Em andamento',
    }))
  } catch (err) {
    console.warn('[analisesEmpresariaisService] Erro ao carregar achados:', err)
    return []
  }
}

export async function salvarAchadoCliente(
  cnpj: string,
  achado: AchadoDueDiligence,
): Promise<AchadoDueDiligence> {
  const cnpjLimpo = limparCnpj(cnpj)
  const payload = {
    cliente_cnpj: cnpjLimpo,
    area: achado.area,
    achado: achado.achado,
    evidencia: achado.evidencia,
    impacto: achado.impacto,
    risco: achado.risco,
    recomendacao: achado.recomendacao,
    responsavel: achado.responsavel,
    prazo: achado.prazo,
    status: achado.status,
  }

  if (achado.id) {
    const updated = await pb.collection('analise_achados').update(achado.id, payload)
    return { ...achado, id: updated.id }
  }

  const created = await pb.collection('analise_achados').create(payload)
  return { ...achado, id: created.id }
}

export async function excluirAchadoCliente(achadoId: string): Promise<void> {
  await pb.collection('analise_achados').delete(achadoId)
}

/**
 * 4. PARECER FINAL & NOTAS CUSTOMIZADAS DE SCORE
 */
export async function carregarParecerCliente(cnpj: string): Promise<{
  parecer: Partial<ParecerFinalEstruturado>
  notasAjustadas: Partial<Record<BlocoScorePonderado['bloco'], number>>
}> {
  const cnpjLimpo = limparCnpj(cnpj)
  if (!cnpjLimpo) {
    return { parecer: {}, notasAjustadas: {} }
  }

  try {
    const rec = await pb
      .collection('analise_pareceres')
      .getFirstListItem(`cliente_cnpj = "${cnpjLimpo}"`)
      .catch(() => null)

    if (!rec) {
      return { parecer: {}, notasAjustadas: {} }
    }

    return {
      parecer: {
        periodo: rec.periodo,
        escopo: rec.escopo,
        pontosFortes: rec.pontos_fortes,
        pontosAtencao: rec.pontos_atencao,
        achadosCriticos: rec.achados_criticos,
        conclusao: rec.conclusao,
        nivelOpiniao: rec.nivel_opiniao as ParecerFinalEstruturado['nivelOpiniao'],
        recomendacaoCredito: rec.recomendacao_credito,
        responsavelTecnico: rec.responsavel_tecnico,
      },
      notasAjustadas: rec.notas_ajustadas || {},
    }
  } catch (err) {
    console.warn('[analisesEmpresariaisService] Erro ao carregar parecer:', err)
    return { parecer: {}, notasAjustadas: {} }
  }
}

export async function salvarParecerENotasCliente(
  cnpj: string,
  parecer: Partial<ParecerFinalEstruturado>,
  notasAjustadas: Partial<Record<BlocoScorePonderado['bloco'], number>>,
): Promise<void> {
  const cnpjLimpo = limparCnpj(cnpj)
  if (!cnpjLimpo) return

  const payload = {
    cliente_cnpj: cnpjLimpo,
    periodo: parecer.periodo || '3 exercícios',
    escopo: parecer.escopo || 'Contábil, fiscal, patrimonial e financeiro',
    pontos_fortes: parecer.pontosFortes || '',
    pontos_atencao: parecer.pontosAtencao || '',
    achados_criticos: parecer.achadosCriticos || '',
    conclusao: parecer.conclusao || '',
    nivel_opiniao: parecer.nivelOpiniao || 'Sem ressalvas',
    recomendacao_credito: parecer.recomendacaoCredito || '',
    responsavel_tecnico: parecer.responsavelTecnico || 'Analista ADECONT',
    notas_ajustadas: notasAjustadas || {},
  }

  try {
    const existing = await pb
      .collection('analise_pareceres')
      .getFirstListItem(`cliente_cnpj = "${cnpjLimpo}"`)
      .catch(() => null)

    if (existing) {
      await pb.collection('analise_pareceres').update(existing.id, payload)
    } else {
      await pb.collection('analise_pareceres').create(payload)
    }
  } catch (err) {
    console.error('[analisesEmpresariaisService] Erro ao salvar parecer:', err)
    throw err
  }
}

// Aliases para máxima ergonomia de importação
export const carregarBalancoCliente = carregarBalancosTresExercicios
export const carregarBalancoEmpresarial = carregarBalancosTresExercicios
export const salvarBalancoCliente = salvarExercicioBalanco
export const carregarChecklistDocumental = carregarChecklistCliente
export const carregarAchadosDueDiligence = carregarAchadosCliente
export async function carregarParecerFinal(cnpj: string): Promise<ParecerFinalEstruturado | null> {
  const { parecer } = await carregarParecerCliente(cnpj)
  if (!parecer || !parecer.conclusao) return null
  return parecer as ParecerFinalEstruturado
}
