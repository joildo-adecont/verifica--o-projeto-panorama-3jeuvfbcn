import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BadgeAlert,
  Calculator,
  CircleDollarSign,
  FileCheck2,
  Info,
  TrendingDown,
} from 'lucide-react'
import { REF_TOTAL, pct } from '@/data/aliquotas'

/**
 * CUSTO DO ERRO — quanto se paga a mais por escolher o regime errado
 *
 * ── POR QUE EXISTE ──
 * Todos os simuladores do Panorama respondem "quanto é". Nenhum respondia "quanto
 * custa errar". Esta calculadora compara o regime que a empresa adotou com o que
 * seria mais favorável, sobre uma receita informada, e mostra a diferença em reais
 * por mês e por ano.
 *
 * ── O QUE ESTE CÁLCULO É E O QUE NÃO É ──
 * É uma comparação ARITMÉTICA de alíquotas sobre a mesma base. Não é planejamento
 * tributário e não substitui análise contábil: há créditos, bases diferentes,
 * obrigações acessórias e limites legais que a conta não captura. A tela diz isso
 * de forma visível, não escondido no rodapé — porque um número grande e errado faz
 * mais estrago que nenhum número.
 *
 * ── BASE ──
 * A referência de 30,00% vem de src/data/aliquotas.ts; os fatores são os mesmos dos
 * simuladores setoriais. Nada é digitado aqui.
 */

/** Regimes com fator definido. Simples fica fora porque depende da faixa de RBT12. */
const REGIMES = [
  { id: 'regular', nome: 'Regime regular (pleno)', fator: 1, nota: 'sem redução' },
  { id: 'prof-30', nome: 'Profissão regulamentada (−30%)', fator: 0.7, nota: 'art. 127' },
  { id: 'imob-50', nome: 'Imóvel novo / lote (−50%)', fator: 0.5, nota: 'art. 255' },
  { id: 'agro-60', nome: 'Insumos agropecuários (−60%)', fator: 0.4, nota: 'art. 138' },
  { id: 'imob-70', nome: 'Locação residencial (−70%)', fator: 0.3, nota: 'art. 255, §1º' },
  { id: 'zero', nome: 'Alíquota zero', fator: 0, nota: 'cesta básica, imunidades' },
] as const

function brl(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 })
}

