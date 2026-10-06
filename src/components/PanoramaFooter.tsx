import { ArrowUp, Building2, ShieldCheck, Tag } from 'lucide-react'
import { AdecontLogo } from '@/components/AdecontLogo'

export function PanoramaFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="bg-panorama-navy-dark text-slate-400 text-xs border-t-4 border-panorama-gold py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Top bar do Footer com o Logo da ADECONT */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Box do logo ADECONT em fundo claro para máximo contraste e nitidez */}
            <div className="bg-white rounded-xl p-3 shadow-sm inline-flex items-center shrink-0 ring-2 ring-panorama-gold/40">
              <AdecontLogo
                variant="color"
                showTagline={true}
                className="h-14 sm:h-16 w-auto max-w-[240px]"
              />
            </div>
            <div>
              <span className="text-base font-bold text-white block tracking-tight">
                ADECONT — Assessoria Administrativa, Contábil
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">
                Panorama da Reforma Tributária • Publicação técnica especializada IBS / CBS / IS
              </span>
            </div>
          </div>

          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold transition-all hover:-translate-y-px hover:shadow-md self-end md:self-auto border border-panorama-gold/40"
          >
            <span>Voltar ao topo</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-[11px] leading-relaxed">
          <div>
            <h5 className="font-bold text-slate-200 mb-2.5 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-panorama-gold" />
              Institucional ADECONT
            </h5>
            <p className="text-slate-400">
              Assessoria contábil e administrativa especializada em conformidade fiscal,
              planejamento societário e transição tributária para empresas de todos os portes.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-slate-200 mb-2.5 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-panorama-gold" />
              Coordenação Técnica
            </h5>
            <p className="text-slate-400">
              Conteúdo curado pela equipe da <strong>ADECONT Assessoria</strong> com coordenação de{' '}
              <strong>Antonio Joildo</strong>. Rotina contínua de monitoramento de atos da Receita
              Federal e resoluções do CGIBS.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-slate-200 mb-2.5 uppercase tracking-wider text-[10px]">
              Estrutura Normativa
            </h5>
            <p className="text-slate-400">
              EC 132/2023 • LC 214/2025 • LC 227/2026 • Decreto 12.955/2026 • Resoluções CGIBS
              (RIBS). Monitoramento dos impactos no Simples Nacional e Lucro Presumido/Real.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-slate-200 mb-2.5 uppercase tracking-wider text-[10px]">
              Aviso Legal & Direitos
            </h5>
            <p className="text-slate-400">
              Este panorama reúne disposições legais com fins analíticos e de suporte aos clientes
              da ADECONT. As alíquotas de 2033 são estimativas técnicas até promulgação de resolução
              do Senado Federal.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span>
              © {new Date().getFullYear()} ADECONT Assessoria Administrativa, Contábil. Todos os
              direitos reservados.
            </span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span className="inline-flex items-center gap-1 text-slate-400">
              <Tag className="w-3 h-3 text-panorama-gold" />
              <span>Conteúdo revisado em 30/09/2026 — Revisão nº 1 (v0.0.16)</span>
            </span>
          </div>
          <span className="flex items-center gap-2">
            <span>Panorama da Reforma Tributária</span>
            <span>•</span>
            <span className="text-slate-400 font-medium">Publicação Técnica Oficial</span>
          </span>
        </div>
      </div>
    </footer>
  )
}
