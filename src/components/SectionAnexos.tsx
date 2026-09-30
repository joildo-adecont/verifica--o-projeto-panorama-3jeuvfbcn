import { FileText, CheckCircle2 } from 'lucide-react'

export function SectionAnexos() {
  const anexos = [
    {
      instrumento: 'Decreto 12.955/2026 (Regulamento CBS)',
      anexo: 'Anexo I',
      conteudo: 'Código de Situação Tributária (CST) da CBS',
    },
    {
      instrumento: 'Decreto 12.955/2026 (Regulamento CBS)',
      anexo: 'Anexo II',
      conteudo: 'Código de Situação Tributária do IS',
    },
    {
      instrumento: 'Decreto 12.955/2026 (Regulamento CBS)',
      anexo: 'Anexo III',
      conteudo: 'Classificações de bens e serviços (lista de cesta básica e reduzidos)',
    },
    {
      instrumento: 'Decreto 12.955/2026 (Regulamento CBS)',
      anexo: 'Anexo IV',
      conteudo: 'Produtos sujeitos ao Imposto Seletivo',
    },
    {
      instrumento: 'Decreto 12.955/2026 (Regulamento CBS)',
      anexo: 'Anexo V',
      conteudo: 'Disposições transitórias e vinculações',
    },
    {
      instrumento: 'Resolução CGIBS 6/2026 (Regulamento IBS)',
      anexo: 'Anexo I',
      conteudo: 'CST do IBS',
    },
    {
      instrumento: 'Resolução CGIBS 6/2026 (Regulamento IBS)',
      anexo: 'Anexo II',
      conteudo: 'Código de Benefício Fiscal (CBF)',
    },
    {
      instrumento: 'Resolução CGIBS 6/2026 (Regulamento IBS)',
      anexo: 'Anexo III',
      conteudo: 'Classificações de bens e serviços (IBS)',
    },
    {
      instrumento: 'Resolução CGIBS 6/2026 (Regulamento IBS)',
      anexo: 'Anexo IV',
      conteudo: 'Regras de crédito presumido',
    },
    {
      instrumento: 'Resolução CGIBS 6/2026 (Regulamento IBS)',
      anexo: 'Anexo V',
      conteudo: 'Disposições transitórias (IBS)',
    },
    {
      instrumento: 'LC 214/2025',
      anexo: 'Anexos (referências)',
      conteudo:
        'Lista de serviços de saúde e educação (redução 60%); lista de produtos da Cesta Básica; lista de bens do IS',
    },
  ]

  return (
    <section id="secao-7" className="scroll-mt-24 space-y-4">
      <div className="border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-xs">
            7
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Anexos da reforma tributária
          </h2>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-semibold">
              <th className="py-3 px-4 w-72">Instrumento</th>
              <th className="py-3 px-4 w-40">Anexo</th>
              <th className="py-3 px-4">Conteúdo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {anexos.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4 align-top font-bold text-slate-900">{item.instrumento}</td>
                <td className="py-3 px-4 align-top font-semibold text-blue-700 whitespace-nowrap">
                  {item.anexo}
                </td>
                <td className="py-3 px-4 align-top text-slate-700 leading-relaxed">
                  {item.conteudo}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm leading-relaxed">
        Os anexos dos regulamentos de 2026 foram estruturados para uniformizar CST, classificação
        fiscal e regras de crédito — essenciais para o preenchimento correto dos campos IBS/CBS nos
        documentos fiscais eletrônicos (obrigatório desde 03/08/2026).
      </div>
    </section>
  )
}
