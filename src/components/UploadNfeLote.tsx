import React, { useState, useRef, useMemo, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  UploadCloud,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  Sparkles,
  Trash2,
  Layers,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Search,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { processarLoteNfe } from '@/services/nfeService'
import type { ProcessamentoLoteResponse } from '@/types/nfes'

interface UploadNfeLoteProps {
  onProcessamentoConcluido?: (resultado: ProcessamentoLoteResponse) => void
  onIrParaNotas?: () => void
}

interface ArquivoSelecionado {
  id: string
  nome: string
  tamanho: number
  xml: string
  status: 'pendente' | 'processando' | 'ok' | 'duplicada' | 'erro'
  mensagem?: string
}

type FiltroStatus = 'todos' | 'ok' | 'duplicada' | 'erro' | 'pendente'

export const UploadNfeLote: React.FC<UploadNfeLoteProps> = ({
  onProcessamentoConcluido,
  onIrParaNotas,
}) => {
  const LIMITE_ARQUIVOS_LOTE = 10000
  const ITENS_POR_PAGINA = 50

  const [arquivos, setArquivos] = useState<ArquivoSelecionado[]>([])
  const [processando, setProcessando] = useState(false)
  const [progresso, setProgresso] = useState(0)
  const [statusProgresso, setStatusProgresso] = useState<string>('')
  const [avisoLimite, setAvisoLimite] = useState<string | null>(null)
  const [resultadoLote, setResultadoLote] = useState<ProcessamentoLoteResponse | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos')
  const [buscaTexto, setBuscaTexto] = useState('')
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [detalheExpandidoId, setDetalheExpandidoId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return

    setAvisoLimite(null)

    // Filtra apenas arquivos XML
    const xmlFiles: File[] = []
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      if (file.name.toLowerCase().endsWith('.xml')) {
        xmlFiles.push(file)
      }
    }

    if (xmlFiles.length === 0) return

    const totalAtual = arquivos.length
    const espacoDisponivel = Math.max(0, LIMITE_ARQUIVOS_LOTE - totalAtual)

    if (espacoDisponivel === 0) {
      setAvisoLimite(
        `Limite de 10.000 arquivos por lote atingido. Não é possível adicionar novos arquivos.`,
      )
      return
    }

    let arquivosParaLer = xmlFiles
    if (xmlFiles.length > espacoDisponivel) {
      arquivosParaLer = xmlFiles.slice(0, espacoDisponivel)
      const excedente = xmlFiles.length - espacoDisponivel
      setAvisoLimite(
        `Limite de 10.000 arquivos por lote excedido. Foram importados os primeiros ${arquivosParaLer.length} arquivos; ${excedente} arquivo(s) foram ignorados para respeitar o limite máximo de 10.000 arquivos por lote.`,
      )
    }

    const novos: ArquivoSelecionado[] = []
    const promises: Promise<void>[] = []

    for (let i = 0; i < arquivosParaLer.length; i++) {
      const file = arquivosParaLer[i]
      const p = new Promise<void>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = (e.target?.result as string) || ''
          novos.push({
            id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
            nome: file.name,
            tamanho: file.size,
            xml: content,
            status: 'pendente',
          })
          resolve()
        }
        reader.onerror = () => resolve()
        reader.readAsText(file)
      })
      promises.push(p)
    }

    await Promise.all(promises)
    setArquivos((prev) => [...prev, ...novos])
    setResultadoLote(null)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    handleFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const carregarExemploPastore = () => {
    const xmlExemplo = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
    <infNFe Id="NFe41260141844038000128550010000415601000415608" versao="4.00">
      <ide>
        <cUF>41</cUF>
        <cNF>00041560</cNF>
        <natOp>VENDA DE MERCADORIA ADQUIRIDA DE TERCEIROS</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>41560</nNF>
        <dhEmi>2026-01-16T10:45:00-03:00</dhEmi>
        <tpNF>1</tpNF>
        <idDest>2</idDest>
        <cMunFG>4106902</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
      </ide>
      <emit>
        <CNPJ>41844038000128</CNPJ>
        <xNome>PATRAL SUL PECAS LTDA</xNome>
        <xFant>PATRAL SUL</xFant>
        <enderEmit>
          <xLgr>RODOVIA BR 116</xLgr>
          <nro>14800</nro>
          <xBairro>TATUQUARA</xBairro>
          <cMun>4106902</cMun>
          <xMun>CURITIBA</xMun>
          <UF>PR</UF>
          <CEP>81690400</CEP>
        </enderEmit>
        <IE>9089765432</IE>
        <CRT>3</CRT>
      </emit>
      <dest>
        <CNPJ>92353630000168</CNPJ>
        <xNome>AUTO MECANICA IRMAOS PASTORE LTDA</xNome>
        <enderDest>
          <xLgr>AVENIDA MOREIRA PAZ</xLgr>
          <nro>450</nro>
          <xBairro>CENTRO</xBairro>
          <cMun>4322509</cMun>
          <xMun>VACARIA</xMun>
          <UF>RS</UF>
          <CEP>95200000</CEP>
        </enderDest>
        <indIEDest>1</indIEDest>
        <IE>1560023456</IE>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>PTR-101</cProd>
          <cEAN>SEM GTIN</cEAN>
          <xProd>CORREIA DENTADA SINCRONIZADORA</xProd>
          <NCM>40103100</NCM>
          <CEST>0100100</CEST>
          <CFOP>6102</CFOP>
          <uCom>PC</uCom>
          <qCom>2.0000</qCom>
          <vUnCom>45.0000</vUnCom>
          <vProd>90.00</vProd>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <modBC>3</modBC>
              <vBC>90.00</vBC>
              <pICMS>12.00</pICMS>
              <vICMS>10.80</vICMS>
            </ICMS00>
          </ICMS>
          <PIS>
            <PISAliq>
              <CST>01</CST>
              <vBC>90.00</vBC>
              <pPIS>0.65</pPIS>
              <vPIS>0.59</vPIS>
            </PISAliq>
          </PIS>
          <COFINS>
            <COFINSAliq>
              <CST>01</CST>
              <vBC>90.00</vBC>
              <pCOFINS>3.00</pCOFINS>
              <vCOFINS>2.70</vCOFINS>
            </COFINSAliq>
          </COFINS>
        </imposto>
      </det>
      <det nItem="2">
        <prod>
          <cProd>PTR-205</cProd>
          <cEAN>SEM GTIN</cEAN>
          <xProd>TENSOR CORREIA DENTADA MOTOR</xProd>
          <NCM>84099190</NCM>
          <CEST>0100300</CEST>
          <CFOP>6102</CFOP>
          <uCom>PC</uCom>
          <qCom>2.0000</qCom>
          <vUnCom>65.5000</vUnCom>
          <vProd>131.00</vProd>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <modBC>3</modBC>
              <vBC>131.00</vBC>
              <pICMS>12.00</pICMS>
              <vICMS>15.72</vICMS>
            </ICMS00>
          </ICMS>
          <PIS>
            <PISAliq>
              <CST>01</CST>
              <vBC>131.00</vBC>
              <pPIS>0.65</pPIS>
              <vPIS>0.85</vPIS>
            </PISAliq>
          </PIS>
          <COFINS>
            <COFINSAliq>
              <CST>01</CST>
              <vBC>131.00</vBC>
              <pCOFINS>3.00</pCOFINS>
              <vCOFINS>3.93</vCOFINS>
            </COFINSAliq>
          </COFINS>
        </imposto>
      </det>
      <det nItem="3">
        <prod>
          <cProd>PTR-310</cProd>
          <cEAN>SEM GTIN</cEAN>
          <xProd>FILTRO DE OLEO LUBRIFICANTE</xProd>
          <NCM>84212300</NCM>
          <CEST>0100400</CEST>
          <CFOP>6102</CFOP>
          <uCom>PC</uCom>
          <qCom>6.0000</qCom>
          <vUnCom>28.0000</vUnCom>
          <vProd>168.00</vProd>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <modBC>3</modBC>
              <vBC>168.00</vBC>
              <pICMS>12.00</pICMS>
              <vICMS>20.16</vICMS>
            </ICMS00>
          </ICMS>
          <PIS>
            <PISAliq>
              <CST>01</CST>
              <vBC>168.00</vBC>
              <pPIS>0.65</pPIS>
              <vPIS>1.09</vPIS>
            </PISAliq>
          </PIS>
          <COFINS>
            <COFINSAliq>
              <CST>01</CST>
              <vBC>168.00</vBC>
              <pCOFINS>3.00</pCOFINS>
              <vCOFINS>5.04</vCOFINS>
            </COFINSAliq>
          </COFINS>
        </imposto>
      </det>
      <det nItem="4">
        <prod>
          <cProd>PTR-401</cProd>
          <cEAN>SEM GTIN</cEAN>
          <xProd>PASTILHA FREIO DIANTEIRO CERAMICA</xProd>
          <NCM>87083019</NCM>
          <CEST>0100500</CEST>
          <CFOP>6102</CFOP>
          <uCom>JG</uCom>
          <qCom>4.0000</qCom>
          <vUnCom>78.0000</vUnCom>
          <vProd>312.00</vProd>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <modBC>3</modBC>
              <vBC>312.00</vBC>
              <pICMS>12.00</pICMS>
              <vICMS>37.44</vICMS>
            </ICMS00>
          </ICMS>
          <PIS>
            <PISAliq>
              <CST>01</CST>
              <vBC>312.00</vBC>
              <pPIS>0.65</pPIS>
              <vPIS>2.03</vPIS>
            </PISAliq>
          </PIS>
          <COFINS>
            <COFINSAliq>
              <CST>01</CST>
              <vBC>312.00</vBC>
              <pCOFINS>3.00</pCOFINS>
              <vCOFINS>9.36</vCOFINS>
            </COFINSAliq>
          </COFINS>
        </imposto>
      </det>
      <det nItem="5">
        <prod>
          <cProd>PTR-550</cProd>
          <cEAN>SEM GTIN</cEAN>
          <xProd>DISCO DE FREIO VENTILADO</xProd>
          <NCM>87083090</NCM>
          <CEST>0100600</CEST>
          <CFOP>6102</CFOP>
          <uCom>PC</uCom>
          <qCom>2.0000</qCom>
          <vUnCom>120.0000</vUnCom>
          <vProd>240.00</vProd>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <modBC>3</modBC>
              <vBC>240.00</vBC>
              <pICMS>12.00</pICMS>
              <vICMS>28.80</vICMS>
            </ICMS00>
          </ICMS>
          <PIS>
            <PISAliq>
              <CST>01</CST>
              <vBC>240.00</vBC>
              <pPIS>0.65</pPIS>
              <vPIS>1.56</vPIS>
            </PISAliq>
          </PIS>
          <COFINS>
            <COFINSAliq>
              <CST>01</CST>
              <vBC>240.00</vBC>
              <pCOFINS>3.00</pCOFINS>
              <vCOFINS>7.20</vCOFINS>
            </COFINSAliq>
          </COFINS>
        </imposto>
      </det>
      <det nItem="6">
        <prod>
          <cProd>PTR-620</cProd>
          <cEAN>SEM GTIN</cEAN>
          <xProd>AMORTECEDOR PRESSURIZADO DIANTEIRO</xProd>
          <NCM>87088000</NCM>
          <CEST>0100700</CEST>
          <CFOP>6102</CFOP>
          <uCom>PC</uCom>
          <qCom>2.0000</qCom>
          <vUnCom>113.6400</vUnCom>
          <vProd>227.28</vProd>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <modBC>3</modBC>
              <vBC>227.28</vBC>
              <pICMS>12.00</pICMS>
              <vICMS>27.27</vICMS>
            </ICMS00>
          </ICMS>
          <PIS>
            <PISAliq>
              <CST>01</CST>
              <vBC>227.28</vBC>
              <pPIS>0.65</pPIS>
              <vPIS>1.48</vPIS>
            </PISAliq>
          </PIS>
          <COFINS>
            <COFINSAliq>
              <CST>01</CST>
              <vBC>227.28</vBC>
              <pCOFINS>3.00</pCOFINS>
              <vCOFINS>6.82</vCOFINS>
            </COFINSAliq>
          </COFINS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vBC>1168.28</vBC>
          <vICMS>140.19</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCP>0.00</vFCP>
          <vBCST>0.00</vBCST>
          <vST>0.00</vST>
          <vFCPST>0.00</vFCPST>
          <vFCPSTRet>0.00</vFCPSTRet>
          <vProd>1168.28</vProd>
          <vFrete>94.00</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>0.00</vDesc>
          <vII>0.00</vII>
          <vIPI>0.00</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>5.04</vPIS>
          <vCOFINS>23.27</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>1262.28</vNF>
        </ICMSTot>
      </total>
      <cobr>
        <fat>
          <nFat>41560</nFat>
          <vOrig>1262.28</vOrig>
          <vDesc>0.00</vDesc>
          <vLiq>1262.28</vLiq>
        </fat>
        <dup>
          <nDup>001</nDup>
          <dVenc>2026-02-16</dVenc>
          <vDup>420.76</vDup>
        </dup>
        <dup>
          <nDup>002</nDup>
          <dVenc>2026-03-16</dVenc>
          <vDup>420.76</vDup>
        </dup>
        <dup>
          <nDup>003</nDup>
          <dVenc>2026-04-16</dVenc>
          <vDup>420.76</vDup>
        </dup>
      </cobr>
      <pag>
        <detPag>
          <tPag>15</tPag>
          <vPag>1262.28</vPag>
        </detPag>
      </pag>
    </infNFe>
  </NFe>
</nfeProc>`

    if (arquivos.length >= LIMITE_ARQUIVOS_LOTE) {
      setAvisoLimite(
        `Limite de 10.000 arquivos por lote atingido. Remova arquivos antes de adicionar o exemplo.`,
      )
      return
    }

    setAvisoLimite(null)

    const novo: ArquivoSelecionado = {
      id: `exemplo-pastore-${Date.now()}`,
      nome: 'NFe_41560_Patral_Pastore_Real.xml',
      tamanho: xmlExemplo.length,
      xml: xmlExemplo,
      status: 'pendente',
    }

    setArquivos((prev) => [...prev, novo])
  }

  const limparLista = () => {
    setArquivos([])
    setAvisoLimite(null)
    setResultadoLote(null)
    setPaginaAtual(1)
    setDetalheExpandidoId(null)
  }

  const removerArquivo = (id: string) => {
    setArquivos((prev) => prev.filter((a) => a.id !== id))
    if (detalheExpandidoId === id) setDetalheExpandidoId(null)
  }

  // Contadores para chips de status
  const contadores = useMemo(() => {
    let ok = 0
    let duplicada = 0
    let erro = 0
    let pendente = 0

    for (const a of arquivos) {
      if (a.status === 'ok') ok++
      else if (a.status === 'duplicada') duplicada++
      else if (a.status === 'erro') erro++
      else if (a.status === 'pendente') pendente++
    }

    return {
      todos: arquivos.length,
      ok,
      duplicada,
      erro,
      pendente,
    }
  }, [arquivos])

  // Arquivos filtrados por status e busca de texto
  const arquivosFiltrados = useMemo(() => {
    return arquivos.filter((arq) => {
      if (filtroStatus !== 'todos' && arq.status !== filtroStatus) {
        return false
      }
      if (buscaTexto.trim()) {
        const termo = buscaTexto.trim().toLowerCase()
        const bateNome = arq.nome.toLowerCase().includes(termo)
        const bateMsg = arq.mensagem ? arq.mensagem.toLowerCase().includes(termo) : false
        if (!bateNome && !bateMsg) return false
      }
      return true
    })
  }, [arquivos, filtroStatus, buscaTexto])

  // Paginação
  const totalPaginas = Math.max(1, Math.ceil(arquivosFiltrados.length / ITENS_POR_PAGINA))

  // Ajusta página caso fique fora dos limites após filtro
  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas)
    }
  }, [paginaAtual, totalPaginas])

  const arquivosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA
    return arquivosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA)
  }, [arquivosFiltrados, paginaAtual])

  const indiceInicio = arquivosFiltrados.length === 0 ? 0 : (paginaAtual - 1) * ITENS_POR_PAGINA + 1
  const indiceFim = Math.min(paginaAtual * ITENS_POR_PAGINA, arquivosFiltrados.length)

  const handleProcessarLote = async () => {
    if (arquivos.length === 0) return

    setProcessando(true)
    setProgresso(5)
    setStatusProgresso(`Preparando lote com ${arquivos.length} arquivo(s)...`)

    try {
      const payload = arquivos.map((a) => ({
        nome: a.nome,
        xml: a.xml,
      }))

      setProgresso(25)
      setStatusProgresso(`Enviando ${arquivos.length} XMLs para processamento e dedup SEFAZ...`)

      // Simulação suave de acompanhamento visual enquanto a requisição roda
      const intervalo = setInterval(() => {
        setProgresso((p) => {
          if (p >= 85) return p
          const proximo = p + Math.floor(Math.random() * 8) + 2
          const estimado = Math.min(arquivos.length, Math.round((proximo / 100) * arquivos.length))
          setStatusProgresso(`Processando arquivo ${estimado} de ${arquivos.length}...`)
          return proximo
        })
      }, 500)

      const res = await processarLoteNfe(payload)
      clearInterval(intervalo)

      setProgresso(100)
      setStatusProgresso(`Concluído: ${res.total_arquivos} arquivos processados.`)

      setResultadoLote(res)

      // Atualiza o status visual dos arquivos baseado no retorno
      if (res.resultados && res.resultados.length > 0) {
        setArquivos((prev) =>
          prev.map((arq) => {
            const achado = res.resultados.find((r) => r.arquivo === arq.nome)
            if (achado) {
              return {
                ...arq,
                status: achado.status,
                mensagem:
                  achado.motivo ||
                  (achado.status === 'ok'
                    ? 'Processado com sucesso'
                    : achado.status === 'duplicada'
                      ? 'Rejeitado por duplicidade (já cadastrado)'
                      : 'Erro no arquivo'),
              }
            }
            return arq
          }),
        )
      }

      if (onProcessamentoConcluido) {
        onProcessamentoConcluido(res)
      }
    } catch (err) {
      console.error('Erro ao processar lote:', err)
      setStatusProgresso('Ocorreu um erro durante o processamento do lote.')
    } finally {
      setProcessando(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-primary" />
                Upload em Lote de Documentos Fiscais (NF-e)
              </CardTitle>
              <CardDescription>
                Arraste ou selecione múltiplos arquivos XML (.xml) de notas fiscais eletrônicas de
                compra e venda. O pipeline extrai produtos, rejeita arquivos duplicados pela chave
                de acesso de 44 dígitos (mantendo intacto o registro existente) e vincula
                automaticamente ao cadastro da empresa.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={carregarExemploPastore}
                className="text-xs border-dashed"
                title="Carrega a NFe 41560 da Auto Mecânica Pastore com 6 itens de autopeças e duplicatas"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
                Carregar Exemplo Real (Pastore)
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Resumo do Lote Concluído - FIXO/STICKY NO TOPO para acompanhar a navegação */}
          {resultadoLote && (
            <div className="sticky top-2 z-20 p-4 rounded-xl border border-border/80 bg-background/95 backdrop-blur-md shadow-md space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <span className="font-semibold text-sm block">Resumo Consolidado do Lote</span>
                    <span className="text-[11px] text-muted-foreground">
                      {resultadoLote.total_arquivos} arquivo(s) processados pelo pipeline SEFAZ
                    </span>
                  </div>
                </div>
                {onIrParaNotas && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onIrParaNotas}
                    className="text-xs h-7 border-panorama-gold/60 text-foreground hover:bg-muted"
                  >
                    Visualizar Notas Importadas →
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-card border border-border/50 shadow-2xs">
                  <span className="text-muted-foreground block text-[11px]">Notas com Sucesso</span>
                  <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {resultadoLote.processadas_sucesso}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-card border border-border/50 shadow-2xs">
                  <span className="text-muted-foreground block text-[11px]">
                    Duplicadas (Rejeitadas)
                  </span>
                  <span className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                    {resultadoLote.duplicadas}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-card border border-border/50 shadow-2xs">
                  <span className="text-muted-foreground block text-[11px]">Total de Itens</span>
                  <span className="text-base sm:text-lg font-bold tabular-nums">
                    {resultadoLote.total_itens}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-card border border-border/50 shadow-2xs">
                  <span className="text-muted-foreground block text-[11px]">Valor Total NF</span>
                  <span className="text-base sm:text-lg font-bold tabular-nums text-foreground">
                    R${' '}
                    {resultadoLote.valor_total_nf.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {resultadoLote.duplicadas > 0 && (
                <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div className="text-[11px] leading-tight">
                    <strong>
                      {resultadoLote.duplicadas} arquivo(s) rejeitado(s) por duplicidade:
                    </strong>{' '}
                    chave de acesso já existente no banco. O registro original e itens foram
                    preservados intactos.
                  </div>
                </div>
              )}

              {resultadoLote.cliente_vinculado && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary">
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span className="text-[11px]">
                    <strong>Cliente Vinculado:</strong> {resultadoLote.cliente_vinculado.nome} (CNPJ{' '}
                    {resultadoLote.cliente_vinculado.cnpj})
                  </span>
                </div>
              )}

              {resultadoLote.erros > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span className="text-[11px]">
                    {resultadoLote.erros} arquivo(s) apresentaram inconsistência na leitura.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Dropzone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-xl p-8 text-center cursor-pointer transition-colors bg-muted/20 hover:bg-muted/40"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".xml,text/xml"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Clique para selecionar ou arraste arquivos XML aqui
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Suporta grandes lotes de até 10.000 NF-e modelo 55 (nacional padrão SEFAZ)
                </p>
              </div>
            </div>
          </div>

          {/* Alerta de Limite de Lote Excedido */}
          {avisoLimite && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div className="flex-1 font-medium">{avisoLimite}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAvisoLimite(null)}
                className="h-5 px-1.5 text-xs hover:bg-amber-500/20"
              >
                ✕
              </Button>
            </div>
          )}

          {/* Barra de Progresso DURANTE o processamento */}
          {processando && (
            <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary animate-spin" />
                  {statusProgresso || 'Processando lote de NFes...'}
                </span>
                <span className="font-mono font-bold text-primary">{progresso}%</span>
              </div>
              <Progress value={progresso} className="h-2" />
              <p className="text-[11px] text-muted-foreground">
                Você pode continuar navegando e filtrando a lista abaixo enquanto o lote é
                processado pelo servidor.
              </p>
            </div>
          )}

          {/* Lista de Arquivos Selecionados - PAGINADA E FILTRADA */}
          {arquivos.length > 0 && (
            <div className="space-y-3 pt-2">
              {/* Barra superior de ferramentas: contagem, filtros rápidos, busca e ação */}
              <div className="flex flex-col gap-2.5 p-3 rounded-xl border border-border/70 bg-card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Fila de Arquivos
                    </span>
                    <Badge variant="secondary" className="font-mono font-bold text-xs">
                      {arquivos.length} {arquivos.length === 1 ? 'arquivo' : 'arquivos'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={limparLista}
                      disabled={processando}
                      className="text-xs text-destructive hover:text-destructive h-7 px-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Limpar fila
                    </Button>
                    <Button
                      onClick={handleProcessarLote}
                      disabled={processando || arquivos.length === 0}
                      size="sm"
                      className="h-7 text-xs bg-panorama-navy hover:bg-slate-900 text-white font-bold"
                    >
                      <Layers className="w-3.5 h-3.5 mr-1.5" />
                      {processando ? 'Processando...' : `Processar Lote (${arquivos.length})`}
                    </Button>
                  </div>
                </div>

                {/* Filtros Rápidos por Status (Chips) */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/40">
                  <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 mr-1">
                    <Filter className="w-3 h-3" /> Filtrar:
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setFiltroStatus('todos')
                      setPaginaAtual(1)
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer border ${
                      filtroStatus === 'todos'
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-muted/50 text-muted-foreground border-border/60 hover:bg-muted'
                    }`}
                  >
                    Todos
                    <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-background/20 font-mono">
                      {contadores.todos}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFiltroStatus('ok')
                      setPaginaAtual(1)
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer border ${
                      filtroStatus === 'ok'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Sucesso
                    <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-background/20 font-mono">
                      {contadores.ok}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFiltroStatus('duplicada')
                      setPaginaAtual(1)
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer border ${
                      filtroStatus === 'duplicada'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                    }`}
                  >
                    <ShieldAlert className="w-3 h-3" />
                    Duplicadas (Rejeitadas)
                    <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-background/20 font-mono">
                      {contadores.duplicada}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFiltroStatus('erro')
                      setPaginaAtual(1)
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer border ${
                      filtroStatus === 'erro'
                        ? 'bg-destructive text-destructive-foreground border-destructive'
                        : 'bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20'
                    }`}
                  >
                    <XCircle className="w-3 h-3" />
                    Erro
                    <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-background/20 font-mono">
                      {contadores.erro}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFiltroStatus('pendente')
                      setPaginaAtual(1)
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer border ${
                      filtroStatus === 'pendente'
                        ? 'bg-slate-700 text-white border-slate-700'
                        : 'bg-muted/70 text-slate-600 dark:text-slate-300 border-border/60 hover:bg-muted'
                    }`}
                  >
                    Pendentes
                    <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-background/20 font-mono">
                      {contadores.pendente}
                    </span>
                  </button>

                  {/* Busca textual rápida */}
                  <div className="relative flex-1 min-w-[160px] sm:max-w-[240px] ml-auto">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={buscaTexto}
                      onChange={(e) => {
                        setBuscaTexto(e.target.value)
                        setPaginaAtual(1)
                      }}
                      placeholder="Buscar por arquivo ou motivo..."
                      className="w-full pl-8 pr-2.5 py-1 text-xs rounded-md border border-border/70 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Barra de Paginação Superior */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
                <div>
                  Mostrando{' '}
                  <span className="font-semibold text-foreground">
                    {indiceInicio}–{indiceFim}
                  </span>{' '}
                  de{' '}
                  <span className="font-semibold text-foreground">{arquivosFiltrados.length}</span>{' '}
                  {arquivosFiltrados.length === 1 ? 'arquivo' : 'arquivos'}
                  {arquivosFiltrados.length !== arquivos.length && (
                    <span className="ml-1 text-[11px]">
                      (filtrados de {arquivos.length} no total)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaginaAtual(1)}
                    disabled={paginaAtual <= 1}
                    className="h-7 w-7 p-0"
                    title="Primeira página"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                    disabled={paginaAtual <= 1}
                    className="h-7 w-7 p-0"
                    title="Página anterior"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <span className="px-2 text-xs font-medium text-foreground">
                    Página {paginaAtual} de {totalPaginas}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                    disabled={paginaAtual >= totalPaginas}
                    className="h-7 w-7 p-0"
                    title="Próxima página"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaginaAtual(totalPaginas)}
                    disabled={paginaAtual >= totalPaginas}
                    className="h-7 w-7 p-0"
                    title="Última página"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Tabela de Arquivos Paginada */}
              {arquivosPaginados.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-border/80 text-muted-foreground text-xs">
                  Nenhum arquivo encontrado para o filtro selecionado.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                  {arquivosPaginados.map((arq, idx) => {
                    const isExpandido = detalheExpandidoId === arq.id
                    const numeroGlobal = (paginaAtual - 1) * ITENS_POR_PAGINA + idx + 1
                    return (
                      <div
                        key={arq.id}
                        className={`rounded-lg border transition-colors ${
                          arq.status === 'ok'
                            ? 'border-emerald-500/30 bg-emerald-500/[0.03]'
                            : arq.status === 'duplicada'
                              ? 'border-amber-500/40 bg-amber-500/[0.04]'
                              : arq.status === 'erro'
                                ? 'border-destructive/40 bg-destructive/[0.04]'
                                : 'border-border/50 bg-background/70'
                        } text-xs p-2.5`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="font-mono text-[10px] text-muted-foreground w-7 shrink-0 text-right">
                              #{numeroGlobal}
                            </span>
                            <FileCode className="w-4 h-4 text-primary shrink-0" />
                            <span className="font-mono font-medium truncate max-w-xs md:max-w-md text-foreground">
                              {arq.nome}
                            </span>
                            <span className="text-muted-foreground shrink-0 text-[11px]">
                              ({Math.round(arq.tamanho / 1024)} KB)
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {arq.status === 'ok' && (
                              <Badge
                                variant="outline"
                                className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10 text-[11px]"
                              >
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Processada
                              </Badge>
                            )}
                            {arq.status === 'duplicada' && (
                              <Badge
                                variant="outline"
                                className="text-amber-700 dark:text-amber-400 border-amber-500/40 bg-amber-500/15 font-medium text-[11px]"
                                title={
                                  arq.mensagem ||
                                  'Chave de acesso já existente: rejeitada sem alterações'
                                }
                              >
                                <ShieldAlert className="w-3 h-3 mr-1 text-amber-600 dark:text-amber-400" />{' '}
                                Duplicada (Rejeitada)
                              </Badge>
                            )}
                            {arq.status === 'erro' && (
                              <Badge
                                variant="outline"
                                className="text-destructive border-destructive/30 bg-destructive/10 text-[11px]"
                              >
                                <XCircle className="w-3 h-3 mr-1" /> Erro
                              </Badge>
                            )}
                            {arq.status === 'pendente' && (
                              <Badge
                                variant="secondary"
                                className="text-muted-foreground text-[11px]"
                              >
                                Pronto para envio
                              </Badge>
                            )}

                            {arq.mensagem && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setDetalheExpandidoId((curr) => (curr === arq.id ? null : arq.id))
                                }
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                title="Ver motivo/detalhe"
                              >
                                {isExpandido ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            )}

                            {!processando && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removerArquivo(arq.id)}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                title="Remover da fila"
                              >
                                ✕
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Linha expansível com o motivo/erro do arquivo */}
                        {arq.mensagem && isExpandido && (
                          <div className="mt-2 pt-2 border-t border-border/40 text-[11.5px] text-muted-foreground bg-muted/40 p-2 rounded">
                            <span className="font-semibold text-foreground">Motivo/Detalhes:</span>{' '}
                            {arq.mensagem}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Barra de Paginação Inferior */}
              {totalPaginas > 1 && (
                <div className="flex items-center justify-between gap-2 px-1 pt-1 text-xs text-muted-foreground border-t border-border/40">
                  <div>
                    Página {paginaAtual} de {totalPaginas} ({arquivosFiltrados.length} arquivos)
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaAtual(1)}
                      disabled={paginaAtual <= 1}
                      className="h-7 w-7 p-0"
                      title="Primeira página"
                    >
                      <ChevronsLeft className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                      disabled={paginaAtual <= 1}
                      className="h-7 w-7 p-0"
                      title="Página anterior"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                      disabled={paginaAtual >= totalPaginas}
                      className="h-7 w-7 p-0"
                      title="Próxima página"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaAtual(totalPaginas)}
                      disabled={paginaAtual >= totalPaginas}
                      className="h-7 w-7 p-0"
                      title="Última página"
                    >
                      <ChevronsRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
