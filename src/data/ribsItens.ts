/**
 * Dados dos itens dos Anexos III, IV e V do RIBS (Resolução CGIBS 6/2026).
 * Fonte: PDF oficial da Resolução (cgibs.gov.br) — extração item a item,
 * verificada contra o texto oficial (artifacts/resolucoes_cgibs/texto/res06.txt).
 * Anexo IV organizado pelas 3 tabelas oficiais (I: bens de capital art. 196;
 * II: tratores/máquinas agrícolas art. 197, I; III: veículos de carga art. 197, II).
 * Anexo V com legislação estadual do AM por item. Anexos I (depreciação) e II
 * (Repetro) entram na próxima parcela com carga sob demanda.
 */

export interface ItemRibs {
  item: string
  desc: string
  ncm: string
  leg?: string
}

export const RIBS_A3_ITENS: ItemRibs[] = [
  { item: 'III-1', desc: 'Trilhos', ncm: '7302.10.10, 7302.10.90' },
  { item: 'III-2', desc: 'Aparelhos e instrumentos de pesagem', ncm: '8423.82.00, 8423.89.00' },
  {
    item: 'III-3',
    desc: 'Talhas, cadernais e moitões; Guinchos e cabrestantes',
    ncm: '8425.11.00, 8425.19.90, 8425.31.10, 8425.31.90, 8425.39.10, 8425.39.90',
  },
  {
    item: 'III-4',
    desc: 'Cábreas; Guindastes, incluídos os de cabo; Pontes rolantes, pórticos de descarga ou de movimentação, pontes-guindastes, carros-pórticos e carros-guindastes',
    ncm: '8426.11.00, 8426.12.00, 8426.19.00, 8426.20.00, 8426.30.00, 8426.41.10, 8426.41.90, 8426.49.00, 8426.91.00, 8426.99.00',
  },
  {
    item: 'III-5',
    desc: 'Empilhadeiras; Outros veículos para movimentação de carga e semelhantes, equipados com dispositivos de elevação',
    ncm: '8427.10.11, 8427.10.19, 8427.20.10, 8427.20.90, 8427.90.00',
  },
  {
    item: 'III-6',
    desc: 'Outras máquinas e aparelhos de elevação, de carga, de descarga ou de movimentação',
    ncm: '8428.10.00, 8428.20.10, 8428.20.90, 8428.32.00, 8428.33.00, 8428.39.10, 8428.39.20, 8428.39.90, 8428.90.20, 8428.90.90',
  },
  {
    item: 'III-7',
    desc: 'Locomotivas e locotratores; Tênderes',
    ncm: '8601.10.00, 8601.20.00, 8602.10.00, 8602.90.00',
  },
  {
    item: 'III-8',
    desc: 'Vagões para transporte de mercadorias sobre vias férreas',
    ncm: '8606.10.00, 8606.20.00, 8606.30.00, 8606.91.00, 8606.92.00, 8606.99.00',
  },
  { item: 'III-9', desc: 'Tratores rodoviários para semi-reboques', ncm: '8701.20.00' },
  {
    item: 'III-10',
    desc: 'Veículos automóveis para transporte de mercadorias',
    ncm: '8704.22.10, 8704.22.90, 8704.23.10, 8704.23.90, 8704.90.00',
  },
  {
    item: 'III-11',
    desc: 'Veículos automóveis sem dispositivo de elevação, dos tipos utilizados em fábricas, armazéns, portos ou aeroportos, para transporte de mercadorias a curtas distâncias',
    ncm: '8709.11.00, 8709.19.00',
  },
  {
    item: 'III-12',
    desc: 'Reboques e semi-reboques, para quaisquer veículos; Outros veículos não autopropulsados',
    ncm: '8716.39.00, 8716.40.00, 8716.80.00',
  },
  { item: 'III-13', desc: 'Aparelhos de raios X', ncm: '9022.19.10, 9022.19.90' },
  {
    item: 'III-14',
    desc: 'Instrumentos e aparelhos para medida ou controle do nível de líquidos',
    ncm: '9026.10.29',
  },
]

