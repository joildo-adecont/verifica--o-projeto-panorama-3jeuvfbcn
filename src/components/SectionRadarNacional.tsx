import { useMemo, useState } from 'react'
import {
  Globe2,
  Building2,
  Landmark,
  Search,
  X,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Radar,
  MapPin,
  ShieldAlert,
} from 'lucide-react'
import { RadarNacional } from './RadarNacional'

/**
 * SEÇÃO 19 — RADAR NACIONAL: FEDERAL, ESTADUAL E MUNICIPAL
 * ========================================================
 * Pedido do CEO (31/10/2026): replicar o radar dos diários oficiais nos estados e
 * municípios, para ter as atualizações legislativas nos três níveis e confrontá-las
 * com a Lefisc e com os órgãos oficiais de cada ente.
 *
 * HIERARQUIA DAS FONTES POR NÍVEL — regra escrita na tela, não só no código:
 *   FEDERAL   → o DOU é a fonte mestra; a Lefisc é radar, e o DOU corrige e prevalece.
 *   ESTADUAL  → o diário oficial do estado é a fonte primária do ato estadual.
 *   MUNICIPAL → o diário oficial do município é a fonte primária do ato municipal.
 * Em cada nível, quem PUBLICA confirma; o agregador apenas localiza. Esta é a mesma
 * regra que o CEO fixou para o DOU, aplicada a cada esfera.
 *
 * DE ONDE VÊM OS NÚMEROS: da varredura real de 31/10/2026 nas 22 instâncias do
 * SIGPub (diariomunicipal.com.br). Nada é estimado na tela: quando um dado não foi
 * medido, a tela diz que não foi medido.
 */

