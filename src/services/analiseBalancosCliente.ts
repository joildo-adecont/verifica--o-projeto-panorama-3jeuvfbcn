/**
 * ANÁLISE DOS BALANÇOS ANEXADOS À FICHA DO CLIENTE (fluxo Balanço+DRE)
 * ====================================================================
 * Fluxo pedido pelo usuário: a partir dos PDFs de Balanço/DRE anexados na aba
 * de arquivos da ficha (coleção `cliente_arquivos`), extrair os valores de cada
 * exercício, deixar o usuário CONFERIR (editável — nada calcula sobre dado não
 * conferido) e rodar 4 análises com o motor já existente (25 índices clássicos
 * + modelos avançados do exemplo FMF): Individual (1 exercício), Tri-Anual
 * (3 exercícios, duas janelas) e Balancete (data-base encerrada).
 *
 * ATENÇÃO: esta cliente (CARDOSO & SIX, 94109) NÃO tem CNPJ — o vínculo é pelo
 * código do cliente, como já faz uploadArquivoCliente (chave 'COD' + código em
 * cliente_cnpj, campo obrigatório no PocketBase).
 */

import pb from '@/lib/pocketbase/client'
import type { ExercicioFinanceiroCompleto } from '@/types/analisesEmpresariaisModel'
import { criarExercicioVazio } from './motorAnaliseEmpresarial'
import { calcularTodosIndicadores } from './motorAnaliseEmpresarial'
import {
  calcularTodosIndicesAvancados,
  type RelatorioIndicesAvancados,
} from './indicesAvancadosEmpresariais'

// ─────────────────────────── Tipos ───────────────────────────

export type TipoAnaliseAnexos = 'individual' | 'tri_anual' | 'balancete'

export interface ExercicioConferidoRecord {
  id?: string
  cliente_chave: string
  exercicio: string
  conferido: boolean
  origem_arquivos: string
  data_base?: string
  dados: ExercicioFinanceiroCompleto
  atualizado_em?: string
}

export interface AnaliseAnexosResultado {
  tipo: TipoAnaliseAnexos
  titulo: string
  exercicios: Array<{
    exercicio: string
    rotulo: string
    dataBase: string
    periodoEncerrado: boolean
  }>
  classicosPorExercicio: Record<string, ReturnType<typeof calcularTodosIndicadores>>
  avancadosPorExercicio: Record<string, RelatorioIndicesAvancados>
  observacao?: string
}

// ─────────────────────── Lista de exercícios (rígida) ───────────────────────

export const EXERCICIOS_FLUXO: Array<{ exercicio: string; rotulo: string }> = [
  { exercicio: '2019', rotulo: 'Exercício 2019' },
  { exercicio: '2020', rotulo: 'Exercício 2020' },
  { exercicio: '2021', rotulo: 'Exercício 2021' },
  { exercicio: '2022', rotulo: 'Exercício 2022' },
  { exercicio: '2023', rotulo: 'Exercício 2023' },
  { exercicio: '2024', rotulo: 'Exercício 2024' },
  { exercicio: '2025', rotulo: 'Exercício 2025' },
  { exercicio: '2026', rotulo: 'Balancete 31/07/2026' },
]

export const TRI_1 = ['2020', '2021', '2022']
export const TRI_2 = ['2023', '2024', '2025']

export function dataBaseExercicio(exercicio: string): string {
  if (exercicio === '2026') return '31/07/2026'
  return `31/12/${exercicio}`
}

/** O balancete 2026 é período encerrado, não exercício completo. */
export function isPeriodoEncerrado(exercicio: string): boolean {
  return exercicio === '2026'
}

/** Chave de vínculo do cliente: CNPJ quando existir; senão 'COD' + código. */
export function chaveCliente(docLimpo: string, codigo: number): string {
  if (docLimpo) return docLimpo
  return 'COD' + String(codigo)
}

// ─────────────────────── Lista dos arquivos anexados ───────────────────────

export interface ArquivoAnexoRef {
  id: string
  titulo: string
  exerciseGuess: string | null
}

/**
 * Localiza, na aba de arquivos da ficha, os PDFs de Balanço/DRE/Balancete
 * (coleção `cliente_arquivos`). Vínculo por código de cliente (cliente_cnpj =
 * 'COD{codigo}') quando não há CNPJ — igual ao uploadArquivoCliente.
 */
export async function listarArquivosBalanço(
  docLimpo: string,
  codigo: number,
): Promise<ArquivoAnexoRef[]> {
  const chave = chaveCliente(docLimpo, codigo)
  try {
    const records = await pb.collection('cliente_arquivos').getFullList({
      filter: `cliente_cnpj = '${chave}'`,
      batch: 200,
    })
    return records
      .filter((r: any) => {
        const t = String(r.titulo || '').toLowerCase()
        return (
          t.includes('balan') || t.includes('balanc') || t.includes('dre') || t.includes('.pdf')
        )
      })
      .map((r: any) => ({
        id: r.id,
        titulo: r.titulo || '',
        exerciseGuess: adivinharExercicio(r.titulo || ''),
      }))
  } catch (err) {
    console.error('[analiseBalancosCliente] Erro ao listar arquivos:', err)
    return []
  }
}

/** "Balanço 2020.pdf" → 2020; "Balanço de out a dez-2019.pdf" → 2019; "Balancete 2026.pdf" → 2026 */
export function adivinharExercicio(titulo: string): string | null {
  const m = String(titulo).match(/(20\d{2})/)
  if (!m) return null
  const ano = m[1]
  return EXERCICIOS_FLUXO.some((e) => e.exercicio === ano) ? ano : null
}

// ─────────────────── Persistência dos exercícios conferidos ───────────────────

