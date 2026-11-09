import React, { useState, useEffect, useRef } from 'react'
import {
  Building2,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  User,
  ExternalLink,
  Plus,
  Trash2,
  Upload,
  Download,
  Check,
  MessageCircle,
  Instagram,
  Facebook,
  Linkedin,
  Send,
  Globe,
  Sliders,
  Paperclip,
  Share2,
  Save,
} from 'lucide-react'
import { EmpresaRecord } from '@/types/cadastroEmpresas'
import {
  CampoPersonalizadoDef,
  ClienteContato,
  ClienteArquivo,
  TipoCanalContato,
} from '@/types/clienteDadosComplementares'
import {
  carregarDadosComplementaresCliente,
  salvarValoresCamposCliente,
  salvarContatoCliente,
  excluirContatoCliente,
  uploadArquivoCliente,
  excluirArquivoCliente,
  sanitizarDoc,
} from '@/services/clienteDadosComplementaresService'
import { BotaoCanalContato } from './BotaoCanalContato'
import { useToast } from '@/hooks/use-toast'

interface ModalFichaClienteDetalhadaProps {
  empresa: EmpresaRecord | null
  camposDef: CampoPersonalizadoDef[]
  onFechar: () => void
  onAbrirGerenciadorCampos: () => void
  onAlterarRegime?: (empresa: EmpresaRecord) => void
  onAlterarStatus?: (empresa: EmpresaRecord) => void
}

