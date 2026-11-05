/// <reference path="../pb_data/types.d.ts" />

/**
 * MONITOR DA TABELA NCM — estado da última varredura
 * ===================================================
 * Pedido do CEO (04/11/2026): a tabela NCM deve ser "mantida atualizada e
 * monitorada pelos agentes de segurança das fontes e de buscas".
 *
 * ── COMO O MONITOR FUNCIONA ──
 * O script `scripts/tabela-ncm/monitorar_ncm.py` roda no pipeline de fontes e
 * consulta o DOU por atos que possam alterar a NCM/TEC. A decisão de relevância
 * tem três exigências simultâneas:
 *   1. o tipo de ato altera a tabela (Resolução Gecex, GMC, decreto de TIPI/TEC);
 *   2. o texto menciona NCM/TEC NO CORPO — não só no título, que vem truncado;
 *   3. há verbo de alteração ("altera", "acrescenta", "exclui", "desdobra"...).
 *
 * Sem a exigência (2) o monitor devolvia 121 "relevantes" num trimestre, sendo
 * 120 soluções de consulta que apenas CITAM o NCM do produto do consulente.
 * Alarme em excesso ensina a ignorar alarme — que é o oposto do objetivo.
 *
 * ── O QUE ESTA ROTA FAZ ──
 * Devolve o JSON da última varredura gravado pelo script. Se o arquivo não
 * existir (o pod foi reiniciado e tmp/ foi esvaziado), diz isso com clareza em
 * vez de fingir que está tudo bem.
 *
 * Arquivo: tmp/ncm-monitor-ultimo.json (mesma convenção dos outros agentes).
 */
routerAdd('GET', '/backend/v1/param-ncm-monitor', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  /**
   * Lê o arquivo de estado do monitor.
   *
   * O JSON fica em tmp/, que é esvaziado quando o pod reinicia. Isso NÃO quer
   * dizer que a tabela está desatualizada — quer dizer que a última rodada não
   * deixou registro. A resposta separa as duas coisas, porque confundir "não
   * sei" com "está tudo bem" é o erro mais fácil de cometer num monitor.
   */
  try {
    var bruto = $os.readFile('/home/ethos/.assistant/workspace/tmp/ncm-monitor-ultimo.json')
    var txt = String(bruto)
    var d = JSON.parse(txt)
    return e.json(200, {
      success: true,
      disponivel: true,
      estado: d.estado || 'desconhecido',
      quando: d.quando || '',
      dias_varridos: d.dias_varridos || 0,
      data_carga_tabela: d.data_carga_tabela || '',
      normas_registradas: d.normas_registradas || 0,
      atos_encontrados: d.atos_encontrados || 0,
      relevantes: d.relevantes || [],
      erros: d.erros || [],
      mensagem: d.mensagem || '',
      acao_sugerida: d.acao_sugerida || '',
    })
  } catch (err) {
    return e.json(200, {
      success: true,
      disponivel: false,
      estado: 'sem_registro',
      mensagem:
        'Não há registro da última varredura. O arquivo de estado fica em tmp/, que é esvaziado ' +
        'quando o servidor reinicia — isso NÃO significa que a tabela esteja desatualizada, ' +
        'significa que a última rodada não deixou registro.',
      acao_sugerida:
        'Rodar o monitor: python3 scripts/tabela-ncm/monitorar_ncm.py --dias 30. ' +
        'Ele grava o estado e o pipeline de fontes passa a mostrá-lo aqui.',
      relevantes: [],
      erros: [],
    })
  }
})
