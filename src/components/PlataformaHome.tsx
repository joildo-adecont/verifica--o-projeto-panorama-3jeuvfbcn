import { useState, useMemo } from 'react'
import {
  Scale,
  Percent,
  Calculator,
  Building2,
  ArrowRight,
  Sparkles,
  Bot,
  Layers,
  Search,
  ShieldCheck,
  FileText,
  TrendingUp,
  BrainCircuit,
  Eye,
  CheckCircle2,
  PackageCheck,
} from 'lucide-react'
import { AdecontLogo } from '@/components/AdecontLogo'
import { SEGMENTOS_SISTEMA } from '@/components/navegacao'

export function PlataformaHome() {
  const [busca, setBusca] = useState('')

  const navegarPara = (href: string) => {
    window.location.hash = href
  }

  const segmentosFiltrados = useMemo(() => {
    if (!busca.trim()) return SEGMENTOS_SISTEMA
    const t = busca.toLowerCase().trim()
    return SEGMENTOS_SISTEMA.map((seg) => {
      const itensEncontrados = seg.itens.filter(
        (i) =>
          i.label.toLowerCase().includes(t) ||
          i.descricao.toLowerCase().includes(t) ||
          i.tags.some((tag) => tag.toLowerCase().includes(t)),
      )
      const combinaSegmento =
        seg.nome.toLowerCase().includes(t) ||
        seg.descricao.toLowerCase().includes(t) ||
        seg.agenteNome.toLowerCase().includes(t)

      return {
        ...seg,
        itens: combinaSegmento && !itensEncontrados.length ? seg.itens : itensEncontrados,
        visivel: combinaSegmento || itensEncontrados.length > 0,
      }
    }).filter((s) => s.visivel)
  }, [busca])

  return (
    <div className="space-y-6 pb-12">
      {/* ── BANNER INSTITUCIONAL DE ENTRADA DO SISTEMA COM O TÍTULO EXATO DO USUÁRIO ── */}
      <div className="rounded-2xl border-2 border-panorama-gold/80 bg-gradient-to-r from-slate-900 via-panorama-navy to-slate-900 p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-panorama-gold text-panorama-navy shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                Portal Unificado Panorama
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-amber-200 border border-white/20">
                4 Segmentos Estruturados
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Agentes Especialistas Nativos
              </span>
            </div>

            {/* Título EXATO exigido pelo usuário */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white uppercase leading-tight font-serif">
              PLATAFORMA JURIDICA, TRIBUTÁRIA, CONTABIL E ADMINISTRATIVA
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Ambiente integrado de inteligência, conformidade e governança da <b>ADECONT</b>.
              Apresenta os panoramas completos e consolidados das quatro áreas do sistema, com
              identificação rápida, pesquisa setorial, hierarquia de menus e agentes especialistas
              nativos dedicados a cada segmento para impedir conflitos de informação e duplicidade.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 shrink-0 flex flex-col items-center justify-center self-start lg:self-auto min-w-[220px]">
            <AdecontLogo variant="white" className="h-12 w-auto mb-2" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-200 text-center">
              Assessoria Contábil e Administrativa
            </span>
          </div>
        </div>
      </div>

      {/* ── BARRA DE PESQUISA RÁPIDA E SEGMENTAÇÃO ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar em todas as áreas (ex.: split payment, imunidades, SPED, clientes, NCM, alíquotas)..."
              className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-panorama-navy bg-slate-50 focus:bg-white transition-all"
            />
            {busca && (
              <button
                onClick={() => setBusca('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              onClick={() => navegarPara('#busca-avancada')}
              className="px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              Busca Avançada
            </button>
            <button
              onClick={() => navegarPara('#instalador-versao')}
              className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-panorama-navy text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-amber-400/40"
            >
              <PackageCheck className="w-3.5 h-3.5 text-amber-400" />
              #1 CEO Instalador
            </button>
          </div>
        </div>
      </div>

      {/* ── OS QUATRO GRANDES CARDS PANORAMA: UM POR ÁREA DO SISTEMA ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">
            Panoramas das 4 Áreas do Sistema
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Clique em um card para explorar a área e acessar seu menu
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {segmentosFiltrados.map((seg) => {
            const { Icon } = seg
            return (
              <div
                key={seg.id}
                className={`rounded-2xl border-2 ${seg.borda} bg-white shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group`}
              >
                {/* Cabeçalho do Card da Área */}
                <div className={`p-5 ${seg.bg} border-b ${seg.borda}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex items-center justify-center w-12 h-12 rounded-xl border-2 ${seg.borda} bg-white shadow-xs ${seg.cor}`}
                      >
                        <Icon className="w-6 h-6" />
                      </span>
                      <div>
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider ${seg.cor} block`}
                        >
                          Segmento Oficial
                        </span>
                        <h3 className="text-lg font-black text-slate-900 leading-tight">
                          {seg.nome}
                        </h3>
                      </div>
                    </div>

                    <button
                      onClick={() => navegarPara(seg.hrefAgente)}
                      className={`px-2.5 py-1.5 rounded-lg bg-white border ${seg.borda} text-[11px] font-bold ${seg.cor} hover:bg-slate-50 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0`}
                      title={`Conversar com o ${seg.agenteNome}`}
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>{seg.agenteNome}</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">{seg.descricao}</p>
                </div>

                {/* Lista de Seções do Segmento */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                      Seções deste segmento ({seg.itens.length}):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {seg.itens.slice(0, 6).map((item) => {
                        const ItemIcon = item.Icon
                        return (
                          <button
                            key={item.href}
                            onClick={() => navegarPara(item.href)}
                            className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-left transition-colors cursor-pointer group/item"
                          >
                            <span
                              className={`p-1.5 rounded-md border text-slate-700 bg-slate-50 border-slate-200 group-hover/item:border-panorama-gold`}
                            >
                              <ItemIcon className="w-3.5 h-3.5" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <span className="text-[11.5px] font-bold text-slate-800 block truncate group-hover/item:text-panorama-navy">
                                {item.label}
                              </span>
                              {item.numero && (
                                <span className="text-[9.5px] font-mono text-slate-400 block leading-none">
                                  Seção {item.numero}
                                </span>
                              )}
                            </div>
                            <ArrowRight className="w-3 h-3 text-slate-300 group-hover/item:text-slate-600 transition-transform group-hover/item:translate-x-0.5 shrink-0" />
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Ação rápida para o Agente e para a Primeira Seção */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => navegarPara(seg.hrefAgente)}
                      className={`text-xs font-bold ${seg.cor} hover:underline flex items-center gap-1 cursor-pointer`}
                    >
                      <Bot className="w-3.5 h-3.5" />
                      Abrir tela do {seg.agenteNome} →
                    </button>

                    <button
                      onClick={() => navegarPara(seg.itens[0]?.href || seg.hrefAgente)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-panorama-navy text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      Acessar Seções
                      <ArrowRight className="w-3 h-3 text-amber-300" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── MATRIZ DE DESTAQUES RÁPIDOS ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-panorama-navy" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Atalhos Rápidos entre os Segmentos
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Acesso direto sem duplicidade de rotas</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => navegarPara('#agente-juridico')}
            className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/50 text-left transition-all cursor-pointer space-y-1"
          >
            <span className="text-[10px] font-bold uppercase text-indigo-700 block">Jurídico</span>
            <span className="text-xs font-black text-slate-900 block">Consultor de Normas</span>
            <span className="text-[10.5px] text-slate-500 block">Segurança jurídica e leis</span>
          </button>

          <button
            onClick={() => navegarPara('#diagnostico-tributario')}
            className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50 text-left transition-all cursor-pointer space-y-1"
          >
            <span className="text-[10px] font-bold uppercase text-emerald-700 block">
              Tributário
            </span>
            <span className="text-xs font-black text-slate-900 block">Diagnóstico Tributário</span>
            <span className="text-[10.5px] text-slate-500 block">Pareceres e debate CEO</span>
          </button>

          <button
            onClick={() => navegarPara('#agente-contabil')}
            className="p-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/50 text-left transition-all cursor-pointer space-y-1"
          >
            <span className="text-[10px] font-bold uppercase text-blue-700 block">Contábil</span>
            <span className="text-xs font-black text-slate-900 block">Lançamentos IBS/CBS</span>
            <span className="text-[10.5px] text-slate-500 block">Plano de contas e DRE</span>
          </button>

          <button
            onClick={() => navegarPara('#cadastro-envios')}
            className="p-3 rounded-xl border border-sky-200 bg-sky-50/50 hover:bg-sky-100/50 text-left transition-all cursor-pointer space-y-1"
          >
            <span className="text-[10px] font-bold uppercase text-sky-700 block">
              Administrativo
            </span>
            <span className="text-xs font-black text-slate-900 block">Cadastro & Envios</span>
            <span className="text-[10.5px] text-slate-500 block">Seção 9A CRM e envios</span>
          </button>
        </div>
      </div>
    </div>
  )
}
