/**
 * MIGRATION 0148 — Coleção regime_historico
 * =========================================
 * Registra a trilha de auditoria para cada alteração de Regime Tributário de clientes:
 * - empresa_id: ID do registro em cadastro_empresas (opcional para fallback)
 * - empresa_codigo: código numérico do cliente
 * - empresa_nome: razão social ou apelido do cliente
 * - empresa_documento: CNPJ ou CPF formatado/limpo
 * - regime_anterior: regime tributário que o cliente tinha antes da mudança
 * - regime_novo: novo regime selecionado
 * - origem: 'listagem' | 'ficha_cadastral' | 'banner_diagnostico' | 'parametrizador'
 * - usuario: identificação do usuário/operador (se houver)
 * - data_hora: carimbo ISO da alteração (também coberto por created autodate)
 * - observacao: notas adicionais
 */
migrate(
  (app) => {
    const col = new Collection({
      name: 'regime_historico',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'empresa_id', type: 'text', required: false },
        { name: 'empresa_codigo', type: 'number', required: false },
        { name: 'empresa_nome', type: 'text', required: false },
        { name: 'empresa_documento', type: 'text', required: false },
        { name: 'regime_anterior', type: 'text', required: false },
        { name: 'regime_novo', type: 'text', required: true },
        { name: 'origem', type: 'text', required: true },
        { name: 'usuario', type: 'text', required: false },
        { name: 'data_hora', type: 'text', required: false },
        { name: 'observacao', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_regime_hist_codigo ON regime_historico (empresa_codigo, created DESC)',
        'CREATE INDEX idx_regime_hist_doc ON regime_historico (empresa_documento, created DESC)',
        'CREATE INDEX idx_regime_hist_origem ON regime_historico (origem)',
        'CREATE INDEX idx_regime_hist_created ON regime_historico (created DESC)',
      ],
    })

    app.save(col)

    // Semente inicial para a Auto Mecânica Irmãos Pastore Ltda (código 1, CNPJ 92353630000168)
    try {
      const pastores = app.findRecordsByFilter(
        'cadastro_empresas',
        "documento_limpo = '92353630000168' || numero_documento ~ '92.353.630' || razao_social ~ 'PASTORE'",
        '',
        1,
        0,
      )
      if (pastores && pastores.length > 0) {
        const p = pastores[0]
        const rec = new Record(col)
        rec.set('empresa_id', p.id)
        rec.set('empresa_codigo', p.getInt('codigo') || 1)
        rec.set('empresa_nome', p.getString('razao_social') || 'AUTO MECANICA IRMAOS PASTORE LTDA')
        rec.set('empresa_documento', p.getString('documento_limpo') || '92353630000168')
        rec.set('regime_anterior', 'Não informado')
        rec.set('regime_novo', p.getString('regime_tributario') || 'Simples Nacional')
        rec.set('origem', 'ficha_cadastral')
        rec.set('usuario', 'ADECONT Sistema')
        rec.set('data_hora', new Date().toISOString())
        rec.set('observacao', 'Enquadramento inicial registrado no sistema ADECONT')
        app.save(rec)
      }
    } catch (e) {
      console.log('[0148] Aviso ao semear histórico inicial da Pastore:', e)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('regime_historico')
      app.delete(col)
    } catch (_) {}
  },
)
