# ADR-0001 — Stack: Next.js App Router, React, TypeScript e CSS Modules

- **Status:** Aceito
- **Data:** 2026-10-26

## Contexto

A spec (§2) define a stack do Ateliê do Queijo: Next.js com App Router, TypeScript e React; CSS com variáveis em `app/globals.css` e CSS Modules por componente; fontes via `next/font/google`; nenhum framework de UI pronto, porque o visual é todo próprio e exige fidelidade de pixel (§0). O repositório não tinha stack definida.

## Decisão

- **Next.js (App Router) + React + TypeScript** com `strict: true`. Server Components por padrão; `"use client"` só onde há interatividade (sacola, menu mobile, botão de atendimento, visualizador 3D, quiz, abas, painel de atendimento).
- **Versões:** a estável mais recente de Next.js e React no momento da instalação. A versão de referência é a registrada no `package.json` e no `package-lock.json`; atualizações de versão principal exigem novo ADR ou atualização deste.
- **Estilo:** variáveis CSS em `app/globals.css` com os tokens da §3 e **CSS Modules** por componente (`Componente.module.css`). Sem Tailwind, sem CSS-in-JS, sem biblioteca de componentes.
- **Fontes:** `next/font/google` com `Cormorant_Garamond` (500 e 600, normal e itálico) e `Manrope` (400, 500, 600, 700), `display: "swap"`, expostas como variáveis CSS.
- **Estrutura:** a da spec §2 na raiz do repositório (`app/`, `components/`, `data/`, `lib/`, `public/models/`), sem pasta `src/`.
- **Dependências futuras já previstas pela spec:** `@google/model-viewer` (etapa 5) e Zod para validar dados externos na borda. Cada uma será confirmada em ADR quando for instalada.

## Alternativas consideradas

- **Tailwind CSS:** acelera prototipagem, mas a spec já fornece valores exatos e CSS literal; traduzir para classes utilitárias aumenta o risco de desvio e adiciona uma dependência de build. Rejeitada.
- **Biblioteca de UI (shadcn/ui, Radix, MUI, Chakra):** contraria a spec ("não use frameworks de UI prontos") e traz estilos que precisariam ser desfeitos. Rejeitada. Primitivas acessíveis serão escritas à mão (abas, menu, painel), seguindo os padrões WAI-ARIA.
- **CSS-in-JS (styled-components, Emotion):** custo em tempo de execução e atrito com Server Components. Rejeitada.
- **Pasta `src/`:** comum, mas a spec mostra a estrutura na raiz; segui-la literalmente reduz ambiguidade entre agentes. Rejeitada.
- **Fixar uma versão específica do Next.js neste ADR:** envelhece rápido; preferimos registrar a versão real no `package.json` e conferir a documentação oficial correspondente.

## Consequências

- O CSS enviado é só o que os componentes usam; os tokens ficam centralizados e verificáveis contra a §3.1.
- Componentes acessíveis complexos (abas, menu, diálogo) serão implementados e testados internamente, o que exige atenção do `especialista-em-acessibilidade`.
- Todos os agentes devem consultar a documentação da versão instalada do Next.js antes de usar APIs (ex.: `next lint`, cache, `params` assíncronos), em vez de confiar na memória.
