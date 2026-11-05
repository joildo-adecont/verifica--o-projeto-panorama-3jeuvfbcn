import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BookMarked,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  Loader2,
  Printer,
  Search,
  Shield,
  X,
  XCircle,
} from 'lucide-react'
import {
  ALTERACOES,
  ATO_PREDOMINANTE,
  EXCECOES,
  FONTE,
  NMCS,
  TOTAL_NCM,
  atoDe,
  buscarPorCodigo,
  buscarPorDescricao,
  capitulos,
  doCapitulo,
  nomeCapitulo,
} from '@/data/tabelaNcm'

/**
 * TABELA NCM — 15.040 códigos, com procedência e monitoramento
 * =============================================================
 * Pedido do CEO (04/11/2026): "Buscar todos os NCM e manter tabela atualizada e
 * monitorada pelos agentes de segurança das fontes e de buscas."
 *
 * ── O QUE ESTA TELA ENTREGA ──
 * 1. A tabela completa, buscável por código e por descrição.
 * 2. A PROCEDÊNCIA de cada linha: o ato de origem está no registro, e a exceção
 *    é marcada. Sem isso a tabela seria uma lista sem dono.
 * 3. As ALTERAÇÕES posteriores à base, em bloco separado — porque embutir
 *    alteração pontual em silêncio faria a tabela parecer atualizada quando não.
 * 4. O ESTADO DO MONITOR: quando o agente varreu, o que achou, e o que fazer.
 *
 * ── A DECISÃO QUE DEFINE A TELA ──
 * A tabela base é a Res. Gecex 272/2021; as alterações são camada separada. Não
 * aplico alteração por cima automaticamente: uma alteração mal aplicada em 15
 * mil códigos é pior que uma tabela uma semana atrasada, porque PARECE correta.
 * A tela mostra o que mudou, com o link do DOU, e deixa a conferência com quem
 * responde por ela.
 */

const BACKEND =
  import.meta.env.VITE_POCKETBASE_URL?.replace(/\/$/, '') ||
  'https://verificacao-projeto-panorama-18549.shrd02.internal.goskip.dev'

const TOKEN_KEY = 'adecont_painel_token'

