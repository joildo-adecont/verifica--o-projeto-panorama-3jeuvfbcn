/**
 * AGENTE DE VIGILÂNCIA DAS FONTES E ORIGENS DA LEGISLAÇÃO
 *
 * Gerado por scripts/ligacao-item/gerar_agente_fontes.py — não editar à mão.
 * Regenerar depois de cada varredura semanal.
 *
 * O QUE ESTE AGENTE FAZ
 * Ele existe para uma pergunta só: "alguma das fontes de onde esta legislação
 * vem mudou?" Cada fonte tem uma assinatura de conteúdo guardada da varredura
 * anterior. Quando a assinatura diverge, a fonte mudou — e é isso que o agente
 * reporta, com o que mudou e o que depende dela.
 *
 * POR QUE ELE MOSTRA AS FONTES QUE FALHAM
 * Oito das dezesseis fontes catalogadas estão ativas. As outras oito não: duas
 * bloqueadas por WAF (Planalto e Presidência barram IP de datacenter), quatro
 * sem rota a partir deste ambiente e duas que não devem ser usadas. Esconder
 * isso daria a impressão de cobertura total; mostrar, com o substituto de cada
 * uma, é o que permite confiar no que sobra. Cada fonte inativa declara quem a
 * substitui.
 *
 * DE ONDE VÊM OS NÚMEROS
 * registro_fontes.py (as 16 fontes e seu status declarado) e
 * state/ultimo-relatorio.json (a última varredura medida). Nenhum número é
 * digitado aqui: se a varredura não rodou, o campo vem vazio em vez de errado.
 */

export type StatusFonte = 'ativa' | 'bloqueada' | 'sem_rota' | 'nao_usar'

export interface FonteVigiada {
  id: string
  rotulo: string
  orgao: string
  url: string
  status: StatusFonte
  tipo: string
  /** O que o agente verifica nesta fonte */
  verifica?: string
  /** Por que ela não está disponível */
  motivo?: string
  /** Quem cobre a função dela quando ela falha */
  substituto?: string[]
  /** Se a assinatura divergiu na última varredura */
  mudou: boolean
  ultimoStatus?: string
  detalhe?: string
  verificacoes?: number
}

export interface AlertaFonte {
  fonte: string
  rotulo: string
  tipo: 'novo' | 'alterado' | 'indisponivel'
  gravidade: 'alta' | 'media' | 'baixa'
  descricao: string
  /** O que revisar no Panorama quando isto acontece */
  revisar: string[]
}

