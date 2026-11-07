/**
 * CATÁLOGO E RESULTADO DA AUDITORIA DO SISTEMA PANORAMA (ADECONT)
 *
 * Mapeamento completo dos módulos, agentes especialistas, fontes oficiais,
 * rotinas agendadas e componentes de interface.
 */

export type StatusModuloAuditoria = 'FUNCIONANDO' | 'AJUSTADO' | 'PENDENCIA'

export interface ItemAuditoriaModulo {
  id: string
  categoria:
    | 'acesso_clientes'
    | 'analises_contabeis'
    | 'fiscal_documental'
    | 'reforma_tributaria'
    | 'fontes_series'
    | 'sistema_infra'
  modulo: string
  rotaOuHash: string
  status: StatusModuloAuditoria
  descricao: string
  ajusteRealizado?: string
  itensVerificados: string[]
  agenteResponsavel: string
}

export const MODULOS_AUDITORIA_SISTEMA: ItemAuditoriaModulo[] = [
  {
    id: 'clientes-cadastro',
    categoria: 'acesso_clientes',
    modulo: 'Cadastro e Seleção de Clientes',
    rotaOuHash: '/cadastro-clientes',
    status: 'AJUSTADO',
    descricao:
      'Gestão de 583 clientes da carteira ADECONT com busca por documento, razão social, cnae e regime.',
    ajusteRealizado:
      'Criado campo de compatibilidade documento em cadastro_empresas e cadastro_empresas_inativos com backfill automático e índice, eliminando falhas 400 em buscas por dígitos de CNPJ. Concluída limpeza segura arquivando 3 cadastros duplicados.',
    itensVerificados: [
      '583 cadastros preservados e sincronizados',
      'Busca por CNPJ limpo e formatado funcionando sem erro 400',
      'Filtros por regime tributário e CNAE',
      'Exportação A4 com AdecontLogo e tagline oficial',
    ],
    agenteResponsavel: 'Agente Especialista Administrativo',
  },
  {
    id: 'analises-empresariais-indicadores',
    categoria: 'analises_contabeis',
    modulo: 'Análises Empresariais — Indicadores & Balanço',
    rotaOuHash: '/analises-empresariais',
    status: 'FUNCIONANDO',
    descricao:
      'Dashboard trienal com 10 grupos de indicadores (Liquidez, Rentabilidade, Endividamento, Eficiência, DRE, etc.).',
    itensVerificados: [
      'Leitura de balanços trienais e memória de cálculo de 40+ fórmulas',
      'Gráficos comparativos e distribuição setorial',
      'Exportações em Excel .xlsx, CSV pt-BR (BOM UTF-8) e Dossiê A4',
      'Layout sem sobreposição do menu lateral (lg:pl-60)',
    ],
    agenteResponsavel: 'Agente Especialista Contábil',
  },
  {
    id: 'dados-mercado-analises',
    categoria: 'fontes_series',
    modulo: 'Aba Dados de Mercado & Alertas',
    rotaOuHash: '/analises-empresariais (aba 9)',
    status: 'AJUSTADO',
    descricao:
      'Cotações de Ibovespa, Dólar PTAX, Euro, Selic, CDI, IPCA, S&P 500, Dow Jones, Nasdaq, FIIs e alertas do sino.',
    ajusteRealizado:
      'Corrigida permissão de API na coleção market_alerts (regras públicas de leitura e atualização de leitura), eliminando erros 403 "Only superusers can perform this action".',
    itensVerificados: [
      'Sino de alertas de mercado com contagem de notificações não lidas',
      'Mini-gráficos sparklines e histórico de variações',
      'Degradação segura para base interna em indisponibilidade temporária de APIs externas',
      'Exportação dedicada A4, XLSX e CSV com aviso de contingência quando aplicável',
    ],
    agenteResponsavel: 'Agente Especialista Financeiro & Fontes',
  },
  {
    id: 'documentos-fiscais-nfe',
    categoria: 'fiscal_documental',
    modulo: 'Documentos Fiscais & Pipeline de NF-e',
    rotaOuHash: '/documentos-fiscais',
    status: 'AJUSTADO',
    descricao:
      'Ingestão em lote de XMLs modelo 55 (até 10.000 notas), deduplicação por chave de 44 dígitos e tripla análise por agentes.',
    ajusteRealizado:
      'Liberadas regras de API para leitura/escrita nas coleções param_documentos, param_itens e param_pastas, sanando erros 403 que bloqueavam consultas do cliente.',
    itensVerificados: [
      'Deduplicação estrita por chave de 44 dígitos com rejeição de notas duplicadas',
      'Cruzamento inteligente com nfes e cadastro de clientes por CNPJ',
      'Exportação de lote de XML e CSV com delimitador brasileiro',
      'Selo de confiança e diagnóstico Pastore auditado',
    ],
    agenteResponsavel: 'Agente Especialista Fiscal & Tributário',
  },
  {
    id: 'parametrizador-fiscal',
    categoria: 'fiscal_documental',
    modulo: 'Parametrizador & Levantamento da Carteira',
    rotaOuHash: '#parametrizador',
    status: 'FUNCIONANDO',
    descricao:
      'Organização de pastas por cliente/ano/mês, conferência de CFOP, NCM e enquadramento de posições fiscais.',
    itensVerificados: [
      'Árvore de pastas e contagem de documentos vinculados',
      'Conferência fiscal com regras de entrada e saída',
      'Detecção de divergências entre XML e cadastro contábil',
    ],
    agenteResponsavel: 'Agente Especialista Fiscal',
  },
  {
    id: 'reforma-tributaria-motor',
    categoria: 'reforma_tributaria',
    modulo: 'Motor de Classificação da Reforma Tributária (IBS/CBS)',
    rotaOuHash: '#tabela-geral / #busca-avancada',
    status: 'FUNCIONANDO',
    descricao:
      'Buscador e agregador com 13.000+ classificações: NCM, NBS, cClassTrib, CST, cCredPres, CEST, MVA-ST, CFOP, CNAE 2.3.',
    itensVerificados: [
      'Busca combinada em tempo real com realce de termos',
      'Filtros por cClassTrib e regimes diferenciados (saúde, educação, agronegócio, cesta básica)',
      'Modal de detalhes da classificação com base legal oficial vinculada',
      'Compatibilidade com rotina semanal de atualização de normas',
    ],
    agenteResponsavel: 'Agente Especialista Jurídico & Tributário',
  },
  {
    id: 'diagnostico-regime-tributario',
    categoria: 'reforma_tributaria',
    modulo: 'Diagnóstico Tributário & Comparador de Regimes',
    rotaOuHash: '#diagnostico-tributario',
    status: 'FUNCIONANDO',
    descricao:
      'Simulação comparativa entre Lucro Real, Lucro Presumido, Simples Nacional e Reforma Tributária (IBS/CBS/IS).',
    itensVerificados: [
      'Apuração de créditos acumulados e custo do erro tributário',
      'Relatório A4 imprimível de Diagnóstico Tributário com marca ADECONT',
      'Parametrização de alíquotas com transição do cronograma 2026–2033',
    ],
    agenteResponsavel: 'Agente Especialista Tributário',
  },
  {
    id: 'fontes-oficiais-estatisticas',
    categoria: 'fontes_series',
    modulo: 'Fontes Oficiais & Estatísticas Institucionais',
    rotaOuHash: '#secao-9 / #fontes-primarias',
    status: 'AJUSTADO',
    descricao:
      '8 fontes estatísticas de dados públicos oficiais: IBGE, Tesouro, IPEA, BCB, CONAB, CEPEA, FipeZap e CGIBS.',
    ajusteRealizado:
      'Uniformizada URL oficial do CGIBS para https://www.cgibs.gov.br/ em todo o acervo. Confirmado proxy /backend/v1/download-resolution para PDFs oficiais.',
    itensVerificados: [
      'Verificação automática de saúde de fontes (job check_sources_cron)',
      'CGIBS, BCB, IBGE, Tesouro com status OK e certificados válidos',
      'Fallback transparente para dados internos estruturados',
      'FipeZap com cache aquecido no backend prevenindo travamento de conexões',
    ],
    agenteResponsavel: 'Agente Guardião de Fontes Oficiais',
  },
  {
    id: 'series-historicas-comparador',
    categoria: 'fontes_series',
    modulo: 'Séries Históricas & Comparação de Índices',
    rotaOuHash: '#indicadores-economicos',
    status: 'FUNCIONANDO',
    descricao:
      'Plataforma de séries temporais com gráficos de múltiplos índices simultâneos e atalhos de trios analíticos.',
    itensVerificados: [
      'Atalhos rápidos: IFIX + Ibovespa + Selic, IFIX + Ibovespa + Dólar, Trio IBGE',
      'Mínimo de comparação (2 índices) com validação interativa',
      'Plataforma integrada à rota /backend/v1/series-historicas',
      'Tabela de variações mensais e acumuladas',
    ],
    agenteResponsavel: 'Agente Especialista Econômico',
  },
  {
    id: 'marca-identidade-visual',
    categoria: 'sistema_infra',
    modulo: 'Identidade da Marca ADECONT & Confecção Visual',
    rotaOuHash: 'Global',
    status: 'FUNCIONANDO',
    descricao:
      'Padronização da marca ADECONT e tagline "Assessoria Contábil e Administrativa" em todas as publicações.',
    itensVerificados: [
      'Presença do componente AdecontLogo em todos os cabeçalhos e formulários',
      'Inexistência do termo indevido "Jurídica" após a marca',
      'Relatórios e Dossiês formatados em padrão A4 executivo com grid de impressão',
      'Alternador de tema claro/escuro sem conflito de contraste',
    ],
    agenteResponsavel: 'Agente de Qualidade & Identidade Visual',
  },
  {
    id: 'sistema-agendamentos-cron',
    categoria: 'sistema_infra',
    modulo: 'Rotinas Agendadas & Background Jobs',
    rotaOuHash: 'Backend (pb_hooks)',
    status: 'FUNCIONANDO',
    descricao:
      'Execução programada de checagem de fontes, aquecimento de cache de séries, revisão de normas e alertas de mercado.',
    itensVerificados: [
      'check_sources_cron ativo (verificação de integridade das fontes)',
      'refresh_series_cache ativo (pré-aquecimento diário)',
      'weekly_review_cron ativo (segundas-feiras)',
      'market_alerts_cron ativo (dias úteis às 06:00 UTC)',
    ],
    agenteResponsavel: 'Agente Especialista de Infraestrutura & Backend',
  },
]
