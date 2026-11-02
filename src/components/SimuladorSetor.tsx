import { useState } from 'react'
import {
  Fuel,
  HeartPulse,
  GraduationCap,
  UtensilsCrossed,
  UsersRound,
  Trophy,
  Ship,
  Globe,
  Scale,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Layers,
  Calculator,
} from 'lucide-react'
import { REF_TOTAL as REF_TOTAL_ALIQ, pct } from '@/data/aliquotas'

/**
 * SIMULADORES SETORIAIS — os 8 setores novos, no padrão das Seções 6A–6F
 * =========================================================================
 *
 * Pedido do CEO (02/11/2026): "Pode criar nos oito setores os simuladores.
 * Padrão da exceção seis A e seis F."
 *
 * ── O QUE "PADRÃO 6A–6F" SIGNIFICA AQUI ──
 * As seis seções setoriais antigas têm, cada uma, um simulador com:
 *   1. Hero navy/dourado com a capitulação legal em selo;
 *   2. Campos de entrada à esquerda, KPIs à direita;
 *   3. Resultado marcado quando é ESTIMATIVA (nunca fingindo ser apuração);
 *   4. Bloco do que ainda depende de regulamento;
 *   5. Rodapé de capitulação (lei · decreto · resolução · referência).
 * Este arquivo replica essa estrutura uma vez e liga os oito setores a ela.
 *
 * ── A REGRA QUE NÃO SE NEGOCIA ──
 * Simulador aqui é ESTIMADOR DE ORDEM DE GRANDEZA, não apuração fiscal. Onde a
 * lei depende de ato posterior (alíquota ad rem, percentual de crédito
 * presumido), o campo é EDITÁVEL e a tela diz que o número é do usuário, não
 * nosso. Inventar um valor fixo e apresentá-lo como certo seria o pior defeito
 * possível num sistema que o CEO usa para conversar com cliente.
 *
 * ── FONTE DAS ALÍQUOTAS ──
 * `@/data/aliquotas` — fonte única. Hoje: CBS 11,30% + IBS 18,70% = 27,91%
 * (Res. CGIBS 14/2026 e cálculo do TCU).
 */

const REF_TOTAL = REF_TOTAL_ALIQ

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 })
const num = (v: number, d = 2) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })

/* ────────────────────────── design system (padrão 6A–6F) ────────────────── */

function Hero({
  numero,
  titulo,
  sub,
  capitulacao,
}: {
  numero: string
  titulo: string
  sub: string
  capitulacao: string
}) {
  return (
    <div className="rounded-xl border border-panorama-gold/40 bg-panorama-navy p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-panorama-gold/20 font-mono text-[11px] font-bold text-panorama-gold ring-1 ring-panorama-gold/50">
          {numero}
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-white sm:text-lg">{titulo}</h3>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-300">{sub}</p>
          <span className="mt-1.5 inline-flex items-center gap-1 rounded border border-panorama-gold/40 bg-white/5 px-1.5 py-0.5 text-[9.5px] font-bold text-panorama-gold">
            📎 {capitulacao}
          </span>
        </div>
      </div>
    </div>
  )
}

function Kpi({
  titulo,
  valor,
  sub,
  destaque,
}: {
  titulo: string
  valor: string
  sub?: string
  destaque?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        destaque
          ? 'border-panorama-navy bg-gradient-to-br from-panorama-navy to-panorama-navy-light shadow-md'
          : 'border-slate-200 bg-white'
      }`}
    >
      <div
        className={`text-[9.5px] font-bold uppercase tracking-wider ${
          destaque ? 'text-panorama-gold-light' : 'text-slate-500'
        }`}
      >
        {titulo}
      </div>
      <div
        className={`mt-0.5 text-lg font-black tabular-nums ${
          destaque ? 'text-panorama-gold-light' : 'text-slate-900'
        }`}
      >
        {valor}
      </div>
      {sub && (
        <div className={`mt-0.5 text-[10.5px] ${destaque ? 'text-white/70' : 'text-slate-500'}`}>
          {sub}
        </div>
      )}
    </div>
  )
}

function Campo({
  rotulo,
  valor,
  set,
  sufixo,
  passo = 1,
  min = 0,
  dica,
}: {
  rotulo: string
  valor: number
  set: (v: number) => void
  sufixo?: string
  passo?: number
  min?: number
  dica?: string
}) {
  return (
    <label className="block">
      <span className="block text-[10.5px] font-bold text-slate-600">{rotulo}</span>
      <span className="mt-0.5 flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 focus-within:border-panorama-gold">
        <input
          type="number"
          value={Number.isFinite(valor) ? valor : 0}
          min={min}
          step={passo}
          onChange={(e) => set(Number(e.target.value))}
          className="min-h-[40px] w-full bg-transparent text-[13px] font-semibold tabular-nums text-slate-900 outline-none"
        />
        {sufixo && <span className="shrink-0 text-[10px] font-bold text-slate-400">{sufixo}</span>}
      </span>
      {dica && (
        <span className="mt-0.5 block text-[9.5px] leading-snug text-slate-400">{dica}</span>
      )}
    </label>
  )
}

function Selo({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
        ok
          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
          : 'border-amber-300 bg-amber-50 text-amber-700'
      }`}
    >
      {ok ? '✓' : '⚠'} {texto}
    </span>
  )
}

