import { Percent, Clock, CheckCircle2 } from 'lucide-react'

export function SectionIsencoesAlíquotas() {
  const reducoes = [
    {
      setor: 'Cesta Básica Nacional',
      reducao: '100% (alíquota zero)',
      aliquotaEfetiva: '0%',
      destaque: true,
    },
    {
      setor:
        'Saúde, educação, dispositivos médicos, alimentos saudáveis, insumos agro, transporte público, produtos agropecuários, bens de democratização',
      reducao: '60%',
      aliquotaEfetiva: '≈ 7,1% (IBS+CBS)',
      destaque: false,
    },
    {
      setor: 'Profissionais liberais de saúde e educação',
      reducao: '60% via crédito presumido',
      aliquotaEfetiva: '—',
      destaque: false,
    },
    {
      setor: 'Profissionais de segurança, intelectuais, artistas, atletas',
      reducao: '30–50% (crédito presumido)',
      aliquotaEfetiva: '—',
      destaque: false,
    },
    {
      setor: 'Regime favorecido das alíquotas reduzidas',
      reducao: 'Opção por crédito presumido em vez de reduzir alíquotas na nota',
      aliquotaEfetiva: '—',
      destaque: false,
    },
  ]

  const diferimentos = [
    {
      hipotese: 'Regime especial de incorporação imobiliária (RET)',
      regra: 'Tributação em cada pagamento recebido (regime caixa) — não no ato do contrato',
      dispositivo: 'Arts. 485–488, LC 214',
    },
    {
      hipotese: 'Consórcio — aquisição do bem',
      regra: 'Tributo no fornecimento do bem (uso da carta), não nas parcelas mensais',
      dispositivo: 'Art. 204, LC 214',
    },
    {
      hipotese: 'Bens do ativo não circulante',
      regra: 'Regras de creditamento diferido nas aquisições de bens de capital',
      dispositivo: 'LC 214, arts. 51 e ss.',
    },
    {
      hipotese: 'Suspensões na importação',
      regra:
        'Retorno de bens enviados em consignação, devolução por defeito, reparo etc. — suspensão até 31/12/2040',
      dispositivo: 'Art. 66, §8º, LC 214',
    },
    {
      hipotese: 'Regimes aduaneiros especiais',
      regra: 'Drawback, entreposto, admissão temporária etc.',
      dispositivo: 'LC 214, Seção IV',
    },
  ]

  const isencoes = [
    {
      hipotese:
        'Recolhimento do IBS/CBS dispensado em 2026 para quem cumpre obrigações acessórias (ano-teste)',
      dispositivo: 'Art. 348, §1º, LC 214',
    },
    {
      hipotese: 'Compensação do IBS/CBS-teste com PIS/Cofins em 2026',
      dispositivo: 'Arts. 343–346, LC 214',
    },
    {
      hipotese:
        'Isenções subnacionais existentes (convênios ICMS) mantidas na transição, conforme cronograma (efeitos até 2032, salvo prorrogação)',
      dispositivo: 'LC 214, Livro III',
    },
  ]

  return (
    <section id="secao-5" className="scroll-mt-24 space-y-6">
      <div className="border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-xs">
            5
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Isenções, diferimentos e reduções de alíquota
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Sistemática de incentivos, hipóteses de diferimento no fluxo de caixa e alíquotas
          favorecidas.
        </p>
      </div>

      {/* Reduções de alíquota */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Percent className="w-4 h-4 text-blue-600" />
          Reduções de alíquota (art. 148, LC 214/2025)
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-semibold">
                <th className="py-3 px-4">Setor</th>
                <th className="py-3 px-4 w-72">Redução</th>
                <th className="py-3 px-4 w-52">Alíquota efetiva estimada (2033)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reducoes.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 align-top font-medium text-slate-900">{item.setor}</td>
                  <td className="py-3 px-4 align-top">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        item.destaque
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {item.reducao}
                    </span>
                  </td>
                  <td className="py-3 px-4 align-top font-bold text-slate-800">
                    {item.aliquotaEfetiva}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diferimentos */}
      <div className="space-y-3 pt-2">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          Diferimentos (adiamento da incidência)
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-semibold">
                <th className="py-3 px-4 w-72">Hipótese</th>
                <th className="py-3 px-4">Regra</th>
                <th className="py-3 px-4 w-44">Dispositivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {diferimentos.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 align-top font-bold text-slate-900">{item.hipotese}</td>
                  <td className="py-3 px-4 align-top text-slate-700 leading-relaxed">
                    {item.regra}
                  </td>
                  <td className="py-3 px-4 align-top text-slate-600 text-xs font-mono whitespace-nowrap">
                    {item.dispositivo}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Isenções e outras não tributações */}
      <div className="space-y-3 pt-2">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Isenções e outras não tributações
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-semibold">
                <th className="py-3 px-4">Hipótese</th>
                <th className="py-3 px-4 w-60">Dispositivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isencoes.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 align-top text-slate-800 font-medium">
                    {item.hipotese}
                  </td>
                  <td className="py-3 px-4 align-top text-slate-600 text-xs font-mono">
                    {item.dispositivo}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