export const RIBS_A4_ITENS: ItemRibs[] = [
  { item: 'I-1', desc: 'Motores para aviação', ncm: '8407.10.00' },
  {
    item: 'I-2',
    desc: 'Turborreatores de empuxo (impulso*) não superior a 25 kN',
    ncm: '8411.11.00',
  },
  { item: 'I-3', desc: 'Turborreatores de empuxo (impulso*) superior a 25 kN', ncm: '8411.12.00' },
  { item: 'I-4', desc: 'Turbopropulsores de potência não superior a 1.100 kW', ncm: '8411.21.00' },
  { item: 'I-5', desc: 'Turbopropulsores de potência superior a 1.100 kW', ncm: '8411.22.00' },
  { item: 'I-6', desc: 'Turbinas a gás de potência não superior a 5.000 kW', ncm: '8411.81.00' },
  { item: 'I-7', desc: 'Turbinas a gás de potência superior a 5.000 kW', ncm: '8411.82.00' },
  { item: 'I-8', desc: 'Propulsores a reação, excluindo os turborreatores', ncm: '8412.10.00' },
  { item: 'I-9', desc: 'Aceleradores de partículas', ncm: '8543.10.00' },
  {
    item: 'I-10',
    desc: 'Máquinas e aparelhos de eletrólise, com células de membrana',
    ncm: '8543.30.10',
  },
  {
    item: 'I-11',
    desc: 'Veículos espaciais (incluindo os satélites) e seus veículos de lançamento, e veículos suborbitais',
    ncm: '8802.60.00',
  },
  {
    item: 'I-12',
    desc: 'Aparelhos e dispositivos para lançamento de veículos aéreos, e suas partes; aparelhos e dispositivos para aterrissagem (aterragem) de veículos aéreos em porta-aviões e aparelhos e dispositivos semelhantes, e suas partes',
    ncm: '8805.10.00',
  },
  { item: 'I-13', desc: 'Simuladores de combate aéreo e suas partes', ncm: '8805.21.00' },
  { item: 'I-14', desc: 'Navios de guerra', ncm: '8906.10.00' },
  { item: 'I-15', desc: 'Microscópios eletrônicos', ncm: '9012.10.10' },
  { item: 'I-16', desc: 'Cromatógrafo de fase gasosa', ncm: '9027.20.11' },
  { item: 'I-17', desc: 'Cromatógrafo de fase líquida', ncm: '9027.20.12' },
  {
    item: 'II-1',
    desc: 'Pulverizadores portáteis para agricultura ou horticultura',
    ncm: '8424.41.00',
  },
  {
    item: 'II-2',
    desc: 'Outros pulverizadores para agricultura ou horticultura',
    ncm: '8424.49.00',
  },
  {
    item: 'II-3',
    desc: 'Lagartas (esteiras) de potência no volante inferior a 387,76 kW (520 HP)',
    ncm: '8429.11.90',
  },
  {
    item: 'II-4',
    desc: 'Niveladores, exceto motoniveladores articulados com potência no volante igual ou superior a 205,07 kW (275 HP)',
    ncm: '8429.20.90',
  },
  { item: 'II-5', desc: 'Raspo-transportadores (scrapers), de uso agrícola', ncm: '8429.30.00' },
  { item: 'II-6', desc: 'Compactadores e rolos ou cilindros compressores', ncm: '8429.40.00' },
  {
    item: 'II-7',
    desc: 'Carregadores e pás carregadoras, de carregamento frontal, de potência no volante inferior ou igual a 43,99 kW (59 HP), exceto os carregadores-transportadores e as infraestruturas motoras próprias para receber equipamentos do item 8430.69.1',
    ncm: '8429.51.92, 8430.69.1',
  },
  {
    item: 'II-8',
    desc: 'Carregadores e pás carregadoras, de carregamento frontal, de potência no volante superior a 43,99 kW (59 HP) e inferior a 297,5 kW (399 HP), exceto os carregadores-transportadores e as infraestruturas motoras próprias para receber equipamentos do item 8430.69.1',
    ncm: '8429.51.99, 8430.69.1',
  },
  {
    item: 'II-9',
    desc: 'Escavadores de potência no volante inferior ou igual a 40,3 kW (54 HP)',
    ncm: '8429.52.12',
  },
  {
    item: 'II-10',
    desc: 'Escavadores de potência no volante superior a 40,3 kW (54 HP) e inferior a 484,7 kW (650 HP)',
    ncm: '8429.52.19',
  },
  {
    item: 'II-11',
    desc: 'Pás mecânicas, escavadores, carregadores e pás carregadoras, exceto carregadores e pás carregadoras, de carregamento frontal, e máquinas cuja superestrutura é capaz de efetuar uma rotação de 360°',
    ncm: '8429.59.00',
  },
  { item: 'II-12', desc: 'Arados e charruas', ncm: '8432.10.00' },
  { item: 'II-13', desc: 'Grades de discos', ncm: '8432.21.00' },
  { item: 'II-14', desc: 'Semeadores-adubadores, de plantio direto', ncm: '8432.31.10' },
  {
    item: 'II-15',
    desc: 'Outros semeadores, plantadores e transplantadores, de plantio direto',
    ncm: '8432.31.90',
  },
  { item: 'II-16', desc: 'Semeadores-adubadores, exceto de plantio direto', ncm: '8432.39.10' },
  {
    item: 'II-17',
    desc: 'Outros semeadores, plantadores e transplantadores, exceto de plantio direto',
    ncm: '8432.39.90',
  },
  { item: 'II-18', desc: 'Espalhadores de estrume', ncm: '8432.41.00' },
  { item: 'II-19', desc: 'Distribuidores de adubos (fertilizantes)', ncm: '8432.42.00' },
  {
    item: 'II-20',
    desc: 'Outras máquinas e aparelhos de uso agrícola, hortícola ou florestal, para preparação ou trabalho do solo ou para cultura',
    ncm: '8432.80.00',
  },
  {
    item: 'II-21',
    desc: 'Ceifeiras, incluindo as barras de corte para montagem em tratores, com dispositivo de acondicionamento em fileiras constituído por rotor de dedos e pente',
    ncm: '8433.20.10',
  },
  {
    item: 'II-22',
    desc: 'Outras ceifeiras, incluindo as barras de corte para montagem em tratores, exceto com dispositivo de acondicionamento em fileiras constituído por rotor de dedos e pente',
    ncm: '8433.20.90',
  },
  {
    item: 'II-23',
    desc: 'Outras máquinas e aparelhos para colher e dispor o feno',
    ncm: '8433.30.00',
  },
  {
    item: 'II-24',
    desc: 'Enfardadeiras de palha ou de forragem, incluindo as enfardadeiras-apanhadeiras',
    ncm: '8433.40.00',
  },
  {
    item: 'II-25',
    desc: 'Colheitadeiras combinadas com debulhadoras (ceifeiras-debulhadoras)',
    ncm: '8433.51.00',
  },
  { item: 'II-26', desc: 'Outras máquinas e aparelhos para debulha', ncm: '8433.52.00' },
  { item: 'II-27', desc: 'Máquinas para colheita de raízes ou tubérculos', ncm: '8433.53.00' },
  {
    item: 'II-28',
    desc: 'Com capacidade para trabalhar até dois sulcos de colheita e potência no volante inferior ou igual a 59,7 kW (80 HP)',
    ncm: '8433.59.11',
  },
  { item: 'II-29', desc: 'Outras máquinas e aparelhos para colheita', ncm: '8433.59.90' },
  { item: 'II-30', desc: 'Selecionadores de fruta', ncm: '8433.60.10' },
  {
    item: 'II-31',
    desc: 'Máquinas para limpar ou selecionar ovos, com capacidade superior a 250.000 ovos por hora',
    ncm: '8433.60.21',
  },
  {
    item: 'II-32',
    desc: 'Outras máquinas para limpar ou selecionar ovos, com capacidade inferior ou igual a 250.000 ovos por hora',
    ncm: '8433.60.29',
  },
  {
    item: 'II-33',
    desc: 'Outras máquinas para limpar frutas ou para limpar ou selecionar outros produtos agrícolas',
    ncm: '8433.60.90',
  },
  { item: 'II-34', desc: 'Máquinas de ordenhar', ncm: '8434.10.00' },
  {
    item: 'II-35',
    desc: 'Máquinas e aparelhos para fabricação de vinho, sidra, sucos (sumos) de fruta ou bebidas semelhantes',
    ncm: '8435.10.00',
  },
  {
    item: 'II-36',
    desc: 'Máquinas e aparelhos para preparação de alimentos ou rações para animais',
    ncm: '8436.10.00',
  },
  { item: 'II-37', desc: 'Chocadeiras e criadeiras', ncm: '8436.21.00' },
  { item: 'II-38', desc: 'Partes de máquinas ou aparelhos para avicultura', ncm: '8436.91.00' },
  {
    item: 'II-39',
    desc: 'Partes de máquinas e aparelhos para agricultura, horticultura, silvicultura ou apicultura, incluindo as partes de germinadores equipados com dispositivos mecânicos ou térmicos',
    ncm: '8436.99.00',
  },
  {
    item: 'II-40',
    desc: 'Máquinas para limpeza, seleção ou peneiração de grãos ou de produtos hortícolas secos',
    ncm: '8437.10.00',
  },
  {
    item: 'II-41',
    desc: 'Máquinas e aparelhos para trituração ou moagem de grãos',
    ncm: '8437.80.10',
  },
  {
    item: 'II-42',
    desc: 'Partes de máquinas para limpeza, seleção ou peneiração de grãos ou de produtos hortícolas secos; partes de máquinas e aparelhos para a indústria de moagem ou tratamento de cereais ou de produtos hortícolas secos, exceto do tipo utilizado em fazendas',
    ncm: '8437.90.00',
  },
  { item: 'II-43', desc: 'Tratores de eixo único, incluindo motocultores', ncm: '8701.10.00' },
  { item: 'II-44', desc: 'Tratores de lagartas (esteiras)', ncm: '8701.30.00' },
  {
    item: 'II-45',
    desc: 'Outros tratores com uma potência de motor não superior a 18 kW, exceto tratores de eixo único, tratores rodoviários para semirreboques e tratores de lagartas (esteiras)',
    ncm: '8701.91.00',
  },
  {
    item: 'II-46',
    desc: 'Outros tratores com uma potência de motor superior a 18 kW, mas não superior a 37 kW, exceto tratores de eixo único, tratores rodoviários para semirreboques e tratores de lagartas (esteiras)',
    ncm: '8701.92.00',
  },
  {
    item: 'II-47',
    desc: 'Outros tratores com uma potência de motor superior a 37 kW, mas não superior a 75 kW, exceto tratores de eixo único, tratores rodoviários para semirreboques e tratores de lagartas (esteiras)',
    ncm: '8701.93.00',
  },
  {
    item: 'II-48',
    desc: 'Outros tratores agrícolas de rodas, com uma potência de motor superior a 75 kW, mas não superior a 130 kW, exceto tratores de eixo único, tratores rodoviários para semirreboques, tratores de lagartas (esteiras) e tratores especialmente concebidos para arrastar troncos (log skidders)',
    ncm: '8701.94.90',
  },
  {
    item: 'II-49',
    desc: 'Outros tratores agrícolas de rodas, com uma potência de motor superior a 130 kW, exceto tratores de eixo único, tratores rodoviários para semirreboques, tratores de lagartas (esteiras) e tratores especialmente concebidos para arrastar troncos (log skidders)',
    ncm: '8701.95.90',
  },
  {
    item: 'II-50',
    desc: 'Reboques e semirreboques, autocarregáveis ou autodescarregáveis, para usos agrícolas',
    ncm: '8716.20.00',
  },
  {
    item: 'III-1',
    desc: 'Chassis com motor e cabina, de veículos automóveis para transporte de mercadorias, exceto de camionetas e de caminhonetes de cabine dupla, unicamente com motor de pistão, de ignição por compressão (diesel ou semidiesel), e de peso em carga máxima (bruto) não superior a 5 toneladas',
    ncm: '8704.21.10',
  },
  {
    item: 'III-2',
    desc: 'Veículos automóveis para transporte de mercadorias, unicamente com motor de pistão, de ignição por compressão (diesel ou semidiesel), e de peso em carga máxima (bruto) não superior a 5 toneladas, com caixa basculante',
    ncm: '8704.21.20',
  },
  {
    item: 'III-3',
    desc: 'Veículos automóveis para transporte de mercadorias, unicamente com motor de pistão, de ignição por compressão (diesel ou semidiesel), e de peso em carga máxima (bruto) não superior a 5 toneladas, frigoríficos ou isotérmicos',
    ncm: '8704.21.30',
  },
  {
    item: 'III-4',
    desc: 'Outros veículos automóveis para transporte de mercadorias, exceto camionetas e caminhonetes de cabine dupla, unicamente com motor de pistão, de ignição por compressão (diesel ou semidiesel), e de peso em carga máxima (bruto) não superior a 5 toneladas',
    ncm: '8704.21.90',
  },
  {
    item: 'III-5',
    desc: 'Chassis com motor e cabina, de veículos automóveis para transporte de mercadorias, unicamente com motor de pistão, de ignição por compressão (diesel ou semidiesel), e de peso em carga máxima (bruto) superior a 5 toneladas, mas não superior a 20 toneladas',
    ncm: '8704.22.10',
  },
  {
    item: 'III-6',
    desc: 'Veículos automóveis para transporte de mercadorias, unicamente com motor de pistão, de ignição por compressão (diesel ou semidiesel), e de peso em carga máxima (bruto) superior a 5 toneladas, mas não superior a 20 toneladas, com caixa basculante',
    ncm: '8704.22.20',
  },
  {
    item: 'III-7',
    desc: 'Veículos automóveis para transporte de mercadorias, unicamente com motor de pistão, de ignição por compressão (diesel ou semidiesel), e de peso em carga máxima (bruto) superior a 5 toneladas, mas não superior a 20 toneladas, frigoríficos ou isotérmicos',
    ncm: '8704.22.30',
  },
  {
    item: 'III-8',
    desc: 'Outros veículos automóveis para transporte de mercadorias, unicamente com motor de pistão, de ignição por compressão (diesel ou semidiesel), e de peso em carga máxima (bruto) superior a 5 toneladas, mas não superior a 20 toneladas',
    ncm: '8704.22.90',
  },
  {
    item: 'III-9',
    desc: 'Chassis com motor e cabina, de veículos automóveis para transporte de mercadorias, unicamente com motor de pistão, de ignição por compressão (diesel ou semidiesel), e de peso em carga máxima (bruto) superior a 20 toneladas',
    ncm: '8704.23.10',
  },
  {
    item: 'III-10',
    desc: 'Veículos automóveis para transporte de mercadorias, unicamente com motor de pistão, de ignição por compressão (diesel ou semidiesel), e de peso em carga máxima (bruto) superior a 20 toneladas, com caixa basculante',
    ncm: '8704.23.20',
  },
  {
    item: 'III-11',
    desc: 'Veículos automóveis para transporte de mercadorias, unicamente com motor de pistão, de ignição por compressão (diesel ou semidiesel), e de peso em carga máxima (bruto) superior a 20 toneladas, frigoríficos ou isotérmicos',
    ncm: '8704.23.30',
  },
  {
    item: 'III-12',
    desc: 'Outros veículos automóveis para transporte de mercadorias, unicamente com motor de pistão, de ignição por compressão (diesel ou semidiesel), e de peso em carga máxima (bruto) superior a 20 toneladas',
    ncm: '8704.23.90',
  },
  {
    item: 'III-13',
    desc: 'Chassis com motor e cabina, de veículos automóveis para transporte de mercadorias, exceto de camionetas e de caminhonetes de cabine dupla, unicamente com motor de pistão, de ignição por centelha (faísca), e de peso em carga máxima (bruto) não superior a 5 toneladas',
    ncm: '8704.31.10',
  },
  {
    item: 'III-14',
    desc: 'Veículos automóveis para transporte de mercadorias, unicamente com motor de pistão, de ignição por centelha (faísca), e de peso em carga máxima (bruto) não superior a 5 toneladas, com caixa basculante',
    ncm: '8704.31.20',
  },
  {
    item: 'III-15',
    desc: 'Veículos automóveis para transporte de mercadorias, unicamente com motor de pistão, de ignição por centelha (faísca), e de peso em carga máxima (bruto) não superior a 5 toneladas, frigoríficos ou isotérmicos',
    ncm: '8704.31.30',
  },
  {
    item: 'III-16',
    desc: 'Outros veículos automóveis para transporte de mercadorias, exceto camionetas e caminhonetes de cabine dupla, unicamente com motor de pistão, de ignição por centelha (faísca), e de peso em carga máxima (bruto) não superior a 5 toneladas',
    ncm: '8704.31.90',
  },
  {
    item: 'III-17',
    desc: 'Chassis com motor e cabina, de veículos automóveis para transporte de mercadorias, unicamente com motor de pistão, de ignição por centelha (faísca), e de peso em carga máxima (bruto) superior a 5 toneladas',
    ncm: '8704.32.10',
  },
  {
    item: 'III-18',
    desc: 'Veículos automóveis para transporte de mercadorias, unicamente com motor de pistão, de ignição por centelha (faísca), e de peso em carga máxima (bruto) superior a 5 toneladas, com caixa basculante',
    ncm: '8704.32.20',
  },
  {
    item: 'III-19',
    desc: 'Veículos automóveis para transporte de mercadorias, unicamente com motor de pistão, de ignição por centelha (faísca), e de peso em carga máxima (bruto) superior a 5 toneladas, frigoríficos ou isotérmicos',
    ncm: '8704.32.30',
  },
  {
    item: 'III-20',
    desc: 'Outros veículos automóveis para transporte de mercadorias, unicamente com motor de pistão, de ignição por centelha (faísca), e de peso em carga máxima (bruto) superior a 5 toneladas',
    ncm: '8704.32.90',
  },
  {
    item: 'III-21',
    desc: 'Outros veículos automóveis para transporte de mercadorias, exceto camionetas e caminhonetes de cabine dupla, equipados para propulsão, simultaneamente, com motor de pistão de ignição por compressão (diesel ou semidiesel) e motor elétrico, de peso em carga máxima (bruto) não superior a 5 toneladas',
    ncm: '8704.41.00',
  },
  {
    item: 'III-22',
    desc: 'Outros veículos automóveis para transporte de mercadorias, equipados para propulsão, simultaneamente, com motor de pistão de ignição por compressão (diesel ou semidiesel) e motor elétrico, de peso em carga máxima (bruto) superior a 5 toneladas, mas não superior a 20 toneladas',
    ncm: '8704.42.00',
  },
  {
    item: 'III-23',
    desc: 'Outros veículos automóveis para transporte de mercadorias, equipados para propulsão, simultaneamente, com motor de pistão de ignição por compressão (diesel ou semidiesel) e motor elétrico, de peso em carga máxima (bruto) superior a 20 toneladas',
    ncm: '8704.43.00',
  },
  {
    item: 'III-24',
    desc: 'Outros veículos automóveis para transporte de mercadorias, exceto camionetas e caminhonetes de cabine dupla, equipados para propulsão, simultaneamente, com motor de pistão de ignição por centelha (faísca) e motor elétrico, de peso em carga máxima (bruto) não superior a 5 toneladas',
    ncm: '8704.51.00',
  },
  {
    item: 'III-25',
    desc: 'Outros veículos automóveis para transporte de mercadorias, equipados para propulsão, simultaneamente, com motor de pistão de ignição por centelha (faísca) e motor elétrico, de peso em carga máxima (bruto) superior a 5 toneladas',
    ncm: '8704.52.00',
  },
  {
    item: 'III-26',
    desc: 'Outros veículos automóveis para transporte de mercadorias, exceto camionetas e caminhonetes de cabine dupla, unicamente com motor elétrico para propulsão',
    ncm: '8704.60.00',
  },
  {
    item: 'III-27',
    desc: 'Outros veículos automóveis para transporte de mercadorias, exceto camionetas e caminhonetes de cabine dupla',
    ncm: '8704.90.00',
  },
  { item: 'III-28', desc: 'Tanques (cisternas)', ncm: '8716.31.00' },
  {
    item: 'III-29',
    desc: 'Outros reboques e semirreboques para transporte de mercadorias',
    ncm: '8716.39.00',
  },
  { item: 'III-30', desc: 'Outros reboques e semirreboques', ncm: '8716.40.00' },
  { item: 'III-31', desc: 'Outros veículos não autopropulsados', ncm: '8716.80.00' },
]

