import { useState } from 'react'
import { Building2, Calculator, Home, Landmark, KeyRound, TrendingDown } from 'lucide-react'

const SIM_URL = '/simulador.html'

/** Seção 6A — Regime Imobiliário (LC 214/2025, arts. 252–261 e 485–488).
 *  Fontes extraídas do texto compilado do Planalto (conferido em 04/10/2026). */

const OPERACOES = [
  {
    titulo: 'Venda (alienação) de imóvel residencial novo',
    reducao: '−50%',
    detalhe:
      'Redutor social de R$ 100 mil por imóvel, deduzido da base de cálculo (uma única vez por imóvel, atualizado pelo IPCA).',
    base: 'LC 214, arts. 261 e 259',
    sim: 'venda de imóvel residencial novo',
  },
  {
    titulo: 'Venda (alienação) de imóvel usado',
    reducao: '−50%',
    detalhe:
      'Redutor de ajuste: valor de aquisição do imóvel corrigido pelo IPCA é deduzido da base de cálculo (arts. 257–258).',
    base: 'LC 214, arts. 261, 257–258',
    sim: 'venda de imóvel usado',
  },
  {
    titulo: 'Venda de lote residencial (parcelamento de solo)',
    reducao: '−50%',
    detalhe: 'Redutor social de R$ 30 mil por lote (uma única vez, atualizado pelo IPCA).',
    base: 'LC 214, arts. 261 e 259',
    sim: 'lote residencial',
  },
  {
    titulo: 'Locação residencial',
    reducao: '−70%',
    detalhe: 'Redutor social de R$ 600/mês por imóvel, deduzido da base (atualizado pelo IPCA).',
    base: 'LC 214, art. 261, p.ú. e art. 260',
    sim: 'locação residencial',
  },
  {
    titulo: 'Locação comercial/industrial (não residencial)',
    reducao: '−70%',
    detalhe: 'Sem redutor social — apenas a redução de 70% da alíquota.',
    base: 'LC 214, art. 261, p.ú.',
    sim: 'locação não residencial',
  },
  {
    titulo: 'Intermediação imobiliária (corretagem)',
    reducao: '−50%',
    detalhe:
      'Cada corretor responde pelo IBS/CBS da própria remuneração; valores pagos diretamente pelos contratantes ficam fora da base.',
    base: 'LC 214, arts. 261 e 255, §3º',
    sim: 'intermediação',
  },
  {
    titulo: 'Construção civil por encomenda',
    reducao: '−50%',
    detalhe: 'Fato gerador no fornecimento (art. 254, V).',
    base: 'LC 214, art. 261',
    sim: 'construção civil',
  },
]

const RET = [
  {
    titulo: 'RET — patrimônio de afetação (Lei 10.931, arts. 4 e 8)',
    aliquota: '2,08% da receita mensal recebida',
    detalhe:
      'Opcão para incorporação com patrimônio de afetação, com pedido efetivado antes de 01/01/2029. Afasta as demais formas de incidência sobre a incorporação.',
    base: 'LC 214, art. 485, I',
  },
  {
    titulo: 'RET especial (Lei 10.931, art. 4, §6º/§8º e art. 8, p.ú.)',
    aliquota: '0,53% da receita mensal recebida',
    detalhe: 'Mesmas condições de opção e prazo (antes de 01/01/2029).',
    base: 'LC 214, art. 485, II',
  },
]

const PERMUTAS = [
  {
    titulo: 'Permuta entre contribuintes do regime regular',
    regra:
      'Sem incidência sobre o valor permutado (exceto a torna). O redutor de ajuste do imável dado em permuta é mantido e pode ser usado no imóvel recebido; na permuta para entrega de unidades a construir, aplica-se proporcionalmente à fração ideal.',
    base: 'LC 214, art. 252, §2º, I e §5º',
  },
  {
    titulo: 'Permuta entre contribuinte regular e não contribuinte',
    regra:
      'Não se constitui redutor de ajuste para o imóvel recebido pelo não contribuinte. Para o contribuinte regular: sem torna, mantém-se o redutor; com torna paga por ele, soma-se a torna; com torna recebida, deduz-se (sem ficar negativo).',
    base: 'LC 214, art. 252, §5-A (LC 227/2026)',
  },
  {
    titulo: 'Outras não incidências',
    regra:
      'Constituição/transmissão de direitos reais de garantia (hipoteca etc.) e operações de fundo patrimonial (Lei 13.800/2019). Servidão, cessão de uso e direito de passagem seguem as regras de locação.',
    base: 'LC 214, art. 252, §1º–§2º',
  },
]

