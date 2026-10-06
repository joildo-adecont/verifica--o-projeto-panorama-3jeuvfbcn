/// <reference path="../pb_data/types.d.ts" />
// 0056 - Seed de Nomenclatura Comum do Mercosul (NCM) dos 97 capítulos do Sistema Harmonizado
// Fonte oficial: MDIC / Siscomex / Receita Federal (TIPI - Resolução Gecex / Decreto 11.158)
// Cobre integralmente os 97 capítulos da NCM mais subposições-chave para Reforma Tributária

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('classifications')
    const now = new Date().toISOString()
    const fonte = 'RFB / MDIC / Siscomex'
    const refData = '2026-10-01'
    const tabelaOrigem = 'Siscomex / TIPI (Resolução Gecex)'

    // Lista abrangente de todos os 97 Capítulos NCM e principais posições de mercadorias da Reforma Tributária
    const ncmList = [
      // Seção I: Animais Vivos e Produtos do Reino Animal
      {
        codigo: '01',
        nome: 'Animais vivos',
        desc: 'Animais reprodutores de raça pura, cavalos, bovinos, suínos, ovinos e aves',
      },
      {
        codigo: '0101',
        nome: 'Cavalos, asininos e muares, vivos',
        desc: 'Reprodutores de raça pura e outros equídeos',
      },
      {
        codigo: '0102',
        nome: 'Animais vivos da espécie bovina',
        desc: 'Bovinos reprodutores de raça pura e outros para cria ou abate',
      },
      {
        codigo: '0103',
        nome: 'Animais vivos da espécie suína',
        desc: 'Reprodutores de raça pura e outros suínos',
      },
      {
        codigo: '0104',
        nome: 'Animais vivos das espécies ovina e caprina',
        desc: 'Ovinos e caprinos reprodutores de raça pura',
      },
      {
        codigo: '0105',
        nome: 'Aves domésticas vivas',
        desc: "Galos, galinhas, patos, gansos, perus e galinhas-d'angola",
      },
      {
        codigo: '0106',
        nome: 'Outros animais vivos',
        desc: 'Mamíferos, répteis, aves de rapina e insetos como abelhas',
      },
      {
        codigo: '02',
        nome: 'Carnes e miudezas, comestíveis',
        desc: 'Carnes de bovinos, suínos, ovinos, caprinos, equídeos e aves (Cesta Básica Nacional)',
      },
      {
        codigo: '0201',
        nome: 'Carnes de animais da espécie bovina, frescas ou refrigeradas',
        desc: 'Carcaças, quartos e cortes com osso ou desossados (Cesta Básica)',
      },
      {
        codigo: '0202',
        nome: 'Carnes de animais da espécie bovina, congeladas',
        desc: 'Carnes bovinas congeladas inteiras, em meias-carcaças ou desossadas',
      },
      {
        codigo: '0203',
        nome: 'Carnes de animais da espécie suína, frescas, refrigeradas ou congeladas',
        desc: 'Pernas, pás e seus pedaços com osso ou desossados',
      },
      {
        codigo: '0207',
        nome: 'Carnes e miudezas comestíveis de aves da posição 01.05',
        desc: 'Frango inteiro, peito, coxas e miudezas frescas, refrigeradas ou congeladas',
      },
      {
        codigo: '03',
        nome: 'Peixes e crustáceos, moluscos e outros invertebrados aquáticos',
        desc: 'Pescados frescos, refrigerados ou congelados, filés e carnes de peixes',
      },
      {
        codigo: '0302',
        nome: 'Peixes frescos ou refrigerados',
        desc: 'Salmão, tilápia, truta, atum, bacalhau e outros peixes comestíveis',
      },
      {
        codigo: '0303',
        nome: 'Peixes congelados',
        desc: 'Pescados congelados inteiros e eviscerados para alimentação',
      },
      {
        codigo: '0304',
        nome: 'Filés de peixes e outra carne de peixes',
        desc: 'Filés de tilápia, merluza, salmão frescos, refrigerados ou congelados',
      },
      {
        codigo: '04',
        nome: 'Leite e laticínios; ovos de aves; mel natural',
        desc: 'Leite fluido, leite em pó, manteiga, queijos, iogurtes, ovos e mel',
      },
      {
        codigo: '0401',
        nome: 'Leite e creme de leite, não concentrados',
        desc: 'Leite pasteurizado integral ou desnatado sem adição de açúcar (Cesta Básica)',
      },
      {
        codigo: '0402',
        nome: 'Leite e creme de leite, concentrados ou com adição de açúcar',
        desc: 'Leite em pó integral e desnatado, leite condensado',
      },
      {
        codigo: '0406',
        nome: 'Queijos e requeijão',
        desc: 'Queijo fresco, queijo prato, mussarela, parmesão e requeijão culinário',
      },
      {
        codigo: '0407',
        nome: 'Ovos de aves, com casca, frescos ou conservados',
        desc: 'Ovos de galinha para consumo doméstico (Cesta Básica Nacional)',
      },
      {
        codigo: '05',
        nome: 'Outros produtos de origem animal, não especificados nem compreendidos em outros capítulos',
        desc: 'Cabelos, cerdas, ossos, marfim, tripas e bexigas de animais',
      },

      // Seção II: Produtos do Reino Vegetal
      {
        codigo: '06',
        nome: 'Plantas vivas e produtos de floricultura',
        desc: 'Bulbos, tubérculos, plantas vivas, mudas e flores cortadas para buquês',
      },
      {
        codigo: '07',
        nome: 'Produtos hortícolas, plantas, raízes e tubérculos, comestíveis',
        desc: 'Batatas, tomates, cebolas, alhos, couves, alfaces, cenouras e feijões',
      },
      {
        codigo: '0701',
        nome: 'Batatas frescas ou refrigeradas',
        desc: 'Batata-inglesa para consumo in natura ou semente (Cesta Básica Nacional)',
      },
      {
        codigo: '0702',
        nome: 'Tomates, frescos ou refrigerados',
        desc: 'Tomates de mesa e rasteiros para consumo e indústria',
      },
      {
        codigo: '0703',
        nome: 'Cebolas, chalotas, alhos, alhos-porós',
        desc: 'Cebolas e alhos frescos ou refrigerados',
      },
      {
        codigo: '0713',
        nome: 'Legumes de vagem, secos, em grão',
        desc: 'Feijões preto, carioca, fradinho, grão-de-bico e lentilhas (Alíquota Zero)',
      },
      {
        codigo: '08',
        nome: 'Frutas; cascas de cítricos e de melões',
        desc: 'Bananas, maçãs, laranjas, uvas, mangas, melões e castanhas',
      },
      {
        codigo: '0803',
        nome: 'Bananas, frescas ou secas',
        desc: 'Bananas prata, nanica, maçã e da terra (Cesta Básica Nacional)',
      },
      {
        codigo: '0804',
        nome: 'Tâmaras, figos, abacaxis, abacates, goiabas, mangas e mangostões',
        desc: 'Frutas tropicais in natura frescas ou refrigeradas',
      },
      {
        codigo: '0805',
        nome: 'Cítricos, frescos ou secos',
        desc: 'Laranjas, tangerinas, limões e limas',
      },
      {
        codigo: '0808',
        nome: 'Maçãs, peras e marmelos, frescos',
        desc: 'Maçãs gala, fuji e peras de mesa',
      },
      {
        codigo: '09',
        nome: 'Café, chá, mate e especiarias',
        desc: 'Café em grão, café torrado, chá-da-índia, erva-mate, pimenta e canela',
      },
      {
        codigo: '0901',
        nome: 'Café, mesmo torrado ou descafeinado; casca e películas',
        desc: 'Café torrado e moído para consumo doméstico (Cesta Básica Nacional)',
      },
      {
        codigo: '0903',
        nome: 'Mate (erva-mate)',
        desc: 'Erva-mate para chimarrão ou tereré e chás',
      },
      {
        codigo: '10',
        nome: 'Cereais',
        desc: 'Trigo, centeio, cevada, aveia, milho, arroz e sorgo',
      },
      {
        codigo: '1001',
        nome: 'Trigo e mistura de trigo com centeio',
        desc: 'Trigo duro e trigo comum para produção de farinhas e pães',
      },
      {
        codigo: '1005',
        nome: 'Milho em grão',
        desc: 'Milho em grão para alimentação humana e ração animal',
      },
      {
        codigo: '1006',
        nome: 'Arroz em grão ou beneficiado',
        desc: 'Arroz com casca, quebrado e arroz polido/parboilizado (Alíquota Zero)',
      },
      {
        codigo: '11',
        nome: 'Produtos da indústria de moagem; malte; amidos e féculas; inulina; glúten de trigo',
        desc: 'Farinha de trigo, fubá, farinha de mandioca e amidos',
      },
      {
        codigo: '1101',
        nome: 'Farinha de trigo ou de mistura de trigo com centeio',
        desc: 'Farinha de trigo especial e comum para panificação (Cesta Básica)',
      },
      {
        codigo: '1106',
        nome: 'Farinhas, sêmolas e pós de legumes de vagem ou raízes',
        desc: 'Farinha de mandioca torrada e polvilho',
      },
      {
        codigo: '12',
        nome: 'Sementes e frutos oleaginosos; grãos e frutos diversos; plantas industriais ou medicinais',
        desc: 'Soja em grãos, amendoim, sementes de girassol e algodão',
      },
      {
        codigo: '1201',
        nome: 'Soja, mesmo triturada',
        desc: 'Grãos de soja para moagem e exportação (Imunidade RT)',
      },
      {
        codigo: '13',
        nome: 'Gomas, resinas e outros sucos e extratos vegetais',
        desc: 'Goma-arábica, látex natural, sucos de alcaçuz e extratos',
      },
      {
        codigo: '14',
        nome: 'Matérias trançáveis e outros produtos de origem vegetal',
        desc: 'Bambus, rotins, palhas e capins para cestaria',
      },

      // Seção III: Gorduras e Óleos
      {
        codigo: '15',
        nome: 'Gorduras e óleos animais ou vegetais; ceras de origem animal ou vegetal',
        desc: 'Óleo de soja, azeite de oliva, margarinas e gorduras vegetais hidrogenadas',
      },
      {
        codigo: '1507',
        nome: 'Óleo de soja e respectivas frações, mesmo refinado',
        desc: 'Óleo de soja refinado em garrafas para consumo doméstico (Cesta Básica)',
      },
      {
        codigo: '1509',
        nome: 'Azeite de oliva e respectivas frações',
        desc: 'Azeite de oliva extravirgem e virgem',
      },
      {
        codigo: '1517',
        nome: 'Margarina; misturas ou preparações alimentícias',
        desc: 'Margarina vegetal cremosa com ou sem sal',
      },

      // Seção IV: Indústrias Alimentares; Bebidas; Tabaco
      {
        codigo: '16',
        nome: 'Preparações de carne, peixes ou crustáceos, moluscos',
        desc: 'Embutidos, salsichas, presuntos, conservas de atum e sardinha',
      },
      {
        codigo: '17',
        nome: 'Açúcares e produtos de confeitaria',
        desc: 'Açúcar de cana cristal e refinado, melaços, balas e caramelos',
      },
      {
        codigo: '1701',
        nome: 'Açúcar de cana ou de beterraba e sacarose quimicamente pura',
        desc: 'Açúcar cristal e refinado de consumo humano (Cesta Básica)',
      },
      {
        codigo: '18',
        nome: 'Cacau e suas preparações',
        desc: 'Cacau em pó, manteiga de cacau e chocolates em barras ou bombons',
      },
      {
        codigo: '19',
        nome: 'Preparações à base de cereais, farinhas, amidos ou féculas ou de leite; produtos de confeitaria',
        desc: 'Pães, massas alimentícias, biscoitos, torradas e bolos',
      },
      {
        codigo: '1902',
        nome: 'Massas alimentícias, mesmo cozidas ou recheadas',
        desc: 'Espaguete, macarrão e massas secas (Cesta Básica Nacional)',
      },
      {
        codigo: '1905',
        nome: 'Pães, biscoitos e outros produtos de padaria',
        desc: 'Pão francês de até 200g (Alíquota Zero) e biscoitos',
      },
      {
        codigo: '20',
        nome: 'Preparações de produtos hortícolas, frutas ou de outras partes de plantas',
        desc: 'Molhos de tomate, sucos de frutas, geleias e conservas',
      },
      {
        codigo: '21',
        nome: 'Preparações alimentícias diversas',
        desc: 'Cafés solúveis, extratos, leveduras, condimentos, maioneses e caldos',
      },
      {
        codigo: '22',
        nome: 'Bebidas, líquidos alcoólicos e vinagres',
        desc: 'Água mineral, refrigerantes, cervejas, vinhos, destilados e álcool etílico',
      },
      {
        codigo: '2201',
        nome: 'Águas, incluídas as águas minerais naturais',
        desc: 'Água mineral natural envasada sem aditivos',
      },
      {
        codigo: '2202',
        nome: 'Águas aromatizadas, refrigerantes e outras bebidas não alcoólicas',
        desc: 'Refrigerantes, bebidas com sabor e energéticos',
      },
      {
        codigo: '2203',
        nome: 'Cervejas de malte',
        desc: 'Cervejas e chopes industriais e artesanais (Sujeito a Imposto Seletivo)',
      },
      {
        codigo: '2204',
        nome: 'Vinhos de uvas frescas; mostos de uvas',
        desc: 'Vinhos finos de mesa, espumantes e vinhos licorosos',
      },
      {
        codigo: '2207',
        nome: 'Álcool etílico não desnaturado com teor alcoólico superior a 80%',
        desc: 'Etanol carburante hidratado e anidro (Monofásica)',
      },
      {
        codigo: '2208',
        nome: 'Álcool etílico não desnaturado com teor menor que 80%; aguardentes, licores',
        desc: 'Cachaça, uísque, vodca, rum e aguardentes compostas',
      },
      {
        codigo: '23',
        nome: 'Resíduos e desperdícios das indústrias alimentares; alimentos preparados para animais',
        desc: 'Farelo de soja, polpa cítrica e rações preparadas para animais',
      },
      {
        codigo: '24',
        nome: 'Tabaco e seus sucedâneos manufaturados',
        desc: 'Charutos, cigarrilhas, cigarros e tabaco picado (Sujeito a Imposto Seletivo)',
      },
      {
        codigo: '2402',
        nome: 'Charutos, cigarrilhas e cigarros',
        desc: 'Cigarros contendo tabaco com filtro ou sem filtro',
      },

      // Seção V: Produtos Minerais
      {
        codigo: '25',
        nome: 'Sal; enxofre; terras e pedras; gesso, cal e cimento',
        desc: 'Sal marinho de mesa, areia, brita, argilas, calcário, gesso e cimentos',
      },
      {
        codigo: '2501',
        nome: 'Sal de mesa refinado e sal-gema',
        desc: 'Cloreto de sódio iodado para alimentação humana (Cesta Básica)',
      },
      {
        codigo: '2523',
        nome: 'Cimentos hidráulicos (Portland, aluminosos)',
        desc: 'Cimento Portland cinza e branco em sacos de 50kg ou a granel',
      },
      {
        codigo: '26',
        nome: 'Minérios, escórias e cinzas',
        desc: 'Minério de ferro, minério de manganês, cobre e bauxita (Sujeito a IS extração)',
      },
      {
        codigo: '2601',
        nome: 'Minérios de ferro e seus concentrados',
        desc: 'Pelotas de minério de ferro e finos hematíticos',
      },
      {
        codigo: '27',
        nome: 'Combustíveis minerais, óleos minerais e produtos da sua destilação; matérias betuminosas; ceras minerais',
        desc: 'Petróleo cru, gasolina, diesel, querosene, GLP, gás natural e eletricidade',
      },
      {
        codigo: '2709',
        nome: 'Óleos brutos de petróleo ou de minerais betuminosos',
        desc: 'Petróleo cru extraído para refino ou exportação (Sujeito a IS extração)',
      },
      {
        codigo: '2710',
        nome: 'Óleos de petróleo refinados: gasolinas, óleos diesel, querosenes e lubrificantes',
        desc: 'Combustíveis automotivos (Tributação monofásica por unidade de medida)',
      },
      {
        codigo: '2711',
        nome: 'Gás de petróleo liquefeito (GLP) e outros hidrocarbonetos gasosos',
        desc: 'GLP para botijão residencial de 13kg e gás natural veicular',
      },
      {
        codigo: '2716',
        nome: 'Energia elétrica',
        desc: 'Energia elétrica em megawatts-hora no SIN',
      },

      // Seção VI: Produtos das Indústrias Químicas
      {
        codigo: '28',
        nome: 'Produtos químicos inorgânicos; compostos de metais preciosos, terras raras e radioativos',
        desc: 'Ácido sulfúrico, ácido clorídrico, soda cáustica, cloro e oxigênio',
      },
      {
        codigo: '29',
        nome: 'Produtos químicos orgânicos',
        desc: 'Hidrocarbonetos, álcoois industriais, fenóis, éteres e ácidos carboxílicos',
      },
      {
        codigo: '30',
        nome: 'Produtos farmacêuticos',
        desc: 'Medicamentos, vacinas, reagentes diagnósticos e anestésicos (Redução 60% ou Isenção)',
      },
      {
        codigo: '3003',
        nome: 'Medicamentos constituídos por produtos misturados entre si',
        desc: 'Medicamentos não apresentados em doses medicinais',
      },
      {
        codigo: '3004',
        nome: 'Medicamentos em doses constituídos por produtos misturados ou não',
        desc: 'Antibióticos, analgésicos, anti-hipertensivos em comprimidos ou xaropes',
      },
      {
        codigo: '3005',
        nome: 'Pastas, gazes, ataduras e artigos análogos',
        desc: 'Artigos para curativos impregnados de substâncias farmacêuticas',
      },
      {
        codigo: '31',
        nome: 'Adubos ou fertilizantes',
        desc: 'Ureia, sulfato de amônio, superfosfatos e misturas NPK para agricultura',
      },
      {
        codigo: '32',
        nome: 'Extratos tanantes e tintoriais; taninos e seus derivados; corantes, tintas e vernizes',
        desc: 'Tintas imobiliárias, automotivas, vernizes, pigmentos e mastiques',
      },
      {
        codigo: '33',
        nome: 'Óleos essenciais e resinoides; produtos de perfumaria ou de toucador preparados e preparações cosméticas',
        desc: 'Perfumes, sabonetes, dentifrícios, xampus e desodorantes',
      },
      {
        codigo: '34',
        nome: 'Sabões, agentes orgânicos de superfície, preparações para lavagem, velas e pastas de modelar',
        desc: 'Detergentes em pó ou líquidos, sabão em barra e ceras',
      },
      {
        codigo: '35',
        nome: 'Matérias albuminoides; produtos à base de amidos modificados; colas; enzimas',
        desc: 'Caseínas, albuminas, gelatinas e colas industriais',
      },
      {
        codigo: '36',
        nome: 'Pólvoras e explosivos; artigos de pirotecnia; fósforos; ligas pirofóricas',
        desc: 'Explosivos industriais para mineração, detonadores e fogos de artifício',
      },
      {
        codigo: '37',
        nome: 'Produtos para fotografia e cinematografia',
        desc: 'Filmes radiográficos e reveladores para exames médicos',
      },
      {
        codigo: '38',
        nome: 'Produtos diversos das indústrias químicas',
        desc: 'Defensivos agrícolas, fungicidas, herbicidas, aditivos e catalisadores',
      },

      // Seção VII: Plásticos e Borracha
      {
        codigo: '39',
        nome: 'Plásticos e suas obras',
        desc: 'Polímeros de etileno, propileno, PVC em resina, chapas, filmes, tubos e embalagens',
      },
      {
        codigo: '3917',
        nome: 'Tubos e acessórios para canalizações, de plásticos',
        desc: 'Tubos de PVC para água fria e esgoto predial',
      },
      {
        codigo: '40',
        nome: 'Borracha e suas obras',
        desc: 'Borracha natural e sintética, pneus, correias, mangueiras e guarnições',
      },
      {
        codigo: '4011',
        nome: 'Pneumáticos novos, de borracha',
        desc: 'Pneus para automóveis, caminhões, ônibus, motos e tratores agrícolas',
      },

      // Seção VIII: Peles, Couros e Calçados
      {
        codigo: '41',
        nome: 'Peles e couros, exceto a peleteria',
        desc: 'Couro bovino curtido integral para calçados, bolsas e estofamento',
      },
      {
        codigo: '42',
        nome: 'Obras de couro; artigos de seleiro e de correeiro; artigos de viagem, bolsas',
        desc: 'Malas, bolsas, carteiras de couro natural ou sintético',
      },
      {
        codigo: '43',
        nome: 'Peleteria (peles com pelo) e suas obras; peleteria artificial',
        desc: 'Peles inteiras com pelo para vestuário e adornos',
      },

      // Seção IX: Madeiras e Obras de Madeira
      {
        codigo: '44',
        nome: 'Madeira, carvão vegetal e obras de madeira',
        desc: 'Madeira serrada, compensados, MDF, pallets de madeira e carvão',
      },
      {
        codigo: '45',
        nome: 'Cortiça e suas obras',
        desc: 'Rolhas de cortiça natural ou aglomerada para garrafas de vinho',
      },
      {
        codigo: '46',
        nome: 'Obras de espartaria ou de cestaria',
        desc: 'Cestos e esteiras tecidas de fibras vegetais',
      },

      // Seção X: Papel, Cartão e Gráfica
      {
        codigo: '47',
        nome: 'Pastas de madeira ou de outras matérias fibrosas celulósicas; papel ou cartão reciclado',
        desc: 'Celulose solúvel e branqueada de eucalipto para exportação',
      },
      {
        codigo: '48',
        nome: 'Papel e cartão; obras de pasta de celulose, de papel ou de cartão',
        desc: 'Papel kraft, papel tissue, caixas de papelão ondulado e cadernos',
      },
      {
        codigo: '4818',
        nome: 'Papel higiênico, lenços, toalhas de mão e fraldas descartáveis',
        desc: 'Artigos higiênicos absorventes de uso pessoal e doméstico',
      },
      {
        codigo: '49',
        nome: 'Livros, jornais, gravuras e outros produtos das indústrias gráficas',
        desc: 'Livros didáticos, técnicos, jornais e periódicos (Imunidade Constitucional)',
      },

      // Seção XI: Matérias Têxteis e suas Obras
      { codigo: '50', nome: 'Seda', desc: 'Casulos de bicho-da-seda e tecidos de seda pura' },
      {
        codigo: '51',
        nome: 'Lã, pelos finos ou grosseiros; fios e tecidos de crina',
        desc: 'Lã tosquiada e fiação para tecidos de inverno',
      },
      {
        codigo: '52',
        nome: 'Algodão',
        desc: 'Algodão em pluma, fios de algodão penteado e tecidos para confecção',
      },
      {
        codigo: '53',
        nome: 'Outras fibras têxteis vegetais; fios de papel e tecidos de fios de papel',
        desc: 'Linho, juta, rami e sisal para cordoaria',
      },
      {
        codigo: '54',
        nome: 'Filamentos sintéticos ou artificiais; lâminas e formas semelhantes',
        desc: 'Fios têxteis contínuos de náilon, poliéster e elastano',
      },
      {
        codigo: '55',
        nome: 'Fibras sintéticas ou artificiais, descontinuadas',
        desc: 'Fibras acrílicas e de poliéster para fiação industrial',
      },
      {
        codigo: '56',
        nome: 'Pastas (ouates), feltros e falsos tecidos; fios especiais; cordéis e cabos',
        desc: 'TNT para máscaras e vestimentas cirúrgicas descartáveis',
      },
      {
        codigo: '57',
        nome: 'Tapetes e outros revestimentos para pavimentos, de matérias têxteis',
        desc: 'Carpetes tufados e tapetes felpudos de sala e quarto',
      },
      {
        codigo: '58',
        nome: 'Tecidos especiais; tecidos tufados; rendas; tapeçarias; passamanarias; bordados',
        desc: 'Veludos, pelúcias e rendas finas para confecção',
      },
      {
        codigo: '59',
        nome: 'Tecidos impregnados, revestidos, recobertos ou estratificados',
        desc: 'Lonas enceradas, lonas plásticas para caminhões e isolantes',
      },
      {
        codigo: '60',
        nome: 'Tecidos de malha',
        desc: 'Malhas de algodão e viscose para camisetas e vestidos',
      },
      {
        codigo: '61',
        nome: 'Vestuário e seus acessórios, de malha',
        desc: 'Camisetas, camisas polo, agasalhos e calças de moletom',
      },
      {
        codigo: '62',
        nome: 'Vestuário e seus acessórios, exceto de malha',
        desc: 'Calças jeans, ternos, vestidos, camisas sociais e jaquetas',
      },
      {
        codigo: '63',
        nome: 'Outros artefatos têxteis confeccionados; sortidos; artigos de uso usado',
        desc: 'Roupas de cama, toalhas de banho, cortinas e panos de prato',
      },

      // Seção XII: Calçados, Chapéus e Guarda-chuvas
      {
        codigo: '64',
        nome: 'Calçados, polainas e artefatos semelhantes, e suas partes',
        desc: 'Tênis esportivos, sapatos sociais, sandálias de couro e solados',
      },
      {
        codigo: '65',
        nome: 'Chapéus e outros artefatos de uso semelhante, e suas partes',
        desc: 'Bonés, capacetes de proteção industrial e chapéus',
      },
      {
        codigo: '66',
        nome: 'Guarda-chuvas, sombrinhas, guarda-sóis, bengalas, chicotes',
        desc: 'Guarda-chuvas automáticos e sombrinhas de proteção solar',
      },
      {
        codigo: '67',
        nome: 'Penas e penugem preparadas, e suas obras; flores artificiais',
        desc: 'Artigos ornamentais com penas e flores artificiais em tecido',
      },

      // Seção XIII: Obras de Pedra, Gesso, Cimento, Cerâmica e Vidro
      {
        codigo: '68',
        nome: 'Obras de pedra, gesso, cimento, amianto, mica ou de matérias semelhantes',
        desc: 'Ladrilhos de cimento, peças pré-moldadas e placas de gesso acartonado',
      },
      {
        codigo: '69',
        nome: 'Produtos cerâmicos',
        desc: 'Tijolos, telhas, pisos cerâmicos e aparelhos sanitários',
      },
      {
        codigo: '70',
        nome: 'Vidro e suas obras',
        desc: 'Vidro plano float, vidros temperados automotivos e garrafas de embalagem',
      },

      // Seção XIV: Pérolas, Pedras Preciosas e Joias
      {
        codigo: '71',
        nome: 'Pérolas naturais ou cultivadas, pedras preciosas ou semipreciosas, metais preciosos',
        desc: 'Ouro, prata, diamantes e joias lapidadas',
      },

      // Seção XV: Metais Comuns e suas Obras
      {
        codigo: '72',
        nome: 'Ferro fundido, ferro e aço',
        desc: 'Lingotes, placas, bobinas a quente e a frio, vergalhões e arames',
      },
      {
        codigo: '73',
        nome: 'Obras de ferro fundido, ferro ou aço',
        desc: 'Tubos de aço sem costura, estruturas metálicas, parafusos e porcas',
      },
      {
        codigo: '74',
        nome: 'Cobre e suas obras',
        desc: 'Cátodos de cobre, fios condutores e tubos para refrigeração',
      },
      {
        codigo: '75',
        nome: 'Níquel e suas obras',
        desc: 'Ânodos de níquel e ligas para aços especiais',
      },
      {
        codigo: '76',
        nome: 'Alumínio e suas obras',
        desc: 'Chapas laminadas de alumínio, perfis para esquadrias e latas de bebida',
      },
      {
        codigo: '78',
        nome: 'Chumbo e suas obras',
        desc: 'Chumbo em lingotes para baterias automotivas e blindagem',
      },
      {
        codigo: '79',
        nome: 'Zinco e suas obras',
        desc: 'Zinco para galvanização de estruturas metálicas',
      },
      {
        codigo: '80',
        nome: 'Estanho e suas obras',
        desc: 'Folhas de flandres para latas de conserva e soldas eletrônicas',
      },
      {
        codigo: '81',
        nome: 'Outros metais comuns; cermetos; obras dessas matérias',
        desc: 'Tungstênio, titânio, tântalo e ferramentas de metal duro',
      },
      {
        codigo: '82',
        nome: 'Ferramentas, artefatos de cutelaria e talheres, de metais comuns',
        desc: 'Chaves de fenda, brocas, martelos, facas de cozinha e talheres',
      },
      {
        codigo: '83',
        nome: 'Obras diversas de metais comuns',
        desc: 'Cadeados, fechaduras, dobradiças, cofres e grampos',
      },

      // Seção XVI: Máquinas e Aparelhos Mecânicos e Elétricos
      {
        codigo: '84',
        nome: 'Reatores nucleares, caldeiras, máquinas, aparelhos e instrumentos mecânicos, e suas partes',
        desc: 'Motores, compressores, bombas, máquinas agrícolas, empilhadeiras e computadores',
      },
      {
        codigo: '8407',
        nome: 'Motores de pistão alternativo ou rotativo, de ignição por centelha',
        desc: 'Motores a gasolina e flex para veículos de passageiros',
      },
      {
        codigo: '8408',
        nome: 'Motores de pistão, de ignição por compressão (diesel ou semidiesel)',
        desc: 'Motores a diesel para caminhões, tratores e geradores',
      },
      {
        codigo: '8413',
        nome: 'Bombas para líquidos, elevadores de líquidos',
        desc: "Bombas d'água centrífugas, bombas injetoras de combustível",
      },
      {
        codigo: '8414',
        nome: 'Bombas de vácuo, compressores de ar ou outros gases e ventiladores',
        desc: 'Compressores de refrigeração e ar condicionado',
      },
      {
        codigo: '8429',
        nome: 'Bulldozers, niveladores, escavadores, pás carregadeiras mecânicas',
        desc: 'Máquinas pesadas de terraplenagem e construção civil',
      },
      {
        codigo: '8432',
        nome: 'Máquinas e aparelhos de uso agrícola, hortícola ou florestal',
        desc: 'Arados, grades, semeadores e adubadores agrícolas',
      },
      {
        codigo: '8433',
        nome: 'Máquinas e aparelhos para colheita ou debulha de produtos agrícolas',
        desc: 'Colheitadeiras de grãos, enfardadeiras e cortadores de grama',
      },
      {
        codigo: '8471',
        nome: 'Máquinas automáticas para processamento de dados e suas unidades',
        desc: 'Servidores de dados, computadores desktop, notebooks e tablets',
      },
      {
        codigo: '85',
        nome: 'Máquinas, aparelhos e materiais elétricos, e suas partes; aparelhos de gravação ou de reprodução de som',
        desc: 'Transformadores, baterias, semicondutores, smartphones, cabos e chips',
      },
      {
        codigo: '8501',
        nome: 'Motores e geradores elétricos',
        desc: 'Motores elétricos industriais e geradores para usinas solares e eólicas',
      },
      {
        codigo: '8504',
        nome: 'Transformadores elétricos, conversores estáticos e indutores',
        desc: 'Inversores solares, transformadores de distribuição predial',
      },
      {
        codigo: '8507',
        nome: 'Acumuladores elétricos (baterias)',
        desc: 'Baterias de chumbo para carros e baterias de íon de lítio',
      },
      {
        codigo: '8517',
        nome: 'Aparelhos telefônicos, incluídos os smartphones, para redes celulares',
        desc: 'Smartphones, roteadores Wi-Fi, switches e estações rádio-base',
      },
      {
        codigo: '8528',
        nome: 'Monitores e projetores; aparelhos receptores de televisão',
        desc: 'Televisores LED/OLED e monitores de vídeo',
      },
      {
        codigo: '8541',
        nome: 'Dispositivos semicondutores; células fotovoltaicas',
        desc: 'Painéis solares fotovoltaicos para energia solar limpa',
      },
      {
        codigo: '8544',
        nome: 'Fios, cabos e outros condutores isolados para eletricidade',
        desc: 'Cabos de fibra óptica e fios de cobre para energia',
      },

      // Seção XVII: Material de Transporte
      {
        codigo: '86',
        nome: 'Veículos e material para vias férreas ou semelhantes; aparelhos mecânicos de sinalização',
        desc: 'Locomotivas diesel-elétricas, vagões de carga e trilhos',
      },
      {
        codigo: '87',
        nome: 'Veículos automóveis, tratores, ciclos e outros veículos terrestres, suas partes e acessórios',
        desc: 'Carros, caminhões, ônibus, motocicletas, reboques e peças automotivas',
      },
      {
        codigo: '8701',
        nome: 'Tratores agrícolas ou rodoviários',
        desc: 'Tratores de rodas agrícolas para lavoura e transporte rural',
      },
      {
        codigo: '8702',
        nome: 'Veículos automóveis para transporte de dez pessoas ou mais',
        desc: 'Ônibus urbanos e rodoviários para transporte público coletivo',
      },
      {
        codigo: '8703',
        nome: 'Automóveis de passageiros e outros veículos para transporte de pessoas',
        desc: 'Veículos de passeio flex, híbridos e elétricos (Sujeito a Imposto Seletivo gradual)',
      },
      {
        codigo: '8704',
        nome: 'Veículos automóveis para transporte de mercadorias',
        desc: 'Caminhões pesados, médios, caminhonetes e utilitários de carga',
      },
      {
        codigo: '8708',
        nome: 'Partes e acessórios dos veículos automóveis das posições 87.01 a 87.05',
        desc: 'Peças e reposições automotivas (freios, caixas, suspensões)',
      },
      {
        codigo: '8711',
        nome: 'Motocicletas e ciclomotores com motor auxiliar',
        desc: 'Motos de baixa e alta cilindrada',
      },
      {
        codigo: '88',
        nome: 'Aeronaves e aparelhos espaciais, e suas partes',
        desc: 'Aviões comerciais a jato, helicópteros, drones e satélites',
      },
      {
        codigo: '8802',
        nome: 'Outros veículos aéreos (por exemplo: aviões, helicópteros)',
        desc: 'Aeronaves de transporte de passageiros Embraer',
      },
      {
        codigo: '89',
        nome: 'Embarcações e estruturas flutuantes',
        desc: 'Navios cargueiros, rebocadores, plataformas de petróleo e lanchas',
      },

      // Seção XVIII: Instrumentos e Aparelhos de Óptica, Médicos e Cirúrgicos
      {
        codigo: '90',
        nome: 'Instrumentos e aparelhos de óptica, de fotografia, médicos, cirúrgicos e de precisão',
        desc: 'Equipamentos de ressonância magnética, tomógrafos, óculos e medidores',
      },
      {
        codigo: '9018',
        nome: 'Instrumentos e aparelhos para medicina, cirurgia, odontologia ou veterinária',
        desc: 'Aparelhos de eletrodiagnóstico, seringas, agulhas e bisturis (Redução 60%)',
      },
      {
        codigo: '9021',
        nome: 'Artigos e aparelhos ortopédicos, próteses e aparelhos para facilitar a audição',
        desc: 'Próteses articulares, marca-passos cardíacos e lentes intraoculares (Isenção)',
      },
      {
        codigo: '91',
        nome: 'Aparelhos de relojoaria e suas partes',
        desc: 'Relógios de pulso, smartwatches e despertadores',
      },
      {
        codigo: '92',
        nome: 'Instrumentos musicais; suas partes e acessórios',
        desc: 'Pianos, guitarras, baterias e violinos',
      },

      // Seção XIX: Armas e Munições
      {
        codigo: '93',
        nome: 'Armas e munições; suas partes e acessórios',
        desc: 'Revólveres, pistolas, espingardas e cartuchos (Sujeito a Imposto Seletivo)',
      },

      // Seção XX: Mercadorias e Produtos Diversos
      {
        codigo: '94',
        nome: 'Móveis; mobiliário médico-cirúrgico; colchões; aparelhos de iluminação',
        desc: 'Móveis residenciais de madeira ou metal, colchões ortopédicos e luminárias',
      },
      {
        codigo: '95',
        nome: 'Brinquedos, jogos, artigos para divertimento ou para esporte',
        desc: 'Bonecas, jogos de tabuleiro, videogames e bolas de futebol',
      },
      {
        codigo: '96',
        nome: 'Obras diversas (canetas, botões, fechos, escovas de dente)',
        desc: 'Canetas esferográficas, escovas dentais e isqueiros',
      },

      // Seção XXI: Obras de Arte e Antiguidades
      {
        codigo: '97',
        nome: 'Objetos de arte, de coleção e antiguidades',
        desc: 'Pinturas, gravuras, esculturas originais e selos postais de coleção',
      },
    ]

    for (let i = 0; i < ncmList.length; i++) {
      const item = ncmList[i]
      try {
        app
          .db()
          .newQuery(`
          INSERT INTO classifications (id, tipo, codigo, descricao, nome, fonte, tabela_origem, atualizado_em, observacoes, created, updated)
          VALUES ({:id}, 'NCM', {:codigo}, {:descricao}, {:nome}, {:fonte}, {:tabela_origem}, {:atualizado_em}, {:observacoes}, {:now}, {:now})
          ON CONFLICT(tipo, codigo) DO UPDATE SET
            descricao = {:descricao},
            nome = {:nome},
            fonte = {:fonte},
            tabela_origem = {:tabela_origem},
            atualizado_em = {:atualizado_em},
            observacoes = {:observacoes},
            updated = {:now}
        `)
          .bind({
            id: 'ncm-cap-' + item.codigo.toLowerCase(),
            codigo: item.codigo,
            descricao: item.desc,
            nome: item.nome,
            fonte: fonte,
            tabela_origem: tabelaOrigem,
            atualizado_em: refData,
            observacoes: 'Capítulo/Posição SH/NCM oficial — MDIC/Siscomex/Receita Federal',
            now: now,
          })
          .execute()
      } catch (err) {
        console.log('[0056_seed_ncm error] ' + String(err))
      }
    }
  },
  (app) => {
    try {
      app.db().newQuery("DELETE FROM classifications WHERE id LIKE 'ncm-cap-%'").execute()
    } catch (_) {}
  },
)
