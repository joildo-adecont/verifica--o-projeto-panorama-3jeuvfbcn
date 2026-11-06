/**
 * MIGRATION 0136 — torna `tipo_documento` opcional
 * ==================================================
 * A 0135 criou o campo com `required: true`. Na prática isso se mostrou uma
 * armadilha: o agente calcula o tipo CORRETO (`balanco`, confirmado na resposta
 * de erro), e ainda assim o PocketBase recusa a gravação com
 * "tipo_documento: cannot be blank" — perdendo a importação inteira depois de
 * todo o trabalho de leitura e classificação.
 *
 * ── POR QUE O CAMPO DEIXA DE SER OBRIGATÓRIO ──
 * A obrigatoriedade aqui não protege nada: quem grava é o agente, que sempre
 * preenche (o fallback é `|| 'indefinido'`). O que ela faz de fato é transformar
 * uma divergência de schema em perda de trabalho do usuário. Um campo
 * `indefinido` é honesto e não bloqueia; uma importação que não acontece por
 * causa de um metadado é só um defeito.
 *
 * ── E OS OUTROS SELECTS? ──
 * `formato`, `status`, `grupo` e `efeito_reforma` já nasceram opcionais, pelo
 * mesmo motivo. Se algum dia um deles ficar vazio, o relatório diz "não
 * identificado" em vez de derrubar a gravação.
 */
migrate(
  (app) => {
    const alvos = [
      { colecao: 'cont_documentos', campo: 'tipo_documento' },
      { colecao: 'cont_contas', campo: 'grupo' },
      { colecao: 'cont_contas', campo: 'efeito_reforma' },
      { colecao: 'cont_contas', campo: 'natureza' },
    ]

    for (const alvo of alvos) {
      try {
        const col = app.findCollectionByNameOrId(alvo.colecao)
        const campo = col.fields.getByName(alvo.campo)
        if (campo && campo.required) {
          campo.required = false
          app.save(col)
        }
      } catch (err) {
        /* coleção ou campo ausente: nada a fazer */
      }
    }
  },
  (app) => {
    /* Rollback: volta a exigir, que era o estado da 0135. */
    try {
      const col = app.findCollectionByNameOrId('cont_documentos')
      const campo = col.fields.getByName('tipo_documento')
      if (campo) {
        campo.required = true
        app.save(col)
      }
    } catch (err) {
      /* segue */
    }
  },
)
