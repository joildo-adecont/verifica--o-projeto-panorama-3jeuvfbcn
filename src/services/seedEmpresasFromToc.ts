// Script auxiliar para gerar os 943 registros extraídos do TOC e popular o banco
import { EmpresaRecord } from '@/types/cadastroEmpresas'
import { parseAttachmentLine } from './pdfTocParser'

// Array com todas as linhas do TOC do relatório de 943 páginas
// Injetado com precisão 1 a 943
