/**
 * MODAL DE ANEXO DE PDFs EM MASSA AOS CLIENTES
 * =============================================
 * Sistema ADECONT — Projeto Panorama
 *
 * Etapas:
 *  1. Seleção: input multiple + arrastar-e-soltar (somente PDF, lote até 10.000);
 *  2. Revisão: cliente identificado automaticamente por CNPJ/CPF ou código no
 *     nome do arquivo — o que não identificar, o usuário confirma/ajusta com
 *     busca na listagem (ou aplica um único cliente para todos);
 *  3. Processamento sequencial com progresso, sem travar a interface;
 *  4. Resumo: anexados, duplicados (mesmo título para o mesmo cliente),
 *     pendências (sem cliente) e falhas com motivo.
 *
 * Persistência pela MESMA coleção/serviço do anexo individual
 * (`cliente_arquivos` / `uploadArquivoCliente`).
 */
import { useMemo, useRef, useState, useEffect } from 'react'
import {
  X,
  FileText,
  Upload,
  Paperclip,
  Search,
  CheckCircle2,
  AlertTriangle,
  Copy,
  XCircle,
  Loader2,
  Trash2,
  Link2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
  LIMITE_MAXIMO_ANEXO_MASSA,
  filtrarPdfsValidos,
  identificarClientePorNome,
  construirIndiceClientes,
  processarAnexosEmMassa,
  tituloPadraoDoArquivo,
  type ItemAnexoMassa,
  type StatusItemAnexoMassa,
} from '@/services/anexoPdfMassaClientes'
import type { EmpresaRecord } from '@/types/cadastroEmpresas'

interface ModalAnexarPdfEmMassaProps {
  aberto: boolean
  empresas: EmpresaRecord[] // listagem carregada na tela (índice de identificação)
  clienteFixo?: EmpresaRecord | null // quando aberto de dentro da ficha de um cliente
  onFechar: () => void
  onConcluido?: (resumo: {
    anexados: number
    duplicados: number
    pendentes: number
    falhas: number
  }) => void
}

const CATEGORIAS = [
  'Contrato',
  'Documento Societário',
  'Procuração',
  'Fiscal / Tributário',
  'Certidão Negativa',
  'Outro documento',
]

type Etapa = 'selecao' | 'revisao' | 'processando' | 'resumo'

