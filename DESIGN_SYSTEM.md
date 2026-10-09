# ServNtrak — Design System

Este documento é a fonte de verdade para o sistema de design da ServNtrak (Peralta Gardens). Sempre que adicionares uma página ou componente novo, segue estas regras.

## 1. Paleta de Cores

As cores são definidas como variáveis CSS em [`client/src/index.css`](client/src/index.css) no formato `H S% L%` (sem `hsl()`), e podem ser trocadas em runtime através do selector de tema em **Perfil → Aparência**. A lógica do tema vive em [`client/src/lib/themes.ts`](client/src/lib/themes.ts).

### Tema Verde (padrão)

| Token | Valor HSL | Uso |
|---|---|---|
| `--primary` | `152 55% 28%` (#2D6A4F) | Botões principais, navegação activa, marca |
| `--secondary` | `152 35% 92%` | Backgrounds suaves, estados hover |
| `--accent` | `200 75% 50%` | Call-to-actions secundárias, links |
| `--muted` | `220 15% 94%` | Backgrounds de inputs, cards subtis |
| `--muted-foreground` | `220 15% 40%` | Texto secundário |
| `--foreground` | `220 20% 15%` | Texto principal |
| `--destructive` | (definido no `index.css`) | Acções de eliminação, alertas críticos |

### Tema Azul

`--primary: 221 83% 53%` — aspecto corporativo, profissional, tecnológico.

### Tema Laranja

`--primary: 31 91% 51%` — energia, calor, criatividade.

> **Importante:** nunca uses cores hard-coded como `bg-orange-50`, `text-amber-500` ou `#9B7B5E`. Usa sempre as variáveis (`bg-primary`, `text-muted-foreground`, etc.) para que os 3 temas funcionem.

## 2. Tipografia

- **Fonte:** Inter (Display 700–800, Body 400–600)
- **Escala** (Tailwind):
  - Display: `text-4xl` / 39px — títulos de página
  - H1: `text-3xl` / 31px — secções principais
  - H2: `text-2xl` / 25px — subsecções
  - H3: `text-xl` / 20px — títulos de card
  - Body: `text-base` / 16px — texto padrão
  - Caption: `text-xs` / 12px — legendas

## 3. Espaçamento — Grelha de 8px

| Classe | Valor |
|---|---|
| `p-1` | 8px |
| `p-2` | 16px |
| `p-3` | 24px |
| `p-4` | 32px (padrão para cards mobile) |
| `p-6` | 48px (padrão para dialogs) |

## 4. Border Radius

| Classe | Valor | Uso |
|---|---|---|
| `rounded-md` | 8px | Inputs, botões pequenos |
| `rounded-lg` | 12px | Cards, botões médios |
| `rounded-xl` | 16px | Dialogs, cards grandes |
| `rounded-2xl` | 24px | Elementos hero/destaque |
| `rounded-full` | 50% | Avatares, FABs |

## 5. Componentes

### Botões

- **Primary:** `bg-primary text-primary-foreground` + `shadow-lg`
- **Secondary:** `bg-secondary text-secondary-foreground`
- **Ghost:** `hover:bg-muted`
- Componente shadcn em `@/components/ui/button`. Para FABs e botões só com ícone usa `size="icon"`.

### Cards

- **Mobile:** `bg-card rounded-2xl border p-4 shadow-sm`
- **Glass:** `bg-white/80 backdrop-blur-xl rounded-2xl` (classe `.glass-card` em `index.css`)

### Inputs

- **Base:** `rounded-xl border bg-background/80 px-4 py-3` (classe `.input-field`)
- **Focus:** `ring-2 ring-primary ring-offset-2` (já é o padrão do `<Input>` em `@/components/ui/input`)

### Navegação

- **Bottom Nav:** componente em `@/components/BottomNav`. Fixa, com 5 itens principais (mais um agrupador "Relatórios" que cobre as restantes rotas).
- Estado activo: `bg-primary/10 text-primary` no ícone, `font-bold text-primary` no label.

## 6. Acessibilidade

- **Contraste mínimo:** 4.5:1 para texto normal, 3:1 para texto grande (≥18px). Conforme WCAG AA.
- **Focus visível:** sempre `ring-2 ring-primary ring-offset-2`. Nunca usar `outline-none` sem substituir por ring.
- **Ícones:**
  - Decorativos (acompanham um label): `aria-hidden="true"` no SVG.
  - Únicos dentro de um botão sem texto: o botão pai leva `aria-label="..."` em PT-PT, e o ícone leva `aria-hidden="true"`.
- **Navegação:** `<nav aria-label="Navegação principal">` + `aria-current="page"` no link activo.
- **Botões `data-testid`:** padrão `{action}-{target}`, ex.: `button-add-client`, `nav-clientes`, `button-back`.

## 7. Animações

| Tipo | Duração | Easing |
|---|---|---|
| Micro (hover, active) | 200ms | `ease-out` |
| Transição de página | 300ms | `ease-out` |
| Modal/Dialog | 400ms | `ease-in-out` |

Padrão geral: `ease-out` para entradas, `ease-in` para saídas, `ease-in-out` para transformações complexas.

## 8. Idioma

Toda a interface é em **Português Europeu (PT-PT)**: mensagens, `aria-label`, validações de formulário, toasts.

## 9. Como Mudar de Tema

Utilizador final: **Perfil → Aparência → seleccionar paleta**.

Programaticamente:

```ts
import { applyTheme } from "@/lib/themes";

applyTheme("verde"); // ou "azul" / "laranja"
```

O tema é guardado em `localStorage` (chave `servntrak-theme`) e aplicado em [`main.tsx`](client/src/main.tsx) antes do primeiro render através de `applyTheme(loadSavedTheme())`.
