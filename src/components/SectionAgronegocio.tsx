import { useState } from 'react'
import { Calculator, Leaf, Tractor, Users, Warehouse } from 'lucide-react'

const SIM_URL = '/simulador.html'

/** Seção 6B — Regime do Agronegócio (LC 214/2025, arts. 110, 137-138, 164-171 e 271-272).
 *  Texto extraído da LC 214 compilada do Planalto (conferido em 04/10/2026). */

const NAO_CONTRIBUINTE = [
  {
    titulo: 'Quem não é contribuinte',
    regra:
      'Produtor rural (pessoa física ou jurídica) com receita até R$ 3,6 milhões/ano e o produtor rural integrado não são contribuintes do IBS/CBS (art. 164). Cooperativas de produtores com receita abaixo do limite também ficam fora.',
    base: 'LC 214, art. 164',
  },
  {
    titulo: 'Produtor rural integrado',
    regra:
      'Produtor agrossilvipastoril vinculado ao integrador por contrato de integração vertical, recebendo bens/servios para produção e fornecendo matéria-prima, bens intermediários ou de consumo final (art. 164, §1º).',
    base: 'LC 214, art. 164, §1º',
  },
  {
    titulo: 'Excedeu o limite no meio do ano',
    regra:
      'Passa a ser contribuinte a partir do 2º mês subsequente ao excesso; se o excesso for até 20% do limite, os efeitos só no ano seguinte (art. 164, §2º–§3º). Início de atividade: limite proporcional aos meses (§4º).',
    base: 'LC 214, art. 164, §2º–§4º',
  },
  {
    titulo: 'Limite é somado',
    regra:
      'Se o produtor tem participação societária em outra pessoa jurídica agropecuária, o limite de R$ 3,6 milhões é verificado sobre a soma das receitas de todas (art. 164, §6º). O limite é atualizado anualmente pelo IPCA (art. 167).',
    base: 'LC 214, arts. 164, §6º e 167',
  },
  {
    titulo: 'Opção pelo regime regular',
    regra:
      'O produtor não contribuinte PODE optar por se inscrever como contribuinte (art. 165) — efeitos a partir do mês seguinte, irretratável no ano. Renúncia possível (art. 166), com efeito no ano seguinte. Quem já faturava ≥ R$ 3,6 mi antes da reforma é contribuinte automático (art. 165, §3º).',
    base: 'LC 214, arts. 165–166',
  },
]

const CREDITOS = [
  {
    titulo: 'Crédito presumido na compra do produtor não contribuinte',
    regra:
      'O adquirente (contribuinte regular) apropria crédito presumido nas aquisições de bens e serviços do produtor rural não contribuinte (art. 168). O documento fiscal deve discriminar: valor da operação, valor do crédito presumido e valor líquido. Percentuais definidos anualmente por ato conjunto Fazenda/CGIBS (divulgados até setembro, vigem no ano seguinte), com base na média de 5 anos.',
    base: 'LC 214, art. 168',
  },
  {
    titulo: 'Crédito presumido no frete do transportador autônomo',
    regra:
      'Crédito presumido nas aquisições de transporte de carga de autônomo (PF) não contribuinte ou MEI (art. 169). Não vale quando o transporte está embutido no valor da operação. Mesma mecânica de percentuais anuais.',
    base: 'LC 214, art. 169',
  },
  {
    titulo: 'Cooperativa também apropria',
    regra:
      'O direito ao crédito presumido alcança a cooperativa no recebimento de bens/servios de associados não contribuintes não optantes pelo Simples (art. 168, §9º) — inclusive com o regime específico do art. 271.',
    base: 'LC 214, art. 168, §9º',
  },
  {
    titulo: 'Tratores e veículos de carga: alíquota zero',
    regra:
      'Fornecimento e importação de tratores, máquinas e implementos agrícolas destinados a produtor rural não contribuinte, e de veículos de carga para transportador autônomo PF não contribuinte, têm alíquota ZERO — inclusive bens de capital listados em regulamento (art. 110).',
    base: 'LC 214, art. 110',
  },
]

const REDUCOES = [
  {
    titulo: 'Produtos agropecuários in natura',
    reducao: '−60%',
    detalhe:
      'Produtos agropecuários, aquícolas, pesqueiros, florestais e extrativistas vegetais in natura (art. 137). In natura = sem industrialização; secagem, limpeza, debulha, congelamento e resfriamento não tiram a condição (§1º). Serviços ambientais de conservação/recuperação de vegetação nativa contam como produto florestal (§3º).',
    base: 'LC 214, art. 137',
    sim: 'produtos agropecuários',
  },
  {
    titulo: 'Insumos agropecuários e aquícolas (Anexo IX)',
    reducao: '−60%',
    detalhe:
      'Insumos relacionados no Anexo IX da LC 214, com NCM/NBS específica (art. 138). Exige registro como insumo no Ministério da Agricultura, quando exigido (§1º). Lista revisada a cada 120 dias por ato conjunto Fazenda/CGIBS/Mapa (§10).',
    base: 'LC 214, art. 138 e Anexo IX',
    sim: 'insumos agropecuários',
  },
]

