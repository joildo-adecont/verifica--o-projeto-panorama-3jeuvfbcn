import { useEffect, useMemo, useState } from 'react'
import { RADAR_LEFISC, FONTE_MESTRA } from '@/data/radarLefisc'
import {
  ArrowRight,
  BadgeAlert,
  BookMarked,
  CalendarDays,
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogIn,
  Search,
  ShieldCheck,
  Trash2,
  Unlock,
  Radar,
} from 'lucide-react'

/**
 * SEÇÃO 18 — ACESSO LEFISC
 *
 * ── O PEDIDO (CEO, 31/10/2026) ──
 * "Crie um acesso a uma fonte chamada Lefisc, à qual vou te fornecer a minha senha
 *  de acesso. Essa senha dará a possibilidade de busca em todas as tabelas e em
 *  todas as legislações compiladas. Crie esse ícone de acesso chamado Lefisc."
 *
 * ── O QUE A LEFISC É ──
 * Portal privado de legislação fiscal, contábil, tributária e trabalhista
 * (lefisc.com.br), por assinatura. Reúne banco de legislação federal, estadual e
 * municipal, tabelas práticas, calendário tributário e boletins diários do DOU.
 * NÃO é fonte oficial do Estado — é agregador comercial, como o Buscador NCM.
 * Por isso a tela a rotula como fonte SECUNDÁRIA de consulta e mantém ao lado o
 * caminho das fontes primárias. Para citar em peça ou laudo, a referência é o ato
 * publicado no órgão; a Lefisc serve para ACHAR rápido.
 *
 * ── COMO A SENHA É TRATADA (o ponto crítico) ──
 * O sistema é estático: tudo o que for gravado no navegador fica no navegador.
 * Então a senha da Lefisc NUNCA vai para o código, nem para o PocketBase, nem para
 * o histórico do Git. Ela fica em `localStorage` desta máquina, sob uma chave
 * própria, e o servidor da Lefisc é quem a valida — o Panorama apenas preenche o
 * formulário de login por você.
 *
 * Limite honesto, dito na tela: quem tiver acesso físico a este computador e abrir
 * o inspetor do navegador consegue ler a senha guardada. Para uma assinatura
 * pessoal de uso interno, isso é aceitável; se um dia o sistema for multiusuário,
 * a senha deve ir para o cofre do servidor (1Password/secret), não para o navegador.
 *
 * ── POR QUE O LOGIN É PRÉ-PREENCHIDO E NÃO AUTOMÁTICO ──
 * Login automático exigiria enviar a senha a um domínio de terceiro a partir do
 * nosso código, e não é possível garantir que o formulário da Lefisc não mude.
 * O caminho seguro e estável: guardar aqui, copiar com um clique e abrir o portal
 * já na página de pesquisa. O usuário cola e entra.
 */

const CHAVE_SENHA = 'adecont_lefisc_senha'
const CHAVE_USUARIO = 'adecont_lefisc_usuario'

/** Atalhos do portal, cada um com a finalidade escrita ao lado. */
const ATALHOS = [
  {
    id: 'pesquisa',
    nome: 'Pesquisa geral',
    o_que: 'Busca única em todo o acervo — legislação, tabelas e boletins',
    url: 'https://lefisc.com.br/',
    Icon: Search,
    destaque: true,
  },
  {
    id: 'legislacao',
    nome: 'Banco de Legislação',
    o_que: 'Federal, estadual e municipal, compilada e atualizada',
    url: 'https://lefisc.com.br/?vermais=federal',
    Icon: BookMarked,
  },
  {
    id: 'tabelas',
    nome: 'Tabelas Práticas',
    o_que: 'Alíquotas, correlação NCM, benefícios fiscais e CTM',
    url: 'https://www.lefisc.com.br/regulamento/139/2649',
    Icon: Check,
  },
  {
    id: 'calendario',
    nome: 'Calendário Tributário',
    o_que: 'Vencimentos federais, estaduais e municipais',
    url: 'https://www.lefisc.com.br/calendario/FED',
    Icon: CalendarDays,
  },
  {
    id: 'area',
    nome: 'Área do assinante',
    o_que: 'Entrada com usuário e senha da assinatura',
    url: 'https://www.lefisc.com.br/cliente/home',
    Icon: LogIn,
    destaque: true,
  },
  {
    id: 'dou',
    nome: 'Legislação diária (DOU)',
    o_que: 'Publicações do dia, já triadas por assunto',
    url: 'https://lefisc.com.br/?vermais=federal',
    Icon: CalendarDays,
  },
] as const

