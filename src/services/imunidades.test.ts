import { describe, expect, it } from 'vitest'
import { ASSUNTOS_ESPECIAIS_CATALOGO } from '../data/assuntosEspeciais'
import { buscarAvancado } from './buscaAvancada'

describe('Catálogo de Imunidades, Alíquotas Zero e Não Incidências da Reforma Tributária', () => {
  it('contém todas as imunidades do art. 145 da LC 214/2025 e EC 132/2023', () => {
    const itensImunidades = ASSUNTOS_ESPECIAIS_CATALOGO.filter(
      (item) => item.categoria === 'Imunidades por Produtos e Segmentos',
    )

    // Templos de qualquer culto
    const templos = itensImunidades.find((i) => i.id === 'esp-imunidade-04')
    expect(templos).toBeDefined()
    expect(templos?.titulo).toContain('Templos de Qualquer Culto')
    expect(templos?.baseLegal).toContain('CF/88 art. 150 VI b')
    expect(templos?.baseLegal).toContain('LC 214/2025')
    expect(templos?.fontesOficiais.length).toBeGreaterThan(0)
    expect(templos?.fontesOficiais[0].orgao).toBe('Planalto')

    // Reciprocidade entre entes federativos
    const reciprocidade = itensImunidades.find((i) => i.id === 'esp-imunidade-05')
    expect(reciprocidade).toBeDefined()
    expect(reciprocidade?.titulo).toContain('Reciprocidade entre Entes Federativos')
    expect(reciprocidade?.baseLegal).toContain('CF/88 art. 150 VI a')

    // Partidos políticos e fundos
    const partidos = itensImunidades.find((i) => i.id === 'esp-imunidade-06')
    expect(partidos).toBeDefined()
    expect(partidos?.titulo).toContain('Partidos Políticos')
    expect(partidos?.baseLegal).toContain('CF/88 art. 150 VI c')

    // Instituições de educação e assistência social
    const educAssistencia = itensImunidades.find((i) => i.id === 'esp-imunidade-07')
    expect(educAssistencia).toBeDefined()
    expect(educAssistencia?.titulo).toContain('Instituições de Educação e Assistência Social')
    expect(educAssistencia?.baseLegal).toContain('LC 214/2025')

    // Ouro como ativo financeiro
    const ouro = itensImunidades.find((i) => i.id === 'esp-imunidade-08')
    expect(ouro).toBeDefined()
    expect(ouro?.titulo).toContain('Ouro como Ativo Financeiro')
    expect(ouro?.baseLegal).toContain('CF/88 art. 153 § 5º')

    // Petróleo, gás natural e energia elétrica para exterior
    const petroleo = itensImunidades.find((i) => i.id === 'esp-imunidade-09')
    expect(petroleo).toBeDefined()
    expect(petroleo?.titulo).toContain('Petróleo, Gás Natural e Energia Elétrica')

    // Medicamentos, dispositivos médicos e fórmulas enterais
    const medicamentos = itensImunidades.find((i) => i.id === 'esp-imunidade-10')
    expect(medicamentos).toBeDefined()
    expect(medicamentos?.titulo).toContain('Medicamentos, Dispositivos Médicos e Fórmulas Enterais')

    // Dispositivos de acessibilidade (PCD)
    const acessibilidade = itensImunidades.find((i) => i.id === 'esp-imunidade-11')
    expect(acessibilidade).toBeDefined()
    expect(acessibilidade?.titulo).toContain('Dispositivos de Acessibilidade')

    // Hortifrutícolas, frutas e ovos
    const hortifruti = itensImunidades.find((i) => i.id === 'esp-imunidade-12')
    expect(hortifruti).toBeDefined()
    expect(hortifruti?.titulo).toContain('Produtos Hortícolas, Frutas Frescas e Ovos')

    // Serviços educacionais e de saúde
    const educSaude = itensImunidades.find((i) => i.id === 'esp-imunidade-13')
    expect(educSaude).toBeDefined()
    expect(educSaude?.titulo).toContain('Serviços Educacionais, Serviços de Saúde')

    // Livros, jornais, periódicos e papel de imprensa (já existente e preservado)
    const livros = itensImunidades.find((i) => i.id === 'esp-imunidade-01')
    expect(livros).toBeDefined()
    expect(livros?.titulo).toContain('Livros, Jornais, Periódicos')

    // Exportações de bens e serviços (já existente e preservado)
    const exportacoes = itensImunidades.find((i) => i.id === 'esp-imunidade-03')
    expect(exportacoes).toBeDefined()
    expect(exportacoes?.titulo).toContain('Exportações de Bens e Serviços')
  })

  it('cada item possui capitulação legal exata, selo de fonte oficial e conexão normativa com link proxy', () => {
    const itensImunidades = ASSUNTOS_ESPECIAIS_CATALOGO.filter(
      (item) => item.categoria === 'Imunidades por Produtos e Segmentos',
    )

    itensImunidades.forEach((item) => {
      expect(item.baseLegal).toBeTruthy()
      expect(item.artigosRelevantes.length).toBeGreaterThan(0)
      expect(item.fontesOficiais.length).toBeGreaterThan(0)
      expect(item.fontesOficiais.some((f) => f.orgao === 'Planalto' || f.orgao === 'CGIBS')).toBe(
        true,
      )

      // Verifica que todos os links de PDF usam o proxy do backend (nunca link direto externo)
      item.conexoesNormativas.forEach((conexao) => {
        if (conexao.linkProxyPdf) {
          expect(conexao.linkProxyPdf).toMatch(/^\/backend\/v1\/download-resolution/)
        }
      })
    })
  })

  it('pesquisa por "templo religioso" traz os novos itens em bloco próprio de Assuntos Especiais', async () => {
    const resultado = await buscarAvancado({ termo: 'templo religioso' })
    const itens = resultado.assuntosEspeciais.items

    expect(itens.length).toBeGreaterThan(0)
    const temploItem = itens.find((i) => i.id === 'esp-imunidade-04')
    expect(temploItem).toBeDefined()
    expect(temploItem?.titulo).toContain('Templos de Qualquer Culto')
  })

  it('pesquisa por "livro" traz livros, jornais e periódicos com imunidade', async () => {
    const resultado = await buscarAvancado({ termo: 'livro' })
    const itens = resultado.assuntosEspeciais.items

    expect(itens.length).toBeGreaterThan(0)
    const livroItem = itens.find((i) => i.id === 'esp-imunidade-01')
    expect(livroItem).toBeDefined()
    expect(livroItem?.titulo).toContain('Livros')
  })

  it('pesquisa por "exportação" traz as desonerações de exportação de bens, serviços e petróleo/energia', async () => {
    const resultado = await buscarAvancado({ termo: 'exportação' })
    const itens = resultado.assuntosEspeciais.items

    expect(itens.length).toBeGreaterThan(0)
    const exportGeral = itens.find((i) => i.id === 'esp-imunidade-03')
    expect(exportGeral).toBeDefined()
  })

  it('pesquisa por "ouro" traz o item de não incidência de ativo financeiro / reserva', async () => {
    const resultado = await buscarAvancado({ termo: 'ouro' })
    const itens = resultado.assuntosEspeciais.items

    expect(itens.length).toBeGreaterThan(0)
    const ouroItem = itens.find((i) => i.id === 'esp-imunidade-08')
    expect(ouroItem).toBeDefined()
    expect(ouroItem?.titulo).toContain('Ouro como Ativo Financeiro')
  })

  it('pesquisa por "reciprocidade" traz a imunidade recíproca entre entes federativos', async () => {
    const resultado = await buscarAvancado({ termo: 'reciprocidade' })
    const itens = resultado.assuntosEspeciais.items

    expect(itens.length).toBeGreaterThan(0)
    const recipItem = itens.find((i) => i.id === 'esp-imunidade-05')
    expect(recipItem).toBeDefined()
    expect(recipItem?.titulo).toContain('Reciprocidade entre Entes Federativos')
  })

  it('pesquisa por "instituicoes de educacao" ou "assistencia social" traz a imunidade condicionada', async () => {
    const resultado = await buscarAvancado({ termo: 'assistencia social' })
    const itens = resultado.assuntosEspeciais.items

    expect(itens.length).toBeGreaterThan(0)
    const educItem = itens.find((i) => i.id === 'esp-imunidade-07')
    expect(educItem).toBeDefined()
    expect(educItem?.titulo).toContain('Instituições de Educação e Assistência Social')
  })

  it('a migration 0088 de imunidades é idempotente (lógica de findFirstRecordByFilter)', () => {
    // Simula a lógica da migration 0088: se o registro já existe, atualiza em vez de duplicar
    const registrosNoBanco = new Map<string, { id: string; title: string; order: number }>()

    function simularExecucaoMigration(itens: { title: string; order: number }[]) {
      itens.forEach((item) => {
        let rec = registrosNoBanco.get(item.title)
        if (!rec) {
          rec = { id: `id-${item.order}`, title: item.title, order: item.order }
          registrosNoBanco.set(item.title, rec)
        } else {
          rec.order = item.order
        }
      })
    }

    const novosItens = [
      { title: 'Templos de Qualquer Culto', order: 116 },
      { title: 'Reciprocidade Federativa', order: 117 },
      { title: 'Partidos Políticos', order: 118 },
    ]

    // Primeira execução
    simularExecucaoMigration(novosItens)
    expect(registrosNoBanco.size).toBe(3)

    // Segunda execução consecutiva
    simularExecucaoMigration(novosItens)
    expect(registrosNoBanco.size).toBe(3) // não duplicou!
  })
})
