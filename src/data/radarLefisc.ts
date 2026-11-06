/**
 * RESULTADO DO RADAR LEFISC × FONTES OFICIAIS — dado versionado
 *
 * ARQUIVO GERADO por scripts/radar_lefisc/publicar_estado.py — não edite à mão.
 * A Seção 18 lê daqui para mostrar o cruzamento das duas fontes.
 *
 * POR QUE DADO ESTÁTICO E NÃO FETCH: a Lefisc não libera CORS, então o navegador
 * não consulta a API dela. O cruzamento roda no servidor (cron diário 08:00) e o
 * publish distribui o resultado. A tela mostra o retrato da última execução.
 */

export type Veredito = 'CONFIRMADO' | 'DIVERGENTE' | 'SO_OFICIAL' | 'SO_LEFISC'

export interface LinhaRadar {
  veredito: Veredito
  titulo: string
  /** link do DOU — sempre a referência citável */
  link: string
  data?: string
  secao?: string
  /** o que a Lefisc descreveu, quando ela também listou o ato */
  lefisc?: string
  /** quando DIVERGENTE: o que a Lefisc dizia de diferente (o DOU corrige) */
  divergencias?: string[]
  /** trecho relevante do texto integral do ato */
  trechoIntegra?: string
  /** como o trecho foi escolhido (Art. 1º, ementa, primeiro dispositivo) */
  criterioTrecho?: string
  /** tamanho do texto integral de onde o trecho saiu */
  caracteresIntegra?: number
  /** de onde veio a íntegra: Lefisc ou DOU */
  origemIntegra?: string
}

export interface RadarLefisc {
  executadoEm: string
  janelaDouDias: number
  fontes: { lefisc: { itens: number; ok: boolean }; dou: { itens: number; ok: boolean } }
  resumo: {
    divergentes: number
    confirmados: number
    soOficial: number
    soLefisc: number
    foraDoEscopo: number
  }
  linhas: LinhaRadar[]
  erros: string[]
}

/**
 * HIERARQUIA DAS FONTES — regra permanente do sistema (CEO, 31/10/2026).
 * O DOU é a fonte mestra: confirma, corrige e prevalece. A Lefisc é radar.
 */
export const FONTE_MESTRA = 'DOU'

export const RADAR_LEFISC: RadarLefisc = {
  executadoEm: '2026-11-06T08:34:53-03:00',
  janelaDouDias: 3,
  fontes: {
    lefisc: { itens: 65, ok: true },
    dou: { itens: 1, ok: true },
  },
  resumo: {
    divergentes: 0,
    confirmados: 2,
    soOficial: 0,
    soLefisc: 0,
    foraDoEscopo: 63,
  },
  linhas: [
    {
      veredito: 'CONFIRMADO',
      titulo: 'MEDIDA PROVISÓRIA Nº 1.399, DE 4 DE NOVEMBRO DE 2026',
      link: 'https://www.in.gov.br/web/dou/-/medida-provisoria-n-1.399-de-4-de-novembro-de-2026-741754451',
      data: '04/11/2026',
      secao: 'DO1_EXTRA_B',
      lefisc:
        'Estabelece alíquotas e normas complementares aplicáveis ao Imposto Seletivo para o ano-calendário de 2027, em Regime de Implementação Gradual.',
    },
    {
      veredito: 'CONFIRMADO',
      titulo: 'ATO TÉCNICO CONJUNTO RFB/SUFIS/CGIBS/DIRETORIA-EXECUTIVA Nº 10, DE 28 DE OUTUBRO D',
      link: 'https://www.in.gov.br/web/dou/-/ato-tecnico-conjunto-rfb/sufis/cgibs/diretoria-executiva-n-10-de-28-de-outubro-de-2026-741177669',
      data: '29/10/2026',
      secao: 'DO1_EXTRA_C',
      lefisc:
        'Dispõe sobre a aprovação conjunta da Secretaria Especial da Receita Federal do Brasil (RFB) e do Comitê Gestor do Imposto sobre Bens e Serviços (CGIBS) da documentação técnica dos ',
    },
  ],
  erros: [],
}
