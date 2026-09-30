import pb from '@/lib/pocketbase/client'
import type {
  GalleryItem,
  NeighborhoodItem,
  FloorplanItem,
  InquiryInput,
  InquiryItem,
} from '@/types/panorama'

// Fallback data in case the network fails or is slow
export const fallbackGallery: GalleryItem[] = [
  {
    id: 'f-gal-1',
    title: 'Fachada Contemporânea',
    category: 'Arquitetura',
    image_url:
      'https://img.usecurling.com/p/1600/1000?q=modern%20luxury%20building%20facade%20architecture',
    order: 1,
  },
  {
    id: 'f-gal-2',
    title: 'Living Integrado com Vista Panorâmica',
    category: 'Interiores',
    image_url:
      'https://img.usecurling.com/p/1600/1000?q=luxury%20penthouse%20living%20room%20sunset%20view',
    order: 2,
  },
  {
    id: 'f-gal-3',
    title: 'Piscina Infinity com Deck Molhado',
    category: 'Área de Lazer',
    image_url:
      'https://img.usecurling.com/p/1600/1000?q=luxury%20rooftop%20infinity%20pool%20cityscape',
    order: 3,
  },
  {
    id: 'f-gal-4',
    title: 'Lobby Monumental em Pé-Direito Triplo',
    category: 'Áreas Comuns',
    image_url:
      'https://img.usecurling.com/p/1600/1000?q=grand%20modern%20hotel%20luxury%20lobby%20marble',
    order: 4,
  },
  {
    id: 'f-gal-5',
    title: 'Fitness & Wellness Center',
    category: 'Bem-estar',
    image_url:
      'https://img.usecurling.com/p/1600/1000?q=luxury%20modern%20gym%20interior%20fitness',
    order: 5,
  },
  {
    id: 'f-gal-6',
    title: 'Espaço Gourmet & Wine Bar',
    category: 'Gastronomia',
    image_url:
      'https://img.usecurling.com/p/1600/1000?q=luxury%20wine%20lounge%20gourmet%20interior',
    order: 6,
  },
  {
    id: 'f-gal-7',
    title: 'Suíte Master com Varanda Privativa',
    category: 'Privativo',
    image_url:
      'https://img.usecurling.com/p/1600/1000?q=luxury%20master%20bedroom%20suite%20interior',
    order: 7,
  },
  {
    id: 'f-gal-8',
    title: 'Sky Lounge no Rooftop',
    category: 'Exclusividade',
    image_url:
      'https://img.usecurling.com/p/1600/1000?q=rooftop%20lounge%20evening%20skyline%20luxury',
    order: 8,
  },
]

export const fallbackNeighborhood: NeighborhoodItem[] = [
  {
    id: 'f-neigh-1',
    name: 'Parque do Ibirapuera / Área Verde',
    description: 'Um refúgio verde a minutos de casa para corridas matinais e lazer ao ar livre.',
    distance: '3 min de caminhada',
    icon: 'Trees',
    image_url: 'https://img.usecurling.com/p/800/600?q=green%20city%20park%20nature%20trees',
    order: 1,
  },
  {
    id: 'f-neigh-2',
    name: 'Alta Gastronomia & Bistrôs',
    description: 'Os mais prestigiados restaurantes estrelados, adegas e cafeterias artesanais.',
    distance: '2 min a pé',
    icon: 'UtensilsCrossed',
    image_url: 'https://img.usecurling.com/p/800/600?q=fine%20dining%20restaurant%20luxury',
    order: 2,
  },
  {
    id: 'f-neigh-3',
    name: 'Shopping & Grifes Internacionais',
    description: 'Centros de compras sofisticados, boutiques exclusivas e serviços premium.',
    distance: '5 min de carro',
    icon: 'ShoppingBag',
    image_url: 'https://img.usecurling.com/p/800/600?q=luxury%20shopping%20mall%20boutique',
    order: 3,
  },
  {
    id: 'f-neigh-4',
    name: 'Colégios Internacionais & Bilíngues',
    description: 'Instituições de ensino de excelência e tradição renomada para sua família.',
    distance: '6 min de carro',
    icon: 'GraduationCap',
    image_url: 'https://img.usecurling.com/p/800/600?q=modern%20school%20campus%20architecture',
    order: 4,
  },
  {
    id: 'f-neigh-5',
    name: 'Centros Médicos de Referência',
    description: 'Os melhores complexos hospitalares e clínicas especializadas da região.',
    distance: '7 min de carro',
    icon: 'Hospital',
    image_url:
      'https://img.usecurling.com/p/800/600?q=modern%20medical%20center%20hospital%20exterior',
    order: 5,
  },
]

