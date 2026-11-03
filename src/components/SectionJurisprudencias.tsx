import { useEffect, useMemo, useState } from 'react'
import {
  Gavel,
  Plus,
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Send,
  Pencil,
  Archive,
  ExternalLink,
  Star,
  X,
  Eye,
  ClipboardList,
} from 'lucide-react'
import {
  listarJurisprudencias,
  criarJurisprudencia,
  atualizarJurisprudencia,
  arquivarJurisprudencia,
  historicoJurisprudencia,
  SemTokenError,
  type Jurisprudencia,
  type ResumoJuris,
} from '@/services/jurisprudencias'

/**
 * PUBLICAÇÃO DE JURISPRUDÊNCIAS — ícone próprio dentro do Acervo Jurídico
 * =====================================================================
 *
 * Pedido do CEO (03/11/2026): "Crie um ícone em separado no acervo jurídico só
 * para publicar as jurisprudências."
 *
 * ── A DIFERENÇA ENTRE ESTA TELA E "SÚMULAS E TESES" ──
 * Súmulas e teses = o que os TRIBUNAIS publicaram (2.963 verbetes, texto
 * oficial). Esta tela = o que o ESCRITÓRIO publica: a decisão que interessa ao
 * caso, com a leitura da casa, a aplicação prática e o dispositivo. Uma é
 * fonte; a outra é trabalho. Misturar as duas faria a nota do escritório passar
 * por texto de tribunal — por isso é ícone separado.
 *
 * ── CICLO DE VIDA ──
 *   rascunho → revisar → publicada → arquivada
 * "revisar" existe porque publicar não é o mesmo que estar correto. Quem
 * escreveu não é quem confere. E arquivar, em vez de apagar, preserva a prova
 * do que foi enviado ao cliente.
 *
 * ── SEM TOKEN NÃO HÁ LISTA VAZIA ──
 * Se o painel não estiver autenticado, a tela diz isso com todas as letras. Uma
 * lista vazia seria lida como "o escritório não tem jurisprudência" — mentira
 * perigosa num acervo jurídico.
 */

const TRIBUNAIS = [
  'STF',
  'STJ',
  'TST',
  'TSE',
  'STM',
  'TRF1',
  'TRF2',
  'TRF3',
  'TRF4',
  'TRF5',
  'TRF6',
  'TJ',
  'TRT',
  'TRE',
  'Outro',
]

const TIPOS = [
  'súmula',
  'súmula vinculante',
  'acórdão',
  'decisão monocrática',
  'tema repetitivo',
  'repercussão geral',
  'resolução',
  'enunciado',
]

const MATERIAS = [
  'Tributário',
  'Civil',
  'Processo Civil',
  'Penal',
  'Processo Penal',
  'Trabalhista',
  'Administrativo',
  'Constitucional',
  'Empresarial',
  'Consumidor',
  'Previdenciário',
  'Eleitoral',
  'Ambiental',
  'Outro',
]

const SITUACOES: { v: Jurisprudencia['situacao']; rotulo: string; cor: string }[] = [
  { v: 'rascunho', rotulo: 'Rascunho', cor: 'bg-slate-100 text-slate-700 ring-slate-300' },
  { v: 'revisar', rotulo: 'A revisar', cor: 'bg-amber-50 text-amber-800 ring-amber-300' },
  { v: 'publicada', rotulo: 'Publicada', cor: 'bg-emerald-50 text-emerald-800 ring-emerald-300' },
  { v: 'arquivada', rotulo: 'Arquivada', cor: 'bg-slate-100 text-slate-500 ring-slate-200' },
]

const FORM_VAZIO: Partial<Jurisprudencia> = {
  titulo: '',
  tribunal: 'STJ',
  tipo_decisao: 'acórdão',
  materia: 'Tributário',
  numero: '',
  processo: '',
  orgao_julgador: '',
  relator: '',
  data_julgamento: '',
  data_publicacao: '',
  tese: '',
  ementa: '',
  aplicacao_pratica: '',
  dispositivos: '',
  palavras_chave: '',
  fonte_url: '',
  origem: 'manual',
  situacao: 'rascunho',
  destaque: false,
}

