import { useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts'
import { TrendingUp, PieChart as PieIcon, Layers, Info } from 'lucide-react'

interface GraficosBuscaProps {
  termo: string
  dadosGraficos: {
    composicaoAtos: Array<{ name: string; count: number; fill: string }>
    linhaDoTempoAliquota: Array<{
      ano: string
      cbs: number
      ibs: number
      total: number
      nota: string
    }>
    classificacoesPorTipo: Array<{ tipo: string; count: number }>
  }
}

export function GraficosBusca({ termo, dadosGraficos }: GraficosBuscaProps) {
  const [graficoAtivo, setGraficoAtivo] = useState<'transicao' | 'atos' | 'classificacoes'>(
    'transicao',
  )

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-panorama-navy" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Análise Visual e Gráficos Correlatos
            </h3>
            {termo && (
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                termo: &ldquo;{termo}&rdquo;
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Projeções e evolução das alíquotas do IBS/CBS, composição dos atos normativos e
            distribuição das classificações oficiais.
          </p>
        </div>

        {/* Alternador de gráficos */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 self-start sm:self-auto">
          <button
            onClick={() => setGraficoAtivo('transicao')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
              graficoAtivo === 'transicao'
                ? 'bg-panorama-navy text-panorama-gold-light shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cronograma Alíquotas
          </button>
          <button
            onClick={() => setGraficoAtivo('atos')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
              graficoAtivo === 'atos'
                ? 'bg-panorama-navy text-panorama-gold-light shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Atos por Esfera
          </button>
          <button
            onClick={() => setGraficoAtivo('classificacoes')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
              graficoAtivo === 'classificacoes'
                ? 'bg-panorama-navy text-panorama-gold-light shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tabelas / NCM
          </button>
        </div>
      </div>

      {/* Gráfico 1: Linha do Tempo das Alíquotas */}
      {graficoAtivo === 'transicao' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold text-slate-700">
              Evolução da Carga Tributária de Referência: CBS (Federal) vs. IBS (Estados/Municípios)
            </span>
            <span className="text-[11px] text-slate-400">2026–2033 (em %)</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dadosGraficos.linhaDoTempoAliquota}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCbs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorIbs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} unit="%" />
                <Tooltip
                  formatter={(value: unknown, name: unknown) => [
                    `${Number(value || 0)
                      .toFixed(2)
                      .replace('.', ',')}%`,
                    name === 'cbs'
                      ? 'CBS (Federal)'
                      : name === 'ibs'
                        ? 'IBS (Est./Mun.)'
                        : 'IVA Dual Total',
                  ]}
                  labelFormatter={(label: unknown) => `Ano ${label}`}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    color: '#f8fafc',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  formatter={(value: string) =>
                    value === 'cbs'
                      ? 'CBS (11,3% TCU)'
                      : value === 'ibs'
                        ? 'IBS (18,7% CGIBS)'
                        : 'Total IVA Dual'
                  }
                />
                <Area
                  type="monotone"
                  dataKey="cbs"
                  stroke="#4f46e5"
                  fillOpacity={1}
                  fill="url(#colorCbs)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="ibs"
                  stroke="#0284c7"
                  fillOpacity={1}
                  fill="url(#colorIbs)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              <strong>Nota técnica:</strong> Em 2027 a CBS federal vigora com alíquota plena de
              11,30% (fixada pelo TCU). O IBS inicia teste em 0,1% e entra em transição gradual a
              partir de 2029 (10%, 40%, 70%, 90% e 100% da referência de 18,70%).
            </span>
          </div>
        </div>
      )}

      {/* Gráfico 2: Composição dos Atos por Nível */}
      {graficoAtivo === 'atos' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold text-slate-700">
              Distribuição de Atos e Normas por Nível Federativo
            </span>
            <span className="text-[11px] text-slate-400">Total cadastrado</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dadosGraficos.composicaoAtos}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip
                  formatter={(val: unknown) => [`${val} atos catalogados`, 'Total']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    color: '#f8fafc',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {dadosGraficos.composicaoAtos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-500">
            Cobre leis complementares federais (LC 214, LC 227), resoluções CGIBS, decretos
            presidenciais e atos do Radar Nacional de municípios e estados.
          </p>
        </div>
      )}

      {/* Gráfico 3: Classificações Oficiais */}
      {graficoAtivo === 'classificacoes' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold text-slate-700">
              Registros Oficiais Retornados por Tabela Governamental
            </span>
            <span className="text-[11px] text-slate-400">Classificações vigentes</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={
                  dadosGraficos.classificacoesPorTipo.length > 0
                    ? dadosGraficos.classificacoesPorTipo
                    : [
                        { tipo: 'NCM (15.240+)', count: 15240 },
                        { tipo: 'cClassTrib', count: 8 },
                        { tipo: 'CST', count: 7 },
                        { tipo: 'cCredPres', count: 5 },
                        { tipo: 'CEST', count: 12 },
                      ]
                }
                layout="vertical"
                margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  dataKey="tipo"
                  type="category"
                  stroke="#475569"
                  fontSize={11}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  formatter={(val: unknown) => [`${val} registros`, 'Volume']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    color: '#f8fafc',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#d97706" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-500">
            Base indexada com mais de 15.240 itens NCM oficiais da TIPI/Siscomex, códigos cClassTrib
            da IT 2025.002 do CGIBS/RFB, CSTs e créditos presumidos.
          </p>
        </div>
      )}
    </div>
  )
}
