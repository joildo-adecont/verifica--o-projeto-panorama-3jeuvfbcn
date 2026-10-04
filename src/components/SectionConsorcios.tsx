import { useState } from 'react'
import { Calculator, Handshake, KeyRound, Percent, ShieldCheck } from 'lucide-react'

const SIM_URL = '/simulador.html'

/** Seção 6C — Consórcios (LC 214/2025, arts. 204–206).
 *  Texto extraído da LC 214 compilada do Planalto (conferido em 04/10/2026). */

const TAXA = [
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

const CARTA = [
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
]

const GARANTIAS = [
  {
    titulo: 'Execução de garantia fiduciária',
    regra:
      'A consolidação da propriedade do bem pelo grupo NÃO sofre incidência (art. 204, §3º, I). Na alienação pelo grupo: sem incidência se o consorciado não for contribuinte; com incidência nas mesmas regras do consorciado, se contribuinte (§3º, II). O adquirente recebe as mesmas regras (§3º, III).',
    base: 'LC 214, art. 204, §3º',
  },
]

function AbaButton({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors cursor-pointer ${
        ativo
          ? 'bg-panorama-navy text-panorama-gold-light border-panorama-navy'
          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  )
}

export function SectionConsorcios() {
  const [tab, setTab] = useState<'taxa' | 'carta' | 'garantias'>('taxa')

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

      {/* Abas */}
      <div className="flex flex-wrap gap-1.5">
        <AbaButton ativo={tab === 'taxa'} onClick={() => setTab('taxa')}>
          🤝 Taxa de administração
        </AbaButton>
        <AbaButton ativo={tab === 'carta'} onClick={() => setTab('carta')}>
          💳 Carta de crédito
        </AbaButton>
        <AbaButton ativo={tab === 'garantias'} onClick={() => setTab('garantias')}>
          🛡️ Garantias
        </AbaButton>
      </div>

      {tab === 'taxa' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-lg bg-panorama-gold/10 border border-panorama-gold/50 text-sm text-slate-800">
            <strong>Regra central (art. 204):</strong> a administradora tributa apenas a{' '}
            <strong>taxa de administração</strong>, em regime de caixa — a contemplação não é fato
            gerador.
          </div>
          {TAXA.map((p) => (
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
      )}

      {tab === 'carta' && (
        <div className="space-y-3">
          {CARTA.map((p) => (
            <div
              key={p.titulo}
              className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5"
            >
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-panorama-gold-dark" /> {p.titulo}
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">{p.regra}</p>
              <p className="text-[11px] font-mono text-slate-500">{p.base}</p>
            </div>
          ))}
          <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm">
            ℹ️ Imóvel adquirido com carta segue o{' '}
            <a href="#regime-imobiliario" className="underline font-semibold">
              regime imobiliário (6A)
            </a>
            ; bens com regime diferenciado seguem o respectivo capítulo.
          </div>
        </div>
      )}

      {tab === 'garantias' && (
        <div className="space-y-3">
          {GARANTIAS.map((p) => (
            <div
              key={p.titulo}
              className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5"
            >
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-panorama-gold-dark" /> {p.titulo}
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">{p.regra}</p>
              <p className="text-[11px] font-mono text-slate-500">{p.base}</p>
            </div>
          ))}
          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
            ⚠️ A consolidação da propriedade em favor do grupo (garantia fiduciária) não é fato
            gerador — a incidência só ocorre na alienação posterior, nas regras do consorciado.
          </div>
        </div>
      )}
    </section>
  )
}