const DIFERIMENTO = [
  {
    titulo: 'O que é diferido',
    regra:
      'O recolhimento do IBS/CBS dos insumos do Anexo IX fica ADIADO (art. 138, §2º) nas operações: (I) fornecimento por contribuinte regular para outro contribuinte regular; e (II) fornecimento/importação por contribuinte regular ou produtor não contribuinte que usa o insumo para produzir bem vendido a adquirentes com direito a crédito presumido (art. 168).',
    base: 'LC 214, art. 138, §2º',
  },
  {
    titulo: 'Quando o diferimento encerra',
    regra:
      'Nas operações entre contribuintes regulares: encerra se a operação seguinte não tem diferimento, é isenta/não tributada/alíquota zero, ou sem documento fiscal — o recolhimento é do contribuinte que promove a operação que encerra a fase (§5º–§7º). Na cadeia do produtor não contribuinte: encerra com a redução dos créditos presumidos do art. 168 (§9º, I).',
    base: 'LC 214, art. 138, §5º–§9º',
  },
  {
    titulo: 'Convivência com cooperativas',
    regra:
      'O regime de alíquota zero das cooperativas (art. 271) NÃO se aplica às operações com insumos do Anexo IX alcançadas pelo diferimento do art. 138, §3º (art. 271, §4º).',
    base: 'LC 214, art. 271, §4º',
  },
]

const COOPERATIVAS = [
  {
    titulo: 'Alíquota zero nas operações associado ↔ cooperativa',
    regra:
      'Cooperativas podem optar por regime específico com alíquota ZERO quando: (I) o associado fornece bem/servio para a cooperativa; e (II) a cooperativa fornece bem/servio a associado do regime regular (art. 271). Vale também entre cooperativas singulares, centrais, federações, confederações e seus bancos cooperativos (§1º, I).',
    base: 'LC 214, art. 271',
  },
  {
    titulo: 'Cooperativa de produção agropecuária',
    regra:
      'Fornecimento de bem material pela cooperativa de produção agropecuária a associado NÃO sujeito ao regime regular também é zero — desde que anulados os créditos por ela apropriados do bem fornecido (art. 271, §1º, II).',
    base: 'LC 214, art. 271, §1º, II',
  },
  {
    titulo: 'Transferência de créditos do associado',
    regra:
      'O associado do regime regular que vende à cooperativa com redução pode transferir a ela os créditos das operações antecedentes e os créditos presumidos (art. 272) — sem a limitação do art. 55. Alcance: apenas bens/servios usados na produção do que é fornecido à cooperativa.',
    base: 'LC 214, art. 272',
  },
  {
    titulo: 'Como optar',
    regra:
      'A opção é exercida pela cooperativa no ano-calendário anterior ao de início dos efeitos, ou no início das operações (art. 271, §3º).',
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

      {/* Busca interna da seção */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Buscar no regime do agronegócio… (ex.: crédito presumido, cooperativa, diferimento)"
          className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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
          {REDUCOES.map((r) => (
            <div
              key={r.titulo}
              className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5"
            >
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Leaf className="w-4 h-4 text-emerald-600" /> {r.titulo}
                </h4>
                <span className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {r.reducao}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{r.detalhe}</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-mono text-slate-500">{r.base}</p>
                <a
                  href={`${SIM_URL}?q=${encodeURIComponent(r.sim)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-panorama-navy hover:text-panorama-gold-dark shrink-0"
                >
                  <Calculator className="w-3 h-3" /> Simular
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'nao-contribuinte' && (
        <div className="space-y-3">
          {NAO_CONTRIBUINTE.map((n) => (
            <div
              key={n.titulo}
              className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5"
            >
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Tractor className="w-4 h-4 text-amber-600" /> {n.titulo}
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">{n.regra}</p>
              <p className="text-[11px] font-mono text-slate-500">{n.base}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'creditos' && (
        <div className="space-y-3">
          {CREDITOS.map((cr) => (
            <div
              key={cr.titulo}
              className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5"
            >
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Warehouse className="w-4 h-4 text-panorama-gold-dark" /> {cr.titulo}
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">{cr.regra}</p>
              <p className="text-[11px] font-mono text-slate-500">{cr.base}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'diferimento' && (
        <div className="space-y-3">
          {DIFERIMENTO.map((d) => (
            <div
              key={d.titulo}
              className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5"
            >
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                ⏸️ {d.titulo}
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">{d.regra}</p>
              <p className="text-[11px] font-mono text-slate-500">{d.base}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'cooperativas' && (
        <div className="space-y-3">
          {COOPERATIVAS.map((co) => (
            <div
              key={co.titulo}
              className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5"
            >
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" /> {co.titulo}
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">{co.regra}</p>
              <p className="text-[11px] font-mono text-slate-500">{co.base}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
