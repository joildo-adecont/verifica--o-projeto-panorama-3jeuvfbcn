import { Smartphone, Users } from 'lucide-react'

const SIM_URL = '/simulador.html'

/** Seção 6F — Profissionais regulamentados (art. 127) e Plataformas digitais (art. 22). */

const PROFISSIONAIS = [
  {
    titulo: 'Redução de 30%',
    regra:
      'Serviços prestados por profissionais com atividade intelectual de natureza científica, literária ou artística, submetidos a conselho profissional: administradores, advogados, arquitetos e urbanistas, assistentes sociais, bibliotecários, biólogos, contabilistas, economistas, economistas domésticos, profissionais de educação física, engenheiros e agrônomos, estatísticos, médicos veterinários e zootecnistas, museólogos, químicos, profissionais de relações públicas, técnicos industriais e técnicos agrícolas (art. 127).',
    base: 'LC 214, art. 127',
    sim: 'serviços jurídicos',
  },
  {
    titulo: 'Requisitos da pessoa jurídica',
    regra:
      'A redução vale para PJ que cumpra cumulativamente: sócios com habilitação relacionada ao objeto social e submetidos a conselho; sem sócio pessoa jurídica; não ser sócia de outra PJ; não exercer atividade diversa das habilitações; serviços da atividade-fim prestados diretamente pelos sócios, admitido o concurso de auxiliares (art. 127, §1º, II). União de diferentes profissionais é permitida, cada sócio na sua habilitação (§2º, II). A natureza jurídica e a forma de distribuição de lucros não impedem (§2º, I e III).',
    base: 'LC 214, art. 127, §1º–§2º',
  },
  {
    titulo: 'Exceção (educação física)',
    regra:
      'A regra dos §1º e §2º não se aplica à prestação de serviços por pessoa jurídica relacionada à profissão de profissional de educação física (art. 127, §3º).',
    base: 'LC 214, art. 127, §3º',
  },
]

const PLATAFORMAS = [
  {
    titulo: 'Responsabilidade solidária',
    regra:
      'Plataformas digitais — mesmo domiciliadas no exterior — respondem pelo IBS/CBS das operações realizadas por seu intermédio: (I) em substituição ao fornecedor estrangeiro, solidariamente com o adquirente; (II) solidariamente com o fornecedor nacional que não forneça as informações exigidas ou que, sendo contribuinte, não emita documento fiscal eletrônico no valor da operação (art. 22).',
    base: 'LC 214, art. 22',
  },
  {
    titulo: 'O que é plataforma digital',
    regra:
      'Intermediária entre fornecedores e adquirentes em operações não presenciais/eletrônicas que controle ao menos um elemento essencial: cobrança, pagamento, definição de termos e condições ou entrega (art. 22, §1º).',
    base: 'LC 214, art. 22, §1º',
  },
  {
    titulo: 'O que NÃO é plataforma',
    regra:
      'Acesso à internet; serviços de pagamento de instituições autorizadas pelo Banco Central; publicidade; busca ou comparação de fornecedores, desde que não cobre pelo serviço com base nas vendas realizadas (art. 22, §2º).',
    base: 'LC 214, art. 22, §2º',
  },
  {
    titulo: 'Fornecedor estrangeiro dispensado de inscrição',
    regra:
      'Na hipótese de substituição (inciso I do caput), o fornecedor residente no exterior fica dispensado da inscrição (art. 22, §3º) — a plataforma é a responsável direta.',
    base: 'LC 214, art. 22, §3º',
  },
]

export function SectionProfissionaisPlataformas() {
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

      <div className="p-3.5 rounded-lg bg-panorama-gold/10 border border-panorama-gold/50 text-sm text-slate-800">
        <strong>Profissionais regulamentados:</strong> redução de <strong>30%</strong> nas alíquotas
        — com requisitos objetivos para a pessoa jurídica.
      </div>

      <div className="space-y-3">
        {PROFISSIONAIS.map((p) => (
          <div
            key={p.titulo}
            className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5"
          >
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" /> {p.titulo}
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed">{p.regra}</p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-mono text-slate-500">{p.base}</p>
              {p.sim && (
                <a
                  href={`${SIM_URL}?q=${encodeURIComponent(p.sim)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-panorama-navy hover:text-panorama-gold-dark shrink-0"
                >
                  Simular →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <Smartphone className="w-4 h-4 text-panorama-gold-dark" /> Plataformas digitais (art. 22)
        </h4>
        {PLATAFORMAS.map((p) => (
          <div
            key={p.titulo}
            className="space-y-1 pt-1.5 border-t border-slate-50 first:border-0 first:pt-0"
          >
            <p className="text-xs font-bold text-slate-800">{p.titulo}</p>
            <p className="text-xs text-slate-700 leading-relaxed">{p.regra}</p>
            <p className="text-[11px] font-mono text-slate-500">{p.base}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
