import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Building2,
  Calendar,
  CreditCard,
  Percent,
  Sparkles,
  Loader2,
} from 'lucide-react'
import type { NfeRecord, NfeItem } from '@/types/nfes'
import { listarNfes } from '@/services/nfeService'

interface TabelaNfeItensProps {
  itens: NfeItem[]
  loading?: boolean
}

export const TabelaNfeItens: React.FC<TabelaNfeItensProps> = ({ itens, loading }) => {
  if (loading) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        Carregando itens e tributação da NF-e...
      </div>
    )
  }

  if (!itens || itens.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-muted-foreground">
        Nenhum item localizado para este documento fiscal.
      </div>
    )
  }

  return (
    <div className="border border-border/60 rounded-lg overflow-hidden bg-background">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground font-semibold">
            <tr>
              <th className="p-2.5 w-10 text-center">#</th>
              <th className="p-2.5">Código / Descrição</th>
              <th className="p-2.5">NCM</th>
              <th className="p-2.5">CEST</th>
              <th className="p-2.5">CFOP</th>
              <th className="p-2.5 text-right">Qtd</th>
              <th className="p-2.5 text-right">V. Unit</th>
              <th className="p-2.5 text-right">Total</th>
              <th className="p-2.5">ICMS (CST / %)</th>
              <th className="p-2.5">PIS/COF (%)</th>
              <th className="p-2.5">cClassTrib (Reforma)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {itens.map((it) => (
              <tr key={it.id || it.numero_item} className="hover:bg-muted/20 transition-colors">
                <td className="p-2.5 text-center font-mono text-muted-foreground">
                  {it.numero_item}
                </td>
                <td className="p-2.5 max-w-xs">
                  <div className="font-medium text-foreground truncate" title={it.descricao}>
                    {it.descricao}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    Cód: {it.codigo_produto}
                  </div>
                </td>
                <td className="p-2.5 font-mono">{it.ncm}</td>
                <td className="p-2.5 font-mono">{it.cest || '—'}</td>
                <td className="p-2.5 font-mono">{it.cfop}</td>
                <td className="p-2.5 text-right">
                  {it.quantidade}{' '}
                  <span className="text-[10px] text-muted-foreground">{it.unidade}</span>
                </td>
                <td className="p-2.5 text-right">R$ {Number(it.valor_unitario).toFixed(2)}</td>
                <td className="p-2.5 text-right font-semibold">
                  R$ {Number(it.valor_total).toFixed(2)}
                </td>
                <td className="p-2.5">
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-primary/30">
                    CST {it.cst_icms || '00'}
                  </Badge>
                  {it.aliquota_icms ? (
                    <span className="ml-1 text-[11px] text-muted-foreground">
                      {it.aliquota_icms}% (R$ {Number(it.valor_icms).toFixed(2)})
                    </span>
                  ) : null}
                </td>
                <td className="p-2.5 text-[11px] text-muted-foreground">
                  PIS {it.aliquota_pis || 0}% / COF {it.aliquota_cofins || 0}%
                </td>
                <td className="p-2.5">
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-mono bg-primary/10 text-primary"
                  >
                    {it.cclass_trib_sugerido || '000000'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface NfeCardItemProps {
  nfe: NfeRecord
  onAnalisar?: (nfe: NfeRecord) => void
}

export const NfeCardItem: React.FC<NfeCardItemProps> = ({ nfe, onAnalisar }) => {
  const [expandido, setExpandido] = useState(false)
  const [itens, setItens] = useState<NfeItem[]>([])
  const [carregandoItens, setCarregandoItens] = useState(false)

  const toggleExpandir = async () => {
    if (!expandido && itens.length === 0) {
      setCarregandoItens(true)
      try {
        const res = await listarNfes({ nfe_id: nfe.id })
        if (res.itens) {
          setItens(res.itens)
        }
      } catch (err) {
        console.error('Erro ao buscar itens da NFe:', err)
      } finally {
        setCarregandoItens(false)
      }
    }
    setExpandido((prev) => !prev)
  }

  const tipoBadge =
    nfe.tipo_operacao === 'compra' ? (
      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
        Compra (Entrada)
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
        Venda (Saída)
      </Badge>
    )

  return (
    <Card className="border-border/70 hover:border-primary/40 transition-colors shadow-sm">
      <CardHeader className="p-4 pb-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-bold">NF-e nº {nfe.numero || 'S/N'}</CardTitle>
                <span className="text-xs text-muted-foreground font-mono">
                  Série {nfe.serie || '1'}
                </span>
                {tipoBadge}
                {nfe.analise_status === 'analisado' && (
                  <Badge
                    variant="secondary"
                    className="bg-purple-500/10 text-purple-600 border-purple-500/30 text-[10px]"
                  >
                    <Sparkles className="w-3 h-3 mr-1" /> Analisada pelos Agentes
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-mono truncate max-w-xl mt-0.5">
                Chave: {nfe.chave_acesso}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            {onAnalisar && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAnalisar(nfe)}
                className="text-xs h-8 border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-600"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-600" />
                {nfe.analise_status === 'analisado'
                  ? 'Ver Parecer dos Agentes'
                  : 'Analisar com Agentes'}
              </Button>
            )}

            <Button variant="ghost" size="sm" onClick={toggleExpandir} className="text-xs h-8">
              {expandido ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" /> Ocultar
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" /> Detalhes & Itens ({nfe.quantidade_itens})
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-3">
        {/* Cabeçalho resumido de partes e valores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 text-xs">
          <div className="p-2 rounded-lg bg-muted/30 border border-border/40">
            <span className="text-muted-foreground flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> Emitente (Fornecedor)
            </span>
            <div
              className="font-semibold text-foreground truncate mt-0.5"
              title={nfe.emit_razao_social}
            >
              {nfe.emit_razao_social}
            </div>
            <div className="text-[11px] text-muted-foreground">
              CNPJ: {nfe.emit_cnpj_cpf} ({nfe.emit_uf || 'BR'})
            </div>
          </div>

          <div className="p-2 rounded-lg bg-muted/30 border border-border/40">
            <span className="text-muted-foreground flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> Destinatário (Cliente)
            </span>
            <div
              className="font-semibold text-foreground truncate mt-0.5"
              title={nfe.dest_razao_social}
            >
              {nfe.dest_razao_social}
            </div>
            <div className="text-[11px] text-muted-foreground">
              CNPJ: {nfe.dest_cnpj_cpf} ({nfe.dest_uf || 'BR'})
            </div>
          </div>

          <div className="p-2 rounded-lg bg-muted/30 border border-border/40">
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Emissão / Valores
            </span>
            <div className="font-semibold text-foreground mt-0.5">
              R$ {Number(nfe.valor_total_nfe).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {nfe.data_emissao
                ? new Date(nfe.data_emissao).toLocaleDateString('pt-BR')
                : 'Data não informada'}
              {nfe.valor_frete ? ` (Frete R$ ${Number(nfe.valor_frete).toFixed(2)})` : ''}
            </div>
          </div>

          <div className="p-2 rounded-lg bg-muted/30 border border-border/40">
            <span className="text-muted-foreground flex items-center gap-1">
              <Percent className="w-3.5 h-3.5" /> Tributos Destacados
            </span>
            <div className="font-semibold text-foreground mt-0.5">
              ICMS: R$ {Number(nfe.valor_icms || 0).toFixed(2)}
            </div>
            <div className="text-[11px] text-muted-foreground">
              PIS R$ {Number(nfe.valor_pis || 0).toFixed(2)} | COF R${' '}
              {Number(nfe.valor_cofins || 0).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Expansão com duplicatas e itens */}
        {expandido && (
          <div className="pt-3 border-t border-border/50 space-y-4">
            {/* Duplicatas / Cobrança */}
            {nfe.duplicatas && nfe.duplicatas.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" /> Parcelas e Vencimentos (Cobrança)
                </span>
                <div className="flex flex-wrap gap-2">
                  {nfe.duplicatas.map((dup, i) => (
                    <div
                      key={i}
                      className="px-2.5 py-1 rounded bg-muted/40 border border-border/60 text-xs flex items-center gap-2"
                    >
                      <span className="font-mono text-muted-foreground">
                        Parc. {dup.numero || i + 1}
                      </span>
                      <span className="text-muted-foreground">
                        {dup.vencimento
                          ? new Date(dup.vencimento).toLocaleDateString('pt-BR')
                          : 'A vista'}
                      </span>
                      <span className="font-semibold">
                        R$ {Number(dup.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabela de Itens */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  Itens da Nota Fiscal ({nfe.quantidade_itens} mercadorias/produtos)
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Classificação tributária atual e correspondência cClassTrib (Reforma)
                </span>
              </div>
              <TabelaNfeItens itens={itens} loading={carregandoItens} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