/**
 * Salva (upsert por cliente_chave + exercicio) os dados conferidos de um
 * exercício na coleção `analises_exercicios_conferidos`, para não re-extrair.
 */
export async function salvarExercicioConferido(record: ExercicioConferidoRecord): Promise<void> {
  const collection = 'analises_exercicios_conferidos'
  let existente: any = null
  try {
    existente = await pb
      .collection(collection)
      .getFirstListItem(
        `cliente_chave = '${record.cliente_chave}' && exercicio = '${record.exercicio}'`,
      )
  } catch {
    existente = null
  }

  const payload: Record<string, unknown> = {
    cliente_chave: record.cliente_chave,
    exercicio: record.exercicio,
    conferido: !!record.conferido,
    origem_arquivos: record.origem_arquivos,
    data_base: record.data_base || dataBaseExercicio(record.exercicio),
    dados_json: JSON.stringify(record.dados),
    atualizado_em: new Date().toISOString(),
  }

  if (existente?.id) {
    await pb.collection(collection).update(existente.id, payload)
  } else {
    await pb.collection(collection).create(payload)
  }
}

export async function carregarExerciciosConferidos(
  clienteChave: string,
): Promise<Record<string, ExercicioConferidoRecord>> {
  const saida: Record<string, ExercicioConferidoRecord> = {}
  if (!clienteChave) return saida
  try {
    const records = await pb.collection('analises_exercicios_conferidos').getFullList({
      filter: `cliente_chave = '${clienteChave}'`,
      batch: 100,
    })
    for (const r of records as any[]) {
      try {
        const dados = JSON.parse(String(r.dados_json || '{}')) as ExercicioFinanceiroCompleto
        saida[r.exercicio] = {
          id: r.id,
          cliente_chave: r.cliente_chave,
          exercicio: r.exercicio,
          conferido: !!r.conferido,
          origem_arquivos: r.origem_arquivos || '',
          data_base: r.data_base || '',
          dados,
          atualizado_em: r.atualizado_em || '',
        }
      } catch {
        // json inválido → ignora o exercício
      }
    }
  } catch (err) {
    console.error('[analiseBalancosCliente] Erro ao carregar exercícios conferidos:', err)
  }
  return saida
}

// ─────────────────────── Motor das 4 análises ───────────────────────

/**
 * Roda TODOS os indicadores existentes (clássicos + avançados FMF) para os
 * exercícios marcados. Não cria índice novo — só orquestra os motores.
 */
export function rodarAnalise(
  tipo: TipoAnaliseAnexos,
  exerciciosSelecionados: string[],
  exerciciosConferidos: Record<string, ExercicioConferidoRecord>,
): AnaliseAnexosResultado | null {
  const selecionados = exerciciosSelecionados.filter((e) => {
    const rec = exerciciosConferidos[e]
    return rec?.conferido && rec?.dados
  })
  if (selecionados.length === 0) return null

  const ordenados = EXERCICIOS_FLUXO.map((e) => e.exercicio).filter((e) => selecionados.includes(e))

  const classicosPorExercicio: AnaliseAnexosResultado['classicosPorExercicio'] = {}
  const avancadosPorExercicio: AnaliseAnexosResultado['avancadosPorExercicio'] = {}
  for (const ex of ordenados) {
    const dados = exerciciosConferidos[ex].dados
    try {
      classicosPorExercicio[ex] = calcularTodosIndicadores(dados)
    } catch (err) {
      console.warn(`[analiseBalancosCliente] Falha nos índices clássicos de ${ex}:`, err)
      classicosPorExercicio[ex] = []
    }
    try {
      avancadosPorExercicio[ex] = calcularTodosIndicesAvancados(dados)
    } catch (err) {
      console.warn(`[analiseBalancosCliente] Falha nos índices avançados de ${ex}:`, err)
      const vazio = criarExercicioVazio('ano_atual')
      avancadosPorExercicio[ex] = calcularTodosIndicesAvancados(vazio)
    }
  }

  let titulo = ''
  if (tipo === 'individual') {
    titulo = `Análise Individual — ${ordenados[0]}`
  } else if (tipo === 'tri_anual') {
    titulo = `Análise Tri-Anual — ${ordenados[0]} a ${ordenados[ordenados.length - 1]}`
  } else {
    titulo = 'Análise de Balancete (Período Encerrado)'
  }

  return {
    tipo,
    titulo,
    exercicios: ordenados.map((ex) => ({
      exercicio: ex,
      rotulo: EXERCICIOS_FLUXO.find((e) => e.exercicio === ex)?.rotulo || ex,
      dataBase: dataBaseExercicio(ex),
      periodoEncerrado: isPeriodoEncerrado(ex),
    })),
    classicosPorExercicio,
    avancadosPorExercicio,
  }
}

/** Evolução do score dos modelos de insolvência (Kanitz, Altman, Elizabetsky) ano a ano. */
export function evolucaoInsolvencia(res: AnaliseAnexosResultado) {
  return res.exercicios.map((e) => {
    const adv = res.avancadosPorExercicio[e.exercicio]
    return {
      exercicio: e.exercicio,
      rotulo: e.rotulo,
      kanitz: adv?.kanitz?.fatorInsolvencia ?? 0,
      altmanZ1: adv?.altmanZ1?.zScore ?? 0,
      elizabetsky: adv?.elizabetsky?.fator ?? 0,
    }
  })
}

/** Resumo textual dos índices clássicos de um exercício (para o relatório). */
export function resumoClassicos(
  inds: ReturnType<typeof calcularTodosIndicadores> | undefined,
): string {
  if (!inds || inds.length === 0) return 'Sem indicadores apurados.'
  return inds.map((i) => `• ${i.nome}: ${i.valor.toFixed(2)} (${i.semaforo})`).join('\n')
}
