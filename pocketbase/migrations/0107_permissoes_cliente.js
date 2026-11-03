/// <reference path="../pb_data/types.d.ts" />

/**
 * 0107 — PERMISSÕES E RESTRIÇÕES DE USO DO CLIENTE (pedido do CEO, 03/11/2026)
 *
 * ── O QUE O CEO PEDIU ──
 * "No cadastro de clientes criar as limitações de acesso ao sistema dos mesmos,
 * com apontamento das restrições e liberações de uso, ficando no cadastro todas
 * as informações e restrições de uso, para garantir a segurança dos dados, crie
 * um bloco de permissões e ou proibições para os clientes cadastrados."
 *
 * ── A REGRA QUE GOVERNA ESTA MIGRATION ──
 * Permissão que não bloqueia nada é enfeite — e pior que enfeite: dá a sensação
 * de segurança sem a segurança. Cada campo aqui está ligado a um ponto real de
 * acesso do cliente, e os três pontos que existem hoje são:
 *
 *   1. GET /backend/v1/simul-relatorio?token=...   → cliente abre o laudo
 *   2. GET /backend/v1/simul-confirmar?token=...   → cliente confirma recebimento
 *   3. POST /backend/v1/simul-enviar               → escritório envia ao cliente
 *
 * O enforcement é feito em `simulador_envios.js`. Se um campo novo entrar aqui
 * sem ponto de controle correspondente, ele vira enfeite — por isso cada
 * restrição abaixo declara QUAL rota ela fecha.
 *
 * ── POR QUE A RESTRIÇÃO É LISTA NEGRA + LISTA BRANCA ──
 * Só proibir não resolve: o cliente precisa de exceções (um cliente bloqueado
 * para exportar, mas liberado para ver valores). Guardar as duas listas separadas
 * deixa o cadastro legível — "o que ele NÃO pode" e "o que ele PODE além do
 * padrão" — em vez de um emaranhado de booleanos contraditórios.
 *
 * ── PADRÃO SEGURO ──
 * Cadastro novo nasce `liberado`, `N3_confirmacao`: sem restrição nenhuma. Quem
 * restringe é o escritório, de propósito. Um default restritivo quebraria os 500
 * clientes já cadastrados de uma vez, no dia da publicação.
 *
 * ── NÍVEIS: MESMA ESCALA DA SEÇÃO 16 ──
 * N1 consulta · N2 relatório · N3 confirmação · N4 total. Reaproveitar a escala
 * existente evita duas linguagens de permissão no mesmo sistema.
 */

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('simul_clientes')

    // ─────── situação e nível ───────
    col.fields.add(
      new SelectField({
        name: 'acesso_situacao',
        maxSelect: 1,
        required: false,
        values: ['liberado', 'restrito', 'bloqueado'],
      }),
    )
    col.fields.add(
      new SelectField({
        name: 'acesso_nivel',
        maxSelect: 1,
        required: false,
        values: ['N1_consulta', 'N2_relatorio', 'N3_confirmacao', 'N4_total'],
      }),
    )

    // ─────── o que é PROIBIDO ───────
    // Cada valor nomeia a proibição em linguagem de negócio, não técnica.
    col.fields.add(
      new SelectField({
        name: 'acesso_restricoes',
        maxSelect: 8,
        required: false,
        values: [
          'proibe_exportar', // fecha: botão de PDF/CSV do relatório
          'proibe_compartilhar', // fecha: link de terceiro (token repassado)
          'proibe_confirmar', // fecha: POST/GET simul-confirmar (só leitura)
          'proibe_novos_envios', // fecha: simul-enviar para este cliente
          'proibe_apos_expirar', // fecha: tudo depois de acesso_expira_em
          'proibe_valores', // fecha: valores tributários no laudo
          'proibe_capitulacao', // fecha: base legal detalhada no laudo
          'proibe_historico', // fecha: envios anteriores
        ],
      }),
    )

    // ─────── o que é LIBERADO além do padrão ───────
    col.fields.add(
      new SelectField({
        name: 'acesso_liberacoes',
        maxSelect: 6,
        required: false,
        values: [
          'libera_valores', // exceção ao proibe_valores
          'libera_capitulacao',
          'libera_exportar',
          'libera_simulacoes_auto',
          'libera_download_anexos',
          'libera_multiplos_usuarios',
        ],
      }),
    )

    // ─────── prazo ───────
    // Dias é mais seguro que data para renovação automática; a data é a
    // materialização, para o painel mostrar direto sem recalcular.
    col.fields.add(new NumberField({ name: 'acesso_validade_dias', required: false, min: 0 }))
    col.fields.add(new DateField({ name: 'acesso_expira_em', required: false }))
    col.fields.add(new DateField({ name: 'acesso_iniciado_em', required: false }))

    // ─────── rastro de quem decidiu ───────
    // Toda restrição tem de ter autor e motivo: perguntar "por que o cliente X
    // está bloqueado?" meses depois só tem resposta se alguém a escreveu aqui.
    col.fields.add(new TextField({ name: 'acesso_motivo', required: false, max: 2000 }))
    col.fields.add(new TextField({ name: 'acesso_autorizado_por', required: false, max: 300 }))
    col.fields.add(new DateField({ name: 'acesso_atualizado_em', required: false }))

    app.save(col)

    // ─────── trilha de auditoria ───────
    // O CEO pediu "apontamento das restrições e liberações". Uma coleção de log
    // preserva o histórico: quem mudou, quando, e de qual estado para qual.
    const log = new Collection({
      name: 'simul_acesso_log',
      type: 'base',
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
    })
    log.fields.add(new TextField({ name: 'cliente_id', required: true, max: 40 }))
    log.fields.add(new TextField({ name: 'cliente_nome', required: false, max: 300 }))
    log.fields.add(new TextField({ name: 'acao', required: true, max: 40 }))
    log.fields.add(new TextField({ name: 'situacao_anterior', required: false, max: 40 }))
    log.fields.add(new TextField({ name: 'situacao_nova', required: false, max: 40 }))
    log.fields.add(new TextField({ name: 'nivel_anterior', required: false, max: 40 }))
    log.fields.add(new TextField({ name: 'nivel_novo', required: false, max: 40 }))
    log.fields.add(new TextField({ name: 'restricoes_anteriores', required: false, max: 1000 }))
    log.fields.add(new TextField({ name: 'restricoes_novas', required: false, max: 1000 }))
    log.fields.add(new TextField({ name: 'liberacoes_anteriores', required: false, max: 1000 }))
    log.fields.add(new TextField({ name: 'liberacoes_novas', required: false, max: 1000 }))
    log.fields.add(new TextField({ name: 'motivo', required: false, max: 2000 }))
    log.fields.add(new TextField({ name: 'autor', required: false, max: 300 }))
    log.fields.add(new DateField({ name: 'registrado_em', required: false }))
    app.save(log)

    // ─────── padrão seguro para os clientes que já existem ───────
    // Sem este passo, os ~500 clientes existentes ficariam com situação vazia e
    // o enforcement trataria "vazio" como quê? Aqui a resposta fica explícita:
    // vazio = liberado, e a migração grava esse valor para não depender de
    // interpretação no hook.
    try {
      const todos = app.findRecordsByFilter('simul_clientes', '', '', 5000, 0)
      for (let i = 0; i < todos.length; i++) {
        const r = todos[i]
        if (!r.getString('acesso_situacao')) r.set('acesso_situacao', 'liberado')
        if (!r.getString('acesso_nivel')) r.set('acesso_nivel', 'N3_confirmacao')
        app.save(r)
      }
    } catch (_) {
      // base vazia ou grande demais: o hook trata ausência como liberado
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('simul_clientes')
      const campos = [
        'acesso_situacao',
        'acesso_nivel',
        'acesso_restricoes',
        'acesso_liberacoes',
        'acesso_validade_dias',
        'acesso_expira_em',
        'acesso_iniciado_em',
        'acesso_motivo',
        'acesso_autorizado_por',
        'acesso_atualizado_em',
      ]
      for (let i = 0; i < campos.length; i++) {
        try {
          col.fields.removeByName(campos[i])
        } catch (_) {}
      }
      app.save(col)
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('simul_acesso_log'))
    } catch (_) {}
  },
)