export const RIBS_A5_ITENS: ItemRibs[] = [
  {
    item: 'V-1',
    desc: 'Embarcações e balsas',
    ncm: '8901.10.00, 8901.90.00, 8903.31.00, 8903.9, 8904.00.00, 8907.90.00',
    leg: 'Lei 2.826/03 (AM)',
  },
  { item: 'V-2', desc: 'Monitor de vídeo', ncm: '8528.59', leg: 'Lei 2.826/03 (AM)' },
  {
    item: 'V-3',
    desc: 'Autorrádio',
    ncm: '8521.90.00, 8527.2, 8528.72.00',
    leg: 'Lei 2.826/03 (AM)',
  },
  {
    item: 'V-4',
    desc: 'Vestuário',
    ncm: '5407, 5408, 6101, 6102, 6103, 6104, 6105, 6106, 6107, 6108, 6109, 6110, 6111, 6112, 6113.00.00, 6114, 6115, 6117, 6201, 6202, 6203, 6204, 6205, 6206, 6207, 6208, 6209, 6210, 6211, 6212, 6213, 6214, 6215, 6216.00.00, 6217, 6301',
    leg: 'Lei 2.826/03 (AM)',
  },
  {
    item: 'V-5',
    desc: 'Veículos utilitários',
    ncm: '8703.2, 8703.3, 8704.2, 8704.3',
    leg: 'Lei 2.826/03 (AM)',
  },
  {
    item: 'V-6',
    desc: 'Brinquedos',
    ncm: '9503.00.10, 9503.00.2, 9503.00.3, 9503.00.40, 9503.00.50, 9503.00.60, 9503.00.70, 9503.00.9, 9504.40.00, 9504.50.00, 9504.90, 9506.62.00, 9506.69.00, 9506.70.00',
    leg: 'Lei 2.826/03 (AM)',
  },
  {
    item: 'V-7',
    desc: 'Aparelho condicionador de ar dos tipos janela ou parede e split',
    ncm: '8415.1, 8415.82, 8415.90',
    leg: 'Lei 2.826/03 (AM)',
  },
  { item: 'V-8', desc: 'Fogões', ncm: '8516.60.00', leg: 'Lei 2.826/03 (AM)' },
  {
    item: 'V-9',
    desc: 'Lavadora de louça',
    ncm: '8422.11.00, 8422.19.00',
    leg: 'Lei 2.826/03 (AM)',
  },
  {
    item: 'V-10',
    desc: 'Fios, telas e sacos de juta e/ou malva',
    ncm: '5307.10.10, 6305.10.00',
    leg: 'Lei 2.826/03 (AM)',
  },
  {
    item: 'V-11',
    desc: 'Castanha beneficiada com casca ou descascada',
    ncm: '0801.2',
    leg: 'Lei 2.826/03 (AM)',
  },
  { item: 'V-12', desc: 'Aparelho de ginástica', ncm: '9506.91.00', leg: 'Lei 2.826/03 (AM)' },
  { item: 'V-13', desc: 'Bicicleta', ncm: '8712.00.10', leg: 'Lei 2.826/03 (AM)' },
  {
    item: 'V-14',
    desc: 'Bicicleta elétrica',
    ncm: '8711.60.00, 8711.90.00',
    leg: 'Lei 2.826/03 (AM)',
  },
  { item: 'V-15', desc: 'Pneumáticos', ncm: '4011.40.00, 4011.50.00', leg: 'Lei 2.826/03 (AM)' },
  { item: 'V-16', desc: 'Câmaras de ar', ncm: '4013.20.00, 4013.90.00', leg: 'Lei 2.826/03 (AM)' },
  { item: 'V-17', desc: 'Baú de alumínio', ncm: '8707.90.90', leg: 'Lei 2.826/03 (AM)' },
  {
    item: 'V-18',
    desc: 'Semi-reboque',
    ncm: '8716.20.00, 8716.39.00, 8716.90.90',
    leg: 'Lei 2.826/03 (AM)',
  },
  { item: 'V-19', desc: 'Repelentes', ncm: '3808.91.19, 3808.91.99', leg: 'Lei 2.826/03 (AM)' },
  {
    item: 'V-20',
    desc: 'Odorizador de ambientes e desodorizador embalados sob pressão',
    ncm: '3307.49.00',
    leg: 'Lei 2.826/03 (AM)',
  },
  {
    item: 'V-21',
    desc: 'Produtos destinados à segurança ocupacional',
    ncm: '5608.90.00, 6307.20.00, 6307.90.90, 7326.90.90, 7616.99.00, 9020.00.10',
    leg: 'Lei 2.826/03 (AM)',
  },
  {
    item: 'V-22',
    desc: 'Equipamentos de segurança, incluindo fechadura elétrica, trava elétrica e porteiro eletrônico, e partes destinadas a estes equipamentos',
    ncm: '8301.40.00, 8302.60.00, 8517.62, 8521.90.00, 8525.8, 8529.90, 8536.49.00, 8543.70.39',
    leg: 'Lei 2.826/03 (AM)',
  },
  {
    item: 'V-23',
    desc: 'Artefatos de joalheria e de ourivesaria',
    ncm: '7113, 7114',
    leg: 'Lei 2.826/03 (AM)',
  },
  {
    item: 'V-24',
    desc: 'Secador profissional de cabelo e aparelho para modelar cabelo',
    ncm: '8516.31.00, 8516.32.00',
    leg: 'Decreto 46.024/23 (AM), prorrogado pelo Decreto 51.978/25',
  },
  {
    item: 'V-25',
    desc: 'Esquadria em PVC com reforço metálico para construção civil',
    ncm: '3925.20.00',
    leg: 'Decreto 46.389/23 (AM)',
  },
  { item: 'V-26', desc: 'Inseticida', ncm: '3808.91.19', leg: 'Decreto 46.559/23 (AM)' },
  {
    item: 'V-27',
    desc: 'Luminária com fonte de luz em estado sólido',
    ncm: '9405.11.90, 9405.42.00',
    leg: 'Decreto 46.561/23 (AM)',
  },
  {
    item: 'V-28',
    desc: 'Frasco coletor de amostra para laboratório',
    ncm: '3923.30.90',
    leg: 'Decreto 47.263/23 (AM)',
  },
  {
    item: 'V-29',
    desc: 'Touca e máscara descartáveis para uso médico hospitalar',
    ncm: '6307.90.10',
    leg: 'Decreto 47.263/23 (AM)',
  },
  {
    item: 'V-30',
    desc: 'Módulo acumulador com células eletroquímicas de íon lítio para estação de armazenamento de energia elétrica (exceto em sistemas de energia)',
    ncm: '8507.60.00',
    leg: 'Decreto 47.282/23 (AM)',
  },
  { item: 'V-31', desc: 'Forro de PVC', ncm: '3916.20.00', leg: 'Decreto 47.708/23 (AM)' },
  {
    item: 'V-32',
    desc: 'Controle remoto para aparelhos elétricos e eletrônicos',
    ncm: '8543.70.99',
    leg: 'Decreto 48.175/23 (AM)',
  },
  {
    item: 'V-33',
    desc: 'Colchão de mola ou de espuma embalado a vácuo e compactado',
    ncm: '9404.21.00, 9404.29.00',
    leg: 'Decreto 48.487/23 (AM)',
  },
  {
    item: 'V-34',
    desc: 'Poste e cruzeta de poliéster reforçado com fibra de vidro',
    ncm: '3907.99.11, 3907.99.99, 3917.29.00, 7019.90.00',
    leg: 'Decreto 48.518/23 (AM)',
  },
  {
    item: 'V-35',
    desc: 'Conversor de corrente AC/CC — adaptador de tensão para bens de áudio e vídeo',
    ncm: '8504.40.21, 8504.40.29, 8504.40.30',
    leg: 'Decreto 48.519/23 (AM)',
  },
  {
    item: 'V-36',
    desc: 'Digital Vídeo Disc — DVD Player ou DVD/Blu-Ray; reprodutor de CD/DVD ou de DVD/Blu-Ray combinado com amplificador',
    ncm: '8521.90.00',
    leg: 'Decreto 38.558/17 (AM), prorrogado pelos Decretos 40.101/18, 41.576/19, 44.958/21, 48.216/23, 48.569/23',
  },
  {
    item: 'V-37',
    desc: 'Aparelho receptor e decodificador de sinais de vídeo e áudio',
    ncm: '8528.71',
    leg: 'Decreto 38.558/17 (AM), prorrogado pelos Decretos 40.101/18, 41.576/19, 44.958/21, 48.216/23, 48.569/23',
  },
  {
    item: 'V-38',
    desc: 'Aparelho receptor para radiodifusão combinado com um aparelho de gravação ou de reprodução de som (sistemas)',
    ncm: '8527.13.00, 8527.91.00',
    leg: 'Decreto 38.558/17 (AM), prorrogado pelos Decretos 40.101/18, 41.576/19, 44.958/21, 48.216/23, 48.569/23',
  },
  {
    item: 'V-39',
    desc: 'Projetor de vídeo',
    ncm: '8528.62.00, 8528.69',
    leg: 'Decreto 38.558/17 (AM), prorrogado pelos Decretos 40.101/18, 41.576/19, 44.958/21, 48.216/23, 48.569/23',
  },
  {
    item: 'V-40',
    desc: 'Motor de popa',
    ncm: '8407.21',
    leg: 'Decreto 38.558/17 (AM), prorrogado pelos Decretos 40.101/18, 41.576/19, 44.958/21, 48.216/23, 48.569/23',
  },
  {
    item: 'V-41',
    desc: 'Equipamentos médico-hospitalares e odontológicos',
    ncm: '9011, 9018, 9019, 9020, 9020.00.10, 9021, 9022',
    leg: 'Decreto 38.558/17 (AM), prorrogado pelos Decretos 40.101/18, 41.576/19, 44.958/21, 48.216/23, 48.569/23',
  },
  {
    item: 'V-42',
    desc: 'Produtos farmacêuticos',
    ncm: '3005',
    leg: 'Decreto 38.558/17 (AM), prorrogado pelos Decretos 40.101/18, 41.576/19, 44.958/21, 48.216/23, 48.569/23',
  },
  {
    item: 'V-43',
    desc: 'Medicamento de uso humano',
    ncm: '3003, 3004',
    leg: 'Decreto 44.958/21 (AM), prorrogado pelos Decretos 48.216/23, 48.569/23',
  },
  {
    item: 'V-44',
    desc: 'Aparelho eletromecânico para preparação instantânea de bebidas, em doses individuais, a partir de cápsulas',
    ncm: '8479.89.99',
    leg: 'Decreto 44.958/21 (AM), prorrogado pelos Decretos 48.216/23, 48.569/23, 38.124/23',
  },
  {
    item: 'V-45',
    desc: 'Aparelho receptor de televisão com projetor de vídeo incorporado (exceto para receptor utilizado em televisão)',
    ncm: '8528.71.90',
    leg: 'Decreto 40.101/18 (AM), prorrogado pelos Decretos 41.576/19, 44.958/21, 48.216/23, 48.569/23, 38.560/23',
  },
  {
    item: 'V-46',
    desc: 'Caixa acústica para reprodução de áudio digital via conexão sem fio',
    ncm: '8518.21.00, 8518.22.00',
    leg: 'Decreto 41.576/19 (AM), prorrogado pelos Decretos 44.958/21, 39.305/23, 48.216/23, 48.569/23',
  },
  {
    item: 'V-47',
    desc: 'Amplificador elétrico de audiofrequência (Soundbar)',
    ncm: '8518.22.00, 8518.40.00',
    leg: 'Decreto 41.576/19 (AM), prorrogado pelos Decretos 44.958/21, 39.305/23, 48.216/23, 48.569/23',
  },
  {
    item: 'V-48',
    desc: 'Relógio de pulso',
    ncm: '9102.11.10, 9102.11.90, 9102.12.10, 9102.12.20, 9102.19.00, 9102.21.00',
    leg: 'Decreto 43.274/21 (AM), prorrogado pelos Decretos 44.958/21, 48.216/23, 48.569/23',
  },
  {
    item: 'V-49',
    desc: 'Aparelhos digitais de sinalização acústica ou visual, exceto os aparelhos residenciais',
    ncm: '8512',
    leg: 'Decreto 48.569/23 (AM)',
  },
]
