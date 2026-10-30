import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeftRight,
  ArrowRight,
  BadgeAlert,
  Building2,
  Calculator,
  Check,
  FileCheck2,
  KeyRound,
  Plus,
  RefreshCw,
  Save,
  Search,
  TrendingDown,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import { CBS_REF, IBS_REF, REF_TOTAL, pct, totalDoAno } from '@/data/aliquotas'

/**
 * CADASTRO DE CLIENTES & ENVIOS — Seção 9A
 *
 * ── POR QUE ESTA SEÇÃO EXISTE (pedido do CEO, 29/10/2026) ──
 * "Criar no menu lateral o ícone de cadastro de clientes & envios, contemplando campos
 * para identificação completa, para importação e digitação de dados, para comparativos
 * e cálculos, para realizar simulações diversas com a reforma e situação atual."
 *
 * O cadastro existia só na página envios.html, fora do Panorama. Aqui ele entra no
 * menu, com identificação completa e — o ponto central — com o COMPARATIVO entre a
 * situação atual do cliente e o regime da reforma.
 *
 * ── A DECISÃO QUE DEFINE ESTA TELA ──
 * O lado "hoje" da comparação é INFORMADO pelo usuário (carga atual em %), nunca
 * deduzido. O sistema não tem a apuração real da empresa — só o que o contador
 * informa. Quando o campo está vazio, a tela escreve "não informado" em vez de
 * assumir um número. Comparar a reforma com uma premissa inventada seria pior que
 * não comparar.
 *
 * ── O QUE ELA FAZ ──
 * 1. Lista os clientes com identificação completa, filtrável.
 * 2. Formulário de digitação com todos os campos (identificação + situação atual).
 * 3. Importação de planilha colada (TSV/CSV), com pré-visualização.
 * 4. Comparativo por cliente: carga atual × carga na reforma, com a diferença em
 *    pontos percentuais e em reais.
 * 5. Envio: link direto para a página de envios, que já tem o fluxo com protocolo.
 */

const TOKEN_KEY = 'adecont_painel_token'
const BACKEND = 'https://verificacao-projeto-panorama-18549.shrd00.internal.goskip.dev'

type Aba = 'lista' | 'novo' | 'importar' | 'comparativo'

interface Cliente {
  id: string
  nome: string
  email: string
  empresa?: string
  documento?: string
  whatsapp?: string
  is_active?: boolean
  regime_tributario?: string
  receita_mensal?: number
  atividade?: string
  uf?: string
  tipo_pessoa?: string
  razao_social?: string
  nome_fantasia?: string
  cep?: string
  municipio?: string
  cnae?: string
  segmento?: string
  num_funcionarios?: number
  telefone?: string
  carga_atual_pct?: number
  tributos_atuais?: string[]
}

/** Fator de redução por regime — igual ao usado no painel Por cliente. */
const FATOR: Record<string, number> = {
  regular: 1,
  imobiliario: 0.5,
  agro: 0.4,
  profissional: 0.7,
  consorcios: 1,
  financeiro: 1,
}

const NOME_REGIME: Record<string, string> = {
  regular: 'Regime regular',
  simples: 'Simples Nacional',
  mei: 'MEI',
  imobiliario: 'Imobiliário',
  agro: 'Agronegócio',
  consorcios: 'Consórcios',
  financeiro: 'Serviços financeiros',
  profissional: 'Profissão regulamentada',
}

const TRIBUTOS = [
  { id: 'pis', nome: 'PIS' },
  { id: 'cofins', nome: 'Cofins' },
  { id: 'icms', nome: 'ICMS' },
  { id: 'iss', nome: 'ISS' },
  { id: 'ipi', nome: 'IPI' },
  { id: 'irpj', nome: 'IRPJ' },
  { id: 'csll', nome: 'CSLL' },
  { id: 'cpp', nome: 'CPP' },
  { id: 'simples_das', nome: 'DAS (Simples)' },
  { id: 'is', nome: 'Imposto Seletivo' },
]

const SEGMENTOS = [
  ['comercio', 'Comércio'],
  ['industria', 'Indústria'],
  ['servicos', 'Serviços'],
  ['construcao', 'Construção'],
  ['agropecuaria', 'Agropecuária'],
  ['imobiliario', 'Imobiliário'],
  ['financeiro', 'Financeiro'],
  ['saude', 'Saúde'],
  ['educacao', 'Educação'],
  ['tecnologia', 'Tecnologia'],
  ['transporte', 'Transporte'],
  ['energia', 'Energia'],
  ['outro', 'Outro'],
]

