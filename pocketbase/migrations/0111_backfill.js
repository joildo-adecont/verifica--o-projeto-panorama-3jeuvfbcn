/// <reference path="../pb_data/types.d.ts" />

/**
 * 0111 — PREENCHE A DIREÇÃO DOS DOCUMENTOS QUE JÁ ESTAVAM NO BANCO
 *
 * ── O QUE ACONTECEU ──
 * Ao validar a Fase 4, os totalizadores acusaram R$ 2.267,34 em "sem direção".
 * Ao inspecionar, não eram meus documentos de teste: era uma NF-e REAL, da
 * SEGALAS ALIMENTOS LTDA FILIAL 2 (SC, 20 itens, CFOP 6102), importada pelo
 * próprio usuário antes de o campo `direcao` existir.
 *
 * ── POR QUE ESTA MIGRATION É NECESSÁRIA ──
 * Sem ela, um documento legítimo fica fora do totalizador de entradas E do de
 * saídas — e o relatório do CEO passa a somar menos do que a empresa movimentou,
 * sem avisar. O documento não está errado; ele só é anterior ao conceito.
 *
 * ── COMO PREENCHE ──
 * Pelo CFOP dos itens, a mesma regra do importador: 1/2/3 = entrada,
 * 5/6/7 = saída. Nada é deduzido por emitente. Se o documento não tiver CFOP em
 * nenhum item, fica sem direção — e continua visível como tal, porque inventar
 * aqui seria pior que deixar em branco.
 *
 * ── SOBRE O DUPLICADO ──
 * Existem DOIS registros com a mesma chave de acesso (importados antes de a
 * deduplicação existir). Esta migration NÃO apaga nenhum: apagar dado do usuário
 * por conta própria é decisão dele, não minha. Ela só marca os dois com a
 * direção correta. O relatório aponta a duplicidade para ele decidir.
 */

migrate(
  (app) => {
    var docs = []
    try {
      docs = app.findRecordsByFilter('param_documentos', '', '-importado_em', 5000, 0)
    } catch (_) {
      console.log('[0111] coleção ausente')
      return
    }

    /** Direção pelo primeiro dígito do CFOP — regra legal. */
    function dirDe(cfop) {
      var c = String(cfop || '').replace(/\D/g, '')
      if (!c) return ''
      var d = c.charAt(0)
      if (d === '1' || d === '2' || d === '3') return 'entrada'
      if (d === '5' || d === '6' || d === '7') return 'saida'
      return ''
    }

    var preenchidos = 0
    var semCfop = 0

    for (var i = 0; i < docs.length; i++) {
      var d = docs[i]
      /* Só mexe no que está vazio: não sobrescreve direção já decidida. */
      if (String(d.getString('direcao') || '') !== '') continue

      var itens = []
      try {
        itens = app.findRecordsByFilter(
          'param_itens',
          'documento = "' + d.id + '"',
          'numero_item',
          500,
          0,
        )
      } catch (_) {
        itens = []
      }
      if (itens.length === 0) continue

      var entrada = 0
      var saida = 0
      var primCfop = ''
      for (var k = 0; k < itens.length; k++) {
        var cf = itens[k].getString('cfop')
        if (!primCfop && cf) primCfop = cf
        var dir = dirDe(cf)
        if (dir === 'entrada') entrada++
        else if (dir === 'saida') saida++
        /* grava a direção no próprio item também, para o analisador por NCM */
        if (dir && String(itens[k].getString('direcao') || '') === '') {
          try {
            itens[k].set('direcao', dir)
            app.save(itens[k])
          } catch (_) {}
        }
      }

      var direcao = ''
      var conflito = 0
      if (entrada > saida) {
        direcao = 'entrada'
        conflito = saida
      } else if (saida > entrada) {
        direcao = 'saida'
        conflito = entrada
      } else if (entrada > 0 && saida > 0) {
        direcao = 'mista'
        conflito = entrada + saida
      }

      if (!direcao) {
        semCfop++
        continue
      }

      try {
        d.set('direcao', direcao)
        d.set('cfop_predominante', primCfop)
        d.set('itens_direcao_divergente', conflito)
        app.save(d)
        preenchidos++
      } catch (_) {}
    }

    console.log(
      '[0111] direção preenchida em ' + preenchidos + ' documento(s); sem CFOP: ' + semCfop,
    )
  },
  (app) => {
    /* Reverter limpa a direção — não apaga documento nenhum. */
    try {
      var docs = app.findRecordsByFilter('param_documentos', '', '', 5000, 0)
      for (var i = 0; i < docs.length; i++) {
        docs[i].set('direcao', '')
        docs[i].set('cfop_predominante', '')
        docs[i].set('itens_direcao_divergente', 0)
        app.save(docs[i])
      }
    } catch (_) {}
  },
)
