import React, { useState } from 'react'
import { Plus, Trash2, Edit2, Check, X, Sliders, AlertCircle } from 'lucide-react'
import { CampoPersonalizadoDef, TipoCampoPersonalizado } from '@/types/clienteDadosComplementares'
import {
  salvarCampoPersonalizado,
  excluirCampoPersonalizado,
} from '@/services/clienteDadosComplementaresService'
import { useToast } from '@/hooks/use-toast'

interface ModalGerenciarCamposPersonalizadosProps {
  aberto: boolean
  campos: CampoPersonalizadoDef[]
  onFechar: () => void
  onCamposAtualizados: () => void
}

export const ModalGerenciarCamposPersonalizados: React.FC<
  ModalGerenciarCamposPersonalizadosProps
> = ({ aberto, campos, onFechar, onCamposAtualizados }) => {
  const { toast } = useToast()
  const [salvando, setSalvando] = useState(false)
  const [campoEdicao, setCampoEdicao] = useState<Partial<CampoPersonalizadoDef> | null>(null)
  const [modoCriacao, setModoCriacao] = useState(false)

  if (!aberto) return null

  const iniciarCriacao = () => {
    setCampoEdicao({
      chave: '',
      rotulo: '',
      tipo: 'texto',
      opcoes: '',
      descricao: '',
      ativo: true,
      ordem: campos.length + 1,
    })
    setModoCriacao(true)
  }

  const iniciarEdicao = (c: CampoPersonalizadoDef) => {
    setCampoEdicao({ ...c })
    setModoCriacao(false)
  }

  const cancelarFormulario = () => {
    setCampoEdicao(null)
    setModoCriacao(false)
  }

  const handleSalvar = async () => {
    if (!campoEdicao || !campoEdicao.rotulo?.trim()) {
      toast({
        title: 'Nome do campo obrigatório',
        description: 'Informe o rótulo do campo para continuar.',
        variant: 'destructive',
      })
      return
    }

    setSalvando(true)
    try {
      await salvarCampoPersonalizado({
        id: campoEdicao.id,
        chave: campoEdicao.chave || campoEdicao.rotulo,
        rotulo: campoEdicao.rotulo.trim(),
        tipo: (campoEdicao.tipo as TipoCampoPersonalizado) || 'texto',
        opcoes: campoEdicao.opcoes || '',
        descricao: campoEdicao.descricao || '',
        ordem: campoEdicao.ordem ?? 0,
        ativo: campoEdicao.ativo !== false,
      })

      toast({
        title: modoCriacao ? 'Campo criado com sucesso' : 'Campo atualizado',
        description: `O campo "${campoEdicao.rotulo}" agora está disponível na ficha de todos os clientes.`,
      })

      cancelarFormulario()
      onCamposAtualizados()
    } catch (e: any) {
      toast({
        title: 'Erro ao salvar campo',
        description: e?.message || 'Falha ao salvar a definição do campo.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const handleExcluir = async (campo: CampoPersonalizadoDef) => {
    const confirmou = window.confirm(
      `Deseja realmente excluir o campo personalizado "${campo.rotulo}"? Os dados preenchidos serão ocultados da ficha.`,
    )
    if (!confirmou) return

    setSalvando(true)
    try {
      await excluirCampoPersonalizado(campo.id || campo.chave)
      toast({
        title: 'Campo excluído',
        description: `O campo "${campo.rotulo}" foi removido da ficha de clientes.`,
      })
      onCamposAtualizados()
    } catch (e: any) {
      toast({
        title: 'Erro ao excluir campo',
        description: e?.message || 'Não foi possível excluir o campo.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
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
            <Sliders className="w-5 h-5 text-[#D4AF37]" />
            <div>
              <h3 className="font-serif font-bold text-base leading-tight">
                Campos Personalizados da Ficha
              </h3>
              <p className="text-[11px] text-slate-300">
                Crie e configure campos adicionais para complementar o cadastro dos clientes
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

        {/* Conteúdo */}
        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4">
          {!campoEdicao && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                {campos.length} {campos.length === 1 ? 'campo configurado' : 'campos configurados'}
              </span>
              <button
                onClick={iniciarCriacao}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F294A] text-white text-xs font-bold hover:bg-[#1a3d6b] transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#D4AF37]" />
                <span>Novo Campo</span>
              </button>
            </div>
          )}

          {/* Formulário de Criação/Edição */}
          {campoEdicao && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-[#0F294A]">
                  {modoCriacao ? 'Criar Novo Campo' : `Editar Campo: ${campoEdicao.rotulo}`}
                </span>
                <button
                  onClick={cancelarFormulario}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Rótulo / Nome do Campo *
                  </label>
                  <input
                    type="text"
                    value={campoEdicao.rotulo || ''}
                    onChange={(e) => setCampoEdicao({ ...campoEdicao, rotulo: e.target.value })}
                    placeholder="Ex: Inscrição Produtor Rural"
                    className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F294A]/20"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-700">Tipo de Dado *</label>
                  <select
                    value={campoEdicao.tipo || 'texto'}
                    onChange={(e) =>
                      setCampoEdicao({
                        ...campoEdicao,
                        tipo: e.target.value as TipoCampoPersonalizado,
                      })
                    }
                    className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F294A]/20 cursor-pointer"
                  >
                    <option value="texto">Texto livre</option>
                    <option value="numero">Número</option>
                    <option value="data">Data (DD/MM/AAAA)</option>
                    <option value="booleano">Booleano (Sim / Não)</option>
                    <option value="selecao">Lista de opções (Seleção)</option>
                  </select>
                </div>
              </div>

              {campoEdicao.tipo === 'selecao' && (
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Opções da Lista (separadas por vírgula) *
                  </label>
                  <input
                    type="text"
                    value={campoEdicao.opcoes || ''}
                    onChange={(e) => setCampoEdicao({ ...campoEdicao, opcoes: e.target.value })}
                    placeholder="Ex: Opção A, Opção B, Opção C"
                    className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F294A]/20"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-700">
                  Descrição / Instrução (Opcional)
                </label>
                <input
                  type="text"
                  value={campoEdicao.descricao || ''}
                  onChange={(e) => setCampoEdicao({ ...campoEdicao, descricao: e.target.value })}
                  placeholder="Instrução exibida como dica na ficha"
                  className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F294A]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={cancelarFormulario}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSalvar}
                  disabled={salvando}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0F294A] text-white text-xs font-bold hover:bg-[#1a3d6b] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{salvando ? 'Salvando...' : 'Salvar Campo'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Lista de Campos Existentes */}
          <div className="flex flex-col divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {campos.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8 text-slate-300" />
                <span>Nenhum campo personalizado criado ainda.</span>
                <span className="text-[11px] text-slate-400">
                  Clique em "Novo Campo" acima para adicionar o primeiro campo à ficha.
                </span>
              </div>
            ) : (
              campos.map((campo) => (
                <div
                  key={campo.id || campo.chave}
                  className="p-3.5 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{campo.rotulo}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 uppercase border border-slate-200">
                        {campo.tipo}
                      </span>
                    </div>
                    {campo.descricao && (
                      <span className="text-[11px] text-slate-500">{campo.descricao}</span>
                    )}
                    {campo.tipo === 'selecao' && campo.opcoes && (
                      <span className="text-[10px] text-slate-400">Opções: {campo.opcoes}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => iniciarEdicao(campo)}
                      className="p-1.5 text-slate-500 hover:text-[#0F294A] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Editar campo"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleExcluir(campo)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Excluir campo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
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
