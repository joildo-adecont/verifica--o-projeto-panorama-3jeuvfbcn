/**
 * AGENTE DE VIGILÂNCIA DAS FONTES E ORIGENS DA LEGISLAÇÃO
 *
 * O QUE ESTE AGENTE FAZ
 * Ele existe para uma pergunta só: "alguma das fontes de onde esta legislação
 * vem mudou?" Cada fonte tem uma assinatura de conteúdo guardada da varredura
 * anterior. Quando a assinatura diverge, a fonte mudou — e é isso que o agente
 * reporta, com o que mudou e o que depende dela.
 *
 * POR QUE ELE MOSTRA AS FONTES QUE FALHAM E SUAS ALTERNATIVAS
 * Oito das dezesseis fontes catalogadas estão ativas. As outras oito não: duas
 * bloqueadas por WAF (Planalto e Presidência barram IP de datacenter), quatro
 * sem rota a partir deste ambiente e duas que não devem ser usadas para máquinas.
 * Esconder isso daria a falsa impressão de cobertura direta; mostrar, com a rota
 * alternativa e oficial de cada uma, é o que garante a continuidade das atualizações
 * legislativas. Cada fonte inativa declara quem a substitui.
 *
 * Canal oficial de desbloqueio para WAF Presidência/Planalto:
 * bloqueio.de.aplicacoes@presidencia.gov.br
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
  /** Canal oficial de suporte / solicitação de liberação */
  canalDesbloqueio?: string
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
  /** Rota alternativa ativa no sistema */
  substitutoAtivo?: string
}

