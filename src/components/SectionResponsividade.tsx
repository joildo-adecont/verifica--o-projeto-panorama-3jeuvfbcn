import { useState, useEffect, useCallback } from 'react'
import {
  Smartphone,
  ScanSearch,
  Wand2,
  AlertTriangle,
  CheckCircle2,
  Copy,
  RefreshCw,
  Mail,
  MessageCircle,
} from 'lucide-react'

/**
 * Seção 17 — Responsividade em Celulares
 * Modelo do CEO: "uma roupa de tecido elástico que veste bem tanto uma pessoa
 * pequena quanto uma grande, sem rasgar nem ficar frouxa."
 * - AUDITORIA AO VIVO: roda no aparelho e mede botões, imagens e textos.
 * - OTIMIZAÇÃO: aplica correções seguras (tecido elástico) no ato.
 * - RELATÓRIO DE ERRO: indica o MODELO DO APARELHO e a PARTE QUE ENTORTOU,
 *   com botões de copiar/enviar (WhatsApp/e-mail) para o suporte.
 */

interface Achado {
  tipo: string
  parte: string
  detalhe: string
  severidade: 'ALTA' | 'MÉDIA' | 'BAIXA'
}

interface InfoAparelho {
  modelo: string
  tela: string
  densidade: string
  navegador: string
}

const PB_URL = 'https://verificacao-projeto-panorama-18549.shrd00.internal.goskip.dev'

function infoDoAparelho(): InfoAparelho {
  const ua = navigator.userAgent
  let modelo = 'Desktop/Desconhecido'
  const mAndroid = ua.match(/Android[^;)]*;\s*([^;)]+)(?:\)|;)/)
  if (mAndroid) modelo = mAndroid[1].trim()
  else if (/iPhone/.test(ua)) modelo = 'iPhone'
  else if (/iPad/.test(ua)) modelo = 'iPad'
  else if (/Windows/.test(ua)) modelo = 'PC Windows'
  else if (/Macintosh/.test(ua)) modelo = 'Mac'
  const nav = /Edg\//.test(ua)
    ? 'Edge'
    : /Chrome/.test(ua)
      ? 'Chrome'
      : /Firefox/.test(ua)
        ? 'Firefox'
        : /Safari/.test(ua)
          ? 'Safari'
          : 'Navegador'
  return {
    modelo,
    tela: `${window.innerWidth}×${window.innerHeight} px`,
    densidade: `${window.devicePixelRatio || 1}x`,
    navegador: nav,
  }
}

function descrever(el: Element): string {
  const tag = el.tagName.toLowerCase()
  const txt = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 34)
  const id = el.id ? `#${el.id}` : ''
  const cls = typeof el.className === 'string' ? el.className.split(' ').slice(0, 2).join('.') : ''
  return `${tag}${id}${cls ? '.' + cls : ''}${txt ? ` "${txt}…"` : ''}`
}