export function SectionRegimeImobiliario() {
  const [tab, setTab] = useState<'operacoes' | 'ret' | 'permutas'>('operacoes')

  return (
    <section id="regime-imobiliario" className="scroll-mt-24 space-y-5">
      <div className="border-b-2 border-panorama-gold/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-panorama-navy text-panorama-gold-light font-bold text-xs ring-1 ring-panorama-gold/50">
            6A
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Regime imobiliário — venda, locação, redutores e RET
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          Regime específico das operações com bens imóveis (LC 214/2025, arts. 252–261 e 485–488).
          Texto extraído da{' '}
          <a
            href="https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold text-panorama-navy"
          >
            LC 214 compilada do Planalto
          </a>{' '}
          (conferido em 04/10/2026). Simulável no{' '}
          <a
            href={`${SIM_URL}?q=imobiliario`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold text-panorama-navy"
          >
            Simulador de Transição
          </a>{' '}
          (grupo 🏠 Imobiliário).
        </p>
      </div>

      {/* Abas */}
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ['operacoes', 'Operações e reduções'],
            ['ret', 'RET — incorporação'],
            ['permutas', 'Permutas e não incidências'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors cursor-pointer ${
              tab === k
                ? 'bg-panorama-navy text-panorama-gold-light border-panorama-navy'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'operacoes' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-lg bg-panorama-gold/10 border border-panorama-gold/50 text-sm text-slate-800">
            <strong>Regra central (art. 261):</strong> as alíquotas do IBS/CBS das operações deste
            capítulo ficam reduzidas em <strong>50%</strong>; locação, cessão onerosa e arrendamento
            ficam reduzidas em <strong>70%</strong>.
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                  <th className="py-3 px-4">Operação</th>
                  <th className="py-3 px-3 w-20">Redução</th>
                  <th className="py-3 px-4">Detalhe</th>
                  <th className="py-3 px-3 w-44">Base legal</th>
                  <th className="py-3 px-3 w-32">Simular</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {OPERACOES.map((o) => (
                  <tr key={o.titulo} className="hover:bg-slate-50/70 align-top">
                    <td className="py-3 px-4 font-semibold text-slate-900">{o.titulo}</td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {o.reducao}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 leading-relaxed">{o.detalhe}</td>
                    <td className="py-3 px-3 text-slate-600 text-xs font-mono">{o.base}</td>
                    <td className="py-3 px-3">
                      <a
                        href={`${SIM_URL}?q=${encodeURIComponent(o.sim)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-panorama-navy hover:text-panorama-gold-dark"
                      >
                        <Calculator className="w-3 h-3" /> Simular
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
            ⚠️ <strong>Fato gerador (art. 254):</strong> na alienação, no ato do contrato (inclusive
            promessa com pagamento); na locação e intermediação, em <strong>cada pagamento</strong>.
          </div>
        </div>
      )}

      {tab === 'ret' && (
        <div className="space-y-3">
          {RET.map((r) => (
            <div
              key={r.titulo}
              className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5"
            >
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-panorama-gold-dark" /> {r.titulo}
                </h4>
                <span className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold bg-panorama-navy text-panorama-gold-light">
                  {r.aliquota}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{r.detalhe}</p>
              <p className="text-[11px] font-mono text-slate-500">{r.base}</p>
            </div>
          ))}
          <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm">
            ℹ️ A opção pelo RET <strong>afasta</strong> qualquer outra forma de incidência de
            IBS/CBS sobre a incorporação (art. 485, §1º). Prazo: pedido efetivado{' '}
            <strong>antes de 01/01/2029</strong>.
          </div>
        </div>
      )}

      {tab === 'permutas' && (
        <div className="space-y-3">
          {PERMUTAS.map((p) => (
            <div
              key={p.titulo}
              className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5"
            >
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-panorama-gold-dark" /> {p.titulo}
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">{p.regra}</p>
              <p className="text-[11px] font-mono text-slate-500">{p.base}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
