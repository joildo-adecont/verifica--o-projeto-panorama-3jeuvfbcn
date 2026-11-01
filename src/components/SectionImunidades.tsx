import { useState } from 'react'
import {
  AlertTriangle,
  Church,
  BookOpen,
  Coins,
  Users,
  CheckCircle2,
  Info,
  Scale,
} from 'lucide-react'

type Item = {
  hipotese: string
  base: string
  efeito: string
  badge: string
}

const IMUNIDADES: Item[] = [
  {
    hipotese: 'Exportação de bens e serviços',
    base: 'Art. 8º; arts. 79 a 81',
    efeito: 'Imune com manutenção integral dos créditos das etapas anteriores.',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  {
    hipotese: 'União, Estados, Distrito Federal e Municípios',
    base: 'Art. 9º, I, e §1º',
    efeito:
      'Extensiva a autarquias, fundações instituídas e mantidas pelo poder público e à empresa pública de serviço postal. Só alcança as finalidades essenciais e não vale para exploração de atividade econômica com contraprestação.',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  {
    hipotese:
      'Entidades religiosas e templos de qualquer culto, inclusive suas organizações assistenciais e beneficentes',
    base: 'Art. 9º, II, e §2º',
    efeito: 'Imune o que a entidade fornece. Definida no §2º e detalhada no quadro abaixo.',
    badge: 'bg-teal-100 text-teal-900 border-teal-400',
  },
  {
    hipotese:
      'Partidos políticos (com institutos e fundações), entidades sindicais de trabalhadores e instituições de educação e de assistência social sem fins lucrativos',
    base: 'Art. 9º, III, e §3º',
    efeito:
      'Exige o cumprimento cumulativo dos requisitos do art. 14 do CTN: não distribuir resultados, não remitir lucros, aplicação integral dos recursos no País e escrituração regular.',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  {
    hipotese: 'Livros, jornais, periódicos e o papel destinado a sua impressão',
    base: 'Art. 9º, IV',
    efeito: 'Não gera anulação de créditos (art. 51, §2º, II).',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  {
    hipotese:
      'Fonogramas e videofonogramas musicais produzidos no Brasil com obras de autores brasileiros e/ou interpretadas por artistas brasileiros',
    base: 'Art. 9º, V',
    efeito:
      'Alcança os suportes materiais e os arquivos digitais que os contenham. Exclui a etapa de replicação industrial de mídias ópticas de leitura a laser.',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  {
    hipotese:
      'Serviço de comunicação de radiodifusão sonora e de sons e imagens, de recepção livre e gratuita',
    base: 'Art. 9º, VI',
    efeito: 'Não gera anulação de créditos (art. 51, §2º, II).',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  {
    hipotese: 'Ouro, quando definido em lei como ativo financeiro ou instrumento cambial',
    base: 'Art. 9º, VII',
    efeito: 'Mantém o tratamento do ouro como ativo financeiro.',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
]

const NAO_INCIDENCIA: Item[] = [
  {
    hipotese:
      'Serviços de pessoa física por relação de emprego ou na atuação como administrador, conselheiro fiscal ou de administração',
    base: 'Art. 6º, I',
    efeito: 'Vínculo empregatício e atuação em conselhos ficam fora do IBS e da CBS.',
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    hipotese: 'Transferência de bens entre estabelecimentos do mesmo contribuinte',
    base: 'Art. 6º, II',
    efeito: 'Permanece a obrigação de emitir documento fiscal eletrônico (art. 60, §2º, II).',
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    hipotese: 'Baixa, liquidação e alienação de participação societária',
    base: 'Art. 6º, III',
    efeito: 'Ressalvada a transmissão a sócio de bens cuja aquisição gerou crédito (art. 5º, III).',
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    hipotese: 'Fusão, cisão, incorporação, integralização e devolução de capital',
    base: 'Art. 6º, IV',
    efeito: 'Mesma ressalva do art. 5º, III.',
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    hipotese: 'Rendimentos financeiros',
    base: 'Art. 6º, V',
    efeito: 'Exceto os incluídos na base do regime específico de serviços financeiros.',
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    hipotese: 'Dividendos, juros sobre capital próprio e resultados de avaliação de participações',
    base: 'Art. 6º, VI',
    efeito: 'Inclui a remuneração ao capital paga por cooperativas.',
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    hipotese: 'Demais operações com títulos e valores mobiliários',
    base: 'Art. 6º, VII',
    efeito: 'Ressalvado o regime específico de serviços financeiros.',
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    hipotese: 'Doações sem contraprestação em benefício do doador',
    base: 'Art. 6º, VIII e §2º',
    efeito:
      'Se o bem doado gerou crédito, a doação é tributada pelo valor de mercado ou o contribuinte opta pela anulação dos créditos.',
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    hipotese:
      'Transferências públicas a organizações da sociedade civil sem fins lucrativos (termos de fomento, colaboração, convênios, subvenções)',
    base: 'Art. 6º, IX',
    efeito: 'Não incidência sobre o repasse público, não sobre a atividade da entidade.',
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    hipotese: 'Fundos cooperativos, repasse e distribuição de sobras a associados',
    base: 'Art. 6º, X e XI',
    efeito: 'Ressalvado o art. 5º, III.',
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
  },
]

const REGIMES: Item[] = [
  {
    hipotese: 'Zona Franca de Manaus',
    base: 'Arts. 439 a 457',
    efeito:
      'Regime favorecido com crédito presumido e alíquotas reduzidas — não é imunidade. Vigora até a data do art. 92-A do ADCT.',
    badge: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  {
    hipotese:
      'Áreas de Livre Comércio: Tabatinga, Macapá-Santana, Guajará-Mirim, Brasiléia/Epitaciolândia e Cruzeiro do Sul',
    base: 'Arts. 458 a 461',
    efeito: 'Regime favorecido, com habilitação na Suframa — não é imunidade.',
    badge: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  {
    hipotese:
      'Aquisições de bens e serviços pela administração pública direta, autarquias e fundações públicas',
    base: 'Art. 473',
    efeito:
      'Redução a zero das alíquotas dos demais entes e elevação equivalente da alíquota do ente contratante — o produto fica integralmente com quem contrata.',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  {
    hipotese: 'Lote residencial, imóvel novo e locação de imóvel',
    base: 'Arts. 252 a 261',
    efeito:
      'Regime específico imobiliário com redução de 50% e redutores de ajuste — não é imunidade.',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
  },
]

const AUDITORIA = [
  {
    achado: 'Nenhuma linha sobre entidades religiosas e templos de qualquer culto',
    situacao: 'Corrigido — agora é o item II do art. 9º, com quadro próprio',
    tipo: 'erro',
  },
  {
    achado: '“Alienação de bem imóvel pelo INSS a beneficiário”',
    situacao: 'Removido — não há previsão na LC 214 nem no RIBS; era resíduo de versão anterior',
    tipo: 'erro',
  },
  {
    achado: '“LC 214, arts. 419–427” atribuído à Zona Franca de Manaus',
    situacao: 'Corrigido — aqueles artigos tratam do Imposto Seletivo de veículos; ZFM é 439–457',
    tipo: 'erro',
  },
  {
    achado: 'Não incidência societária e inter-estabelecimentos creditada ao art. 5º',
    situacao: 'Corrigido — o art. 5º é de incidência; a não incidência é o art. 6º',
    tipo: 'erro',
  },
  {
    achado: 'Faltavam 6 dos 7 incisos do art. 9º',
    situacao: 'Corrigido — partidos, sindicatos, educação, livros, fonogramas, radiodifusão e ouro',
    tipo: 'erro',
  },
  {
    achado: 'Imunidade de ITCMD para entidades religiosas (LC 227/2026)',
    situacao: 'Acrescentado como nota — é outro tributo, fora do escopo desta seção',
    tipo: 'nota',
  },
]

function Tabela({ itens, colEfeito }: { itens: Item[]; colEfeito: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
            <th className="py-3 px-4">Hipótese</th>
            <th className="py-3 px-4 w-40">Base legal</th>
            <th className="py-3 px-4 w-80">{colEfeito}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {itens.map((item, idx) => (
            <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3 px-4 align-top font-medium text-slate-900">{item.hipotese}</td>
              <td className="py-3 px-4 align-top whitespace-nowrap">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${item.badge}`}
                >
                  {item.base}
                </span>
              </td>
              <td className="py-3 px-4 align-top text-slate-700 leading-relaxed">{item.efeito}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SectionImunidades() {
  const [aba, setAba] = useState<'imunidades' | 'nao' | 'regimes' | 'auditoria'>('imunidades')

  const abas = [
    { id: 'imunidades', rotulo: 'Imunidades IBS/CBS', n: IMUNIDADES.length },
    { id: 'nao', rotulo: 'Não incidência', n: NAO_INCIDENCIA.length },
    { id: 'regimes', rotulo: 'Regimes favorecidos', n: REGIMES.length },
    { id: 'auditoria', rotulo: 'Auditoria da seção', n: AUDITORIA.length },
  ] as const

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
        <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-4xl">
          Rol integral do art. 9º e do art. 6º da LC 214/2025, conferido no texto oficial, mais os
          regimes favorecidos que costumam ser confundidos com imunidade.
        </p>
      </div>

      {/* Abas */}
      <div className="flex flex-wrap gap-2">
        {abas.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold border transition-colors ${
              aba === a.id
                ? 'bg-panorama-navy text-white border-panorama-navy'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {a.rotulo}
            <span
              className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded ${
                aba === a.id ? 'bg-white/20' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {a.n}
            </span>
          </button>
        ))}
      </div>

      {aba === 'imunidades' && (
        <div className="space-y-4">
          <Tabela itens={IMUNIDADES} colEfeito="O que significa na prática" />

          {/* Quadro dedicado: igrejas e cultos */}
          <div className="rounded-xl border-2 border-teal-300 bg-teal-50/50 overflow-hidden">
            <div className="bg-panorama-navy px-4 py-3 flex items-center gap-2">
              <Church className="w-5 h-5 text-panorama-gold-light shrink-0" />
              <h3 className="text-sm sm:text-base font-bold text-white">
                Igrejas e templos de qualquer culto — como funciona na prática
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg bg-white border border-emerald-200">
                  <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 mb-1.5 uppercase tracking-wide">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    O que é imune — o que a igreja fornece
                  </h4>
                  <ul className="text-xs text-slate-700 leading-relaxed space-y-1 list-disc pl-4">
                    <li>Cultos, missas e demais celebrações religiosas</li>
                    <li>Dízimos, ofertas e contribuições dos fiéis</li>
                    <li>Venda de artigos religiosos, livros e materiais de catequese</li>
                    <li>
                      Serviços e bens fornecidos pela própria entidade, inclusive por suas
                      organizações assistenciais e beneficentes
                    </li>
                  </ul>
                </div>
                <div className="p-3.5 rounded-lg bg-white border border-rose-200">
                  <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5 mb-1.5 uppercase tracking-wide">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    O que NÃO é imune — §4º do art. 9º
                  </h4>
                  <ul className="text-xs text-slate-700 leading-relaxed space-y-1 list-disc pl-4">
                    <li>
                      As <strong>aquisições</strong> da igreja: compras de bens e contratações de
                      serviços pagam IBS e CBS normalmente
                    </li>
                    <li>
                      A imunidade dos incisos I a III <strong>não alcança</strong> essas compras — a
                      lei é expressa no §4º
                    </li>
                    <li>Aluguel pago pela igreja ao locador é tributado na pessoa do locador</li>
                    <li>Folha de salários não entra no IBS/CBS (é outro tributo)</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Quem é considerado
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Pessoa jurídica de direito privado <strong>sem fins lucrativos</strong> cujo
                    objetivo é professar a fé e praticar a religião (art. 9º, §2º, I).
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Organização assistencial
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Também sem fins lucrativos, <strong>vinculada e mantida</strong> pela entidade
                    religiosa, que presta assistência social sem discriminação (art. 9º, §2º, II).
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Documento fiscal
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Imunidade <strong>não dispensa</strong> a emissão de documento fiscal eletrônico
                    (art. 60, §2º, I).
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Créditos:</strong> como regra, a imunidade anula os créditos das etapas
                  anteriores (art. 51). As exceções são exportação (art. 79), livros e periódicos e
                  radiodifusão gratuita (art. 51, §2º, II). Na prática, a igreja não destaca IBS e
                  CBS no que recebe, mas não recupera o tributo embutido no que compra.
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs leading-relaxed flex items-start gap-2">
                <Coins className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Também há imunidade no ITCMD:</strong> a LC 227/2026 acrescentou ao ITCMD
                  a imunidade nas transmissões <em>causa mortis</em> e por doação em que a entidade
                  religiosa ou o templo figure como sucessor ou donatário (art. 149, I, “c”),
                  inclusive suas organizações assistenciais e beneficentes. É outro tributo — fica
                  registrado para não parecer omissão.
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs leading-relaxed flex items-start gap-2">
            <Scale className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <strong>§1º do art. 9º:</strong> a imunidade dos entes públicos (inciso I) só vale
              para as finalidades essenciais, não alcança a exploração de atividade econômica
              sujeita às regras de empresa privada nem as operações com contraprestação, e não
              exonera o promitente comprador de imóvel.
            </div>
          </div>
        </div>
      )}

      {aba === 'nao' && (
        <div className="space-y-4">
          <Tabela itens={NAO_INCIDENCIA} colEfeito="Efeito" />
          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>§1º do art. 6º — a forma não salva a essência:</strong> o IBS e a CBS incidem
              sobre o conjunto de atos ou negócios jurídicos que, na essência, constitua operação
              onerosa com bem ou serviço, ainda que formalizada como fusão, cisão, doação ou
              operação com títulos e valores mobiliários.
            </div>
          </div>
        </div>
      )}

      {aba === 'regimes' && (
        <div className="space-y-4">
          <Tabela itens={REGIMES} colEfeito="Efeito" />
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs leading-relaxed flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <strong>Por que a distinção importa:</strong> imunidade está na Constituição e não
              pode ser revogada por lei ordinária; regime favorecido é benefício legal, tem prazo e
              pode ser extinto. Tratar Zona Franca de Manaus como imunidade é erro de qualificação
              que muda o prazo e a forma de defesa do contribuinte.
            </div>
          </div>
        </div>
      )}

      {aba === 'auditoria' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                  <th className="py-3 px-4 w-20">Tipo</th>
                  <th className="py-3 px-4">Achado</th>
                  <th className="py-3 px-4 w-96">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {AUDITORIA.map((a, i) => (
                  <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 align-top">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                          a.tipo === 'erro'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-indigo-100 text-indigo-800 border-indigo-300'
                        }`}
                      >
                        {a.tipo === 'erro' ? 'CORRIGIDO' : 'NOTA'}
                      </span>
                    </td>
                    <td className="py-3 px-4 align-top font-medium text-slate-900">{a.achado}</td>
                    <td className="py-3 px-4 align-top text-slate-700 leading-relaxed">
                      {a.situacao}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>Conferido no texto oficial:</strong> LC 214/2025 integral e compilada (art.
              8º, art. 9º e parágrafos, art. 6º e parágrafos, art. 51, art. 60 e arts. 439 a 461),
              RIBS (Resolução CGIBS 6/2026, arts. 9º e 10) e LC 227/2026 (art. 149). Base de
              consulta: normas.leg.br (Senado Federal) e DOU.
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        <div className="p-3.5 rounded-lg bg-teal-50/70 border border-teal-200">
          <h4 className="text-xs font-bold text-teal-900 flex items-center gap-1.5 mb-1">
            <Church className="w-4 h-4 text-teal-600" /> Igrejas e cultos
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed">
            Imunes no que fornecem, tributados no que compram.
          </p>
        </div>
        <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200">
          <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5 mb-1">
            <Users className="w-4 h-4 text-blue-600" /> Terceiro setor
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed">
            Educação e assistência social exigem os requisitos do art. 14 do CTN.
          </p>
        </div>
        <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
          <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 mb-1">
            <BookOpen className="w-4 h-4 text-emerald-600" /> Livros e cultura
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed">
            Livros e radiodifusão gratuita não anulam créditos.
          </p>
        </div>
      </div>
    </section>
  )
}
