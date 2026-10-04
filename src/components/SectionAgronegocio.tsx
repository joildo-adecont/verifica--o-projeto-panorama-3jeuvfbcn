import { useState } from 'react'
import { Calculator } from 'lucide-react'

const SIM_URL = '/simulador.html'

/** Seção 6B — Regime do Agronegócio (LC 214/2025, arts. 110, 137-138, 164-171 e 271-272).
 *  Layout de tabela uniformizado com a Seção 6A. */

const REDUCOES = [
  {
    titulo: 'Produtos agropecuários in natura',
    badge: '−60%',
    detalhe:
      'Produtos agropecuários, aquícolas, pesqueiros, florestais e extrativistas vegetais in natura (art. 137). In natura = sem industrialização; secagem, limpeza, debulha, congelamento e resfriamento não tiram a condição (§1º). Serviços ambientais de conservação/recuperação de vegetação nativa contam como produto florestal (§3º).',
    base: 'LC 214, art. 137',
    sim: 'produtos agropecuários',
  },
  {
    titulo: 'Insumos agropecuários e aquícolas (Anexo IX)',
    badge: '−60%',
    detalhe:
      'Insumos relacionados no Anexo IX da LC 214, com NCM/NBS específica (art. 138). Exige registro como insumo no Ministério da Agricultura, quando exigido (§1º). Lista revisada a cada 120 dias por ato conjunto Fazenda/CGIBS/Mapa (§10).',
    base: 'LC 214, art. 138 e Anexo IX',
    sim: 'insumos agropecuários',
  },
]

const NAO_CONTRIBUINTE = [
  {
    titulo: 'Quem não é contribuinte',
    badge: 'R$ 3,6 mi',
    detalhe:
      'Produtor rural (pessoa física ou jurídica) com receita até R$ 3,6 milhões/ano e o produtor rural integrado não são contribuintes do IBS/CBS. Cooperativas de produtores com receita abaixo do limite também ficam fora.',
    base: 'LC 214, art. 164',
  },
  {
    titulo: 'Produtor rural integrado',
    badge: 'Integrado',
    detalhe:
      'Produtor agrossilvipastoril vinculado ao integrador por contrato de integração vertical, recebendo bens/servios para produção e fornecendo matéria-prima, bens intermediários ou de consumo final.',
    base: 'LC 214, art. 164, §1º',
  },
  {
    titulo: 'Excedeu o limite no meio do ano',
    badge: 'Excesso',
    detalhe:
      'Passa a ser contribuinte a partir do 2º mês subsequente ao excesso; se o excesso for até 20% do limite, os efeitos só no ano seguinte. Início de atividade: limite proporcional aos meses.',
    base: 'LC 214, art. 164, §2º–§4º',
  },
  {
    titulo: 'Limite é somado',
    badge: 'Soma',
    detalhe:
      'Se o produtor tem participação societária em outra pessoa jurídica agropecuária, o limite de R$ 3,6 milhões é verificado sobre a soma das receitas de todas. O limite é atualizado anualmente pelo IPCA.',
    base: 'LC 214, arts. 164, §6º e 167',
  },
  {
    titulo: 'Opção pelo regime regular',
    badge: 'Opção',
    detalhe:
      'O produtor não contribuinte PODE optar por se inscrever como contribuinte — efeitos a partir do mês seguinte, irretratável no ano. Renúncia possível, com efeito no ano seguinte. Quem já faturava ≥ R$ 3,6 mi antes da reforma é contribuinte automático.',
    base: 'LC 214, arts. 165–166',
  },
]

const CREDITOS = [
  {
    titulo: 'Compra do produtor não contribuinte',
    badge: 'Crédito presumido',
    detalhe:
      'O adquirente (contribuinte regular) apropria crédito presumido nas aquisições de bens e serviços do produtor rural não contribuinte. O documento fiscal deve discriminar: valor da operação, valor do crédito presumido e valor líquido. Percentuais definidos anualmente por ato conjunto Fazenda/CGIBS (média de 5 anos).',
    base: 'LC 214, art. 168',
  },
  {
    titulo: 'Frete do transportador autônomo',
    badge: 'Crédito presumido',
    detalhe:
      'Crédito presumido nas aquisições de transporte de carga de autônomo (PF) não contribuinte ou MEI. Não vale quando o transporte está embutido no valor da operação. Mesma mecânica de percentuais anuais.',
    base: 'LC 214, art. 169',
  },
  {
    titulo: 'Cooperativa também apropria',
    badge: 'Crédito presumido',
    detalhe:
      'O direito ao crédito presumido alcança a cooperativa no recebimento de bens/servios de associados não contribuintes não optantes pelo Simples — inclusive com o regime específico do art. 271.',
    base: 'LC 214, art. 168, §9º',
  },
  {
    titulo: 'Tratores e veículos de carga',
    badge: 'Zero',
    detalhe:
      'Fornecimento e importação de tratores, máquinas e implementos agrícolas destinados a produtor rural não contribuinte, e de veículos de carga para transportador autônomo PF não contribuinte, têm alíquota ZERO — inclusive bens de capital listados em regulamento.',
    base: 'LC 214, art. 110',
  },
]

