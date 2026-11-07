/**
 * MIGRATION 0150 — Coleções para ferramentas nativas de Análises Empresariais
 *
 * 1. analise_balancos: Balanço Patrimonial & DRE de 3 exercícios (Ano -2, Ano -1, Ano Atual)
 * 2. analise_checklist: Checklist documental de 51 itens (status por cliente)
 * 3. analise_achados: Matriz de achados da Due Diligence
 * 4. analise_pareceres: Parecer final por cliente
 *
 * Todas com regras de acesso públicas compatíveis com a ADECONT e segregação por cliente_cnpj.
 */
migrate(
  (app) => {
    // 1. Coleção analise_balancos
    if (!app.hasTable('analise_balancos')) {
      const colBalancos = new Collection({
        name: 'analise_balancos',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'cliente_cnpj', type: 'text', required: true },
          { name: 'exercicio', type: 'text', required: true }, // 'ano_menos_2' | 'ano_menos_1' | 'ano_atual'
          { name: 'ano_calendario', type: 'text' }, // Ex: '2023', '2024', '2025'
          { name: 'dados_balanco', type: 'json' }, // Estrutura completa de contas patrimoniais
          { name: 'dados_dre', type: 'json' }, // Estrutura completa de contas de resultado
          { name: 'dados_complementares', type: 'json' }, // Capex, juros, empregados, etc.
          { name: 'atualizado_por', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_analise_bal_cnpj ON analise_balancos (cliente_cnpj)',
          'CREATE UNIQUE INDEX idx_analise_bal_cnpj_ex ON analise_balancos (cliente_cnpj, exercicio)',
        ],
      })
      app.save(colBalancos)
    }

    // 2. Coleção analise_checklist
    if (!app.hasTable('analise_checklist')) {
      const colChecklist = new Collection({
        name: 'analise_checklist',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'cliente_cnpj', type: 'text', required: true },
          { name: 'item_id', type: 'text', required: true }, // ex: 'soc_1', 'cont_1'
          { name: 'categoria', type: 'text', required: true },
          { name: 'documento', type: 'text', required: true },
          { name: 'obrigatorio', type: 'bool' },
          { name: 'recebido', type: 'bool' },
          { name: 'observacao', type: 'text' },
          { name: 'data_recebimento', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_analise_chk_cnpj ON analise_checklist (cliente_cnpj)',
          'CREATE UNIQUE INDEX idx_analise_chk_cnpj_item ON analise_checklist (cliente_cnpj, item_id)',
        ],
      })
      app.save(colChecklist)
    }

    // 3. Coleção analise_achados
    if (!app.hasTable('analise_achados')) {
      const colAchados = new Collection({
        name: 'analise_achados',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'cliente_cnpj', type: 'text', required: true },
          { name: 'area', type: 'text', required: true }, // 'Contábil', 'Fiscal', 'Financeiro', etc.
          { name: 'achado', type: 'text', required: true },
          { name: 'evidencia', type: 'text' },
          { name: 'impacto', type: 'text' }, // 'Baixo', 'Médio', 'Alto'
          { name: 'risco', type: 'text' }, // 'Baixo', 'Médio', 'Alto'
          { name: 'recomendacao', type: 'text' },
          { name: 'responsavel', type: 'text' },
          { name: 'prazo', type: 'text' },
          { name: 'status', type: 'text' }, // 'Em andamento', 'Pendente', 'Crítico', 'Concluído'
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_analise_ach_cnpj ON analise_achados (cliente_cnpj)'],
      })
      app.save(colAchados)
    }

    // 4. Coleção analise_pareceres
    if (!app.hasTable('analise_pareceres')) {
      const colPareceres = new Collection({
        name: 'analise_pareceres',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'cliente_cnpj', type: 'text', required: true },
          { name: 'periodo', type: 'text' },
          { name: 'escopo', type: 'text' },
          { name: 'pontos_fortes', type: 'text' },
          { name: 'pontos_atencao', type: 'text' },
          { name: 'achados_criticos', type: 'text' },
          { name: 'conclusao', type: 'text' },
          { name: 'nivel_opiniao', type: 'text' }, // 'Sem ressalvas' | 'Com ressalvas' | 'Adverso'
          { name: 'recomendacao_credito', type: 'text' },
          { name: 'responsavel_tecnico', type: 'text' },
          { name: 'notas_ajustadas', type: 'json' }, // Ajuste manual de notas do score 0-10 por bloco
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_analise_par_cnpj ON analise_pareceres (cliente_cnpj)'],
      })
      app.save(colPareceres)
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('analise_pareceres'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('analise_achados'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('analise_checklist'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('analise_balancos'))
    } catch (_) {}
  },
)