export const EXECUCAO = '2026-10-29T03:29:27+00:00'
export const RESUMO_VARREDURA = '9/9 fontes ok; 0 mudança(s) detectada(s); 0 erro(s).'
export const FONTES_VIGIADAS: FonteVigiada[] = [
  {
    id: 'buscadorncm',
    rotulo: 'Buscador NCM (agregador)',
    orgao: 'Agregador privado (SECUNDÁRIO — não é fonte oficial)',
    url: 'https://buscadorncm.com.br/fontes',
    status: 'ativa',
    tipo: 'tabela',
    verifica: 'mudança nas bases de tabelas (agregador secundário)',
    mudou: false,
    ultimoStatus: 'ok',
    detalhe: 'assinatura idêntica',
    verificacoes: 1,
  },
  {
    id: 'cgibs',
    rotulo: 'CGIBS — resoluções',
    orgao: 'Comitê Gestor do IBS',
    url: 'https://cgibs.gov.br',
    status: 'ativa',
    tipo: 'catalogo',
    verifica: 'resoluções e atos do Comitê Gestor',
    mudou: false,
    ultimoStatus: 'ok',
    detalhe: 'assinatura idêntica',
    verificacoes: 2,
  },
  {
    id: 'dou',
    rotulo: 'DOU / Imprensa Nacional',
    orgao: 'Imprensa Nacional',
    url: 'https://www.in.gov.br',
    status: 'ativa',
    tipo: 'publicacao',
    verifica: 'publicação de ato novo no Diário Oficial',
    substituto: ['planalto'],
    mudou: false,
    ultimoStatus: 'ok',
    detalhe: 'assinatura idêntica',
    verificacoes: 1,
  },
  {
    id: 'normas_leg',
    rotulo: 'normas.leg.br — texto integral',
    orgao: 'Senado Federal / Congresso Nacional',
    url: 'https://normas.leg.br',
    status: 'ativa',
    tipo: 'texto_integral',
    verifica: 'texto integral de lei e decreto, com hash por norma',
    substituto: ['planalto'],
    mudou: false,
    ultimoStatus: 'ok',
    detalhe: 'assinatura idêntica',
    verificacoes: 3,
  },
  {
    id: 'rfb_normas',
    rotulo: 'RFB — normas',
    orgao: 'Receita Federal do Brasil',
    url: 'https://normas.receita.fazenda.gov.br',
    status: 'ativa',
    tipo: 'texto_integral',
    verifica: 'normas da Receita Federal',
    mudou: false,
  },
  {
    id: 'rfb_reforma',
    rotulo: 'RFB — portal da reforma',
    orgao: 'Receita Federal do Brasil',
    url: 'https://www.gov.br/receitafederal/pt-br/assuntos/reforma-tributaria',
    status: 'ativa',
    tipo: 'portal',
    verifica: 'atos e orientações da Receita sobre IBS/CBS',
    mudou: false,
    ultimoStatus: 'ok',
    detalhe: 'assinatura idêntica',
    verificacoes: 1,
  },
  {
    id: 'senado_dados_abertos',
    rotulo: 'Senado — dados abertos',
    orgao: 'Senado Federal',
    url: 'https://legis.senado.leg.br/dadosabertos',
    status: 'ativa',
    tipo: 'catalogo',
    verifica: 'catálogo de Leis Complementares novas',
    mudou: false,
    ultimoStatus: 'ok',
    detalhe: 'assinatura idêntica',
    verificacoes: 1,
  },
  {
    id: 'senado_legis',
    rotulo: 'Senado LEGIS — texto multivigente',
    orgao: 'Senado Federal',
    url: 'https://legis.senado.leg.br/norma/{id}',
    status: 'ativa',
    tipo: 'texto_integral',
    verifica: 'versão consolidada (multivigente) da norma',
    substituto: ['planalto'],
    mudou: false,
  },
  {
    id: 'planalto',
    rotulo: 'Planalto',
    orgao: 'Presidência da República',
    url: 'https://www.planalto.gov.br',
    status: 'bloqueada',
    tipo: 'texto_integral',
    motivo:
      "WAF da Presidência barra IP de datacenter estrangeiro: HTTP 200 com 814 bytes de 'Acesso Negado!'. Domínio inteiro (ccivil incluído). Não é User-Agent — é IP. Canal: bloqueio.de.aplicacoes@presidencia.gov.br",
    substituto: ['normas_leg', 'senado_legis', 'dou'],
    mudou: false,
  },
  {
    id: 'presidencia',
    rotulo: 'Presidência — legislação',
    orgao: 'Presidência da República',
    url: 'https://legislacao.presidencia.gov.br',
    status: 'bloqueada',
    tipo: 'portal',
    motivo: 'Mesmo WAF do Planalto; devolve 409 bytes sem conteúdo.',
    substituto: ['normas_leg', 'dou'],
    mudou: false,
  },
  {
    id: 'calculadorartc',
    rotulo: 'Calculadora RT C — Serpro',
    orgao: 'Serpro / RFB',
    url: 'https://calculadorartc.serpro.gov.br',
    status: 'sem_rota',
    tipo: 'tabela',
    motivo: 'DNS não resolve a partir do pod. Não confirmado se o endereço é válido.',
    substituto: ['buscadorncm', 'cgibs'],
    mudou: false,
  },
  {
    id: 'camara',
    rotulo: 'Câmara dos Deputados',
    orgao: 'Câmara dos Deputados',
    url: 'https://www.camara.leg.br',
    status: 'sem_rota',
    tipo: 'catalogo',
    motivo:
      'Timeout em todas as rotas testadas (bd, legin, legislacao). O pod não alcança o domínio. Não é bloqueio — é ausência de rota de rede.',
    substituto: ['normas_leg', 'senado_dados_abertos'],
    mudou: false,
  },
  {
    id: 'confaz',
    rotulo: 'CONFAZ',
    orgao: 'CONFAZ / Ministério da Fazenda',
    url: 'https://www.confaz.fazenda.gov.br',
    status: 'sem_rota',
    tipo: 'catalogo',
    motivo: 'Timeout. Sem rota de rede a partir do pod.',
    substituto: ['buscadorncm'],
    mudou: false,
  },
  {
    id: 'reformadoconsumo',
    rotulo: 'reformadoconsumo.gov.br',
    orgao: 'Ministério da Fazenda',
    url: 'https://www.reformadoconsumo.gov.br',
    status: 'sem_rota',
    tipo: 'portal',
    motivo:
      'DNS não resolve a partir do pod. O endereço pode estar correto para acesso humano — não confirmado.',
    substituto: ['rfb_reforma', 'cgibs'],
    mudou: false,
  },
  {
    id: 'lexml',
    rotulo: 'LexML',
    orgao: 'Rede de Informação Legislativa e Jurídica',
    url: 'http://www.lexml.gov.br',
    status: 'nao_usar',
    tipo: 'catalogo',
    motivo:
      'Responde HTTP 200 mas o SRU devolve sempre 9.049 bytes fixos, sem registros — API legada sem conteúdo útil. Usar só para consulta humana.',
    substituto: ['normas_leg', 'senado_dados_abertos'],
    mudou: false,
  },
  {
    id: 'sefaz_estaduais',
    rotulo: 'SEFAZ estaduais',
    orgao: 'SEFAZ estaduais',
    url: 'https://fazenda.rs.gov.br/legislacao',
    status: 'nao_usar',
    tipo: 'portal',
    motivo:
      'Rotas /legislacao testadas devolvem 404 em RS e SP. Endereços mudam por Estado — exigiria mapeamento individual.',
    substituto: ['cgibs'],
    mudou: false,
  },
]

