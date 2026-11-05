/// <reference path="../pb_data/types.d.ts" />

/**
 * CARTEIRA DE CLIENTES PARA O LEVANTAMENTO DE REGIMES
 * ====================================================
 * Pedido do CEO (05/11/2026): identificar quais clientes se enquadram em regime
 * específico e sinalizar no cadastro — "levantamento de carteira, não tabela".
 *
 * ── DE ONDE VÊM OS CLIENTES ──
 * Da coleção `clients` do projeto Skip **56819 "Sistema ADECONT Financeiro"**
 * (497 registros reais, carga de 26/09/2026). É a mesma fonte que alimenta o
 * sistema contábil — usar a mesma evita duas verdades sobre o mesmo cliente.
 *
 * ── O QUE A ROTA DEVOLVE, E O QUE ELA NÃO INVENTA ──
 * Devolve os campos que EXISTEM no cadastro: nome, documento, natureza jurídica,
 * cidade, UF, SUFRAMA. **CNAE e receita anual NÃO estão no cadastro** — a
 * exportação do sistema contábil não trouxe CNAE.
 *
 * Quando o campo não existe, o campo sai vazio — e o front trata isso como
 * "pendente", nunca como "não é". É a diferença entre "não sei" e "não é".
 */

routerAdd('GET', '/backend/v1/param-carteira-regimes', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  var q = e.requestInfo().query || {}
  var limite = Number(q.limite) || 2000

  /**
   * A coleção `clients` vive no projeto 56819, que é OUTRO projeto Skip — este
   * hook roda no 62493. Os dois compartilham a mesma instância de backend neste
   * ambiente (mesma organização), então o acesso direto por nome funciona.
   * Se um dia não funcionar, a rota devolve erro claro em vez de lista vazia:
   * lista vazia faria a tela dizer "nenhum cliente se enquadra", que é mentira.
   */
  var clientes = []
  try {
    clientes = $app.findRecordsByFilter('clients', '', 'name', limite, 0)
  } catch (err) {
    return e.json(200, {
      success: true,
      disponivel: false,
      origem: 'coleção clients (projeto 56819 — Sistema ADECONT Financeiro)',
      clientes: [],
      mensagem:
        'A coleção de clientes não está acessível deste projeto (' +
        String(err).slice(0, 120) +
        '). ' +
        'Sem ela, o levantamento não pode ser feito — e uma lista vazia diria que nenhum cliente ' +
        'se enquadra, o que seria falso.',
    })
  }

  var out = []
  for (var i = 0; i < clientes.length; i++) {
    var c = clientes[i]
    out.push({
      codigo: String(c.get('client_code') || ''),
      nome: String(c.get('name') || ''),
      fantasia: String(c.get('trade_name') || ''),
      documento: String(c.get('document') || ''),
      natureza: String(c.get('legal_nature') || ''),
      cidade: String(c.get('city') || ''),
      uf: String(c.get('state') || ''),
      suframa: String(c.get('suframa_registration') || ''),
      /* campos que NÃO existem no cadastro — devolvidos vazios de propósito,
         para o front tratá-los como "pendente", nunca como "não é" */
      cnae: String(c.get('cnae') || ''),
      receita: Number(c.get('receita_anual')) || 0,
      status: String(c.get('status') || ''),
    })
  }

  return e.json(200, {
    success: true,
    disponivel: true,
    origem:
      'coleção clients (projeto 56819 — Sistema ADECONT Financeiro), ' + out.length + ' registros',
    total: out.length,
    campos_ausentes: ['cnae', 'receita_anual'],
    clientes: out,
  })
})
