import 'server-only';
import type { Cep, PedidoPrecificado, ResultadoDoFrete, ResultadoDoPedido } from './commerce';

// Módulo SÓ DO SERVIDOR (ADR-0008 §3): as implementações SIMULADAS de `calcularFrete` e
// `criarPedido` ficam aqui, longe do pacote do navegador, porque a integração real (transportadora
// e gateway) trará segredos. Quem as chama são os Server Actions. As funções puras de cliente
// (`precoNoPix`, `mascararCep`, `faltaParaFreteGratis`, `valorDoFrete`, `calcularTotais`) ficam em
// `commerce.ts`. O `import 'server-only'` é tratado pelo próprio Next (o pacote npm é opcional;
// ver "Preventing environment poisoning" na documentação do Next 16), então não há dependência nova.

/** Último CEP da faixa simulada de "fora de área": 00999-999 (P28). */
const ULTIMO_CEP_FORA_DE_AREA = 999_999;

/**
 * SIMULADO. Faixa 00000-000 a 00999-999 (não existe nos Correios) → fora de área (P28); os demais
 * → atendido com prazo e valor `null` (lacunas `[N]` e `R$ [PREÇO]`, P27). A tabela real vem com
 * a transportadora; `async` desde já para a troca não mudar quem chama. Defensiva: o `Cep` é só
 * uma marca de tipo, então confere em tempo de execução que é texto de 8 dígitos; senão, trata
 * como fora de área.
 */
export async function calcularFrete(cep: Cep): Promise<ResultadoDoFrete> {
  if (typeof cep !== 'string' || !/^\d{8}$/.test(cep)) return { situacao: 'fora-de-area' };
  if (Number(cep) <= ULTIMO_CEP_FORA_DE_AREA) return { situacao: 'fora-de-area' };
  return { situacao: 'atendido', prazoDiasUteis: null, valor: null };
}

const DIGITOS_DO_NUMERO = 6;
const FAIXA_DO_NUMERO = 10 ** DIGITOS_DO_NUMERO;

/**
 * Inteiro uniforme em [0, FAIXA_DO_NUMERO) com o gerador criptográfico da plataforma
 * (`crypto.getRandomValues`, Web Crypto) e rejeição do resto, sem viés de módulo.
 */
function sortearDigitos(): string {
  const limite = Math.floor(2 ** 32 / FAIXA_DO_NUMERO) * FAIXA_DO_NUMERO;
  const buffer = new Uint32Array(1);
  let n: number;
  do {
    globalThis.crypto.getRandomValues(buffer);
    n = buffer[0] ?? limite;
  } while (n >= limite);
  return String(n % FAIXA_DO_NUMERO).padStart(DIGITOS_DO_NUMERO, '0');
}

// SIMULAÇÃO: remover com o gateway
const EMAIL_QUE_RECUSA_O_PAGAMENTO = 'recusa@exemplo.com'; // domínio reservado (RFC 2606)

/**
 * SIMULADO (spec §2: `criarPedido(sacola)`; aqui recebe o pedido já validado e precificado).
 * Não grava nada e não registra nada em log. O número ("AQ-" + 6 dígitos, gerado no servidor com
 * gerador criptográfico) é só RÓTULO DE EXIBIÇÃO: nunca use como chave de acesso nem como prova de
 * posse do pedido. Com 6 dígitos há só 1 milhão de números, então ele NÃO é único por si: quando
 * houver persistência, a unicidade tem de ser garantida no banco (índice único, com nova tentativa
 * em caso de colisão) ou o número passa a ter 8 dígitos (ADR-0008). Recusa o pagamento quando
 * `cliente.email` for `recusa@exemplo.com`, para testar o erro da §10.2.
 */
export async function criarPedido(pedido: PedidoPrecificado): Promise<ResultadoDoPedido> {
  // SIMULAÇÃO: remover com o gateway
  if (pedido.cliente.email.toLowerCase() === EMAIL_QUE_RECUSA_O_PAGAMENTO) {
    return { ok: false, motivo: 'pagamento-recusado' };
  }
  return {
    ok: true,
    numero: `AQ-${sortearDigitos()}`,
    email: pedido.cliente.email,
    totais: pedido.totais,
  };
}
