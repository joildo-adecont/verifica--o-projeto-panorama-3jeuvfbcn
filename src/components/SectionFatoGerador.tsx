import { BookOpen, CheckCircle2, ArrowRight } from 'lucide-react'

export function SectionFatoGerador() {
  const rules = [
    {
      dispositivo: 'Art. 4º',
      conteudo: 'Critério material',
      regra: 'INCIDE sobre operações onerosas com bens e serviços',
      destaque: 'INCIDE',
    },
    {
      dispositivo: 'Art. 3º, I–II',
      conteudo: 'Conceito de fornecimento',
      regra:
        'Entrega/disponibilização de bem material; instituição/transferência de bem imaterial (inclusive direito); prestação de serviços',
      destaque: null,
    },
    {
      dispositivo: 'Art. 10, caput',
      conteudo: 'Momento do fato gerador',
      regra: 'No fornecimento, ainda que execução continuada ou fracionada',
      destaque: 'No fornecimento',
    },
    {
      dispositivo: 'Art. 10, §2º',
      conteudo: 'Serviços',
      regra: 'No pagamento (contrato com pagamento periódico) ou recebimento',
      destaque: 'No pagamento',
    },
    {
      dispositivo: 'Art. 10, §4º',
      conteudo: 'Pagamento antecipado',
      regra: 'Tributo devido na data de cada parcela paga antes do fornecimento',
      destaque: 'data de cada parcela paga',
    },
    {
      dispositivo: 'Art. 10, §5º',
      conteudo: 'Distrato',
      regra:
        'Créditos de antecipação restituída podem ser apropriados se o fornecimento não ocorrer',
      destaque: null,
    },
    {
      dispositivo: 'Art. 11',
      conteudo: 'Local da operação',
      regra: 'Destino do bem/serviço (tributação no consumo)',
      destaque: 'Destino',
    },
    {
      dispositivo: 'Arts. 31–35',
      conteudo: 'Split payment',
      regra:
        'Recolhimento automático vinculado ao documento fiscal; obrigatório em hipóteses listadas, opcional (ampliado pelo PLP 108) nas demais',
      destaque: 'obrigatório',
    },
    {
      dispositivo: 'Art. 254, III',
      conteudo: 'Locação de imóvel',
      regra: 'Fato gerador no pagamento (disp. objeto de crítica doutrinária)',
      destaque: null,
    },
    {
      dispositivo: 'Arts. 444–447',
      conteudo: 'Importação',
      regra: 'INCIDE na importação de bens e serviços, por quem promove a entrada',
      destaque: 'INCIDE',
    },
  ]

  return (
    <section id="secao-2" className="scroll-mt-24 space-y-4">
      <div className="border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-xs">
            2
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Fato gerador, fornecimento e incidência — LC 214/2025
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Regras fundamentais de incidência sobre bens materiais, imateriais, serviços continuados e
          o novo mecanismo de split payment.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-semibold">
              <th className="py-3 px-4 w-36 sm:w-44">Dispositivo</th>
              <th className="py-3 px-4 w-52 sm:w-64">Conteúdo</th>
              <th className="py-3 px-4">Regra</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rules.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4 align-top font-bold text-blue-900 whitespace-nowrap">
                  {item.dispositivo}
                </td>
                <td className="py-3 px-4 align-top font-medium text-slate-900">{item.conteudo}</td>
                <td className="py-3 px-4 align-top text-slate-700 leading-relaxed">
                  {item.regra.includes('INCIDE') ? (
                    <span>
                      <strong className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        INCIDE
                      </strong>{' '}
                      {item.regra.replace('INCIDE', '').trim()}
                    </span>
                  ) : item.destaque ? (
                    <span>
                      {item.regra.split(item.destaque)[0]}
                      <strong className="text-slate-900 underline decoration-blue-500 decoration-2">
                        {item.destaque}
                      </strong>
                      {item.regra.split(item.destaque)[1]}
                    </span>
                  ) : (
                    item.regra
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Feature highlight cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80">
          <h4 className="text-sm font-bold text-blue-900 flex items-center gap-1.5 mb-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            Princípio do Destino
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed">
            O IBS e a CBS encerram a guerra fiscal ao adotarem tributação 100% no destino onde
            ocorre o consumo final do bem ou serviço.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200/80">
          <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-1.5 mb-1.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            Split Payment Operacional
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed">
            Liquidação financeira direta entre arranjos de pagamento e o Comitê Gestor/RFB,
            eliminando inadimplência e simplificando compensações de crédito.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
          <h4 className="text-sm font-bold text-emerald-900 flex items-center gap-1.5 mb-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Não Cumulatividade Plena
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed">
            Crédito financeiro irrestrito sobre tudo o que for tributado e pago na etapa anterior,
            extinguindo o conceito restritivo de insumos físicos.
          </p>
        </div>
      </div>
    </section>
  )
}
