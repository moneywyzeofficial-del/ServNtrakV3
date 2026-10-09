# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 1. Comandos Críticos

### Desenvolvimento

```bash
npm install          # instalar dependências
npm run dev          # servidor de desenvolvimento (porta 5000 — API + cliente via proxy Vite)
npm run build        # build cliente (Vite → dist/public) + servidor (esbuild → dist/index.cjs)
npm start            # executar build de produção
```

### Verificação e Qualidade

```bash
npm run check        # type-check TypeScript (tsc --noEmit) — SEMPRE correr antes de commit
npm run db:push      # aplicar alterações do schema Drizzle à base de dados
```

### Testes Manuais

Não existe test runner configurado. Testes unitários são ficheiros `.test.ts` corridos com `tsx`:

```bash
npx tsx client/src/lib/suggestSlots.test.ts
npx tsx server/pushService.endpointAllowlist.test.ts
```

---

## 2. Arquitetura e Fluxos

### Monorepo

```
client/src/   React 18 SPA (Vite)
server/       Express API + serviços de background
shared/       Schema (Drizzle), tipos de rotas, lógica de agendamento — partilhado entre cliente e servidor
```

**Path aliases** (configurados em `tsconfig.json` e `vite.config.ts`):
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets/*` → `attached_assets/*`

### Fluxo de Dados (Request → Response)

```
Browser
  └─ Hook (client/src/hooks/use-*.ts)          ← TanStack Query / fetch
       └─ shared/routes.ts                      ← definição tipada da rota (path, method, schemas)
            └─ server/routes/<domain>.ts         ← Express handler (requireAuth, Zod parse, storage call)
                 └─ server/storage.ts            ← ÚNICA fonte de queries SQL (IStorage + DatabaseStorage)
                      └─ PostgreSQL (Drizzle ORM)
```

**Regra absoluta:** Nunca colocar queries SQL ou lógica de negócio directamente nos route handlers. Toda a lógica de acesso a dados vai para `server/storage.ts`.

### Fluxo de Estado no Cliente

```
Page (client/src/pages/)
  └─ Hook (use-*.ts)
       ├─ useQuery  → lê dados, cache por queryKey
       └─ useMutation → mutação + invalidateQueries para refrescar cache
```

- O cliente TanStack Query é singleton em `client/src/lib/queryClient.ts`.
- Após qualquer mutação bem-sucedida, invalidar sempre as queryKeys afectadas.

### Autenticação

- Todas as rotas protegidas usam `requireAuth` de `server/routes/middleware.ts`.
- `req.user!.id` é o identificador do utilizador autenticado — **todos** os dados devem ser filtrados por este `userId`.
- Sessão gerida por Passport + express-session.

### Serviços de Background (iniciados no boot)

| Serviço | Ficheiro | Função |
|---|---|---|
| Visit Checker | `server/visitChecker.ts` | Geofencing 75 m — auto-registo de visitas |
| Push Service | `server/pushService.ts` | Web Push VAPID, monitorização de falhas |

### Rotas de IA / Assistente

- SDK exclusivo: `@anthropic-ai/sdk` — o SDK da OpenAI foi removido.
- Rate limiting obrigatório: `checkAssistantRateLimit(userId)` de `server/aiRateLimiter.ts` **em todos** os handlers de IA.
- Modelo padrão: `claude-sonnet-4-20250514`.

---

## 3. Padrões de Código

### Nomenclatura

| Contexto | Padrão | Exemplo |
|---|---|---|
| Ficheiros de rotas servidor | `camelCase.ts` | `serviceLogs.ts` |
| Hooks cliente | `use-kebab-case.ts` | `use-service-logs.ts` |
| Páginas cliente | `PascalCase.tsx` | `ServiceLogs.tsx` |
| Funções de registo de rotas | `register*Routes(app)` | `registerServiceLogsRoutes(app)` |
| `data-testid` | `{action}-{target}` | `button-add-client`, `nav-clientes` |

### Validação com Zod

```typescript
// Criação: parse com throw (deixa o erro propagar para o catch do handler)
const input = api.domain.create.input.parse(req.body);

// Actualização: .partial() + .safeParse() para erros controlados
const updateSchema = insertDomainSchema.partial();
const parsed = updateSchema.safeParse(req.body);
if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
```

### Segurança nos Route Handlers

```typescript
// Padrão obrigatório para qualquer rota que devolva/altere dados de um utilizador
const userId = req.user!.id;
const item = await storage.getItemForUser(id, userId); // sempre filtrar por userId
if (!item) return res.status(404).json({ message: "Não encontrado" });
```

### Design System — Temas

- **Nunca** usar cores hardcoded: ~~`bg-orange-50`~~, ~~`text-amber-500`~~, ~~`#FF6B00`~~.
- Usar sempre tokens CSS: `bg-primary`, `text-muted-foreground`, `border-border`, etc.
- Três temas (Verde / Azul / Laranja) definidos como variáveis CSS em `client/src/index.css`.
- Tema activo guardado em `localStorage` com a chave `servntrak-theme`.

### Língua

- **Todo** o texto visível ao utilizador deve estar em **Português Europeu (PT-PT)**: toasts, labels, mensagens de erro, `aria-label`, validações de formulário, mensagens da API.
- Exemplos correctos: `"Cliente criado com sucesso"`, `"Erro ao guardar"`, `"Agendamento removido"`.

---

## 4. Workflows Específicos

### Adicionar uma nova tabela à base de dados

1. Definir a tabela em `shared/schema.ts` com Drizzle ORM + exportar o tipo e o schema Zod (`createInsertSchema`).
2. Correr `npm run db:push` para aplicar o schema.
3. Adicionar os métodos de acesso a dados à interface `IStorage` e à classe `DatabaseStorage` em `server/storage.ts`.
4. (Opcional) Se a coluna for ad-hoc/urgente, adicionar `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` em `server/index.ts`.

### Criar uma nova rota de API

1. Adicionar a definição tipada em `shared/routes.ts` (path, method, input schema, response schemas).
2. Criar `server/routes/<domain>.ts` com a função `register<Domain>Routes(app: Express)`.
3. Registar a função em `server/routes.ts`.
4. **Verificar obrigatoriamente:**
   - `requireAuth` em todos os handlers.
   - Filtrar por `req.user!.id`.
   - Toda a lógica SQL via `storage.*`.
   - Rate limiting (`checkAssistantRateLimit`) se for rota de IA.
5. Correr `npm run check` para confirmar sem erros de tipos.

### Criar um novo hook de cliente

1. Criar `client/src/hooks/use-<domain>.ts`.
2. Importar a rota tipada de `@shared/routes` e `buildUrl` para rotas com parâmetros.
3. Estrutura base:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function use<Domain>() {
  return useQuery({
    queryKey: [api.<domain>.list.path],
    queryFn: async () => {
      const res = await fetch(api.<domain>.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao carregar dados");
      return api.<domain>.list.responses[200].parse(await res.json());
    },
  });
}
```

4. Toasts de sucesso/erro sempre em PT-PT.
5. Após mutação bem-sucedida, chamar `queryClient.invalidateQueries`.

### Criar uma nova página

1. Criar `client/src/pages/<Domain>.tsx`.
2. Adicionar a rota em `client/src/App.tsx` (Wouter `<Route>`).
3. Usar os hooks de `client/src/hooks/` — nunca fazer `fetch` directamente numa página.
4. Componentes UI de `client/src/components/ui/` (shadcn/ui).
5. Sem cores hardcoded; todos os textos em PT-PT.

---

## Design System

Ver `DESIGN_SYSTEM.md` para a especificação completa.

---

## Variáveis de Ambiente

Copiar `.env.example` para `.env`. Variáveis obrigatórias:

| Variável | Finalidade |
|---|---|
| `DATABASE_URL` | String de ligação PostgreSQL |
| `SESSION_SECRET` | Segredo da sessão Express |
| `ANTHROPIC_API_KEY` | Funcionalidades de IA / OCR |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_EMAIL` | Web Push |
| `RESEND_API_KEY` | Email transaccional |

---

## TypeScript

O projecto usa **TypeScript 6.x** com `"ignoreDeprecations": "6.0"` para manter os path aliases baseados em `baseUrl`. Não remover esta flag até migrar para TS 7.

---

## Migrações de Base de Dados

O schema vive em `shared/schema.ts`. Usar `npm run db:push` em desenvolvimento. Algumas colunas ad-hoc são também adicionadas via `pool.query` em `server/index.ts` no arranque.

---

## Code Review — Pontos Prioritários

Sempre que analisares o código, verifica obrigatoriamente:

1. **Segurança:** Todas as rotas em `server/routes/` usam `requireAuth` e filtram dados por `req.user!.id`.
2. **Arquitectura de Dados:** Queries SQL complexas estão em `server/storage.ts`, não nos route handlers.
3. **Consistência Visual:** Sem cores hardcoded — usar variáveis CSS para suportar os três temas.
4. **Língua:** Todas as mensagens, labels e toasts em **PT-PT**.
5. **SDK de IA:** Apenas `@anthropic-ai/sdk` — sem importações do SDK da OpenAI.
6. **Rate Limiting:** Todos os endpoints de IA usam `checkAssistantRateLimit(userId)`.

---

## Behavioral Guidelines (Karpathy)

Behavioral guidelines to reduce common LLM coding mistakes.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.
