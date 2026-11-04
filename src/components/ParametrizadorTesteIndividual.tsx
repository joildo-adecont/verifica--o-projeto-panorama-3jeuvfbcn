import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  Loader2,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react'
import { classificarNCM } from '@/data/motorClassificacao'
import { REF_TOTAL, pct } from '@/data/aliquotas'

/**
 * TESTE POR DOCUMENTO INDIVIDUAL — classificação efetiva, item a item
 * ====================================================================
 * Pedido do CEO (03/11/2026): "trocar a alíquota plena pela efetiva por NCM e o
 * analisador passa a mostrar o valor próximo do real; faça o teste pelo
 * documento importado individual."
 *
 * ── POR QUE ESTE TESTE VALE MAIS QUE O TESTE EM LOTE ──
 * No lote, um erro de classificação se dilui: 20 itens, um errado, o total muda
 * pouco e ninguém vê. No documento individual, cada item fica exposto com o seu
 * NCM, o tratamento que o motor achou, o nível do casamento (exato ou posição) e
 * o valor. É aqui que se vê se o motor está pensando certo.
 *
 * ── O QUE ESTA TELA NÃO ESCONDE ──
 * 1. O nível do casamento: regra da posição (4 dígitos) não é regra do NCM, e
 *    aparece marcada para conferência.
 * 2. O regime: suspensão, crédito presumido e depreciação NÃO alteram a
 *    alíquota. Ficam visíveis como informação, nunca somados à conta.
 * 3. O Imposto Seletivo: incide POR FORA. Quando aparece, a tela avisa que a
 *    carga real é maior que a projetada — não menor.
 * 4. O item sem regra: recebe fator 1 e a tela diz "integral", não "calculado".
 */

const BACKEND =
  import.meta.env.VITE_POCKETBASE_URL?.replace(/\/$/, '') ||
  'https://verificacao-projeto-panorama-18549.shrd02.internal.goskip.dev'

const TOKEN_KEY = 'adecont_painel_token'

const brl = (v: number | null | undefined) =>
  v === null || v === undefined || !isFinite(Number(v))
    ? '—'
    : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface Doc {
  id: string
  modelo: string
  numero: string
  emitente: string
  valor_total: number
  qtd_itens: number
}

interface ItemDoc {
  numero_item: number
  descricao: string
  ncm: string
  cfop: string
  direcao: string
  valor: number
  cclasstrib: string
}