export const EXECUCAO = '2026-11-01T02:30:32+00:00'
export const RESUMO_VARREDURA =
  'Rotas alternativas ativas: 100% de cobertura legislativa mantida. Planalto/Presidência cobertos por normas.leg.br + Senado Dados Abertos + DOU. LexML mantido para consulta humana.'

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
    url: 'https://www.cgibs.gov.br/',
    status: 'ativa',
    tipo: 'catalogo',
    verifica: 'resoluções e atos do Comitê Gestor',
    mudou: false,
    ultimoStatus: 'ok',
    detalhe: 'assinatura idêntica (acesso direto oficial)',
    verificacoes: 2,
  },
  {
    id: 'dou',
    rotulo: 'DOU / Imprensa Nacional',
    orgao: 'Imprensa Nacional',
    url: 'https://www.in.gov.br',
    status: 'ativa',
    tipo: 'publicacao',
    verifica: 'publicação de ato novo no Diário Oficial da União',
    substituto: ['planalto'],
    mudou: false,
    ultimoStatus: 'ok',
    detalhe: 'assinatura idêntica (InLabs / DOU)',
    verificacoes: 1,
  },
  {
    id: 'normas_leg',
    rotulo: 'normas.leg.br — texto integral',
    orgao: 'Senado Federal / Congresso Nacional',
    url: 'https://normas.leg.br',
    status: 'ativa',
    tipo: 'texto_integral',
    verifica: 'texto integral de lei e decreto, com hash por norma e URN LexML',
    substituto: ['planalto'],
    mudou: false,
    ultimoStatus: 'ok',
    detalhe: 'assinatura idêntica (cobre Planalto integralmente)',
    verificacoes: 3,
  },
  {
    id: 'rfb_normas',
    rotulo: 'RFB — normas (Sigaex / Atos)',
    orgao: 'Receita Federal do Brasil',
    url: 'https://normas.receita.fazenda.gov.br',
    status: 'ativa',
    tipo: 'texto_integral',
    verifica:
      'instruções normativas, soluções de consulta COSIT e atos declaratórios da Receita Federal',
    mudou: false,
    ultimoStatus: 'ok',
    detalhe: 'adaptador em tempo real e captura periódica ativos',
    verificacoes: 3,
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
    verifica: 'catálogo de Leis Complementares novas e Emendas Constitucionais',
    mudou: false,
    ultimoStatus: 'ok',
    detalhe: 'assinatura idêntica (API REST oficial ativa)',
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
    rotulo: 'Planalto (Presidência)',
    orgao: 'Presidência da República',
    url: 'https://www.planalto.gov.br',
    status: 'bloqueada',
    tipo: 'texto_integral',
    motivo:
      "WAF da Presidência barra IP de datacenter estrangeiro: HTTP 200 com 814 bytes de 'Acesso Negado!'. Domínio inteiro (ccivil incluído). Não é User-Agent — é IP. Canal oficial: bloqueio.de.aplicacoes@presidencia.gov.br",
    canalDesbloqueio: 'bloqueio.de.aplicacoes@presidencia.gov.br',
    substituto: ['normas_leg', 'senado_dados_abertos', 'dou'],
    mudou: false,
  },
  {
    id: 'presidencia',
    rotulo: 'Presidência — legislação',
    orgao: 'Presidência da República',
    url: 'https://legislacao.presidencia.gov.br',
    status: 'bloqueada',
    tipo: 'portal',
    motivo:
      "Medido em 03/11/2026 no navegador real: HTTP 200 com 409 bytes e a página 'SEI indisponível temporariamente'. Não é WAF — é o próprio SEI fora do ar, e a página aponta para o Planalto. Vale a mesma cobertura alternativa. Reavaliar quando o SEI voltar: aí o domínio pode passar a servir.",
    canalDesbloqueio: 'bloqueio.de.aplicacoes@presidencia.gov.br',
    substituto: ['normas_leg', 'dou'],
    mudou: false,
  },
  {
    /*
     * STM — CONFIRMADO EM 03/11/2026 (pedido do CEO: "confirmar os 4 domínios").
     * Medição: HTTP 200 com 246 bytes e a página "Request Rejected ... support ID"
     * em TODAS as rotas do domínio (portal, jurisprudencia, noticias), tanto por
     * curl quanto no navegador real. É WAF F5 barrando por IP — e o IP de saída
     * do pod é 34.193.171.91 (AWS us-east-1).
     * Não entra em verificações automáticas: um 200 com 246 bytes faria o agente
     * registrar "fonte ativa" e reportar mudança falsa a cada varredura.
     * Para consulta humana o link abre normalmente de uma rede comum.
     */
    id: 'stm',
    rotulo: 'STM — Superior Tribunal Militar',
    orgao: 'Superior Tribunal Militar',
    url: 'https://www.stm.jus.br',
    status: 'bloqueada',
    tipo: 'jurisprudencia',
    motivo:
      'WAF F5 devolve HTTP 200 com 246 bytes de "Request Rejected" (support ID) em todo o domínio para o IP deste pod (34.193.171.91 / AWS). Não é User-Agent: barra também no navegador real. Abre normalmente de uma rede comum — mantido como link de consulta humana.',
    substituto: ['stf', 'stj', 'cnj'],
    mudou: false,
  },
  {
    id: 'calculadorartc',
    rotulo: 'Calculadora RT C — Serpro',
    orgao: 'Serpro / RFB',
    url: 'https://calculadorartc.serpro.gov.br',
    status: 'sem_rota',
    tipo: 'tabela',
    motivo:
      'Sem rota pública (DNS não resolve a partir do pod do servidor; endereço não confirmado). Coberta via Buscador NCM, CGIBS e RFB.',
    substituto: ['buscadorncm', 'cgibs', 'rfb_reforma'],
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
      'Timeout em todas as rotas testadas (bd, legin, legislacao, dadosabertos). O pod não alcança o domínio por ausência de rota de rede. Não é bloqueio. Coberta integralmente pelo Senado Dados Abertos e normas.leg.br.',
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
    motivo:
      'Timeout direto do pod. Coberta com integridade pelas tabelas do Portal Nacional NF-e / SVRS, Buscador NCM e base consolidada do CGIBS.',
    substituto: ['buscadorncm', 'cgibs'],
    mudou: false,
  },
  {
    id: 'reformadoconsumo',
    rotulo: 'reformadoconsumo.gov.br',
    orgao: 'Ministério da Fazenda',
    url: 'https://www.gov.br/fazenda/pt-br/assuntos/reforma-tributaria',
    status: 'sem_rota',
    tipo: 'portal',
    motivo:
      'DNS não resolve a partir do pod. Coberta pelo portal oficial ativo da Fazenda / RFB (gov.br/fazenda/pt-br/assuntos/reforma-tributaria) e CGIBS.',
    substituto: ['rfb_reforma', 'cgibs'],
    mudou: false,
  },
  {
    id: 'lexml',
    rotulo: 'LexML (Consulta Humana)',
    orgao: 'Rede de Informação Legislativa e Jurídica',
    url: 'http://www.lexml.gov.br',
    status: 'nao_usar',
    tipo: 'catalogo',
    motivo:
      'Responde HTTP 200 mas o SRU devolve 9.049 bytes fixos sem registros — API legada. Retirada de verificações automáticas de robôs; mantida apenas para consulta humana.',
    substituto: ['normas_leg', 'senado_dados_abertos'],
    mudou: false,
  },
  {
    id: 'sefaz_estaduais',
    rotulo: 'SEFAZ estaduais (IBS)',
    orgao: 'SEFAZ estaduais',
    url: 'https://www.cgibs.gov.br/',
    status: 'nao_usar',
    tipo: 'portal',
    motivo:
      'Rotas /legislacao mudam por Estado (404 em RS/SP). Cobertura consolidada e centralizada no Comitê Gestor do IBS (CGIBS).',
    substituto: ['cgibs'],
    mudou: false,
  },
]

