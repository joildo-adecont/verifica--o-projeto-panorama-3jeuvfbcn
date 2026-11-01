migrate(
  (app) => {
    // Atualizar referências da sigla COU para CEO nas tabelas do Instalador e Controle de Versão
    // 1. Tabela programa_versoes
    app
      .db()
      .newQuery(
        "UPDATE programa_versoes SET controlado_por = REPLACE(controlado_por, 'COU — Centro de Operações Unificadas', 'CEO — Direção Executiva') WHERE controlado_por LIKE '%COU%'",
      )
      .execute()

    app
      .db()
      .newQuery(
        "UPDATE programa_versoes SET controlado_por = REPLACE(controlado_por, 'COU ADECONT', 'CEO ADECONT') WHERE controlado_por LIKE '%COU%'",
      )
      .execute()

    app
      .db()
      .newQuery(
        "UPDATE programa_versoes SET controlado_por = REPLACE(controlado_por, 'COU', 'CEO') WHERE controlado_por LIKE '%COU%'",
      )
      .execute()

    app
      .db()
      .newQuery(
        "UPDATE programa_versoes SET notas_versao = REPLACE(notas_versao, 'Módulo Central do COU', 'Módulo Central do CEO') WHERE notas_versao LIKE '%COU%'",
      )
      .execute()

    app
      .db()
      .newQuery(
        "UPDATE programa_versoes SET notas_versao = REPLACE(notas_versao, 'homologada pelo COU', 'homologada pelo CEO') WHERE notas_versao LIKE '%COU%'",
      )
      .execute()

    app
      .db()
      .newQuery(
        "UPDATE programa_versoes SET notas_versao = REPLACE(notas_versao, 'COU', 'CEO') WHERE notas_versao LIKE '%COU%'",
      )
      .execute()

    // 2. Tabela programa_envios
    app
      .db()
      .newQuery(
        "UPDATE programa_envios SET enviado_por = REPLACE(enviado_por, 'COU — Centro de Operações Unificadas', 'CEO — Direção Executiva') WHERE enviado_por LIKE '%COU%'",
      )
      .execute()

    app
      .db()
      .newQuery(
        "UPDATE programa_envios SET enviado_por = REPLACE(enviado_por, 'COU ADECONT', 'CEO ADECONT') WHERE enviado_por LIKE '%COU%'",
      )
      .execute()

    app
      .db()
      .newQuery(
        "UPDATE programa_envios SET enviado_por = REPLACE(enviado_por, 'COU', 'CEO') WHERE enviado_por LIKE '%COU%'",
      )
      .execute()

    app
      .db()
      .newQuery(
        "UPDATE programa_envios SET mensagem = REPLACE(mensagem, 'COU (Centro de Operações Unificadas)', 'CEO (Direção Executiva ADECONT)') WHERE mensagem LIKE '%COU%'",
      )
      .execute()

    app
      .db()
      .newQuery(
        "UPDATE programa_envios SET mensagem = REPLACE(mensagem, 'homologada pelo COU', 'homologada pelo CEO') WHERE mensagem LIKE '%COU%'",
      )
      .execute()

    app
      .db()
      .newQuery(
        "UPDATE programa_envios SET mensagem = REPLACE(mensagem, 'Homologada pelo COU', 'Homologada pelo CEO') WHERE mensagem LIKE '%COU%'",
      )
      .execute()

    app
      .db()
      .newQuery(
        "UPDATE programa_envios SET mensagem = REPLACE(mensagem, 'COU — Centro de Operações Unificadas', 'CEO — Direção Executiva') WHERE mensagem LIKE '%COU%'",
      )
      .execute()

    app
      .db()
      .newQuery(
        "UPDATE programa_envios SET mensagem = REPLACE(mensagem, 'ADECONT COU', 'ADECONT CEO') WHERE mensagem LIKE '%COU%'",
      )
      .execute()

    app
      .db()
      .newQuery(
        "UPDATE programa_envios SET mensagem = REPLACE(mensagem, 'COU', 'CEO') WHERE mensagem LIKE '%COU%'",
      )
      .execute()

    app
      .db()
      .newQuery(
        "UPDATE programa_envios SET url_instalador_enviada = REPLACE(url_instalador_enviada, 'origem=cou', 'origem=ceo') WHERE url_instalador_enviada LIKE '%origem=cou%'",
      )
      .execute()
  },
  (app) => {
    // Reversão (opcional/idempotente)
    app
      .db()
      .newQuery(
        "UPDATE programa_versoes SET controlado_por = REPLACE(controlado_por, 'CEO — Direção Executiva', 'COU — Centro de Operações Unificadas') WHERE controlado_por LIKE '%CEO%'",
      )
      .execute()
  },
)