const rotuloStatus: Record<StatusItemAnexoMassa, { texto: string; classe: string }> = {
  pendente: { texto: 'Aguardando cliente', classe: 'bg-slate-100 text-slate-600 border-slate-200' },
  pronto: { texto: 'Pronto', classe: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  sem_cliente: { texto: 'Sem cliente', classe: 'bg-amber-50 text-amber-700 border-amber-200' },
  enviando: { texto: 'Enviando...', classe: 'bg-blue-50 text-blue-700 border-blue-200' },
  anexado: { texto: 'Anexado', classe: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  duplicado: {
    texto: 'Duplicado (ignorado)',
    classe: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  falha: { texto: 'Falha', classe: 'bg-rose-50 text-rose-700 border-rose-200' },
}

export function ModalAnexarPdfEmMassa({
  aberto,
  empresas,
  clienteFixo = null,
  onFechar,
  onConcluido,
}: ModalAnexarPdfEmMassaProps) {
  const { toast } = useToast()

  const [etapa, setEtapa] = useState<Etapa>('selecao')
  const [itens, setItens] = useState<ItemAnexoMassa[]>([])
  const [rejeitados, setRejeitados] = useState<{ nome: string; motivo: string }[]>([])
  const [arrastando, setArrastando] = useState(false)
  const [busca, setBusca] = useState('')
  const [itemAtribuindo, setItemAtribuindo] = useState<string | null>(null)
  const [aplicarTodosCliente, setAplicarTodosCliente] = useState<EmpresaRecord | null>(null)
  const [progresso, setProgresso] = useState({ concluidos: 0, total: 0 })
  const [resumo, setResumo] = useState<{
    anexados: number
    duplicados: number
    pendentes: number
    falhas: number
  } | null>(null)

  const inputArquivosRef = useRef<HTMLInputElement>(null)
  const processamentoIniciadoRef = useRef(false)

  const indice = useMemo(() => construirIndiceClientes(empresas), [empresas])
  const resultadosBusca = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return []
    const numLimpo = q.replace(/\D/g, '')
    return empresas
      .filter((emp) => {
        const nome = (emp.razao_social || emp.nome || '').toLowerCase()
        if (nome.includes(q)) return true
        const doc = (emp.documento_limpo || emp.numero_documento || '').replace(/\D/g, '')
        if (numLimpo.length >= 3 && doc.includes(numLimpo)) return true
        if (String(emp.codigo) === q) return true
        return false
      })
      .slice(0, 8)
  }, [busca, empresas])

  // Reset quando o modal abre/fecha
  useEffect(() => {
    if (aberto) {
      setEtapa('selecao')
      setItens([])
      setRejeitados([])
      setResumo(null)
      setBusca('')
      setItemAtribuindo(null)
      setAplicarTodosCliente(null)
      processamentoIniciadoRef.current = false
    }
  }, [aberto])

  if (!aberto) return null

  const clienteFechadoCount = itens.filter((i) => i.cliente).length
  const semClienteCount = itens.length - clienteFechadoCount

  // ---------- Seleção de arquivos ----------
  const adicionarArquivos = (lista: FileList | File[] | null) => {
    if (!lista) return
    const arquivos = Array.from(lista)
    if (arquivos.length === 0) return

    const { validos, rejeitados: rejeit } = filtrarPdfsValidos(arquivos)

    // Limite unificado do sistema: 10.000 arquivos por lote
    let validosFinal = validos
    let limiteEstourado = false
    if (itens.length + validos.length > LIMITE_MAXIMO_ANEXO_MASSA) {
      const espaco = Math.max(0, LIMITE_MAXIMO_ANEXO_MASSA - itens.length)
      validosFinal = validos.slice(0, espaco)
      limiteEstourado = true
    }

    const novos: ItemAnexoMassa[] = validosFinal.map((file) => {
      const ident = clienteFixo
        ? { cliente: alvoDe(clienteFixo), pista: 'cliente da ficha aberta' }
        : identificarClientePorNome(file.name, indice)
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${file.name}`,
        file,
        nomeOriginal: file.name,
        titulo: tituloPadraoDoArquivo(file),
        categoria: 'Contrato',
        observacao: '',
        cliente: ident.cliente,
        autoIdentificado: Boolean(ident.cliente),
        pista: ident.pista,
        status: ident.cliente ? 'pronto' : 'pendente',
      }
    })

    setItens((prev) => [...prev, ...novos])
    setRejeitados((prev) => [...prev, ...rejeit])

    if (rejeit.length > 0 || limiteEstourado) {
      toast({
        title: limiteEstourado
          ? `Limite de ${LIMITE_MAXIMO_ANEXO_MASSA.toLocaleString('pt-BR')} arquivos por lote atingido`
          : 'Alguns arquivos foram ignorados',
        description: limiteEstourado
          ? 'Apenas os primeiros arquivos do lote foram aceitos (padrão unificado do sistema).'
          : `${rejeit.length} arquivo(s) não são PDF e foram ignorados.`,
        variant: 'destructive',
      })
    }
  }

  const alvoDe = (emp: EmpresaRecord) => ({
    codigo: emp.codigo,
    razao_social: emp.razao_social || emp.nome || `Cliente ${emp.codigo}`,
    documento_limpo: (emp.documento_limpo || emp.numero_documento || '').replace(/\D/g, ''),
  })

  const removerItem = (id: string) => setItens((prev) => prev.filter((i) => i.id !== id))

  const atribuirCliente = (idItem: string, emp: EmpresaRecord) => {
    setItens((prev) =>
      prev.map((i) =>
        i.id === idItem
          ? {
              ...i,
              cliente: alvoDe(emp),
              autoIdentificado: false,
              status: 'pronto',
              pista: 'definido manualmente na revisão',
            }
          : i,
      ),
    )
    setItemAtribuindo(null)
    setBusca('')
  }

  const aplicarClienteParaTodos = (emp: EmpresaRecord) => {
    setItens((prev) =>
      prev.map((i) => ({
        ...i,
        cliente: alvoDe(emp),
        autoIdentificado: false,
        status: 'pronto',
        pista: 'aplicado a todos na revisão',
      })),
    )
    setAplicarTodosCliente(emp)
  }

  const iniciarProcessamento = async () => {
    if (itens.length === 0) return
    setEtapa('processando')
    processamentoIniciadoRef.current = true
    setProgresso({ concluidos: 0, total: itens.length })

    const resultado = await processarAnexosEmMassa(itens, {
      onItemAtualizado: (item) =>
        setItens((prev) => prev.map((i) => (i.id === item.id ? item : i))),
      onProgresso: (concluidos, total) => setProgresso({ concluidos, total }),
    })

    setResumo({
      anexados: resultado.anexados,
      duplicados: resultado.duplicados,
      pendentes: resultado.pendentes,
      falhas: resultado.falhas,
    })
    setEtapa('resumo')
    onConcluido?.({
      anexados: resultado.anexados,
      duplicados: resultado.duplicados,
      pendentes: resultado.pendentes,
      falhas: resultado.falhas,
    })
  }

  const pendencias = itens.filter((i) => i.status === 'sem_cliente')

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onFechar}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABEÇALHO */}
        <div className="bg-[#0F294A] text-white px-6 py-4 flex items-center justify-between border-b border-[#0A1D34]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#D4AF37]">
              <Paperclip className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base sm:text-lg leading-tight">
                Anexar PDFs em Massa
              </h2>
              <p className="text-[11px] text-[#D4AF37] font-semibold tracking-wider uppercase">
                Vínculo automático por CNPJ/CPF ou código no nome do arquivo
              </p>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTEÚDO */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-4 text-xs">
          {/* ---------- ETAPA 1: SELEÇÃO ---------- */}
          {etapa === 'selecao' && (
            <>
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setArrastando(true)
                }}
                onDragLeave={() => setArrastando(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setArrastando(false)
                  adicionarArquivos(e.dataTransfer?.files ?? null)
                }}
                onClick={() => inputArquivosRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors flex flex-col items-center gap-2 ${
                  arrastando
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/40'
                }`}
              >
                <Upload className="w-8 h-8 text-emerald-600" />
                <span className="font-bold text-[#0F294A] text-sm">
                  Arraste e solte os PDFs aqui ou clique para selecionar
                </span>
                <span className="text-[11px] text-slate-500">
                  Vários arquivos de uma vez • Somente PDF • Até{' '}
                  {LIMITE_MAXIMO_ANEXO_MASSA.toLocaleString('pt-BR')} por lote
                </span>
                <input
                  ref={inputArquivosRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    adicionarArquivos(e.target.files)
                    e.target.value = ''
                  }}
                />
              </div>

              {rejeitados.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex flex-col gap-1">
                  {rejeitados.slice(0, 5).map((r, idx) => (
                    <span key={idx} className="text-[11px]">
                      <strong>{r.nome}</strong> — {r.motivo}
                    </span>
                  ))}
                  {rejeitados.length > 5 && (
                    <span className="text-[11px]">
                      … e mais {rejeitados.length - 5} arquivo(s).
                    </span>
                  )}
                </div>
              )}

              {itens.length > 0 && (
                <div className="flex flex-col gap-3">
                  {/* Cliente único para todos */}
                  {!clienteFixo && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                      <span className="font-bold text-[#0F294A] flex items-center gap-1.5">
                        <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                        Aplicar um único cliente para todos os arquivos
                      </span>
                      <div className="flex items-center gap-2">
                        <Input
                          value={busca}
                          onChange={(e) => setBusca(e.target.value)}
                          placeholder="Buscar por nome, CNPJ/CPF ou código…"
                          className="text-xs"
                        />
                      </div>
                      {busca.trim() && (
                        <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-44 overflow-y-auto bg-white">
                          {resultadosBusca.length === 0 && (
                            <div className="p-3 text-slate-400 text-center">
                              Nenhum cliente encontrado.
                            </div>
                          )}
                          {resultadosBusca.map((emp) => (
                            <button
                              key={emp.id}
                              onClick={() => {
                                aplicarClienteParaTodos(emp)
                                setBusca('')
                              }}
                              className="w-full px-3 py-2 flex items-center justify-between hover:bg-emerald-50 transition-colors text-left cursor-pointer"
                            >
                              <span className="font-semibold text-slate-800">
                                {emp.razao_social || emp.nome}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">
                                Cód. {emp.codigo}
                                {emp.documento_limpo ? ` • ${emp.documento_limpo}` : ''}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {aplicarTodosCliente && (
                        <span className="text-[11px] text-emerald-700 font-semibold">
                          Todos os {itens.length} arquivo(s) serão anexados a{' '}
                          {aplicarTodosCliente.razao_social || aplicarTodosCliente.nome} (cód.{' '}
                          {aplicarTodosCliente.codigo}).
                        </span>
                      )}
                    </div>
                  )}

                  {/* Lista de arquivos selecionados */}
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden max-h-64 overflow-y-auto">
                    {itens.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                          <div className="min-w-0">
                            <span className="block font-bold text-slate-800 truncate">
                              {item.nomeOriginal}
                            </span>
                            <span className="block text-[11px] text-slate-400 truncate">
                              {item.cliente
                                ? `→ ${item.cliente.razao_social} (cód. ${item.cliente.codigo})${item.pista ? ` • ${item.pista}` : ''}`
                                : 'Cliente não identificado — defina na revisão'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
                              item.cliente
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {item.cliente ? 'Identificado' : 'Pendente'}
                          </span>
                          <button
                            onClick={() => removerItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remover da seleção"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ---------- ETAPA 2: REVISÃO ---------- */}
          {etapa === 'revisao' && (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-600">
                  <strong className="text-[#0F294A]">{clienteFechadoCount}</strong> identificado(s)
                  automaticamente • <strong className="text-amber-600">{semClienteCount}</strong>{' '}
                  aguardando definição
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {itens.length} arquivo(s) no lote
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden max-h-80 overflow-y-auto">
                {itens.map((item) => (
                  <div key={item.id} className="p-3 bg-white flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                        <div className="min-w-0">
                          <span className="block font-bold text-slate-800 truncate">
                            {item.nomeOriginal}
                          </span>
                          <span className="block text-[11px] text-slate-400 truncate">
                            {item.cliente
                              ? `→ ${item.cliente.razao_social} (cód. ${item.cliente.codigo})${item.pista ? ` • ${item.pista}` : ''}`
                              : 'Sem cliente correspondente'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
                            item.cliente
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {item.cliente ? 'Identificado' : 'Pendente'}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] cursor-pointer"
                          onClick={() => {
                            setItemAtribuindo(itemAtribuindo === item.id ? null : item.id)
                            setBusca('')
                          }}
                        >
                          <Search className="w-3 h-3" />
                          {item.cliente ? 'Alterar' : 'Definir'}
                        </Button>
                        <button
                          onClick={() => removerItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remover da seleção"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Busca de cliente para este item */}
                    {itemAtribuindo === item.id && (
                      <div className="pl-8 flex flex-col gap-1.5">
                        <Input
                          autoFocus
                          value={busca}
                          onChange={(e) => setBusca(e.target.value)}
                          placeholder="Buscar cliente por nome, CNPJ/CPF ou código…"
                          className="text-xs"
                        />
                        <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-40 overflow-y-auto bg-white">
                          {busca.trim() && resultadosBusca.length === 0 && (
                            <div className="p-3 text-slate-400 text-center">
                              Nenhum cliente encontrado.
                            </div>
                          )}
                          {resultadosBusca.map((emp) => (
                            <button
                              onClick={() => atribuirCliente(item.id, emp)}
                              className="w-full px-3 py-2 flex items-center justify-between hover:bg-emerald-50 transition-colors text-left cursor-pointer"
                            >
                              <span className="font-semibold text-slate-800">
                                {emp.razao_social || emp.nome}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">
                                Cód. {emp.codigo}
                                {emp.documento_limpo ? ` • ${emp.documento_limpo}` : ''}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {semClienteCount > 0 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {semClienteCount} arquivo(s) sem cliente definido ficarão na lista de pendências
                    e NÃO serão anexados — os demais seguem normalmente.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ---------- ETAPA 3: PROCESSANDO ---------- */}
          {etapa === 'processando' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              <span className="font-bold text-[#0F294A] text-sm">
                Anexando arquivos… {progresso.concluidos} de {progresso.total}
              </span>
              <div className="w-full max-w-sm h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-200"
                  style={{
                    width: `${progresso.total ? (progresso.concluidos / progresso.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-[11px] text-slate-400">
                Cada arquivo é verificado quanto à duplicidade antes de gravar.
              </span>
            </div>
          )}

          {/* ---------- ETAPA 4: RESUMO ---------- */}
          {etapa === 'resumo' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                  <span className="block text-lg font-bold text-emerald-700">
                    {resumo?.anexados ?? 0}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-semibold">Anexados</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <Copy className="w-5 h-5 text-slate-500 mx-auto" />
                  <span className="block text-lg font-bold text-slate-700">
                    {resumo?.duplicados ?? 0}
                  </span>
                  <span className="text-[11px] text-slate-600 font-semibold">
                    Duplicados (ignorados)
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mx-auto" />
                  <span className="block text-lg font-bold text-amber-700">
                    {resumo?.pendentes ?? 0}
                  </span>
                  <span className="text-[11px] text-amber-700 font-semibold">Sem cliente</span>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
                  <XCircle className="w-5 h-5 text-rose-600 mx-auto" />
                  <span className="block text-lg font-bold text-rose-700">
                    {resumo?.falhas ?? 0}
                  </span>
                  <span className="text-[11px] text-rose-700 font-semibold">Falhas</span>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
                  <Paperclip className="w-5 h-5 text-blue-600 mx-auto" />
                  <span className="block text-lg font-bold text-blue-700">{itens.length}</span>
                  <span className="text-[11px] text-blue-700 font-semibold">Total do lote</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden max-h-64 overflow-y-auto">
                {itens.map((item) => {
                  const rs = rotuloStatus[item.status]
                  return (
                    <div
                      key={item.id}
                      className="p-3 bg-white flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <span className="block font-bold text-slate-800 truncate">
                          {item.nomeOriginal}
                        </span>
                        <span className="block text-[11px] text-slate-400 truncate">
                          {item.cliente
                            ? `${item.cliente.razao_social} (cód. ${item.cliente.codigo})`
                            : 'Sem cliente'}
                        </span>
                        {item.motivo && (
                          <span className="block text-[11px] text-slate-500 truncate">
                            {item.motivo}
                          </span>
                        )}
                      </div>
                      <span
                        className={`shrink-0 text-[10px] px-2 py-0.5 rounded border font-semibold ${rs.classe}`}
                      >
                        {rs.texto}
                      </span>
                    </div>
                  )
                })}
              </div>

              {pendencias.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {pendencias.length} arquivo(s) não foram anexados por falta de cliente
                    correspondente. Remova-os da listagem ou defina o cliente e processe novamente.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RODAPÉ */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            Coleção `cliente_arquivos` • serviço `uploadArquivoCliente`
          </span>
          <div className="flex items-center gap-2 ml-auto">
            {etapa === 'selecao' && (
              <>
                <Button variant="outline" size="sm" onClick={onFechar} className="cursor-pointer">
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => itens.length > 0 && setEtapa('revisao')}
                  disabled={itens.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer disabled:opacity-50"
                >
                  Continuar ({itens.length})
                </Button>
              </>
            )}
            {etapa === 'revisao' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEtapa('selecao')}
                  className="cursor-pointer"
                >
                  Voltar
                </Button>
                <Button
                  size="sm"
                  onClick={iniciarProcessamento}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Anexar {clienteFechadoCount} arquivo(s)
                </Button>
              </>
            )}
            {etapa === 'processando' && (
              <span className="text-[11px] text-slate-400">Processando lote…</span>
            )}
            {etapa === 'resumo' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEtapa('selecao')}
                  className="cursor-pointer"
                >
                  Novo lote
                </Button>
              </>
            )}
            {etapa === 'resumo' && (
              <Button
                size="sm"
                onClick={onFechar}
                className="bg-[#0F294A] hover:bg-[#1a3d6b] text-white cursor-pointer"
              >
                Concluir
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
