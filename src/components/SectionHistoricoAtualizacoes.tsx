import { History, ExternalLink, Database, MapPin, CalendarClock } from 'lucide-react'

/**
 * Seção 13 — Histórico de Atualizações do Panorama.
 * Registro cronológico de todas as atualizações do sistema: data/hora,
 * fonte oficial consultada, caminho (onde foi aplicado) e conteúdo.
 * Alimentada pelo assistente a cada atualização (rotina semanal + sob demanda).
 *
 * POLÍTICA DE RETENÇÃO: mantém somente os registros dos últimos 30 dias —
 * registros mais antigos são filtrados automaticamente na renderização
 * (ver ehRecente). O array REGISTROS pode acumular; a seção exibe apenas
 * o que está dentro da janela.
 */

interface Registro {
  data: string // dd/mm/aaaa
  hora: string
  titulo: string
  conteudo: string
  fontes: { nome: string; url?: string }[]
  caminho: string
  versao?: string
}

/** Janela de retenção em dias (política do CEO: máximo 30 dias). */
const RETENCAO_DIAS = 30

/** Verifica se o registro está dentro da janela de retenção (≤ 30 dias). */
function ehRecente(dataBR: string): boolean {
  const [d, m, a] = dataBR.split('/').map(Number)
  const data = new Date(a, m - 1, d)
  const limite = new Date()
  limite.setDate(limite.getDate() - RETENCAO_DIAS)
  limite.setHours(0, 0, 0, 0)
  return data >= limite
}

