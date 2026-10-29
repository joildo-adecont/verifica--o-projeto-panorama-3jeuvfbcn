/// <reference path="../pb_data/types.d.ts" />

/**
 * 0072 — PAINEL "CUSTO DO ERRO POR CLIENTE"
 *
 * ── O QUE ESTE ENDPOINT FAZ ──
 * Cruza o que o cliente declarou no cadastro (regime, receita) com o que foi
 * efetivamente simulado e enviado a ele (valor da operação, regime do envio).
 * Devolve, por cliente: a alíquota efetiva do regime que ele adota, a do regime
 * que seria aplicável, e quanto isso representa em reais por mês e por ano.
 *
 * ── A REGRA QUE ME OBRIGA A SER CONSERVADOR ──
 * Se faltar regime OU receita no cadastro, o cliente entra como
 * "sem dados suficientes" — NÃO é estimado. Um painel que chuta receita a partir
 * do que o vendedor simulou produz diagnóstico falso sobre a empresa do cliente.
 * O campo `situacao` diz exatamente por que cada cliente está fora do cálculo.
 *
 * ── SEGURANÇA ──
 * Mesmo esquema do resto do painel: token no header X-Painel-Token, validado
 * inline no início do handler. Hooks PocketBase JSVM não enxergam funções
 * top-level — por isso tudo é inline aqui dentro.
 */