export function CustoDoErro() {
  const [receita, setReceita] = useState('100000')
  const [adotado, setAdotado] = useState('regular')
  const [correto, setCorreto] = useState('prof-30')

  const valorReceita = useMemo(() => {
    const limpo = receita
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^\d.]/g, '')
    const n = Number.parseFloat(limpo)
    return Number.isFinite(n) && n > 0 ? n : 0
  }, [receita])

  const regAdotado = REGIMES.find((r) => r.id === adotado) ?? REGIMES[0]
  const regCorreto = REGIMES.find((r) => r.id === correto) ?? REGIMES[1]

  const aliqAdotada = REF_TOTAL * regAdotado.fator
  const aliqCorreta = REF_TOTAL * regCorreto.fator

  const tribAdotado = (valorReceita * aliqAdotada) / 100
  const tribCorreto = (valorReceita * aliqCorreta) / 100
  const diferenca = tribAdotado - tribCorreto
  const pagandoAMais = diferenca > 0

  const mesmoRegime = adotado === correto

  return (
    <div className="space-y-4">
      {/* entrada */}
      <div className="rounded-xl border-2 border-slate-200 bg-white p-3.5">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Calculator className="w-4 h-4 text-panorama-gold-dark" />
          <p className="text-[12px] font-bold text-slate-900">
            Quanto custa estar no regime errado
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <label className="sm:col-span-1">
            <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">
              Receita do período (R$)
            </span>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                R$
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={receita}
                onChange={(e) => setReceita(e.target.value)}
                className="w-full pl-8 pr-2 py-2 rounded-lg border-2 border-slate-300 text-[12px] font-semibold text-slate-900 focus:outline-none focus:border-panorama-gold tabular-nums"
              />
            </div>
          </label>

          <label>
            <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">
              Regime que você adota hoje
            </span>
            <select
              value={adotado}
              onChange={(e) => setAdotado(e.target.value)}
              className="w-full rounded-lg border-2 border-slate-300 bg-white px-2 py-2 text-[12px] font-semibold text-slate-900 focus:outline-none focus:border-panorama-gold cursor-pointer"
            >
              {REGIMES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">
              Regime que seria aplicável
            </span>
            <select
              value={correto}
              onChange={(e) => setCorreto(e.target.value)}
              className="w-full rounded-lg border-2 border-slate-300 bg-white px-2 py-2 text-[12px] font-semibold text-slate-900 focus:outline-none focus:border-panorama-gold cursor-pointer"
            >
              {REGIMES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        {valorReceita === 0 && (
          <p className="text-[10px] text-slate-500 mt-2">
            Informe uma receita maior que zero para ver o cálculo.
          </p>
        )}
        {mesmoRegime && (
          <p className="text-[10px] text-amber-900 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mt-2 leading-snug">
            Os dois regimes são o mesmo — não há diferença a apurar. Escolha outro no segundo campo.
          </p>
        )}
      </div>

      {/* resultado */}
      {valorReceita > 0 && !mesmoRegime && (
        <>
          <div
            className={`rounded-xl border-2 p-3.5 ${
              pagandoAMais ? 'border-rose-300 bg-rose-50' : 'border-emerald-300 bg-emerald-50'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <span
                className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${
                  pagandoAMais ? 'bg-rose-200 text-rose-800' : 'bg-emerald-200 text-emerald-800'
                }`}
              >
                {pagandoAMais ? (
                  <TrendingDown className="w-5 h-5" />
                ) : (
                  <CircleDollarSign className="w-5 h-5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  {pagandoAMais
                    ? 'Você paga a mais, no regime atual'
                    : 'Você paga a menos, no regime atual'}
                </p>
                <p
                  className={`text-2xl sm:text-3xl font-extrabold tabular-nums leading-none mt-1 ${
                    pagandoAMais ? 'text-rose-900' : 'text-emerald-900'
                  }`}
                >
                  {brl(Math.abs(diferenca))}
                </p>
                <p className="text-[11px] text-slate-700 mt-1 leading-snug">
                  sobre {brl(valorReceita)} de receita · diferença de{' '}
                  <b className="tabular-nums">
                    {Math.abs(aliqAdotada - aliqCorreta)
                      .toFixed(2)
                      .replace('.', ',')}{' '}
                    pontos percentuais
                  </b>
                </p>
              </div>
            </div>

            {/* comparativo lado a lado */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="rounded-lg bg-white border border-slate-200 px-2.5 py-2">
                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                  Regime atual
                </p>
                <p className="text-[10px] text-slate-600 leading-tight truncate">
                  {regAdotado.nome}
                </p>
                <p className="text-[13px] font-extrabold text-slate-900 tabular-nums mt-1">
                  {brl(tribAdotado)}
                </p>
                <p className="text-[10px] text-slate-500 tabular-nums">
                  alíquota {pct(aliqAdotada)}
                </p>
              </div>
              <div className="rounded-lg bg-white border border-slate-200 px-2.5 py-2">
                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                  Regime correto
                </p>
                <p className="text-[10px] text-slate-600 leading-tight truncate">
                  {regCorreto.nome}
                </p>
                <p className="text-[13px] font-extrabold text-slate-900 tabular-nums mt-1">
                  {brl(tribCorreto)}
                </p>
                <p className="text-[10px] text-slate-500 tabular-nums">
                  alíquota {pct(aliqCorreta)}
                </p>
              </div>
            </div>

            <div className="mt-2 rounded-lg bg-white/70 border border-slate-200 px-2.5 py-2">
              <p className="text-[10px] font-bold text-slate-700">Se isso se repete todo mês:</p>
              <p className="text-[11px] text-slate-700 leading-snug mt-0.5">
                <b className="tabular-nums">{brl(Math.abs(diferenca) * 12)}</b> em 12 meses ·{' '}
                <b className="tabular-nums">{brl(Math.abs(diferenca) * 60)}</b> em 5 anos
              </p>
              {pagandoAMais && (
                <p className="text-[10px] text-amber-800 mt-1 leading-snug">
                  Esse valor sai do caixa sem virar crédito para ninguém — é carga definitiva.
                </p>
              )}
            </div>
          </div>

          {/* ressalvas — visíveis, não em rodapé */}
          <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-3.5">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 mb-1.5">
              <BadgeAlert className="w-3.5 h-3.5" />
              Antes de usar este número, leia isto
            </p>
            <ul className="space-y-1.5 text-[10px] text-amber-900 leading-snug">
              <li className="flex gap-1.5">
                <span className="font-bold shrink-0">1.</span>
                <span>
                  <b>É aritmética de alíquotas, não planejamento tributário.</b> A conta aplica a
                  alíquota sobre a mesma base. Se os dois regimes têm bases diferentes — como o
                  financeiro, cuja base é o juro e não o principal — o resultado não vale.
                </span>
              </li>
              <li className="flex gap-1.5">
                <span className="font-bold shrink-0">2.</span>
                <span>
                  <b>Crédito não está na conta.</b> O tributo que você paga vira crédito do seu
                  cliente. Pagar menos pode significar entregar menos crédito e perder
                  competitividade — o que não aparece em reais aqui.
                </span>
              </li>
              <li className="flex gap-1.5">
                <span className="font-bold shrink-0">3.</span>
                <span>
                  <b>Regime não é escolha livre.</b> Enquadramento depende do que a lei define (tipo
                  de imóvel, atividade, faixa de receita), não de qual alíquota é menor. Simular o
                  regime mais barato para uma operação que não se enquadra não reduz nada.
                </span>
              </li>
              <li className="flex gap-1.5">
                <span className="font-bold shrink-0">4.</span>
                <span>
                  <b>Simples não está aqui</b> porque a alíquota depende da faixa de RBT12 — usar
                  percentual fixo daria resultado falso. Para comparar com o Simples, use o
                  simulador da Seção 6E.
                </span>
              </li>
              <li className="flex gap-1.5">
                <span className="font-bold shrink-0">5.</span>
                <span>
                  <b>Obrigações acessórias não entram.</b> Custo de conformidade, folha, sistemas e
                  contabilidade podem inverter a conclusão em volumes pequenos.
                </span>
              </li>
            </ul>
            <a
              href="#simples"
              className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 hover:underline mt-2"
            >
              Comparar com o Simples na Seção 6E
              <ArrowRight className="w-2.5 h-2.5" />
            </a>
          </div>
        </>
      )}

      {/* como a conta é feita */}
      <div className="rounded-xl border-2 border-slate-200 bg-white p-3.5">
        <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-900 mb-1.5">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          Como a conta é feita
        </p>
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-2 font-mono text-[10px] text-slate-700 leading-relaxed overflow-x-auto">
          <div>alíquota_efetiva = {pct(REF_TOTAL)} × fator_do_regime</div>
          <div>tributo = receita × alíquota_efetiva ÷ 100</div>
          <div>diferença = tributo_adotado − tributo_correto</div>
          <div className="text-slate-500 mt-1">
            fator: pleno 1,00 · −30% 0,70 · −50% 0,50 · −60% 0,40 · −70% 0,30 · zero 0,00
          </div>
        </div>
        <p className="text-[9px] text-slate-400 mt-1.5 leading-snug flex items-start gap-1">
          <FileCheck2 className="w-2.5 h-2.5 shrink-0 mt-0.5" />
          Referência de {pct(REF_TOTAL)} conforme src/data/aliquotas.ts — CBS fixada pelo TCU em
          28/10/2026 e IBS da Res. CGIBS 14/2026. Valores em reais sem atualização monetária.
        </p>
      </div>
    </div>
  )
}
