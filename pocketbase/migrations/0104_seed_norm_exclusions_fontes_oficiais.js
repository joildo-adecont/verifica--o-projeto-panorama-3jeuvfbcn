/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const colExcl = app.findCollectionByNameOrId('norm_exclusions_history')
    if (!colExcl) return

    // Sementes realistas de exclusões contemplando todas as fontes principais citadas no requisito:
    // DOU, Receita Federal, Planalto, Senado, CGIBS, Câmara e Lefisc (comparação)
    const sementesExclusoes = [
      {
        norm_code: 'Revogação LC 123/2006 art. 13 §1º (Dispositivo Anterior)',
        norm_type: 'Exclusão Legislativa',
        norm_number: '123/2006',
        norm_year: '2026',
        norm_title: 'Exclusão de disposições incompatíveis com o IBS/CBS',
        source_org: 'Senado Federal / Congresso Nacional',
        confidence_tier: 'oficial_institucional',
        segment: 'Jurídico',
        exclusion_date: '2026-10-21',
        system_exclusion_date: '2026-10-21',
        reason_description:
          'Exclusão e revogação expressa de tratamento cumulativo anterior em face do art. 343 da LC 214/2025 e LC 238/2026.',
        revoked_article: 'art. 13, §1º',
        previous_content:
          'Regime de cumulatividade sem opção de transferência de créditos de IBS e CBS no Simples.',
        origin_collection: 'tax_norms',
        record_origin: 'rotina_semanal',
        link_url: 'https://normas.leg.br',
        notes: 'Exclusão legislativa registrada pelo comitê diretivo ADECONT.',
      },
      {
        norm_code: 'Revogação de Decretos de Retenção PIS/Cofins na Fonte',
        norm_type: 'Revogação Expressa',
        norm_number: '9.718/1998',
        norm_year: '2026',
        norm_title: 'Revogação de regimes especiais de retenção da seguridade anterior',
        source_org: 'DOU / Imprensa Nacional',
        confidence_tier: 'diario_oficial',
        segment: 'Tributário',
        exclusion_date: '2026-10-15',
        system_exclusion_date: '2026-10-15',
        reason_description:
          'Exclusão formal de hipóteses de antecipação e retenção na fonte incompatíveis com a sistemática de split payment da CBS.',
        revoked_article: 'arts. 2º ao 4º',
        previous_content:
          'Obrigatoriedade de retenção ampla de PIS/Cofins por tomadores de serviços em regime cumulativo.',
        origin_collection: 'tax_norms',
        record_origin: 'backfill_inicial',
        link_url: 'https://www.in.gov.br',
        notes: 'Harmonização com a Lei Complementar nº 214/2025.',
      },
      {
        norm_code: 'Exclusão de Artigo Transitório — Resolução CGIBS 4/2026',
        norm_type: 'Exclusão Normativa',
        norm_number: '4/2026',
        norm_year: '2026',
        norm_title: 'Exclusão de exigência antecipada de cadastro bifásico para MEI',
        source_org: 'CGIBS (Comitê Gestor IBS)',
        confidence_tier: 'oficial_institucional',
        segment: 'Contábil',
        exclusion_date: '2026-09-25',
        system_exclusion_date: '2026-09-25',
        reason_description:
          'Revogação de parágrafo transitório que previa duplicidade cadastral para contribuintes optantes pelo Simples Nacional.',
        revoked_article: 'art. 88, parágrafo único',
        previous_content:
          'Exigência de habilitação prévia segregada em portal estadual e municipal antes do acesso ao Comitê Gestor.',
        origin_collection: 'tax_norms',
        record_origin: 'rotina_semanal',
        link_url: 'https://www.cgibs.gov.br/',
        notes: 'Exclusão aprovada por unanimidade pelo Comitê Gestor.',
      },
      {
        norm_code: 'IN RFB nº 2.110/2022 — Exclusão de Retenções Previdenciárias Redundantes',
        norm_type: 'Revogação Parcial',
        norm_number: '2.110/2022',
        norm_year: '2026',
        norm_title: 'Exclusão de exigência de retenção substituída pelo recolhimento na liquidação financeira',
        source_org: 'Receita Federal (RFB)',
        confidence_tier: 'oficial_institucional',
        segment: 'Tributário',
        exclusion_date: '2026-10-18',
        system_exclusion_date: '2026-10-18',
        reason_description:
          'Revogação de dispositivos de retenção sobre cessão de mão de obra unificados na compensação centralizada da CBS.',
        revoked_article: 'arts. 112 e 114',
        previous_content:
          'Dever instrumental de retenção antecipada de 11% sem cômputo imediato no domicílio fiscal unificado.',
        origin_collection: 'tax_norms',
        record_origin: 'rotina_semanal',
        link_url: 'https://www.receita.fazenda.gov.br',
        notes: 'Ato de consolidação e exclusão de redundâncias fiscais emitido pela RFB.',
      },
      {
        norm_code: 'Decreto Federal nº 10.854/2021 — Exclusão de Dispositivos Incompatíveis',
        norm_type: 'Revogação de Decreto',
        norm_number: '10.854/2021',
        norm_year: '2026',
        norm_title: 'Exclusão de regulamentos infralegais revogados pela transição tributária',
        source_org: 'Planalto / Presidência da República',
        confidence_tier: 'oficial_institucional',
        segment: 'Administrativo',
        exclusion_date: '2026-10-08',
        system_exclusion_date: '2026-10-08',
        reason_description:
          'Exclusão formal assinada pelo Poder Executivo para revogar competências administrativas superadas pelo Comitê Gestor.',
        revoked_article: 'arts. 45 a 49',
        previous_content:
          'Atribuições infralegais dispersas de órgãos do Executivo sobre cadastro de regimes especiais extintos.',
        origin_collection: 'tax_norms',
        record_origin: 'rotina_semanal',
        link_url: 'https://www.planalto.gov.br',
        notes: 'Compilação oficial publicada no Portal da Legislação do Planalto.',
      },
      {
        norm_code: 'Câmara dos Deputados — Exclusão de Emenda Supressiva ao PLP 68/2024',
        norm_type: 'Exclusão Legislativa',
        norm_number: 'PLP 68/2024',
        norm_year: '2025',
        norm_title: 'Exclusão de limitação de crédito presumido de transporte interestadual',
        source_org: 'Câmara dos Deputados',
        confidence_tier: 'oficial_institucional',
        segment: 'Jurídico',
        exclusion_date: '2025-12-14',
        system_exclusion_date: '2025-12-14',
        reason_description:
          'Supressão legislativa de restrição ao aproveitamento de créditos de bens de capital e combustíveis em frotas próprias.',
        revoked_article: 'art. 219, § 4º da minuta',
        previous_content:
          'Glosa do crédito de IBS na aquisição de insumos de transporte intermunicipal e interestadual.',
        origin_collection: 'tax_norms',
        record_origin: 'backfill_inicial',
        link_url: 'https://www.camara.leg.br',
        notes: 'Ato de deliberação parlamentar formalizado no texto consolidado.',
      },
      {
        norm_code: 'Tabela Privada de Interpretação Lefisc nº 88/2025 — Item Excluído',
        norm_type: 'Exclusão de Confronto',
        norm_number: '88/2025',
        norm_year: '2026',
        norm_title: 'Exclusão de hipótese não confirmada de retenção de ICMS-ST em produtos agropecuários',
        source_org: 'Lefisc Legislação Fiscal',
        confidence_tier: 'comparacao',
        segment: 'Tributário',
        exclusion_date: '2026-10-02',
        system_exclusion_date: '2026-10-02',
        reason_description:
          'Exclusão de orientação doutrinária privada do catálogo após publicação de ato oficial em sentido oposto pela Receita Federal e CGIBS.',
        revoked_article: 'Parecer Orientativo Lefisc item 12',
        previous_content:
          'Interpretação que sugeria manutenção da MVA-ST original sem ajuste para o regime monofásico da CBS.',
        origin_collection: 'tax_norms',
        record_origin: 'manual',
        link_url: 'https://www.lefisc.com.br',
        notes: 'Registro informativo de comparação privada (sem validade jurídica) para auxílio da equipe de consultoria ADECONT.',
      },
    ]

    for (let i = 0; i < sementesExclusoes.length; i++) {
      const s = sementesExclusoes[i]
      try {
        const jaExiste = app.findRecordsByFilter(
          'norm_exclusions_history',
          'norm_code = {:code}',
          '',
          1,
          0,
          { code: s.norm_code },
        )
        if (!jaExiste || jaExiste.length === 0) {
          const r = new Record(colExcl)
          r.set('norm_code', s.norm_code)
          r.set('norm_type', s.norm_type)
          r.set('norm_number', s.norm_number)
          r.set('norm_year', s.norm_year)
          r.set('norm_title', s.norm_title)
          r.set('source_org', s.source_org)
          r.set('confidence_tier', s.confidence_tier)
          r.set('segment', s.segment)
          r.set('exclusion_date', s.exclusion_date)
          r.set('system_exclusion_date', s.system_exclusion_date)
          r.set('reason_description', s.reason_description)
          r.set('revoked_article', s.revoked_article)
          r.set('previous_content', s.previous_content)
          r.set('origin_collection', s.origin_collection)
          r.set('record_origin', s.record_origin)
          r.set('link_url', s.link_url)
          r.set('notes', s.notes)
          app.save(r)
        }
      } catch (err) {
        console.log('Aviso ao semear exclusão ' + s.norm_code + ': ' + err)
      }
    }
  },
  (app) => {
    // Reversão limpa se necessário
  },
)