const DIFERIMENTO = [
  {
    titulo: 'O que é diferido',
    badge: 'Diferido',
    detalhe:
      'O recolhimento do IBS/CBS dos insumos do Anexo IX fica ADIADO nas operações: (I) fornecimento por contribuinte regular para outro contribuinte regular; e (II) fornecimento/importação por contribuinte regular ou produtor não contribuinte que usa o insumo para produzir bem vendido a adquirentes com direito a crédito presumido (art. 168).',
    base: 'LC 214, art. 138, §2º',
  },
  {
    titulo: 'Quando o diferimento encerra',
    badge: 'Encerramento',
    detalhe:
      'Nas operações entre contribuintes regulares: encerra se a operação seguinte não tem diferimento, é isenta/não tributada/alíquota zero, ou sem documento fiscal — o recolhimento é do contribuinte que promove a operação que encerra a fase. Na cadeia do produtor não contribuinte: encerra com a redução dos créditos presumidos do art. 168.',
    base: 'LC 214, art. 138, §5º–§9º',
  },
  {
    titulo: 'Convivência com cooperativas',
    badge: 'Ressalva',
    detalhe:
      'O regime de alíquota zero das cooperativas (art. 271) NÃO se aplica às operações com insumos do Anexo IX alcançadas pelo diferimento do art. 138, §3º.',
    base: 'LC 214, art. 271, §4º',
  },
]

const COOPERATIVAS = [
  {
    titulo: 'Alíquota zero associado ↔ cooperativa',
    badge: 'Zero',
    detalhe:
      'Cooperativas podem optar por regime específico com alíquota ZERO quando: (I) o associado fornece bem/servio para a cooperativa; e (II) a cooperativa fornece bem/servio a associado do regime regular. Vale também entre cooperativas singulares, centrais, federações, confederações e seus bancos cooperativos.',
    base: 'LC 214, art. 271',
  },
  {
    titulo: 'Cooperativa de produção agropecuária',
    badge: 'Zero',
    detalhe:
      'Fornecimento de bem material pela cooperativa de produção agropecuária a associado NÃO sujeito ao regime regular também é zero — desde que anulados os créditos por ela apropriados do bem fornecido.',
    base: 'LC 214, art. 271, §1º, II',
  },
  {
    titulo: 'Transferência de créditos do associado',
    badge: 'Créditos',
    detalhe:
      'O associado do regime regular que vende à cooperativa com redução pode transferir a ela os créditos das operações antecedentes e os créditos presumidos — sem a limitação do art. 55. Alcance: apenas bens/servios usados na produção do que é fornecido à cooperativa.',
    base: 'LC 214, art. 272',
  },
  {
    titulo: 'Como optar',
    badge: 'Opção',
    detalhe:
      'A opção é exercida pela cooperativa no ano-calendário anterior ao de início dos efeitos, ou no início das operações.',
    base: 'LC 214, art. 271, §3º',
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

export function SectionAgronegocio() {
  const [tab, setTab] = useState<
    'reducoes' | 'nao-contribuinte' | 'creditos' | 'diferimento' | 'cooperativas'
  >('reducoes')

  return (
    <section id="agronegocio" className="scroll-mt-24 space-y-5">
      <div className="border-b-2 border-panorama-gold/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-panorama-navy text-panorama-gold-light font-bold text-xs ring-1 ring-panorama-gold/50">
            6B
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Regime do agronegócio — produtor rural, créditos presumidos e cooperativas
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          Regime específico do setor (LC 214/2025, arts. 110, 137–138, 164–171 e 271–272). Texto
          extraído da{' '}
          <a
            href="https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold text-panorama-navy"
          >
            LC 214 compilada do Planalto
          </a>{' '}
          (conferido em 04/10/2026). Simulável no{' '}
          <a
            href={`${SIM_URL}?q=agro`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold text-panorama-navy"
          >
            Simulador de Transição
          </a>{' '}
          (grupos 🌾 Insumos agro e 🐄 Agro).
        </p>
      </div>

      {/* Abas */}
      <div className="flex flex-wrap gap-1.5">
        <AbaButton ativo={tab === 'reducoes'} onClick={() => setTab('reducoes')}>
          🌾 Reduções de alíquota
        </AbaButton>
        <AbaButton ativo={tab === 'nao-contribuinte'} onClick={() => setTab('nao-contribuinte')}>
          🚜 Produtor não contribuinte
        </AbaButton>
        <AbaButton ativo={tab === 'creditos'} onClick={() => setTab('creditos')}>
          💵 Créditos presumidos
        </AbaButton>
        <AbaButton ativo={tab === 'diferimento'} onClick={() => setTab('diferimento')}>
          ⏸️ Diferimento de insumos
        </AbaButton>
        <AbaButton ativo={tab === 'cooperativas'} onClick={() => setTab('cooperativas')}>
          🤝 Cooperativas
        </AbaButton>
      </div>

      {tab === 'reducoes' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-lg bg-panorama-gold/10 border border-panorama-gold/50 text-sm text-slate-800">
            <strong>Regra central (arts. 137–138):</strong> produtos agropecuários in natura e
            insumos do Anexo IX têm alíquotas reduzidas em <strong>60%</strong>.
          </div>
          <Tabela linhas={REDUCOES} />
        </div>
      )}

      {tab === 'nao-contribuinte' && (
        <div className="space-y-3">
          <Tabela linhas={NAO_CONTRIBUINTE} />
          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
            ⚠️ O limite de R$ 3,6 milhões é verificado sobre a <strong>soma</strong> das receitas de
            todas as PJ agropecuárias em que o produtor tem participação (art. 164, §6º).
          </div>
        </div>
      )}

      {tab === 'creditos' && (
        <div className="space-y-3">
          <Tabela linhas={CREDITOS} />
        </div>
      )}

      {tab === 'diferimento' && (
        <div className="space-y-3">
          <Tabela linhas={DIFERIMENTO} />
        </div>
      )}

      {tab === 'cooperativas' && (
        <div className="space-y-3">
          <Tabela linhas={COOPERATIVAS} />
          <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm">
            ℹ️ A opção pelo regime da cooperativa é exercida no ano-calendário anterior ao de início
            dos efeitos, ou no início das operações (art. 271, §3º).
          </div>
        </div>
      )}
    </section>
  )
}
