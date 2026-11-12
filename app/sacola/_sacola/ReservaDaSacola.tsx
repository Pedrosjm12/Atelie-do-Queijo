import { CHAVE_DA_SACOLA } from '@/lib/sacola';

/**
 * Server Component: `<script>` síncrono que roda ainda no parse, antes da primeira pintura, e marca o
 * contêiner da página (`data-sacola`, `--n` e `data-presente`) com o número de linhas guardadas no
 * `localStorage` e a marca de embalagem para presente. O CSS usa isso para reservar a altura do
 * estado final (vazia, 1, 2, 3..., com ou sem presente) e o rodapé não se mexe quando a sacola
 * hidrata (CLS). Conteúdo constante: só a chave do `localStorage` entra, sem entrada de usuário. Sem
 * JS ou com erro de leitura, vale a reserva padrão do CSS. Quem lê a sacola de verdade continua
 * sendo o `SacolaProvider`. Trava: `e2e/reserva-da-sacola.spec.ts`.
 *
 * Limites conhecidos: `n` é a contagem bruta do `localStorage` (item fora do catálogo ou duplicado
 * reserva uma linha a mais; caso raro). O script depende de `'unsafe-inline'` em `script-src`
 * (`lib/cabecalhos.ts`): se a CSP migrar para nonce ou hash, ele para de rodar e vale a reserva
 * padrão de 320 px, então será preciso pôr o nonce aqui. Em navegação no cliente ele não roda, nem
 * precisa: a sacola já está pronta e a página monta direto no estado final.
 */
const CODIGO = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(CHAVE_DA_SACOLA)})),n=s&&s.v===1&&Array.isArray(s.itens)?Math.min(s.itens.length,20):0,e=document.currentScript.parentElement;e.dataset.sacola=n?"cheia":"vazia";if(n&&s.presente===true)e.dataset.presente="1";e.style.setProperty("--n",String(n))}catch(x){}})()`;

export function ReservaDaSacola() {
  return <script dangerouslySetInnerHTML={{ __html: CODIGO }} />;
}
