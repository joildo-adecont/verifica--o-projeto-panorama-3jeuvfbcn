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
  gerado: '2026-11-01',
  periodo: {
    inicio: '2026-10-02',
    fim: '2026-11-01',
  },
  consultas: 88,
  associacoes: 22,
  entes: 2823,
  porUf: {
    PR: 1,
  },
  achados: [
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 1 Número 119 — reforma tributária',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/dnPVo5W3AZ5wJyucprPwVQIlC1V4Rzw1SuSFjSq8/dnPVo5W3AZ5wJyucprPwVQIlC1V4Rzw1SuSFjSq8.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 1 Número 12 — transição tributária',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/LzBsGAe943CnvaU31XlIsLDB2lTKv6r8b8GpDxkQ/LzBsGAe943CnvaU31XlIsLDB2lTKv6r8b8GpDxkQ.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 1 Número 121 — crédito presumido',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/hD8YNy4qu1SbH4El45taVsKp1wK9gvKlBrPB54TR/hD8YNy4qu1SbH4El45taVsKp1wK9gvKlBrPB54TR.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 1 Número 123 — reforma tributária',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/4LcrFhRwpzy5P7qUqPfU1VjlsU5ddSIgMJ18VOic/4LcrFhRwpzy5P7qUqPfU1VjlsU5ddSIgMJ18VOic.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 1 Número 126 — imposto seletivo',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/8aIOCGPt789nuCWg9ODBWJ8IY4V5OqePUff4jUll/8aIOCGPt789nuCWg9ODBWJ8IY4V5OqePUff4jUll.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 1 Número 127 — imposto seletivo',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/a5WswuV6j0CYhXE6K0oRJ1ptxRL5G0fUJkkRgoSW/a5WswuV6j0CYhXE6K0oRJ1ptxRL5G0fUJkkRgoSW.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 1 Número 139 — reforma tributária',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/US5kZKF6X23Z3PmYaAU9a2l6vobeQD9F9MqGFInE/US5kZKF6X23Z3PmYaAU9a2l6vobeQD9F9MqGFInE.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 1 Número 140 — reforma tributária',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/MEwElkg8hMmdvZjw246YN9pPh52aPVYwbmBCk8vf/MEwElkg8hMmdvZjw246YN9pPh52aPVYwbmBCk8vf.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 1 Número 146 — crédito presumido',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/vuhFslpEAtIwMzk4GHwPjh1A9MomByKHQJTcXBGY/vuhFslpEAtIwMzk4GHwPjh1A9MomByKHQJTcXBGY.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 1 Número 149 — reforma tributária',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/knIL2Pr7XYJ6kRFU8xyIYke8ZtY3bTJIfLNOPzsy/knIL2Pr7XYJ6kRFU8xyIYke8ZtY3bTJIfLNOPzsy.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 1 Número 18 — crédito presumido',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/JRrG5AJ7fQElN7rPkc7b7cXYBRXqHZGny5EsbORG/JRrG5AJ7fQElN7rPkc7b7cXYBRXqHZGny5EsbORG.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 1 Número 21 — reforma tributária',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/fu9Rj36a1KL7LxkZY1K22Oibfk6BEEFWHb70oNri/fu9Rj36a1KL7LxkZY1K22Oibfk6BEEFWHb70oNri.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 1 Número 36 — crédito presumido',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/7SK109rT2qBmZjYAEZg7CTFzcwECHDCGLud9ENuE/7SK109rT2qBmZjYAEZg7CTFzcwECHDCGLud9ENuE.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 1 Número 39 — transição tributária',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/mrkpiyoZewO8AqPXpgJaxQVtujnfsatPfklJjYB1/mrkpiyoZewO8AqPXpgJaxQVtujnfsatPfklJjYB1.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 1 Número 43 — transição tributária',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/90yOrCvyASFpQxJUsJVwYJxXYxzmIiNSxJwgTce2/90yOrCvyASFpQxJUsJVwYJxXYxzmIiNSxJwgTce2.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 1 Número 44 — crédito presumido',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/SlrwiOIqVmAJFEcf9KMhMdfzYk1r4a55RgA5Muug/SlrwiOIqVmAJFEcf9KMhMdfzYk1r4a55RgA5Muug.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 1 Número 55 — imposto seletivo',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/udhhgwkPSQ3kcGHjnlyX3T49rTPC6BfKpH6oyK16/udhhgwkPSQ3kcGHjnlyX3T49rTPC6BfKpH6oyK16.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 1 Número 76 — transição tributária',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/MaFNjykQn5kw7JIKSnrRAXpLuF08q69zrxz49vEh/MaFNjykQn5kw7JIKSnrRAXpLuF08q69zrxz49vEh.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 1 Número 86 — split payment',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/PexYkDARzd1JCNnHedAzZdqjTG582oOfIUp7CnmG/PexYkDARzd1JCNnHedAzZdqjTG582oOfIUp7CnmG.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 1 Número 90 — split payment',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/Vzoz7PKEyRTJPXg79dkpAEvOsfIcIX20d64WpBp4/Vzoz7PKEyRTJPXg79dkpAEvOsfIcIX20d64WpBp4.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 1 Número 93 — imposto seletivo',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/HS6kmdki1erIyxj0mEolSv6h4Lu7yhMCLS1C6xZ1/HS6kmdki1erIyxj0mEolSv6h4Lu7yhMCLS1C6xZ1.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 1 Número 97 — crédito presumido',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/kP12EUMWbtHJGqP4PppSgG2w4zzj2lXRWK8bGQPE/kP12EUMWbtHJGqP4PppSgG2w4zzj2lXRWK8bGQPE.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 1 Número 98 — split payment',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/mAFntATDzLqWgnuvr2FoigWgD9UcUMAh0V8WHPBl/mAFntATDzLqWgnuvr2FoigWgD9UcUMAh0V8WHPBl.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 1 Número 99 — reforma tributária',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/5hNAsJOnSXSnRHjup07o9T1surSZPH2v4UkSkPRU/5hNAsJOnSXSnRHjup07o9T1surSZPH2v4UkSkPRU.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 1 — reforma tributária',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/AwSHTAKU9voCVjRv8NbGGBLmCMgi20vaXmcpiPiJ/AwSHTAKU9voCVjRv8NbGGBLmCMgi20vaXmcpiPiJ.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 100 — crédito presumido',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/wBo5uLzOCcTkWFxevl38izFosovlZJ2SSjVB5iCg/wBo5uLzOCcTkWFxevl38izFosovlZJ2SSjVB5iCg.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 103 — crédito presumido',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/q9HsHteAApQyuIvNzreV5U05FVGptBjhBpjzuM1G/q9HsHteAApQyuIvNzreV5U05FVGptBjhBpjzuM1G.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 104 — split payment',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/gwOngDtzi9MWl6wmyYrCp7Z0WF30USVGdQZgfL68/gwOngDtzi9MWl6wmyYrCp7Z0WF30USVGdQZgfL68.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 114 — imposto seletivo',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/ylk7lqFJMNO0OzdukbGhFmE8WM1oxipxFCdRDYP9/ylk7lqFJMNO0OzdukbGhFmE8WM1oxipxFCdRDYP9.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 117 — crédito presumido',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/Q7nOJItbVKYhjLOm3kXRXcmzEZxqZ3N19CiPmYHv/Q7nOJItbVKYhjLOm3kXRXcmzEZxqZ3N19CiPmYHv.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 120 — imposto seletivo',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/SZSzDaMYW1mHQG3YLwFVXfBtkG6XkixClgQOpbqv/SZSzDaMYW1mHQG3YLwFVXfBtkG6XkixClgQOpbqv.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 122 — imposto seletivo',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/PWts06hhZdWY1l6VzdgjdWICZsl8KrvCuFZd0Atp/PWts06hhZdWY1l6VzdgjdWICZsl8KrvCuFZd0Atp.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 123 — reforma tributária',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/dWTDJgK6cD73wt6kGZyy4cUwiaDlsTV4MGzbexT4/dWTDJgK6cD73wt6kGZyy4cUwiaDlsTV4MGzbexT4.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 138 — crédito presumido',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/uaC5oe3sctHBRUrIb0q3DLRrS8rqvrk3O0YYLiE7/uaC5oe3sctHBRUrIb0q3DLRrS8rqvrk3O0YYLiE7.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 142 — crédito presumido',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/G91XLIdreYSOhP3Tn7LHg0j1XuaBzD0COQqJZzmU/G91XLIdreYSOhP3Tn7LHg0j1XuaBzD0COQqJZzmU.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 147 — crédito presumido',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/W7rJr2Fno31g075motLVgNzI3N6rqVpv0QGRGBz7/W7rJr2Fno31g075motLVgNzI3N6rqVpv0QGRGBz7.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 166 — crédito presumido',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/1ba1ZJJkO1J1TOW24fmQBUSgFTRukN108H9l3cr6/1ba1ZJJkO1J1TOW24fmQBUSgFTRukN108H9l3cr6.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 169 — crédito presumido',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/jeG6rIkhiWQ1IXDOMYMrTO5bW1Vl29gQvcaARmnE/jeG6rIkhiWQ1IXDOMYMrTO5bW1Vl29gQvcaARmnE.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 170 — crédito presumido',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/GJAB91XJ6cANxxrtPhJaT2rbq2zEA7pYXoogkxw2/GJAB91XJ6cANxxrtPhJaT2rbq2zEA7pYXoogkxw2.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 181 — crédito presumido',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/rzvrTlAdp7cAEHBNTJezLTszAHMqCQJxVgCHEOQx/rzvrTlAdp7cAEHBNTJezLTszAHMqCQJxVgCHEOQx.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 20 — crédito presumido',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/LnBwdBuMf6c36BZh0cs3rCYohnkdYubESCVHpVNw/LnBwdBuMf6c36BZh0cs3rCYohnkdYubESCVHpVNw.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 21 — reforma tributária',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/VCbbBS2w4ItrYGTVBUUvr5Y1tv4DRHp9iw0WaHYF/VCbbBS2w4ItrYGTVBUUvr5Y1tv4DRHp9iw0WaHYF.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 26 — crédito presumido',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/YHBV7ZDqA3yJ0EaKzK9CNo4ARxJkMdqSn6rn9wmb/YHBV7ZDqA3yJ0EaKzK9CNo4ARxJkMdqSn6rn9wmb.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 27 — reforma tributária',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/Ly1OwzBlUqaHx5s6BSphPqWv9qiJ28i19ZVDpkxc/Ly1OwzBlUqaHx5s6BSphPqWv9qiJ28i19ZVDpkxc.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 29 — imposto seletivo',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/cJVYStEJ114yGa2wTUK7uU8RRJMdKzVfBDHpBlcU/cJVYStEJ114yGa2wTUK7uU8RRJMdKzVfBDHpBlcU.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 41 — crédito presumido',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/4umwNudUnFufgOwM855y1QfGalPUXH6LGJ3cSHKk/4umwNudUnFufgOwM855y1QfGalPUXH6LGJ3cSHKk.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 43 — imposto seletivo',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/wXtkxm3A1eN9Vip1xI8vPMb0C6PJFaoi0YBTqZjU/wXtkxm3A1eN9Vip1xI8vPMb0C6PJFaoi0YBTqZjU.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 46 — imposto seletivo',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/slx5P8NP0X4ZUiqviUQ0ePUWPKO5d6crZCAXuUq2/slx5P8NP0X4ZUiqviUQ0ePUWPKO5d6crZCAXuUq2.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 49 — crédito presumido',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/QNup2DtUoqA3B9eWUMByxhPsI6GgcGcuyrdsu9Z2/QNup2DtUoqA3B9eWUMByxhPsI6GgcGcuyrdsu9Z2.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 53 — imposto seletivo',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/SHQqHsrSouUbh5gUAx9pZkgtYvEuGQ1pHInyQJQT/SHQqHsrSouUbh5gUAx9pZkgtYvEuGQ1pHInyQJQT.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 61 — transição tributária',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/EI3DFXCiCSZIVt6ipyuCdbkAqixWG61tMNh0KsFr/EI3DFXCiCSZIVt6ipyuCdbkAqixWG61tMNh0KsFr.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 62 — imposto seletivo',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/kUrz6P6FKgjDZoXPP4BaMxYTkwWMJd4PEU0xyqNv/kUrz6P6FKgjDZoXPP4BaMxYTkwWMJd4PEU0xyqNv.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 67 — crédito presumido',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/BMz5I4NzzQnn5msXbIotFr6A4cSTe6f842WFHYp3/BMz5I4NzzQnn5msXbIotFr6A4cSTe6f842WFHYp3.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 69 — imposto seletivo',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/TMN769IehnnZQcdQc0ix3ppn9YyeEoqL8oJJzi2o/TMN769IehnnZQcdQc0ix3ppn9YyeEoqL8oJJzi2o.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 74 — imposto seletivo',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/toNszwSr7tlayTWrQprk4nKu4ZenZgxLqLmb5bpf/toNszwSr7tlayTWrQprk4nKu4ZenZgxLqLmb5bpf.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 75 — imposto seletivo',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/CRm5DXJKnx1VQBpQp84SevPJPuUOuD0nUye6RySR/CRm5DXJKnx1VQBpQp84SevPJPuUOuD0nUye6RySR.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 77 — imposto seletivo',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/8Dw442dCPaHVPQiibOP5Qns8H60Fz0Qb77OKQ728/8Dw442dCPaHVPQiibOP5Qns8H60Fz0Qb77OKQ728.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 81 — crédito presumido',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/swjY3nGto8mPQZEDGE8LTGmGiaGGM7YS0smx3YJa/swjY3nGto8mPQZEDGE8LTGmGiaGGM7YS0smx3YJa.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 82 — imposto seletivo',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/Z6ub5iW95TfF1cLUo2NWNk0Xpy5839uXT5uFdDoe/Z6ub5iW95TfF1cLUo2NWNk0Xpy5839uXT5uFdDoe.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 83 — imposto seletivo',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/3X760pNFoqhx9l939t4tZfHU9BPD6PY1CVv94cha/3X760pNFoqhx9l939t4tZfHU9BPD6PY1CVv94cha.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'CE',
      titulo: 'Diário da Assembleia do Ceará — Ano 2 Número 89 — reforma tributária',
      url: 'https://doalece.al.ce.gov.br/storage_doalece/edicoes/B7dfL6pfzetwRF1IvcAIykfm8pgXfVSLbZxtIrJN/B7dfL6pfzetwRF1IvcAIykfm8pgXfVSLbZxtIrJN.pdf',
      assoc: 'estadual',
      nivel: 'estadual',
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
      uf: 'PE',
      titulo:
        '), fundamentado no Plano de Aquisições – PA, Código P9976, Produto: P1.2 – Subproduto: 1.2.2, do Contrato de Empréstimo 4554/OC-BR - PROFISCO II - PE, objetivan',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PE',
      titulo:
        '. - ADEPE Portaria Conjunta SDEC/SEFAZ/SEPLAG/ADEPE Nº 001/2025 Institui o Grupo de Trabalho para Avaliação dos Impactos da Reforma Tributária no Estado de Pern',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PE',
      titulo:
        '1048 - Autorizar o afastamento do Estado, tendo em vista a solicitação do Secretário de Turismo e Lazer, de HAMILTON BARROS FALCÃO, da referida Secretaria, para',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PE',
      titulo:
        '4554/OC-BR - PROFISCO-PE, cujo objeto é a contratação de serviços especializados de consultoria envolvendo planejamento, facilitação, condução e sistematização ',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PE',
      titulo:
        'Além disso, o Governo man- teve as alíquotas reduzidas para caminhões e ônibus; automóveis movidos a gás natural vei- cular (GNV) ou avaliados em até R$ 100 mil',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PE',
      titulo:
        'EXISTÊNCIA DE LEGISLAÇÃO POSTERIOR COM PREVISÃO DE ALÍQUOTA REDUZIDA . OBSERVÂNCIA DA NORMA VIGENTE À ÉPOCA DO FATO GERADOR.',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PE',
      titulo:
        'Estado, tendo em vista a solicitação da Gerente Geral de Obras, da Secretaria de Desenvolvimento Urbano e Habitação, de GICELI ELISIO DE BARROS MARTINS, da refe',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PE',
      titulo:
        'Formular estudos e diagnósticos sobre os impactos da reforma tributária nacional (IBS, CBS, redistribuição de receitas, incentivos estaduais) sobre os setores e',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PE',
      titulo:
        'Impossibilidade de aplicação da alíquota reduzida de 2% prevista na Lei Complementar nº 563/2025, por não se tratar de transmissão ocorrida por doação, tampouco',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PE',
      titulo:
        'Impossibilidade de aplicação da alíquota reduzida de 2% prevista na Lei do PERC de 2025, por não se tratar de transmissões ocorridas por doação, tampouco ocorri',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PE',
      titulo:
        'Imposto sobre Bens e Serviços - CGIBS; o interesse público na mútua colaboração entre a Administração Tributária do Estado de Pernambuco e o Comitê Gestor do IB',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PE',
      titulo:
        'Itens como telefones celulares e câmeras digitais não se enquadram como produtos de informática para fins de alíquota reduzida . 8.',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PE',
      titulo:
        'LEGITIMIDADE DA APLICAÇÃO DA ALÍQUOTA REDUZIDA NAS OPERAÇÕES INTERESTADUAIS. IMPOSSIBILIDADE DE EXTENSÃO DO BENEFÍCIO ÀS OPERAÇÕES INTERNAS, POR AUSÊNCIA DE AMP',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PE',
      titulo:
        'Lei Complementar nº 214/2025, que institui o Imposto sobre Bens e Serviços (IBS), a Contribuição Social sobre Bens e Serviços (CBS) e o Imposto Seletivo (IS); c',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PE',
      titulo:
        'Lei Complementar nº 214/2025, que institui o Imposto sobre Bens e Serviços (IBS), a Contribuição Social sobre Bens e Serviços (CBS) e o Imposto Seletivo (IS); c',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PE',
      titulo:
        'Licitatório nº 1136.2026.CPL.II.IN.1125.EMPETUR, referente a Contratação direta da empresa "OPEN SOLUÇÕES TRIBUTÁRIAS LTDA”, para participação de de 01 (um) ser',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PE',
      titulo:
        'Nesta edição, o foco será a Reforma Tributária , um dos principais debates econômicos do país, incentivando os docentes a trabalharem o tema “Refor- ma Tributár',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PE',
      titulo:
        'Nº 1348 - Autorizar o afastamento do Estado, tendo em vista a solicitação do Secretário da Fazenda, de CARLOS ALBERTO DE MIRANDA MEDEIROS, da referida Secretari',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PE',
      titulo:
        'Nº 1348 - Autorizar o afastamento do Estado, tendo em vista a solicitação do Secretário da Fazenda, de CARLOS ALBERTO DE MIRANDA, da referida Secretaria, para p',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PE',
      titulo:
        'Nº 653 - Autorizar o afastamento do Estado, tendo em vista a solicitação do Secretário de Comunicação, de FERNANDO FÁBIO FILHO SOUTO MAIOR, da referida Secretar',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PE',
      titulo:
        'Objeto: Viabilizar a aquisição de participação em Curso de Reforma Tributária para Órgãos Públicos e Sistema S. Número do empenho: 2026NE000841 - Data de empenh',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PE',
      titulo:
        'Orçamentária Concessões e PPPs Prestação de Contas Manual da Despesa Pública Manual do Ordenador de Despesas Planejamento Financeiro e Orçamentário Convênios e ',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PE',
      titulo:
        'Patrocínio do evento “ENCONTRO DOS PROCURADORES DO ESTADO DE PE.E I SEMINÁRIO SOBRE O IMPACTO DA REFORMA TRIBUTÁRIA DA PGE/PE” de 20 a 21 de agosto de 2025, e 0',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PE',
      titulo:
        'Reforma Tributária A Reforma Tributária foi aprovada pela Emenda Constitucional nº 132, de 2023, com o objetivo principal de simplifi car os tributos sobre o co',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PE',
      titulo:
        'Reforma Tributária Foi promulgada em 20 de dezembro de 2023, a Emenda Constitucional nº 132/2023, que instituiu a reforma tributária do consumo no Brasil, que e',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PE',
      titulo:
        'SECRETARIA DA FAZENDA EXTRATO DE CONTRATOS C-PROFISCO 023/25 LESEN LIVRARIA LTDA CNPJ:31.719.665/0002-64 Curso da Reforma Tributária 40h Ass:17/11/2025 Vigência',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PE',
      titulo:
        'Tributária – GERT, com duração prevista até 31.12.2026, podendo ser prorrogado a critério da Administração Fazendária. Art. 2º São objetivos do GERT: I – mapear',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PE',
      titulo:
        'alterações, RESOLVE: Nº 875 - Autorizar o afastamento do Estado, tendo em vista solicitação do Secretário da Fazenda, de ANTONIO MACHADO GUEDES ALCOFORADO, da r',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PE',
      titulo:
        'atual, baseado nos tributos ICMS, ISS, PIS, COFINS e IPI, e o novo modelo, que introduz o IVA, composto pelo Imposto sobre Bens e Serviços (IBS), e a Contribuiç',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PE',
      titulo:
        'da Fazenda, de MATHEUS GONÇALVES LUNA, da referida Secretaria, para participar do Curso de Retenções Tributárias, Escrituração Fiscal, DCTFWeb, novo Módulo de I',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'PE',
      titulo:
        'suas finalidades, o Comitê deverá acompanhar as transformações econômicas, regulatórias e institucionais que impactem o ambiente de negócios do Estado de Pernam',
      url: 'https://diariooficial.cepe.com.br/diariooficialweb/#/visualizar-publicacao',
      assoc: 'estadual',
      nivel: 'estadual',
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
      uf: 'RJ',
      titulo: 'ATO DO ORDENADOR DE DESPESAS PORTARIA GSI Nº 085',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/ab334c1a-f39b-4af1-864d-3f59240a81a9/download/2026-10-02.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'ATO DO ORDENADOR DE DESPESAS PORTARIA GSI Nº 085',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/ab334c1a-f39b-4af1-864d-3f59240a81a9/download/2026-10-02.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'ATO DOS PROCURADORES-GERAIS RESOLUÇÃO CONJUNTA PGE/PGM Nº 231',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/ab334c1a-f39b-4af1-864d-3f59240a81a9/download/2026-10-02.json',
      assoc: 'estadual',
      nivel: 'estadual',
    },
    {
      uf: 'RJ',
      titulo: 'ATO DOS PROCURADORES-GERAIS RESOLUÇÃO CONJUNTA PGE/PGM Nº 231',
      url: 'https://dadosabertos.rj.gov.br/dataset/f2c05af8-2077-4cc4-b015-39266feba0be/resource/ab334c1a-f39b-4af1-864d-3f59240a81a9/download/2026-10-02.json',
      assoc: 'estadual',
      nivel: 'estadual',
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
        'ambiental, em conformidade com a Lei nº 8.628, de 05 de dezembro de 2019, bem como no atendimento às disposições da Emenda Constitucional (Federal) nº 132, de 2',
      url: 'https://iose.se.gov.br/diario-oficial',
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
      uf: 'AL',
      nome: 'Diário Oficial de Alagoas',
      ativo: true,
      modo: 'POST editions/searchES (Laravel+Elasticsearch) com trecho destacado',
      hits: 0,
      amostra: [],
    },
    {
      uf: 'ES',
      nome: 'Consulta Normas ES (SEGER)',
      ativo: true,
      modo: 'API oficial REST com Swagger (POST /Buscar, descricao + período)',
      hits: 0,
      amostra: [],
    },
    {
      uf: 'MG',
      nome: 'Jornal Minas Gerais (DIOE/MG)',
      ativo: true,
      modo: 'API oficial com JWT anônimo (POST Autenticar {}) + busca paginada',
      hits: 10,
      amostra: [
        'almente substituidos pela Contribuicao s',
        'O DIAMETRO SERVICO COMPLEMENTAR / CARACT',
        'dias uteis; 100% em ate 10 dias uteis, a',
      ],
    },
    {
      uf: 'MS',
      nome: 'Diário Oficial de MS (DOE/MS)',
      ativo: true,
      modo: 'API aberta (Next.js) com trecho destacado, data e PDF da edição',
      hits: 0,
      amostra: [],
    },
    {
      uf: 'MT',
      nome: 'Diário Oficial de MT (IOMAT)',
      ativo: true,
      modo: 'PDF integral da edição (a busca do portal devolve só agregações)',
      hits: 0,
      amostra: [],
    },
    {
      uf: 'PR',
      nome: 'Diário Oficial do PR (DIOE)',
      ativo: true,
      modo: 'Elasticsearch aberto, busca textual + filtro de data no path',
      hits: 20,
      amostra: [
        '99 4ª FEIRA |28/OUT/2026 - EDIÇÃO N° 12.',
        '98 4ª FEIRA |28/OUT/2026 - EDIÇÃO N° 12.',
        '97 4ª FEIRA |28/OUT/2026 - EDIÇÃO N° 12.',
      ],
    },
    {
      uf: 'RJ',
      nome: 'Diário Oficial do RJ — dados abertos',
      ativo: true,
      modo: 'JSON diário completo (parte→seção→atos com texto integral), cobre o ano corrente',
      hits: 22,
      amostra: ['IV - Editais: Avisos', 'I - Portaria', 'I - Resolução Conjunta'],
    },
    {
      uf: 'RR',
      nome: 'Diário Oficial de Roraima (Imprensa Oficial)',
      ativo: true,
      modo: 'POST /_visualizar-doe/ baixa o PDF do dia; texto via pdftotext',
      hits: 0,
      amostra: [],
    },
    {
      uf: 'RS',
      nome: 'DOE/RS',
      ativo: true,
      modo: 'API textual (atas) + PDF integral (leis/decretos)',
      hits: 3,
      amostra: ['Comsefaz', 'CGIBS', 'Comsefaz'],
    },
    {
      uf: 'SC',
      nome: 'Diário Oficial de SC (DOE)',
      ativo: true,
      modo: 'API oficial (POST busca-materia, tipoBusca 2) + filtro de data no cliente',
      hits: 1,
      amostra: ['PORTARIA N° 3724 de 26/10/2026 A SECRETÁ'],
    },
    {
      uf: 'SE',
      nome: 'Diário Oficial de Sergipe (IOSE)',
      ativo: true,
      modo: 'Elasticsearch com texto completo (mesma plataforma do PR, com documentos)',
      hits: 3,
      amostra: [
        'ambiental, em conformidade com a Lei nº ',
        'Art. 2º Este Decreto entra em vigor na d',
        'quinta-feira, 15 de Outubro de 2026 Arac',
      ],
    },
    {
      uf: 'SP',
      nome: 'Diário Oficial do SP (DOE)',
      ativo: true,
      modo: 'API oficial de busca textual (v2/advanced-search)',
      hits: 14,
      amostra: [
        'EDITAL Nº 106/2026, DE 1 DE OUTUBRO DE 2',
        'EDITAL Nº 95/2026, DE 1 DE OUTUBRO DE 20',
        'PREGÃO ELETRÔNICO Nº 005/2026 - COMUNICA',
      ],
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
        {/* overflow-x-auto: em celular a tabela de atos (UF + Ato + link) é mais
            larga que a coluna e estourava a página. Com o eixo X rolável, a
            tabela rola dentro do próprio quadro e o documento nunca passa da
            largura da tela. */}
        <div className="max-h-[420px] overflow-y-auto overflow-x-auto">
          <table className="w-full min-w-[420px] text-left">
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
