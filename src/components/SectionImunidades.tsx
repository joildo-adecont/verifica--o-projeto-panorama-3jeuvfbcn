import { Shield, AlertTriangle, Building, Landmark, Percent } from 'lucide-react'

export function SectionImunidades() {
  const imunidades = [
    {
      hipotese: 'Exportação de bens e serviços',
      tratamento: 'IMUNE — com manutenção integral de créditos',
      dispositivo: 'Art. 8º, LC 214; CF art. 149, §2º I',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    {
      hipotese: 'Alienação de bem imóvel pelo INSS a beneficiário',
      tratamento: 'IMUNE',
      dispositivo: 'LC 214 (rol de imunidades)',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    {
      hipotese: 'Operações com a Zona Franca de Manaus e ALC',
      tratamento: 'Reduções específicas — crédito presumido e alíquotas reduzidas',
      dispositivo: 'LC 214, arts. 419–427',
      badge: 'bg-purple-100 text-purple-800 border-purple-300',
    },
    {
      hipotese: 'Alienações societárias (participações societárias)',
      tratamento: 'NÃO INCIDE',
      dispositivo: 'Art. 5º, LC 214',
      badge: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    {
      hipotese: 'Operações de inter-estabelecimentos (mesma empresa)',
      tratamento: 'NÃO INCIDE (salvo casos elencados)',
      dispositivo: 'Art. 5º, LC 214',
      badge: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    {
      hipotese: 'Operações financeiras puras (juros, câmbio, ações)',
      tratamento: 'NÃO INCIDE (serviços financeiros têm regime próprio)',
      dispositivo: 'Art. 182 e ss., LC 214',
      badge: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    {
      hipotese: 'Folha de pagamento / trabalhistas',
      tratamento: 'NÃO INCIDE',
      dispositivo: 'LC 214',
      badge: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    {
      hipotese: 'Locação e cessão de imóveis',
      tratamento: 'Regime específico imobiliário',
      dispositivo: 'Arts. 252–259, LC 214',
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    {
      hipotese:
        'Operações com entes públicos (alíquota reduzida a zero nas compras governamentais)',
      tratamento: 'Redução a zero — regulamento do IBS',
      dispositivo: 'RIBS, Res. CGIBS 6/2026',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
  ]

  return (
    <section id="secao-4" className="scroll-mt-24 space-y-4">
      <div className="border-b-2 border-panorama-gold/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-panorama-navy text-panorama-gold-light font-bold text-xs ring-1 ring-panorama-gold/50">
            4
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Imunidades, não incidências e não tributações
          </h2>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
              <th className="py-3 px-4">Hipótese</th>
              <th className="py-3 px-4 w-72">Tratamento</th>
              <th className="py-3 px-4 w-56">Dispositivo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {imunidades.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4 align-top font-medium text-slate-900">{item.hipotese}</td>
                <td className="py-3 px-4 align-top">
                  <span
                    className={`inline-block px-2.5 py-1 rounded text-[11px] font-semibold border ${item.badge}`}
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

      {/* Alerta Inter-estabelecimentos */}
      <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          ⚠️ <strong>Inter-estabelecimentos:</strong> a não incidência vale para transferências
          internas de estoque, ativo fixo etc., <strong>exceto</strong> se a operação constituir
          fornecimento oneroso (ex.: cobrança entre filiais).
        </div>
      </div>
    </section>
  )
}