function Linha({ k, v, forte }: { k: string; v: string; forte?: boolean }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-2 border-b border-slate-100 py-1 last:border-0 ${
        forte ? 'font-bold' : ''
      }`}
    >
      <span className={`text-[11.5px] ${forte ? 'text-panorama-navy' : 'text-slate-600'}`}>
        {k}
      </span>
      <span className="shrink-0 font-mono text-[11.5px] tabular-nums text-slate-900">{v}</span>
    </div>
  )
}

function Rodape({ itens }: { itens: string[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5 rounded-lg bg-slate-50 p-2">
      {itens.map((i, k) => (
        <span
          key={k}
          className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-[9px] text-slate-600"
        >
          {i}
        </span>
      ))}
    </div>
  )
}

function Pendente({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2.5">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
      <p className="text-[11px] leading-relaxed text-slate-700">{children}</p>
    </div>
  )
}

/* ══════════════════════════ 20 · COMBUSTÍVEIS ══════════════════════════════
 * Arts. 172-180. Incidência ÚNICA e alíquota AD REM (valor por unidade).
 * A lei NÃO fixa o valor no texto: ele vem de ato conjunto anual. Por isso o
 * campo do valor por litro é editável e começa em zero — a tela obriga o
 * usuário a informar de onde tirou o número. */
function SimCombustiveis() {
  const [litros, setLitros] = useState(1000)
  const [precoLitro, setPrecoLitro] = useState(6.0)
  const [adRemIbs, setAdRemIbs] = useState(0)
  const [adRemCbs, setAdRemCbs] = useState(0)
  const [revenda, setRevenda] = useState(true)

  const valorOperacao = litros * precoLitro
  const ibs = litros * adRemIbs
  const cbs = litros * adRemCbs
  const total = ibs + cbs
  const temAdRem = adRemIbs > 0 || adRemCbs > 0
  const efetiva = valorOperacao > 0 ? (total / valorOperacao) * 100 : 0
  // comparação com o regime anterior (percentual) apenas como ordem de grandeza
  const comparativoPercentual = (valorOperacao * REF_TOTAL) / 100
  const diferenca = total - comparativoPercentual

  return (
    <div className="space-y-3">
      <Hero
        numero="20"
        titulo="Simulador — combustíveis (alíquota ad rem)"
        sub="O tributo incide uma única vez sobre a operação, com valor fixo por unidade de medida — não percentual sobre o preço."
        capitulacao="LC 214/2025, arts. 172-180"
      />
      <div className="grid gap-3 lg:grid-cols-[1fr,1.15fr]">
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
          <Campo rotulo="Quantidade" valor={litros} set={setLitros} sufixo="L" passo={100} />
          <Campo
            rotulo="Preço de venda por litro"
            valor={precoLitro}
            set={setPrecoLitro}
            sufixo="R$/L"
            passo={0.1}
          />
          <div className="rounded-lg bg-blue-50 p-2 text-[10px] leading-snug text-blue-900">
            Os valores por unidade vêm de <b>ato conjunto anual</b> (art. 174). Informe abaixo o
            valor vigente que você tem em mãos.
          </div>
          <Campo
            rotulo="IBS por litro (ato conjunto)"
            valor={adRemIbs}
            set={setAdRemIbs}
            sufixo="R$/L"
            passo={0.01}
          />
          <Campo
            rotulo="CBS por litro (ato conjunto)"
            valor={adRemCbs}
            set={setAdRemCbs}
            sufixo="R$/L"
            passo={0.01}
          />
          <label className="flex min-h-[40px] items-center gap-2 text-[11px] font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={revenda}
              onChange={(e) => setRevenda(e.target.checked)}
              className="h-4 w-4"
            />
            Operação de revenda (não gera crédito novo)
          </label>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Kpi
              titulo="Valor da operação"
              valor={brl(valorOperacao)}
              sub={`${num(litros, 0)} L × ${brl(precoLitro)}`}
            />
            <Kpi
              titulo="IBS + CBS"
              valor={brl(total)}
              sub={temAdRem ? 'calculado por unidade' : 'informe o ad rem'}
              destaque
            />
            <Kpi
              titulo="Alíquota efetiva"
              valor={`${num(efetiva)}%`}
              sub="sobre o preço de venda"
            />
            <Kpi titulo="Por litro" valor={brl(litros > 0 ? total / litros : 0)} sub="IBS + CBS" />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Ordem de grandeza
            </p>
            {temAdRem ? (
              <>
                <Linha k="Se fosse percentual sobre a receita" v={brl(comparativoPercentual)} />
                <Linha k="Com o ad rem informado" v={brl(total)} forte />
                <Linha k="Diferença" v={`${diferenca >= 0 ? '+' : ''}${brl(diferenca)}`} forte />
              </>
            ) : (
              <p className="text-[11.5px] leading-relaxed text-slate-600">
                Sem o valor do ato conjunto não há como calcular: a lei fixa a <b>forma</b> (valor
                por unidade), não o <b>número</b>. Preencha os campos de R$/litro para ver o
                resultado.
              </p>
            )}
          </div>
          <Selo
            ok={temAdRem}
            texto={temAdRem ? 'com valor do ato conjunto' : 'falta o ato conjunto'}
          />
        </div>
      </div>
      <Pendente>
        <b>Depende de regulamento:</b> os valores por unidade são atualizados por ato conjunto da
        Receita Federal e do CGIBS (art. 174). Sem esse ato publicado, qualquer número seria
        invenção — por isso o campo é seu, e não nosso.
      </Pendente>
      <Rodape
        itens={[
          'LC 214/2025 — arts. 172-180',
          'art. 173 — alíquota ad rem',
          'art. 174 — ato conjunto anual',
          `referência ${pct(REF_TOTAL)}`,
        ]}
      />
    </div>
  )
}

/* ══════════════════════════ 21 · SAÚDE E PLANOS ════════════════════════════
 * Dois regimes: plano (base própria) e serviço/dispositivo (redução 60%). */
function SimSaude() {
  const [tipo, setTipo] = useState<'plano' | 'servico' | 'dispositivo'>('servico')
  const [faturamento, setFaturamento] = useState(100000)
  const [provisao, setProvisao] = useState(30)
  const [reducao, setReducao] = useState(60)
  const [elegivel, setElegivel] = useState(true)

  const aliCheia = REF_TOTAL
  // plano: base = faturamento - provisões técnicas
  const basePlano = faturamento * (1 - provisao / 100)
  const base = tipo === 'plano' ? basePlano : faturamento
  const aliAplicavel =
    tipo === 'plano' ? aliCheia : elegivel ? aliCheia * (1 - reducao / 100) : aliCheia
  const tributo = (base * aliAplicavel) / 100
  const semReducao = (base * aliCheia) / 100
  const economia = semReducao - tributo

  return (
    <div className="space-y-3">
      <Hero
        numero="21"
        titulo="Simulador — saúde e planos"
        sub="Planos de assistência à saúde têm base de cálculo própria; serviços de saúde e dispositivos têm redução de alíquota condicionada a requisitos."
        capitulacao="LC 214/2025 — regime específico e diferenciado"
      />
      <div className="grid gap-3 lg:grid-cols-[1fr,1.15fr]">
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
          <div>
            <span className="block text-[10.5px] font-bold text-slate-600">Tipo de operação</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {(
                [
                  ['plano', 'Plano de saúde'],
                  ['servico', 'Serviço de saúde'],
                  ['dispositivo', 'Dispositivo médico'],
                ] as const
              ).map(([k, r]) => (
                <button
                  key={k}
                  onClick={() => setTipo(k)}
                  className={`min-h-[36px] rounded-lg border px-2 text-[11px] font-bold ${
                    tipo === k
                      ? 'border-panorama-navy bg-panorama-navy text-white'
                      : 'border-slate-300 bg-white text-slate-600'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <Campo
            rotulo="Receita / faturamento do período"
            valor={faturamento}
            set={setFaturamento}
            sufixo="R$"
            passo={1000}
          />
          {tipo === 'plano' && (
            <Campo
              rotulo="Provisões técnicas"
              valor={provisao}
              set={setProvisao}
              sufixo="%"
              passo={1}
              dica="Parcela retida para honrar sinistros — sai da base do plano."
            />
          )}
          {tipo !== 'plano' && (
            <>
              <Campo
                rotulo="Redução aplicável"
                valor={reducao}
                set={setReducao}
                sufixo="%"
                passo={5}
              />
              <label className="flex min-h-[40px] items-center gap-2 text-[11px] font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={elegivel}
                  onChange={(e) => setElegivel(e.target.checked)}
                  className="h-4 w-4"
                />
                Atende aos requisitos do regime diferenciado
              </label>
            </>
          )}
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Kpi
              titulo="Base de cálculo"
              valor={brl(base)}
              sub={tipo === 'plano' ? 'receita − provisões' : 'receita cheia'}
            />
            <Kpi
              titulo="Alíquota aplicada"
              valor={`${num(aliAplicavel)}%`}
              sub={tipo === 'plano' ? 'cheia' : elegivel ? `reduzida ${reducao}%` : 'cheia'}
              destaque
            />
            <Kpi titulo="IBS + CBS" valor={brl(tributo)} sub="no período" />
            <Kpi titulo="Economia do regime" valor={brl(economia)} sub="vs. alíquota cheia" />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <Linha k="Sem regime diferenciado" v={brl(semReducao)} />
            <Linha k="Com o regime aplicado" v={brl(tributo)} forte />
            <Linha k="Diferença" v={brl(economia)} forte />
          </div>
          <Selo
            ok={tipo === 'plano' || elegivel}
            texto={
              tipo === 'plano'
                ? 'regime específico do plano'
                : elegivel
                  ? 'requisitos atendidos'
                  : 'requisitos NÃO atendidos'
            }
          />
        </div>
      </div>
      <Pendente>
        <b>Atenção:</b> a redução só vale se o prestador cumprir os requisitos legais do setor —
        marcar a caixa acima não substitui a verificação documental. A lista de dispositivos
        alcançados vem por anexo.
      </Pendente>
      <Rodape
        itens={[
          'LC 214/2025 — regime específico (planos)',
          'regime diferenciado (saúde)',
          'Anexos — dispositivos',
          `referência ${pct(REF_TOTAL)}`,
        ]}
      />
    </div>
  )
}