const REGISTROS: Registro[] = [
  {
    data: '03/10/2026',
    hora: '00:20',
    titulo: 'Seção 7 — Extração item a item dos anexos da LC 214 e índice completo (Parcela 2)',
    conteudo:
      'Índice ampliado para os 23 anexos da LC 214 (XVIII–XXIII do Simples inclusos; XIV revogado pela LC 227/2026 registrado) e extração item a item da versão compilada do Planalto: Anexo VIII higiene (7 itens), Anexo XII dispositivos zero (17 itens), Anexo XIII acessibilidade zero (6 itens), Anexo XV hortifrúti (6 itens), Anexo VII alimentos 60% (17 itens), Anexo II educação (9 itens), Anexo III saúde (30 itens), Anexo IX insumos agro (35 itens); volumes dos Anexos IV (105), V (30), VI (81), X, XI e XVI (tabela 2029–2040) e XVII (IS, 7 grupos). Tabela de itens consultável dentro de cada anexo, com NCM/SH e NBS.',
    fontes: [
      {
        nome: 'LC 214/2025 compilada — Planalto',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm',
      },
      {
        nome: 'RIBS — Resolução CGIBS 6/2026 (PDF oficial)',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf',
      },
    ],
    caminho: 'Panorama (62493) — src/data/anexosCatalogo.ts + SectionAnexos.tsx (seção 7)',
    versao: '62493 v0.0.59',
  },
  {
    data: '02/10/2026',
    hora: '23:59',
    titulo:
      'Seção 7 — Anexos individualizados com conteúdo analítico e ícone de abertura (Parcela 1)',
    conteudo:
      'Anexos da reforma individualizados: 5 anexos do RIBS (depreciação art. 48; Repetro art. 164 c/ 4 tabelas; Reporto art. 186 §5º; bens de capital arts. 196-197; ZFM art. 521 §1º IV), anexos da LC 214 referenciados pelo Regulamento do IBS (I, II, III, IV, V, VI, VII, VIII, IX, XII, XV) e 5 anexos do Decreto 12.955/2026 (CBS). Cada anexo com ícone de abertura, base legal, efeito tributário, tabelas, volume de itens, conteúdo analítico, conexões com as demais seções e atalhos para os grupos do Simulador; busca interna por anexo/artigo/NCM. Correção de fidelidade: CST do IBS e CBF saíram do quadro — não constam dos anexos do RIBS (são atos técnicos conjuntos, IT 2025.002).',
    fontes: [
      {
        nome: 'RIBS — Resolução CGIBS 6/2026 (PDF oficial)',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf',
      },
      {
        nome: 'LC 214/2025 — Planalto',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
      },
      {
        nome: 'Decreto 12.955/2026 — Planalto',
        url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/D12955.htm',
      },
    ],
    caminho: 'Panorama (62493) — src/data/anexosCatalogo.ts + SectionAnexos.tsx (seção 7)',
    versao: '62493 v0.0.57',
  },
  {
    data: '02/10/2026',
    hora: '02:28',
    titulo: 'Navegação do Panorama: menu lateral, teclas de atalho e ícones coloridos',
    conteudo:
      'Menu lateral fixo "Acesso Rápido" com as 13 seções; teclas de atalho 1–9, Q, W e H em toda a página; ícones coloridos por seção no menu principal e no lateral; item "Histórico de Atualizações" criado (esta seção). Página 404 blindada: caminhos antigos do Panorama redirecionam para a home.',
    fontes: [{ nome: 'Interno — Sistema ADECONT (projeto Panorama)' }],
    caminho: 'Panorama (62493) — menus principal e lateral; App.tsx; NotFound.tsx',
    versao: 'v0.0.47–52',
  },
  {
    data: '02/10/2026',
    hora: '01:18',
    titulo: 'Correção do retorno do Simulador ao Panorama',
    conteudo:
      'Os links "← Voltar ao Panorama" do Simulador, Cadastro & Envios e página de confirmação passam a apontar para a home do app React (/). Rotas de fallback criadas para /panorama-reforma/index.html e /panorama-reforma. Validado com clique real em produção.',
    fontes: [{ nome: 'Interno — Sistema ADECONT (projeto Panorama)' }],
    caminho:
      'Panorama (62493) — simulador.html, envios.html, recebido.html (raiz e /panorama-reforma/), App.tsx',
    versao: 'v0.0.41–46',
  },
  {
    data: '02/10/2026',
    hora: '01:04',
    titulo: 'Simulador/Cadastro/Envios consolidados somente no Panorama',
    conteudo:
      'Removidas do Financeiro (56819) as cópias do Simulador, Cadastro & Envios, catálogo, hook de envio e migration 0049. Regra definitiva: Simulador, Cadastro, Envios e o backend (coleções, hook, SMTP) vivem SOMENTE no Panorama (62493). Botão do Financeiro aponta para o Panorama.',
    fontes: [{ nome: 'Interno — Sistema ADECONT (projetos 56819 e 62493)' }],
    caminho: 'Financeiro (56819) — remoção de 6 arquivos; Panorama (62493) — único dono do módulo',
    versao: '56819 v0.0.89–90',
  },
  {
    data: '01/10/2026',
    hora: '22:00',
    titulo: 'Seção 12 — Índice das fontes oficiais primárias (110 bases)',
    conteudo:
      'Índice completo das 110 bases de dados oficiais, casadas com o link do órgão e classificadas em 6 grupos: Reforma IBS/CBS (18), Fiscal/NF-e/SPED (43), Serviços NBS/ISS/NFS-e (10), ICMS/CONFAZ (9), Comércio exterior (18), Empresas/trabalho (8). Cada linha traz órgão, situação datada e link oficial.',
    fontes: [
      {
        nome: 'Buscador NCM — página de fontes (agregador)',
        url: 'https://buscadorncm.com.br/fontes',
      },
      { nome: 'Órgãos primários: Receita Federal, CONFAZ, ENCAT, Planalto, IBGE, MDIC, CGIBS' },
    ],
    caminho:
      'Panorama — seção 12 (56819: parte-conteudo-6.html; 62493: SectionFontesPrimarias.tsx)',
    versao: '56819 v0.0.88 · 62493 v0.0.39–40',
  },
  {
    data: '01/10/2026',
    hora: '21:34',
    titulo: 'Seção 11 — Fontes de referência: agregadores especializados',
    conteudo:
      'Inclusão do Buscador NCM como fonte secundária (com alerta de natureza não oficial), destacada para pesquisa, conferência cruzada e simulações. Tabela das 6 bases mais relevantes com situação datada em 01/10/2026 (cClassTrib IT 2025.002 v1.70, Calculadora RTC banco V0059, regimes por NCM, cCredPres, NTs da reforma).',
    fontes: [
      {
        nome: 'Buscador NCM — fontes oficiais e datas de atualização',
        url: 'https://buscadorncm.com.br/fontes',
      },
      {
        nome: 'Receita Federal / Serpro — Calculadora RTC (banco V0059)',
        url: 'https://consumo.tributos.gov.br/servico/calcular-tributos-consumo/calculadora-offline-download',
      },
    ],
    caminho:
      'Panorama — seção 11 (56819: parte-conteudo-5.html; 62493: SectionFontesAgregador.tsx)',
    versao: '56819 v0.0.87',
  },
  {
    data: '01/10/2026',
    hora: '02:13',
    titulo: 'Simulador de Transição v2 — componentes individuais e catálogo ampliado',
    conteudo:
      '4 componentes com botões liga/desliga (CBS, IBS Estadual, IBS Municipal, Imposto Seletivo), ano-teste 2026 correto (CBS 0,9% / IBS 0,05%+0,05%; IS não incide), capitulação legal separada por componente. Catálogo ampliado de 45 para 118 itens (cesta básica 49, saúde/educação 19, red.30% 5, dispositivos 11, insumos agro 4, IS 13, regimes especiais 10, regulares).',
    fontes: [
      {
        nome: 'LC 214/2025 — Anexos I, II, III, IV, IX, XV e XVII (Planalto)',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
      },
      {
        nome: 'RIBS — Resolução CGIBS 6/2026',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf',
      },
      {
        nome: 'Decreto 12.955/2026 — Regulamento CBS, Anexo IV',
        url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/D12955.htm',
      },
    ],
    caminho: 'Panorama (62493) — simulador.html + partes/sim-catalogo.js',
    versao: '62493 v0.0.36–38 · 56819 v0.0.84–85',
  },
  {
    data: '30/09/2026',
    hora: '19:34',
    titulo: 'Seção 10 — Resoluções CGIBS: inventário e busca no texto integral',
    conteudo:
      'Inventário completo das 18 Resoluções CGIBS de 2026 (ementa, categoria, PDF oficial) + busca no texto integral com 1.213 trechos indexados, filtros por resolução e acentos opcionais. Testada em produção ("split payment" → 13 trechos em 12ms).',
    fontes: [
      { nome: 'CGIBS — Resoluções (fonte oficial)', url: 'https://www.cgibs.gov.br/resolucoes' },
    ],
    caminho: 'Panorama — seção 10 + busca-resolucoes.html',
    versao: '56819 v0.0.65–68',
  },
  {
    data: '30/09/2026',
    hora: '22:08',
    titulo: 'Seções 2, 2A, 2C e 2D — marco normativo e códigos de classificação',
    conteudo:
      'Seção 2 expandida (marco normativo multi-instrumento: EC 132, LC 214/227, Decreto CBS, RIBS, atos conjuntos, CGSN); 2A com mapa artigo→produto/serviço→anexo e 12 grupos de tributação; 2C com códigos NCM dos Anexos do RIBS (depreciação 237, REPORTO 14, bens de capital 98, ZFM 16); 2D com NBS de educação (9) e saúde (30) da LC 214 e dispositivos médicos NCM (92).',
    fontes: [
      {
        nome: 'LC 214/2025 consolidada (Planalto)',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
      },
      {
        nome: 'RIBS — Resolução CGIBS 6/2026 (cgibs.gov.br)',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf',
      },
      {
        nome: 'Decreto 12.955/2026 (Planalto)',
        url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/D12955.htm',
      },
    ],
    caminho: 'Panorama — seções 2/2A/2C/2D (parte-conteudo-1.html)',
    versao: '56819 v0.0.77–80',
  },
  {
    data: '30/09/2026',
    hora: '11:02',
    titulo: 'Panorama da Reforma Tributária publicado — versão inicial',
    conteudo:
      'Publicação do Panorama com 9 seções: arcabouço normativo, fato gerador/incidência, cesta básica, imunidades, isenções/diferimentos/reduções, regimes específicos (destaque consórcios e cartas de contemplação), anexos, cronograma 2026–2033 e fontes oficiais. Com busca, sumário clicável e auto-atualização.',
    fontes: [
      {
        nome: 'Planalto — LC 214/2025 e LC 227/2026',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
      },
      {
        nome: 'Receita Federal — orientações da Reforma Tributária do Consumo',
        url: 'https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/reforma-tributaria-do-consumo/orientacoes-da-reforma-tributaria',
      },
      {
        nome: 'CGIBS — resoluções e Regulamento do IBS',
        url: 'https://www.cgibs.gov.br/resolucoes',
      },
    ],
    caminho: 'Panorama — seções 1 a 9',
    versao: '56819 v0.0.64',
  },
]

