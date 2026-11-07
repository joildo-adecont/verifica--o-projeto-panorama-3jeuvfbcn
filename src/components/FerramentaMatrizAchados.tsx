import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertOctagon,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit3,
  Save,
  Filter,
} from 'lucide-react'
import type {
  AchadoDueDiligence,
  ImpactoAchado,
  StatusAchado,
} from '@/types/analisesEmpresariaisModel'

interface Props {
  achados: AchadoDueDiligence[]
  clienteNome: string
  onSalvarAchado: (achado: AchadoDueDiligence) => Promise<void>
  onExcluirAchado: (achadoId: string) => Promise<void>
}

export const FerramentaMatrizAchados: React.FC<Props> = ({
  achados,
  clienteNome,
  onSalvarAchado,
  onExcluirAchado,
}) => {
  const [modalAberto, setModalAberto] = useState(false)
  const [achadoEmEdicao, setAchadoEmEdicao] = useState<Partial<AchadoDueDiligence> | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [filtroImpacto, setFiltroImpacto] = useState<string>('todos')

  const abrirNovo = () => {
    setAchadoEmEdicao({
      area: 'Contábil',
      achado: '',
      evidencia: '',
      impacto: 'Médio',
      risco: 'Médio',
      recomendacao: '',
      responsavel: '',
      prazo: '30 dias',
      status: 'Em andamento',
    })
    setModalAberto(true)
  }

  const abrirEditar = (item: AchadoDueDiligence) => {
    setAchadoEmEdicao({ ...item })
    setModalAberto(true)
  }

  const handleSalvar = async () => {
    if (!achadoEmEdicao || !achadoEmEdicao.achado) return
    setSalvando(true)
    try {
      await onSalvarAchado(achadoEmEdicao as AchadoDueDiligence)
      setModalAberto(false)
      setAchadoEmEdicao(null)
    } finally {
      setSalvando(false)
    }
  }

  const getImpactoBadge = (impacto: ImpactoAchado) => {
    switch (impacto) {
      case 'Alto':
        return (
          <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30 font-semibold">
            Alto Impacto
          </Badge>
        )
      case 'Médio':
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-semibold">
            Médio Impacto
          </Badge>
        )
      case 'Baixo':
        return (
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 font-semibold">
            Baixo Impacto
          </Badge>
        )
    }
  }

  const getStatusBadge = (status: StatusAchado) => {
    switch (status) {
      case 'Crítico':
        return (
          <Badge className="bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/40">
            Crítico
          </Badge>
        )
      case 'Pendente':
        return (
          <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40">
            Pendente
          </Badge>
        )
      case 'Em andamento':
        return (
          <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40">
            Em andamento
          </Badge>
        )
      case 'Concluído':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40">
            Concluído
          </Badge>
        )
    }
  }

  const achadosFiltrados = achados.filter((a) => {
    if (filtroImpacto === 'todos') return true
    return a.impacto === filtroImpacto
  })

  const totalCriticos = achados.filter((a) => a.status === 'Crítico' || a.impacto === 'Alto').length
  const totalEmAndamento = achados.filter((a) => a.status === 'Em andamento').length

  return (
    <div className="space-y-6">
      {/* Resumo da Matriz */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-border p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Achados Registrados</p>
            <h4 className="text-2xl font-bold mt-1 text-foreground">{achados.length}</h4>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Apontamentos de Due Diligence</p>
        </Card>
        <Card className="border-border p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">
              Pontos Críticos / Alto Impacto
            </p>
            <h4 className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">
              {totalCriticos}
            </h4>
          </div>
          <p className="text-[11px] text-red-600/80 mt-2">Impactam o parecer de crédito</p>
        </Card>
        <Card className="border-border p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Em Andamento</p>
            <h4 className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">
              {totalEmAndamento}
            </h4>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Planos de ação em execução</p>
        </Card>
        <Card className="border-border p-4 flex items-center justify-center bg-muted/20">
          <Button
            onClick={abrirNovo}
            className="w-full text-xs h-10 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 font-semibold"
          >
            <PlusCircle className="w-4 h-4" />
            Adicionar Novo Achado
          </Button>
        </Card>
      </div>

      {/* Tabela de Achados */}
      <Card className="border-border">
        <CardHeader className="py-2.5 px-4 border-b border-border bg-muted/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-primary" />
              Matriz de Achados e Recomendações — Auditoria Due Diligence ({clienteNome})
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Filtrar impacto:</span>
              <select
                value={filtroImpacto}
                onChange={(e) => setFiltroImpacto(e.target.value)}
                className="h-7 text-xs px-2 rounded-md border border-input bg-background"
              >
                <option value="todos">Todos ({achados.length})</option>
                <option value="Alto">Alto Impacto</option>
                <option value="Médio">Médio Impacto</option>
                <option value="Baixo">Baixo Impacto</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {achadosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Nenhum achado registrado para este cliente ainda. Clique em "Adicionar Novo Achado"
              para auditar a empresa.
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground border-b border-border text-left">
                  <th className="p-2.5 w-12 text-center font-semibold">Nº</th>
                  <th className="p-2.5 font-semibold w-24">Área</th>
                  <th className="p-2.5 font-semibold">Achado / Apontamento</th>
                  <th className="p-2.5 font-semibold">Evidência / Origem</th>
                  <th className="p-2.5 text-center font-semibold w-24">Impacto</th>
                  <th className="p-2.5 font-semibold">Recomendação ADECONT</th>
                  <th className="p-2.5 font-semibold w-24">Responsável</th>
                  <th className="p-2.5 text-center font-semibold w-20">Prazo</th>
                  <th className="p-2.5 text-center font-semibold w-28">Status</th>
                  <th className="p-2.5 text-center font-semibold w-16">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {achadosFiltrados.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-muted/30">
                    <td className="p-2.5 text-center font-mono font-medium text-muted-foreground">
                      {idx + 1}
                    </td>
                    <td className="p-2.5 font-semibold text-foreground">{item.area}</td>
                    <td className="p-2.5 font-medium text-foreground max-w-xs">{item.achado}</td>
                    <td className="p-2.5 text-muted-foreground text-[11px] max-w-xs truncate">
                      {item.evidencia}
                    </td>
                    <td className="p-2.5 text-center">{getImpactoBadge(item.impacto)}</td>
                    <td className="p-2.5 text-muted-foreground text-[11px] max-w-xs truncate">
                      {item.recomendacao}
                    </td>
                    <td className="p-2.5 text-foreground text-[11px]">{item.responsavel || '-'}</td>
                    <td className="p-2.5 text-center text-muted-foreground font-mono text-[11px]">
                      {item.prazo || '-'}
                    </td>
                    <td className="p-2.5 text-center">{getStatusBadge(item.status)}</td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => abrirEditar(item)}
                          className="h-7 w-7 p-0"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => item.id && onExcluirAchado(item.id)}
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Criação / Edição de Achado */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-primary" />
              {achadoEmEdicao?.id
                ? 'Editar Achado de Auditoria'
                : 'Cadastrar Novo Achado (Due Diligence)'}
            </DialogTitle>
          </DialogHeader>
          {achadoEmEdicao && (
            <div className="space-y-3 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Área Auditada:</label>
                  <select
                    value={achadoEmEdicao.area || 'Contábil'}
                    onChange={(e) => setAchadoEmEdicao({ ...achadoEmEdicao, area: e.target.value })}
                    className="w-full h-8 px-2 rounded-md border border-input text-xs bg-background"
                  >
                    <option value="Contábil">Contábil</option>
                    <option value="Fiscal">Fiscal</option>
                    <option value="Financeiro">Financeiro</option>
                    <option value="Operacional">Operacional</option>
                    <option value="Trabalhista">Trabalhista</option>
                    <option value="Jurídico">Jurídico</option>
                    <option value="Governança">Governança</option>
                    <option value="Liquidez">Liquidez</option>
                    <option value="Comercial">Comercial</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Impacto no Diagnóstico:</label>
                  <select
                    value={achadoEmEdicao.impacto || 'Médio'}
                    onChange={(e) =>
                      setAchadoEmEdicao({
                        ...achadoEmEdicao,
                        impacto: e.target.value as ImpactoAchado,
                      })
                    }
                    className="w-full h-8 px-2 rounded-md border border-input text-xs bg-background"
                  >
                    <option value="Baixo">Baixo</option>
                    <option value="Médio">Médio</option>
                    <option value="Alto">Alto</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Achado / Inconsistência:</label>
                <Textarea
                  value={achadoEmEdicao.achado || ''}
                  placeholder="Descreva o apontamento ou anomalia identificada..."
                  onChange={(e) => setAchadoEmEdicao({ ...achadoEmEdicao, achado: e.target.value })}
                  rows={2}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Evidência / Origem:</label>
                <Input
                  value={achadoEmEdicao.evidencia || ''}
                  placeholder="Ex: Balanço 2024, extrato bancário, conta de tributos..."
                  onChange={(e) =>
                    setAchadoEmEdicao({ ...achadoEmEdicao, evidencia: e.target.value })
                  }
                  className="text-xs h-8"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Recomendação ADECONT:</label>
                <Textarea
                  value={achadoEmEdicao.recomendacao || ''}
                  placeholder="Ação corretiva sugerida..."
                  onChange={(e) =>
                    setAchadoEmEdicao({ ...achadoEmEdicao, recomendacao: e.target.value })
                  }
                  rows={2}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Responsável:</label>
                  <Input
                    value={achadoEmEdicao.responsavel || ''}
                    placeholder="Ex: Contabilidade, Diretoria..."
                    onChange={(e) =>
                      setAchadoEmEdicao({ ...achadoEmEdicao, responsavel: e.target.value })
                    }
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Prazo Sugerido:</label>
                  <Input
                    value={achadoEmEdicao.prazo || ''}
                    placeholder="Ex: 30 dias, 60 dias..."
                    onChange={(e) =>
                      setAchadoEmEdicao({ ...achadoEmEdicao, prazo: e.target.value })
                    }
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Status:</label>
                  <select
                    value={achadoEmEdicao.status || 'Em andamento'}
                    onChange={(e) =>
                      setAchadoEmEdicao({
                        ...achadoEmEdicao,
                        status: e.target.value as StatusAchado,
                      })
                    }
                    className="w-full h-8 px-2 rounded-md border border-input text-xs bg-background"
                  >
                    <option value="Em andamento">Em andamento</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Crítico">Crítico</option>
                    <option value="Concluído">Concluído</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalAberto(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSalvar}
              disabled={salvando || !achadoEmEdicao?.achado}
              className="text-xs bg-primary text-primary-foreground font-semibold"
            >
              {salvando ? 'Salvando...' : 'Salvar Achado'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