export const ModalFichaClienteDetalhada: React.FC<ModalFichaClienteDetalhadaProps> = ({
  empresa,
  camposDef,
  onFechar,
  onAbrirGerenciadorCampos,
  onAlterarRegime,
  onAlterarStatus,
}) => {
  const { toast } = useToast()
  const [abaAtiva, setAbaAtiva] = useState<'geral' | 'complementar' | 'contatos' | 'arquivos'>(
    'geral',
  )

  // Estados dos dados complementares
  const [carregandoDados, setCarregandoDados] = useState(false)
  const [valoresCampos, setValoresCampos] = useState<Record<string, string>>({})
  const [contatos, setContatos] = useState<ClienteContato[]>([])
  const [arquivos, setArquivos] = useState<ClienteArquivo[]>([])
  const [salvandoCampos, setSalvandoCampos] = useState(false)

  // Formulário para novo canal de contato
  const [novoContatoTipo, setNovoContatoTipo] = useState<TipoCanalContato>('whatsapp')
  const [novoContatoIdentificador, setNovoContatoIdentificador] = useState('')
  const [novoContatoRotulo, setNovoContatoRotulo] = useState('')
  const [novoContatoResp, setNovoContatoResp] = useState('')
  const [salvandoContato, setSalvandoContato] = useState(false)

  // Upload de arquivos
  const [tituloArquivo, setTituloArquivo] = useState('')
  const [categoriaArquivo, setCategoriaArquivo] = useState('Contrato')
  const [arquivoUpload, setArquivoUpload] = useState<File | null>(null)
  const [enviandoArquivo, setEnviandoArquivo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const docLimpo = empresa ? sanitizarDoc(empresa.documento_limpo || empresa.numero_documento) : ''

  // Carrega dados complementares ao abrir a ficha do cliente
  useEffect(() => {
    if (!empresa) return

    let ativo = true
    setCarregandoDados(true)

    carregarDadosComplementaresCliente(docLimpo, empresa.codigo)
      .then((dados) => {
        if (!ativo) return
        setValoresCampos(dados.camposValores)
        setContatos(dados.contatos)
        setArquivos(dados.arquivos)
      })
      .catch((err) => {
        console.warn('Erro ao carregar dados complementares da ficha:', err)
      })
      .finally(() => {
        if (ativo) setCarregandoDados(false)
      })

    return () => {
      ativo = false
    }
  }, [empresa?.codigo, docLimpo])

  if (!empresa) return null

  // Salvar valores dos campos personalizados
  const handleSalvarValoresCampos = async () => {
    setSalvandoCampos(true)
    try {
      await salvarValoresCamposCliente(docLimpo, valoresCampos, empresa.codigo, 'ADECONT Operador')
      toast({
        title: 'Dados complementares salvos',
        description: 'Os valores dos campos personalizados foram atualizados com sucesso.',
      })
    } catch (e: any) {
      toast({
        title: 'Erro ao salvar campos',
        description: e?.message || 'Falha ao salvar valores dos campos personalizados.',
        variant: 'destructive',
      })
    } finally {
      setSalvandoCampos(false)
    }
  }

  // Adicionar novo canal de contato
  const handleAdicionarContato = async () => {
    if (!novoContatoIdentificador.trim()) {
      toast({
        title: 'Identificador obrigatório',
        description: 'Informe o e-mail, telefone/WhatsApp ou link da rede social.',
        variant: 'destructive',
      })
      return
    }

    setSalvandoContato(true)
    try {
      const novo = await salvarContatoCliente({
        cliente_cnpj: docLimpo,
        cliente_codigo: empresa.codigo,
        tipo: novoContatoTipo,
        identificador: novoContatoIdentificador.trim(),
        rotulo: novoContatoRotulo.trim() || undefined,
        nome_responsavel: novoContatoResp.trim() || undefined,
      })

      setContatos((prev) => [...prev, novo])
      setNovoContatoIdentificador('')
      setNovoContatoRotulo('')
      setNovoContatoResp('')

      toast({
        title: 'Canal de contato adicionado',
        description: `${novoContatoTipo.toUpperCase()} cadastrado com sucesso na ficha do cliente.`,
      })
    } catch (e: any) {
      toast({
        title: 'Erro ao adicionar contato',
        description: e?.message || 'Falha ao gravar canal de contato.',
        variant: 'destructive',
      })
    } finally {
      setSalvandoContato(false)
    }
  }

  // Excluir canal de contato
  const handleExcluirContato = async (id?: string) => {
    if (!id) return
    try {
      await excluirContatoCliente(id)
      setContatos((prev) => prev.filter((c) => c.id !== id))
      toast({
        title: 'Contato removido',
        description: 'O canal de contato foi excluído da ficha.',
      })
    } catch (e: any) {
      toast({
        title: 'Erro ao excluir contato',
        description: e?.message || 'Falha ao remover canal de contato.',
        variant: 'destructive',
      })
    }
  }

  // Anexar arquivo
  const handleUploadArquivo = async () => {
    if (!arquivoUpload) {
      toast({
        title: 'Nenhum arquivo selecionado',
        description: 'Escolha um arquivo do seu computador para anexar.',
        variant: 'destructive',
      })
      return
    }

    setEnviandoArquivo(true)
    try {
      const arq = await uploadArquivoCliente({
        clienteCnpj: docLimpo,
        clienteCodigo: empresa.codigo,
        titulo: tituloArquivo.trim() || arquivoUpload.name,
        categoria: categoriaArquivo,
        file: arquivoUpload,
        enviadoPor: 'ADECONT Operador',
      })

      setArquivos((prev) => [arq, ...prev])
      setArquivoUpload(null)
      setTituloArquivo('')
      if (fileInputRef.current) fileInputRef.current.value = ''

      toast({
        title: 'Arquivo anexado com sucesso',
        description: `O arquivo "${arq.titulo}" está disponível na ficha cadastral.`,
      })
    } catch (e: any) {
      toast({
        title: 'Erro no upload',
        description: e?.message || 'Não foi possível anexar o arquivo.',
        variant: 'destructive',
      })
    } finally {
      setEnviandoArquivo(false)
    }
  }

  // Excluir arquivo
  const handleExcluirArquivo = async (id?: string) => {
    if (!id) return
    const confirmou = window.confirm('Deseja realmente excluir este anexo da ficha do cliente?')
    if (!confirmou) return

    try {
      await excluirArquivoCliente(id)
      setArquivos((prev) => prev.filter((a) => a.id !== id))
      toast({
        title: 'Arquivo excluído',
        description: 'O anexo foi removido com sucesso.',
      })
    } catch (e: any) {
      toast({
        title: 'Erro ao excluir arquivo',
        description: e?.message || 'Não foi possível excluir o anexo.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onFechar}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABEÇALHO DA FICHA */}
        <div className="bg-[#0F294A] text-white px-6 py-4 flex items-center justify-between border-b border-[#0A1D34]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#D4AF37]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#D4AF37]">
                  CÓD. {empresa.codigo}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-white/10 text-slate-200">
                  {empresa.tipo_documento || 'DOC'}
                </span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded font-bold ${
                    empresa.situacao === 'Inativa'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {empresa.situacao || 'Ativa'}
                </span>
              </div>
              <h2 className="font-serif font-bold text-base sm:text-lg leading-tight mt-0.5">
                {empresa.razao_social || empresa.nome || 'Cliente Sem Nome'}
              </h2>
            </div>
          </div>

          <button
            onClick={onFechar}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVEGAÇÃO DE SEÇÕES DA FICHA */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-1 overflow-x-auto">
          <button
            onClick={() => setAbaAtiva('geral')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
              abaAtiva === 'geral'
                ? 'border-[#0F294A] text-[#0F294A] bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Dados Gerais</span>
          </button>

          <button
            onClick={() => setAbaAtiva('complementar')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
              abaAtiva === 'complementar'
                ? 'border-[#0F294A] text-[#0F294A] bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Campos Personalizados</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
              {camposDef.length}
            </span>
          </button>

          <button
            onClick={() => setAbaAtiva('contatos')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
              abaAtiva === 'contatos'
                ? 'border-[#0F294A] text-[#0F294A] bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Contatos & Redes Sociais</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800">
              {contatos.length}
            </span>
          </button>

          <button
            onClick={() => setAbaAtiva('arquivos')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
              abaAtiva === 'arquivos'
                ? 'border-[#0F294A] text-[#0F294A] bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5 text-blue-600" />
            <span>Arquivos Anexos</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800">
              {arquivos.length}
            </span>
          </button>
        </div>

        {/* CONTEÚDO DA ABA SELECIONADA */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-4 text-xs">
          {/* ==================================================== */}
          {/* ABA 1: DADOS GERAIS */}
          {/* ==================================================== */}
          {abaAtiva === 'geral' && (
            <div className="flex flex-col gap-4">
              {/* Barra rápida de ações de Status e Regime */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Situação Atual
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {empresa.situacao || 'Ativa'}
                    </span>
                  </div>
                  <div className="border-l border-slate-200 pl-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Regime Tributário
                    </span>
                    <span className="text-xs font-bold text-[#0F294A]">
                      {empresa.regime_tributario || 'Não informado'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onAlterarRegime && (
                    <button
                      onClick={() => onAlterarRegime(empresa)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-[#0F294A] text-slate-700 hover:text-[#0F294A] font-bold text-xs transition-colors cursor-pointer"
                    >
                      Alterar Regime
                    </button>
                  )}
                  {onAlterarStatus && (
                    <button
                      onClick={() => onAlterarStatus(empresa)}
                      className="px-3 py-1.5 rounded-lg bg-[#0F294A] text-white hover:bg-[#1a3d6b] font-bold text-xs transition-colors cursor-pointer"
                    >
                      Alterar Status
                    </button>
                  )}
                </div>
              </div>

              {/* Grid de Informações Cadastrais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Apelido / Nome Fantasia
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    {empresa.apelido || empresa.nome_fantasia || '—'}
                  </span>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    CNPJ / CPF
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-800">
                    {empresa.numero_documento || empresa.documento_limpo || '—'}
                  </span>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Inscrição Estadual
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    {empresa.inscricao_estadual || '—'}
                  </span>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Inscrição Municipal
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    {empresa.inscricao_municipal || '—'}
                  </span>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    CNAE Principal
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    {empresa.cnae ? `${empresa.cnae} — ${empresa.ramo_atividade || ''}` : '—'}
                  </span>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Início de Atividades
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    {empresa.inicio_atividades || empresa.data_inicio_atividades || '—'}
                  </span>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl sm:col-span-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Endereço Completo
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    {[
                      empresa.endereco,
                      empresa.numero_endereco,
                      empresa.bairro,
                      empresa.municipio ? `${empresa.municipio} - ${empresa.uf || ''}` : '',
                      empresa.cep ? `CEP: ${empresa.cep}` : '',
                    ]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </span>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Porte da Empresa
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    {empresa.porte || '—'}
                  </span>
                </div>
              </div>

              {/* Botões rápidos de canais existentes para clique direto */}
              {contatos.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-slate-700">
                    Canais de Contato Rápidos (Clique para abrir):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {contatos.map((ctt) => (
                      <BotaoCanalContato
                        key={ctt.id || ctt.identificador}
                        tipo={ctt.tipo}
                        identificador={ctt.identificador}
                        rotulo={ctt.rotulo}
                        nomeResponsavel={ctt.nome_responsavel}
                        showText={true}
                        tamanho="sm"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* ABA 2: CAMPOS PERSONALIZADOS */}
          {/* ==================================================== */}
          {abaAtiva === 'complementar' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">
                    Dados Complementares Personalizados
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Preencha os valores dos campos criados para este cliente
                  </p>
                </div>

                <button
                  onClick={onAbrirGerenciadorCampos}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[#0F294A] bg-white text-slate-700 hover:text-[#0F294A] font-bold text-xs transition-colors cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Gerenciar / Criar Campos</span>
                </button>
              </div>

              {camposDef.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2 bg-slate-50 rounded-xl border border-slate-200">
                  <Sliders className="w-8 h-8 text-slate-300" />
                  <span>Nenhum campo personalizado cadastrado no sistema.</span>
                  <button
                    onClick={onAbrirGerenciadorCampos}
                    className="mt-2 px-4 py-2 rounded-lg bg-[#0F294A] text-white font-bold text-xs hover:bg-[#1a3d6b] cursor-pointer"
                  >
                    Criar Meu Primeiro Campo
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {camposDef.map((campo) => {
                    const valorAtual = valoresCampos[campo.chave] ?? ''

                    return (
                      <div
                        key={campo.id || campo.chave}
                        className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-700">
                            {campo.rotulo}
                          </label>
                          <span className="text-[10px] text-slate-400 uppercase font-mono">
                            {campo.tipo}
                          </span>
                        </div>

                        {campo.tipo === 'selecao' ? (
                          <select
                            value={valorAtual}
                            onChange={(e) =>
                              setValoresCampos({ ...valoresCampos, [campo.chave]: e.target.value })
                            }
                            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F294A]/20 cursor-pointer"
                          >
                            <option value="">Selecione...</option>
                            {(campo.opcoes || '')
                              .split(',')
                              .map((op) => op.trim())
                              .filter(Boolean)
                              .map((opcao) => (
                                <option key={opcao} value={opcao}>
                                  {opcao}
                                </option>
                              ))}
                          </select>
                        ) : campo.tipo === 'booleano' ? (
                          <select
                            value={valorAtual}
                            onChange={(e) =>
                              setValoresCampos({ ...valoresCampos, [campo.chave]: e.target.value })
                            }
                            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F294A]/20 cursor-pointer"
                          >
                            <option value="">Não informado</option>
                            <option value="Sim">Sim</option>
                            <option value="Não">Não</option>
                          </select>
                        ) : campo.tipo === 'data' ? (
                          <input
                            type="date"
                            value={valorAtual}
                            onChange={(e) =>
                              setValoresCampos({ ...valoresCampos, [campo.chave]: e.target.value })
                            }
                            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F294A]/20"
                          />
                        ) : campo.tipo === 'numero' ? (
                          <input
                            type="number"
                            value={valorAtual}
                            onChange={(e) =>
                              setValoresCampos({ ...valoresCampos, [campo.chave]: e.target.value })
                            }
                            placeholder="0"
                            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F294A]/20"
                          />
                        ) : (
                          <input
                            type="text"
                            value={valorAtual}
                            onChange={(e) =>
                              setValoresCampos({ ...valoresCampos, [campo.chave]: e.target.value })
                            }
                            placeholder={`Preencha ${campo.rotulo}...`}
                            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F294A]/20"
                          />
                        )}

                        {campo.descricao && (
                          <span className="text-[10px] text-slate-400">{campo.descricao}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {camposDef.length > 0 && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSalvarValoresCampos}
                    disabled={salvandoCampos}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F294A] hover:bg-[#1a3d6b] text-white text-xs font-bold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>{salvandoCampos ? 'Salvando...' : 'Salvar Dados Complementares'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* ABA 3: CONTATOS & REDES SOCIAIS */}
          {/* ==================================================== */}
          {abaAtiva === 'contatos' && (
            <div className="flex flex-col gap-4">
              {/* Formulário de Inclusão de Canal de Contato */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-3">
                <span className="text-xs font-bold text-[#0F294A] flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-[#D4AF37]" />
                  Adicionar Canal de Contato ou Rede Social
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-700">Tipo de Canal</label>
                    <select
                      value={novoContatoTipo}
                      onChange={(e) => setNovoContatoTipo(e.target.value as TipoCanalContato)}
                      className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F294A]/20 cursor-pointer"
                    >
                      <option value="whatsapp">WhatsApp / Celular</option>
                      <option value="email">E-mail</option>
                      <option value="instagram">Instagram</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="facebook">Facebook</option>
                      <option value="telegram">Telegram</option>
                      <option value="site">Website</option>
                      <option value="outro">Outro canal</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Identificador (Número, E-mail ou Link) *
                    </label>
                    <input
                      type="text"
                      value={novoContatoIdentificador}
                      onChange={(e) => setNovoContatoIdentificador(e.target.value)}
                      placeholder={
                        novoContatoTipo === 'whatsapp'
                          ? '(11) 98765-4321'
                          : novoContatoTipo === 'email'
                            ? 'nome@empresa.com.br'
                            : '@usuario ou link'
                      }
                      className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F294A]/20"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Rótulo / Departamento (Opcional)
                    </label>
                    <input
                      type="text"
                      value={novoContatoRotulo}
                      onChange={(e) => setNovoContatoRotulo(e.target.value)}
                      placeholder="Ex: Comercial, Financeiro, Diretoria"
                      className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F294A]/20"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex-1 max-w-xs">
                    <input
                      type="text"
                      value={novoContatoResp}
                      onChange={(e) => setNovoContatoResp(e.target.value)}
                      placeholder="Nome do Responsável (Opcional)"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F294A]/20"
                    />
                  </div>

                  <button
                    onClick={handleAdicionarContato}
                    disabled={salvandoContato}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0F294A] text-white text-xs font-bold hover:bg-[#1a3d6b] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>{salvandoContato ? 'Adicionando...' : 'Adicionar Canal'}</span>
                  </button>
                </div>
              </div>

              {/* Lista de Contatos Cadastrados */}
              <div className="flex flex-col divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {contatos.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                    <MessageCircle className="w-8 h-8 text-slate-300" />
                    <span>Nenhum canal de contato ou rede social cadastrado.</span>
                    <span className="text-[11px] text-slate-400">
                      Adicione WhatsApp, E-mail, Instagram, LinkedIn no formulário acima.
                    </span>
                  </div>
                ) : (
                  contatos.map((ctt) => (
                    <div
                      key={ctt.id || ctt.identificador}
                      className="p-3.5 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <BotaoCanalContato
                          tipo={ctt.tipo}
                          identificador={ctt.identificador}
                          rotulo={ctt.rotulo}
                          nomeResponsavel={ctt.nome_responsavel}
                          tamanho="md"
                        />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-xs">
                              {ctt.rotulo || ctt.tipo.toUpperCase()}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {ctt.identificador}
                            </span>
                          </div>
                          {ctt.nome_responsavel && (
                            <span className="text-[11px] text-slate-400">
                              Responsável: {ctt.nome_responsavel}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleExcluirContato(ctt.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Excluir canal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* ABA 4: ARQUIVOS ANEXOS */}
          {/* ==================================================== */}
          {abaAtiva === 'arquivos' && (
            <div className="flex flex-col gap-4">
              {/* Formulário de Upload */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-3">
                <span className="text-xs font-bold text-[#0F294A] flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-[#D4AF37]" />
                  Anexar Novo Arquivo ao Cadastro
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-700">Título / Nome</label>
                    <input
                      type="text"
                      value={tituloArquivo}
                      onChange={(e) => setTituloArquivo(e.target.value)}
                      placeholder="Ex: Contrato Social 2026"
                      className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F294A]/20"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-700">Categoria</label>
                    <select
                      value={categoriaArquivo}
                      onChange={(e) => setCategoriaArquivo(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F294A]/20 cursor-pointer"
                    >
                      <option value="Contrato">Contrato</option>
                      <option value="Documento Societário">Documento Societário</option>
                      <option value="Procuração">Procuração</option>
                      <option value="Fiscal">Fiscal / Tributário</option>
                      <option value="Certidão">Certidão Negativa</option>
                      <option value="Outro">Outro documento</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Arquivo (PDF, Imagem, Doc)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setArquivoUpload(e.target.files[0])
                        }
                      }}
                      className="px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleUploadArquivo}
                    disabled={enviandoArquivo || !arquivoUpload}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0F294A] text-white text-xs font-bold hover:bg-[#1a3d6b] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>{enviandoArquivo ? 'Enviando...' : 'Enviar Anexo'}</span>
                  </button>
                </div>
              </div>

              {/* Lista de Arquivos */}
              <div className="flex flex-col divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {arquivos.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                    <Paperclip className="w-8 h-8 text-slate-300" />
                    <span>Nenhum arquivo anexado a este cliente.</span>
                    <span className="text-[11px] text-slate-400">
                      Anexe contratos, procurações ou certidões no formulário acima.
                    </span>
                  </div>
                ) : (
                  arquivos.map((arq) => (
                    <div
                      key={arq.id}
                      className="p-3.5 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
                          <Paperclip className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-xs">{arq.titulo}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {arq.categoria || 'Geral'}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {arq.nome_original} •{' '}
                            {arq.tamanho_bytes ? `${(arq.tamanho_bytes / 1024).toFixed(1)} KB` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {arq.url && (
                          <a
                            href={arq.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Baixar</span>
                          </a>
                        )}
                        <button
                          onClick={() => handleExcluirArquivo(arq.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir arquivo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* RODAPÉ */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            {empresa.documento_limpo ? `Doc: ${empresa.documento_limpo}` : `Cód: ${empresa.codigo}`}
          </span>
          <button
            onClick={onFechar}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Fechar Ficha
          </button>
        </div>
      </div>
    </div>
  )
}
