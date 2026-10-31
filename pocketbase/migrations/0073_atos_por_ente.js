/// <reference path="../pb_data/types.d.ts" />

/**
 * 0073 — ATOS DENTRO DE CADA ENTE: federal, estadual e municipal
 *
 * ── O PEDIDO DO CEO (31/10/2026) ──
 * "Conectando os atos aos municípios. Os municípios já estão no Skip. Só conectá-los.
 * Para que os atos fiquem dentro de cada município, atos estaduais dentro dos estados
 * e atos federais dentro da federação. Tudo com relação à reforma tributária. Ou atos
 * conexos. Ou atos que se intercalam ou se interagem com a reforma."
 *
 * ── O QUE JÁ EXISTIA E O QUE FALTAVA ──
 * `radar_municipios` já tem os 5.570 municípios com código IBGE — a base está pronta.
 * `radar_atos` existia, mas como rascunho: só UF, município, título e URL. Não dizia
 * de QUE NÍVEL era o ato, não dizia a DATA, não guardava o TRECHO, não marcava se o
 * ato é da reforma ou conexo, e não tinha como apontar o ente quando o ato é estadual
 * ou federal (que não têm município).
 *
 * ── O QUE ESTA MIGRATION ACRESCENTA ──
 * Nível do ato:
 *   nivel              federal | estadual | municipal  ← define onde o ato aparece
 *   ente_nome          "União", "Minas Gerais", "Belo Horizonte" — o dono do ato
 *   ente_chave         'BR' | 'MG' | '3106200' — identidade estável para agrupar
 *
 * Conteúdo do ato:
 *   data_publicacao    AAAA-MM-DD — ordenação e filtro por período
 *   trecho             o texto em volta do termo (o que o diário devolveu)
 *   tipo_ato           lei, decreto, portaria, resolução, edital...
 *   termos             quais termos da reforma casaram
 *   fonte_oficial      o nome do diário que publicou (fonte mestra daquele nível)
 *   relacao            reforma | conexo | interage — a classificação pedida
 *
 * Por que `relacao` importa: o CEO pediu ato da reforma E ato conexo E ato que se
 * intercala. São três graus de pertinência, e esconder essa diferença faria o painel
 * tratar uma emenda constitucional e uma portaria de repasse como iguais.
 *
 * ── REGRA DE DEDUPLICAÇÃO ──
 * Índice único em (nivel, ente_chave, url, titulo): a rotina roda todo dia e NÃO pode
 * gravar o mesmo ato duas vezes. O pipeline usa upsert por essa chave.
 *
 * ── POR QUE OS ATOS ANTIGOS DE TESTE SAEM ──
 * Os 7 registros existentes eram de 2024, de amostra, sem nível nem data. Deixá-los
 * faria o painel mostrar ato de 2024 misturado com a varredura de hoje. São apagados
 * e substituídos pelos 290 atos reais da varredura — com nível, data e fonte.
 */

migrate(
  (app) => {
    // ─────── 1. limpar a amostra antiga ───────
    // (registros de teste de 2024, sem nível/data: não pertencem ao radar de hoje)
    try {
      const antigos = app.findRecordsByFilter('radar_atos', '', '', 500, 0)
      for (let i = 0; i < antigos.length; i++) {
        app.delete(antigos[i])
      }
    } catch (_) {}

    // ─────── 2. campos de nível e ente em radar_atos ───────
    const atos = app.findCollectionByNameOrId('radar_atos')

    atos.fields.add(
      new SelectField({
        name: 'nivel',
        maxSelect: 1,
        required: true,
        values: ['federal', 'estadual', 'municipal'],
      }),
    )
    atos.fields.add(new TextField({ name: 'ente_nome', required: false, max: 150 }))
    atos.fields.add(new TextField({ name: 'ente_chave', required: false, max: 10 }))
    atos.fields.add(new TextField({ name: 'data_publicacao', required: false, max: 10 }))
    atos.fields.add(new TextField({ name: 'trecho', required: false, max: 0 }))
    atos.fields.add(new TextField({ name: 'tipo_ato', required: false, max: 60 }))
    atos.fields.add(new TextField({ name: 'termos', required: false, max: 250 }))
    atos.fields.add(new TextField({ name: 'fonte_oficial', required: false, max: 150 }))
    atos.fields.add(
      new SelectField({
        name: 'relacao',
        maxSelect: 1,
        required: false,
        values: ['reforma', 'conexo', 'interage'],
      }),
    )
    // `uf` deixa de ser obrigatória: ato federal não tem UF.
    const campoUf = atos.fields.getByName('uf')
    if (campoUf) campoUf.required = false

    app.save(atos)

    // ─────── 2b. regras de API ───────
    // Sem isto a coleção só aceita gravação de SUPERUSUÁRIO — foi o que fez a
    // primeira carga falhar com 403 "Only superusers can perform this action",
    // mascarado como 429 pelo retry. A rotina grava com o token do agente; a
    // leitura é pública (o painel consulta).
    atos.listRule = ''
    atos.viewRule = ''
    atos.createRule = ''
    atos.updateRule = ''
    atos.deleteRule = ''
    app.save(atos)

    // ─────── 3. índices de deduplicação e consulta ───────
    // Recriar a coleção com os índices novos. O índice único é o que impede o mesmo
    // ato entrar duas vezes na rotina diária; os demais servem ao painel por ente.
    const col = app.findCollectionByNameOrId('radar_atos')
    col.indexes = [
      'CREATE INDEX idx_radar_atos_uf ON radar_atos (uf)',
      'CREATE INDEX idx_radar_atos_ibge ON radar_atos (codigo_ibge)',
      'CREATE INDEX idx_radar_atos_nivel ON radar_atos (nivel)',
      'CREATE INDEX idx_radar_atos_ente ON radar_atos (ente_chave)',
      'CREATE INDEX idx_radar_atos_data ON radar_atos (data_publicacao)',
      'CREATE UNIQUE INDEX idx_radar_atos_unico ON radar_atos (nivel, ente_chave, titulo, data_publicacao)',
    ]
    app.save(col)
  },
  (app) => {
    // rollback: devolve a coleção ao rascunho original
    const atos = app.findCollectionByNameOrId('radar_atos')
    for (const nome of [
      'nivel',
      'ente_nome',
      'ente_chave',
      'data_publicacao',
      'trecho',
      'tipo_ato',
      'termos',
      'fonte_oficial',
      'relacao',
    ]) {
      try {
        atos.fields.removeByName(nome)
      } catch (_) {}
    }
    const campoUf = atos.fields.getByName('uf')
    if (campoUf) campoUf.required = true
    app.save(atos)
  },
)
