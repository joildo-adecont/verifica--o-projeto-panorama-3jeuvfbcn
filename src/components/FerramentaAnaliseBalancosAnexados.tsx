/**
 * FLUXO "ANÁLISE DOS BALANÇOS ANEXADOS" — /analises-empresariais
 * ==============================================================
 * O usuário pediu: a partir dos PDFs de Balanço/DRE anexados à FICHA do cliente
 * (coleção cliente_arquivos), analisar a CARDOSO & SIX LTDA (94109) em todos
 * os módulos usando os indicadores do exemplo FMF:
 *   • Análise Individual — Balanço+DRE 2019;
 *   • Análise Tri-Anual  — 2020/2021/2022 e 2023/2024/2025 (evolução ano a ano);
 *   • Análise de Balancete — data-base 31/07/2026 (período encerrado).
 * Cada análise emite um relatório A4 (leiaute oficial ADECONT) e o PDF GRAVADO
 * na aba de arquivos da ficha (cliente_arquivos) como complemento.
 *
 * Extração em DUAS CAMADAS: (1) leitura do texto do PDF no navegador (pdf.js —
 * os PDFs são Type0/Identity-H, ilegíveis no backend: ver leitorBalancetePDF);
 * (2) CONFERÊNCIA editável — nada calcula sobre dado não conferido, e os
 * valores conferidos ficam salvos por cliente+exercício (analises_exercicios_conferidos).
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  FileDown,
  FileText,
  Layers,
  Loader2,
  Save,
  Scale,
  Table2,
  TriangleAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import pb from '@/lib/pocketbase/client'
import type { EmpresaRecord } from '@/types/cadastroEmpresas'
import type { ExercicioFinanceiroCompleto } from '@/types/analisesEmpresariaisModel'
import {
  EXERCICIOS_FLUXO,
  TRI_1,
  TRI_2,
  carregarExerciciosConferidos,
  dataBaseExercicio,
  isPeriodoEncerrado,
  listarArquivosBalanço,
  rodarAnalise,
  salvarExercicioConferido,
  chaveCliente,
  type AnaliseAnexosResultado,
  type ExercicioConferidoRecord,
  type TipoAnaliseAnexos,
} from '@/services/analiseBalancosCliente'
import { gerarPdfTextoRelatorio } from '@/services/geradorPdfAnaliseAnexos'
import { criarExercicioVazio } from '@/services/motorAnaliseEmpresarial'
import {
  lerExercicioDoAnexo,
  type LeituraExercicio,
} from '@/services/leitorBalancoDrePDF'

interface Props {
  empresa: EmpresaRecord | null
}

interface EstadoExercicio {
  exercicio: string
  conferido: boolean
  dados: ExercicioFinanceiroCompleto
  arquivosVinculados: string[]
}

const CAMPOS_ATIVO_AC: Array<{
  chave: keyof ExercicioFinanceiroCompleto['ativoCirculante']
  rotulo: string
}> = [
  { chave: 'caixaEquivalentes', rotulo: 'Caixa e equivalentes' },
  { chave: 'aplicacoesFinanceiras', rotulo: 'Aplicações financeiras' },
  { chave: 'contasReceber', rotulo: 'Contas a receber' },
  { chave: 'estoques', rotulo: 'Estoques' },
  { chave: 'tributosRecuperar', rotulo: 'Tributos a recuperar' },
  { chave: 'outrosAtivosCirculantes', rotulo: 'Outros ativos circulantes' },
]

const CAMPOS_ATIVO_ACNC: Array<{
  chave: keyof ExercicioFinanceiroCompleto['ativoNaoCirculante']
  rotulo: string
}> = [
  { chave: 'realizavelLongoPrazo', rotulo: 'Realizável a longo prazo' },
  { chave: 'investimentos', rotulo: 'Investimentos' },
  { chave: 'imobilizado', rotulo: 'Imobilizado' },
  { chave: 'intangivel', rotulo: 'Intangível' },
]

const CAMPOS_PASSIVO_C: Array<{
  chave: keyof ExercicioFinanceiroCompleto['passivoCirculante']
  rotulo: string
}> = [
  { chave: 'fornecedores', rotulo: 'Fornecedores' },
  { chave: 'emprestimosCP', rotulo: 'Empréstimos CP' },
  { chave: 'obrigacoesTrabalhistas', rotulo: 'Obrigações trabalhistas' },
  { chave: 'obrigacoesTributarias', rotulo: 'Obrigações tributárias' },
  { chave: 'adiantamentosClientes', rotulo: 'Adiantamentos de clientes' },
  { chave: 'outrasObrigacoesCP', rotulo: 'Outras obrigações CP' },
]

const CAMPOS_PASSIVO_NC: Array<{
  chave: keyof ExercicioFinanceiroCompleto['passivoNaoCirculante']
  rotulo: string
}> = [
  { chave: 'outrasObrigacoesLP', rotulo: 'Outras obrigações LP' },
  { chave: 'emprestimosLP', rotulo: 'Empréstimos LP' },
  { chave: 'provisoesCPC25', rotulo: 'Provisões CPC 25' },
  { chave: 'tributosParcelados', rotulo: 'Tributos parcelados' },
]

const CAMPOS_PL: Array<{
  chave: keyof ExercicioFinanceiroCompleto['patrimonioLiquido']
  rotulo: string
}> = [
  { chave: 'capitalSocial', rotulo: 'Capital social' },
  { chave: 'reservasLucros', rotulo: 'Reservas de lucros' },
  { chave: 'ajustesAvaliacaoPatrimonial', rotulo: 'Ajustes avaliação patrimonial' },
  { chave: 'prejuizosAcumulados', rotulo: 'Prejuízos acumulados' },
]

const CAMPOS_DRE: Array<{ chave: keyof ExercicioFinanceiroCompleto['dre']; rotulo: string }> = [
  { chave: 'receitaBruta', rotulo: 'Receita bruta' },
  { chave: 'deducoesImpostos', rotulo: 'Deduções e impostos (neg.)' },
  { chave: 'cmv', rotulo: 'CMV/CPV (neg.)' },
  { chave: 'despesasVendas', rotulo: 'Despesas de vendas (neg.)' },
  { chave: 'despesasAdministrativas', rotulo: 'Despesas administrativas (neg.)' },
  { chave: 'outrasDespesasOperacionais', rotulo: 'Outras desp. operacionais' },
  { chave: 'depreciacaoAmortizacao', rotulo: 'Depreciação/amortização (+)' },
  { chave: 'resultadoFinanceiro', rotulo: 'Resultado financeiro' },
  { chave: 'irCsll', rotulo: 'IR/CSLL (neg.)' },
]

function campoNumerico(valor: unknown, onChange: (v: number) => void): React.ReactNode {
  const num = typeof valor === 'number' && !isNaN(valor) ? valor : 0
  return (
    <Input
      type="number"
      step="any"
      value={String(num)}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-7 text-xs text-right"
      inputMode="decimal"
    />
  )
}

export function FerramentaAnaliseBalancosAnexados({ empresa }: Props) {
  const [carregando, setCarregando] = useState(false)
  const [arquivos, setArquivos] = useState<
    Array<{ id: string; titulo: string; exerciseGuess: string | null }>
  >([])
  const [estado, setEstado] = useState<Record<string, EstadoExercicio>>({})
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoAnaliseAnexos>('individual')
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [resultado, setResultado] = useState<AnaliseAnexosResultado | null>(null)
  const [gravando, setGravando] = useState<string | null>(null)
  const [gravadas, setGravadas] = useState<Record<string, string>>({})
  const [lendo, setLendo] = useState<Record<string, boolean>>({})
  const [avisosLeitura, setAvisosLeitura] = useState<Record<string, string | undefined>>({})
  const refEstado = useRef(estado)
  refEstado.current = estado

  // ── Carrega arquivos + exercícios já conferidos ao trocar de cliente ──
  const recarregar = useCallback(async () => {
    if (!empresa?.codigo) return
    setCarregando(true)
    try {
      const docLimpo = String((empresa as any).documento_limpo || '').replace(/\D/g, '')
      const chave = chaveCliente(docLimpo, empresa.codigo)
      const [lista, conferidos] = await Promise.all([
        listarArquivosBalanço(docLimpo, empresa.codigo),
        carregarExerciciosConferidos(chave),
      ])
      setArquivos(lista)

      const novo: Record<string, EstadoExercicio> = {}
      for (const ex of EXERCICIOS_FLUXO) {
        const rec: ExercicioConferidoRecord | undefined = conferidos[ex.exercicio]
        const arqs = lista.filter((a) => a.exerciseGuess === ex.exercicio).map((a) => a.titulo)
        novo[ex.exercicio] = {
          exercicio: ex.exercicio,
          conferido: !!rec?.conferido,
          dados: rec?.dados || criarExercicioVazio('ano_atual'),
          arquivosVinculados: arqs,
        }
      }
      setEstado(novo)
      setSelecionados([])
      setResultado(null)
      setGravadas({})
      setAvisosLeitura({})
    } catch (err) {
      console.error('[FerramentaAnaliseBalançosAnexados] Erro ao recarregar:', err)
    } finally {
      setCarregando(false)
    }
  }, [empresa?.codigo, (empresa as any)?.documento_limpo])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  // ── Extração da camada 1: leitura automática do texto dos PDFs (pdf.js) ──
  // Baixa cada PDF anexado ao exercício do PocketBase, extrai o texto e faz o
  // parse dos rótulos do Balanço/DRE. Nunca inventa valor: campo não lido
  // fica vazio e sinalizado. A CONFERÊNCIA manual segue sendo a última
  // palavra — nada calcula sobre exercício não marcado como conferido.
  const lerExercicio = useCallback(
    async (exercicio: string) => {
      const arqs = arquivos.filter((a) => a.exerciseGuess === exercicio)
      if (arqs.length === 0) return
      setLendo((prev) => ({ ...prev, [exercicio]: true }))
      setAvisosLeitura((prev) => ({ ...prev, [exercicio]: undefined }))
      try {
        let melhor: LeituraExercicio | null = null
        const avisos: string[] = []
        for (const arq of arqs) {
          try {
            const res = await lerExercicioDoAnexo({
              id: arq.id,
              arquivo: arq.arquivo,
              titulo: arq.titulo,
            })
            if (res.leitura && (!melhor || res.leitura.lidos.length > melhor.lidos.length)) {
              melhor = res.leitura
            }
            if (res.aviso) avisos.push(`${arq.titulo}: ${res.aviso}`)
          } catch (err) {
            console.error('[FerramentaAnaliseBalançosAnexados] Erro ao ler arquivo:', err)
            avisos.push(`${arq.titulo}: falha na leitura — confira manualmente.`)
          }
        }
        if (melhor) {
          setEstado((prev) => ({
            ...prev,
            [exercicio]: { ...prev[exercicio], dados: melhor!.dados },
          }))
        }
        setAvisosLeitura((prev) => ({
          ...prev,
          [exercicio]: avisos.length > 0 ? avisos.join(' | ') : undefined,
        }))
      } finally {
        setLendo((prev) => ({ ...prev, [exercicio]: false }))
      }
    },
    [arquivos],
  )

  // "Re-extrair" agora é o gatilho real da leitura automática (mantém o nome
  // do botão da versão anterior para não quebrar nada).
  const extrairDeArquivos = lerExercicio
  // ── Marca um exercício como conferido e salva no servidor ──
  const marcarConferido = useCallback(
    async (exercicio: string) => {
      const st = refEstado.current[exercicio]
      if (!st || !empresa?.codigo) return
      setCarregando(true)
      try {
        const docLimpo = String((empresa as any).documento_limpo || '').replace(/\D/g, '')
        await salvarExercicioConferido({
          cliente_chave: chaveCliente(docLimpo, empresa.codigo),
          exercicio,
          conferido: true,
          origem_arquivos: st.arquivosVinculados.join('; '),
          data_base: dataBaseExercicio(exercicio),
          dados: st.dados,
        })
        setEstado((prev) => ({ ...prev, [exercicio]: { ...prev[exercicio], conferido: true } }))
      } catch (err) {
        console.error('[FerramentaAnaliseBalançosAnexados] Erro ao salvar:', err)
      } finally {
        setCarregando(false)
      }
    },
    [empresa?.codigo, (empresa as any)?.documento_limpo],
  )

  // ── Roda a análise do tipo selecionado ──
  const rodar = useCallback(() => {
    const map: Record<string, ExercicioConferidoRecord> = {}
    for (const [ex, st] of Object.entries(refEstado.current)) {
      map[ex] = {
        cliente_chave: '',
        exercicio: ex,
        conferido: st.conferido,
        origem_arquivos: st.arquivosVinculados.join('; '),
        dados: st.dados,
      }
    }
    const res = rodarAnalise(tipoSelecionado, selecionados, map)
    setResultado(res)
  }, [tipoSelecionado, selecionados])

  // ── Emite e GRAVA o relatório PDF na ficha do cliente ──
  const emitirEGravar = useCallback(async () => {
    if (!resultado || !empresa?.codigo) return
    setGravando(resultado.tipo + ':' + resultado.exercicios.map((e) => e.exercicio).join('-'))
    try {
      const bytes = gerarPdfTextoRelatorio({
        tipo: resultado.tipo,
        titulo: `Análise — ${resultado.titulo}`,
        empresaNome: empresa.razao_social || '',
        empresaDoc: String((empresa as any).numero_documento || ''),
        clienteCodigo: empresa.codigo,
        dataEmissao: new Date().toLocaleDateString('pt-BR'),
        exercicios: resultado.exercicios,
        classicosPorExercicio: resultado.classicosPorExercicio as any,
        avancadosPorExercicio: resultado.avancadosPorExercicio as any,
      })
      let binario = ''
      for (const b of bytes) binario += String.fromCharCode(b)
      const pdfBase64 = btoa(binario)
      const nomeArquivo = `Analise ${resultado.titulo
        .replace(/[^\w\d -]/g, '')
        .replace(/\s+/g, ' ')
        .trim()} - ${empresa.razao_social.replace(/[^\w\d &]/g, '').trim()}.pdf`

      const resp = await pb.send('/backend/v1/analise-gravar-relatorio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          clienteCodigo: empresa.codigo,
          clienteDoc: String((empresa as any).documento_limpo || ''),
          nomeArquivo,
          titulo: nomeArquivo.replace(/\.pdf$/i, ''),
          observacao: `Relatório da análise (${resultado.tipo}) — exercícios ${resultado.exercicios.map((e) => e.exercicio).join(', ')}`,
          pdfBase64,
        },
      })
      if (resp?.ok) {
        const chave = resultado.tipo + ':' + resultado.exercicios.map((e) => e.exercicio).join('-')
        setGravadas((prev) => ({ ...prev, [chave]: nomeArquivo }))
      }
    } catch (err) {
      console.error('[FerramentaAnaliseBalançosAnexados] Erro ao gravar relatório:', err)
    } finally {
      setGravando(null)
    }
  }, [resultado, empresa?.codigo, empresa?.razao_social, (empresa as any)?.numero_documento])

  // ─────────────────────────── Render ───────────────────────────
  if (!empresa) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Selecione um cliente para analisar os Balanços/DREs anexados à ficha.
        </CardContent>
      </Card>
    )
  }

  const exerciciosTipo =
    tipoSelecionado === 'individual'
      ? EXERCICIOS_FLUXO.map((e) => e.exercicio)
      : tipoSelecionado === 'tri_anual'
        ? [...TRI_1, ...TRI_2]
        : ['2026']

  const jaGravada = resultado
    ? gravadas[resultado.tipo + ':' + resultado.exercicios.map((e) => e.exercicio).join('-')]
    : undefined

  return (
    <div className="space-y-4">
      {/* ── 1. Exercícios anexados + conferência editável ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Scale className="h-4 w-4" />
            1. Exercícios anexados — conferência editável
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Os PDFs de Balanço/DRE anexados na aba de arquivos da ficha são listados por exercício.
            Conferido cada valor, marque o exercício como CONFERIDO — nada calcula sobre dado não
            conferido.
          </p>
          <div className="rounded-lg border bg-slate-50 p-3">
            <p className="text-xs font-semibold">
              {empresa.razao_social} — código {empresa.codigo}
              {(empresa as any).numero_documento
                ? ` — doc ${(empresa as any).numero_documento}`
                : ' — vínculo pelo código (sem CNPJ)'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {arquivos.length} arquivos de balanço/DRE anexados
            </p>
          </div>
          <div className="space-y-2">
            {EXERCICIOS_FLUXO.map((ex) => {
              const st = estado[ex.exercicio]
              if (!st) return null
              const encerrado = isPeriodoEncerrado(ex.exercicio)
              return (
                <div key={ex.exercicio} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={encerrado ? 'outline' : 'secondary'}>{ex.rotulo}</Badge>
                      <span className="text-xs text-muted-foreground">
                        data-base {dataBaseExercicio(ex.exercicio)}
                        {encerrado ? ' (período encerrado)' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={st.conferido ? 'default' : 'outline'}>
                        {st.conferido ? 'Conferido' : 'Não conferido'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={carregando || !!lendo[ex.exercicio] || st.arquivosVinculados.length === 0}
                        onClick={() => extrairDeArquivos(ex.exercicio)}
                        title="Ler automaticamente os valores dos PDFs anexados (pdf.js)"
                      >
                        {lendo[ex.exercicio] ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <FileDown className="h-3.5 w-3.5" />
                        )}
                        Ler PDFs
                      </Button>
                      <Button
                        size="sm"
                        variant={st.conferido ? 'ghost' : 'default'}
                        disabled={carregando}
                        onClick={() => marcarConferido(ex.exercicio)}
                      >
                        {carregando ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        Conferido
                      </Button>
                    </div>
                  </div>
                  {st.arquivosVinculados.length > 0 && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {st.arquivosVinculados.join(' · ')}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Grid de conferência editável do exercício aberto ── */}
      {selecionados[0] && estado[selecionados[0]] && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">2. Conferência de valores — {selecionados[0]}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {[
              { titulo: 'Ativo Circulante', campos: CAMPOS_ATIVO_AC, grupo: 'ativoCirculante' },
              {
                titulo: 'Ativo Não Circulante',
                campos: CAMPOS_ATIVO_ACNC,
                grupo: 'ativoNaoCirculante',
              },
              {
                titulo: 'Passivo Circulante',
                campos: CAMPOS_PASSIVO_C,
                grupo: 'passivoCirculante',
              },
              {
                titulo: 'Passivo Não Circulante',
                campos: CAMPOS_PASSIVO_NC,
                grupo: 'passivoNaoCirculante',
              },
              { titulo: 'Patrimônio Líquido', campos: CAMPOS_PL, grupo: 'patrimonioLiquido' },
              { titulo: 'DRE', campos: CAMPOS_DRE, grupo: 'dre' },
            ].map((b) => (
              <div key={b.titulo} className="rounded-lg border p-3">
                <p className="mb-2 text-xs font-bold">{b.titulo}</p>
                <div className="space-y-1.5">
                  {b.campos.map((c) => (
                    <div key={c.chave} className="flex items-center justify-between gap-2">
                      <Label className="text-[11px] text-muted-foreground">{c.rotulo}</Label>
                      {campoNumerico(
                        (estado[selecionados[0]].dados as any)[b.grupo]?.[c.chave],
                        (v: number) =>
                          setEstado((prev) => ({
                            ...prev,
                            [selecionados[0]]: {
                              ...prev[selecionados[0]],
                              dados: {
                                ...prev[selecionados[0]].dados,
                                [b.grupo]: {
                                  ...(prev[selecionados[0]].dados as any)[b.grupo],
                                  [c.chave]: v,
                                },
                              },
                            },
                          })),
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── 3. Escolha do tipo de análise ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Layers className="h-4 w-4" />
            3. Tipo de análise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'individual', rotulo: 'Individual (1 exercício — 2019)', icone: FileText },
                { id: 'tri_anual', rotulo: 'Tri-Anual (3 exercícios — evolução)', icone: Layers },
                {
                  id: 'balancete',
                  rotulo: 'Balancete 31/07/2026 (encerrado)',
                  icone: CalendarClock,
                },
              ] as Array<{ id: TipoAnaliseAnexos; rotulo: string; icone: any }>
            ).map((op) => {
              const Icone = op.icone
              return (
                <Button
                  key={op.id}
                  size="sm"
                  variant={tipoSelecionado === op.id ? 'default' : 'outline'}
                  onClick={() => {
                    setTipoSelecionado(op.id)
                    setResultado(null)
                    setSelecionados([])
                  }}
                >
                  <Icone className="h-3.5 w-3.5" /> {op.rotulo}
                </Button>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            {exerciciosTipo.map((ex) => {
              const st = estado[ex]
              const ativo = selecionados.includes(ex)
              return (
                <Button
                  key={ex}
                  size="sm"
                  variant={ativo ? 'default' : 'outline'}
                  disabled={!st?.conferido}
                  title={st?.conferido ? '' : 'Confirme o exercício antes'}
                  onClick={() =>
                    setSelecionados((prev) => {
                      if (tipoSelecionado === 'individual') return ativo ? [] : [ex]
                      if (prev.includes(ex)) return prev.filter((x) => x !== ex)
                      return tipoSelecionado === 'tri_anual' ? [...prev, ex].slice(-3) : [ex]
                    })
                  }
                >
                  {ex}
                  {isPeriodoEncerrado(ex) ? ' (encerrado)' : ''}
                </Button>
              )
            })}
          </div>
          <Button size="sm" onClick={rodar} disabled={selecionados.length === 0 || carregando}>
            <Activity className="h-3.5 w-3.5" /> Rodar análise
          </Button>
        </CardContent>
      </Card>

      {/* ── 4. Resultado + emissão/gravada ── */}
      {resultado && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2">
                <Table2 className="h-4 w-4" />
                {resultado.titulo}
              </span>
              <div className="flex items-center gap-2">
                {jaGravada && <Badge variant="secondary">Gravada na ficha</Badge>}
                <Button size="sm" onClick={emitirEGravar} disabled={!!gravando}>
                  {gravando ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  Emitir e gravar na ficha
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* evolução dos modelos de insolvência (multi-exercício) */}
            {resultado.exercicios.length > 1 && (
              <div className="rounded-lg border p-3">
                <p className="mb-2 text-xs font-bold">
                  Evolução dos modelos de insolvência (ano a ano)
                </p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-1">Exercício</th>
                      <th className="py-1">Kanitz</th>
                      <th className="py-1">Altman Z1</th>
                      <th className="py-1">Elizabetsky</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.exercicios.map((e) => {
                      const adv = resultado.avancadosPorExercicio[e.exercicio]
                      return (
                        <tr key={e.exercicio} className="border-b last:border-0">
                          <td className="py-1">
                            {e.exercicio}
                            {e.periodoEncerrado ? ' (encerrado)' : ''}
                          </td>
                          <td className="py-1">
                            {(adv?.kanitz?.fatorInsolvencia ?? 0).toFixed(4)}
                          </td>
                          <td className="py-1">{(adv?.altmanZ1?.zScore ?? 0).toFixed(4)}</td>
                          <td className="py-1">{(adv?.elizabetsky?.fator ?? 0).toFixed(4)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {/* índices clássicos por exercício */}
            {resultado.exercicios.map((e) => {
              const inds = resultado.classicosPorExercicio[e.exercicio] || []
              const adv = resultado.avancadosPorExercicio[e.exercicio]
              return (
                <div key={e.exercicio} className="rounded-lg border p-3">
                  <p className="mb-2 text-xs font-bold">
                    {e.rotulo} — data-base {e.dataBase}
                    {e.periodoEncerrado ? ' (período encerrado)' : ''}
                  </p>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground">
                        Índices clássicos
                      </p>
                      <ul className="mt-1 space-y-0.5">
                        {inds.map((i: any) => (
                          <li
                            key={i.id}
                            className="flex items-center justify-between gap-2 text-xs"
                          >
                            <span>{i.nome}</span>
                            <span className="flex items-center gap-1">
                              {i.valor.toFixed(2)}
                              <Badge
                                variant="outline"
                                className={
                                  i.semaforo === 'saudavel'
                                    ? 'text-emerald-700'
                                    : i.semaforo === 'atencao'
                                      ? 'text-amber-700'
                                      : 'text-red-700'
                                }
                              >
                                {i.semaforo}
                              </Badge>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground">
                        Modelos avançados (FMF)
                      </p>
                      <ul className="mt-1 space-y-0.5 text-xs">
                        {adv?.kanitz && (
                          <li className="flex justify-between gap-2">
                            <span>Kanitz</span>
                            <span>
                              {adv.kanitz.fatorInsolvencia.toFixed(4)} —{' '}
                              {adv.kanitz.faixaTexto || adv.kanitz.faixa}
                            </span>
                          </li>
                        )}
                        {adv?.altmanZ1 && (
                          <li className="flex justify-between gap-2">
                            <span>Altman Z1</span>
                            <span>
                              {adv.altmanZ1.zScore.toFixed(4)} —{' '}
                              {adv.altmanZ1.faixaTexto || adv.altmanZ1.faixa}
                            </span>
                          </li>
                        )}
                        {adv?.elizabetsky && (
                          <li className="flex justify-between gap-2">
                            <span>Elizabetsky</span>
                            <span>{adv.elizabetsky.fator.toFixed(4)}</span>
                          </li>
                        )}
                        {adv?.duPont && (
                          <li className="flex justify-between gap-2">
                            <span>Du Pont (ROA / ROE)</span>
                            <span>
                              {(adv.duPont.retornoAtivo * 100).toFixed(2)}% /{' '}
                              {(adv.duPont.retornoPatrimonioLiquido || 0).toFixed(2)}%
                            </span>
                          </li>
                        )}
                        {adv?.dinamica && (
                          <>
                            <li className="flex justify-between gap-2">
                              <span>CDG / NCG</span>
                              <span>
                                {adv.dinamica.cdg.toFixed(2)} / {adv.dinamica.ncg.toFixed(2)}
                              </span>
                            </li>
                            <li className="flex justify-between gap-2">
                              <span>Efeito Tesoura</span>
                              <span>{adv.dinamica.efeitoTesoura ? 'SIM' : 'NÃO'}</span>
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )
            })}
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <TriangleAlert className="h-3.5 w-3.5" />
              O relatório gravado na ficha leva o título da análise — procure por "Analise ..." na
              aba de arquivos.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
