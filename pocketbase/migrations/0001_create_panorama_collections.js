migrate(
  (app) => {
    // 1. Gallery Collection
    const gallery = new Collection({
      name: 'gallery',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'category', type: 'text', required: false },
        { name: 'image_url', type: 'text', required: true },
        { name: 'order', type: 'number', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_gallery_order ON gallery (order)'],
    })
    app.save(gallery)

    // 2. Neighborhood Collection
    const neighborhood = new Collection({
      name: 'neighborhood',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text', required: false },
        { name: 'distance', type: 'text', required: true },
        { name: 'icon', type: 'text', required: false },
        { name: 'image_url', type: 'text', required: false },
        { name: 'order', type: 'number', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_neighborhood_order ON neighborhood (order)'],
    })
    app.save(neighborhood)

    // 3. Floorplans Collection
    const floorplans = new Collection({
      name: 'floorplans',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'tagline', type: 'text', required: false },
        { name: 'area', type: 'text', required: true },
        { name: 'suites_parking', type: 'text', required: true },
        { name: 'description', type: 'text', required: true },
        { name: 'image_url', type: 'text', required: true },
        { name: 'order', type: 'number', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_floorplans_order ON floorplans (order)'],
    })
    app.save(floorplans)

    // 4. Inquiries Collection (Public create allowed, view restricted)
    const inquiries = new Collection({
      name: 'inquiries',
      type: 'base',
      listRule: null,
      viewRule: null,
      createRule: '',
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'phone', type: 'text', required: true },
        { name: 'message', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(inquiries)

    // Seed Gallery Records
    const galleryItems = [
      {
        title: 'Fachada Contemporânea',
        category: 'Arquitetura',
        image_url:
          'https://img.usecurling.com/p/1600/1000?q=modern%20luxury%20building%20facade%20architecture',
        order: 1,
      },
      {
        title: 'Living Integrado com Vista Panorâmica',
        category: 'Interiores',
        image_url:
          'https://img.usecurling.com/p/1600/1000?q=luxury%20penthouse%20living%20room%20sunset%20view',
        order: 2,
      },
      {
        title: 'Piscina Infinity com Deck Molhado',
        category: 'Área de Lazer',
        image_url:
          'https://img.usecurling.com/p/1600/1000?q=luxury%20rooftop%20infinity%20pool%20cityscape',
        order: 3,
      },
      {
        title: 'Lobby Monumental em Pé-Direito Triplo',
        category: 'Áreas Comuns',
        image_url:
          'https://img.usecurling.com/p/1600/1000?q=grand%20modern%20hotel%20luxury%20lobby%20marble',
        order: 4,
      },
      {
        title: 'Fitness & Wellness Center',
        category: 'Bem-estar',
        image_url:
          'https://img.usecurling.com/p/1600/1000?q=luxury%20modern%20gym%20interior%20fitness',
        order: 5,
      },
      {
        title: 'Espaço Gourmet & Wine Bar',
        category: 'Gastronomia',
        image_url:
          'https://img.usecurling.com/p/1600/1000?q=luxury%20wine%20lounge%20gourmet%20interior',
        order: 6,
      },
      {
        title: 'Suíte Master com Varanda Privativa',
        category: 'Privativo',
        image_url:
          'https://img.usecurling.com/p/1600/1000?q=luxury%20master%20bedroom%20suite%20interior',
        order: 7,
      },
      {
        title: 'Sky Lounge no Rooftop',
        category: 'Exclusividade',
        image_url:
          'https://img.usecurling.com/p/1600/1000?q=rooftop%20lounge%20evening%20skyline%20luxury',
        order: 8,
      },
    ]

    for (let i = 0; i < galleryItems.length; i++) {
      const item = galleryItems[i]
      const rec = new Record(gallery)
      rec.set('title', item.title)
      rec.set('category', item.category)
      rec.set('image_url', item.image_url)
      rec.set('order', item.order)
      app.save(rec)
    }

    // Seed Neighborhood Records
    const neighborhoodItems = [
      {
        name: 'Parque do Ibirapuera / Área Verde',
        description:
          'Um refúgio verde a minutos de casa para corridas matinais e lazer ao ar livre.',
        distance: '3 min de caminhada',
        icon: 'Trees',
        image_url: 'https://img.usecurling.com/p/800/600?q=green%20city%20park%20nature%20trees',
        order: 1,
      },
      {
        name: 'Alta Gastronomia & Bistrôs',
        description:
          'Os mais prestigiados restaurantes estrelados, adegas e cafeterias artesanais.',
        distance: '2 min a pé',
        icon: 'UtensilsCrossed',
        image_url: 'https://img.usecurling.com/p/800/600?q=fine%20dining%20restaurant%20luxury',
        order: 2,
      },
      {
        name: 'Shopping & Grifes Internacionais',
        description: 'Centros de compras sofisticados, boutiques exclusivas e serviços premium.',
        distance: '5 min de carro',
        icon: 'ShoppingBag',
        image_url: 'https://img.usecurling.com/p/800/600?q=luxury%20shopping%20mall%20boutique',
        order: 3,
      },
      {
        name: 'Colégios Internacionais & Bilíngues',
        description: 'Instituições de ensino de excelência e tradição renomada para sua família.',
        distance: '6 min de carro',
        icon: 'GraduationCap',
        image_url: 'https://img.usecurling.com/p/800/600?q=modern%20school%20campus%20architecture',
        order: 4,
      },
      {
        name: 'Centros Médicos de Referência',
        description: 'Os melhores complexos hospitalares e clínicas especializadas da região.',
        distance: '7 min de carro',
        icon: 'Hospital',
        image_url:
          'https://img.usecurling.com/p/800/600?q=modern%20medical%20center%20hospital%20exterior',
        order: 5,
      },
    ]

    for (let i = 0; i < neighborhoodItems.length; i++) {
      const item = neighborhoodItems[i]
      const rec = new Record(neighborhood)
      rec.set('name', item.name)
      rec.set('description', item.description)
      rec.set('distance', item.distance)
      rec.set('icon', item.icon)
      rec.set('image_url', item.image_url)
      rec.set('order', item.order)
      app.save(rec)
    }

    // Seed Floorplans Records
    const floorplanItems = [
      {
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

    for (let i = 0; i < floorplanItems.length; i++) {
      const item = floorplanItems[i]
      const rec = new Record(floorplans)
      rec.set('name', item.name)
      rec.set('tagline', item.tagline)
      rec.set('area', item.area)
      rec.set('suites_parking', item.suites_parking)
      rec.set('description', item.description)
      rec.set('image_url', item.image_url)
      rec.set('order', item.order)
      app.save(rec)
    }
  },
  (app) => {
    const collections = ['inquiries', 'floorplans', 'neighborhood', 'gallery']
    for (let i = 0; i < collections.length; i++) {
      try {
        const col = app.findCollectionByNameOrId(collections[i])
        app.delete(col)
      } catch (_) {}
    }
  },
)