/* ══════════════════════════ 22 · EDUCAÇÃO ══════════════════════════════════ */
function SimEducacao() {
  const [mensalidade, setMensalidade] = useState(1500)
  const [alunos, setAlunos] = useState(200)
  const [reducao, setReducao] = useState(60)
  const [elegivel, setElegivel] = useState(true)
  const [material, setMaterial] = useState(30000)

  const recMensalidades = mensalidade * alunos
  const receita = recMensalidades + material
  const aliReduzida = elegivel ? REF_TOTAL * (1 - reducao / 100) : REF_TOTAL
  const tributo = (receita * aliReduzida) / 100
  const cheio = (receita * REF_TOTAL) / 100
  const economia = cheio - tributo
  const porAluno = alunos > 0 ? tributo / alunos : 0

  return (
    <div className="space-y-3">
      <Hero
        numero="22"
        titulo="Simulador — educação"
        sub="Serviços de educação têm redução de 60%, condicionada a requisitos do prestador. Não é automática para qualquer curso."
        capitulacao="LC 214/2025 — regime diferenciado"
      />
      <div className="grid gap-3 lg:grid-cols-[1fr,1.15fr]">
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
          <Campo
            rotulo="Mensalidade média"
            valor={mensalidade}
            set={setMensalidade}
            sufixo="R$"
            passo={50}
          />
          <Campo
            rotulo="Número de alunos"
            valor={alunos}
            set={setAlunos}
            sufixo="alunos"
            passo={10}
          />
          <Campo
            rotulo="Receita de material didático"
            valor={material}
            set={setMaterial}
            sufixo="R$"
            passo={1000}
          />
          <Campo rotulo="Redução aplicável" valor={reducao} set={setReducao} sufixo="%" passo={5} />
          <label className="flex min-h-[40px] items-center gap-2 text-[11px] font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={elegivel}
              onChange={(e) => setElegivel(e.target.checked)}
              className="h-4 w-4"
            />
            Instituição atende aos requisitos
          </label>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Kpi titulo="Receita total" valor={brl(receita)} sub={`${alunos} alunos`} />
            <Kpi
              titulo="IBS + CBS"
              valor={brl(tributo)}
              sub={elegivel ? `reduzida ${reducao}%` : 'alíquota cheia'}
              destaque
            />
            <Kpi titulo="Por aluno" valor={brl(porAluno)} sub="custo tributário" />
            <Kpi titulo="Economia" valor={brl(economia)} sub="vs. alíquota cheia" />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <Linha k="Mensalidades" v={brl(recMensalidades)} />
            <Linha k="Material didático" v={brl(material)} />
            <Linha k="Tributo com a redução" v={brl(tributo)} forte />
            <Linha k="Tributo sem a redução" v={brl(cheio)} />
          </div>
          <Selo ok={elegivel} texto={elegivel ? 'requisitos atendidos' : 'sem direito à redução'} />
        </div>
      </div>
      <Pendente>
        <b>Verifique antes de faturar:</b> curso livre sem previsão legal fica na alíquota cheia. A
        mensalidade e o material didático podem ter tratamentos distintos na mesma nota.
      </Pendente>
      <Rodape
        itens={[
          'LC 214/2025 — serviços de educação',
          'regime diferenciado',
          'Anexos — material didático',
          `referência ${pct(REF_TOTAL)}`,
        ]}
      />
    </div>
  )
}

