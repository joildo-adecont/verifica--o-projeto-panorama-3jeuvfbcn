import { useState, useMemo } from 'react'
import { X, Search, ChevronRight, Menu } from 'lucide-react'
import { GRUPOS, ITEM_INSTALADOR_CEO, SEGMENTOS_SISTEMA } from '@/components/navegacao'
import { AdecontLogo } from '@/components/AdecontLogo'

interface PanoramaSideMenuProps {
  isOpen?: boolean
  onClose?: () => void
  hashAtivo?: string
}

export function PanoramaSideMenu({
  isOpen: isOpenProp,
  onClose: onCloseProp,
  hashAtivo: hashAtivoProp,
}: PanoramaSideMenuProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [busca, setBusca] = useState('')
  const [segmentoFiltro, setSegmentoFiltro] = useState<string | null>(null)

  const isControlled = typeof isOpenProp === 'boolean'
  const isOpen = isControlled ? isOpenProp : internalOpen

  const handleClose = () => {
    if (onCloseProp) onCloseProp()
    setInternalOpen(false)
  }

  const hashAtual = hashAtivoProp ?? (typeof window !== 'undefined' ? window.location.hash : '')

  // Filtro de itens pela busca e/ou segmento
  const gruposFiltrados = useMemo(() => {
    return GRUPOS.map((grupo) => {
      // Se há filtro por segmento e o grupo for de outro segmento, oculta (exceto CEO)
      if (segmentoFiltro && grupo.segmentoKey && grupo.segmentoKey !== segmentoFiltro) {
        return null
      }

      if (!busca.trim()) return grupo

      const termo = busca.toLowerCase().trim()
      const itens = grupo.itens.filter(
        (item) =>
          item.label.toLowerCase().includes(termo) ||
          item.curto.toLowerCase().includes(termo) ||
          item.descricao.toLowerCase().includes(termo) ||
          item.tags.some((tag) => tag.toLowerCase().includes(termo)),
      )

      if (itens.length === 0) return null
      return { ...grupo, itens }
    }).filter(Boolean) as typeof GRUPOS
  }, [busca, segmentoFiltro])

  const totalResultados = gruposFiltrados.reduce((acc, g) => acc + g.itens.length, 0)

  const ehAtivo = (href: string) => {
    if (href === '#inicio') return !hashAtual || hashAtual === '#inicio'
    return hashAtual === href
  }

  const handleNavegar = (href: string) => {
    window.location.hash = href
    handleClose()
  }

  return (
    <>
      {/* ── DESKTOP: barra fixa à esquerda (restaurada em 03/11/2026) ──
       * O menu tinha virado SÓ gaveta: no desktop ele não existia e o único
       * caminho era o botão flutuante "Menu Plataforma". O CEO relatou que os
       * atalhos "não respondiam" — as teclas funcionavam, mas o menu não
       * aparecia, então parecia quebrado. Agora: barra fixa a partir de 1024px
       * e gaveta abaixo disso. */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-slate-200 z-40 flex-col shadow-sm border-t-2 border-t-panorama-gold/60"
        aria-label="Menu de Navegação da Plataforma ADECONT"
      >
        {/* Cabeçalho do menu */}
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-panorama-navy to-slate-900 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <AdecontLogo variant="white" className="h-8 w-auto shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300 block truncate">
                Plataforma 4 Áreas
              </span>
              <span className="text-xs font-black tracking-tight text-white block truncate">
                Jurídica · Tributária · Contábil · Adm
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── #1 CEO NO TOPO DO MENU COM BADGE EXCLUSIVO (REGRA PERMANENTE) ── */}
        <div className="p-3 bg-gradient-to-r from-amber-50 via-amber-100/50 to-blue-50 border-b-2 border-amber-300">
          <button
            onClick={() => handleNavegar(ITEM_INSTALADOR_CEO.href)}
            className="w-full p-2.5 rounded-xl bg-white border-2 border-amber-400 hover:border-amber-500 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3 text-left cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
                #1
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 truncate">
                    {ITEM_INSTALADOR_CEO.label}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase tracking-wider bg-slate-950 text-amber-300 shrink-0">
                    #1 CEO
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 line-clamp-1">
                  Envios de instalação e controle de versões do programa
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>
        </div>

        {/* ── BOTÕES DE SEGMENTAÇÃO RÁPIDA (4 ÁREAS) ── */}
        <div className="px-3 pt-2.5 pb-2 bg-slate-50 border-b border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">
            <span>Segmentos Oficiais:</span>
            {segmentoFiltro && (
              <button
                onClick={() => setSegmentoFiltro(null)}
                className="text-amber-700 hover:underline font-semibold cursor-pointer"
              >
                Ver todos
              </button>
            )}
          </div>
          <div className="grid grid-cols-4 gap-1">
            {SEGMENTOS_SISTEMA.map((seg) => {
              const ativo = segmentoFiltro === seg.id
              return (
                <button
                  key={seg.id}
                  onClick={() => setSegmentoFiltro(ativo ? null : seg.id)}
                  className={`px-1.5 py-1.5 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer border ${
                    ativo
                      ? 'bg-slate-900 text-amber-300 border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                  title={seg.nome}
                >
                  <span className="block truncate">{seg.nome.replace('Segmento ', '')}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Campo de busca do menu */}
        <div className="p-3 border-b border-slate-200 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Filtrar por nome, tema ou palavra-chave..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-panorama-navy bg-slate-50 focus:bg-white transition-colors"
            />
            {busca && (
              <button
                onClick={() => setBusca('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Lista de seções / hierarquia */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Item Página Inicial da Plataforma */}
          {!busca && !segmentoFiltro && (
            <button
              onClick={() => handleNavegar('#inicio')}
              className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                ehAtivo('#inicio')
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200/70 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    ehAtivo('#inicio') ? 'bg-amber-400 text-slate-950' : 'bg-white text-slate-700'
                  }`}
                >
                  0
                </span>
                <div className="min-w-0">
                  <span className="text-xs font-black block truncate">
                    Plataforma Inicial (4 Panoramas)
                  </span>
                  <span
                    className={`text-[10.5px] block truncate ${
                      ehAtivo('#inicio') ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    Portal Jurídico, Tributário, Contábil e Administrativo
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0 text-slate-400" />
            </button>
          )}

          {/* Grupos organizados por segmento */}
          {gruposFiltrados.map((grupo) => {
            const GroupIcon = grupo.Icon
            return (
              <div key={grupo.id} className="space-y-1.5">
                <div className="flex items-center gap-2 px-1">
                  <span
                    className={`flex items-center justify-center w-5 h-5 rounded-md ${grupo.bg} ${grupo.cor}`}
                  >
                    <GroupIcon className="w-3.5 h-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 block truncate">
                      {grupo.nome}
                    </span>
                    <span className="text-[9.5px] text-slate-400 block truncate">
                      {grupo.proposito}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{grupo.itens.length}</span>
                </div>

                <div className="space-y-1 pl-1">
                  {grupo.itens.map((item) => {
                    const ItemIcon = item.Icon
                    const ativo = ehAtivo(item.href)
                    const isCeo = item.href === '#instalador-versao'
                    const isDiagnostico = item.href === '#diagnostico-tributario'
                    const isAgente = item.href.startsWith('#agente-')

                    return (
                      <button
                        key={item.href}
                        onClick={() => handleNavegar(item.href)}
                        className={`w-full p-2 rounded-xl text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer border ${
                          ativo
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : isAgente
                              ? 'bg-indigo-50/50 hover:bg-indigo-100/60 border-indigo-200 text-slate-800'
                              : isDiagnostico
                                ? 'bg-amber-50/60 hover:bg-amber-100/70 border-amber-300 text-slate-800 font-bold'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        {/* gap-1.5 e p-1 (era gap-2 e p-1.5): com o rótulo de
                            "Recursos Humanos" o texto pedia 111px e recebia 105px,
                            e o menu mostrava "Recursos Humana" — cortado, com
                            reticências. Os 6px liberados aqui devolvem o nome
                            inteiro sem mexer no tamanho da fonte. */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`p-1 rounded-lg border text-xs shrink-0 ${
                              ativo
                                ? 'bg-white/10 border-white/20 text-amber-300'
                                : `${item.bg} ${item.borda} ${item.cor}`
                            }`}
                          >
                            <ItemIcon className="w-3.5 h-3.5" />
                          </span>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-xs font-bold truncate ${
                                  ativo ? 'text-white' : 'text-slate-800'
                                }`}
                              >
                                {item.label}
                              </span>
                              {isCeo && (
                                <span className="px-1 py-0.2 rounded text-[9px] font-black bg-amber-400 text-slate-950 uppercase shrink-0">
                                  #1 CEO
                                </span>
                              )}
                              {isAgente && (
                                <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-indigo-200 text-indigo-900 uppercase shrink-0">
                                  Agente
                                </span>
                              )}
                            </div>
                            <span
                              className={`text-[10px] block truncate ${
                                ativo ? 'text-slate-300' : 'text-slate-400'
                              }`}
                            >
                              {item.descricao}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {item.numero && (
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                ativo ? 'bg-white/10 text-slate-200' : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {item.numero}
                            </span>
                          )}
                          <ChevronRight
                            className={`w-3.5 h-3.5 ${ativo ? 'text-amber-300' : 'text-slate-300'}`}
                          />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {gruposFiltrados.length === 0 && (
            <div className="p-8 text-center space-y-2">
              <p className="text-xs font-bold text-slate-600">Nenhuma seção encontrada</p>
              <p className="text-[11px] text-slate-400">
                Tente outro termo ou limpe o filtro por segmento.
              </p>
              <button
                onClick={() => {
                  setBusca('')
                  setSegmentoFiltro(null)
                }}
                className="mt-2 text-xs font-bold text-amber-700 hover:underline cursor-pointer"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>

        {/* Rodapé do menu */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
          <span>{totalResultados} seções e ferramentas</span>
          <span className="font-semibold text-slate-700">ADECONT Institucional</span>
        </div>
      </aside>

      {/* Botão flutuante para abrir menu no desktop e mobile se não estiver controlado */}
      {!isControlled && !isOpen && (
        <button
          onClick={() => setInternalOpen(true)}
          className="lg:hidden fixed bottom-5 left-5 z-40 px-3.5 py-2.5 rounded-xl bg-slate-900 text-amber-300 shadow-xl border-2 border-amber-400/80 hover:bg-panorama-navy flex items-center gap-2 text-xs font-bold cursor-pointer transition-all hover:scale-105"
          title="Abrir Menu da Plataforma (4 Segmentos)"
        >
          <Menu className="w-4 h-4 text-amber-400" />
          <span>Menu Plataforma</span>
        </button>
      )}

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 transition-opacity"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Gaveta lateral */}
          <aside
            className="fixed top-0 left-0 bottom-0 w-full sm:w-[420px] bg-white z-50 shadow-2xl flex flex-col border-r border-slate-200 animate-in slide-in-from-left duration-200"
            role="dialog"
            aria-label="Menu de Navegação da Plataforma ADECONT"
          >
            {/* Cabeçalho do menu */}
            <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-panorama-navy to-slate-900 text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <AdecontLogo variant="white" className="h-8 w-auto shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300 block truncate">
                    Plataforma 4 Áreas
                  </span>
                  <span className="text-xs font-black tracking-tight text-white block truncate">
                    Jurídica · Tributária · Contábil · Adm
                  </span>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── #1 CEO NO TOPO DO MENU COM BADGE EXCLUSIVO (REGRA PERMANENTE) ── */}
            <div className="p-3 bg-gradient-to-r from-amber-50 via-amber-100/50 to-blue-50 border-b-2 border-amber-300">
              <button
                onClick={() => handleNavegar(ITEM_INSTALADOR_CEO.href)}
                className="w-full p-2.5 rounded-xl bg-white border-2 border-amber-400 hover:border-amber-500 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3 text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
                    #1
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 truncate">
                        {ITEM_INSTALADOR_CEO.label}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase tracking-wider bg-slate-950 text-amber-300 shrink-0">
                        #1 CEO
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 line-clamp-1">
                      Envios de instalação e controle de versões do programa
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            </div>

            {/* ── BOTÕES DE SEGMENTAÇÃO RÁPIDA (4 ÁREAS) ── */}
            <div className="px-3 pt-2.5 pb-2 bg-slate-50 border-b border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">
                <span>Segmentos Oficiais:</span>
                {segmentoFiltro && (
                  <button
                    onClick={() => setSegmentoFiltro(null)}
                    className="text-amber-700 hover:underline font-semibold cursor-pointer"
                  >
                    Ver todos
                  </button>
                )}
              </div>
              {/* grid-cols-2 e não 4: com 4 colunas cada chip ficava com 51px e o
                  rótulo era cortado ("Reforma Tribut…", "Plataforma Juríd…"), o que
                  na prática escondia o nome da plataforma. Com 2 colunas cabem os
                  nomes inteiros, já sem o prefixo "Plataforma". */}
              <div className="grid grid-cols-2 gap-1">
                {SEGMENTOS_SISTEMA.map((seg) => {
                  const ativo = segmentoFiltro === seg.id
                  return (
                    <button
                      key={seg.id}
                      onClick={() => setSegmentoFiltro(ativo ? null : seg.id)}
                      className={`px-1.5 py-1.5 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer border ${
                        ativo
                          ? 'bg-slate-900 text-amber-300 border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                      title={seg.nome}
                    >
                      <span className="block truncate">
                        {seg.nome.replace('Plataforma ', '').replace('Segmento ', '')}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Campo de busca do menu */}
            <div className="p-3 border-b border-slate-200 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Filtrar por nome, tema ou palavra-chave..."
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-panorama-navy bg-slate-50 focus:bg-white transition-colors"
                />
                {busca && (
                  <button
                    onClick={() => setBusca('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Lista de seções / hierarquia */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Item Página Inicial da Plataforma */}
              {!busca && !segmentoFiltro && (
                <button
                  onClick={() => handleNavegar('#inicio')}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    ehAtivo('#inicio')
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200/70 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        ehAtivo('#inicio')
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-white text-slate-700'
                      }`}
                    >
                      0
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-black block truncate">
                        Plataforma Inicial (4 Panoramas)
                      </span>
                      <span
                        className={`text-[10.5px] block truncate ${
                          ehAtivo('#inicio') ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        Portal Jurídico, Tributário, Contábil e Administrativo
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0 text-slate-400" />
                </button>
              )}

              {/* Grupos organizados por segmento */}
              {gruposFiltrados.map((grupo) => {
                const GroupIcon = grupo.Icon
                return (
                  <div key={grupo.id} className="space-y-1.5">
                    <div className="flex items-center gap-2 px-1">
                      <span
                        className={`flex items-center justify-center w-5 h-5 rounded-md ${grupo.bg} ${grupo.cor}`}
                      >
                        <GroupIcon className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 block truncate">
                          {grupo.nome}
                        </span>
                        <span className="text-[9.5px] text-slate-400 block truncate">
                          {grupo.proposito}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">
                        {grupo.itens.length}
                      </span>
                    </div>

                    <div className="space-y-1 pl-1">
                      {grupo.itens.map((item) => {
                        const ItemIcon = item.Icon
                        const ativo = ehAtivo(item.href)
                        const isCeo = item.href === '#instalador-versao'
                        const isDiagnostico = item.href === '#diagnostico-tributario'
                        const isAgente = item.href.startsWith('#agente-')

                        return (
                          <button
                            key={item.href}
                            onClick={() => handleNavegar(item.href)}
                            className={`w-full p-2 rounded-xl text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer border ${
                              ativo
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                : isAgente
                                  ? 'bg-indigo-50/50 hover:bg-indigo-100/60 border-indigo-200 text-slate-800'
                                  : isDiagnostico
                                    ? 'bg-amber-50/60 hover:bg-amber-100/70 border-amber-300 text-slate-800 font-bold'
                                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`p-1.5 rounded-lg border text-xs shrink-0 ${
                                  ativo
                                    ? 'bg-white/10 border-white/20 text-amber-300'
                                    : `${item.bg} ${item.borda} ${item.cor}`
                                }`}
                              >
                                <ItemIcon className="w-3.5 h-3.5" />
                              </span>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`text-xs font-bold truncate ${
                                      ativo ? 'text-white' : 'text-slate-800'
                                    }`}
                                  >
                                    {item.label}
                                  </span>
                                  {isCeo && (
                                    <span className="px-1 py-0.2 rounded text-[9px] font-black bg-amber-400 text-slate-950 uppercase shrink-0">
                                      #1 CEO
                                    </span>
                                  )}
                                  {isAgente && (
                                    <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-indigo-200 text-indigo-900 uppercase shrink-0">
                                      Agente
                                    </span>
                                  )}
                                </div>
                                <span
                                  className={`text-[10px] block truncate ${
                                    ativo ? 'text-slate-300' : 'text-slate-400'
                                  }`}
                                >
                                  {item.descricao}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {item.numero && (
                                <span
                                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                    ativo
                                      ? 'bg-white/10 text-slate-200'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {item.numero}
                                </span>
                              )}
                              <ChevronRight
                                className={`w-3.5 h-3.5 ${
                                  ativo ? 'text-amber-300' : 'text-slate-300'
                                }`}
                              />
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {gruposFiltrados.length === 0 && (
                <div className="p-8 text-center space-y-2">
                  <p className="text-xs font-bold text-slate-600">Nenhuma seção encontrada</p>
                  <p className="text-[11px] text-slate-400">
                    Tente outro termo ou limpe o filtro por segmento.
                  </p>
                  <button
                    onClick={() => {
                      setBusca('')
                      setSegmentoFiltro(null)
                    }}
                    className="mt-2 text-xs font-bold text-amber-700 hover:underline cursor-pointer"
                  >
                    Limpar filtros
                  </button>
                </div>
              )}
            </div>

            {/* Rodapé do menu */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
              <span>{totalResultados} seções e ferramentas</span>
              <span className="font-semibold text-slate-700">ADECONT Institucional</span>
            </div>
          </aside>
        </>
      )}
    </>
  )
}
