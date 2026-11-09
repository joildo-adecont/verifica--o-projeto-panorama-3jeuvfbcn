/**
 * Serviço de Importação e Exportação em Massa de Dados Complementares
 * Sistema ADECONT — Projeto Panorama
 *
 * Padrão:
 * - Exportação para XLSX / CSV nativa com SheetJS (mesmo padrão de exportarDadosMercado / exportarRelatorioContabil)
 * - Importação em lote com vínculo por CNPJ/CPF (com e sem formatação) ou Código
 * - Limite unificado de 10.000 linhas
 * - Auditoria com operador ADECONT e timestamp
 */

import * as XLSX from 'xlsx'
import {
  CampoPersonalizadoDef,
  ResultadoImportacaoMassaComplementar,
  TipoCanalContato,
} from '@/types/clienteDadosComplementares'
import {
  listarCamposPersonalizados,
  salvarValoresCamposCliente,
  salvarContatoCliente,
  sanitizarDoc,
  carregarValoresCamposCliente,
  listarContatosCliente,
} from './clienteDadosComplementaresService'
import { registrarAuditoriaStatus } from './statusAuditoriaService'
import { EmpresaRecord } from '@/types/cadastroEmpresas'

export const LIMITE_MAXIMO_IMPORTACAO_COMPLEMENTAR = 10000

export interface GerarPlanilhaMassaParams {
  empresas: EmpresaRecord[]
  camposDef: CampoPersonalizadoDef[]
  nomeArquivo?: string
}

/**
 * Gera e baixa uma planilha Excel (.xlsx) nativa formatada com SheetJS contendo:
 * 1. Dados cadastrais base (Código, CNPJ/CPF, Razão Social, Apelido)
 * 2. Canais de Contato / Mensagens (E-mail, WhatsApp, Instagram, LinkedIn, Facebook)
 * 3. Colunas para todos os campos personalizados ativos
 */
export async function exportarPlanilhaComplementarMassa(
  params: GerarPlanilhaMassaParams,
): Promise<void> {
  const { empresas, camposDef, nomeArquivo } = params

  // Cabeçalho
  const cabecalho = [
    'Código',
    'CNPJ / CPF',
    'Razão Social / Nome',
    'Apelido / Fantasia',
    'Situação',
    'Regime Tributário',
    'E-mail Principal',
    'WhatsApp / Celular',
    'Instagram',
    'LinkedIn',
    'Facebook',
    ...camposDef.map((c) => c.rotulo || c.chave),
  ]

  // Monta as linhas
  const linhas: any[][] = [cabecalho]

  for (const emp of empresas) {
    const docLimpo = sanitizarDoc(emp.documento_limpo || emp.numero_documento)

    // Tenta carregar dados complementares já preenchidos
    let valoresCampos: Record<string, string> = {}
    let contatosList: any[] = []
    try {
      valoresCampos = await carregarValoresCamposCliente(docLimpo, emp.codigo)
      contatosList = await listarContatosCliente(docLimpo, emp.codigo)
    } catch {
      /* intentionally ignored */
    }

    const emailContato =
      contatosList.find((c) => c.tipo === 'email')?.identificador || emp.email || ''
    const whatsappContato =
      contatosList.find((c) => c.tipo === 'whatsapp')?.identificador || emp.telefone || ''
    const instaContato = contatosList.find((c) => c.tipo === 'instagram')?.identificador || ''
    const linkedContato = contatosList.find((c) => c.tipo === 'linkedin')?.identificador || ''
    const faceContato = contatosList.find((c) => c.tipo === 'facebook')?.identificador || ''

    const linha = [
      emp.codigo,
      emp.numero_documento || emp.documento_limpo,
      emp.razao_social || emp.nome,
      emp.apelido || emp.nome_fantasia || '',
      emp.situacao || 'Ativa',
      emp.regime_tributario || '',
      emailContato,
      whatsappContato,
      instaContato,
      linkedContato,
      faceContato,
      ...camposDef.map((c) => valoresCampos[c.chave] ?? ''),
    ]

    linhas.push(linha)
  }

  // Gera o workbook XLSX
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(linhas)

  // Ajusta larguras das colunas
  const colWidths = cabecalho.map((col, idx) => {
    if (idx === 0) return { wch: 8 }
    if (idx === 1) return { wch: 18 }
    if (idx === 2) return { wch: 32 }
    if (idx === 3) return { wch: 22 }
    return { wch: Math.max(col.length + 3, 14) }
  })
  ws['!cols'] = colWidths

  XLSX.utils.book_append_sheet(wb, ws, 'Dados Complementares')

  const dataIso = new Date().toISOString().slice(0, 10)
  const nomeFinal = nomeArquivo || `ADECONT_Cadastro_Complementar_Massa_${dataIso}.xlsx`

  XLSX.writeFile(wb, nomeFinal)
}

