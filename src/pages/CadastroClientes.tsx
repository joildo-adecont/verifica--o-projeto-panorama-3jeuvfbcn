import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Search,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  UserCheck,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  RefreshCw,
  FileText,
  Briefcase,
  Hash,
  AlertCircle,
  X,
  ArrowUpDown,
  ExternalLink,
  Printer,
  FileSpreadsheet,
  Check,
  Loader2,
  Power,
  UserX,
  FileInput,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { AdecontLogo } from '@/components/AdecontLogo'
import {
  listarEmpresas,
  listarEmpresasParaRelatorio,
  atualizarEmpresa,
} from '@/services/cadastroEmpresas'
import { inativarCliente, listarEmpresasInativas } from '@/services/cadastroEmpresasInativos'
import { ModalConfirmarStatusCliente } from '@/components/ModalConfirmarStatusCliente'
import { registrarAuditoriaStatus } from '@/services/statusAuditoriaService'
import {
  editarClientesEmMassa,
  alterarRegimeClientesEmMassa,
  inativarClientesEmMassa,
  alterarStatusClientesEmMassa,
  DadosEdicaoEmMassa,
  DadosAlteracaoStatusEmMassa,
  DadosAlteracaoRegimeEmMassa,
} from '@/services/cadastroEmpresasMassa'
import { BarraAcoesMassaClientes } from '@/components/BarraAcoesMassaClientes'
import { useToast } from '@/hooks/use-toast'
import { RelatorioClientesImprimivel } from '@/components/RelatorioClientesImprimivel'
import { ModalFichaClienteDetalhada } from '@/components/ModalFichaClienteDetalhada'
import { ModalGerenciarCamposPersonalizados } from '@/components/ModalGerenciarCamposPersonalizados'
import { ModalImportExportMassaClientes } from '@/components/ModalImportExportMassaClientes'
import { ModalRecepcionarDocumentoCliente } from '@/components/ModalRecepcionarDocumentoCliente'
import { listarCamposPersonalizados } from '@/services/clienteDadosComplementaresService'
import type { CampoPersonalizadoDef } from '@/types/clienteDadosComplementares'
import { Sliders, Upload, Download } from 'lucide-react'
import { BadgeDocumentoCliente } from '@/components/BadgeDocumentoCliente'
import { SecaoClientesArquivados } from '@/components/SecaoClientesArquivados'
import {
  type EmpresaRecord,
  OPCOES_REGIME_TRIBUTARIO,
  type RegimeTributarioTipo,
  EVENTO_REGIME_TRIBUTARIO_ALTERADO,
} from '@/types/cadastroEmpresas'
import {
  registrarAlteracaoRegime,
  listarHistoricoPorEmpresa,
  obterBadgeRegime,
  obterBadgeOrigem,
  formatarDataHoraAuditoria,
} from '@/services/regimeHistoricoService'
import type { RegimeHistoricoItem } from '@/types/regimeHistorico'
import { History } from 'lucide-react'
import { seedAnexoContratoSocialCardoso } from '@/services/seedAnexoContratoSocialCardoso'

export { OPCOES_REGIME_TRIBUTARIO, type RegimeTributarioTipo }

