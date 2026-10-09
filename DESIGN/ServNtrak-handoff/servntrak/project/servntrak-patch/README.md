# ServNtrak — V0 Visual Patch

Drop-in replacements para `client/src/pages/Home.tsx` e `client/src/pages/Calendar.tsx`.
Toda a lógica funcional (hooks, queries, geofencing, voice-to-text, dialogs) preservada.
Apenas a camada visual foi atualizada para o V0 (mesma paleta ServNtrak, Inter, gradientes mesh, cards mais refinados).

## Como aplicar

```bash
# do root do repo ServNtrakV2
cp /caminho/para/este/folder/Home.tsx     client/src/pages/Home.tsx
cp /caminho/para/este/folder/Calendar.tsx client/src/pages/Calendar.tsx
npm run check    # type check
npm run dev      # ver o resultado
```

Backups dos originais: `_original/Home.tsx`, `_original/Calendar.tsx`.

## Deltas visuais aplicados

### Home.tsx
- Hero compactado (padding reduzido), greeting mais conciso
- "Acções rápidas" — botões com fundo `bg-muted` + ícone circular colorido (em vez de fundo sólido a cor)
- **Card prominente de Registo por Voz** com waveform (substitui o link no "Mais"). Continua a usar o componente `VoiceToText` original.
- Timeline mais densa: hora à esquerda em rail, card "next" com glow e CTA Navegar inline.
- Weather card: tipografia mais limpa, alerta destacado a laranja `--warm`.
- Tudo continua a respeitar tokens CSS (`--primary`, `--accent`, `--warm`, `--muted`, `--border`) — basta mudar o tema na app que tudo segue.

### Calendar.tsx (em curso)
- A processar.

## Tokens CSS

Se o teu `index.css` ainda não tem `--warm` e `--accent`, adiciona ao bloco `:root`:

```css
:root {
  --accent: 174 100% 29%;        /* #009688 teal · onda do logo */
  --accent-foreground: 0 0% 100%;
  --warm: 18 100% 45%;           /* #E65100 laranja · letra N */
  --warm-foreground: 0 0% 100%;
}
```

Se preferires não tocar no `index.css`, podes substituir nos ficheiros `bg-accent`/`text-accent`/`bg-warm`/`text-warm` por `bg-teal-600`/`text-teal-600`/`bg-orange-600`/`text-orange-600` (Tailwind defaults).