export function ParametrizadorNcm() {
  const [token, setToken] = useState('')
  const [modo, setModo] = useState<'codigo' | 'descricao'>('descricao')
  const [termo, setTermo] = useState('')
  const [capSel, setCapSel] = useState('')
  const [abertos, setAbertos] = useState<Record<string, boolean>>({
    fonte: true,
    alteracoes: true,
    monitor: false,
  })
  const [monitor, setMonitor] = useState<any>(null)
  const [carregandoMonitor, setCarregandoMonitor] = useState(false)

  useEffect(() => {
    try {
      setToken(window.localStorage.getItem(TOKEN_KEY) || '')
    } catch {
      setToken('')
    }
  }, [])

  const caps = useMemo(() => capitulos(), [])

  const resultados = useMemo(() => {
    const t = termo.trim()
    if (!t) {
      return capSel ? doCapitulo(capSel) : []
    }
    return modo === 'codigo' ? buscarPorCodigo(t, 150) : buscarPorDescricao(t, 150)
  }, [termo, modo, capSel])

  /** Estado do monitor — lido da última rodada do agente. */
  const carregarMonitor = useCallback(async () => {
    if (!token) return
    setCarregandoMonitor(true)
    try {
      /* Rota única: devolve validador + monitor numa chamada, lendo do BANCO.
         Antes eram duas rotas lendo arquivo em tmp/, que o backend não enxerga
         (hosts diferentes) — a tela dizia "sem registro" para sempre. */
      const r = await fetch(`${BACKEND}/backend/v1/param-ncm-status`, {
        headers: { 'X-Painel-Token': token },
      })
      if (r.ok) {
        const j = await r.json()
        setMonitor(j.monitor && j.monitor.disponivel ? j.monitor : null)
      } else {
        setMonitor(null)
      }
    } catch {
      setMonitor(null)
    } finally {
      setCarregandoMonitor(false)
    }
  }, [token])

  useEffect(() => {
    carregarMonitor()
  }, [carregarMonitor])

  const imprimir = () => {
    const L: string[] = []
    L.push('TABELA NCM — CONFERÊNCIA')
    L.push('='.repeat(72))
    L.push('')
    L.push('Fonte: ' + FONTE.ato)
    L.push('Espelho: ' + FONTE.espelho + ' · carga em ' + FONTE.data_carga)
    L.push('Cobertura: ' + FONTE.cobertura)
    L.push('')
    if (termo)
      L.push('Busca: "' + termo + '" (' + modo + ') — ' + resultados.length + ' resultado(s)')
    else if (capSel) L.push('Capítulo ' + capSel + ' — ' + nomeCapitulo(capSel))
    L.push('')
    if (resultados.length) {
      L.push('CÓDIGO     DESCRIÇÃO')
      L.push('-'.repeat(72))
      for (const n of resultados) {
        L.push(n.c.padEnd(10) + ' ' + n.d.slice(0, 100))
      }
    } else {
      L.push('Sem resultados para o filtro atual. Busque por código ou descrição.')
    }
    L.push('')
    L.push('ALTERAÇÕES POSTERIORES À BASE')
    L.push('-'.repeat(72))
    for (const a of ALTERACOES) {
      L.push(a.norma + ' (' + a.data + ')')
      L.push('  ' + a.efeito)
      L.push('  ' + a.o_que_muda)
      L.push('  ' + a.url)
      L.push('')
    }
    L.push('Esta tabela é a BASE (Res. Gecex 272/2021). As alterações acima estão')
    L.push('em camada separada: aplicá-las automaticamente sobre 15 mil códigos, sem')
    L.push('conferência, produziria uma tabela que PARECE atualizada e pode estar errada.')

    const janela = window.open('', '_blank', 'width=900,height=1000')
    if (!janela) return
    janela.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Tabela NCM</title><style>
@page{size:A4;margin:15mm}
body{font-family:ui-monospace,"Courier New",monospace;font-size:9.5px;line-height:1.45;white-space:pre-wrap}
</style></head><body>${L.join('\n')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')}</body></html>`)
    janela.document.close()
    setTimeout(() => janela.print(), 350)
  }

  const baixarCsv = () => {
    const linhas = [
      ['codigo', 'descricao', 'ato_origem'],
      ...resultados.map((n) => [n.c, `"${n.d.replace(/"/g, '')}"`, atoDe(n.c)]),
    ]
    const csv = linhas.map((l) => l.join(';')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'tabela-ncm.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const Bloco = ({
    id,
    titulo,
    sub,
    Icon,
    children,
  }: {
    id: string
    titulo: string
    sub: string
    Icon: any
    children: React.ReactNode
  }) => (
    <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setAbertos((a) => ({ ...a, [id]: !a[id] }))}
        className="w-full flex items-start gap-2 px-3 py-2 border-b-2 border-panorama-gold/40 bg-slate-50 text-left cursor-pointer hover:bg-slate-100"
      >
        {abertos[id] ? (
          <ChevronDown className="mt-0.5 w-3.5 h-3.5 shrink-0 text-slate-500" />
        ) : (
          <ChevronRight className="mt-0.5 w-3.5 h-3.5 shrink-0 text-slate-500" />
        )}
        <Icon className="mt-0.5 w-3.5 h-3.5 shrink-0 text-panorama-navy" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-slate-900 leading-tight">{titulo}</p>
          <p className="text-[9px] text-slate-500 leading-tight">{sub}</p>
        </div>
      </button>
      {abertos[id] && <div className="p-3">{children}</div>}
    </div>
  )

  return (
    <div className="space-y-3">
      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-xl border-2 border-slate-200 bg-white p-2.5">
          <p className="text-[9px] font-bold uppercase text-slate-500">Códigos vigentes</p>
          <p className="text-[18px] font-bold tabular-nums text-slate-900">
            {TOTAL_NCM.toLocaleString('pt-BR')}
          </p>
          <p className="text-[8.5px] text-slate-500">em {caps.length} capítulos</p>
        </div>
        <div className="rounded-xl border-2 border-slate-200 bg-white p-2.5">
          <p className="text-[9px] font-bold uppercase text-slate-500">Ato de origem</p>
          <p className="text-[11px] font-bold text-slate-900 leading-tight">Gecex 272/2021</p>
          <p className="text-[8.5px] text-slate-500">a tabela NCM/TEC vigente</p>
        </div>
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-2.5">
          <p className="text-[9px] font-bold uppercase text-amber-800">Alterações posteriores</p>
          <p className="text-[18px] font-bold tabular-nums text-amber-900">{ALTERACOES.length}</p>
          <p className="text-[8.5px] text-amber-700">camada separada</p>
        </div>
        <div className="rounded-xl border-2 border-slate-200 bg-white p-2.5">
          <p className="text-[9px] font-bold uppercase text-slate-500">Exceções de origem</p>
          <p className="text-[18px] font-bold tabular-nums text-slate-900">{EXCECOES.length}</p>
          <p className="text-[8.5px] text-slate-500">ato diferente do predominante</p>
        </div>
      </div>

      {/* ── procedência ── */}
      <Bloco
        id="fonte"
        titulo="De onde vem esta tabela"
        sub="fonte, cobertura e o que ela não contém"
        Icon={Shield}
      >
        <dl className="space-y-1 text-[10px]">
          <div className="flex gap-1.5">
            <dt className="w-[110px] shrink-0 font-bold text-slate-600">Ato base</dt>
            <dd className="text-slate-800">{FONTE.ato}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="w-[110px] shrink-0 font-bold text-slate-600">Espelho</dt>
            <dd className="text-slate-800">{FONTE.espelho}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="w-[110px] shrink-0 font-bold text-slate-600">Cobertura</dt>
            <dd className="text-slate-800">{FONTE.cobertura}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="w-[110px] shrink-0 font-bold text-slate-600">Data da carga</dt>
            <dd className="text-slate-800">{FONTE.data_carga}</dd>
          </div>
        </dl>
        <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-[9.5px] leading-snug text-amber-900">
          <b>Limite declarado:</b> {FONTE.limite}
        </p>
        <p className="mt-1.5 text-[9px] leading-snug text-slate-500">
          <b>Por que não veio do governo direto:</b> o Classif/Siscomex exige captcha e a página da
          NCM na Receita Federal explica o que é a TIPI mas não publica o arquivo. A BrasilAPI é o
          espelho que traz o <b>ato de origem por linha</b> — é isso que permite rastrear cada
          código até a norma.
        </p>
      </Bloco>

      {/* ── busca ── */}
      <div className="rounded-xl border-2 border-panorama-navy/30 bg-white p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setModo('codigo')}
              className={`rounded-lg px-2 py-1 text-[10px] font-bold border-2 cursor-pointer ${
                modo === 'codigo'
                  ? 'bg-panorama-navy text-panorama-gold-light border-panorama-navy'
                  : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              Código
            </button>
            <button
              type="button"
              onClick={() => setModo('descricao')}
              className={`rounded-lg px-2 py-1 text-[10px] font-bold border-2 cursor-pointer ${
                modo === 'descricao'
                  ? 'bg-panorama-navy text-panorama-gold-light border-panorama-navy'
                  : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              Descrição
            </button>
          </div>

          <label className="flex flex-1 min-w-[200px] items-center gap-1.5 rounded-lg border-2 border-slate-300 bg-white px-2 py-1">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              value={termo}
              onChange={(e) => {
                setTermo(e.target.value)
                setCapSel('')
              }}
              placeholder={modo === 'codigo' ? 'ex.: 0406 ou 04061010' : 'ex.: queijo mussarela'}
              className="w-full text-[10.5px] bg-transparent focus:outline-none"
            />
            {termo && (
              <button
                onClick={() => setTermo('')}
                className="shrink-0 cursor-pointer text-slate-400"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </label>

          <select
            value={capSel}
            onChange={(e) => {
              setCapSel(e.target.value)
              setTermo('')
            }}
            className="rounded-lg border-2 border-slate-300 px-1.5 py-1 text-[10px] bg-white focus:outline-none max-w-[220px]"
          >
            <option value="">— navegar por capítulo —</option>
            {caps.map((c) => (
              <option key={c.cap} value={c.cap}>
                {c.cap} · {c.nome} ({c.total})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={baixarCsv}
            disabled={!resultados.length}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-slate-300 px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3 h-3" />
            CSV
          </button>
          <button
            type="button"
            onClick={imprimir}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-slate-300 px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Printer className="w-3 h-3" />
            Imprimir
          </button>
        </div>

        <p className="mt-1.5 text-[9px] text-slate-500">
          {resultados.length > 0
            ? `${resultados.length} resultado(s)${resultados.length >= 150 ? ' — refine a busca' : ''}`
            : termo
              ? 'Nenhum código encontrado. Tente parte da descrição oficial.'
              : 'Busque por código ou descrição, ou navegue por capítulo.'}
        </p>
      </div>

      {/* ── resultados ── */}
      {resultados.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-[9.5px] min-w-[620px]">
            <thead>
              <tr className="bg-panorama-navy text-white">
                <th className="text-left px-2 py-1.5 font-bold w-[92px]">Código</th>
                <th className="text-left px-2 py-1.5 font-bold">Descrição oficial</th>
                <th className="text-left px-2 py-1.5 font-bold w-[130px]">Origem</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((n, i) => {
                const ato = atoDe(n.c)
                const excecao = ato !== ATO_PREDOMINANTE
                return (
                  <tr key={n.c} className={i % 2 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="px-2 py-1 border-b border-slate-100 font-mono font-bold text-slate-800">
                      {n.c}
                    </td>
                    <td className="px-2 py-1 border-b border-slate-100 text-slate-700">{n.d}</td>
                    <td className="px-2 py-1 border-b border-slate-100">
                      {excecao ? (
                        <span className="rounded bg-amber-100 px-1 text-[8px] font-bold text-amber-900">
                          {ato}
                        </span>
                      ) : (
                        <span className="text-[8px] text-slate-400">272/2021</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── alterações ── */}
      <Bloco
        id="alteracoes"
        titulo="Alterações posteriores à tabela base"
        sub="camada separada — o que mudou depois da 272/2021"
        Icon={BookMarked}
      >
        <div className="space-y-2">
          {ALTERACOES.map((a, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
              <p className="flex items-start gap-1.5 text-[10.5px] font-bold text-slate-900">
                <CheckCircle2 className="mt-0.5 w-3 h-3 shrink-0 text-emerald-700" />
                {a.norma}
              </p>
              <p className="mt-0.5 text-[9.5px] text-slate-700">{a.efeito}</p>
              <p className="mt-0.5 text-[9.5px] leading-snug text-slate-600">{a.o_que_muda}</p>
              {a.ncm.length > 0 && (
                <p className="mt-1 font-mono text-[9px] text-slate-600">NCM: {a.ncm.join(' · ')}</p>
              )}
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold text-blue-700 hover:underline"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                abrir no DOU
              </a>
            </div>
          ))}
        </div>
        <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-[9.5px] leading-snug text-amber-900">
          <b>Por que em camada separada:</b> aplicar uma alteração pontual sobre 15 mil códigos sem
          conferência produziria uma tabela que <b>parece</b> atualizada e pode estar errada — e
          tabela errada, em matéria fiscal, é pior que tabela atrasada.
        </p>
      </Bloco>

      {/* ── monitor ── */}
      <Bloco
        id="monitor"
        titulo="Monitor das fontes — quem vigia esta tabela"
        sub="o agente consulta o DOU e avisa quando aparece ato novo"
        Icon={Shield}
      >
        {carregandoMonitor ? (
          <p className="flex items-center gap-1.5 text-[10px] text-slate-600">
            <Loader2 className="w-3 h-3 animate-spin" />
            Consultando...
          </p>
        ) : monitor ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                  monitor.estado === 'novidade'
                    ? 'bg-amber-500 text-white'
                    : monitor.estado === 'falha'
                      ? 'bg-rose-600 text-white'
                      : 'bg-emerald-600 text-white'
                }`}
              >
                {monitor.estado === 'novidade'
                  ? 'NOVO ATO'
                  : monitor.estado === 'falha'
                    ? 'FALHA NA VARREDURA'
                    : 'ESTÁVEL'}
              </span>
              <span className="text-[9.5px] text-slate-600">
                {monitor.dias_varridos} dias varridos ·{' '}
                {monitor.quando?.slice(0, 16).replace('T', ' ')}
              </span>
            </div>
            <p className="mt-1 text-[10px] font-bold text-slate-800">{monitor.mensagem}</p>
            {monitor.relevantes?.length > 0 && (
              <div className="mt-1.5 space-y-1">
                {monitor.relevantes.slice(0, 6).map((r: any, i: number) => (
                  <div key={i} className="flex items-start gap-1.5 text-[9px]">
                    <span className="shrink-0 font-mono text-slate-500">{r.data}</span>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:underline"
                    >
                      {String(r.titulo).slice(0, 90)}
                    </a>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-1.5 rounded bg-slate-50 p-1.5 text-[9px] leading-snug text-slate-600">
              <b>Ação sugerida:</b> {monitor.acao_sugerida}
            </p>
          </>
        ) : (
          <p className="text-[10px] text-slate-600">
            O monitor ainda não rodou ou o resultado não está disponível. Ele roda diariamente junto
            com o radar de fontes, e grava o resultado em arquivo no servidor.
          </p>
        )}
        <p className="mt-2 text-[9px] leading-snug text-slate-500">
          O monitor consulta o <b>DOU</b> (fonte mestra do sistema) por atos que possam alterar a
          NCM/TEC, e só considera relevante o que tem três coisas juntas: tipo de ato que altera a
          tabela, menção a NCM/TEC <b>no corpo</b> e verbo de alteração. Sem esse cuidado ele
          devolveria mais de cem falsos positivos por trimestre — e alarme em excesso ensina a
          ignorar alarme.
        </p>
      </Bloco>

      <p className="rounded-lg bg-slate-50 px-2 py-1.5 text-[8.5px] leading-snug text-slate-500">
        {TOTAL_NCM.toLocaleString('pt-BR')} códigos · fonte {FONTE.ato} · espelho {FONTE.espelho} ·{' '}
        carga em {FONTE.data_carga} · {EXCECOES.length} exceção(ões) de ato de origem ·{' '}
        {ALTERACOES.length} alteração(ões) em camada separada · monitoramento diário pelo agente de
        fontes.
      </p>
    </div>
  )
}
