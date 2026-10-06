/// <reference path="../pb_data/types.d.ts" />
// 0052 - Coleção install_shortcuts: atalhos e instruções de instalação do sistema ADECONT Panorama
migrate(
  (app) => {
    const col = new Collection({
      name: 'install_shortcuts',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
    })

    col.fields.add(new TextField({ name: 'titulo', required: true, max: 200 }))
    col.fields.add(
      new SelectField({
        name: 'device_type',
        required: true,
        maxSelect: 1,
        values: ['todos', 'android', 'iphone', 'computador'],
      }),
    )
    col.fields.add(new TextField({ name: 'url', required: true, max: 500 }))
    col.fields.add(new TextField({ name: 'instrucoes', required: true, max: 4000 }))
    col.fields.add(new TextField({ name: 'observacoes', max: 500 }))
    col.fields.add(new TextField({ name: 'criado_por', max: 120 }))
    col.fields.add(new NumberField({ name: 'envios_count', onlyInt: true }))
    col.fields.add(new AutodateField({ name: 'created', onCreate: true, onUpdate: false }))
    col.fields.add(new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }))

    app.save(col)

    // Sementes iniciais com instruções oficiais ADECONT
    const baseShortcuts = [
      {
        titulo: 'Atalho Universal — Todos os Dispositivos',
        device_type: 'todos',
        url: 'https://verificacao-projeto-panorama-18549.goskip.app/',
        instrucoes:
          '1. Celulares (Android/Chrome): Menu (⋮) → "Adicionar à tela inicial" ou "Instalar app".\n2. iPhone (Safari): Toque em Compartilhar (ícone do quadrado com seta para cima) → "Adicionar à Tela de Início".\n3. Computadores (Chrome/Edge): Clique no ícone de instalação na barra de navegação (computador com seta para baixo) ou Menu (...) → Aplicativos → "Instalar este site como app".',
        observacoes: 'Atalho mestre completo com passo a passo para todos os ambientes',
        criado_por: 'Sistema ADECONT',
        envios_count: 0,
      },
      {
        titulo: 'Instalação Mobile — Celulares Android (Chrome)',
        device_type: 'android',
        url: 'https://verificacao-projeto-panorama-18549.goskip.app/',
        instrucoes:
          '1. Abra o link no navegador Google Chrome no Android.\n2. Toque no menu de três pontos (⋮) no canto superior direito.\n3. Selecione a opção "Adicionar à tela inicial" ou "Instalar aplicativo".\n4. Confirme tocando em "Instalar". O ícone ADECONT aparecerá na sua tela de aplicativos.',
        observacoes: 'Instalação PWA direta no Android com logo oficial',
        criado_por: 'Sistema ADECONT',
        envios_count: 0,
      },
      {
        titulo: 'Instalação Mobile — Celulares Apple iPhone (Safari)',
        device_type: 'iphone',
        url: 'https://verificacao-projeto-panorama-18549.goskip.app/',
        instrucoes:
          '1. Abra o link no Safari do seu iPhone.\n2. Toque no botão Compartilhar (quadrado azul com seta para cima) na barra inferior.\n3. Role as opções e selecione "Adicionar à Tela de Início" (+).\n4. Toque em "Adicionar" no canto superior direito. O ícone ADECONT aparecerá junto aos seus apps.',
        observacoes: 'Suporte a Apple Touch Icon 180x180',
        criado_por: 'Sistema ADECONT',
        envios_count: 0,
      },
      {
        titulo: 'Instalação Desktop — Computadores Windows e Mac (Chrome/Edge)',
        device_type: 'computador',
        url: 'https://verificacao-projeto-panorama-18549.goskip.app/',
        instrucoes:
          '1. Abra o sistema no Google Chrome ou Microsoft Edge no computador.\n2. Na barra de endereços, clique no botão "Instalar aplicativo" (ícone com tela e seta ou monitor).\n3. Ou acesse Menu (...) → Aplicativos → "Instalar ADECONT Panorama".\n4. O sistema funcionará em janela dedicada, podendo ser fixado na Barra de Tarefas ou no Dock.',
        observacoes: 'Acesso rápido para trabalho contábil e consultoria no PC',
        criado_por: 'Sistema ADECONT',
        envios_count: 0,
      },
    ]

    for (const item of baseShortcuts) {
      try {
        const rec = new Record(col)
        rec.set('titulo', item.titulo)
        rec.set('device_type', item.device_type)
        rec.set('url', item.url)
        rec.set('instrucoes', item.instrucoes)
        rec.set('observacoes', item.observacoes)
        rec.set('criado_por', item.criado_por)
        rec.set('envios_count', item.envios_count)
        app.save(rec)
      } catch (err) {
        console.log('[install_shortcuts] seed error: ' + err)
      }
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('install_shortcuts'))
    } catch (_) {}
  },
)