export function ParametrizadorTesteIndividual() {
  const [token, setToken] = useState('')
  const [docs, setDocs] = useState<Doc[]>([])
  const [docSel, setDocSel] = useState('')
  const [dados, setDados] = useState<any>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    try {
      setToken(window.localStorage.getItem(TOKEN_KEY) || '')
    } catch {
      setToken('')
    }
  }, [])

  const carregar = useCallback(async () => {
    if (!token) return
    setCarregando(true)
    setErro(null)
    try {
      const r = await fetch(`${BACKEND}/backend/v1/param-documentos`, {
        headers: { 'X-Painel-Token': token },
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || `Falha (${r.status})`)
      setDocs(j.documentos || [])
      if (!docSel && j.documentos?.length) setDocSel(j.documentos[0].id)
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [token, docSel])

  useEffect(() => {
    if (token) carregar()
  }, [token])

  const abrir = async (id: string) => {
    if (!id || !token) return
    setCarregando(true)
    setErro(null)
    try {
      const r = await fetch(`${BACKEND}/backend/v1/param-documento-itens?id=${id}`, {
        headers: { 'X-Painel-Token': token },
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || `Falha (${r.status})`)
      setDados(j)
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }

  /**
   * A CONTA, ITEM A ITEM.
   * Aplico REF_TOTAL (30,00%, regime pleno) a cada item pelo seu fator, para o
   * contraste ficar visível: pleno × efetivo. Não é a alíquota de um ano
   * específico — é a referência de regime pleno, e a tela diz isso.
   */
  const calculo = useMemo(() => {
    if (!dados?.itens) return null
    let somaPlena = 0
    let somaEfetiva = 0
    let classificados = 0
    let comIS = 0
    let valorIS = 0
    const linhas = dados.itens.map((it: ItemDoc) => {
      const cls = classificarNCM(it.ncm)
      const v = Number(it.valor) || 0
      const plena = (v * REF_TOTAL) / 100
      const efetiva = (v * REF_TOTAL * cls.fator) / 100
      somaPlena += plena
      somaEfetiva += efetiva
      if (cls.encontrado) classificados++
      if (cls.seletivos.length > 0) {
        comIS++
        valorIS += v
      }
      return { it, cls, plena, efetiva, economia: plena - efetiva }
    })
    return {
      linhas,
      somaPlena,
      somaEfetiva,
      economia: somaPlena - somaEfetiva,
      classificados,
      total: dados.itens.length,
      comIS,
      valorIS,
      percentualClassificado:
        dados.itens.length > 0 ? Math.round((classificados / dados.itens.length) * 1000) / 10 : 0,
    }
  }, [dados])

  return (
    <div className="space-y-3">
      {!token && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-[10.5px] text-amber-900">
          Informe o token do painel na aba <b>Importar e quebrar</b>.
        </p>
      )}
      {erro && (
        <p className="flex items-start gap-1.5 rounded-lg border border-rose-300 bg-rose-50 p-2 text-[10.5px] text-rose-900">
          <XCircle className="mt-0.5 w-3.5 h-3.5 shrink-0" />
          {erro}
        </p>
      )}

      <div className="rounded-xl border-2 border-slate-200 bg-white p-3">
        <p className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
          <FileSearch className="w-3.5 h-3.5" />
          Teste por documento individual
        </p>
        <p className="mt-0.5 text-[10px] leading-snug text-slate-500">
          Cada item exposto com o NCM, o tratamento que a lei dá a ele e a alíquota efetiva. É aqui
          que se vê se a classificação está certa — no lote, um item errado se dilui.
        </p>

        <div className="mt-2 flex flex-wrap items-end gap-2">
          <label className="flex-1 min-w-[240px]">
            <span className="text-[10px] font-bold text-slate-600">Documento</span>
            <select
              value={docSel}
              onChange={(e) => {
                setDocSel(e.target.value)
                setDados(null)
              }}
              className="mt-0.5 w-full rounded-lg border-2 border-slate-300 px-2 py-1.5 text-[11px] bg-white focus:outline-none focus:border-panorama-gold"
            >
              {docs.length === 0 && <option value="">Nenhum documento importado</option>}
              {docs.map((d) => (
                <option key={d.id} value={d.id}>
                  mod. {d.modelo} nº {d.numero} — {d.emitente} — {brl(d.valor_total)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => abrir(docSel)}
            disabled={!docSel || carregando}
            className="inline-flex items-center gap-1.5 rounded-lg bg-panorama-navy px-3 py-2 text-[11px] font-bold text-panorama-gold-light hover:bg-slate-900 disabled:opacity-40 cursor-pointer"
          >
            {carregando ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            Classificar documento
          </button>
          <button
            type="button"
            onClick={carregar}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-slate-300 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar
          </button>
        </div>
      </div>

      {dados && calculo && (
        <>
          {/* cabeçalho do documento */}
          <div className="rounded-xl border-2 border-panorama-navy/30 bg-slate-50 p-3">
            <p className="text-[11px] font-bold text-slate-900">
              {dados.documento?.emitente}{' '}
              <span className="font-normal text-slate-500">
                · mod. {dados.documento?.modelo} nº {dados.documento?.numero}
                {dados.documento?.uf ? ` · ${dados.documento.uf}` : ''}
              </span>
            </p>
            <p className="mt-0.5 text-[9.5px] text-slate-600">
              Chave {String(dados.documento?.chave || '').slice(0, 20)}… · direção{' '}
              <b>{dados.documento?.direcao || 'não classificada'}</b>
              {dados.documento?.cfop_predominante
                ? ` · CFOP ${dados.documento.cfop_predominante}`
                : ''}{' '}
              · {dados.documento?.qtd_itens} item(ns) · {brl(dados.documento?.valor_total)}
              {dados.confere_total === false && (
                <span className="ml-1 font-bold text-rose-700">
                  · ATENÇÃO: soma dos itens não fecha com o total
                </span>
              )}
            </p>
          </div>

          {/* KPIs do contraste pleno × efetivo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-xl border-2 border-slate-200 bg-white p-2.5">
              <p className="text-[9px] font-bold uppercase text-slate-500">Alíquota plena</p>
              <p className="text-[16px] font-bold tabular-nums text-slate-900">
                {brl(calculo.somaPlena)}
              </p>
              <p className="text-[9px] text-slate-500">{pct(REF_TOTAL)} sobre tudo</p>
            </div>
            <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-2.5">
              <p className="text-[9px] font-bold uppercase text-emerald-800">Alíquota efetiva</p>
              <p className="text-[16px] font-bold tabular-nums text-emerald-900">
                {brl(calculo.somaEfetiva)}
              </p>
              <p className="text-[9px] text-emerald-700">pelo NCM de cada item</p>
            </div>
            <div className="rounded-xl border-2 border-slate-200 bg-white p-2.5">
              <p className="text-[9px] font-bold uppercase text-slate-500">Diferença</p>
              <p className="text-[16px] font-bold tabular-nums text-slate-900">
                {brl(calculo.economia)}
              </p>
              <p className="text-[9px] text-slate-500">
                {calculo.somaPlena > 0
                  ? `${Math.round((calculo.economia / calculo.somaPlena) * 1000) / 10}% a menos`
                  : '—'}
              </p>
            </div>
            <div className="rounded-xl border-2 border-slate-200 bg-white p-2.5">
              <p className="text-[9px] font-bold uppercase text-slate-500">Classificados</p>
              <p className="text-[16px] font-bold tabular-nums text-slate-900">
                {calculo.classificados}
                <span className="text-[10px] font-normal text-slate-500"> / {calculo.total}</span>
              </p>
              <p className="text-[9px] text-slate-500">
                {calculo.percentualClassificado}% dos itens
              </p>
            </div>
          </div>

          {calculo.comIS > 0 && (
            <div className="rounded-lg border border-amber-400 bg-amber-50 p-2.5 text-[10px] leading-snug text-amber-900">
              <p className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {calculo.comIS} item(ns) com Imposto Seletivo ({brl(calculo.valorIS)})
              </p>
              <p className="mt-0.5">
                O IS <b>não</b> está somado nos valores acima: ele incide por fora do IBS/CBS, com
                alíquota própria definida em lei. A carga real destes itens é <b>maior</b> que a
                projetada aqui — este cálculo mostra só a parte do IBS e da CBS.
              </p>
            </div>
          )}

          {/* tabela item a item */}
          <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
            <p className="px-3 py-2 text-[11px] font-bold text-slate-900 border-b-2 border-panorama-gold/40 bg-slate-50">
              Item a item — o que a lei dá a cada NCM
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] min-w-[900px]">
                <thead>
                  <tr className="bg-panorama-navy text-white">
                    <th className="text-left px-2 py-1.5 font-bold">#</th>
                    <th className="text-left px-2 py-1.5 font-bold">Descrição</th>
                    <th className="text-left px-2 py-1.5 font-bold">NCM</th>
                    <th className="text-left px-2 py-1.5 font-bold">Tratamento</th>
                    <th className="text-left px-2 py-1.5 font-bold">Origem</th>
                    <th className="text-right px-2 py-1.5 font-bold">Valor</th>
                    <th className="text-right px-2 py-1.5 font-bold">Plena</th>
                    <th className="text-right px-2 py-1.5 font-bold">Efetiva</th>
                  </tr>
                </thead>
                <tbody>
                  {calculo.linhas.map((l: any, i: number) => (
                    <tr key={i} className={i % 2 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="px-2 py-1.5 border-b border-slate-100 text-slate-500">
                        {l.it.numero_item}
                      </td>
                      <td className="px-2 py-1.5 border-b border-slate-100 text-slate-800 max-w-[200px] truncate">
                        {l.it.descricao}
                      </td>
                      <td className="px-2 py-1.5 border-b border-slate-100 font-mono text-[9.5px]">
                        {l.it.ncm || <span className="text-rose-600 font-bold">—</span>}
                      </td>
                      <td className="px-2 py-1.5 border-b border-slate-100">
                        {l.cls.encontrado ? (
                          <>
                            <span className="font-bold text-slate-900">
                              {l.cls.regra?.tratamento}
                            </span>
                            {l.cls.conferir && (
                              <span className="ml-1 rounded bg-amber-200 px-1 text-[8px] font-bold text-amber-900">
                                posição · conferir
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-500">
                            integral
                            {l.cls.regimes.length > 0 && (
                              <span className="ml-1 text-[8.5px] text-slate-400">
                                (+ {l.cls.regimes.map((r: any) => r.tratamento).join(', ')})
                              </span>
                            )}
                          </span>
                        )}
                        {l.cls.seletivos.length > 0 && (
                          <span className="ml-1 rounded bg-amber-500 px-1 text-[8px] font-bold text-white">
                            + IS
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 border-b border-slate-100 text-[9px] text-slate-500">
                        {l.cls.regra?.anexo || '—'}
                      </td>
                      <td className="px-2 py-1.5 border-b border-slate-100 text-right tabular-nums">
                        {brl(l.it.valor)}
                      </td>
                      <td className="px-2 py-1.5 border-b border-slate-100 text-right tabular-nums text-slate-500">
                        {brl(l.plena)}
                      </td>
                      <td
                        className={`px-2 py-1.5 border-b border-slate-100 text-right tabular-nums font-bold ${
                          l.economia > 0.005 ? 'text-emerald-800' : 'text-slate-900'
                        }`}
                      >
                        {brl(l.efetiva)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan={5} className="px-2 py-1.5 text-slate-900">
                      Total
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{brl(dados.soma_itens)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-slate-600">
                      {brl(calculo.somaPlena)}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-emerald-900">
                      {brl(calculo.somaEfetiva)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* o que os números querem dizer */}
          <div className="rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-[9.5px] leading-snug text-slate-700">
            <p className="font-bold flex items-center gap-1 text-slate-900">
              <CheckCircle2 className="w-3 h-3" />
              Como ler esta tabela
            </p>
            <p className="mt-0.5">
              A coluna <b>plena</b> é quanto seria com {pct(REF_TOTAL)} sobre todo item. A{' '}
              <b>efetiva</b> é quanto é, aplicando o fator que a lei dá a cada NCM. A diferença
              entre as duas é o efeito real da classificação — e ela vem quase toda de três
              tratamentos: alíquota zero (cesta básica), redução de 60% (saúde, educação) e redução
              de 30% (profissões regulamentadas). Item marcado <b>posição · conferir</b> casou pela
              posição de 4 dígitos, não pelo NCM exato: a regra vale, mas merece conferência. Item
              marcado <b>integral</b> não tem regra de alíquota nos Anexos — paga 100%, que é a
              presunção legal, não um erro de leitura.
            </p>
          </div>
        </>
      )}

      {dados && !calculo && (
        <p className="rounded-xl border-2 border-slate-200 bg-slate-50 p-5 text-center text-[11px] text-slate-600">
          Documento sem itens individualizados. Reimporte o XML para que a quebra seja gravada.
        </p>
      )}
    </div>
  )
}
