/**
 * MIGRATION 0146 — campos de enquadramento, cnaes secundários e folha em cadastro_empresas
 * =======================================================================================
 * Suporta o Diagnóstico Tributário ampliado do cliente Pastore (e demais clientes):
 * - enquadramento_tributario: texto ('Simples Nacional', 'Lucro Presumido', 'Lucro Real', etc.)
 * - cnaes_secundarios: texto (lista separada por vírgula ou ponto-e-vírgula com códigos/descrições)
 * - num_funcionarios: número de colaboradores registrados
 * - folha_salarial_mensal: valor monetário da folha mensal líquida/bruta
 * - encargos_mensais: valor dos encargos sociais/patronais mensais (FGTS, férias, 13º, previdência)
 *
 * Também inicializa os valores da AUTO MECÂNICA IRMÃOS PASTORE LTDA (CNPJ 92353630000168):
 * - enquadramento_tributario: 'Simples Nacional'
 * - cnaes_secundarios: '4530-7/03 - Comércio a varejo de peças e acessórios novos para veículos automotores; 4520-0/07 - Serviços de instalação, manutenção e reparação de acessórios para veículos automotores; 4520-0/04 - Serviços de alinhamento e balanceamento de veículos automotores'
 * - num_funcionarios: 12
 * - folha_salarial_mensal: 33861.39 (extraído do balancete real de jul/2026: conta 334 Ordenados e Salários)
 * - encargos_mensais: 5772.03 (extraído de jul/2026: FGTS 2.935,76 + Férias 2.836,27 da conta 333)
 */
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('cadastro_empresas')

    if (!col.fields.getByName('enquadramento_tributario')) {
      col.fields.add(new TextField({ name: 'enquadramento_tributario', required: false }))
    }
    if (!col.fields.getByName('cnaes_secundarios')) {
      col.fields.add(new TextField({ name: 'cnaes_secundarios', required: false }))
    }
    if (!col.fields.getByName('num_funcionarios')) {
      col.fields.add(new NumberField({ name: 'num_funcionarios', required: false }))
    }
    if (!col.fields.getByName('folha_salarial_mensal')) {
      col.fields.add(new NumberField({ name: 'folha_salarial_mensal', required: false }))
    }
    if (!col.fields.getByName('encargos_mensais')) {
      col.fields.add(new NumberField({ name: 'encargos_mensais', required: false }))
    }

    app.save(col)

    // Preenche os dados conhecidos para a Auto Mecânica Irmãos Pastore Ltda
    try {
      const records = app.findRecordsByFilter(
        'cadastro_empresas',
        "documento_limpo = '92353630000168' || numero_documento ~ '92.353.630' || razao_social ~ 'PASTORE'",
        '',
        1,
        0,
      )
      if (records && records.length > 0) {
        const pastore = records[0]
        if (!pastore.getString('enquadramento_tributario')) {
          pastore.set('enquadramento_tributario', 'Simples Nacional')
        }
        if (!pastore.getString('cnaes_secundarios')) {
          pastore.set(
            'cnaes_secundarios',
            '4530-7/03 - Comércio a varejo de peças e acessórios novos para veículos automotores; 4520-0/07 - Serviços de instalação, manutenção e reparação de acessórios para veículos automotores; 4520-0/04 - Serviços de alinhamento e balanceamento de veículos automotores',
          )
        }
        if (!pastore.getInt('num_funcionarios')) {
          pastore.set('num_funcionarios', 12)
        }
        if (!pastore.getFloat('folha_salarial_mensal')) {
          pastore.set('folha_salarial_mensal', 33861.39)
        }
        if (!pastore.getFloat('encargos_mensais')) {
          pastore.set('encargos_mensais', 5772.03)
        }
        app.save(pastore)
      }
    } catch (e) {
      console.log('Aviso ao inicializar dados da Pastore em cadastro_empresas:', e)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('cadastro_empresas')
    const remover = [
      'enquadramento_tributario',
      'cnaes_secundarios',
      'num_funcionarios',
      'folha_salarial_mensal',
      'encargos_mensais',
    ]
    for (const nome of remover) {
      const f = col.fields.getByName(nome)
      if (f) col.fields.remove(f)
    }
    app.save(col)
  },
)
