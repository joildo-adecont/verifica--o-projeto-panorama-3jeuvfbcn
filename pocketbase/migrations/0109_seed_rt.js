/// <reference path="../pb_data/types.d.ts" />

/**
 * 0109 - TABELAS DA REFORMA (Fase 2 do Parametrizador)
 *
 * POR QUE: o sistema tinha 15.429 classificacoes e TODAS eram NCM. Os codigos
 * que a reforma criou - cClassTrib, CST do IBS/CBS e cCredPres - estavam
 * zerados. Sem eles, "classificacao fiscal na reforma" seria chute: o item
 * seria classificado por NCM e chamado de reforma.
 *
 * FONTE (conferida 03/11/2026): Portal Nacional dos DFe / SVRS - Conformidade
 * Facil. Tabela de Classificacao Tributaria da RT atualizada em 30/10/2026.
 *   /CFF/ClassificacaoTributaria   -> 173 cClassTrib
 *   /CFF/TabelaCreditoPresumido    -> 13 cCredPres
 *
 * NAO importa NCM (ja existe) e nao inventa codigo.
 */

const DADOS = [
  {
    tipo: 'cClassTrib',
    codigo: '000001',
    cst: '000',
    desc: 'Situações tributadas integralmente pelo IBS e CBS.',
  },
  { tipo: 'cClassTrib', codigo: '000002', cst: '000', desc: 'Exploração de via' },
  {
    tipo: 'cClassTrib',
    codigo: '000003',
    cst: '000',
    desc: 'Regime automotivo - projetos incentivados (art. 311)',
  },
  {
    tipo: 'cClassTrib',
    codigo: '000004',
    cst: '000',
    desc: 'Regime automotivo - projetos incentivados (art. 312)',
  },
  {
    tipo: 'cClassTrib',
    codigo: '000005',
    cst: '000',
    desc: 'Operação com EAC destinado à mistura com gasolina A, mas com saída do biocombustível com destinação diversa',
  },
  {
    tipo: 'cClassTrib',
    codigo: '000006',
    cst: '000',
    desc: 'Situações tributadas integralmente pelo IBS e CBS.realizadas por autônomo',
  },
  {
    tipo: 'cClassTrib',
    codigo: '010001',
    cst: '010',
    desc: 'Operações do FGTS não realizadas pela Caixa Econômica Federal',
  },
  { tipo: 'cClassTrib', codigo: '010002', cst: '010', desc: 'Operações do serviço financeiro' },
  { tipo: 'cClassTrib', codigo: '011001', cst: '011', desc: 'Planos de assistência funerária.' },
  { tipo: 'cClassTrib', codigo: '011002', cst: '011', desc: 'Planos de assistência à saúde' },
  {
    tipo: 'cClassTrib',
    codigo: '011003',
    cst: '011',
    desc: 'Intermediação de planos de assistência à saúde',
  },
  { tipo: 'cClassTrib', codigo: '011004', cst: '011', desc: 'Concursos e prognósticos' },
  {
    tipo: 'cClassTrib',
    codigo: '011005',
    cst: '011',
    desc: 'Planos de assistência à saúde de animais domésticos',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200001',
    cst: '200',
    desc: 'Serviços de transporte de bens até as zonas de processamento de exportação e bens exportados a partir das zonas de processamento de exportação',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200002',
    cst: '200',
    desc: 'Fornecimento ou importação para produtor rural não contribuinte ou TAC',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200003',
    cst: '200',
    desc: 'Vendas de produtos destinados à alimentação humana (Anexo I)',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200004',
    cst: '200',
    desc: 'Fornecimento de dispositivos médicos (Anexo XII)',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200005',
    cst: '200',
    desc: 'Fornecimento de dispositivos médicos para órgãos da administração pública e entidades de saúde imunes (Anexo IV)',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200006',
    cst: '200',
    desc: 'Situação de emergência de saúde pública reconhecida pelo Poder público',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200007',
    cst: '200',
    desc: 'Fornecimento dos dispositivos de acessibilidade próprios para pessoas com deficiência (Anexo XIII)',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200008',
    cst: '200',
    desc: 'Fornecimento dos dispositivos de acessibilidade próprios para pessoas com deficiência adquiridos por órgãos da administração pública (Anexo V)',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200009',
    cst: '200',
    desc: 'Fornecimento dos medicamentos registrados na Anvisa',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200010',
    cst: '200',
    desc: 'Fornecimento dos medicamentos registrados na Anvisa, adquiridos por órgãos da administração pública',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200011',
    cst: '200',
    desc: 'Fornecimento das composições para nutrição enteral e parenteral quando adquiridas por órgãos da administração pública (Anexo VI)',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200012',
    cst: '200',
    desc: 'Situação de emergência de saúde pública reconhecida pelo Poder público',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200013',
    cst: '200',
    desc: 'Fornecimento de tampões higiênicos, absorventes higiênicos internos ou externos',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200014',
    cst: '200',
    desc: 'Fornecimento dos produtos hortícolas, frutas e ovos (Anexo XV)',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200015',
    cst: '200',
    desc: 'Venda de automóveis de passageiros de fabricação nacional adquiridos por motoristas profissionais ou pessoas com deficiência',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200016',
    cst: '200',
    desc: 'Prestação de serviços de pesquisa e desenvolvimento por Instituição Científica, Tecnológica e de Inovação (ICT)',
  },
  { tipo: 'cClassTrib', codigo: '200017', cst: '200', desc: 'Operações relacionadas ao FGTS' },
  {
    tipo: 'cClassTrib',
    codigo: '200018',
    cst: '200',
    desc: 'Operações de resseguro e retrocessão',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200019',
    cst: '200',
    desc: 'Importador dos serviços financeiros contribuinte',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200020',
    cst: '200',
    desc: 'Operação praticada por sociedades cooperativas optantes por regime específico do IBS e CBS',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200021',
    cst: '200',
    desc: 'Serviços de transporte público coletivo de passageiros ferroviário e hidroviário',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200022',
    cst: '200',
    desc: 'Operação originada fora da ZFM que destine bem material industrializado a contribuinte estabelecido na ZFM',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200023',
    cst: '200',
    desc: 'Operação realizada por indústria incentivada que destine bem material intermediário para outra indústria incentivada na ZFM',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200024',
    cst: '200',
    desc: 'Operação originada fora das Áreas de Livre Comércio destinadas a contribuinte estabelecido nas Áreas de Livre Comércio',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200025',
    cst: '200',
    desc: 'Fornecimento dos serviços de educação relacionados ao Programa Universidade para Todos (Prouni)',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200026',
    cst: '200',
    desc: 'Locação de imóveis localizados nas zonas reabilitadas',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200027',
    cst: '200',
    desc: 'Operações de locação, cessão onerosa e arrendamento de bens imóveis',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200028',
    cst: '200',
    desc: 'Fornecimento dos serviços de educação (Anexo II)',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200029',
    cst: '200',
    desc: 'Fornecimento dos serviços de saúde humana (Anexo III)',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200030',
    cst: '200',
    desc: 'Venda dos dispositivos médicos  (Anexo IV)',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200031',
    cst: '200',
    desc: 'Fornecimento dos dispositivos de acessibilidade próprios para pessoas com deficiência (Anexo V)',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200032',
    cst: '200',
    desc: 'Fornecimento dos medicamentos registrados na Anvisa ou produzidos por farmácias de manipulação, ressalvados os medicamentos sujeitos à alíquota zero',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200033',
    cst: '200',
    desc: 'Fornecimento das composições para nutrição enteral e parenteral (Anexo VI)',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200034',
    cst: '200',
    desc: 'Fornecimento dos alimentos destinados ao consumo humano (Anexo VII)',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200035',
    cst: '200',
    desc: 'Fornecimento dos produtos de higiene pessoal e limpeza (Anexo VIII)',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200036',
    cst: '200',
    desc: 'Fornecimento de produtos agropecuários, aquícolas, pesqueiros, florestais e extrativistas vegetais in natura',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200037',
    cst: '200',
    desc: 'Fornecimento de serviços ambientais de conservação ou recuperação da vegetação nativa',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200038',
    cst: '200',
    desc: 'Fornecimento dos insumos agropecuários e aquícolas (Anexo IX)',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200039',
    cst: '200',
    desc: 'Fornecimento dos bens e serviços relacionados com produções nacionais artísticas, culturais, de eventos, jornalísticas e audiovisuais (Anexo X)',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200040',
    cst: '200',
    desc: 'Fornecimento de serviços de comunicação institucional à administração pública',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200041',
    cst: '200',
    desc: 'Fornecimento de serviço de educação desportiva (art. 141. I)',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200042',
    cst: '200',
    desc: 'Fornecimento de serviço de gestão e exploração do desporto (art. 141. II)',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200043',
    cst: '200',
    desc: 'Fornecimento à administração pública dos serviços e dos bens relativos à soberania (Anexo XI)',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200044',
    cst: '200',
    desc: 'Operações e prestações de serviços de segurança da informação e segurança cibernética desenv por sociedade que tenha sócio brasileiro (Anexo XI)',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200045',
    cst: '200',
    desc: 'Operações relacionadas a projetos de reabilitação urbana de zonas históricas e de áreas críticas de recuperação e reconversão urbanística',
  },
  { tipo: 'cClassTrib', codigo: '200046', cst: '200', desc: 'Operações com bens imóveis' },
  { tipo: 'cClassTrib', codigo: '200047', cst: '200', desc: 'Bares e Restaurantes' },
  {
    tipo: 'cClassTrib',
    codigo: '200048',
    cst: '200',
    desc: 'Hotelaria, Parques de Diversão e Parques Temáticos',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200049',
    cst: '200',
    desc: 'Transporte coletivo de passageiros rodoviário, ferroviário e hidroviário',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200050',
    cst: '200',
    desc: 'Serviços de transporte aéreo regional coletivo de passageiros ou de carga',
  },
  { tipo: 'cClassTrib', codigo: '200051', cst: '200', desc: 'Agências de Turismo' },
  {
    tipo: 'cClassTrib',
    codigo: '200052',
    cst: '200',
    desc: 'Prestação de serviços de profissões intelectuais',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200053',
    cst: '200',
    desc: 'Fornecimento de medicamentos registrados na Anvisa, quando  classificados como soros ou vacinas',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200054',
    cst: '200',
    desc: 'Fornecimento de bem material pela cooperativa de produção agropecuária a associado não sujeito ao regime regular do IBS e da CBS',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200055',
    cst: '200',
    desc: 'Fornecimento dos serviços com redução de alíquota de 60% realizado por autônomo',
  },
  {
    tipo: 'cClassTrib',
    codigo: '200056',
    cst: '200',
    desc: 'Fornecimento dos serviços com redução de alíquota de 30% realizado por autônomo',
  },
  {
    tipo: 'cClassTrib',
    codigo: '220001',
    cst: '220',
    desc: 'Incorporação imobiliária submetida ao regime especial de tributação',
  },
  {
    tipo: 'cClassTrib',
    codigo: '220002',
    cst: '220',
    desc: 'Incorporação imobiliária submetida ao regime especial de tributação',
  },
  {
    tipo: 'cClassTrib',
    codigo: '220003',
    cst: '220',
    desc: 'Alienação de imóvel decorrente de parcelamento do solo',
  },
  {
    tipo: 'cClassTrib',
    codigo: '221001',
    cst: '221',
    desc: 'Locação, cessão onerosa ou arrendamento de bem imóvel com alíquota sobre a receita bruta',
  },
  {
    tipo: 'cClassTrib',
    codigo: '221002',
    cst: '221',
    desc: 'Incorporação imobiliária submetida ao regime especial de tributação',
  },
  {
    tipo: 'cClassTrib',
    codigo: '221003',
    cst: '221',
    desc: 'Incorporação imobiliária submetida ao regime especial de tributação',
  },
  {
    tipo: 'cClassTrib',
    codigo: '221004',
    cst: '221',
    desc: 'Alienação de imóvel decorrente de parcelamento do solo',
  },
  {
    tipo: 'cClassTrib',
    codigo: '222001',
    cst: '222',
    desc: 'Transporte internacional de passageiros, caso os trechos de ida e volta sejam vendidos em conjunto',
  },
  {
    tipo: 'cClassTrib',
    codigo: '400001',
    cst: '400',
    desc: 'Fornecimento de serviços de transporte público coletivo de passageiros rodoviário e metroviário',
  },
  {
    tipo: 'cClassTrib',
    codigo: '400002',
    cst: '400',
    desc: 'Fornecimento de serviços de transporte público coletivo de passageiros rodoviário e metroviário com medição por quilômetro rodado',
  },
  { tipo: 'cClassTrib', codigo: '400003', cst: '400', desc: 'Bagagens' },
  { tipo: 'cClassTrib', codigo: '400004', cst: '400', desc: 'Remessas internacionais' },
  {
    tipo: 'cClassTrib',
    codigo: '410001',
    cst: '410',
    desc: 'Fornecimento de bonificações quando constem no documento fiscal e que não dependam de evento posterior',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410002',
    cst: '410',
    desc: 'Transferências entre estabelecimentos pertencentes ao mesmo contribuinte',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410003',
    cst: '410',
    desc: 'Doações e amostras grátis sem contraprestação em benefício do doador',
  },
  { tipo: 'cClassTrib', codigo: '410004', cst: '410', desc: 'Exportações de bens e serviços' },
  {
    tipo: 'cClassTrib',
    codigo: '410005',
    cst: '410',
    desc: 'Fornecimentos realizados pela União, pelos Estados, pelo Distrito Federal e pelos Municípios',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410006',
    cst: '410',
    desc: 'Fornecimentos realizados por entidades religiosas e templos de qualquer culto',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410007',
    cst: '410',
    desc: 'Fornecimentos realizados por partidos políticos, entidades sindicais e instituições de educação e de assistência social',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410008',
    cst: '410',
    desc: 'Fornecimentos de livros, jornais, periódicos e do papel destinado a sua impressão',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410009',
    cst: '410',
    desc: 'Fornecimentos de fonogramas e videofonogramas musicais produzidos no Brasil',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410010',
    cst: '410',
    desc: 'Fornecimentos de serviço de comunicação nas modalidades de radiodifusão sonora e de sons e imagens de recepção livre e gratuita',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410011',
    cst: '410',
    desc: 'Fornecimentos de ouro, quando definido em lei como ativo financeiro ou instrumento cambial',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410012',
    cst: '410',
    desc: 'Fornecimento de condomínio edilício não optante pelo regime regular',
  },
  { tipo: 'cClassTrib', codigo: '410013', cst: '410', desc: 'Exportações de combustíveis' },
  {
    tipo: 'cClassTrib',
    codigo: '410014',
    cst: '410',
    desc: 'Fornecimento de produtor rural não contribuinte',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410015',
    cst: '410',
    desc: 'Fornecimento por transportador autônomo não contribuinte',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410016',
    cst: '410',
    desc: 'Fornecimento ou aquisição de resíduos sólidos',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410017',
    cst: '410',
    desc: 'Aquisição de bem móvel com crédito presumido sob condição de revenda realizada',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410018',
    cst: '410',
    desc: 'Operações relacionadas aos fundos garantidores e executores de políticas públicas',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410019',
    cst: '410',
    desc: 'Exclusão da gorjeta na base de cálculo no fornecimento de alimentação',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410020',
    cst: '410',
    desc: 'Exclusão do valor de intermediação na base de cálculo no fornecimento de alimentação',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410021',
    cst: '410',
    desc: 'Contribuição de que trata o art. 149-A da Constituição Federal',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410022',
    cst: '410',
    desc: 'Consolidação da propriedade do bem pelo credor',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410023',
    cst: '410',
    desc: 'Alienação de bens móveis ou imóveis que tenham sido objeto de garantia em que o prestador da garantia não seja contribuinte',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410024',
    cst: '410',
    desc: 'Consolidação da propriedade do bem pelo grupo de consórcio',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410025',
    cst: '410',
    desc: 'Alienação de bem que tenha sido objeto de garantia em que o prestador da garantia não seja contribuinte',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410026',
    cst: '410',
    desc: 'Doações e amostras grátis com anulação de crédito',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410027',
    cst: '410',
    desc: 'Exportação de serviço ou de bem imaterial',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410028',
    cst: '410',
    desc: 'Operações com bens imóveis realizadas por pessoas físicas não consideradas contribuintes',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410029',
    cst: '410',
    desc: 'Operações acobertadas somente pelo ICMS',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410030',
    cst: '410',
    desc: 'Estorno de crédito por perecimento, deteriorização, roubo, furto ou extravio.',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410031',
    cst: '410',
    desc: 'Fornecimento em período anterior ao início de vigência de incidências de CBS e IBS',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410032',
    cst: '410',
    desc: 'Tributos incidentes na operação que não integram a base de cálculo do IBS e da CBS',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410033',
    cst: '410',
    desc: 'Operações de Fundos de Investimento Imobiliário (FII) e Fundos de Investimento nas Cadeias Produtivas do Agronegócio (Fiagro)',
  },
  { tipo: 'cClassTrib', codigo: '410034', cst: '410', desc: 'Operações de fundos de investimento' },
  {
    tipo: 'cClassTrib',
    codigo: '410035',
    cst: '410',
    desc: 'Fornecimento realizado por nanoempreendedor',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410036',
    cst: '410',
    desc: 'Descontos financeiros em nota fatura',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410037',
    cst: '410',
    desc: 'Importação de bens materiais sem incidência de IBS e CBS',
  },
  {
    tipo: 'cClassTrib',
    codigo: '410999',
    cst: '410',
    desc: 'Operações não onerosas sem previsão de tributação, não especificadas anteriormente',
  },
  {
    tipo: 'cClassTrib',
    codigo: '510001',
    cst: '510',
    desc: 'Operações, sujeitas a diferimento, com energia elétrica, relativas à importação, geração, comercialização, distribuição e transmissão',
  },
  {
    tipo: 'cClassTrib',
    codigo: '515001',
    cst: '515',
    desc: 'Operações, sujeitas a diferimento, com insumos agropecuários e aquícolas (Anexo IX)',
  },
  { tipo: 'cClassTrib', codigo: '550001', cst: '550', desc: 'Exportações de bens materiais' },
  { tipo: 'cClassTrib', codigo: '550002', cst: '550', desc: 'Regime de Trânsito' },
  { tipo: 'cClassTrib', codigo: '550003', cst: '550', desc: 'Regimes de Depósito  (art. 85)' },
  { tipo: 'cClassTrib', codigo: '550004', cst: '550', desc: 'Regimes de Depósito (art. 87)' },
  {
    tipo: 'cClassTrib',
    codigo: '550005',
    cst: '550',
    desc: 'Regimes de Depósito (art. 87, Parágrafo único)',
  },
  {
    tipo: 'cClassTrib',
    codigo: '550006',
    cst: '550',
    desc: 'Regimes de Permanência Temporária com suspensão total',
  },
  { tipo: 'cClassTrib', codigo: '550007', cst: '550', desc: 'Regimes de Aperfeiçoamento (Recof)' },
  {
    tipo: 'cClassTrib',
    codigo: '550008',
    cst: '550',
    desc: 'Importação de bens para o Regime de Repetro-Temporário',
  },
  { tipo: 'cClassTrib', codigo: '550009', cst: '550', desc: 'GNL-Temporário' },
  { tipo: 'cClassTrib', codigo: '550010', cst: '550', desc: 'Repetro-Permanente' },
  { tipo: 'cClassTrib', codigo: '550011', cst: '550', desc: 'Repetro-Industrialização' },
  { tipo: 'cClassTrib', codigo: '550012', cst: '550', desc: 'Repetro-Nacional' },
  { tipo: 'cClassTrib', codigo: '550013', cst: '550', desc: 'Repetro-Entreposto' },
  { tipo: 'cClassTrib', codigo: '550014', cst: '550', desc: 'Zona de Processamento de Exportação' },
  {
    tipo: 'cClassTrib',
    codigo: '550015',
    cst: '550',
    desc: 'Regime Tributário para Incentivo à Modernização e à Ampliação da Estrutura Portuária',
  },
  {
    tipo: 'cClassTrib',
    codigo: '550016',
    cst: '550',
    desc: 'Regime Especial de Incentivos para o Desenvolvimento da Infraestrutura',
  },
  {
    tipo: 'cClassTrib',
    codigo: '550017',
    cst: '550',
    desc: 'Regime Tributário para Incentivo à Atividade Econômica Naval',
  },
  {
    tipo: 'cClassTrib',
    codigo: '550018',
    cst: '550',
    desc: 'Desoneração da aquisição de bens de capital',
  },
  {
    tipo: 'cClassTrib',
    codigo: '550019',
    cst: '550',
    desc: 'Importação de bem material por indústria incentivada para utilização na ZFM',
  },
  { tipo: 'cClassTrib', codigo: '550020', cst: '550', desc: 'Áreas de livre comércio' },
  {
    tipo: 'cClassTrib',
    codigo: '550021',
    cst: '550',
    desc: 'Industrialização destinada a exportações',
  },
  {
    tipo: 'cClassTrib',
    codigo: '550022',
    cst: '550',
    desc: 'Regime Especial de Incentivos para a Produção de Hidrogênio de Baixa Emissão de Carbono (Rehidro)',
  },
  {
    tipo: 'cClassTrib',
    codigo: '550023',
    cst: '550',
    desc: 'Operações com hidrocarbonetos líquidos derivados de petróleo não combustíveis ou de gás natural, inclusive nafta',
  },
  {
    tipo: 'cClassTrib',
    codigo: '550024',
    cst: '550',
    desc: 'Regime Tributário para Incentivo à Atividade Naval - Renaval (Art. 107, II)',
  },
  {
    tipo: 'cClassTrib',
    codigo: '550025',
    cst: '550',
    desc: 'Regime Tributário para Incentivo à Atividade Naval - Renaval (Art. 107, III)',
  },
  {
    tipo: 'cClassTrib',
    codigo: '550026',
    cst: '550',
    desc: 'Regimes de admissão temporária com suspensão total do pagamento dos tributos (ZFM)',
  },
  {
    tipo: 'cClassTrib',
    codigo: '550027',
    cst: '550',
    desc: 'Regimes de Aperfeiçoamento (Drawback)',
  },
  {
    tipo: 'cClassTrib',
    codigo: '550028',
    cst: '550',
    desc: 'Regimes de Aperfeiçoamento (Admissão temporária)',
  },
  { tipo: 'cClassTrib', codigo: '550029', cst: '550', desc: 'Zona de Processamento de Exportação' },
  {
    tipo: 'cClassTrib',
    codigo: '620001',
    cst: '620',
    desc: 'Tributação monofásica sobre combustíveis',
  },
  {
    tipo: 'cClassTrib',
    codigo: '620002',
    cst: '620',
    desc: 'Tributação monofásica com responsabilidade pela retenção sobre combustíveis',
  },
  {
    tipo: 'cClassTrib',
    codigo: '620003',
    cst: '620',
    desc: 'Tributação monofásica com responsabilidade de retenção de tributos por terceiros',
  },
  {
    tipo: 'cClassTrib',
    codigo: '620004',
    cst: '620',
    desc: 'Tributação monofásica sobre mistura de EAC com gasolina A em percentual superior ao obrigatório',
  },
  {
    tipo: 'cClassTrib',
    codigo: '620005',
    cst: '620',
    desc: 'Tributação monofásica sobre mistura de EAC com gasolina A em percentual inferior ao obrigatório',
  },
  {
    tipo: 'cClassTrib',
    codigo: '620006',
    cst: '620',
    desc: 'Tributação monofásica sobre combustíveis cobrada anteriormente',
  },
  {
    tipo: 'cClassTrib',
    codigo: '620007',
    cst: '620',
    desc: 'Perecimento, deteriorização, roubo, furto ou extravio no regime monofásico',
  },
  { tipo: 'cClassTrib', codigo: '800001', cst: '800', desc: 'Fusão, cisão ou incorporação' },
  {
    tipo: 'cClassTrib',
    codigo: '800002',
    cst: '800',
    desc: 'Transferência de crédito do associado, inclusive as cooperativas singulares',
  },
  {
    tipo: 'cClassTrib',
    codigo: '810001',
    cst: '810',
    desc: 'Crédito presumido sobre o valor apurado nos fornecimentos a partir da ZFM',
  },
  {
    tipo: 'cClassTrib',
    codigo: '811001',
    cst: '811',
    desc: 'Anulação de Crédito por Saídas Imunes/Isentas',
  },
  {
    tipo: 'cClassTrib',
    codigo: '811002',
    cst: '811',
    desc: 'Débitos de notas fiscais não processadas na apuração',
  },
  {
    tipo: 'cClassTrib',
    codigo: '811003',
    cst: '811',
    desc: 'Desenquadramento do Simples Nacional',
  },
  {
    tipo: 'cClassTrib',
    codigo: '820001',
    cst: '820',
    desc: 'Documento com informações de fornecimento de serviços de planos de assistência à saúde elencados no art. 234 da Lei Complementar nº214, de 2025',
  },
  {
    tipo: 'cClassTrib',
    codigo: '820002',
    cst: '820',
    desc: 'Documento com informações de fornecimento de serviços de planos de assinstência funerária',
  },
  {
    tipo: 'cClassTrib',
    codigo: '820003',
    cst: '820',
    desc: 'Documento com informações de fornecimento de serviços de planos de assistência à saúde de animais domésticos',
  },
  {
    tipo: 'cClassTrib',
    codigo: '820004',
    cst: '820',
    desc: 'Documento com informações de prestação de serviços de consursos de prognósticos',
  },
  {
    tipo: 'cClassTrib',
    codigo: '820005',
    cst: '820',
    desc: 'Documento com informações de alienação de bens imóveis',
  },
  {
    tipo: 'cClassTrib',
    codigo: '820006',
    cst: '820',
    desc: 'Documento com informações de fornecimento de serviços de exploração de via',
  },
  {
    tipo: 'cClassTrib',
    codigo: '820007',
    cst: '820',
    desc: 'Documento com informações de fornecimento de serviços financeiros',
  },
  {
    tipo: 'cClassTrib',
    codigo: '820008',
    cst: '820',
    desc: 'Documento com informações de fornecimento de serviço continuado, mas com tributação realizada em fatura anterior',
  },
  {
    tipo: 'cClassTrib',
    codigo: '820009',
    cst: '820',
    desc: 'Fornecimentos declarados e tributados em outro documento',
  },
  {
    tipo: 'cClassTrib',
    codigo: '830001',
    cst: '830',
    desc: 'Documento com exclusão da BC da CBS e do IBS de energia elétrica fornecida pela distribuidora à UC',
  },
  {
    tipo: 'cCredPres',
    codigo: '1',
    cst: '',
    desc: 'Crédito presumido da aquisição de bens e serviços de produtor rural e produtor rural integrado não contribuinte, observado o art. 168 da Lei Complementar nº 214, de 2025.',
  },
  {
    tipo: 'cCredPres',
    codigo: '2',
    cst: '',
    desc: 'Crédito presumido da aquisição de serviço de transportador autônomo de carga pessoa física não contribuinte, observado o art. 169 da Lei Complementar nº 214, de 2025.',
  },
  {
    tipo: 'cCredPres',
    codigo: '3',
    cst: '',
    desc: 'Crédito presumido da aquisição de resíduos e demais materiais destinados à reciclagem, reutilização ou logística reversa adquiridos de pessoa física, cooperativa ou outra forma de organização popular, observado o art. 170 da Lei Complementar nº 214, de 2025.',
  },
  {
    tipo: 'cCredPres',
    codigo: '4',
    cst: '',
    desc: 'Crédito presumido da aquisição de bens móveis usados de pessoa física não contribuinte para revenda, observado o art. 171 da Lei Complementar nº 214, de 2025.',
  },
  {
    tipo: 'cCredPres',
    codigo: '5',
    cst: '',
    desc: 'Crédito presumido no regime automotivo, observado o art. 311 da Lei Complementar nº 214, de 2025.',
  },
  {
    tipo: 'cCredPres',
    codigo: '6',
    cst: '',
    desc: 'Crédito presumido no regime automotivo, observado o art. 312 da Lei Complementar nº 214, de 2025.',
  },
  {
    tipo: 'cCredPres',
    codigo: '7',
    cst: '',
    desc: 'Crédito presumido na aquisição por contribuinte na Zona Franca de Manaus, observado o art. 444 da Lei Complementar nº 214, de 2025.',
  },
  {
    tipo: 'cCredPres',
    codigo: '8',
    cst: '',
    desc: 'Crédito presumido na aquisição por contribuinte na Zona Franca de Manaus, observado o art. 447 da Lei Complementar nº 214, de 2025.',
  },
  {
    tipo: 'cCredPres',
    codigo: '9',
    cst: '',
    desc: 'Crédito presumido na aquisição por contribuinte na Zona Franca de Manaus, observado o art. 449 da Lei Complementar nº 214, de 2025.',
  },
  {
    tipo: 'cCredPres',
    codigo: '10',
    cst: '',
    desc: 'Crédito presumido na aquisição por contribuinte na Zona Franca de Manaus, observado o art. 450 da Lei Complementar nº 214, de 2025.',
  },
  {
    tipo: 'cCredPres',
    codigo: '11',
    cst: '',
    desc: 'Crédito presumido na aquisição por contribuinte na Área de Livre Comércio, observado o art. 462 da Lei Complementar nº 214, de 2025.',
  },
  {
    tipo: 'cCredPres',
    codigo: '12',
    cst: '',
    desc: 'Crédito presumido na aquisição por contribuinte na Área de Livre Comércio, observado o art. 465 da Lei Complementar nº 214, de 2025.',
  },
  {
    tipo: 'cCredPres',
    codigo: '13',
    cst: '',
    desc: 'Crédito presumido na aquisição pela indústria na Área de Livre Comércio, observado o art. 467 da Lei Complementar nº 214, de 2025.',
  },
]

