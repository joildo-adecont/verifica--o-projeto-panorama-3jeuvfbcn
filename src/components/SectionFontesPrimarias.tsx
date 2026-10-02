import { ExternalLink, Info, AlertTriangle } from 'lucide-react'

export function SectionFontesPrimarias() {
  const grupos: { nome: string; desc: string; bases: [string, string, string, string][] }[] = [
    {
      nome: 'Reforma IBS/CBS',
      desc: 'Regulamentos, regimes por NCM, cClassTrib, cCredPres, DeRE, cronograma, calculadora oficial',
      bases: [
        [
          'Anexo VII — Indicadores de Operação (cIndOp) do IBS/CBS',
          'Receita Federal — Portal Nacional da NFS-e',
          '11 de setembro de 2026',
          'https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/rtc/anexovii-indop_ibscbs_v1-03-00-nt009.xlsx',
        ],
        [
          'Anexo VIII — Correlação Item LC 116 × NBS × IndOp × cClassTrib (IBS/CBS)',
          'Receita Federal — Portal Nacional da NFS-e',
          '24 de junho de 2026',
          'https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/rtc',
        ],
        [
          'Calculadora de Tributos (RTC) — motor oficial de cálculo do IBS/CBS',
          'Receita Federal / Serpro',
          '30 de setembro de 2026',
          'https://consumo.tributos.gov.br/servico/calcular-tributos-consumo/calculadora-offline-download',
        ],
        [
          'Cronograma de obrigatoriedade de emissão dos documentos fiscais eletrônicos (IBS/CBS)',
          'Receita Federal do Brasil e Comitê Gestor do IBS (CGIBS)',
          '31 de julho de 2026',
          'https://www.cgibs.gov.br/upload/arquivos/202607/31091735-20260730-16h30-ato-conjunto-rfb-cgibs-na-c2-ba-4-260731-090909.pdf',
        ],
        [
          'Esquemas XSD da DeRE, pacote 1.2.0',
          'Comitê Gestor do IBS (CGIBS) e Receita Federal do Brasil',
          '05 de setembro de 2026',
          'https://www.cgibs.gov.br/declaracao-de-regimes-especificos-dere',
        ],
        [
          'FAQ do Piloto — Calculadora da Plataforma da CBS, versão 1.4',
          'Receita Federal do Brasil',
          '07 de julho de 2025',
          'https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/apresentacoes/reforma-tributaria-do-consumo',
        ],
        [
          'IBS/CBS nos DF-e: as Notas Técnicas da Reforma Tributária',
          'Portal Nacional dos DF-e / SVRS',
          '01 de outubro de 2026',
          'https://dfe-portal.svrs.rs.gov.br/Dfe/Documentos',
        ],
        [
          'Indicadores por CFOP (indNFe, devolução, retorno, autorização ao contribuinte exclusivo do IBS/CBS…)',
          'Portal Nacional da NF-e / ENCAT',
          '28 de setembro de 2026',
          'https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=hXzemuyNHW4=',
        ],
        [
          'Leiautes da DeRE — Declaração de Regimes Específicos, versão 1.2.0',
          'Comitê Gestor do IBS (CGIBS) e Receita Federal do Brasil',
          '21 de setembro de 2026',
          'https://www.cgibs.gov.br/declaracao-de-regimes-especificos-dere',
        ],
        [
          'Manual da Opção pelo Regime Regular do IBS e da CBS no Simples Nacional',
          'Secretaria-Executiva do Comitê Gestor do Simples Nacional (SE/CGSN)',
          '01 de setembro de 2026',
          'https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/manuais/reforma-tributaria-do-consumo/manual-escolha-regime-ibs-e-cbs-no-simples-nacional',
        ],
        [
          'Manual da Plataforma CBS — Portal, Apuração Assistida e Calculadora de Tributos',
          'Receita Federal do Brasil',
          '20 de maio de 2026',
          'https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/manuais/reforma-tributaria-do-consumo/manual-plataforma-cbs-21-maio-2026-07h40.pdf',
        ],
        [
          'Reforma Tributária — regimes por NCM (IBS/CBS e Imposto Seletivo)',
          'Presidência da República / Planalto',
          '01 de outubro de 2026',
          'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
        ],
        [
          'Regulamento da CBS',
          'Presidência da República',
          '29 de abril de 2026',
          'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/D12955.htm',
        ],
        [
          'Regulamento do IBS',
          'Comitê Gestor do IBS (CGIBS)',
          '30 de abril de 2026',
          'https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf',
        ],
        [
          'Roteiro da Opção pelo Regime Específico do IBS e da CBS das Sociedades Cooperativas',
          'Receita Federal do Brasil',
          '15 de setembro de 2026',
          'https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/manuais/reforma-tributaria-do-consumo/manual_cooperativas.pdf',
        ],
        [
          'Tabela de Classificação Tributária do IBS e da CBS (cClassTrib + CST IBS/CBS)',
          'Receita Federal / ENCAT / SVRS',
          '01 de outubro de 2026',
          'https://dfe-portal.svrs.rs.gov.br/Cff/ClassificacaoTributaria',
        ],
        [
          'Tabela de Crédito Presumido do IBS e da CBS (cCredPres)',
          'SVRS — Portal da Conformidade Fácil (DF-e)',
          '01 de outubro de 2026',
          'https://dfe-portal.svrs.rs.gov.br/CFF/TabelaCreditoPresumido',
        ],
      ],
    },
    {
      nome: 'Fiscal / NF-e / SPED / tributos federais',
      desc: 'Leiautes e regras de validação dos DF-e, tabelas SPED, PIS/COFINS, IPI, Simples, DARF',
      bases: [
        [
          'Alíquotas de PIS/COFINS por CST (regimes e monofásico)',
          'Presidência da República / Receita Federal',
          '14 de julho de 2026',
          'https://www.planalto.gov.br/ccivil_03/leis/',
        ],
        [
          'Anexo XI — Ocupações permitidas ao MEI (Tabelas A e B)',
          'Comitê Gestor do Simples Nacional — Receita Federal',
          '16 de outubro de 2025',
          'https://www8.receita.fazenda.gov.br/SimplesNacional/Arquivos/manual/Anexo_XI.pdf',
        ],
        [
          'Anexo Único da DIRBI — incentivos, renúncias, benefícios e imunidades de natureza tributária',
          'Receita Federal do Brasil',
          '15 de dezembro de 2025',
          'https://www.in.gov.br/en/web/dou/-/instrucao-normativa-rfb-n-2.294-de-3-de-dezembro-de-2025-675175269',
        ],
        [
          'Anexos I a V do Simples Nacional (alíquotas e partilha)',
          'Presidência da República (Planalto)',
          '28 de setembro de 2026',
          'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm',
        ],
        [
          'BP-e (modelo 63): regras de validação',
          'Portal Nacional do BP-e / SVRS',
          '28 de setembro de 2026',
          'https://dfe-portal.svrs.rs.gov.br/BPE/Documentos',
        ],
        [
          'Combustíveis da NF-e — monofásicos de ICMS, ad rem por período e índice de mistura de biocombustível',
          'Receita Federal do Brasil / ENCAT — Portal Nacional da NF-e',
          '01 de janeiro de 2026',
          'https://www.nfe.fazenda.gov.br/portal/principal.aspx',
        ],
        [
          'Contingência off-line da NFC-e (tpEmis = 9): modelo operacional, prazo e campos',
          'ENCAT/Sefaz — Portal Nacional da NF-e',
          '12 de agosto de 2026',
          'https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=33ol5hhSYZk=',
        ],
        [
          'CT-e, CT-e OS e GTV-e: leiaute do XML e regras de validação',
          'Portal Nacional do CT-e / SVRS',
          '28 de setembro de 2026',
          'https://www.cte.fazenda.gov.br/portal/listaSubMenu.aspx?Id=/PkOl1jvcbo=',
        ],
        [
          'Código de Enquadramento Legal do IPI (cEnq)',
          'Receita Federal do Brasil / ENCAT — Portal Nacional da NF-e',
          '19 de agosto de 2022',
          'https://www.nfe.fazenda.gov.br/portal/principal.aspx',
        ],
        [
          'Códigos de receita DARF (SIEF Receitas)',
          'Receita Federal (SIEF)',
          '21 de setembro de 2026',
          'https://siefreceitas.receita.economia.gov.br/api/receitas',
        ],
        [
          'Códigos de status e rejeição da NF-e (cStat) + regras de validação',
          'ENCAT/Sefaz (MOC nacional; consolidação Sefa-PR)',
          '28 de setembro de 2026',
          'http://moc.sped.fazenda.pr.gov.br/RegrasDeValidação.html',
        ],
        [
          'DANFE NFC-e e QR Code: parâmetros da URL, identificador do CSC e geração do hash',
          'ENCAT/Sefaz — Portal Nacional da NF-e',
          '12 de agosto de 2026',
          'https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=33ol5hhSYZk=',
        ],
        [
          'DC-e (modelo 99): leiaute do XML e regras de validação',
          'Portal Nacional dos DF-e / SVRS',
          '28 de setembro de 2026',
          'https://dfe-portal.svrs.rs.gov.br/DCE/Documentos',
        ],
        [
          'Esquema XML da NF-e (leiaute) — enums oficiais de campo',
          'Receita Federal / ENCAT',
          '01 de outubro de 2026',
          'https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=/fwLvLUSmU8=',
        ],
        [
          'Esquemas XSD da NF-e ABI, pacote PL_NFeABI_1.00',
          'Portal Nacional da NF-e',
          '02 de setembro de 2026',
          'https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=sNOtscnJo6w=',
        ],
        [
          'Esquemas XSD do BP-e, pacote PL_BPe_100b_NT2026.002_RTC_1.01',
          'Portal Nacional do BP-e / SVRS',
          '28 de agosto de 2026',
          'https://dfe-portal.svrs.rs.gov.br/BPE/Documentos',
        ],
        [
          'Esquemas XSD do CT-e, pacote PL_CTe_400_NT2026.002_RTC_1.01_corr_2',
          'Portal Nacional do CT-e / SVRS',
          '12 de agosto de 2026',
          'https://www.cte.fazenda.gov.br/portal/listaSubMenu.aspx?Id=/PkOl1jvcbo=',
        ],
        [
          'Esquemas XSD do DC-e, pacote PL_DCe_v1.00a_NT2024.001v1.00',
          'Portal Nacional dos DF-e / SVRS',
          '28 de agosto de 2026',
          'https://dfe-portal.svrs.rs.gov.br/DCE/Documentos',
        ],
        [
          'Esquemas XSD do MDF-e, pacote PL_MDFe_300b_NT012025_1.04',
          'Portal Nacional do MDF-e / SVRS',
          '12 de agosto de 2026',
          'https://dfe-portal.svrs.rs.gov.br/Mdfe/Documentos',
        ],
        [
          'Esquemas XSD do NF3e, pacote PL_NF3E_1.00a_NT2026.002_RTC_1.01',
          'Portal Nacional dos DF-e / SVRS',
          '12 de agosto de 2026',
          'https://dfe-portal.svrs.rs.gov.br/NF3E/Documentos',
        ],
        [
          'Esquemas XSD do NFAg, pacote PL_NFAg_NT2026.002_RTC_1.01',
          'Portal Nacional dos DF-e / SVRS',
          '28 de agosto de 2026',
          'https://dfe-portal.svrs.rs.gov.br/NFAG/Documentos',
        ],
        [
          'Esquemas XSD do NFCom, pacote PL_NFCOM_1.00_NT2026.002_RTC_1.01',
          'SEFAZ Virtual do Rio Grande do Sul (SVRS)',
          '12 de agosto de 2026',
          'https://dfe-portal.svrs.rs.gov.br/NFCOM',
        ],
        [
          'Esquemas XSD do NFGas, pacote PL_NFGas_NT2026.002_RTC_1.01',
          'Portal Nacional dos DF-e / SVRS',
          '28 de agosto de 2026',
          'https://dfe-portal.svrs.rs.gov.br/NFGAS/Documentos',
        ],
        [
          'MDF-e (modelo 58): leiaute do XML e regras de validação',
          'Portal Nacional do MDF-e / SVRS',
          '28 de setembro de 2026',
          'https://dfe-portal.svrs.rs.gov.br/Mdfe/Documentos',
        ],
        [
          'Medicamentos por GTIN (lista PMC da CMED + registros Anvisa)',
          'CMED / Anvisa',
          '28 de setembro de 2026',
          'https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos',
        ],
        [
          'NF-e ABI (modelo 77): leiaute do XML e regras de validação',
          'Portal Nacional dos DF-e / SVRS',
          '28 de setembro de 2026',
          'https://dfe-portal.svrs.rs.gov.br/NFEABI/Documentos',
        ],
        [
          'NF3e (modelo 66): leiaute do XML e regras de validação',
          'Portal Nacional dos DF-e / SVRS',
          '28 de setembro de 2026',
          'https://dfe-portal.svrs.rs.gov.br/NF3E/Documentos',
        ],
        [
          'NFAg (modelo 75): leiaute do XML e regras de validação',
          'Portal Nacional dos DF-e / SVRS',
          '28 de setembro de 2026',
          'https://dfe-portal.svrs.rs.gov.br/NFAG/Documentos',
        ],
        [
          'NFAg (modelo 75): padrões técnicos de comunicação',
          'Portal Nacional dos DF-e / SVRS',
          '07 de agosto de 2026',
          'https://dfe-portal.svrs.rs.gov.br/NFAG/Documentos',
        ],
        [
          'NFGas (modelo 76): leiaute do XML e regras de validação',
          'Portal Nacional dos DF-e / SVRS',
          '28 de setembro de 2026',
          'https://dfe-portal.svrs.rs.gov.br/NFGAS/Documentos',
        ],
        [
          'NFGas (modelo 76): padrões técnicos de comunicação',
          'Portal Nacional dos DF-e / SVRS',
          '07 de agosto de 2026',
          'https://dfe-portal.svrs.rs.gov.br/NFGAS/Documentos',
        ],
        [
          'NFCom (modelo 62): leiaute do XML e regras de validação',
          'SVRS — Sefaz Virtual do RS',
          '31 de janeiro de 2023',
          'https://dfe-portal.svrs.rs.gov.br/NFCOM',
        ],
        [
          'NFCom (modelo 62): padrões técnicos de comunicação',
          'SVRS — Sefaz Virtual do RS',
          '25 de janeiro de 2023',
          'https://dfe-portal.svrs.rs.gov.br/NFCOM/Documentos',
        ],
        [
          'NFS-e Via: leiaute do XML e regras de negócio',
          'Comitê Gestor da NFS-e Nacional (CGNFSe)',
          '28 de setembro de 2026',
          'https://www.gov.br/nfse/pt-br',
        ],
        [
          'NT 008 — Especificações Técnicas do DANFSe',
          'Secretaria-Executiva do Comitê Gestor da NFS-e',
          '14 de julho de 2026',
          'https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/documentacao-atual',
        ],
        [
          'Portal da Transparência — remuneração de servidores federais',
          'Controladoria-Geral da União — CGU',
          '01 de junho de 2026',
          'https://portaldatransparencia.gov.br/download-de-dados/servidores',
        ],
        [
          'Regras de negócio da NFS-e Nacional (Sefin/ADN)',
          'Sefin/ADN — NFS-e Nacional (gov.br)',
          '09 de fevereiro de 2026',
          'https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/producao-restrita',
        ],
        [
          'Tabela de Códigos da NF-e ABI (modelo 77) — v2.00',
          'Receita Federal / ENCAT — Portal Nacional da NF-e',
          '17 de agosto de 2026',
          'https://www.nfe.fazenda.gov.br/portal/principal.aspx',
        ],
        [
          'Tabela de Municípios (DTB/IBGE) — cMun da NF-e',
          'Portal Nacional da NF-e / IBGE',
          '28 de setembro de 2026',
          'https://www.nfe.fazenda.gov.br/portal/principal.aspx',
        ],
        [
          'Tabela de Prefixo GS1 (validação de GTIN)',
          'Portal Nacional da NF-e / GS1',
          '28 de setembro de 2026',
          'https://www.nfe.fazenda.gov.br/portal/principal.aspx',
        ],
        [
          'Tabela Nacional de Meios de Pagamento (tPag)',
          'RFB / ENCAT — Portal Nacional da NF-e e SEFAZ Virtual RS',
          '04 de março de 2026',
          'https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=hXzemuyNHW4=',
        ],
        [
          'Tabela nacional de bandeiras de cartão (tBand)',
          'RFB / ENCAT — Portal Nacional da NF-e',
          '01 de janeiro de 2020',
          'https://www.nfe.fazenda.gov.br/portal/principal.aspx',
        ],
        [
          'Tabelas do eSocial (classificações do leiaute)',
          'eSocial — Receita Federal, INSS, MTE e Caixa',
          '09 de abril de 2026',
          'https://www.gov.br/esocial/pt-br/tabelas-do-esocial',
        ],
        [
          'Tabelas menores da NF-e — tipo/espécie de veículo, unidade comercial e padrão de regi',
          'RFB / ENCAT — Portal Nacional da NF-e',
          '12 de março de 2020',
          'https://www.nfe.fazenda.gov.br/portal/principal.aspx',
        ],
        [
          'Tabelas SPED (CFOP, CST, gênero IPI, selo IPI)',
          'Receita Federal',
          '30 de setembro de 2026',
          'https://www.sped.fazenda.gov.br/spedtabelas/AppConsulta/publico/aspx/ConsultaTabelasExternas.aspx?CodSistema=SpedFiscal',
        ],
        [
          'Tabelas de crédito de PIS/Pasep e Cofins (CFOP geradores de crédito, devolução etc.)',
          'Receita Federal do Brasil (SPED)',
          '17 de setembro de 2026',
          'https://www.sped.fazenda.gov.br/spedtabelas/AppConsulta/publico/aspx/ConsultaTabelasExternas.aspx?CodSistema=SpedFiscal',
        ],
        [
          'TIPI — Tabela de Incidência do IPI',
          'Receita Federal',
          'janeiro de 2026',
          'https://www.nfe.fazenda.gov.br/portal/principal.aspx',
        ],
        [
          'Unidade Tributável por NCM (uTrib) — Comércio Exterior',
          'Receita Federal / ENCAT',
          '28 de setembro de 2026',
          'https://www.nfe.fazenda.gov.br/portal/principal.aspx',
        ],
        [
          'NCM de Tipos de Papel do RECOPI e NCM Especiais do Registro de Exportação',
          'RFB / ENCAT — Portal Nacional da NF-e',
          '22 de agosto de 2026',
          'https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=sNOtscnJo6w=',
        ],
      ],
    },
    {
      nome: 'Serviços (NBS, ISS, NFS-e)',
      desc: 'NBS, LC 116, NFS-e Nacional (leiautes, códigos, erros, DANFSe)',
      bases: [
        [
          'Erros e alertas da NFS-e — padrão ABRASF 2.04',
          'ABRASF',
          '21 de setembro de 2026',
          'https://abrasf.org.br/biblioteca/arquivos-publicos/nfs-e/versao-2-04/erros-e-alertas-nfs-e-2-04',
        ],
        [
          'LC 116/2003 — Lista de serviços do ISS',
          'Presidência da República (Planalto)',
          '11 de julho de 2026',
          'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp116.htm',
        ],
        [
          'Lista de Serviço Nacional (cTribNac) e regras de incidência do ISS',
          'Receita Federal — Comitê Gestor da NFS-e',
          '09 de fevereiro de 2026',
          'https://www.gov.br/nfse/pt-br',
        ],
        [
          'NBS 2.0 — Nomenclatura Brasileira de Serviços, Intangíveis e Outras Operações',
          'Receita Federal / MDIC (SCS)',
          '25 de junho de 2026',
          'https://www.gov.br/mdic/pt-br/assuntos/sdic/comercio-e-servicos/nbs-nomenclatura-brasileira-de-servicos',
        ],
        [
          'Anexo VII — Indicadores de Operação (cIndOp) da NFS-e',
          'Receita Federal — Portal Nacional da NFS-e',
          '11 de setembro de 2026',
          'https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/rtc',
        ],
        [
          'Esquemas XSD da NFS-e Nacional',
          'Receita Federal — Portal Nacional da NFS-e (SE/CGNFS-e)',
          '27 de julho de 2026',
          'https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/documentacao-atual',
        ],
        [
          'Esquemas XSD do NFS-e Via, pacote arquivos-xsd-16dez2025',
          'Comitê Gestor da NFS-e Nacional (CGNFSe)',
          '12 de agosto de 2026',
          'https://www.gov.br/nfse/pt-br',
        ],
        [
          'Anexo II — Eventos da NFS-e e pedido de registro de evento',
          'Receita Federal — Portal Nacional da NFS-e (SE/CGNFS-e)',
          '22 de janeiro de 2026',
          'https://www.gov.br/nfse/pt-br',
        ],
      ],
    },
    {
      nome: 'ICMS / CONFAZ / estadual',
      desc: 'CEST, MVA-ST, protocolos/convênios, CFOP (notas), FCP, cBenef',
      bases: [
        [
          'Alíquotas de FCP por UF (validação da NF-e)',
          'ENCAT/Sefaz — Portal Nacional da NF-e',
          '28 de setembro de 2026',
          'https://www.nfe.fazenda.gov.br/portal/principal.aspx',
        ],
        [
          'Anexo II do Convênio s/nº de 1970 — notas explicativas do CFOP',
          'CONFAZ',
          '28 de setembro de 2026',
          'https://www.confaz.fazenda.gov.br/legislacao/ajustes/sinief/cfop_cvsn_1-6.24',
        ],
        [
          'CEST — Código Especificador da Substituição Tributária',
          'CONFAZ',
          '01 de outubro de 2026',
          'https://www.confaz.fazenda.gov.br/legislacao/convenios/2018/CV142_18',
        ],
        [
          'Convênio ICMS 52/91 — redução de base de cálculo (equipamentos industriais e importados)',
          'CONFAZ',
          '21 de agosto de 2026',
          'https://www.confaz.fazenda.gov.br/legislacao/convenios/1991/CV052_91',
        ],
        [
          'MVA-ST por CEST — legislação estadual (7 UFs fora do Portal Nacional)',
          'Sefaz MG, RJ, RS, MT, AC, AM, DF',
          '22 de setembro de 2026',
          'https://ww1.receita.fazenda.df.gov.br/legislacao/visualizar-legislacao?txtNumero=18955&txtAno=1997&txtTipo=6&txtParte=ANEXO%2004%20CADERNO%2001',
        ],
        [
          'MVA-ST por CEST — Planilhas do Portal Nacional da Substituição Tributária',
          'CONFAZ',
          '24 de julho de 2026',
          'https://www.confaz.fazenda.gov.br/legislacao/portal-nacional-da-substituicao-tributaria',
        ],
        [
          'Protocolos e Convênios ICMS de ST — signatários vigentes por ato',
          'CONFAZ',
          '01 de outubro de 2026',
          'https://www.confaz.fazenda.gov.br/legislacao/protocolos',
        ],
        [
          'Ajustes SINIEF dos documentos fiscais eletrônicos — 202ª Reunião Ordinária do CONFAZ',
          'CONFAZ',
          '14 de setembro de 2026',
          'https://www.confaz.fazenda.gov.br/legislacao/ajustes/2026',
        ],
        [
          'Códigos de benefício fiscal da NF-e (cBenef) — 8 UFs (cobertura completa)',
          'Sefaz SP, PR, ES, GO, RJ, RS, DF, SC',
          '30 de setembro de 2026',
          'https://portal.fazenda.sp.gov.br/servicos/nfe/Paginas/cBenef.aspx',
        ],
      ],
    },
    {
      nome: 'Comércio exterior / classificação',
      desc: 'NCM, TEC/CAMEX, cotas, LESSIN, antidumping, Duimp, Siscomex',
      bases: [
        [
          'Atributos por NCM da Duimp e do Catálogo de Produtos',
          'Receita Federal — CADA do Portal Único Siscomex',
          '01 de outubro de 2026',
          'https://portalunico.siscomex.gov.br/cadatributos/api/atributo-ncm/download/json',
        ],
        [
          'Alíquotas brasileiras diferentes da TEC',
          'CAMEX/MDIC',
          '25 de setembro de 2026',
          'https://www.gov.br/mdic/pt-br/assuntos/camex/se-camex/strat/tarifas/vigentes',
        ],
        [
          'Concessões Tarifárias OMC (Listas GATT/OMC)',
          'CAMEX/MDIC',
          '25 de setembro de 2026',
          'https://www.gov.br/mdic/pt-br/assuntos/camex/se-camex/strat/tarifas/vigentes',
        ],
        [
          'Cotas CAMEX vigentes',
          'SECEX/MDIC',
          '16 de setembro de 2026',
          'https://www.gov.br/mdic/pt-br/assuntos/camex/se-camex/strat/tarifas/vigentes',
        ],
        [
          'DCC — Elevações Tarifárias por Desequilíbrios',
          'CAMEX/MDIC',
          '25 de setembro de 2026',
          'https://www.gov.br/mdic/pt-br/assuntos/camex/se-camex/strat/tarifas/vigentes',
        ],
        [
          'Ex-Tarifários vigentes + histórico',
          'MDIC/SECEX',
          '15 de setembro de 2026',
          'https://www.gov.br/mdic/pt-br/assuntos/sdic/ex-tarifario',
        ],
        [
          'LEBITBK — Lista de Exceções BIT/BK',
          'CAMEX/MDIC',
          '25 de setembro de 2026',
          'https://www.gov.br/mdic/pt-br/assuntos/camex/se-camex/strat/tarifas/vigentes',
        ],
        [
          'LETEC — Lista de Exceções à TEC',
          'CAMEX/MDIC',
          '25 de setembro de 2026',
          'https://www.gov.br/mdic/pt-br/assuntos/camex/se-camex/strat/tarifas/vigentes',
        ],
        [
          'LESSIN — Lista de Bens e Mercadorias Sem Similar Nacional',
          'CAMEX/MDIC',
          '16 de setembro de 2026',
          'https://www.gov.br/mdic/pt-br/assuntos/camex/se-camex/strat/lista-de-bens-sem-similar-nacional-lessin',
        ],
        [
          'Medidas de defesa comercial em vigor (antidumping) por NCM',
          'MDIC/SDCOM',
          '28 de setembro de 2026',
          'https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior/defesa-comercial-e-interesse-publico/medidas-em-vigor/medidas-e',
        ],
        [
          'Nomenclatura Comum do Mercosul (NCM) — estrutura e vigência',
          'Receita Federal / Portal Único Siscomex (CLASSIF)',
          '30 de setembro de 2026',
          'https://portalunico.siscomex.gov.br/classif/api/publico/nomenclatura/download/json',
        ],
        [
          'Reduções por Desabastecimento',
          'CAMEX/MDIC',
          '25 de setembro de 2026',
          'https://www.gov.br/mdic/pt-br/assuntos/camex/se-camex/strat/tarifas/vigentes',
        ],
        [
          'Regime Automotivo ACE-14 (Acordo Brasil-Argentina)',
          'CAMEX/MDIC',
          '25 de setembro de 2026',
          'https://www.gov.br/mdic/pt-br/assuntos/camex/se-camex/strat/tarifas/vigentes',
        ],
        [
          'Relação das Apurações de Produção Nacional',
          'SECEX/MDIC',
          '30 de setembro de 2026',
          'https://www.gov.br/siscomex/pt-br/informacoes/importacao',
        ],
        [
          'TEC — Tarifa Externa Comum (Mercosul)',
          'CAMEX/MDIC',
          '25 de setembro de 2026',
          'https://www.gov.br/mdic/pt-br/assuntos/camex/se-camex/strat/tarifas/vigentes',
        ],
        [
          'Taxa de utilização do Siscomex',
          'Receita Federal / Portal Siscomex',
          '21 de setembro de 2026',
          'https://www.gov.br/siscomex/pt-br/informacoes/cobrancas-incidentes-em-comercio-exterior/custos-relativos-as-operacoes-de-comercio-exterior',
        ],
        [
          'Informações prestadas na Declaração de Importação de Remessa (Anexo V da IN RFB 1.737)',
          'Receita Federal do Brasil',
          '29 de junho de 2023',
          'https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior',
        ],
      ],
    },
    {
      nome: 'Empresas / trabalho / estatísticas',
      desc: 'CNAE, CBO, natureza jurídica, eSocial, RAT/grau de risco, microdados',
      bases: [
        [
          'CBO 2002 — Classificação Brasileira de Ocupações',
          'Ministério do Trabalho e Emprego',
          '30 de julho de 2026',
          'https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/cbo/servicos/downloads',
        ],
        [
          'Censo da Educação Superior — microdados de cursos',
          'Instituto Nacional de Estudos e Pesquisas Educacionais Anísio Teixeira — INEP',
          '31 de dezembro de 2024',
          'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-da-educacao-superior',
        ],
        [
          'CNAE 2.3 — Classificação Nacional de Atividades Econômicas',
          'IBGE/Concla',
          '21 de setembro de 2026',
          'https://concla.ibge.gov.br/busca-online-cnae.html',
        ],
        [
          'PNAD Contínua trimestral — microdados',
          'Instituto Brasileiro de Geografia e Estatística — IBGE',
          '01 de janeiro de 2026',
          'https://ftp.ibge.gov.br/Trabalho_e_Rendimento/Pesquisa_Nacional_por_Amostra_de_Domicilios_continua/Trimestral/Microdados/',
        ],
        [
          'RAT por CNAE (Anexo V do Dec. 3.048/1999) e Grau de Risco (NR-04, Anexo I)',
          'Ministério da Previdência Social / Ministério do Trabalho e Emprego',
          '17 de julho de 2026',
          'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/decreto/d6957.htm',
        ],
        [
          'Tabela de Natureza Jurídica 2021 — Notas Explicativas',
          'Concla / IBGE',
          '11 de julho de 2026',
          'https://concla.ibge.gov.br/estrutura/natjur-estrutura/natureza-juridica-2021',
        ],
        [
          'Tabelas do eSocial (classificações do leiaute)',
          'eSocial — Receita Federal, INSS, MTE e Caixa',
          '09 de abril de 2026',
          'https://www.gov.br/esocial/pt-br/tabelas-do-esocial',
        ],
        [
          'CAT — Comunicação de Acidente de Trabalho (microdados)',
          'Instituto Nacional do Seguro Social — INSS',
          '01 de abril de 2026',
          'https://dadosabertos.inss.gov.br/dataset/comunicacao-de-acidente-de-trabalho-cat',
        ],
        [
          'Novo CAGED — microdados de movimentação',
          'Ministério do Trabalho e Emprego — PDET',
          '01 de agosto de 2026',
          'https://ftp.mtps.gov.br/pdet/microdados/NOVO%20CAGED/',
        ],
        [
          'RAIS — Relação Anual de Informações Sociais (vínculos)',
          'Ministério do Trabalho e Emprego — PDET',
          '31 de dezembro de 2024',
          'https://ftp.mtps.gov.br/pdet/microdados/RAIS/',
        ],
      ],
    },
  ]

  return (
    <section id="fontes-primarias" className="scroll-mt-24">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Seção 12</p>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
            Índice das fontes oficiais primárias — 110 bases indexadas
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Levantamento em 01/10/2026 a partir da página "Fontes oficiais e datas de atualização"
            do Buscador NCM (
            <a
              href="https://buscadorncm.com.br/fontes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 hover:underline"
            >
              buscadorncm.com.br/fontes
            </a>
            ), que consolida e datifica as fontes primárias. Cada linha aponta para o endereço
            oficial do órgão — Receita Federal, CONFAZ, ENCAT/Portal NF-e, Planalto, IBGE, MDIC,
            CGIBS, CGNFSe, ministérios.
          </p>
        </div>

        <div className="rounded-lg border-l-4 border-blue-600 bg-blue-50 p-4 text-sm text-blue-900">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" />
            <p>
              <strong>Política de atualização (a mesma do Panorama):</strong> a conferência semanal
              de segunda-feira (11h) verifica nesta página as bases marcadas "Dado oficial de…"
              (quando o órgão publica, o agregador atualiza) e reconfirma as "Conferido em…".
              Mudanças detectadas entram no Panorama com QA e publish, e resumos podem ir nos envios
              do painel{' '}
              <a href="/envios.html" className="underline font-semibold">
                Cadastro &amp; Envios
              </a>
              . A base legal citável continua sendo sempre o documento oficial do órgão (
              <a href="#fontes" className="underline font-semibold">
                seção 9
              </a>
              ) — este índice é o mapa de onde cada tabela mora.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 text-white text-left text-xs uppercase tracking-wide">
                <th className="px-3 py-2 font-semibold">Base de dados</th>
                <th className="px-3 py-2 font-semibold">Órgão / fonte primária</th>
                <th className="px-3 py-2 font-semibold">Situação (01/10/2026)</th>
                <th className="px-3 py-2 font-semibold">Link</th>
              </tr>
            </thead>
            <tbody>
              {grupos.map((g) => (
                <>
                  <tr key={g.nome} className="bg-blue-100">
                    <td colSpan={4} className="px-3 py-2 font-bold text-blue-900">
                      {g.nome}{' '}
                      <span className="font-normal text-xs text-blue-700">
                        — {g.desc} ({g.bases.length} bases)
                      </span>
                    </td>
                  </tr>
                  {g.bases.map(([nome, orgao, data, url], i) => (
                    <tr key={g.nome + '-' + i} className="odd:bg-white even:bg-slate-50">
                      <td className="px-3 py-2 align-top">{nome}</td>
                      <td className="px-3 py-2 align-top">{orgao}</td>
                      <td className="px-3 py-2 align-top text-xs">{data}</td>
                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-700 hover:underline font-semibold"
                          >
                            fonte oficial <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
            <p>
              <strong>Como ler as datas:</strong> "Dado oficial de…" = última publicação do próprio
              órgão (versão em vigor); "Conferido em…" = última re-conferência do agregador na
              fonte. As 110 bases cobrem os grupos acima; a lista completa, com ato normativo de
              cada base, está na página de fontes do agregador.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