// Política de retenção: exibe somente registros dos últimos 30 dias.
const VISIVEIS = REGISTROS.filter((r) => ehRecente(r.data))

export function SectionHistoricoAtualizacoes() {
  return (
    <section id="historico-atualizacoes" className="scroll-mt-24">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-lime-700">Seção 13</p>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-lime-200 bg-lime-50 text-lime-600">
              <History className="w-4 h-4" />
            </span>
            Histórico de Atualizações
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Registro cronológico de todas as atualizações do Panorama: data e hora, fonte oficial
            consultada, caminho aplicado no sistema e conteúdo da mudança. Alimentado pelo
            assistente a cada atualização — na rotina semanal (segundas, 11h) e sob demanda.
          </p>
        </div>

        <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-900 flex items-start gap-2">
          <CalendarClock className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
          <p>
            <strong>Política de retenção:</strong> esta seção mantém somente os registros dos{' '}
            <strong>últimos 30 dias</strong> — atualizações mais antigas são removidas
            automaticamente. Exibindo {VISIVEIS.length} registro{VISIVEIS.length === 1 ? '' : 's'}{' '}
            no momento.
          </p>
        </div>

        <div className="rounded-lg border-l-4 border-blue-600 bg-blue-50 p-4 text-sm text-blue-900 flex items-start gap-2">
          <Database className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" />
          <p>
            <strong>Como ler cada registro:</strong> o <strong>caminho</strong> indica onde a
            atualização foi aplicada (arquivo/seção/projeto); as <strong>fontes</strong> são os
            documentos oficiais que fundamentam o conteúdo; a <strong>versão</strong> é o registro
            no histórico de versões do Skip (QA + publish). O histórico externo das tabelas fiscais
            (o que mudou de alíquota, com data e ato) continua disponível no{' '}
            <a
              href="https://buscadorncm.com.br/atualizacoes"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold inline-flex items-center gap-0.5"
            >
              Buscador NCM <ExternalLink className="w-3 h-3" />
            </a>
            .
          </p>
        </div>

        {/* Linha do tempo cronológica — mais recente primeiro, janela de 30 dias */}
        <ol className="relative border-l-2 border-slate-200 ml-3 space-y-6">
          {VISIVEIS.map((r, i) => (
            <li key={i} className="ml-6">
              <span className="absolute -left-[11px] flex items-center justify-center w-5 h-5 rounded-full bg-lime-500 border-4 border-white shadow" />
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-white border border-slate-200 rounded-md px-2 py-0.5">
                    <CalendarClock className="w-3.5 h-3.5 text-lime-600" />
                    {r.data} às {r.hora}
                  </span>
                  {r.versao && (
                    <span className="font-mono text-[11px] text-slate-500 bg-white border border-slate-200 rounded-md px-2 py-0.5">
                      {r.versao}
                    </span>
                  )}
                </div>

                <h3 className="text-sm md:text-base font-bold text-slate-900 leading-snug">
                  {r.titulo}
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed">{r.conteudo}</p>

                <div className="flex items-start gap-1.5 text-xs text-slate-600">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-orange-500" />
                  <span>
                    <strong>Caminho:</strong> {r.caminho}
                  </span>
                </div>

                <div className="flex items-start gap-1.5 text-xs text-slate-600">
                  <Database className="w-3.5 h-3.5 mt-0.5 shrink-0 text-violet-500" />
                  <span>
                    <strong>
                      Fonte{r.fontes.length > 1 ? 's' : ''} oficial{r.fontes.length > 1 ? 'is' : ''}
                      :
                    </strong>{' '}
                    {r.fontes.map((f, j) => (
                      <span key={j}>
                        {j > 0 && ' · '}
                        {f.url ? (
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-700 hover:underline font-medium"
                          >
                            {f.nome}
                          </a>
                        ) : (
                          f.nome
                        )}
                      </span>
                    ))}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ol>

        {!VISIVEIS.length && (
          <p className="text-sm text-slate-500 py-6 text-center">
            Nenhuma atualização nos últimos 30 dias.
          </p>
        )}
      </div>
    </section>
  )
}
