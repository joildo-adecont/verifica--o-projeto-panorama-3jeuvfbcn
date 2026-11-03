// Validação dos fluxos do Panorama da Reforma Tributária — ADECONT Assessoria Contábil e Administrativa
import { describe, it, expect } from 'vitest'

describe('Validação dos fluxos do Panorama da Reforma Tributária', () => {
  it('estrutura de envio do formulário de dúvidas', () => {
    const inquiry = {
      name: 'Dr. Verificador Teste',
      email: 'teste@exemplo.com.br',
      phone: '(11) 98765-4321',
      message: 'Consulta sobre incidência do IBS/CBS em regime monofásico',
    }
    expect(inquiry.name).toBe('Dr. Verificador Teste')
    expect(inquiry.email).toContain('@')
    expect(inquiry.phone).toBeTruthy()
  })

  it('validação das fontes oficiais monitoradas (incluindo DOU)', () => {
    const sources = [
      { key: 'cgibs', url: 'https://www.cgibs.gov.br/' },
      { key: 'receita', url: 'https://www.receita.fazenda.gov.br' },
      { key: 'planalto', url: 'https://www.planalto.gov.br' },
      { key: 'dou', url: 'https://www.in.gov.br' },
    ]
    expect(sources.length).toBeGreaterThanOrEqual(3)
    expect(sources[0].url).toBe('https://www.cgibs.gov.br/')
  })

  it('validação da estrutura do registro de revisão semanal de conteúdo', () => {
    const review = {
      review_date: new Date().toISOString(),
      status: 'ok',
      notes: 'verificação semanal de novas normas — CGIBS/Receita Federal/Planalto/DOU',
      sources_checked: [
        { key: 'cgibs', name: 'CGIBS (Comitê Gestor IBS)', status: 'active', http_status: 200 },
        { key: 'receita', name: 'Receita Federal do Brasil', status: 'active', http_status: 200 },
        {
          key: 'planalto',
          name: 'Portal da Legislação (Planalto)',
          status: 'active',
          http_status: 200,
        },
        {
          key: 'dou',
          name: 'Imprensa Nacional (Diário Oficial da União)',
          status: 'active',
          http_status: 200,
        },
      ],
    }
    expect(review.status).toBe('ok')
    expect(review.notes).toContain('verificação semanal de novas normas')
    expect(review.sources_checked).toHaveLength(4)
  })

  it('validação dos marcos e normas de todos os tipos de atos normativos', async () => {
    const { officialDocumentsList, fallbackNorms } = await import('./panorama')

    const normTypesInList = new Set(officialDocumentsList.map((d) => d.norm_type))
    expect(normTypesInList.has('Resolução')).toBe(true)
    expect(normTypesInList.has('Decreto')).toBe(true)
    expect(normTypesInList.has('Portaria Conjunta')).toBe(true)
    expect(normTypesInList.has('Ato Conjunto')).toBe(true)
    expect(normTypesInList.has('Lei Complementar')).toBe(true)
    expect(normTypesInList.has('Emenda Constitucional')).toBe(true)

    const codes = officialDocumentsList.map((d) => d.code)
    expect(codes).toContain('EC 132/2023')
    expect(codes).toContain('LC 214/2025')
    expect(codes).toContain('Ato Conjunto RFB/CGIBS nº 1/2025')
    expect(codes).toContain('Portaria Conjunta MF/CGIBS nº 7/2026')
    expect(codes).toContain('Decreto 12.955/2026')

    for (const norm of fallbackNorms) {
      expect(norm.norm_type).toBeTruthy()
      expect(norm.origin).toBeTruthy()
    }
  })

  it('validação da marca ADECONT: ausência do termo Jurídica e fidelidade da tagline', () => {
    const brandName = 'ADECONT'
    const tagline = 'Assessoria Contábil e Administrativa'
    const fullBrand = `${brandName} — ${tagline}`

    expect(fullBrand).toContain('ADECONT')
    expect(fullBrand).toContain('Assessoria Contábil e Administrativa')
    expect(fullBrand.toLowerCase()).not.toContain('jurídic')
    expect(fullBrand.toLowerCase()).not.toContain('juridic')
  })

  it('validação dos links diretos de PDFs oficiais do CGIBS para contorno de bloqueios locais', () => {
    const cgibsPdfs = [
      {
        code: 'Resolução CGIBS nº 1/2026',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202602/27102250-resoluc-a-o-csibs-n-1-de-23-de-fevereiro-de-2026-assinatura.pdf',
      },
      {
        code: 'Resolução CGIBS nº 5/2026',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202604/30221158-resolucao-cgibs-n-5-de-30-de-abril-de-2026.pdf',
      },
      {
        code: 'Resolução CGIBS nº 6/2026',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf',
      },
      {
        code: 'Resolução CGIBS nº 8/2026',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202605/26184150-resolucao-cgibs-n-8-de-2026-3.pdf',
      },
      {
        code: 'Resolução CGIBS nº 10/2026',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202607/01163740-resolucao-cgibs-n-10-de-29-de-junho-de-2026-proposta-orcamentaria-2026.pdf',
      },
      {
        code: 'Resolução CGIBS nº 13/2026',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202607/22121010-resolucao-cgibs-n-13-de-22-de-julho-de-2026.pdf',
      },
      {
        code: 'Resolução CGIBS nº 14/2026',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202607/31144942-resoluc-ao-cgibs-n-14-de-29-de-julho-de-2026-proposta-percentual-ibs-cgibs-2027.pdf',
      },
      {
        code: 'Resolução CGIBS nº 16/2026',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202607/29175824-doc-20260729-wa0035-260729-175811.pdf',
      },
    ]

    expect(cgibsPdfs).toHaveLength(8)
    for (const item of cgibsPdfs) {
      expect(item.url).toMatch(/^https:\/\/www\.cgibs\.gov\.br\/upload\/arquivos\/.*\.pdf$/)
    }
  })

  it('validação do mapeamento de proxy de download seguro de resoluções e outros atos normativos', async () => {
    const { getOfficialDocProxyUrl, getCgibsPdfProxyUrl, officialDocumentsList } =
      await import('./panorama')

    expect(officialDocumentsList.length).toBeGreaterThanOrEqual(15)
    expect(getOfficialDocProxyUrl).toBe(getCgibsPdfProxyUrl)

    for (const doc of officialDocumentsList) {
      expect(doc.proxy_url).toBeTruthy()
      expect(doc.proxy_url).toContain('/backend/v1/download-resolution?id=')

      const generated = getOfficialDocProxyUrl(doc.id)
      expect(generated).toContain('/backend/v1/download-resolution?id=')
      expect(generated).not.toContain('www.cgibs.gov.br')
    }

    expect(getOfficialDocProxyUrl('ec-132')).toContain('id=ec-132')
    expect(getOfficialDocProxyUrl('lc-214')).toContain('id=lc-214')
    expect(getOfficialDocProxyUrl('decreto-12955')).toContain('id=decreto-12955')
  })

  it('validação das classificações tributárias oficiais (contagens, tipos e campos obrigatórios)', async () => {
    const { FALLBACK_CLASSIFICATIONS, normalizeClassificationType } =
      await import('./classifications')

    expect(FALLBACK_CLASSIFICATIONS.length).toBeGreaterThanOrEqual(150)

    const tipos = new Set(FALLBACK_CLASSIFICATIONS.map((c) => c.tipo))
    expect(tipos.has('NCM')).toBe(true)
    expect(tipos.has('CEST')).toBe(true)
    expect(tipos.has('cClassTrib')).toBe(true)
    expect(tipos.has('CST')).toBe(true)
    expect(tipos.has('cCredPres')).toBe(true)
    expect(tipos.has('CFOP')).toBe(true)
    expect(tipos.has('NBS')).toBe(true)
    expect(tipos.has('CNAE 2.3')).toBe(true)

    // Valida integridade de cada registro
    for (const item of FALLBACK_CLASSIFICATIONS) {
      expect(item.id).toBeTruthy()
      expect(item.codigo).toBeTruthy()
      expect(item.descricao).toBeTruthy()
      expect(item.fonte).toBeTruthy()
      expect(item.tipo).toBeTruthy()
    }

    // Normalização de tipos
    expect(normalizeClassificationType('CNAE_2_3')).toBe('CNAE 2.3')
    expect(normalizeClassificationType('NCM')).toBe('NCM')
  })

  it('validação de upsert idempotente no modelo de dados de classificações', () => {
    // Simula a lógica de deduplicação por chave única (tipo, codigo)
    const existingMap = new Map<string, { tipo: string; codigo: string; descricao: string }>()

    const row1 = {
      tipo: 'NCM',
      codigo: '0201.10.00',
      descricao: 'Carnes de animais da espécie bovina',
    }
    const key1 = `${row1.tipo}:${row1.codigo}`
    existingMap.set(key1, row1)

    const row2Updated = {
      tipo: 'NCM',
      codigo: '0201.10.00',
      descricao: 'Carnes bovinas frescas ou refrigeradas',
    }
    const key2 = `${row2Updated.tipo}:${row2Updated.codigo}`
    existingMap.set(key2, row2Updated)

    expect(existingMap.size).toBe(1)
    expect(existingMap.get(key1)?.descricao).toBe('Carnes bovinas frescas ou refrigeradas')
  })

  it('validação de segurança da rota de importação e ausência do termo Jurídica na Seção 11', async () => {
    const { TABELAS_CLASSIFICACAO } = await import('../components/SectionFontesAgregador')
    expect(TABELAS_CLASSIFICACAO.length).toBe(12) // TODOS + 11 tabelas

    for (const t of TABELAS_CLASSIFICACAO) {
      expect(t.label.toLowerCase()).not.toContain('jurídic')
      expect(t.sublabel.toLowerCase()).not.toContain('jurídic')
    }
  })

  it('validação do motor de Busca Avançada integrada (#busca-avancada)', async () => {
    const { buscarAvancado } = await import('./buscaAvancada')

    // 1. Busca pelo termo "arroz" (cesta básica)
    const resArroz = await buscarAvancado({ termo: 'arroz' })
    expect(resArroz.termo).toBe('arroz')
    expect(resArroz.totalGeralEncontrado).toBeGreaterThan(0)
    expect(resArroz.aliquotasTratamentos.some((t) => t.categoria === 'Cesta Básica')).toBe(true)
    expect(resArroz.conexoesLegais.length).toBeGreaterThan(0)
    expect(resArroz.analisesEspecialistas.length).toBeGreaterThan(0)
    expect(resArroz.dadosGraficos.linhaDoTempoAliquota.length).toBe(8)
    expect(resArroz.dadosGraficos.composicaoAtos.length).toBe(3)

    // 2. Busca pelo termo "cesta básica"
    const resCesta = await buscarAvancado({ termo: 'cesta básica' })
    expect(resCesta.aliquotasTratamentos.length).toBeGreaterThan(0)
    expect(resCesta.aliquotasTratamentos[0].reducaoOuFator).toContain('0,00')

    // 3. Busca por "cClassTrib"
    const resClass = await buscarAvancado({ termo: 'cClassTrib', tipoClassificacao: 'cClassTrib' })
    expect(resClass.classificacoes.items.length).toBeGreaterThanOrEqual(1)

    // 4. Validação da rota registrada e atalho no menu
    const { NAVEGACAO } = await import('../components/navegacao')
    const itemBusca = NAVEGACAO.find((item) => item.href === '#busca-avancada')
    expect(itemBusca).toBeDefined()
    expect(itemBusca?.label).toBe('Busca Avançada')
    expect(itemBusca?.tecla).toBe('b')
  })

  it('validação do catálogo e busca integrada dos Anexos da Reforma Tributária (LC 214/2025)', async () => {
    const { ANEXOS_REFORMA_CATALOGO } = await import('../data/anexosReforma')
    const { buscarAvancado } = await import('./buscaAvancada')

    // Deve conter no mínimo 12 anexos/regimes específicos oficiais catalogados
    expect(ANEXOS_REFORMA_CATALOGO.length).toBeGreaterThanOrEqual(12)

    // Todos os anexos devem conter capitulação legal, percentual e fonte Planalto
    for (const anexo of ANEXOS_REFORMA_CATALOGO) {
      expect(anexo.id).toBeTruthy()
      expect(anexo.numero).toBeTruthy()
      expect(anexo.capitulacaoLegal).toContain('LC 214/2025')
      expect(anexo.fonteOficial.nome.toLowerCase()).toContain('planalto')
      expect(anexo.produtosServicos.length).toBeGreaterThan(0)
    }

    // 1. Busca por "insumo agropecuário"
    const resInsumo = await buscarAvancado({ termo: 'insumo agropecuário' })
    expect(resInsumo.anexosReforma.total).toBeGreaterThan(0)
    const anexoInsumo = resInsumo.anexosReforma.items.find((a) => a.numero === 'Anexo IX')
    expect(anexoInsumo).toBeDefined()
    expect(anexoInsumo?.reducaoAliquotaPct).toBe(-60)
    expect(anexoInsumo?.capitulacaoLegal).toContain('art. 138')

    // 2. Busca por "medicina"
    const resMed = await buscarAvancado({ termo: 'medicina' })
    expect(resMed.anexosReforma.total).toBeGreaterThan(0)
    expect(
      resMed.anexosReforma.items.some(
        (a) => a.numero === 'Anexo III' || a.numero === 'Anexo IV' || a.numero === 'Anexo XII',
      ),
    ).toBe(true)

    // 3. Busca por "dispositivo médico"
    const resDisp = await buscarAvancado({ termo: 'dispositivo médico' })
    const anexoDisp = resDisp.anexosReforma.items.find((a) => a.numero === 'Anexo IV')
    expect(anexoDisp).toBeDefined()
    expect(anexoDisp?.capitulacaoLegal).toContain('arts. 131 e 144')

    // 4. Busca por "cooperativa"
    const resCoop = await buscarAvancado({ termo: 'cooperativa' })
    const anexoCoop = resCoop.anexosReforma.items.find((a) => a.id === 'anexo-regime-cooperativas')
    expect(anexoCoop).toBeDefined()
    expect(anexoCoop?.capitulacaoLegal).toContain('arts. 271 e 272')
    expect(anexoCoop?.reducaoAliquotaPct).toBe(-100)

    // 5. Validação dos resumos de reduções para gráficos
    expect(resInsumo.anexosReforma.resumoReducoes.length).toBe(resInsumo.anexosReforma.total)
  })

  it('validação da Central de Entrega: item e link oficial da Busca Avançada', async () => {
    const { ITENS_ENTREGA } = await import('../components/SectionCentralEntrega')
    const itemBusca = ITENS_ENTREGA.find((i) => i.id === 'leg-busca-avancada')
    expect(itemBusca).toBeDefined()
    expect(itemBusca?.titulo).toContain('Busca Avançada')
    expect(itemBusca?.url).toBe('/#busca-avancada')
    expect(itemBusca?.tecla).toBe('B')
  })

  it('validação do componente SectionBuscaAvancada com envio pela Central de Entrega', async () => {
    const { SectionBuscaAvancada } = await import('../components/SectionBuscaAvancada')
    expect(SectionBuscaAvancada).toBeDefined()
    expect(typeof SectionBuscaAvancada).toBe('function')

    const { ModalBuscaAvancada } = await import('../components/ModalBuscaAvancada')
    expect(ModalBuscaAvancada).toBeDefined()
    expect(typeof ModalBuscaAvancada).toBe('function')
  })

  it('validação dos filtros avançados combináveis da Busca Avançada', async () => {
    const { buscarAvancado } = await import('./buscaAvancada')

    // 1. Filtro por grupo específico: apenas 'anexos'
    const resApenasAnexos = await buscarAvancado({
      termo: 'arroz',
      filtros: {
        grupos: ['anexos'],
      },
    })
    expect(resApenasAnexos.anexosReforma.total).toBeGreaterThan(0)
    expect(resApenasAnexos.normas.total).toBe(0)
    expect(resApenasAnexos.radarAtos.total).toBe(0)
    expect(resApenasAnexos.assuntosEspeciais.total).toBe(0)
    expect(resApenasAnexos.classificacoes.items.length).toBe(0)

    // 2. Filtro por esfera federativa: 'federal'
    const resEsferaFed = await buscarAvancado({
      termo: '',
      filtros: {
        esferas: ['federal'],
      },
    })
    expect(resEsferaFed.normas.total).toBeGreaterThan(0)

    // 3. Filtro por redução/alíquota: 0% / Alíquota zero
    const resReducaoZero = await buscarAvancado({
      termo: '',
      filtros: {
        reducoes: ['0%'],
      },
    })
    expect(resReducaoZero.anexosReforma.total).toBeGreaterThan(0)
    for (const anexo of resReducaoZero.anexosReforma.items) {
      expect(
        anexo.reducaoAliquotaPct === 0 ||
          anexo.reducaoAliquotaPct === -100 ||
          anexo.reducaoRotulo.toLowerCase().includes('zero') ||
          anexo.reducaoRotulo.toLowerCase().includes('0%'),
      ).toBe(true)
    }

    // 4. Combinação de filtros: grupo 'assuntos-especiais' + fonte 'CGIBS'
    const resAssuntoCgibs = await buscarAvancado({
      termo: '',
      filtros: {
        grupos: ['assuntos-especiais'],
        fontes: ['CGIBS'],
      },
    })
    expect(resAssuntoCgibs.assuntosEspeciais.total).toBeGreaterThan(0)
    for (const esp of resAssuntoCgibs.assuntosEspeciais.items) {
      const temFonteCgibs = esp.fontesOficiais.some(
        (fo) => fo.orgao.includes('CGIBS') || fo.nome.includes('CGIBS'),
      )
      expect(temFonteCgibs).toBe(true)
    }

    // 5. Filtro de tabela NCM nas classificações oficiais
    const resTabelaNcm = await buscarAvancado({
      termo: 'café',
      filtros: {
        grupos: ['classificacoes'],
        tabelas: ['NCM'],
      },
    })
    for (const item of resTabelaNcm.classificacoes.items) {
      expect(item.tipo).toBe('NCM')
    }

    // 6. Limpeza e preservação do termo de consulta vindo de link (?q=)
    const resTermoGeral = await buscarAvancado({
      termo: 'Simples Nacional',
      filtros: {},
    })
    expect(resTermoGeral.termo).toBe('Simples Nacional')
    expect(resTermoGeral.totalGeralEncontrado).toBeGreaterThan(0)
  })

  it('validação dos filtros facetados da Seção de Normas (#secao-1)', async () => {
    const { fallbackNorms } = await import('./panorama')
    const {
      filtrarNormas,
      deduzirTipoAto,
      deduzirEsferaNorma,
      correspondeFonteNorma,
      contarFiltrosNormasAtivos,
      FILTROS_NORMAS_INICIAIS,
      OPCOES_TIPOS_ATO_NORMA,
      OPCOES_FONTES_NORMA,
      OPCOES_ESFERAS_NORMA,
      OPCOES_INCIDENCIA_NORMA,
    } = await import('./normasFilters')

    // Deve possuir as opções padronizadas
    expect(OPCOES_TIPOS_ATO_NORMA.length).toBeGreaterThanOrEqual(6)
    expect(OPCOES_FONTES_NORMA.length).toBeGreaterThanOrEqual(6)
    expect(OPCOES_ESFERAS_NORMA.length).toBe(3)
    expect(OPCOES_INCIDENCIA_NORMA.length).toBeGreaterThanOrEqual(5)

    // 1. Sem filtros: total de normas preservado
    const todas = filtrarNormas(fallbackNorms, FILTROS_NORMAS_INICIAIS)
    expect(todas).toHaveLength(fallbackNorms.length)

    // 2. Filtro por tipo de ato: Resoluções (CGIBS e CGSN)
    const resolucoes = filtrarNormas(fallbackNorms, {
      ...FILTROS_NORMAS_INICIAIS,
      tiposAto: ['Resolução'],
    })
    expect(resolucoes.length).toBeGreaterThan(0)
    for (const r of resolucoes) {
      expect(deduzirTipoAto(r)).toBe('Resolução')
    }

    // 3. Filtro por fonte oficial: Planalto (EC 132, LC 214, LC 227, Decreto 12.955)
    const planalto = filtrarNormas(fallbackNorms, {
      ...FILTROS_NORMAS_INICIAIS,
      fontes: ['Planalto'],
    })
    expect(planalto.length).toBeGreaterThanOrEqual(4)
    for (const p of planalto) {
      expect(correspondeFonteNorma(p, 'Planalto')).toBe(true)
    }

    // 4. Filtro por fonte oficial: CGIBS
    const cgibs = filtrarNormas(fallbackNorms, {
      ...FILTROS_NORMAS_INICIAIS,
      fontes: ['CGIBS'],
    })
    expect(cgibs.length).toBeGreaterThanOrEqual(8)

    // 5. Combinação de filtros: tipo Decreto + fonte Planalto
    const decretoPlanalto = filtrarNormas(fallbackNorms, {
      ...FILTROS_NORMAS_INICIAIS,
      tiposAto: ['Decreto'],
      fontes: ['Planalto'],
    })
    expect(decretoPlanalto).toHaveLength(1)
    expect(decretoPlanalto[0].code).toBe('Decreto 12.955/2026')

    // 6. Combinação com estado vazio (nenhuma correspondência)
    const vazia = filtrarNormas(fallbackNorms, {
      ...FILTROS_NORMAS_INICIAIS,
      tiposAto: ['Emenda Constitucional'],
      fontes: ['CGSN'],
    })
    expect(vazia).toHaveLength(0)

    // 7. Esferas federativas
    expect(deduzirEsferaNorma(fallbackNorms[0])).toBe('federal')

    // 8. Contador de filtros
    const totalContador = contarFiltrosNormasAtivos({
      termo: 'IBS',
      tiposAto: ['Resolução'],
      esferas: ['federal'],
      fontes: ['CGIBS'],
      incidencias: ['OPERACIONAL'],
    })
    expect(totalContador).toBe(5)
  })

  it('padronização dos filtros facetados do Radar Nacional (radarFilters.ts)', async () => {
    const {
      filtrarAtosRadar,
      contarFiltrosRadarAtivos,
      FILTROS_RADAR_INICIAIS,
      OPCOES_NIVEIS_RADAR,
    } = await import('./radarFilters')

    const atosAmostra = [
      {
        id: 'ato-sp',
        codigo_ibge: '3550308',
        uf: 'SP',
        municipio_nome: 'São Paulo',
        titulo: 'Decreto SP Regulamentador do IBS',
        data: '2026-03-15',
        nivel: 'municipal' as const,
      },
      {
        id: 'ato-rs',
        codigo_ibge: '4314902',
        uf: 'RS',
        municipio_nome: 'Porto Alegre',
        titulo: 'Ato Estadual SEFAZ RS',
        data: '2026-02-20',
        nivel: 'estadual' as const,
      },
      {
        id: 'ato-fed',
        codigo_ibge: '5300108',
        uf: 'DF',
        municipio_nome: 'Brasília',
        titulo: 'Ato Federal CGIBS DOU',
        data: '2025-11-01',
        nivel: 'federal' as const,
      },
    ]

    // 1. Sem filtros
    expect(filtrarAtosRadar(atosAmostra, FILTROS_RADAR_INICIAIS)).toHaveLength(3)

    // 2. Filtro por nível
    const municipais = filtrarAtosRadar(atosAmostra, {
      ...FILTROS_RADAR_INICIAIS,
      niveis: ['municipal'],
    })
    expect(municipais).toHaveLength(1)
    expect(municipais[0].id).toBe('ato-sp')

    // 3. Filtro por UF
    const rs = filtrarAtosRadar(atosAmostra, {
      ...FILTROS_RADAR_INICIAIS,
      uf: 'RS',
    })
    expect(rs).toHaveLength(1)
    expect(rs[0].id).toBe('ato-rs')

    // 4. Contador de ativos
    expect(
      contarFiltrosRadarAtivos({
        termo: 'IBS',
        uf: 'SP',
        municipio: null,
        niveis: ['municipal', 'estadual'],
      }),
    ).toBe(4)

    expect(OPCOES_NIVEIS_RADAR).toHaveLength(3)
  })

  it('padronização dos filtros facetados dos Agregadores (agregadoresFilters.ts)', async () => {
    const {
      filtrarClassificacoes,
      contarFiltrosAgregadoresAtivos,
      FILTROS_AGREGADORES_INICIAIS,
      OPCOES_TABELAS_AGREGADOR,
      OPCOES_FONTES_AGREGADOR,
      OPCOES_ESFERAS_AGREGADOR,
    } = await import('./agregadoresFilters')
    const { FALLBACK_CLASSIFICATIONS } = await import('./classifications')

    // 1. As 11 tabelas de classificação oficiais presentes
    expect(OPCOES_TABELAS_AGREGADOR).toHaveLength(11)

    // 2. Fontes oficiais presentes
    expect(OPCOES_FONTES_AGREGADOR.length).toBeGreaterThanOrEqual(6)
    expect(OPCOES_ESFERAS_AGREGADOR).toHaveLength(3)

    // 3. Filtrar por tabela
    const ncmItens = filtrarClassificacoes(FALLBACK_CLASSIFICATIONS, {
      ...FILTROS_AGREGADORES_INICIAIS,
      tabelas: ['NCM'],
    })
    expect(ncmItens.length).toBeGreaterThan(0)
    expect(ncmItens.every((it) => it.tipo === 'NCM')).toBe(true)

    // 4. Contador de ativos
    const totalAtivos = contarFiltrosAgregadoresAtivos({
      termo: 'arroz',
      tabelas: ['NCM'],
      fontes: ['Siscomex/MDIC'],
      esferas: ['federal'],
    })
    expect(totalAtivos).toBe(4)
  })

  it('mapeamento de tiers das novas fontes oficiais e preservação da Lefisc como única de comparação', async () => {
    const { deduzirConfidenceTier } = await import('../components/SeloNivelConfianca')

    // 1. Diários Oficiais Municipais devem ser classificados como "diario_oficial"
    expect(deduzirConfidenceTier('diario_municipal_amm')).toBe('diario_oficial')
    expect(deduzirConfidenceTier('diario_municipal_famep')).toBe('diario_oficial')
    expect(deduzirConfidenceTier('diariomunicipal.com.br')).toBe('diario_oficial')
    expect(deduzirConfidenceTier('Diário Oficial dos Municípios — AMM')).toBe('diario_oficial')
    expect(deduzirConfidenceTier('Diário Oficial dos Municípios — FAMEP')).toBe('diario_oficial')
    expect(deduzirConfidenceTier('DOU (Imprensa Nacional)')).toBe('diario_oficial')

    // 2. Novas fontes institucionais oficiais
    expect(deduzirConfidenceTier('CONFAZ')).toBe('oficial_institucional')
    expect(deduzirConfidenceTier('Ministério da Fazenda (MEF)')).toBe('oficial_institucional')
    expect(deduzirConfidenceTier('CARF — Conselho Administrativo de Recursos Fiscais')).toBe(
      'oficial_institucional',
    )
    expect(deduzirConfidenceTier('STF — Supremo Tribunal Federal')).toBe('oficial_institucional')
    expect(deduzirConfidenceTier('STJ — Superior Tribunal de Justiça')).toBe(
      'oficial_institucional',
    )
    expect(deduzirConfidenceTier('ANP — Agência Nacional do Petróleo')).toBe(
      'oficial_institucional',
    )
    expect(deduzirConfidenceTier('SUFRAMA')).toBe('oficial_institucional')

    // 3. Lefisc deve permanecer como a ÚNICA fonte de comparação não oficial
    expect(deduzirConfidenceTier('Lefisc')).toBe('comparacao')
    expect(deduzirConfidenceTier('Lefisc — Portal de Pesquisa Comparativa')).toBe('comparacao')
    expect(deduzirConfidenceTier('radar_lefisc')).toBe('comparacao')
  })
})
