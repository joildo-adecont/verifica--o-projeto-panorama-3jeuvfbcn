/**
 * Modal de Recepção de Documento e Criação de Cliente
 * ===================================================
 * Sistema ADECONT — Projeto Panorama
 *
 * Usado em /analises-empresariais: recebe um anexo (PDF, imagem, etc.),
 * apresenta os dados legíveis preenchidos (editáveis), e cria o cliente NOVO
 * ou vincula o documento à ficha de um cliente já existente (mesmo CNPJ/CPF
 * ou razão social + NIRE). Cancelar não grava nada.
 */
import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog'
import { Button } from './ui/button'
import {
  FileInput,
  Loader2,
  Building2,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  Link2,
  FileText,
} from 'lucide-react'
import type { EmpresaRecord } from '@/types/cadastroEmpresas'
import {
  recepcionarDocumentoECriarCliente,
  localizarClienteExistente,
  CATEGORIAS_RECEPCAO,
  type DadosRecepcao,
} from '@/services/recepcaoDocumentoCliente'

export interface ModalRecepcionarDocumentoClienteProps {
  aberto: boolean
  aoFechar: () => void
  onClientePronto?: (cliente: EmpresaRecord, criado: boolean) => void
}

const INPUT_CLS =
  'w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500'

export const ModalRecepcionarDocumentoCliente: React.FC<ModalRecepcionarDocumentoClienteProps> = ({
  aberto,
  aoFechar,
  onClientePronto,
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState<string>('Contrato')
  const [observacao, setObservacao] = useState('')
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [previa, setPrevia] = useState<{ cliente: EmpresaRecord; criado: boolean } | null>(null)
  const [verificando, setVerificando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const [dados, setDados] = useState<DadosRecepcao>({
    razaoSocial: '',
    cnpjCpf: '',
    nire: '',
    uf: '',
    municipio: '',
    naturezaJuridica: '',
    dataRegistro: '',
    nomeFantasia: '',
    ramoAtividade: '',
  })

  const DADOS_VAZIOS: DadosRecepcao = {
    razaoSocial: '',
    cnpjCpf: '',
    nire: '',
    uf: '',
    municipio: '',
    naturezaJuridica: '',
    dataRegistro: '',
    nomeFantasia: '',
    ramoAtividade: '',
  }

  // Limpa tudo ao reabrir: cancelar não deixa rastro
  useEffect(() => {
    if (aberto) {
      setFile(null)
      setTitulo('')
      setCategoria('Contrato')
      setObservacao('')
      setErro(null)
      setPrevia(null)
      setDados(DADOS_VAZIOS)
      if (inputRef.current) inputRef.current.value = ''
    }
  }, [aberto])

  const podeEnviar = useMemo(
    () => Boolean(file && dados.razaoSocial.trim().length >= 2 && !processando),
    [file, dados.razaoSocial, processando],
  )

  // Pré-visualiza existência do cliente enquanto digita (debounce leve)
  useEffect(() => {
    if (!aberto || !dados.razaoSocial.trim()) {
      setPrevia(null)
      return
    }
    setVerificando(true)
    const t = setTimeout(() => {
      localizarClienteExistente(dados)
        .then((emp) => setPrevia(emp ? { cliente: emp, criado: false } : null))
        .catch(() => setPrevia(null))
        .finally(() => setVerificando(false))
    }, 500)
    return () => clearTimeout(t)
  }, [dados.razaoSocial, dados.cnpjCpf, dados.nire, aberto])

  const handleFile = (f: File | null) => {
    setFile(f)
    setErro(null)
    if (f && !titulo) setTitulo(f.name.replace(/\.[a-z0-9]+$/i, ''))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!podeEnviar || !file) return
    setProcessando(true)
    setErro(null)
    try {
      const res = await recepcionarDocumentoECriarCliente({
        dados,
        file,
        titulo,
        categoria,
        observacao,
      })
      onClientePronto?.(res.cliente, res.criado)
      aoFechar()
    } catch (err: any) {
      console.error('[ModalRecepcionarDocumentoCliente] Erro na recepção:', err)
      setErro(err?.message || 'Falha ao recepcionar o documento e gravar o cliente.')
    } finally {
      setProcessando(false)
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(open) => !open && !processando && aoFechar()}>
      <DialogContent className="max-w-2xl bg-white border border-slate-200 text-slate-800 shadow-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border shrink-0 bg-emerald-50 border-emerald-200 text-emerald-700">
              <FileInput className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Recepcionar Documento e Criar Cliente
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Anexe o documento (contrato social, certidão...). Se o cliente ainda não existir, o
                cadastro é criado com o arquivo já vinculado à ficha.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Anexo */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Documento a recepcionar *
            </label>
            <div
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                file
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50'
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.csv,.zip"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-xs text-slate-700">
                  <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold truncate max-w-[320px]">{file.name}</span>
                  <span className="text-slate-400">({Math.ceil(file.size / 1024)} KB)</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-600">Clique para anexar</p>
                  <p className="text-[10px] text-slate-400">PDF, imagem, DOCX, XLSX, CSV ou ZIP</p>
                </div>
              )}
            </div>
          </div>

          {/* Dados legíveis do cliente */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Dados legíveis do documento (editáveis)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="sm:col-span-2 space-y-0.5">
                <label className="text-[10px] font-semibold text-slate-500">Razão social *</label>
                <input
                  className={INPUT_CLS}
                  value={dados.razaoSocial}
                  onChange={(e) => setDados({ ...dados, razaoSocial: e.target.value })}
                  placeholder="Ex.: CARDOSO & SIX LTDA"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] font-semibold text-slate-500">CNPJ/CPF</label>
                <input
                  className={INPUT_CLS}
                  value={dados.cnpjCpf}
                  onChange={(e) => setDados({ ...dados, cnpjCpf: e.target.value })}
                  placeholder="Deixe vazio se não legível"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] font-semibold text-slate-500">
                  NIRE / Registro Junta
                </label>
                <input
                  className={INPUT_CLS}
                  value={dados.nire}
                  onChange={(e) => setDados({ ...dados, nire: e.target.value })}
                  placeholder="Ex.: 43206788148"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] font-semibold text-slate-500">UF</label>
                <input
                  className={INPUT_CLS}
                  value={dados.uf}
                  onChange={(e) =>
                    setDados({ ...dados, uf: e.target.value.toUpperCase().slice(0, 2) })
                  }
                  placeholder="Ex.: RS"
                  maxLength={2}
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] font-semibold text-slate-500">Município</label>
                <input
                  className={INPUT_CLS}
                  value={dados.municipio}
                  onChange={(e) => setDados({ ...dados, municipio: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] font-semibold text-slate-500">Data de registro</label>
                <input
                  className={INPUT_CLS}
                  value={dados.dataRegistro}
                  onChange={(e) => setDados({ ...dados, dataRegistro: e.target.value })}
                  placeholder="Ex.: 19/09/2018"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] font-semibold text-slate-500">
                  Natureza jurídica
                </label>
                <input
                  className={INPUT_CLS}
                  value={dados.naturezaJuridica}
                  onChange={(e) => setDados({ ...dados, naturezaJuridica: e.target.value })}
                  placeholder="Ex.: Sociedade Empresária Limitada"
                />
              </div>
            </div>

            {/* Prévia: cliente existente ou novo */}
            {verificando && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Verificando cadastro existente...
              </div>
            )}
            {!verificando && previa && (
              <div className="flex items-start gap-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">
                <Link2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  Cliente existente encontrado: <b>{previa.cliente.razao_social}</b> (código{' '}
                  {previa.cliente.codigo}). O documento será vinculado à ficha dele.
                </span>
              </div>
            )}
            {!verificando && !previa && dados.razaoSocial.trim().length >= 2 && (
              <div className="flex items-start gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                <UserPlus className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  Nenhum cliente encontrado — um cadastro NOVO será criado com estes dados.
                </span>
              </div>
            )}
          </div>

          {/* Metadados do anexo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-0.5">
              <label className="text-[10px] font-semibold text-slate-500">
                Título do documento
              </label>
              <input
                className={INPUT_CLS}
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex.: Contrato Social"
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] font-semibold text-slate-500">Categoria</label>
              <select
                className={INPUT_CLS}
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                {CATEGORIAS_RECEPCAO.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 space-y-0.5">
              <label className="text-[10px] font-semibold text-slate-500">Observação</label>
              <input
                className={INPUT_CLS}
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Opcional — ex.: registrado na JUCISRS nº 4848028"
              />
            </div>
          </div>

          {erro && (
            <div className="flex items-center gap-2 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={aoFechar}
              disabled={processando}
              className="border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!podeEnviar}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {processando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Gravando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Recepcionar e Gravar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ModalRecepcionarDocumentoCliente
