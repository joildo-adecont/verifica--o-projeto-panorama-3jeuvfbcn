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
  executadoEm: '2026-10-31T14:28:19-03:00',
  janelaDouDias: 7,
  fontes: {
    lefisc: { itens: 10, ok: true },
    dou: { itens: 2, ok: true },
  },
  resumo: {
    divergentes: 0,
    confirmados: 1,
    soOficial: 1,
    soLefisc: 0,
    foraDoEscopo: 9,
  },
  linhas: [
    {
      veredito: 'CONFIRMADO',
      titulo: 'ATO TÉCNICO CONJUNTO RFB/SUFIS/CGIBS/DIRETORIA-EXECUTIVA Nº 10, DE 28 DE OUTUBRO D',
      link: 'https://www.in.gov.br/web/dou/-/ato-tecnico-conjunto-rfb/sufis/cgibs/diretoria-executiva-n-10-de-28-de-outubro-de-2026-741177669',
      data: '29/10/2026',
      secao: 'DO1_EXTRA_C',
      lefisc:
        'Dispõe sobre a aprovação conjunta da Secretaria Especial da Receita Federal do Brasil (RFB) e do Comitê Gestor do Imposto sobre Bens e Serviços (CGIBS) da documentação técnica dos ',
    },
    {
      veredito: 'SO_OFICIAL',
      titulo: 'ATO TÉCNICO CONJUNTO RFB/CGIBS Nº 9, DE 20 DE OUTUBRO DE 2026',
      link: 'https://www.in.gov.br/web/dou/-/ato-tecnico-conjunto-rfb/cgibs-n-9-de-20-de-outubro-de-2026-740391670',
      data: '26/10/2026',
      secao: 'DO1',
    },
  ],
  erros: [],
}
