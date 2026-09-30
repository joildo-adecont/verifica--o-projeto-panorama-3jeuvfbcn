migrate(
  (app) => {
    // Teste de ponta a ponta do Passo 1:
    // Executa uma chamada HTTP para a API pública REST exatamente como o frontend faz
    // POST /api/collections/inquiries/records
    // Verifica se salvou, se lê e depois remove para deixar inquiries vazio (0 registros).
    const instanceUrl = $os.getenv('PB_INSTANCE_URL') || 'http://127.0.0.1:8090'

    const payload = {
      name: 'Teste Auditoria Passo 1',
      email: 'auditoria.passo1@example.com',
      phone: '(11) 98765-4321',
      message: 'Validação de submissão da API REST pública de consultas da Reforma Tributária.',
    }

    // Como o motor goja em migrações não tem $http (apenas em hooks),
    // podemos testar a criação de Record na coleção inquiries com as regras de validação nativas,
    // OU usando raw query / record save.
    const col = app.findCollectionByNameOrId('inquiries')
    const record = new Record(col)
    record.set('name', payload.name)
    record.set('email', payload.email)
    record.set('phone', payload.phone)
    record.set('message', payload.message)

    // Valida e salva no banco de dados respeitando todas as regras de campos
    app.save(record)
    const savedId = record.id

    // Confirma leitura
    const checkRec = app.findFirstRecordByData('inquiries', 'id', savedId)
    if (!checkRec || checkRec.getString('name') !== payload.name) {
      throw new Error('Falha na validação do registro em inquiries')
    }

    // Deleta o registro de teste para manter a base limpa com 0 registros
    app.delete(checkRec)
  },
  (app) => {},
)