const DADOS = {
  gerado: '2026-10-31',
  periodo: {
    inicio: '2026-10-01',
    fim: '2026-10-31',
  },
  consultas: 88,
  associacoes: 22,
  entes: 2823,
  porUf: {
    PR: 48,
    RN: 38,
    RO: 35,
    RS: 29,
    MG: 26,
    PA: 21,
    PE: 19,
    AL: 9,
    CE: 7,
    AM: 5,
    PB: 3,
    RJ: 3,
    SP: 1,
    GO: 1,
  },
  achados: [
    {
      uf: 'AL',
      titulo:
        '.****-05 Manu Martins - Zezo Alagoano Agreste 81,33 X 0,00 81,33 127 6553 IBS PRODUÇÕES LTDA 63.529.727',
      url: 'https://diario.imprensaoficial.al.gov.br',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'AL',
      titulo:
        '/ CGIBS . As despesas decorrentes da presente portaria correrão através do Programa de Trabalho … / CGIBS . As despesas decorrentes da presente portaria correrã',
      url: 'https://diario.imprensaoficial.al.gov.br',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'AL',
      titulo:
        '227/2026. 4 Resolução CGIBS nº 6/2026, alterada pela ResoluçãoCGIBS nº 13/2026 (Regulamento do IBS ). 5 … IBS , CBS e Imposto Seletivo. 6 Princípio dodestino. 7',
      url: 'https://diario.imprensaoficial.al.gov.br',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'AL',
      titulo:
        ': Brasília/DF OBJETIVO: Para participar de agendas presenciais do CGIBS , incluindo reunião da Comissão',
      url: 'https://diario.imprensaoficial.al.gov.br',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'AL',
      titulo:
        'Diretorias do CGIBS . As despesas decorrentes da presente portaria correrão através do Programa de … Comitê Gestor do Imposto sobre Bens e Serviços - CGIBS . As',
      url: 'https://diario.imprensaoficial.al.gov.br',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'AL',
      titulo: 'EXTRATO DE PUBLICAÇÃO DO TERMO DE CONTRATO Nº 32520/2026',
      url: 'https://www.diariomunicipal.com.br/ama/materia/19E1A4A3',
      assoc: 'ama',
      nivel: 'municipal',
    },
    {
      uf: 'AL',
      titulo:
        'IBS, CBS e Imposto Seletivo. 6 Princípio dodestino. 7 Incidência, nãoincidência, imunidades, fato … arrecadação do IBS. 16 Regras de transição do IBS, CBS e ICM',
      url: 'https://diario.imprensaoficial.al.gov.br',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'AL',
      titulo:
        'Imposto sobre Bens e Serviços - CGIBS . As despesas decorrentes da presente portaria correrão através do',
      url: 'https://diario.imprensaoficial.al.gov.br',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'AL',
      titulo: 'LEI MUNICIPAL N.º 398, DE 20 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/ama/materia/B1A73F9A',
      assoc: 'ama',
      nivel: 'municipal',
    },
    {
      uf: 'AL',
      titulo: 'LEI Nº 2.147, DE 21 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/ama/materia/8F82596C',
      assoc: 'ama',
      nivel: 'municipal',
    },
    {
      uf: 'AL',
      titulo: 'LEI Nº 2.152 DE 21 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/ama/materia/0E4DA3A0',
      assoc: 'ama',
      nivel: 'municipal',
    },
    {
      uf: 'AL',
      titulo: 'LEI Nº 421, DE 14 DE SETEMBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/ama/materia/3CB650AC',
      assoc: 'ama',
      nivel: 'municipal',
    },
    {
      uf: 'AL',
      titulo: 'LEI Nº. 855, DE 08 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/ama/materia/40E319CF',
      assoc: 'ama',
      nivel: 'municipal',
    },
    {
      uf: 'AL',
      titulo: 'PORTARIA Nº 201/2026, DE 22 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/ama/materia/8926EC2E',
      assoc: 'ama',
      nivel: 'municipal',
    },
    {
      uf: 'AL',
      titulo: 'PORTARIA Nº 202/2026, DE 22 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/ama/materia/4AD33724',
      assoc: 'ama',
      nivel: 'municipal',
    },
    {
      uf: 'AL',
      titulo: 'PORTARIA Nº 203/2026, DE 22 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/ama/materia/39E0C3B0',
      assoc: 'ama',
      nivel: 'municipal',
    },
    {
      uf: 'AL',
      titulo:
        'REPRESENTANTE DO ESTADO DE ALAGOAS NO CONSELHO SUPEIOR, ÓRGÃO MÁXIMO DO COMITÊ GESTOR DO IBS , no uso … Superior do Comitê Gestor do IBS - CG- IBS , sem prejuíz',
      url: 'https://diario.imprensaoficial.al.gov.br',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'AL',
      titulo:
        'da Reforma Tributária nos contratos administrativos, e dá outras providências. A Procuradora-Geral do … Emenda Constitucional nº 132, de 20 de dezembro de 2023,',
      url: 'https://diario.imprensaoficial.al.gov.br',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'AL',
      titulo:
        'do CGIBS . As despesas decorrentes da presente portaria correrão através do Programa de Trabalho',
      url: 'https://diario.imprensaoficial.al.gov.br',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'AL',
      titulo:
        'do CGIBS . As despesas decorrentes da presente portaria correrão através do Programa de Trabalho',
      url: 'https://diario.imprensaoficial.al.gov.br',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'AL',
      titulo:
        'participar da Reunião Estratégica de Integração do Plano Conjunto de Implantação Gradual (PCIG) do CGIBS . As',
      url: 'https://diario.imprensaoficial.al.gov.br',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'AL',
      titulo:
        'sobre Bens e Serviços ( CGIBS ). As despesas decorrentes da presente portaria correrão através do',
      url: 'https://diario.imprensaoficial.al.gov.br',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'AL',
      titulo:
        '“Soluções de Intercâmbio de Informações entre RFB e CGIBS , bem como, do Workshop de Deinição da MD … participar da Reunião Presencial de Integração da Diretori',
      url: 'https://diario.imprensaoficial.al.gov.br',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'AM',
      titulo: 'LEI COMPLEMENTAR Nº 367/2026 GPM-SAI, DE 01 DE JULHO DE 2026',
      url: 'https://www.diariomunicipal.com.br/aam/materia/ECE4399C',
      assoc: 'aam',
      nivel: 'municipal',
    },
    {
      uf: 'AM',
      titulo: 'LEI MUNICIPAL Nº 472/2026 DE 16 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/aam/materia/72D3A341',
      assoc: 'aam',
      nivel: 'municipal',
    },
    {
      uf: 'AM',
      titulo: 'LEI Nº 652, DE 26 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/aam/materia/DEE6438E',
      assoc: 'aam',
      nivel: 'municipal',
    },
    {
      uf: 'AM',
      titulo: 'RESOLUÇÃO Nº 003/2005',
      url: 'https://www.diariomunicipal.com.br/aam/materia/6B8647FF',
      assoc: 'aam',
      nivel: 'municipal',
    },
    {
      uf: 'AM',
      titulo: 'TERMO DE CONTRATO Nº. 025/2026',
      url: 'https://www.diariomunicipal.com.br/aam/materia/CA316F82',
      assoc: 'aam',
      nivel: 'municipal',
    },
    {
      uf: 'CE',
      titulo: 'LEI COMPLEMENTAR Nº 1.697, DE 21 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/aprece/materia/674A9DE7',
      assoc: 'aprece',
      nivel: 'municipal',
    },
    {
      uf: 'CE',
      titulo: 'LEI MUNICIPAL N° 032/2009 DE 02 DE JULHO DE 2009.',
      url: 'https://www.diariomunicipal.com.br/aprece/materia/573DF99E',
      assoc: 'aprece',
      nivel: 'municipal',
    },
    {
      uf: 'CE',
      titulo: 'LEI MUNICIPAL Nº. 298/2019 DE 18 DE DEZEMBRO DE 2019.',
      url: 'https://www.diariomunicipal.com.br/aprece/materia/E200B897',
      assoc: 'aprece',
      nivel: 'municipal',
    },
    {
      uf: 'CE',
      titulo: 'LEI Nº 1.645, DE 15 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/aprece/materia/9BC14782',
      assoc: 'aprece',
      nivel: 'municipal',
    },
    {
      uf: 'CE',
      titulo: 'PORTARIA DE DIÁRIA Nº 260916.001/2026',
      url: 'https://www.diariomunicipal.com.br/aprece/materia/1D50B49C',
      assoc: 'aprece',
      nivel: 'municipal',
    },
    {
      uf: 'CE',
      titulo: 'PORTARIA Nº 019/2026/SMS.',
      url: 'https://www.diariomunicipal.com.br/aprece/materia/110E2EEE',
      assoc: 'aprece',
      nivel: 'municipal',
    },
    {
      uf: 'CE',
      titulo:
        'RESOLUÇÃO Nº 172/2024 COM REDAÇÃO ALTERADA PELA RESOLUÇÃO Nº 177/2025. DISPÕE SOBRE O REGIMENTO INTERNO DA CÂMARA MUNICIPAL DE MOMBAÇA-CE E DÁ OUTRAS PROVIDÊNCIAS.',
      url: 'https://www.diariomunicipal.com.br/aprece/materia/4C0F4F13',
      assoc: 'aprece',
      nivel: 'municipal',
    },
    {
      uf: 'ES',
      titulo:
        'DECRETO-R 00006356/2026 — Altera o Decreto 4.269-R, de 21 de junho de 2018, que regulamenta a Lei nº 10.824, de 6 de abril de 2018, que dispõe sobre o Programa ',
      url: 'https://conteudo.seg.es.gov.br/APINormas/AtoNormativo/14560206',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'GO',
      titulo: 'LEI 1690/2026',
      url: 'https://www.diariomunicipal.com.br/fgm/materia/7712DECD',
      assoc: 'fgm',
      nivel: 'municipal',
    },
    {
      uf: 'MG',
      titulo:
        '300 394,44 473,74 495,94 480,96 491,25 Prazos de execucao variaveis (*) O total com tributos (CBS, IBS e, quando houver, ISSQN) devera ser apresentado na tabela',
      url: 'https://www.jornalminasgerais.mg.gov.br/edicao-do-dia',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MG',
      titulo:
        'CO DIAMETRO SERVICO COMPLEMENTAR/ CARACTERISTICAS V ALOR SEM TRIBUTOS (R$) TOTAL COM TRIBUTOS CBS e IBS (R$) ** PRAZO EXECUCAO (dias uteis) 250 02 00 INSTALACAO',
      url: 'https://www.jornalminasgerais.mg.gov.br/edicao-do-dia',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MG',
      titulo:
        'CO DIAMETRO SERVICO COMPLEMENTAR/ CARACTERISTICAS V ALOR SEM TRIBUTOS (R$) TOTAL COM TRIBUTOS CBS e IBS (R$) *** PRAZO EXECUCAO (dias uteis) Parcelas (maximo) 1',
      url: 'https://www.jornalminasgerais.mg.gov.br/edicao-do-dia',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MG',
      titulo:
        'CO DIAMETRO SERVICO COMPLEMENTAR/ CARACTERISTICAS V ALOR SEM TRIBUTOS (R$) TOTAL COM TRIBUTOS CBS e IBS (R$) *** PRAZO EXECUCAO (dias uteis) Parcelas (maximo) 3',
      url: 'https://www.jornalminasgerais.mg.gov.br/edicao-do-dia',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MG',
      titulo:
        'CO DIAMETRO SERVICO COMPLEMENTAR/ CARACTERISTICAS V ALOR SEM TRIBUTOS (R$) TOTAL COM TRIBUTOS CBS e IBS (R$) **** PRAZO EXECUCAO (dias uteis) Parcelas (maximo) ',
      url: 'https://www.jornalminasgerais.mg.gov.br/edicao-do-dia',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MG',
      titulo:
        'CONTRATO ADMINISTRATIVO Nº 06/26, QUE CELEBRAM ENTRE SI A CÂMARA MUNICIPAL DE PATROCÍNIO E A EMPRESA VIRTUALIZA TECNOLOGIA DA INFORMAÇÃO LTDA EPP',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/C20CCDD0',
      assoc: 'amm-mg',
      nivel: 'municipal',
    },
    {
      uf: 'MG',
      titulo: 'DECRETO 2984',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/D9A2BC4E',
      assoc: 'amm-mg',
      nivel: 'municipal',
    },
    {
      uf: 'MG',
      titulo: 'DECRETO N.º 4.192/2026',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/128222D8',
      assoc: 'amm-mg',
      nivel: 'municipal',
    },
    {
      uf: 'MG',
      titulo: 'DECRETO Nº 0000068/2026',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/4143265F',
      assoc: 'amm-mg',
      nivel: 'municipal',
    },
    {
      uf: 'MG',
      titulo: 'DECRETO Nº 0000070/2026',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/40C4D48F',
      assoc: 'amm-mg',
      nivel: 'municipal',
    },
    {
      uf: 'MG',
      titulo: 'DECRETO Nº 160/2026 DE 03 DE AGOSTO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/F0DDFBEA',
      assoc: 'amm-mg',
      nivel: 'municipal',
    },
    {
      uf: 'MG',
      titulo: 'DECRETO Nº 17.633/26',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/CC49C4A6',
      assoc: 'amm-mg',
      nivel: 'municipal',
    },
    {
      uf: 'MG',
      titulo: 'DECRETO Nº 257/2026',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/77A662C1',
      assoc: 'amm-mg',
      nivel: 'municipal',
    },
    {
      uf: 'MG',
      titulo: 'DECRETO Nº 4.540 DE 29 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/16C3AA75',
      assoc: 'amm-mg',
      nivel: 'municipal',
    },
    {
      uf: 'MG',
      titulo: 'DECRETO Nº 4078/2026, DE 1 DE SETEMBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/0FE84246',
      assoc: 'amm-mg',
      nivel: 'municipal',
    },
    {
      uf: 'MG',
      titulo: 'DECRETO Nº 484, DE 30 DE SETEMBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/7B683D97',
      assoc: 'amm-mg',
      nivel: 'municipal',
    },
    {
      uf: 'MG',
      titulo: 'DECRETO Nº 563/2026',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/255596AE',
      assoc: 'amm-mg',
      nivel: 'municipal',
    },
    {
      uf: 'MG',
      titulo: 'DECRETO Nº 6.203, DE 15 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/BC74F18A',
      assoc: 'amm-mg',
      nivel: 'municipal',
    },
    {
      uf: 'MG',
      titulo: 'EXTRATO DE CONTRATO',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/E85826E7',
      assoc: 'amm-mg',
      nivel: 'municipal',
    },
    {
      uf: 'MG',
      titulo: 'EXTRATO DE RATIFICAÇÃO. DISPENSA Nº020/2026.',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/860E1B2D',
      assoc: 'amm-mg',
      nivel: 'municipal',
    },
    {
      uf: 'MG',
      titulo:
        'GO SERVICO SERVICO COMPLEMENTAR / CARACTERISTICAS V ALOR SEM TRIBUTOS (R$) TOTAL COM TRIBUTOS CBS e IBS (R$) * PRAZO EXECUCAO (dias uteis) 602 01 00 CONFIRMACAO',
      url: 'https://www.jornalminasgerais.mg.gov.br/edicao-do-dia',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MG',
      titulo: 'LEI COMPLEMENTAR N.º 245 DE 31 DE MARÇO DE 2025.',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/5C3FA54D',
      assoc: 'amm-mg',
      nivel: 'municipal',
    },
    {
      uf: 'MG',
      titulo: 'LEI COMPLEMENTAR Nº 073, DE 13 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/87416409',
      assoc: 'amm-mg',
      nivel: 'municipal',
    },
    {
      uf: 'MG',
      titulo: 'LEI COMPLEMENTAR Nº 261, 01 DE ABRIL DE 2026.',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/96328256',
      assoc: 'amm-mg',
      nivel: 'municipal',
    },
    {
      uf: 'MG',
      titulo: 'LEI MUNICIPAL Nº 2.830/2026',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/4597D1F6',
      assoc: 'amm-mg',
      nivel: 'municipal',
    },
    {
      uf: 'MG',
      titulo: 'LEI Nº 4.478/2026',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/8358DFC0',
      assoc: 'amm-mg',
      nivel: 'municipal',
    },
    {
      uf: 'MG',
      titulo: 'LEI Nº. 2.307, DE 29 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/66E076F3',
      assoc: 'amm-mg',
      nivel: 'municipal',
    },
    {
      uf: 'MG',
      titulo: 'LEI ORDINÁRIA MUNICIPAL N.º 3.699, DE 30 DE SETEMBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/9670F52C',
      assoc: 'amm-mg',
      nivel: 'municipal',
    },
    {
      uf: 'MG',
      titulo:
        'O DIAMETRO SERVICO COMPLEMENTAR / CARACTERISTICAS V ALOR SEM TRIBUTOS (R$) TOTAL COM TRIBUTOS CBS e IBS (R$) *** PRAZO EXECUCAO (dias uteis) 100 05 LIGACAO DE A',
      url: 'https://www.jornalminasgerais.mg.gov.br/edicao-do-dia',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MG',
      titulo:
        'O DIAMETRO SERVICO COMPLEMENTAR / CARACTERISTICAS V ALOR SEM TRIBUTOS (R$) TOTAL COM TRIBUTOS CBS e IBS (R$) *** PRAZO EXECUCAO (dias uteis) 101 05 LIGACAO DE A',
      url: 'https://www.jornalminasgerais.mg.gov.br/edicao-do-dia',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MG',
      titulo: 'PORTARIA Nº 020, DE 22 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/EC0609CA',
      assoc: 'amm-mg',
      nivel: 'municipal',
    },
    {
      uf: 'MG',
      titulo: 'PORTARIA Nº. 473, DE 26 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/C3B7FA4C',
      assoc: 'amm-mg',
      nivel: 'municipal',
    },
    {
      uf: 'MG',
      titulo:
        'PORTARIA-Nº-162-2026 - DISPÕE SOBRE A NOMEAÇÃO E CONTRATAÇÃO PARA EMPREGO PÚBLICO TEMPORÁRIO DE ASSISTENTE ADMINISTRATIVO',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/A717C36A',
      assoc: 'amm-mg',
      nivel: 'municipal',
    },
    {
      uf: 'MG',
      titulo:
        'PORTARIA-Nº-168-2026 - CONVOCA ADRIANA CORNÉLIA MONTEIRO FONSECA PARA OCUPAR CARGO DE AGENTE DE REFERÊNCIA TÉCNICA EM MEDICAMENTOS E CONGÊNERES DO PROGRAMA VISA-CIS',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/7AAD9906',
      assoc: 'amm-mg',
      nivel: 'municipal',
    },
    {
      uf: 'MG',
      titulo:
        'almente substituidos pela Contribuicao sobre Bens e Servicos CBS, e o Imposto sobre Bens e Servicos IBS tera sua implementacao iniciada gradualmente; CONSIDERAN',
      url: 'https://www.jornalminasgerais.mg.gov.br/edicao-do-dia',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MG',
      titulo:
        'dias uteis; 100% em ate 10 dias uteis, apos aprovacao da vistoria (***) O total com tributos (CBS, IBS e, quando houver, ISSQN) devera ser apresentado na tabela',
      url: 'https://www.jornalminasgerais.mg.gov.br/edicao-do-dia',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        '. § 2º O Fator X evidenciara as variacoes ocorridas entre a aplicacao da Reforma Tributaria , bem como',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/03/03/DO12089_03_03_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        '001275/2026 Assunto: Aquisicao de 5 (cinco) inscricoes no curso "Reforma Tributaria CBS, IBS e Imposto Seletivo … 0001-15, visando a aquisicao de 5 (cinco) insc',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/05/04/DO12144_04_05_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'Auditar a emissao das faturas de agua e esgoto e os aspectos relacionados a Tarifa Social e a Reforma Tributaria',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/08/07/DO12244_07_08_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'CONSULTORIA S/A; OBJETO: Participacao do empregado Xerxes Flamarion Sabino no curso Impactos da Reforma Tributaria',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/03/03/DO12089_03_03_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'Complementar Federal nº 214, de 16 de janeiro de 2025, que institui o Imposto sobre Bens e Servicos ( IBS … da carga tributaria efetiva suportada pela contratad',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/09/01/DO12267_01_09_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'Contribuicao sobre Bens e Servicos ( CBS ) Processo tributario judicial. Contencioso fiscal.',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/03/16/DO12100_16_03_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'DECISAO Processo SEI n. 33/001275/2026 Assunto: Aquisicao de 5 (cinco) inscricoes no curso " Reforma Tributaria … inscrita no CNPJ n. 11.128.083/0001-15, visand',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/05/04/DO12144_04_05_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'Em seus lugares, foram criados dois tributos: a Contribuicao sobre Bens e Servicos ( CBS ), de ambito federal',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/07/17/DO12225_17_07_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'Federal (Contribuicao sobre Bens e Servicos ("CBS")) e uma subnacional (Imposto sobre Bens e Servicos (" IBS … Embora a regulamentacao e institui- cao do Comite',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/01/20/DO12053_20_01_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'Foi criado tambem um Imposto Seletivo ("IS"), de competencia Federal, que incidira sobre a producao,',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/01/20/DO12053_20_01_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'Gestao Orcamentaria e Financeira no Setor Publico - O impacto no uso de novas tecnologias e Reforma Tributaria',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/07/08/DO12215_08_07_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'Gestao Orcamentaria e Financeira no Setor Publico - O impacto no uso de novas tecnologias e Reforma Tributaria',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/06/10/DO12180_10_06_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo: 'Imposto sobre Bens e Servicos ( IBS ). Imposto Sobre Servico (ISS).',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/03/16/DO12100_16_03_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'Inexigibilidade, conforme justificativa no processo de Pagamento de 03 (tres) inscricoes no curso " Reforma Tributaria',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/08/12/DO12247_12_08_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'MARKETING EIRELI OBJETO: Valor que se empenha para aquisicao de Pacote de 03 inscricoes no curso Reforma Tributaria',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/05/04/DO12144_04_05_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'Melhoria Os Estados devem indicar suas estimativas de arrecadacao do Imposto sobre Bens e Servicos ( IBS … Tributaria nas receitas tributarias do Estado, os efe',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/07/17/DO12225_17_07_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'O novo sistema composto por dois tributos ( IBS e CBS) sucedera cinco tributos atuais (PIS, COFINS, ICMS … e operacionalizou os novos tributos sobre o consumo, ',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/04/15/DO12128_15_04_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'O novo sistema composto por dois tributos (IBS e CBS ) sucedera cinco tributos atuais (PIS, COFINS, ICMS … consumo, notadamente o Imposto sobre Bens e Servicos ',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/04/15/DO12128_15_04_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'OBJETO: Valor que se empenha para aquisicao de Pacote de 03 inscricoes no curso Reforma Tributaria Cbs, Ibs',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/05/04/DO12144_04_05_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'Processo SEI n. 33/001275/2026 Assunto: Aquisicao de 5 (cinco) inscricoes no curso "Reforma Tributaria CBS … CNPJ n. 11.128.083/0001-15, visando a aquisicao de ',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/05/04/DO12144_04_05_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'SEI n. 33/001275/2026 Assunto: Aquisicao de 5 (cinco) inscricoes no curso "Reforma Tributaria CBS, IBS … 11.128.083/0001-15, visando a aquisicao de 5 (cinco) in',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/05/04/DO12144_04_05_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'Tributacao conforme solicitacao; g)Reformulacao e adequacao do Codigo Tribunal Municipal a reforma tributaria',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/09/16/DO12280_16_09_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'Tributacao conforme solicitacao; g)Reformulacao e adequacao do Codigo Tribunal Municipal a reforma tributaria',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/03/24/DO12108_24_03_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'autenticidade deste documento pode ser verificada no endereco www.diariooficial.ms.gov.br Reforma Tributaria … Relativamente as estimativas dos efeitos da Refor',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/07/17/DO12225_17_07_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'de 2025, que institui o Imposto sobre Bens e Servicos (IBS), a Contribuicao sobre Bens e Servicos ( CBS … tributaria efetiva suportada pela contratada em decorr',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/09/01/DO12267_01_09_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'dezembro de 2023, foi promulgada a Emenda Cons- titucional nº 132 ("EC nº 132"), que estabelece a Reforma Tributaria',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/01/20/DO12053_20_01_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'empresa de pequeno porte e ao produtor rural de pequeno porte; XII - Imposto sobre Bens e Servicos ( IBS',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/07/17/DO12225_17_07_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'espera nao ser elegivel para aplicar os requisitos de divulgacao reduzidos. 3.16.Impactos da reforma tributaria … Reforma tributaria do consumo (LC 214/2025) A ',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/04/15/DO12128_15_04_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'financeira, relativa a competencia compartilhada para administrar o Imposto sobre Bens e Servicos ( IBS',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/07/13/DO12219_13_07_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'institui o Imposto sobre Bens e Servicos (IBS), a Contribuicao sobre Bens e Servicos (CBS) e o Imposto Seletivo',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/09/01/DO12267_01_09_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'modalidade on-line e 100% ao vivo, para participacao dos servidores da CCONT/SES no curso " Reforma Tributaria',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/08/13/DO12249_13_08_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'notadamente o Imposto sobre Bens e Servicos (IBS), a Contribuicao sobre Bens e Servicos (CBS) e o Imposto Seletivo … Vigencia gradual a partir de 2027 com imple',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/04/15/DO12128_15_04_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'participacao de Procuradores e servidores da Procuradoria-Geral do Estado no curso "Entendendo a Reforma Tributaria',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/01/09/DO12043_09_01_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'referente a Tarifa Social Residencial; variacoes financeiras efetivas, relacionadas a aplicacao da Reforma Tributaria',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/03/03/DO12089_03_03_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'se empenha para aquisicao de Pacote de 03 inscricoes no curso Reforma Tributaria Cbs, Ibs e Imposto Seletivo',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/05/04/DO12144_04_05_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'MS',
      titulo:
        'uma proposta de Zona Franca Lista de Espera 51 181,5 2,88 Lais Fernanda de Azevedo Silva A reforma tributaria',
      url: 'https://assets.imprensaoficial.ms.gov.br/public/prd/Diario%20Oficial/2026/07/09/DO12217_09_07_2026.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PA',
      titulo: 'DECRETO Nº 1070, DE 19 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famep/materia/78B0317B',
      assoc: 'famep',
      nivel: 'municipal',
    },
    {
      uf: 'PA',
      titulo: 'DECRETO Nº 146/2026',
      url: 'https://www.diariomunicipal.com.br/famep/materia/11B726B9',
      assoc: 'famep',
      nivel: 'municipal',
    },
    {
      uf: 'PA',
      titulo: 'EXTRATO DE CONTRATO',
      url: 'https://www.diariomunicipal.com.br/famep/materia/56F55AF6',
      assoc: 'famep',
      nivel: 'municipal',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA 700.2026 - GPM.PD - LINDOMAR RODRIGUES DA ROCHA - DIÁRIA DE VIAGEM',
      url: 'https://www.diariomunicipal.com.br/famep/materia/17790117',
      assoc: 'famep',
      nivel: 'municipal',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA 780/2026 – GP',
      url: 'https://www.diariomunicipal.com.br/famep/materia/3C5241E3',
      assoc: 'famep',
      nivel: 'municipal',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA 781/2026 – GP',
      url: 'https://www.diariomunicipal.com.br/famep/materia/257D9D16',
      assoc: 'famep',
      nivel: 'municipal',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA DE VIAGEM Nº 359/2026 - IRRUAN SOUZA GUIMARAES',
      url: 'https://www.diariomunicipal.com.br/famep/materia/88DED2CB',
      assoc: 'famep',
      nivel: 'municipal',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA DE VIAGEM Nº 360/2026 - ARLETE OLIVEIRA SANTOS',
      url: 'https://www.diariomunicipal.com.br/famep/materia/4EF665B7',
      assoc: 'famep',
      nivel: 'municipal',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA N. º 1631/2026.',
      url: 'https://www.diariomunicipal.com.br/famep/materia/E390220B',
      assoc: 'famep',
      nivel: 'municipal',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA N. º 1632/2026.',
      url: 'https://www.diariomunicipal.com.br/famep/materia/EFC38849',
      assoc: 'famep',
      nivel: 'municipal',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA N. º 1644 DE 29 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famep/materia/ADCFE74D',
      assoc: 'famep',
      nivel: 'municipal',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA N. º 1645 DE 29 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famep/materia/F54884CE',
      assoc: 'famep',
      nivel: 'municipal',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA N. º 1646 DE 29 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famep/materia/36B5497B',
      assoc: 'famep',
      nivel: 'municipal',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA N. º 1649 DE 29 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famep/materia/A5CBB622',
      assoc: 'famep',
      nivel: 'municipal',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA N. º 1650 DE 29 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famep/materia/36FA4D1A',
      assoc: 'famep',
      nivel: 'municipal',
    },
    {
      uf: 'PA',
      titulo:
        'PORTARIA Nº 2.544/2026, DE 16 DE OUTUBRO DE 2026. DISPÕE SOBRE A CONCESSÃO DE DIÁRIAS A SERVIDOR.',
      url: 'https://www.diariomunicipal.com.br/famep/materia/3B031122',
      assoc: 'famep',
      nivel: 'municipal',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA Nº 279/2026',
      url: 'https://www.diariomunicipal.com.br/famep/materia/A385FEFE',
      assoc: 'famep',
      nivel: 'municipal',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA Nº 280/2026',
      url: 'https://www.diariomunicipal.com.br/famep/materia/7E5EC4F2',
      assoc: 'famep',
      nivel: 'municipal',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA Nº 281/2026',
      url: 'https://www.diariomunicipal.com.br/famep/materia/76CB958A',
      assoc: 'famep',
      nivel: 'municipal',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA Nº 282/2026',
      url: 'https://www.diariomunicipal.com.br/famep/materia/A784E450',
      assoc: 'famep',
      nivel: 'municipal',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA Nº 283/2026',
      url: 'https://www.diariomunicipal.com.br/famep/materia/B784F695',
      assoc: 'famep',
      nivel: 'municipal',
    },
    {
      uf: 'PB',
      titulo: 'CONTRATO/SEDUC Nº 0001/2026',
      url: 'https://www.diariomunicipal.com.br/famup/materia/3952C943',
      assoc: 'famup',
      nivel: 'municipal',
    },
    {
      uf: 'PB',
      titulo: 'DECRETO Nº 0581 2026 EM, 30 DE SETEMBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famup/materia/5E41513E',
      assoc: 'famup',
      nivel: 'municipal',
    },
    {
      uf: 'PB',
      titulo: 'EXTRATO DE CONTRATO - 00028/2026',
      url: 'https://www.diariomunicipal.com.br/famup/materia/44F1A207',
      assoc: 'famup',
      nivel: 'municipal',
    },
    {
      uf: 'PE',
      titulo: 'AMUTTE DECRETO Nº 044',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/EA0E34D6',
      assoc: 'amupe',
      nivel: 'municipal',
    },
    {
      uf: 'PE',
      titulo: 'DECRETO Nº 106 DE 30 DE SETEMBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/F5B60834',
      assoc: 'amupe',
      nivel: 'municipal',
    },
    {
      uf: 'PE',
      titulo: 'DECRETO Nº 19 , DE 04 DE MAIO DE 2026 - LEI N.4012',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/25192E27',
      assoc: 'amupe',
      nivel: 'municipal',
    },
    {
      uf: 'PE',
      titulo: 'DECRETO Nº 39 , DE 01 DE SETEMBRO DE 2026 - LEI N.4012',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/ED34CC93',
      assoc: 'amupe',
      nivel: 'municipal',
    },
    {
      uf: 'PE',
      titulo: 'DECRETO Nº 91 , DE 25 DE SETEMBRO DE 2026 - LEI N.915',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/D0BFE611',
      assoc: 'amupe',
      nivel: 'municipal',
    },
    {
      uf: 'PE',
      titulo: 'DECRETO Nº76',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/A5DFC8AB',
      assoc: 'amupe',
      nivel: 'municipal',
    },
    {
      uf: 'PE',
      titulo:
        'EXTRATO DE CONTRATO Nº 049/2026 PROCESSO ADMINISTRATIVO Nº 063/2026 INEXIGIBILIDADE DE LICITAÇÃO Nº 008/2026',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/40566D9C',
      assoc: 'amupe',
      nivel: 'municipal',
    },
    {
      uf: 'PE',
      titulo: 'EXTRATO DE CONTRATO Nº 061/2026 – PMVL',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/FBFC9365',
      assoc: 'amupe',
      nivel: 'municipal',
    },
    {
      uf: 'PE',
      titulo: 'EXTRATO DE CONTRATO PMG/SECFIN Nº 510/2026',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/A34122B4',
      assoc: 'amupe',
      nivel: 'municipal',
    },
    {
      uf: 'PE',
      titulo: 'INSTRUÇÃO NORMATIVA CABOPREV Nº 01, DE 26 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/56535941',
      assoc: 'amupe',
      nivel: 'municipal',
    },
    {
      uf: 'PE',
      titulo: 'LEI 3.053/2026',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/2AB7DF34',
      assoc: 'amupe',
      nivel: 'municipal',
    },
    {
      uf: 'PE',
      titulo: 'LEI MUNICIPAL Nº 1.281, DE 20 AGOSTO DE 2026',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/2A57620A',
      assoc: 'amupe',
      nivel: 'municipal',
    },
    {
      uf: 'PE',
      titulo:
        'LEI MUNICIPAL Nº 859/2026 EMENTA: ESTABELECE AS DIRETRIZES ORÇAMENTÁRIAS PARA O EXERCÍCIO DE 2027 E DÁ OUTRAS PROVIDÊNCIAS.',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/5D21A5EC',
      assoc: 'amupe',
      nivel: 'municipal',
    },
    {
      uf: 'PE',
      titulo: 'LEI MUNICIPAL Nº 866/2026',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/DFB43BC7',
      assoc: 'amupe',
      nivel: 'municipal',
    },
    {
      uf: 'PE',
      titulo: 'LEI Nº 026, DE 28 DE SETEMBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/71083B63',
      assoc: 'amupe',
      nivel: 'municipal',
    },
    {
      uf: 'PE',
      titulo: 'LEI Nº 1.962, DE 06 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/08115567',
      assoc: 'amupe',
      nivel: 'municipal',
    },
    {
      uf: 'PE',
      titulo: 'LEI ORDINÁRIA Nº 2.571/2026',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/0167DF95',
      assoc: 'amupe',
      nivel: 'municipal',
    },
    {
      uf: 'PE',
      titulo: 'LEI ORGÂNICA MUNICIPAL',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/B054C8C7',
      assoc: 'amupe',
      nivel: 'municipal',
    },
    {
      uf: 'PE',
      titulo: 'PORTARIA Nº 242/2026',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/F977AEC5',
      assoc: 'amupe',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo:
        '102 6ª FEIRA |23/OUT/2026 - EDIÇÃO N° 12.255 PODER EXECUTIVO ESTADUAL RESOLUÇÃO SEFA Nº 1016, DE 22 DE OUTUBRO DE 2026 Altera o Anexo V do Edital SEFA nº 01/202',
      url: 'https://www.dioe.pr.gov.br/ver/17401',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PR',
      titulo:
        '105 6ª FEIRA |23/OUT/2026 - EDIÇÃO N° 12.255 PODER EXECUTIVO ESTADUAL Curitiba, 21 de outubro de 2026. (Assinado Digitalmente) Nivaldo Ramos Diretor-Geral Secre',
      url: 'https://www.dioe.pr.gov.br/ver/17401',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PR',
      titulo:
        '120 2ª FEIRA |26/OUT/2026 - EDIÇÃO N° 12.256 PODER EXECUTIVO ESTADUAL SECRETARIA DE ESTADO DA FAZENDA RECEITA ESTADUAL DO PARANÁ CONTROLE DE AUTOS DE INFRAÇÃO C',
      url: 'https://www.dioe.pr.gov.br/ver/17404',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PR',
      titulo:
        '35 3ª FEIRA |27/OUT/2026 - EDIÇÃO N° 12.257 PODER EXECUTIVO ESTADUAL 3400 - 16/10/2026 - FERNANDA PAMELA MACHADO - (CCS) - CPF 085.XXX.XXX-47 - Rescindir, a ped',
      url: 'https://www.dioe.pr.gov.br/ver/17408',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PR',
      titulo:
        '36 3ª FEIRA |27/OUT/2026 - EDIÇÃO N° 12.257 PODER EXECUTIVO ESTADUAL 3451 - 23/10/2026 - WILMA APARECIDA SPINOSA - (CCA) - CPF 050. XXX.XXX-51 - Conceder, de ac',
      url: 'https://www.dioe.pr.gov.br/ver/17408',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PR',
      titulo:
        '37 6ª FEIRA |23/OUT/2026 - EDIÇÃO N° 12.255 PODER EXECUTIVO ESTADUAL Art. 3º Esta portaria passará a vigorar a partir da data da sua publicação. PUBLIQUE-SE, AN',
      url: 'https://www.dioe.pr.gov.br/ver/17401',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PR',
      titulo:
        '41 6ª FEIRA |23/OUT/2026 - EDIÇÃO N° 12.255 PODER EXECUTIVO ESTADUAL RESOLUÇÃO Nº 303/2026-SETI, DE 21 DE OUTUBRO DE 2026 Constitui comissão verificadora com vi',
      url: 'https://www.dioe.pr.gov.br/ver/17401',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PR',
      titulo:
        '45 6ª FEIRA |23/OUT/2026 - EDIÇÃO N° 12.255 PODER EXECUTIVO ESTADUAL aprovação no Estágio Probatório. TORNA PÚBLICO: O(s) Extrato(s) da(s) Portaria(s) R. emitid',
      url: 'https://www.dioe.pr.gov.br/ver/17401',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PR',
      titulo:
        '47 3ª FEIRA |27/OUT/2026 - EDIÇÃO N° 12.257 PODER EXECUTIVO ESTADUAL da Secretaria de Estado do Desenvolvimento Sustentável - SEDEST e do Instituto Água e Terra',
      url: 'https://www.dioe.pr.gov.br/ver/17408',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PR',
      titulo:
        '50 6ª FEIRA |23/OUT/2026 - EDIÇÃO N° 12.255 PODER EXECUTIVO ESTADUAL PORTARIA/GR N.° 354, de 21 de outubro de 2026 Autoriza o Prof. Antonio Stabelini Neto a par',
      url: 'https://www.dioe.pr.gov.br/ver/17401',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PR',
      titulo:
        '54 5º FEIRA |22/OUT/2026 - EDIÇÃO N° 12.254 PODER EXECUTIVO ESTADUAL SÚMULA DE CONCESSÃO DE RENOVAÇÃO DA LICENÇA POR ADESÃO E COMPROMISSO SÚMULA DE CONCESSÃO DE',
      url: 'https://www.dioe.pr.gov.br/ver/17396',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PR',
      titulo:
        '64 3ª FEIRA |27/OUT/2026 - EDIÇÃO N° 12.257 PODER EXECUTIVO ESTADUAL 31/12/2019, para o atendimento de crianças de 00 (zero) a 06 (seis) anos. § 3º Houve adequa',
      url: 'https://www.dioe.pr.gov.br/ver/17408',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PR',
      titulo:
        '65 3ª FEIRA |27/OUT/2026 - EDIÇÃO N° 12.257 PODER EXECUTIVO ESTADUAL Paraná e o funcionário Ediógenes Paes de Camargo, CPF N.º XXX.083.238-XX, LF 08, professor ',
      url: 'https://www.dioe.pr.gov.br/ver/17408',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PR',
      titulo:
        '66 2ª FEIRA |26/OUT/2026 - EDIÇÃO N° 12.256 PODER EXECUTIVO ESTADUAL execução de despesas tramitará no mesmo processo administrativo no qual se concedeu o adian',
      url: 'https://www.dioe.pr.gov.br/ver/17404',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PR',
      titulo:
        '66 5º FEIRA |22/OUT/2026 - EDIÇÃO N° 12.254 PODER EXECUTIVO ESTADUAL 38. Responder às solicitações da tutoria de formação no prazo máximo de 24 (vinte e quatro)',
      url: 'https://www.dioe.pr.gov.br/ver/17396',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PR',
      titulo:
        '68 2ª FEIRA |26/OUT/2026 - EDIÇÃO N° 12.256 PODER EXECUTIVO ESTADUAL Grossa; considerando o art. 4º da Lei n 9.663/91; TORNA PÚBLICO: O(s) Extrato(s) da(s) Port',
      url: 'https://www.dioe.pr.gov.br/ver/17404',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PR',
      titulo:
        '96 4ª FEIRA |28/OUT/2026 - EDIÇÃO N° 12.258 PODER EXECUTIVO ESTADUAL Art. 3º. Publique-se no Diário Oficial e no site oficial da Unespar. Campo Mourão, 26 de ou',
      url: 'https://www.dioe.pr.gov.br/ver/17412',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PR',
      titulo:
        '97 4ª FEIRA |28/OUT/2026 - EDIÇÃO N° 12.258 PODER EXECUTIVO ESTADUAL II. Assessoria: NOME N° CPF TITULAÇÃO LOCAL Denise Xavier Messias 775.XXX.XXX-53 Mestrado e',
      url: 'https://www.dioe.pr.gov.br/ver/17412',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PR',
      titulo:
        '98 4ª FEIRA |28/OUT/2026 - EDIÇÃO N° 12.258 PODER EXECUTIVO ESTADUAL Art. 2º Concede Ascensão de nível para a classe Adjunto B, em virtude da aprovação no Estág',
      url: 'https://www.dioe.pr.gov.br/ver/17412',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PR',
      titulo:
        '99 4ª FEIRA |28/OUT/2026 - EDIÇÃO N° 12.258 PODER EXECUTIVO ESTADUAL Ana Maria da Silva 03/11/2026 a 02/05/2027 Camila Schulz 24/11/2026 a 23/05/2027 Debora Ama',
      url: 'https://www.dioe.pr.gov.br/ver/17412',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PR',
      titulo:
        'ATA DA AUDIÊNCIA PÚBLICA PROJETO DE LEI DO EXECUTIVO Nº 69/2026 LEI ORÇAMENTÁRIA ANUAL – LOA 2027',
      url: 'https://www.diariomunicipal.com.br/amp/materia/23655A87',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'ATO DA MESA Nº. 48, DE 19 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/amp/materia/9D9C97E9',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'ATO DE CONCESSÃO DE DIÁRIA Nº 93/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/5CABF7BF',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'ATO DE CONCESSÃO DE DIÁRIA Nº 94/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/87F62604',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo:
        'COMISSÃO DE FINANÇAS E ORÇAMENTO PARECER Nº 27/2026 REFERÊNCIA: PROJETO DE LEI DO EXECUTIVO Nº 69/2026 ASSUNTO: LEI ORÇAMENTÁRIA ANUAL – LOA PARA O EXERCÍCIO FINANCEIRO DE 2027',
      url: 'https://www.diariomunicipal.com.br/amp/materia/F78CEA6C',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'DECRETO 293',
      url: 'https://www.diariomunicipal.com.br/amp/materia/72E7EB07',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'DECRETO N° 4732/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/33E12FD6',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'DECRETO N° 902/2026 - CRÉDITO ADICIONAL SUPLEMENTAR',
      url: 'https://www.diariomunicipal.com.br/amp/materia/DA347B1E',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'DECRETO Nº 11983, DE 26 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/4F28E4F6',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'DECRETO Nº 11989, DE 28 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/4A86F8F7',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'DECRETO Nº 130 DE 30 DE SETEMRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/20120870',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'DECRETO Nº 138 DE 19 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/2459EAFA',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo:
        'DECRETO Nº 19.659, DE 21 DE OUTUBRO DE 2026 - DISPÕE SOBRE A INSTITUIÇÃO DE COMISSÃO MUNICIPAL DE ACOMPANHAMENTO DA IMPLEMENTAÇÃO DA REFORMA TRIBUTÁRIA, DECORRENTE DA EMENDA CONSTITUCIONAL Nº 132, DE 20 DE DEZEMBRO DE 2023, NO ÂMBITO DO MUNICÍPIO',
      url: 'https://www.diariomunicipal.com.br/amp/materia/877F9305',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'DECRETO Nº 1986/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/27601298',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'DECRETO Nº 298/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/4F6D185A',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'DECRETO Nº 30001, DE 21 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/A168C1D9',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'DECRETO Nº 314/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/AB00950C',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'DECRETO Nº 4.486/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/05379EB1',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo:
        'DECRETO Nº 510/2026 - DISPÕE SOBRE A SUSPENSÃO TEMPORÁRIA DO RECEBIMENTO DE PROTOCOLOS RELATIVOS A PROCESSOS DA CONSTRUÇÃO CIVIL NO ÂMBITO DO MUNICÍPIO',
      url: 'https://www.diariomunicipal.com.br/amp/materia/81D5A539',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'DECRETO Nº 5326/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/908B7B9C',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'DECRETO Nº 8.833/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/8439FBBC',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'DECRETO Nº.371/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/C79EB6F8',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'DIRETORIA ESPECIAL DE COMPRAS - CONTRATO Nº 196/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/698FD29C',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'ERRATA - DECRETO N° 4732/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/3D2239A8',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'EXTRATO DE CONTRATO DE PRESTAÇÃO DE SERVIÇOS',
      url: 'https://www.diariomunicipal.com.br/amp/materia/76634665',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo:
        'EXTRATO DE DIÁRIA/INDENIZAÇÃO DE ALIMENTAÇÃO E/OU TRANSPORTE/ DESPESAS COM PASSAGENS TERRESTRES E AÉREAS N º 30/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/1E70577E',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo:
        'EXTRATO DE DIÁRIA/INDENIZAÇÃO DE ALIMENTAÇÃO E/OU TRANSPORTE/ DESPESAS COM PASSAGENS TERRESTRES E AÉREAS N º 31/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/3D529D88',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo:
        'EXTRATO DE DIÁRIA/INDENIZAÇÃO DE ALIMENTAÇÃO E/OU TRANSPORTE/ DESPESAS COM PASSAGENS TERRESTRES E AÉREAS N º 32/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/985607CD',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo:
        'LEI COMPLEMENTAR 034/2026 - DISPÕE S/ ORGANIZ DA ADM TRIBUT, CRIA O CARGO DE FISCAL DE TRIBUTOS MUNICIPAIS, ESTABELECE COMPETENCIAS ATRIBUIÇÕES E PRERROGATIVAS DA CARREIRA, EXTINGUE CARGOS DE FISCAL FAZENDÁRIO',
      url: 'https://www.diariomunicipal.com.br/amp/materia/0DC35FFD',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'LEI COMPLEMENTAR Nº 067/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/5EFB9666',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'LEI COMPLEMENTAR Nº 63/2026, DE 27 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/71C37196',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo:
        'LEI Nº 1.237/2026 DISPÕE SOBRE A LEI DE DIRETRIZES ORÇAMENTÁRIAS – LDO PARA O EXERCÍCIO FINANCEIRO DE 2027 DO MUNICÍPIO DE SÃO JORGE D’OESTE E DÁ OUTRAS PROVIDÊNCIAS.',
      url: 'https://www.diariomunicipal.com.br/amp/materia/27E473F9',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'LEI Nº 2.081/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/0C05FA82',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'LEI Nº 5.628/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/7A831F0E',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'LEI ORDINÁRIA N.º 1.063 DE 28 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/FA229E4B',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'LEI ORDINÁRIA Nº 2.841/2026.',
      url: 'https://www.diariomunicipal.com.br/amp/materia/57AF8FEC',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'LEI ORGÂNICA MUNICIPAL',
      url: 'https://www.diariomunicipal.com.br/amp/materia/CEC53923',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo:
        'MUNICÍPIO DE RANCHO ALEGRE D´OESTE – PARANÁ - ANEXO 2, DA LEI 4.320/64 – AGOSTO DE 2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/E1C30A9E',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo:
        'MUNICÍPIO DE RANCHO ALEGRE D´OESTE – PARANÁ - ANEXO 2, DA LEI 4.320/64 – JULHO DE 2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/C52620EF',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'PORTARIA Nº 219/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/1C20F7E6',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'PORTARIA Nº 831/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/F24D715C',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'PORTARIA Nº 951/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/01BEB6C4',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'REPUBLICADO POR INCORREÇÃO DECRETO Nº 5326/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/8F7FF373',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'RESOLUÇÃO 03/2026 CONSELHO MUNICIPAL DE EDUCAÇÃO DE TURVO/PR',
      url: 'https://www.diariomunicipal.com.br/amp/materia/6F9A0A59',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'RESOLUÇÃO CMS-DIR-PLE 045/2026 – 23/10/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/DFF3B6A4',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'RESOLUÇÃO N° 11/2026 – CMDCA',
      url: 'https://www.diariomunicipal.com.br/amp/materia/F158514D',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'RESOLUÇÃO Nº 001/2026.',
      url: 'https://www.diariomunicipal.com.br/amp/materia/7916913C',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'PR',
      titulo: 'RESOLUÇÃO ORCISPAR Nº 70, DE 28 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/amp/materia/A2EFFCFD',
      assoc: 'amp',
      nivel: 'municipal',
    },
    {
      uf: 'RJ',
      titulo:
        'DECRETO Nº 4.470 / 26 = PROCEDIMENTOS INTERNOS PARA FORMALIZAÇÃO DE DEMANDAS, CONTRATAÇÃO DE SERVIÇOS, AQUISIÇÃO DE BENS.',
      url: 'https://www.diariomunicipal.com.br/aemerj/materia/56DB903D',
      assoc: 'aemerj',
      nivel: 'municipal',
    },
    {
      uf: 'RJ',
      titulo: 'I - Ata',
      url: 'https://dadosabertos.rj.gov.br/dataset/804c280a-420f-4988-aa76-5a3198af07b0/resource/4964a469-3ea2-482c-b324-86abf3db1e3b/download/2026-01-27.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Ata',
      url: 'https://dadosabertos.rj.gov.br/dataset/efb4fda1-e822-434e-8502-3ccdd769c3b5/resource/d8b8aa53-6e1e-48d9-9bf3-80f4970a4b58/download/2026-04-14.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Ata',
      url: 'https://dadosabertos.rj.gov.br/dataset/e2ec3661-2a4c-4094-9365-eb8723dea3ab/resource/715e224e-376c-47b7-927e-d5adaf1ab374/download/2026-07-20.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Ata',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/b092c285-3e6a-46e2-90af-73f0e44507bd/download/2026-10-15.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Ato',
      url: 'https://dadosabertos.rj.gov.br/dataset/3da1770f-6876-40ab-9328-f2f150c649ba/resource/815824fa-df98-4678-b553-ea1d3e7931c8/download/2026-03-12.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Ato',
      url: 'https://dadosabertos.rj.gov.br/dataset/efb4fda1-e822-434e-8502-3ccdd769c3b5/resource/40241fdb-84d8-4140-9d5a-b4bc508fb07a/download/2026-04-10.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Ato',
      url: 'https://dadosabertos.rj.gov.br/dataset/b8424314-a495-4a93-b3ac-73ba0dd2bc62/resource/49d8e0fb-0ce3-4297-858b-f5d556fba4d8/download/2026-06-08.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Ato',
      url: 'https://dadosabertos.rj.gov.br/dataset/b8424314-a495-4a93-b3ac-73ba0dd2bc62/resource/ad5248ba-6835-4ef0-846e-b95b775b8770/download/2026-06-16.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Ato',
      url: 'https://dadosabertos.rj.gov.br/dataset/b8424314-a495-4a93-b3ac-73ba0dd2bc62/resource/a48046ce-e5a3-47cd-90dd-1e85b8a9091b/download/2026-06-30.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Ato',
      url: 'https://dadosabertos.rj.gov.br/dataset/e2ec3661-2a4c-4094-9365-eb8723dea3ab/resource/f7300c10-31d1-40ee-8001-20871f929a4c/download/2026-07-16.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Ato',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/3731b89d-ae5a-428b-9f7e-81d58ab21937/download/2026-08-19.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Ato',
      url: 'https://dadosabertos.rj.gov.br/dataset/49dd7d65-7ebb-4ddd-9cbf-e7616dbb1282/resource/458c8cc0-5931-425c-8a52-41603f4b84af/download/2026-09-11.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Ato',
      url: 'https://dadosabertos.rj.gov.br/dataset/49dd7d65-7ebb-4ddd-9cbf-e7616dbb1282/resource/781b9fe2-24b5-47ad-b4f1-dc10e9fcc893/download/2026-09-16.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Ato',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/96ed4702-ce8c-4f95-bd9c-27e9eaaeb1b6/download/2026-10-06.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Ato',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/f8a64d3b-6899-4492-8c09-44a951ebc4c6/download/2026-10-14.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Ato',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/a08fc829-3a44-43f9-aea3-11d11ff4cb08/download/2026-10-29.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Ato Pessoal',
      url: 'https://dadosabertos.rj.gov.br/dataset/b8424314-a495-4a93-b3ac-73ba0dd2bc62/resource/b274601f-397c-4f55-a1cc-769bd86f72b2/download/2026-06-01.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Aviso',
      url: 'https://dadosabertos.rj.gov.br/dataset/3da1770f-6876-40ab-9328-f2f150c649ba/resource/435c3c7e-c951-4bbc-8648-61526aaa486d/download/2026-03-17.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Aviso',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/9051f12f-471a-4e62-bec9-73af08912acd/download/2026-08-03.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Decreto Normativo',
      url: 'https://dadosabertos.rj.gov.br/dataset/804c280a-420f-4988-aa76-5a3198af07b0/resource/2b26a22e-53e5-4396-b006-d9ed3e6008c3/download/2026-01-15.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Decreto Normativo',
      url: 'https://dadosabertos.rj.gov.br/dataset/804c280a-420f-4988-aa76-5a3198af07b0/resource/5c2158de-3969-4f6d-a844-15d14243d270/download/2026-01-28.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Decreto Normativo',
      url: 'https://dadosabertos.rj.gov.br/dataset/3da1770f-6876-40ab-9328-f2f150c649ba/resource/a24eca32-ae0d-4bd6-9725-e8a1308301f6/download/2026-03-06.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Decreto Normativo',
      url: 'https://dadosabertos.rj.gov.br/dataset/3da1770f-6876-40ab-9328-f2f150c649ba/resource/e21223b1-f99a-4143-9cf5-2d4e29d06690/download/2026-03-11.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Decreto Normativo',
      url: 'https://dadosabertos.rj.gov.br/dataset/3da1770f-6876-40ab-9328-f2f150c649ba/resource/5c043d5f-03bd-4c5d-8dbe-4af25d49005b/download/2026-03-16.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Decreto Normativo',
      url: 'https://dadosabertos.rj.gov.br/dataset/3da1770f-6876-40ab-9328-f2f150c649ba/resource/435c3c7e-c951-4bbc-8648-61526aaa486d/download/2026-03-17.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Decreto Normativo',
      url: 'https://dadosabertos.rj.gov.br/dataset/efb4fda1-e822-434e-8502-3ccdd769c3b5/resource/16f30f6f-6358-4d4f-9d5a-717dda159bb2/download/2026-04-29.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Decreto Normativo',
      url: 'https://dadosabertos.rj.gov.br/dataset/b8424314-a495-4a93-b3ac-73ba0dd2bc62/resource/37e0f6b1-7f26-4609-a271-260100fbf26a/download/2026-06-15.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Decreto Normativo',
      url: 'https://dadosabertos.rj.gov.br/dataset/b8424314-a495-4a93-b3ac-73ba0dd2bc62/resource/5f3480e2-a5c4-46cb-b42f-d6f1f0cab420/download/2026-06-23.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Decreto Normativo',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/ba5fcae2-b118-446a-9276-3c3d081f6277/download/2026-08-06.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Decreto Normativo',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/397c3ccb-0e9c-4399-abd8-1b81a9961e79/download/2026-08-07.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Decreto Normativo',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/99f50f86-06c3-43e0-a580-d6e0ad9ec264/download/2026-08-27.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Decreto Normativo',
      url: 'https://dadosabertos.rj.gov.br/dataset/49dd7d65-7ebb-4ddd-9cbf-e7616dbb1282/resource/781b9fe2-24b5-47ad-b4f1-dc10e9fcc893/download/2026-09-16.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Decreto Pessoal',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/93e08b7c-c89a-4a02-804f-eb75592c2e9a/download/2026-05-15.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Decreto Pessoal',
      url: 'https://dadosabertos.rj.gov.br/dataset/e2ec3661-2a4c-4094-9365-eb8723dea3ab/resource/21c87a71-a09e-4d83-9f5c-fe03cd45469e/download/2026-07-23.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Decreto Pessoal',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/178163c4-0115-4c1a-a3e1-15665a5980aa/download/2026-08-24.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Decreto Pessoal',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/f8a64d3b-6899-4492-8c09-44a951ebc4c6/download/2026-10-14.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Decreto Pessoal',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/5fa6ee2b-e37c-4036-a10f-5dfdbec01604/download/2026-10-16.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Deliberação',
      url: 'https://dadosabertos.rj.gov.br/dataset/efb4fda1-e822-434e-8502-3ccdd769c3b5/resource/3f8d24a4-a459-433c-a14b-200a6dbd15cc/download/2026-04-16.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Deliberação',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/59c28089-ecbd-4494-8e76-dc136ad9a7d7/download/2026-05-18.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Deliberação',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/87d01211-e54b-48e2-b29e-d056b2aa24c9/download/2026-05-22.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Deliberação',
      url: 'https://dadosabertos.rj.gov.br/dataset/b8424314-a495-4a93-b3ac-73ba0dd2bc62/resource/70404a59-a44c-410d-b992-9cea16508672/download/2026-06-18.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Deliberação',
      url: 'https://dadosabertos.rj.gov.br/dataset/e2ec3661-2a4c-4094-9365-eb8723dea3ab/resource/a10ce830-687d-4b59-b719-ca75ec6417e9/download/2026-07-17.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Deliberação',
      url: 'https://dadosabertos.rj.gov.br/dataset/e2ec3661-2a4c-4094-9365-eb8723dea3ab/resource/715e224e-376c-47b7-927e-d5adaf1ab374/download/2026-07-20.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Deliberação',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/3731b89d-ae5a-428b-9f7e-81d58ab21937/download/2026-08-19.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Deliberação',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/178163c4-0115-4c1a-a3e1-15665a5980aa/download/2026-08-24.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Deliberação',
      url: 'https://dadosabertos.rj.gov.br/dataset/49dd7d65-7ebb-4ddd-9cbf-e7616dbb1282/resource/6f5b5d2f-ea02-4aa9-8e37-12042ce40863/download/2026-09-22.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Deliberação',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/0eaaac53-2560-4daf-ac90-2b048901181f/download/2026-10-08.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Deliberação',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/b092c285-3e6a-46e2-90af-73f0e44507bd/download/2026-10-15.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Deliberação',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/5fa6ee2b-e37c-4036-a10f-5dfdbec01604/download/2026-10-16.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Deliberação',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/d2ba18af-54be-4c8b-9104-6a5ac2deca60/download/2026-10-21.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Despacho',
      url: 'https://dadosabertos.rj.gov.br/dataset/3da1770f-6876-40ab-9328-f2f150c649ba/resource/7ebf083c-f0ac-4295-b6c4-0d0ba4f2ee30/download/2026-03-19.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Despacho',
      url: 'https://dadosabertos.rj.gov.br/dataset/3da1770f-6876-40ab-9328-f2f150c649ba/resource/2f3671a3-079e-4b1d-889a-a484f74b88ad/download/2026-03-31.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Despacho',
      url: 'https://dadosabertos.rj.gov.br/dataset/efb4fda1-e822-434e-8502-3ccdd769c3b5/resource/b9ebfbd1-542b-4618-991c-52c67cb1d59b/download/2026-04-28.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Despacho',
      url: 'https://dadosabertos.rj.gov.br/dataset/efb4fda1-e822-434e-8502-3ccdd769c3b5/resource/16f30f6f-6358-4d4f-9d5a-717dda159bb2/download/2026-04-29.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Despacho',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/365324ef-deb6-4948-809a-d2ab45f20ea2/download/2026-05-21.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Despacho',
      url: 'https://dadosabertos.rj.gov.br/dataset/b8424314-a495-4a93-b3ac-73ba0dd2bc62/resource/f02dd9ab-171b-4fd8-9ad2-8054098997c6/download/2026-06-24.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Despacho',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/eace0dfa-d1eb-4651-ac07-b3a141bd76fa/download/2026-08-04.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Despacho',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/833881e7-a51d-427b-aece-3663c0b51edb/download/2026-08-13.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Despacho',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/3731b89d-ae5a-428b-9f7e-81d58ab21937/download/2026-08-19.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Despacho',
      url: 'https://dadosabertos.rj.gov.br/dataset/49dd7d65-7ebb-4ddd-9cbf-e7616dbb1282/resource/78f32cab-d24c-4104-a00d-25877c919da9/download/2026-09-03.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Despacho',
      url: 'https://dadosabertos.rj.gov.br/dataset/49dd7d65-7ebb-4ddd-9cbf-e7616dbb1282/resource/458c8cc0-5931-425c-8a52-41603f4b84af/download/2026-09-11.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Despacho',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/a979053c-08de-411a-bd4b-b45e6ac72e6a/download/2026-10-07.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Despacho',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/dc81d985-c75e-485d-97f3-6adde9c85386/download/2026-10-19.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Despacho',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/a08fc829-3a44-43f9-aea3-11d11ff4cb08/download/2026-10-29.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/804c280a-420f-4988-aa76-5a3198af07b0/resource/ec395c8e-10ac-411d-ad83-23e93b406daf/download/2026-01-07.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/804c280a-420f-4988-aa76-5a3198af07b0/resource/3790abf6-4105-4ba9-a336-4aaf92ed5ab7/download/2026-01-08.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/804c280a-420f-4988-aa76-5a3198af07b0/resource/2b26a22e-53e5-4396-b006-d9ed3e6008c3/download/2026-01-15.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/804c280a-420f-4988-aa76-5a3198af07b0/resource/ebb9898e-d101-44bb-bec7-ee6b7dfb10b8/download/2026-01-16.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/804c280a-420f-4988-aa76-5a3198af07b0/resource/54cc7f19-fc03-4d23-8cda-9073cb38413f/download/2026-01-19.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/804c280a-420f-4988-aa76-5a3198af07b0/resource/fa84a6ca-98b5-4b6b-94a0-a691fff0530e/download/2026-01-21.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/804c280a-420f-4988-aa76-5a3198af07b0/resource/4964a469-3ea2-482c-b324-86abf3db1e3b/download/2026-01-27.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/804c280a-420f-4988-aa76-5a3198af07b0/resource/06bdd773-bb7c-470a-a7a0-90dd1c5e441d/download/2026-01-30.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/3da1770f-6876-40ab-9328-f2f150c649ba/resource/5c7c201e-c91b-407c-8040-841bd78d4d68/download/2026-03-03.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/3da1770f-6876-40ab-9328-f2f150c649ba/resource/a24eca32-ae0d-4bd6-9725-e8a1308301f6/download/2026-03-06.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/3da1770f-6876-40ab-9328-f2f150c649ba/resource/32b982fb-6b57-4fca-a98a-ca5064433d81/download/2026-03-23.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/3da1770f-6876-40ab-9328-f2f150c649ba/resource/c5d2a14a-7cc2-4213-b12f-a062f05c4272/download/2026-03-27.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/efb4fda1-e822-434e-8502-3ccdd769c3b5/resource/cacb1324-08d3-4645-891f-264021103b2d/download/2026-04-01.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/efb4fda1-e822-434e-8502-3ccdd769c3b5/resource/798197ca-ceeb-44ca-9a11-08270cca9ce7/download/2026-04-06.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/efb4fda1-e822-434e-8502-3ccdd769c3b5/resource/3eb2d912-6e00-4956-951e-29ddfa3ba948/download/2026-04-08.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/efb4fda1-e822-434e-8502-3ccdd769c3b5/resource/b8cf8240-ca66-4032-a333-bb9e27cc2488/download/2026-04-09.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/efb4fda1-e822-434e-8502-3ccdd769c3b5/resource/8ea16445-d00c-4d00-aa02-bde1e7d7150c/download/2026-04-13.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/efb4fda1-e822-434e-8502-3ccdd769c3b5/resource/8d020e85-bed3-4cd8-85a0-ae57d28b9371/download/2026-04-22.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/efb4fda1-e822-434e-8502-3ccdd769c3b5/resource/b9ebfbd1-542b-4618-991c-52c67cb1d59b/download/2026-04-28.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/e58ffbc1-e45e-4c50-a206-8abdba25af62/download/2026-05-11.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/8e6726fd-4b54-4be3-9a44-c04751be5390/download/2026-05-14.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/4bc451fb-349c-45e3-aee2-6ccb53099723/download/2026-05-20.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/6b0204de-ca57-4e04-9347-045460787816/download/2026-05-28.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/b8424314-a495-4a93-b3ac-73ba0dd2bc62/resource/b274601f-397c-4f55-a1cc-769bd86f72b2/download/2026-06-01.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/b8424314-a495-4a93-b3ac-73ba0dd2bc62/resource/0b99cbad-e7fb-4ba1-9b68-151728d43c53/download/2026-06-03.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/b8424314-a495-4a93-b3ac-73ba0dd2bc62/resource/49d8e0fb-0ce3-4297-858b-f5d556fba4d8/download/2026-06-08.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/e2ec3661-2a4c-4094-9365-eb8723dea3ab/resource/f89700bd-2d86-4de2-9508-1d730e69671e/download/2026-07-03.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/e2ec3661-2a4c-4094-9365-eb8723dea3ab/resource/b89fb039-8a66-4935-a1ee-dba7351ae1aa/download/2026-07-08.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/e2ec3661-2a4c-4094-9365-eb8723dea3ab/resource/9a0c3f36-91d5-4eff-a5c8-cc2f3c4529b6/download/2026-07-31.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/ba5fcae2-b118-446a-9276-3c3d081f6277/download/2026-08-06.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/40e64e19-d93f-443f-9061-fcc5be9a1fc3/download/2026-08-12.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/2d013656-ba0f-41ae-bf7e-5b9f2d58cbc0/download/2026-08-17.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/3731b89d-ae5a-428b-9f7e-81d58ab21937/download/2026-08-19.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/49dd7d65-7ebb-4ddd-9cbf-e7616dbb1282/resource/085993d2-60e6-45f8-bf5a-b78eb4c891b8/download/2026-09-02.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/49dd7d65-7ebb-4ddd-9cbf-e7616dbb1282/resource/9ac08d48-0caf-4b4b-b265-1ae4343e718c/download/2026-09-24.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/49dd7d65-7ebb-4ddd-9cbf-e7616dbb1282/resource/6f01d707-dd28-453c-8754-e99a3be78c6b/download/2026-09-25.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/203112e8-9393-46af-9976-aab5389a50be/download/2026-10-20.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/d2ba18af-54be-4c8b-9104-6a5ac2deca60/download/2026-10-21.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/d9f0b689-280f-45ce-a6ec-dd35674d8f62/download/2026-10-22.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Extrato de Instrumento Contratual',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/b2b8f48f-ec23-4d36-9244-3e72828c791f/download/2026-10-05.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Extrato de Termo',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/3915de42-ab79-4d02-b3c4-26e3b382b1db/download/2026-05-06.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Extrato de Termo',
      url: 'https://dadosabertos.rj.gov.br/dataset/b8424314-a495-4a93-b3ac-73ba0dd2bc62/resource/ad5248ba-6835-4ef0-846e-b95b775b8770/download/2026-06-16.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Extrato de Termo',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/bedb3932-21bf-4cb9-b8be-2716a9e5fdcf/download/2026-08-21.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Extrato de Termo',
      url: 'https://dadosabertos.rj.gov.br/dataset/49dd7d65-7ebb-4ddd-9cbf-e7616dbb1282/resource/c2f0eb38-5b33-4c37-9a63-3915e271f0b5/download/2026-09-23.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Extrato de Termo Aditivo',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/e72d1da1-1cbc-4190-8c29-1a8dc7795429/download/2026-05-19.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Extrato de Termo Aditivo',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/2ebe3805-b668-4df2-9c0a-601e0361d476/download/2026-05-25.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Extrato de Termo Aditivo',
      url: 'https://dadosabertos.rj.gov.br/dataset/49dd7d65-7ebb-4ddd-9cbf-e7616dbb1282/resource/eb95f405-11b7-4061-af39-525cdb8f84b6/download/2026-09-09.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Lei',
      url: 'https://dadosabertos.rj.gov.br/dataset/3da1770f-6876-40ab-9328-f2f150c649ba/resource/fe20ad5c-991e-496f-a1d1-dca201c76859/download/2026-03-20.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Pauta',
      url: 'https://dadosabertos.rj.gov.br/dataset/e2ec3661-2a4c-4094-9365-eb8723dea3ab/resource/745fbe51-563f-43ce-a6c7-f98475f3dd72/download/2026-07-07.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Portaria',
      url: 'https://dadosabertos.rj.gov.br/dataset/804c280a-420f-4988-aa76-5a3198af07b0/resource/c55e50f8-79ef-4222-a783-420ab245b064/download/2026-01-02.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Portaria',
      url: 'https://dadosabertos.rj.gov.br/dataset/804c280a-420f-4988-aa76-5a3198af07b0/resource/a9759ff0-6a13-4899-960f-69139a5e051c/download/2026-01-26.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Portaria',
      url: 'https://dadosabertos.rj.gov.br/dataset/3da1770f-6876-40ab-9328-f2f150c649ba/resource/d1bc1656-ac29-4799-9c48-f0f9be4105ff/download/2026-03-26.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Portaria',
      url: 'https://dadosabertos.rj.gov.br/dataset/efb4fda1-e822-434e-8502-3ccdd769c3b5/resource/d8b8aa53-6e1e-48d9-9bf3-80f4970a4b58/download/2026-04-14.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Portaria',
      url: 'https://dadosabertos.rj.gov.br/dataset/efb4fda1-e822-434e-8502-3ccdd769c3b5/resource/0cdd2691-a26c-48b4-8092-c5b6e12a6f75/download/2026-04-20.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Portaria',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/ac759a15-0aef-42ef-be46-06aee2161172/download/2026-05-07.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Portaria',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/424ea895-311e-4332-a677-032d339636ef/download/2026-05-29.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Portaria',
      url: 'https://dadosabertos.rj.gov.br/dataset/e2ec3661-2a4c-4094-9365-eb8723dea3ab/resource/9f42cffe-1ae7-4e0f-bdd8-205077bce687/download/2026-07-21.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Portaria',
      url: 'https://dadosabertos.rj.gov.br/dataset/e2ec3661-2a4c-4094-9365-eb8723dea3ab/resource/21c87a71-a09e-4d83-9f5c-fe03cd45469e/download/2026-07-23.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Portaria',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/ba5fcae2-b118-446a-9276-3c3d081f6277/download/2026-08-06.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Portaria',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/178163c4-0115-4c1a-a3e1-15665a5980aa/download/2026-08-24.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Portaria',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/577b7365-c954-45fc-a311-6106dfbd6cad/download/2026-08-26.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Portaria',
      url: 'https://dadosabertos.rj.gov.br/dataset/49dd7d65-7ebb-4ddd-9cbf-e7616dbb1282/resource/085993d2-60e6-45f8-bf5a-b78eb4c891b8/download/2026-09-02.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Portaria',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/ab334c1a-f39b-4af1-864d-3f59240a81a9/download/2026-10-02.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Portaria',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/001ddc73-17f9-4713-b4a8-99a0ea82e3b9/download/2026-10-09.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Portaria',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/400d0367-4438-4f6d-80b6-201c39a9452d/download/2026-10-13.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Resolução',
      url: 'https://dadosabertos.rj.gov.br/dataset/804c280a-420f-4988-aa76-5a3198af07b0/resource/a75968b1-069a-43d8-80b3-fca2e022eb4e/download/2026-01-23.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Resolução',
      url: 'https://dadosabertos.rj.gov.br/dataset/3da1770f-6876-40ab-9328-f2f150c649ba/resource/8f14c996-5768-40e9-b399-87f5e5c47f89/download/2026-03-05.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Resolução',
      url: 'https://dadosabertos.rj.gov.br/dataset/3da1770f-6876-40ab-9328-f2f150c649ba/resource/32b982fb-6b57-4fca-a98a-ca5064433d81/download/2026-03-23.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Resolução',
      url: 'https://dadosabertos.rj.gov.br/dataset/3da1770f-6876-40ab-9328-f2f150c649ba/resource/230a2726-76ff-459a-b64b-5a1bcf81f3f7/download/2026-03-24.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Resolução',
      url: 'https://dadosabertos.rj.gov.br/dataset/3da1770f-6876-40ab-9328-f2f150c649ba/resource/34647aa9-5d37-4e0c-9251-732a41e69b72/download/2026-03-25.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Resolução',
      url: 'https://dadosabertos.rj.gov.br/dataset/efb4fda1-e822-434e-8502-3ccdd769c3b5/resource/798197ca-ceeb-44ca-9a11-08270cca9ce7/download/2026-04-06.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Resolução',
      url: 'https://dadosabertos.rj.gov.br/dataset/efb4fda1-e822-434e-8502-3ccdd769c3b5/resource/0cdd2691-a26c-48b4-8092-c5b6e12a6f75/download/2026-04-20.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Resolução',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/59c28089-ecbd-4494-8e76-dc136ad9a7d7/download/2026-05-18.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Resolução',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/4bc451fb-349c-45e3-aee2-6ccb53099723/download/2026-05-20.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Resolução',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/4bf2f476-9d92-4be8-9d23-9b4d39150609/download/2026-05-26.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Resolução',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/424ea895-311e-4332-a677-032d339636ef/download/2026-05-29.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Resolução',
      url: 'https://dadosabertos.rj.gov.br/dataset/e2ec3661-2a4c-4094-9365-eb8723dea3ab/resource/a54ab5ed-b2dd-4440-b7f0-96c588e9795b/download/2026-07-06.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Resolução',
      url: 'https://dadosabertos.rj.gov.br/dataset/e2ec3661-2a4c-4094-9365-eb8723dea3ab/resource/efb4211f-a324-4f40-834d-de6a60514f1a/download/2026-07-09.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Resolução',
      url: 'https://dadosabertos.rj.gov.br/dataset/e2ec3661-2a4c-4094-9365-eb8723dea3ab/resource/672c60e6-12af-4656-83a6-e3396eb2839b/download/2026-07-13.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Resolução',
      url: 'https://dadosabertos.rj.gov.br/dataset/e2ec3661-2a4c-4094-9365-eb8723dea3ab/resource/54891202-1109-4ecd-b2ba-c0575eaf5af7/download/2026-07-29.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Resolução',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/aad93c0d-48d6-4b10-a2e0-d4a92b0151b3/download/2026-08-05.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Resolução',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/3b3d88fd-5f96-4e82-9e5e-23fb7173fee5/download/2026-08-10.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Resolução',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/1ba53f19-790a-4a75-b3fb-83d4a31f6bde/download/2026-08-25.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Resolução',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/577b7365-c954-45fc-a311-6106dfbd6cad/download/2026-08-26.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Resolução',
      url: 'https://dadosabertos.rj.gov.br/dataset/49dd7d65-7ebb-4ddd-9cbf-e7616dbb1282/resource/7bfa88c5-9330-4d94-be12-12101c710a93/download/2026-09-01.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Resolução',
      url: 'https://dadosabertos.rj.gov.br/dataset/49dd7d65-7ebb-4ddd-9cbf-e7616dbb1282/resource/a52245ac-cd5b-41f7-baaa-aa6731ddcccd/download/2026-09-04.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Resolução',
      url: 'https://dadosabertos.rj.gov.br/dataset/49dd7d65-7ebb-4ddd-9cbf-e7616dbb1282/resource/71e4c79d-5310-4539-a008-9eeb5e2842cf/download/2026-09-18.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Resolução',
      url: 'https://dadosabertos.rj.gov.br/dataset/49dd7d65-7ebb-4ddd-9cbf-e7616dbb1282/resource/be5b6654-9cfb-4523-97c4-16b7a0c140f7/download/2026-09-28.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Resolução',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/5fa6ee2b-e37c-4036-a10f-5dfdbec01604/download/2026-10-16.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Resolução',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/d2ba18af-54be-4c8b-9104-6a5ac2deca60/download/2026-10-21.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Resolução Conjunta',
      url: 'https://dadosabertos.rj.gov.br/dataset/b8424314-a495-4a93-b3ac-73ba0dd2bc62/resource/ca264ba0-c71d-40f8-8f24-cd5e4668e66e/download/2026-06-19.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Resolução Conjunta',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/731d7de2-6f66-446f-b74f-22857be4c463/download/2026-10-01.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'I - Resolução Conjunta',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/ab334c1a-f39b-4af1-864d-3f59240a81a9/download/2026-10-02.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'IB - Ata',
      url: 'https://dadosabertos.rj.gov.br/dataset/3da1770f-6876-40ab-9328-f2f150c649ba/resource/c5d2a14a-7cc2-4213-b12f-a062f05c4272/download/2026-03-27.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'IB - Ata',
      url: 'https://dadosabertos.rj.gov.br/dataset/b8424314-a495-4a93-b3ac-73ba0dd2bc62/resource/82325db3-bb3c-46e5-9b81-6e1b8552477c/download/2026-06-26.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'IB - Ata',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/400d0367-4438-4f6d-80b6-201c39a9452d/download/2026-10-13.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'IB - Ato Executivo',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/4bf2f476-9d92-4be8-9d23-9b4d39150609/download/2026-05-26.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'IB - Ato Executivo',
      url: 'https://dadosabertos.rj.gov.br/dataset/b8424314-a495-4a93-b3ac-73ba0dd2bc62/resource/63b6aebf-01f0-425f-868e-512ebf118832/download/2026-06-12.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'IB - Aviso',
      url: 'https://dadosabertos.rj.gov.br/dataset/804c280a-420f-4988-aa76-5a3198af07b0/resource/1bd09a45-fc68-4e07-bff9-47ea931ced67/download/2026-01-29.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'IB - Aviso',
      url: 'https://dadosabertos.rj.gov.br/dataset/b8424314-a495-4a93-b3ac-73ba0dd2bc62/resource/82325db3-bb3c-46e5-9b81-6e1b8552477c/download/2026-06-26.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'IB - Aviso',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/9175fad7-6496-4b0f-9b70-85f0a8eaccf8/download/2026-08-14.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'IB - Decisão Monocrática',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/2d013656-ba0f-41ae-bf7e-5b9f2d58cbc0/download/2026-08-17.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'IB - Edital de Comunicação (Plenário)',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/365324ef-deb6-4948-809a-d2ab45f20ea2/download/2026-05-21.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'IB - Portaria',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/9175fad7-6496-4b0f-9b70-85f0a8eaccf8/download/2026-08-14.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'IB - Portaria',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/63e04b1d-a95e-44c0-ab5e-140f7c683b61/download/2026-08-18.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Ata',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/b092c285-3e6a-46e2-90af-73f0e44507bd/download/2026-10-15.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Atos da Mesa Diretora',
      url: 'https://dadosabertos.rj.gov.br/dataset/efb4fda1-e822-434e-8502-3ccdd769c3b5/resource/cacb1324-08d3-4645-891f-264021103b2d/download/2026-04-01.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Atos da Mesa Diretora',
      url: 'https://dadosabertos.rj.gov.br/dataset/efb4fda1-e822-434e-8502-3ccdd769c3b5/resource/79628cc0-53f9-47d5-b87b-d04eae17fb93/download/2026-04-17.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Edital',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/aad93c0d-48d6-4b10-a2e0-d4a92b0151b3/download/2026-08-05.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Emendas',
      url: 'https://dadosabertos.rj.gov.br/dataset/b8424314-a495-4a93-b3ac-73ba0dd2bc62/resource/63b6aebf-01f0-425f-868e-512ebf118832/download/2026-06-12.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Expediente Inicial',
      url: 'https://dadosabertos.rj.gov.br/dataset/3da1770f-6876-40ab-9328-f2f150c649ba/resource/a24eca32-ae0d-4bd6-9725-e8a1308301f6/download/2026-03-06.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Lei(s)',
      url: 'https://dadosabertos.rj.gov.br/dataset/e2ec3661-2a4c-4094-9365-eb8723dea3ab/resource/a54ab5ed-b2dd-4440-b7f0-96c588e9795b/download/2026-07-06.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Ofícios',
      url: 'https://dadosabertos.rj.gov.br/dataset/3da1770f-6876-40ab-9328-f2f150c649ba/resource/6af2a557-4613-44f9-848f-9b537bf1a6aa/download/2026-03-04.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Ofícios',
      url: 'https://dadosabertos.rj.gov.br/dataset/3da1770f-6876-40ab-9328-f2f150c649ba/resource/e21223b1-f99a-4143-9cf5-2d4e29d06690/download/2026-03-11.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Ofícios',
      url: 'https://dadosabertos.rj.gov.br/dataset/3da1770f-6876-40ab-9328-f2f150c649ba/resource/815824fa-df98-4678-b553-ea1d3e7931c8/download/2026-03-12.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Ofícios',
      url: 'https://dadosabertos.rj.gov.br/dataset/efb4fda1-e822-434e-8502-3ccdd769c3b5/resource/3f8d24a4-a459-433c-a14b-200a6dbd15cc/download/2026-04-16.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Ofícios',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/3a9c1755-220b-4a0d-861c-87c0b43ac62b/download/2026-05-04.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Ofícios',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/3915de42-ab79-4d02-b3c4-26e3b382b1db/download/2026-05-06.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Ofícios',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/365324ef-deb6-4948-809a-d2ab45f20ea2/download/2026-05-21.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Ofícios',
      url: 'https://dadosabertos.rj.gov.br/dataset/b8424314-a495-4a93-b3ac-73ba0dd2bc62/resource/49d8e0fb-0ce3-4297-858b-f5d556fba4d8/download/2026-06-08.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Ofícios',
      url: 'https://dadosabertos.rj.gov.br/dataset/b8424314-a495-4a93-b3ac-73ba0dd2bc62/resource/8d0a30f2-40ed-4e90-bcc9-34bfde82dc8e/download/2026-06-17.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Ofícios',
      url: 'https://dadosabertos.rj.gov.br/dataset/e2ec3661-2a4c-4094-9365-eb8723dea3ab/resource/8c261677-c830-4acd-91e6-c058135bec20/download/2026-07-01.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Ofícios',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/aad93c0d-48d6-4b10-a2e0-d4a92b0151b3/download/2026-08-05.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Ofícios',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/5f4b312b-f884-4d4d-8f8a-e5b858452719/download/2026-08-11.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Ofícios',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/3731b89d-ae5a-428b-9f7e-81d58ab21937/download/2026-08-19.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Ofícios',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/e396906e-cba2-4955-afdb-13bd4bc450d9/download/2026-08-20.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Ofícios',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/577b7365-c954-45fc-a311-6106dfbd6cad/download/2026-08-26.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Ofícios',
      url: 'https://dadosabertos.rj.gov.br/dataset/49dd7d65-7ebb-4ddd-9cbf-e7616dbb1282/resource/93eb458a-8468-4dae-9001-cb42f1b58ba5/download/2026-09-17.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Ofícios',
      url: 'https://dadosabertos.rj.gov.br/dataset/49dd7d65-7ebb-4ddd-9cbf-e7616dbb1282/resource/f2346020-fdd0-4059-aab6-72bb1c6e45cb/download/2026-09-21.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Ofícios',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/b2b8f48f-ec23-4d36-9244-3e72828c791f/download/2026-10-05.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Ofícios',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/d2ba18af-54be-4c8b-9104-6a5ac2deca60/download/2026-10-21.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Ordem do Dia',
      url: 'https://dadosabertos.rj.gov.br/dataset/3da1770f-6876-40ab-9328-f2f150c649ba/resource/225132d2-8354-483e-9524-1a3ed812623d/download/2026-03-18.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Ordem do Dia',
      url: 'https://dadosabertos.rj.gov.br/dataset/efb4fda1-e822-434e-8502-3ccdd769c3b5/resource/d17bc561-d73e-4ee6-bb58-8f75b53feb30/download/2026-04-15.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Ordem do Dia',
      url: 'https://dadosabertos.rj.gov.br/dataset/efb4fda1-e822-434e-8502-3ccdd769c3b5/resource/3f8d24a4-a459-433c-a14b-200a6dbd15cc/download/2026-04-16.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Ordem do Dia',
      url: 'https://dadosabertos.rj.gov.br/dataset/efb4fda1-e822-434e-8502-3ccdd769c3b5/resource/79628cc0-53f9-47d5-b87b-d04eae17fb93/download/2026-04-17.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Ordem do Dia',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/6b0204de-ca57-4e04-9347-045460787816/download/2026-05-28.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Ordem do Dia',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/424ea895-311e-4332-a677-032d339636ef/download/2026-05-29.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Ordem do Dia',
      url: 'https://dadosabertos.rj.gov.br/dataset/49dd7d65-7ebb-4ddd-9cbf-e7616dbb1282/resource/085993d2-60e6-45f8-bf5a-b78eb4c891b8/download/2026-09-02.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Ordem do Dia',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/d2ba18af-54be-4c8b-9104-6a5ac2deca60/download/2026-10-21.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Pareceres',
      url: 'https://dadosabertos.rj.gov.br/dataset/804c280a-420f-4988-aa76-5a3198af07b0/resource/ec395c8e-10ac-411d-ad83-23e93b406daf/download/2026-01-07.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Pareceres',
      url: 'https://dadosabertos.rj.gov.br/dataset/3da1770f-6876-40ab-9328-f2f150c649ba/resource/6af2a557-4613-44f9-848f-9b537bf1a6aa/download/2026-03-04.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Pareceres',
      url: 'https://dadosabertos.rj.gov.br/dataset/3da1770f-6876-40ab-9328-f2f150c649ba/resource/8f14c996-5768-40e9-b399-87f5e5c47f89/download/2026-03-05.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Pareceres',
      url: 'https://dadosabertos.rj.gov.br/dataset/3da1770f-6876-40ab-9328-f2f150c649ba/resource/7ebf083c-f0ac-4295-b6c4-0d0ba4f2ee30/download/2026-03-19.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Pareceres',
      url: 'https://dadosabertos.rj.gov.br/dataset/3da1770f-6876-40ab-9328-f2f150c649ba/resource/fe20ad5c-991e-496f-a1d1-dca201c76859/download/2026-03-20.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Pareceres',
      url: 'https://dadosabertos.rj.gov.br/dataset/3da1770f-6876-40ab-9328-f2f150c649ba/resource/d1bc1656-ac29-4799-9c48-f0f9be4105ff/download/2026-03-26.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Pareceres',
      url: 'https://dadosabertos.rj.gov.br/dataset/efb4fda1-e822-434e-8502-3ccdd769c3b5/resource/7468dbb1-512e-4944-8146-1e7fb6ac73c8/download/2026-04-27.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Pareceres',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/3a9c1755-220b-4a0d-861c-87c0b43ac62b/download/2026-05-04.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Pareceres',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/93e08b7c-c89a-4a02-804f-eb75592c2e9a/download/2026-05-15.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Pareceres',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/4bf2f476-9d92-4be8-9d23-9b4d39150609/download/2026-05-26.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Pareceres',
      url: 'https://dadosabertos.rj.gov.br/dataset/b8424314-a495-4a93-b3ac-73ba0dd2bc62/resource/f02dd9ab-171b-4fd8-9ad2-8054098997c6/download/2026-06-24.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Pareceres',
      url: 'https://dadosabertos.rj.gov.br/dataset/b8424314-a495-4a93-b3ac-73ba0dd2bc62/resource/edf412f7-69c6-4373-a92a-c70ce2d10b8d/download/2026-06-25.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Pareceres',
      url: 'https://dadosabertos.rj.gov.br/dataset/b8424314-a495-4a93-b3ac-73ba0dd2bc62/resource/82325db3-bb3c-46e5-9b81-6e1b8552477c/download/2026-06-26.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Pareceres',
      url: 'https://dadosabertos.rj.gov.br/dataset/e2ec3661-2a4c-4094-9365-eb8723dea3ab/resource/8c261677-c830-4acd-91e6-c058135bec20/download/2026-07-01.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Pareceres',
      url: 'https://dadosabertos.rj.gov.br/dataset/e2ec3661-2a4c-4094-9365-eb8723dea3ab/resource/a54ab5ed-b2dd-4440-b7f0-96c588e9795b/download/2026-07-06.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Pareceres',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/ba5fcae2-b118-446a-9276-3c3d081f6277/download/2026-08-06.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Pareceres',
      url: 'https://dadosabertos.rj.gov.br/dataset/568768f4-07ca-4385-aa1f-a6235daf86cd/resource/63e04b1d-a95e-44c0-ab5e-140f7c683b61/download/2026-08-18.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Pareceres',
      url: 'https://dadosabertos.rj.gov.br/dataset/49dd7d65-7ebb-4ddd-9cbf-e7616dbb1282/resource/a52245ac-cd5b-41f7-baaa-aa6731ddcccd/download/2026-09-04.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Pareceres',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/d9f0b689-280f-45ce-a6ec-dd35674d8f62/download/2026-10-22.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Pareceres',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/d35dc4e2-cc4e-4426-b0bd-ee0f449cf5c3/download/2026-10-28.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'II - Redação do Vencido',
      url: 'https://dadosabertos.rj.gov.br/dataset/efb4fda1-e822-434e-8502-3ccdd769c3b5/resource/d17bc561-d73e-4ee6-bb58-8f75b53feb30/download/2026-04-15.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'INSTRUÇÃO NORMATIVA Nº 04/2026',
      url: 'https://www.diariomunicipal.com.br/aemerj/materia/8E0D553F',
      assoc: 'aemerj',
      nivel: 'municipal',
    },
    {
      uf: 'RJ',
      titulo: 'IV - Editais: Avisos',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/a2b2bafa-1a9a-4a5c-9307-f9e27f7a2d75/download/2026-05-27.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'IV - Editais: Avisos',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/ab334c1a-f39b-4af1-864d-3f59240a81a9/download/2026-10-02.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'LEI MUNICIPAL N° 2.941 DE 24 DE AGOSTO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/aemerj/materia/D1FD147A',
      assoc: 'aemerj',
      nivel: 'municipal',
    },
    {
      uf: 'RJ',
      titulo: 'V - Avisos, Editais e Termos',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/5fa6ee2b-e37c-4036-a10f-5dfdbec01604/download/2026-10-16.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'V - Convocação',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/4bc451fb-349c-45e3-aee2-6ccb53099723/download/2026-05-20.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'V - Convocação',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/365324ef-deb6-4948-809a-d2ab45f20ea2/download/2026-05-21.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'V - Convocação',
      url: 'https://dadosabertos.rj.gov.br/dataset/b82932cb-ad9e-4fec-aa00-e66077c59cd9/resource/87d01211-e54b-48e2-b29e-d056b2aa24c9/download/2026-05-22.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RN',
      titulo:
        'ALTERA A LEI COMPLEMENTAR Nº 005, DE 03 DE SETEMBRO DE 2021 (CÓDIGO TRIBUTÁRIO DO MUNICÍPIO DE TENENTE ANANIAS/RN)',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/D88D8A78',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'CONTRATO ADMINISTRATIVO Nº 9010056/2026 - DISP. 020/2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/0AAF36E5',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'DECRETO 1427/2026 - ABERTURA DE CREDITO SUPLEMENTAR',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/E9404BD8',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'DECRETO Nº 100/2026 GAB/PMNF NÍSIA FLORESTA/RN, 29 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/A2A6DFC6',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'DECRETO Nº 29, DE 27 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/EB0D492A',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'DECRETO ORÇAMENTÁRIO Nº 00029/2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/05F2972C',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'DECRETO ORÇAMENTÁRIO Nº 029/2026 DE 01 DE JULHO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/274FF9F9',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'DECRETO SUPLEMENTAR Nº 038/2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/449F8CEE',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo:
        'EDITAL DE CONVOCAÇÃO DOS CANDIDATO(A)S CLASSIFICADO(A)S NO PROCESSO SELETIVO SIMPLIFICADO DO MUNICÍPIO DE ACARI/RN - EDITAL Nº 010/2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/32AAEA76',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo:
        'EDITAL DE CONVOCAÇÃO DOS CANDIDATOS CLASSIFICADOS NO PROCESSO SELETIVO SIMPLIFICADO DO MUNICÍPIO DE ACARI/RN - EDITAL Nº 012/2025',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/6D209F02',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'EMENDA À LEI ORGÂNICA, Nº 02/2026 DE 29 DE SETEMBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/69D6C058',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo:
        'EXTRATO DE CONTRATO PROCESSO SELETIVO SIMPLIFICADO Nº 002/2025-GILMAR QUERINO DA SILVA',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/FBE20DF4',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo:
        'JUSTIFICATIVA DE INEXIGIBILIDADE- LEI 13.019/2014 TERMO DE INEXIGIBILIDADE Nº 062/2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/86D9CEBF',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'LEI MUNICIPAL Nº 1.275, DE 19 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/2ED8C0BA',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'LEI MUNICIPAL Nº 2404/2026 DE 29 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/65B4F8EB',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'LEI MUNICIPAL Nº 542 DE 21 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/C7459ECA',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'LEI MUNICIPAL Nº543, DE 21 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/6EC4A10D',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'LEI N°2919/2026, DE 14 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/82BE246D',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'LEI Nº 1424, DE 07 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/735AE378',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'LEI Nº 814/2026-GP',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/EE6F1CA6',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA 206/2026 - ALTERAÇÃO DO QDD 09/2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/EF7A1010',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA DE DIÁRIA N.º 010/2026 – SECMFT.',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/ECC400FC',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA N.° 182, DE 27 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/63A63A0C',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA N.° 183, DE 27 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/A7BD4406',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA N.° 184, DE 27 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/86FFD9D0',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA N.° 185, DE 27 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/803AA6EC',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA N.° 186, DE 27 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/7168C498',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA N.º 0546, DE 28 DE OUTUBRO DE 2026 – GPMU.',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/71AFDFB9',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA N°353/2026-GAB/PREFEITO.',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/DB0CE36C',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA N°354/2026-GAB/PREFEITO.',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/BE10AE7B',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA N°355/2026-GAB/PREFEITO',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/C5FAB85F',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA Nº 0178/2026 – GP',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/7E05374E',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA Nº 0178/2026 – GP (REPUBLICAÇÃO POR INCORREÇÃO)',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/51661A15',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA Nº 034 – GB, DE 29 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/4CC39961',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA Nº 06/2026 - CONTROLADORIA, DE 01 DE JUNHO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/902FBC9A',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA Nº 129/2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/192F9172',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA Nº 130/2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/D57C24C1',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA Nº 226/2026 – GABINETE DA PREFEITA EM, 28 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/FFD62E5A',
      assoc: 'femurn',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo:
        'CONTRATO INDIVIDUAL DE TRABALHO POR PRAZO DETERMINADO ENTRE O MUNICÍPIO DE SERINGUEIRAS/RO E ALYNE HAKER NASCIMENTO.',
      url: 'https://www.diariomunicipal.com.br/arom/materia/42D3D435',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo:
        'CONTRATO INDIVIDUAL DE TRABALHO POR PRAZO DETERMINADO ENTRE O MUNICÍPIO DE SERINGUEIRAS/RO E ANDERSON DE SOUZA GARCIA.',
      url: 'https://www.diariomunicipal.com.br/arom/materia/B958FF3D',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo:
        'CONTRATO INDIVIDUAL DE TRABALHO POR PRAZO DETERMINADO ENTRE O MUNICÍPIO DE SERINGUEIRAS/RO E CLEDIANE CASAGRANDE MAGRI.',
      url: 'https://www.diariomunicipal.com.br/arom/materia/F9E66044',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo:
        'CONTRATO INDIVIDUAL DE TRABALHO POR PRAZO DETERMINADO ENTRE O MUNICÍPIO DE SERINGUEIRAS/RO E EMERSON MEDEIROS NETO.',
      url: 'https://www.diariomunicipal.com.br/arom/materia/BB493870',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo:
        'CONTRATO INDIVIDUAL DE TRABALHO POR PRAZO DETERMINADO ENTRE O MUNICÍPIO DE SERINGUEIRAS/RO E FERNANDO MIRANDA ZEFERINO.',
      url: 'https://www.diariomunicipal.com.br/arom/materia/F1267527',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo:
        'CONTRATO INDIVIDUAL DE TRABALHO POR PRAZO DETERMINADO ENTRE O MUNICÍPIO DE SERINGUEIRAS/RO E GEISILAINE BRAUN SILVA.',
      url: 'https://www.diariomunicipal.com.br/arom/materia/8F5E6ECE',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo:
        'CONTRATO INDIVIDUAL DE TRABALHO POR PRAZO DETERMINADO ENTRE O MUNICÍPIO DE SERINGUEIRAS/RO E IVANIA GOMES FERREIRA.',
      url: 'https://www.diariomunicipal.com.br/arom/materia/9A49D36E',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo:
        'CONTRATO INDIVIDUAL DE TRABALHO POR PRAZO DETERMINADO ENTRE O MUNICÍPIO DE SERINGUEIRAS/RO E VANILDA GONÇALVES DA SILVA.',
      url: 'https://www.diariomunicipal.com.br/arom/materia/EE78CAC4',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo: 'CONTRATO Nº 196/2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/9F33936C',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo: 'CONTRATO Nº 197/2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/5BE9338B',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo: 'CONTRATO Nº 198/2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/D7FC30CF',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo: 'CONTRATO Nº 199/2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/11AE9AC2',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo: 'CONTRATO Nº 200/2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/561C6FB3',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo: 'CONTRATO Nº 201/2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/E2EE8B1E',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo: 'CONTRATO Nº 202/2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/8121A00D',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo: 'CONTRATO Nº 203/2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/FE867F69',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo: 'CONTRATO Nº 204/2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/DFE29D85',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo: 'CONTRATO Nº 205/2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/6645E442',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo: 'CONTRATO Nº 206/2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/45F4A951',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo: 'CONTRATO Nº 207/2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/0C82C6C2',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo: 'CONTRATO Nº 208/2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/B1F0CA01',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo:
        'CONTRATO QUE ENTRE SI CELEBRAM A PREFEITURA MUNICIPAL COLORADO DO OESTE E A EMPRESA A LEANDRO EUGENIO DA ROCHA LTDA',
      url: 'https://www.diariomunicipal.com.br/arom/materia/19CCB07F',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo: 'DECRETO Nº 1.227, DE 16 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/F06D100B',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo: 'DECRETO Nº 2.324 DE 08 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/arom/materia/9608F68B',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo:
        'DECRETO Nº 398/2026. DISPÕE DA 47ª CONVOCAÇÃO DE CANDIDATOS APROVADOS NO TESTE SELETIVO 005/SEMAF/SMG/2025 PARA COMPOR O QUADRO DE SERVIDORES DA SECRETARIA MUNICIPAL DE TRABALHO E AÇÃO SOCIAL - SEMTRAS, E DÁ OUTRAS PROVIDÊNCIAS.',
      url: 'https://www.diariomunicipal.com.br/arom/materia/5DE6493F',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo: 'DECRETO Nº 4137/GP/PMT/2026 THEOBROMA/RO, 26 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/B4DE02C5',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo: 'DECRETO Nº 420, DE 19 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/72237340',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo:
        'EXTRATO DA ATA DE REGISTRO DE PREÇOS Nº 65/2026 DO PROCESSO ADMINISTRATIVO Nº 0395/SEMUSA/2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/525756F0',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo: 'LEI COMPLEMENTAR Nº 03',
      url: 'https://www.diariomunicipal.com.br/arom/materia/519F5D2A',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo: 'LEI COMPLEMENTAR Nº 10/2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/582503EC',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo: 'LEI Nº 27624',
      url: 'https://www.diariomunicipal.com.br/arom/materia/0E124EF0',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo: 'LEI Nº. 1837 DE 28 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/arom/materia/A13A1106',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo: 'PORTARIA Nº491/CHEF-GAB/2026 EM 16 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/arom/materia/AB412761',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo: 'PORTARIA Nº493/CHEF-GAB/2026 EM 16 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/arom/materia/478218FD',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RO',
      titulo: 'REVISÃO E CONSOLIDAÇÃO DA LEI ORGÂNICA DO MUNICÍPIO Nº 001/2018.',
      url: 'https://www.diariomunicipal.com.br/arom/materia/05436DDF',
      assoc: 'arom',
      nivel: 'municipal',
    },
    {
      uf: 'RS',
      titulo: '1° TERMO ADITIVO AO CONTRATO N. 158/2025',
      url: 'https://www.diariomunicipal.com.br/agm/materia/925D3E58',
      assoc: 'agm',
      nivel: 'municipal',
    },
    {
      uf: 'RS',
      titulo: 'DECRETO N.º 4.179, DE 27 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/D9CCEB98',
      assoc: 'famurs',
      nivel: 'municipal',
    },
    {
      uf: 'RS',
      titulo: 'DECRETO N.º 7.257, DE 19 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/CB44BC93',
      assoc: 'famurs',
      nivel: 'municipal',
    },
    {
      uf: 'RS',
      titulo: 'DECRETO N° 23.018 DE 29 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/53C0BF2D',
      assoc: 'famurs',
      nivel: 'municipal',
    },
    {
      uf: 'RS',
      titulo: 'DECRETO Nº 3.534/2026 DE 01 DE SETEMBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/A6E5B539',
      assoc: 'famurs',
      nivel: 'municipal',
    },
    {
      uf: 'RS',
      titulo: 'DECRETO Nº 4.450, DE 19 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/B99210B5',
      assoc: 'famurs',
      nivel: 'municipal',
    },
    {
      uf: 'RS',
      titulo: 'DECRETO Nº 56, DE 26 DE OUTUBRO DE 2026 - LEI N.1677',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/F0FFBEAC',
      assoc: 'famurs',
      nivel: 'municipal',
    },
    {
      uf: 'RS',
      titulo: 'DISPÕE SOBRE A LEI DE DIRETRIZES ORÇAMENTÁRIAS PARA O EXERCÍCIO DE 2027.',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/F7BA74FD',
      assoc: 'famurs',
      nivel: 'municipal',
    },
    {
      uf: 'RS',
      titulo: 'EXTRATO DE CONTRATOS',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/9F3135F0',
      assoc: 'famurs',
      nivel: 'municipal',
    },
    {
      uf: 'RS',
      titulo: 'EXTRATO DE DECRETO Nº 9.115 DE 21 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/422E9824',
      assoc: 'famurs',
      nivel: 'municipal',
    },
    {
      uf: 'RS',
      titulo: 'EXTRATO DE INEXIGIBILIDADE 16/2026',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/1885B8C3',
      assoc: 'famurs',
      nivel: 'municipal',
    },
    {
      uf: 'RS',
      titulo: 'LEI 1.965/2026',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/6144FC77',
      assoc: 'famurs',
      nivel: 'municipal',
    },
    {
      uf: 'RS',
      titulo:
        'LEI 2710 Nº /2026 DISPÕE SOBRE A LEI DE DIRETRIZES ORÇAMENTÁRIAS PARA O EXERCÍCIO DE 2027.',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/DFF94EC4',
      assoc: 'famurs',
      nivel: 'municipal',
    },
    {
      uf: 'RS',
      titulo: 'LEI COMPLEMENTAR Nº 050/2026 CÓDIGO TRIBUTÁRIO',
      url: 'https://www.diariomunicipal.com.br/agm/materia/E6C0E84A',
      assoc: 'agm',
      nivel: 'municipal',
    },
    {
      uf: 'RS',
      titulo: 'LEI MUNICIPAL Nº 1.672, DE 08 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/7722CC58',
      assoc: 'famurs',
      nivel: 'municipal',
    },
    {
      uf: 'RS',
      titulo: 'LEI MUNICIPAL Nº 2133, DE 16 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/B10B59A0',
      assoc: 'famurs',
      nivel: 'municipal',
    },
    {
      uf: 'RS',
      titulo: 'LEI MUNICIPAL Nº 5.711, DE 27 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/E45B0BBA',
      assoc: 'famurs',
      nivel: 'municipal',
    },
    {
      uf: 'RS',
      titulo:
        'LEI N.° 3.197, DE 09 DE OUTUBRO DE 2026 - DISPÕE SOBRE AS DIRETRIZES ORÇAMENTÁRIAS PARA O EXERCÍCIO FINANCEIRO DE 2027.',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/4FBAAF65',
      assoc: 'famurs',
      nivel: 'municipal',
    },
    {
      uf: 'RS',
      titulo: 'LEI N.° 3.198, DE 27 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/5090786A',
      assoc: 'famurs',
      nivel: 'municipal',
    },
    {
      uf: 'RS',
      titulo: 'LEI N.º 10.602, DE 15 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/297E03B1',
      assoc: 'famurs',
      nivel: 'municipal',
    },
    {
      uf: 'RS',
      titulo:
        'LEI N.º 3.537, DE 07 DE OUTUBRO DE 2026. DISPÕE SOBRE AS DIRETRIZES ORÇAMENTÁRIAS PARA O EXERCÍCIO FINANCEIRO DE 2027.',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/B81DE943',
      assoc: 'famurs',
      nivel: 'municipal',
    },
    {
      uf: 'RS',
      titulo: 'LEI N° 11.248, DE 6 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/0DE9DC04',
      assoc: 'famurs',
      nivel: 'municipal',
    },
    {
      uf: 'RS',
      titulo: 'LEI Nº 1098/2026, DE 20 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/agm/materia/9C5CEBE1',
      assoc: 'agm',
      nivel: 'municipal',
    },
    {
      uf: 'RS',
      titulo: 'LEI Nº 1099/2026, DE 20 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/agm/materia/14A36058',
      assoc: 'agm',
      nivel: 'municipal',
    },
    {
      uf: 'RS',
      titulo: 'LEI Nº 2.634 DE 07 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/8F43A4D3',
      assoc: 'famurs',
      nivel: 'municipal',
    },
    {
      uf: 'RS',
      titulo: 'LEI Nº 2213/2026',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/BB17AA90',
      assoc: 'famurs',
      nivel: 'municipal',
    },
    {
      uf: 'RS',
      titulo: 'LEI Nº 2946/2026, DE 20 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/25AC1202',
      assoc: 'famurs',
      nivel: 'municipal',
    },
    {
      uf: 'RS',
      titulo: 'LEI Nº. 3.771 DE 06 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/569C456A',
      assoc: 'famurs',
      nivel: 'municipal',
    },
    {
      uf: 'RS',
      titulo: 'PORTARIA 8143/2026',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/E3B6C70C',
      assoc: 'famurs',
      nivel: 'municipal',
    },
    {
      uf: 'SC',
      titulo:
        'PORTARIA N° 3724 de 26/10/2026 A SECRETÁRIA DE ESTADO DA EDUCAÇÃO, no uso das atribuições que lhe são conferidas pelo art. 106, §2º, inciso I, da Lei Complement',
      url: 'https://portal.doe.sea.sc.gov.br/v2.44.07/#/portal/edicao/buscar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'SE',
      titulo:
        'Art. 2º Este Decreto entra em vigor na data de sua publicação, produzindo efeitos a partir de 1º de julho de 2026, exceto quanto aos seguintes dispositivos do R',
      url: 'https://iose.se.gov.br/diario-oficial',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'SE',
      titulo:
        'Diário Oficial segunda-feira, 30 de Março de 2026 Aracaju - Sergipe Nº 29.857 12 RELATÓRIO FISCAL 2026 GOVERNO DE SERGIPE RELATÓRIO RESUMIDO DA EXECUÇÃO ORÇAMEN',
      url: 'https://iose.se.gov.br/diario-oficial',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'SE',
      titulo:
        'Diário Oficial sexta-feira, 29 de Maio de 2026 Aracaju - Sergipe 18 Nº 29.897 RELATÓRIO FISCAL 2026 GOVERNO DE SERGIPE RELATÓRIO RESUMIDO DA EXECUÇÃO ORÇAMENTÁR',
      url: 'https://iose.se.gov.br/diario-oficial',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'SE',
      titulo:
        'ambiental, em conformidade com a Lei nº 8.628, de 05 de dezembro de 2019, bem como no atendimento às disposições da Emenda Constitucional (Federal) nº 132, de 2',
      url: 'https://iose.se.gov.br/diario-oficial',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'SE',
      titulo:
        'quinta-feira, 15 de Outubro de 2026 Aracaju - Sergipe Diário Oficial DESTAQUES DE SERGIPE Simples Nacional A Secretaria de Estado da Fazenda (Sefaz) alerta a em',
      url: 'https://iose.se.gov.br/diario-oficial',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'SE',
      titulo:
        'segunda-feira, 02 de Março de 2026 Aracaju - Sergipe Diário Oficial 7 GOVERNO DE SERGIPE SECRETARIA DE ESTADO DA FAZENDA PORTARIA SEFAZ Nº 0057 DE 19 DE FEVEREI',
      url: 'https://iose.se.gov.br/diario-oficial',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'SE',
      titulo:
        'segunda-feira, 30 de Março de 2026 Aracaju - Sergipe Diário Oficial Nº 29.857 14 RELATÓRIO FISCAL 2026 GOVERNO DE SERGIPE RELATÓRIO RESUMIDO DA EXECUÇÃO ORÇAMEN',
      url: 'https://iose.se.gov.br/diario-oficial',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'SE',
      titulo:
        'sexta-feira, 29 de Maio de 2026 Aracaju - Sergipe Diário Oficial Nº 29.897 RELATÓRIO FISCAL 20 2026 GOVERNO DE SERGIPE RELATÓRIO RESUMIDO DA EXECUÇÃO ORÇAMENTÁR',
      url: 'https://iose.se.gov.br/diario-oficial',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'SP',
      titulo: 'ALTERAÇÃO, DE 14 DE OUTUBRO DE 2026',
      url: 'https://doe.sp.gov.br/empresarial/alteracoes-de-sociedades-limitadas/alteracao-de-14-de-outubro-de-2026-202610144225102205055',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'SP',
      titulo: 'ALTERAÇÃO, DE 16 DE OUTUBRO DE 2026',
      url: 'https://doe.sp.gov.br/empresarial/alteracoes-de-sociedades-limitadas/alteracao-de-16-de-outubro-de-2026-202610164225102212378',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'SP',
      titulo: 'CONSTITUIÇÃO, DE 14 DE OUTUBRO DE 2026',
      url: 'https://doe.sp.gov.br/empresarial/constituicoes-de-sociedades-limitadas/constituicao-de-14-de-outubro-de-2026-20261014421182205023',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'SP',
      titulo: 'CONVÊNIO Nº 1, DE 2 DE OUTUBRO DE 2026',
      url: 'https://doe.sp.gov.br/executivo/procuradoria-geral-do-estado/convenio-n-1-de-2-de-outubro-de-2026-20261002131112752178466',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'SP',
      titulo: 'DECRETO N.º 2415, DE 28 DE SETEMBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/apm/materia/1B36C794',
      assoc: 'apm',
      nivel: 'municipal',
    },
    {
      uf: 'SP',
      titulo: 'DESPACHO AUTORIZADOR - PREGÃO ELETRÔNICO Nº 007/2026, DE 23 DE OUTUBRO DE 2026',
      url: 'https://doe.sp.gov.br/executivo/secretaria-de-cultura-economia-e-industria-criativas/despacho-autorizador-pregao-eletronico-n-007-2026-de-23-de-outubro-de-2026-2026102313162212812231496',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'SP',
      titulo:
        'DESPACHO AUTORIZADOR DE CONTRATAÇÃO DIRETA POR INEXIGIBILIDADE, DE 26 DE OUTUBRO DE 2026',
      url: 'https://doe.sp.gov.br/executivo/secretaria-da-justica-e-cidadania/despacho-autorizador-de-contratacao-direta-por-inexigibilidade-de-26-de-outubro-de-2026-202610261330115112782235457',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'SP',
      titulo:
        'DISPENSA DE LICITAÇÃO Nº 90007/2026 - DESPACHO AUTORIZADOR, DE 16 DE OUTUBRO DE 2026',
      url: 'https://doe.sp.gov.br/executivo/secretaria-de-cultura-economia-e-industria-criativas/dispensa-de-licitacao-n-90007-2026-despacho-autorizador-de-16-de-outubro-de-2026-2026101613162212772212553',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'SP',
      titulo: 'Demonstrações financeiras',
      url: 'https://doe.sp.gov.br/empresarial/bioenergia-barra-ltda/demonstracoes-financeiras-202610094162692772196659',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'SP',
      titulo: 'Demonstrações financeiras',
      url: 'https://doe.sp.gov.br/empresarial/bioenergia-barra-ltda/demonstracoes-financeiras-202610094162692772196659',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'SP',
      titulo: 'EDITAL Nº 106/2026, DE 1 DE OUTUBRO DE 2026',
      url: 'https://doe.sp.gov.br/executivo/secretaria-da-fazenda-e-planejamento/edital-n-106-2026-de-1-de-outubro-de-2026-20261001132642562174604',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'SP',
      titulo: 'EDITAL Nº 119/2026, DE 23 DE OUTUBRO DE 2026',
      url: 'https://doe.sp.gov.br/executivo/secretaria-da-fazenda-e-planejamento/edital-n-119-2026-de-23-de-outubro-de-2026-20261023132642562229579',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'SP',
      titulo: 'EDITAL Nº 95/2026, DE 1 DE OUTUBRO DE 2026',
      url: 'https://doe.sp.gov.br/executivo/secretaria-da-fazenda-e-planejamento/edital-n-95-2026-de-1-de-outubro-de-2026-20261001132642562173121',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'SP',
      titulo:
        'PREGÃO ELETRÔNICO Nº 005/2026 - COMUNICADO DE RESPOSTA AO PEDIDO DE ESCLARECIMENTOS, DE 2 DE OUTUBRO DE 2026',
      url: 'https://doe.sp.gov.br/executivo/secretaria-de-cultura-economia-e-industria-criativas/pregao-eletronico-n-005-2026-comunicado-de-resposta-ao-pedido-de-esclarecimentos-de-2-de-outubro-de-2026-2026100213162212812178170',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'SP',
      titulo:
        'RELATÓRIO PARCIAL DE ANÁLISE E JULGAMENTO DAS INSCRIÇÕES DO SELO PARCEIRO DA SOCIOEDUCAÇÃO – EDIÇÃO 2026 (Portaria Normativa nº 521/2026)',
      url: 'https://doe.sp.gov.br/executivo/secretaria-da-justica-e-cidadania/relatorio-parcial-de-analise-e-julgamento-das-inscricoes-do-selo-parceiro-da-socioeducacao-edicao-2026-portaria-normativa-n-521-2026-202610261132112042235372',
      assoc: 'estadual',
      nivel: 'estadual',
    },
  ],
  portais: {
    ok: 0,
    pdf: 0,
    nav: 0,
    sem: 10,
    off: 17,
    total: 27,
  },
  conectores: [
    {
      uf: 'RS',
      nome: 'DOE/RS',
      ativo: true,
      modo: 'PDF integral · a API só indexa atas; critério próprio por nº de decreto',
      hits: 3,
      amostra: ['CGIBS'],
    },
    {
      uf: 'SP',
      nome: 'Diário Oficial do SP (DOE)',
      ativo: true,
      modo: 'API textual · critério próprio: termos e marcadores do DOE-SP',
      hits: 14,
      amostra: [
        'EDITAL Nº 106/2026, DE 1 DE OUTUBRO DE 2',
        'EDITAL Nº 95/2026, DE 1 DE OUTUBRO DE 20',
        'PREGÃO ELETRÔNICO Nº 005/2026 - COMUNICA',
      ],
    },
    {
      uf: 'SC',
      nome: 'Diário Oficial de SC (DOE)',
      ativo: true,
      modo: 'POST busca-materia · critério próprio + filtro Fundeb (falso positivo real)',
      hits: 1,
      amostra: ['PORTARIA N° 3724 de 26/10/2026 A SECRETÁ'],
    },
    {
      uf: 'PR',
      nome: 'Diário Oficial do PR (DIOE)',
      ativo: true,
      modo: 'Elasticsearch aberto · critério próprio: decreto/IN por número',
      hits: 20,
      amostra: [
        '99 4ª FEIRA |28/OUT/2026 - EDIÇÃO N° 12.',
        '98 4ª FEIRA |28/OUT/2026 - EDIÇÃO N° 12.',
        '97 4ª FEIRA |28/OUT/2026 - EDIÇÃO N° 12.',
      ],
    },
    {
      uf: 'MG',
      nome: 'Jornal Minas Gerais (DIOE/MG)',
      ativo: true,
      modo: 'JWT anônimo · critério próprio SEF/MG',
      hits: 10,
      amostra: [
        'almente substituidos pela Contribuicao s',
        'O DIAMETRO SERVICO COMPLEMENTAR / CARACT',
        'dias uteis; 100% em ate 10 dias uteis, a',
      ],
    },
    {
      uf: 'ES',
      nome: 'Consulta Normas ES (SEGER)',
      ativo: true,
      modo: 'Consulta Normas SEGER · critério próprio; acervo normativo (prova: decreto 157)',
      hits: 1,
      amostra: ['DECRETO-R 00006356/2026 — Altera o Decre'],
    },
    {
      uf: 'MT',
      nome: 'Diário Oficial de MT (IOMAT)',
      ativo: true,
      modo: 'PDF integral · critério próprio (prova: decreto 25)',
      hits: 0,
      amostra: [],
    },
    {
      uf: 'MS',
      nome: 'Diário Oficial de MS (DOE/MS)',
      ativo: true,
      modo: 'API com trecho · critério próprio SEFAZ/MS',
      hits: 36,
      amostra: [
        'Complementar Federal nº 214, de 16 de ja',
        'empresa de pequeno porte e ao produtor r',
        'Melhoria Os Estados devem indicar suas e',
      ],
    },
    {
      uf: 'RJ',
      nome: 'Diário Oficial do RJ — dados abertos',
      ativo: true,
      modo: 'JSON diário completo (CKAN) · acervo A PARTIR DE 2025 (piso fixado) · 11.389 atos em 2025-2026',
      hits: 11389,
      amostra: ['I - Portaria', 'II - Pareceres', 'I - Edital'],
    },
    {
      uf: 'SE',
      nome: 'Diário Oficial de Sergipe (IOSE)',
      ativo: true,
      modo: 'Elasticsearch · critério próprio (prova: ICMS/decreto)',
      hits: 8,
      amostra: [
        'sexta-feira, 29 de Maio de 2026 Aracaju ',
        'Diário Oficial sexta-feira, 29 de Maio d',
        'segunda-feira, 30 de Março de 2026 Araca',
      ],
    },
    {
      uf: 'AL',
      nome: 'Diário Oficial de Alagoas',
      ativo: true,
      modo: 'POST searchES · critério próprio (API ordena por score/1979)',
      hits: 14,
      amostra: [
        '227/2026. 4 Resolução CGIBS nº 6/2026, a',
        'REPRESENTANTE DO ESTADO DE ALAGOAS NO CO',
        '.****-05 Manu Martins - Zezo Alagoano Ag',
      ],
    },
    {
      uf: 'GO',
      nome: 'Diário Oficial de Goiás (ABC)',
      ativo: true,
      modo: 'PDF integral · plataforma apifront (prova: decreto 5)',
      hits: 0,
      amostra: [],
    },
    {
      uf: 'AM',
      nome: 'Diário Oficial do Amazonas (IOA)',
      ativo: true,
      modo: 'PDF integral · plataforma apifront (prova: decreto 6)',
      hits: 0,
      amostra: [],
    },
    {
      uf: 'RO',
      nome: 'Diário Oficial de Rondônia (DIOF)',
      ativo: true,
      modo: 'PDF por URL previsível · sumário pontilhado ignorado',
      hits: 0,
      amostra: [],
    },
    {
      uf: 'RN',
      nome: 'Diário Legislativo Eletrônico do RN (ALE-RN)',
      ativo: true,
      modo: 'Busca textual real (POST form) + PDF · o diário do Executivo saiu do ar',
      hits: 0,
      amostra: [],
    },
    {
      uf: 'RR',
      nome: 'Diário Oficial de Roraima (Imprensa Oficial)',
      ativo: true,
      modo: 'POST /_visualizar-doe/ · critério próprio (prova: decreto 6)',
      hits: 0,
      amostra: [],
    },
  ],
}

