/// <reference path="../pb_data/types.d.ts" />

/**
 * 0110 — IMPORTAÇÃO EM LOTES E DIREÇÃO DO DOCUMENTO
 *
 * ── O QUE O CEO PEDIU (03/11/2026) ──
 * "Criar o importador em lotes tanto de NF de entradas como de saídas, e
 * apresentar relatório com totalizadores por período e analisadores futuros do
 * IBS em cada ano."
 *
 * ── POR QUE ESTES CAMPOS ──
 *
 * `direcao` (entrada | saida) — sem ela, todo documento é igual e o relatório
 * não consegue separar o que a empresa comprou do que vendeu. E separar isso é
 * a base de TUDO na reforma: entrada gera CRÉDITO, saída gera DÉBITO, e o que
 * se apura é a diferença. Um totalizador que soma os dois lados é um número
 * sem significado.
 *
 * `cfop_predominante` — guardado junto porque é a PROVA da direção. Não
 * deduzimos a direção por "quem é o emitente" (isso exigiria saber o CNPJ da
 * empresa e erraria em operação entre estabelecimentos); a direção vem do
 * próprio documento, pelo primeiro dígito do CFOP: 1/2/3 = entrada,
 * 5/6/7 = saída. Fica registrado qual CFOP sustentou a classificação, para
 * qualquer conferência posterior.
 *
 * `lote` — o identificador da importação em massa. Permite desfazer um lote
 * inteiro se ele veio errado, sem tocar no que já estava importado.
 *
 * ── POR QUE CAMPO NOVO E NÃO RECRIAR A COLEÇÃO ──
 * Recriar apagaria os documentos já importados. Acrescentar campo preserva, e
 * registro antigo simplesmente fica sem direção — o que é honesto: aquele
 * documento entrou antes de existir o conceito no sistema, e o relatório o
 * mostra como "não classificada" em vez de adivinhar.
 */

migrate(
  (app) => {
    // ── documentos ──
    try {
      const doc = app.findCollectionByNameOrId('param_documentos')
      doc.fields.add(new TextField({ name: 'direcao', required: false, max: 12 }))
      doc.fields.add(new TextField({ name: 'lote', required: false, max: 40 }))
      doc.fields.add(new TextField({ name: 'cfop_predominante', required: false, max: 6 }))
      /* Quantos itens do documento divergiram da direção predominante. Guardar
         o número (e não só corrigir) é o que permite a auditoria apontar o
         documento misto — que é raro e quase sempre erro de digitação. */
      doc.fields.add(new NumberField({ name: 'itens_direcao_divergente', required: false }))
      app.save(doc)
    } catch (_) {
      console.log('[0110] param_documentos ausente')
    }

    // ── itens ──
    try {
      const it = app.findCollectionByNameOrId('param_itens')
      it.fields.add(new TextField({ name: 'direcao', required: false, max: 12 }))
      app.save(it)
    } catch (_) {
      console.log('[0110] param_itens ausente')
    }
  },
  (app) => {
    // Reverter só remove os campos; nenhum dado de documento é apagado.
    try {
      const doc = app.findCollectionByNameOrId('param_documentos')
      for (const nome of ['direcao', 'lote', 'cfop_predominante', 'itens_direcao_divergente']) {
        try {
          doc.fields.removeByName(nome)
        } catch (_) {}
      }
      app.save(doc)
    } catch (_) {}
    try {
      const it = app.findCollectionByNameOrId('param_itens')
      try {
        it.fields.removeByName('direcao')
      } catch (_) {}
      app.save(it)
    } catch (_) {}
  },
)