migrate(
  (app) => {
    let col
    try {
      col = app.findCollectionByNameOrId('param_classificacoes_rt')
    } catch (_) {
      console.log('[0109] colecao ausente; nada a semear')
      return
    }
    let criados = 0
    for (let i = 0; i < DADOS.length; i++) {
      const d = DADOS[i]
      let existe = false
      try {
        app.findFirstRecordByFilter('param_classificacoes_rt', 'tipo = {:t} && codigo = {:c}', {
          t: d.tipo,
          c: d.codigo,
        })
        existe = true
      } catch (_) {}
      if (existe) continue
      try {
        const r = new Record(col)
        r.set('tipo', d.tipo)
        r.set('codigo', d.codigo)
        r.set('descricao', d.desc)
        r.set('cst_pai', d.cst)
        r.set('fonte', 'Portal Nacional dos DFe / SVRS - Conformidade Facil')
        r.set('fonte_data', '2026-10-30 00:00:00')
        app.save(r)
        criados++
      } catch (_) {}
    }
    console.log('[0109] classificacoes da reforma criadas: ' + criados)
  },
  (app) => {
    try {
      const todos = app.findRecordsByFilter('param_classificacoes_rt', '', '', 2000, 0)
      for (let i = 0; i < todos.length; i++) app.delete(todos[i])
    } catch (_) {}
  },
)
