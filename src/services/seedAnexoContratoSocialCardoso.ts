/**
 * SEED DO ANEXO — Contrato social CARDOSO & SIX LTDA (cliente 94109)
 * ===================================================================
 * O binário do PDF só existe no bundle do frontend (src/assets/, enviado na
 * rodada da recepção — v0.0.745). O backend PocketBase roda em outro host e
 * não enxerga esse diretório (lição da migration 0120), e um literal base64 de
 * 641 KB não cabe em migration/hook.
 *
 * Estratégia: o próprio app, ao abrir a listagem de clientes, verifica UMA vez
 * por sessão se o anexo "Contrato social - CARDOSO & SIX LTDA.pdf" já existe
 * para o cliente 94109 em `cliente_arquivos`. Se não existe, importa o PDF
 * publicado como asset estático (/contrato-social-cardoso-e-six-d5830.pdf) e
 * grava via uploadArquivoCliente() — o MESMO serviço da tela de recepção.
 *
 * IDEMPOTÊNCIA: consulta antes de gravar; gravado uma vez, nunca mais toca
 * (mesmo título + mesmo cliente ⇒ nada é duplicado em execuções futuras).
 * NÃO altera nenhum fluxo existente das telas: é um disparo de seed silencioso
 * que só grava o que falta.
 */
import contratoSocialPdf from '@/assets/contrato-social-cardoso-e-six-d5830.pdf'
import pb from '@/lib/pocketbase/client'
import { uploadArquivoCliente } from '@/services/clienteDadosComplementaresService'

const CODIGO_CLIENTE = 94109
const TITULO_ANEXO = 'Contrato social - CARDOSO & SIX LTDA.pdf'
const CHAVE_SESSAO = 'seed_anexo_cardoso_94109_v1'

/** Roda o seed uma vez por sessão de navegador (idempotente). */
export async function seedAnexoContratoSocialCardoso(): Promise<void> {
  try {
    if (sessionStorage.getItem(CHAVE_SESSAO)) return
    sessionStorage.setItem(CHAVE_SESSAO, '1')

    // Já existe o anexo deste arquivo para o cliente 94109? (idempotência forte)
    const existentes = await pb.collection('cliente_arquivos').getFullList({
      filter: `cliente_codigo = ${CODIGO_CLIENTE} && titulo = "${TITULO_ANEXO}"`,
      limit: 1,
    })
    if (existentes.length > 0) return

    // Busca o binário publicado com o bundle (asset estático raiz)
    const res = await fetch(contratoSocialPdf)
    if (!res.ok) throw new Error('HTTP ' + res.status + ' ao buscar o PDF do contrato social.')
    const blob = await res.blob()
    if (!blob.size) throw new Error('PDF do contrato social vazio.')

    const file = new File([blob], 'contrato-social-cardoso-e-six-d5830.pdf', {
      type: 'application/pdf',
    })

    await uploadArquivoCliente({
      clienteCnpj: 'COD' + CODIGO_CLIENTE,
      clienteCodigo: CODIGO_CLIENTE,
      titulo: TITULO_ANEXO,
      categoria: 'Contrato',
      file,
      observacao: 'Contrato social registrado na JUCISRS nº 4848028 em 19/09/2018',
      enviadoPor: 'Seed automático (recepção de documento)',
    })
  } catch (err) {
    console.warn('[seedAnexoContratoSocialCardoso] falhou (silencioso):', err)
  }
}