export function SectionJurisprudencias() {
  const [lista, setLista] = useState<Jurisprudencia[]>([])
  const [resumo, setResumo] = useState<ResumoJuris | null>(null)
  const [totalAcervo, setTotalAcervo] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [semToken, setSemToken] = useState(false)

  const [busca, setBusca] = useState('')
  const [fTribunal, setFTribunal] = useState('')
  const [fMateria, setFMateria] = useState('')
  const [fSituacao, setFSituacao] = useState('')

  const [form, setForm] = useState<Partial<Jurisprudencia> | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState('')

  const [detalhe, setDetalhe] = useState<Jurisprudencia | null>(null)
  const [historico, setHistorico] = useState<
    { acao: string; de: string; para: string; por: string; detalhe: string; quando: string }[]
  >([])

  const carregar = async () => {
    setCarregando(true)
    setErro('')
    try {
      const r = await listarJurisprudencias({
        q: busca || undefined,
        tribunal: fTribunal || undefined,
        materia: fMateria || undefined,
        situacao: fSituacao || undefined,
      })
      setLista(r.itens)
      setResumo(r.resumo)
      setTotalAcervo(r.total_acervo)
      setSemToken(false)
    } catch (e: any) {
      if (e instanceof SemTokenError) {
        setSemToken(true)
        setErro(e.message)
      } else {
        setErro(String(e?.message || e))
      }
      setLista([])
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca, fTribunal, fMateria, fSituacao])

  const abrirNovo = () => {
    setForm({ ...FORM_VAZIO })
    setEditandoId(null)
    setErroForm('')
  }

  const abrirEdicao = (j: Jurisprudencia) => {
    setForm({ ...j })
    setEditandoId(j.id)
    setErroForm('')
    setDetalhe(null)
  }

  const salvar = async (situacaoFinal?: Jurisprudencia['situacao']) => {
    if (!form) return
    setErroForm('')
    if (!form.titulo?.trim()) {
      setErroForm('O título é obrigatório.')
      return
    }
    if (!form.tese?.trim()) {
      setErroForm('A tese é obrigatória — é o coração da jurisprudência publicada.')
      return
    }
    setSalvando(true)
    try {
      const payload = { ...form, situacao: situacaoFinal || form.situacao || 'rascunho' }
      if (editandoId) {
        await atualizarJurisprudencia(editandoId, payload)
      } else {
        await criarJurisprudencia(payload)
      }
      setForm(null)
      setEditandoId(null)
      await carregar()
    } catch (e: any) {
      if (e instanceof SemTokenError) setSemToken(true)
      setErroForm(String(e?.message || e))
    } finally {
      setSalvando(false)
    }
  }

  const publicar = async (j: Jurisprudencia) => {
    try {
      await atualizarJurisprudencia(j.id, { situacao: 'publicada' } as any)
      await carregar()
      setDetalhe(null)
    } catch (e: any) {
      setErro(String(e?.message || e))
    }
  }

  const arquivar = async (j: Jurisprudencia) => {
    try {
      await arquivarJurisprudencia(j.id)
      await carregar()
      setDetalhe(null)
    } catch (e: any) {
      setErro(String(e?.message || e))
    }
  }

  const abrirDetalhe = async (j: Jurisprudencia) => {
    setDetalhe(j)
    setHistorico([])
    try {
      setHistorico(await historicoJurisprudencia(j.id))
    } catch {
      setHistorico([])
    }
  }

  const contadores = useMemo(() => {
    const s = resumo?.por_situacao || {}
    return {
      rascunho: s.rascunho || 0,
      revisar: s.revisar || 0,
      publicada: s.publicada || 0,
      arquivada: s.arquivada || 0,
    }
  }, [resumo])

  return (
    <div className="space-y-3 pb-8">
      {/* ── CABEÇALHO ── */}
      <header className="rounded-2xl border-2 border-panorama-gold/60 bg-gradient-to-r from-slate-900 via-panorama-navy to-slate-900 p-4 text-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-panorama-gold px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-panorama-navy">
              <Gavel className="h-3 w-3" />
              Publicação
            </span>
            <h1 className="mt-1.5 text-xl font-black tracking-tight">Jurisprudências</h1>
            <p className="mt-0.5 max-w-2xl text-[11.5px] leading-relaxed text-slate-300">
              O acervo do escritório: a decisão que interessa ao caso, com a leitura da casa e a
              aplicação prática. Não substitui a fonte oficial — é o que a equipe separou para usar.
            </p>
          </div>
          <div className="grid shrink-0 grid-cols-4 gap-1.5">
            <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-center">
              <span className="block text-base font-black text-slate-200">
                {contadores.rascunho}
              </span>
              <span className="block text-[8.5px] uppercase tracking-wider text-slate-400">
                Rascunho
              </span>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-center">
              <span className="block text-base font-black text-amber-300">
                {contadores.revisar}
              </span>
              <span className="block text-[8.5px] uppercase tracking-wider text-slate-400">
                Revisar
              </span>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-center">
              <span className="block text-base font-black text-emerald-300">
                {contadores.publicada}
              </span>
              <span className="block text-[8.5px] uppercase tracking-wider text-slate-400">
                Publicada
              </span>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-center">
              <span className="block text-base font-black text-slate-400">
                {contadores.arquivada}
              </span>
              <span className="block text-[8.5px] uppercase tracking-wider text-slate-400">
                Arquivada
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── SEM TOKEN: diz a verdade ── */}
      {semToken && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
          <p className="flex items-center gap-1.5 text-[12px] font-bold text-amber-900">
            <AlertTriangle className="h-4 w-4" /> Painel não autenticado
          </p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-amber-900">
            {erro} A publicação de jurisprudência contém estratégia de caso — por isso não fica
            aberta. Isso <b>não</b> significa que o acervo esteja vazio: a lista abaixo não pôde ser
            lida.
          </p>
        </div>
      )}

      {erro && !semToken && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-2.5">
          <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-red-800">
            <AlertTriangle className="h-3.5 w-3.5" /> {erro}
          </p>
        </div>
      )}

      {/* ── FILTROS + NOVO ── */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar: tese, ementa, palavra-chave, número do processo…"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-panorama-navy focus:outline-none"
          />
        </div>
        <select
          value={fTribunal}
          onChange={(e) => setFTribunal(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-[11.5px] text-slate-700 focus:border-panorama-navy focus:outline-none"
        >
          <option value="">Todos os tribunais</option>
          {TRIBUNAIS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={fMateria}
          onChange={(e) => setFMateria(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-[11.5px] text-slate-700 focus:border-panorama-navy focus:outline-none"
        >
          <option value="">Todas as matérias</option>
          {MATERIAS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={fSituacao}
          onChange={(e) => setFSituacao(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-[11.5px] text-slate-700 focus:border-panorama-navy focus:outline-none"
        >
          <option value="">Toda situação</option>
          {SITUACOES.map((s) => (
            <option key={s.v} value={s.v}>
              {s.rotulo}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={abrirNovo}
          disabled={semToken}
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-panorama-navy bg-panorama-navy px-3 text-[11.5px] font-bold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5 text-panorama-gold" />
          Nova jurisprudência
        </button>
      </div>

      {carregando && (
        <p className="flex items-center gap-1.5 text-[12px] text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Lendo o acervo…
        </p>
      )}

      {!carregando && !erro && lista.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <ClipboardList className="mx-auto h-6 w-6 text-slate-300" />
          <p className="mt-1.5 text-[12.5px] font-bold text-slate-700">
            {totalAcervo === 0 ? 'O acervo ainda está vazio' : 'Nenhum resultado com esse filtro'}
          </p>
          <p className="mx-auto mt-1 max-w-md text-[11.5px] leading-relaxed text-slate-500">
            {totalAcervo === 0
              ? 'Comece cadastrando a primeira decisão. Depois de revisada, ela é publicada e passa a compor o acervo do escritório.'
              : `Há ${totalAcervo} registros no acervo; nenhum atende à combinação atual de busca e filtros.`}
          </p>
          {totalAcervo === 0 && !semToken && (
            <button
              type="button"
              onClick={abrirNovo}
              className="mt-2 inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-panorama-navy bg-panorama-navy px-3 text-[11.5px] font-bold text-white"
            >
              <Plus className="h-3.5 w-3.5 text-panorama-gold" /> Cadastrar a primeira
            </button>
          )}
        </div>
      )}

      {/* ── LISTA ── */}
      <p className="text-[11.5px] text-slate-600">
        <b>{lista.length}</b> de {totalAcervo} no acervo
      </p>

      <div className="space-y-1.5">
        {lista.map((j) => {
          const sit = SITUACOES.find((s) => s.v === j.situacao) || SITUACOES[0]
          return (
            <article key={j.id} className="rounded-lg border border-slate-200 bg-white p-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded bg-panorama-navy px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-panorama-gold-light">
                  {j.tribunal}
                </span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-600">
                  {j.tipo_decisao}
                </span>
                {j.numero && (
                  <span className="font-mono text-[9.5px] text-slate-500">{j.numero}</span>
                )}
                <span
                  className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase ring-1 ${sit.cor}`}
                >
                  {sit.rotulo}
                </span>
                {j.destaque && <Star className="h-3 w-3 fill-amber-400 text-amber-500" />}
                <span className="text-[9.5px] text-slate-400">{j.materia}</span>
              </div>
              <h3 className="mt-1 text-[12.5px] font-bold leading-snug text-panorama-navy">
                {j.titulo}
              </h3>
              <p className="mt-0.5 line-clamp-3 text-[11.5px] leading-relaxed text-slate-700">
                {j.tese}
              </p>
              {j.dispositivos && (
                <p className="mt-1 font-mono text-[9.5px] text-slate-500">{j.dispositivos}</p>
              )}
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => abrirDetalhe(j)}
                  className="inline-flex min-h-[30px] items-center gap-1 rounded border border-slate-300 px-2 text-[10.5px] font-bold text-slate-700 hover:border-panorama-gold"
                >
                  <Eye className="h-3 w-3" /> Ver
                </button>
                <button
                  type="button"
                  onClick={() => abrirEdicao(j)}
                  className="inline-flex min-h-[30px] items-center gap-1 rounded border border-slate-300 px-2 text-[10.5px] font-bold text-slate-700 hover:border-panorama-gold"
                >
                  <Pencil className="h-3 w-3" /> Editar
                </button>
                {j.situacao !== 'publicada' && j.situacao !== 'arquivada' && (
                  <button
                    type="button"
                    onClick={() => publicar(j)}
                    className="inline-flex min-h-[30px] items-center gap-1 rounded border border-emerald-600 bg-emerald-600 px-2 text-[10.5px] font-bold text-white hover:bg-emerald-700"
                  >
                    <Send className="h-3 w-3" /> Publicar
                  </button>
                )}
                {j.situacao !== 'arquivada' && (
                  <button
                    type="button"
                    onClick={() => arquivar(j)}
                    className="inline-flex min-h-[30px] items-center gap-1 rounded border border-slate-300 px-2 text-[10.5px] font-bold text-slate-500 hover:border-slate-400"
                  >
                    <Archive className="h-3 w-3" /> Arquivar
                  </button>
                )}
                {j.fonte_url && (
                  <a
                    href={j.fonte_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[30px] items-center gap-1 rounded border border-slate-300 px-2 text-[10.5px] font-bold text-panorama-navy hover:border-panorama-gold"
                  >
                    <ExternalLink className="h-3 w-3" /> Fonte
                  </a>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {/* ── MODAL: DETALHE ── */}
      {detalhe && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3">
          <div className="mt-6 w-full max-w-3xl rounded-xl bg-white p-4 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded bg-panorama-navy px-1.5 py-0.5 font-mono text-[10px] font-bold text-panorama-gold-light">
                    {detalhe.tribunal}
                  </span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-bold uppercase text-slate-600">
                    {detalhe.tipo_decisao}
                  </span>
                  {(detalhe.numero || detalhe.processo) && (
                    <span className="font-mono text-[10px] text-slate-500">
                      {detalhe.numero || detalhe.processo}
                    </span>
                  )}
                </div>
                <h2 className="mt-1 text-[15px] font-black text-panorama-navy">{detalhe.titulo}</h2>
              </div>
              <button
                type="button"
                onClick={() => setDetalhe(null)}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2 space-y-2 text-[11.5px] leading-relaxed text-slate-700">
              {detalhe.orgao_julgador && (
                <p>
                  <b>Órgão julgador:</b> {detalhe.orgao_julgador}
                </p>
              )}
              {detalhe.relator && (
                <p>
                  <b>Relator:</b> {detalhe.relator}
                </p>
              )}
              {(detalhe.data_julgamento || detalhe.data_publicacao) && (
                <p>
                  <b>Julgamento:</b> {detalhe.data_julgamento || '—'} · <b>Publicação:</b>{' '}
                  {detalhe.data_publicacao || '—'}
                </p>
              )}
              <div className="rounded-lg bg-slate-50 p-2.5">
                <p className="mb-0.5 text-[9.5px] font-black uppercase tracking-wider text-slate-500">
                  Tese
                </p>
                <p className="whitespace-pre-wrap">{detalhe.tese}</p>
              </div>
              {detalhe.ementa && (
                <div>
                  <p className="mb-0.5 text-[9.5px] font-black uppercase tracking-wider text-slate-500">
                    Ementa
                  </p>
                  <p className="whitespace-pre-wrap">{detalhe.ementa}</p>
                </div>
              )}
              {detalhe.aplicacao_pratica && (
                <div className="rounded-lg border-l-2 border-panorama-gold bg-amber-50/60 p-2">
                  <p className="mb-0.5 text-[9.5px] font-black uppercase tracking-wider text-amber-800">
                    Aplicação prática no escritório
                  </p>
                  <p className="whitespace-pre-wrap">{detalhe.aplicacao_pratica}</p>
                </div>
              )}
              {detalhe.dispositivos && (
                <p>
                  <b>Dispositivos:</b> <span className="font-mono">{detalhe.dispositivos}</span>
                </p>
              )}
              {detalhe.palavras_chave && (
                <p>
                  <b>Palavras-chave:</b> {detalhe.palavras_chave}
                </p>
              )}
              {detalhe.fonte_url && (
                <a
                  href={detalhe.fonte_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-panorama-navy hover:text-panorama-gold"
                >
                  Abrir no tribunal <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {historico.length > 0 && (
              <div className="mt-2 rounded-lg bg-slate-50 p-2">
                <p className="mb-1 text-[9.5px] font-black uppercase tracking-wider text-slate-500">
                  Histórico
                </p>
                <ul className="space-y-0.5">
                  {historico.map((h, i) => (
                    <li key={i} className="text-[10.5px] text-slate-600">
                      <span className="font-mono text-slate-400">
                        {String(h.quando).slice(0, 10).split('-').reverse().join('/')}
                      </span>{' '}
                      — {h.detalhe}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => abrirEdicao(detalhe)}
                className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-slate-300 px-2.5 text-[11.5px] font-bold text-slate-700"
              >
                <Pencil className="h-3 w-3" /> Editar
              </button>
              {detalhe.situacao !== 'publicada' && (
                <button
                  type="button"
                  onClick={() => publicar(detalhe)}
                  className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-emerald-600 bg-emerald-600 px-2.5 text-[11.5px] font-bold text-white"
                >
                  <Send className="h-3 w-3" /> Publicar
                </button>
              )}
              <button
                type="button"
                onClick={() => setDetalhe(null)}
                className="inline-flex min-h-[34px] items-center rounded-lg border border-slate-300 px-2.5 text-[11.5px] font-bold text-slate-600"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: FORMULÁRIO ── */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3">
          <div className="mt-4 w-full max-w-3xl rounded-xl bg-white p-4 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-[15px] font-black text-panorama-navy">
                {editandoId ? 'Editar jurisprudência' : 'Nova jurisprudência'}
              </h2>
              <button
                type="button"
                onClick={() => setForm(null)}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {erroForm && (
              <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 p-2 text-[11px] text-red-800">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {erroForm}
              </p>
            )}

            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-0.5 block text-[9.5px] font-black uppercase tracking-wider text-slate-500">
                  Título *
                </label>
                <input
                  type="text"
                  value={form.titulo || ''}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ex.: ICMS na base do PIS/Cofins — tese do século"
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-[12px] focus:border-panorama-navy focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-0.5 block text-[9.5px] font-black uppercase tracking-wider text-slate-500">
                  Tribunal *
                </label>
                <select
                  value={form.tribunal || 'STJ'}
                  onChange={(e) => setForm({ ...form, tribunal: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-[12px] focus:border-panorama-navy focus:outline-none"
                >
                  {TRIBUNAIS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-0.5 block text-[9.5px] font-black uppercase tracking-wider text-slate-500">
                  Tipo de decisão *
                </label>
                <select
                  value={form.tipo_decisao || 'acórdão'}
                  onChange={(e) => setForm({ ...form, tipo_decisao: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-[12px] focus:border-panorama-navy focus:outline-none"
                >
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-0.5 block text-[9.5px] font-black uppercase tracking-wider text-slate-500">
                  Matéria *
                </label>
                <select
                  value={form.materia || 'Tributário'}
                  onChange={(e) => setForm({ ...form, materia: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-[12px] focus:border-panorama-navy focus:outline-none"
                >
                  {MATERIAS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-0.5 block text-[9.5px] font-black uppercase tracking-wider text-slate-500">
                  Número / processo
                </label>
                <input
                  type="text"
                  value={form.numero || ''}
                  onChange={(e) => setForm({ ...form, numero: e.target.value })}
                  placeholder="REsp 1.258.842 / Tema 69"
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-[12px] focus:border-panorama-navy focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-0.5 block text-[9.5px] font-black uppercase tracking-wider text-slate-500">
                  Órgão julgador
                </label>
                <input
                  type="text"
                  value={form.orgao_julgador || ''}
                  onChange={(e) => setForm({ ...form, orgao_julgador: e.target.value })}
                  placeholder="Plenário / 1ª Seção / 2ª Turma"
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-[12px] focus:border-panorama-navy focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-0.5 block text-[9.5px] font-black uppercase tracking-wider text-slate-500">
                  Relator
                </label>
                <input
                  type="text"
                  value={form.relator || ''}
                  onChange={(e) => setForm({ ...form, relator: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-[12px] focus:border-panorama-navy focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-0.5 block text-[9.5px] font-black uppercase tracking-wider text-slate-500">
                  Julgamento
                </label>
                <input
                  type="text"
                  value={form.data_julgamento || ''}
                  onChange={(e) => setForm({ ...form, data_julgamento: e.target.value })}
                  placeholder="AAAA-MM-DD ou DD/MM/AAAA"
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-[12px] focus:border-panorama-navy focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-0.5 block text-[9.5px] font-black uppercase tracking-wider text-slate-500">
                  Publicação
                </label>
                <input
                  type="text"
                  value={form.data_publicacao || ''}
                  onChange={(e) => setForm({ ...form, data_publicacao: e.target.value })}
                  placeholder="AAAA-MM-DD ou DD/MM/AAAA"
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-[12px] focus:border-panorama-navy focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-0.5 block text-[9.5px] font-black uppercase tracking-wider text-slate-500">
                  Tese * — o que a decisão firmou
                </label>
                <textarea
                  value={form.tese || ''}
                  onChange={(e) => setForm({ ...form, tese: e.target.value })}
                  rows={3}
                  placeholder="Cole aqui a tese como ela foi firmada."
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-[12px] focus:border-panorama-navy focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-0.5 block text-[9.5px] font-black uppercase tracking-wider text-slate-500">
                  Ementa
                </label>
                <textarea
                  value={form.ementa || ''}
                  onChange={(e) => setForm({ ...form, ementa: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-[12px] focus:border-panorama-navy focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-0.5 block text-[9.5px] font-black uppercase tracking-wider text-slate-500">
                  Aplicação prática no escritório
                </label>
                <textarea
                  value={form.aplicacao_pratica || ''}
                  onChange={(e) => setForm({ ...form, aplicacao_pratica: e.target.value })}
                  rows={2}
                  placeholder="Em que caso da casa isso serve, e como."
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-[12px] focus:border-panorama-navy focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-0.5 block text-[9.5px] font-black uppercase tracking-wider text-slate-500">
                  Dispositivos
                </label>
                <input
                  type="text"
                  value={form.dispositivos || ''}
                  onChange={(e) => setForm({ ...form, dispositivos: e.target.value })}
                  placeholder="CTN art. 156; CF art. 150, VI"
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-[12px] focus:border-panorama-navy focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-0.5 block text-[9.5px] font-black uppercase tracking-wider text-slate-500">
                  Palavras-chave
                </label>
                <input
                  type="text"
                  value={form.palavras_chave || ''}
                  onChange={(e) => setForm({ ...form, palavras_chave: e.target.value })}
                  placeholder="ICMS, PIS, Cofins, base de cálculo"
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-[12px] focus:border-panorama-navy focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-0.5 block text-[9.5px] font-black uppercase tracking-wider text-slate-500">
                  Link da fonte oficial
                </label>
                <input
                  type="text"
                  value={form.fonte_url || ''}
                  onChange={(e) => setForm({ ...form, fonte_url: e.target.value })}
                  placeholder="https://scon.stj.jus.br/…"
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-[12px] focus:border-panorama-navy focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => salvar('rascunho')}
                disabled={salvando}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 text-[11.5px] font-bold text-slate-700 disabled:opacity-50"
              >
                {salvando ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                Salvar rascunho
              </button>
              <button
                type="button"
                onClick={() => salvar('revisar')}
                disabled={salvando}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-amber-500 bg-amber-500 px-2.5 text-[11.5px] font-bold text-white disabled:opacity-50"
              >
                Mandar para revisão
              </button>
              <button
                type="button"
                onClick={() => salvar('publicada')}
                disabled={salvando}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-600 px-2.5 text-[11.5px] font-bold text-white disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Publicar
              </button>
              <button
                type="button"
                onClick={() => setForm(null)}
                className="inline-flex min-h-[36px] items-center rounded-lg border border-slate-300 px-2.5 text-[11.5px] font-bold text-slate-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