/* ══════════════════════════ 23 · TURISMO ═══════════════════════════════════ */
function SimTurismo() {
  const [tipo, setTipo] = useState<'restaurante' | 'hotel' | 'parque' | 'agencia'>('restaurante')
  const [receita, setReceita] = useState(80000)
  const [insumos, setInsumos] = useState(35)
  const [aliSetor, setAliSetor] = useState(60)

  const credito = (receita * (insumos / 100) * REF_TOTAL) / 100
  const debito = (receita * (aliSetor / 100)) / 100
  const liquido = debito - credito
  const cargaEfetiva = receita > 0 ? (liquido / receita) * 100 : 0

  return (
    <div className="space-y-3">
      <Hero
        numero="23"
        titulo="Simulador — bares, restaurantes e turismo"
        sub="Alimentação, hotelaria, parques e agências têm regime específico de apuração — não seguem o regime regular geral."
        capitulacao="LC 214/2025 — regime específico"
      />
      <div className="grid gap-3 lg:grid-cols-[1fr,1.15fr]">
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
          <div>
            <span className="block text-[10.5px] font-bold text-slate-600">Atividade</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {(
                [
                  ['restaurante', 'Restaurante'],
                  ['hotel', 'Hotelaria'],
                  ['parque', 'Parque'],
                  ['agencia', 'Agência'],
                ] as const
              ).map(([k, r]) => (
                <button
                  key={k}
                  onClick={() => setTipo(k)}
                  className={`min-h-[36px] rounded-lg border px-2 text-[11px] font-bold ${
                    tipo === k
                      ? 'border-panorama-navy bg-panorama-navy text-white'
                      : 'border-slate-300 bg-white text-slate-600'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <Campo
            rotulo="Receita do período"
            valor={receita}
            set={setReceita}
            sufixo="R$"
            passo={1000}
          />
          <Campo
            rotulo="Insumos sobre a receita"
            valor={insumos}
            set={setInsumos}
            sufixo="%"
            passo={1}
            dica="Gera crédito na etapa anterior."
          />
          <Campo
            rotulo="Alíquota do regime"
            valor={aliSetor}
            set={setAliSetor}
            sufixo="% da cheia"
            passo={5}
            dica="O percentual depende do enquadramento."
          />
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Kpi titulo="Débito" valor={brl(debito)} sub={`${aliSetor}% da cheia`} />
            <Kpi titulo="Crédito" valor={brl(credito)} sub={`insumos ${insumos}%`} />
            <Kpi titulo="A recolher" valor={brl(liquido)} sub="débito − crédito" destaque />
            <Kpi titulo="Carga efetiva" valor={`${num(cargaEfetiva)}%`} sub="sobre a receita" />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <Linha k="Débito do período" v={brl(debito)} />
            <Linha k="(-) Crédito de insumos" v={brl(credito)} />
            <Linha k="(=) A recolher" v={brl(liquido)} forte />
          </div>
        </div>
      </div>
      <Pendente>
        <b>Depende de regulamento:</b> as condições de enquadramento e o detalhamento por atividade
        vêm do CGIBS. Ajuste o campo de alíquota conforme o enquadramento confirmado.
      </Pendente>
      <Rodape
        itens={[
          'LC 214/2025 — regime específico de turismo',
          'alimentação e hotelaria',
          `referência ${pct(REF_TOTAL)}`,
        ]}
      />
    </div>
  )
}

/* ══════════════════════════ 24 · COOPERATIVAS ══════════════════════════════ */
function SimCooperativas() {
  const [receita, setReceita] = useState(500000)
  const [atoCoop, setAtoCoop] = useState(70)
  const [credPresumido, setCredPresumido] = useState(8)

  const parteCoop = (receita * atoCoop) / 100
  const parteMercado = receita - parteCoop
  const tributoMercado = (parteMercado * REF_TOTAL) / 100
  const credito = (parteCoop * credPresumido) / 100
  const liquido = Math.max(0, tributoMercado - credito)
  const cargaEfetiva = receita > 0 ? (liquido / receita) * 100 : 0

  return (
    <div className="space-y-3">
      <Hero
        numero="24"
        titulo="Simulador — cooperativas"
        sub="O ato cooperativo tem tratamento próprio e não se confunde com receita de venda ao mercado. Há previsão de crédito presumido."
        capitulacao="LC 214/2025, arts. 271-272"
      />
      <div className="grid gap-3 lg:grid-cols-[1fr,1.15fr]">
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
          <Campo
            rotulo="Receita total"
            valor={receita}
            set={setReceita}
            sufixo="R$"
            passo={10000}
          />
          <Campo
            rotulo="Parcela em ato cooperativo"
            valor={atoCoop}
            set={setAtoCoop}
            sufixo="%"
            passo={5}
          />
          <Campo
            rotulo="Percentual do crédito presumido"
            valor={credPresumido}
            set={setCredPresumido}
            sufixo="%"
            passo={1}
            dica="Percentual definido em lei para a hipótese — confira a sua."
          />
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Kpi titulo="Ato cooperativo" valor={brl(parteCoop)} sub={`${atoCoop}% da receita`} />
            <Kpi titulo="Ato não cooperativo" valor={brl(parteMercado)} sub="regime regular" />
            <Kpi
              titulo="Crédito presumido"
              valor={brl(credito)}
              sub={`${credPresumido}% sobre o ato cooperativo`}
            />
            <Kpi
              titulo="A recolher"
              valor={brl(liquido)}
              sub={`carga ${num(cargaEfetiva)}%`}
              destaque
            />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <Linha k="Tributo sobre a parte de mercado" v={brl(tributoMercado)} />
            <Linha k="(-) Crédito presumido" v={brl(credito)} />
            <Linha k="(=) A recolher" v={brl(liquido)} forte />
          </div>
          <Selo
            ok={credPresumido > 0}
            texto={credPresumido > 0 ? 'com crédito presumido' : 'sem crédito presumido'}
          />
        </div>
      </div>
      <Pendente>
        <b>Depende da hipótese legal:</b> o crédito presumido só se aplica nas situações expressas
        na lei, com percentual próprio. Documentar o vínculo cooperativo é o que sustenta o
        tratamento na fiscalização.
      </Pendente>
      <Rodape
        itens={[
          'LC 214/2025 — art. 271 (ato cooperativo)',
          'art. 272 (crédito presumido)',
          'Lei cooperativista',
          `referência ${pct(REF_TOTAL)}`,
        ]}
      />
    </div>
  )
}

/* ══════════════════════════ 25 · SAF ═══════════════════════════════════════ */
function SimFutebol() {
  const [transferencias, setTransferencias] = useState(5000000)
  const [demaisReceitas, setDemaisReceitas] = useState(2000000)
  const [aliTransferencia, setAliTransferencia] = useState(REF_TOTAL)
  const [formacao, setFormacao] = useState(5)

  const tribTransf = (transferencias * aliTransferencia) / 100
  const tribDemais = (demaisReceitas * REF_TOTAL) / 100
  const mecanismo = (transferencias * formacao) / 100
  const total = tribTransf + tribDemais
  const liquidoClube = transferencias - tribTransf - mecanismo

  return (
    <div className="space-y-3">
      <Hero
        numero="25"
        titulo="Simulador — Sociedade Anônima do Futebol"
        sub="Regime específico da SAF, com atenção ao ponto mais sensível: a cessão de direitos desportivos do atleta."
        capitulacao="LC 214/2025 — regime específico da SAF"
      />
      <div className="grid gap-3 lg:grid-cols-[1fr,1.15fr]">
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
          <Campo
            rotulo="Receita de transferência de atletas"
            valor={transferencias}
            set={setTransferencias}
            sufixo="R$"
            passo={100000}
          />
          <Campo
            rotulo="Demais receitas do clube"
            valor={demaisReceitas}
            set={setDemaisReceitas}
            sufixo="R$"
            passo={100000}
            dica="Bilheteria, patrocínio, direitos de transmissão."
          />
          <Campo
            rotulo="Alíquota sobre a transferência"
            valor={aliTransferencia}
            set={setAliTransferencia}
            sufixo="%"
            passo={0.5}
          />
          <Campo
            rotulo="Mecanismo de solidariedade / formação"
            valor={formacao}
            set={setFormacao}
            sufixo="%"
            passo={1}
          />
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Kpi
              titulo="Tributo na transferência"
              valor={brl(tribTransf)}
              sub={`${num(aliTransferencia)}%`}
            />
            <Kpi
              titulo="Tributo nas demais receitas"
              valor={brl(tribDemais)}
              sub="regime das receitas ordinárias"
            />
            <Kpi titulo="Total" valor={brl(total)} sub="IBS + CBS no período" destaque />
            <Kpi
              titulo="Líquido ao clube"
              valor={brl(liquidoClube)}
              sub="após tributo e formação"
            />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <Linha k="Transferência de atletas" v={brl(transferencias)} />
            <Linha k="(-) Tributo" v={brl(tribTransf)} />
            <Linha k="(-) Formação/solidariedade" v={brl(mecanismo)} />
            <Linha k="(=) Líquido" v={brl(liquidoClube)} forte />
          </div>
        </div>
      </div>
      <Pendente>
        <b>Depende de regulamento:</b> o detalhamento da apuração sobre direitos desportivos. O
        percentual de formação é do mecanismo desportivo, não tributário — informe o aplicável.
      </Pendente>
      <Rodape
        itens={[
          'LC 214/2025 — regime específico da SAF',
          'direitos desportivos',
          'mecanismo de solidariedade',
          `referência ${pct(REF_TOTAL)}`,
        ]}
      />
    </div>
  )
}

/* ══════════════════════════ 26 · COMÉRCIO EXTERIOR ═════════════════════════ */
function SimExterior() {
  const [tipo, setTipo] = useState<'importacao' | 'exportacao' | 'zfm'>('importacao')
  const [valor, setValor] = useState(200000)
  const [frete, setFrete] = useState(15000)
  const [seguro, setSeguro] = useState(3000)
  const [impostos, setImpostos] = useState(25000)

  const baseImport = valor + frete + seguro + impostos
  const tribImport = (baseImport * REF_TOTAL) / 100
  // exportação: desonerada, e o crédito das etapas anteriores é preservado
  const creditoPreservado = tipo === 'exportacao' ? (valor * REF_TOTAL) / 100 : 0

  return (
    <div className="space-y-3">
      <Hero
        numero="26"
        titulo="Simulador — comércio exterior e ZFM"
        sub="Vale o princípio do destino: exportação desonerada com crédito preservado, importação tributada, regimes aduaneiros especiais mantidos."
        capitulacao="LC 214/2025, art. 93 e ss. · Dec. 12.955/2026"
      />
      <div className="grid gap-3 lg:grid-cols-[1fr,1.15fr]">
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
          <div>
            <span className="block text-[10.5px] font-bold text-slate-600">Operação</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {(
                [
                  ['importacao', 'Importação'],
                  ['exportacao', 'Exportação'],
                  ['zfm', 'Zona Franca de Manaus'],
                ] as const
              ).map(([k, r]) => (
                <button
                  key={k}
                  onClick={() => setTipo(k)}
                  className={`min-h-[36px] rounded-lg border px-2 text-[11px] font-bold ${
                    tipo === k
                      ? 'border-panorama-navy bg-panorama-navy text-white'
                      : 'border-slate-300 bg-white text-slate-600'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <Campo
            rotulo="Valor aduaneiro da mercadoria"
            valor={valor}
            set={setValor}
            sufixo="R$"
            passo={1000}
          />
          <Campo
            rotulo="Frete internacional"
            valor={frete}
            set={setFrete}
            sufixo="R$"
            passo={500}
          />
          <Campo rotulo="Seguro" valor={seguro} set={setSeguro} sufixo="R$" passo={100} />
          <Campo
            rotulo="II / IPI / outros"
            valor={impostos}
            set={setImpostos}
            sufixo="R$"
            passo={500}
            dica="Entram na base de importação."
          />
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Kpi
              titulo="Base de cálculo"
              valor={brl(baseImport)}
              sub="valor + frete + seguro + impostos"
            />
            <Kpi
              titulo={tipo === 'exportacao' ? 'Tributo na saída' : 'IBS + CBS'}
              valor={brl(tipo === 'exportacao' ? 0 : tribImport)}
              sub={tipo === 'exportacao' ? 'exportação desonerada' : 'na importação'}
              destaque
            />
            <Kpi
              titulo="Crédito preservado"
              valor={brl(creditoPreservado)}
              sub={tipo === 'exportacao' ? 'das etapas anteriores' : 'não aplicável'}
            />
            <Kpi
              titulo="Custo tributário"
              valor={brl(tipo === 'exportacao' ? 0 : tribImport)}
              sub={tipo === 'zfm' ? 'verificar diferencial da ZFM' : 'sobre a operação'}
            />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <Linha k="Mercadoria" v={brl(valor)} />
            <Linha k="Frete + seguro" v={brl(frete + seguro)} />
            <Linha k="Impostos na base" v={brl(impostos)} />
            <Linha k="(=) Base" v={brl(baseImport)} forte />
            <Linha
              k={tipo === 'exportacao' ? 'Tributo (desonerado)' : 'IBS + CBS'}
              v={brl(tipo === 'exportacao' ? 0 : tribImport)}
              forte
            />
          </div>
          <Selo
            ok={tipo !== 'zfm'}
            texto={
              tipo === 'exportacao'
                ? 'exportação desonerada'
                : tipo === 'zfm'
                  ? 'ZFM: confirmar enquadramento'
                  : 'importação tributada'
            }
          />
        </div>
      </div>
      <Pendente>
        <b>Zona Franca de Manaus:</b> o tratamento diferenciado tem previsão constitucional própria
        (arts. 439-457) e exige enquadramento e habilitação. O simulador não aplica o diferencial
        automaticamente — seria arriscado estimar sem a habilitação confirmada.
      </Pendente>
      <Rodape
        itens={[
          'LC 214/2025 — art. 93 e ss.',
          'Decreto 12.955/2026',
          'arts. 439-457 (ZFM)',
          `referência ${pct(REF_TOTAL)}`,
        ]}
      />
    </div>
  )
}

/* ══════════════════════════ 27 · DIPLOMÁTICO ═══════════════════════════════ */
function SimDiplomatico() {
  const [valor, setValor] = useState(50000)
  const [coberto, setCoberto] = useState(true)
  const [tipo, setTipo] = useState<'missao' | 'organismo' | 'fornecedor'>('missao')

  const tributo = coberto && tipo !== 'fornecedor' ? 0 : (valor * REF_TOTAL) / 100
  const economia = (valor * REF_TOTAL) / 100 - tributo

  return (
    <div className="space-y-3">
      <Hero
        numero="27"
        titulo="Simulador — missões diplomáticas e tratados"
        sub="As operações alcançadas por tratados internacionais e as das missões diplomáticas e repartições internacionais têm regime específico."
        capitulacao="LC 214/2025 — regime específico"
      />
      <div className="grid gap-3 lg:grid-cols-[1fr,1.15fr]">
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
          <div>
            <span className="block text-[10.5px] font-bold text-slate-600">Quem realiza</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {(
                [
                  ['missao', 'Missão diplomática'],
                  ['organismo', 'Organismo internacional'],
                  ['fornecedor', 'Fornecedor da missão'],
                ] as const
              ).map(([k, r]) => (
                <button
                  key={k}
                  onClick={() => setTipo(k)}
                  className={`min-h-[36px] rounded-lg border px-2 text-[11px] font-bold ${
                    tipo === k
                      ? 'border-panorama-navy bg-panorama-navy text-white'
                      : 'border-slate-300 bg-white text-slate-600'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <Campo rotulo="Valor da operação" valor={valor} set={setValor} sufixo="R$" passo={1000} />
          <label className="flex min-h-[40px] items-start gap-2 text-[11px] font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={coberto}
              onChange={(e) => setCoberto(e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            A operação está coberta pelo tratado aplicável
          </label>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Kpi titulo="Valor da operação" valor={brl(valor)} />
            <Kpi
              titulo="IBS + CBS"
              valor={brl(tributo)}
              sub={tributo === 0 ? 'regime do tratado' : 'regime regular'}
              destaque
            />
            <Kpi titulo="Economia" valor={brl(economia)} sub="do tratamento" />
            <Kpi
              titulo="Situação"
              valor={tributo === 0 ? 'Desonerado' : 'Tributado'}
              sub={tipo === 'fornecedor' ? 'fornecedor não alcança' : 'conforme tratado'}
            />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <Linha k="Tributo sem o regime" v={brl((valor * REF_TOTAL) / 100)} />
            <Linha k="Tributo aplicado" v={brl(tributo)} forte />
          </div>
          <Selo
            ok={tributo === 0}
            texto={tributo === 0 ? 'coberto pelo tratado' : 'regime regular'}
          />
        </div>
      </div>
      <Pendente>
        <b>Cada tratado tem alcance próprio.</b> O regime não se estende a empresa privada que
        apenas presta serviço à missão. A análise é caso a caso, com o texto do acordo em mãos.
      </Pendente>
      <Rodape
        itens={[
          'LC 214/2025 — regime específico',
          'tratados internacionais',
          `referência ${pct(REF_TOTAL)}`,
        ]}
      />
    </div>
  )
}

/* ══════════════════════════ registro e componente público ═════════════════ */

const SIMULADORES: Record<string, () => React.ReactElement> = {
  combustiveis: SimCombustiveis,
  saude: SimSaude,
  educacao: SimEducacao,
  turismo: SimTurismo,
  cooperativas: SimCooperativas,
  futebol: SimFutebol,
  exterior: SimExterior,
  diplomatico: SimDiplomatico,
}

export function SimuladorSetor({ id }: { id: string }) {
  const S = SIMULADORES[id]
  if (!S) return null
  return <S />
}
