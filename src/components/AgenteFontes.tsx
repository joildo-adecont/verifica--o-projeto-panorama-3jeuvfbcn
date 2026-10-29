import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
  Radar,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import {
  ALERTAS,
  ALERTAS_ALTOS,
  CONTAGEM,
  EXECUCAO,
  FONTES_VIGIADAS,
  FONTES_COM_MUDANCA,
  HOUVE_MUDANCA,
  NORMAS_NO_PANORAMA,
  NORMAS_VIGIADAS,
  RESUMO_VARREDURA,
  TOTAL_ATIVAS,
  TOTAL_FALTANDO_FONTES,
  TOTAL_FONTES,
  type FonteVigiada,
  type StatusFonte,
} from '@/data/agenteFontes'
import { DestinatariosAgente } from '@/components/DestinatariosAgente'

/**
 * AGENTE DE VIGILÂNCIA DAS FONTES E ORIGENS DA LEGISLAÇÃO
 *
 * Card dentro do Monitor Legislativo (Seção 12A). Responde uma pergunta só:
 * "as fontes de onde esta legislação vem mudaram?"
 *
 * Como ele sabe: cada fonte tem uma assinatura de conteúdo guardada da varredura
 * anterior. Assinatura que diverge = fonte que mudou. O agente então diz o que
 * mudou, o que depende disso e onde olhar no Panorama.
 *
 * O que ele não faz: não adivinha. Fonte que não foi medida aparece como não
 * medida, e fonte inativa aparece com o motivo e o substituto — em vez de sumir
 * da lista e dar a impressão de que a cobertura é total.
 */

const CORES_STATUS: Record<StatusFonte, { selo: string; borda: string; rotulo: string }> = {
  ativa: {
    selo: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    borda: 'border-l-emerald-500',
    rotulo: 'ativa',
  },
  bloqueada: {
    selo: 'bg-rose-100 text-rose-800 border-rose-300',
    borda: 'border-l-rose-500',
    rotulo: 'bloqueada',
  },
  sem_rota: {
    selo: 'bg-amber-100 text-amber-800 border-amber-300',
    borda: 'border-l-amber-500',
    rotulo: 'sem rota',
  },
  nao_usar: {
    selo: 'bg-slate-200 text-slate-700 border-slate-300',
    borda: 'border-l-slate-400',
    rotulo: 'não usar',
  },
}

const ROTULO_TIPO_ALERTA = {
  novo: 'Ato novo',
  alterado: 'Texto alterado',
  indisponivel: 'Fonte indisponível',
} as const

