import { Handshake } from 'lucide-react'

const SIM_URL = '/simulador.html'

/** Seção 6C — Consórcios (LC 214/2025, arts. 204–206). */

const PONTOS = [
  {
    titulo: 'Taxa de administração — regime de caixa',
    regra:
      'A base de cálculo compreende todas as tarifas, comissões e taxas, bem como encargos, multas e juros do contrato de participação, efetivamente pagos — regime de caixa (art. 204).',
    base: 'LC 214, art. 204',
  },
  {
    titulo: 'Dedução da intermediação',
    regra:
      'A administradora pode deduzir da base de cálculo os valores referentes aos serviços de intermediação (art. 204, §1º).',
    base: 'LC 214, art. 204, §1º',
  },
  {
    titulo: 'Uso da carta de crédito',
    regra:
      'A aquisição com carta de crédito segue as normas gerais de incidência — exceto imóvel (regime imobiliário) e bens/servios com regime diferenciado. A administradora NÃO responde pelos tributos da aquisição (art. 204, §2º).',
    base: 'LC 214, art. 204, §2º',
  },
  {
    titulo: 'Contemplação não é fato gerador',
    regra:
      'O tributo é devido apenas na aquisição do bem com a carta — o sorteio ou lance em si não gera fato gerador (consequência do regime de caixa da taxa).',
    base: 'LC 214, art. 204 (sistemática)',
  },
  {
    titulo: 'Execução de garantia fiduciária',
    regra:
      'A consolidação da propriedade do bem pelo grupo NÃO sofre incidência (art. 204, §3º, I). Na alienação pelo grupo: sem incidência se o consorciado não for contribuinte; com incidência nas mesmas regras do consorciado, se contribuinte (§3º, II). O adquirente recebe as mesmas regras (§3º, III).',
    base: 'LC 214, art. 204, §3º',
  },
  {
    titulo: 'Crédito da taxa de administração',
    regra:
      'O contribuinte do regime regular que paga a taxa de administração apropria créditos do IBS/CBS com base nos valores pagos pelo fornecedor sobre esses serviços (art. 205).',
    base: 'LC 214, art. 205',
  },
  {
    titulo: 'Intermediação de consórcios',
    regra:
      'Os serviços de intermediação de consórcios (corretoras etc.) sujeitam-se à incidência sobre o valor da operação pela mesma alíquota aplicável à taxa de administração (art. 206).',
    base: 'LC 214, art. 206',
  },
]

export function SectionConsorcios() {
  return (
    <section id="consorcios" className="scroll-mt-24 space-y-5">
      <div className="border-b-2 border-panorama-gold/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-panorama-navy text-panorama-gold-light font-bold text-xs ring-1 ring-panorama-gold/50">
            6C
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Consórcios — taxa de administração, carta de crédito e garantias
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          Regime específico da administração de consórcios (LC 214/2025, arts. 204–206). Texto
          extraído da{' '}
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

      <div className="p-3.5 rounded-lg bg-panorama-gold/10 border border-panorama-gold/50 text-sm text-slate-800">
        <strong>Resumo:</strong> a administradora tributa apenas a taxa de administração (regime de
        caixa, com dedução da intermediação); a contemplação não é fato gerador; a carta de crédito
        segue as normas gerais; a execução de garantia não sofre incidência na consolidação.
      </div>

      <div className="space-y-3">
        {PONTOS.map((p) => (
          <div
            key={p.titulo}
            className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5"
          >
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Handshake className="w-4 h-4 text-panorama-gold-dark" /> {p.titulo}
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed">{p.regra}</p>
            <p className="text-[11px] font-mono text-slate-500">{p.base}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
