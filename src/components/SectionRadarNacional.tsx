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
      titulo: 'EXTRATO DE PUBLICAÇÃO DO TERMO DE CONTRATO Nº 32520/2026',
      url: 'https://www.diariomunicipal.com.br/ama/materia/19E1A4A3',
      assoc: 'ama',
    },
    {
      uf: 'AL',
      titulo: 'LEI MUNICIPAL N.º 398, DE 20 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/ama/materia/B1A73F9A',
      assoc: 'ama',
    },
    {
      uf: 'AL',
      titulo: 'LEI Nº 2.147, DE 21 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/ama/materia/8F82596C',
      assoc: 'ama',
    },
    {
      uf: 'AL',
      titulo: 'LEI Nº 2.152 DE 21 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/ama/materia/0E4DA3A0',
      assoc: 'ama',
    },
    {
      uf: 'AL',
      titulo: 'LEI Nº 421, DE 14 DE SETEMBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/ama/materia/3CB650AC',
      assoc: 'ama',
    },
    {
      uf: 'AL',
      titulo: 'LEI Nº. 855, DE 08 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/ama/materia/40E319CF',
      assoc: 'ama',
    },
    {
      uf: 'AL',
      titulo: 'PORTARIA Nº 201/2026, DE 22 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/ama/materia/8926EC2E',
      assoc: 'ama',
    },
    {
      uf: 'AL',
      titulo: 'PORTARIA Nº 202/2026, DE 22 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/ama/materia/4AD33724',
      assoc: 'ama',
    },
    {
      uf: 'AL',
      titulo: 'PORTARIA Nº 203/2026, DE 22 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/ama/materia/39E0C3B0',
      assoc: 'ama',
    },
    {
      uf: 'AM',
      titulo: 'LEI COMPLEMENTAR Nº 367/2026 GPM-SAI, DE 01 DE JULHO DE 2026',
      url: 'https://www.diariomunicipal.com.br/aam/materia/ECE4399C',
      assoc: 'aam',
    },
    {
      uf: 'AM',
      titulo: 'LEI MUNICIPAL Nº 472/2026 DE 16 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/aam/materia/72D3A341',
      assoc: 'aam',
    },
    {
      uf: 'AM',
      titulo: 'LEI Nº 652, DE 26 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/aam/materia/DEE6438E',
      assoc: 'aam',
    },
    {
      uf: 'AM',
      titulo: 'RESOLUÇÃO Nº 003/2005',
      url: 'https://www.diariomunicipal.com.br/aam/materia/6B8647FF',
      assoc: 'aam',
    },
    {
      uf: 'AM',
      titulo: 'TERMO DE CONTRATO Nº. 025/2026',
      url: 'https://www.diariomunicipal.com.br/aam/materia/CA316F82',
      assoc: 'aam',
    },
    {
      uf: 'CE',
      titulo: 'LEI COMPLEMENTAR Nº 1.697, DE 21 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/aprece/materia/674A9DE7',
      assoc: 'aprece',
    },
    {
      uf: 'CE',
      titulo: 'LEI MUNICIPAL N° 032/2009 DE 02 DE JULHO DE 2009.',
      url: 'https://www.diariomunicipal.com.br/aprece/materia/573DF99E',
      assoc: 'aprece',
    },
    {
      uf: 'CE',
      titulo: 'LEI MUNICIPAL Nº. 298/2019 DE 18 DE DEZEMBRO DE 2019.',
      url: 'https://www.diariomunicipal.com.br/aprece/materia/E200B897',
      assoc: 'aprece',
    },
    {
      uf: 'CE',
      titulo: 'LEI Nº 1.645, DE 15 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/aprece/materia/9BC14782',
      assoc: 'aprece',
    },
    {
      uf: 'CE',
      titulo: 'PORTARIA DE DIÁRIA Nº 260916.001/2026',
      url: 'https://www.diariomunicipal.com.br/aprece/materia/1D50B49C',
      assoc: 'aprece',
    },
    {
      uf: 'CE',
      titulo: 'PORTARIA Nº 019/2026/SMS.',
      url: 'https://www.diariomunicipal.com.br/aprece/materia/110E2EEE',
      assoc: 'aprece',
    },
    {
      uf: 'CE',
      titulo:
        'RESOLUÇÃO Nº 172/2024 COM REDAÇÃO ALTERADA PELA RESOLUÇÃO Nº 177/2025. DISPÕE SOBRE O REGIMENTO INTERNO DA CÂMARA MUNICIPAL DE MOMBAÇA-CE E DÁ OUTRAS PROVIDÊNCIAS.',
      url: 'https://www.diariomunicipal.com.br/aprece/materia/4C0F4F13',
      assoc: 'aprece',
    },
    {
      uf: 'GO',
      titulo: 'LEI 1690/2026',
      url: 'https://www.diariomunicipal.com.br/fgm/materia/7712DECD',
      assoc: 'fgm',
    },
    {
      uf: 'MG',
      titulo:
        'CONTRATO ADMINISTRATIVO Nº 06/26, QUE CELEBRAM ENTRE SI A CÂMARA MUNICIPAL DE PATROCÍNIO E A EMPRESA VIRTUALIZA TECNOLOGIA DA INFORMAÇÃO LTDA EPP',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/C20CCDD0',
      assoc: 'amm-mg',
    },
    {
      uf: 'MG',
      titulo: 'DECRETO 2984',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/D9A2BC4E',
      assoc: 'amm-mg',
    },
    {
      uf: 'MG',
      titulo: 'DECRETO N.º 4.192/2026',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/128222D8',
      assoc: 'amm-mg',
    },
    {
      uf: 'MG',
      titulo: 'DECRETO Nº 0000068/2026',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/4143265F',
      assoc: 'amm-mg',
    },
    {
      uf: 'MG',
      titulo: 'DECRETO Nº 0000070/2026',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/40C4D48F',
      assoc: 'amm-mg',
    },
    {
      uf: 'MG',
      titulo: 'DECRETO Nº 160/2026 DE 03 DE AGOSTO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/F0DDFBEA',
      assoc: 'amm-mg',
    },
    {
      uf: 'MG',
      titulo: 'DECRETO Nº 17.633/26',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/CC49C4A6',
      assoc: 'amm-mg',
    },
    {
      uf: 'MG',
      titulo: 'DECRETO Nº 257/2026',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/77A662C1',
      assoc: 'amm-mg',
    },
    {
      uf: 'MG',
      titulo: 'DECRETO Nº 4.540 DE 29 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/16C3AA75',
      assoc: 'amm-mg',
    },
    {
      uf: 'MG',
      titulo: 'DECRETO Nº 4078/2026, DE 1 DE SETEMBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/0FE84246',
      assoc: 'amm-mg',
    },
    {
      uf: 'MG',
      titulo: 'DECRETO Nº 484, DE 30 DE SETEMBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/7B683D97',
      assoc: 'amm-mg',
    },
    {
      uf: 'MG',
      titulo: 'DECRETO Nº 563/2026',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/255596AE',
      assoc: 'amm-mg',
    },
    {
      uf: 'MG',
      titulo: 'DECRETO Nº 6.203, DE 15 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/BC74F18A',
      assoc: 'amm-mg',
    },
    {
      uf: 'MG',
      titulo: 'EXTRATO DE CONTRATO',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/E85826E7',
      assoc: 'amm-mg',
    },
    {
      uf: 'MG',
      titulo: 'EXTRATO DE RATIFICAÇÃO. DISPENSA Nº020/2026.',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/860E1B2D',
      assoc: 'amm-mg',
    },
    {
      uf: 'MG',
      titulo: 'LEI COMPLEMENTAR N.º 245 DE 31 DE MARÇO DE 2025.',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/5C3FA54D',
      assoc: 'amm-mg',
    },
    {
      uf: 'MG',
      titulo: 'LEI COMPLEMENTAR Nº 073, DE 13 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/87416409',
      assoc: 'amm-mg',
    },
    {
      uf: 'MG',
      titulo: 'LEI COMPLEMENTAR Nº 261, 01 DE ABRIL DE 2026.',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/96328256',
      assoc: 'amm-mg',
    },
    {
      uf: 'MG',
      titulo: 'LEI MUNICIPAL Nº 2.830/2026',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/4597D1F6',
      assoc: 'amm-mg',
    },
    {
      uf: 'MG',
      titulo: 'LEI Nº 4.478/2026',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/8358DFC0',
      assoc: 'amm-mg',
    },
    {
      uf: 'MG',
      titulo: 'LEI Nº. 2.307, DE 29 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/66E076F3',
      assoc: 'amm-mg',
    },
    {
      uf: 'MG',
      titulo: 'LEI ORDINÁRIA MUNICIPAL N.º 3.699, DE 30 DE SETEMBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/9670F52C',
      assoc: 'amm-mg',
    },
    {
      uf: 'MG',
      titulo: 'PORTARIA Nº 020, DE 22 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/EC0609CA',
      assoc: 'amm-mg',
    },
    {
      uf: 'MG',
      titulo: 'PORTARIA Nº. 473, DE 26 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/C3B7FA4C',
      assoc: 'amm-mg',
    },
    {
      uf: 'MG',
      titulo:
        'PORTARIA-Nº-162-2026 - DISPÕE SOBRE A NOMEAÇÃO E CONTRATAÇÃO PARA EMPREGO PÚBLICO TEMPORÁRIO DE ASSISTENTE ADMINISTRATIVO',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/A717C36A',
      assoc: 'amm-mg',
    },
    {
      uf: 'MG',
      titulo:
        'PORTARIA-Nº-168-2026 - CONVOCA ADRIANA CORNÉLIA MONTEIRO FONSECA PARA OCUPAR CARGO DE AGENTE DE REFERÊNCIA TÉCNICA EM MEDICAMENTOS E CONGÊNERES DO PROGRAMA VISA-CIS',
      url: 'https://www.diariomunicipal.com.br/amm-mg/materia/7AAD9906',
      assoc: 'amm-mg',
    },
    {
      uf: 'PA',
      titulo: 'DECRETO Nº 1070, DE 19 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famep/materia/78B0317B',
      assoc: 'famep',
    },
    {
      uf: 'PA',
      titulo: 'DECRETO Nº 146/2026',
      url: 'https://www.diariomunicipal.com.br/famep/materia/11B726B9',
      assoc: 'famep',
    },
    {
      uf: 'PA',
      titulo: 'EXTRATO DE CONTRATO',
      url: 'https://www.diariomunicipal.com.br/famep/materia/56F55AF6',
      assoc: 'famep',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA 700.2026 - GPM.PD - LINDOMAR RODRIGUES DA ROCHA - DIÁRIA DE VIAGEM',
      url: 'https://www.diariomunicipal.com.br/famep/materia/17790117',
      assoc: 'famep',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA 780/2026 – GP',
      url: 'https://www.diariomunicipal.com.br/famep/materia/3C5241E3',
      assoc: 'famep',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA 781/2026 – GP',
      url: 'https://www.diariomunicipal.com.br/famep/materia/257D9D16',
      assoc: 'famep',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA DE VIAGEM Nº 359/2026 - IRRUAN SOUZA GUIMARAES',
      url: 'https://www.diariomunicipal.com.br/famep/materia/88DED2CB',
      assoc: 'famep',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA DE VIAGEM Nº 360/2026 - ARLETE OLIVEIRA SANTOS',
      url: 'https://www.diariomunicipal.com.br/famep/materia/4EF665B7',
      assoc: 'famep',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA N. º 1631/2026.',
      url: 'https://www.diariomunicipal.com.br/famep/materia/E390220B',
      assoc: 'famep',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA N. º 1632/2026.',
      url: 'https://www.diariomunicipal.com.br/famep/materia/EFC38849',
      assoc: 'famep',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA N. º 1644 DE 29 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famep/materia/ADCFE74D',
      assoc: 'famep',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA N. º 1645 DE 29 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famep/materia/F54884CE',
      assoc: 'famep',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA N. º 1646 DE 29 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famep/materia/36B5497B',
      assoc: 'famep',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA N. º 1649 DE 29 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famep/materia/A5CBB622',
      assoc: 'famep',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA N. º 1650 DE 29 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famep/materia/36FA4D1A',
      assoc: 'famep',
    },
    {
      uf: 'PA',
      titulo:
        'PORTARIA Nº 2.544/2026, DE 16 DE OUTUBRO DE 2026. DISPÕE SOBRE A CONCESSÃO DE DIÁRIAS A SERVIDOR.',
      url: 'https://www.diariomunicipal.com.br/famep/materia/3B031122',
      assoc: 'famep',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA Nº 279/2026',
      url: 'https://www.diariomunicipal.com.br/famep/materia/A385FEFE',
      assoc: 'famep',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA Nº 280/2026',
      url: 'https://www.diariomunicipal.com.br/famep/materia/7E5EC4F2',
      assoc: 'famep',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA Nº 281/2026',
      url: 'https://www.diariomunicipal.com.br/famep/materia/76CB958A',
      assoc: 'famep',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA Nº 282/2026',
      url: 'https://www.diariomunicipal.com.br/famep/materia/A784E450',
      assoc: 'famep',
    },
    {
      uf: 'PA',
      titulo: 'PORTARIA Nº 283/2026',
      url: 'https://www.diariomunicipal.com.br/famep/materia/B784F695',
      assoc: 'famep',
    },
    {
      uf: 'PB',
      titulo: 'CONTRATO/SEDUC Nº 0001/2026',
      url: 'https://www.diariomunicipal.com.br/famup/materia/3952C943',
      assoc: 'famup',
    },
    {
      uf: 'PB',
      titulo: 'DECRETO Nº 0581 2026 EM, 30 DE SETEMBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famup/materia/5E41513E',
      assoc: 'famup',
    },
    {
      uf: 'PB',
      titulo: 'EXTRATO DE CONTRATO - 00028/2026',
      url: 'https://www.diariomunicipal.com.br/famup/materia/44F1A207',
      assoc: 'famup',
    },
    {
      uf: 'PE',
      titulo: 'AMUTTE DECRETO Nº 044',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/EA0E34D6',
      assoc: 'amupe',
    },
    {
      uf: 'PE',
      titulo: 'DECRETO Nº 106 DE 30 DE SETEMBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/F5B60834',
      assoc: 'amupe',
    },
    {
      uf: 'PE',
      titulo: 'DECRETO Nº 19 , DE 04 DE MAIO DE 2026 - LEI N.4012',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/25192E27',
      assoc: 'amupe',
    },
    {
      uf: 'PE',
      titulo: 'DECRETO Nº 39 , DE 01 DE SETEMBRO DE 2026 - LEI N.4012',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/ED34CC93',
      assoc: 'amupe',
    },
    {
      uf: 'PE',
      titulo: 'DECRETO Nº 91 , DE 25 DE SETEMBRO DE 2026 - LEI N.915',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/D0BFE611',
      assoc: 'amupe',
    },
    {
      uf: 'PE',
      titulo: 'DECRETO Nº76',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/A5DFC8AB',
      assoc: 'amupe',
    },
    {
      uf: 'PE',
      titulo:
        'EXTRATO DE CONTRATO Nº 049/2026 PROCESSO ADMINISTRATIVO Nº 063/2026 INEXIGIBILIDADE DE LICITAÇÃO Nº 008/2026',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/40566D9C',
      assoc: 'amupe',
    },
    {
      uf: 'PE',
      titulo: 'EXTRATO DE CONTRATO Nº 061/2026 – PMVL',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/FBFC9365',
      assoc: 'amupe',
    },
    {
      uf: 'PE',
      titulo: 'EXTRATO DE CONTRATO PMG/SECFIN Nº 510/2026',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/A34122B4',
      assoc: 'amupe',
    },
    {
      uf: 'PE',
      titulo: 'INSTRUÇÃO NORMATIVA CABOPREV Nº 01, DE 26 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/56535941',
      assoc: 'amupe',
    },
    {
      uf: 'PE',
      titulo: 'LEI 3.053/2026',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/2AB7DF34',
      assoc: 'amupe',
    },
    {
      uf: 'PE',
      titulo: 'LEI MUNICIPAL Nº 1.281, DE 20 AGOSTO DE 2026',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/2A57620A',
      assoc: 'amupe',
    },
    {
      uf: 'PE',
      titulo:
        'LEI MUNICIPAL Nº 859/2026 EMENTA: ESTABELECE AS DIRETRIZES ORÇAMENTÁRIAS PARA O EXERCÍCIO DE 2027 E DÁ OUTRAS PROVIDÊNCIAS.',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/5D21A5EC',
      assoc: 'amupe',
    },
    {
      uf: 'PE',
      titulo: 'LEI MUNICIPAL Nº 866/2026',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/DFB43BC7',
      assoc: 'amupe',
    },
    {
      uf: 'PE',
      titulo: 'LEI Nº 026, DE 28 DE SETEMBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/71083B63',
      assoc: 'amupe',
    },
    {
      uf: 'PE',
      titulo: 'LEI Nº 1.962, DE 06 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/08115567',
      assoc: 'amupe',
    },
    {
      uf: 'PE',
      titulo: 'LEI ORDINÁRIA Nº 2.571/2026',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/0167DF95',
      assoc: 'amupe',
    },
    {
      uf: 'PE',
      titulo: 'LEI ORGÂNICA MUNICIPAL',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/B054C8C7',
      assoc: 'amupe',
    },
    {
      uf: 'PE',
      titulo: 'PORTARIA Nº 242/2026',
      url: 'https://www.diariomunicipal.com.br/amupe/materia/F977AEC5',
      assoc: 'amupe',
    },
    {
      uf: 'PR',
      titulo:
        'ATA DA AUDIÊNCIA PÚBLICA PROJETO DE LEI DO EXECUTIVO Nº 69/2026 LEI ORÇAMENTÁRIA ANUAL – LOA 2027',
      url: 'https://www.diariomunicipal.com.br/amp/materia/23655A87',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'ATO DA MESA Nº. 48, DE 19 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/amp/materia/9D9C97E9',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'ATO DE CONCESSÃO DE DIÁRIA Nº 93/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/5CABF7BF',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'ATO DE CONCESSÃO DE DIÁRIA Nº 94/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/87F62604',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo:
        'COMISSÃO DE FINANÇAS E ORÇAMENTO PARECER Nº 27/2026 REFERÊNCIA: PROJETO DE LEI DO EXECUTIVO Nº 69/2026 ASSUNTO: LEI ORÇAMENTÁRIA ANUAL – LOA PARA O EXERCÍCIO FINANCEIRO DE 2027',
      url: 'https://www.diariomunicipal.com.br/amp/materia/F78CEA6C',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'DECRETO 293',
      url: 'https://www.diariomunicipal.com.br/amp/materia/72E7EB07',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'DECRETO N° 4732/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/33E12FD6',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'DECRETO N° 902/2026 - CRÉDITO ADICIONAL SUPLEMENTAR',
      url: 'https://www.diariomunicipal.com.br/amp/materia/DA347B1E',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'DECRETO Nº 11983, DE 26 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/4F28E4F6',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'DECRETO Nº 11989, DE 28 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/4A86F8F7',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'DECRETO Nº 130 DE 30 DE SETEMRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/20120870',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'DECRETO Nº 138 DE 19 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/2459EAFA',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo:
        'DECRETO Nº 19.659, DE 21 DE OUTUBRO DE 2026 - DISPÕE SOBRE A INSTITUIÇÃO DE COMISSÃO MUNICIPAL DE ACOMPANHAMENTO DA IMPLEMENTAÇÃO DA REFORMA TRIBUTÁRIA, DECORRENTE DA EMENDA CONSTITUCIONAL Nº 132, DE 20 DE DEZEMBRO DE 2023, NO ÂMBITO DO MUNICÍPIO',
      url: 'https://www.diariomunicipal.com.br/amp/materia/877F9305',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'DECRETO Nº 1986/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/27601298',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'DECRETO Nº 298/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/4F6D185A',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'DECRETO Nº 30001, DE 21 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/A168C1D9',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'DECRETO Nº 314/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/AB00950C',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'DECRETO Nº 4.486/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/05379EB1',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo:
        'DECRETO Nº 510/2026 - DISPÕE SOBRE A SUSPENSÃO TEMPORÁRIA DO RECEBIMENTO DE PROTOCOLOS RELATIVOS A PROCESSOS DA CONSTRUÇÃO CIVIL NO ÂMBITO DO MUNICÍPIO',
      url: 'https://www.diariomunicipal.com.br/amp/materia/81D5A539',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'DECRETO Nº 5326/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/908B7B9C',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'DECRETO Nº 8.833/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/8439FBBC',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'DECRETO Nº.371/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/C79EB6F8',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'DIRETORIA ESPECIAL DE COMPRAS - CONTRATO Nº 196/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/698FD29C',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'ERRATA - DECRETO N° 4732/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/3D2239A8',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'EXTRATO DE CONTRATO DE PRESTAÇÃO DE SERVIÇOS',
      url: 'https://www.diariomunicipal.com.br/amp/materia/76634665',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo:
        'EXTRATO DE DIÁRIA/INDENIZAÇÃO DE ALIMENTAÇÃO E/OU TRANSPORTE/ DESPESAS COM PASSAGENS TERRESTRES E AÉREAS N º 30/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/1E70577E',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo:
        'EXTRATO DE DIÁRIA/INDENIZAÇÃO DE ALIMENTAÇÃO E/OU TRANSPORTE/ DESPESAS COM PASSAGENS TERRESTRES E AÉREAS N º 31/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/3D529D88',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo:
        'EXTRATO DE DIÁRIA/INDENIZAÇÃO DE ALIMENTAÇÃO E/OU TRANSPORTE/ DESPESAS COM PASSAGENS TERRESTRES E AÉREAS N º 32/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/985607CD',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo:
        'LEI COMPLEMENTAR 034/2026 - DISPÕE S/ ORGANIZ DA ADM TRIBUT, CRIA O CARGO DE FISCAL DE TRIBUTOS MUNICIPAIS, ESTABELECE COMPETENCIAS ATRIBUIÇÕES E PRERROGATIVAS DA CARREIRA, EXTINGUE CARGOS DE FISCAL FAZENDÁRIO',
      url: 'https://www.diariomunicipal.com.br/amp/materia/0DC35FFD',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'LEI COMPLEMENTAR Nº 067/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/5EFB9666',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'LEI COMPLEMENTAR Nº 63/2026, DE 27 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/71C37196',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo:
        'LEI Nº 1.237/2026 DISPÕE SOBRE A LEI DE DIRETRIZES ORÇAMENTÁRIAS – LDO PARA O EXERCÍCIO FINANCEIRO DE 2027 DO MUNICÍPIO DE SÃO JORGE D’OESTE E DÁ OUTRAS PROVIDÊNCIAS.',
      url: 'https://www.diariomunicipal.com.br/amp/materia/27E473F9',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'LEI Nº 2.081/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/0C05FA82',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'LEI Nº 5.628/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/7A831F0E',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'LEI ORDINÁRIA N.º 1.063 DE 28 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/FA229E4B',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'LEI ORDINÁRIA Nº 2.841/2026.',
      url: 'https://www.diariomunicipal.com.br/amp/materia/57AF8FEC',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'LEI ORGÂNICA MUNICIPAL',
      url: 'https://www.diariomunicipal.com.br/amp/materia/CEC53923',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo:
        'MUNICÍPIO DE RANCHO ALEGRE D´OESTE – PARANÁ - ANEXO 2, DA LEI 4.320/64 – AGOSTO DE 2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/E1C30A9E',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo:
        'MUNICÍPIO DE RANCHO ALEGRE D´OESTE – PARANÁ - ANEXO 2, DA LEI 4.320/64 – JULHO DE 2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/C52620EF',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'PORTARIA Nº 219/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/1C20F7E6',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'PORTARIA Nº 831/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/F24D715C',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'PORTARIA Nº 951/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/01BEB6C4',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'REPUBLICADO POR INCORREÇÃO DECRETO Nº 5326/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/8F7FF373',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'RESOLUÇÃO 03/2026 CONSELHO MUNICIPAL DE EDUCAÇÃO DE TURVO/PR',
      url: 'https://www.diariomunicipal.com.br/amp/materia/6F9A0A59',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'RESOLUÇÃO CMS-DIR-PLE 045/2026 – 23/10/2026',
      url: 'https://www.diariomunicipal.com.br/amp/materia/DFF3B6A4',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'RESOLUÇÃO N° 11/2026 – CMDCA',
      url: 'https://www.diariomunicipal.com.br/amp/materia/F158514D',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'RESOLUÇÃO Nº 001/2026.',
      url: 'https://www.diariomunicipal.com.br/amp/materia/7916913C',
      assoc: 'amp',
    },
    {
      uf: 'PR',
      titulo: 'RESOLUÇÃO ORCISPAR Nº 70, DE 28 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/amp/materia/A2EFFCFD',
      assoc: 'amp',
    },
    {
      uf: 'RJ',
      titulo:
        'DECRETO Nº 4.470 / 26 = PROCEDIMENTOS INTERNOS PARA FORMALIZAÇÃO DE DEMANDAS, CONTRATAÇÃO DE SERVIÇOS, AQUISIÇÃO DE BENS.',
      url: 'https://www.diariomunicipal.com.br/aemerj/materia/56DB903D',
      assoc: 'aemerj',
    },
    {
      uf: 'RJ',
      titulo: 'INSTRUÇÃO NORMATIVA Nº 04/2026',
      url: 'https://www.diariomunicipal.com.br/aemerj/materia/8E0D553F',
      assoc: 'aemerj',
    },
    {
      uf: 'RJ',
      titulo: 'LEI MUNICIPAL N° 2.941 DE 24 DE AGOSTO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/aemerj/materia/D1FD147A',
      assoc: 'aemerj',
    },
    {
      uf: 'RN',
      titulo:
        'ALTERA A LEI COMPLEMENTAR Nº 005, DE 03 DE SETEMBRO DE 2021 (CÓDIGO TRIBUTÁRIO DO MUNICÍPIO DE TENENTE ANANIAS/RN)',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/D88D8A78',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'CONTRATO ADMINISTRATIVO Nº 9010056/2026 - DISP. 020/2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/0AAF36E5',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'DECRETO 1427/2026 - ABERTURA DE CREDITO SUPLEMENTAR',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/E9404BD8',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'DECRETO Nº 100/2026 GAB/PMNF NÍSIA FLORESTA/RN, 29 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/A2A6DFC6',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'DECRETO Nº 29, DE 27 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/EB0D492A',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'DECRETO ORÇAMENTÁRIO Nº 00029/2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/05F2972C',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'DECRETO ORÇAMENTÁRIO Nº 029/2026 DE 01 DE JULHO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/274FF9F9',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'DECRETO SUPLEMENTAR Nº 038/2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/449F8CEE',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo:
        'EDITAL DE CONVOCAÇÃO DOS CANDIDATO(A)S CLASSIFICADO(A)S NO PROCESSO SELETIVO SIMPLIFICADO DO MUNICÍPIO DE ACARI/RN - EDITAL Nº 010/2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/32AAEA76',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo:
        'EDITAL DE CONVOCAÇÃO DOS CANDIDATOS CLASSIFICADOS NO PROCESSO SELETIVO SIMPLIFICADO DO MUNICÍPIO DE ACARI/RN - EDITAL Nº 012/2025',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/6D209F02',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'EMENDA À LEI ORGÂNICA, Nº 02/2026 DE 29 DE SETEMBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/69D6C058',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo:
        'EXTRATO DE CONTRATO PROCESSO SELETIVO SIMPLIFICADO Nº 002/2025-GILMAR QUERINO DA SILVA',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/FBE20DF4',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo:
        'JUSTIFICATIVA DE INEXIGIBILIDADE- LEI 13.019/2014 TERMO DE INEXIGIBILIDADE Nº 062/2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/86D9CEBF',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'LEI MUNICIPAL Nº 1.275, DE 19 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/2ED8C0BA',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'LEI MUNICIPAL Nº 2404/2026 DE 29 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/65B4F8EB',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'LEI MUNICIPAL Nº 542 DE 21 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/C7459ECA',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'LEI MUNICIPAL Nº543, DE 21 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/6EC4A10D',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'LEI N°2919/2026, DE 14 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/82BE246D',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'LEI Nº 1424, DE 07 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/735AE378',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'LEI Nº 814/2026-GP',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/EE6F1CA6',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA 206/2026 - ALTERAÇÃO DO QDD 09/2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/EF7A1010',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA DE DIÁRIA N.º 010/2026 – SECMFT.',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/ECC400FC',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA N.° 182, DE 27 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/63A63A0C',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA N.° 183, DE 27 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/A7BD4406',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA N.° 184, DE 27 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/86FFD9D0',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA N.° 185, DE 27 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/803AA6EC',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA N.° 186, DE 27 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/7168C498',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA N.º 0546, DE 28 DE OUTUBRO DE 2026 – GPMU.',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/71AFDFB9',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA N°353/2026-GAB/PREFEITO.',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/DB0CE36C',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA N°354/2026-GAB/PREFEITO.',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/BE10AE7B',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA N°355/2026-GAB/PREFEITO',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/C5FAB85F',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA Nº 0178/2026 – GP',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/7E05374E',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA Nº 0178/2026 – GP (REPUBLICAÇÃO POR INCORREÇÃO)',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/51661A15',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA Nº 034 – GB, DE 29 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/4CC39961',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA Nº 06/2026 - CONTROLADORIA, DE 01 DE JUNHO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/902FBC9A',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA Nº 129/2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/192F9172',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA Nº 130/2026',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/D57C24C1',
      assoc: 'femurn',
    },
    {
      uf: 'RN',
      titulo: 'PORTARIA Nº 226/2026 – GABINETE DA PREFEITA EM, 28 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/femurn/materia/FFD62E5A',
      assoc: 'femurn',
    },
    {
      uf: 'RO',
      titulo:
        'CONTRATO INDIVIDUAL DE TRABALHO POR PRAZO DETERMINADO ENTRE O MUNICÍPIO DE SERINGUEIRAS/RO E ALYNE HAKER NASCIMENTO.',
      url: 'https://www.diariomunicipal.com.br/arom/materia/42D3D435',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo:
        'CONTRATO INDIVIDUAL DE TRABALHO POR PRAZO DETERMINADO ENTRE O MUNICÍPIO DE SERINGUEIRAS/RO E ANDERSON DE SOUZA GARCIA.',
      url: 'https://www.diariomunicipal.com.br/arom/materia/B958FF3D',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo:
        'CONTRATO INDIVIDUAL DE TRABALHO POR PRAZO DETERMINADO ENTRE O MUNICÍPIO DE SERINGUEIRAS/RO E CLEDIANE CASAGRANDE MAGRI.',
      url: 'https://www.diariomunicipal.com.br/arom/materia/F9E66044',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo:
        'CONTRATO INDIVIDUAL DE TRABALHO POR PRAZO DETERMINADO ENTRE O MUNICÍPIO DE SERINGUEIRAS/RO E EMERSON MEDEIROS NETO.',
      url: 'https://www.diariomunicipal.com.br/arom/materia/BB493870',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo:
        'CONTRATO INDIVIDUAL DE TRABALHO POR PRAZO DETERMINADO ENTRE O MUNICÍPIO DE SERINGUEIRAS/RO E FERNANDO MIRANDA ZEFERINO.',
      url: 'https://www.diariomunicipal.com.br/arom/materia/F1267527',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo:
        'CONTRATO INDIVIDUAL DE TRABALHO POR PRAZO DETERMINADO ENTRE O MUNICÍPIO DE SERINGUEIRAS/RO E GEISILAINE BRAUN SILVA.',
      url: 'https://www.diariomunicipal.com.br/arom/materia/8F5E6ECE',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo:
        'CONTRATO INDIVIDUAL DE TRABALHO POR PRAZO DETERMINADO ENTRE O MUNICÍPIO DE SERINGUEIRAS/RO E IVANIA GOMES FERREIRA.',
      url: 'https://www.diariomunicipal.com.br/arom/materia/9A49D36E',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo:
        'CONTRATO INDIVIDUAL DE TRABALHO POR PRAZO DETERMINADO ENTRE O MUNICÍPIO DE SERINGUEIRAS/RO E VANILDA GONÇALVES DA SILVA.',
      url: 'https://www.diariomunicipal.com.br/arom/materia/EE78CAC4',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo: 'CONTRATO Nº 196/2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/9F33936C',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo: 'CONTRATO Nº 197/2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/5BE9338B',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo: 'CONTRATO Nº 198/2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/D7FC30CF',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo: 'CONTRATO Nº 199/2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/11AE9AC2',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo: 'CONTRATO Nº 200/2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/561C6FB3',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo: 'CONTRATO Nº 201/2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/E2EE8B1E',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo: 'CONTRATO Nº 202/2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/8121A00D',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo: 'CONTRATO Nº 203/2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/FE867F69',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo: 'CONTRATO Nº 204/2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/DFE29D85',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo: 'CONTRATO Nº 205/2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/6645E442',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo: 'CONTRATO Nº 206/2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/45F4A951',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo: 'CONTRATO Nº 207/2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/0C82C6C2',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo: 'CONTRATO Nº 208/2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/B1F0CA01',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo:
        'CONTRATO QUE ENTRE SI CELEBRAM A PREFEITURA MUNICIPAL COLORADO DO OESTE E A EMPRESA A LEANDRO EUGENIO DA ROCHA LTDA',
      url: 'https://www.diariomunicipal.com.br/arom/materia/19CCB07F',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo: 'DECRETO Nº 1.227, DE 16 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/F06D100B',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo: 'DECRETO Nº 2.324 DE 08 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/arom/materia/9608F68B',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo:
        'DECRETO Nº 398/2026. DISPÕE DA 47ª CONVOCAÇÃO DE CANDIDATOS APROVADOS NO TESTE SELETIVO 005/SEMAF/SMG/2025 PARA COMPOR O QUADRO DE SERVIDORES DA SECRETARIA MUNICIPAL DE TRABALHO E AÇÃO SOCIAL - SEMTRAS, E DÁ OUTRAS PROVIDÊNCIAS.',
      url: 'https://www.diariomunicipal.com.br/arom/materia/5DE6493F',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo: 'DECRETO Nº 4137/GP/PMT/2026 THEOBROMA/RO, 26 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/B4DE02C5',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo: 'DECRETO Nº 420, DE 19 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/72237340',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo:
        'EXTRATO DA ATA DE REGISTRO DE PREÇOS Nº 65/2026 DO PROCESSO ADMINISTRATIVO Nº 0395/SEMUSA/2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/525756F0',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo: 'LEI COMPLEMENTAR Nº 03',
      url: 'https://www.diariomunicipal.com.br/arom/materia/519F5D2A',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo: 'LEI COMPLEMENTAR Nº 10/2026',
      url: 'https://www.diariomunicipal.com.br/arom/materia/582503EC',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo: 'LEI Nº 27624',
      url: 'https://www.diariomunicipal.com.br/arom/materia/0E124EF0',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo: 'LEI Nº. 1837 DE 28 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/arom/materia/A13A1106',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo: 'PORTARIA Nº491/CHEF-GAB/2026 EM 16 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/arom/materia/AB412761',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo: 'PORTARIA Nº493/CHEF-GAB/2026 EM 16 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/arom/materia/478218FD',
      assoc: 'arom',
    },
    {
      uf: 'RO',
      titulo: 'REVISÃO E CONSOLIDAÇÃO DA LEI ORGÂNICA DO MUNICÍPIO Nº 001/2018.',
      url: 'https://www.diariomunicipal.com.br/arom/materia/05436DDF',
      assoc: 'arom',
    },
    {
      uf: 'RS',
      titulo: '1° TERMO ADITIVO AO CONTRATO N. 158/2025',
      url: 'https://www.diariomunicipal.com.br/agm/materia/925D3E58',
      assoc: 'agm',
    },
    {
      uf: 'RS',
      titulo: 'DECRETO N.º 4.179, DE 27 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/D9CCEB98',
      assoc: 'famurs',
    },
    {
      uf: 'RS',
      titulo: 'DECRETO N.º 7.257, DE 19 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/CB44BC93',
      assoc: 'famurs',
    },
    {
      uf: 'RS',
      titulo: 'DECRETO N° 23.018 DE 29 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/53C0BF2D',
      assoc: 'famurs',
    },
    {
      uf: 'RS',
      titulo: 'DECRETO Nº 3.534/2026 DE 01 DE SETEMBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/A6E5B539',
      assoc: 'famurs',
    },
    {
      uf: 'RS',
      titulo: 'DECRETO Nº 4.450, DE 19 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/B99210B5',
      assoc: 'famurs',
    },
    {
      uf: 'RS',
      titulo: 'DECRETO Nº 56, DE 26 DE OUTUBRO DE 2026 - LEI N.1677',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/F0FFBEAC',
      assoc: 'famurs',
    },
    {
      uf: 'RS',
      titulo: 'DISPÕE SOBRE A LEI DE DIRETRIZES ORÇAMENTÁRIAS PARA O EXERCÍCIO DE 2027.',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/F7BA74FD',
      assoc: 'famurs',
    },
    {
      uf: 'RS',
      titulo: 'EXTRATO DE CONTRATOS',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/9F3135F0',
      assoc: 'famurs',
    },
    {
      uf: 'RS',
      titulo: 'EXTRATO DE DECRETO Nº 9.115 DE 21 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/422E9824',
      assoc: 'famurs',
    },
    {
      uf: 'RS',
      titulo: 'EXTRATO DE INEXIGIBILIDADE 16/2026',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/1885B8C3',
      assoc: 'famurs',
    },
    {
      uf: 'RS',
      titulo: 'LEI 1.965/2026',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/6144FC77',
      assoc: 'famurs',
    },
    {
      uf: 'RS',
      titulo:
        'LEI 2710 Nº /2026 DISPÕE SOBRE A LEI DE DIRETRIZES ORÇAMENTÁRIAS PARA O EXERCÍCIO DE 2027.',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/DFF94EC4',
      assoc: 'famurs',
    },
    {
      uf: 'RS',
      titulo: 'LEI COMPLEMENTAR Nº 050/2026 CÓDIGO TRIBUTÁRIO',
      url: 'https://www.diariomunicipal.com.br/agm/materia/E6C0E84A',
      assoc: 'agm',
    },
    {
      uf: 'RS',
      titulo: 'LEI MUNICIPAL Nº 1.672, DE 08 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/7722CC58',
      assoc: 'famurs',
    },
    {
      uf: 'RS',
      titulo: 'LEI MUNICIPAL Nº 2133, DE 16 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/B10B59A0',
      assoc: 'famurs',
    },
    {
      uf: 'RS',
      titulo: 'LEI MUNICIPAL Nº 5.711, DE 27 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/E45B0BBA',
      assoc: 'famurs',
    },
    {
      uf: 'RS',
      titulo:
        'LEI N.° 3.197, DE 09 DE OUTUBRO DE 2026 - DISPÕE SOBRE AS DIRETRIZES ORÇAMENTÁRIAS PARA O EXERCÍCIO FINANCEIRO DE 2027.',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/4FBAAF65',
      assoc: 'famurs',
    },
    {
      uf: 'RS',
      titulo: 'LEI N.° 3.198, DE 27 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/5090786A',
      assoc: 'famurs',
    },
    {
      uf: 'RS',
      titulo: 'LEI N.º 10.602, DE 15 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/297E03B1',
      assoc: 'famurs',
    },
    {
      uf: 'RS',
      titulo:
        'LEI N.º 3.537, DE 07 DE OUTUBRO DE 2026. DISPÕE SOBRE AS DIRETRIZES ORÇAMENTÁRIAS PARA O EXERCÍCIO FINANCEIRO DE 2027.',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/B81DE943',
      assoc: 'famurs',
    },
    {
      uf: 'RS',
      titulo: 'LEI N° 11.248, DE 6 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/0DE9DC04',
      assoc: 'famurs',
    },
    {
      uf: 'RS',
      titulo: 'LEI Nº 1098/2026, DE 20 DE OUTUBRO DE 2026.',
      url: 'https://www.diariomunicipal.com.br/agm/materia/9C5CEBE1',
      assoc: 'agm',
    },
    {
      uf: 'RS',
      titulo: 'LEI Nº 1099/2026, DE 20 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/agm/materia/14A36058',
      assoc: 'agm',
    },
    {
      uf: 'RS',
      titulo: 'LEI Nº 2.634 DE 07 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/8F43A4D3',
      assoc: 'famurs',
    },
    {
      uf: 'RS',
      titulo: 'LEI Nº 2213/2026',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/BB17AA90',
      assoc: 'famurs',
    },
    {
      uf: 'RS',
      titulo: 'LEI Nº 2946/2026, DE 20 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/25AC1202',
      assoc: 'famurs',
    },
    {
      uf: 'RS',
      titulo: 'LEI Nº. 3.771 DE 06 DE OUTUBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/569C456A',
      assoc: 'famurs',
    },
    {
      uf: 'RS',
      titulo: 'PORTARIA 8143/2026',
      url: 'https://www.diariomunicipal.com.br/famurs/materia/E3B6C70C',
      assoc: 'famurs',
    },
    {
      uf: 'SP',
      titulo: 'DECRETO N.º 2415, DE 28 DE SETEMBRO DE 2026',
      url: 'https://www.diariomunicipal.com.br/apm/materia/1B36C794',
      assoc: 'apm',
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
      modo: 'API textual (atas) + PDF integral (leis/decretos)',
      hits: 3,
      amostra: ['Comsefaz', 'CGIBS', 'Comsefaz'],
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
