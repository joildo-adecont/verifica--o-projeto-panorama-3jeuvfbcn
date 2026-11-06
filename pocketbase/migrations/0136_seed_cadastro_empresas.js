// Migration 0136: Seed inicial idempotente da coleção cadastro_empresas
// Registros reais de clientes ADECONT carregados a partir do cadastro do sistema
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('cadastro_empresas')
    if (!collection) {
      console.log('[0136_seed_cadastro_empresas] Colecao cadastro_empresas nao encontrada.')
      return
    }

    const countAtual = app.countRecords('cadastro_empresas')
    console.log('[0136_seed_cadastro_empresas] Total de registros existentes: ' + countAtual)

    // Se já existirem registros cadastrados, a migration é estritamente idempotente
    if (countAtual > 0) {
      console.log('[0136_seed_cadastro_empresas] Colecao ja contem registros. Seed ignorado.')
      return
    }

    // Lista de clientes do cadastro ADECONT
    const clientesIniciais = [
      {
        codigo: 1,
        razao_social: 'ADECONT PROCESSAMENTO DE DADOS LTDA',
        apelido: 'ADECONT',
        numero_documento: '04.094.690/0001-46',
        documento_limpo: '04094690000146',
        tipo_documento: 'CNPJ',
        natureza_juridica: 'Sociedade Empresária Limitada',
        municipio: 'VACARIA',
        uf: 'RS',
        situacao: 'Ativo',
        data_inscricao: '1998-05-15',
        pagina: 1,
      },
      {
        codigo: 2,
        razao_social: 'AUTO MECANICA IRMAOS PASTORE LTDA-ME',
        apelido: 'PASTORE',
        numero_documento: '92.353.630/0001-68',
        documento_limpo: '92353630000168',
        tipo_documento: 'CNPJ',
        natureza_juridica: 'Sociedade Empresária Limitada',
        municipio: 'VACARIA',
        uf: 'RS',
        situacao: 'Ativo',
        data_inscricao: '2001-03-20',
        pagina: 2,
      },
      {
        codigo: 3,
        razao_social: 'ANDREIA MARTELLO & CIA LTDA - ME',
        apelido: 'XEROCAL',
        numero_documento: '01.855.727/0001-13',
        documento_limpo: '01855727000113',
        tipo_documento: 'CNPJ',
        natureza_juridica: 'Sociedade Empresária Limitada',
        municipio: 'VACARIA',
        uf: 'RS',
        situacao: 'Ativo',
        data_inscricao: '2003-08-10',
        pagina: 3,
      },
      {
        codigo: 5,
        razao_social: 'AUTO VIDROS FORTES LTDA. - ME',
        apelido: 'AUTO VIDROS',
        numero_documento: '93.373.876/0001-64',
        documento_limpo: '93373876000164',
        tipo_documento: 'CNPJ',
        natureza_juridica: 'Sociedade Empresária Limitada',
        municipio: 'VACARIA',
        uf: 'RS',
        situacao: 'Ativo',
        data_inscricao: '1995-11-04',
        pagina: 5,
      },
      {
        codigo: 7,
        razao_social: 'ANTONIO JOILDO DA SILVA',
        apelido: 'JOILDO',
        numero_documento: '192261133509',
        documento_limpo: '192261133509',
        tipo_documento: 'CEI',
        natureza_juridica: 'Contribuinte Individual',
        municipio: 'VACARIA',
        uf: 'RS',
        situacao: 'Ativo',
        data_inscricao: '2006-01-18',
        pagina: 7,
      },
      {
        codigo: 15,
        razao_social: 'ALAIR VILSON MATTE',
        apelido: 'ALAIR',
        numero_documento: '01.536.545/0001-80',
        documento_limpo: '01536545000180',
        tipo_documento: 'CNPJ',
        natureza_juridica: 'Empresário (Individual)',
        municipio: 'PINHAL DA SERRA',
        uf: 'RS',
        situacao: 'Ativo',
        data_inscricao: '2000-04-12',
        pagina: 15,
      },
      {
        codigo: 35,
        razao_social: 'ANTONIO CARLOS SILVA ALVES',
        apelido: 'ANTONIO CARLOS-RURAL',
        numero_documento: '190730000581',
        documento_limpo: '190730000581',
        tipo_documento: 'CEI',
        natureza_juridica: 'Contribuinte Individual',
        municipio: 'CRISTALANDIA',
        uf: 'TO',
        situacao: 'Ativo',
        data_inscricao: '2005-07-22',
        pagina: 35,
      },
      {
        codigo: 38,
        razao_social: 'ANATERCIA BUENO GUERREIRO',
        apelido: 'ANATERCIA RURAL',
        numero_documento: '465.422.050-04',
        documento_limpo: '46542205004',
        tipo_documento: 'CPF',
        natureza_juridica: 'Produtor Rural (Pessoa Física)',
        municipio: 'VACARIA',
        uf: 'RS',
        situacao: 'Ativo',
        data_inscricao: '2002-11-14',
        pagina: 38,
      },
      {
        codigo: 40,
        razao_social: 'AMBULATORIO SRC',
        apelido: 'AMBULATORIO SRC',
        numero_documento: '00.742.109/0001-02',
        documento_limpo: '00742109000102',
        tipo_documento: 'CNPJ',
        natureza_juridica: 'Sociedade Simples Pura',
        municipio: 'VACARIA',
        uf: 'RS',
        situacao: 'Ativo',
        data_inscricao: '1999-09-30',
        pagina: 40,
      },
      {
        codigo: 46,
        razao_social: 'ANTONIO OCTAVIO LIMA DA SILVA',
        apelido: 'ANTONIO OCTAVIO',
        numero_documento: '009.435.480/001-87',
        documento_limpo: '00943548000187',
        tipo_documento: 'CNPJ',
        natureza_juridica: 'Produtor Rural (Pessoa Física)',
        municipio: 'VACARIA',
        uf: 'RS',
        situacao: 'Ativo',
        data_inscricao: '2004-06-15',
        pagina: 46,
      },
      {
        codigo: 48,
        razao_social: 'ADALGISA LONGO',
        apelido: 'ADALGISA - RURAL',
        numero_documento: '047.444.139-35',
        documento_limpo: '04744413935',
        tipo_documento: 'CPF',
        natureza_juridica: 'Produtor Rural (Pessoa Física)',
        municipio: 'LAGES',
        uf: 'SC',
        situacao: 'Ativo',
        data_inscricao: '2003-02-10',
        pagina: 48,
      },
      {
        codigo: 65,
        razao_social: 'LIEGE MARIA MORAES RIGON',
        apelido: 'LIEGE',
        numero_documento: '000.710.020-03',
        documento_limpo: '00071002003',
        tipo_documento: 'CPF',
        natureza_juridica: 'Produtor Rural (Pessoa Física)',
        municipio: 'VACARIA',
        uf: 'RS',
        situacao: 'Ativo',
        data_inscricao: '2001-08-25',
        pagina: 65,
      },
      {
        codigo: 66,
        razao_social: 'GEOSERRA CONSULTORIA AGRICOLA E FUNDIÁRI',
        apelido: 'GEOSERRA',
        numero_documento: '02.247.962/0001-09',
        documento_limpo: '02247962000109',
        tipo_documento: 'CNPJ',
        natureza_juridica: 'Sociedade Empresária Limitada',
        municipio: 'VACARIA',
        uf: 'RS',
        situacao: 'Ativo',
        data_inscricao: '1997-12-01',
        pagina: 66,
      },
      {
        codigo: 69,
        razao_social: 'ALBINO PEDRO FROZI',
        apelido: 'ALBINO FROZI',
        numero_documento: '124.629.800-49',
        documento_limpo: '12462980049',
        tipo_documento: 'CPF',
        natureza_juridica: 'Produtor Rural (Pessoa Física)',
        municipio: 'VACARIA',
        uf: 'RS',
        situacao: 'Ativo',
        data_inscricao: '2005-04-18',
        pagina: 69,
      },
      {
        codigo: 73,
        razao_social: 'BREZOLIN FRUTAS LTDA.',
        apelido: 'BREZOLIN FRUTAS',
        numero_documento: '94.025.269/0001-14',
        documento_limpo: '94025269000114',
        tipo_documento: 'CNPJ',
        natureza_juridica: 'Sociedade Empresária Limitada',
        municipio: 'CAMPESTRE DA SERRA',
        uf: 'RS',
        situacao: 'Ativo',
        data_inscricao: '1994-03-10',
        pagina: 73,
      },
      {
        codigo: 78,
        razao_social: 'AFGM VIDROS E ACESSORIOS LTDA',
        apelido: 'AFGM VIDROS',
        numero_documento: '01.534.624/0001-38',
        documento_limpo: '01534624000138',
        tipo_documento: 'CNPJ',
        natureza_juridica: 'Sociedade Empresária Limitada',
        municipio: 'VACARIA',
        uf: 'RS',
        situacao: 'Ativo',
        data_inscricao: '1996-07-15',
        pagina: 78,
      },
      {
        codigo: 79,
        razao_social: 'ALS COMERCIO AGRICOLA LTDA',
        apelido: 'ALS COMERCIO',
        numero_documento: '03.220.301/0001-10',
        documento_limpo: '03220301000110',
        tipo_documento: 'CNPJ',
        natureza_juridica: 'Sociedade Empresária Limitada',
        municipio: 'VACARIA',
        uf: 'RS',
        situacao: 'Ativo',
        data_inscricao: '1999-10-05',
        pagina: 79,
      },
      {
        codigo: 83,
        razao_social: 'RJS PECAS E SERVICOS LTDA - ME',
        apelido: 'RJS PECAS',
        numero_documento: '02.946.069/0001-72',
        documento_limpo: '02946069000172',
        tipo_documento: 'CNPJ',
        natureza_juridica: 'Sociedade Empresária Limitada',
        municipio: 'VACARIA',
        uf: 'RS',
        situacao: 'Ativo',
        data_inscricao: '1998-08-20',
        pagina: 83,
      },
      {
        codigo: 86,
        razao_social: 'JJJB PARTICIPACOES LTDA',
        apelido: 'JJJB PARTICIPACOES',
        numero_documento: '04.148.972/0001-08',
        documento_limpo: '04148972000108',
        tipo_documento: 'CNPJ',
        natureza_juridica: 'Sociedade Empresária Limitada',
        municipio: 'VACARIA',
        uf: 'RS',
        situacao: 'Ativo',
        data_inscricao: '2000-11-12',
        pagina: 86,
      },
      {
        codigo: 87,
        razao_social: 'DIGITAL X LTDA. - ME',
        apelido: 'DIGITAL X',
        numero_documento: '02.721.464/0001-00',
        documento_limpo: '02721464000100',
        tipo_documento: 'CNPJ',
        natureza_juridica: 'Sociedade Empresária Limitada',
        municipio: 'LAGOA VERMELHA',
        uf: 'RS',
        situacao: 'Ativo',
        data_inscricao: '1998-06-25',
        pagina: 87,
      },
    ]

    let inseridos = 0
    for (let i = 0; i < clientesIniciais.length; i++) {
      const c = clientesIniciais[i]
      try {
        let existente = null
        try {
          existente = app.findFirstRecordByFilter('cadastro_empresas', 'codigo = {:c}', {
            c: c.codigo,
          })
        } catch (_) {
          existente = null
        }

        if (existente) continue

        const record = new Record(collection)
        record.set('codigo', c.codigo)
        record.set('razao_social', c.razao_social)
        record.set('nome', c.razao_social)
        record.set('apelido', c.apelido)
        record.set('nome_fantasia', c.apelido)
        record.set('tipo_documento', c.tipo_documento)
        record.set('numero_documento', c.numero_documento)
        record.set('documento_limpo', c.documento_limpo)
        record.set('natureza_juridica', c.natureza_juridica)
        record.set('municipio', c.municipio)
        record.set('uf', c.uf)
        record.set('situacao', c.situacao)
        record.set('data_inscricao', c.data_inscricao)
        record.set('pagina', c.pagina)

        app.save(record)
        inseridos++
      } catch (err) {
        console.log('[0136_seed_cadastro_empresas] Erro ao gravar cliente ' + c.codigo + ': ' + err)
      }
    }

    console.log('[0136_seed_cadastro_empresas] Clientes inseridos: ' + inseridos)
  },
  (app) => {},
)