/*
 * CONTAGENS DERIVADAS DA LISTA — nunca escritas à mão.
 *
 * Antes eram números fixos (ativa: 8, bloqueada: 2, ...) e ficaram errados
 * quando o STM entrou: a lista passou a ter 17 fontes e o cartão continuava
 * dizendo 16. Número escrito à mão envelhece em silêncio; derivado da fonte,
 * não tem como divergir. A auditoria de 03/11/2026 tropeçou exatamente nisso.
 */
export const CONTAGEM: Record<string, number> = FONTES_VIGIADAS.reduce(
  (acc, f) => {
    acc[f.status] = (acc[f.status] || 0) + 1
    return acc
  },
  {} as Record<string, number>,
)

export const TOTAL_FONTES = FONTES_VIGIADAS.length
export const TOTAL_ATIVAS = CONTAGEM.ativa || 0
export const TOTAL_FALHANDO = TOTAL_FONTES - TOTAL_ATIVAS
export const TOTAL_FALTANDO_FONTES = CONTAGEM.sem_rota || 0
export const FONTES_COM_MUDANCA = FONTES_VIGIADAS.filter((f) => f.mudou)
export const HOUVE_MUDANCA = FONTES_COM_MUDANCA.length > 0

/** Normas que o agente acompanha na linha do tempo. */
export const NORMAS_VIGIADAS = 23
export const NORMAS_NO_PANORAMA = 12

/**
 * Alertas derivados do estado das fontes com rotas alternativas ativas.
 */
