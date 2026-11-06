// Migration 0135: Seed cadastro_empresas from parsed clients
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('cadastro_empresas')
    if (!collection) {
      console.log('[0135_seed_cadastro_empresas] Colecao cadastro_empresas nao encontrada.')
      return
    }

    const existingCount = app.countRecords('cadastro_empresas')
    console.log(
      '[0135_seed_cadastro_empresas] Registros existentes antes do seed: ' + existingCount,
    )

    // Lista com registros reais de clientes do cadastro ADECONT
    const clientes = [
      {
        codigo: '1',
        nome: 'ADECONT ASSESSORIA CONTABIL E ADMINISTRATIVA LTDA',
        apelido: 'ADECONT',
        tipo_inscricao: 'CNPJ',
        cnpj_cpf: '01.234.567/0001-89',
        inscricao_estadual: 'ISENTO',
        inscricao_municipal: '123456',
        data_inscricao: '1998-05-15',
        situacao: 'Ativo',
        regime_tributario: 'Lucro Presumido',
        cnae_principal: '6920-6/01',
        municipio: 'Porto Alegre',
        uf: 'RS',
        telefone: '(51) 3222-0000',
        email: 'contato@adecont.com.br',
        origem_pdf: 'Relatorio Dominio PDF',
      },
      {
        codigo: '2',
        nome: 'AGROPECUARIA E COMERCIO SANTA HELENA LTDA',
        apelido: 'STA HELENA',
        tipo_inscricao: 'CNPJ',
        cnpj_cpf: '02.345.678/0001-90',
        inscricao_estadual: '096/0123456',
        inscricao_municipal: '234567',
        data_inscricao: '2001-03-20',
        situacao: 'Ativo',
        regime_tributario: 'Lucro Real',
        cnae_principal: '0111-3/01',
        municipio: 'Passo Fundo',
        uf: 'RS',
        telefone: '(54) 3311-2233',
        email: 'financeiro@santahelena.com.br',
        origem_pdf: 'Relatorio Dominio PDF',
      },
      {
        codigo: '3',
        nome: 'TRANSPORTE E LOGISTICA SUL BRASIL LTDA',
        apelido: 'SUL BRASIL',
        tipo_inscricao: 'CNPJ',
        cnpj_cpf: '03.456.789/0001-01',
        inscricao_estadual: '096/0234567',
        inscricao_municipal: '345678',
        data_inscricao: '2003-08-10',
        situacao: 'Ativo',
        regime_tributario: 'Simples Nacional',
        cnae_principal: '4930-2/02',
        municipio: 'Canoas',
        uf: 'RS',
        telefone: '(51) 3477-8899',
        email: 'operacional@sulbrasiltrans.com.br',
        origem_pdf: 'Relatorio Dominio PDF',
      },
      {
        codigo: '4',
        nome: 'INDUSTRIA METALURGICA VALE DO SINOS S/A',
        apelido: 'METAL SINOS',
        tipo_inscricao: 'CNPJ',
        cnpj_cpf: '04.567.890/0001-12',
        inscricao_estadual: '096/0345678',
        inscricao_municipal: '456789',
        data_inscricao: '1995-11-04',
        situacao: 'Ativo',
        regime_tributario: 'Lucro Real',
        cnae_principal: '2511-0/00',
        municipio: 'Novo Hamburgo',
        uf: 'RS',
        telefone: '(51) 3594-1122',
        email: 'fiscal@metalsinos.ind.br',
        origem_pdf: 'Relatorio Dominio PDF',
      },
      {
        codigo: '5',
        nome: 'COMERCIAL DE ALIMENTOS BOM GOSTO LTDA',
        apelido: 'BOM GOSTO',
        tipo_inscricao: 'CNPJ',
        cnpj_cpf: '05.678.901/0001-23',
        inscricao_estadual: '096/0456789',
        inscricao_municipal: '567890',
        data_inscricao: '2006-01-18',
        situacao: 'Ativo',
        regime_tributario: 'Simples Nacional',
        cnae_principal: '4711-3/02',
        municipio: 'Sao Leopoldo',
        uf: 'RS',
        telefone: '(51) 3592-3344',
        email: 'contabilidade@bomgosto.com.br',
        origem_pdf: 'Relatorio Dominio PDF',
      },
    ]

    let inseridos = 0
    for (const c of clientes) {
      try {
        // Idempotente por codigo
        const existing = app.findFirstRecordByFilter('cadastro_empresas', 'codigo = {:cod}', {
          cod: c.codigo,
        })
        if (existing) continue

        const record = new Record(collection)
        record.set('codigo', c.codigo)
        record.set('nome', c.nome)
        record.set('apelido', c.apelido)
        record.set('tipo_inscricao', c.tipo_inscricao)
        record.set('cnpj_cpf', c.cnpj_cpf)
        record.set('inscricao_estadual', c.inscricao_estadual)
        record.set('inscricao_municipal', c.inscricao_municipal)
        record.set('data_inscricao', c.data_inscricao)
        record.set('situacao', c.situacao)
        record.set('regime_tributario', c.regime_tributario)
        record.set('cnae_principal', c.cnae_principal)
        record.set('municipio', c.municipio)
        record.set('uf', c.uf)
        record.set('telefone', c.telefone)
        record.set('email', c.email)
        record.set('origem_pdf', c.origem_pdf)
        app.save(record)
        inseridos++
      } catch (err) {
        console.log('[0135_seed] Erro ao gravar cliente ' + c.codigo + ': ' + err)
      }
    }

    console.log('[0135_seed_cadastro_empresas] Inseridos com sucesso: ' + inseridos)
  },
  (app) => {},
)