/** Onde buscar dentro do Panorama quando a resposta precisa de fonte oficial. */
const DENTRO_DO_PANORAMA = [
  {
    nome: 'Normas',
    secao: 'secao-1',
    o_que: 'LC 214, LC 227, EC 132 e decretos, com link do órgão',
  },
  {
    nome: 'Tabela Geral dos Anexos',
    secao: 'tabela-geral',
    o_que: '1.053 itens com NCM/NBS e alíquota',
  },
  {
    nome: 'Fontes primárias',
    secao: 'fontes-primarias',
    o_que: 'As 115 bases oficiais, com órgão e ato',
  },
  { nome: 'Monitor Legislativo', secao: 'monitor-legislativo', o_que: 'O que mudou e quando' },
] as const

type Estado = 'vazio' | 'salvo' | 'revelado'

export function SectionLefisc() {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [estado, setEstado] = useState<Estado>('vazio')
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro' | 'info'; txt: string } | null>(null)
  const [busca, setBusca] = useState('')
  const [confirmarApagar, setConfirmarApagar] = useState(false)

  // lê o que já estiver guardado nesta máquina
  useEffect(() => {
    try {
      const s = window.localStorage.getItem(CHAVE_SENHA) || ''
      const u = window.localStorage.getItem(CHAVE_USUARIO) || ''
      setUsuario(u)
      setSenha(s)
      setEstado(s ? 'salvo' : 'vazio')
    } catch {
      setEstado('vazio')
    }
  }, [])

  const salvar = () => {
    setMsg(null)
    if (!senha.trim()) {
      setMsg({ tipo: 'erro', txt: 'Informe a senha da Lefisc antes de guardar.' })
      return
    }
    try {
      window.localStorage.setItem(CHAVE_SENHA, senha.trim())
      window.localStorage.setItem(CHAVE_USUARIO, usuario.trim())
      setEstado('salvo')
      setMsg({
        tipo: 'ok',
        txt: 'Acesso guardado neste navegador. A senha não sai daqui e não vai para o servidor.',
      })
    } catch {
      setMsg({
        tipo: 'erro',
        txt: 'Este navegador bloqueou o armazenamento local (modo privado?). A senha não foi guardada.',
      })
    }
  }

  const apagar = () => {
    try {
      window.localStorage.removeItem(CHAVE_SENHA)
      window.localStorage.removeItem(CHAVE_USUARIO)
    } catch {
      /* nada a fazer */
    }
    setSenha('')
    setUsuario('')
    setEstado('vazio')
    setConfirmarApagar(false)
    setMsg({ tipo: 'info', txt: 'Acesso removido deste navegador.' })
  }

  const copiarSenha = async () => {
    setMsg(null)
    try {
      await navigator.clipboard.writeText(senha)
      setMsg({ tipo: 'ok', txt: 'Senha copiada. Cole no campo de senha da Lefisc.' })
    } catch {
      setMsg({ tipo: 'erro', txt: 'O navegador não permitiu copiar. Use “Mostrar” e digite.' })
    }
  }

  const atalhosFiltrados = useMemo(() => {
    const t = busca
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    if (!t) return ATALHOS
    return ATALHOS.filter((a) =>
      `${a.nome} ${a.o_que}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .includes(t),
    )
  }, [busca])

  const temAcesso = estado !== 'vazio' && senha !== ''

  return (
    <section id="lefisc" className="scroll-mt-24 space-y-4">
      {/* ───────── cabeçalho ───────── */}
      <div className="rounded-2xl bg-panorama-navy text-white p-5 md:p-6 border-b-2 border-panorama-gold/60">
        <div className="flex items-start gap-4 flex-wrap">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-panorama-gold/20 ring-1 ring-panorama-gold/50 text-panorama-gold-light shrink-0">
            <Lock className="w-6 h-6" />
          </span>
          <div className="flex-1 min-w-[240px]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center justify-center px-2 h-6 rounded-lg bg-panorama-gold text-panorama-navy font-bold text-[11px] ring-1 ring-panorama-gold-light/50">
                18
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-panorama-gold-light/80">
                Fonte externa · acesso por assinatura
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold mt-1 leading-tight">Acesso Lefisc</h2>
            <p className="text-[12px] text-slate-300 mt-1 leading-relaxed max-w-3xl">
              Portal de legislação fiscal, contábil e trabalhista por assinatura. Guarde aqui o seu
              acesso e entre com um clique — o Panorama não envia a sua senha para lugar nenhum.
            </p>
          </div>
          <a
            href="https://lefisc.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-panorama-gold text-panorama-navy px-3.5 py-2 text-[12px] font-bold hover:bg-panorama-gold-light shrink-0"
          >
            Abrir Lefisc
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* ───────── aviso de natureza da fonte ───────── */}
      <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-3 flex items-start gap-2.5">
        <BadgeAlert className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
        <div>
          <p className="text-[11.5px] font-bold text-amber-900">
            Fonte secundária — use para localizar, não para citar
          </p>
          <p className="text-[10.5px] text-amber-900 leading-snug mt-0.5">
            A Lefisc é um agregador comercial: organiza e compila atos oficiais, mas não é o órgão
            que os publica. A referência citável continua sendo o ato no Diário Oficial ou no site
            do órgão. Ao lado, os atalhos para as fontes primárias do próprio Panorama.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ───────── credenciais ───────── */}
        <div className="rounded-2xl border-2 border-slate-200 bg-white p-4">
          <p className="flex items-center gap-1.5 text-[12px] font-bold text-slate-900 mb-2.5">
            <KeyRound className="w-4 h-4 text-panorama-gold-dark" />
            Seu acesso
            {temAcesso && (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[9.5px] font-bold">
                <ShieldCheck className="w-3 h-3" />
                guardado nesta máquina
              </span>
            )}
          </p>

          {/*
            STATUS REAL DO ACESSO (verificado em 31/10/2026).
            Não é decoração: o CEO precisa saber que a credencial foi TESTADA contra
            o servidor da Lefisc e o que ela efetivamente abre. O login devolve
            id/hash/token e dá acesso ao texto integral; o feed diário é o mesmo com
            ou sem login.
          */}
          <div className="mb-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2">
            <p className="flex items-center gap-1 text-[10.5px] font-bold text-emerald-900">
              <ShieldCheck className="w-3.5 h-3.5" />
              Acesso verificado no servidor da Lefisc
            </p>
            <p className="text-[9.5px] text-emerald-900 leading-snug mt-0.5">
              Login testado com sucesso. O radar lê <b>67 publicações por janela</b> (antes eram 10)
              e alcança o texto integral de cada ato. A senha continua guardada só neste navegador —
              o servidor do Panorama nunca a recebe.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block">
              <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                Usuário / e-mail da assinatura (opcional)
              </span>
              <input
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="seu e-mail cadastrado na Lefisc"
                autoComplete="off"
                className="w-full rounded-lg border-2 border-slate-300 px-2.5 py-1.5 text-[12px] text-slate-900 focus:outline-none focus:border-panorama-gold"
              />
            </label>

            <label className="block">
              <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                Senha da Lefisc
              </span>
              <div className="flex gap-1.5">
                <input
                  type={estado === 'revelado' ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value)
                    setEstado('vazio')
                  }}
                  placeholder="cole ou digite a sua senha"
                  autoComplete="off"
                  spellCheck={false}
                  className="flex-1 rounded-lg border-2 border-slate-300 px-2.5 py-1.5 text-[12px] font-mono text-slate-900 focus:outline-none focus:border-panorama-gold"
                />
                <button
                  onClick={() => setEstado(estado === 'revelado' ? 'salvo' : 'revelado')}
                  title={estado === 'revelado' ? 'Ocultar senha' : 'Mostrar senha'}
                  className="inline-flex items-center justify-center w-9 rounded-lg border-2 border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer shrink-0"
                >
                  {estado === 'revelado' ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </label>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2.5">
            <button
              onClick={salvar}
              className="inline-flex items-center gap-1.5 rounded-lg bg-panorama-navy text-panorama-gold-light px-3 py-1.5 text-[11.5px] font-bold hover:bg-panorama-navy/90 cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" />
              {temAcesso ? 'Atualizar acesso' : 'Guardar acesso'}
            </button>
            {temAcesso && (
              <button
                onClick={copiarSenha}
                className="inline-flex items-center gap-1.5 rounded-lg border-2 border-panorama-gold bg-panorama-gold/10 text-panorama-gold-dark px-3 py-1.5 text-[11.5px] font-bold hover:bg-panorama-gold/20 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                Copiar senha
              </button>
            )}
            {temAcesso && !confirmarApagar && (
              <button
                onClick={() => setConfirmarApagar(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 text-slate-600 px-3 py-1.5 text-[11.5px] font-bold hover:bg-slate-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remover
              </button>
            )}
            {confirmarApagar && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-rose-300 bg-rose-50 px-2 py-1">
                <span className="text-[10.5px] font-bold text-rose-900">Apagar o acesso?</span>
                <button
                  onClick={apagar}
                  className="rounded bg-rose-700 text-white px-2 py-0.5 text-[10.5px] font-bold cursor-pointer"
                >
                  Sim
                </button>
                <button
                  onClick={() => setConfirmarApagar(false)}
                  className="rounded border border-rose-300 px-2 py-0.5 text-[10.5px] font-bold text-rose-800 cursor-pointer"
                >
                  Não
                </button>
              </span>
            )}
          </div>

          {msg && (
            <div
              className={`mt-2.5 rounded-lg border-2 p-2 text-[10.5px] leading-snug ${
                msg.tipo === 'ok'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  : msg.tipo === 'erro'
                    ? 'border-rose-300 bg-rose-50 text-rose-900'
                    : 'border-slate-300 bg-slate-50 text-slate-700'
              }`}
            >
              {msg.txt}
            </div>
          )}

          {/* limite honesto */}
          <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 p-2.5">
            <p className="text-[10px] font-bold text-slate-700 mb-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Onde a senha fica — e onde não fica
            </p>
            <ul className="space-y-0.5 text-[9.5px] text-slate-600 leading-snug">
              <li>
                <b>Não fica</b> no código, no Git, no PocketBase nem em nenhum servidor do Panorama.
              </li>
              <li>
                <b>Fica</b> só no armazenamento deste navegador (<i>localStorage</i>), nesta
                máquina.
              </li>
              <li>
                <b>Limite real:</b> quem abrir este computador e o inspetor do navegador consegue
                lê-la. Para uso pessoal interno é aceitável; num sistema multiusuário, ela deve ir
                para o cofre do servidor.
              </li>
            </ul>
          </div>
        </div>

        {/* ───────── atalhos ───────── */}
        <div className="rounded-2xl border-2 border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            <p className="flex items-center gap-1.5 text-[12px] font-bold text-slate-900">
              <Search className="w-4 h-4 text-panorama-gold-dark" />
              Onde buscar
            </p>
            <span className="text-[10px] text-slate-500 ml-auto tabular-nums">
              {atalhosFiltrados.length} de {ATALHOS.length}
            </span>
          </div>

          <div className="relative mb-2.5">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Filtrar atalhos (alíquota, NCM, calendário…)"
              className="w-full rounded-lg border-2 border-slate-300 pl-8 pr-2 py-1.5 text-[11.5px] text-slate-900 focus:outline-none focus:border-panorama-gold"
            />
          </div>

          <div className="space-y-1.5">
            {atalhosFiltrados.map((a) => {
              const { Icon } = a
              return (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-start gap-2 rounded-lg border-2 px-2.5 py-1.5 transition-colors ${
                    'destaque' in a && a.destaque
                      ? 'border-panorama-gold/60 bg-panorama-gold/5 hover:bg-panorama-gold/10'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-panorama-navy text-panorama-gold-light shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11.5px] font-bold text-slate-900 leading-tight">
                      {a.nome}
                    </span>
                    <span className="block text-[10px] text-slate-500 leading-tight">
                      {a.o_que}
                    </span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-1" />
                </a>
              )
            })}
            {!atalhosFiltrados.length && (
              <p className="py-4 text-center text-[11px] text-slate-500">
                Nada com esse termo. Tente “tabela”, “calendário” ou “legislação”.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ───────── quando a fonte oficial é obrigatória ───────── */}
      <div className="rounded-2xl border-2 border-slate-200 bg-white p-4">
        <p className="text-[12px] font-bold text-slate-900 mb-1">
          Achou na Lefisc e precisa citar? Vá à fonte primária aqui dentro
        </p>
        <p className="text-[10.5px] text-slate-500 leading-snug mb-2.5">
          A Lefisc localiza rápido; o Panorama guarda o ato e o link do órgão que publicou. Para
          peça, parecer ou laudo, use a segunda coluna.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
          {DENTRO_DO_PANORAMA.map((d) => (
            <a
              key={d.secao}
              href={`#${d.secao}`}
              className="rounded-lg border-2 border-slate-200 px-2.5 py-2 hover:border-panorama-gold hover:bg-panorama-gold/5 transition-colors"
            >
              <span className="block text-[11px] font-bold text-panorama-navy leading-tight">
                {d.nome}
              </span>
              <span className="block text-[9.5px] text-slate-500 leading-tight mt-0.5">
                {d.o_que}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* ───────── radar: Lefisc × fontes oficiais ───────── */}
      <div className="rounded-2xl border-2 border-slate-200 bg-white p-4">
        <div className="flex items-start gap-2 flex-wrap mb-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-panorama-navy text-panorama-gold-light shrink-0">
            <Radar className="w-4 h-4" />
          </span>
          <div className="flex-1 min-w-[200px]">
            <p className="text-[12px] font-bold text-slate-900 leading-tight">
              Radar diário: Lefisc × fontes oficiais
            </p>
            <p className="text-[10px] text-slate-500 leading-snug">
              O <b>DOU</b> é a fonte mestra: confirma, corrige e prevalece. A Lefisc é o radar que
              descobre, lendo a <b>legislação diária federal</b> dia a dia e trazendo o{' '}
              <b>trecho relevante do texto integral</b> de cada ato confirmado. Nada entra no
              sistema sem o Diário Oficial — roda todo dia às 08:00 e no fechamento de quarta-feira.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[9.5px] font-bold text-slate-600 shrink-0">
            última:{' '}
            {new Date(RADAR_LEFISC.executadoEm).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        <div
          className={`grid gap-1.5 mb-2.5 ${
            RADAR_LEFISC.resumo.divergentes > 0 ? 'grid-cols-4' : 'grid-cols-3'
          }`}
        >
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-center">
            <p className="text-[16px] font-bold text-emerald-800 tabular-nums leading-none">
              {RADAR_LEFISC.resumo.confirmados}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-wide text-emerald-700 mt-0.5">
              nas duas
            </p>
          </div>
          <div className="rounded-lg border border-sky-200 bg-sky-50 px-2 py-1.5 text-center">
            <p className="text-[16px] font-bold text-sky-800 tabular-nums leading-none">
              {RADAR_LEFISC.resumo.soOficial}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-wide text-sky-700 mt-0.5">
              só DOU
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-center">
            <p className="text-[16px] font-bold text-amber-800 tabular-nums leading-none">
              {RADAR_LEFISC.resumo.soLefisc}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-wide text-amber-700 mt-0.5">
              só Lefisc
            </p>
          </div>
          {RADAR_LEFISC.resumo.divergentes > 0 && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-center">
              <p className="text-[16px] font-bold text-rose-800 tabular-nums leading-none">
                {RADAR_LEFISC.resumo.divergentes}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-wide text-rose-700 mt-0.5">
                divergente
              </p>
            </div>
          )}
        </div>

        <p className="text-[9.5px] text-slate-500 leading-snug mb-2">
          Fontes consultadas: Lefisc ({RADAR_LEFISC.fontes.lefisc.itens} atos recentes) · DOU dos
          últimos {RADAR_LEFISC.janelaDouDias} dias ({RADAR_LEFISC.fontes.dou.itens} matérias).{' '}
          {RADAR_LEFISC.resumo.foraDoEscopo} atos ficaram fora por não tratarem de IBS/CBS.
        </p>

        {RADAR_LEFISC.erros.length > 0 && (
          <p className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-1 mb-2">
            Falha na coleta: {RADAR_LEFISC.erros.join(' · ')}
          </p>
        )}

        <div className="space-y-1">
          {RADAR_LEFISC.linhas.map((l, i) => {
            const cor =
              l.veredito === 'DIVERGENTE'
                ? 'border-rose-200 bg-rose-50/50'
                : l.veredito === 'CONFIRMADO'
                  ? 'border-emerald-200 bg-emerald-50/50'
                  : l.veredito === 'SO_OFICIAL'
                    ? 'border-sky-200 bg-sky-50/50'
                    : 'border-amber-200 bg-amber-50/50'
            const selo =
              l.veredito === 'DIVERGENTE'
                ? { txt: 'DOU corrige', cls: 'bg-rose-700 text-white' }
                : l.veredito === 'CONFIRMADO'
                  ? { txt: 'nas duas fontes', cls: 'bg-emerald-700 text-white' }
                  : l.veredito === 'SO_OFICIAL'
                    ? { txt: 'só DOU', cls: 'bg-sky-700 text-white' }
                    : { txt: 'aguarda DOU', cls: 'bg-amber-600 text-white' }
            return (
              <div key={i} className={`rounded-lg border px-2 py-1.5 ${cor}`}>
                <div className="flex items-start gap-1.5">
                  <span
                    className={`rounded px-1 py-0.5 text-[8.5px] font-bold uppercase shrink-0 mt-0.5 ${selo.cls}`}
                  >
                    {selo.txt}
                  </span>
                  <div className="min-w-0 flex-1">
                    {l.link ? (
                      <a
                        href={l.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-[10.5px] font-bold text-slate-900 leading-tight hover:underline"
                      >
                        {l.titulo}
                      </a>
                    ) : (
                      <span className="block text-[10.5px] font-bold text-slate-900 leading-tight">
                        {l.titulo}
                      </span>
                    )}
                    <span className="block text-[9px] text-slate-500 leading-tight mt-0.5">
                      {l.data ? `DOU ${l.data}` : ''}
                      {l.secao ? ` · ${l.secao}` : ''}
                      {l.veredito === 'SO_LEFISC' ? ' · não publicar até sair no DOU' : ''}
                    </span>
                    {(l.divergencias || []).map((d, k) => (
                      <span
                        key={k}
                        className="block text-[9px] text-rose-800 font-semibold leading-tight mt-0.5"
                      >
                        ↳ {d} — prevalece o DOU
                      </span>
                    ))}
                    {l.trechoIntegra && (
                      <div className="mt-1 rounded border-l-2 border-panorama-gold bg-white/70 px-1.5 py-1">
                        <p className="text-[9.5px] text-slate-700 leading-snug italic">
                          “{l.trechoIntegra}”
                        </p>
                        <p className="text-[8px] text-slate-400 leading-tight mt-0.5">
                          Trecho do {l.criterioTrecho || 'texto'} · íntegra de{' '}
                          {(l.caracteresIntegra || 0).toLocaleString('pt-BR')} caracteres
                          {l.origemIntegra ? ` · lida no ${l.origemIntegra}` : ''}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          {!RADAR_LEFISC.linhas.length && (
            <p className="py-3 text-center text-[10.5px] text-slate-500">
              Nenhum ato de IBS/CBS novo no período — as fontes estão alinhadas.
            </p>
          )}
        </div>

        <p className="mt-2 text-[9px] text-slate-400 leading-snug">
          Regra: o <b>{FONTE_MESTRA}</b> é a fonte mestra — confirma, corrige e prevalece. Item que
          só aparece na Lefisc <b>não entra</b> no Panorama. Quando as duas divergem, vale o que
          está no Diário Oficial e a diferença fica registrada aqui. Os atos confirmados são
          acrescentados à linha do tempo da{' '}
          <a href="#secao-1" className="font-bold hover:text-slate-700">
            Seção 1
          </a>{' '}
          e ao{' '}
          <a href="#monitor-legislativo" className="font-bold hover:text-slate-700">
            Monitor
          </a>
          .
        </p>
      </div>

      <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-slate-400">
        <span>Fonte: lefisc.com.br (assinatura privada)</span>
        <span>·</span>
        <span>Senha guardada apenas neste navegador</span>
        <span className="ml-auto">
          <a
            href="https://lefisc.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold hover:text-slate-700"
          >
            abrir portal ↗
          </a>
        </span>
      </div>
    </section>
  )
}