function brl(v: number | null | undefined, casas = 0): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—'
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: casas,
  })
}

const campo =
  'w-full rounded-lg border-2 border-slate-300 px-2.5 py-1.5 text-[12px] text-slate-900 bg-white focus:outline-none focus:border-panorama-gold'
const rotulo = 'block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1'

export function SectionCadastroEnvios() {
  const [aba, setAba] = useState<Aba>('lista')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [token, setToken] = useState('')
  const [busca, setBusca] = useState('')
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; txt: string } | null>(null)

  // formulário
  const [form, setForm] = useState<Record<string, string>>({})
  const [tributos, setTributos] = useState<string[]>([])

  // importação
  const [textoImport, setTextoImport] = useState('')
  const [previa, setPrevia] = useState<Record<string, string>[]>([])

  useEffect(() => {
    try {
      setToken(window.localStorage.getItem(TOKEN_KEY) || '')
    } catch (_) {
      setToken('')
    }
  }, [])

  const carregar = useCallback(async (tok: string) => {
    if (!tok) return
    setCarregando(true)
    setErro(null)
    try {
      const r = await fetch(
        `${BACKEND}/api/collections/simul_clientes/records?perPage=500&sort=nome`,
        { headers: { 'X-Painel-Token': tok } },
      )
      if (!r.ok) {
        setErro(
          r.status === 401
            ? 'Token recusado. Informe o token do painel abaixo.'
            : `O servidor respondeu ${r.status}.`,
        )
        return
      }
      const j = await r.json()
      setClientes((j.items ?? []) as Cliente[])
    } catch {
      setErro('Não foi possível falar com o servidor. O backend pode estar reiniciando.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    if (token) carregar(token)
  }, [token, carregar])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const salvar = async () => {
    setMsg(null)
    if (!form.nome || !form.email) {
      setMsg({ tipo: 'erro', txt: 'Nome e e-mail são obrigatórios.' })
      return
    }
    const corpo: Record<string, unknown> = {
      nome: form.nome,
      email: form.email,
      whatsapp: form.whatsapp || '',
      empresa: form.empresa || '',
      documento: form.documento || '',
      observacoes: form.observacoes || '',
      regime_tributario: form.regime_tributario || '',
      receita_mensal: form.receita_mensal || '',
      atividade: form.atividade || '',
      uf: (form.uf || '').toUpperCase(),
      tipo_pessoa: form.tipo_pessoa || '',
      razao_social: form.razao_social || '',
      nome_fantasia: form.nome_fantasia || '',
      cep: form.cep || '',
      municipio: form.municipio || '',
      cnae: form.cnae || '',
      segmento: form.segmento || '',
      num_funcionarios: form.num_funcionarios || '',
      telefone: form.telefone || '',
      carga_atual_pct: form.carga_atual_pct || '',
      tributos_atuais: tributos,
    }
    try {
      const r = await fetch(`${BACKEND}/backend/v1/simul-importar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Painel-Token': token },
        body: JSON.stringify({ clientes: [corpo] }),
      })
      if (!r.ok) {
        setMsg({ tipo: 'erro', txt: `O servidor respondeu ${r.status}. Confira o token.` })
        return
      }
      const j = await r.json()
      setMsg({
        tipo: 'ok',
        txt: `Cliente salvo (${j.inseridos ? 'novo' : 'atualizado'}).`,
      })
      setForm({})
      setTributos([])
      carregar(token)
    } catch {
      setMsg({ tipo: 'erro', txt: 'Falha ao salvar. Verifique a conexão e o token.' })
    }
  }

  /** Pré-visualização da planilha colada: primeira linha é o cabeçalho. */
  const lerImport = (txt: string) => {
    setTextoImport(txt)
    const linhas = txt
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
    if (!linhas.length) {
      setPrevia([])
      return
    }
    const sep = linhas[0].includes('\t') ? '\t' : linhas[0].includes(';') ? ';' : ','
    const cab = linhas[0].split(sep).map((c) => c.trim().toLowerCase())
    const dados = linhas.slice(1).map((l) => {
      const cel = l.split(sep)
      const obj: Record<string, string> = {}
      cab.forEach((c, i) => {
        obj[c] = (cel[i] ?? '').trim()
      })
      return obj
    })
    setPrevia(dados.slice(0, 50))
  }

  const importar = async () => {
    setMsg(null)
    if (!previa.length) {
      setMsg({ tipo: 'erro', txt: 'Cole a planilha com cabeçalho antes de importar.' })
      return
    }
    try {
      const r = await fetch(`${BACKEND}/backend/v1/simul-importar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Painel-Token': token },
        body: JSON.stringify({ clientes: previa }),
      })
      if (!r.ok) {
        setMsg({ tipo: 'erro', txt: `O servidor respondeu ${r.status}.` })
        return
      }
      const j = await r.json()
      setMsg({
        tipo: 'ok',
        txt: `Importação concluída: ${j.inseridos ?? 0} novo(s), ${j.atualizados ?? 0} atualizado(s)${
          j.erros?.length ? `, ${j.erros.length} erro(s)` : ''
        }.`,
      })
      setTextoImport('')
      setPrevia([])
      carregar(token)
    } catch {
      setMsg({ tipo: 'erro', txt: 'Falha na importação.' })
    }
  }

  /** Comparativo: carga de hoje (informada) × carga na reforma (calculada). */
  const comparativo = useMemo(() => {
    return clientes
      .filter((c) => c.regime_tributario && c.receita_mensal)
      .filter((c) => {
        if (!busca.trim()) return true
        const t = busca.toLowerCase()
        return `${c.nome} ${c.empresa ?? ''} ${c.razao_social ?? ''}`.toLowerCase().includes(t)
      })
      .map((c) => {
        const fator = FATOR[c.regime_tributario as string]
        const receita = Number(c.receita_mensal) || 0
        const aliqReforma = fator === undefined ? null : REF_TOTAL * fator
        const tribReforma = aliqReforma === null ? null : (receita * aliqReforma) / 100
        const cargaHoje = c.carga_atual_pct ? Number(c.carga_atual_pct) : null
        const tribHoje = cargaHoje === null ? null : (receita * cargaHoje) / 100
        const deltaPp = cargaHoje !== null && aliqReforma !== null ? aliqReforma - cargaHoje : null
        const deltaReais = tribHoje !== null && tribReforma !== null ? tribReforma - tribHoje : null
        return { c, receita, aliqReforma, tribReforma, cargaHoje, tribHoje, deltaPp, deltaReais }
      })
  }, [clientes, busca])

  const filtrados = useMemo(() => {
    if (!busca.trim()) return clientes
    const t = busca.toLowerCase()
    return clientes.filter((c) =>
      `${c.nome} ${c.email} ${c.empresa ?? ''} ${c.razao_social ?? ''} ${c.documento ?? ''}`
        .toLowerCase()
        .includes(t),
    )
  }, [clientes, busca])

  const ABAS: { id: Aba; nome: string; Icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'lista', nome: 'Clientes', Icon: Users },
    { id: 'novo', nome: 'Novo cadastro', Icon: Plus },
    { id: 'importar', nome: 'Importar', Icon: FileCheck2 },
    { id: 'comparativo', nome: 'Comparativo', Icon: ArrowLeftRight },
  ]

  return (
    <section id="cadastro-envios" className="scroll-mt-24">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* cabeçalho */}
        <header className="bg-panorama-navy px-4 sm:px-5 py-4 border-b-2 border-panorama-gold/60">
          <div className="flex items-start gap-3 flex-wrap">
            <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-panorama-gold/15 text-panorama-gold-light ring-1 ring-panorama-gold/50 shrink-0">
              <Building2 className="w-6 h-6" />
            </span>
            <div className="flex-1 min-w-[220px]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-panorama-navy bg-panorama-gold rounded px-1.5 py-0.5">
                  Seção 9A
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-panorama-gold-light/80">
                  Cadastro de Clientes &amp; Envios
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mt-1 leading-tight">
                Identificação completa, importação e comparativo com a reforma
              </h3>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed max-w-3xl">
                Cadastre o cliente com os dados fiscais completos, informe a carga tributária atual
                e compare, lado a lado, com o regime da reforma. O lado de hoje é o que você informa
                — o sistema não deduz.
              </p>
            </div>
            <a
              href="/envios.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-panorama-gold text-panorama-navy px-3 py-1.5 text-[11px] font-bold hover:bg-panorama-gold-light shrink-0"
            >
              Envios e protocolo
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>

          <div role="tablist" className="flex gap-1.5 mt-3 overflow-x-auto pb-0.5">
            {ABAS.map((a) => {
              const ativa = aba === a.id
              return (
                <button
                  key={a.id}
                  role="tab"
                  aria-selected={ativa}
                  onClick={() => {
                    const y = window.scrollY
                    setAba(a.id)
                    window.requestAnimationFrame(() =>
                      window.scrollTo({ top: y, behavior: 'instant' }),
                    )
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold shrink-0 transition-colors cursor-pointer ${
                    ativa
                      ? 'bg-panorama-gold text-panorama-navy'
                      : 'bg-white/10 text-slate-200 hover:bg-white/20'
                  }`}
                >
                  <a.Icon className="w-3.5 h-3.5" />
                  {a.nome}
                </button>
              )
            })}
          </div>
        </header>

        <div className="p-3.5 sm:p-4">
          {/* token / erro */}
          {!token && (
            <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-3 mb-3">
              <p className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 mb-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                Token do painel necessário
              </p>
              <div className="flex gap-1.5">
                <input
                  type="password"
                  id="tok-cad"
                  placeholder="cole o token"
                  className="flex-1 rounded-lg border-2 border-amber-300 px-2 py-1.5 text-[11px] font-mono bg-white"
                />
                <button
                  onClick={() => {
                    const el = document.getElementById('tok-cad') as HTMLInputElement | null
                    const v = el?.value.trim() || ''
                    if (v) {
                      try {
                        window.localStorage.setItem(TOKEN_KEY, v)
                      } catch (_) {
                        // localStorage bloqueado: vale só nesta sessão
                      }
                      setToken(v)
                    }
                  }}
                  className="rounded-lg bg-amber-600 text-white px-3 py-1.5 text-[11px] font-bold hover:bg-amber-700 cursor-pointer shrink-0"
                >
                  Usar
                </button>
              </div>
            </div>
          )}
          {erro && (
            <div className="rounded-xl border-2 border-rose-300 bg-rose-50 p-2.5 mb-3 flex items-start gap-2">
              <BadgeAlert className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <p className="text-[11px] text-rose-900">{erro}</p>
            </div>
          )}
          {msg && (
            <div
              className={`rounded-lg border-2 p-2.5 mb-3 flex items-start gap-2 ${
                msg.tipo === 'ok'
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-rose-300 bg-rose-50'
              }`}
            >
              {msg.tipo === 'ok' ? (
                <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              ) : (
                <X className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              )}
              <p
                className={`text-[11px] ${
                  msg.tipo === 'ok' ? 'text-emerald-900' : 'text-rose-900'
                }`}
              >
                {msg.txt}
              </p>
            </div>
          )}

          {/* ───────────── LISTA ───────────── */}
          {aba === 'lista' && (
            <div>
              <div className="flex gap-2 items-center mb-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar por nome, empresa, documento ou e-mail…"
                    className={`${campo} pl-8`}
                  />
                </div>
                <button
                  onClick={() => carregar(token)}
                  disabled={carregando}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-panorama-navy text-panorama-gold-light px-3 py-1.5 text-[11px] font-bold disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${carregando ? 'animate-spin' : ''}`} />
                  {carregando ? 'Carregando' : 'Atualizar'}
                </button>
                <span className="text-[10px] text-slate-500 tabular-nums">
                  {filtrados.length} de {clientes.length}
                </span>
              </div>

              {filtrados.length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-[12px] font-bold text-slate-700">
                    {clientes.length === 0 ? 'Nenhum cliente cadastrado ainda' : 'Nada encontrado'}
                  </p>
                  <p className="text-[10.5px] text-slate-500 mt-1">
                    Use a aba <b>Novo cadastro</b> para incluir o primeiro, ou <b>Importar</b> para
                    colar uma planilha.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-[10.5px] min-w-[820px]">
                    <thead>
                      <tr className="bg-panorama-navy text-white">
                        <th className="text-left px-2.5 py-1.5 font-bold">Cliente</th>
                        <th className="text-left px-2 py-1.5 font-bold">Documento</th>
                        <th className="text-left px-2 py-1.5 font-bold">Regime</th>
                        <th className="text-right px-2 py-1.5 font-bold">Receita/mês</th>
                        <th className="text-right px-2 py-1.5 font-bold">Carga hoje</th>
                        <th className="text-left px-2 py-1.5 font-bold">UF</th>
                        <th className="text-center px-2 py-1.5 font-bold">Perfil</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtrados.map((c, i) => {
                        const completo = !!(
                          c.regime_tributario &&
                          c.receita_mensal &&
                          c.carga_atual_pct
                        )
                        return (
                          <tr key={c.id} className={i % 2 ? 'bg-slate-50' : 'bg-white'}>
                            <td className="px-2.5 py-1.5 border-b border-slate-100">
                              <p className="font-bold text-slate-900 leading-tight truncate max-w-[190px]">
                                {c.nome_fantasia || c.empresa || c.nome}
                              </p>
                              <p className="text-[9px] text-slate-500 leading-tight truncate max-w-[190px]">
                                {c.nome}
                                {c.email ? ` · ${c.email}` : ''}
                              </p>
                            </td>
                            <td className="px-2 py-1.5 border-b border-slate-100 font-mono text-[9.5px] text-slate-600">
                              {c.documento || '—'}
                            </td>
                            <td className="px-2 py-1.5 border-b border-slate-100">
                              <span className="inline-block rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-700">
                                {NOME_REGIME[c.regime_tributario || ''] || '—'}
                              </span>
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums text-slate-700 border-b border-slate-100">
                              {c.receita_mensal ? brl(Number(c.receita_mensal)) : '—'}
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums font-bold text-slate-900 border-b border-slate-100">
                              {c.carga_atual_pct ? pct(Number(c.carga_atual_pct)) : '—'}
                            </td>
                            <td className="px-2 py-1.5 border-b border-slate-100 text-slate-600">
                              {c.uf || '—'}
                            </td>
                            <td className="px-2 py-1.5 text-center border-b border-slate-100">
                              <span
                                className={`inline-block rounded-full px-1.5 text-[9px] font-bold ${
                                  completo
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {completo ? 'completo' : 'faltando'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ───────────── NOVO CADASTRO ───────────── */}
          {aba === 'novo' && (
            <div className="space-y-3">
              {/* identificação */}
              <div className="rounded-xl border-2 border-slate-200 bg-slate-50/60 p-3">
                <p className="text-[11px] font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-600" />
                  Identificação
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <label>
                    <span className={rotulo}>Tipo *</span>
                    <select
                      value={form.tipo_pessoa ?? ''}
                      onChange={(e) => set('tipo_pessoa', e.target.value)}
                      className={campo}
                    >
                      <option value="">—</option>
                      <option value="PJ">Pessoa jurídica</option>
                      <option value="PF">Pessoa física</option>
                    </select>
                  </label>
                  <label className="lg:col-span-2">
                    <span className={rotulo}>Nome do contato *</span>
                    <input
                      value={form.nome ?? ''}
                      onChange={(e) => set('nome', e.target.value)}
                      className={campo}
                      placeholder="Quem atende"
                    />
                  </label>
                  <label>
                    <span className={rotulo}>E-mail *</span>
                    <input
                      type="email"
                      value={form.email ?? ''}
                      onChange={(e) => set('email', e.target.value)}
                      className={campo}
                      placeholder="cliente@empresa.com.br"
                    />
                  </label>
                  <label className="lg:col-span-2">
                    <span className={rotulo}>Razão social</span>
                    <input
                      value={form.razao_social ?? ''}
                      onChange={(e) => set('razao_social', e.target.value)}
                      className={campo}
                    />
                  </label>
                  <label>
                    <span className={rotulo}>Nome fantasia</span>
                    <input
                      value={form.nome_fantasia ?? ''}
                      onChange={(e) => set('nome_fantasia', e.target.value)}
                      className={campo}
                    />
                  </label>
                  <label>
                    <span className={rotulo}>CPF / CNPJ</span>
                    <input
                      value={form.documento ?? ''}
                      onChange={(e) => set('documento', e.target.value)}
                      className={campo}
                    />
                  </label>
                  <label>
                    <span className={rotulo}>CNAE principal</span>
                    <input
                      value={form.cnae ?? ''}
                      onChange={(e) => set('cnae', e.target.value)}
                      className={campo}
                      placeholder="ex.: 4711-3/02"
                    />
                  </label>
                  <label>
                    <span className={rotulo}>Segmento</span>
                    <select
                      value={form.segmento ?? ''}
                      onChange={(e) => set('segmento', e.target.value)}
                      className={campo}
                    >
                      <option value="">—</option>
                      {SEGMENTOS.map(([v, n]) => (
                        <option key={v} value={v}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className={rotulo}>Atividade</span>
                    <select
                      value={form.atividade ?? ''}
                      onChange={(e) => set('atividade', e.target.value)}
                      className={campo}
                    >
                      <option value="">—</option>
                      <option value="comercio">Comércio</option>
                      <option value="industria">Indústria</option>
                      <option value="servicos">Serviços</option>
                      <option value="imobiliario">Imobiliário</option>
                      <option value="agropecuaria">Agropecuária</option>
                      <option value="financeiro">Financeiro</option>
                      <option value="construcao">Construção</option>
                      <option value="saude">Saúde</option>
                      <option value="educacao">Educação</option>
                      <option value="tecnologia">Tecnologia</option>
                      <option value="outro">Outro</option>
                    </select>
                  </label>
                  <label>
                    <span className={rotulo}>Município</span>
                    <input
                      value={form.municipio ?? ''}
                      onChange={(e) => set('municipio', e.target.value)}
                      className={campo}
                    />
                  </label>
                  <label>
                    <span className={rotulo}>UF</span>
                    <input
                      maxLength={2}
                      value={form.uf ?? ''}
                      onChange={(e) => set('uf', e.target.value.toUpperCase())}
                      className={campo}
                      placeholder="RS"
                    />
                  </label>
                  <label>
                    <span className={rotulo}>CEP</span>
                    <input
                      value={form.cep ?? ''}
                      onChange={(e) => set('cep', e.target.value)}
                      className={campo}
                      placeholder="00000-000"
                    />
                  </label>
                  <label>
                    <span className={rotulo}>Telefone</span>
                    <input
                      value={form.telefone ?? ''}
                      onChange={(e) => set('telefone', e.target.value)}
                      className={campo}
                    />
                  </label>
                  <label>
                    <span className={rotulo}>WhatsApp</span>
                    <input
                      value={form.whatsapp ?? ''}
                      onChange={(e) => set('whatsapp', e.target.value)}
                      className={campo}
                    />
                  </label>
                  <label>
                    <span className={rotulo}>Funcionários</span>
                    <input
                      inputMode="numeric"
                      value={form.num_funcionarios ?? ''}
                      onChange={(e) => set('num_funcionarios', e.target.value)}
                      className={campo}
                    />
                  </label>
                </div>
              </div>

              {/* situação atual */}
              <div className="rounded-xl border-2 border-panorama-gold/50 bg-amber-50/40 p-3">
                <p className="text-[11px] font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-amber-700" />
                  Situação atual — o lado de hoje do comparativo
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label>
                    <span className={rotulo}>Regime hoje</span>
                    <select
                      value={form.regime_tributario ?? ''}
                      onChange={(e) => set('regime_tributario', e.target.value)}
                      className={campo}
                    >
                      <option value="">— não informado —</option>
                      <option value="regular">Regime regular</option>
                      <option value="simples">Simples Nacional</option>
                      <option value="mei">MEI</option>
                      <option value="imobiliario">Imobiliário</option>
                      <option value="agro">Agronegócio</option>
                      <option value="consorcios">Consórcios</option>
                      <option value="financeiro">Serviços financeiros</option>
                      <option value="profissional">Profissão regulamentada</option>
                    </select>
                  </label>
                  <label>
                    <span className={rotulo}>Receita mensal (R$)</span>
                    <input
                      inputMode="numeric"
                      value={form.receita_mensal ?? ''}
                      onChange={(e) => set('receita_mensal', e.target.value)}
                      className={campo}
                      placeholder="ex.: 150000"
                    />
                  </label>
                  <label>
                    <span className={rotulo}>Carga tributária atual (%)</span>
                    <input
                      inputMode="decimal"
                      value={form.carga_atual_pct ?? ''}
                      onChange={(e) => set('carga_atual_pct', e.target.value)}
                      className={campo}
                      placeholder="ex.: 12,5"
                    />
                  </label>
                </div>
                <p className="text-[9.5px] text-amber-900 leading-snug mt-1.5">
                  A carga atual é o percentual da receita que a empresa paga hoje em tributos. Esse
                  número vem da apuração contábil — o sistema <b>não o calcula</b>, para não
                  comparar a reforma com uma premissa inventada. Deixe vazio se não souber.
                </p>

                <p className={`${rotulo} mt-2.5`}>Tributos que recolhe hoje</p>
                <div className="flex flex-wrap gap-1.5">
                  {TRIBUTOS.map((t) => {
                    const on = tributos.includes(t.id)
                    return (
                      <button
                        key={t.id}
                        onClick={() =>
                          setTributos((v) => (on ? v.filter((x) => x !== t.id) : [...v, t.id]))
                        }
                        className={`rounded-lg border px-2 py-1 text-[10.5px] font-bold cursor-pointer transition-colors ${
                          on
                            ? 'bg-panorama-navy text-panorama-gold-light border-panorama-navy'
                            : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        {t.nome}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-2 items-center flex-wrap">
                <button
                  onClick={salvar}
                  disabled={!token}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-panorama-navy text-panorama-gold-light px-4 py-2 text-[12px] font-bold hover:bg-panorama-navy/90 disabled:opacity-40 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Salvar cliente
                </button>
                <button
                  onClick={() => {
                    setForm({})
                    setTributos([])
                    setMsg(null)
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Limpar
                </button>
                {!token && (
                  <span className="text-[10px] text-amber-800">
                    Informe o token do painel para salvar.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ───────────── IMPORTAR ───────────── */}
          {aba === 'importar' && (
            <div className="space-y-3">
              <div className="rounded-xl border-2 border-slate-200 bg-white p-3">
                <p className="text-[11px] font-bold text-slate-900 mb-1.5">
                  Cole a planilha (Excel, Google Sheets ou CSV)
                </p>
                <p className="text-[10px] text-slate-500 leading-snug mb-2">
                  A primeira linha precisa ser o cabeçalho. Colunas reconhecidas:{' '}
                  <span className="font-mono text-[9.5px]">
                    nome, email, empresa, documento, regime_tributario, receita_mensal, atividade,
                    uf, tipo_pessoa, razao_social, nome_fantasia, cep, municipio, cnae, segmento,
                    num_funcionarios, telefone, whatsapp, carga_atual_pct
                  </span>
                  . Duplicatas são atualizadas pelo e-mail, nunca criadas em dobro.
                </p>
                <textarea
                  value={textoImport}
                  onChange={(e) => lerImport(e.target.value)}
                  rows={7}
                  placeholder={
                    'nome\temail\tempresa\tdocumento\tregime_tributario\treceita_mensal\tcarga_atual_pct\nMaria Silva\tmaria@empresa.com\tEmpresa Ltda\t12.345.678/0001-90\tregular\t150000\t12,5'
                  }
                  className="w-full rounded-lg border-2 border-slate-300 px-2.5 py-2 text-[11px] font-mono text-slate-900 focus:outline-none focus:border-panorama-gold"
                />
                <div className="flex gap-2 items-center mt-2 flex-wrap">
                  <button
                    onClick={importar}
                    disabled={!token || !previa.length}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-panorama-navy text-panorama-gold-light px-3 py-1.5 text-[11px] font-bold disabled:opacity-40 cursor-pointer"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    Importar {previa.length > 0 && `(${previa.length})`}
                  </button>
                  {previa.length > 0 && (
                    <span className="text-[10px] text-emerald-800 font-bold">
                      {previa.length} linha(s) reconhecida(s)
                    </span>
                  )}
                </div>
              </div>

              {previa.length > 0 && (
                <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
                  <p className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-700">
                    Pré-visualização (até 50 linhas)
                  </p>
                  <div className="overflow-x-auto max-h-72">
                    <table className="w-full text-[10px]">
                      <thead className="sticky top-0">
                        <tr className="bg-panorama-navy text-white">
                          {Object.keys(previa[0])
                            .slice(0, 8)
                            .map((k) => (
                              <th
                                key={k}
                                className="text-left px-2 py-1 font-bold whitespace-nowrap"
                              >
                                {k}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previa.map((linha, i) => (
                          <tr key={i} className={i % 2 ? 'bg-slate-50' : 'bg-white'}>
                            {Object.keys(previa[0])
                              .slice(0, 8)
                              .map((k) => (
                                <td
                                  key={k}
                                  className="px-2 py-1 border-b border-slate-100 text-slate-700 max-w-[160px] truncate"
                                >
                                  {linha[k] || '—'}
                                </td>
                              ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ───────────── COMPARATIVO ───────────── */}
          {aba === 'comparativo' && (
            <div className="space-y-3">
              <div className="rounded-xl border-2 border-slate-200 bg-white p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <ArrowLeftRight className="w-4 h-4 text-panorama-gold-dark" />
                  <p className="text-[12px] font-bold text-slate-900">
                    Situação atual × reforma, por cliente
                  </p>
                  <span className="text-[10px] text-slate-500 ml-auto">
                    referência da reforma: {pct(REF_TOTAL)} (CBS {pct(CBS_REF)} + IBS {pct(IBS_REF)}
                    )
                  </span>
                </div>
              </div>

              {comparativo.length === 0 ? (
                <div className="rounded-xl border-2 border-slate-200 bg-white py-8 text-center">
                  <ArrowLeftRight className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-[12px] font-bold text-slate-700">
                    Nenhum cliente com regime e receita informados
                  </p>
                  <p className="text-[10.5px] text-slate-500 mt-1 max-w-md mx-auto leading-snug">
                    Para o comparativo aparecer, o cliente precisa de <b>regime tributário</b> e{' '}
                    <b>receita mensal</b>. A carga atual é opcional — sem ela, a coluna mostra
                    &quot;não informado&quot; em vez de supor um valor.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-[10.5px] min-w-[900px]">
                    <thead>
                      <tr className="bg-panorama-navy text-white">
                        <th className="text-left px-2.5 py-1.5 font-bold">Cliente</th>
                        <th className="text-left px-2 py-1.5 font-bold">Regime</th>
                        <th className="text-right px-2 py-1.5 font-bold">Receita/mês</th>
                        <th className="text-right px-2 py-1.5 font-bold">Hoje (%)</th>
                        <th className="text-right px-2 py-1.5 font-bold">Hoje (R$)</th>
                        <th className="text-right px-2 py-1.5 font-bold">Reforma (%)</th>
                        <th className="text-right px-2 py-1.5 font-bold">Reforma (R$)</th>
                        <th className="text-right px-2 py-1.5 font-bold">Diferença</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparativo.map((l, i) => {
                        const sobe = (l.deltaReais ?? 0) > 0
                        return (
                          <tr key={l.c.id} className={i % 2 ? 'bg-slate-50' : 'bg-white'}>
                            <td className="px-2.5 py-1.5 border-b border-slate-100">
                              <p className="font-bold text-slate-900 leading-tight truncate max-w-[170px]">
                                {l.c.nome_fantasia || l.c.empresa || l.c.nome}
                              </p>
                              <p className="text-[9px] text-slate-500 leading-tight">
                                {l.c.uf || ''} {l.c.segmento ? `· ${l.c.segmento}` : ''}
                              </p>
                            </td>
                            <td className="px-2 py-1.5 border-b border-slate-100">
                              <span className="inline-block rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-700">
                                {NOME_REGIME[l.c.regime_tributario || ''] || '—'}
                              </span>
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums text-slate-700 border-b border-slate-100">
                              {brl(l.receita)}
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums text-slate-700 border-b border-slate-100">
                              {l.cargaHoje === null ? 'n/i' : pct(l.cargaHoje)}
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums text-slate-700 border-b border-slate-100">
                              {l.tribHoje === null ? '—' : brl(l.tribHoje)}
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums font-bold text-slate-900 border-b border-slate-100">
                              {l.aliqReforma === null ? 'DAS' : pct(l.aliqReforma)}
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums text-slate-700 border-b border-slate-100">
                              {l.tribReforma === null ? '—' : brl(l.tribReforma)}
                            </td>
                            <td className="px-2 py-1.5 text-right border-b border-slate-100">
                              {l.deltaReais === null ? (
                                <span className="text-[9px] text-amber-700 font-bold">n/i</span>
                              ) : (
                                <span
                                  className={`inline-flex items-center gap-0.5 font-bold tabular-nums ${
                                    sobe ? 'text-rose-800' : 'text-emerald-800'
                                  }`}
                                >
                                  {sobe ? (
                                    <TrendingUp className="w-2.5 h-2.5" />
                                  ) : (
                                    <TrendingDown className="w-2.5 h-2.5" />
                                  )}
                                  {brl(Math.abs(l.deltaReais))}
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 mb-1.5">
                  <BadgeAlert className="w-3.5 h-3.5" />
                  Como ler este comparativo
                </p>
                <ul className="space-y-1 text-[10px] text-amber-900 leading-snug">
                  <li>
                    <b>Hoje (%)</b> é a carga informada no cadastro. <b>n/i</b> = não informado —
                    não é zero, é ausência de dado.
                  </li>
                  <li>
                    <b>Reforma (%)</b> é a alíquota de referência ({pct(REF_TOTAL)}) multiplicada
                    pelo fator do regime. Simples e MEI aparecem como <b>DAS</b> porque dependem da
                    faixa de RBT12.
                  </li>
                  <li>
                    <b>É aritmética de alíquotas, não apuração.</b> Créditos, base de cálculo e
                    obrigações acessórias não entram. Serve para dimensionar, não para decidir
                    sozinho.
                  </li>
                  <li>
                    Referência em {pct(totalDoAno(2027))} para 2027 e {pct(REF_TOTAL)} no regime
                    pleno de 2033 — ver a aba Alíquotas da Central de Indicadores.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* rodapé */}
          <div className="mt-3.5 pt-2.5 border-t border-slate-200 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              <FileCheck2 className="w-3 h-3" />
              Dados:
            </span>
            <span>simul_clientes (PocketBase)</span>
            <span>·</span>
            <span>alíquotas em src/data/aliquotas.ts</span>
            <span className="ml-auto">
              <a
                href="/envios.html"
                className="hover:text-slate-700 font-bold"
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir página de envios ↗
              </a>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