export const fallbackFloorplans: FloorplanItem[] = [
  {
    id: 'f-fp-1',
    name: 'Duplex',
    tagline: 'Elegância em Dois Níveis',
    area: '310 m²',
    suites_parking: '4 Suítes • 4 Vagas demarcadas + Depósito',
    description:
      'Pé-direito duplo no living com mezanino integrado, suíte master com closet duplo e sala de banho com banheira de imersão. Vista 180° indevassável para o horizonte.',
    image_url:
      'https://img.usecurling.com/p/1200/800?q=architectural%20blueprint%20modern%20apartment%20floorplan',
    order: 1,
  },
  {
    id: 'f-fp-2',
    name: 'Garden',
    tagline: 'O Conforto de Casa com a Segurança de Edifício',
    area: '385 m²',
    suites_parking: '4 Suítes • 4 Vagas • Piscina Privativa',
    description:
      'Amplo terraço privativo com piscina aquecida privativa, espaço gourmet exclusivo e paisagismo assinado. Integração total entre os ambientes internos e o jardim.',
    image_url:
      'https://img.usecurling.com/p/1200/800?q=luxury%20garden%20residence%20architectural%20plan',
    order: 2,
  },
  {
    id: 'f-fp-3',
    name: 'Sky',
    tagline: 'A Exclusividade no Ponto Mais Alto',
    area: '245 m²',
    suites_parking: '3 Suítes • 3 Vagas privativas',
    description:
      'Localizado nos andares mais altos, oferece uma vista panorâmica de tirar o fôlego. Living sem pilares com esquadrias do piso ao teto, cozinha gourmet e suítes generosas.',
    image_url:
      'https://img.usecurling.com/p/1200/800?q=modern%20architectural%20apartment%20floorplan%20drawing',
    order: 3,
  },
  {
    id: 'f-fp-4',
    name: 'Loft',
    tagline: 'Conceito Aberto e Sofisticação Urbana',
    area: '145 m²',
    suites_parking: '2 Suítes • 2 Vagas',
    description:
      'Planta fluida de conceito aberto inspirada no design contemporâneo nova-iorquino. Varanda gourmet ampla integrada ao living e acabamentos refinados em madeira nobre e mármore.',
    image_url:
      'https://img.usecurling.com/p/1200/800?q=contemporary%20loft%20architectural%20floorplan%20sketch',
    order: 4,
  },
]

export async function fetchGalleryItems(): Promise<GalleryItem[]> {
  try {
    const records = await pb.collection('gallery').getFullList<GalleryItem>({
      sort: 'order',
    })
    return records && records.length > 0 ? records : fallbackGallery
  } catch (err) {
    console.warn('Falha ao buscar galeria do PocketBase, usando dados locais:', err)
    return fallbackGallery
  }
}

export async function fetchNeighborhoodItems(): Promise<NeighborhoodItem[]> {
  try {
    const records = await pb.collection('neighborhood').getFullList<NeighborhoodItem>({
      sort: 'order',
    })
    return records && records.length > 0 ? records : fallbackNeighborhood
  } catch (err) {
    console.warn('Falha ao buscar itens do bairro do PocketBase, usando dados locais:', err)
    return fallbackNeighborhood
  }
}

export async function fetchFloorplans(): Promise<FloorplanItem[]> {
  try {
    const records = await pb.collection('floorplans').getFullList<FloorplanItem>({
      sort: 'order',
    })
    return records && records.length > 0 ? records : fallbackFloorplans
  } catch (err) {
    console.warn('Falha ao buscar plantas do PocketBase, usando dados locais:', err)
    return fallbackFloorplans
  }
}

export async function submitInquiry(data: InquiryInput): Promise<InquiryItem> {
  const record = await pb.collection('inquiries').create<InquiryItem>(data)
  return record
}