/**
 * Lê e processa arquivo de planilha (XLSX, XLS ou CSV) para importação em massa
 */
export async function processarArquivoImportacaoMassa(
  file: File,
  empresasExistentes: EmpresaRecord[],
  operador: string = 'ADECONT Operador',
): Promise<ResultadoImportacaoMassaComplementar> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })

  const primeiraAba = wb.SheetNames[0]
  if (!primeiraAba) {
    throw new Error('A planilha enviada não contém nenhuma aba de dados.')
  }

  const ws = wb.Sheets[primeiraAba]
  const linhasMatriz: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

  if (!linhasMatriz || linhasMatriz.length < 2) {
    throw new Error('A planilha está vazia ou não possui linha de cabeçalho.')
  }

  // Cabeçalho da primeira linha
  const cabecalhoBruto: string[] = (linhasMatriz[0] || []).map((c) =>
    String(c || '')
      .trim()
      .toLowerCase(),
  )

  // Obtém definições de campos existentes
  const camposDef = await listarCamposPersonalizados()

  // Mapeia colunas conhecidas
  let colCodigo = -1
  let colCnpj = -1
  let colEmail = -1
  let colWhats = -1
  let colInsta = -1
  let colLinkedin = -1
  let colFacebook = -1

  // Mapa de coluna -> chave do campo personalizado
  const colunasCamposPersonalizados: Record<number, string> = {}

  cabecalhoBruto.forEach((col, idx) => {
    if (col.includes('código') || col.includes('codigo') || col === 'cod') {
      colCodigo = idx
    } else if (
      col.includes('cnpj') ||
      col.includes('cpf') ||
      col.includes('documento') ||
      col === 'doc'
    ) {
      colCnpj = idx
    } else if (col.includes('e-mail') || col.includes('email') || col.includes('correio')) {
      colEmail = idx
    } else if (
      col.includes('whats') ||
      col.includes('celular') ||
      col.includes('telefone') ||
      col.includes('fone')
    ) {
      colWhats = idx
    } else if (col.includes('insta')) {
      colInsta = idx
    } else if (col.includes('linkedin')) {
      colLinkedin = idx
    } else if (col.includes('facebook') || col.includes('face')) {
      colFacebook = idx
    } else {
      // Tenta cruzar com campos personalizados existentes por rotulo ou chave
      const match = camposDef.find(
        (c) =>
          c.chave.toLowerCase() === col ||
          c.rotulo.toLowerCase() === col ||
          col.includes(c.rotulo.toLowerCase()),
      )
      if (match) {
        colunasCamposPersonalizados[idx] = match.chave
      }
    }
  })

  if (colCnpj === -1 && colCodigo === -1) {
    throw new Error(
      'Não foi possível identificar a coluna de CNPJ/CPF ou de Código na planilha para vinculação dos clientes.',
    )
  }

  // Cria índices em memória de empresas existentes para cruzamento rápido
  const mapaPorDoc = new Map<string, EmpresaRecord>()
  const mapaPorCodigo = new Map<number, EmpresaRecord>()

  empresasExistentes.forEach((emp) => {
    const docLimpo = sanitizarDoc(emp.documento_limpo || emp.numero_documento)
    if (docLimpo) mapaPorDoc.set(docLimpo, emp)
    if (emp.codigo) mapaPorCodigo.set(emp.codigo, emp)
  })

  const resultado: ResultadoImportacaoMassaComplementar = {
    totalLido: 0,
    totalProcessado: 0,
    sucessoCount: 0,
    ignoradosCount: 0,
    errosCount: 0,
    clientesAtualizados: 0,
    contatosCriadosOuAtualizados: 0,
    valoresCamposAtualizados: 0,
    detalhes: [],
  }

  // Itera pelas linhas de dados (respeitando o limite de 10.000)
  const linhasDados = linhasMatriz.slice(1)
  resultado.totalLido = linhasDados.length

  const linhasParaProcessar = linhasDados.slice(0, LIMITE_MAXIMO_IMPORTACAO_COMPLEMENTAR)

  for (let i = 0; i < linhasParaProcessar.length; i++) {
    const linha = linhasParaProcessar[i]
    const numLinha = i + 2 // Linha 1 é o cabeçalho no Excel

    // Identifica o cliente
    const rawDoc = colCnpj >= 0 ? String(linha[colCnpj] || '') : ''
    const docLimpo = sanitizarDoc(rawDoc)
    const rawCodigo = colCodigo >= 0 ? Number(linha[colCodigo]) : NaN

    let empresaAlvo: EmpresaRecord | undefined
    if (docLimpo && mapaPorDoc.has(docLimpo)) {
      empresaAlvo = mapaPorDoc.get(docLimpo)
    } else if (!Number.isNaN(rawCodigo) && rawCodigo > 0 && mapaPorCodigo.has(rawCodigo)) {
      empresaAlvo = mapaPorCodigo.get(rawCodigo)
    }

    if (!empresaAlvo) {
      resultado.totalProcessado++
      resultado.ignoradosCount++
      resultado.detalhes.push({
        linha: numLinha,
        cnpj: docLimpo || (Number.isNaN(rawCodigo) ? 'Não informado' : `Cód ${rawCodigo}`),
        sucesso: false,
        mensagem: 'Cliente não localizado na base de dados por CNPJ/CPF ou Código.',
      })
      continue
    }

    const docFinal = sanitizarDoc(empresaAlvo.documento_limpo || empresaAlvo.numero_documento)
    const codFinal = empresaAlvo.codigo

    try {
      let algoAlterado = false

      // 1. Processa canais de contato
      const canaisRapidos: { tipo: TipoCanalContato; valor: string; rotulo: string }[] = []
      if (colEmail >= 0 && linha[colEmail]) {
        canaisRapidos.push({ tipo: 'email', valor: String(linha[colEmail]), rotulo: 'Geral' })
      }
      if (colWhats >= 0 && linha[colWhats]) {
        canaisRapidos.push({ tipo: 'whatsapp', valor: String(linha[colWhats]), rotulo: 'WhatsApp' })
      }
      if (colInsta >= 0 && linha[colInsta]) {
        canaisRapidos.push({
          tipo: 'instagram',
          valor: String(linha[colInsta]),
          rotulo: 'Instagram',
        })
      }
      if (colLinkedin >= 0 && linha[colLinkedin]) {
        canaisRapidos.push({
          tipo: 'linkedin',
          valor: String(linha[colLinkedin]),
          rotulo: 'LinkedIn',
        })
      }
      if (colFacebook >= 0 && linha[colFacebook]) {
        canaisRapidos.push({
          tipo: 'facebook',
          valor: String(linha[colFacebook]),
          rotulo: 'Facebook',
        })
      }

      for (const canal of canaisRapidos) {
        if (canal.valor.trim()) {
          await salvarContatoCliente({
            cliente_cnpj: docFinal,
            cliente_codigo: codFinal,
            tipo: canal.tipo,
            identificador: canal.valor.trim(),
            rotulo: canal.rotulo,
          })
          resultado.contatosCriadosOuAtualizados++
          algoAlterado = true
        }
      }

      // 2. Processa campos personalizados mapeados
      const valoresDinamicos: Record<string, string> = {}
      for (const [colIdxStr, campoChave] of Object.entries(colunasCamposPersonalizados)) {
        const idx = Number(colIdxStr)
        const valorBruto = linha[idx]
        if (valorBruto !== undefined && valorBruto !== '') {
          valoresDinamicos[campoChave] = String(valorBruto).trim()
        }
      }

      if (Object.keys(valoresDinamicos).length > 0) {
        await salvarValoresCamposCliente(docFinal, valoresDinamicos, codFinal, operador)
        resultado.valoresCamposAtualizados += Object.keys(valoresDinamicos).length
        algoAlterado = true
      }

      resultado.totalProcessado++
      if (algoAlterado) {
        resultado.sucessoCount++
        resultado.clientesAtualizados++
        resultado.detalhes.push({
          linha: numLinha,
          cnpj: docFinal,
          sucesso: true,
          mensagem: `Atualizado: ${empresaAlvo.razao_social || empresaAlvo.nome}`,
        })
      } else {
        resultado.ignoradosCount++
        resultado.detalhes.push({
          linha: numLinha,
          cnpj: docFinal,
          sucesso: true,
          mensagem: `Sem dados complementares para atualizar em: ${empresaAlvo.razao_social || empresaAlvo.nome}`,
        })
      }
    } catch (err: any) {
      resultado.totalProcessado++
      resultado.errosCount++
      resultado.detalhes.push({
        linha: numLinha,
        cnpj: docFinal,
        sucesso: false,
        mensagem: `Erro ao processar cliente: ${err?.message || 'Falha de gravação'}`,
      })
    }
  }

  // Registra a importação em massa na auditoria unificada do sistema
  if (resultado.clientesAtualizados > 0) {
    try {
      await registrarAuditoriaStatus({
        empresaCodigo: 0,
        empresaNome: `Lote Complementar (${resultado.clientesAtualizados} clientes)`,
        empresaDocumento: 'LOTE_IMPORT',
        statusAnterior: 'Importação em Massa',
        statusNovo: 'Concluída',
        acao: 'alterar_status',
        motivo: `Importação em massa de dados complementares: ${resultado.clientesAtualizados} clientes atualizados, ${resultado.contatosCriadosOuAtualizados} contatos e ${resultado.valoresCamposAtualizados} valores de campos. Operador: ${operador}`,
        usuario: operador,
      })
    } catch {
      /* intentionally ignored */
    }
  }

  return resultado
}
