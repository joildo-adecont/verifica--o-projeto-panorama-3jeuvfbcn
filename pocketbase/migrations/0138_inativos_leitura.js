/**
 * MIGRATION 0138 — libera a LEITURA do cadastro de inativos
 * =========================================================
 * A 0137 criou `cadastro_empresas_inativos` com todas as regras em `null`, que
 * no PocketBase significa "ninguém além do superusuário". A tela publicada não
 * é superusuário — então ela abria, buscava, recebia 403 e mostrava
 * "0 cliente(s) inativo(s)": um número errado com cara de resultado.
 *
 * ── POR QUE LIBERAR A LEITURA É CORRETO AQUI ──
 * O cadastro analítico de clientes ATIVO já é público nesta aplicação (listRule
 * vazio), porque é uma consulta de trabalho do escritório, não dado sigiloso.
 * O cadastro de INATIVOS é o mesmo dado, do mesmo cliente, com outra situação —
 * manter um fechado e o outro aberto não protege nada e quebra a tela.
 *
 * ── E A ESCRITA CONTINUA FECHADA ──
 * `createRule`, `updateRule` e `deleteRule` permanecem em `null`: quem escreve
 * é exclusivamente o hook, com `$app` (superusuário) e token do painel. A
 * transferência e a reativação continuam passando pelas rotas auditadas — abrir
 * a escrita deixaria qualquer um mover cliente entre cadastros sem token.
 */
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('cadastro_empresas_inativos')
    /* Leitura livre, como no cadastro ativo; escrita só pelo backend. */
    col.listRule = ''
    col.viewRule = ''
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('cadastro_empresas_inativos')
    col.listRule = null
    col.viewRule = null
    app.save(col)
  },
)
