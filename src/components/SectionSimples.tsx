import { useState } from 'react'
import { Calculator } from 'lucide-react'

const SIM_URL = '/simulador.html'

/** Seção 6E — Simples Nacional (LC 123, art. 13-A; LC 214, arts. 343–347 e 444).
 *  Layout de tabela uniformizado com a Seção 6A. IBS e CBS recolhidos no DAS (art. 343). */

const TRANSICAO = [
  {
    titulo: 'Alíquotas de teste — 2026',
    badge: '2026',
    detalhe:
      'Fatos geradores de 2026: IBS estadual 0,1% (arrecadação integral para o CGIBS e o Fundo de Compensação, sem repartição normal) e CBS 0,9%, compensável com PIS/Cofins (arts. 344 e 346).',
    base: 'LC 214, arts. 344 e 346',
  },
  {
    titulo: 'Alíquotas de teste — 2027 a 2028',
    badge: '2027–2028',
    detalhe:
      'IBS estadual 0,05% + municipal 0,05% (total 0,1%) e CBS com alíquota reduzida em 0,1 p.p. da alíquota fixada (arts. 344 e 347). As alíquotas aplicam-se aos regimes específicos observadas as respectivas bases de cálculo (art. 344, p.ú., II).',
    base: 'LC 214, arts. 344 e 347',
  },
  {
    titulo: 'Pleno regime — 2029 em diante',
    badge: '2029+',
    detalhe:
      'A partir de 2029, o IBS entra na fase de alíquotas plenas (10% → 40% → 100% da referência). O optante pelo Simples recolhe o IBS no DAS com a alíquota efetiva do seu anexo, acrescida da CBS.',
    base: 'LC 214 (sistemática); LC 123, art. 13-A',
  },
]

const REGRAS = [
  {
    titulo: 'IBS e CBS dentro do DAS',
    badge: 'DAS único',
    detalhe:
      'Os valores relativos ao IBS e à CBS devidos pelos optantes pelo Simples Nacional são recolhidos por meio de documento único de arrecadação (DAS), nos termos fixados pelo Comitê Gestor (LC 214, art. 343). Abrange empresas com receita até R$ 3,6 milhões/ano (LC 123, art. 13-A, incluído pela LC 214).',
    base: 'LC 214, art. 343; LC 123, art. 13-A',
  },
  {
    titulo: 'Opção e janelas',
    badge: 'Opção',
    detalhe:
      'A opção pelo regime de recolhimento do IBS no Simples segue as janelas da LC 123 (setembro, efeitos no ano seguinte). Resoluções CGSN 190–192/2026 regulamentam.',
    base: 'LC 123; Res. CGSN 190–192/2026',
  },
  {
    titulo: 'NF obrigatória com destaque',
    badge: 'Destaque',
    detalhe:
      'O optante deve emitir documento fiscal eletrônico com destaque do IBS/CBS nas operações — condição para o adquirente apropriar crédito.',
    base: 'LC 214 (sistemática); Res. CGSN',
  },
  {
    titulo: 'Crédito presumido de importação',
    badge: 'Crédito',
    detalhe:
      'Contribuinte habilitado sujeito ao regime regular ou ao Simples Nacional tem crédito presumido de IBS relativo à importação (arts. 444 e 462).',
    base: 'LC 214, arts. 444 e 462',
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

function Tabela({
  linhas,
}: {
  linhas: { titulo: string; badge: string; detalhe: string; base: string; sim?: string }[]
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
            <th className="py-3 px-4">Operação</th>
            <th className="py-3 px-3 w-32">Redução</th>
            <th className="py-3 px-4">Detalhe</th>
            <th className="py-3 px-3 w-44">Base legal</th>
            <th className="py-3 px-3 w-24">Simular</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {linhas.map((o) => (
            <tr key={o.titulo} className="hover:bg-slate-50/70 align-top">
              <td className="py-3 px-4 font-semibold text-slate-900">{o.titulo}</td>
              <td className="py-3 px-3">
                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {o.badge}
                </span>
              </td>
              <td className="py-3 px-4 text-slate-700 leading-relaxed">{o.detalhe}</td>
              <td className="py-3 px-3 text-slate-600 text-xs font-mono">{o.base}</td>
              <td className="py-3 px-3">
                {o.sim ? (
                  <a
                    href={`${SIM_URL}?q=${encodeURIComponent(o.sim)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-panorama-navy hover:text-panorama-gold-dark"
                  >
                    <Calculator className="w-3 h-3" /> Simular
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-300">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SectionSimples() {
  const [tab, setTab] = useState<'transicao' | 'regras'>('transicao')

  return (
    <section id="simples" className="scroll-mt-24 space-y-5">
      <div className="border-b-2 border-panorama-gold/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-panorama-navy text-panorama-gold-light font-bold text-xs ring-1 ring-panorama-gold/50">
            6E
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Simples Nacional — IBS e CBS no DAS e transição
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

      {/* Abas */}
      <div className="flex flex-wrap gap-1.5">
        <AbaButton ativo={tab === 'transicao'} onClick={() => setTab('transicao')}>
          📅 Transição (2026–2029+)
        </AbaButton>
        <AbaButton ativo={tab === 'regras'} onClick={() => setTab('regras')}>
          📋 Regras do regime
        </AbaButton>
      </div>

      {tab === 'transicao' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-lg bg-panorama-gold/10 border border-panorama-gold/50 text-sm text-slate-800">
            <strong>Regra central (art. 343):</strong> o <strong>IBS e a CBS</strong> devidos pelos
            optantes do Simples são recolhidos juntos no <strong>DAS</strong> (documento único), com
            alíquotas de teste na transição — 0,1% + 0,9% (2026), 0,1% + CBS −0,1 p.p. (2027–2028) e
            alíquotas plenas a partir de 2029.
          </div>
          <Tabela linhas={TRANSICAO} />
        </div>
      )}

      {tab === 'regras' && (
        <div className="space-y-3">
          <Tabela linhas={REGRAS} />
          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
            ⚠️ Sem documento fiscal com destaque do IBS/CBS, o adquirente não apropria crédito —
            exigência central para os optantes do Simples na transição.
          </div>
        </div>
      )}
    </section>
  )
}