routerAdd('GET', '/backend/v1/painel-cliente', (e) => {
  // ─────── autenticação inline (JSVM não acessa helpers top-level) ───────
  const TOKEN = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  const recebido = e.request.header.get('X-Painel-Token') || ''
  if (!TOKEN || recebido !== TOKEN) {
    return e.json(401, {
      erro: 'token invalido',
      detalhe: 'Informe o token do painel no header X-Painel-Token.',
    })
  }

  // ─────── parâmetros de cálculo (mesmos das demais telas) ───────
  const IBS_REF = 18.7
  const CBS_REF = 11.3
  const REF_TOTAL = IBS_REF + CBS_REF // 30,00%

  // fator de cada regime — idêntico ao usado no Comparador e no Custo do Erro
  const FATOR = {
    regular: 1.0,
    simples: null, // DAS por faixa: não se resolve por fator
    mei: null, // idem
    imobiliario: 0.5, // venda de imóvel novo (art. 255) — locação residencial é 0,3
    agro: 0.4, // insumos (art. 138)
    consorcios: 1.0,
    financeiro: 1.0,
    profissional: 0.7, // art. 127
    nao_informado: null,
  }

  const NOME_REGIME = {
    regular: 'Regime regular',
    simples: 'Simples Nacional',
    mei: 'MEI',
    imobiliario: 'Imobiliário',
    agro: 'Agronegócio',
    consorcios: 'Consórcios',
    financeiro: 'Serviços financeiros',
    profissional: 'Profissão regulamentada',
    nao_informado: 'Não informado',
  }

  // ─────── carregar clientes e envios ───────
  let clientes = []
  let envios = []
  try {
    clientes = $app.findRecordsByFilter('simul_clientes', '', '', 500, 0)
  } catch (_) {
    clientes = []
  }
  try {
    envios = $app.findRecordsByFilter('simul_envios', '', '-enviado_em', 2000, 0)
  } catch (_) {
    envios = []
  }

  // ─────── agrupar envios por cliente ───────
  // porCliente[clienteId] = { envios, recebido, simuladoTotal, ultimoEm, itens[] }
  const porCliente = {}
  for (let i = 0; i < envios.length; i++) {
    const env = envios[i]
    let cid = ''
    try {
      cid = env.getString('cliente')
    } catch (_) {
      cid = ''
    }
    if (!cid) continue

    if (!porCliente[cid]) {
      porCliente[cid] = {
        envios: 0,
        recebidos: 0,
        falhas: 0,
        valorSimulado: 0,
        ultimoEm: '',
        itens: [],
      }
    }
    const agg = porCliente[cid]
    agg.envios = agg.envios + 1

    let st = ''
    try {
      st = env.getString('status')
    } catch (_) {
      st = ''
    }
    if (st === 'RECEBIDO') agg.recebidos = agg.recebidos + 1
    if (st === 'FALHA') agg.falhas = agg.falhas + 1

    // Valor da operação: SOMENTE o campo explícito.
    // Tentei antes extrair do payload_simulacao com regex e o resultado foi falso:
    // o texto do resultado é uma tabela, e o padrão casava "VALOR\nCBS 4" virando
    // R$ 18 para uma operação de R$ 10.000. Adivinhar número em texto formatado,
    // para depois apresentar como diagnóstico do cliente, é exatamente o que este
    // painel não deve fazer. Sem o campo, o valor é zero e o cliente fica sem dado.
    let valor = 0
    try {
      valor = Number(env.getFloat('valor_operacao') || 0)
    } catch (_) {
      valor = 0
    }
    if (valor > 0) agg.valorSimulado = agg.valorSimulado + valor

    let data = ''
    try {
      data = env.getString('enviado_em') || ''
    } catch (_) {
      data = ''
    }
    if (data && data > agg.ultimoEm) agg.ultimoEm = data

    let itemNome = ''
    try {
      itemNome = env.getString('item_nome') || ''
    } catch (_) {
      itemNome = ''
    }
    if (itemNome && agg.itens.length < 5) {
      // não repete o mesmo item
      let repetido = false
      for (let k = 0; k < agg.itens.length; k++) {
        if (agg.itens[k] === itemNome) repetido = true
      }
      if (!repetido) agg.itens.push(itemNome)
    }
  }

  // ─────── montar o diagnóstico de cada cliente ───────
  const linhas = []
  let comDados = 0
  let semDados = 0
  let potencialTotal = 0

  for (let i = 0; i < clientes.length; i++) {
    const c = clientes[i]
    const id = c.id

    let nome = ''
    let empresa = ''
    let email = ''
    try {
      nome = c.getString('nome') || ''
      empresa = c.getString('empresa') || ''
      email = c.getString('email') || ''
    } catch (_) {}

    let regime = ''
    let receita = 0
    let atividade = ''
    let uf = ''
    try {
      regime = c.getString('regime_tributario') || ''
      receita = Number(c.getFloat('receita_mensal') || 0)
      atividade = c.getString('atividade') || ''
      uf = c.getString('uf') || ''
    } catch (_) {}

    const agg = porCliente[id] || {
      envios: 0,
      recebidos: 0,
      falhas: 0,
      valorSimulado: 0,
      ultimoEm: '',
      itens: [],
    }

    // ── decidir a situação, sem inventar ──
    let situacao = 'ok'
    let motivo = ''

    if (!regime || regime === 'nao_informado') {
      situacao = 'sem_regime'
      motivo = 'Regime tributário não informado no cadastro.'
    } else if (regime === 'simples' || regime === 'mei') {
      situacao = 'regime_por_faixa'
      motivo =
        'Simples/MEI: a alíquota depende da faixa de RBT12 — não se calcula por percentual fixo.'
    } else if (!receita || receita <= 0) {
      situacao = 'sem_receita'
      motivo = 'Receita mensal não informada no cadastro.'
    }

    const fatorAdotado = FATOR[regime]
    if (situacao === 'ok' && (fatorAdotado === null || fatorAdotado === undefined)) {
      situacao = 'sem_regime'
      motivo = 'Regime sem fator de cálculo definido.'
    }

    let aliqAdotada = null
    let aliqRegular = REF_TOTAL
    let tribAdotado = null
    let tribRegular = null
    let potencial = null

    if (situacao === 'ok') {
      comDados = comDados + 1
      aliqAdotada = REF_TOTAL * fatorAdotado
      tribAdotado = (receita * aliqAdotada) / 100
      tribRegular = (receita * aliqRegular) / 100
      // potencial = quanto ele economizaria se estivesse no regime de menor fator
      // (comparação com a regra geral, que é o teto)
      potencial = tribRegular - tribAdotado
      if (potencial < 0) potencial = 0
      potencialTotal = potencialTotal + potencial
    } else {
      semDados = semDados + 1
    }

    linhas.push({
      id: id,
      nome: nome,
      empresa: empresa,
      email: email,
      regime: regime || '',
      regimeNome: NOME_REGIME[regime] || 'Não informado',
      atividade: atividade,
      uf: uf,
      receitaMensal: receita,
      situacao: situacao,
      motivo: motivo,
      aliqAdotada: aliqAdotada,
      aliqRegular: aliqRegular,
      tribAdotado: tribAdotado,
      tribRegular: tribRegular,
      potencialMensal: potencial,
      potencialAnual: potencial === null ? null : potencial * 12,
      envios: agg.envios,
      recebidos: agg.recebidos,
      falhas: agg.falhas,
      valorSimulado: agg.valorSimulado,
      ultimoEnvio: agg.ultimoEm,
      itens: agg.itens,
    })
  }

  // ordena: quem tem potencial maior primeiro; sem dado vai para o fim
  linhas.sort((a, b) => {
    const pa = a.potencialMensal === null ? -1 : a.potencialMensal
    const pb = b.potencialMensal === null ? -1 : b.potencialMensal
    if (pb !== pa) return pb - pa
    return (a.nome || '').localeCompare(b.nome || '')
  })

  return e.json(200, {
    referencia: {
      ibs: IBS_REF,
      cbs: CBS_REF,
      total: REF_TOTAL,
    },
    resumo: {
      clientes: clientes.length,
      comDados: comDados,
      semDados: semDados,
      envios: envios.length,
      potencialMensalTotal: potencialTotal,
      potencialAnualTotal: potencialTotal * 12,
    },
    clientes: linhas,
  })
})