export default function CadastroClientes() {
  const [empresas, setEmpresas] = useState<EmpresaRecord[]>([])
  const [totalItens, setTotalItens] = useState<number>(0)
  const [totalPaginas, setTotalPaginas] = useState<number>(1)
  const [paginaAtual, setPaginaAtual] = useState<number>(1)
  const [porPagina, setPorPagina] = useState<number>(50)
  const [carregando, setCarregando] = useState<boolean>(true)
  const [erro, setErro] = useState<string | null>(null)

  // Filtros
  const [termoBusca, setTermoBusca] = useState<string>('')
  const [filtroTipoDoc, setFiltroTipoDoc] = useState<string>('TODOS')
  const [filtroSituacao, setFiltroSituacao] = useState<string>('TODOS')
  const [filtroRegime, setFiltroRegime] = useState<string>('TODOS')
  const [abaAtiva, setAbaAtiva] = useState<'ativos' | 'arquivados' | 'inativos-link'>('ativos')
  const [totalArquivadosContador, setTotalArquivadosContador] = useState<number>(0)
  const [totalInativosContador, setTotalInativosContador] = useState<number>(0)
  // Tecla individual Ativo/Inativo por linha com Modal e Campo de Motivo
  const [inativandoCodigo, setInativandoCodigo] = useState<number | null>(null)
  const [avisoInativacao, setAvisoInativacao] = useState<string | null>(null)
  const [clienteParaInativar, setClienteParaInativar] = useState<EmpresaRecord | null>(null)

  // Modais de Dados Complementares e Import/Export em Massa
  const [camposDef, setCamposDef] = useState<CampoPersonalizadoDef[]>([])
  const [modalGerenciarCamposAberto, setModalGerenciarCamposAberto] = useState<boolean>(false)
  const [modalImportExportAberto, setModalImportExportAberto] = useState<boolean>(false)

  // Atalho "Recepcionar Documento" nesta tela (mesmo fluxo de /analises-empresariais)
  const [modalRecepcaoAberto, setModalRecepcaoAberto] = useState<boolean>(false)
  const [avisoRecepcao, setAvisoRecepcao] = useState<string | null>(null)

  // Seleção e Ações em Massa
  const { toast } = useToast()
  const [selecionadosCodigos, setSelecionadosCodigos] = useState<Set<number>>(new Set())
  const [processandoMassa, setProcessandoMassa] = useState<boolean>(false)

  const [ordenacao, setOrdenacao] = useState<
    'codigo-asc' | 'codigo-desc' | 'nome-asc' | 'nome-desc'
  >('codigo-asc')

  // Item selecionado para expansão / detalhes
  const [empresaExpandidaId, setEmpresaExpandidaId] = useState<number | null>(null)
  const [modalEmpresa, setModalEmpresa] = useState<EmpresaRecord | null>(null)

  // Estados de alteração inline na listagem: empresa em alteração e feedback
  const [salvandoInlineCodigo, setSalvandoInlineCodigo] = useState<number | null>(null)
  const [statusInline, setStatusInline] = useState<
    Record<number, { tipo: 'ok' | 'erro'; texto: string }>
  >({})

  // Edição do regime tributário na ficha do cliente (modal)
  const [salvandoFichaRegime, setSalvandoFichaRegime] = useState<boolean>(false)
  const [feedbackFicha, setFeedbackFicha] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(
    null,
  )
  const [historicoRegimeFicha, setHistoricoRegimeFicha] = useState<RegimeHistoricoItem[]>([])
  const [carregandoHistoricoFicha, setCarregandoHistoricoFicha] = useState<boolean>(false)

  // Carrega campos personalizados ativos do sistema
  const carregarDefinicoesCampos = useCallback(async () => {
    try {
      const defs = await listarCamposPersonalizados(false)
      setCamposDef(defs)
    } catch (e) {
      console.warn('Erro ao carregar definições de campos personalizados:', e)
    }
  }, [])

  useEffect(() => {
    carregarDefinicoesCampos()
  }, [carregarDefinicoesCampos])

  // Carrega histórico de auditoria da empresa selecionada
  const carregarHistoricoFicha = useCallback(async (emp: EmpresaRecord) => {
    setCarregandoHistoricoFicha(true)
    try {
      const lista = await listarHistoricoPorEmpresa({
        empresaId: emp.id,
        empresaCodigo: emp.codigo,
        empresaCnpj: emp.cpf_cnpj || emp.documento_limpo,
      })
      setHistoricoRegimeFicha(lista)
    } catch (e) {
      console.warn('Falha ao carregar histórico de regime:', e)
      setHistoricoRegimeFicha([])
    } finally {
      setCarregandoHistoricoFicha(false)
    }
  }, [])

  // Ao abrir o modal da ficha do cliente, sincroniza
  const abrirFichaCliente = (emp: EmpresaRecord) => {
    setModalEmpresa(emp)
    setFeedbackFicha(null)
    carregarHistoricoFicha(emp)
  }

  // Alteração inline na tabela ou através do seletor da Ficha Cadastral (onChange com auto-save)
  const handleAlterarRegimeInline = async (emp: EmpresaRecord, novoRegime: string) => {
    const cod = emp.codigo
    const regimeAnterior = emp.regime_tributario || ''
    if (regimeAnterior.trim() === (novoRegime || '').trim()) return

    setSalvandoInlineCodigo(cod)
    setStatusInline((prev) => ({ ...prev, [cod]: { tipo: 'ok', texto: 'Salvando…' } }))

    try {
      const idOuCodigo = emp.id || emp.codigo
      const res = await atualizarEmpresa(idOuCodigo, {
        regime_tributario: novoRegime,
      })

      if (res.sucesso) {
        // Atualiza estado local da listagem
        setEmpresas((prev) =>
          prev.map((item) =>
            item.codigo === cod ? { ...item, regime_tributario: novoRegime } : item,
          ),
        )

        // Se a modal da ficha estiver aberta para essa mesma empresa, atualiza
        setModalEmpresa((prev) =>
          prev && prev.codigo === cod ? { ...prev, regime_tributario: novoRegime } : prev,
        )

        setStatusInline((prev) => ({
          ...prev,
          [cod]: { tipo: 'ok', texto: novoRegime ? 'Regime atualizado!' : 'Regime removido' },
        }))

        // Grava na trilha de auditoria
        registrarAlteracaoRegime({
          empresa_id: emp.id,
          empresa_codigo: emp.codigo,
          empresa_nome: emp.razao_social || emp.apelido || `Cliente #${emp.codigo}`,
          empresa_cnpj: emp.cpf_cnpj || emp.documento_limpo,
          regime_anterior: regimeAnterior,
          regime_novo: novoRegime,
          origem: 'listagem',
        }).catch((err) => console.warn('Erro ao registrar auditoria de regime inline:', err))

        // Notifica outros componentes abertos (ex: banner do Diagnóstico Tributário)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent(EVENTO_REGIME_TRIBUTARIO_ALTERADO, {
              detail: {
                codigo: cod,
                id: emp.id,
                documento_limpo: emp.documento_limpo,
                regime_tributario: novoRegime,
              },
            }),
          )
        }
      } else {
        setStatusInline((prev) => ({
          ...prev,
          [cod]: { tipo: 'erro', texto: res.mensagem || 'Falha ao salvar' },
        }))
      }
    } catch (e: any) {
      console.error('Erro ao atualizar regime inline:', e)
      setStatusInline((prev) => ({
        ...prev,
        [cod]: { tipo: 'erro', texto: e?.message || 'Erro ao salvar' },
      }))
    } finally {
      setSalvandoInlineCodigo(null)
      // Limpa status após 3 segundos
      setTimeout(() => {
        setStatusInline((prev) => {
          const next = { ...prev }
          delete next[cod]
          return next
        })
      }, 3000)
    }
  }

  // Alteração integrada na Ficha Cadastral (onChange auto-save sem botão secundário separado)
  const handleAlterarRegimeFicha = async (novoRegime: string) => {
    if (!modalEmpresa) return
    const regimeAnterior = modalEmpresa.regime_tributario || ''
    if (regimeAnterior.trim() === (novoRegime || '').trim()) return

    setSalvandoFichaRegime(true)
    setFeedbackFicha(null)

    try {
      const idOuCodigo = modalEmpresa.id || modalEmpresa.codigo
      const res = await atualizarEmpresa(idOuCodigo, {
        regime_tributario: novoRegime,
      })

      if (res.sucesso) {
        const empresaAtualizada: EmpresaRecord = {
          ...modalEmpresa,
          regime_tributario: novoRegime,
        }
        setModalEmpresa(empresaAtualizada)
        setEmpresas((prev) =>
          prev.map((item) =>
            item.codigo === modalEmpresa.codigo ? { ...item, regime_tributario: novoRegime } : item,
          ),
        )
        setFeedbackFicha({
          tipo: 'ok',
          texto: 'Regime tributário atualizado e gravado na Ficha Cadastral!',
        })

        // Grava na trilha de auditoria
        await registrarAlteracaoRegime({
          empresa_id: modalEmpresa.id,
          empresa_codigo: modalEmpresa.codigo,
          empresa_nome:
            modalEmpresa.razao_social || modalEmpresa.apelido || `Cliente #${modalEmpresa.codigo}`,
          empresa_cnpj: modalEmpresa.cpf_cnpj || modalEmpresa.documento_limpo,
          regime_anterior: regimeAnterior,
          regime_novo: novoRegime,
          origem: 'ficha_cadastral',
        })

        // Recarrega histórico na ficha
        carregarHistoricoFicha(modalEmpresa)

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent(EVENTO_REGIME_TRIBUTARIO_ALTERADO, {
              detail: {
                codigo: modalEmpresa.codigo,
                id: modalEmpresa.id,
                documento_limpo: modalEmpresa.documento_limpo,
                regime_tributario: novoRegime,
              },
            }),
          )
        }
      } else {
        setFeedbackFicha({
          tipo: 'erro',
          texto: res.mensagem || 'Falha ao salvar regime na Ficha Cadastral.',
        })
      }
    } catch (e: any) {
      console.error('Erro ao salvar regime na ficha:', e)
      setFeedbackFicha({
        tipo: 'erro',
        texto: e?.message || 'Erro ao gravar regime tributário.',
      })
    } finally {
      setSalvandoFichaRegime(false)
    }
  }

  /**
   * TECLA INDIVIDUAL ATIVO/INATIVO — pedido do CEO: cada cliente da lista tem
   * uma tecla própria; ao inativar, o cliente sai daqui e passa a constar no
   * Cadastro Analítico de Clientes Inativos (de onde pode ser reativado e onde
   * a busca dele fica facilitada). Modal de confirmação dedicado com campo de
   * motivo opcional que alimenta a trilha de auditoria ADECONT.
   */
  const handleAbrirModalInativar = (emp: EmpresaRecord) => {
    setClienteParaInativar(emp)
  }

  const handleConfirmarInativacao = async (motivo: string) => {
    if (!clienteParaInativar) return
    const emp = clienteParaInativar
    const nome = emp.razao_social || `Cliente #${emp.codigo}`

    setInativandoCodigo(emp.codigo)
    setAvisoInativacao(null)
    try {
      await inativarCliente(emp.codigo, motivo)

      // Grava na trilha de auditoria de status com o motivo informado
      try {
        await registrarAuditoriaStatus({
          empresaCodigo: emp.codigo,
          empresaNome: emp.razao_social,
          empresaDocumento: emp.numero_documento || emp.documento_limpo,
          statusAnterior: emp.situacao || 'Ativa',
          statusNovo: 'Inativa',
          acao: 'inativar',
          motivo: motivo || undefined,
          usuario: 'ADECONT Operador',
        })
      } catch (errAuditoria) {
        console.warn('Falha secundária ao registrar auditoria de inativação:', errAuditoria)
      }

      setAvisoInativacao(
        `"${nome}" foi inativado e agora consta no Cadastro Analítico de Clientes Inativos.`,
      )
      setModalEmpresa((prev) => (prev && prev.codigo === emp.codigo ? null : prev))
      setClienteParaInativar(null)
      await carregarDados()
    } catch (e: any) {
      console.error('Erro ao inativar cliente:', e)
      setStatusInline((prev) => ({
        ...prev,
        [emp.codigo]: { tipo: 'erro', texto: e?.message || 'Falha ao inativar cliente' },
      }))
      setTimeout(() => {
        setStatusInline((prev) => {
          const next = { ...prev }
          delete next[emp.codigo]
          return next
        })
      }, 4000)
    } finally {
      setInativandoCodigo(null)
    }
  }

  // Estado do Relatório A4 impresso/PDF
  const [modalRelatorioAberto, setModalRelatorioAberto] = useState<boolean>(false)
  const [empresasRelatorio, setEmpresasRelatorio] = useState<EmpresaRecord[]>([])
  const [gerandoRelatorio, setGerandoRelatorio] = useState<boolean>(false)

  // Carrega dados da coleção cadastro_empresas
  const carregarDados = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const res = await listarEmpresas({
        busca: termoBusca,
        tipoDocumento: filtroTipoDoc,
        situacao: filtroSituacao,
        regimeTributario: filtroRegime,
        ordenacao,
        pagina: paginaAtual,
        porPagina,
      })

      setEmpresas(res.items)
      setTotalItens(res.totalItems)
      setTotalPaginas(res.totalPages || 1)

      // Atualiza também contagem de arquivados
      try {
        const arqRes = await listarEmpresas({ somenteArquivados: true, porPagina: 1 })
        setTotalArquivadosContador(arqRes.totalItems || 0)
      } catch {
        // silencioso
      }

      // Atualiza contagem do cadastro de inativos (aba de atalho)
      try {
        const inaRes = await listarEmpresasInativas({ porPagina: 1 })
        setTotalInativosContador(inaRes.totalItems || 0)
      } catch {
        // silencioso
      }
    } catch (e: any) {
      console.error('Falha ao carregar cadastro de empresas:', e)
      setErro('Não foi possível carregar o cadastro de clientes. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }, [termoBusca, filtroTipoDoc, filtroSituacao, filtroRegime, ordenacao, paginaAtual, porPagina])

  // Debounce na busca textual e reset de página quando filtro muda
  useEffect(() => {
    setPaginaAtual(1)
    setSelecionadosCodigos(new Set())
  }, [termoBusca, filtroTipoDoc, filtroSituacao, filtroRegime, ordenacao, porPagina])

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarDados()
    }, 250)
    return () => clearTimeout(timer)
  }, [carregarDados])

  // Seed único do anexo do contrato social da CARDOSO & SIX LTDA (cliente 94109):
  // idempotente — se o anexo já existe, não grava nem toca em nada.
  useEffect(() => {
    seedAnexoContratoSocialCardoso()
  }, [])

  // Ouvinte de sincronização em tempo real quando o regime for alterado externamente (ex.: pelo Diagnóstico)
  useEffect(() => {
    const handleEventoRegime = (e: Event) => {
      const custom = e as CustomEvent<{
        codigo?: number
        id?: string
        documento_limpo?: string
        regime_tributario?: string
      }>
      const detalhe = custom.detail
      if (!detalhe) return

      setEmpresas((prev) =>
        prev.map((item) => {
          const coincide =
            (detalhe.codigo && item.codigo === detalhe.codigo) ||
            (detalhe.id && item.id === detalhe.id) ||
            (detalhe.documento_limpo && item.documento_limpo === detalhe.documento_limpo)
          if (coincide && detalhe.regime_tributario !== undefined) {
            return { ...item, regime_tributario: detalhe.regime_tributario }
          }
          return item
        }),
      )

      setModalEmpresa((prev) => {
        if (!prev) return null
        const coincide =
          (detalhe.codigo && prev.codigo === detalhe.codigo) ||
          (detalhe.id && prev.id === detalhe.id) ||
          (detalhe.documento_limpo && prev.documento_limpo === detalhe.documento_limpo)
        if (coincide && detalhe.regime_tributario !== undefined) {
          return { ...prev, regime_tributario: detalhe.regime_tributario }
        }
        return prev
      })
    }

    window.addEventListener(EVENTO_REGIME_TRIBUTARIO_ALTERADO, handleEventoRegime)
    return () => {
      window.removeEventListener(EVENTO_REGIME_TRIBUTARIO_ALTERADO, handleEventoRegime)
    }
  }, [])

  const alternarExpansao = (codigo: number) => {
    setEmpresaExpandidaId((prev) => (prev === codigo ? null : codigo))
  }

  const alternarOrdenacaoNome = () => {
    if (ordenacao === 'nome-asc') {
      setOrdenacao('nome-desc')
    } else {
      setOrdenacao('nome-asc')
    }
  }

  const alternarOrdenacaoCodigo = () => {
    if (ordenacao === 'codigo-asc') {
      setOrdenacao('codigo-desc')
    } else {
      setOrdenacao('codigo-asc')
    }
  }

  // Clientes atualmente selecionados
  const clientesSelecionados = useMemo(() => {
    return empresas.filter((emp) => selecionadosCodigos.has(emp.codigo))
  }, [empresas, selecionadosCodigos])

  const todosPaginaSelecionados =
    empresas.length > 0 && empresas.every((emp) => selecionadosCodigos.has(emp.codigo))

  const alternarSelecionarTodosPagina = () => {
    if (todosPaginaSelecionados) {
      // Desmarca todos da página
      setSelecionadosCodigos((prev) => {
        const next = new Set(prev)
        empresas.forEach((e) => next.delete(e.codigo))
        return next
      })
    } else {
      // Marca todos da página atual
      setSelecionadosCodigos((prev) => {
        const next = new Set(prev)
        empresas.forEach((e) => next.add(e.codigo))
        return next
      })
    }
  }

  const alternarSelecaoCliente = (codigo: number) => {
    setSelecionadosCodigos((prev) => {
      const next = new Set(prev)
      if (next.has(codigo)) {
        next.delete(codigo)
      } else {
        next.add(codigo)
      }
      return next
    })
  }

  const limparSelecao = () => {
    setSelecionadosCodigos(new Set())
  }

  // Execução de Edição de Regime em Massa (Ação dedicada)
  const handleExecutarAlteracaoRegimeEmMassa = async (
    clientes: EmpresaRecord[],
    dados: DadosAlteracaoRegimeEmMassa,
  ) => {
    setProcessandoMassa(true)
    try {
      const res = await alterarRegimeClientesEmMassa(clientes, dados, 'cadastro_empresas')
      if (res.sucessoCount > 0) {
        toast({
          title: 'Regime tributário atualizado em massa',
          description: `Regime alterado para "${dados.novoRegime}" em ${res.sucessoCount} ${
            res.sucessoCount === 1 ? 'cliente' : 'clientes'
          } com sucesso.`,
        })

        // Atualização otimista imediata na tabela sem recarregar a página
        const codigosAfetados = new Set(clientes.map((c) => c.codigo))
        setEmpresas((prev) =>
          prev.map((emp) => {
            if (codigosAfetados.has(emp.codigo)) {
              return {
                ...emp,
                regime_tributario: dados.novoRegime,
              }
            }
            return emp
          }),
        )

        limparSelecao()
        await carregarDados()
      } else {
        toast({
          title: 'Erro ao alterar regime em massa',
          description: 'Nenhum cliente pôde ter o regime alterado.',
          variant: 'destructive',
        })
      }
    } catch (e: any) {
      console.error('Erro na alteração de regime em massa:', e)
      toast({
        title: 'Falha ao alterar regime',
        description: e?.message || 'Ocorreu um erro ao atualizar os regimes.',
        variant: 'destructive',
      })
    } finally {
      setProcessandoMassa(false)
    }
  }

  // Execução de Edição em Massa (campos comuns)
  const handleExecutarEdicaoEmMassa = async (
    clientes: EmpresaRecord[],
    dados: DadosEdicaoEmMassa,
  ) => {
    setProcessandoMassa(true)
    try {
      const res = await editarClientesEmMassa(clientes, dados, 'cadastro_empresas')
      if (res.sucessoCount > 0) {
        toast({
          title: 'Edição em massa concluída',
          description: `${res.sucessoCount} ${res.sucessoCount === 1 ? 'cliente atualizado' : 'clientes atualizados'} com sucesso.`,
        })

        // Atualiza imediatamente o estado da listagem para feedback sem recarregar a página
        setEmpresas((prev) =>
          prev.map((emp) => {
            if (selecionadosCodigos.has(emp.codigo)) {
              return {
                ...emp,
                ...(dados.regime_tributario ? { regime_tributario: dados.regime_tributario } : {}),
                ...(dados.municipio ? { municipio: dados.municipio } : {}),
                ...(dados.uf ? { uf: dados.uf } : {}),
              }
            }
            return emp
          }),
        )

        limparSelecao()
        await carregarDados()
      } else {
        toast({
          title: 'Erro na edição em massa',
          description: 'Nenhum cliente pôde ser atualizado. Verifique a conexão com o banco.',
          variant: 'destructive',
        })
      }
    } catch (e: any) {
      console.error('Erro na edição em massa:', e)
      toast({
        title: 'Falha ao processar edição',
        description: e?.message || 'Ocorreu um erro ao atualizar os clientes.',
        variant: 'destructive',
      })
    } finally {
      setProcessandoMassa(false)
    }
  }

  // Execução de Inativação em Massa
  const handleExecutarInativacaoEmMassa = async (clientes: EmpresaRecord[], motivo?: string) => {
    setProcessandoMassa(true)
    try {
      const res = await inativarClientesEmMassa(clientes, motivo)
      if (res.sucessoCount > 0) {
        toast({
          title: 'Inativação em massa concluída',
          description: `${res.sucessoCount} ${res.sucessoCount === 1 ? 'cliente inativado' : 'clientes inativados'} e transferidos para o Cadastro de Inativos.`,
        })

        // Remove imediatamente os clientes inativados da listagem para feedback sem recarregar
        const codigosInativados = new Set(clientes.map((c) => c.codigo))
        setEmpresas((prev) => prev.filter((emp) => !codigosInativados.has(emp.codigo)))

        limparSelecao()
        await carregarDados()
      } else {
        toast({
          title: 'Erro na inativação em massa',
          description: 'Não foi possível inativar os clientes selecionados.',
          variant: 'destructive',
        })
      }
    } catch (e: any) {
      console.error('Erro na inativação em massa:', e)
      toast({
        title: 'Falha ao inativar clientes',
        description: e?.message || 'Ocorreu um erro ao inativar os clientes.',
        variant: 'destructive',
      })
    } finally {
      setProcessandoMassa(false)
    }
  }

  // Execução de Alteração de Status em Massa
  const handleExecutarAlteracaoStatusEmMassa = async (
    clientes: EmpresaRecord[],
    dados: DadosAlteracaoStatusEmMassa,
  ) => {
    setProcessandoMassa(true)
    try {
      const res = await alterarStatusClientesEmMassa(clientes, dados, 'cadastro_empresas')
      if (res.sucessoCount > 0) {
        const novoStatus = dados.novaSituacao
        const ehInativacao = novoStatus.toLowerCase() === 'inativa'

        toast({
          title: 'Status em massa atualizado',
          description: ehInativacao
            ? `${res.sucessoCount} ${res.sucessoCount === 1 ? 'cliente movido' : 'clientes movidos'} para o Cadastro de Inativos.`
            : `Status alterado para "${novoStatus}" em ${res.sucessoCount} ${res.sucessoCount === 1 ? 'cliente' : 'clientes'}.`,
        })

        // Atualização instantânea do estado local sem recarregar a tela
        const codigosAfetados = new Set(clientes.map((c) => c.codigo))
        if (ehInativacao) {
          // Se virou Inativa, remove da listagem ativa imediatamente
          setEmpresas((prev) => prev.filter((emp) => !codigosAfetados.has(emp.codigo)))
        } else {
          // Se mudou para Ativa/Suspensa/Baixada, reflete na coluna de Situação
          setEmpresas((prev) =>
            prev.map((emp) => {
              if (codigosAfetados.has(emp.codigo)) {
                return { ...emp, situacao: novoStatus }
              }
              return emp
            }),
          )
        }

        limparSelecao()
        await carregarDados()
      } else {
        toast({
          title: 'Erro ao alterar status em massa',
          description: 'Nenhum cliente pôde ter o status alterado.',
          variant: 'destructive',
        })
      }
    } catch (e: any) {
      console.error('Erro na alteração de status em massa:', e)
      toast({
        title: 'Falha ao alterar status',
        description: e?.message || 'Ocorreu um erro ao atualizar a situação dos clientes.',
        variant: 'destructive',
      })
    } finally {
      setProcessandoMassa(false)
    }
  }

  // Prepara e abre o relatório A4 com a listagem completa conforme filtros atuais
  const abrirRelatorioA4 = async () => {
    setGerandoRelatorio(true)
    try {
      const listaCompleta = await listarEmpresasParaRelatorio({
        busca: termoBusca,
        tipoDocumento: filtroTipoDoc,
        situacao: filtroSituacao,
        regimeTributario: filtroRegime,
        ordenacao,
      })
      setEmpresasRelatorio(listaCompleta)
      setModalRelatorioAberto(true)
    } catch (e) {
      console.error('Erro ao gerar relatório A4:', e)
      // Se falhar o lote completo, usa o lote da página atual como contingência
      setEmpresasRelatorio(empresas)
      setModalRelatorioAberto(true)
    } finally {
      setGerandoRelatorio(false)
    }
  }

  // Resumo de contadores da página exibida
  const resumoContadores = useMemo(() => {
    let cnpjCount = 0
    let cpfCount = 0
    let outrosCount = 0
    empresas.forEach((emp) => {
      if (emp.tipo_documento === 'CNPJ') cnpjCount++
      else if (emp.tipo_documento === 'CPF') cpfCount++
      else outrosCount++
    })
    return { cnpjCount, cpfCount, outrosCount }
  }, [empresas])

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 flex flex-col">
      {/* CABEÇALHO DA CONSULTA DE CLIENTES */}
      <header className="bg-[#0F294A] border-b border-[#0A1D34] shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <AdecontLogo variant="white" showTagline={false} className="h-10 sm:h-12 w-auto" />
            <div className="border-l border-white/20 pl-3">
              <h1 className="text-base sm:text-lg font-serif font-bold tracking-wide text-white leading-tight">
                Cadastro Analítico de Clientes
              </h1>
              <p className="text-[11px] sm:text-xs text-[#D4AF37] font-semibold tracking-wider uppercase">
                Assessoria Contábil e Administrativa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              onClick={() => setModalRecepcaoAberto(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-colors shadow-sm cursor-pointer"
              title="Recepcionar documento (contrato social, certidão...) e criar ou vincular cliente"
            >
              <FileInput className="w-3.5 h-3.5" />
              <span>Recepcionar Documento</span>
            </button>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-100 transition-colors border border-white/10"
              title="Acessar o portal de Indicadores Econômicos e Reforma Tributária"
            >
              <span>Portal Panorama RT</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </Link>

            <button
              onClick={() => carregarDados()}
              disabled={carregando}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-100 transition-colors border border-white/10 disabled:opacity-60 cursor-pointer"
              title="Atualizar lista"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>

            <button
              onClick={() => setModalGerenciarCamposAberto(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-100 transition-colors border border-white/10 cursor-pointer"
              title="Criar e gerenciar campos personalizados da ficha do cliente"
            >
              <Sliders className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden sm:inline">Campos Ficha</span>
            </button>

            <button
              onClick={() => setModalImportExportAberto(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-100 transition-colors border border-white/10 cursor-pointer"
              title="Importar e exportar dados complementares em massa"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden md:inline">Import/Export Massa</span>
            </button>

            <button
              onClick={abrirRelatorioA4}
              disabled={gerandoRelatorio || carregando || totalItens === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#c29f2f] text-xs font-bold text-[#0F294A] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              title="Gerar e imprimir relatório A4 da consulta com selo ADECONT"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{gerandoRelatorio ? 'Gerando...' : 'Imprimir / A4'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 flex flex-col gap-4">
        {/* SELETOR DE ABAS: CLIENTES ATIVOS / CLIENTES ARQUIVADOS (LIMPEZA SEGURA) */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
          <button
            onClick={() => setAbaAtiva('ativos')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-bold transition-all cursor-pointer border-b-2 ${
              abaAtiva === 'ativos'
                ? 'border-[#0F294A] text-[#0F294A] bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Clientes Ativos</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                abaAtiva === 'ativos' ? 'bg-[#0F294A] text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {totalItens.toLocaleString('pt-BR')}
            </span>
          </button>

          <button
            onClick={() => setAbaAtiva('arquivados')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-bold transition-all cursor-pointer border-b-2 ${
              abaAtiva === 'arquivados'
                ? 'border-amber-600 text-amber-900 bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-amber-800 hover:bg-amber-50/50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span>Arquivados (Duplicatas)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                abaAtiva === 'arquivados'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {totalArquivadosContador}
            </span>
          </button>

          <Link
            to="/cadastro-clientes-inativos"
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-bold transition-all border-b-2 ${
              abaAtiva === 'inativos-link'
                ? 'border-[#2C3E50] text-[#2C3E50] bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-[#2C3E50] hover:bg-slate-100/60'
            }`}
            title="Abrir o Cadastro Analítico de Clientes Inativos"
          >
            <UserX className="w-4 h-4" />
            <span>Clientes Inativos</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#2C3E50] text-white">
              {totalInativosContador.toLocaleString('pt-BR')}
            </span>
          </Link>
        </div>

        {/* AVISO DE INATIVAÇÃO — com atalho direto para o cadastro de inativos */}
        {abaAtiva === 'ativos' && avisoInativacao && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900">
            <span className="inline-flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              {avisoInativacao}
            </span>
            <Link
              to="/cadastro-clientes-inativos"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2C3E50] text-white font-bold text-[11px] hover:opacity-90 transition-opacity"
            >
              Abrir Cadastro de Clientes Inativos
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* AVISO DE RECEPÇÃO — confirma criação/vínculo do cliente pelo atalho */}
        {abaAtiva === 'ativos' && avisoRecepcao && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900">
            <span className="inline-flex items-center gap-2">
              <FileInput className="w-4 h-4 text-emerald-600 shrink-0" />
              {avisoRecepcao}
            </span>
            <button
              onClick={() => setAvisoRecepcao(null)}
              className="ml-auto text-emerald-600 hover:text-emerald-800 font-bold px-2"
              aria-label="Fechar aviso"
            >
              ×
            </button>
          </div>
        )}

        {abaAtiva === 'arquivados' ? (
          <SecaoClientesArquivados
            onClienteRevertido={() => {
              carregarDados()
            }}
          />
        ) : (
          <>
            {/* BARRA DE FILTROS E BUSCA */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                {/* Campo de Busca */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    placeholder="Buscar por razão social, apelido, CNPJ/CPF (com ou sem pontuação) ou código..."
                    className="w-full pl-9 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F294A]/20 focus:border-[#0F294A] transition-all"
                  />
                  {termoBusca && (
                    <button
                      onClick={() => setTermoBusca('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                      title="Limpar termo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filtros rápidos */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium hidden sm:inline">Documento:</span>
                    <select
                      value={filtroTipoDoc}
                      onChange={(e) => setFiltroTipoDoc(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                    >
                      <option value="TODOS">Todos os tipos</option>
                      <option value="CNPJ">CNPJ</option>
                      <option value="CPF">CPF</option>
                      <option value="CEI">CEI</option>
                      <option value="CAEPF">CAEPF</option>
                      <option value="SEM_DOC">Sem documento</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                    <span className="font-medium hidden sm:inline">Regime:</span>
                    <select
                      value={filtroRegime}
                      onChange={(e) => setFiltroRegime(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                    >
                      <option value="TODOS">Todos os regimes</option>
                      <option value="SEM_REGIME">Não informado</option>
                      {OPCOES_REGIME_TRIBUTARIO.map((opcao) => (
                        <option key={opcao} value={opcao}>
                          {opcao}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                    <span className="font-medium hidden sm:inline">Situação:</span>
                    <select
                      value={filtroSituacao}
                      onChange={(e) => setFiltroSituacao(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                    >
                      <option value="TODOS">Todas situações</option>
                      <option value="Ativa">Ativas</option>
                      <option value="Inativa">Inativas</option>
                      <option value="Suspensa">Suspensas</option>
                      <option value="Baixada">Baixadas</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                    <span className="font-medium hidden sm:inline">Exibir:</span>
                    <select
                      value={porPagina}
                      onChange={(e) => setPorPagina(Number(e.target.value))}
                      className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                    >
                      <option value={25}>25 por pág.</option>
                      <option value={50}>50 por pág.</option>
                      <option value={100}>100 por pág.</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Barra de estatísticas da listagem */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">
                    {totalItens.toLocaleString('pt-BR')} empresas cadastradas
                  </span>
                  {termoBusca && (
                    <span className="bg-[#0F294A]/10 text-[#0F294A] font-medium px-2 py-0.5 rounded-full text-[11px]">
                      Filtradas por: "{termoBusca}"
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="inline-flex items-center gap-1 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Página atual: {empresas.length} registros
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                    Pág. {paginaAtual} de {totalPaginas}
                  </span>
                </div>
              </div>
            </section>

            {/* FEEDBACK DE ERRO OU VAZIO */}
            {erro && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{erro}</span>
                </div>
                <button
                  onClick={() => carregarDados()}
                  className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors"
                >
                  Recarregar
                </button>
              </div>
            )}

            {/* BARRA DE AÇÕES EM MASSA */}
            <BarraAcoesMassaClientes
              clientesSelecionados={clientesSelecionados}
              modo="ativos"
              processando={processandoMassa}
              onLimparSelecao={limparSelecao}
              onExecutarAlteracaoRegimeEmMassa={handleExecutarAlteracaoRegimeEmMassa}
              onExecutarEdicaoEmMassa={handleExecutarEdicaoEmMassa}
              onExecutarInativacaoEmMassa={handleExecutarInativacaoEmMassa}
              onExecutarAlteracaoStatusEmMassa={handleExecutarAlteracaoStatusEmMassa}
            />

            {/* TABELA ANALÍTICA DE CLIENTES */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#0F294A] text-white font-medium border-b border-[#0A1D34] select-none">
                      <th className="py-3 px-2 w-10 text-center">
                        <input
                          type="checkbox"
                          aria-label="Selecionar todos os clientes da página"
                          checked={todosPaginaSelecionados}
                          onChange={alternarSelecionarTodosPagina}
                          className="rounded border-slate-300 text-[#13335A] focus:ring-[#13335A] h-4 w-4 cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-3 w-16 text-center">
                        <button
                          onClick={alternarOrdenacaoCodigo}
                          className="inline-flex items-center gap-1 text-slate-200 hover:text-white font-bold"
                          title="Ordenar por Código"
                        >
                          <span>Cód.</span>
                          <ArrowUpDown className="w-3 h-3 text-[#D4AF37]" />
                        </button>
                      </th>
                      <th className="py-3 px-4 min-w-[260px]">
                        <button
                          onClick={alternarOrdenacaoNome}
                          className="inline-flex items-center gap-1 text-slate-200 hover:text-white font-bold"
                          title="Ordenar por Razão Social"
                        >
                          <span>Razão Social / Nome</span>
                          <ArrowUpDown className="w-3 h-3 text-[#D4AF37]" />
                        </button>
                      </th>
                      <th className="py-3 px-3 min-w-[170px]">Apelido / Fantasia</th>
                      <th className="py-3 px-3 min-w-[150px]">CNPJ / CPF</th>
                      <th className="py-3 px-3 w-24 text-center">Situação</th>
                      <th className="py-3 px-3 min-w-[130px] text-center bg-[#13335A]/60">
                        <span className="inline-flex items-center gap-1 font-bold text-white tracking-wide">
                          <Power className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>Status / Ação</span>
                        </span>
                      </th>
                      <th className="py-3 px-3 min-w-[210px]">Regime Tributário</th>
                      <th className="py-3 px-3 min-w-[140px]">Município / UF</th>
                      <th className="py-3 px-3 min-w-[130px]">Contato</th>
                      <th className="py-3 px-3 w-16 text-center">Ficha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {carregando ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <tr key={`skel-${i}`} className="animate-pulse">
                          <td className="py-3.5 px-2 text-center">
                            <div className="h-4 w-4 bg-slate-200 rounded mx-auto" />
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <div className="h-4 w-8 bg-slate-200 rounded mx-auto" />
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="h-4 w-48 bg-slate-200 rounded mb-1" />
                            <div className="h-3 w-28 bg-slate-100 rounded" />
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="h-4 w-32 bg-slate-200 rounded" />
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="h-4 w-28 bg-slate-200 rounded" />
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <div className="h-4 w-12 bg-slate-200 rounded mx-auto" />
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <div className="h-6 w-20 bg-slate-200 rounded mx-auto" />
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="h-4 w-24 bg-slate-200 rounded" />
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="h-4 w-24 bg-slate-200 rounded" />
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="h-4 w-24 bg-slate-200 rounded" />
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <div className="h-4 w-8 bg-slate-200 rounded mx-auto" />
                          </td>
                        </tr>
                      ))
                    ) : empresas.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-slate-500">
                          <div className="max-w-xs mx-auto flex flex-col items-center gap-2">
                            <Building2 className="w-8 h-8 text-slate-300" />
                            <span className="font-semibold text-slate-700">
                              Nenhum cliente encontrado
                            </span>
                            <p className="text-xs text-slate-400">
                              Tente mudar os termos de busca ou remover os filtros aplicados.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      empresas.map((emp) => {
                        const expandido = empresaExpandidaId === emp.codigo
                        const selecionado = selecionadosCodigos.has(emp.codigo)
                        return (
                          <tr
                            key={emp.codigo}
                            className={`hover:bg-[#F8FAFC] transition-colors ${
                              selecionado ? 'bg-sky-50/60' : expandido ? 'bg-amber-50/30' : ''
                            }`}
                          >
                            {/* Checkbox de seleção */}
                            <td className="py-3 px-2 text-center">
                              <input
                                type="checkbox"
                                aria-label={`Selecionar cliente ${emp.razao_social || emp.codigo}`}
                                checked={selecionado}
                                onChange={() => alternarSelecaoCliente(emp.codigo)}
                                className="rounded border-slate-300 text-[#13335A] focus:ring-[#13335A] h-4 w-4 cursor-pointer"
                              />
                            </td>

                            {/* Código */}
                            <td className="py-3 px-3 text-center font-mono font-bold text-[#0F294A]">
                              {emp.codigo}
                            </td>

                            {/* Razão Social / Nome */}
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-900 leading-snug">
                                  {emp.razao_social || '—'}
                                </span>
                                {emp.tipo_cadastro && (
                                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                                    {emp.tipo_cadastro}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Apelido / Fantasia */}
                            <td className="py-3 px-3 text-slate-700 font-medium">
                              {emp.apelido || '—'}
                            </td>

                            {/* Documento formatado com validação e badge visual de erro manual */}
                            <td className="py-3 px-3 font-mono text-[11px] text-slate-700">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5">
                                  {emp.tipo_documento && (
                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-sans text-[10px] font-bold">
                                      {emp.tipo_documento}
                                    </span>
                                  )}
                                  <BadgeDocumentoCliente
                                    documento={emp.cpf_cnpj || emp.numero_documento}
                                    tipoDocumento={emp.tipo_documento}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Situação */}
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                                  emp.situacao?.toLowerCase() === 'ativa'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {emp.situacao || 'Ativa'}
                              </span>
                            </td>

                            {/* TECLA INDIVIDUAL ATIVO / INATIVO — Pedido do CEO */}
                            <td className="py-2.5 px-3 text-center whitespace-nowrap bg-slate-50/40">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAbrirModalInativar(emp)
                                }}
                                disabled={inativandoCodigo === emp.codigo}
                                title={`Cliente atualmente ATIVO. Clique ou toque para inativar "${emp.razao_social || emp.codigo}" e transferi-lo para o Cadastro de Clientes Inativos.`}
                                aria-label={`Status Ativo: clique para inativar ${emp.razao_social || emp.codigo}`}
                                className="group relative inline-flex items-center justify-center gap-1.5 min-w-[92px] px-2.5 py-1 text-[11px] font-bold rounded-full border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 active:scale-95 transition-all shadow-xs disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none touch-manipulation focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                              >
                                {inativandoCodigo === emp.codigo ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700 group-hover:text-rose-600 shrink-0" />
                                    <span className="font-semibold text-[10.5px]">Inativando…</span>
                                  </>
                                ) : (
                                  <>
                                    {/* Indicador visual de estado Ativo com hover para Inativar */}
                                    <span className="relative flex h-2 w-2 shrink-0">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 group-hover:opacity-0" />
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600 group-hover:bg-rose-600 transition-colors" />
                                    </span>
                                    <UserCheck className="w-3.5 h-3.5 text-emerald-700 group-hover:hidden shrink-0" />
                                    <UserX className="w-3.5 h-3.5 text-rose-600 hidden group-hover:inline-block shrink-0" />
                                    <span className="group-hover:hidden font-bold">Ativo</span>
                                    <span className="hidden group-hover:inline-block font-bold text-rose-700">
                                      Inativar
                                    </span>
                                  </>
                                )}
                              </button>
                            </td>

                            {/* Regime Tributário (Select Inline com Auto-Save e Badge Visual) */}
                            <td className="py-2.5 px-3">
                              <div className="flex flex-col gap-1 min-w-[190px]">
                                <div className="flex items-center gap-1.5">
                                  {/* Badge indicador visual rápido */}
                                  {emp.regime_tributario ? (
                                    <span
                                      className={`w-2.5 h-2.5 rounded-full shrink-0 border ${
                                        emp.regime_tributario === 'Simples Nacional'
                                          ? 'bg-blue-500 border-blue-600'
                                          : emp.regime_tributario === 'Simples Híbrido'
                                            ? 'bg-cyan-500 border-cyan-600'
                                            : emp.regime_tributario === 'Lucro Presumido'
                                              ? 'bg-amber-500 border-amber-600'
                                              : emp.regime_tributario === 'Lucro Real'
                                                ? 'bg-emerald-500 border-emerald-600'
                                                : 'bg-purple-500 border-purple-600'
                                      }`}
                                      title={`Regime atual: ${emp.regime_tributario}`}
                                    />
                                  ) : (
                                    <span
                                      className="w-2.5 h-2.5 rounded-full shrink-0 bg-slate-300 border border-slate-400"
                                      title="Regime não informado"
                                    />
                                  )}

                                  {/* Select inline estilizador ADECONT */}
                                  <div className="relative flex-1">
                                    <select
                                      aria-label={`Regime tributário da empresa ${emp.razao_social || emp.codigo}`}
                                      value={emp.regime_tributario || ''}
                                      disabled={salvandoInlineCodigo === emp.codigo}
                                      onChange={(e) =>
                                        handleAlterarRegimeInline(emp, e.target.value)
                                      }
                                      className={`w-full py-1 pl-2 pr-6 text-[11px] font-semibold rounded-md border transition-all cursor-pointer bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37] disabled:opacity-60 disabled:cursor-wait ${
                                        emp.regime_tributario === 'Simples Nacional'
                                          ? 'text-blue-900 border-blue-300 bg-blue-50/40 hover:border-blue-400'
                                          : emp.regime_tributario === 'Simples Híbrido'
                                            ? 'text-cyan-900 border-cyan-300 bg-cyan-50/40 hover:border-cyan-400'
                                            : emp.regime_tributario === 'Lucro Presumido'
                                              ? 'text-amber-900 border-amber-300 bg-amber-50/40 hover:border-amber-400'
                                              : emp.regime_tributario === 'Lucro Real'
                                                ? 'text-emerald-900 border-emerald-300 bg-emerald-50/40 hover:border-emerald-400'
                                                : emp.regime_tributario === 'Regime Regular IBS/CBS'
                                                  ? 'text-purple-900 border-purple-300 bg-purple-50/40 hover:border-purple-400'
                                                  : 'text-slate-500 border-slate-300 bg-slate-50/60 italic hover:border-slate-400'
                                      }`}
                                    >
                                      <option
                                        value=""
                                        className="text-slate-400 font-normal italic"
                                      >
                                        Não informado
                                      </option>
                                      {OPCOES_REGIME_TRIBUTARIO.map((opc) => (
                                        <option
                                          key={opc}
                                          value={opc}
                                          className="text-slate-800 font-semibold not-italic"
                                        >
                                          {opc}
                                        </option>
                                      ))}
                                    </select>
                                    {salvandoInlineCodigo === emp.codigo && (
                                      <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <Loader2 className="w-3 h-3 text-[#D4AF37] animate-spin" />
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Feedback inline temporário (sucesso ou erro) */}
                                {statusInline[emp.codigo] && (
                                  <div
                                    className={`text-[10px] font-bold flex items-center gap-1 leading-none ${
                                      statusInline[emp.codigo].tipo === 'ok'
                                        ? 'text-emerald-700'
                                        : 'text-rose-700'
                                    }`}
                                  >
                                    {statusInline[emp.codigo].tipo === 'ok' ? (
                                      <Check className="w-2.5 h-2.5 shrink-0" />
                                    ) : (
                                      <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                                    )}
                                    <span>{statusInline[emp.codigo].texto}</span>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Município / UF */}
                            <td className="py-3 px-3 text-slate-600">
                              {emp.municipio ? (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[150px]">
                                    {emp.municipio}
                                    {emp.uf ? `/${emp.uf}` : ''}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>

                            {/* Contato (Telefone/Email) */}
                            <td className="py-3 px-3 text-slate-600">
                              <div className="flex flex-col gap-0.5 text-[11px]">
                                {emp.telefone && (
                                  <span className="inline-flex items-center gap-1 text-slate-700">
                                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="font-mono">{emp.telefone}</span>
                                  </span>
                                )}
                                {emp.email && (
                                  <span
                                    className="inline-flex items-center gap-1 text-slate-500 truncate max-w-[140px]"
                                    title={emp.email}
                                  >
                                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate">{emp.email}</span>
                                  </span>
                                )}
                                {!emp.telefone && !emp.email && (
                                  <span className="text-slate-400 italic">—</span>
                                )}
                              </div>
                            </td>

                            {/* Ficha completa / Detalhes */}
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => abrirFichaCliente(emp)}
                                className="inline-flex items-center justify-center p-1.5 text-[#0F294A] hover:bg-[#0F294A]/10 rounded-lg transition-colors cursor-pointer"
                                title="Abrir ficha cadastral completa"
                              >
                                <FileText className="w-4 h-4 text-[#0F294A]" />
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* RODAPÉ DA TABELA: PAGINAÇÃO */}
              <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                <div>
                  Mostrando{' '}
                  <span className="font-bold text-slate-800">
                    {totalItens === 0 ? 0 : (paginaAtual - 1) * porPagina + 1}
                  </span>{' '}
                  a{' '}
                  <span className="font-bold text-slate-800">
                    {Math.min(paginaAtual * porPagina, totalItens)}
                  </span>{' '}
                  de{' '}
                  <span className="font-bold text-slate-800">
                    {totalItens.toLocaleString('pt-BR')}
                  </span>{' '}
                  clientes
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPaginaAtual(1)}
                    disabled={paginaAtual <= 1 || carregando}
                    className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    title="Primeira página"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                    disabled={paginaAtual <= 1 || carregando}
                    className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    title="Página anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="px-3 py-1 font-semibold text-slate-700 bg-white border border-slate-200 rounded">
                    Página {paginaAtual} de {totalPaginas}
                  </span>

                  <button
                    onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                    disabled={paginaAtual >= totalPaginas || carregando}
                    className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    title="Próxima página"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPaginaAtual(totalPaginas)}
                    disabled={paginaAtual >= totalPaginas || carregando}
                    className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    title="Última página"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* MODAL DETALHADO DA EMPRESA (FICHA CADASTRAL COMPLETA COM CAMPOS, CONTATOS E ARQUIVOS) */}
      {modalEmpresa && (
        <ModalFichaClienteDetalhada
          empresa={modalEmpresa}
          camposDef={camposDef}
          onFechar={() => setModalEmpresa(null)}
          onAbrirGerenciadorCampos={() => setModalGerenciarCamposAberto(true)}
          onAlterarStatus={(emp) => handleAbrirModalInativar(emp)}
        />
      )}

      {/* MODAL DE GERENCIAMENTO DE CAMPOS PERSONALIZADOS DA FICHA */}
      <ModalGerenciarCamposPersonalizados
        aberto={modalGerenciarCamposAberto}
        campos={camposDef}
        onFechar={() => setModalGerenciarCamposAberto(false)}
        onCamposAtualizados={carregarDefinicoesCampos}
      />

      {/* MODAL DE IMPORTAÇÃO E EXPORTAÇÃO EM MASSA DE DADOS COMPLEMENTARES */}
      <ModalImportExportMassaClientes
        aberto={modalImportExportAberto}
        empresas={empresas}
        camposDef={camposDef}
        onFechar={() => setModalImportExportAberto(false)}
        onSucessoImportacao={() => {
          carregarDados()
        }}
      />

      {/* MODAL DE RECEPÇÃO DE DOCUMENTO — MESMO FLUXO DE /ANALISES-EMPRESARIAIS */}
      <ModalRecepcionarDocumentoCliente
        aberto={modalRecepcaoAberto}
        aoFechar={() => setModalRecepcaoAberto(false)}
        onClientePronto={(cliente, criado) => {
          setAvisoRecepcao(
            criado
              ? `Cliente "${cliente.razao_social}" cadastrado (código ${cliente.codigo}) com o documento recepcionado vinculado à ficha.`
              : `Cliente "${cliente.razao_social}" já existia — documento recepcionado vinculado à ficha.`,
          )
          toast({
            title: criado
              ? 'Cliente criado com documento recepcionado'
              : 'Documento vinculado à ficha existente',
            description: `${cliente.razao_social} (código ${cliente.codigo}).`,
          })
          carregarDados()
        }}
      />

      {/* MODAL DO RELATÓRIO A4 IMPRIMÍVEL COM SELO ADECONT */}
      {modalRelatorioAberto && (
        <RelatorioClientesImprimivel
          aoFechar={() => setModalRelatorioAberto(false)}
          empresas={empresasRelatorio}
          termoBusca={termoBusca}
          filtroTipoDoc={filtroTipoDoc}
          filtroSituacao={filtroSituacao}
          filtroRegime={filtroRegime}
          ordenacao={ordenacao}
          totalBanco={totalItens}
        />
      )}

      {/* MODAL DE CONFIRMAÇÃO INDIVIDUAL COM CAMPO DE MOTIVO */}
      {clienteParaInativar && (
        <ModalConfirmarStatusCliente
          aberto={Boolean(clienteParaInativar)}
          acao="inativar"
          cliente={{
            codigo: clienteParaInativar.codigo,
            razao_social: clienteParaInativar.razao_social,
            cpf_cnpj: clienteParaInativar.numero_documento,
            numero_documento: clienteParaInativar.numero_documento,
            situacao: clienteParaInativar.situacao,
            id: clienteParaInativar.id,
          }}
          processando={inativandoCodigo === clienteParaInativar.codigo}
          aoConfirmar={handleConfirmarInativacao}
          aoCancelar={() => setClienteParaInativar(null)}
        />
      )}

      {/* RODAPÉ INSTITUCIONAL */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ADECONT Assessoria Contábil e Administrativa • Sistema de Gestão Analítica</span>
          <span className="text-[11px] text-slate-400 font-mono">
            {totalItens} registros indexados
          </span>
        </div>
      </footer>
    </div>
  )
}
