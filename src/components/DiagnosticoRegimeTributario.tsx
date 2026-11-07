import React, { useEffect, useState, useMemo } from 'react'
import {
  carregarDiagnosticoClientePastore,
  salvarDadosFolhaEEnquadramentoPastore,
  calcularComparativoCustoFolha,
  parseCnaesSecundarios,
  type DiagnosticoClienteData,
  CNPJ_PASTORE_FORMATADO,
} from '@/services/diagnosticoPastore'
import RelatorioDiagnosticoPastoreImprimivel from './RelatorioDiagnosticoPastoreImprimivel'
import {
  Building2,
  TrendingUp,
  Scale,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Printer,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Percent,
  Receipt,
  Layers,
  Info,
  HelpCircle,
  BarChart3,
  ExternalLink,
  Calendar,
  DollarSign,
  Briefcase,
  ThumbsUp,
  ThumbsDown,
  Users,
  Edit3,
  Save,
  Check,
  X,
} from 'lucide-react'

export const DiagnosticoRegimeTributario: React.FC = () => {
  const [data, setData] = useState<DiagnosticoClienteData | null>(null)
  const [carregando, setCarregando] = useState<boolean>(true)
  const [erro, setErro] = useState<string | null>(null)
  const [mostrarImprimivel, setMostrarImprimivel] = useState<boolean>(false)

  // Estados de edição dos novos blocos (Enquadramento e Folha)
  const [modoEdicao, setModoEdicao] = useState<boolean>(false)
  const [salvandoEdicao, setSalvandoEdicao] = useState<boolean>(false)
  const [mensagemSalvo, setMensagemSalvo] = useState<string | null>(null)

  // Form states
  const [editEnquadramento, setEditEnquadramento] = useState<string>('Simples Nacional')
  const [editCnaesSecundarios, setEditCnaesSecundarios] = useState<string>('')
  const [editNumFuncionarios, setEditNumFuncionarios] = useState<number>(9)
  const [editFolhaMensal, setEditFolhaMensal] = useState<number>(31850)
  const [editEncargosMensais, setEditEncargosMensais] = useState<number>(5730)

  const carregar = async () => {
    setCarregando(true)
    setErro(null)
    try {
      const res = await carregarDiagnosticoClientePastore()
      setData(res)
      setEditEnquadramento(res.enquadramentoTributarioAtual || 'Simples Nacional')
      setEditCnaesSecundarios(
        res.empresa?.cnaes_secundarios ||
          res.cnaesSecundariosLista.map((c) => `${c.codigo} - ${c.descricao}`).join('; '),
      )
      setEditNumFuncionarios(res.folhaPagamento.numFuncionarios || 9)
      setEditFolhaMensal(res.folhaPagamento.folhaSalarialMensal || 31850)
      setEditEncargosMensais(res.folhaPagamento.encargosMensais || 5730)
    } catch (e: any) {
      setErro(e?.message || 'Falha ao carregar dados do diagnóstico.')
    } finally {
      setCarregando(false)
    }
  }

  const salvarEdicao = async () => {
    setSalvandoEdicao(true)
    setMensagemSalvo(null)
    try {
      const resp = await salvarDadosFolhaEEnquadramentoPastore({
        enquadramento_tributario: editEnquadramento,
        cnaes_secundarios: editCnaesSecundarios,
        num_funcionarios: Number(editNumFuncionarios) || 0,
        folha_salarial_mensal: Number(editFolhaMensal) || 0,
        encargos_mensais: Number(editEncargosMensais) || 0,
      })

      if (resp.sucesso) {
        setMensagemSalvo('Dados salvos no cadastro da Pastore com sucesso!')
        setModoEdicao(false)

        // Recalcular estado em memória imediatamente
        if (data) {
          const cnaesParsed = parseCnaesSecundarios(editCnaesSecundarios)
          const novaFolha = {
            ...data.folhaPagamento,
            numFuncionarios: Number(editNumFuncionarios) || 9,
            folhaSalarialMensal: Number(editFolhaMensal) || 31850,
            encargosMensais: Number(editEncargosMensais) || 5730,
            custoTotalMensal:
              (Number(editFolhaMensal) || 31850) + (Number(editEncargosMensais) || 5730),
            folhaSalarialAnual: (Number(editFolhaMensal) || 31850) * 13.33,
            encargosAnuais: (Number(editEncargosMensais) || 5730) * 12,
            custoTotalAnual:
              (Number(editFolhaMensal) || 31850) * 13.33 +
              (Number(editEncargosMensais) || 5730) * 12,
            origemDados: 'cadastro' as const,
            detalheOrigem: 'Atualizado pelo usuário no cadastro de clientes.',
          }
          const novoComparativo = calcularComparativoCustoFolha(novaFolha)

          setData({
            ...data,
            enquadramentoTributarioAtual: editEnquadramento,
            cnaesSecundariosLista: cnaesParsed,
            folhaPagamento: novaFolha,
            comparativoCustoFolha: novoComparativo,
            empresa: data.empresa
              ? {
                  ...data.empresa,
                  enquadramento_tributario: editEnquadramento,
                  cnaes_secundarios: editCnaesSecundarios,
                  num_funcionarios: Number(editNumFuncionarios),
                  folha_salarial_mensal: Number(editFolhaMensal),
                  encargos_mensais: Number(editEncargosMensais),
                }
              : null,
          })
        }
      } else {
        setMensagemSalvo(`Aviso: ${resp.mensagem}`)
      }
    } catch (err: any) {
      setMensagemSalvo(`Erro: ${err?.message || 'Falha ao salvar'}`)
    } finally {
      setSalvandoEdicao(false)
      setTimeout(() => setMensagemSalvo(null), 4000)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const brl = (v: number | null | undefined) =>
    Number(v || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 2,
    })

  const maxReceitaMes = useMemo(() => {
    if (!data?.balancetes.length) return 1
    return Math.max(...data.balancetes.map((b) => b.receitaLiquida), 1)
  }, [data])

  if (carregando) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-300">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-3" />
        <h3 className="text-lg font-bold text-white">Carregando Diagnóstico Tributário...</h3>
        <p className="text-sm text-slate-400 mt-1">
          Buscando cadastro, balancetes mensais e notas fiscais do cliente no sistema...
        </p>
      </div>
    )
  }

  if (erro || !data) {
    return (
      <div className="bg-rose-950/40 border border-rose-800 rounded-xl p-6 text-slate-200">
        <div className="flex items-center gap-3 text-rose-400 mb-2">
          <AlertTriangle className="w-6 h-6" />
          <h3 className="font-bold text-lg">Erro ao carregar diagnóstico</h3>
        </div>
        <p className="text-sm text-slate-300 mb-4">{erro || 'Dados não localizados.'}</p>
        <button
          onClick={carregar}
          className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded text-sm font-semibold flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Tentar Novamente
        </button>
      </div>
    )
  }

  const {
    empresa,
    cnaesSecundariosLista,
    enquadramentoTributarioAtual,
    folhaPagamento,
    comparativoCustoFolha,
    balancetes,
    recomendacao,
    linhasComparativo,
    notas,
    simplesHibrido,
    lucroRealPuro,
    tabelaValoresPercentuais,
    linhaDoTempoTransicao,
  } = data

  return (
    <div className="space-y-6">
      {/* Visualização de Impressão A4 Modal */}
      {mostrarImprimivel && (
        <RelatorioDiagnosticoPastoreImprimivel
          data={data}
          onClose={() => setMostrarImprimivel(false)}
        />
      )}

      {/* Header do Painel */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" /> Caso Concreto · Cliente Analisado
              </span>
              <span className="text-xs text-slate-400">
                Dados ao vivo do PocketBase (Jan–Jul/2026)
              </span>
              {mensagemSalvo && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                  {mensagemSalvo}
                </span>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Building2 className="w-6 h-6 text-amber-500 flex-shrink-0" />
              {empresa?.razao_social || 'AUTO MECANICA IRMAOS PASTORE LTDA'}
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
              <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-semibold">
                CNPJ {empresa?.numero_documento || CNPJ_PASTORE_FORMATADO}
              </span>
              <span>·</span>
              <span className="text-amber-400 font-semibold">
                Enquadramento: {enquadramentoTributarioAtual || 'Simples Nacional (EPP)'}
              </span>
              <span>·</span>
              <span>CNAE Principal: {empresa?.cnae || '4520-0/01'}</span>
              <span>·</span>
              <span>
                {empresa?.municipio || 'Vacaria'}/{empresa?.uf || 'RS'}
              </span>
              <span>·</span>
              <span className="text-emerald-400 font-medium">
                Cliente desde {empresa?.cliente_desde || '1997'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setModoEdicao(!modoEdicao)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg font-semibold text-xs transition-all border ${
                modoEdicao
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                  : 'bg-slate-800 text-amber-300 border-amber-500/40 hover:bg-slate-700'
              }`}
              title="Editar enquadramento, CNAEs secundários e folha de pagamento da Pastore"
            >
              <Edit3 className="w-4 h-4" />
              {modoEdicao ? 'Fechar Edição' : 'Editar Cadastro / Folha'}
            </button>
            <button
              onClick={() => setMostrarImprimivel(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-lg shadow-md transition-all text-sm"
              title="Abre o layout de impressão A4 com o selo e padrão ADECONT"
            >
              <Printer className="w-4 h-4" />
              Imprimir Diagnóstico (A4)
            </button>
            <button
              onClick={carregar}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
              title="Recarregar dados"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* PAINEL DE EDIÇÃO EM TEMPO REAL (QUANDO ATIVADO) */}
      {modoEdicao && (
        <div className="bg-slate-900 border-2 border-amber-500/60 rounded-xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">
                Editar Dados do Cadastro & Folha de Pagamento — Cliente Pastore
              </h3>
            </div>
            <button
              onClick={() => setModoEdicao(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Enquadramento Tributário Atual
              </label>
              <select
                value={editEnquadramento}
                onChange={(e) => setEditEnquadramento(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-medium focus:border-amber-500 outline-none"
              >
                <option value="Simples Nacional">Simples Nacional (Anexo III)</option>
                <option value="Simples Nacional - EPP">Simples Nacional - EPP</option>
                <option value="Lucro Presumido">Lucro Presumido</option>
                <option value="Lucro Real">Lucro Real</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Número de Funcionários
              </label>
              <input
                type="number"
                min="0"
                value={editNumFuncionarios}
                onChange={(e) => setEditNumFuncionarios(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:border-amber-500 outline-none"
                placeholder="Ex: 9"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Folha Salarial Mensal (R$)
              </label>
              <input
                type="number"
                step="100"
                min="0"
                value={editFolhaMensal}
                onChange={(e) => setEditFolhaMensal(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:border-amber-500 outline-none"
                placeholder="Ex: 31850"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Salários, ordenados e pró-labore base
              </span>
            </div>

            <div className="md:col-span-1">
              <label className="block text-slate-300 font-semibold mb-1">
                Encargos Mensais (R$)
              </label>
              <input
                type="number"
                step="50"
                min="0"
                value={editEncargosMensais}
                onChange={(e) => setEditEncargosMensais(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:border-amber-500 outline-none"
                placeholder="Ex: 5730"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                FGTS (8%), provisões férias/13º, benefícios
              </span>
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">
                CNAEs Secundários (código e descrição, separados por ponto e vírgula)
              </label>
              <input
                type="text"
                value={editCnaesSecundarios}
                onChange={(e) => setEditCnaesSecundarios(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-amber-500 outline-none font-mono text-xs"
                placeholder="4530-7/03 - Comércio a varejo de autopeças; 4520-0/02 - Serviços de lanternagem"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Gravado no cadastro_empresas para auditoria tributária contínua
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setModoEdicao(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={salvarEdicao}
              disabled={salvandoEdicao}
              className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2 shadow"
            >
              {salvandoEdicao ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {salvandoEdicao ? 'Gravando no Banco...' : 'Gravar Alterações no Cadastro'}
            </button>
          </div>
        </div>
      )}

      {/* BLOCO DE ENQUADRAMENTO TRIBUTÁRIO & CNAES DO CADASTRO (DESTAQUE NO TOPO) */}
      <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Briefcase className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Enquadramento Tributário & Atividades Econômicas Cadastradas
              </h3>
              <p className="text-xs text-slate-400">
                Informações extraídas diretamente do cadastro do cliente (cadastro_empresas) no
                banco de dados ADECONT
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold self-start sm:self-auto">
            Regime Atual: {enquadramentoTributarioAtual}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Enquadramento e Porte */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Regime Tributário Atual
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-emerald-400">
                {enquadramentoTributarioAtual}
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                Porte: {empresa?.porte || 'EPP'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Tributação simplificada pela LC 123/2006. Tributos federais, ICMS e ISS unificados no
              DAS, com CPP (INSS patronal) embutida na alíquota única.
            </p>
          </div>

          {/* Atividade Principal */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Atividade Econômica Principal
            </span>
            <div>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/50 border border-amber-800/40 px-2 py-0.5 rounded inline-block mb-1">
                CNAE {empresa?.cnae || '4520-0/01'}
              </span>
              <p className="text-xs font-semibold text-white">
                {empresa?.ramo_atividade ||
                  'Serviços de manutenção e reparação mecânica de veículos automotores'}
              </p>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Incidência predominante de ISS e serviços automotivos. Sujeito ao Anexo III do Simples
              Nacional.
            </p>
          </div>

          {/* Atividades Secundárias */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Atividades Econômicas Secundárias
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {cnaesSecundariosLista.length} cadastrada(s)
              </span>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {cnaesSecundariosLista.map((cnae, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900 border border-slate-800/80 p-1.5 rounded text-[11px]"
                >
                  <span className="font-mono font-bold text-amber-300 block text-[10px]">
                    {cnae.codigo}
                  </span>
                  <span className="text-slate-300 leading-tight block">{cnae.descricao}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO DE FOLHA DE PAGAMENTO & RECURSOS HUMANOS */}
      <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-indigo-400 flex-shrink-0" />
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Folha de Pagamento & Encargos Sociais
              </h3>
              <p className="text-xs text-slate-400">
                Parâmetros apurados no balancete analítico e cadastro (
                {folhaPagamento.detalheOrigem})
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold self-start sm:self-auto">
            Fonte: {folhaPagamento.origemDados.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Quadro de Funcionários */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-semibold uppercase tracking-wider">Quadro de Pessoal</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {folhaPagamento.numFuncionarios}{' '}
              <span className="text-xs font-normal text-slate-400">colaboradores</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Mecânicos especializados, eletricistas, atendimento e gestão de oficina.
            </p>
          </div>

          {/* Folha Salarial Mensal */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-semibold uppercase tracking-wider">Folha Salarial Mensal</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">
              {brl(folhaPagamento.folhaSalarialMensal)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Projeção anual (13,33 salários):{' '}
              <strong className="text-slate-200">{brl(folhaPagamento.folhaSalarialAnual)}</strong>
            </p>
          </div>

          {/* Encargos e FGTS Mensal */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-semibold uppercase tracking-wider">
                Encargos Sociais Mensais
              </span>
              <Percent className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">
              {brl(folhaPagamento.encargosMensais)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              FGTS (8%), provisão de férias e 13º. Anual:{' '}
              <strong className="text-slate-200">{brl(folhaPagamento.encargosAnuais)}</strong>
            </p>
          </div>

          {/* Custo Total Mensal */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-semibold uppercase tracking-wider">
                Custo Total de Folha (Mês)
              </span>
              <Receipt className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black text-sky-400">
              {brl(folhaPagamento.custoTotalMensal)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Custo anual consolidado:{' '}
              <strong className="text-sky-300">{brl(folhaPagamento.custoTotalAnual)}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* BLOCO DE COMPARATIVO DE CUSTO DE FOLHA POR REGIME (REAL vs PRESUMIDO vs SIMPLES) */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl space-y-0">
        <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-400 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-white text-base">
                Comparativo do Custo de Folha e Encargos Previdenciários por Regime
              </h3>
              <p className="text-xs text-slate-400">
                Análise do impacto da Contribuição Previdenciária Patronal (CPP) e dedutibilidade em
                Lucro Real × Lucro Presumido
              </p>
            </div>
          </div>
          <span className="text-xs text-amber-300 bg-amber-950/60 border border-amber-800/50 px-2.5 py-1 rounded">
            Diferença Real × Presumido:{' '}
            <strong className="text-emerald-400">
              Economia de {brl(comparativoCustoFolha.diferencaRealVsPresumidoBrl)}/ano
            </strong>
          </span>
        </div>

        <div className="p-4 bg-indigo-950/20 border-b border-indigo-900/40 text-xs text-indigo-200/90 leading-relaxed">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Destaque Regulamentar — Simples Nacional e Simples Híbrido:</strong>{' '}
              {comparativoCustoFolha.notaSimplesSemDestaque}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-300 border-b border-slate-700 uppercase tracking-wider text-[11px]">
                <th className="p-3 w-[24%]">Regime Tributário</th>
                <th className="p-3 text-center w-[12%]">CPP Destacada?</th>
                <th className="p-3 text-right w-[16%]">INSS Patronal (Ano)</th>
                <th className="p-3 text-right w-[16%]">Custo Bruto Folha</th>
                <th className="p-3 text-right w-[16%]">Dedutibilidade IRPJ/CSLL</th>
                <th className="p-3 text-right w-[16%]">Custo Líquido Anual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {comparativoCustoFolha.regimes.map((r) => {
                const isSimples = r.regimeId === 'simples' || r.regimeId === 'simples_hibrido'
                const isReal = r.regimeId === 'lucro_real_puro'
                const isPresumido = r.regimeId === 'lucro_presumido'

                return (
                  <tr
                    key={r.regimeId}
                    className={`transition-colors ${
                      isReal
                        ? 'bg-emerald-950/20 hover:bg-emerald-950/30'
                        : isPresumido
                          ? 'bg-rose-950/20 hover:bg-rose-950/30'
                          : isSimples
                            ? 'bg-slate-900/60 hover:bg-slate-800/40'
                            : 'bg-slate-900/40'
                    }`}
                  >
                    <td className="p-3 border-r border-slate-800 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <span>{r.nomeRegime}</span>
                        {isSimples && (
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                            DAS Unificado
                          </span>
                        )}
                        {isReal && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                            Dedutível
                          </span>
                        )}
                        {isPresumido && (
                          <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono">
                            Custo Puro (+20%)
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3 text-center border-r border-slate-800 font-mono">
                      {r.temCppSeparada ? (
                        <span className="text-rose-400 font-bold">Sim (20%)</span>
                      ) : (
                        <span className="text-slate-400">Não (Embutido)</span>
                      )}
                    </td>

                    <td className="p-3 text-right font-mono border-r border-slate-800">
                      {r.encargoPrevidenciarioPatronalAnual > 0 ? (
                        <span className="font-bold text-rose-300">
                          {brl(r.encargoPrevidenciarioPatronalAnual)}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">R$ 0,00</span>
                      )}
                    </td>

                    <td className="p-3 text-right font-mono text-slate-200 border-r border-slate-800 font-medium">
                      {brl(r.custoFolhaBrutoAnual)}
                    </td>

                    <td className="p-3 text-right font-mono border-r border-slate-800">
                      {r.economiaFiscalIrpjCsllAnual > 0 ? (
                        <span className="text-emerald-400 font-bold">
                          - {brl(r.economiaFiscalIrpjCsllAnual)} (24%)
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">R$ 0,00 (Sem efeito)</span>
                      )}
                    </td>

                    <td className="p-3 text-right font-mono font-bold text-white">
                      <span
                        className={
                          isReal
                            ? 'text-emerald-400'
                            : isPresumido
                              ? 'text-rose-300'
                              : 'text-slate-200'
                        }
                      >
                        {brl(r.custoFolhaLiquidoAnual)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-950/70 border-t border-slate-800 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-400">
            <Scale className="w-4 h-4" /> Veredito Técnico ADECONT sobre o Custo de Pessoal nos
            Regimes:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded">
              <strong className="text-rose-300 block mb-1">
                Lucro Presumido — Desvantagem Crítica na Folha:
              </strong>
              No Lucro Presumido, a Pastore recolheria 20% de CPP patronal (
              {brl(
                comparativoCustoFolha.regimes.find((r) => r.regimeId === 'lucro_presumido')
                  ?.encargoPrevidenciarioPatronalAnual || 0,
              )}
              /ano) sem direito de abater a despesa de folha da base de cálculo do IRPJ e da CSLL,
              pois o imposto é calculado sobre uma receita presumida de 32% (serviços) / 8% (peças).
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded">
              <strong className="text-emerald-300 block mb-1">
                Lucro Real — Efeito Protetivo da Dedutibilidade:
              </strong>
              No Lucro Real, embora haja os mesmos 20% de CPP, todo o gasto de salários, FGTS e
              encargos patronais (
              {brl(
                comparativoCustoFolha.regimes.find((r) => r.regimeId === 'lucro_real_puro')
                  ?.custoFolhaBrutoAnual || 0,
              )}
              ) é despesa operacional 100% dedutível, gerando economia fiscal de 24% (15% IRPJ + 9%
              CSLL), o que reduz o custo líquido anual em{' '}
              {brl(comparativoCustoFolha.diferencaRealVsPresumidoBrl)} vs o Lucro Presumido.
            </div>
          </div>
        </div>
      </div>

      {/* 1. RETRATO ATUAL DO CLIENTE (CARDS + MINI-GRÁFICO) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita 7 meses + Projeção Anual */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Receita Real Acumulada</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-black text-white">{brl(data.receitaTotalAcumulada)}</div>
          <div className="mt-2 text-xs text-amber-400/90 font-medium bg-amber-950/40 border border-amber-800/50 rounded p-1.5 flex justify-between items-center">
            <span>Projeção Anual (12m):</span>
            <span className="font-bold text-emerald-400">{brl(data.receitaAnualizada)}</span>
          </div>
          <p className="text-[11px] text-emerald-400/90 mt-1 font-medium">
            Abaixo do teto do Simples Nacional (R$ 4,8 mi). Média: {brl(data.receitaMensalMedia)}
            /mês.
          </p>
        </div>

        {/* Ativo Total e Patrimônio Líquido */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Estrutura Patrimonial</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-black text-white">{brl(data.ativoTotalMaisRecente)}</div>
          <div className="mt-2 text-xs text-slate-300 bg-slate-900/60 border border-slate-700 rounded p-1.5 flex justify-between items-center">
            <span>Patrimônio Líquido (Jul):</span>
            <span className="font-bold text-white">{brl(data.patrimonioLiquidoFinal)}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Capital Social registrado de {empresa?.capital_social || 'R$ 640.000,00'}.
          </p>
        </div>

        {/* Margem Retida vs Presunção */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Margem Retida no PL</span>
            <Percent className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400">
            {data.margemRetidaLiquidaPct.toFixed(2)}%
          </div>
          <div className="mt-2 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded p-1.5 flex justify-between items-center">
            <span>Alerta Presunção:</span>
            <span className="font-bold">Presume 8% a 32%</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Variação de PL de +{brl(data.variacaoPatrimonioLiquido)} no período.
          </p>
        </div>

        {/* Operações Fiscais e NFes */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Fluxo de Documentos</span>
            <Receipt className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-black text-white flex items-baseline gap-2">
            <span>{notas.totalNotas}</span>
            <span className="text-xs font-normal text-slate-400">chaves únicas</span>
          </div>
          <div className="mt-2 text-xs text-slate-300 bg-slate-900/60 border border-slate-700 rounded p-1.5 flex justify-between items-center">
            <span>Saídas (CFOP 5102):</span>
            <span className="font-bold text-amber-300">{notas.saidasQtd} NFes</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Entradas: {notas.entradasQtd} NFes (Cobra Rolamentos, baterias, autopeças).
          </p>
          {notas.conciliacaoFontes?.avisoTransparencia && (
            <div className="mt-2 pt-2 border-t border-slate-700/60 text-[10px] text-amber-300/90 leading-tight">
              {notas.conciliacaoFontes.avisoTransparencia}
            </div>
          )}
        </div>
      </div>

      {/* Mini-Gráfico da Evolução Mensal da Receita (Balancetes Jan-Jul) */}
      <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-5 shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">
              Evolução da Receita Líquida Mensal nos Balancetes Oficiais (2026)
            </h3>
          </div>
          <span className="text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-700">
            Total 7 Meses:{' '}
            <strong className="text-amber-400">{brl(data.receitaTotalAcumulada)}</strong>
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 items-end h-40 pt-6 pb-2 px-2 border-b border-slate-700">
          {balancetes.map((b) => {
            const pct = Math.max(8, Math.round((b.receitaLiquida / maxReceitaMes) * 100))
            return (
              <div key={b.id} className="flex flex-col items-center h-full justify-end group">
                <span className="text-[10px] text-amber-300 font-mono opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-bold">
                  {brl(b.receitaLiquida)}
                </span>
                <div
                  style={{ height: `${pct}%` }}
                  className="w-full max-w-[48px] bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-md group-hover:from-amber-500 group-hover:to-amber-300 transition-all shadow-md relative"
                ></div>
                <span className="text-xs font-semibold text-slate-300 mt-2">{b.mesRotulo}</span>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 mt-3 flex-wrap gap-2">
          <span>
            Valores mensais líquidos desdobrados por diferença (de R$ 201k a R$ 297k/mês). Balancete
            de Julho (R$ 1,66 mi) reflete o acumulado real.
          </span>
          <span className="text-emerald-400 font-medium">
            Projeção anualizada de <strong>~{brl(data.receitaAnualizada)}</strong> — DENTRO do teto
            do Simples (R$ 4,8 mi)
          </span>
        </div>
      </div>

      {/* Detalhamento Mensal da Conversão (Cumulativo Gravado vs Líquido Real) */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-500" />
            Detalhamento da Conversão de Balancetes Cumulativos (Jan–Jul/2026)
          </h3>
          <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded font-mono">
            Conversão por Diferença (Leitura)
          </span>
        </div>
        <p className="text-xs text-slate-300 mb-3 leading-relaxed">
          {data.notaMetodologicaCumulativa}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-300 border-b border-slate-700 uppercase tracking-wider text-[11px]">
                <th className="p-2.5">Competência</th>
                <th className="p-2.5 text-right">Cumulativo Gravado no Balancete</th>
                <th className="p-2.5 text-right text-emerald-400">Receita Líquida Mensal Real</th>
                <th className="p-2.5 text-right">Patrimônio Líquido</th>
                <th className="p-2.5">Arquivo de Origem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.detalhamentoConversao.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-900/60' : 'bg-slate-800/40'}>
                  <td className="p-2.5 font-bold text-white">{row.mesRotulo}</td>
                  <td className="p-2.5 text-right font-mono text-slate-300">
                    {brl(row.cumulativoGravado)}
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-emerald-400">
                    {brl(row.liquidoMensalReal)}
                  </td>
                  <td className="p-2.5 text-right font-mono text-slate-300">
                    {brl(row.patrimonioLiquido)}
                  </td>
                  <td className="p-2.5 text-slate-400 text-[11px] truncate max-w-[180px]">
                    {row.arquivoNome}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-950 text-white font-bold border-t-2 border-slate-700">
                <td className="p-2.5">Total / Acumulado Real</td>
                <td className="p-2.5 text-right font-mono text-amber-300">
                  {brl(data.receitaTotalAcumulada)} (Acumulado Julho)
                </td>
                <td className="p-2.5 text-right font-mono text-emerald-400">
                  {brl(data.receitaTotalAcumulada)} (Soma Líquida Real)
                </td>
                <td className="p-2.5 text-right font-mono text-slate-300">
                  {brl(data.patrimonioLiquidoFinal)} (+{brl(data.variacaoPatrimonioLiquido)})
                </td>
                <td className="p-2.5 text-[11px] text-slate-400 font-normal">
                  Sem duplicação indevida
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 2. DIAGNÓSTICO TEXTUAL GERADO A PARTIR DOS NÚMEROS */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow">
        <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-amber-500" />
          Diagnóstico Técnico dos Dados da Auto Mecânica Pastore
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              1. Simples Nacional Plenamente Cabível
            </div>
            <p className="text-slate-300">
              Com receita acumulada real de <strong>{brl(data.receitaTotalAcumulada)}</strong> em 7
              meses e faturamento anualizado de <strong>~{brl(data.receitaAnualizada)}</strong>, a
              Pastore fica confortavelmente abaixo do sublimite de R$ 3,6 mi e do teto de R$ 4,8
              milhões do Simples Nacional. O Simples volta a ser uma opção perfeitamente viável,
              legal e competitiva para o cliente.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              2. Sobretaxação no Lucro Presumido
            </div>
            <p className="text-slate-300">
              Os balancetes oficiais revelam variação patrimonial de{' '}
              <strong>+{brl(data.variacaoPatrimonioLiquido)}</strong> (margem retida líquida de
              apenas <strong>{data.margemRetidaLiquidaPct.toFixed(2)}%</strong>). O Lucro Presumido
              presume lucro fictício de <strong>8%</strong> no comércio de peças e{' '}
              <strong>32%</strong> nos serviços mecânicos, gerando custo tributário desnecessário de
              quase R$ 100 mil/ano acima dos outros regimes.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-wider text-[11px]">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              3. Rota Estratégica 2027+ (IBS/CBS)
            </div>
            <p className="text-slate-300">
              A empresa adquire autopeças de grandes distribuidores nacionais (ex.:{' '}
              <em>Cobra Rolamentos</em>) e vende com mão de obra mecânica e peças (CFOP 5102)
              majoritariamente a clientes Pessoa Física (consumidor final). Na Reforma Tributária
              (2027+), o crédito das compras é 100% compensável no Regime Regular, gerando a menor
              carga líquida.
            </p>
          </div>
        </div>
      </div>

      {/* 2.5 QUADRO EXPLICATIVO: MECÂNICA E PONTO DE VIRADA DO SIMPLES HÍBRIDO (LC 214/2025) */}
      {simplesHibrido && (
        <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border-2 border-indigo-500/40 rounded-xl p-5 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider bg-indigo-500 text-slate-950 px-2.5 py-0.5 rounded font-mono">
                  Transição LC 214/2025
                </span>
                <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-indigo-400" />
                  Mecânica do Simples Híbrido 2027
                </span>
              </div>
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                Simples Híbrido: Sublimite de R$ 3,6 Mi e Ponto de Virada
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-900/80 border border-indigo-500/30 rounded-lg px-3 py-2 text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Status Atual (Projeção ~{brl(data.receitaAnualizada)})
                </span>
                <span className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Abaixo do Sublimite (Não Acionado)
                </span>
              </div>
              <div className="bg-indigo-950/80 border border-indigo-700/60 rounded-lg px-3 py-2 text-right">
                <span className="text-[10px] text-indigo-300 uppercase font-semibold block">
                  Julho Anualizado ({brl(balancetes[balancetes.length - 1]?.receitaLiquida)}/mês)
                </span>
                <span className="text-xs font-black text-amber-300">
                  ~{brl(simplesHibrido.receitaJulhoAnualizada)} (98,9% do Sublimite)
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 text-xs">
            {/* Bloco 1: Regra do Sublimite */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-indigo-300 font-bold uppercase tracking-wider text-[11px]">
                <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                1. O que é o Simples Híbrido?
              </div>
              <p className="text-slate-300 leading-relaxed">
                Ao faturar entre <strong>R$ 3.600.000,00</strong> (sublimite) e{' '}
                <strong>R$ 4.800.000,00</strong> (teto), a empresa NÃO é expulsa do Simples. A
                parcela até R$ 3,6 mi recolhe no DAS (sem IBS/CBS) e a parcela excedente recolhe
                IBS/CBS no <strong>regime regular</strong>, com crédito pleno de insumos e
                autopeças.
              </p>
            </div>

            {/* Bloco 2: Cenário a R$ 4,8 mi */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold uppercase tracking-wider text-[11px]">
                <TrendingUp className="w-4 h-4 text-amber-400 flex-shrink-0" />
                2. Cenário no Teto (R$ 4,8 Milhões)
              </div>
              <p className="text-slate-300 leading-relaxed">
                Parcela excedente de <strong>25%</strong> (R$ 1.200.000) paga IBS/CBS regular,
                abatendo{' '}
                <strong>{brl(simplesHibrido.cenarioTeto48.creditosAproveitadosExcedente)}</strong>{' '}
                em créditos de autopeças (Cobra Rolamentos). A carga final no teto é de apenas{' '}
                <strong className="text-emerald-400">
                  {brl(simplesHibrido.cenarioTeto48.cargaTotalAnual)} (~
                  {simplesHibrido.cenarioTeto48.aliquotaEfetivaPct.toFixed(2)}%)
                </strong>
                , economizando mais de R$ 145 mil/ano vs Simples puro.
              </p>
            </div>

            {/* Bloco 3: Ponto de Virada */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
                <Scale className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                3. Ponto de Virada Tributário
              </div>
              <p className="text-slate-300 leading-relaxed">
                Abaixo de R$ 3,6 mi: Simples puro e Híbrido empatam em <strong>~9,2%</strong>. Acima
                de R$ 3,6 mi: o Híbrido supera o Simples puro graças ao crédito pleno. Acima de R$
                4,8 mi ou com crescimento acentuado: o <strong>Regime Regular pleno (~8,5%)</strong>{' '}
                passa a ser a melhor rota técnica global.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-950/60 border border-slate-800 p-3 rounded-lg flex-wrap gap-2">
            <span className="text-indigo-300">
              💡 <strong>Diagnóstico Gerencial Pastore:</strong> Faturamento atual (~R$ 2,85 mi)
              está seguro no Simples. Porém, o ritmo de julho (R$ 296,9k) aponta para R$ 3,56
              mi/ano, tornando o Simples Híbrido a salvaguarda legal perfeita para 2027+.
            </span>
            <span className="font-mono text-emerald-400 font-bold">
              Sublimite: R$ 3.600.000,00 | Teto: R$ 4.800.000,00
            </span>
          </div>
        </div>
      )}

      {/* NOVO BLOCO: COMPARATIVO LUCRO REAL COMPLETO (REGIME AUTÔNOMO) */}
      {lucroRealPuro && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/40 border-2 border-sky-600/50 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-sky-800/60 pb-3">
            <div className="flex items-center gap-2.5">
              <Briefcase className="w-5 h-5 text-sky-400 flex-shrink-0" />
              <div>
                <span className="text-[10px] font-mono uppercase bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30">
                  Regime Autônomo & Completo
                </span>
                <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
                  1. Comparativo Lucro Real Completo (Tributação Efetiva sobre Números Reais)
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-300">Lucro Real Estimado:</span>
              <span className="font-mono font-bold text-emerald-400 bg-emerald-950/70 px-2.5 py-1 rounded border border-emerald-700/60">
                {brl(lucroRealPuro.lucroRealAnualEstimado)} (
                {lucroRealPuro.margemLucroRealPct.toFixed(2)}% da receita)
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            No <strong>Lucro Real</strong>, o IRPJ e a CSLL incidem estritamente sobre o resultado
            econômico comprovado da mecânica nos balancetes (margem retida real de ~
            <strong>{lucroRealPuro.margemLucroRealPct.toFixed(2)}%</strong>). Como o lucro anual
            estimado (~{brl(lucroRealPuro.lucroRealAnualEstimado)}) fica{' '}
            <strong>abaixo de R$ 240.000,00/ano</strong> (R$ 20 mil/mês), a Pastore tem{' '}
            <strong>isenção integral do adicional de 10% do IRPJ</strong>.
          </p>

          {/* Cards de Apuração do Lucro Real */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            {/* IRPJ */}
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                IRPJ (15% + Adic. 10%)
              </span>
              <div className="text-sm font-mono font-bold text-white">
                {brl(lucroRealPuro.irpjTotal)}
              </div>
              <p className="text-[10px] text-slate-400">
                15% s/ {brl(lucroRealPuro.lucroRealAnualEstimado)}. Adicional 10% = R$ 0,00 (abaixo
                de R$ 20k/mês).
              </p>
            </div>

            {/* CSLL */}
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                CSLL (9% sobre Lucro Real)
              </span>
              <div className="text-sm font-mono font-bold text-white">
                {brl(lucroRealPuro.csll9)}
              </div>
              <p className="text-[10px] text-slate-400">
                9% direto sobre o lucro fiscal apurado nos balancetes oficiais.
              </p>
            </div>

            {/* IRPJ + CSLL Consolidado */}
            <div className="bg-emerald-950/40 border border-emerald-700/60 p-3 rounded-lg space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-300 block">
                Tributação Direta (IRPJ + CSLL)
              </span>
              <div className="text-sm font-mono font-bold text-emerald-400">
                {brl(lucroRealPuro.irpjCsllConsolidado)} (~
                {lucroRealPuro.irpjCsllAliquotaEfetivaPct.toFixed(2)}%)
              </div>
              <p className="text-[10px] text-emerald-300/80">
                Alíquota direta extremamente reduzida sobre a receita bruta.
              </p>
            </div>

            {/* Custo de Conformidade */}
            <div className="bg-rose-950/30 border border-rose-800/60 p-3 rounded-lg space-y-1">
              <span className="text-[10px] uppercase font-bold text-rose-300 block">
                Custo de Conformidade / SPED
              </span>
              <div className="text-sm font-mono font-bold text-rose-300">
                ~{brl(lucroRealPuro.custoConformidadeAnualEstimado)} / ano
              </div>
              <p className="text-[10px] text-rose-300/80">
                ECD, ECF, EFD-Contribuições e auditoria contábil obrigatória.
              </p>
            </div>
          </div>

          {/* Créditos de PIS/COFINS e Tributação Indireta */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-sky-400" />
                Aproveitamento de Créditos das Compras e Tributos Indiretos
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                PIS 1,65% · COFINS 7,60% (Não-Cumulativos)
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-[11px]">
              <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Compras de Peças/Insumos:</span>
                <span className="font-bold text-white font-mono">
                  {brl(lucroRealPuro.comprasInsumosAnual)} (~95,6% receita)
                </span>
                <p className="text-[10px] text-slate-400 mt-1">
                  Créditos gerados nas aquisições de distribuidores (Cobra Rolamentos, etc.).
                </p>
              </div>
              <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">
                  Autopeças Monofásicas & ICMS-ST:
                </span>
                <span className="font-bold text-amber-300 font-mono">
                  Segregação Legal (Lei 10.485)
                </span>
                <p className="text-[10px] text-slate-400 mt-1">
                  Alíquota zero de PIS/COFINS na saída varejista e ICMS retido por substituição
                  tributária no RS.
                </p>
              </div>
              <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">
                  Carga Total Lucro Real Puro:
                </span>
                <span className="font-bold text-sky-300 font-mono">
                  {brl(lucroRealPuro.cargaTributariaAnualTotal)} (~
                  {lucroRealPuro.aliquotaEfetivaTotalPct.toFixed(2)}%)
                </span>
                <p className="text-[10px] text-slate-400 mt-1">
                  Inclui tributos diretos, indiretos e encargos patronais (CPP folha).
                </p>
              </div>
            </div>
          </div>

          {/* Obrigações Acessórias Exigidas no Lucro Real */}
          <div>
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Obrigações Acessórias e Exigências Legais do Lucro Real:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-[10px]">
              {lucroRealPuro.obrigacoesAcessorias.map((ob, idx) => (
                <div key={idx} className="bg-slate-950/50 border border-slate-800 p-2 rounded">
                  <div className="font-bold text-slate-200">{ob.nome}</div>
                  <span className="text-sky-400 font-mono block text-[9px]">
                    {ob.periodicidade}
                  </span>
                  <p className="text-slate-400 mt-1 line-clamp-3 leading-tight">{ob.descricao}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Parecer do Lucro Real */}
          <div className="bg-sky-950/30 border border-sky-800/60 rounded-lg p-3 text-xs text-sky-200/90 leading-relaxed">
            <strong>Veredito Técnico ADECONT sobre Lucro Real:</strong>{' '}
            {lucroRealPuro.avaliacaoAdiantada}
          </div>
        </div>
      )}

      {/* NOVO BLOCO: TABELA CONSOLIDADA DE VALORES EM R$ E PERCENTUAIS (5 REGIMES) COM VANTAGENS E DESVANTAGENS */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl space-y-0">
        <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <h3 className="font-bold text-white text-base">
              2. Tabela de Valores em R$ e Percentuais — Comparativo Consolidado de 5 Regimes
            </h3>
          </div>
          <span className="text-xs text-slate-300 bg-slate-900 px-2.5 py-1 rounded border border-slate-700">
            Regime de Referência: <strong className="text-emerald-400">Simples Nacional</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-300 border-b border-slate-700 uppercase tracking-wider text-[11px]">
                <th className="p-3 w-[28%]">Regime Tributário</th>
                <th className="p-3 text-right w-[18%]">Carga Anual Estimada (R$)</th>
                <th className="p-3 text-right w-[16%]">Alíquota Efetiva (%)</th>
                <th className="p-3 text-right w-[19%]">Economia / Custo vs Simples</th>
                <th className="p-3 text-right w-[19%]">Diferença em Pontos (p.p.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {tabelaValoresPercentuais.map((item) => {
                const ehReferencia = item.ehRegimeReferencia
                const ehMaisCaro = item.diferencaVsSimplesBrl > 0
                const ehEconomia = item.diferencaVsSimplesBrl < 0

                return (
                  <tr
                    key={item.regimeId}
                    className={`transition-colors ${
                      ehReferencia
                        ? 'bg-emerald-950/20 hover:bg-emerald-950/30'
                        : item.melhorRegimeLongoPrazo
                          ? 'bg-amber-950/20 hover:bg-amber-950/30'
                          : 'bg-slate-900/60 hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="p-3 border-r border-slate-800 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <span>{item.nomeRegime}</span>
                        {ehReferencia && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-normal">
                            Referência
                          </span>
                        )}
                        {item.melhorRegimeLongoPrazo && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-normal">
                            Menor Carga 2027+
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-white border-r border-slate-800">
                      {brl(item.cargaAnualEstimada)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-200 border-r border-slate-800">
                      {item.aliquotaEfetivaPct.toFixed(2)}%
                    </td>
                    <td className="p-3 text-right font-mono border-r border-slate-800">
                      {ehReferencia ? (
                        <span className="text-slate-400 font-normal">R$ 0,00 (base)</span>
                      ) : ehEconomia ? (
                        <span className="text-emerald-400 font-bold">
                          -{brl(Math.abs(item.diferencaVsSimplesBrl))} (economia)
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold">
                          +{brl(item.diferencaVsSimplesBrl)} (sobretaxa)
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {ehReferencia ? (
                        <span className="text-slate-400 font-normal">0,00 p.p.</span>
                      ) : ehEconomia ? (
                        <span className="text-emerald-400 font-bold">
                          {item.diferencaVsSimplesPontosPct.toFixed(2)} p.p.
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold">
                          +{item.diferencaVsSimplesPontosPct.toFixed(2)} p.p.
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* VANTAGENS E DESVANTAGENS POR REGIME (CARDS EM GRADE) */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Análise Qualitativa: Vantagens e Desvantagens de Cada Regime
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tabelaValoresPercentuais.map((item) => (
              <div
                key={item.regimeId}
                className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-2 text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                    <span className="font-bold text-white text-xs">{item.rotuloCurto}</span>
                    <span className="font-mono text-[11px] text-amber-400 font-bold">
                      {item.aliquotaEfetivaPct.toFixed(2)}%
                    </span>
                  </div>

                  {/* Vantagens */}
                  <div className="space-y-1 mb-2">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" /> Vantagens:
                    </div>
                    {item.vantagens.map((v, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                        <span className="text-emerald-400 font-bold flex-shrink-0">•</span>
                        <span className="leading-tight">{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Desvantagens */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                      <ThumbsDown className="w-3 h-3" /> Desvantagens:
                    </div>
                    {item.desvantagens.map((d, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                        <span className="text-rose-400 font-bold flex-shrink-0">•</span>
                        <span className="leading-tight">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 mt-2 border-t border-slate-800/80 text-[10px] flex justify-between items-center text-slate-400">
                  <span>Carga Anual:</span>
                  <span className="font-mono font-bold text-slate-200">
                    {brl(item.cargaAnualEstimada)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* NOVO BLOCO: LINHA DO TEMPO DA TRANSIÇÃO TRIBUTÁRIA ATÉ 2033 (LC 214/2025) */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                  Lei Complementar nº 214/2025
                </span>
                <span className="text-[10px] font-bold uppercase bg-gradient-to-r from-amber-500/30 to-yellow-500/20 text-amber-200 px-2 py-0.5 rounded border border-amber-400/50 flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Recorte Estratégico: 2027–2029 Fase de Decisão
                </span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
                3. Linha do Tempo da Transição Tributária (2026 a 2033) e Impactos para a Pastore
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
              Fases Oficiais (IVA Dual)
            </span>
            <span className="text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded border border-amber-600/50 font-semibold text-[11px]">
              Destaque: Triênio 2027–2029
            </span>
          </div>
        </div>

        {/* Banner Explicativo do Recorte 2027-2029 Fase de Decisão */}
        <div className="bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-slate-900 border-l-4 border-l-amber-500 border border-amber-700/40 rounded-lg p-3 text-xs text-amber-100/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-amber-200 text-xs">
                Fase de Decisão Estratégica da Pastore: Triênio 2027, 2028 e 2029
              </p>
              <p className="text-[11px] text-slate-300 leading-snug">
                Os anos de <strong>2027 (momento da migração/decisão de regime)</strong>,{' '}
                <strong>2028 (ajuste ao Regime Regular)</strong> e{' '}
                <strong>2029 (consolidação da convivência e revisão da carga)</strong> constituem a
                janela crítica de decisão contábil e societária.
              </p>
            </div>
          </div>
          <span className="shrink-0 text-[10px] uppercase font-mono font-bold bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded border border-amber-500/40">
            Janela Crítica ADECONT
          </span>
        </div>

        <div className="space-y-3">
          {linhaDoTempoTransicao.map((marco, idx) => {
            const isFaseDecisao = !!marco.faseDecisao
            return (
              <div
                key={idx}
                className={`rounded-lg p-3.5 transition-all space-y-2 text-xs relative ${
                  isFaseDecisao
                    ? 'bg-gradient-to-b from-amber-950/30 via-slate-950 to-slate-950 border-2 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.08)]'
                    : 'bg-slate-950/70 border border-slate-800 hover:border-slate-700 opacity-90'
                }`}
              >
                {/* Faixa / Badge de Fase de Decisão */}
                {isFaseDecisao && (
                  <div className="flex items-center justify-between gap-2 pb-1.5 mb-1 border-b border-amber-500/30">
                    <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                      Fase de Decisão · Triênio 2027–2029
                    </span>
                    {marco.rotuloFaseDecisao && (
                      <span className="text-[10px] font-medium text-amber-200/90 hidden md:inline">
                        {marco.rotuloFaseDecisao}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono font-black text-sm px-2.5 py-0.5 rounded border ${
                        isFaseDecisao
                          ? 'text-amber-300 bg-amber-500/20 border-amber-400/60 shadow-sm'
                          : 'text-amber-400 bg-amber-950/50 border-amber-800/50'
                      }`}
                    >
                      {marco.ano}
                    </span>
                    <h4
                      className={`font-bold text-xs ${
                        isFaseDecisao ? 'text-amber-100 font-extrabold' : 'text-white'
                      }`}
                    >
                      {marco.titulo}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded border ${
                        isFaseDecisao
                          ? 'bg-amber-950/80 text-amber-200 border-amber-600/60 font-semibold'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {marco.statusOficial}
                    </span>
                    {marco.creditoComprasValendo ? (
                      <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-semibold">
                        Crédito Pleno Ativo
                      </span>
                    ) : (
                      <span className="bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded">
                        Crédito em Teste
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px] pt-1">
                  <div className="space-y-0.5 bg-slate-900/60 p-2.5 rounded border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Mecânica Legislativa (LC 214/2025):
                    </span>
                    <p className="text-slate-300 leading-relaxed">{marco.mecanicaLegislativa}</p>
                  </div>
                  <div className="space-y-0.5 bg-slate-900/60 p-2.5 rounded border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-indigo-300 block">
                      O Que Muda para a Pastore:
                    </span>
                    <p className="text-slate-200 leading-relaxed">{marco.impactoPastore}</p>
                  </div>
                  <div
                    className={`space-y-0.5 p-2.5 rounded border ${
                      isFaseDecisao
                        ? 'bg-amber-950/40 border-amber-500/60 ring-1 ring-amber-500/20'
                        : 'bg-amber-950/20 border-amber-800/40'
                    }`}
                  >
                    <span
                      className={`text-[10px] uppercase font-bold block ${
                        isFaseDecisao ? 'text-amber-300' : 'text-amber-400'
                      }`}
                    >
                      Recomendação Estratégica ADECONT{isFaseDecisao ? ' (Fase de Decisão):' : ':'}
                    </span>
                    <p
                      className={`leading-relaxed font-medium ${
                        isFaseDecisao ? 'text-amber-100 font-semibold' : 'text-amber-200/90'
                      }`}
                    >
                      {marco.acaoRecomendadaAdecont}
                    </p>
                  </div>
                </div>

                {/* Pontos de Atenção Positivos e Negativos do Ano */}
                {((marco.pontosPositivos && marco.pontosPositivos.length > 0) ||
                  (marco.pontosNegativos && marco.pontosNegativos.length > 0)) && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-800/90 grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                    {/* Pontos Positivos */}
                    <div className="bg-emerald-950/30 border border-emerald-900/60 rounded-md p-2.5 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-[11px]">
                        <ThumbsUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Pontos Positivos & Oportunidades ({marco.ano})</span>
                      </div>
                      <div className="space-y-1.5">
                        {marco.pontosPositivos?.map((pos, pIdx) => (
                          <div
                            key={pIdx}
                            className="bg-slate-900/70 p-2 rounded border border-emerald-900/40 text-[11px] space-y-0.5"
                          >
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <span className="font-semibold text-emerald-200">{pos.titulo}</span>
                              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800/60">
                                {pos.dispositivoLegal}
                              </span>
                            </div>
                            <p className="text-slate-300 text-[10.5px] leading-tight">
                              {pos.descricao}
                            </p>
                            {pos.impactoPastore && (
                              <p className="text-emerald-300/90 text-[10px] italic">
                                <strong>Impacto Pastore:</strong> {pos.impactoPastore}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pontos Negativos */}
                    <div className="bg-rose-950/30 border border-rose-900/60 rounded-md p-2.5 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-rose-300 font-bold text-[11px]">
                        <ThumbsDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>Pontos Negativos, Riscos & Conformidade ({marco.ano})</span>
                      </div>
                      <div className="space-y-1.5">
                        {marco.pontosNegativos?.map((neg, nIdx) => (
                          <div
                            key={nIdx}
                            className="bg-slate-900/70 p-2 rounded border border-rose-900/40 text-[11px] space-y-0.5"
                          >
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <span className="font-semibold text-rose-200">{neg.titulo}</span>
                              <span className="text-[9px] font-mono text-rose-400 bg-rose-950/80 px-1.5 py-0.2 rounded border border-rose-800/60">
                                {neg.dispositivoLegal}
                              </span>
                            </div>
                            <p className="text-slate-300 text-[10.5px] leading-tight">
                              {neg.descricao}
                            </p>
                            {neg.impactoPastore && (
                              <p className="text-rose-300/90 text-[10px] italic">
                                <strong>Risco Pastore:</strong> {neg.impactoPastore}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Bloco: Evolução Recente da Legislação alimentado pelo Agente Atualizador */}
        {data.evolucaoLegislativaRecente && data.evolucaoLegislativaRecente.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Evolução Recente da Legislação — Agente Atualizador Contínuo
                </h4>
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Rotina semanal ativa (segundas-feiras) · {data.evolucaoLegislativaRecente.length}{' '}
                atos monitorados
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Atos normativos e revisões catalogadas pelo robô de inteligência regulatória da
              ADECONT (Receita Federal, CGIBS e DOU) que impactam a mecânica de transição e os
              prazos da oficina mecânica.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
              {data.evolucaoLegislativaRecente.map((item) => {
                const isInc = item.tipo === 'inclusao'
                const isAlt = item.tipo === 'alteracao'
                const badgeColor = isInc
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/70'
                  : isAlt
                    ? 'bg-amber-950/80 text-amber-300 border-amber-700/70'
                    : 'bg-rose-950/80 text-rose-300 border-rose-700/70'

                const borderItem = isInc
                  ? 'border-emerald-900/40 hover:border-emerald-700/60'
                  : isAlt
                    ? 'border-amber-900/40 hover:border-amber-700/60'
                    : 'border-rose-900/40 hover:border-rose-700/60'

                return (
                  <div
                    key={item.id}
                    className={`bg-slate-950/80 p-2.5 rounded-lg border ${borderItem} transition-colors space-y-1.5 text-xs`}
                  >
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9.5px] uppercase font-bold px-2 py-0.5 rounded border ${badgeColor}`}
                        >
                          {item.tipoRotulo}
                        </span>
                        <span className="font-mono font-bold text-slate-200 text-[11px]">
                          {item.codigoNorma}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.dataRevisao
                          ? new Date(item.dataRevisao).toLocaleDateString('pt-BR')
                          : 'Recente'}
                      </span>
                    </div>

                    <h5 className="font-semibold text-white text-[11px] leading-snug">
                      {item.tituloNorma}
                    </h5>

                    <p className="text-slate-300 text-[10.5px] leading-relaxed line-clamp-2">
                      {item.resumo}
                    </p>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-[10px]">
                      <span className="text-slate-400 truncate max-w-[55%]">
                        Órgão: <strong className="text-slate-300">{item.orgaoFonte}</strong>
                      </span>
                      {item.anoAfetado && (
                        <span className="text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/60 font-mono text-[9px]">
                          Impacto: {item.anoAfetado}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. TABELA COMPARATIVA (4 REGIMES LADO A LADO: SIMPLES x SIMPLES HÍBRIDO x PRESUMIDO x REGIME REGULAR) */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">
              Tabela Comparativa de 4 Regimes: Simples Nacional × Simples Híbrido 2027 × Lucro
              Presumido × Regime Regular 2027+
            </h3>
          </div>
          <span className="text-xs text-slate-300 bg-slate-900 px-2.5 py-1 rounded border border-slate-700">
            Base anualizada calculada: <strong>~{brl(data.receitaAnualizada)}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-300 border-b border-slate-700 uppercase tracking-wider text-[11px]">
                <th className="p-3 w-[20%]">Critério Comparativo</th>
                <th className="p-3 w-[20%] bg-emerald-950/40 border-l border-emerald-900/60">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Simples Nacional
                  </div>
                  <div className="text-[10px] text-emerald-400/80 font-normal">
                    Puro (Dentro do Teto)
                  </div>
                </th>
                <th className="p-3 w-[20%] bg-indigo-950/50 border-l border-indigo-900/60">
                  <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-indigo-400" />
                    Simples Híbrido 2027
                  </div>
                  <div className="text-[10px] text-indigo-300/80 font-normal">
                    LC 214/2025 (Sublimite R$ 3,6 mi)
                  </div>
                </th>
                <th className="p-3 w-[20%] bg-slate-900/90 border-l border-slate-800">
                  <div className="font-bold text-slate-200">Situação Atual</div>
                  <div className="text-[10px] text-slate-400 font-normal">Lucro Presumido</div>
                </th>
                <th className="p-3 w-[20%] bg-amber-950/40 border-l border-amber-900/60">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    Reforma 2027+
                  </div>
                  <div className="text-[10px] text-amber-300/80 font-normal">
                    Regime Regular (IBS/CBS) + Lucro Real
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {linhasComparativo.map((linha, index) => (
                <tr
                  key={index}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    index % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-900/80'
                  }`}
                >
                  <td className="p-3 font-semibold text-slate-200 border-r border-slate-800 bg-slate-950/20">
                    {linha.criterio}
                  </td>
                  <td className="p-3 text-slate-300 border-r border-slate-800 bg-emerald-950/10">
                    <p className="font-semibold text-emerald-200">{linha.simplesNacional.valor}</p>
                    <p className="text-[11px] text-slate-300 mt-1">
                      {linha.simplesNacional.detalhe}
                    </p>
                  </td>
                  <td className="p-3 text-slate-200 border-r border-slate-800 bg-indigo-950/20">
                    <p className="font-bold text-indigo-300">
                      {linha.simplesHibrido2027?.valor || '—'}
                    </p>
                    <p className="text-[11px] text-slate-300 mt-1">
                      {linha.simplesHibrido2027?.detalhe}
                    </p>
                  </td>
                  <td className="p-3 text-slate-300 border-r border-slate-800">
                    <p className="font-semibold text-white">{linha.lucroPresumido.valor}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {linha.lucroPresumido.detalhe}
                    </p>
                  </td>
                  <td className="p-3 text-slate-200 bg-amber-950/20 border-l border-amber-900/30">
                    <p className="font-bold text-amber-300">{linha.reforma2027.valor}</p>
                    <p className="text-[11px] text-slate-300 mt-1">{linha.reforma2027.detalhe}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. RECOMENDAÇÃO FINAL EM DESTAQUE */}
      <div className="bg-gradient-to-br from-amber-950/50 via-slate-900 to-slate-900 border-2 border-amber-500/50 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded font-mono">
              Recomendação Oficial ADECONT
            </span>
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              {recomendacao.titulo}
            </h3>
          </div>
          <div className="bg-emerald-950/60 border border-emerald-700/80 rounded-lg p-3 text-right flex-shrink-0">
            <span className="text-[11px] text-emerald-300 uppercase font-semibold block">
              Economia Anual Estimada
            </span>
            <span className="text-lg font-black text-emerald-400">~R$ 96k a R$ 116k / ano</span>
          </div>
        </div>

        <p className="text-sm text-slate-200 leading-relaxed mb-4 bg-slate-900/60 p-4 rounded-lg border border-slate-800">
          {recomendacao.motivoPrincipal}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          {recomendacao.pontosChave.map((ponto, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-xs text-slate-300 bg-slate-800/60 p-2.5 rounded border border-slate-700/60"
            >
              <span className="text-amber-400 font-bold">•</span>
              <span>{ponto}</span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              Estimativa gerencial baseada na <strong>LC 214/2025</strong> e nos dados
              contábeis/fiscais reais do sistema. Não substitui parecer formal de auditoria fiscal.
            </span>
          </div>
          <button
            onClick={() => setMostrarImprimivel(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg transition-colors text-xs uppercase tracking-wider flex-shrink-0"
          >
            <Printer className="w-4 h-4" />
            Imprimir Relatório Completo A4
          </button>
        </div>
      </div>
    </div>
  )
}

export default DiagnosticoRegimeTributario
