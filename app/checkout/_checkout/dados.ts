import {
  LINHAS_MAXIMAS_DA_MENSAGEM,
  TAMANHO_MAXIMO_DA_MENSAGEM,
  type CampoDoCheckout,
} from '@/lib/pedido';

// Dados da etapa 1. Vivem SÓ em memória (P37): nada daqui vai para localStorage, sessionStorage,
// cookie ou URL.

export type CampoDeEntrega = Exclude<CampoDoCheckout, 'pagamento'>;

/** Erros por campo, sempre com as mensagens fixas de `MENSAGENS_DE_ERRO` (nunca o valor digitado). */
export type ErrosDoCheckout = Partial<Record<CampoDoCheckout, string>>;

export type DadosDaEntrega = Record<CampoDeEntrega, string>;

export const DADOS_INICIAIS: DadosDaEntrega = Object.freeze({
  nome: '',
  email: '',
  telefone: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  mensagem: '',
  dataDeEntrega: '',
});

/** Rótulos visíveis (e nomes no resumo de erros). Mensagem e data: P25; os demais, textos novos. */
export const ROTULOS: Readonly<Record<CampoDeEntrega, string>> = Object.freeze({
  nome: 'Nome completo',
  email: 'E-mail',
  telefone: 'Telefone',
  cep: 'CEP',
  logradouro: 'Rua ou avenida',
  numero: 'Número',
  complemento: 'Complemento (opcional)',
  bairro: 'Bairro',
  cidade: 'Cidade',
  uf: 'Estado',
  mensagem: 'Mensagem do cartão',
  dataDeEntrega: 'Data de entrega',
});

/** Ordem em que os campos aparecem na tela (e no resumo de erros). */
export const ORDEM_DOS_CAMPOS: readonly CampoDeEntrega[] = [
  'nome',
  'email',
  'telefone',
  'cep',
  'logradouro',
  'numero',
  'complemento',
  'bairro',
  'cidade',
  'uf',
  'mensagem',
  'dataDeEntrega',
];

/** O que `validarEntrega` espera. O bloco do presente só entra se o pedido for presente. */
export function montarEntrada(dados: DadosDaEntrega, presente: boolean): unknown {
  return {
    cliente: { nome: dados.nome, email: dados.email, telefone: dados.telefone },
    endereco: {
      cep: dados.cep,
      logradouro: dados.logradouro,
      numero: dados.numero,
      complemento: dados.complemento,
      bairro: dados.bairro,
      cidade: dados.cidade,
      uf: dados.uf,
    },
    presente: presente ? { mensagem: dados.mensagem, dataDeEntrega: dados.dataDeEntrega } : null,
  };
}

/** "(11) 91234-5678": DDD entre parênteses e hífen antes dos 4 últimos dígitos (até 11 dígitos). */
export function mascararTelefone(entrada: string): string {
  const d = entrada.slice(0, 40).replace(/\D/g, '').slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  if (resto.length <= 4) return `(${ddd}) ${resto}`;
  const corte = d.length === 11 ? 5 : 4;
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}

/** Mesma contagem do esquema: trim, `\r\n` e `\r` viram `\n`; conta por ponto de código (emoji = 1). */
export function medirMensagem(texto: string): { caracteres: number; linhas: number } {
  const normalizado = texto.trim().replace(/\r\n?/g, '\n');
  return {
    caracteres: Array.from(normalizado).length,
    linhas: normalizado.split('\n').length,
  };
}

export const LIMITE_DE_CARACTERES = TAMANHO_MAXIMO_DA_MENSAGEM;
export const LIMITE_DE_LINHAS = LINHAS_MAXIMAS_DA_MENSAGEM;
