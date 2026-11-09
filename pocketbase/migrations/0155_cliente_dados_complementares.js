/**
 * MIGRATION 0155 — Coleções para ficha cadastral estendida e dados complementares de clientes
 *
 * 1. cliente_campos_def: Definições de campos personalizados criados pelos usuários (tipo, chave, rótulo, opções)
 * 2. cliente_campos_valores: Valores preenchidos para campos personalizados por cliente (vinculado por cnpj ou codigo)
 * 3. cliente_contatos: Lista de canais de contato (email, whatsapp, instagram, facebook, linkedin, telegram, etc.)
 * 4. cliente_arquivos: Arquivos anexados à ficha do cliente com suporte a storage do PocketBase
 *
 * Regras públicas (list, view, create, update, delete) no padrão das collections existentes da ADECONT.
 */
migrate(
  (app) => {
    // 1. Definições de Campos Personalizados
    if (!app.hasTable('cliente_campos_def')) {
      const colCamposDef = new Collection({
        name: 'cliente_campos_def',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'chave', type: 'text', required: true }, // ex: "inscricao_produtor", "tributacao_especial"
          { name: 'rotulo', type: 'text', required: true }, // ex: "Inscrição de Produtor Rural"
          { name: 'tipo', type: 'text', required: true }, // 'texto' | 'numero' | 'data' | 'booleano' | 'selecao'
          { name: 'opcoes', type: 'text' }, // opções separadas por vírgula ou JSON para selecao
          { name: 'descricao', type: 'text' },
          { name: 'ordem', type: 'number' },
          { name: 'ativo', type: 'bool' },
          { name: 'criado_por', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_cliente_campos_def_chave ON cliente_campos_def (chave)',
          'CREATE INDEX idx_cliente_campos_def_ordem ON cliente_campos_def (ordem)',
        ],
      })
      app.save(colCamposDef)
    }

    // 2. Valores dos Campos Personalizados por Cliente
    if (!app.hasTable('cliente_campos_valores')) {
      const colValores = new Collection({
        name: 'cliente_campos_valores',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'cliente_cnpj', type: 'text', required: true },
          { name: 'cliente_codigo', type: 'number' },
          { name: 'campo_chave', type: 'text', required: true },
          { name: 'valor', type: 'text' },
          { name: 'atualizado_por', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_cli_valores_cnpj ON cliente_campos_valores (cliente_cnpj)',
          'CREATE INDEX idx_cli_valores_codigo ON cliente_campos_valores (cliente_codigo)',
          'CREATE UNIQUE INDEX idx_cli_valores_cnpj_campo ON cliente_campos_valores (cliente_cnpj, campo_chave)',
        ],
      })
      app.save(colValores)
    }

    // 3. Canais de Contato e Mensagens do Cliente (e-mail, whatsapp, redes sociais)
    if (!app.hasTable('cliente_contatos')) {
      const colContatos = new Collection({
        name: 'cliente_contatos',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'cliente_cnpj', type: 'text', required: true },
          { name: 'cliente_codigo', type: 'number' },
          { name: 'tipo', type: 'text', required: true }, // 'email' | 'whatsapp' | 'instagram' | 'facebook' | 'linkedin' | 'telegram' | 'outro'
          { name: 'identificador', type: 'text', required: true }, // email, telefone/whats ou URL/handle
          { name: 'rotulo', type: 'text' }, // ex: "Comercial", "Financeiro", "Diretoria"
          { name: 'nome_responsavel', type: 'text' },
          { name: 'cargo_responsavel', type: 'text' },
          { name: 'principal', type: 'bool' },
          { name: 'observacao', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_cli_contatos_cnpj ON cliente_contatos (cliente_cnpj)',
          'CREATE INDEX idx_cli_contatos_codigo ON cliente_contatos (cliente_codigo)',
          'CREATE INDEX idx_cli_contatos_tipo ON cliente_contatos (tipo)',
        ],
      })
      app.save(colContatos)
    }

    // 4. Arquivos Anexos do Cliente (contratos, procurações, documentos, relatórios, etc.)
    if (!app.hasTable('cliente_arquivos')) {
      const colArquivos = new Collection({
        name: 'cliente_arquivos',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'cliente_cnpj', type: 'text', required: true },
          { name: 'cliente_codigo', type: 'number' },
          { name: 'titulo', type: 'text', required: true },
          { name: 'categoria', type: 'text' }, // 'Contrato', 'Documento Societário', 'Procuração', 'Fiscal', 'Outro'
          {
            name: 'arquivo',
            type: 'file',
            maxSelect: 1,
            maxSize: 52428800, // 50MB
            protected: false,
          },
          { name: 'nome_original', type: 'text' },
          { name: 'tamanho_bytes', type: 'number' },
          { name: 'tipo_mime', type: 'text' },
          { name: 'observacao', type: 'text' },
          { name: 'enviado_por', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_cli_arquivos_cnpj ON cliente_arquivos (cliente_cnpj)',
          'CREATE INDEX idx_cli_arquivos_codigo ON cliente_arquivos (cliente_codigo)',
          'CREATE INDEX idx_cli_arquivos_categoria ON cliente_arquivos (categoria)',
        ],
      })
      app.save(colArquivos)
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('cliente_arquivos'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('cliente_contatos'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('cliente_campos_valores'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('cliente_campos_def'))
    } catch (_) {}
  },
)