function dataHora(iso: string) {
  if (!iso) return 'nunca executada'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AgenteFontes() {
  const ativas = FONTES_VIGIADAS.filter((f) => f.status === 'ativa')
  const inativas = FONTES_VIGIADAS.filter((f) => f.status !== 'ativa')

  return (
    <div
      id="agente-fontes"
      className="rounded-xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-50/80 to-white p-4 md:p-5 scroll-mt-24"
    >
      {/* Cabeçalho do agente */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-700 text-white shrink-0">
          <Radar className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-[220px]">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-900">
              Agente de Vigilância das Fontes e Origens da Legislação
            </h3>
            {HOUVE_MUDANCA ? (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white">
                <Bell className="w-2.5 h-2.5" />
                {FONTES_COM_MUDANCA.length} mudança(s)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                <ShieldCheck className="w-2.5 h-2.5" />
                tudo estável
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
            Verifica se as fontes de onde esta legislação vem mudaram, e avisa o que depende de cada
            uma. Roda toda quarta-feira às 11:00, junto com a rotina semanal.
          </p>
        </div>
      </div>

      {/* Situação da última varredura */}
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="rounded-lg bg-white border border-slate-200 px-2.5 py-2">
          <div className="flex items-center gap-1 text-slate-500 text-[9px] font-bold uppercase tracking-wide">
            <Clock className="w-2.5 h-2.5" />
            Última varredura
          </div>
          <p className="text-[11px] font-bold text-slate-900 mt-0.5">{dataHora(EXECUCAO)}</p>
        </div>
        <div className="rounded-lg bg-white border border-emerald-200 px-2.5 py-2">
          <div className="flex items-center gap-1 text-emerald-700 text-[9px] font-bold uppercase tracking-wide">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Fontes ativas
          </div>
          <p className="text-[11px] font-bold text-emerald-900 mt-0.5">
            {TOTAL_ATIVAS} de {TOTAL_FONTES}
          </p>
        </div>
        <div className="rounded-lg bg-white border border-slate-200 px-2.5 py-2">
          <div className="flex items-center gap-1 text-slate-500 text-[9px] font-bold uppercase tracking-wide">
            <Activity className="w-2.5 h-2.5" />
            Fora de rota
          </div>
          <p className="text-[11px] font-bold text-slate-900 mt-0.5">
            {TOTAL_FALTANDO_FONTES}
            <span className="font-normal text-slate-500"> com substituto</span>
          </p>
        </div>
        <div className="rounded-lg bg-white border border-indigo-200 px-2.5 py-2">
          <div className="flex items-center gap-1 text-indigo-700 text-[9px] font-bold uppercase tracking-wide">
            <ShieldCheck className="w-2.5 h-2.5" />
            Normas vigiadas
          </div>
          <p className="text-[11px] font-bold text-indigo-900 mt-0.5">
            {NORMAS_VIGIADAS}
            <span className="font-normal text-slate-500"> · {NORMAS_NO_PANORAMA} no Panorama</span>
          </p>
        </div>
      </div>

      {/* Resumo em texto, medido */}
      {RESUMO_VARREDURA && (
        <p className="mt-2 text-[10px] text-slate-500 font-mono bg-slate-50 border border-slate-200 rounded px-2 py-1">
          {RESUMO_VARREDURA}
        </p>
      )}

      {/* Alertas */}
      <div className="mt-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          {ALERTAS_ALTOS.length > 0 ? (
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          )}
          <h4 className="text-[11px] font-bold text-slate-900">
            {ALERTAS_ALTOS.length > 0
              ? `${ALERTAS_ALTOS.length} alerta(s) que exigem revisão`
              : 'Nenhum texto de lei mudou desde a última varredura'}
          </h4>
        </div>

        {ALERTAS.length === 0 && (
          <p className="text-[11px] text-slate-500 bg-white border border-slate-200 rounded px-2.5 py-2">
            Todas as fontes ativas com assinatura idêntica à anterior.
          </p>
        )}

        <div className="space-y-1.5">
          {ALERTAS.filter((a) => a.gravidade === 'alta').map((a) => (
            <div
              key={a.fonte + a.tipo}
              className="rounded-lg bg-rose-50 border border-rose-300 border-l-4 border-l-rose-600 px-3 py-2"
            >
              <div className="flex items-start gap-2 flex-wrap">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-[180px]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-rose-900">{a.rotulo}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white">
                      {ROTULO_TIPO_ALERTA[a.tipo]}
                    </span>
                  </div>
                  <p className="text-[10px] text-rose-800 mt-0.5 leading-snug">{a.descricao}</p>
                  {a.revisar.length > 0 && (
                    <p className="text-[10px] text-rose-700 mt-1">
                      <b>Revisar:</b> {a.revisar.join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {ALERTAS.filter((a) => a.gravidade === 'baixa').length > 0 && (
          <details className="mt-1.5">
            <summary className="text-[10px] font-bold text-slate-600 cursor-pointer hover:text-slate-900 select-none">
              {ALERTAS.filter((a) => a.gravidade === 'baixa').length} fonte(s) fora de rota — todas
              com substituto ativo
            </summary>
            <div className="space-y-1 mt-1.5">
              {ALERTAS.filter((a) => a.gravidade === 'baixa').map((a) => (
                <div
                  key={a.fonte + a.tipo}
                  className="rounded bg-white border border-slate-200 px-2.5 py-1.5"
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Info className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="text-[10px] font-bold text-slate-700">{a.rotulo}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug mt-0.5">{a.descricao}</p>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* As 16 fontes, com o que cada uma entrega */}
      <div className="mt-3">
        <h4 className="text-[11px] font-bold text-slate-900 mb-1.5">
          As {TOTAL_FONTES} fontes e origens que o agente acompanha
        </h4>

        <div className="space-y-1.5">
          {[...ativas, ...inativas].map((f: FonteVigiada) => {
            const c = CORES_STATUS[f.status] ?? CORES_STATUS.nao_usar
            return (
              <div
                key={f.id}
                className={`rounded border border-slate-200 bg-white border-l-4 ${c.borda} px-2.5 py-1.5`}
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  {f.status === 'ativa' ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  ) : f.status === 'bloqueada' ? (
                    <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
                  ) : f.status === 'sem_rota' ? (
                    <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-3 h-3 text-slate-400 shrink-0" />
                  )}
                  <span className="text-[11px] font-bold text-slate-900">{f.rotulo}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${c.selo}`}>
                    {c.rotulo}
                  </span>
                  {f.mudou && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white">
                      MUDOU
                    </span>
                  )}
                  <span className="ml-auto text-[9px] text-slate-400 hidden sm:inline">
                    {f.tipo.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="mt-0.5 pl-4.5">
                  {f.status === 'ativa' && f.verifica && (
                    <p className="text-[10px] text-slate-600 leading-snug">
                      <span className="text-slate-400">verifica:</span> {f.verifica}
                    </p>
                  )}
                  {f.status !== 'ativa' && f.motivo && (
                    <p className="text-[10px] text-rose-700 leading-snug">{f.motivo}</p>
                  )}
                  {f.status !== 'ativa' && f.substituto && f.substituto.length > 0 && (
                    <p className="text-[10px] text-emerald-700 leading-snug mt-0.5">
                      <ArrowRight className="inline w-2.5 h-2.5" /> coberta por:{' '}
                      {f.substituto.join(', ')}
                    </p>
                  )}
                  {f.detalhe && (
                    <p className="text-[9px] text-slate-400 mt-0.5 font-mono">{f.detalhe}</p>
                  )}
                </div>

                {f.status === 'ativa' && (
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-[9px] font-bold text-indigo-700 hover:underline ml-4.5 mt-0.5"
                  >
                    abrir fonte
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Quem recebe: escolha pelo cadastro */}
      <div className="mt-3">
        <DestinatariosAgente />
      </div>

      {/* Como o agente decide */}
      <div className="mt-3 rounded-lg border-l-4 border-indigo-500 bg-white px-3 py-2">
        <p className="text-[10px] text-slate-600 leading-relaxed">
          <b className="text-slate-900">Como o agente decide.</b> Cada fonte guarda uma assinatura
          de conteúdo da varredura anterior — o hash do texto, não a data da página. Assinatura que
          diverge significa ato novo ou texto alterado, e vira alerta vermelho com as seções a
          revisar. Fonte que falha vira alerta branco, com o substituto que cobre a função dela.
          Fonte sem medição não vira alerta nenhum: aparece como não medida, para não confundir
          silêncio com estabilidade.
        </p>
      </div>

      {/* Contagem crua, para conferência */}
      <div className="mt-2 flex flex-wrap gap-1.5 text-[9px] font-mono text-slate-500">
        {Object.entries(CONTAGEM).map(([k, v]) => (
          <span key={k} className="rounded bg-slate-100 px-1.5 py-0.5">
            {k}={v}
          </span>
        ))}
      </div>
    </div>
  )
}
