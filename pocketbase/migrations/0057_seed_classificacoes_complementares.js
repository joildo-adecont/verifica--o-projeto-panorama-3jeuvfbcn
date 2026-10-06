/// <reference path="../pb_data/types.d.ts" />
// 0057 - Seed de Classificações Oficiais Complementares da Reforma Tributária
// Tabelas: cClassTrib (IT 2025.002 / CGIBS), CST IBS/CBS, cCredPres (LC 214/2025), CFOP (SINIEF), NBS 2.0 (MDIC) e CNAE 2.3 (IBGE)
// Upsert idempotente via índice único (tipo, codigo)

migrate(
  (app) => {
    const now = new Date().toISOString()
    const refData = '2026-10-01'

    // 1. cClassTrib — Códigos Oficiais do Informe Técnico 2025.002 (CGIBS / RFB / ENCAT)
    const cClassTribItems = [
      {
        codigo: '000001',
        nome: 'Operação com incidência integral das alíquotas padrão de IBS e CBS',
        desc: 'Classificação tributária geral para operações tributadas integralmente pelas alíquotas de referência vigentes',
        fonte: 'CGIBS / RFB / ENCAT',
        tabela: 'IT 2025.002 v1.70 — Tabela de Classificação Tributária IBS/CBS',
        obs: 'Regime regular do IBS e da CBS com creditamento pleno',
      },
      {
        codigo: '000002',
        nome: 'Cesta Básica Nacional de Alimentos — Alíquota Zero',
        desc: 'Operações com produtos destinados à alimentação humana contemplados pelo Anexo I da LC 214/2025',
        fonte: 'CGIBS / RFB / ENCAT',
        tabela: 'IT 2025.002 v1.70 — Tabela de Classificação Tributária IBS/CBS',
        obs: 'Alíquotas do IBS e da CBS reduzidas a 0% (zero)',
      },
      {
        codigo: '000003',
        nome: 'Produtos Agropecuários e Alimentos — Redução de 60%',
        desc: 'Operações com produtos agropecuários, aquícolas, pesqueiros e insumos com alíquota reduzida em 60%',
        fonte: 'CGIBS / RFB / ENCAT',
        tabela: 'IT 2025.002 v1.70 — Tabela de Classificação Tributária IBS/CBS',
        obs: 'Anexo II da LC 214/2025 (Fator multiplicador 0,40)',
      },
      {
        codigo: '000004',
        nome: 'Serviços de Saúde e Dispositivos Médicos — Redução de 60%',
        desc: 'Serviços de saúde humana, laboratoriais, hospitalares e dispositivos médicos do Anexo III da LC 214/2025',
        fonte: 'CGIBS / RFB / ENCAT',
        tabela: 'IT 2025.002 v1.70 — Tabela de Classificação Tributária IBS/CBS',
        obs: 'Redução de 60% na alíquota de referência',
      },
      {
        codigo: '000005',
        nome: 'Serviços de Educação e Ensino — Redução de 60%',
        desc: 'Serviços de educação infantil, ensino fundamental, médio, técnico e superior (Anexo IV da LC 214/2025)',
        fonte: 'CGIBS / RFB / ENCAT',
        tabela: 'IT 2025.002 v1.70 — Tabela de Classificação Tributária IBS/CBS',
        obs: 'Redução de 60% da alíquota padrão',
      },
      {
        codigo: '000006',
        nome: 'Medicamentos e Dispositivos Médicos — Isenção / Redução de 100%',
        desc: 'Medicamentos essenciais do Anexo VI da LC 214/2025 com redução integral a zero',
        fonte: 'CGIBS / RFB / ENCAT',
        tabela: 'IT 2025.002 v1.70 — Tabela de Classificação Tributária IBS/CBS',
        obs: 'Redução de 100% (alíquota zero)',
      },
      {
        codigo: '000007',
        nome: 'Profissões Regulamentadas — Redução de 30%',
        desc: 'Serviços de profissões intelectuais de natureza científica, literária ou artística fiscalizadas por conselho',
        fonte: 'CGIBS / RFB / ENCAT',
        tabela: 'IT 2025.002 v1.70 — Tabela de Classificação Tributária IBS/CBS',
        obs: 'Anexo XIV da LC 214/2025 (Sociedades de Contadores, Advogados, Médicos, Engenheiros)',
      },
      {
        codigo: '000008',
        nome: 'Imposto Seletivo (IS) — Incidência Monofásica',
        desc: 'Operações com bens prejudiciais à saúde ou ao meio ambiente sujeitos ao IS (art. 393 da LC 214/2025)',
        fonte: 'CGIBS / RFB / ENCAT',
        tabela: 'IT 2025.002 v1.70 — Tabela de Classificação Tributária IBS/CBS',
        obs: 'Incidência monofásica com alíquota específica e ad valorem',
      },
      {
        codigo: '000009',
        nome: 'Regime Específico de Combustíveis e Biocombustíveis',
        desc: 'Tributação monofásica por unidade de medida com alíquotas ad rem fixadas nacionalmente',
        fonte: 'CGIBS / RFB / ENCAT',
        tabela: 'IT 2025.002 v1.70 — Tabela de Classificação Tributária IBS/CBS',
        obs: 'Arts. 200 a 220 da LC 214/2025 — Gasolina, Diesel, GLP, Biodiesel e Etanol',
      },
      {
        codigo: '000010',
        nome: 'Regime Específico de Serviços Financeiros e Seguros',
        desc: 'Apuração sobre a margem de intermediação financeira e receitas com tarifas e comissões',
        fonte: 'CGIBS / RFB / ENCAT',
        tabela: 'IT 2025.002 v1.70 — Tabela de Classificação Tributária IBS/CBS',
        obs: 'Arts. 221 a 250 da LC 214/2025 — Bancos, seguradoras e entidades de previdência',
      },
      {
        codigo: '000011',
        nome: 'Regime Específico de Planos de Assistência à Saúde',
        desc: 'Incidência apurada sobre as contraprestações pecuniárias líquidas de indenizações e eventos indenizáveis',
        fonte: 'CGIBS / RFB / ENCAT',
        tabela: 'IT 2025.002 v1.70 — Tabela de Classificação Tributária IBS/CBS',
        obs: 'Arts. 251 a 265 da LC 214/2025 — Operadoras de planos privados de saúde',
      },
      {
        codigo: '000012',
        nome: 'Regime Específico de Bens Imóveis e Locação',
        desc: 'Operações de alienação, loteamento, incorporação, construção e locação de bens imóveis',
        fonte: 'CGIBS / RFB / ENCAT',
        tabela: 'IT 2025.002 v1.70 — Tabela de Classificação Tributária IBS/CBS',
        obs: 'Arts. 266 a 310 da LC 214/2025 — Redutor de ajuste cadastral e alíquota favorecida',
      },
      {
        codigo: '000013',
        nome: 'Regime Específico de Sociedades Cooperativas',
        desc: 'Não incidência sobre o ato cooperativo e repasse de créditos aos cooperados',
        fonte: 'CGIBS / RFB / ENCAT',
        tabela: 'IT 2025.002 v1.70 — Tabela de Classificação Tributária IBS/CBS',
        obs: 'Arts. 311 a 325 da LC 214/2025 — Não cumulatividade no modelo cooperativo',
      },
      {
        codigo: '000014',
        nome: 'Zona Franca de Manaus e Áreas de Livre Comércio — Vendas Internas',
        desc: 'Desoneração do IBS e CBS com manutenção do diferencial de competitividade da ZFM',
        fonte: 'CGIBS / RFB / ENCAT',
        tabela: 'IT 2025.002 v1.70 — Tabela de Classificação Tributária IBS/CBS',
        obs: 'Arts. 440 a 460 da LC 214/2025 — Polo Industrial de Manaus',
      },
      {
        codigo: '000015',
        nome: 'Exportação de Bens e Serviços para o Exterior — Não Incidência Plena',
        desc: 'Imunidade constitucional nas exportações com manutenção e ressarcimento integral de créditos acumulados',
        fonte: 'CGIBS / RFB / ENCAT',
        tabela: 'IT 2025.002 v1.70 — Tabela de Classificação Tributária IBS/CBS',
        obs: 'Art. 156-A, § 5º, II da CF/88 e art. 14 da LC 214/2025',
      },
    ]

    // 2. CST IBS/CBS — Tabela Oficial DF-e / SPED
    const cstItems = [
      {
        codigo: '01',
        nome: 'Operação tributada integralmente',
        desc: 'Tributação integral da operação pelas alíquotas regulares vigentes de IBS e CBS com creditamento pleno',
        fonte: 'RFB / CGIBS / SPED',
        tabela: 'Tabela de CST do IBS e da CBS (DF-e / SPED)',
        obs: 'Permite apropriação e transferência de crédito',
      },
      {
        codigo: '02',
        nome: 'Operação tributada com alíquota reduzida',
        desc: 'Tributação sob regimes diferenciados de redução de 30%, 60% ou alíquota favorecida com cClassTrib vinculado',
        fonte: 'RFB / CGIBS / SPED',
        tabela: 'Tabela de CST do IBS e da CBS (DF-e / SPED)',
        obs: 'Exige indicação do cClassTrib correspondente',
      },
      {
        codigo: '03',
        nome: 'Operação com alíquota zero',
        desc: 'Operações expressamente desoneradas com alíquota de 0% (ex: Cesta Básica Nacional Anexo I)',
        fonte: 'RFB / CGIBS / SPED',
        tabela: 'Tabela de CST do IBS e da CBS (DF-e / SPED)',
        obs: 'Mantém manutenção de crédito nas hipóteses autorizadas por lei',
      },
      {
        codigo: '04',
        nome: 'Operação imune ou não tributada',
        desc: 'Imunidades constitucionais: exportações para o exterior, livros, jornais, periódicos, templos religiosos',
        fonte: 'RFB / CGIBS / SPED',
        tabela: 'Tabela de CST do IBS e da CBS (DF-e / SPED)',
        obs: 'Art. 156-A, § 5º da CF e Seção 4 da LC 214/2025',
      },
      {
        codigo: '05',
        nome: 'Operação com suspensão ou diferimento',
        desc: 'Tributação com exigibilidade suspensa ou diferida para etapas posteriores da cadeia econômica',
        fonte: 'RFB / CGIBS / SPED',
        tabela: 'Tabela de CST do IBS e da CBS (DF-e / SPED)',
        obs: 'Regimes aduaneiros especiais, REPETRO, industrialização sob encomenda',
      },
      {
        codigo: '06',
        nome: 'Operação sob regime específico',
        desc: 'Combustíveis (monofasia), serviços financeiros, planos de saúde, bens imóveis, consórcios e cooperativas',
        fonte: 'RFB / CGIBS / SPED',
        tabela: 'Tabela de CST do IBS e da CBS (DF-e / SPED)',
        obs: 'Capítulo dos Regimes Específicos da LC 214/2025',
      },
      {
        codigo: '49',
        nome: 'Outras operações de saída tributadas',
        desc: 'Demais operações de saídas tributadas não enquadradas especificamente nos códigos de 01 a 06',
        fonte: 'RFB / CGIBS / SPED',
        tabela: 'Tabela de CST do IBS e da CBS (DF-e / SPED)',
        obs: 'Uso residual regulamentar',
      },
      {
        codigo: '50',
        nome: 'Operação de aquisição com direito a crédito integral',
        desc: 'Entrada de mercadorias ou serviços geradora de crédito amplo para abatimento do imposto a recolher',
        fonte: 'RFB / CGIBS / SPED',
        tabela: 'Tabela de CST do IBS e da CBS (DF-e / SPED)',
        obs: 'Princípio da não cumulatividade plena da Reforma Tributária',
      },
      {
        codigo: '51',
        nome: 'Operação de aquisição com direito a crédito presumido',
        desc: 'Entrada que concede crédito presumido legal (produtor rural PF, transportador autônomo, reciclagem)',
        fonte: 'RFB / CGIBS / SPED',
        tabela: 'Tabela de CST do IBS e da CBS (DF-e / SPED)',
        obs: 'Vinculado à tabela cCredPres (arts. 168 a 170 da LC 214/2025)',
      },
      {
        codigo: '99',
        nome: 'Outras operações de entrada / aquisições sem crédito',
        desc: 'Entradas imunes, isentas ou sem apropriação de créditos de IBS e CBS',
        fonte: 'RFB / CGIBS / SPED',
        tabela: 'Tabela de CST do IBS e da CBS (DF-e / SPED)',
        obs: 'Escrituração de insumos e compras não creditáveis',
      },
    ]

    // 3. cCredPres — Tabela de Crédito Presumido (Portal DF-e / SVRS / LC 214/2025)
    const cCredPresItems = [
      {
        codigo: '0101',
        nome: 'Aquisição de produtor rural pessoa física não contribuinte',
        desc: 'Crédito presumido concedido aos adquirentes de produtos agropecuários in natura de produtores rurais PF',
        fonte: 'SVRS / RFB / CGIBS',
        tabela: 'Tabela de Crédito Presumido do IBS/CBS — Portal DF-e',
        obs: 'Art. 168 da LC 214/2025 — percentual fixado em ato conjunto RFB/CGIBS',
      },
      {
        codigo: '0102',
        nome: 'Aquisição de transportador autônomo de carga (TAC)',
        desc: 'Crédito presumido incidente sobre serviços de frete contratados de transportador autônomo PF',
        fonte: 'SVRS / RFB / CGIBS',
        tabela: 'Tabela de Crédito Presumido do IBS/CBS — Portal DF-e',
        obs: 'Art. 169 da LC 214/2025 — fomento ao frete rodoviário autônomo',
      },
      {
        codigo: '0103',
        nome: 'Aquisições de resíduos sólidos e materiais recicláveis de catadores PF',
        desc: 'Crédito presumido na aquisição de sucata, papel, vidro e plásticos de cooperativas e catadores de rua',
        fonte: 'SVRS / RFB / CGIBS',
        tabela: 'Tabela de Crédito Presumido do IBS/CBS — Portal DF-e',
        obs: 'Art. 170 da LC 214/2025 — incentivo fiscal à economia circular e sustentabilidade',
      },
      {
        codigo: '0104',
        nome: 'Bens do ativo imobilizado na transição (saldo remanescente ICMS/PIS/Cofins)',
        desc: 'Aproveitamento do crédito presumido de transição sobre bens adquiridos até 31/12/2026',
        fonte: 'SVRS / RFB / CGIBS',
        tabela: 'Tabela de Crédito Presumido do IBS/CBS — Portal DF-e',
        obs: 'Arts. 343 a 348 da LC 214/2025 (Transição 2026–2033 com estorno controlado)',
      },
      {
        codigo: '0105',
        nome: 'ZFM — Zona Franca de Manaus e Áreas de Livre Comércio',
        desc: 'Crédito presumido regional para compensar a desoneração de mercadorias produzidas no polo industrial',
        fonte: 'SVRS / RFB / CGIBS',
        tabela: 'Tabela de Crédito Presumido do IBS/CBS — Portal DF-e',
        obs: 'Garantia constitucional do diferencial de competitividade da ZFM (art. 444 da LC 214/2025)',
      },
      {
        codigo: '0106',
        nome: 'Aquisição de bens usados de pessoas físicas não contribuintes para revenda',
        desc: 'Crédito presumido na compra de veículos usados, maquinários e equipamentos de pessoa física',
        fonte: 'SVRS / RFB / CGIBS',
        tabela: 'Tabela de Crédito Presumido do IBS/CBS — Portal DF-e',
        obs: 'Art. 171 da LC 214/2025 — não incidência de dupla tributação na revenda de usados',
      },
      {
        codigo: '0107',
        nome: 'Crédito Presumido do Setor Sucroalcooleiro (Biocombustíveis)',
        desc: 'Compensação pela neutralidade ambiental de biocombustíveis na matriz veicular',
        fonte: 'SVRS / RFB / CGIBS',
        tabela: 'Tabela de Crédito Presumido do IBS/CBS — Portal DF-e',
        obs: 'Art. 215 da LC 214/2025 — política de incentivo à descarbonização RenovaBio',
      },
    ]

    // 4. CFOP — Ajuste SINIEF s/nº de 1970 Consolidado Oficial
    const cfopItems = [
      {
        codigo: '1.101',
        nome: 'Compra para industrialização ou produção rural',
        desc: 'Compras de mercadorias a serem utilizadas em processo de industrialização ou produção rural no mesmo Estado',
        fonte: 'CONFAZ / Receita Federal',
        tabela: 'Tabela CFOP oficial (Ajuste SINIEF s/nº de 1970 consolidado 2026)',
        obs: 'Entrada interna de insumos com direito a crédito integral de IBS e CBS',
      },
      {
        codigo: '1.102',
        nome: 'Compra para comercialização',
        desc: 'Compras de mercadorias a serem comercializadas no mercado interno estadual',
        fonte: 'CONFAZ / Receita Federal',
        tabela: 'Tabela CFOP oficial (Ajuste SINIEF s/nº de 1970)',
        obs: 'Entrada interna de mercadorias para revenda com crédito pleno',
      },
      {
        codigo: '1.201',
        nome: 'Devolução de venda de produção do estabelecimento',
        desc: 'Devolução de produtos industrializados pelo próprio estabelecimento',
        fonte: 'CONFAZ / Receita Federal',
        tabela: 'Tabela CFOP oficial (Ajuste SINIEF s/nº de 1970)',
        obs: 'Anulação do débito correspondente de IBS/CBS',
      },
      {
        codigo: '1.202',
        nome: 'Devolução de venda de mercadoria adquirida ou recebida de terceiros',
        desc: 'Devolução de mercadorias vendidas que foram adquiridas para revenda',
        fonte: 'CONFAZ / Receita Federal',
        tabela: 'Tabela CFOP oficial (Ajuste SINIEF s/nº de 1970)',
        obs: 'Ajuste de crédito e débito na apuração',
      },
      {
        codigo: '1.403',
        nome: 'Compra para comercialização em operação com mercadoria sujeita ao regime de ST',
        desc: 'Aquisição de mercadorias com ICMS recolhido anteriormente por substituição tributária (legado transitório)',
        fonte: 'CONFAZ / Receita Federal',
        tabela: 'Tabela CFOP oficial (Ajuste SINIEF s/nº de 1970)',
        obs: 'Transição até extinção gradual do ICMS-ST',
      },
      {
        codigo: '1.556',
        nome: 'Compra de material para uso ou consumo',
        desc: 'Aquisições de materiais destinados ao consumo do próprio estabelecimento adquirente',
        fonte: 'CONFAZ / Receita Federal',
        tabela: 'Tabela CFOP oficial (Ajuste SINIEF s/nº de 1970)',
        obs: 'Na Reforma Tributária gera crédito integral de IBS e CBS para o contribuinte',
      },
      {
        codigo: '1.551',
        nome: 'Compra de bem para o ativo imobilizado',
        desc: 'Aquisição de bens duráveis destinados a integrar o ativo não circulante',
        fonte: 'CONFAZ / Receita Federal',
        tabela: 'Tabela CFOP oficial (Ajuste SINIEF s/nº de 1970)',
        obs: 'Crédito imediato e integral sem fracionamento em 48 meses (art. 42 da LC 214/2025)',
      },
      {
        codigo: '2.101',
        nome: 'Compra para industrialização ou produção rural em operação interestadual',
        desc: 'Aquisição de matérias-primas e insumos procedentes de outro Estado da Federação',
        fonte: 'CONFAZ / Receita Federal',
        tabela: 'Tabela CFOP oficial (Ajuste SINIEF s/nº de 1970)',
        obs: 'Princípio do destino — tributação integral no Estado consumidor',
      },
      {
        codigo: '2.102',
        nome: 'Compra para comercialização em operação interestadual',
        desc: 'Compras interestaduais de mercadorias a serem comercializadas',
        fonte: 'CONFAZ / Receita Federal',
        tabela: 'Tabela CFOP oficial (Ajuste SINIEF s/nº de 1970)',
        obs: 'Na RT o IBS pertence integralmente ao Estado de destino',
      },
      {
        codigo: '3.101',
        nome: 'Compra para industrialização ou produção rural (Importação do exterior)',
        desc: 'Mercadorias importadas utilizadas em processo de industrialização ou agropecuária',
        fonte: 'CONFAZ / Receita Federal',
        tabela: 'Tabela CFOP oficial (Ajuste SINIEF s/nº de 1970)',
        obs: 'Recolhimento do IBS e CBS na nacionalização aduaneira com crédito amplo',
      },
      {
        codigo: '3.102',
        nome: 'Compra para comercialização (Importação do exterior)',
        desc: 'Bens importados para revenda no mercado brasileiro',
        fonte: 'CONFAZ / Receita Federal',
        tabela: 'Tabela CFOP oficial (Ajuste SINIEF s/nº de 1970)',
        obs: 'Tributação de importação no destino do desembaraço',
      },
      {
        codigo: '5.101',
        nome: 'Venda de produção do estabelecimento',
        desc: 'Vendas de produtos industrializados ou produzidos pelo próprio estabelecimento no Estado',
        fonte: 'CONFAZ / Receita Federal',
        tabela: 'Tabela CFOP oficial (Ajuste SINIEF s/nº de 1970)',
        obs: 'Fato gerador pleno das alíquotas de IBS e CBS',
      },
      {
        codigo: '5.102',
        nome: 'Venda de mercadoria adquirida ou recebida de terceiros',
        desc: 'Vendas internas de mercadorias adquiridas de terceiros para comercialização',
        fonte: 'CONFAZ / Receita Federal',
        tabela: 'Tabela CFOP oficial (Ajuste SINIEF s/nº de 1970)',
        obs: 'Saída regular no comércio atacadista ou varejista',
      },
      {
        codigo: '6.101',
        nome: 'Venda de produção do estabelecimento interestadual',
        desc: 'Saída interestadual de bens fabricados pelo estabelecimento',
        fonte: 'CONFAZ / Receita Federal',
        tabela: 'Tabela CFOP oficial (Ajuste SINIEF s/nº de 1970)',
        obs: 'Tributação pelo princípio do destino na UF de entrega',
      },
      {
        codigo: '6.102',
        nome: 'Venda interestadual de mercadoria de terceiros',
        desc: 'Vendas interestaduais de mercadorias adquiridas de terceiros para revenda',
        fonte: 'CONFAZ / Receita Federal',
        tabela: 'Tabela CFOP oficial (Ajuste SINIEF s/nº de 1970)',
        obs: 'Princípio do destino — arrecadação distribuída pelo Comitê Gestor IBS',
      },
      {
        codigo: '7.101',
        nome: 'Venda de produção para o exterior (Exportação)',
        desc: 'Vendas de produtos manufaturados pelo estabelecimento destinados à exportação direta',
        fonte: 'CONFAZ / Receita Federal',
        tabela: 'Tabela CFOP oficial (Ajuste SINIEF s/nº de 1970)',
        obs: 'Imunidade constitucional e ressarcimento rápido de créditos acumulados',
      },
      {
        codigo: '7.102',
        nome: 'Venda de mercadoria adquirida de terceiros para o exterior',
        desc: 'Exportação de mercadorias adquiridas para revenda no mercado internacional',
        fonte: 'CONFAZ / Receita Federal',
        tabela: 'Tabela CFOP oficial (Ajuste SINIEF s/nº de 1970)',
        obs: 'Não incidência plena conforme art. 156-A, § 5º da CF',
      },
    ]

    // 5. NBS 2.0 — Nomenclatura Brasileira de Serviços (MDIC / RFB / Decreto 7.708)
    const nbsItems = [
      {
        codigo: '1.0101.10.00',
        nome: 'Serviços jurídicos e de advocacia contenciosa',
        desc: 'Serviços de representação e assistência jurídica em juízo, processos cíveis, trabalhistas e tributários',
        fonte: 'RFB / MDIC / Codex NBS 2.0',
        tabela: 'Nomenclatura Brasileira de Serviços (Decreto 7.708 / Portaria Conjunta RFB/SCS)',
        obs: 'Profissão Regulamentada — Anexo XIV da LC 214/2025 (Redução 30%)',
      },
      {
        codigo: '1.0102.10.00',
        nome: 'Serviços de contabilidade, auditoria e escrituração fiscal',
        desc: 'Serviços contábeis de elaboração de balanços, declarações fiscais e auditoria independente',
        fonte: 'RFB / MDIC / Codex NBS 2.0',
        tabela: 'Nomenclatura Brasileira de Serviços (NBS 2.0)',
        obs: 'Profissão Regulamentada — Redução de 30% nas alíquotas do IBS/CBS',
      },
      {
        codigo: '1.0201.20.00',
        nome: 'Serviços de consultoria em tecnologia da informação (TI)',
        desc: 'Consultoria técnica em sistemas computacionais, arquitetura de software e governança digital',
        fonte: 'RFB / MDIC / Codex NBS 2.0',
        tabela: 'Nomenclatura Brasileira de Serviços (NBS 2.0)',
        obs: 'Tributação padrão com aproveitamento amplo de crédito',
      },
      {
        codigo: '1.0202.10.00',
        nome: 'Serviços de desenvolvimento de softwares e aplicativos sob encomenda',
        desc: 'Concepção, programação e implementação customizada de soluções de software e mobile apps',
        fonte: 'RFB / MDIC / Codex NBS 2.0',
        tabela: 'Nomenclatura Brasileira de Serviços (NBS 2.0)',
        obs: 'Regime regular não-cumulativo',
      },
      {
        codigo: '1.0301.11.00',
        nome: 'Serviços médicos de clínica geral e especialidades',
        desc: 'Atendimento médico ambulatorial, consultas especializadas e telemedicina',
        fonte: 'RFB / MDIC / Codex NBS 2.0',
        tabela: 'Nomenclatura Brasileira de Serviços (NBS 2.0)',
        obs: 'Anexo III da LC 214/2025 (Redução de 60%)',
      },
      {
        codigo: '1.0302.10.00',
        nome: 'Serviços odontológicos e ortodônticos',
        desc: 'Consultas, cirurgias odontológicas, implantes e tratamento de canais',
        fonte: 'RFB / MDIC / Codex NBS 2.0',
        tabela: 'Nomenclatura Brasileira de Serviços (NBS 2.0)',
        obs: 'Serviços de Saúde — Redução de 60% na alíquota padrão',
      },
      {
        codigo: '1.0401.10.00',
        nome: 'Serviços de ensino fundamental e médio regular',
        desc: 'Serviços educacionais prestados por escolas e colégios de educação básica',
        fonte: 'RFB / MDIC / Codex NBS 2.0',
        tabela: 'Nomenclatura Brasileira de Serviços (NBS 2.0)',
        obs: 'Anexo IV da LC 214/2025 (Redução de 60%)',
      },
      {
        codigo: '1.0402.10.00',
        nome: 'Serviços de ensino superior (graduação e pós-graduação)',
        desc: 'Cursos de faculdade, bacharelados, licenciaturas e especializações presenciais ou EaD',
        fonte: 'RFB / MDIC / Codex NBS 2.0',
        tabela: 'Nomenclatura Brasileira de Serviços (NBS 2.0)',
        obs: 'Serviços de Educação — Redução de 60%',
      },
      {
        codigo: '1.0501.10.00',
        nome: 'Serviços de intermediação e plataformas digitais',
        desc: 'Intermediação de negócios, marketplaces e veiculação de publicidade em meio digital',
        fonte: 'RFB / MDIC / Codex NBS 2.0',
        tabela: 'Nomenclatura Brasileira de Serviços (NBS 2.0)',
        obs: 'Responsabilidade tributária por solidariedade na falta de recolhimento (art. 21 da LC 214/2025)',
      },
      {
        codigo: '1.0601.10.00',
        nome: 'Serviços de transporte rodoviário de cargas municipal e intermunicipal',
        desc: 'Frete e transporte de mercadorias por caminhões e veículos comerciais leves',
        fonte: 'RFB / MDIC / Codex NBS 2.0',
        tabela: 'Nomenclatura Brasileira de Serviços (NBS 2.0)',
        obs: 'Não cumulatividade ampla com crédito de combustível e manutenção',
      },
    ]

    // 6. CNAE 2.3 — Subclasses Oficiais (IBGE / CONCLA)
    const cnaeItems = [
      {
        codigo: '0111-3/01',
        nome: 'Cultivo de arroz',
        desc: 'Produção agrícola de arroz irrigado ou de sequeiro para fornecimento',
        fonte: 'IBGE / CONCLA',
        tabela: 'CNAE Subclasses 2.3 (IBGE)',
        obs: 'Produtor rural com direito a crédito presumido pelo art. 168 da LC 214/2025',
      },
      {
        codigo: '0111-3/02',
        nome: 'Cultivo de milho',
        desc: 'Produção agrícola de milho em grão para alimentação e ração',
        fonte: 'IBGE / CONCLA',
        tabela: 'CNAE Subclasses 2.3 (IBGE)',
        obs: 'Insumo agropecuário estratégico desonerado',
      },
      {
        codigo: '0115-6/00',
        nome: 'Cultivo de soja',
        desc: 'Cultivo extensivo de soja em grãos para consumo interno e exportação',
        fonte: 'IBGE / CONCLA',
        tabela: 'CNAE Subclasses 2.3 (IBGE)',
        obs: 'Forte peso na balança comercial com imunidade nas exportações',
      },
      {
        codigo: '1011-2/01',
        nome: 'Frigorífico — abate de bovinos',
        desc: 'Abate de reses bovinas e preparação de carcaças, meias-carcaças e cortes',
        fonte: 'IBGE / CONCLA',
        tabela: 'CNAE Subclasses 2.3 (IBGE)',
        obs: 'Fornecedor da Cesta Básica Nacional (Alíquota zero)',
      },
      {
        codigo: '1051-1/00',
        nome: 'Preparação do leite e fabricação de laticínios',
        desc: 'Pasteurização, desidratação e industrialização de leite, queijos, manteigas e iogurtes',
        fonte: 'IBGE / CONCLA',
        tabela: 'CNAE Subclasses 2.3 (IBGE)',
        obs: 'Cesta Básica Nacional de Alimentos',
      },
      {
        codigo: '4711-3/01',
        nome: 'Comércio varejista de mercadorias em geral, com predominância de produtos alimentícios (hipermercados)',
        desc: 'Comércio de alimentos, bebidas, higiene e limpeza com área de vendas ampla',
        fonte: 'IBGE / CONCLA',
        tabela: 'CNAE Subclasses 2.3 (IBGE)',
        obs: 'Mix de produtos: Cesta Básica (zero), alíquota reduzida e padrão',
      },
      {
        codigo: '4711-3/02',
        nome: 'Comércio varejista de mercadorias em geral (supermercados)',
        desc: 'Venda a varejo de itens alimentícios e de utilidade diária',
        fonte: 'IBGE / CONCLA',
        tabela: 'CNAE Subclasses 2.3 (IBGE)',
        obs: 'Foco no atendimento da alimentação familiar',
      },
      {
        codigo: '4930-2/02',
        nome: 'Transporte rodoviário de carga, exceto produtos perigosos e mudanças, intermunicipal, interestadual e internacional',
        desc: 'Serviço rodoviário logístico de transporte de cargas em geral',
        fonte: 'IBGE / CONCLA',
        tabela: 'CNAE Subclasses 2.3 (IBGE)',
        obs: 'Apropriação ampla de créditos sobre óleo diesel e pneus',
      },
      {
        codigo: '6201-5/01',
        nome: 'Desenvolvimento de programas de computador sob encomenda',
        desc: 'Criação e desenvolvimento de softwares customizados para clientes específicos',
        fonte: 'IBGE / CONCLA',
        tabela: 'CNAE Subclasses 2.3 (IBGE)',
        obs: 'Divisão 62 (Atividades dos serviços de tecnologia da informação)',
      },
      {
        codigo: '6911-7/01',
        nome: 'Serviços advocatícios',
        desc: 'Assessoria jurídica, consultoria contenciosa e preventiva prestada por advogados',
        fonte: 'IBGE / CONCLA',
        tabela: 'CNAE Subclasses 2.3 (IBGE)',
        obs: 'Profissão Regulamentada (Redução 30%)',
      },
      {
        codigo: '6920-6/01',
        nome: 'Atividades de contabilidade',
        desc: 'Serviços de registro contábil de transações comerciais, elaboração de demonstrações contábeis e consultoria contábil',
        fonte: 'IBGE / CONCLA',
        tabela: 'CNAE Subclasses 2.3 (Comissão Nacional de Classificação)',
        obs: 'Divisão 69 (Atividades jurídicas, de contabilidade e de auditoria)',
      },
      {
        codigo: '8531-7/00',
        nome: 'Educação superior — graduação',
        desc: 'Cursos de graduação universitária e pós-graduação lato e stricto sensu',
        fonte: 'IBGE / CONCLA',
        tabela: 'CNAE Subclasses 2.3 (IBGE)',
        obs: 'Serviços de Educação — Anexo IV da LC 214/2025 (Redução 60%)',
      },
      {
        codigo: '8610-1/01',
        nome: 'Atividades de atendimento hospitalar, exceto pronto-socorro',
        desc: 'Serviços hospitalares com internação para tratamento clínico ou cirúrgico',
        fonte: 'IBGE / CONCLA',
        tabela: 'CNAE Subclasses 2.3 (IBGE)',
        obs: 'Serviços de Saúde — Anexo III da LC 214/2025 (Redução 60%)',
      },
    ]

    const allBatches = [
      { tipo: 'cClassTrib', items: cClassTribItems, prefix: 'cclasstrib-0' },
      { tipo: 'CST', items: cstItems, prefix: 'cst-0' },
      { tipo: 'cCredPres', items: cCredPresItems, prefix: 'ccredpres-0' },
      { tipo: 'CFOP', items: cfopItems, prefix: 'cfop-0' },
      { tipo: 'NBS', items: nbsItems, prefix: 'nbs-0' },
      { tipo: 'CNAE_2_3', items: cnaeItems, prefix: 'cnae-0' },
    ]

    for (let b = 0; b < allBatches.length; b++) {
      const batch = allBatches[b]
      for (let i = 0; i < batch.items.length; i++) {
        const it = batch.items[i]
        const cleanCode = it.codigo.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
        const rowId = batch.prefix + cleanCode

        try {
          app
            .db()
            .newQuery(`
            INSERT INTO classifications (id, tipo, codigo, descricao, nome, fonte, tabela_origem, atualizado_em, observacoes, created, updated)
            VALUES ({:id}, {:tipo}, {:codigo}, {:descricao}, {:nome}, {:fonte}, {:tabela_origem}, {:atualizado_em}, {:observacoes}, {:now}, {:now})
            ON CONFLICT(tipo, codigo) DO UPDATE SET
              descricao = {:descricao},
              nome = {:nome},
              fonte = {:fonte},
              tabela_origem = {:tabela_origem},
              atualizado_em = {:atualizado_em},
              observacoes = {:observacoes},
              updated = {:now}
          `)
            .bind({
              id: rowId,
              tipo: batch.tipo,
              codigo: it.codigo,
              descricao: it.desc,
              nome: it.nome,
              fonte: it.fonte,
              tabela_origem: it.tabela,
              atualizado_em: refData,
              observacoes: it.obs,
              now: now,
            })
            .execute()
        } catch (err) {
          console.log('[0057_seed error] ' + batch.tipo + ' / ' + it.codigo + ': ' + String(err))
        }
      }
    }
  },
  (app) => {
    try {
      app
        .db()
        .newQuery(
          "DELETE FROM classifications WHERE id LIKE 'cclasstrib-0%' OR id LIKE 'cst-0%' OR id LIKE 'ccredpres-0%' OR id LIKE 'cfop-0%' OR id LIKE 'nbs-0%' OR id LIKE 'cnae-0%'",
        )
        .execute()
    } catch (_) {}
  },
)
