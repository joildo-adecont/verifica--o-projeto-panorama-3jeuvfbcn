// Parser do TOC de anexos do PDF "Empresas completo-255b6.pdf"
import { EmpresaRecord } from '@/types/cadastroEmpresas';

export function parseAttachmentLine(pageNumber: number, lineText: string): EmpresaRecord {
  // Exemplo de formato:
  // "C.N.P.J.: 04.094.690/0001-46 ADECONT PROCESSAMENTO DE DADOS LTDAEmpresa: Página: Emissão: Hora: 14:36 05/11/2026 1/943 EMPRESAS DADOS CADASTRAIS Código: 1 Data da inscrição: 03/..."
  // Ou:
  // "C.E.I.: 500026108484 ADILAR RODRIGUES FERREIRAEmpresa: Página: Emissão: Hora: 14:36 05/11/2026 4/943 EMPRESAS DADOS CADASTRAIS Código: 4 Data da inscrição: Apelido: ADILAR Insc...."
  
  let tipoDoc = '';
  let numDoc = '';
  
  if (lineText.startsWith('C.N.P.J.:')) {
    tipoDoc = 'CNPJ';
  } else if (lineText.startsWith('C.P.F.:')) {
    tipoDoc = 'CPF';
  } else if (lineText.startsWith('C.E.I.:')) {
    tipoDoc = 'CEI';
  } else if (lineText.startsWith('C.A.E.P.F.:')) {
    tipoDoc = 'CAEPF';
  }

  // Extrai código
  let codigo = pageNumber;
  const codMatch = lineText.match(/Código:\s*(\d+)/i);
  if (codMatch) {
    codigo = parseInt(codMatch[1], 10);
  }

  // Extrai data de inscrição
  let dataInscricao = '';
  const dataMatch = lineText.match(/Data da inscrição:\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (dataMatch) {
    dataInscricao = dataMatch[1];
  }

  // Extrai apelido
  let apelido = '';
  const apelidoMatch = lineText.match(/Apelido:\s*([^ \n]+(?:\s+[^ \n]+)*?)(?=\s+(?:Insc\.|Nome:|Data|Código|Página|$))/i);
  if (apelidoMatch) {
    apelido = apelidoMatch[1].replace(/Insc\..*$/, '').trim();
  }

  // Extrai documento e razão social da parte inicial antes de "Empresa:"
  let razaoSocial = '';
  const preEmpresa = lineText.split('Empresa:')[0] || '';
  
  // Ex: "C.N.P.J.: 04.094.690/0001-46 ADECONT PROCESSAMENTO DE DADOS LTDA"
  // Ex: "C.P.F.: 657.902.000-87 ADRIANE VIEIRA MACCARONI"
  // Ex: "C.N.P.J.: PROSORRIR PLANOS ODONTOLÓGICOS LTDA"
  // Ex: "C.N.P.J.: . . / - JD COMERCIO DE MAQUINAS..."
  // Ex: "C.P.F.: . . - EMPREGADAS DOMESTICAS"
  
  if (tipoDoc) {
    const afterPrefix = preEmpresa.replace(/^C\.[A-Z.]+:?\s*/i, '').trim();
    // Verifica se inicia com documento numérico ou com pontos/hífen
    const docStartMatch = afterPrefix.match(/^([0-9.\-\/]+|\.\s*\.\s*[\/-]?)\s+(.*)$/);
    if (docStartMatch) {
      numDoc = docStartMatch[1].trim();
      razaoSocial = docStartMatch[2].trim();
    } else {
      // Documento vazio antes do nome! Ex: "C.N.P.J.: PROSORRIR..."
      numDoc = '';
      razaoSocial = afterPrefix.trim();
    }
  } else {
    razaoSocial = preEmpresa.trim();
  }

  // Se o número for placeholder malformado vazio
  if (numDoc === '. . / -' || numDoc === '. . -' || numDoc === '..' || numDoc === '.') {
    numDoc = '';
  }

  const docLimpo = numDoc.replace(/\D/g, '');

  return {
    codigo,
    tipo_documento: tipoDoc,
    numero_documento: numDoc,
    documento_limpo: docLimpo,
    razao_social: razaoSocial || `EMPRESA ${codigo}`,
    apelido,
    data_inscricao: dataInscricao,
    inscricao_estadual: '',
    inscricao_suframa: '',
    pagina: pageNumber
  };
}
