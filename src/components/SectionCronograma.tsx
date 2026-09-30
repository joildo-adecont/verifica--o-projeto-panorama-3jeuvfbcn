import { useState } from 'react'
import { Calendar, AlertCircle, ArrowRight, Calculator, CheckCircle2 } from 'lucide-react'

export function SectionCronograma() {
  const [calcYear, setCalcYear] = useState<number>(2026)
  const [operationValue, setOperationValue] = useState<number>(10000)

  const cronograma = [
    {
      ano: '2026',
      fase: 'Ano-teste',
      ibs: '0,1%',
      cbs: '0,9%',
      tributosAtuais:
        'Todos integrais; IBS/CBS compensáveis com PIS/Cofins; recolhimento dispensado com obrig. acessórias cumpridas',
      current: true,
    },
    {
      ano: '2027',
      fase: 'Virada federal',
      ibs: '0,1%',
      cbs: 'Plena (ref. −0,1 p.p.)',
      tributosAtuais: 'PIS/Cofins extintos; IPI zero (exceto ZFM); IS inicia',
      current: false,
    },
    {
      ano: '2028',
      fase: 'IBS em teste',
      ibs: '0,1%',
      cbs: 'Plena',
      tributosAtuais: 'ICMS/ISS integrais',
      current: false,
    },
    {
      ano: '2029',
      fase: 'Transição IBS',
      ibs: '10% ref.',
      cbs: 'Plena',
      tributosAtuais: 'ICMS/ISS a 90%',
      current: false,
    },
    {
      ano: '2030',
      fase: 'Transição IBS',
      ibs: '20% ref.',
      cbs: 'Plena',
      tributosAtuais: 'ICMS/ISS a 80%',
      current: false,
    },
    {
      ano: '2031',
      fase: 'Transição IBS',
      ibs: '30% ref.',
      cbs: 'Plena',
      tributosAtuais: 'ICMS/ISS a 70%',
      current: false,
    },
    {
      ano: '2032',
      fase: 'Transição IBS',
      ibs: '40% ref.',
      cbs: 'Plena',
      tributosAtuais: 'ICMS/ISS a 60%',
      current: false,
    },
    {
      ano: '2033',
      fase: 'Regime pleno',
      ibs: 'Plena (≈17,7%)',
      cbs: 'Plena (≈8,8%)',
      tributosAtuais: 'ICMS/ISS extintos',
      current: false,
    },
  ]

  const marcosOperacionais = [
    {
      data: '03/08/2026',
      marco:
        'Preenchimento obrigatório IBS/CBS (1% teste) em todos os documentos fiscais do regime regular',
    },
    {
      data: '01/10/2026',
      marco: 'NFS-e: IBS/CBS em grupos de serviços da LC 116 (itens 1–3)',
    },
    {
      data: '01/11/2026',
      marco: 'NFS-e nacional obrigatória para ME/EPP do Simples',
    },
    {
      data: '01/12/2026',
      marco: 'Demais serviços da NFS-e; Simples que aderirem ao destaque em set/2026',
    },
    {
      data: '30/09 (anual)',
      marco: 'Janela de opção do Simples / escolha do regime regular (set–mar)',
    },
  ]

  const pontosAtencao = [
    {
      num: 1,
      ponto: 'Alíquotas de referência de 2033',
      porque:
        'São estimativas (IBSLab ≈17,7% IBS; ≈8,8% CBS) até a fixação legal pelo Senado/lei ordinária',
    },
    {
      num: 2,
      ponto: 'Split payment',
      porque:
        'Pode reter o tributo no pagamento — impacta fluxo de caixa; obrigatório em hipóteses específicas',
    },
    {
      num: 3,
      ponto: 'Documento fiscal',
      porque:
        'Sem NF-e com IBS/CBS correto → rejeição do documento (desde 03/08/2026) e perda de créditos',
    },
    {
      num: 4,
      ponto: 'Créditos remanescentes',
      porque: 'Saldos de ICMS/PIS/Cofins têm regras próprias de apropriação na transição',
    },
    {
      num: 5,
      ponto: 'Simples Nacional',
      porque: 'Entre R$ 3,6 mi e R$ 4,8 mi: IBS por fora, CBS no DAS — controle dual',
    },
    {
      num: 6,
      ponto: 'Contratos de longo prazo',
      porque: 'Rever cláusulas de repasse tributário a cada mudança de alíquota (2027, 2029–2032)',
    },
    {
      num: 7,
      ponto: 'Faturamento antecipado',
      porque: 'Art. 10, §4º — tributo devido na data de cada parcela paga antes do fornecimento',
    },
    {
      num: 8,
      ponto: 'Cessão onerosa de carta de consórcio',
      porque: 'Pode configurar fornecimento (direito = bem imaterial) — avaliar caso a caso',
    },
  ]

  // Simulador rápido
  const getSimulationRates = (year: number) => {
    if (year === 2026) return { ibs: 0.1, cbs: 0.9, icmsIssFactor: 1.0, pisCofinsActive: true }
    if (year === 2027) return { ibs: 0.1, cbs: 8.7, icmsIssFactor: 1.0, pisCofinsActive: false }
    if (year === 2028) return { ibs: 0.1, cbs: 8.8, icmsIssFactor: 1.0, pisCofinsActive: false }
    if (year === 2029) return { ibs: 1.77, cbs: 8.8, icmsIssFactor: 0.9, pisCofinsActive: false }
    if (year === 2030) return { ibs: 3.54, cbs: 8.8, icmsIssFactor: 0.8, pisCofinsActive: false }
    if (year === 2031) return { ibs: 5.31, cbs: 8.8, icmsIssFactor: 0.7, pisCofinsActive: false }
    if (year === 2032) return { ibs: 7.08, cbs: 8.8, icmsIssFactor: 0.6, pisCofinsActive: false }
    return { ibs: 17.7, cbs: 8.8, icmsIssFactor: 0.0, pisCofinsActive: false }
  }

  const rates = getSimulationRates(calcYear)
  const simulatedIBS = operationValue * (rates.ibs / 100)
  const simulatedCBS = operationValue * (rates.cbs / 100)

  return (
    <section id="secao-8" className="scroll-mt-24 space-y-8">
      <div className="border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-xs">
            8
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Cronograma 2026–2033 e pontos de atenção
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Calendário completo da substituição dos 5 tributos vigentes (PIS, COFINS, IPI, ICMS, ISS)
          pelo IVA Dual.
        </p>
      </div>

      {/* Main Table Cronograma */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-semibold">
              <th className="py-3 px-4 w-24">Ano</th>
              <th className="py-3 px-4 w-36">Fase</th>
              <th className="py-3 px-4 w-28">IBS</th>
              <th className="py-3 px-4 w-44">CBS</th>
              <th className="py-3 px-4">Tributos atuais</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cronograma.map((item, idx) => (
              <tr
                key={idx}
                className={`hover:bg-slate-50/70 transition-colors ${
                  item.current ? 'bg-blue-50/50' : ''
                }`}
              >
                <td className="py-3 px-4 align-top font-bold text-slate-900">
                  <div className="flex items-center gap-1.5">
                    {item.ano}
                    {item.current && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-600 text-white">
                        Atual
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 align-top font-semibold text-slate-800">{item.fase}</td>
                <td className="py-3 px-4 align-top font-mono font-bold text-blue-700">
                  {item.ibs}
                </td>
                <td className="py-3 px-4 align-top font-mono font-bold text-indigo-700">
                  {item.cbs}
                </td>
                <td className="py-3 px-4 align-top text-slate-700 leading-relaxed">
                  {item.tributosAtuais}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Interativo: Simulador de Impacto na Transição */}
      <div className="p-5 rounded-xl bg-slate-900 text-white shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              Simulador Didático de Transição (IBS/CBS)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Ano selecionado: <strong className="text-blue-300 font-bold">{calcYear}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-300 font-medium block mb-1">
              Valor da Operação / Nota Fiscal (R$):
            </label>
            <input
              type="number"
              min="100"
              step="500"
              value={operationValue}
              onChange={(e) => setOperationValue(Number(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300 font-medium block mb-1">
              Ano do Cronograma:
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
              {[2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setCalcYear(yr)}
                  className={`py-1.5 text-xs font-bold rounded transition-colors ${
                    calcYear === yr
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block">IBS Estimado ({rates.ibs}%)</span>
            <span className="text-lg font-bold text-blue-400 font-mono">
              R${' '}
              {simulatedIBS.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block">CBS Estimada ({rates.cbs}%)</span>
            <span className="text-lg font-bold text-indigo-400 font-mono">
              R${' '}
              {simulatedCBS.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block">
              Total IVA Dual ({(rates.ibs + rates.cbs).toFixed(2)}%)
            </span>
            <span className="text-lg font-bold text-emerald-400 font-mono">
              R${' '}
              {(simulatedIBS + simulatedCBS).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Marcos Operacionais 2026 */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          Marcos operacionais de 2026
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-semibold">
                <th className="py-3 px-4 w-40">Data</th>
                <th className="py-3 px-4">Marco</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {marcosOperacionais.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 align-top font-bold text-blue-900 font-mono whitespace-nowrap">
                    {item.data}
                  </td>
                  <td className="py-3 px-4 align-top text-slate-700 leading-relaxed">
                    {item.marco}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pontos de Atenção Gerais */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          Pontos de atenção gerais
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-semibold">
                <th className="py-3 px-4 w-16">#</th>
                <th className="py-3 px-4 w-72">Ponto</th>
                <th className="py-3 px-4">Por que importa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pontosAtencao.map((item) => (
                <tr key={item.num} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 align-top font-bold text-slate-400">{item.num}</td>
                  <td className="py-3 px-4 align-top font-bold text-slate-900">{item.ponto}</td>
                  <td className="py-3 px-4 align-top text-slate-700 leading-relaxed">
                    {item.porque}
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
