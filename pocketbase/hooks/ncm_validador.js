/// <reference path="../pb_data/types.d.ts" />

/**
 * AGENTE VALIDADOR DA BASE NCM — estado da última auditoria
 * =========================================================
 * Pedido do CEO (05/11/2026): "os agentes validem a fonte e os NCMs atualizados,
 * pois os NCM confiáveis vão determinar o sucesso do Sistema, pois irão
 * determinar a raiz dos produtos e posteriormente todas as classificações fiscais
 * e contábeis."
 *
 * ── OS 5 ESPECIALISTAS DO AGENTE ──
 *   1. PROCEDÊNCIA  — cada código tem ato de origem e vigência?
 *   2. INTEGRIDADE  — os códigos são válidos (2 a 8 dígitos, sem duplicata)?
 *   3. COBERTURA    — quantos capítulos têm regra de alíquota na reforma?
 *   4. CASAMENTO    — o motor casa por posição onde deveria casar por código?
 *   5. FONTE VIVA   — o DOU foi varrido e apareceu ato novo?
 *
 * ── O QUE ELE NÃO FAZ ──
 * Não corrige a tabela. Um agente que reescreve 15 mil códigos por conta própria
 * é risco, não segurança. Ele audita, mede e avisa; a correção é ato humano.
 *
 * Arquivo: tmp/ncm-validador-ultimo.json (mesma convenção dos outros agentes).
 */
routerAdd('GET', '/backend/v1/param-ncm-validador', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  try {
    var bruto = $os.readFile('/home/ethos/.assistant/workspace/tmp/ncm-validador-ultimo.json')
    var d = JSON.parse(String(bruto))
    return e.json(200, {
      success: true,
      disponivel: true,
      quando: d.quando || '',
      verificacoes_ok: d.verificacoes_ok || 0,
      verificacoes_total: d.verificacoes_total || 0,
      problemas_graves: d.problemas_graves || 0,
      achados: d.achados || [],
      verificacoes: d.verificacoes || [],
      procedencia: d.procedencia || {},
      integridade: d.integridade || {},
      cobertura: d.cobertura || {},
      casamento: d.casamento || {},
      fonte: d.fonte || {},
      mensagem: d.mensagem || '',
    })
  } catch (err) {
    /**
     * Sem arquivo não significa base errada — significa que a última auditoria
     * não deixou registro (tmp/ é esvaziado quando o servidor reinicia).
     * Confundir "não sei" com "está tudo bem", ou com "está tudo errado", é o
     * erro mais fácil de cometer num agente de auditoria.
     */
    return e.json(200, {
      success: true,
      disponivel: false,
      verificacoes_ok: 0,
      verificacoes_total: 0,
      problemas_graves: 0,
      achados: [],
      verificacoes: [],
      mensagem:
        'Sem registro da última auditoria da base NCM. O arquivo de estado fica em tmp/, que é ' +
        'esvaziado quando o servidor reinicia — isso NÃO significa que a base esteja errada, ' +
        'significa que a última rodada não deixou registro.',
    })
  }
})
