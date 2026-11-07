import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  CheckSquare,
  FileCheck2,
  FolderOpen,
  Save,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import type { ItemChecklistDoc } from '@/types/analisesEmpresariaisModel'

interface Props {
  itens: ItemChecklistDoc[]
  clienteNome: string
  salvando: boolean
  onToggleRecebido: (docId: string, recebido: boolean) => void
  onUpdateObs: (docId: string, observacao: string) => void
  onSalvar: () => void
}

export const FerramentaChecklistDocumental: React.FC<Props> = ({
  itens,
  clienteNome,
  salvando,
  onToggleRecebido,
  onUpdateObs,
  onSalvar,
}) => {
  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas')

  const categorias = Array.from(new Set(itens.map((i) => i.categoria)))

  const itensFiltrados = itens.filter((i) => {
    const matchBusca =
      i.documento.toLowerCase().includes(busca.toLowerCase()) ||
      i.categoria.toLowerCase().includes(busca.toLowerCase()) ||
      (i.observacao || '').toLowerCase().includes(busca.toLowerCase())
    const matchCat = filtroCategoria === 'todas' || i.categoria === filtroCategoria
    return matchBusca && matchCat
  })

  const totalItens = itens.length
  const totalRecebidos = itens.filter((i) => i.recebido).length
  const pctCompletude = totalItens > 0 ? (totalRecebidos / totalItens) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Resumo de Completude */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-border p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Documentos Monitorados</p>
            <h4 className="text-2xl font-bold mt-1 text-foreground">{totalItens} itens</h4>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            8 categorias normativas (Metodologia ADECONT)
          </p>
        </Card>
        <Card className="border-border p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Itens Recebidos</p>
            <h4 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
              {totalRecebidos} / {totalItens}
            </h4>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Documentação validada</p>
        </Card>
        <Card className="border-border p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Pendências Documentais</p>
            <h4 className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
              {totalItens - totalRecebidos} pendentes
            </h4>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Exige solicitação ao cliente</p>
        </Card>
        <Card className="border-border p-4 bg-primary/5 flex flex-col justify-between">
          <div>
            <p className="text-xs text-primary font-medium">Taxa de Completude</p>
            <h4 className="text-2xl font-extrabold mt-1 text-primary">
              {pctCompletude.toFixed(1)}%
            </h4>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${pctCompletude}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Controles de Busca e Filtro */}
      <Card className="border-border p-4 bg-muted/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-muted-foreground absolute left-2.5 top-2.5" />
              <Input
                placeholder="Buscar documento ou categoria..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="h-9 text-xs px-3 rounded-md border border-input bg-background"
            >
              <option value="todas">Todas as categorias ({categorias.length})</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <Button
            size="sm"
            onClick={onSalvar}
            disabled={salvando}
            className="text-xs h-9 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 font-semibold"
          >
            <Save className="w-4 h-4" />
            {salvando ? 'Salvando...' : 'Salvar Checklist no Banco'}
          </Button>
        </div>
      </Card>

      {/* Tabela do Checklist com Toggle Interativo */}
      <Card className="border-border">
        <CardHeader className="py-2.5 px-4 border-b border-border bg-muted/20">
          <CardTitle className="text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              Checklist de Documentação Obrigatória ({itensFiltrados.length} itens)
            </span>
            <span className="text-xs text-muted-foreground font-normal">
              Cliente: <strong className="text-foreground">{clienteNome}</strong>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground border-b border-border text-left">
                <th className="p-2.5 text-center w-12 font-semibold">Status</th>
                <th className="p-2.5 font-semibold w-44">Categoria</th>
                <th className="p-2.5 font-semibold">Documento Exigido</th>
                <th className="p-2.5 text-center w-28 font-semibold">Obrigatório</th>
                <th className="p-2.5 font-semibold w-72">Observações / Data de Entrega</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {itensFiltrados.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-muted/30 transition-colors ${
                    item.recebido ? 'bg-emerald-500/5' : ''
                  }`}
                >
                  <td className="p-2.5 text-center">
                    <input
                      type="checkbox"
                      checked={item.recebido}
                      onChange={(e) => onToggleRecebido(item.id, e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    />
                  </td>
                  <td className="p-2.5 font-semibold text-foreground">{item.categoria}</td>
                  <td className="p-2.5 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <span>{item.documento}</span>
                      {item.recebido ? (
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] py-0">
                          Recebido
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-[10px] py-0">
                          Pendente
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-2.5 text-center">
                    <Badge variant="secondary" className="text-[10px]">
                      {item.obrigatorio ? 'Sim' : 'Não'}
                    </Badge>
                  </td>
                  <td className="p-2.5">
                    <Input
                      value={item.observacao || ''}
                      placeholder="Ex: entregue em 15/03, em revisão..."
                      onChange={(e) => onUpdateObs(item.id, e.target.value)}
                      className="h-7 text-xs border-muted focus:border-primary"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
