import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BadgeAlert,
  Building2,
  CircleDollarSign,
  FileCheck2,
  KeyRound,
  Mail,
  RefreshCw,
  Send,
  Users,
  Wallet,
} from 'lucide-react'
import { pct } from '@/data/aliquotas'

/**
 * CUSTO DO ERRO POR CLIENTE — painel que cruza cadastro e envios reais
 *
 * ── DE ONDE VÊM OS NÚMEROS ──
 * Nada é digitado aqui. O endpoint /backend/v1/painel-cliente lê a coleção
 * `simul_clientes` (regime declarado, receita mensal) e `simul_envios` (o que foi
 * simulado e enviado a cada cliente) e devolve o cruzamento pronto.
 *
 * ── A DECISÃO MAIS IMPORTANTE DESTE PAINEL ──
 * Cliente sem regime ou sem receita NÃO entra no cálculo. Ele aparece numa lista
 * separada, com o motivo, e com um botão para completar o cadastro. A tentação era
 * estimar a receita pelo que foi simulado — mas simulação é um produto, não o
 * faturamento da empresa do cliente. Inventar isso produziria um diagnóstico
 * falso sobre o negócio de outra pessoa, apresentado como se fosse cálculo.
 *
 * ── SOBRE O "POTENCIAL" ──
 * É a diferença entre a alíquota do regime declarado e a regra geral (30,00%),
 * aplicada sobre a receita informada. Não é economia garantida: é o tamanho do
 * benefício que o regime já concede. Chamar de "economia" seria prometer o que a
 * lei não promete.
 */

interface LinhaCliente {
  id: string
  nome: string
  empresa: string
  email: string
  regime: string
  regimeNome: string
  atividade: string
  uf: string
  receitaMensal: number
  situacao: 'ok' | 'sem_regime' | 'sem_receita' | 'regime_por_faixa'
  motivo: string
  aliqAdotada: number | null
  aliqRegular: number
  tribAdotado: number | null
  tribRegular: number | null
  potencialMensal: number | null
  potencialAnual: number | null
  envios: number
  recebidos: number
  falhas: number
  valorSimulado: number
  ultimoEnvio: string
  itens: string[]
}

interface Resposta {
  referencia: { ibs: number; cbs: number; total: number }
  resumo: {
    clientes: number
    comDados: number
    semDados: number
    envios: number
    potencialMensalTotal: number
    potencialAnualTotal: number
  }
  clientes: LinhaCliente[]
}

const TOKEN_KEY = 'adecont_painel_token'
const BACKEND = 'https://verificacao-projeto-panorama-18549.shrd00.internal.goskip.dev'

function brl(v: number | null): string {
  if (v === null || !Number.isFinite(v)) return '—'
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}

