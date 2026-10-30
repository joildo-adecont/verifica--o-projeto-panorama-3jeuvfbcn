/// <reference path="../pb_data/types.d.ts" />

/**
 * 0072 — IDENTIFICAÇÃO COMPLETA PARA COMPARATIVO E SIMULAÇÃO
 *
 * ── O QUE FALTAVA ──
 * O cadastro tinha nome, e-mail, empresa, documento, regime, receita, atividade e
 * UF. Para COMPARAR a situação atual com a reforma faltava o lado de hoje: quanto
 * a empresa paga de tributo hoje, e sobre qual estrutura.
 *
 * ── O QUE ESTA MIGRATION ACRESCENTA ──
 * Identificação:
 *   tipo_pessoa       PJ ou PF
 *   razao_social      razão social completa (o `nome` é o contato)
 *   nome_fantasia     nome comercial
 *   cep / municipio   endereço fiscal
 *   cnae              código da atividade principal
 *   segmento          setor econômico (para casar com os regimes 6A–6F)
 *   num_funcionarios  porte real, não declarado
 *   telefone          fixo comercial
 *
 * Situação atual (o lado "hoje" do comparativo):
 *   carga_atual_pct   carga tributária atual em % da receita
 *   tributos_atuais   quais tributos a empresa recolhe hoje
 *
 * ── POR QUE A CARGA ATUAL É INFORMADA E NÃO CALCULADA ──
 * Não existe no sistema a apuração real da empresa (SPED, DCTF, guias). Calcular
 * a carga de hoje a partir de premissas genéricas produziria um número com cara de
 * diagnóstico e sem base. Quem informa é o contador; o sistema compara. Onde o
 * campo está vazio, o comparativo mostra "não informado" em vez de assumir 34%.
 *
 * ── OPÇÕES OPCIONAIS ──
 * Tudo aqui é opcional. O cadastro precisa continuar salvando com nome e e-mail.
 */

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('simul_clientes')

    // ─────── identificação ───────
    col.fields.add(
      new SelectField({
        name: 'tipo_pessoa',
        maxSelect: 1,
        required: false,
        values: ['PJ', 'PF'],
      }),
    )
    col.fields.add(new TextField({ name: 'razao_social', required: false, max: 250 }))
    col.fields.add(new TextField({ name: 'nome_fantasia', required: false, max: 250 }))
    col.fields.add(new TextField({ name: 'cep', required: false, max: 9 }))
    col.fields.add(new TextField({ name: 'municipio', required: false, max: 120 }))
    col.fields.add(new TextField({ name: 'cnae', required: false, max: 20 }))
    col.fields.add(
      new SelectField({
        name: 'segmento',
        maxSelect: 1,
        required: false,
        values: [
          'comercio',
          'industria',
          'servicos',
          'construcao',
          'agropecuaria',
          'imobiliario',
          'financeiro',
          'saude',
          'educacao',
          'tecnologia',
          'transporte',
          'energia',
          'outro',
        ],
      }),
    )
    col.fields.add(
      new NumberField({
        name: 'num_funcionarios',
        required: false,
        min: 0,
        max: 1000000,
        onlyInt: true,
      }),
    )
    col.fields.add(new TextField({ name: 'telefone', required: false, max: 20 }))

    // ─────── situação atual (lado "hoje" do comparativo) ───────
    col.fields.add(
      new NumberField({
        name: 'carga_atual_pct',
        required: false,
        min: 0,
        max: 100,
        onlyInt: false,
      }),
    )
    col.fields.add(
      new SelectField({
        name: 'tributos_atuais',
        maxSelect: 10,
        required: false,
        values: ['pis', 'cofins', 'icms', 'iss', 'ipi', 'irpj', 'csll', 'cpp', 'simples_das', 'is'],
      }),
    )

    app.save(col)
  },

  (app) => {
    try {
      const col = app.findCollectionByNameOrId('simul_clientes')
      const remover = [
        'tipo_pessoa',
        'razao_social',
        'nome_fantasia',
        'cep',
        'municipio',
        'cnae',
        'segmento',
        'num_funcionarios',
        'telefone',
        'carga_atual_pct',
        'tributos_atuais',
      ]
      for (let i = 0; i < remover.length; i++) {
        try {
          col.fields.removeByName(remover[i])
        } catch (_) {
          // campo pode não existir no rollback — segue
        }
      }
      app.save(col)
    } catch (_) {
      // coleção ausente: nada a desfazer
    }
  },
)
