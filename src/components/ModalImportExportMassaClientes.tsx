import React, { useState, useRef } from 'react'
import {
  Upload,
  Download,
  FileSpreadsheet,
  Check,
  AlertCircle,
  X,
  FileText,
  Users,
} from 'lucide-react'
import { EmpresaRecord } from '@/types/cadastroEmpresas'
import {
  CampoPersonalizadoDef,
  ResultadoImportacaoMassaComplementar,
} from '@/types/clienteDadosComplementares'
import {
  exportarPlanilhaComplementarMassa,
  processarArquivoImportacaoMassa,
  LIMITE_MAXIMO_IMPORTACAO_COMPLEMENTAR,
} from '@/services/clienteImportExportMassaService'
import { useToast } from '@/hooks/use-toast'

interface ModalImportExportMassaClientesProps {
  aberto: boolean
  empresas: EmpresaRecord[]
  camposDef: CampoPersonalizadoDef[]
  onFechar: () => void
  onSucessoImportacao: () => void
}

export const ModalImportExportMassaClientes: React.FC<ModalImportExportMassaClientesProps> = ({
  aberto,
  empresas,
  camposDef,
  onFechar,
  onSucessoImportacao,
}) => {
  const { toast } = useToast()
  const [aba, setAba] = useState<'exportar' | 'importar'>('exportar')
  const [exportando, setExportando] = useState(false)
  const [importando, setImportando] = useState(false)
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null)
  const [resultado, setResultado] = useState<ResultadoImportacaoMassaComplementar | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!aberto) return null

  const handleExportar = async () => {
    setExportando(true)
    try {
      await exportarPlanilhaComplementarMassa({
        empresas,
        camposDef,
      })
      toast({
        title: 'Planilha exportada com sucesso',
        description: `Exportados dados complementares de ${empresas.length} clientes.`,
      })
    } catch (e: any) {
      toast({
        title: 'Erro na exportação',
        description: e?.message || 'Falha ao gerar planilha de dados complementares.',
        variant: 'destructive',
      })
    } finally {
      setExportando(false)
    }
  }

  const handleArquivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArquivoSelecionado(e.target.files[0])
      setResultado(null)
    }
  }

  const handleExecutarImportacao = async () => {
    if (!arquivoSelecionado) {
      toast({
        title: 'Selecione um arquivo',
        description: 'Escolha uma planilha XLSX ou CSV para importar.',
        variant: 'destructive',
      })
      return
    }

    setImportando(true)
    try {
      const res = await processarArquivoImportacaoMassa(
        arquivoSelecionado,
        empresas,
        'Operador ADECONT',
      )
      setResultado(res)

      toast({
        title: 'Importação concluída',
        description: `${res.clientesAtualizados} clientes atualizados com sucesso (${res.contatosCriadosOuAtualizados} canais de contato e ${res.valoresCamposAtualizados} valores de campos).`,
      })

      onSucessoImportacao()
    } catch (e: any) {
      toast({
        title: 'Erro na importação',
        description: e?.message || 'Ocorreu um erro ao processar a planilha.',
        variant: 'destructive',
      })
    } finally {
      setImportando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onFechar}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="bg-[#0F294A] text-white px-5 py-4 flex items-center justify-between border-b border-[#0A1D34]">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-[#D4AF37]" />
            <div>
              <h3 className="font-serif font-bold text-base leading-tight">
                Importação / Exportação em Massa
              </h3>
              <p className="text-[11px] text-slate-300">
                Complemente cadastros de múltiplos clientes via planilha XLSX/CSV vinculada por
                CNPJ/CPF ou Código
              </p>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2">
          <button
            onClick={() => setAba('exportar')}
            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              aba === 'exportar'
                ? 'border-[#0F294A] text-[#0F294A] bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Dados Complementares</span>
          </button>
          <button
            onClick={() => setAba('importar')}
            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              aba === 'importar'
                ? 'border-[#0F294A] text-[#0F294A] bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importar Planilha em Massa</span>
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4">
          {aba === 'exportar' ? (
            <div className="flex flex-col gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#D4AF37]" />
                  Planilha de Cadastro Complementar ADECONT
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Gera uma planilha Excel (.xlsx) contendo todos os clientes cadastrados (
                  {empresas.length} registros), incluindo canais de contato (E-mail, WhatsApp,
                  Instagram, LinkedIn, Facebook) e colunas para todos os{' '}
                  <strong className="text-[#0F294A]">
                    {camposDef.length} campos personalizados
                  </strong>{' '}
                  ativos.
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                  <span className="bg-white px-2 py-1 rounded border border-slate-200">
                    Vínculo automático por CNPJ/CPF e Código
                  </span>
                  <span className="bg-white px-2 py-1 rounded border border-slate-200">
                    Compatível com reimportação direta
                  </span>
                  <span className="bg-white px-2 py-1 rounded border border-slate-200">
                    Formato nativo SheetJS / Excel
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleExportar}
                  disabled={exportando}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F294A] hover:bg-[#1a3d6b] text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#D4AF37]" />
                  <span>{exportando ? 'Gerando planilha...' : 'Baixar Planilha XLSX'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="font-bold">Regras da Importação em Massa</span>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    1. A planilha deve conter uma coluna com <strong>CNPJ/CPF</strong> ou{' '}
                    <strong>Código</strong> do cliente.
                    <br />
                    2. Colunas com cabeçalhos como{' '}
                    <em>E-mail, WhatsApp, Instagram, LinkedIn, Facebook</em> serão vinculadas aos
                    canais de contato.
                    <br />
                    3. Colunas com os nomes dos seus <strong>campos personalizados</strong> terão os
                    valores preenchidos na ficha.
                    <br />
                    4. Limite unificado do sistema: até{' '}
                    <strong>
                      {LIMITE_MAXIMO_IMPORTACAO_COMPLEMENTAR.toLocaleString('pt-BR')} linhas por
                      lote
                    </strong>
                    .
                  </p>
                </div>
              </div>

              {/* Área de Seleção de Arquivo */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-[#0F294A] rounded-xl p-6 text-center flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100/60 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleArquivoChange}
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-[#0F294A] opacity-70" />
                <span className="text-xs font-bold text-slate-800">
                  {arquivoSelecionado
                    ? arquivoSelecionado.name
                    : 'Clique para selecionar a planilha (.xlsx, .xls ou .csv)'}
                </span>
                {arquivoSelecionado ? (
                  <span className="text-[11px] text-emerald-700 font-semibold">
                    Arquivo pronto para importar ({(arquivoSelecionado.size / 1024).toFixed(1)} KB)
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    Arraste ou clique para navegar nos seus arquivos
                  </span>
                )}
              </div>

              {/* Botão de ação */}
              <div className="flex justify-end">
                <button
                  onClick={handleExecutarImportacao}
                  disabled={importando || !arquivoSelecionado}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F294A] hover:bg-[#1a3d6b] text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-4 h-4 text-[#D4AF37]" />
                  <span>{importando ? 'Processando lote...' : 'Executar Importação'}</span>
                </button>
              </div>

              {/* Resultado da Importação */}
              {resultado && (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col gap-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-[#0F294A]">Resumo da Importação</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {resultado.totalLido} linhas lidas
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs pt-1">
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
                      <span className="text-[10px] text-emerald-700 block">
                        Clientes Atualizados
                      </span>
                      <strong className="text-base">{resultado.clientesAtualizados}</strong>
                    </div>
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
                      <span className="text-[10px] text-blue-700 block">Canais Vinculados</span>
                      <strong className="text-base">
                        {resultado.contatosCriadosOuAtualizados}
                      </strong>
                    </div>
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                      <span className="text-[10px] text-amber-700 block">Campos Preenchidos</span>
                      <strong className="text-base">{resultado.valoresCamposAtualizados}</strong>
                    </div>
                    <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-800">
                      <span className="text-[10px] text-slate-500 block">
                        Ignorados / Inexistentes
                      </span>
                      <strong className="text-base">{resultado.ignoradosCount}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onFechar}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
