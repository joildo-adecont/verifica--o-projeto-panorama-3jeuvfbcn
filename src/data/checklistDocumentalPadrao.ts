import type { ChecklistDocumentalItem } from '@/types/analisesEmpresariaisModel'

/**
 * Catálogo padrão dos 51 documentos do Checklist Documental da ADECONT
 * Baseado na metodologia de Due Diligence e Análise de Crédito.
 */
export const DOCUMENTOS_CHECKLIST_PADRAO: Omit<
  ChecklistDocumentalItem,
  'recebido' | 'observacao'
>[] = [
  // 1. Societário/Jurídico (10 itens)
  {
    id: 'soc_1',
    categoria: 'Societário/Jurídico',
    documento: 'Contrato social e atos constitutivos',
    obrigatorio: true,
  },
  {
    id: 'soc_2',
    categoria: 'Societário/Jurídico',
    documento: 'Última alteração contratual consolidada',
    obrigatorio: true,
  },
  {
    id: 'soc_3',
    categoria: 'Societário/Jurídico',
    documento: 'Comprovante de inscrição no CNPJ (RFB)',
    obrigatorio: true,
  },
  {
    id: 'soc_4',
    categoria: 'Societário/Jurídico',
    documento: 'Cartão CNPJ e certidão simplificada da Junta',
    obrigatorio: true,
  },
  {
    id: 'soc_5',
    categoria: 'Societário/Jurídico',
    documento: 'Certidão Negativa de Débitos Federal (PGFN/RFB)',
    obrigatorio: true,
  },
  {
    id: 'soc_6',
    categoria: 'Societário/Jurídico',
    documento: 'Certidão Negativa de Débitos Estadual (SEFAZ)',
    obrigatorio: true,
  },
  {
    id: 'soc_7',
    categoria: 'Societário/Jurídico',
    documento: 'Certidão Negativa de Débitos Municipal',
    obrigatorio: true,
  },
  {
    id: 'soc_8',
    categoria: 'Societário/Jurídico',
    documento: 'Certidão de Regularidade do FGTS (CRF Caixa)',
    obrigatorio: true,
  },
  {
    id: 'soc_9',
    categoria: 'Societário/Jurídico',
    documento: 'Certidão Negativa de Débitos Trabalhistas (CNDT)',
    obrigatorio: true,
  },
  {
    id: 'soc_10',
    categoria: 'Societário/Jurídico',
    documento: 'Procurações vigentes e poderes de administração',
    obrigatorio: true,
  },

  // 2. Contábil (10 itens)
  {
    id: 'cont_1',
    categoria: 'Contábil',
    documento: 'ECD (Escrituração Contábil Digital transmitida)',
    obrigatorio: true,
  },
  {
    id: 'cont_2',
    categoria: 'Contábil',
    documento: 'Balancete mensal analítico e sintético',
    obrigatorio: true,
  },
  {
    id: 'cont_3',
    categoria: 'Contábil',
    documento: 'Balanço patrimonial dos 3 últimos exercícios',
    obrigatorio: true,
  },
  {
    id: 'cont_4',
    categoria: 'Contábil',
    documento: 'DRE (Demonstração do Resultado do Exercício)',
    obrigatorio: true,
  },
  {
    id: 'cont_5',
    categoria: 'Contábil',
    documento: 'DFC (Demonstração do Fluxo de Caixa)',
    obrigatorio: true,
  },
  {
    id: 'cont_6',
    categoria: 'Contábil',
    documento: 'DMPL (Demonstração das Mutações do PL)',
    obrigatorio: true,
  },
  {
    id: 'cont_7',
    categoria: 'Contábil',
    documento: 'Notas explicativas às demonstrações financeiras',
    obrigatorio: true,
  },
  {
    id: 'cont_8',
    categoria: 'Contábil',
    documento: 'Plano de contas contábil referencial',
    obrigatorio: true,
  },
  {
    id: 'cont_9',
    categoria: 'Contábil',
    documento: 'Razão contábil analítico de contas relevantes',
    obrigatorio: true,
  },
  {
    id: 'cont_10',
    categoria: 'Contábil',
    documento: 'Livro diário encadernado e autenticado',
    obrigatorio: true,
  },

  // 3. Fiscal (8 itens)
  {
    id: 'fisc_1',
    categoria: 'Fiscal',
    documento: 'ECF (Escrituração Contábil Fiscal transmitida)',
    obrigatorio: true,
  },
  {
    id: 'fisc_2',
    categoria: 'Fiscal',
    documento: 'EFD-Contribuições (PIS/COFINS)',
    obrigatorio: true,
  },
  { id: 'fisc_3', categoria: 'Fiscal', documento: 'EFD-ICMS/IPI (SPED Fiscal)', obrigatorio: true },
  {
    id: 'fisc_4',
    categoria: 'Fiscal',
    documento: 'DCTFWeb e recibos de entrega',
    obrigatorio: true,
  },
  {
    id: 'fisc_5',
    categoria: 'Fiscal',
    documento: 'EFD-Reinf (Retenções e Informações Fiscais)',
    obrigatorio: true,
  },
  {
    id: 'fisc_6',
    categoria: 'Fiscal',
    documento: 'Memória de apuração do ICMS e guias pagas',
    obrigatorio: true,
  },
  {
    id: 'fisc_7',
    categoria: 'Fiscal',
    documento: 'Memória de apuração do ISS e guias municipais',
    obrigatorio: true,
  },
  {
    id: 'fisc_8',
    categoria: 'Fiscal',
    documento: 'Declaração formal do regime tributário (Real/Presumido/Simples)',
    obrigatorio: true,
  },

  // 4. Trabalhista (6 itens)
  {
    id: 'trab_1',
    categoria: 'Trabalhista',
    documento: 'Eventos de remuneração e fechamento do eSocial',
    obrigatorio: true,
  },
  {
    id: 'trab_2',
    categoria: 'Trabalhista',
    documento: 'Folha de pagamento analítica dos últimos 12 meses',
    obrigatorio: true,
  },
  {
    id: 'trab_3',
    categoria: 'Trabalhista',
    documento: 'Guias de recolhimento do FGTS Digital / Conectividade',
    obrigatorio: true,
  },
  {
    id: 'trab_4',
    categoria: 'Trabalhista',
    documento: 'Termos de rescisão e quitações dos últimos exercícios',
    obrigatorio: true,
  },
  {
    id: 'trab_5',
    categoria: 'Trabalhista',
    documento: 'Convenção coletiva de trabalho (CCT sindicato)',
    obrigatorio: true,
  },
  {
    id: 'trab_6',
    categoria: 'Trabalhista',
    documento: 'Controle de ponto eletrônico e banco de horas',
    obrigatorio: true,
  },

  // 5. Patrimonial (5 itens)
  {
    id: 'patr_1',
    categoria: 'Patrimonial',
    documento: 'Inventário físico e contábil de bens do ativo imobilizado',
    obrigatorio: true,
  },
  {
    id: 'patr_2',
    categoria: 'Patrimonial',
    documento: 'Laudos técnicos de avaliação patrimonial (fair value)',
    obrigatorio: true,
  },
  {
    id: 'patr_3',
    categoria: 'Patrimonial',
    documento: 'Matrículas atualizadas dos imóveis operacionais e sede',
    obrigatorio: true,
  },
  {
    id: 'patr_4',
    categoria: 'Patrimonial',
    documento: 'Contratos vigentes de leasing e arrendamento mercantil',
    obrigatorio: true,
  },
  {
    id: 'patr_5',
    categoria: 'Patrimonial',
    documento: 'Apólices vigentes de seguro patrimonial e RCF',
    obrigatorio: true,
  },

  // 6. Financeiro (6 itens)
  {
    id: 'fin_1',
    categoria: 'Financeiro',
    documento: 'Extratos bancários das contas ativas (últimos 12 meses)',
    obrigatorio: true,
  },
  {
    id: 'fin_2',
    categoria: 'Financeiro',
    documento: 'Relatório mensal de conciliações bancárias',
    obrigatorio: true,
  },
  {
    id: 'fin_3',
    categoria: 'Financeiro',
    documento: 'Contratos de empréstimos, financiamentos e mútuos',
    obrigatorio: true,
  },
  {
    id: 'fin_4',
    categoria: 'Financeiro',
    documento: 'Demonstrativo de garantias reais e fidejussórias outorgadas',
    obrigatorio: true,
  },
  {
    id: 'fin_5',
    categoria: 'Financeiro',
    documento: 'Extratos de aplicações financeiras e fundos de liquidez',
    obrigatorio: true,
  },
  {
    id: 'fin_6',
    categoria: 'Financeiro',
    documento: 'Fluxo de caixa gerencial projetado (12 a 24 meses)',
    obrigatorio: true,
  },

  // 7. Operacional (3 itens)
  {
    id: 'oper_1',
    categoria: 'Operacional',
    documento: 'Contratos vigentes com principais clientes (top 10 faturamento)',
    obrigatorio: true,
  },
  {
    id: 'oper_2',
    categoria: 'Operacional',
    documento: 'Contratos com fornecedores estratégicos e SLA de insumos',
    obrigatorio: true,
  },
  {
    id: 'oper_3',
    categoria: 'Operacional',
    documento: 'Relatório de aging da carteira de recebíveis e PCLD',
    obrigatorio: true,
  },

  // 8. Governança/Compliance (3 itens)
  {
    id: 'gov_1',
    categoria: 'Governança/Compliance',
    documento: 'Organograma corporativo e políticas internas formalizadas',
    obrigatorio: true,
  },
  {
    id: 'gov_2',
    categoria: 'Governança/Compliance',
    documento: 'Matriz de riscos corporativos e programa de compliance LGPD',
    obrigatorio: true,
  },
  {
    id: 'gov_3',
    categoria: 'Governança/Compliance',
    documento: 'Relatório de contingências e passivos judiciais (CPC 25)',
    obrigatorio: true,
  },
]
