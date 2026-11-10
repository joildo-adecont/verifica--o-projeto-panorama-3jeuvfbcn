/// <reference path="../pb_data/types.d.ts" />
/**
 * /backend/v1/analise-gravar-relatorio
 * =====================================
 * GRAVAÇÃO DO RELATÓRIO PDF DA ANÁLISE na aba de arquivos da ficha do cliente
 * (coleção `cliente_arquivos`), a partir dos dados já rodados no frontend.
 *
 * Por que o PDF vem pronto do frontend: os PDFs de balanço são Type0/Identity-H
 * (ilegíveis do backend — ver leitorBalancetePDF.ts) e a JSVM não tem zlib, o
 * mesmo motivo pelo qual a extração acontece no navegador. O frontend gera o
 * PDF (texto puro, ASCII) e este hook só grava o binário.
 *
 * Vínculo obrigatório: cliente_cnpj NÃO pode ficar vazio — cliente sem CNPJ/CPF
 * usa o CÓDIGO do cliente como chave ('COD' + código), igual ao
 * uploadArquivoCliente e ao seed do contrato social. Toda a lógica fica DENTRO
 * do callback do routerAdd (o pool de VMs do PocketBase não enxerga declarações
 * top-level de outros callbacks).
 */

routerAdd(
  'POST',
  '/backend/v1/analise-gravar-relatorio',
  (e) => {
    const body = e.requestInfo().body

    const clienteCodigo = Number(body.clienteCodigo || 0)
    const docLimpo = String(body.clienteDoc || '').replace(/\D/g, '')
    const nomeArquivo = String(body.nomeArquivo || '').trim()
    const titulo = String(body.titulo || '').trim() || nomeArquivo
    const observacao = String(body.observacao || '').trim()
    const pdfBase64 = String(body.pdfBase64 || '').replace(/\s+/g, '')

    if (!clienteCodigo || !nomeArquivo || !pdfBase64) {
      return e.json(400, {
        ok: false,
        erro: 'clienteCodigo, nomeArquivo e pdfBase64 são obrigatórios',
      })
    }
    if (!/^[A-Za-z0-9+/=]+$/.test(pdfBase64)) {
      return e.json(400, { ok: false, erro: 'pdfBase64 inválido' })
    }
    if (!/^[A-Za-z0-9 ._-]+\.pdf$/i.test(nomeArquivo)) {
      return e.json(400, { ok: false, erro: 'nomeArquivo inválido' })
    }

    const chaveVinculo = docLimpo || 'COD' + clienteCodigo

    try {
      // ── Idempotência: já existe este relatório gravado para o cliente? ──
      let jaExiste = false
      try {
        $app.findFirstRecordByFilter(
          'cliente_arquivos',
          'cliente_cnpj = {:chave} && titulo = {:t}',
          { chave: chaveVinculo, t: titulo },
        )
        jaExiste = true
      } catch (_) {
        jaExiste = false
      }
      if (jaExiste) {
        return e.json(200, { ok: true, jaExistia: true })
      }

      const bytes = $filesystem.base64ToBytes(pdfBase64)
      if (!bytes || bytes.length === 0) {
        return e.json(400, { ok: false, erro: 'pdfBase64 não decodificou' })
      }

      const rec = new Record($app.findCollectionByNameOrId('cliente_arquivos'))
      rec.set('cliente_cnpj', chaveVinculo)
      rec.set('cliente_codigo', clienteCodigo)
      rec.set('titulo', titulo)
      rec.set('categoria', 'Análise Empresarial')
      rec.set('arquivo', $filesystem.fileFromBytes(bytes, nomeArquivo))
      rec.set('nome_original', nomeArquivo)
      rec.set('tamanho_bytes', bytes.length)
      rec.set('tipo_mime', 'application/pdf')
      rec.set('observacao', observacao || 'Relatório gerado pelo módulo de Análises Empresariais')
      rec.set('enviado_por', 'ADECONT — Análises Empresariais (auto)')
      $app.save(rec)

      return e.json(200, { ok: true, id: rec.id, gravado: true })
    } catch (err) {
      console.log('[analise-gravar-relatorio] Erro: ' + String(err))
      return e.json(200, { ok: false, erro: String(err) })
    }
  },
  null,
  null,
)
