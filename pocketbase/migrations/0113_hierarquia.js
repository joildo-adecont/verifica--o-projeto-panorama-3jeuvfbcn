/// <reference path="../pb_data/types.d.ts" />

/**
 * 0113 — PASTAS HIERÁRQUICAS: BASE → ENTRADAS / SAÍDAS
 *
 * ── O QUE O CEO PEDIU (03/11/2026) ──
 * "Para cada cliente devemos criar uma pasta Base, contendo duas pastas: uma de
 * entradas (Compras) e outra de Saídas (Vendas)."
 *
 * ── POR QUE A SEPARAÇÃO ENTRE COMPRA E VENDA É O QUE DÁ SENTIDO À PASTA ──
 * Já existia a divisão por cliente. Faltava a divisão por natureza da operação
 * DENTRO do cliente — e é ela que separa dois universos que não se somam:
 *
 *   Entradas (Compras) → geram CRÉDITO  → o que o cliente comprou de terceiros
 *   Saídas   (Vendas)  → geram DÉBITO   → o que o cliente vendeu
 *
 * Misturar os dois numa pasta só produz um total que não significa nada: a soma
 * de compras com vendas não é faturamento nem custo. Com a separação, cada lado
 * tem o seu número e a apuração passa a ser possível.
 *
 * ── COMO FICA A HIERARQUIA ──
 *
 *   DIO SANTO TRATTORIA LTDA        ← tipo 'base'   (CNPJ, a raiz do cliente)
 *     ├── Entradas (Compras)        ← tipo 'entrada'
 *     └── Saídas (Vendas)           ← tipo 'saida'
 *
 * O documento aponta sempre para a FOLHA (entrada ou saída), nunca para a base.
 * Assim o relatório por cliente soma a base, e o relatório por natureza soma a
 * folha — cada um com uma consulta de igualdade, sem juntar tabelas.
 *
 * ── POR QUE CAMPO `pai` EM VEZ DE COLECAO SEPARADA ──
 * Duas coleções (base / subpasta) obrigariam toda consulta a perguntar "qual
 * coleção?" e a tela a montar duas listas. Com `pai` e `tipo` na mesma coleção,
 * a hierarquia é dado, não estrutura — e acrescentar um terceiro nível amanhã
 * não exige migration nova.
 */

migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('param_pastas')
      /* 'base' = raiz do cliente · 'entrada'/'saida' = folhas de movimento */
      col.fields.add(new TextField({ name: 'tipo', required: false, max: 12 }))
      /* id da pasta pai (vazio na base) */
      col.fields.add(new TextField({ name: 'pai', required: false, max: 40 }))
      app.save(col)
      console.log('[0113] param_pastas: campos tipo e pai criados')
    } catch (_) {
      console.log('[0113] param_pastas ausente')
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('param_pastas')
      for (const n of ['tipo', 'pai']) {
        try {
          col.fields.removeByName(n)
        } catch (_) {}
      }
      app.save(col)
    } catch (_) {}
  },
)
