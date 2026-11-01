import { describe, it, expect } from 'vitest'
import { formatarMensagemInstalacao } from './programaVersoes'
import { NAVEGACAO, GRUPOS } from '@/components/navegacao'
import { resolverRota, ABAS } from '@/lib/rotas'

describe('Instalador e Controle de Versão (COU)', () => {
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
      notasVersao: 'Módulo Central do COU com controle de versão e envios.',
      destinatarioNome: 'Dr. Roberto Silveira',
      destinatarioEmpresa: 'Silveira Contabilidade',
      urlInstalador: 'https://verificacao-projeto-panorama-18549.goskip.app/#instalador-versao',
      canal: 'whatsapp',
    })

    expect(msg).toContain('ADECONT — Assessoria Contábil e Administrativa')
    expect(msg).toContain('COU (Centro de Operações Unificadas)')
    expect(msg).toContain('v2.8.4')
    expect(msg).toContain('31/10/2026')
    expect(msg).toContain('Dr. Roberto Silveira')
    expect(msg).toContain('Silveira Contabilidade')
    expect(msg).toContain('Link Direto de Instalação')
    expect(msg).toContain('Android')
    expect(msg).toContain('iPhone')
  })
})
