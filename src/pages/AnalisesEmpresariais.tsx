import React, { useState, useEffect } from 'react'
import {
  BarChart3,
  Building2,
  Users,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  FileCheck,
  FileInput,
} from 'lucide-react'
import { PanoramaHeader } from '@/components/PanoramaHeader'
import { PanoramaFooter } from '@/components/PanoramaFooter'
import { PanoramaSideMenu } from '@/components/PanoramaSideMenu'
import {
  carregarDossieCompletoCliente,
  type SinteseAnaliseEmpresarial,
} from '@/services/analisesEmpresariais'
import {
  buscarIndicesMercadoAnalises,
  type ItemIndiceMercado,
} from '@/services/dadosMercadoAnalises'
import {
  buscarIndicadoresSetoriais,
  type ItemIndicadorSetorial,
} from '@/services/indicadoresSetoriais'
import { listarEmpresasParaRelatorio } from '@/services/cadastroEmpresas'
import type { EmpresaRecord } from '@/types/cadastroEmpresas'
import { ImportadorDocumentosEmpresariais } from '@/components/ImportadorDocumentosEmpresariais'
import { BadgeDocumentoCliente } from '@/components/BadgeDocumentoCliente'
import { PainelAnalisesEmpresariais } from '@/components/PainelAnalisesEmpresariais'
import { ModalRecepcionarDocumentoCliente } from '@/components/ModalRecepcionarDocumentoCliente'

