import { Landmark } from 'lucide-react'

/** Seção 6D — Serviços Financeiros (LC 214/2025, arts. 182–214). */

const LISTA = [
  'Operações de crédito (captação, repasse, adiantamento, empréstimo, financiamento, desconto de títulos, garantias)',
  'Operações de câmbio',
  'Operações com títulos e valores mobiliários (custódia, corretagem, intermediação, assessor de investimento)',
  'Securitização',
  'Faturização (factoring)',
  'Arrendamento mercantil (leasing), operacional ou financeiro',
  'Administração de consórcio',
  'Gestão e administração de recursos e fundos de investimento',
  'Arranjos de pagamento (instituidores, instituições de pagamento, liquidação antecipada de recebíveis, fidelização)',
  'Entidades administradoras de mercados organizados e depositárias centrais',
  'Operações de seguros (exceto seguros de saúde)',
  'Resseguros',
  'Previdência privada (aberta e fechada)',
  'Capitalização',
  'Intermediação de consórcios, seguros, resseguros, previdência e capitalização',
  'Serviços de ativos virtuais (cripto)',
  'Proteção patrimonial mutualista (LC 227/2026)',
]

const REGRAS = [
  {
    titulo: 'Base de cálculo: receitas com deduções',
    regra:
      'A base é composta das receitas das operações, com as deduções previstas no capítulo (art. 185). Aplica-se à totalidade da contraprestação, independentemente do local da operação (art. 182, p.ú.).',
    base: 'LC 214, arts. 182, p.ú. e 185',
  },
  {
    titulo: 'Deduções nas operações de crédito, câmbio e títulos',
    regra:
      'Deduzem-se: despesas financeiras de captação; despesas de câmbio; perdas com títulos; encargos financeiros de instrumentos de dívida; perdas na recebibilidade de créditos (regras do IR); despesas com assessores/consultores não empregados (art. 192).',
    base: 'LC 214, art. 192',
  },
  {
    titulo: 'Arranjos de pagamento',
    regra:
      'Credenciamento, captura, processamento e liquidação de transações, taxa de desconto, locação de terminais e softwares (art. 214). A relação emissor↔portador segue normas gerais, salvo crédito (art. 214, §2º).',
    base: 'LC 214, art. 214',
  },
  {
    titulo: 'Quem está sujeito',
    regra:
      'Pessoas físicas e jurídicas supervisionadas pelo Banco Central, CVM, Previc ou SUSEP (art. 183) — bancos, seguradoras, administradoras de consórcio, corretoras etc.',
    base: 'LC 214, art. 183',
  },
]

export function SectionFinanceiros() {
  return (
    <section id="financeiros" className="scroll-mt-24 space-y-5">
      <div className="border-b-2 border-panorama-gold/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-panorama-navy text-panorama-gold-light font-bold text-xs ring-1 ring-panorama-gold/50">
            6D
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Serviços financeiros — fluxo de caixa e deduções
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          Regime específico dos serviços financeiros (LC 214/2025, arts. 182–214). Texto extraído da{' '}
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

      <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <Landmark className="w-4 h-4 text-panorama-gold-dark" /> O que são serviços financeiros
          (art. 182) — 17 operações
        </h4>
        <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside leading-relaxed">
          {LISTA.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <p className="text-[11px] font-mono text-slate-500">LC 214, art. 182</p>
      </div>

      <div className="space-y-3">
        {REGRAS.map((r) => (
          <div
            key={r.titulo}
            className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5"
          >
            <h4 className="text-sm font-bold text-slate-900">{r.titulo}</h4>
            <p className="text-xs text-slate-700 leading-relaxed">{r.regra}</p>
            <p className="text-[11px] font-mono text-slate-500">{r.base}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