const NAVY = 'bg-panorama-navy'
const OURO = 'text-panorama-gold'

export function SectionRadarNacional() {
  const [uf, setUf] = useState<string>('')
  const [busca, setBusca] = useState('')
  const [nivel, setNivel] = useState<'todos' | 'municipal' | 'estadual' | 'federal'>('todos')

  const achados = useMemo(() => {
    const q = busca
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
    return DADOS.achados.filter((a) => {
      if (uf && a.uf !== uf) return false
      if (!q) return true
      const alvo = (a.titulo || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
      return alvo.includes(q)
    })
  }, [uf, busca])

  const totalUf = uf ? DADOS.porUf[uf] || 0 : DADOS.achados.length
  const maxUf = Math.max(...(Object.values(DADOS.porUf) as number[]), 1)

  return (
    <section className="max-w-6xl mx-auto space-y-5">
      {/* HERO */}
      <div className={NAVY + ' rounded-2xl overflow-hidden shadow-lg ring-1 ring-panorama-gold/40'}>
        <div className="px-5 py-4 md:px-7 md:py-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] font-bold tracking-[0.16em] uppercase bg-panorama-gold text-panorama-navy px-2 py-0.5 rounded">
              Radar nacional
            </span>
            <span className="text-[9px] font-bold tracking-wide uppercase text-panorama-gold-light/70">
              três níveis · uma regra
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">
            Diários oficiais do Brasil — federal, estadual e municipal
          </h2>
          <p className="text-[11.5px] text-slate-300 mt-1.5 leading-relaxed max-w-3xl">
            A mesma varredura que o radar faz no Diário Oficial da União, replicada nos diários dos
            estados e dos municípios. Cada nível tem a sua fonte mestra, e o confronto é sempre
            contra o órgão que publica.
          </p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {['Diário Oficial da União', 'diários estaduais', 'diários municipais (SIGPub)'].map(
              (t) => (
                <span
                  key={t}
                  className="text-[9px] font-semibold text-panorama-gold-light bg-white/10 ring-1 ring-panorama-gold/40 rounded px-1.5 py-0.5"
                >
                  {t}
                </span>
              ),
            )}
          </div>
        </div>
      </div>

      {/* A REGRA, EXPLICADA POR NÍVEL */}
      <div className="grid gap-3 md:grid-cols-3">
        {[
          {
            Icon: Landmark,
            titulo: 'Federal',
            fonte: 'Diário Oficial da União',
            texto:
              'O DOU é a fonte mestra. A Lefisc localiza o ato; o DOU confirma, corrige e prevalece. Divergência é registrada, não escondida.',
            cor: 'border-blue-300 bg-blue-50',
            icone: 'text-blue-700',
          },
          {
            Icon: Building2,
            titulo: 'Estadual',
            fonte: 'Diário oficial do estado',
            texto:
              'O diário do estado é a fonte primária do ato estadual. A Lefisc continua sendo radar: só entra o que o diário do estado publicou.',
            cor: 'border-emerald-300 bg-emerald-50',
            icone: 'text-emerald-700',
          },
          {
            Icon: MapPin,
            titulo: 'Municipal',
            fonte: 'Diário oficial do município',
            texto:
              'O diário do município é a fonte primária. Aqui a Lefisc não alcança — ela não indexa ato municipal.',
            cor: 'border-amber-300 bg-amber-50',
            icone: 'text-amber-700',
          },
        ].map((n) => (
          <div key={n.titulo} className={'rounded-xl border-2 p-3 ' + n.cor}>
            <div className="flex items-center gap-1.5 mb-1">
              <n.Icon className={'w-4 h-4 ' + n.icone} />
              <h3 className="text-[12px] font-bold text-slate-900">{n.titulo}</h3>
            </div>
            <p className="text-[9.5px] font-bold text-slate-600 uppercase tracking-wide mb-1">
              {n.fonte}
            </p>
            <p className="text-[10px] text-slate-700 leading-relaxed">{n.texto}</p>
          </div>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {[
          { v: DADOS.achados.length, r: 'matérias encontradas', s: 'com cara de ato normativo' },
          { v: Object.keys(DADOS.porUf).length, r: 'estados com resultado', s: 'de 27 unidades' },
          {
            v: DADOS.entes.toLocaleString('pt-BR'),
            r: 'entes municipais cobertos',
            s: DADOS.associacoes + ' associações SIGPub',
          },
          {
            v: DADOS.consultas,
            r: 'consultas na varredura',
            s:
              'período de ' +
              DADOS.periodo.inicio.slice(8, 10) +
              '/' +
              DADOS.periodo.inicio.slice(5, 7) +
              ' a ' +
              DADOS.periodo.fim.slice(8, 10) +
              '/' +
              DADOS.periodo.fim.slice(5, 7),
          },
        ].map((k, i) => (
          <div
            key={i}
            className="rounded-xl overflow-hidden ring-1 ring-panorama-gold/40 shadow-sm"
          >
            <div className={NAVY + ' px-3 py-2'}>
              <p className="text-lg font-bold text-white tabular-nums leading-none">{k.v}</p>
              <p className="text-[8.5px] font-semibold uppercase tracking-wide text-panorama-gold-light/80 mt-0.5">
                {k.r}
              </p>
            </div>
            <div className="bg-white px-3 py-1.5">
              <p className="text-[9px] text-slate-500 leading-tight">{k.s}</p>
            </div>
          </div>
        ))}
      </div>

      {/* POR UF */}
      <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
        <div className="bg-panorama-navy px-3 py-2 border-b-2 border-panorama-gold flex items-center gap-2">
          <Globe2 className="w-3.5 h-3.5 text-panorama-gold" />
          <h3 className="text-[11.5px] font-bold text-white">Resultado por estado</h3>
          <span className="ml-auto text-[9px] text-panorama-gold-light/80">
            clique para filtrar
          </span>
        </div>
        <div className="p-3 space-y-1">
          {Object.entries(DADOS.porUf).map(([s, n]) => (
            <button
              key={s}
              onClick={() => setUf(uf === s ? '' : s)}
              className={
                'w-full flex items-center gap-2 group ' +
                (uf === s ? 'opacity-100' : 'opacity-90 hover:opacity-100')
              }
            >
              <span
                className={
                  'w-7 text-[10px] font-bold ' +
                  (uf === s ? 'text-panorama-gold-dark' : 'text-slate-600')
                }
              >
                {s}
              </span>
              <span className="flex-1 h-3 rounded-sm bg-slate-100 overflow-hidden">
                <span
                  className={
                    'block h-full rounded-sm ' +
                    (uf === s ? 'bg-panorama-gold' : 'bg-panorama-navy')
                  }
                  style={{ width: Math.max(4, ((n as number) / maxUf) * 100) + '%' }}
                />
              </span>
              <span className="w-7 text-right text-[10px] font-bold tabular-nums text-slate-700">
                {n}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ACHADOS */}
      <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
        <div className="bg-panorama-navy px-3 py-2 border-b-2 border-panorama-gold flex flex-wrap items-center gap-2">
          <Radar className="w-3.5 h-3.5 text-panorama-gold" />
          <h3 className="text-[11.5px] font-bold text-white">Atos encontrados</h3>
          <span className="text-[9px] text-panorama-gold-light/80">
            {achados.length} de {DADOS.achados.length}
            {uf && ' · ' + uf}
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="relative">
              <Search className="w-3 h-3 text-slate-400 absolute left-1.5 top-1/2 -translate-y-1/2" />
              <input
                value={busca}
                onChange={(ev) => setBusca(ev.target.value)}
                onKeyDown={(ev) => {
                  if (ev.key === 'Escape') setBusca('')
                }}
                placeholder="filtrar por título"
                className="w-40 text-[10px] pl-6 pr-5 py-1 rounded border border-slate-300 focus:border-panorama-gold focus:outline-none"
              />
              {busca && (
                <button
                  onClick={() => setBusca('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>
            {uf && (
              <button
                onClick={() => setUf('')}
                className="text-[9px] font-bold text-panorama-navy bg-panorama-gold rounded px-1.5 py-0.5"
              >
                limpar {uf}
              </button>
            )}
          </div>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-slate-100 border-b border-slate-300">
              <tr>
                <th className="px-2 py-1 text-[9px] font-bold uppercase text-slate-600 w-10">UF</th>
                <th className="px-2 py-1 text-[9px] font-bold uppercase text-slate-600">Ato</th>
                <th className="px-2 py-1 text-[9px] font-bold uppercase text-slate-600 w-14">
                  Nível
                </th>
                <th className="px-2 py-1 text-[9px] font-bold uppercase text-slate-600 w-16 text-right">
                  Fonte
                </th>
              </tr>
            </thead>
            <tbody>
              {achados.map((a, i) => (
                <tr key={i} className={i % 2 ? 'bg-slate-50/60' : 'bg-white'}>
                  <td className="px-2 py-1 text-[9.5px] font-bold text-panorama-navy">{a.uf}</td>
                  <td className="px-2 py-1 text-[10px] text-slate-800 leading-snug">{a.titulo}</td>
                  <td className="px-2 py-1">
                    <span
                      className={
                        'text-[8.5px] font-bold rounded px-1 py-0.5 ' +
                        (a.nivel === 'estadual'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-sky-100 text-sky-800')
                      }
                    >
                      {a.nivel}
                    </span>
                  </td>
                  <td className="px-2 py-1 text-right">
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-blue-700 hover:underline"
                    >
                      abrir <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {achados.length === 0 && (
            <p className="px-3 py-6 text-center text-[11px] text-slate-500">
              Nenhuma matéria com esse filtro.
            </p>
          )}
        </div>
      </div>

      {/* ESTADO DOS PORTAIS ESTADUAIS — honestidade sobre o que falta */}
      <div className="rounded-xl border-2 border-amber-300 bg-amber-50/60 overflow-hidden">
        <div className="bg-amber-900 px-3 py-2 flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
          <h3 className="text-[11.5px] font-bold text-white">Estado real dos portais estaduais</h3>
          <span className="ml-auto text-[9px] text-amber-200">medido, não estimado</span>
        </div>
        <div className="p-3 space-y-2">
          <p className="text-[10px] text-slate-700 leading-relaxed">
            Os {DADOS.portais.total} diários estaduais foram sondados um a um. O resultado é
            desigual, e a tela mostra o número em vez de fingir cobertura total:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {[
              {
                n: DADOS.portais.ok,
                r: 'com busca por termo',
                c: 'text-emerald-700 bg-emerald-50 border-emerald-300',
              },
              {
                n: DADOS.portais.pdf,
                r: 'só PDF',
                c: 'text-amber-700 bg-amber-50 border-amber-300',
              },
              {
                n: DADOS.portais.nav,
                r: 'só com navegador',
                c: 'text-blue-700 bg-blue-50 border-blue-300',
              },
              {
                n: DADOS.portais.sem,
                r: 'sem busca evidente',
                c: 'text-slate-700 bg-slate-50 border-slate-300',
              },
              {
                n: DADOS.portais.off,
                r: 'não responderam',
                c: 'text-rose-700 bg-rose-50 border-rose-300',
              },
            ].map((x, i) => (
              <div key={i} className={'rounded-lg border p-2 text-center ' + x.c}>
                <p className="text-base font-bold tabular-nums leading-none">{x.n}</p>
                <p className="text-[8.5px] font-semibold uppercase tracking-wide mt-0.5 leading-tight">
                  {x.r}
                </p>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-1.5 rounded-lg bg-white border border-amber-200 p-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[9.5px] text-slate-700 leading-relaxed">
              <b>O que ainda falta:</b> a leitura automática de cada portal estadual exige um
              conector por site — endereços, formulário e formato de resposta são diferentes em cada
              um. O municipal já está funcionando porque 22 associações usam a mesma plataforma
              (SIGPub). O estadual avança ente por ente, a partir dos
              {DADOS.portais.ok} que já expõem busca por termo.
            </p>
          </div>
        </div>
      </div>

      {/* CONECTORES ESTADUAIS ATIVOS */}
      {DADOS.conectores.length > 0 && (
        <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/60 overflow-hidden">
          <div className="bg-emerald-800 px-3 py-2 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            <h3 className="text-[11.5px] font-bold text-white">Conectores estaduais ativos</h3>
            <span className="ml-auto text-[9px] text-emerald-200">lendo na fonte oficial</span>
          </div>
          <div className="p-3 space-y-2">
            {DADOS.conectores.map((c, i) => (
              <div key={i} className="rounded-lg bg-white border border-emerald-200 p-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-emerald-800">{c.uf}</span>
                  <span className="text-[10.5px] font-semibold text-slate-800">{c.nome}</span>
                  <span className="ml-auto text-[9.5px] font-bold text-emerald-700 bg-emerald-100 rounded px-1.5 py-0.5">
                    {c.hits} ocorrência{c.hits === 1 ? '' : 's'} na última varredura
                  </span>
                </div>
                <p className="text-[9.5px] text-slate-600 mt-1">{c.modo}</p>
                {c.amostra && c.amostra.length > 0 && (
                  <p className="text-[9px] text-slate-500 mt-0.5">
                    termos achados: {c.amostra.filter((x, j, a) => a.indexOf(x) === j).join(', ')}
                  </p>
                )}
              </div>
            ))}
            <p className="text-[9.5px] text-slate-600 leading-relaxed">
              O RS foi o primeiro estado instalado (pedido do CEO, 31/10/2026): a busca textual da
              API oficial cobre atas e editais, e o PDF integral da edição cobre leis e decretos — o
              conector lê as duas vias. Os demais estados entram na sequência, um conector por
              portal.
            </p>
          </div>
        </div>
      )}

      {/* MUNICÍPIOS AGRUPADOS POR UF — 5.570 IBGE COM CARREGAMENTO SOB DEMANDA */}
      <div className="pt-2">
        <RadarNacional initialUf={uf} />
      </div>

      {/* CAPITULAÇÃO */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500 mb-1">
          Origem dos dados e capitulação
        </p>
        <p className="text-[9.5px] text-slate-600 leading-relaxed">
          Varredura de <b>{DADOS.gerado}</b>, período <b>{DADOS.periodo.inicio}</b> a{' '}
          <b>{DADOS.periodo.fim}</b>, em <b>{DADOS.associacoes} associações</b> do SIGPub
          (diariomunicipal.com.br) e nos <b>{DADOS.portais.total} diários estaduais</b>. Base legal
          da reforma: EC 132/2023, LC 214/2025, LC 227/2026, Resolução CGIBS 6/2026. Ato federal
          confirmado no DOU; ato estadual confirmado no diário do estado; ato municipal confirmado
          no diário do município. Agregador não confirma nada — apenas localiza.
        </p>
      </div>
    </section>
  )
}
