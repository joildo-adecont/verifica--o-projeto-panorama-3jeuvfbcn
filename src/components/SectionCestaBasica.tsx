import { AlertTriangle, Sparkles, Check, ShoppingCart, HeartPulse } from 'lucide-react'

export function SectionCestaBasica() {
  const cestaBasicaItems = [
    {
      grupo: 'Cereais e grãos',
      exemplos: 'Arroz, feijão, milho, trigo, aveia, quinoa',
      ibscbs: 'ALÍQUOTA ZERO',
      is: '—',
    },
    {
      grupo: 'Carnes e ovos',
      exemplos: 'Carne bovina, suína, aves, peixes, ovos',
      ibscbs: 'ALÍQUOTA ZERO',
      is: '—',
    },
    {
      grupo: 'Laticínios',
      exemplos: 'Leite, queijos, manteiga',
      ibscbs: 'ALÍQUOTA ZERO',
      is: '—',
    },
    {
      grupo: 'Pães e massas',
      exemplos: 'Pão francês, macarrão, farinhas, biscoitos simples',
      ibscbs: 'ALÍQUOTA ZERO',
      is: '—',
    },
    {
      grupo: 'Frutas, legumes, verduras',
      exemplos: 'In natura, refrigerados, congelados e secos',
      ibscbs: 'ALÍQUOTA ZERO',
      is: '—',
    },
    {
      grupo: 'Óleos e gorduras',
      exemplos: 'Óleo vegetal, azeite, banha',
      ibscbs: 'ALÍQUOTA ZERO',
      is: '—',
    },
    {
      grupo: 'Sal, açúcar, condimentos',
      exemplos: 'Sal, açúcar, café, chá, especiarias',
      ibscbs: 'ALÍQUOTA ZERO',
      is: '—',
    },
    {
      grupo: 'Sementes e mudas',
      exemplos: 'Para cultivo doméstico dos alimentos acima',
      ibscbs: 'ALÍQUOTA ZERO',
      is: '—',
    },
  ]

  const outrosTratamentos = [
    {
      produto: 'Medicamentos',
      tratamento: 'Redução 60%',
      dispositivo: 'Art. 148, I, LC 214',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    {
      produto: 'Dispositivos médicos e acessibilidade',
      tratamento: 'Redução 60%',
      dispositivo: 'Art. 148, I, LC 214',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    {
      produto: 'Produtos agropecuários e aquícolas',
      tratamento: 'Redução 60%',
      dispositivo: 'Art. 148, I, LC 214',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    {
      produto: 'Insumos agropecuários',
      tratamento: 'Redução 60%',
      dispositivo: 'Art. 148, I, LC 214',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    {
      produto: 'Transporte público coletivo',
      tratamento: 'Redução 60%',
      dispositivo: 'Art. 148, I, LC 214',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    {
      produto: 'Educação, serviços médicos e saúde',
      tratamento: 'Redução 60%',
      dispositivo: 'Art. 148, I, LC 214',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    {
      produto: 'Bens e serviços de democratização (remanejamento fiscal)',
      tratamento: 'Redução 60%',
      dispositivo: 'Art. 148, I, LC 214',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    {
      produto: 'Profissionais de educação e saúde em regime regular',
      tratamento: 'Crédito presumido',
      dispositivo: 'Art. 148, §1º, LC 214',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    {
      produto: 'Dispositivos de acessibilidade para PCD',
      tratamento: 'Cashback',
      dispositivo: 'Art. 151, II, LC 214',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    },
    {
      produto: 'Medicamentos, transporte, gás de cozinha e energia elétrica (baixa renda)',
      tratamento: 'Cashback 100% CBS / 20% IBS',
      dispositivo: 'Art. 151, LC 214',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    },
    {
      produto: 'Cigarros, bebidas alcoólicas, bebidas açucaradas, bens nocivos',
      tratamento: 'Imposto Seletivo (além de IBS/CBS)',
      dispositivo: 'Livro II, LC 214; EC 132 art. 153 VIII',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    },
    {
      produto: 'Veículos (moto e carro popular)',
      tratamento: 'Redução IS (70%/50%)',
      dispositivo: 'LC 214, Livro II',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    },
  ]

  return (
    <section id="secao-3" className="scroll-mt-24 space-y-6">
      <div className="border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-xs">
            3
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Cesta Básica Nacional e exemplos de produtos e serviços
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          A <strong>Cesta Básica Nacional de Alimentos</strong> (art. 149, LC 214/2025) tem{' '}
          <strong>alíquota zero</strong> de CBS, IBS e IS. Alimentos saudáveis fora da cesta recebem{' '}
          <strong>redução de 60%</strong> da alíquota (art. 148).
        </p>
      </div>

      {/* Tabela Cesta Básica */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-emerald-600" />
            Cesta Básica Nacional — alíquota ZERO (art. 149, LC 214/2025)
          </h3>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            0% Tributação Federal e Estadual/Municipal
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-semibold">
                <th className="py-3 px-4 w-44">Grupo</th>
                <th className="py-3 px-4">Exemplos</th>
                <th className="py-3 px-4 w-36">IBS/CBS</th>
                <th className="py-3 px-4 w-24">IS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cestaBasicaItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 align-top font-bold text-slate-900">{item.grupo}</td>
                  <td className="py-3 px-4 align-top text-slate-700">{item.exemplos}</td>
                  <td className="py-3 px-4 align-top">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {item.ibscbs}
                    </span>
                  </td>
                  <td className="py-3 px-4 align-top text-slate-400 font-medium">{item.is}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Alerta Fora da Cesta */}
        <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            ⚠️ <strong>Fora da cesta:</strong> bebidas açucaradas (refrigerantes), sorvetes e doces
            NÃO têm alíquota zero e podem atrair o <strong>Imposto Seletivo</strong> (bebidas
            açucaradas: teto de 2% na alíquota do IS — PLP 108).
          </div>
        </div>
      </div>

      {/* Outros exemplos por tratamento */}
      <div className="space-y-3 pt-2">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          Outros exemplos por tratamento
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-semibold">
                <th className="py-3 px-4">Produto / Serviço</th>
                <th className="py-3 px-4 w-60">Tratamento</th>
                <th className="py-3 px-4 w-52">Dispositivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {outrosTratamentos.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 align-top font-medium text-slate-900">{item.produto}</td>
                  <td className="py-3 px-4 align-top">
                    <span
                      className={`inline-block px-2.5 py-1 rounded text-[11px] font-semibold border ${item.badgeColor}`}
                    >
                      {item.tratamento}
                    </span>
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