export function PainelCliente() {
  const [dados, setDados] = useState<Resposta | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [token, setToken] = useState('')
  const [pedindotoken, setPedindotoken] = useState(false)

  useEffect(() => {
    try {
      const t = window.localStorage.getItem(TOKEN_KEY) || ''
      setToken(t)
    } catch (_) {
      setToken('')
    }
  }, [])

  const carregar = useCallback(async (tok: string) => {
    if (!tok) {
      setPedindotoken(true)
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      const r = await fetch(`${BACKEND}/backend/v1/painel-cliente`, {
        headers: { 'X-Painel-Token': tok },
      })
      if (r.status === 401) {
        setErro('Token recusado pelo servidor. Confira o token do painel.')
        setPedindotoken(true)
        return
      }
      if (!r.ok) {
        setErro(`O servidor respondeu ${r.status}. Tente novamente em instantes.`)
        return
      }
      const json = (await r.json()) as Resposta
      setDados(json)
      setPedindotoken(false)
    } catch (e) {
      setErro('Não foi possível falar com o servidor. O backend pode estar reiniciando.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    if (token) carregar(token)
  }, [token, carregar])

  const comDados = useMemo(
    () => (dados?.clientes ?? []).filter((c) => c.situacao === 'ok'),
    [dados],
  )
  const semDados = useMemo(
    () => (dados?.clientes ?? []).filter((c) => c.situacao !== 'ok'),
    [dados],
  )

  const salvarToken = (t: string) => {
    setToken(t)
    try {
      window.localStorage.setItem(TOKEN_KEY, t)
    } catch (_) {}
    carregar(t)
  }

  return (
    <div className="space-y-4">
      {/* ── cabeçalho de contexto ── */}
      <div className="rounded-xl border-2 border-slate-200 bg-white p-3.5">
        <div className="flex items-start gap-2.5">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-panorama-navy text-panorama-gold-light ring-1 ring-panorama-gold/50 shrink-0">
            <Users className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold text-slate-900">
              Diagnóstico por cliente — cruzamento do cadastro com os envios
            </p>
            <p className="text-[10px] text-slate-500 leading-snug mt-0.5">
              Lê o regime e a receita declarados em <b>simul_clientes</b> e o que foi simulado em{' '}
              <b>simul_envios</b>. Cliente sem dado declarado não entra no cálculo — aparece na
              lista de pendências com o motivo.
            </p>
          </div>
          <button
            onClick={() => carregar(token)}
            disabled={carregando}
            className="inline-flex items-center gap-1.5 rounded-lg bg-panorama-navy text-panorama-gold-light px-2.5 py-1.5 text-[10px] font-bold hover:bg-panorama-navy/90 shrink-0 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${carregando ? 'animate-spin' : ''}`} />
            {carregando ? 'Carregando' : 'Atualizar'}
          </button>
        </div>
      </div>

      {/* ── pedido de token ── */}
      {pedindotoken && (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-3.5">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 mb-1.5">
            <KeyRound className="w-3.5 h-3.5" />
            Token do painel necessário
          </p>
          <p className="text-[10px] text-amber-900 leading-snug mb-2">
            Este painel lê dados de clientes, por isso exige o token do painel — o mesmo usado em
            Cadastro &amp; Envios. Ele fica guardado só neste navegador.
          </p>
          <div className="flex gap-1.5">
            <input
              type="password"
              placeholder="cole o token aqui"
              defaultValue={token}
              onKeyDown={(e) => {
                if (e.key === 'Enter') salvarToken((e.target as HTMLInputElement).value.trim())
              }}
              id="input-token-painel"
              className="flex-1 rounded-lg border-2 border-amber-300 px-2 py-1.5 text-[11px] font-mono bg-white focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={() => {
                const el = document.getElementById('input-token-painel') as HTMLInputElement | null
                if (el) salvarToken(el.value.trim())
              }}
              className="rounded-lg bg-amber-600 text-white px-3 py-1.5 text-[11px] font-bold hover:bg-amber-700 cursor-pointer shrink-0"
            >
              Usar
            </button>
          </div>
          <p className="text-[9px] text-amber-700 mt-1.5 leading-snug">
            Para obter o token: painel Cadastro &amp; Envios → botão 🔑 Token. Se você não o tem em
            mãos, peça ao administrador do sistema.
          </p>
        </div>
      )}

      {/* ── erro ── */}
      {erro && (
        <div className="rounded-xl border-2 border-rose-300 bg-rose-50 p-3 flex items-start gap-2">
          <BadgeAlert className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
          <p className="text-[11px] text-rose-900 leading-snug">{erro}</p>
        </div>
      )}

      {/* ── resultado ── */}
      {dados && (
        <>
          {/* resumo */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {[
              {
                Icon: Users,
                rot: 'Clientes',
                val: String(dados.resumo.clientes),
                det: `${dados.resumo.comDados} com dados · ${dados.resumo.semDados} pendentes`,
                tom: 'border-slate-300 bg-gradient-to-br from-slate-50 to-white',
              },
              {
                Icon: Send,
                rot: 'Envios',
                val: String(dados.resumo.envios),
                det: 'simulações registradas',
                tom: 'border-blue-300 bg-gradient-to-br from-blue-50 to-white',
              },
              {
                Icon: Wallet,
                rot: 'Benefício já concedido',
                val: brl(dados.resumo.potencialMensalTotal),
                det: 'por mês, somando os clientes medidos',
                tom: 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-white',
              },
              {
                Icon: CircleDollarSign,
                rot: 'Em 12 meses',
                val: brl(dados.resumo.potencialAnualTotal),
                det: 'projeção sem correção monetária',
                tom: 'border-amber-300 bg-gradient-to-br from-amber-50 to-white',
              },
            ].map((k) => (
              <div key={k.rot} className={`rounded-xl border-2 p-3 ${k.tom}`}>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <k.Icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wide">{k.rot}</span>
                </div>
                <p className="text-lg font-extrabold text-slate-900 mt-1 leading-none tabular-nums">
                  {k.val}
                </p>
                <p className="text-[9px] text-slate-500 mt-1 leading-tight">{k.det}</p>
              </div>
            ))}
          </div>

          {/* clientes medidos */}
          {comDados.length > 0 ? (
            <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
              <div className="px-3 py-2 border-b-2 border-panorama-gold/40 bg-slate-50">
                <p className="text-[11px] font-bold text-slate-900">
                  Clientes com dados completos
                  <span className="ml-1.5 text-[10px] font-normal text-slate-500">
                    ({comDados.length})
                  </span>
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[10.5px] min-w-[640px]">
                  <thead>
                    <tr className="bg-panorama-navy text-white">
                      <th className="text-left px-2.5 py-1.5 font-bold">Cliente</th>
                      <th className="text-left px-2 py-1.5 font-bold">Regime</th>
                      <th className="text-right px-2 py-1.5 font-bold">Receita/mês</th>
                      <th className="text-right px-2 py-1.5 font-bold">Alíq.</th>
                      <th className="text-right px-2 py-1.5 font-bold">Tributo/mês</th>
                      <th className="text-right px-2 py-1.5 font-bold">Benefício/mês</th>
                      <th className="text-center px-2 py-1.5 font-bold">Envios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comDados.map((c, i) => (
                      <tr key={c.id} className={i % 2 ? 'bg-slate-50' : 'bg-white'}>
                        <td className="px-2.5 py-1.5 border-b border-slate-100">
                          <p className="font-bold text-slate-900 leading-tight truncate max-w-[180px]">
                            {c.empresa || c.nome}
                          </p>
                          <p className="text-[9px] text-slate-500 leading-tight truncate max-w-[180px]">
                            {c.nome}
                            {c.uf ? ` · ${c.uf}` : ''}
                          </p>
                        </td>
                        <td className="px-2 py-1.5 border-b border-slate-100">
                          <span className="inline-block rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-700">
                            {c.regimeNome}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-slate-700 border-b border-slate-100">
                          {brl(c.receitaMensal)}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums font-bold text-slate-900 border-b border-slate-100">
                          {c.aliqAdotada === null ? '—' : pct(c.aliqAdotada)}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-slate-700 border-b border-slate-100">
                          {brl(c.tribAdotado)}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums font-bold text-emerald-800 border-b border-slate-100">
                          {brl(c.potencialMensal)}
                        </td>
                        <td className="px-2 py-1.5 text-center border-b border-slate-100">
                          <span className="inline-block rounded-full bg-blue-50 border border-blue-200 px-1.5 text-[9px] font-bold text-blue-800">
                            {c.envios}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="px-3 py-1.5 text-[9px] text-slate-400 leading-snug border-t border-slate-100">
                Benefício = diferença entre o tributo na regra geral ({pct(dados.referencia.total)})
                e no regime declarado. Não é economia a ser obtida — é o quanto o regime já reduz.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-slate-200 bg-white p-5 text-center">
              <Building2 className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
              <p className="text-[11px] font-bold text-slate-700">
                Nenhum cliente com dados completos ainda
              </p>
              <p className="text-[10px] text-slate-500 mt-1 leading-snug max-w-md mx-auto">
                Para o diagnóstico aparecer, o cliente precisa ter <b>regime tributário</b> e{' '}
                <b>receita mensal</b> preenchidos no cadastro. Veja as pendências abaixo.
              </p>
            </div>
          )}

          {/* pendências */}
          {semDados.length > 0 && (
            <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-3.5">
              <p className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 mb-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                Cadastro incompleto — {semDados.length} cliente(s) fora do cálculo
              </p>
              <div className="space-y-1">
                {semDados.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start gap-2 rounded-lg bg-white border border-amber-200 px-2 py-1.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[10.5px] font-bold text-slate-900 leading-tight">
                        {c.empresa || c.nome}
                      </p>
                      <p className="text-[9.5px] text-amber-800 leading-tight mt-0.5">{c.motivo}</p>
                    </div>
                    <span className="text-[9px] text-slate-400 shrink-0 tabular-nums mt-0.5">
                      {c.envios} envio{c.envios === 1 ? '' : 's'}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[9.5px] text-amber-800 mt-2 leading-snug">
                <b>Por que não estimamos:</b> a receita não é dedutível do que foi simulado — o
                valor de um produto simulado não é o faturamento da empresa. Preencher no cadastro é
                o único caminho honesto.
              </p>
              <a
                href="/envios.html"
                className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 hover:underline mt-1.5"
              >
                Completar cadastros em Cadastro &amp; Envios
                <ArrowRight className="w-2.5 h-2.5" />
              </a>
            </div>
          )}

          {/* rodapé */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1.5 flex items-start gap-1.5">
            <FileCheck2 className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-[9px] text-slate-500 leading-snug">
              Referência: CBS {pct(dados.referencia.cbs)} + IBS {pct(dados.referencia.ibs)} ={' '}
              {pct(dados.referencia.total)} (src/data/aliquotas.ts). Projeção de 12 meses é
              aritmética, sem correção monetária nem variação de receita. Simples e MEI ficam fora
              por dependerem da faixa de RBT12.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
