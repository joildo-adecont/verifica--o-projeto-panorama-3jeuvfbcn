import React, { useState, useEffect, useCallback } from 'react'
import {
  Archive,
  RotateCcw,
  RefreshCw,
  Search,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Info,
} from 'lucide-react'
import { EmpresaRecord } from '@/types/cadastroEmpresas'
import {
  listarEmpresas,
  reverterArquivamentoCliente,
  obterResumoLimpezaSegura,
  executarLimpezaSegura,
} from '@/services/cadastroEmpresas'
import { BadgeDocumentoCliente } from '@/components/BadgeDocumentoCliente'

interface SecaoClientesArquivadosProps {
  onClienteRevertido?: (codigo: number) => void
}

export const SecaoClientesArquivados: React.FC<SecaoClientesArquivadosProps> = ({
  onClienteRevertido,
}) => {
  const [arquivados, setArquivados] = useState<EmpresaRecord[]>([])
  const [carregando, setCarregando] = useState<boolean>(true)
  const [busca, setBusca] = useState<string>('')
  const [revertendoId, setRevertendoId] = useState<string | number | null>(null)
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [executandoDedup, setExecutandoDedup] = useState<boolean>(false)
  const [resumo, setResumo] = useState<{
    total_registros: number
    ativos: number
    arquivados: number
    invalidos_ou_vazios: number
  } | null>(null)

  const carregarArquivados = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const res = await listarEmpresas({
        somenteArquivados: true,
        busca,
        porPagina: 100,
        ordenacao: 'nome-asc',
      })
      setArquivados(res.items)

      const dadosResumo = await obterResumoLimpezaSegura()
      if (dadosResumo.ok) {
        setResumo({
          total_registros: dadosResumo.total_registros,
          ativos: dadosResumo.ativos,
          arquivados: dadosResumo.arquivados,
          invalidos_ou_vazios: dadosResumo.invalidos_ou_vazios,
        })
      }
    } catch (e: any) {
      console.error('Erro ao carregar clientes arquivados:', e)
      setErro('Falha ao carregar registros arquivados.')
    } finally {
      setCarregando(false)
    }
  }, [busca])

  useEffect(() => {
    carregarArquivados()
  }, [carregarArquivados])

  const handleReverter = async (emp: EmpresaRecord) => {
    const alvo = emp.id || emp.codigo
    setRevertendoId(alvo)
    setMensagemSucesso(null)
    setErro(null)

    try {
      const res = await reverterArquivamentoCliente(alvo)
      if (res.sucesso) {
        setMensagemSucesso(
          `Cliente "${emp.razao_social || emp.codigo}" restaurado para a listagem ativa com sucesso!`,
        )
        // Remove da lista local de arquivados
        setArquivados((prev) => prev.filter((item) => item.codigo !== emp.codigo))
        if (onClienteRevertido) {
          onClienteRevertido(emp.codigo)
        }
      } else {
        setErro(res.mensagem || 'Falha ao reverter arquivamento.')
      }
    } catch (e: any) {
      setErro(e?.message || 'Erro inesperado ao reverter arquivamento.')
    } finally {
      setRevertendoId(null)
    }
  }

  const handleExecutarLimpezaNovamente = async () => {
    setExecutandoDedup(true)
    setMensagemSucesso(null)
    setErro(null)
    try {
      const res = await executarLimpezaSegura(false)
      if (res.ok) {
        setMensagemSucesso(
          `Limpeza Segura concluída! ${res.total_arquivados} duplicata(s) arquivada(s) e ${res.total_reapontamentos} vínculo(s) reapontado(s).`,
        )
        await carregarArquivados()
      } else {
        setErro('Falha ao executar limpeza segura no servidor.')
      }
    } catch (e: any) {
      setErro(e?.message || 'Erro ao acionar limpeza segura.')
    } finally {
      setExecutandoDedup(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col gap-4">
      {/* Cabeçalho da seção */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
            <Archive className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
              Clientes Arquivados (Limpeza Segura)
            </h3>
            <p className="text-xs text-slate-500">
              Duplicatas reais arquivadas preservadas no banco (soft-delete), com vínculos
              reapontados e reversão instantânea.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <button
            onClick={handleExecutarLimpezaNovamente}
            disabled={executandoDedup || carregando}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            title="Reavaliar e sincronizar deduplicação segura de clientes"
          >
            {executandoDedup ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0F294A]" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            )}
            <span>{executandoDedup ? 'Sincronizando...' : 'Rodar Limpeza Segura'}</span>
          </button>
        </div>
      </div>

      {/* Caixa de aviso / Diretrizes de segurança */}
      <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Regras da Limpeza Segura:</strong> Nenhum registro é apagado do banco de dados.
          Cadastros com atividades diferentes (ex: Antonio Ferreira de Lima CPF com múltiplos
          negócios) ou matriz/filial (CNPJ com filial distinta) permanecem <strong>intactos</strong>
          . Apenas duplicatas reais (mesmo documento + mesma atividade) ficam arquivadas, podendo
          ser revertidas a qualquer momento.
        </div>
      </div>

      {/* Mensagens de feedback */}
      {mensagemSucesso && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg p-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {erro && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* Barra de busca de arquivados */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar entre os clientes arquivados..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F294A]/20"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
          {arquivados.length} cliente(s) arquivado(s)
          {resumo && ` (de um total de ${resumo.total_registros})`}
        </div>
      </div>

      {/* Tabela de Arquivados */}
      <div className="border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-2.5 px-3 text-center w-16">Cód.</th>
              <th className="py-2.5 px-4">Razão Social / Nome</th>
              <th className="py-2.5 px-3">Documento</th>
              <th className="py-2.5 px-3">Atividade / CNAE</th>
              <th className="py-2.5 px-3">Substituído Por</th>
              <th className="py-2.5 px-3">Motivo</th>
              <th className="py-2.5 px-3 text-center w-28">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {carregando ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#0F294A]" />
                    <span>Carregando clientes arquivados...</span>
                  </div>
                </td>
              </tr>
            ) : arquivados.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <span className="font-semibold text-slate-700">
                      Nenhum cliente arquivado no momento
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Todas as duplicatas já foram tratadas ou a listagem está limpa.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              arquivados.map((emp) => {
                const isRevertendo = revertendoId === (emp.id || emp.codigo)
                return (
                  <tr key={emp.codigo} className="hover:bg-amber-50/20 transition-colors">
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                      {emp.codigo}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">
                      <div className="flex flex-col">
                        <span>{emp.razao_social || emp.nome}</span>
                        {emp.apelido && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            Fantasia: {emp.apelido}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <BadgeDocumentoCliente
                        documento={emp.cpf_cnpj || emp.numero_documento}
                        tipoDocumento={emp.tipo_documento}
                      />
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <div className="flex flex-col text-[11px]">
                        <span>{emp.cnae ? `CNAE: ${emp.cnae}` : '—'}</span>
                        {emp.ramo_atividade && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            {emp.ramo_atividade}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {emp.substituido_por_codigo ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[#0F294A] bg-[#0F294A]/10 px-2 py-0.5 rounded">
                          <ArrowRight className="w-3 h-3 text-[#0F294A]" />
                          <span>Cód. {emp.substituido_por_codigo}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500 max-w-[220px]">
                      <span className="line-clamp-2" title={emp.motivo_arquivamento || ''}>
                        {emp.motivo_arquivamento || 'Duplicata de cadastro arquivada'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleReverter(emp)}
                        disabled={isRevertendo}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0F294A] hover:bg-[#1a3d68] text-white text-[11px] font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                        title="Reverter arquivamento e restaurar cliente para listagem ativa"
                      >
                        {isRevertendo ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3 h-3 text-[#D4AF37]" />
                        )}
                        <span>{isRevertendo ? 'Revertendo...' : 'Reverter'}</span>
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
