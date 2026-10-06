/// <reference path="../pb_data/types.d.ts" />
// 0055 - Seed oficial estendido para tabelas CEST e CFOP
// Fonte oficial: Convênio ICMS 142/2018 (CONFAZ) e Ajuste SINIEF s/nº de 1970 consolidado

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('classifications')
    const now = new Date().toISOString()

    const cestRecords = [
      // Segmento 01 - Autopeças
      {
        codigo: '01.001.00',
        nome: 'Autopeças — Catalisadores automotivos',
        descricao: 'Catalisadores em colmeia cerâmica ou metálica para veículos automotores',
        observacoes: 'NCM 8421.39.90 — Anexo II (Autopeças)',
      },
      {
        codigo: '01.002.00',
        nome: 'Autopeças — Tubos e mangueiras de borracha vulcanizada',
        descricao: 'Tubos, tubos flexíveis e mangueiras de borracha vulcanizada não endurecida',
        observacoes: 'NCM 4009 — Anexo II (Autopeças)',
      },
      {
        codigo: '01.003.00',
        nome: 'Autopeças — Correias transportadoras ou de transmissão',
        descricao: 'Correias transportadoras ou de transmissão de borracha vulcanizada',
        observacoes: 'NCM 4010.3 — Anexo II (Autopeças)',
      },
      {
        codigo: '01.004.00',
        nome: 'Autopeças — Pneus novos de borracha',
        descricao: 'Pneus novos de borracha dos tipos utilizados em automóveis e caminhonetes',
        observacoes: 'NCM 4011.10.00 / 4011.20 — Anexo II e Anexo XVI',
      },
      {
        codigo: '01.005.00',
        nome: 'Autopeças — Câmaras de ar de borracha',
        descricao: 'Câmaras de ar de borracha dos tipos utilizados em automóveis de passageiros',
        observacoes: 'NCM 4013.10.90 — Anexo II',
      },
      {
        codigo: '01.006.00',
        nome: 'Autopeças — Vidros de segurança temperados ou laminados',
        descricao: 'Vidros de segurança temperados ou laminados com dimensões para automóveis',
        observacoes: 'NCM 7007.11.00 / 7007.21.00 — Anexo II',
      },
      {
        codigo: '01.007.00',
        nome: 'Autopeças — Espelhos retrovisores para veículos automotores',
        descricao: 'Espelhos retrovisores mesmo com suportes para veículos automotores',
        observacoes: 'NCM 7009.10.00 — Anexo II',
      },
      {
        codigo: '01.008.00',
        nome: 'Autopeças — Fechaduras e guarnições para veículos',
        descricao: 'Guarnições, ferragens e artigos semelhantes de metais comuns para veículos',
        observacoes: 'NCM 8301.20.00 / 8302.30.00 — Anexo II',
      },
      {
        codigo: '01.009.00',
        nome: 'Autopeças — Motores de pistão e peças',
        descricao: 'Motores de pistão alternativo e suas peças exclusivas ou principais',
        observacoes: 'NCM 8407.34.90 / 8409.91 — Anexo II',
      },
      {
        codigo: '01.010.00',
        nome: 'Autopeças — Bombas para combustíveis e líquidos de arrefecimento',
        descricao: 'Bombas para combustíveis, óleos ou líquidos de arrefecimento de motores',
        observacoes: 'NCM 8413.30 — Anexo II',
      },
      {
        codigo: '01.011.00',
        nome: 'Autopeças — Compressores para ar condicionado automotivo',
        descricao: 'Compressores dos tipos utilizados em equipamento de climatização automotivo',
        observacoes: 'NCM 8414.30.91 / 8414.80.19 — Anexo II',
      },
      {
        codigo: '01.012.00',
        nome: 'Autopeças — Filtros de combustível e ar',
        descricao: 'Filtros de óleo, combustível e de ar para admissão em motores de ignição',
        observacoes: 'NCM 8421.23.00 / 8421.31.00 — Anexo II',
      },
      {
        codigo: '01.013.00',
        nome: 'Autopeças — Válvulas redutoras e termostáticas',
        descricao: 'Válvulas termostáticas, de alívio e torneiras para regulação de fluxo',
        observacoes: 'NCM 8481.80.21 / 8481.80.99 — Anexo II',
      },
      {
        codigo: '01.014.00',
        nome: 'Autopeças — Rolamentos de esferas ou de roletes',
        descricao: 'Rolamentos de esferas ou de cilindros e suas partes para cubo de roda',
        observacoes: 'NCM 8482.10 / 8482.20 — Anexo II',
      },
      {
        codigo: '01.015.00',
        nome: 'Autopeças — Árvores de transmissão e mancais',
        descricao: 'Árvores de transmissão, manivelas, eixos de excêntricos e volantes',
        observacoes: 'NCM 8483.10 / 8483.50 — Anexo II',
      },
      {
        codigo: '01.016.00',
        nome: 'Autopeças — Juntas de vedação e de estanqueidade',
        descricao: 'Juntas metaloplásticas e jogos de juntas mecânicas para cabeçote',
        observacoes: 'NCM 8484.10.00 — Anexo II',
      },
      {
        codigo: '01.017.00',
        nome: 'Autopeças — Motores elétricos de arranque e dínamos',
        descricao:
          'Motores de arranque, geradores de corrente contínua ou alternada (alternadores)',
        observacoes: 'NCM 8511.40.00 / 8511.50.00 — Anexo II',
      },
      {
        codigo: '01.018.00',
        nome: 'Autopeças — Velas de ignição ou de aquecimento',
        descricao: 'Velas de ignição e bobinas de ignição para motores de combustão',
        observacoes: 'NCM 8511.10.00 / 8511.30.20 — Anexo II',
      },
      {
        codigo: '01.019.00',
        nome: 'Autopeças — Faróis, lanternas e limpadores de para-brisa',
        descricao: 'Aparelhos de iluminação ou de sinalização visual e limpadores elétricos',
        observacoes: 'NCM 8512.20.00 / 8512.40.00 — Anexo II',
      },
      {
        codigo: '01.020.00',
        nome: 'Autopeças — Freios e servo-freios e suas partes',
        descricao: 'Freios mecânicos e hidráulicos, servo-freios, pastilhas e discos de freio',
        observacoes: 'NCM 8708.30 — Anexo II',
      },
      {
        codigo: '01.021.00',
        nome: 'Autopeças — Caixas de marcha e embreagens',
        descricao: 'Caixas de marchas manuais ou automáticas, embreagens e suas peças',
        observacoes: 'NCM 8708.40 / 8708.93 — Anexo II',
      },
      {
        codigo: '01.022.00',
        nome: 'Autopeças — Eixos e seus componentes',
        descricao: 'Eixos motores com diferencial mesmo com outros componentes e não motores',
        observacoes: 'NCM 8708.50 — Anexo II',
      },
      {
        codigo: '01.023.00',
        nome: 'Autopeças — Rodas e suas partes e acessórios',
        descricao: 'Rodas de liga leve ou estampadas e guarnições de calotas',
        observacoes: 'NCM 8708.70 — Anexo II',
      },
      {
        codigo: '01.024.00',
        nome: 'Autopeças — Sistemas de suspensão e amortecedores',
        descricao:
          'Amortecedores de suspensão dianteiros e traseiros, molas e barras estabilizadoras',
        observacoes: 'NCM 8708.80 — Anexo II',
      },
      {
        codigo: '01.025.00',
        nome: 'Autopeças — Radiadores e sistemas de arrefecimento',
        descricao: 'Radiadores para refrigeração do motor e suas peças de reposição',
        observacoes: 'NCM 8708.91.00 — Anexo II',
      },
      {
        codigo: '01.026.00',
        nome: 'Autopeças — Silenciosos e tubos de escape',
        descricao: 'Tubos de escape, silenciosos intermediários e finais automotivos',
        observacoes: 'NCM 8708.92.00 — Anexo II',
      },
      {
        codigo: '01.027.00',
        nome: 'Autopeças — Direções mecânicas, hidráulicas e elétricas',
        descricao: 'Volantes, colunas e caixas de direção completas ou partes',
        observacoes: 'NCM 8708.94 — Anexo II',
      },
      {
        codigo: '01.028.00',
        nome: 'Autopeças — Airbags e cintos de segurança',
        descricao: 'Cintos de segurança de fixação múltipla e almofadas infláveis (airbags)',
        observacoes: 'NCM 8708.21.00 / 8708.95 — Anexo II',
      },

      // Segmento 02 - Bebidas alcoólicas, exceto cerveja e chope
      {
        codigo: '02.001.00',
        nome: 'Bebidas — Vinhos de uvas frescas e espumantes',
        descricao: 'Vinhos de uvas frescas incluindo os enriquecidos com álcool e mostos',
        observacoes: 'NCM 2204 — Anexo III (Bebidas Alcoólicas)',
      },
      {
        codigo: '02.002.00',
        nome: 'Bebidas — Vermutes e outros vinhos aromatizados',
        descricao:
          'Vermutes e outros vinhos de uvas frescas aromatizados com plantas ou substâncias aromáticas',
        observacoes: 'NCM 2205 — Anexo III',
      },
      {
        codigo: '02.003.00',
        nome: 'Bebidas — Outras bebidas fermentadas (cidra, hidromel)',
        descricao: 'Cidra, perada, hidromel, saquê e misturas de bebidas fermentadas',
        observacoes: 'NCM 2206.00 — Anexo III',
      },
      {
        codigo: '02.004.00',
        nome: 'Bebidas — Aguardente e cachaça',
        descricao: 'Aguardente de cana de açúcar (cachaça) e aguardentes compostas',
        observacoes: 'NCM 2208.40.00 — Anexo III',
      },
      {
        codigo: '02.005.00',
        nome: 'Bebidas — Uísques e vodcas',
        descricao: 'Uísque (whisky), vodca e outras aguardentes destiladas de cereais',
        observacoes: 'NCM 2208.30 / 2208.60 — Anexo III',
      },
      {
        codigo: '02.006.00',
        nome: 'Bebidas — Gin, rum e genebra',
        descricao: 'Gim (gin) e aguardente de bagaço de uva (grappa)',
        observacoes: 'NCM 2208.50.00 — Anexo III',
      },
      {
        codigo: '02.007.00',
        nome: 'Bebidas — Licores e bebidas espirituosas',
        descricao: 'Licores finos e outras bebidas espirituosas de frutas ou café',
        observacoes: 'NCM 2208.70.00 — Anexo III',
      },

      // Segmento 03 - Cervejas, chopes, refrigerantes, águas e outras bebidas
      {
        codigo: '03.001.00',
        nome: 'Cervejas e chopes',
        descricao: 'Cerveja de malte e chope em embalagens retornáveis ou descartáveis',
        observacoes: 'NCM 2203.00.00 — Anexo IV',
      },
      {
        codigo: '03.002.00',
        nome: 'Refrigerantes e isotônicos',
        descricao: 'Refrigerantes com sabor de frutas, cola, guaraná e bebidas isotônicas',
        observacoes: 'NCM 2202.10.00 — Anexo IV',
      },
      {
        codigo: '03.003.00',
        nome: 'Águas minerais, potáveis de mesa e gasosas',
        descricao: 'Águas minerais naturais ou gaseificadas, sem adição de açúcar ou edulcorante',
        observacoes: 'NCM 2201.10.00 — Anexo IV',
      },
      {
        codigo: '03.004.00',
        nome: 'Bebidas energéticas e repositores eletrolíticos',
        descricao: 'Bebidas energéticas e compostos líquidos prontos para consumo',
        observacoes: 'NCM 2202.99.00 — Anexo IV',
      },
      {
        codigo: '03.005.00',
        nome: 'Xaropes e concentrados para preparo de refrigerantes',
        descricao: 'Preparações compostas não alcoólicas para elaboração de bebidas',
        observacoes: 'NCM 2106.90.10 — Anexo IV',
      },

      // Segmento 04 - Cigarros e produtos derivados do fumo
      {
        codigo: '04.001.00',
        nome: 'Charutos e cigarrilhas',
        descricao: 'Charutos e cigarrilhas contendo tabaco ou sucedâneos do tabaco',
        observacoes: 'NCM 2402.10.00 — Anexo V',
      },
      {
        codigo: '04.002.00',
        nome: 'Cigarros contendo tabaco',
        descricao: 'Cigarros contendo tabaco com filtro ou sem filtro',
        observacoes: 'NCM 2402.20.00 — Anexo V (Imposto Seletivo na RT)',
      },
      {
        codigo: '04.003.00',
        nome: 'Fumo para cachimbo ou para cigarros',
        descricao: 'Outros tabacos manufaturados e sucedâneos de tabaco homogeneizados',
        observacoes: 'NCM 2403.19.00 — Anexo V',
      },

      // Segmento 05 - Cimentos
      {
        codigo: '05.001.00',
        nome: 'Cimentos Portland e cimentos aluminosos',
        descricao: 'Cimentos Portland cinza, branco, aluminosos e cimentos hidráulicos',
        observacoes: 'NCM 2523.29.10 / 2523.29.90 — Anexo VI',
      },

      // Segmento 06 - Combustíveis e lubrificantes
      {
        codigo: '06.001.00',
        nome: 'Combustíveis — Gasolina automotiva',
        descricao: 'Gasolina de aviação e gasolina automotiva comum e aditivada',
        observacoes: 'NCM 2710.12.59 — Anexo VII (Tributação monofásica)',
      },
      {
        codigo: '06.002.00',
        nome: 'Combustíveis — Óleo diesel e biodiesel',
        descricao: 'Óleo diesel S10, S500 e misturas de biodiesel B100',
        observacoes: 'NCM 2710.19.21 / 3826.00.00 — Anexo VII',
      },
      {
        codigo: '06.003.00',
        nome: 'Combustíveis — Gás Liquefeito de Petróleo (GLP)',
        descricao: 'Gás de petróleo liquefeito de uso doméstico (botijão) e industrial',
        observacoes: 'NCM 2711.19.10 — Anexo VII (Monofásica)',
      },
      {
        codigo: '06.004.00',
        nome: 'Combustíveis — Gás Natural Veicular (GNV)',
        descricao: 'Gás natural liquefeito ou gasoso para utilização automotiva',
        observacoes: 'NCM 2711.21.00 — Anexo VII',
      },
      {
        codigo: '06.005.00',
        nome: 'Combustíveis — Etanol combustível (hidratado/anidro)',
        descricao: 'Álcool etílico com teor alcoólico superior ou igual a 80% em volume',
        observacoes: 'NCM 2207.10.90 / 2207.20.19 — Anexo VII',
      },
      {
        codigo: '06.006.00',
        nome: 'Lubrificantes — Óleos lubrificantes de petróleo',
        descricao: 'Óleos lubrificantes com teor mínimo de 70% em peso de óleos de petróleo',
        observacoes: 'NCM 2710.19.32 — Anexo VII',
      },
      {
        codigo: '06.007.00',
        nome: 'Graxas e fluidos hidráulicos',
        descricao: 'Graxas lubrificantes minerais e fluidos para transmissões automotivas',
        observacoes: 'NCM 2710.19.31 / 2710.19.99 — Anexo VII',
      },

      // Segmento 07 - Energia elétrica
      {
        codigo: '07.001.00',
        nome: 'Energia elétrica',
        descricao: 'Energia elétrica comercializada no ambiente regulado ou livre',
        observacoes: 'NCM 2716.00.00 — Anexo VIII',
      },

      // Segmento 08 - Ferramentas
      {
        codigo: '08.001.00',
        nome: 'Ferramentas manuais de corte e desbaste',
        descricao: 'Serras e lâminas de serras manuais de metais comuns',
        observacoes: 'NCM 8202 — Anexo IX',
      },
      {
        codigo: '08.002.00',
        nome: 'Alicates, tenazes e ferramentas manuais',
        descricao: 'Alicates, tenazes, pinças e corta-tubos de metais comuns',
        observacoes: 'NCM 8203.20 — Anexo IX',
      },
      {
        codigo: '08.003.00',
        nome: 'Chaves de fenda, boca e de aperto manual',
        descricao: 'Chaves de fenda, chaves sextavadas e de estria para oficinas mecânicas',
        observacoes: 'NCM 8204 / 8205.40 — Anexo IX',
      },
      {
        codigo: '08.004.00',
        nome: 'Martelos, marretas e macetes',
        descricao: 'Martelos e marretas manuais com cabeça de aço ou bronze',
        observacoes: 'NCM 8205.20.00 — Anexo IX',
      },

      // Segmento 09 - Lâmpadas, reatores e "starter"
      {
        codigo: '09.001.00',
        nome: 'Lâmpadas elétricas incandescentes e de descarga',
        descricao: 'Lâmpadas halógenas de tungstênio e incandescentes',
        observacoes: 'NCM 8539.2 — Anexo X',
      },
      {
        codigo: '09.002.00',
        nome: 'Lâmpadas de LED (diodos emissores de luz)',
        descricao: 'Lâmpadas de LED para iluminação residencial e pública',
        observacoes: 'NCM 8539.50.00 / 8539.52.00 — Anexo X',
      },
      {
        codigo: '09.003.00',
        nome: 'Reatores para lâmpadas ou tubos de descarga',
        descricao: 'Reatores eletrônicos e magnéticos para acendimento de lâmpadas',
        observacoes: 'NCM 8504.10.00 — Anexo X',
      },

      // Segmento 10 - Materiais de construção e congêneres
      {
        codigo: '10.001.00',
        nome: 'Tubos e conexões de PVC e plásticos',
        descricao: 'Tubos, canos e acessórios para canalizações prediais de PVC',
        observacoes: 'NCM 3917 — Anexo XI',
      },
      {
        codigo: '10.002.00',
        nome: 'Revestimentos de pisos e paredes em plástico',
        descricao: 'Revestimentos de pavimentos e pisos vinílicos em rolos ou placas',
        observacoes: 'NCM 3918 — Anexo XI',
      },
      {
        codigo: '10.003.00',
        nome: 'Portas, janelas e caixilhos de plástico ou alumínio',
        descricao: 'Portas e janelas e seus caixilhos, alizares e soleiras',
        observacoes: 'NCM 3925.20.00 / 7610.10.00 — Anexo XI',
      },
      {
        codigo: '10.004.00',
        nome: 'Pisos e lajotas cerâmicas esmaltadas',
        descricao: 'Placas cerâmicas para pavimentação ou revestimento, vidradas ou esmaltadas',
        observacoes: 'NCM 6907 — Anexo XI',
      },
      {
        codigo: '10.005.00',
        nome: 'Aparelhos sanitários em louça cerâmica',
        descricao: 'Pias, lavatórios, colunas, banheiras e bacias sanitárias',
        observacoes: 'NCM 6910 — Anexo XI',
      },
      {
        codigo: '10.006.00',
        nome: 'Barras de ferro ou aço laminadas para concreto armado',
        descricao: 'Vergalhões e barras com entalhes, cordões ou deformações para construção',
        observacoes: 'NCM 7214.20.00 — Anexo XI',
      },
      {
        codigo: '10.007.00',
        nome: 'Fios e cabos de cobre isolados para eletricidade',
        descricao: 'Condutores elétricos isolados para tensões até 1.000V',
        observacoes: 'NCM 8544.49.00 — Anexo XI',
      },

      // Segmento 11 - Materiais de limpeza
      {
        codigo: '11.001.00',
        nome: 'Sabões em barra e em pó',
        descricao: 'Sabões em barras, pedaços moldados para lavagem de roupas e louças',
        observacoes: 'NCM 3401.19.00 / 3401.20.90 — Anexo XII',
      },
      {
        codigo: '11.002.00',
        nome: 'Detergentes líquidos e pós para lava-louças',
        descricao: 'Preparações tensoativas para limpeza doméstica e industrial',
        observacoes: 'NCM 3402.20.00 / 3402.50.00 — Anexo XII',
      },
      {
        codigo: '11.003.00',
        nome: 'Água sanitária, alvejantes e desinfetantes',
        descricao: 'Desinfetantes domiciliares e hipoclorito de sódio em solução',
        observacoes: 'NCM 2828.90.11 / 3808.94.19 — Anexo XII',
      },
      {
        codigo: '11.004.00',
        nome: 'Amaciantes de roupas e condicionadores têxteis',
        descricao: 'Amaciantes e enxágues têxteis de uso doméstico',
        observacoes: 'NCM 3809.91.90 — Anexo XII',
      },

      // Segmento 12 - Materiais elétricos
      {
        codigo: '12.001.00',
        nome: 'Interruptores, tomadas e plugues elétricos',
        descricao: 'Aparelhos para interrupção, seccionamento e ligação de circuitos prediais',
        observacoes: 'NCM 8536.50.90 / 8536.69.10 — Anexo XIII',
      },
      {
        codigo: '12.002.00',
        nome: 'Disjuntores térmicos e diferenciais',
        descricao: 'Disjuntores termomagnéticos para quadros de distribuição',
        observacoes: 'NCM 8536.20.00 — Anexo XIII',
      },

      // Segmento 13 - Medicamentos e outros produtos farmacêuticos
      {
        codigo: '13.001.00',
        nome: 'Medicamentos e produtos farmacêuticos de uso humano',
        descricao: 'Medicamentos de referência, genéricos e similares para uso humano',
        observacoes: 'NCM 3003 e 3004 — Anexo XIV (PMC Anvisa)',
      },
      {
        codigo: '13.002.00',
        nome: 'Antissoro e frações do sangue',
        descricao: 'Soros imunológicos, vacinas e produtos biotecnológicos humanos',
        observacoes: 'NCM 3002.15 / 3002.20 — Anexo XIV',
      },
      {
        codigo: '13.003.00',
        nome: 'Curativos e algodão hidrófilo esterilizado',
        descricao: 'Pastas, gazes, ataduras e artigos impregnados com substâncias farmacêuticas',
        observacoes: 'NCM 3005.10.10 / 3005.90.90 — Anexo XIV',
      },

      // Segmento 14 - Papéis, plásticos e descartáveis
      {
        codigo: '14.001.00',
        nome: 'Papel higiênico folha simples ou dupla',
        descricao: 'Papel higiênico em rolos de folha simples, dupla ou tripla',
        observacoes: 'NCM 4818.10.00 — Anexo XV',
      },
      {
        codigo: '14.002.00',
        nome: 'Lenços e toalhas de papel de mão e cozinha',
        descricao: 'Toalhas de cozinha e guardanapos em papel absorvente',
        observacoes: 'NCM 4818.20.00 / 4818.30.00 — Anexo XV',
      },

      // Segmento 16 - Pneumáticos, câmaras de ar e protetores
      {
        codigo: '16.001.00',
        nome: 'Pneus para ônibus, caminhões e carretas',
        descricao: 'Pneumáticos novos de borracha para veículos de transporte coletivo e carga',
        observacoes: 'NCM 4011.20.90 — Anexo XVII',
      },
      {
        codigo: '16.002.00',
        nome: 'Pneus para motocicletas e ciclomotores',
        descricao: 'Pneumáticos de borracha para motocicletas, motonetas e triciclos',
        observacoes: 'NCM 4011.40.00 — Anexo XVII',
      },
      {
        codigo: '16.003.00',
        nome: 'Pneus para máquinas agrícolas e terraplenagem',
        descricao: 'Pneumáticos novos para tratores, colheitadeiras e retroescavadeiras',
        observacoes: 'NCM 4011.70.00 / 4011.80.90 — Anexo XVII',
      },

      // Segmento 17 - Produtos alimentícios
      {
        codigo: '17.001.00',
        nome: 'Produtos alimentícios — Chocolates em barras e tabletes',
        descricao: 'Chocolate branco e chocolates em barras, tabletes ou blocos',
        observacoes: 'NCM 1806.31.10 / 1806.31.20 — Anexo XVIII',
      },
      {
        codigo: '17.002.00',
        nome: 'Biscoitos e bolachas derivados de trigo',
        descricao: 'Biscoitos cream cracker, água e sal e biscoitos doces recheados',
        observacoes: 'NCM 1905.31.00 / 1905.90.20 — Anexo XVIII',
      },
      {
        codigo: '17.003.00',
        nome: 'Massas alimentícias secas e instantâneas',
        descricao: 'Macarrão, espaguete e massas de sêmola não cozidas nem recheadas',
        observacoes: 'NCM 1902.19.00 — Anexo XVIII (Cesta Básica Nacional)',
      },
      {
        codigo: '17.004.00',
        nome: 'Óleos comestíveis refinados de soja e milho',
        descricao: 'Óleo vegetal comestível refinado para culinária e frituras',
        observacoes: 'NCM 1507.90.11 / 1515.29.10 — Anexo XVIII',
      },
      {
        codigo: '17.005.00',
        nome: 'Café torrado e moído ou solúvel',
        descricao: 'Café mesmo torrado ou descafeinado e extratos de café solúvel',
        observacoes: 'NCM 0901.21.00 / 2101.11.10 — Anexo XVIII (Cesta Básica)',
      },
      {
        codigo: '17.006.00',
        nome: 'Leite em pó e leite UHT de longa vida',
        descricao: 'Leite integral ou desnatado conservado ou esterilizado UHT',
        observacoes: 'NCM 0401.20.10 / 0402.21.10 — Anexo XVIII (Cesta Básica)',
      },
      {
        codigo: '17.007.00',
        nome: 'Carnes bovinas e suínas desossadas resfriadas',
        descricao: 'Carnes desossadas resfriadas de bovinos e suínos',
        observacoes: 'NCM 0201.30.00 / 0203.19.00 — Anexo XVIII (Cesta Básica)',
      },
      {
        codigo: '17.008.00',
        nome: 'Arroz polido e feijão comum',
        descricao: 'Arroz beneficiado em grãos e feijão preto ou carioca embalados',
        observacoes: 'NCM 1006.30.21 / 0713.33.99 — Anexo XVIII (Alíquota Zero)',
      },

      // Segmento 20 - Produtos de perfumaria, toucador e cosméticos
      {
        codigo: '20.001.00',
        nome: 'Perfumes e águas-de-colônia',
        descricao: 'Extratos finos de perfumes e águas-de-colônia aromáticas',
        observacoes: 'NCM 3303.00 — Anexo XXI',
      },
      {
        codigo: '20.002.00',
        nome: 'Produtos de maquiagem para lábios e olhos',
        descricao: 'Batons, sombras, máscaras de cílios e pós compactos',
        observacoes: 'NCM 3304.10.00 / 3304.20.00 — Anexo XXI',
      },
      {
        codigo: '20.003.00',
        nome: 'Xampus, condicionadores e cremes para cabelo',
        descricao: 'Preparações capilares, xampus e cremes de hidratação',
        observacoes: 'NCM 3305.10.00 / 3305.90.00 — Anexo XXI',
      },
      {
        codigo: '20.004.00',
        nome: 'Pastas de dente e produtos para higiene bucal',
        descricao: 'Dentifrícios e soluções para enxágue antisséptico bucal',
        observacoes: 'NCM 3306.10.00 — Anexo XXI (Higiene Básica)',
      },
      {
        codigo: '20.005.00',
        nome: 'Desodorantes corporais e antitranspirantes',
        descricao: 'Desodorantes e antitranspirantes em aerosol, roll-on ou bastão',
        observacoes: 'NCM 3307.20 — Anexo XXI',
      },

      // Segmento 21 - Tintas, vernizes e outras coberturas
      {
        codigo: '21.001.00',
        nome: 'Tintas, vernizes e outras coberturas',
        descricao: 'Tintas e vernizes à base de polímeros sintéticos dispersos em meio aquoso',
        observacoes: 'NCM 3208 e 3209 — Anexo XXII',
      },
      {
        codigo: '21.002.00',
        nome: 'Solventes, diluentes e removedores',
        descricao: 'Solventes orgânicos compostos, aguarrás e tíneres',
        observacoes: 'NCM 3814.00 — Anexo XXII',
      },
      {
        codigo: '21.003.00',
        nome: 'Massas de polir e ceras preparadas',
        descricao: 'Ceras e pomadas para calçados, encáusticas e massas de polimento',
        observacoes: 'NCM 3405.10.00 / 3405.90.00 — Anexo XXII',
      },

      // Segmento 22 - Veículos automotores novos
      {
        codigo: '22.001.00',
        nome: 'Automóveis de passageiros com motor flex até 2.000cc',
        descricao: 'Automóveis de turismo concebidos principalmente para transporte de passageiros',
        observacoes: 'NCM 8703.22 / 8703.23 — Anexo XXIII',
      },
      {
        codigo: '22.002.00',
        nome: 'Veículos utilitários leves e caminhonetes de carga',
        descricao: 'Veículos automóveis para transporte de mercadorias tipo furgão ou picape',
        observacoes: 'NCM 8704.21 / 8704.31 — Anexo XXIII',
      },

      // Segmento 23 - Veículos de duas e três rodas motorizados
      {
        codigo: '23.001.00',
        nome: 'Motocicletas até 250cc de cilindrada',
        descricao: 'Motocicletas e ciclomotores com motor de pistão alternativo até 250 cm3',
        observacoes: 'NCM 8711.20 — Anexo XXIV',
      },

      // Segmento 28 - Venda de mercadorias pelo sistema porta a porta
      {
        codigo: '28.001.00',
        nome: 'Cosméticos comercializados porta a porta',
        descricao: 'Produtos de toucador e cosméticos distribuídos por venda direta e revendedores',
        observacoes: 'Convênio ICMS 45/99 e 142/2018 — Anexo XXVI',
      },
    ]

    for (let i = 0; i < cestRecords.length; i++) {
      const item = cestRecords[i]
      try {
        app
          .db()
          .newQuery(`
          INSERT INTO classifications (id, tipo, codigo, descricao, nome, fonte, tabela_origem, atualizado_em, observacoes, created, updated)
          VALUES ({:id}, 'CEST', {:codigo}, {:descricao}, {:nome}, 'CONFAZ', 'Convênio ICMS 142/2018 (CONFAZ)', '2026-10-01', {:observacoes}, {:now}, {:now})
          ON CONFLICT(tipo, codigo) DO UPDATE SET
            descricao = {:descricao},
            nome = {:nome},
            fonte = 'CONFAZ',
            tabela_origem = 'Convênio ICMS 142/2018 (CONFAZ)',
            atualizado_em = '2026-10-01',
            observacoes = {:observacoes},
            updated = {:now}
        `)
          .bind({
            id: 'cest-seed-' + (i + 1).toString().padStart(3, '0'),
            codigo: item.codigo,
            descricao: item.descricao,
            nome: item.nome,
            observacoes: item.observacoes,
            now: now,
          })
          .execute()
      } catch (e) {
        console.log('[0055_seed_cest error] ' + String(e))
      }
    }
  },
  (app) => {
    try {
      app.db().newQuery("DELETE FROM classifications WHERE id LIKE 'cest-seed-%'").execute()
    } catch (_) {}
  },
)
