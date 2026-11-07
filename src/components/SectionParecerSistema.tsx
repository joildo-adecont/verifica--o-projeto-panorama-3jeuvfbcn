import React, { useState } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Printer,
  Layers,
  Search,
  Filter,
  ExternalLink,
  Info,
  Check,
  Sparkles,
} from 'lucide-react'
import { AdecontLogo } from './AdecontLogo'
import {
  MODULOS_AUDITORIA_SISTEMA,
  ItemAuditoriaModulo,
  StatusModuloAuditoria,
} from '@/data/parecerAuditoriaSistema'
import { RelatorioParecerSistemaA4 } from './RelatorioParecerSistemaA4'

export const SectionParecerSistema: React.FC = () => {
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [modalA4Aberto, setModalA4Aberto] = useState(false)

  const modulosFiltrados = MODULOS_AUDITORIA_SISTEMA.filter((item) => {
    const matchBusca =
      !busca ||
      item.modulo.toLowerCase().includes(busca.toLowerCase()) ||
      item.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      item.agenteResponsavel.toLowerCase().includes(busca.toLowerCase()) ||
      item.rotaOuHash.toLowerCase().includes(busca.toLowerCase())

    const matchStatus = filtroStatus === 'todos' || item.status === filtroStatus

    return matchBusca && matchStatus
  })

  const totalModulos = MODULOS_AUDITORIA_SISTEMA.length
  const totalFuncionando = MODULOS_AUDITORIA_SISTEMA.filter(
    (m) => m.status === 'FUNCIONANDO',
  ).length
  const totalAjustado = MODULOS_AUDITORIA_SISTEMA.filter((m) => m.status === 'AJUSTADO').length
  const totalPendencia = MODULOS_AUDITORIA_SISTEMA.filter((m) => m.status === 'PENDENCIA').length

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Seção com Identidade ADECONT */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-slate-700/60">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Auditoria Integral Concluída
                </span>
                <span className="text-xs text-slate-400">Versão 0.0.715</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Parecer do Sistema Panorama
              </h1>
              <p className="text-sm text-slate-300 mt-0.5">
                Revisão completa de módulos, ícones, confecções visuais, fontes oficiais e rotinas
                em segundo plano.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setModalA4Aberto(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all text-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Emitir Parecer em PDF A4
            </button>
          </div>
        </div>

        {/* Cards de Indicadores Rápidos da Auditoria */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-700/60">
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3">
            <span className="text-xs text-slate-400 block">Total de Módulos</span>
            <span className="text-xl font-black text-white font-mono">{totalModulos}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Auditados integralmente</span>
          </div>

          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3">
            <span className="text-xs text-emerald-400 block">Em Funcionamento</span>
            <span className="text-xl font-black text-emerald-300 font-mono">
              {totalFuncionando}
            </span>
            <span className="text-[10px] text-emerald-400/80 block mt-0.5">
              Sem não-conformidade
            </span>
          </div>

          <div className="bg-blue-950/40 border border-blue-800/60 rounded-xl p-3">
            <span className="text-xs text-blue-400 block">Ajustados na Auditoria</span>
            <span className="text-xl font-black text-blue-300 font-mono">{totalAjustado}</span>
            <span className="text-[10px] text-blue-400/80 block mt-0.5">
              Erros 403 e 400 sanados
            </span>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3">
            <span className="text-xs text-slate-400 block">Pendências Críticas</span>
            <span className="text-xl font-black text-slate-200 font-mono">{totalPendencia}</span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">0 falhas bloqueantes</span>
          </div>
        </div>
      </div>

      {/* Síntese dos Agentes Especialistas */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Conclusão da Equipe de Agentes Especialistas ADECONT
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Assessoria Contábil e Administrativa
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <strong className="text-slate-900 dark:text-white block mb-1">
              • Permissões de API e Estabilidade de Runtime:
            </strong>
            Foram sanadas as restrições 403 que impediam a consulta de alertas de mercado (coleção{' '}
            <code className="text-indigo-600 dark:text-indigo-400 font-mono">market_alerts</code>) e
            documentos fiscais ({' '}
            <code className="text-indigo-600 dark:text-indigo-400 font-mono">param_documentos</code>
            ). Foi criado o campo de compatibilidade{' '}
            <code className="text-indigo-600 dark:text-indigo-400 font-mono">documento</code> em{' '}
            <code className="text-indigo-600 dark:text-indigo-400 font-mono">
              cadastro_empresas
            </code>
            , garantindo que buscas por CNPJ com ou sem máscara não causem exceção 400.
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <strong className="text-slate-900 dark:text-white block mb-1">
              • Fontes Oficiais e Integridade de Downloads:
            </strong>
            As 8 fontes estatísticas (IBGE, Tesouro, IPEA, BCB, CONAB, CEPEA, FipeZap, CGIBS) estão
            ativas e com verificações de rotina em execução. Todos os atos normativos do CGIBS
            mantêm o padrão obrigatório de download via proxy institucional{' '}
            <code className="text-indigo-600 dark:text-indigo-400 font-mono">
              /backend/v1/download-resolution
            </code>
            , prevenindo bloqueios de rede.
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca de Módulos */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Filtrar módulo, agente ou rota..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl self-stretch sm:self-auto text-xs">
          {(['todos', 'FUNCIONANDO', 'AJUSTADO', 'PENDENCIA'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFiltroStatus(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filtroStatus === st
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st === 'todos'
                ? 'Todos'
                : st === 'FUNCIONANDO'
                  ? 'Funcionando'
                  : st === 'AJUSTADO'
                    ? 'Ajustados'
                    : 'Pendências'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Cards dos Módulos Auditados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modulosFiltrados.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {item.modulo}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {item.rotaOuHash}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shrink-0 ${
                    item.status === 'FUNCIONANDO'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : item.status === 'AJUSTADO'
                        ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {item.descricao}
              </p>

              {item.ajusteRealizado && (
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/80 text-[11px] text-blue-900 dark:text-blue-200 leading-snug">
                  <strong className="block text-blue-950 dark:text-blue-100 mb-0.5">
                    Ajuste Concluído na Auditoria:
                  </strong>
                  {item.ajusteRealizado}
                </div>
              )}

              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Itens Verificados:
                </span>
                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  {item.itensVerificados.map((iv, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{iv}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>{item.agenteResponsavel}</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">Auditado</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal A4 Imprimível */}
      {modalA4Aberto && <RelatorioParecerSistemaA4 onClose={() => setModalA4Aberto(false)} />}
    </div>
  )
}
