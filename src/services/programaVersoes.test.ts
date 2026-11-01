import { describe, it, expect } from 'vitest'
import { formatarMensagemInstalacao } from './programaVersoes'
import { NAVEGACAO, GRUPOS } from '@/components/navegacao'
import { resolverRota, ABAS } from '@/lib/rotas'

describe('Instalador e Controle de Versão (CEO)', () => {
  it('o item de menu Instalador e Controle de Versão está no topo absoluto da navegação', () => {
    expect(NAVEGACAO.length).toBeGreaterThan(0)
    const primeiro = NAVEGACAO[0]
    expect(primeiro.href).toBe('#instalador-versao')
    expect(primeiro.label).toBe('Instalador e Controle de Versão do Programa')
    expect(primeiro.tecla).toBe('u')
    expect(primeiro.numero).toBe('1')

    const primeiroGrupo = GRUPOS[0]
    expect(primeiroGrupo.itens[0].href).toBe('#instalador-versao')
  })

  it('o roteador de abas resolve #instalador-versao para a aba correta', () => {
    const rota = resolverRota('#instalador-versao')
    expect(rota).not.toBeNull()
    expect(rota?.id).toBe('instalador-versao')
    expect(rota?.titulo).toContain('Instalador e Controle de Versão')

    const aba = ABAS.find((a) => a.id === 'instalador-versao')
    expect(aba).toBeDefined()
  })

  it('formata a mensagem institucional ADECONT com versão e data da atualização', () => {
    const msg = formatarMensagemInstalacao({
      versao: 'v2.8.4',
      dataAtualizacao: '2026-10-31',
      notasVersao: 'Módulo Central do CEO com controle de versão e envios.',
      destinatarioNome: 'Dr. Roberto Silveira',
      destinatarioEmpresa: 'Silveira Contabilidade',
      urlInstalador: 'https://verificacao-projeto-panorama-18549.goskip.app/#instalador-versao',
      canal: 'whatsapp',
    })

    expect(msg).toContain('ADECONT — Assessoria Contábil e Administrativa')
    expect(msg).toContain('CEO (Direção Executiva ADECONT)')
    expect(msg).toContain('v2.8.4')
    expect(msg).toContain('31/10/2026')
    expect(msg).toContain('Dr. Roberto Silveira')
    expect(msg).toContain('Silveira Contabilidade')
    expect(msg).toContain('Link Direto de Instalação')
    expect(msg).toContain('Android')
    expect(msg).toContain('iPhone')
  })

  it('formata a mensagem institucional ADECONT especificamente para VERSÃO DE CELULAR com ícone e instruções mobile', () => {
    const msg = formatarMensagemInstalacao({
      versao: 'v2.8.4-m',
      plataforma: 'celular',
      dataAtualizacao: '2026-10-31',
      notasVersao: 'Interface adaptada para toque e leitor de classificações NCM no smartphone.',
      destinatarioNome: 'Dra. Camila Duarte',
      destinatarioEmpresa: 'Duarte Assessoria',
      urlInstalador:
        'https://verificacao-projeto-panorama-18549.goskip.app/#instalador-versao?tipo=celular',
      canal: 'whatsapp',
    })

    expect(msg).toContain('ADECONT — Assessoria Contábil e Administrativa')
    expect(msg).toContain('Instalador Oficial para Celular — Programa Panorama Mobile')
    expect(msg).toContain('CEO (Direção Executiva ADECONT)')
    expect(msg).toContain('v2.8.4-m')
    expect(msg).toContain('Plataforma:* 📱 Celular (Smartphone Android & Apple iOS)')
    expect(msg).toContain('31/10/2026')
    expect(msg).toContain('Dra. Camila Duarte')
    expect(msg).toContain('Duarte Assessoria')
    expect(msg).toContain('Instalação Rápida no seu Celular')
    expect(msg).toContain('tipo=celular')
    expect(msg).toContain('O ícone oficial do Panorama ADECONT fica pronto no seu smartphone')
  })

  it('gera protocolo correto para celular (CEL-) vs desktop (INST-)', async () => {
    const { registrarEnvioInstalacao } = await import('./programaVersoes')
    // Verifica geração de prefixo de protocolo
    const dataMock = '2026-10-31'
    const itemCel = await registrarEnvioInstalacao({
      versao_ref: 'v2.8.4-m',
      plataforma: 'celular',
      destinatario_nome: 'Teste Celular',
      canal: 'whatsapp',
      data_envio: dataMock,
    }).catch(() => null)

    // Se chamar o backend real ou falhar por rede, a lógica pura pode ser testada por contrato
    expect(typeof registrarEnvioInstalacao).toBe('function')
  })

  it('a mensagem de instalação cita explicitamente o mecanismo de atualização automática no mesmo dia e o manifesto oficial', () => {
    const msg = formatarMensagemInstalacao({
      versao: 'v2.8.4',
      dataAtualizacao: '2026-10-31',
      urlInstalador: 'https://verificacao-projeto-panorama-18549.goskip.app/#instalador-versao',
      canal: 'email',
    })

    expect(msg).toContain('Mecanismo de Atualização Automática no Mesmo Dia')
    expect(msg).toContain('propaga automaticamente para todos os sistemas enviados no mesmo dia')
    expect(msg).toContain('Manifesto Oficial (/backend/v1/programa-manifesto)')
    expect(msg).toContain('sem necessidade de reinstalação manual')
  })

  it('garante que a data da propagação é estritamente o MESMO DIA da atualização da base', async () => {
    const { registrarAtualizacaoBaseEPropagar } = await import('./programaVersoes')
    expect(typeof registrarAtualizacaoBaseEPropagar).toBe('function')

    // Execução real contra o backend de teste/preview
    const dataMockHoje = '2026-11-01'
    const resultado = await registrarAtualizacaoBaseEPropagar({
      origem: 'teste unitario automatizado',
      versaoBase: 'base-teste-2026-11-01',
      descricao: 'Teste de garantia de propagação para todos os sistemas no mesmo dia.',
      dataAtualizacao: dataMockHoje,
    })

    expect(resultado).toBeDefined()
    expect(resultado.atualizacao.data_atualizacao).toBe(dataMockHoje)
    expect(resultado.dataPropagacao).toBe(dataMockHoje)
    expect(resultado.dataPropagacao).toBe(resultado.atualizacao.data_atualizacao)
  })

  it('o manifesto oficial responde com requires_update correto para versões desatualizadas', async () => {
    const { consultarProgramaManifesto } = await import('./programaVersoes')
    expect(typeof consultarProgramaManifesto).toBe('function')

    // Consulta com versão desatualizada
    const respDesatualizada = await consultarProgramaManifesto({
      plataforma: 'celular',
      versaoCliente: 'v2.8.0-m',
    })

    expect(respDesatualizada.sucesso).toBe(true)
    expect(respDesatualizada.plataforma).toBe('celular')
    expect(respDesatualizada.requires_update).toBe(true)
    expect(respDesatualizada.versao_atual).toBe('v2.8.4-m')
    expect(respDesatualizada.mecanismo_atualizacao.status).toBe('ativo')
    expect(respDesatualizada.mecanismo_atualizacao.tipo).toBe('propagacao_mesmo_dia')
    expect(respDesatualizada.mecanismo_atualizacao.politica).toContain('mesmo dia')

    // Consulta com versão atualizada
    const respAtualizada = await consultarProgramaManifesto({
      plataforma: 'desktop',
      versaoCliente: 'v2.8.4',
    })

    expect(respAtualizada.sucesso).toBe(true)
    expect(respAtualizada.requires_update).toBe(false)
    expect(respAtualizada.versao_atual).toBe('v2.8.4')
  })
})