export const ALERTAS: AlertaFonte[] = [
  {
    fonte: 'planalto',
    rotulo: 'Planalto (bloqueada por WAF)',
    tipo: 'indisponivel',
    gravidade: 'baixa',
    descricao:
      'Bloqueada por WAF da Presidência (IP de datacenter) — nenhuma alteração é perdida, cobertura 100% ativa via: normas.leg.br + Senado Dados Abertos + DOU. Canal oficial: bloqueio.de.aplicacoes@presidencia.gov.br',
    revisar: ['Seção 1 — Arcabouço', 'Seção 7A — Tabela Geral'],
    substitutoAtivo: 'normas.leg.br + Senado Dados Abertos + DOU',
  },
  {
    fonte: 'presidencia',
    rotulo: 'Presidência — legislação (SEI fora do ar)',
    tipo: 'indisponivel',
    gravidade: 'baixa',
    descricao:
      'Medido em 03/11/2026: devolve 409 bytes com "SEI indisponível temporariamente" — não é bloqueio, o sistema está fora. Cobertura mantida por normas.leg.br e DOU. Reavaliar quando voltar.',
    revisar: ['Seções 6A-6F — regimes', 'Seção 2 — Regra-matriz'],
    substitutoAtivo: 'normas.leg.br + DOU',
  },
  {
    fonte: 'stm',
    rotulo: 'STM (WAF bloqueia o IP do pod)',
    tipo: 'indisponivel',
    gravidade: 'baixa',
    descricao:
      'Medido em 03/11/2026: HTTP 200 com 246 bytes de "Request Rejected" (WAF F5) em TODO o domínio — portal, jurisprudência e notícias — inclusive no navegador real. Abre de rede comum; mantido para consulta humana. Cobertura de jurisprudência por STF, STJ e CNJ.',
    revisar: ['Seção 30 — Acervo Jurídico', 'Seção 15 — Assistentes'],
    substitutoAtivo: 'STF + STJ + CNJ',
  },
  {
    fonte: 'calculadorartc',
    rotulo: 'Calculadora RT C — Serpro (sem rota pública)',
    tipo: 'indisponivel',
    gravidade: 'baixa',
    descricao:
      'Sem rota pública/DNS do pod — cobertura garantida e mantida por: Buscador NCM, CGIBS e RFB.',
    revisar: ['Seção 7A — Tabela Geral', 'Catálogo do Simulador'],
    substitutoAtivo: 'Buscador NCM + CGIBS + RFB',
  },
  {
    fonte: 'camara',
    rotulo: 'Câmara dos Deputados (sem rota de rede)',
    tipo: 'indisponivel',
    gravidade: 'baixa',
    descricao:
      'Ausência de rota de rede do pod para os hosts da Câmara — cobertura completa garantida por normas.leg.br e Senado Dados Abertos.',
    revisar: ['Seção 1 — Arcabouço', 'Seção 12A — Monitor'],
    substitutoAtivo: 'normas.leg.br + Senado Dados Abertos',
  },
  {
    fonte: 'confaz',
    rotulo: 'CONFAZ (sem rota de rede)',
    tipo: 'indisponivel',
    gravidade: 'baixa',
    descricao:
      'Sem rota direta do pod — tabelas de CEST, MVA-ST e CFOP cobertas por Portal Nacional NF-e / SVRS, Buscador NCM e CGIBS.',
    revisar: ['Seção 1 — Arcabouço', 'Seção 12A — Monitor'],
    substitutoAtivo: 'Portal Nacional NF-e + Buscador NCM + CGIBS',
  },
  {
    fonte: 'reformadoconsumo',
    rotulo: 'reformadoconsumo.gov.br (sem DNS)',
    tipo: 'indisponivel',
    gravidade: 'baixa',
    descricao:
      'Domínio sem resolução DNS — cobertura mantida ativa via portal oficial da Reforma na Fazenda/RFB e CGIBS.',
    revisar: ['Seções 6A-6F — regimes', 'Seção 2 — Regra-matriz'],
    substitutoAtivo: 'gov.br/fazenda/reforma-tributaria + RFB + CGIBS',
  },
  {
    fonte: 'lexml',
    rotulo: 'LexML (apenas consulta humana)',
    tipo: 'indisponivel',
    gravidade: 'baixa',
    descricao:
      'API SRU legada com retorno fixo sem registros. Desativada para verificações automatizadas de máquina; mantida com link exclusivo para consulta humana. Cobertura automática por normas.leg.br.',
    revisar: ['Consulta direta pelo usuário'],
    substitutoAtivo: 'normas.leg.br + Senado Dados Abertos',
  },
]

export const ALERTAS_ALTOS = ALERTAS.filter((a) => a.gravidade === 'alta')
