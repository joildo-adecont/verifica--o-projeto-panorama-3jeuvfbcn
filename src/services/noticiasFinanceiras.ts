/**
 * SERVIÇO — Notícias financeiras oficiais (Banco Central).
 *
 * Consome EXCLUSIVAMENTE o proxy do backend /backend/v1/noticias-financeiras
 * (hook pocketbase/hooks/noticias_financeiras_route.js — RSS oficial do BCB,
 * cache news_cache). O navegador nunca fala direto com o feed. Quando o feed
 * falha, o backend responde com o cache + aviso transparente — nunca erro cru.
 */
import pb from '@/lib/pocketbase/client'

export interface NoticiaFinanceira {
  guid: string
  titulo: string
  link: string
  resumo: string
  publicadoEm: string
  fonte: string
}

export interface RespostaNoticias {
  ok: boolean
  fonteViva: boolean
  aviso: string
  itens: NoticiaFinanceira[]
}

export async function fetchNoticiasFinanceiras(): Promise<RespostaNoticias> {
  try {
    const res = (await pb.send('/backend/v1/noticias-financeiras', {
      method: 'GET',
    })) as unknown as RespostaNoticias
    if (res && Array.isArray(res.itens)) {
      return {
        ok: true,
        fonteViva: res.fonteViva !== false,
        aviso: String(res.aviso || ''),
        itens: res.itens.map((n) => ({
          guid: String(n.guid || n.titulo),
          titulo: String(n.titulo || ''),
          link: String(n.link || 'https://www.bcb.gov.br/saladeimprensa'),
          resumo: String(n.resumo || ''),
          publicadoEm: String(n.publicadoEm || ''),
          fonte: String(n.fonte || 'Banco Central do Brasil'),
        })),
      }
    }
  } catch {
    // proxy fora do ar → aviso transparente abaixo
  }
  return {
    ok: false,
    fonteViva: false,
    aviso: 'Serviço de notícias indisponível neste momento — tente atualizar o portal mais tarde.',
    itens: [],
  }
}
