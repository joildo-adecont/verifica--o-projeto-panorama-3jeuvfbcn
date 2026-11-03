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
  CreateNormExclusionInput,
  ConfidenceTier,
  NormSegment,
} from '@/types/panorama'
import { Ban, ShieldCheck } from 'lucide-react'

export interface ModalNovaExclusaoProps {
  aberto: boolean
  aoFechar: () => void
  aoSalvar: (dados: CreateNormExclusionInput) => Promise<void>
}

export const ModalNovaExclusao: React.FC<ModalNovaExclusaoProps> = ({
  aberto,
  aoFechar,
  aoSalvar,
}) => {
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [codigo, setCodigo] = useState('')
  const [tipoNorma, setTipoNorma] = useState('Exclusão Legislativa')
  const [numero, setNumero] = useState('')
  const [ano, setAno] = useState('2026')
  const [titulo, setTitulo] = useState('')
  const [orgaoFonte, setOrgaoFonte] = useState('Senado Federal / Congresso Nacional')
  const [confidenceTier, setConfidenceTier] = useState<ConfidenceTier>('oficial_institucional')
  const [segmento, setSegmento] = useState<NormSegment>('Tributário')
  const [dataExclusao, setDataExclusao] = useState(new Date().toISOString().slice(0, 10))
  const [motivo, setMotivo] = useState('')
  const [artigoRevogado, setArtigoRevogado] = useState('')
  const [redacaoAnterior, setRedacaoAnterior] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [notas, setNotas] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!codigo.trim() || !motivo.trim()) {
      setErro('Preencha ao menos o Código da Norma e a Descrição/Motivo da Exclusão.')
      return
    }

    setSalvando(true)
    setErro(null)

    try {
      await aoSalvar({
        norm_code: codigo.trim(),
        norm_type: tipoNorma.trim(),
        norm_number: numero.trim() || undefined,
        norm_year: ano.trim() || '2026',
        norm_title: titulo.trim() || codigo.trim(),
        source_org: orgaoFonte.trim() || 'Órgão Oficial',
        confidence_tier: confidenceTier,
        segment: segmento,
        exclusion_date: dataExclusao,
        reason_description: motivo.trim(),
        revoked_article: artigoRevogado.trim() || undefined,
        previous_content: redacaoAnterior.trim() || undefined,
        record_origin: 'manual',
        link_url: linkUrl.trim() || undefined,
        notes: notas.trim() || undefined,
      })

      // Limpar formulário
      setCodigo('')
      setTitulo('')
      setNumero('')
      setMotivo('')
      setArtigoRevogado('')
      setRedacaoAnterior('')
      setLinkUrl('')
      setNotas('')
      aoFechar()
    } catch {
      setErro('Erro ao registrar exclusão legislativa. Tente novamente.')
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
            <Ban className="h-5 w-5 text-rose-600" />
            Registrar Exclusão / Revogação Legislativa
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Cadastre a exclusão, revogação expressa ou perda de eficácia de um ato legislativo no histórico oficial ADECONT.
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
              <Label htmlFor="norm_code_excl" className="text-xs font-semibold">
                Código / Norma Excluída *
              </Label>
              <Input
                id="norm_code_excl"
                placeholder="Ex: Revogação LC 123/2006 art. 13 §1º ou Decreto 9.718/1998"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="norm_type_excl" className="text-xs font-semibold">
                Tipo de Exclusão / Ato
              </Label>
              <Select value={tipoNorma} onValueChange={setTipoNorma}>
                <SelectTrigger id="norm_type_excl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Exclusão Legislativa">Exclusão Legislativa</SelectItem>
                  <SelectItem value="Revogação Expressa">Revogação Expressa</SelectItem>
                  <SelectItem value="Revogação Tácita">Revogação Tácita / Incompatibilidade</SelectItem>
                  <SelectItem value="Perda de Eficácia">Perda de Eficácia / Vencimento</SelectItem>
                  <SelectItem value="Inconstitucionalidade STF">Inconstitucionalidade (STF/ADI)</SelectItem>
                  <SelectItem value="Resolução CGIBS Revogada">Resolução CGIBS Revogada</SelectItem>
                  <SelectItem value="Outro">Outro Tipo de Exclusão</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="norm_number_excl" className="text-xs font-semibold">
                Número
              </Label>
              <Input
                id="norm_number_excl"
                placeholder="Ex: 123 ou 9.718"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="norm_year_excl" className="text-xs font-semibold">
                Ano
              </Label>
              <Input
                id="norm_year_excl"
                placeholder="2026"
                value={ano}
                onChange={(e) => setAno(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="excl_date" className="text-xs font-semibold">
                Data do Evento *
              </Label>
              <Input
                id="excl_date"
                type="date"
                value={dataExclusao}
                onChange={(e) => setDataExclusao(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="norm_title_excl" className="text-xs font-semibold">
              Título / Ementa do Ato Excluído
            </Label>
            <Input
              id="norm_title_excl"
              placeholder="Ex: Exclusão de disposições incompatíveis com a sistemática de não cumulatividade ampla do IBS/CBS"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                placeholder="Ex: Senado Federal, Planalto, DOU, RFB, CGIBS"
                value={orgaoFonte}
                onChange={(e) => handleOrgaoChange(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason_description" className="text-xs font-semibold">
              Motivo e Fundamentação da Exclusão / Revogação *
            </Label>
            <Textarea
              id="reason_description"
              rows={3}
              placeholder="Descreva claramente o fundamento da exclusão legislativa, o ato revogador e o impacto tributário/contábil..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="revoked_article" className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                Dispositivo / Artigo Revogado (Opcional)
              </Label>
              <Input
                id="revoked_article"
                placeholder="Ex: art. 13, §1º, inc. VIII"
                value={artigoRevogado}
                onChange={(e) => setArtigoRevogado(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prev_content" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Redação Anterior Revogada (Opcional)
              </Label>
              <Textarea
                id="prev_content"
                rows={2}
                placeholder="Como o texto era redigido antes da exclusão..."
                value={redacaoAnterior}
                onChange={(e) => setRedacaoAnterior(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="link_url_excl" className="text-xs font-semibold">
              Link Oficial / Diário Oficial / LexML (Opcional)
            </Label>
            <Input
              id="link_url_excl"
              placeholder="https://normas.leg.br ou https://www.in.gov.br"
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
              className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
            >
              <ShieldCheck className="h-4 w-4" />
              {salvando ? 'Gravando...' : 'Gravar no Histórico de Exclusões'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
