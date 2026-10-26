# Skills recomendadas para o Ateliê do Queijo

Skills são pastas de instruções (`SKILL.md`) que o Claude Code carrega sozinho quando a tarefa pede. Elas complementam os 13 agentes: o **agente** define *quem* faz e *quando*; a **skill** ensina *como* fazer bem.

Última verificação: 22/10/2026. Para cada skill abaixo, conferi no repositório oficial o nome, a descrição e a licença. **Não li o conteúdo completo de todas**; leia o `SKILL.md` de qualquer skill antes de instalar, pois ela passa a dar ordens ao Claude.

---

## 1. Instalar já (núcleo)

| Skill | Origem e licença | O que faz | Agentes que a usam |
| --- | --- | --- | --- |
| `frontend-design` | Anthropic · Apache-2.0 | Orienta escolhas visuais intencionais (tipografia, composição, detalhes) e evita aparência genérica de IA | `frontend-nextjs`, `guardiao-do-design` |
| `vercel-react-best-practices` | Vercel · MIT | Dezenas de regras de desempenho para React e Next.js, ordenadas por impacto (cascatas de requisições, tamanho do pacote, Server Components) | `frontend-nextjs`, `performance-e-seo`, `revisor-de-codigo` |
| `web-design-guidelines` | Vercel · repositório MIT | Audita o código de interface contra 100+ regras de acessibilidade, desempenho e UX; devolve achados no formato `arquivo:linha` | `especialista-em-acessibilidade`, `guardiao-do-design` |
| `vercel-composition-patterns` | Vercel · repositório MIT | Padrões de composição de componentes (componentes compostos, variantes explícitas, React 19) | `arquiteto-de-software`, `frontend-nextjs` |
| `webapp-testing` | Anthropic · Apache-2.0 | O Claude abre o site local num navegador real (Playwright), clica, tira capturas de tela e lê erros do console | `testes-e-qualidade`, `guardiao-do-design` |
| `accessibility` | Addy Osmani · MIT | Auditoria e correção seguindo WCAG 2.2 (teclado, leitor de tela, contraste) | `especialista-em-acessibilidade` |
| `core-web-vitals` | Addy Osmani · MIT | Otimiza LCP, INP e CLS com evidência de laboratório e de campo | `performance-e-seo` |
| `performance` | Addy Osmani · MIT | Carregamento, imagens, fontes, cache, pacote de JavaScript | `performance-e-seo`, `especialista-3d-webgl` |
| `seo` | Addy Osmani · MIT | Metadados, dados estruturados, sitemap, indexação | `performance-e-seo` |
| `best-practices` | Addy Osmani · MIT | Segurança, compatibilidade e qualidade de código | `revisor-de-codigo`, `auditor-de-seguranca` |
| `web-quality-audit` | Addy Osmani · MIT | Auditoria geral (desempenho, acessibilidade, SEO, boas práticas) estilo Lighthouse | `performance-e-seo`, `testes-e-qualidade` |

### Como instalar

Dentro do Claude Code, na pasta do projeto:

```text
# Anthropic: frontend-design e webapp-testing (vêm no pacote example-skills)
/plugin marketplace add anthropics/skills
/plugin install example-skills@anthropic-agent-skills

# Vercel: as três skills de React/Next.js e a de diretrizes de interface
npx skills add vercel-labs/agent-skills

# Addy Osmani: as seis skills de qualidade web
/plugin marketplace add addyosmani/web-quality-skills
/plugin install web-quality-skills@addy-web-quality-skills
```

Observações:
- O pacote `example-skills` da Anthropic traz também skills que você não precisa (arte algorítmica, GIFs para Slack...). Elas ficam sem uso e só aparecem na lista; se preferir, copie apenas as pastas `frontend-design` e `webapp-testing` para `.claude/skills/` do projeto.
- `npx skills add vercel-labs/agent-skills` instala todas as skills do repositório (inclusive `deploy-to-vercel` e `react-native-skills`, que não são necessárias agora). Se o comando perguntar quais instalar, escolha as quatro da tabela.
- A `web-design-guidelines` baixa as regras mais recentes da internet a cada uso, então precisa de acesso à rede.
- O `webapp-testing` exige Playwright instalado no projeto.

