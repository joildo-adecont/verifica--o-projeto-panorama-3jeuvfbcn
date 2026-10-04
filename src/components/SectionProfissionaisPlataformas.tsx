import { useState } from 'react'
import { Calculator } from 'lucide-react'

const SIM_URL = '/simulador.html'

/** Seção 6F — Profissionais regulamentados (art. 127) e Plataformas digitais (art. 22).
 *  Layout de tabela uniformizado com a Seção 6A. */

const PROFISSIONAIS = [
  {
    titulo: 'Redução de 30%',
    badge: '−30%',
    detalhe:
      'Serviços prestados por profissionais com atividade intelectual de natureza científica, literária ou artística, submetidos a conselho profissional: administradores, advogados, arquitetos e urbanistas, assistentes sociais, bibliotecários, biólogos, contabilistas, economistas, economistas domésticos, profissionais de educação física, engenheiros e agrônomos, estatísticos, médicos veterinários e zootecnistas, museólogos, químicos, profissionais de relações públicas, técnicos industriais e técnicos agrícolas (art. 127).',
    base: 'LC 214, art. 127',
    sim: 'serviços jurídicos',
  },
  {
    titulo: 'Requisitos da pessoa jurídica',
    badge: 'Requisitos',
    detalhe:
      'A redução vale para PJ que cumpra cumulativamente: sócios com habilitação relacionada ao objeto social e submetidos a conselho; sem sócio pessoa jurídica; não ser sócia de outra PJ; não exercer atividade diversa das habilitações; serviços da atividade-fim prestados diretamente pelos sócios, admitido o concurso de auxiliares (art. 127, §1º, II). União de diferentes profissionais é permitida, cada sócio na sua habilitação (§2º, II). A natureza jurídica e a forma de distribuição de lucros não impedem (§2º, I e III).',
    base: 'LC 214, art. 127, §1º–§2º',
  },
  {
    titulo: 'Exceção (educação física)',
    badge: 'Exceção',
    detalhe:
      'A regra dos §1º e §2º não se aplica à prestação de serviços por pessoa jurídica relacionada à profissão de profissional de educação física (art. 127, §3º).',
    base: 'LC 214, art. 127, §3º',
  },
]

const PLATAFORMAS = [
  {
    titulo: 'Responsabilidade solidária',
    badge: 'Solidária',
    detalhe:
      'Plataformas digitais — mesmo domiciliadas no exterior — respondem pelo IBS/CBS das operações realizadas por seu intermédio: (I) em substituição ao fornecedor estrangeiro, solidariamente com o adquirente; (II) solidariamente com o fornecedor nacional que não forneça as informações exigidas ou que, sendo contribuinte, não emita documento fiscal eletrônico no valor da operação (art. 22).',
    base: 'LC 214, art. 22',
  },
  {
    titulo: 'O que é plataforma digital',
    badge: 'Definição',
    detalhe:
      'Intermediária entre fornecedores e adquirentes em operações não presenciais/eletrônicas que controle ao menos um elemento essencial: cobrança, pagamento, definição de termos e condições ou entrega (art. 22, §1º).',
    base: 'LC 214, art. 22, §1º',
  },
  {
    titulo: 'O que NÃO é plataforma',
    badge: 'Exclusões',
    detalhe:
      'Acesso à internet; serviços de pagamento de instituições autorizadas pelo Banco Central; publicidade; busca ou comparação de fornecedores, desde que não cobre pelo serviço com base nas vendas realizadas (art. 22, §2º).',
    base: 'LC 214, art. 22, §2º',
  },
  {
    titulo: 'Fornecedor estrangeiro dispensado de inscrição',
    badge: 'Dispensa',
    detalhe:
      'Na hipótese de substituição (inciso I do caput), o fornecedor residente no exterior fica dispensado da inscrição (art. 22, §3º) — a plataforma é a responsável direta.',
    base: 'LC 214, art. 22, §3º',
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

export function SectionProfissionaisPlataformas() {
  const [tab, setTab] = useState<'profissionais' | 'plataformas'>('profissionais')

  return (
    <section id="profissionais-plataformas" className="scroll-mt-24 space-y-5">
      <div className="border-b-2 border-panorama-gold/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-panorama-navy text-panorama-gold-light font-bold text-xs ring-1 ring-panorama-gold/50">
            6F
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Profissionais regulamentados e plataformas digitais
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          Regime diferenciado dos profissionais (LC 214/2025, art. 127) e responsabilidade das
          plataformas (art. 22). Texto extraído da{' '}
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
        <AbaButton ativo={tab === 'profissionais'} onClick={() => setTab('profissionais')}>
          ⚖️ Profissionais regulamentados
        </AbaButton>
        <AbaButton ativo={tab === 'plataformas'} onClick={() => setTab('plataformas')}>
          📱 Plataformas digitais
        </AbaButton>
      </div>

      {tab === 'profissionais' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-lg bg-panorama-gold/10 border border-panorama-gold/50 text-sm text-slate-800">
            <strong>Regra central (art. 127):</strong> redução de <strong>30%</strong> nas alíquotas
            — com requisitos objetivos para a pessoa jurídica.
          </div>
          <Tabela linhas={PROFISSIONAIS} />
        </div>
      )}

      {tab === 'plataformas' && (
        <div className="space-y-3">
          <Tabela linhas={PLATAFORMAS} />
          <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm">
            ℹ️ Fornecedor estrangeiro: dispensado de inscrição quando a plataforma responde em
            substituição (art. 22, §3º) — a plataforma é a responsável direta.
          </div>
        </div>
      )}
    </section>
  )
}
