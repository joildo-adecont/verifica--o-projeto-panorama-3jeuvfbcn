import React, { useState, useRef } from 'react'
import { Upload, FileText, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import type { EmpresaRecord } from '@/types/cadastroEmpresas'
import {
  salvarDocumentoEmpresarial,
  normalizarDocumento,
  type DocumentoContabilRecord,
} from '@/services/analisesEmpresariais'
import { extrairTextoPDF, lerContas } from '@/services/leitorBalancetePDF'

interface ImportadorDocumentosEmpresariaisProps {
  cliente: EmpresaRecord
  onDocumentoImportado: () => void
}

export const ImportadorDocumentosEmpresariais: React.FC<ImportadorDocumentosEmpresariaisProps> = ({
  cliente,
  onDocumentoImportado,
}) => {
  const [arrastando, setArrastando] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [mensagem, setMensagem] = useState<{
    tipo: 'sucesso' | 'erro' | 'info'
    texto: string
  } | null>(null)
  const [tipoDocSelecionado, setTipoDocSelecionado] = useState<
    'balancete' | 'balanco' | 'dre' | 'razao' | 'indefinido'
  >('balancete')
  const [competenciaManual, setCompetenciaManual] = useState<string>(
    new Date().toISOString().slice(0, 7), // AAAA-MM
  )
  const [ultimoImportado, setUltimoImportado] = useState<DocumentoContabilRecord | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  const processarArquivo = async (arquivo: File) => {
    setCarregando(true)
    setMensagem(null)
    setUltimoImportado(null)

    const nome = arquivo.name.toLowerCase()
    const cnpj = normalizarDocumento(
      cliente.cpf_cnpj || cliente.documento_limpo || cliente.numero_documento,
    )
    const razao = cliente.razao_social || cliente.nome || 'Cliente'

    try {
      // 1. Processamento de PDF
      if (nome.endsWith('.pdf')) {
        const resultadoPdf = await extrairTextoPDF(arquivo)
        const contas = lerContas(resultadoPdf.linhas)

        let ativo = 0
        let passivo = 0
        let receita = 0
        let lucro = 0
        let pl = 0

        for (const c of contas) {
          const desc = c.descricao.toLowerCase()
          if (c.codigo === '1' || desc.startsWith('ativo')) {
            if (c.saldo_atual > ativo) ativo = c.saldo_atual
          } else if (c.codigo === '2' || desc.startsWith('passivo')) {
            if (c.saldo_atual > passivo) passivo = c.saldo_atual
          } else if (desc.includes('patrimonio liquido') || desc.includes('patrimônio líquido')) {
            if (c.saldo_atual > pl) pl = c.saldo_atual
          } else if (
            desc.includes('receita operacional') ||
            desc.includes('receita bruta') ||
            desc.includes('receita liquida') ||
            desc.includes('receita líquida')
          ) {
            if (c.saldo_atual > receita) receita = c.saldo_atual
          } else if (
            desc.includes('lucro liquido') ||
            desc.includes('lucro líquido') ||
            desc.includes('resultado do exercicio')
          ) {
            if (Math.abs(c.saldo_atual) > Math.abs(lucro)) lucro = c.saldo_atual
          }
        }

        const comp =
          resultadoPdf.competencia || competenciaManual || new Date().toISOString().slice(0, 7)

        const salvo = await salvarDocumentoEmpresarial({
          cliente_cnpj: cnpj,
          cliente_nome: razao,
          tipo_documento: tipoDocSelecionado,
          competencia: comp,
          arquivo_nome: arquivo.name,
          formato: 'txt_delimitado',
          linhas: resultadoPdf.linhas.length,
          contas_reconhecidas: contas.length,
          total_ativo: ativo,
          total_passivo: passivo,
          receita_liquida: receita,
          lucro_liquido: lucro,
          patrimonio_liquido: pl,
          validacao: { contasLidas: contas.length, paginas: resultadoPdf.paginas },
          importado_por: 'analises-empresariais-pdf',
        })

        setUltimoImportado(salvo)
        setMensagem({
          tipo: 'sucesso',
          texto: `PDF importado com sucesso: ${contas.length} contas reconhecidas (Competência: ${comp}).`,
        })
        onDocumentoImportado()
        return
      }

      // 2. Processamento de Texto estruturado (CSV, TXT, JSON, XML, OFX)
      const texto = await arquivo.text()

      if (!texto.trim()) {
        throw new Error('O arquivo selecionado está vazio.')
      }

      let formato = 'csv'
      let linhasTotal = 1
      let contasReconhecidas = 0
      let receitaLida = 0
      let lucroLido = 0
      let ativoLido = 0
      let passivoLido = 0
      let plLido = 0

      if (nome.endsWith('.json')) {
        formato = 'txt_delimitado'
        try {
          const json = JSON.parse(texto)
          receitaLida = Number(
            json.receita || json.receita_liquida || json.receita_bruta || json.faturamento || 0,
          )
          lucroLido = Number(json.lucro || json.lucro_liquido || json.resultado || 0)
          ativoLido = Number(json.ativo || json.total_ativo || 0)
          passivoLido = Number(json.passivo || json.total_passivo || 0)
          plLido = Number(json.patrimonio_liquido || json.pl || 0)
          contasReconhecidas = Object.keys(json).length
        } catch {
          contasReconhecidas = 1
        }
      } else if (nome.endsWith('.xml') || nome.endsWith('.ofx')) {
        formato = 'txt_delimitado'
        const valoresTag =
          texto.match(
            /<vNF>([\d.]+)<\/vNF>|<TRNAMT>([\d.-]+)<\/TRNAMT>|<valor>([\d.]+)<\/valor>/g,
          ) || []
        linhasTotal = valoresTag.length || 10
        contasReconhecidas = valoresTag.length
        for (const t of valoresTag) {
          const val = parseFloat(t.replace(/<[^>]+>/g, ''))
          if (!isNaN(val) && val > 0) receitaLida += val
        }
      } else {
        // CSV / TXT / XLSX tabulado exportado
        formato = 'csv'
        const linhas = texto.split(/\r?\n/).filter((l) => l.trim().length > 0)
        linhasTotal = linhas.length

        for (const linha of linhas) {
          const cols = linha.split(/[;,|\t]/).map((c) => c.trim())
          if (cols.length >= 2) {
            contasReconhecidas++
            const desc = cols[0].toLowerCase() + ' ' + (cols[1] || '').toLowerCase()
            const valorStr = cols[cols.length - 1]
              .replace(/[R$\s]/g, '')
              .replace(/\./g, '')
              .replace(',', '.')
            const val = parseFloat(valorStr)

            if (!isNaN(val)) {
              if (
                desc.includes('receita') ||
                desc.includes('vendas') ||
                desc.includes('faturamento')
              ) {
                if (val > receitaLida) receitaLida = val
              } else if (desc.includes('lucro') || desc.includes('resultado liquido')) {
                if (Math.abs(val) > Math.abs(lucroLido)) lucroLido = val
              } else if (desc.includes('ativo total') || desc.startsWith('1 ativo')) {
                if (val > ativoLido) ativoLido = val
              } else if (desc.includes('passivo total') || desc.startsWith('2 passivo')) {
                if (val > passivoLido) passivoLido = val
              } else if (
                desc.includes('patrimonio liquido') ||
                desc.includes('patrimônio líquido')
              ) {
                if (val > plLido) plLido = val
              }
            }
          }
        }
      }

      const comp = competenciaManual || new Date().toISOString().slice(0, 7)

      const salvo = await salvarDocumentoEmpresarial({
        cliente_cnpj: cnpj,
        cliente_nome: razao,
        tipo_documento: tipoDocSelecionado,
        competencia: comp,
        arquivo_nome: arquivo.name,
        formato,
        linhas: linhasTotal,
        contas_reconhecidas: contasReconhecidas,
        total_ativo: ativoLido,
        total_passivo: passivoLido,
        receita_liquida: receitaLida,
        lucro_liquido: lucroLido,
        patrimonio_liquido: plLido,
        validacao: { linhas: linhasTotal, contas: contasReconhecidas, formato },
        importado_por: 'analises-empresariais-upload',
      })

      setUltimoImportado(salvo)
      setMensagem({
        tipo: 'sucesso',
        texto: `Documento empresarial "${arquivo.name}" importado e registrado para ${razao} (${comp}).`,
      })
      onDocumentoImportado()
    } catch (err: any) {
      console.error('[ImportadorDocumentosEmpresariais] Erro na importação:', err)
      setMensagem({
        tipo: 'erro',
        texto: err.message || 'Falha ao processar e salvar o documento empresarial.',
      })
    } finally {
      setCarregando(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setArrastando(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processarArquivo(e.dataTransfer.files[0])
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-600" />
            Importador de Balanços, DRE e Documentos Empresariais
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Suporta arquivos CSV, XLSX, JSON, XML, OFX e Balancetes em PDF. Os dados são vinculados
            ao cliente selecionado.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Competência:</span>
          <input
            type="month"
            value={competenciaManual}
            onChange={(e) => setCompetenciaManual(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-md text-slate-800 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <select
            value={tipoDocSelecionado}
            onChange={(e) => setTipoDocSelecionado(e.target.value as any)}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-md text-slate-800 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            <option value="balancete">Balancete Contábil</option>
            <option value="dre">DRE (Demonstração do Resultado)</option>
            <option value="balanco">Balanço Patrimonial</option>
            <option value="razao">Livro Razão</option>
            <option value="indefinido">Outro Documento</option>
          </select>
        </div>
      </div>

      {/* Zona de Arrastar/Upload */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setArrastando(true)
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          arrastando
            ? 'border-emerald-500 bg-emerald-50/50'
            : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.csv,.xlsx,.txt,.json,.xml,.ofx"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              processarArquivo(e.target.files[0])
            }
          }}
        />

        {carregando ? (
          <div className="flex flex-col items-center justify-center space-y-2 py-2">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-xs font-semibold text-slate-700">
              Analisando estrutura do documento contábil e vinculando ao cliente...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-3 bg-emerald-100/70 text-emerald-700 rounded-full">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                Clique para selecionar ou arraste o arquivo aqui
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Balanço, Balancete, DRE, Livro Caixa, Extrato OFX ou NFe (PDF, CSV, XLSX, XML, JSON)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Mensagens de Feedback */}
      {mensagem && (
        <div
          className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
            mensagem.tipo === 'sucesso'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : mensagem.tipo === 'erro'
                ? 'bg-rose-50 border border-rose-200 text-rose-800'
                : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}
        >
          {mensagem.tipo === 'sucesso' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 font-medium">{mensagem.texto}</div>
        </div>
      )}

      {/* Resumo do último documento importado */}
      {ultimoImportado && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <div>
              <span className="font-bold text-slate-800">{ultimoImportado.arquivo_nome}</span>
              <span className="text-slate-500 ml-2">
                Comp: {ultimoImportado.competencia} · Linhas: {ultimoImportado.linhas || 0}
              </span>
            </div>
          </div>
          <div className="text-right font-medium text-emerald-700">
            Receita Registrada:{' '}
            {Number(ultimoImportado.receita_liquida || 0).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </div>
        </div>
      )}
    </div>
  )
}
export default ImportadorDocumentosEmpresariais
