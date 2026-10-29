/// <reference path="../pb_data/types.d.ts" />

/**
 * 0071 — O CADASTRO PASSA A GUARDAR O QUE A ANÁLISE PRECISA
 *
 * ── O PROBLEMA QUE ESTA MIGRATION RESOLVE ──
 * Ao construir o painel "custo do erro por cliente" (Seção 8A), descobri que nem
 * `simul_clientes` nem `simul_envios` guardavam regime tributário nem receita.
 * Sem esses dois dados, "quanto o cliente deixa na mesa" seria um número
 * inventado — e número inventado com aparência de diagnóstico é pior do que
 * nenhum número, porque vira decisão.
 *
 * ── O QUE É ACRESCENTADO ──
 * Em `simul_clientes` (perfil da empresa):
 *   regime_tributario  — o regime que a empresa adota hoje
 *   receita_mensal     — receita média mensal, em reais
 *   atividade          — o setor, para casar com os regimes da Seção 6
 *   uf                 — unidade federativa, para a parcela estadual do IBS
 *
 * Em `simul_envios` (cada simulação enviada):
 *   valor_operacao     — o valor usado na simulação
 *   regime_adotado     — o regime declarado naquele envio
 *   ano_simulado       — o ano da transição usado
 *
 * ── POR QUE NULOS ──
 * Todos entram como opcionais. A base já tem 1 cliente e 6 envios; tornar campo
 * obrigatório quebraria registro existente. Quem preenche, ganha a análise; quem
 * não preenche continua com o cadastro funcionando como antes.
 */

migrate(
  (app) => {
    // ─────────────────────── simul_clientes ───────────────────────
    const clientes = app.findCollectionByNameOrId('simul_clientes')

    clientes.fields.add(
      new SelectField({
        name: 'regime_tributario',
        maxSelect: 1,
        required: false,
        values: [
          'regular',
          'simples',
          'mei',
          'imobiliario',
          'agro',
          'consorcios',
          'financeiro',
          'profissional',
          'nao_informado',
        ],
      }),
    )

    clientes.fields.add(
      new NumberField({
        name: 'receita_mensal',
        required: false,
        min: 0,
        max: 1000000000,
        onlyInt: false,
      }),
    )

    clientes.fields.add(
      new SelectField({
        name: 'atividade',
        maxSelect: 1,
        required: false,
        values: [
          'comercio',
          'industria',
          'servicos',
          'imobiliario',
          'agropecuaria',
          'financeiro',
          'construcao',
          'saude',
          'educacao',
          'tecnologia',
          'outro',
        ],
      }),
    )

    clientes.fields.add(
      new TextField({
        name: 'uf',
        required: false,
        min: 2,
        max: 2,
        pattern: '^[A-Z]{2}$',
      }),
    )

    app.save(clientes)

    // ─────────────────────── simul_envios ───────────────────────
    const envios = app.findCollectionByNameOrId('simul_envios')

    envios.fields.add(
      new NumberField({
        name: 'valor_operacao',
        required: false,
        min: 0,
        max: 1000000000000,
        onlyInt: false,
      }),
    )

    envios.fields.add(
      new TextField({
        name: 'regime_adotado',
        required: false,
        max: 30,
      }),
    )

    envios.fields.add(
      new NumberField({
        name: 'ano_simulado',
        required: false,
        min: 2026,
        max: 2033,
        onlyInt: true,
      }),
    )

    app.save(envios)
  },

  (app) => {
    // rollback: remove os campos acrescentados
    try {
      const clientes = app.findCollectionByNameOrId('simul_clientes')
      clientes.fields.removeByName('regime_tributario')
      clientes.fields.removeByName('receita_mensal')
      clientes.fields.removeByName('atividade')
      clientes.fields.removeByName('uf')
      app.save(clientes)
    } catch (_) {
      // coleção pode não existir no rollback — segue
    }

    try {
      const envios = app.findCollectionByNameOrId('simul_envios')
      envios.fields.removeByName('valor_operacao')
      envios.fields.removeByName('regime_adotado')
      envios.fields.removeByName('ano_simulado')
      app.save(envios)
    } catch (_) {
      // idem
    }
  },
)
