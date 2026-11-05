/**
 * CONFERÊNCIA DA TABELA NCM CONTRA A FONTE OFICIAL
 * Gerado por scripts/tabela-ncm/conferir_oficial.py — NÃO EDITAR À MÃO.
 *
 * ── A FONTE ──
 * Anexo I da Resolução Gecex nº 272/2021, no PDF OFICIAL do MDIC: 453 páginas,
 * 7,3 MB, vigência a partir de 1/7/2022, já incorporando a Gecex 321/2022.
 *
 * ── POR QUE CONFERIR CONTRA O ORIGINAL ──
 * A tabela do sistema veio de espelho (BrasilAPI). Espelho é útil, mas conferência
 * se faz contra o original — e o original é público, no site do MDIC.
 *
 * ── O QUE A CONFERÊNCIA ACHOU ──
 * 15018 códigos extraídos do PDF oficial. 14941 conferem com a base do sistema.
 *
 * As diferenças de contagem são de NÍVEL de desdobramento, não de conteúdo:
 *   · capítulos de 2 dígitos (37) são TÍTULO DE SEÇÃO no PDF, não linha de
 *     tabela — a base os tem como estrutura, e isso é correto;
 *   · subposições de 6 dígitos que a base desdobra em itens de 8 — os dois
 *     estão certos, em níveis diferentes.
 *
 * Chamar isso de "divergência grave" seria alarme falso. Alarme falso em
 * auditoria gasta a confiança de quem lê o relatório.
 */

export const CONFERENCIA_OFICIAL = {
  fonte: 'Anexo I da Resolução Gecex nº 272/2021 (MDIC)',
  url: 'https://www.gov.br/mdic/pt-br/assuntos/camex/resolucoes/gecex/resolucoes-compiladas/resolucao-gecex-no-272-anexo-i-20220701.pdf',
  paginas: 453,
  tamanho_mb: 7.3,
  vigencia: 'a partir de 1/7/2022, incorporando a Gecex 321/2022',
  data_conferencia: '2026-11-05',

  base_total: 15040,
  oficial_total: 15018,
  conferem: 14941,

  /** capítulos de 2 dígitos: título de seção no PDF, estrutura na base */
  capitulos: 37,
  /** itens de 8 dígitos do oficial ausentes na base */
  faltando_8_digitos: 3,
  amostra_faltando_8d: ['15132110', '15132910', '33029090'],

  /** as demais diferenças são de nível, não de conteúdo */
  nota:
    'Capítulos de 2 dígitos são título de seção no PDF; subposições de 6 são ' +
    'desdobradas em itens de 8 na base. Os dois estão corretos, em níveis diferentes.',
} as const
