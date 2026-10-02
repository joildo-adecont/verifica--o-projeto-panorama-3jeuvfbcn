import { ExternalLink, AlertTriangle, Info, Search, Mail, RefreshCw } from 'lucide-react'

export function SectionFontesAgregador() {
  const bases = [
    {
      nome: 'Tabela de Classificação Tributária do IBS e da CBS (cClassTrib + CST IBS/CBS)',
      orgao: 'Receita Federal / ENCAT / SVRS',
      situacao:
        'Dado oficial de 01/10/2026 — IT 2025.002 v1.70 (Ato Técnico Conjunto nº 8): 9 cClassTrib novos, 13 indicadores, 9 anexos; implantação nos autorizadores até 16/10/2026',
    },
    {
      nome: 'Calculadora de Tributos (RTC) — motor oficial de cálculo do IBS/CBS',
      orgao: 'Receita Federal / Serpro',
      situacao:
        'Banco V0059 (30/09/2026) — alíquota de referência 2026; LC 214/2025, arts. 343 a 348 (transição)',
    },
    {
      nome: 'Reforma Tributária — regimes por NCM (IBS/CBS e Imposto Seletivo)',
      orgao: 'Presidência da República / Planalto',
      situacao:
        'LC 214/2025 consolidada com LC 227/2026 e LC 235/2026 — dado oficial de 01/10/2026',
    },
    {
      nome: 'Crédito Presumido do IBS/CBS (cCredPres)',
      orgao: 'SVRS — Portal da Conformidade Fácil (DF-e)',
      situacao: 'Dado oficial de 01/10/2026 — LC 214/2025, arts. 168–171, 311–312, 444–467',
    },
    {
      nome: 'Notas Técnicas da Reforma nos DF-e (NF-e/NFC-e/NFS-e)',
      orgao: 'Portal Nacional dos DF-e / SVRS',
      situacao:
        'Dado oficial de 01/10/2026 — NT 2025.001/2025.002, NT 2026.001/002/006/007/008/010, rejeições série 1000+',
    },
    {
      nome: 'CEST, MVA-ST, CFOP, NBS, CNAE 2.3, cBenef',
      orgao: 'CONFAZ, ENCAT, IBGE/Concla, Sefaz estaduais',
      situacao: 'Conferidos entre 30/09 e 01/10/2026',
    },
  ]

  return (
    <section id="fontes-agregador" className="scroll-mt-24">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Seção 11</p>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
            Fontes de referência — agregadores especializados
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Fonte verificada em 01/10/2026 pelo assistente executivo, a pedido do CEO.
          </p>
        </div>

        <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
            <p>
              <strong>Atenção — natureza da fonte:</strong> o <em>Buscador NCM</em>{' '}
              (buscadorncm.com.br) <strong>não é fonte oficial</strong> — é um agregador privado.
              Use-o para <strong>pesquisa, conferência cruzada e simulações</strong>. Para base
              legal citável, use sempre as fontes primárias oficiais da{' '}
              <a href="#fontes" className="underline font-semibold">
                seção 9
              </a>{' '}
              (Planalto, Receita Federal, CONFAZ, CGIBS).
            </p>
          </div>
        </div>

        <div className="rounded-lg border-l-4 border-blue-600 bg-blue-50 p-4 text-sm text-blue-900">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" />
            <p>
              <strong>Por que incluir:</strong> o site consolida 110 tabelas tributárias e publica,
              para cada base, o órgão responsável, o ato normativo de origem, a data do dado oficial
              e o link da fonte primária — com conferência datada. Última atualização da base
              consolidada: <strong>01/10/2026</strong>. Mantém feed de mudanças mensais (alíquotas
              de IPI/II, códigos criados e extintos) e simuladores próprios de IBS/CBS por NCM e por
              NBS.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-800 mb-2">
            Bases mais relevantes para o Panorama e o Simulador de Transição
          </h3>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 text-white text-left text-xs uppercase tracking-wide">
                  <th className="px-3 py-2 font-semibold">Base</th>
                  <th className="px-3 py-2 font-semibold">Fonte primária (órgão)</th>
                  <th className="px-3 py-2 font-semibold">Situação em 01/10/2026</th>
                  <th className="px-3 py-2 font-semibold">Link</th>
                </tr>
              </thead>
              <tbody>
                {bases.map((b, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-3 py-2 align-top">{b.nome}</td>
                    <td className="px-3 py-2 align-top">{b.orgao}</td>
                    <td className="px-3 py-2 align-top text-xs">{b.situacao}</td>
                    <td className="px-3 py-2 align-top whitespace-nowrap">
                      <a
                        href="https://buscadorncm.com.br/fontes"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-700 hover:underline font-semibold"
                      >
                        Página de fontes <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border-l-4 border-blue-600 bg-blue-50 p-4 text-sm text-blue-900 space-y-2">
          <div className="flex items-start gap-2">
            <Search className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" />
            <p>
              <strong>Pesquisa e simulações:</strong> os simuladores IBS/CBS por NCM e por NBS do
              Buscador NCM servem de conferência cruzada para o{' '}
              <a href="/simulador.html" className="underline font-semibold">
                Simulador de Transição
              </a>{' '}
              — e a Calculadora RTC (banco V0059) é a referência oficial de cálculo da Receita.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <RefreshCw className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" />
            <p>
              <strong>Atualizações:</strong> a rotina semanal de segunda-feira (11h) passa a
              monitorar também a página de fontes do agregador, para detectar mudanças nas tabelas
              da reforma (cClassTrib, cCredPres, NTs) antes de atualizar o Panorama. O site oferece
              feed RSS de mudanças nas tabelas.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Mail className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" />
            <p>
              <strong>Envio por e-mail:</strong> resumos de mudanças detectadas nessa fonte podem
              ser incluídos nos envios do painel{' '}
              <a href="/envios.html" className="underline font-semibold">
                Cadastro &amp; Envios
              </a>
              .
            </p>
          </div>
        </div>

        <div className="text-sm">
          <span className="font-semibold text-slate-700">Links diretos: </span>
          <a
            href="https://buscadorncm.com.br/fontes"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 hover:underline"
          >
            Fontes oficiais e datas de atualização (Buscador NCM)
          </a>
          {' • '}
          <a
            href="https://buscadorncm.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 hover:underline"
          >
            Buscador NCM — página inicial
          </a>
          {' • '}
          <a
            href="https://www.nfe.fazenda.gov.br/portal/informe.aspx"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 hover:underline"
          >
            Informes Técnicos oficiais (Portal NF-e)
          </a>
        </div>
      </div>
    </section>
  )
}
