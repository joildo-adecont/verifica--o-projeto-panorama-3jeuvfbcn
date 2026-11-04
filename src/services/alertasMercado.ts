/**
 * SERVIÇO — Alertas de mercado (sino do portal).
 *
 * Lê os registros da coleção `market_alerts` (gravados pelo job agendado
 * market_alerts_cron.js — dias úteis 06:00 UTC, limites 2% bolsa / 1,5% PTAX).
 * Falha de leitura = lista vazia + aviso transparente, nunca erro cru.
 */
import pb from '@/lib/pocketbase/client'

export interface AlertaMercado {
  id: string
  indice: string
  titulo: string
  mensagem: string
  variacaoPct: number
  direcao: 'alta' | 'baixa' | ''
  alertDate: string
  fonte: string
  linkUrl: string
  isRead: boolean
  criadoEm: string
}

const NOMES_INDICE: Record<string, string> = {
  ibovespa: 'Ibovespa',
  usd: 'Dólar (PTAX)',
  eur: 'Euro (PTAX)',
  sp500: 'S&P 500',
  dowjones: 'Dow Jones',
  nasdaq: 'Nasdaq',
}

export function nomeIndiceAlerta(indice: string): string {
  return NOMES_INDICE[indice] || indice
}

export async function fetchAlertasMercado(): Promise<{
  itens: AlertaMercado[]
  erro: boolean
  aviso: string
}> {
  try {
    const res = await pb.collection('market_alerts').getList(1, 20, {
      sort: '-alert_date,-created',
    })
    const itens: AlertaMercado[] = res.items.map((r) => ({
      id: r.id,
      indice: String(r.indice || ''),
      titulo: String(r.titulo || ''),
      mensagem: String(r.mensagem || ''),
      variacaoPct: Number(r.variacao_pct ?? 0),
      direcao: r.direcao === 'alta' ? 'alta' : r.direcao === 'baixa' ? 'baixa' : '',
      alertDate: String(r.alert_date || ''),
      fonte: String(r.fonte || ''),
      linkUrl: String(r.link_url || ''),
      isRead: r.is_read === true,
      criadoEm: String(r.created || ''),
    }))
    return { itens, erro: false, aviso: '' }
  } catch {
    return {
      itens: [],
      erro: true,
      aviso: 'Alertas de mercado indisponíveis neste momento — o serviço do backend não respondeu.',
    }
  }
}

/** Data em pt-BR a partir de 'YYYY-MM-DD …' ou ISO. */
export function formatarDataAlerta(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10)
  return d.toLocaleDateString('pt-BR')
}
