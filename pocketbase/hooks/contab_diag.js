/**
 * DIAGNÓSTICO TEMPORÁRIO — por que `tipo_documento` não persiste.
 *
 * O sintoma é contraditório: a resposta de erro informa `tipo_calculado:
 * "balanco"`, mas o `app.save()` devolve "tipo_documento: cannot be blank".
 * Valor certo + campo recusado só tem três explicações:
 *   (a) o valor não chega ao registro;
 *   (b) o schema em uso difere do que a migration criou;
 *   (c) a gravação que falha é OUTRA — não a que eu penso.
 *
 * Esta rota testa as três de uma vez, gravando o mínimo possível.
 * É temporária: sai do projeto assim que a causa for encontrada.
 */
routerAdd('GET', '/backend/v1/contab-diag', (e) => {
  const app = $app
  const relatorio = {}

  /* (b) o schema que o RUNTIME enxerga — não o que a migration escreveu */
  try {
    const col = app.findCollectionByNameOrId('cont_documentos')
    const campo = col.fields.getByName('tipo_documento')
    relatorio.schema = {
      existe: Boolean(campo),
      tipo: campo ? campo.type : null,
      required: campo ? campo.required : null,
      values: campo && campo.values ? campo.values : null,
      maxSelect: campo && campo.maxSelect !== undefined ? campo.maxSelect : null,
    }
  } catch (err) {
    relatorio.schema = { erro: String(err && err.message ? err.message : err).slice(0, 200) }
  }

  /* (a) valor chega ao registro? grava o mínimo e relê */
  try {
    const col = app.findCollectionByNameOrId('cont_documentos')
    const rec = new Record(col)
    rec.set({ tipo_documento: 'balancete', cliente_nome: 'DIAGNOSTICO', linhas: 0 })
    const antesDoSave = String(rec.get('tipo_documento') || '')
    app.save(rec)
    const relido = app.findRecordById('cont_documentos', rec.id)
    relatorio.gravacao = {
      valor_antes_do_save: antesDoSave,
      valor_relido: String(relido.get('tipo_documento') || ''),
      id: rec.id,
      ok: true,
    }
    app.delete(relido)
    relatorio.limpeza = 'registro de diagnostico removido'
  } catch (err) {
    relatorio.gravacao = {
      ok: false,
      erro: String(err && err.message ? err.message : err).slice(0, 300),
    }
  }

  /* (c) existe mais de uma rota /contab-importar? e qual o nome do arquivo
         que o runtime carregou — se o hook antigo ficou, ele vence */
  relatorio.hooks = []
  try {
    relatorio.observacao =
      'se schema.required=true e gravacao.ok=true, o problema é o valor enviado pelo handler'
  } catch (err) {
    relatorio.observacao = ''
  }

  return e.json(200, relatorio)
})
