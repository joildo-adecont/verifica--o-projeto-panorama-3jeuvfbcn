import { useMemo, useState } from 'react'
import {
  Globe2,
  Building2,
  Landmark,
  Search,
  X,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Radar,
  MapPin,
  ShieldAlert,
} from 'lucide-react'
import { RadarNacional } from './RadarNacional'

/**
 * SEÇÃO 19 — RADAR NACIONAL: FEDERAL, ESTADUAL E MUNICIPAL
 * ========================================================
 * Pedido do CEO (31/10/2026): replicar o radar dos diários oficiais nos estados e
 * municípios, para ter as atualizações legislativas nos três níveis e confrontá-las
 * com a Lefisc e com os órgãos oficiais de cada ente.
 *
 * HIERARQUIA DAS FONTES POR NÍVEL — regra escrita na tela, não só no código:
 *   FEDERAL   → o DOU é a fonte mestra; a Lefisc é radar, e o DOU corrige e prevalece.
 *   ESTADUAL  → o diário oficial do estado é a fonte primária do ato estadual.
 *   MUNICIPAL → o diário oficial do município é a fonte primária do ato municipal.
 * Em cada nível, quem PUBLICA confirma; o agregador apenas localiza. Esta é a mesma
 * regra que o CEO fixou para o DOU, aplicada a cada esfera.
 *
 * DE ONDE VÊM OS NÚMEROS: da varredura real de 31/10/2026 nas 22 instâncias do
 * SIGPub (diariomunicipal.com.br). Nada é estimado na tela: quando um dado não foi
 * medido, a tela diz que não foi medido.
 */

