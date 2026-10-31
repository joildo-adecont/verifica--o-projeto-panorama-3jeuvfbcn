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
  dadosAnexos?: Array<{
    numero: string
    titulo: string
    reducaoPct: number
    rotulo: string
    totalProdutos: number
    baseLegal: string
  }>
}

export function GraficosBusca({ termo, dadosGraficos, dadosAnexos }: GraficosBuscaProps) {
  const [graficoAtivo, setGraficoAtivo] = useState<
    'anexos' | 'transicao' | 'atos' | 'classificacoes'
  >('anexos')

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
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 self-start sm:self-auto flex-wrap gap-1">
          {dadosAnexos && dadosAnexos.length > 0 && (
            <button
              onClick={() => setGraficoAtivo('anexos')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                graficoAtivo === 'anexos'
                  ? 'bg-panorama-navy text-panorama-gold-light shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Anexos & Reduções ({dadosAnexos.length})
            </button>
          )}
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

      {/* Gráfico 0: Reduções e Produtos por Anexo */}
      {graficoAtivo === 'anexos' && dadosAnexos && dadosAnexos.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">
              Percentual Oficial de Redução de Alíquota (%) e Total de Produtos/Serviços Catalogados
              por Anexo
            </span>
            <span className="text-[11px] text-slate-400">LC 214/2025 Planalto</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dadosAnexos.map((a) => ({
                  nome: a.numero.replace('Anexo ', 'Anx '),
                  tituloCompleto: `${a.numero} — ${a.titulo}`,
                  reducaoAbsoluta: Math.abs(a.reducaoPct),
                  rotuloReal: a.rotulo,
                  produtos: a.totalProdutos,
                  fill:
                    a.reducaoPct === -100
                      ? '#059669' // emerald (zero)
                      : a.reducaoPct === -60
                        ? '#2563eb' // blue (-60%)
                        : a.reducaoPct === -30
                          ? '#d97706' // amber (-30%)
                          : '#64748b', // slate
                }))}
                margin={{ top: 10, right: 15, left: -20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="nome"
                  stroke="#475569"
                  fontSize={10}
                  tickLine={false}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} unit="%" domain={[0, 100]} />
                <Tooltip
                  formatter={(val: unknown, name: unknown) => [
                    name === 'reducaoAbsoluta' ? `${val}% de redução` : `${val} itens catalogados`,
                    name === 'reducaoAbsoluta' ? 'Redução da Alíquota' : 'Produtos/Serviços',
                  ]}
                  labelFormatter={(label: unknown, payload: readonly any[]) => {
                    const item = payload?.[0]?.payload
                    return item?.tituloCompleto || `Anexo ${label}`
                  }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    color: '#f8fafc',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                  formatter={(value: string) =>
                    value === 'reducaoAbsoluta'
                      ? 'Redução de Alíquota (%)'
                      : 'Qtd. Produtos/Serviços Catalogados'
                  }
                />
                <Bar dataKey="reducaoAbsoluta" name="reducaoAbsoluta" radius={[4, 4, 0, 0]}>
                  {dadosAnexos.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.reducaoPct === -100
                          ? '#059669'
                          : entry.reducaoPct === -60
                            ? '#2563eb'
                            : entry.reducaoPct === -30
                              ? '#d97706'
                              : '#64748b'
                      }
                    />
                  ))}
                </Bar>
                <Bar dataKey="produtos" name="produtos" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabela-resumo dos anexos */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2 px-3">Anexo / Título</th>
                  <th className="py-2 px-3 text-center">Redução de Alíquota</th>
                  <th className="py-2 px-3 text-center">Alíquota Efetiva (Ref. 26,5%)</th>
                  <th className="py-2 px-3 text-center">Produtos / Serviços</th>
                  <th className="py-2 px-3">Base Legal (LC 214/2025)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dadosAnexos.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 font-semibold text-slate-800">
                      <span className="font-mono font-bold text-panorama-navy mr-1.5">
                        {item.numero}
                      </span>
                      <span>{item.titulo}</span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-bold ${
                          item.reducaoPct === -100
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : item.reducaoPct === -60
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : item.reducaoPct === -30
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}
                      >
                        {item.rotulo}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-700">
                      {item.reducaoPct === -100
                        ? '0,00%'
                        : item.reducaoPct === -60
                          ? '10,60%'
                          : item.reducaoPct === -30
                            ? '18,55%'
                            : 'Específica / ad rem'}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">
                      {item.totalProdutos}
                    </td>
                    <td className="py-2 px-3 text-slate-600 text-[11px] font-mono">
                      {item.baseLegal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
