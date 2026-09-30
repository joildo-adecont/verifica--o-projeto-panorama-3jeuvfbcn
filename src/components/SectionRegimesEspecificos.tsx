import {
  Star,
  Building2,
  Landmark,
  Truck,
  ShoppingBag,
  Briefcase,
  FileSpreadsheet,
} from 'lucide-react'

export function SectionRegimesEspecificos() {
  const regimes = [
    {
      regime: 'Consórcios ⭐',
      quem: 'Administradoras e consorciados',
      regra:
        'Administradora tributa só a taxa de administração (pode deduzir intermediação); aquisições com carta de crédito seguem normas gerais (imóvel → regime imobiliário); execução de garantia sem incidência na consolidação; créditos da taxa (art. 205); consorciados respondem proporcionalmente se o consórcio não optar pelo regime regular',
      dispositivo: 'Arts. 204–205, LC 214',
      isStar: true,
    },
    {
      regime: 'Bens imóveis',
      quem: 'Incorporadoras, loteadoras, locadores',
      regra:
        'Alienação: FG no ato do contrato; incorporação/parcelamento: regime caixa (cada pagamento); redução de 50% na alienação, 70% na locação; redutor social R$ 100 mil por imóvel residencial novo; sem crédito na aquisição de unidade sob regime específico',
      dispositivo: 'Arts. 252–259, 485–488, LC 214',
      isStar: false,
    },
    {
      regime: 'Serviços financeiros',
      quem: 'Bancos, seguradoras, administradoras',
      regra: 'Tributação por fluxo de caixa (recebimentos), com deduções permitidas',
      dispositivo: 'Arts. 182–214, LC 214',
      isStar: false,
    },
    {
      regime: 'Agropecuária',
      quem: 'Produtores rurais',
      regra: 'Créditos presumidos (compras) + créditos para quem compra do produtor',
      dispositivo: 'LC 214, arts. 287 e ss.',
      isStar: false,
    },
    {
      regime: 'Cooperativas',
      quem: 'Cooperativas e cooperados',
      regra: 'Regras próprias de creditamento',
      dispositivo: 'LC 214',
      isStar: false,
    },
    {
      regime: 'Comércio eletrônico / plataformas',
      quem: 'Marketplaces',
      regra:
        'Plataforma é responsável solidária pelos débitos do fornecedor (inclusive estrangeiro)',
      dispositivo: 'LC 214 (responsabilidade de plataformas)',
      isStar: false,
    },
    {
      regime: 'Simples Nacional',
      quem: 'ME/EPP',
      regra:
        'IBS/CBS no DAS até R$ 3,6 mi (IBS) e R$ 4,8 mi (CBS); opção pelo regime regular em janelas (set/mar); NF obrigatória com destaque',
      dispositivo: 'LC 214; Res. CGSN 190–192/2026',
      isStar: false,
    },
    {
      regime: 'Sociedades de profissionais',
      quem: 'Medicina, advocacia, engenharia etc.',
      regra: 'Alíquota reduzida de 50% / crédito presumido',
      dispositivo: 'LC 214, arts. 149-A e ss.',
      isStar: false,
    },
  ]

  const consorcioPoints = [
    {
      num: 1,
      title: 'Taxa de administração',
      desc: 'Regime específico, com dedução permitida dos custos de intermediação.',
    },
    {
      num: 2,
      title: 'Contemplação (sorteio/lance)',
      desc: 'NÃO é fato gerador; o tributo é devido exclusivamente na aquisição do bem.',
    },
    {
      num: 3,
      title: 'Uso da carta de crédito',
      desc: 'Normas gerais; no caso de imóvel → aplica-se o regime imobiliário (regime caixa na incorporação).',
    },
    {
      num: 4,
      title: 'Crédito da taxa de administração',
      desc: 'Apropriável por qualquer empresa contribuinte do regime regular.',
    },
    {
      num: 5,
      title: 'Execução de garantia fiduciária',
      desc: 'Sem incidência de IBS/CBS na fase de consolidação da propriedade pelo grupo.',
    },
    {
      num: 6,
      title: 'Responsabilidade tributária',
      desc: 'A administradora NÃO responde pelos tributos incidentes na aquisição realizada com a carta.',
    },
  ]

  return (
    <section id="secao-6" className="scroll-mt-24 space-y-6">
      <div className="border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-xs">
            6
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Regimes específicos e diferenciados
          </h2>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-semibold">
              <th className="py-3 px-4 w-44">Regime</th>
              <th className="py-3 px-4 w-52">Quem se aplica</th>
              <th className="py-3 px-4">Regra central</th>
              <th className="py-3 px-4 w-44">Dispositivo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {regimes.map((item, idx) => (
              <tr
                key={idx}
                className={`hover:bg-slate-50/70 transition-colors ${
                  item.isStar ? 'bg-amber-50/40' : ''
                }`}
              >
                <td className="py-3 px-4 align-top font-bold text-slate-900 whitespace-nowrap">
                  {item.regime}
                </td>
                <td className="py-3 px-4 align-top font-medium text-slate-700">{item.quem}</td>
                <td className="py-3 px-4 align-top text-slate-700 leading-relaxed">{item.regra}</td>
                <td className="py-3 px-4 align-top text-slate-600 text-xs font-mono whitespace-nowrap">
                  {item.dispositivo}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Box Especial: Consórcio — os 6 pontos que você precisa saber */}
      <div className="p-5 rounded-xl bg-gradient-to-br from-amber-50/90 to-yellow-50/70 border border-amber-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-amber-200/80 pb-3">
          <h3 className="text-base font-bold text-slate-900">
            ⭐ <strong>Consórcio — os 6 pontos que você precisa saber:</strong>
          </h3>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-slate-800 leading-relaxed">
          <p>
            <strong>1) Taxa de administração</strong> → regime específico, com dedução de
            intermediação.
          </p>
          <p>
            <strong>2) Contemplação (sorteio/lance)</strong> → <strong>não é fato gerador</strong>;
            tributo só na aquisição do bem.
          </p>
          <p>
            <strong>3) Uso da carta</strong> → normas gerais; imóvel → regime imobiliário (regime
            caixa na incorporação).
          </p>
          <p>
            <strong>4) Crédito da taxa</strong> → apropriável por contribuinte do regime regular.
          </p>
          <p>
            <strong>5) Execução de garantia</strong> → sem incidência na consolidação pelo grupo.
          </p>
          <p>
            <strong>6) Administradora</strong> <strong>não responde</strong> pelos tributos da
            aquisição com a carta.
          </p>
        </div>
      </div>
    </section>
  )
}