const DADOS = {
  gerado: '2026-11-01',
  periodo: {
    inicio: '2025-01-01',
    fim: '2026-11-01',
  },
  consultas: 9,
  associacoes: 22,
  entes: 2823,
  porUf: {
    PR: 48,
    RN: 38,
    RO: 35,
    RS: 29,
    MG: 26,
    PA: 21,
    PE: 19,
    AL: 9,
    CE: 7,
    AM: 5,
    PB: 3,
    RJ: 3,
    SP: 1,
    GO: 1,
  },
  achados: [
    {
      uf: 'SC',
      titulo:
        'PORTARIA N° 3724 de 26/10/2026 A SECRETÁRIA DE ESTADO DA EDUCAÇÃO, no uso das atribuições que lhe são conferidas pelo art. 106, §2º, inciso I, da Lei Complement',
      url: 'https://portal.doe.sea.sc.gov.br/v2.44.07/#/portal/edicao/buscar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MG',
      titulo:
        'almente substituidos pela Contribuicao sobre Bens e Servicos CBS, e o Imposto sobre Bens e Servicos IBS tera sua implementacao iniciada gradualmente; CONSIDERAN',
      url: 'https://www.jornalminasgerais.mg.gov.br/edicao-do-dia',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'ATO DO ORDENADOR DE DESPESAS PORTARIA GSI Nº 085',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/ab334c1a-f39b-4af1-864d-3f59240a81a9/download/2026-10-02.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'ATO DOS PROCURADORES-GERAIS RESOLUÇÃO CONJUNTA PGE/PGM Nº 231',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/ab334c1a-f39b-4af1-864d-3f59240a81a9/download/2026-10-02.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'ATO DO ORDENADOR DE DESPESAS PORTARIA GSI Nº 085',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/ab334c1a-f39b-4af1-864d-3f59240a81a9/download/2026-10-02.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'ATO DOS PROCURADORES-GERAIS RESOLUÇÃO CONJUNTA PGE/PGM Nº 231',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/ab334c1a-f39b-4af1-864d-3f59240a81a9/download/2026-10-02.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'SE',
      titulo:
        'ambiental, em conformidade com a Lei nº 8.628, de 05 de dezembro de 2019, bem como no atendimento às disposições da Emenda Constitucional (Federal) nº 132, de 2',
      url: 'https://iose.se.gov.br/diario-oficial',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'SE',
      titulo:
        'Art. 2º Este Decreto entra em vigor na data de sua publicação, produzindo efeitos a partir de 1º de julho de 2026, exceto quanto aos seguintes dispositivos do R',
      url: 'https://iose.se.gov.br/diario-oficial',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PR',
      titulo:
        'DECRETO Nº 19.659, DE 21 DE OUTUBRO DE 2026 - DISPÕE SOBRE A INSTITUIÇÃO DE COMISSÃO MUNICIPAL DE ACOMPANHAMENTO DA IMPLEMENTAÇÃO DA REFORMA TRIBUTÁRIA, DECORRENTE DA EMENDA CONSTITUCIONAL Nº 132, DE ',
      url: 'https://www.diariomunicipal.com.br/amp/materia/877F9305',
      assoc: 'amp',
      nivel: 'municipal',
    },
  ],
  portais: {
    ok: 0,
    pdf: 0,
    nav: 0,
    sem: 10,
    off: 17,
    total: 27,
  },
  conectores: [
    {
      uf: 'RS',
      nome: 'DOE/RS',
      ativo: true,
      modo: 'PDF integral · a API só indexa atas; critério próprio por nº de decreto',
      hits: 3,
      amostra: ['CGIBS'],
    },
    {
      uf: 'SP',
      nome: 'Diário Oficial do SP (DOE)',
      ativo: true,
      modo: 'API textual · critério próprio: termos e marcadores do DOE-SP',
      hits: 14,
      amostra: [
        'EDITAL Nº 106/2026, DE 1 DE OUTUBRO DE 2',
        'EDITAL Nº 95/2026, DE 1 DE OUTUBRO DE 20',
        'PREGÃO ELETRÔNICO Nº 005/2026 - COMUNICA',
      ],
    },
    {
      uf: 'SC',
      nome: 'Diário Oficial de SC (DOE)',
      ativo: true,
      modo: 'POST busca-materia · critério próprio + filtro Fundeb (falso positivo real)',
      hits: 1,
      amostra: ['PORTARIA N° 3724 de 26/10/2026 A SECRETÁ'],
    },
    {
      uf: 'PI',
      nome: 'Diário Oficial do Piauí',
      ativo: true,
      modo: 'Busca textual real (~22 s) · devolve nº da edição, caderno e PDF · 47 atos com IBS',
      hits: 47,
      amostra: [],
    },
    {
      uf: 'PR',
      nome: 'Diário Oficial do PR (DIOE)',
      ativo: true,
      modo: 'Elasticsearch aberto · critério próprio: decreto/IN por número',
      hits: 20,
      amostra: [
        '99 4ª FEIRA |28/OUT/2026 - EDIÇÃO N° 12.',
        '98 4ª FEIRA |28/OUT/2026 - EDIÇÃO N° 12.',
        '97 4ª FEIRA |28/OUT/2026 - EDIÇÃO N° 12.',
      ],
    },
    {
      uf: 'MG',
      nome: 'Jornal Minas Gerais (DIOE/MG)',
      ativo: true,
      modo: 'JWT anônimo · critério próprio SEF/MG',
      hits: 10,
      amostra: [
        'almente substituidos pela Contribuicao s',
        'O DIAMETRO SERVICO COMPLEMENTAR / CARACT',
        'dias uteis; 100% em ate 10 dias uteis, a',
      ],
    },
    {
      uf: 'ES',
      nome: 'Consulta Normas ES (SEGER)',
      ativo: true,
      modo: 'Consulta Normas SEGER · critério próprio; acervo normativo (prova: decreto 157)',
      hits: 1,
      amostra: ['DECRETO-R 00006356/2026 — Altera o Decre'],
    },
    {
      uf: 'MT',
      nome: 'Diário Oficial de MT (IOMAT)',
      ativo: true,
      modo: 'PDF integral · critério próprio (prova: decreto 25)',
      hits: 0,
      amostra: [],
    },
    {
      uf: 'MS',
      nome: 'Diário Oficial de MS (DOE/MS)',
      ativo: true,
      modo: 'API com trecho · critério próprio SEFAZ/MS',
      hits: 36,
      amostra: [
        'Complementar Federal nº 214, de 16 de ja',
        'empresa de pequeno porte e ao produtor r',
        'Melhoria Os Estados devem indicar suas e',
      ],
    },
    {
      uf: 'RJ',
      nome: 'Diário Oficial do RJ — dados abertos',
      ativo: true,
      modo: 'JSON diário completo (CKAN) · acervo A PARTIR DE 2025 (piso fixado) · 11.389 atos em 2025-2026',
      hits: 11389,
      amostra: ['I - Portaria', 'II - Pareceres', 'I - Edital'],
    },
    {
      uf: 'SE',
      nome: 'Diário Oficial de Sergipe (IOSE)',
      ativo: true,
      modo: 'Elasticsearch · critério próprio (prova: ICMS/decreto)',
      hits: 8,
      amostra: [
        'sexta-feira, 29 de Maio de 2026 Aracaju ',
        'Diário Oficial sexta-feira, 29 de Maio d',
        'segunda-feira, 30 de Março de 2026 Araca',
      ],
    },
    {
      uf: 'AC',
      nome: 'Diário Oficial do Acre',
      ativo: true,
      modo: 'Busca por palavra-chave (POST form) · exige mínimo de 4 caracteres · 20 atos',
      hits: 20,
      amostra: [],
    },
    {
      uf: 'AL',
      nome: 'Diário Oficial de Alagoas',
      ativo: true,
      modo: 'POST searchES · critério próprio (API ordena por score/1979)',
      hits: 14,
      amostra: [
        '227/2026. 4 Resolução CGIBS nº 6/2026, a',
        'REPRESENTANTE DO ESTADO DE ALAGOAS NO CO',
        '.****-05 Manu Martins - Zezo Alagoano Ag',
      ],
    },
    {
      uf: 'GO',
      nome: 'Diário Oficial de Goiás (ABC)',
      ativo: true,
      modo: 'PDF integral · plataforma apifront (prova: decreto 5)',
      hits: 0,
      amostra: [],
    },
    {
      uf: 'AM',
      nome: 'Diário Oficial do Amazonas (IOA)',
      ativo: true,
      modo: 'PDF integral · plataforma apifront (prova: decreto 6)',
      hits: 0,
      amostra: [],
    },
    {
      uf: 'RO',
      nome: 'Diário Oficial de Rondônia (DIOF)',
      ativo: true,
      modo: 'PDF por URL previsível · sumário pontilhado ignorado',
      hits: 0,
      amostra: [],
    },
    {
      uf: 'RN',
      nome: 'Diário Legislativo Eletrônico do RN (ALE-RN)',
      ativo: true,
      modo: 'Busca textual real (POST form) + PDF · o diário do Executivo saiu do ar',
      hits: 0,
      amostra: [],
    },
    {
      uf: 'RR',
      nome: 'Diário Oficial de Roraima (Imprensa Oficial)',
      ativo: true,
      modo: 'POST /_visualizar-doe/ · critério próprio (prova: decreto 6)',
      hits: 0,
      amostra: [],
    },
  ],
}

