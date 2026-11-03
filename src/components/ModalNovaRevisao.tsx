import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AdecontLogo } from '@/components/AdecontLogo'
import { SeloNivelConfianca } from '@/components/SeloNivelConfianca'
import type {
  CreateNormReviewInput,
  ConfidenceTier,
  ReviewType,
  NormSegment,
} from '@/types/panorama'
import { PlusCircle, ShieldCheck } from 'lucide-react'

export interface ModalNovaRevisaoProps {
  aberto: boolean
  aoFechar: () => void
  aoSalvar: (dados: CreateNormReviewInput) => Promise<void>
}

export const ModalNovaRevisao: React.FC<ModalNovaRevisaoProps> = ({
  aberto,
  aoFechar,
  aoSalvar,
}) => {
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [codigo, setCodigo] = useState('')
  const [tipoNorma, setTipoNorma] = useState('Resolução')
  const [numero, setNumero] = useState('')
  const [ano, setAno] = useState('2026')
  const [titulo, setTitulo] = useState('')
  const [orgaoFonte, setOrgaoFonte] = useState('CGIBS (Comitê Gestor IBS)')
  const [confidenceTier, setConfidenceTier] = useState<ConfidenceTier>('oficial_institucional')
  const [tipoRevisao, setTipoRevisao] = useState<ReviewType>('alteracao')
  const [segmento, setSegmento] = useState<NormSegment>('Tributário')
  const [dataRevisao, setDataRevisao] = useState(new Date().toISOString().slice(0, 10))
  const [resumo, setResumo] = useState('')
  const [versaoAnterior, setVersaoAnterior] = useState('')
  const [versaoAtual, setVersaoAtual] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [notas, setNotas] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!codigo.trim() || !resumo.trim()) {
      setErro('Preencha ao menos o Código da Norma e o Resumo da Revisão.')
      return
    }

    setSalvando(true)
    setErro(null)

    try {
      await aoSalvar({
        norm_code: codigo.trim(),
        norm_type: tipoNorma,
        norm_number: numero.trim() || undefined,
        norm_year: ano.trim() || '2026',
        norm_title: titulo.trim() || codigo.trim(),
        source_org: orgaoFonte.trim() || 'Órgão Oficial',
        confidence_tier: confidenceTier,
        review_type: tipoRevisao,
        segment: segmento,
        review_date: dataRevisao,
        summary_change: resumo.trim(),
        previous_version: versaoAnterior.trim() || undefined,
        current_version: versaoAtual.trim() || undefined,
        record_origin: 'manual',
        link_url: linkUrl.trim() || undefined,
        notes: notas.trim() || undefined,
      })

      // Limpar formulário
      setCodigo('')
      setTitulo('')
      setNumero('')
      setResumo('')
      setVersaoAnterior('')
      setVersaoAtual('')
      setLinkUrl('')
      setNotas('')
      aoFechar()
    } catch (err) {
      setErro('Erro ao registrar revisão. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  // Ajusta confidenceTier automaticamente com base no órgão
  const handleOrgaoChange = (val: string) => {
    setOrgaoFonte(val)
    const low = val.toLowerCase()
    if (
      low.includes('dou') ||
      low.includes('imprensa') ||
      low.includes('diário') ||
      low.includes('diario')
    ) {
      setConfidenceTier('diario_oficial')
    } else if (low.includes('lefisc')) {
      setConfidenceTier('comparacao')
    } else {
      setConfidenceTier('oficial_institucional')
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(open) => !open && aoFechar()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between mb-2">
            <AdecontLogo variant="color" className="h-7 w-auto" />
            <SeloNivelConfianca tier={confidenceTier} compacto />
          </div>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <PlusCircle className="h-5 w-5 text-emerald-600" />
            Registrar Revisão Manual de Norma
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Cadastre uma inclusão, alteração ou exclusão legislativa no histórico oficial ADECONT.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {erro && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-md">
              {erro}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="norm_code" className="text-xs font-semibold">
                Código / Identificação da Norma *
              </Label>
              <Input
                id="norm_code"
                placeholder="Ex: Resolução CGIBS 7/2026 ou LC 239/2026"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="norm_type" className="text-xs font-semibold">
                Tipo de Ato Normativo
              </Label>
              <Select value={tipoNorma} onValueChange={setTipoNorma}>
                <SelectTrigger id="norm_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Resolução">Resolução CGIBS</SelectItem>
                  <SelectItem value="Lei Complementar">Lei Complementar</SelectItem>
                  <SelectItem value="Decreto">Decreto Presidencial</SelectItem>
                  <SelectItem value="Instrução Normativa">Instrução Normativa RFB</SelectItem>
                  <SelectItem value="Portaria Conjunta">Portaria Conjunta</SelectItem>
                  <SelectItem value="Ato Conjunto">Ato Conjunto RFB/CGIBS</SelectItem>
                  <SelectItem value="Solução de Consulta">Solução de Consulta COSIT</SelectItem>
                  <SelectItem value="Exclusão Legislativa">
                    Exclusão Legislativa / Revogação
                  </SelectItem>
                  <SelectItem value="Outro">Outro Ato</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="norm_number" className="text-xs font-semibold">
                Número
              </Label>
              <Input
                id="norm_number"
                placeholder="Ex: 7 ou 238"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="norm_year" className="text-xs font-semibold">
                Ano
              </Label>
              <Input
                id="norm_year"
                placeholder="2026"
                value={ano}
                onChange={(e) => setAno(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="review_date" className="text-xs font-semibold">
                Data da Revisão *
              </Label>
              <Input
                id="review_date"
                type="date"
                value={dataRevisao}
                onChange={(e) => setDataRevisao(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="norm_title" className="text-xs font-semibold">
              Título / Ementa Descritiva
            </Label>
            <Input
              id="norm_title"
              placeholder="Ex: Regulamenta a emissão de DFe para contribuintes do Simples"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tipo de Revisão *</Label>
              <Select value={tipoRevisao} onValueChange={(v) => setTipoRevisao(v as ReviewType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alteracao">Alteração Legislativa</SelectItem>
                  <SelectItem value="inclusao">Inclusão Normativa</SelectItem>
                  <SelectItem value="exclusao">Exclusão / Revogação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Segmento ADECONT *</Label>
              <Select value={segmento} onValueChange={(v) => setSegmento(v as NormSegment)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tributário">Tributário</SelectItem>
                  <SelectItem value="Jurídico">Jurídico</SelectItem>
                  <SelectItem value="Contábil">Contábil</SelectItem>
                  <SelectItem value="Administrativo">Administrativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Órgão / Fonte Primária</Label>
              <Input
                placeholder="Ex: CGIBS, RFB, DOU"
                value={orgaoFonte}
                onChange={(e) => handleOrgaoChange(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="summary_change" className="text-xs font-semibold">
              Resumo do que Mudou *
            </Label>
            <Textarea
              id="summary_change"
              rows={3}
              placeholder="Descreva de forma clara a inovação jurídica ou a alteração introduzida pela norma..."
              value={resumo}
              onChange={(e) => setResumo(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="prev_version"
                className="text-xs font-semibold text-rose-700 dark:text-rose-400"
              >
                Versão Anterior (quando aplicável)
              </Label>
              <Textarea
                id="prev_version"
                rows={2}
                placeholder="Como o dispositivo era redigido anteriormente..."
                value={versaoAnterior}
                onChange={(e) => setVersaoAnterior(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="curr_version"
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400"
              >
                Versão Atual / Vigente
              </Label>
              <Textarea
                id="curr_version"
                rows={2}
                placeholder="Como ficou a redação definitiva ou consolidada..."
                value={versaoAtual}
                onChange={(e) => setVersaoAtual(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="link_url" className="text-xs font-semibold">
              Link Oficial / Diário Oficial (Opcional)
            </Label>
            <Input
              id="link_url"
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          </div>

          <DialogFooter className="border-t pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={aoFechar}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={salvando}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              <ShieldCheck className="h-4 w-4" />
              {salvando ? 'Gravando...' : 'Salvar Revisão no Histórico'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
