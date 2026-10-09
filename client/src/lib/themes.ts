export type ThemeName = 'verde' | 'azul' | 'laranja';

export interface ThemeColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
}

export const themes: Record<ThemeName, ThemeColors> = {
  verde: {
    primary: '152 55% 28%',
    primaryForeground: '0 0% 100%',
    secondary: '152 35% 92%',
    secondaryForeground: '152 55% 25%',
    accent: '200 75% 50%',
    accentForeground: '0 0% 100%',
  },
  azul: {
    primary: '221 83% 53%',
    primaryForeground: '0 0% 100%',
    secondary: '214 95% 93%',
    secondaryForeground: '221 83% 45%',
    accent: '142 76% 36%',
    accentForeground: '0 0% 100%',
  },
  laranja: {
    primary: '31 91% 51%',
    primaryForeground: '0 0% 100%',
    secondary: '48 96% 89%',
    secondaryForeground: '31 91% 40%',
    accent: '199 89% 48%',
    accentForeground: '0 0% 100%',
  },
};

export function applyTheme(themeName: ThemeName) {
  const theme = themes[themeName];
  const root = document.documentElement;

  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--primary-foreground', theme.primaryForeground);
  root.style.setProperty('--secondary', theme.secondary);
  root.style.setProperty('--secondary-foreground', theme.secondaryForeground);
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--accent-foreground', theme.accentForeground);

  localStorage.setItem('servntrak-theme', themeName);
}

export function loadSavedTheme(): ThemeName {
  const saved = localStorage.getItem('servntrak-theme') as ThemeName;
  return saved && themes[saved] ? saved : 'verde';
}
