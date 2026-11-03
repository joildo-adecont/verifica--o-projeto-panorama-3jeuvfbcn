import { AdecontLogo } from '@/components/AdecontLogo'
import { Button } from '@/components/ui/button'
import { Printer, X, Shield, Users, Calendar } from 'lucide-react'
import { SistemaUsuario, NivelAcessoCustomizado } from '@/services/sistemaUsuarios'

export interface RelatorioUsuariosPermissoesProps {
  usuarios: SistemaUsuario[]
  niveisCustomizados: NivelAcessoCustomizado[]
  usuarioGerador?: SistemaUsuario | null
  onFechar: () => void
}

export function RelatorioUsuariosPermissoes({
  usuarios,
  niveisCustomizados,
  usuarioGerador,
  onFechar,
}: RelatorioUsuariosPermissoesProps) {
  const dataHoraImpressao = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const handleImprimir = () => {
    window.print()
  }

  const ativos = usuarios.filter((u) => u.ativo).length
  const inativos = usuarios.length - ativos
  const confirmados = usuarios.filter((u) => u.status_cadastro !== 'pendente_confirmacao').length
  const pendentes = usuarios.length - confirmados

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      {/* Container Principal A4 */}
      <div className="bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-300 w-full max-w-4xl p-6 sm:p-8 space-y-6 print:shadow-none print:border-none print:p-6 print:max-w-none">
        {/* Barra superior de ações na tela (oculta na impressão) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Shield className="w-4 h-4 text-emerald-700" />
            <span className="font-semibold">
              Relatório Institucional A4 — Usuários e Matriz de Permissões
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleImprimir}
              className="bg-panorama-navy hover:bg-panorama-navy-light text-white text-xs h-8 gap-1.5 font-bold"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / Salvar PDF (A4)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onFechar}
              className="text-xs h-8"
            >
              <X className="w-3.5 h-3.5" />
              Fechar
            </Button>
          </div>
        </div>

        {/* ── CABEÇALHO DO DOCUMENTO A4 ── */}
        <header className="border-b-2 border-slate-800 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <AdecontLogo variante="colorido" tamanho="lg" />
              <div className="border-l border-slate-300 pl-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
                  Governança &amp; Acessos Institucionais
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                  Relatório de Usuários e Níveis de Acesso
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Panorama da Reforma Tributária — Controle Corporativo de Permissões
                </p>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-600 shrink-0">
              <div className="flex items-center gap-1 justify-end font-semibold text-slate-800">
                <Calendar className="w-3 h-3 text-emerald-700" />
                <span>{dataHoraImpressao}</span>
              </div>
              <span className="text-[10px] text-slate-500 block">Emissão Oficial ADECONT</span>
            </div>
          </div>

          {/* Resumo Estatístico */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-slate-100 text-xs">
            <div className="p-2 rounded bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 block font-semibold uppercase">
                Total Usuários
              </span>
              <span className="text-base font-black text-slate-900">{usuarios.length}</span>
            </div>
            <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] text-emerald-700 block font-semibold uppercase">
                Usuários Ativos
              </span>
              <span className="text-base font-black text-emerald-800">{ativos}</span>
            </div>
            <div className="p-2 rounded bg-blue-50 border border-blue-200">
              <span className="text-[10px] text-blue-700 block font-semibold uppercase">
                Confirmados
              </span>
              <span className="text-base font-black text-blue-800">{confirmados}</span>
            </div>
            <div className="p-2 rounded bg-amber-50 border border-amber-200">
              <span className="text-[10px] text-amber-700 block font-semibold uppercase">
                Pendentes de Código
              </span>
              <span className="text-base font-black text-amber-800">{pendentes}</span>
            </div>
          </div>
        </header>

        {/* ── TABELA DE USUÁRIOS E PERMISSÕES ── */}
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-600" />
            Quadro de Usuários Cadastrados e Segmentos Liberados
          </h2>

          <div className="overflow-x-auto border border-slate-300 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                  <th className="py-2 px-2.5">Nome / E-mail</th>
                  <th className="py-2 px-2">Cargo</th>
                  <th className="py-2 px-2">Nível</th>
                  <th className="py-2 px-1.5 text-center">Jurídico</th>
                  <th className="py-2 px-1.5 text-center">Tributário</th>
                  <th className="py-2 px-1.5 text-center">Contábil</th>
                  <th className="py-2 px-1.5 text-center">Administrativo</th>
                  <th className="py-2 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {usuarios.map((u, i) => (
                  <tr key={u.id || i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="py-2 px-2.5">
                      <div className="font-bold text-slate-900">{u.nome}</div>
                      <div className="text-[10.5px] text-slate-500 font-mono">{u.email}</div>
                    </td>
                    <td className="py-2 px-2 text-[11px] text-slate-700">{u.cargo || '—'}</td>
                    <td className="py-2 px-2">
                      <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-300 bg-white">
                        {u.nivel_customizado_nome || u.nivel}
                      </span>
                    </td>
                    <td className="py-2 px-1.5 text-center">
                      <span
                        className={`text-[9.5px] font-bold px-1 py-0.5 rounded ${
                          u.perm_juridico_acesso
                            ? u.perm_juridico_tipo === 'editar'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-400 line-through'
                        }`}
                      >
                        {u.perm_juridico_acesso
                          ? u.perm_juridico_tipo === 'editar'
                            ? 'Editar'
                            : 'Cons.'
                          : 'Não'}
                      </span>
                    </td>
                    <td className="py-2 px-1.5 text-center">
                      <span
                        className={`text-[9.5px] font-bold px-1 py-0.5 rounded ${
                          u.perm_tributario_acesso
                            ? u.perm_tributario_tipo === 'editar'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-400 line-through'
                        }`}
                      >
                        {u.perm_tributario_acesso
                          ? u.perm_tributario_tipo === 'editar'
                            ? 'Editar'
                            : 'Cons.'
                          : 'Não'}
                      </span>
                    </td>
                    <td className="py-2 px-1.5 text-center">
                      <span
                        className={`text-[9.5px] font-bold px-1 py-0.5 rounded ${
                          u.perm_contabil_acesso
                            ? u.perm_contabil_tipo === 'editar'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-400 line-through'
                        }`}
                      >
                        {u.perm_contabil_acesso
                          ? u.perm_contabil_tipo === 'editar'
                            ? 'Editar'
                            : 'Cons.'
                          : 'Não'}
                      </span>
                    </td>
                    <td className="py-2 px-1.5 text-center">
                      <span
                        className={`text-[9.5px] font-bold px-1 py-0.5 rounded ${
                          u.perm_administrativo_acesso
                            ? u.perm_administrativo_tipo === 'editar'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-400 line-through'
                        }`}
                      >
                        {u.perm_administrativo_acesso
                          ? u.perm_administrativo_tipo === 'editar'
                            ? 'Editar'
                            : 'Cons.'
                          : 'Não'}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span
                        className={`inline-block text-[9.5px] font-bold px-1.5 py-0.5 rounded ${
                          u.status_cadastro === 'pendente_confirmacao'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : u.ativo
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-600 border border-slate-300'
                        }`}
                      >
                        {u.status_cadastro === 'pendente_confirmacao'
                          ? 'Pendente'
                          : u.ativo
                            ? 'Ativo'
                            : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── QUADRO DE NÍVEIS CUSTOMIZADOS REGISTRADOS ── */}
        {niveisCustomizados.length > 0 && (
          <section className="space-y-2 pt-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Níveis Customizados Cadastrados no Sistema ({niveisCustomizados.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {niveisCustomizados.map((nc) => (
                <div key={nc.id} className="p-2.5 rounded border border-slate-200 bg-slate-50/50">
                  <div className="font-bold text-slate-800 flex items-center justify-between">
                    <span>{nc.nome}</span>
                    <span className="text-[10px] text-slate-500 uppercase">
                      {nc.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {nc.descricao || 'Sem descrição.'}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── RODAPÉ INSTITUCIONAL COM IDENTIFICAÇÃO DO GERADOR ── */}
        <footer className="border-t-2 border-slate-800 pt-3 text-[11px] text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-bold text-slate-800">
              Gerado por:{' '}
              {usuarioGerador
                ? `${usuarioGerador.nome} — nível ${usuarioGerador.nivel_customizado_nome || usuarioGerador.nivel}`
                : 'Administrador ADECONT — nível Administrador'}
            </span>
            <span className="text-slate-500 block text-[10px]">
              Emitido em: {dataHoraImpressao} • Ambiente: Produção Corporativa ADECONT
            </span>
          </div>
          <div className="text-right text-[10px] text-slate-500">
            <span>ADECONT Assessoria Contábil e Administrativa</span>
            <span className="block font-mono">Documento Autenticado — Sistema Panorama RT</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