---

## 2. Opcionais, por etapa

| Skill | Quando faz sentido | Observação |
| --- | --- | --- |
| `vercel-react-view-transitions` (Vercel · MIT) | Etapa 7 (polimento): transições suaves entre páginas e do cartão do queijo para a página do produto | Usa a API de View Transitions do React; confirme que a versão do React do projeto a suporta |
| `deploy-to-vercel` (Vercel) | Etapa 9 (publicação), **só depois de você aprovar** criar a conta e publicar | O `CLAUDE.md` já proíbe publicar sem sua aprovação |
| `vercel-optimize` (Vercel) | Depois do site publicado, para reduzir custo e lentidão com base em métricas reais | Só serve com projeto já no ar |
| `stripe-best-practices` (listado em `anthropics/claude-plugins-official`) | **Somente se** o gateway de pagamento escolhido for o Stripe | Não confirmei no repositório; veja a pendência abaixo |
| Segurança da Trail of Bits (`trailofbits/skills`) | Etapa 8, para análise estática mais profunda (CodeQL/Semgrep) | Não verifiquei o repositório; exige instalar essas ferramentas |
| `obra/superpowers` (fluxo com desenvolvimento orientado a testes) | Se quiser forçar "teste primeiro" em toda funcionalidade | Não verifiquei o repositório; pode conflitar com o fluxo do `CLAUDE.md`, então teste numa tarefa pequena antes |

---

## 3. O que eu não recomendo agora

- **Skills de 3D/Three.js de repositórios pequenos.** Há várias nas listas de skills, mas não encontrei nenhuma de origem oficial e não verifiquei a qualidade. Como o visualizador usa `<model-viewer>` (spec, seção do 3D), o agente `especialista-3d-webgl` com a documentação oficial atende melhor. Se quiser, avalio uma a uma antes de você instalar.
- **Pacotes com dezenas de skills "de tudo".** Cada skill instalada adiciona descrição ao contexto do Claude e pode disputar com as outras. Menos skills, bem escolhidas, funcionam melhor.

---

## 4. Cuidado importante: a spec manda

Algumas skills de design (principalmente `frontend-design`) incentivam escolhas visuais ousadas. No Ateliê, **o visual já está fechado** na `ATELIE-DO-QUEIJO-SPEC.md` (paleta, Cormorant Garamond e Manrope, espaçamentos). Acrescente esta regra ao `CLAUDE.md`:

```markdown
## Skills
- As skills de design e de boas práticas ajudam na qualidade da execução, mas a `ATELIE-DO-QUEIJO-SPEC.md` vence qualquer sugestão de skill sobre cores, fontes, textos, medidas e preços.
- Se uma skill sugerir algo que contraria a spec, registre a divergência e pergunte ao dono do projeto.
```

---

## 5. Pendências que dependem de você

1. **Gateway de pagamento** (Mercado Pago, Stripe, Pagar.me...). Ainda não foi decidido; define se vale instalar uma skill de pagamento.
2. **Aprovar a instalação.** Instalar skills é instalar instruções de terceiros; revise o `SKILL.md` de cada uma antes.

---

## Fontes

- [anthropics/skills](https://github.com/anthropics/skills) (frontend-design, webapp-testing)
- [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) (react-best-practices, web-design-guidelines, composition-patterns, react-view-transitions, deploy-to-vercel, vercel-optimize)
- [addyosmani/web-quality-skills](https://github.com/addyosmani/web-quality-skills) (accessibility, core-web-vitals, performance, seo, best-practices, web-quality-audit)
- [14 Best Claude Code Skills for Developers in 2026 (Firecrawl)](https://www.firecrawl.dev/blog/best-claude-code-skills)
- [Best Claude Skills for Frontend Development (agenticskills.io)](https://agenticskills.io/learn/best-frontend-skills)
- [stripe-best-practices (listagem em claudemarketplaces.com)](https://claudemarketplaces.com/skills/anthropics/claude-plugins-official/stripe-best-practices)