export const AnalisesEmpresariais: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [empresas, setEmpresas] = useState<EmpresaRecord[]>([])
  const [clienteSelecionado, setClienteSelecionado] = useState<EmpresaRecord | null>(null)
  const [filtroTexto, setFiltroTexto] = useState('')
  const [carregandoLista, setCarregandoLista] = useState(true)
  const [carregandoAnalise, setCarregandoAnalise] = useState(false)
  const [dossie, setDossie] = useState<SinteseAnaliseEmpresarial | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [indicesMercado, setIndicesMercado] = useState<ItemIndiceMercado[]>([])
  const [carregandoMercado, setCarregandoMercado] = useState(false)
  const [atualizadoMercadoEm, setAtualizadoMercadoEm] = useState<string>('')
  const [indicadoresSetoriais, setIndicadoresSetoriais] = useState<ItemIndicadorSetorial[]>([])
  const [carregandoSetoriais, setCarregandoSetoriais] = useState(false)
  const [atualizadoSetoriaisEm, setAtualizadoSetoriaisEm] = useState<string>('')
  const [modalRecepcaoAberto, setModalRecepcaoAberto] = useState(false)
  const [avisoRecepcao, setAvisoRecepcao] = useState<string>('')

  // Carrega a lista real de clientes
  const carregarListaClientes = async () => {
    setCarregandoLista(true)
    setErro(null)
    try {
      const lista = await listarEmpresasParaRelatorio()
      setEmpresas(lista || [])
      if (lista && lista.length > 0 && !clienteSelecionado) {
        setClienteSelecionado(lista[0])
      }
    } catch (err: any) {
      console.error('[AnalisesEmpresariais] Erro ao carregar empresas:', err)
      setErro('Não foi possível obter a lista de clientes cadastrados.')
    } finally {
      setCarregandoLista(false)
    }
  }

  // Carrega os índices de mercado do backend (SELIC, IPCA, Ibovespa, IFIX, USD, Juros, Inadimplência)
  const carregarMercado = async () => {
    setCarregandoMercado(true)
    try {
      const res = await buscarIndicesMercadoAnalises()
      setIndicesMercado(res.itens)
      setAtualizadoMercadoEm(res.atualizadoEm)
    } catch (err) {
      console.error('[AnalisesEmpresariais] Erro ao carregar dados de mercado:', err)
    } finally {
      setCarregandoMercado(false)
    }
  }

  // Carrega os indicadores econômicos setoriais (agro, construção, comércio, crédito)
  const carregarSetoriais = async () => {
    setCarregandoSetoriais(true)
    try {
      const res = await buscarIndicadoresSetoriais()
      setIndicadoresSetoriais(res.itens)
      setAtualizadoSetoriaisEm(res.atualizadoEm)
    } catch (err) {
      console.error('[AnalisesEmpresariais] Erro ao carregar indicadores setoriais:', err)
    } finally {
      setCarregandoSetoriais(false)
    }
  }

  useEffect(() => {
    carregarListaClientes()
    carregarMercado()
    carregarSetoriais()
  }, [])

  // Carrega a síntese de análise quando o cliente selecionado mudar
  const carregarAnaliseDoCliente = async (cliente: EmpresaRecord) => {
    setCarregandoAnalise(true)
    setErro(null)
    try {
      const res = await carregarDossieCompletoCliente(cliente)
      setDossie(res)
    } catch (err: any) {
      console.error('[AnalisesEmpresariais] Erro ao analisar cliente:', err)
      setErro('Falha ao processar os dados integrados do cliente.')
    } finally {
      setCarregandoAnalise(false)
    }
  }

  useEffect(() => {
    if (clienteSelecionado) {
      carregarAnaliseDoCliente(clienteSelecionado)
    } else {
      setDossie(null)
    }
  }, [clienteSelecionado])

  const empresasFiltradas = empresas.filter((emp) => {
    const termo = filtroTexto.toLowerCase().trim()
    if (!termo) return true
    const doc = (emp.documento_limpo || emp.numero_documento || emp.cpf_cnpj || '').toLowerCase()
    const nome = (emp.razao_social || emp.nome || '').toLowerCase()
    const fantasia = (emp.nome_fantasia || '').toLowerCase()
    return doc.includes(termo) || nome.includes(termo) || fantasia.includes(termo)
  })

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <PanoramaHeader searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      {/* Menu Lateral da Aplicação (fixo em lg: w-60 z-40 e gaveta mobile z-50) */}
      <PanoramaSideMenu />

      {/* Corpo da página com recuo lg:pl-60 para não sobrepor o menu lateral fixo em desktop */}
      <div className="flex-1 flex flex-col lg:pl-60">
        {/* Conteúdo Central */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Banner do Módulo */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <BarChart3 className="w-6 h-6" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Inteligência & Diagnóstico Integrado
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-white">Análises Empresariais</h1>
              <p className="text-xs text-slate-300 max-w-2xl">
                Centro de integração analítica ADECONT: cruzamento de balanços, DREs, NFe, fontes
                estatísticas oficiais, repositório legislativo e parecer dos agentes especialistas,
                com segregação por cliente e emissão de relatório técnico A4.
              </p>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                Base Ativa
              </span>
              <span className="text-lg font-black text-emerald-400">
                {empresas.length} Empresas
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Segregação por CNPJ</span>
            </div>
          </div>

          {/* Área 1: Seletor de Cliente */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Seleção de Cliente (Segregação de Resultados)
                </h2>
              </div>
              <button
                onClick={() => setModalRecepcaoAberto(true)}
                className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors cursor-pointer"
              >
                <FileInput className="w-3.5 h-3.5" />
                Recepcionar Documento / Criar Cliente
              </button>
              <div className="relative min-w-[260px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por razão social ou CNPJ..."
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {carregandoLista ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                Carregando carteira de clientes cadastrados...
              </div>
            ) : empresas.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-500">
                Nenhuma empresa encontrada no cadastro. Cadastre um cliente para iniciar as
                análises.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {empresasFiltradas.map((emp) => {
                  const selecionado = clienteSelecionado?.id === emp.id
                  return (
                    <button
                      key={emp.id}
                      onClick={() => setClienteSelecionado(emp)}
                      className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                        selecionado
                          ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-600'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 truncate max-w-[190px]">
                          {emp.razao_social || emp.nome}
                        </span>
                        {selecionado && (
                          <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                      </div>
                      <div className="flex flex-col gap-1 mt-1 text-[11px] text-slate-500">
                        <div className="flex items-center justify-between">
                          <BadgeDocumentoCliente
                            documento={emp.documento_limpo || emp.numero_documento || emp.cpf_cnpj}
                            tipoDocumento={emp.tipo_documento}
                          />
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.2 rounded">
                            {emp.regime_tributario || emp.enquadramento_tributario || 'Regime N/D'}
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {avisoRecepcao && (
            <div className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <FileInput className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{avisoRecepcao}</span>
              <button
                onClick={() => setAvisoRecepcao('')}
                className="ml-auto text-emerald-600 hover:text-emerald-800 font-bold"
                aria-label="Fechar aviso"
              >
                ×
              </button>
            </div>
          )}

          {/* Exibição condicional da Análise do Cliente Selecionado */}
          {clienteSelecionado && (
            <div className="space-y-6">
              {/* Área 2: Importador de Balanços, DRE e Documentos Empresariais */}
              <ImportadorDocumentosEmpresariais
                cliente={clienteSelecionado}
                onDocumentoImportado={() => carregarAnaliseDoCliente(clienteSelecionado)}
              />

              {/* Área 3: Painel Macro/Micro com Indicadores, Repositório e Agentes */}
              {carregandoAnalise ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-800">
                    Sincronizando dados de balancetes, NFe, fontes estatísticas e pareceres dos
                    agentes...
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Calculando valores líquidos mensais e cruzando com o repositório legislativo.
                  </p>
                </div>
              ) : erro ? (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{erro}</span>
                </div>
              ) : dossie ? (
                <PainelAnalisesEmpresariais
                  dossie={dossie}
                  todasEmpresas={empresas}
                  indicesMercado={indicesMercado}
                  carregandoMercado={carregandoMercado}
                  atualizadoMercadoEm={atualizadoMercadoEm}
                  onRecarregarMercado={carregarMercado}
                  indicadoresSetoriais={indicadoresSetoriais}
                  carregandoSetoriais={carregandoSetoriais}
                  atualizadoSetoriaisEm={atualizadoSetoriaisEm}
                  onRecarregarSetoriais={carregarSetoriais}
                />
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-xs text-slate-500">
                  Selecione um cliente para carregar a análise integrada.
                </div>
              )}
            </div>
          )}
        </main>

        <PanoramaFooter />
      </div>

      {/* Modal de Recepção de Documento e Criação de Cliente */}
      <ModalRecepcionarDocumentoCliente
        aberto={modalRecepcaoAberto}
        aoFechar={() => setModalRecepcaoAberto(false)}
        onClientePronto={async (cliente, criado) => {
          setAvisoRecepcao(
            criado
              ? `Cliente "${cliente.razao_social}" cadastrado (código ${cliente.codigo}) com o documento recepcionado vinculado à ficha. Ele já aparece na seleção acima e em /cadastro-clientes.`
              : `Cliente "${cliente.razao_social}" já existia — documento recepcionado vinculado à ficha.`,
          )
          await carregarListaClientes()
          if (clienteSelecionado?.id !== cliente.id) {
            setClienteSelecionado(cliente)
          }
        }}
      />
    </div>
  )
}
export default AnalisesEmpresariais
