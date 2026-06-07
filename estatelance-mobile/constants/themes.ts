export interface ThemeColors {
  primary:    string;
  primary2:   string;
  purple:     string;
  green:      string;
  red:        string;
  cyan:       string;
  amber:      string;
  text:       string;
  textSub:    string;
  textMuted:  string;
  border:     string;
  bg:         string;
  white:      string;
  card:       string;
  tabBar:     string;
  tabActive:  string;
  tabInactive:string;
}

export type ThemeKey = 'series_a_blue' | 'obsidian' | 'light_marketplace' | 'kinetic_indigo';

export interface ThemeDef {
  key:   ThemeKey;
  name:  string;
  desc:  string;
  dark:  boolean;
  colors: ThemeColors;
  preview: { bg: string; card: string; accent: string; text: string; bar: string; };
}

export const THEMES: ThemeDef[] = [
  {
    key:  'series_a_blue',
    name: 'Series A Blue',
    desc: 'Zamonaviy, toza va professional startap uslubi.',
    dark: false,
    colors: {
      primary:    '#4f46e5',
      primary2:   '#4338ca',
      purple:     '#7c3aed',
      green:      '#16a34a',
      red:        '#dc2626',
      cyan:       '#0891b2',
      amber:      '#b45309',
      text:       '#0f172a',
      textSub:    '#64748b',
      textMuted:  '#94a3b8',
      border:     '#e2e8f0',
      bg:         '#f8fafc',
      white:      '#ffffff',
      card:       '#ffffff',
      tabBar:     '#ffffff',
      tabActive:  '#4f46e5',
      tabInactive:'#94a3b8',
    },
    preview: { bg: '#f8fafc', card: '#ffffff', accent: '#4f46e5', text: '#0f172a', bar: '#ffffff' },
  },
  {
    key:  'obsidian',
    name: 'Institutional Obsidian',
    desc: 'Muhandislik va chuqur kontsentratsiya uchun qorong\'u rejim.',
    dark: true,
    colors: {
      primary:    '#6366f1',
      primary2:   '#4f46e5',
      purple:     '#a78bfa',
      green:      '#22c55e',
      red:        '#f87171',
      cyan:       '#22d3ee',
      amber:      '#fbbf24',
      text:       '#f1f5f9',
      textSub:    '#94a3b8',
      textMuted:  '#64748b',
      border:     '#1e293b',
      bg:         '#0f172a',
      white:      '#1e293b',
      card:       '#1e293b',
      tabBar:     '#1e293b',
      tabActive:  '#818cf8',
      tabInactive:'#475569',
    },
    preview: { bg: '#0f172a', card: '#1e293b', accent: '#6366f1', text: '#f1f5f9', bar: '#1e293b' },
  },
  {
    key:  'light_marketplace',
    name: 'Light Marketplace',
    desc: 'Yuqori o\'qiluvchanlik va maksimal yorug\'lik.',
    dark: false,
    colors: {
      primary:    '#2563eb',
      primary2:   '#1d4ed8',
      purple:     '#7c3aed',
      green:      '#16a34a',
      red:        '#dc2626',
      cyan:       '#0891b2',
      amber:      '#d97706',
      text:       '#111827',
      textSub:    '#6b7280',
      textMuted:  '#9ca3af',
      border:     '#f3f4f6',
      bg:         '#ffffff',
      white:      '#f9fafb',
      card:       '#f9fafb',
      tabBar:     '#ffffff',
      tabActive:  '#2563eb',
      tabInactive:'#9ca3af',
    },
    preview: { bg: '#ffffff', card: '#f9fafb', accent: '#2563eb', text: '#111827', bar: '#ffffff' },
  },
  {
    key:  'kinetic_indigo',
    name: 'Kinetic Indigo',
    desc: 'Yumshoq qorong\'u rejim va jonli indigo urg\'ulari.',
    dark: true,
    colors: {
      primary:    '#818cf8',
      primary2:   '#6366f1',
      purple:     '#c084fc',
      green:      '#4ade80',
      red:        '#f87171',
      cyan:       '#67e8f9',
      amber:      '#fcd34d',
      text:       '#e2e8f0',
      textSub:    '#94a3b8',
      textMuted:  '#64748b',
      border:     '#312e81',
      bg:         '#1e1b4b',
      white:      '#2d2a6e',
      card:       '#2d2a6e',
      tabBar:     '#2d2a6e',
      tabActive:  '#818cf8',
      tabInactive:'#6366f1',
    },
    preview: { bg: '#1e1b4b', card: '#2d2a6e', accent: '#818cf8', text: '#e2e8f0', bar: '#2d2a6e' },
  },
];

export const DEFAULT_THEME: ThemeKey = 'series_a_blue';