const NAVY = 'bg-panorama-navy'
const OURO = 'text-panorama-gold'

export function SectionRadarNacional() {
  const [uf, setUf] = useState<string>('')
  const [busca, setBusca] = useState('')
  const [nivel, setNivel] = useState<'todos' | 'municipal' | 'estadual' | 'federal'>('todos')

  const achados = useMemo(() => {
    const q = busca
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
    return DADOS.achados.filter((a) => {
      if (uf && a.uf !== uf) return false
      if (!q) return true
      const alvo = (a.titulo || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
      return alvo.includes(q)
    })
  }, [uf, busca])

  const totalUf = uf ? DADOS.porUf[uf] || 0 : DADOS.achados.length
  const maxUf = Math.max(...(Object.values(DADOS.porUf) as number[]), 1)

  return (
    <section className="max-w-6xl mx-auto space-y-5">
      {/* HERO */}
      <div className={NAVY + ' rounded-2xl overflow-hidden shadow-lg ring-1 ring-panorama-gold/40'}>
        <div className="px-5 py-4 md:px-7 md:py-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] font-bold tracking-[0.16em] uppercase bg-panorama-gold text-panorama-navy px-2 py-0.5 rounded">
              Radar nacional
            </span>
            <span className="text-[9px] font-bold tracking-wide uppercase text-panorama-gold-light/70">
              três níveis · uma regra
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">
            Diários oficiais do Brasil — federal, estadual e municipal
          </h2>
          <p className="text-[11.5px] text-slate-300 mt-1.5 leading-relaxed max-w-3xl">
            A mesma varredura que o radar faz no Diário Oficial da União, replicada nos diários dos
            estados e dos municípios. Cada nível tem a sua fonte mestra, e o confronto é sempre
            contra o órgão que publica.
          </p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {['Diário Oficial da União', 'diários estaduais', 'diários municipais (SIGPub)'].map(
              (t) => (
                <span
                  key={t}
                  className="text-[9px] font-semibold text-panorama-gold-light bg-white/10 ring-1 ring-panorama-gold/40 rounded px-1.5 py-0.5"
                >
                  {t}
                </span>
              ),
            )}
          </div>
        </div>
      </div>

      {/* A REGRA, EXPLICADA POR NÍVEL */}
      <div className="grid gap-3 md:grid-cols-3">
        {[
          {
            Icon: Landmark,
            titulo: 'Federal',
            fonte: 'Diário Oficial da União',
            texto:
              'O DOU é a fonte mestra. A Lefisc localiza o ato; o DOU confirma, corrige e prevalece. Divergência é registrada, não escondida.',
            cor: 'border-blue-300 bg-blue-50',
            icone: 'text-blue-700',
          },
          {
            Icon: Building2,
            titulo: 'Estadual',
            fonte: 'Diário oficial do estado',
            texto:
              'O diário do estado é a fonte primária do ato estadual. A Lefisc continua sendo radar: só entra o que o diário do estado publicou.',
            cor: 'border-emerald-300 bg-emerald-50',
            icone: 'text-emerald-700',
          },
          {
            Icon: MapPin,
            titulo: 'Municipal',
            fonte: 'Diário oficial do município',
            texto:
              'O diário do município é a fonte primária. Aqui a Lefisc não alcança — ela não indexa ato municipal.',
            cor: 'border-amber-300 bg-amber-50',
            icone: 'text-amber-700',
          },
        ].map((n) => (
          <div key={n.titulo} className={'rounded-xl border-2 p-3 ' + n.cor}>
            <div className="flex items-center gap-1.5 mb-1">
              <n.Icon className={'w-4 h-4 ' + n.icone} />
              <h3 className="text-[12px] font-bold text-slate-900">{n.titulo}</h3>
            </div>
            <p className="text-[9.5px] font-bold text-slate-600 uppercase tracking-wide mb-1">
              {n.fonte}
            </p>
            <p className="text-[10px] text-slate-700 leading-relaxed">{n.texto}</p>
          </div>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {[
          { v: DADOS.achados.length, r: 'matérias encontradas', s: 'com cara de ato normativo' },
          { v: Object.keys(DADOS.porUf).length, r: 'estados com resultado', s: 'de 27 unidades' },
          {
            v: DADOS.entes.toLocaleString('pt-BR'),
            r: 'entes municipais cobertos',
            s: DADOS.associacoes + ' associações SIGPub',
          },
          {
            v: DADOS.consultas,
            r: 'consultas na varredura',
            s:
              'período de ' +
              DADOS.periodo.inicio.slice(8, 10) +
              '/' +
              DADOS.periodo.inicio.slice(5, 7) +
              ' a ' +
              DADOS.periodo.fim.slice(8, 10) +
              '/' +
              DADOS.periodo.fim.slice(5, 7),
          },
        ].map((k, i) => (
          <div
            key={i}
            className="rounded-xl overflow-hidden ring-1 ring-panorama-gold/40 shadow-sm"
          >
            <div className={NAVY + ' px-3 py-2'}>
              <p className="text-lg font-bold text-white tabular-nums leading-none">{k.v}</p>
              <p className="text-[8.5px] font-semibold uppercase tracking-wide text-panorama-gold-light/80 mt-0.5">
                {k.r}
              </p>
            </div>
            <div className="bg-white px-3 py-1.5">
              <p className="text-[9px] text-slate-500 leading-tight">{k.s}</p>
            </div>
          </div>
        ))}
      </div>

      {/* POR UF */}
      <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
        <div className="bg-panorama-navy px-3 py-2 border-b-2 border-panorama-gold flex items-center gap-2">
          <Globe2 className="w-3.5 h-3.5 text-panorama-gold" />
          <h3 className="text-[11.5px] font-bold text-white">Resultado por estado</h3>
          <span className="ml-auto text-[9px] text-panorama-gold-light/80">
            clique para filtrar
          </span>
        </div>
        <div className="p-3 space-y-1">
          {Object.entries(DADOS.porUf).map(([s, n]) => (
            <button
              key={s}
              onClick={() => setUf(uf === s ? '' : s)}
              className={
                'w-full flex items-center gap-2 group ' +
                (uf === s ? 'opacity-100' : 'opacity-90 hover:opacity-100')
              }
            >
              <span
                className={
                  'w-7 text-[10px] font-bold ' +
                  (uf === s ? 'text-panorama-gold-dark' : 'text-slate-600')
                }
              >
                {s}
              </span>
              <span className="flex-1 h-3 rounded-sm bg-slate-100 overflow-hidden">
                <span
                  className={
                    'block h-full rounded-sm ' +
                    (uf === s ? 'bg-panorama-gold' : 'bg-panorama-navy')
                  }
                  style={{ width: Math.max(4, ((n as number) / maxUf) * 100) + '%' }}
                />
              </span>
              <span className="w-7 text-right text-[10px] font-bold tabular-nums text-slate-700">
                {n}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ACHADOS */}
      <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
        <div className="bg-panorama-navy px-3 py-2 border-b-2 border-panorama-gold flex flex-wrap items-center gap-2">
          <Radar className="w-3.5 h-3.5 text-panorama-gold" />
          <h3 className="text-[11.5px] font-bold text-white">Atos encontrados</h3>
          <span className="text-[9px] text-panorama-gold-light/80">
            {achados.length} de {DADOS.achados.length}
            {uf && ' · ' + uf}
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="relative">
              <Search className="w-3 h-3 text-slate-400 absolute left-1.5 top-1/2 -translate-y-1/2" />
              <input
                value={busca}
                onChange={(ev) => setBusca(ev.target.value)}
                onKeyDown={(ev) => {
                  if (ev.key === 'Escape') setBusca('')
                }}
                placeholder="filtrar por título"
                className="w-40 text-[10px] pl-6 pr-5 py-1 rounded border border-slate-300 focus:border-panorama-gold focus:outline-none"
              />
              {busca && (
                <button
                  onClick={() => setBusca('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>
            {uf && (
              <button
                onClick={() => setUf('')}
                className="text-[9px] font-bold text-panorama-navy bg-panorama-gold rounded px-1.5 py-0.5"
              >
                limpar {uf}
              </button>
            )}
          </div>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-slate-100 border-b border-slate-300">
              <tr>
                <th className="px-2 py-1 text-[9px] font-bold uppercase text-slate-600 w-10">UF</th>
                <th className="px-2 py-1 text-[9px] font-bold uppercase text-slate-600">Ato</th>
                <th className="px-2 py-1 text-[9px] font-bold uppercase text-slate-600 w-14">
                  Nível
                </th>
                <th className="px-2 py-1 text-[9px] font-bold uppercase text-slate-600 w-16 text-right">
                  Fonte
                </th>
              </tr>
            </thead>
            <tbody>
              {achados.map((a, i) => (
                <tr key={i} className={i % 2 ? 'bg-slate-50/60' : 'bg-white'}>
                  <td className="px-2 py-1 text-[9.5px] font-bold text-panorama-navy">{a.uf}</td>
                  <td className="px-2 py-1 text-[10px] text-slate-800 leading-snug">{a.titulo}</td>
                  <td className="px-2 py-1">
                    <span
                      className={
                        'text-[8.5px] font-bold rounded px-1 py-0.5 ' +
                        (a.nivel === 'estadual'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-sky-100 text-sky-800')
                      }
                    >
                      {a.nivel}
                    </span>
                  </td>
                  <td className="px-2 py-1 text-right">
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-blue-700 hover:underline"
                    >
                      abrir <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {achados.length === 0 && (
            <p className="px-3 py-6 text-center text-[11px] text-slate-500">
              Nenhuma matéria com esse filtro.
            </p>
          )}
        </div>
      </div>

      {/* ESTADO DOS PORTAIS ESTADUAIS — honestidade sobre o que falta */}
      <div className="rounded-xl border-2 border-amber-300 bg-amber-50/60 overflow-hidden">
        <div className="bg-amber-900 px-3 py-2 flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
          <h3 className="text-[11.5px] font-bold text-white">Estado real dos portais estaduais</h3>
          <span className="ml-auto text-[9px] text-amber-200">medido, não estimado</span>
        </div>
        <div className="p-3 space-y-2">
          <p className="text-[10px] text-slate-700 leading-relaxed">
            Os {DADOS.portais.total} diários estaduais foram sondados um a um. O resultado é
            desigual, e a tela mostra o número em vez de fingir cobertura total:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {[
              {
                n: DADOS.portais.ok,
                r: 'com busca por termo',
                c: 'text-emerald-700 bg-emerald-50 border-emerald-300',
              },
              {
                n: DADOS.portais.pdf,
                r: 'só PDF',
                c: 'text-amber-700 bg-amber-50 border-amber-300',
              },
              {
                n: DADOS.portais.nav,
                r: 'só com navegador',
                c: 'text-blue-700 bg-blue-50 border-blue-300',
              },
              {
                n: DADOS.portais.sem,
                r: 'sem busca evidente',
                c: 'text-slate-700 bg-slate-50 border-slate-300',
              },
              {
                n: DADOS.portais.off,
                r: 'não responderam',
                c: 'text-rose-700 bg-rose-50 border-rose-300',
              },
            ].map((x, i) => (
              <div key={i} className={'rounded-lg border p-2 text-center ' + x.c}>
                <p className="text-base font-bold tabular-nums leading-none">{x.n}</p>
                <p className="text-[8.5px] font-semibold uppercase tracking-wide mt-0.5 leading-tight">
                  {x.r}
                </p>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-1.5 rounded-lg bg-white border border-amber-200 p-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[9.5px] text-slate-700 leading-relaxed">
              <b>O que ainda falta:</b> a leitura automática de cada portal estadual exige um
              conector por site — endereços, formulário e formato de resposta são diferentes em cada
              um. O municipal já está funcionando porque 22 associações usam a mesma plataforma
              (SIGPub). O estadual avança ente por ente, a partir dos
              {DADOS.portais.ok} que já expõem busca por termo.
            </p>
          </div>
        </div>
      </div>

      {/* CONECTORES ESTADUAIS ATIVOS */}
      {DADOS.conectores.length > 0 && (
        <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/60 overflow-hidden">
          <div className="bg-emerald-800 px-3 py-2 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            <h3 className="text-[11.5px] font-bold text-white">Conectores estaduais ativos</h3>
            <span className="ml-auto text-[9px] text-emerald-200">lendo na fonte oficial</span>
          </div>
          <div className="p-3 space-y-2">
            {DADOS.conectores.map((c, i) => (
              <div key={i} className="rounded-lg bg-white border border-emerald-200 p-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-emerald-800">{c.uf}</span>
                  <span className="text-[10.5px] font-semibold text-slate-800">{c.nome}</span>
                  <span className="ml-auto text-[9.5px] font-bold text-emerald-700 bg-emerald-100 rounded px-1.5 py-0.5">
                    {c.hits} ocorrência{c.hits === 1 ? '' : 's'} na última varredura
                  </span>
                </div>
                <p className="text-[9.5px] text-slate-600 mt-1">{c.modo}</p>
                {c.amostra && c.amostra.length > 0 && (
                  <p className="text-[9px] text-slate-500 mt-0.5">
                    termos achados: {c.amostra.filter((x, j, a) => a.indexOf(x) === j).join(', ')}
                  </p>
                )}
              </div>
            ))}
            <p className="text-[9.5px] text-slate-600 leading-relaxed">
              O RS foi o primeiro estado instalado (pedido do CEO, 31/10/2026): a busca textual da
              API oficial cobre atas e editais, e o PDF integral da edição cobre leis e decretos — o
              conector lê as duas vias. Os demais estados entram na sequência, um conector por
              portal.
            </p>
          </div>
        </div>
      )}

      {/* MUNICÍPIOS AGRUPADOS POR UF — 5.570 IBGE COM CARREGAMENTO SOB DEMANDA */}
      <div className="pt-2">
        <RadarNacional initialUf={uf} />
      </div>

      {/* CAPITULAÇÃO */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500 mb-1">
          Origem dos dados e capitulação
        </p>
        <p className="text-[9.5px] text-slate-600 leading-relaxed">
          Varredura de <b>{DADOS.gerado}</b>, período <b>{DADOS.periodo.inicio}</b> a{' '}
          <b>{DADOS.periodo.fim}</b>, em <b>{DADOS.associacoes} associações</b> do SIGPub
          (diariomunicipal.com.br) e nos <b>{DADOS.portais.total} diários estaduais</b>. Base legal
          da reforma: EC 132/2023, LC 214/2025, LC 227/2026, Resolução CGIBS 6/2026. Ato federal
          confirmado no DOU; ato estadual confirmado no diário do estado; ato municipal confirmado
          no diário do município. Agregador não confirma nada — apenas localiza.
        </p>
      </div>
    </section>
  )
}
