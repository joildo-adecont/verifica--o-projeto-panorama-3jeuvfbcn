import { Scale, Heart, ShieldCheck, ArrowUp } from 'lucide-react'

export function PanoramaFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800 py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <Scale className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">
                Panorama da Reforma Tributária — IBS/CBS
              </span>
              <span className="text-[11px] text-slate-400">
                Iniciativa técnica de acompanhamento da Emenda Constitucional 132 e Leis
                Complementares.
              </span>
            </div>
          </div>

          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors self-end md:self-auto"
          >
            <span>Voltar ao topo</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[11px] leading-relaxed">
          <div>
            <h5 className="font-bold text-slate-200 mb-2 uppercase tracking-wider text-[10px]">
              Coordenação & Atualização
            </h5>
            <p className="text-slate-400">
              Conteúdo curado e revisado sob demanda por <strong>Antonio Joildo</strong>. Rotina de
              monitoramento semanal de atos da Receita Federal e CGIBS.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-slate-200 mb-2 uppercase tracking-wider text-[10px]">
              Estrutura Normativa
            </h5>
            <p className="text-slate-400">
              EC 132/2023 • LC 214/2025 • LC 227/2026 • Decreto 12.955/2026 • Resolução CGIBS 6/2026
              (RIBS).
            </p>
          </div>

          <div>
            <h5 className="font-bold text-slate-200 mb-2 uppercase tracking-wider text-[10px]">
              Aviso Legal
            </h5>
            <p className="text-slate-400">
              Este panorama reúne disposições legais e regulamentares oficiais com fins informativos
              e analíticos. As alíquotas de 2033 são estimativas técnicas até promulgação de
              resolução do Senado.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <span>
            © {new Date().getFullYear()} Panorama da Reforma Tributária. Todos os direitos
            reservados.
          </span>
          <span className="flex items-center gap-1">
            Reconstruído fielmente conforme especificação do Projeto Panorama.
          </span>
        </div>
      </div>
    </footer>
  )
}
