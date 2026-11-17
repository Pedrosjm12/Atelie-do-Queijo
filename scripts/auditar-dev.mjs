#!/usr/bin/env node
// Auditoria das dependências de desenvolvimento (P88 = A, com exceção documentada).
// Reprova qualquer avisos `high` ou `critical`, menos os da lista EXCECOES.
// `npm audit` não tem lista de exceções própria; este script lê `npm audit --json`.
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// Exceções aprovadas pelo dono em 2026-11-17 (P88 = A, opção B do alerta do picomatch).
// Cada uma só vale enquanto não existir versão corrigida. REMOVER quando o pacote corrigir.
export const EXCECOES = [
  {
    ghsa: 'GHSA-fc5q-39xc-vjpf',
    // Depois desta data o CI reprova até alguém reavaliar (ou remover) a exceção.
    revisarAte: '2027-01-31',
    motivo:
      'picomatch <= 4.0.7 (ReDoS), sem versão corrigida (first_patched_version: null). Só desenvolvimento: entra por vitest, vite, tinyglobby, fdir e eslint-config-next; `npm audit --omit=dev` segue limpo.',
  },
];

const GRAVES = new Set(['high', 'critical']);

/** Verdadeiro quando a data de revisão da exceção já passou. */
export function excecaoVencida(excecao, agora = new Date()) {
  return agora > new Date(`${excecao.revisarAte}T23:59:59Z`);
}

/** Devolve os avisos graves que não estão na lista de exceções. */
export function avisosGraves(relatorio, excecoes = EXCECOES) {
  const ignorados = excecoes.map((e) => e.ghsa);
  const achados = [];
  for (const [pacote, v] of Object.entries(relatorio.vulnerabilities ?? {})) {
    for (const via of v.via ?? []) {
      // `via` em texto só aponta para outro pacote; o aviso de verdade é o objeto.
      if (typeof via === 'string' || !GRAVES.has(via.severity)) continue;
      if (ignorados.some((id) => String(via.url ?? '').includes(id))) continue;
      achados.push({ pacote, severidade: via.severity, titulo: via.title, url: via.url });
    }
  }
  return achados;
}

function main() {
  let saida;
  try {
    // Sem `shell`: chama o JS do npm com o Node atual (funciona no Windows e no Linux).
    const npmCli = process.env.npm_execpath;
    const [cmd, args] = npmCli
      ? [process.execPath, [npmCli, 'audit', '--json']]
      : ['npm', ['audit', '--json']];
    saida = execFileSync(cmd, args, { encoding: 'utf8' });
  } catch (erro) {
    // `npm audit` sai com 1 quando há achados; o JSON continua na saída padrão.
    saida = erro.stdout;
    if (!saida) {
      console.error('npm audit não produziu saída:', erro.message);
      process.exit(2);
    }
  }
  const relatorio = JSON.parse(saida);
  if (relatorio.error) {
    console.error('npm audit falhou:', relatorio.error.summary ?? relatorio.error);
    process.exit(2);
  }
  const vencidas = EXCECOES.filter((e) => excecaoVencida(e));
  if (vencidas.length > 0) {
    for (const e of vencidas)
      console.error(`Exceção ${e.ghsa} venceu em ${e.revisarAte}: reavalie ou remova.`);
    process.exit(1);
  }
  for (const e of EXCECOES) console.log(`Exceção ativa ${e.ghsa}: ${e.motivo}`);
  const achados = avisosGraves(relatorio);
  if (achados.length > 0) {
    console.error('Avisos high/critical em desenvolvimento sem exceção:');
    for (const a of achados) console.error(`- ${a.pacote} (${a.severidade}): ${a.titulo} ${a.url}`);
    process.exit(1);
  }
  console.log('Auditoria de desenvolvimento: nenhum aviso high/critical fora das exceções.');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
