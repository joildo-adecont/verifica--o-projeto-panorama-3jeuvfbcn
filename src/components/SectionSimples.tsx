import { Percent } from 'lucide-react'

/** Seção 6E — Simples Nacional (LC 123, art. 13-A; LC 214, arts. 343–347 e 444). */

const REGRAS = [
  {
    titulo: 'IBS dentro do DAS',
    regra:
      'O IBS é recolhido no Simples Nacional (DAS) para empresas com receita até R$ 3,6 milhões/ano (LC 123, art. 13-A, incluído pela LC 214). A CBS não entra no DAS — segue apuração própria.',
    base: 'LC 123, art. 13-A; LC 214',
  },
  {
    titulo: 'Alíquotas de teste na transição — 2026',
    regra:
      'Fatos geradores de 2026: IBS estadual 0,1% (arrecadação integral para o CGIBS e o Fundo de Compensação, sem repartição normal) e CBS 0,9%, com compensação com PIS/Cofins (arts. 343 e 346).',
    base: 'LC 214, arts. 343 e 346',
  },
  {
    titulo: 'Alíquotas de teste — 2027 a 2028',
    regra:
      'IBS estadual 0,05% + municipal 0,05% e CBS reduzida em 0,1 p.p. da alíquota fixada (arts. 344 e 347). As alíquotas aplicam-se aos regimes específicos observadas as respectivas bases de cálculo (art. 344, p.ú., II).',
    base: 'LC 214, arts. 344 e 347',
  },
  {
    titulo: 'Opção e janelas',
    regra:
      'A opção pelo regime de recolhimento do IBS no Simples segue as janelas da LC 123 (setembro, efeitos no ano seguinte). Resoluções CGSN 190–192/2026 regulamentam.',
    base: 'LC 123; Res. CGSN 190–192/2026',
  },
  {
    titulo: 'NF obrigatória com destaque',
    regra:
      'O optante deve emitir documento fiscal eletrônico com destaque do IBS/CBS nas operações — condição para o adquirente apropriar crédito.',
    base: 'LC 214 (sistemática); Res. CGSN',
  },
  {
    titulo: 'Crédito presumido de importação',
    regra:
      'Contribuinte habilitado sujeito ao regime regular ou ao Simples Nacional tem crédito presumido de IBS relativo à importação (arts. 444 e 462).',
    base: 'LC 214, arts. 444 e 462',
  },
]

export function SectionSimples() {
  return (
    <section id="simples" className="scroll-mt-24 space-y-5">
      <div className="border-b-2 border-panorama-gold/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-panorama-navy text-panorama-gold-light font-bold text-xs ring-1 ring-panorama-gold/50">
            6E
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Simples Nacional — IBS no DAS e transição
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          Regime do Simples Nacional (LC 123, art. 13-A; LC 214/2025, arts. 343–347 e 444; Res. CGSN
          190–192/2026). Texto extraído da{' '}
          <a
            href="https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold text-panorama-navy"
          >
            LC 214 compilada do Planalto
          </a>{' '}
          (conferido em 04/10/2026).
        </p>
      </div>

      <div className="space-y-3">
        {REGRAS.map((r) => (
          <div
            key={r.titulo}
            className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5"
          >
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-blue-600" /> {r.titulo}
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed">{r.regra}</p>
            <p className="text-[11px] font-mono text-slate-500">{r.base}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