export function SectionResponsividade() {
  const [achados, setAchados] = useState<Achado[]>([])
  const [aparelho, setAparelho] = useState<InfoAparelho | null>(null)
  const [auditando, setAuditando] = useState(false)
  const [otimizado, setOtimizado] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const auditar = useCallback(() => {
    setAuditando(true)
    setAparelho(infoDoAparelho())
    const lista: Achado[] = []
    const vw = window.innerWidth
    // 1. Overflow horizontal da página (a "roupa rasgando")
    if (document.documentElement.scrollWidth > vw + 2) {
      lista.push({
        tipo: 'Página',
        parte: 'largura da página',
        detalhe: `A página mede ${document.documentElement.scrollWidth}px numa tela de ${vw}px — sobra rolagem lateral.`,
        severidade: 'ALTA',
      })
    }
    // 2. Elementos que estouram a tela (exclui rolagem interna por design)
    const vistos = new Set<string>()
    document.querySelectorAll('body *').forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.width < 40) return
      const s = getComputedStyle(el)
      if (s.overflowX === 'auto' || s.overflowX === 'scroll') return
      if (r.right > vw + 4 || r.left < -4) {
        const chave = descrever(el)
        if (vistos.has(chave)) return
        vistos.add(chave)
        if (lista.length < 24)
          lista.push({
            tipo: 'Estouro',
            parte: descrever(el),
            detalhe: `Passa ${Math.round(Math.max(r.right - vw, -r.left))}px da borda ${r.right > vw ? 'direita' : 'esquerda'} (largura ${Math.round(r.width)}px).`,
            severidade: r.width > vw * 0.9 ? 'ALTA' : 'MÉDIA',
          })
      }
    })
    // 3. Botões/links pequenos demais para o dedo (alvo de toque < 40px)
    if (vw < 820) {
      const vistosT = new Set<string>()
      document.querySelectorAll('button, a, [role="button"], input, select').forEach((el) => {
        const r = el.getBoundingClientRect()
        if (r.width < 10 || r.height < 10) return
        if (r.top < 0 || r.top > window.innerHeight) return // fora da tela
        if (r.height < 40) {
          const chave = descrever(el)
          if (vistosT.has(chave)) return
          vistosT.add(chave)
          if (lista.length < 24)
            lista.push({
              tipo: 'Toque',
              parte: descrever(el),
              detalhe: `Altura de ${Math.round(r.height)}px — abaixo dos 40px recomendados para o dedo.`,
              severidade: 'MÉDIA',
            })
        }
      })
    }
    // 4. Imagens sem limite de largura (podem rasgar a tela)
    document.querySelectorAll('img').forEach((img) => {
      const s = getComputedStyle(img)
      if (s.maxWidth === 'none' && img.naturalWidth > vw) {
        if (lista.length < 24)
          lista.push({
            tipo: 'Imagem',
            parte: descrever(img),
            detalhe: `Sem limite de largura (natural ${img.naturalWidth}px > tela ${vw}px).`,
            severidade: 'BAIXA',
          })
      }
    })
    // 5. Textos minúsculos ilegíveis
    if (vw < 820) {
      const vistosF = new Set<string>()
      document.querySelectorAll('main *').forEach((el) => {
        if (el.children.length > 0) return
        const txt = (el.textContent || '').trim()
        if (txt.length < 6) return
        const fs = parseFloat(getComputedStyle(el).fontSize)
        if (fs < 11) {
          const chave = descrever(el)
          if (vistosF.has(chave)) return
          vistosF.add(chave)
          if (lista.length < 24)
            lista.push({
              tipo: 'Texto',
              parte: descrever(el),
              detalhe: `Fonte de ${fs.toFixed(1)}px — muito pequena para ler no celular.`,
              severidade: 'BAIXA',
            })
        }
      })
    }
    setAchados(lista)
    setAuditando(false)
    setMsg(
      lista.length === 0
        ? '✅ Nenhum problema encontrado — a roupa vestiu bem nesta tela.'
        : `🔎 ${lista.length} ${lista.length === 1 ? 'ponto examinado' : 'pontos examinados'} — veja a lista abaixo.`,
    )
  }, [])

  const otimizar = () => {
    // "Tecido elástico": correções seguras aplicadas no ato
    const style = document.createElement('style')
    style.id = 'responsividade-otimizacao'
    style.textContent = `
      img, video, svg { max-width: 100%; height: auto; }
      body { overflow-x: hidden; }
      table { max-width: 100%; }
      pre, code { white-space: pre-wrap; word-break: break-word; }
    `
    document.head.appendChild(style)
    setOtimizado(true)
    setMsg('🧵 Otimização aplicada (tecido elástico). Rode a auditoria de novo para conferir.')
    setTimeout(auditar, 300)
  }

  useEffect(() => {
    auditar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const relatorio = () => {
    const a = aparelho || infoDoAparelho()
    const linhas = [
      '📐 RELATÓRIO DE RESPONSIVIDADE — Panorama ADECONT',
      `📱 Aparelho: ${a.modelo}`,
      `🖥️ Tela: ${a.tela} · densidade ${a.densidade} · ${a.navegador}`,
      `🕒 Quando: ${new Date().toLocaleString('pt-BR')}`,
      '',
      ...achados.map(
        (x, i) => `${i + 1}. [${x.severidade}] ${x.tipo} — ${x.parte}\n   ${x.detalhe}`,
      ),
      achados.length === 0 ? 'Nenhum erro visual encontrado.' : '',
    ]
    return linhas.join('\n')
  }

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(relatorio())
      setMsg('📋 Relatório copiado — cole onde precisar.')
    } catch {
      setMsg('Não foi possível copiar automaticamente.')
    }
  }

  const porSeveridade = (s: string) => achados.filter((a) => a.severidade === s).length

  return (
    <section id="responsividade-celulares" className="scroll-mt-24">
      {/* Cabeçalho navy + dourado (identidade ADECONT) */}
      <div className="rounded-2xl bg-panorama-navy text-white p-6 md:p-8 border-b-2 border-panorama-gold/60">
        <div className="flex items-start gap-4">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-panorama-gold/20 ring-1 ring-panorama-gold/50 text-panorama-gold-light shrink-0">
            <Smartphone className="w-6 h-6" />
          </span>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-panorama-gold text-panorama-navy font-bold text-sm ring-1 ring-panorama-gold-light/50">
                17
              </span>
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
                Responsividade em Celulares
              </h2>
            </div>
            <p className="mt-2 text-sm text-slate-300 max-w-3xl leading-relaxed">
              Garante que os <b>botões, imagens e textos</b> se encaixem perfeitamente em telas
              pequenas sem quebrar ou sumir — como uma <b>roupa de tecido elástico</b> que veste bem
              uma pessoa pequena ou uma grande, sem rasgar nem ficar frouxa. Qualquer erro visual é
              informado com o <b>modelo do aparelho</b> e a <b>parte que entortou</b>.
            </p>
          </div>
        </div>
      </div>

      {/* Painel do aparelho + ações */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Aparelho</p>
            <p className="text-sm font-bold text-slate-800 mt-1">
              {aparelho?.modelo || 'detectando…'}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Tela</p>
            <p className="text-sm font-bold text-slate-800 mt-1">{aparelho?.tela || '—'}</p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Densidade
            </p>
            <p className="text-sm font-bold text-slate-800 mt-1">{aparelho?.densidade || '—'}</p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Navegador
            </p>
            <p className="text-sm font-bold text-slate-800 mt-1">{aparelho?.navegador || '—'}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={auditar}
            disabled={auditando}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-panorama-navy text-white text-sm font-bold hover:bg-panorama-navy-light disabled:opacity-50"
          >
            <ScanSearch className={`w-4 h-4 ${auditando ? 'animate-pulse' : ''}`} /> Auditar esta
            tela
          </button>
          <button
            onClick={otimizar}
            disabled={otimizado}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-700 text-white text-sm font-bold hover:bg-emerald-800 disabled:opacity-50"
            title="Aplica correções seguras de encaixe"
          >
            <Wand2 className="w-4 h-4" /> {otimizado ? 'Otimizado ✓' : 'Otimizar agora'}
          </button>
          <button
            onClick={copiar}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50"
          >
            <Copy className="w-4 h-4" /> Copiar relatório
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(relatorio().slice(0, 1500))}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 text-sm font-bold hover:bg-emerald-100"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
          <a
            href={`mailto:joildo@adecont.com.br?subject=${encodeURIComponent('Relatório de responsividade — Panorama')}&body=${encodeURIComponent(relatorio())}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-800 text-sm font-bold hover:bg-blue-100"
          >
            <Mail className="w-4 h-4" /> Enviar por e-mail
          </a>
        </div>
        {msg && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-blue-50 text-blue-900 text-[13px]">
            {msg}
          </div>
        )}
      </div>

      {/* Resumo por severidade */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-center">
          <p className="text-2xl font-extrabold text-rose-700">{porSeveridade('ALTA')}</p>
          <p className="text-[11px] font-bold uppercase tracking-wide text-rose-600">
            🔴 Rasgou (alta)
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
          <p className="text-2xl font-extrabold text-amber-700">{porSeveridade('MÉDIA')}</p>
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-600">
            🟠 Apertado (média)
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
          <p className="text-2xl font-extrabold text-emerald-700">{porSeveridade('BAIXA')}</p>
          <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-600">
            🟢 Frouxo (baixa)
          </p>
        </div>
      </div>

      {/* Lista de achados */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 bg-panorama-navy border-b-2 border-panorama-gold/60 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-panorama-gold-light" />
            O que entortou nesta tela
          </h3>
          <button
            onClick={auditar}
            disabled={auditando}
            className="p-1.5 rounded-lg border border-white/30 text-white hover:bg-white/10 disabled:opacity-50"
            title="Reauditar"
          >
            <RefreshCw className={`w-4 h-4 ${auditando ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {achados.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="mt-2 text-sm font-semibold text-emerald-800">
              Nada entortou — tudo se encaixa nesta tela.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              A auditoria roda de novo a cada clique em “Auditar esta tela”.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {achados.map((a, i) => (
              <li key={i} className="px-4 py-3 flex items-start gap-3">
                <span
                  className={`shrink-0 mt-0.5 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    a.severidade === 'ALTA'
                      ? 'bg-rose-100 text-rose-800'
                      : a.severidade === 'MÉDIA'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {a.severidade}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-slate-800">
                    {a.tipo} — <span className="font-mono text-xs">{a.parte}</span>
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">{a.detalhe}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Rodapé do modelo */}
      <p className="mt-4 text-[11px] text-slate-500 leading-relaxed">
        Modelo definido pelo CEO Antonio Joildo (05/10/2026): a responsividade é como uma{' '}
        <b>roupa de tecido elástico</b> — veste bem telas de qualquer tamanho sem rasgar (conteúdo
        estourando) nem ficar frouxa (espaço desperdiçado). A auditoria mede a tela REAL do
        aparelho: página, elementos que estouram, alvos de toque, imagens e fontes. O relatório traz{' '}
        <b>modelo do aparelho + parte que entortou</b> e pode ser copiado ou enviado direto ao
        suporte (WhatsApp/e-mail). A otimização aplica somente correções seguras (imagens limitadas,
        sem rolagem lateral, tabelas contidas) — nada é apagado.
      </p>
    </section>
  )
}