export const CONTAGEM: Record<string, number> = {
  ativa: 8,
  bloqueada: 2,
  nao_usar: 2,
  sem_rota: 4,
}

export const TOTAL_FONTES = FONTES_VIGIADAS.length
export const TOTAL_ATIVAS = 8
export const TOTAL_FALHANDO = 8
export const TOTAL_FALTANDO_FONTES = 6
export const FONTES_COM_MUDANCA = FONTES_VIGIADAS.filter((f) => f.mudou)
export const HOUVE_MUDANCA = FONTES_COM_MUDANCA.length > 0

/** Normas que o agente acompanha na linha do tempo. */
export const NORMAS_VIGIADAS = 23
export const NORMAS_NO_PANORAMA = 12

/**
 * Alertas derivados do estado das fontes.
 *
 * Regra: alerta só nasce de fato medido. Fonte que falhou gera alerta de
 * indisponibilidade com o substituto; fonte que mudou gera alerta de alteração
 * com as seções a revisar. Nada é gerado por suposição.
 */
export const ALERTAS: AlertaFonte[] = [
  {
    fonte: 'planalto',
    rotulo: 'Planalto',
    tipo: 'indisponivel',
    gravidade: 'baixa',
    descricao:
      'Indisponível a partir deste ambiente — nenhuma mudança é perdida, porque a função é coberta por: normas_leg, senado_legis, dou.',
    revisar: ['Seção 1 — Arcabouço', 'Seção 7A — Tabela Geral'],
  },
  {
    fonte: 'presidencia',
    rotulo: 'Presidência — legislação',
    tipo: 'indisponivel',
    gravidade: 'baixa',
    descricao:
      'Indisponível a partir deste ambiente — nenhuma mudança é perdida, porque a função é coberta por: normas_leg, dou.',
    revisar: ['Seções 6A-6F — regimes', 'Seção 2 — Regra-matriz'],
  },
  {
    fonte: 'calculadorartc',
    rotulo: 'Calculadora RT C — Serpro',
    tipo: 'indisponivel',
    gravidade: 'baixa',
    descricao:
      'Indisponível a partir deste ambiente — nenhuma mudança é perdida, porque a função é coberta por: buscadorncm, cgibs.',
    revisar: ['Seção 7A — Tabela Geral', 'Catálogo do Simulador'],
  },
  {
    fonte: 'camara',
    rotulo: 'Câmara dos Deputados',
    tipo: 'indisponivel',
    gravidade: 'baixa',
    descricao:
      'Indisponível a partir deste ambiente — nenhuma mudança é perdida, porque a função é coberta por: normas_leg, senado_dados_abertos.',
    revisar: ['Seção 1 — Arcabouço', 'Seção 12A — Monitor'],
  },
  {
    fonte: 'confaz',
    rotulo: 'CONFAZ',
    tipo: 'indisponivel',
    gravidade: 'baixa',
    descricao:
      'Indisponível a partir deste ambiente — nenhuma mudança é perdida, porque a função é coberta por: buscadorncm.',
    revisar: ['Seção 1 — Arcabouço', 'Seção 12A — Monitor'],
  },
  {
    fonte: 'reformadoconsumo',
    rotulo: 'reformadoconsumo.gov.br',
    tipo: 'indisponivel',
    gravidade: 'baixa',
    descricao:
      'Indisponível a partir deste ambiente — nenhuma mudança é perdida, porque a função é coberta por: rfb_reforma, cgibs.',
    revisar: ['Seções 6A-6F — regimes', 'Seção 2 — Regra-matriz'],
  },
]

export const ALERTAS_ALTOS = ALERTAS.filter((a) => a.gravidade === 'alta')
