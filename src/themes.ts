import type { PlexTheme } from './types';

export const darkTheme: PlexTheme = {
  background: 'transparent',
  edgeColor: 'rgba(6, 182, 212, 0.25)',
  edgeParentColor: 'rgba(148, 163, 184, 0.2)',
  edgeWidth: 1.5,
  nodeActiveBg: 'rgba(6, 182, 212, 0.15)',
  nodeActiveText: '#e2e8f0',
  nodeActiveBorder: 'rgba(6, 182, 212, 0.5)',
  nodePassiveBg: 'rgba(30, 41, 59, 0.6)',
  nodePassiveText: '#94a3b8',
  nodePassiveBorder: 'rgba(71, 85, 105, 0.4)',
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  transitionDuration: 400,
};

export const lightTheme: PlexTheme = {
  background: 'transparent',
  edgeColor: 'rgba(6, 182, 212, 0.35)',
  edgeParentColor: 'rgba(100, 116, 139, 0.25)',
  edgeWidth: 1.5,
  nodeActiveBg: 'rgba(6, 182, 212, 0.1)',
  nodeActiveText: '#1e293b',
  nodeActiveBorder: 'rgba(6, 182, 212, 0.6)',
  nodePassiveBg: 'rgba(241, 245, 249, 0.8)',
  nodePassiveText: '#475569',
  nodePassiveBorder: 'rgba(203, 213, 225, 0.6)',
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  transitionDuration: 400,
};

export function resolveTheme(theme?: 'dark' | 'light' | PlexTheme): PlexTheme {
  if (!theme || theme === 'dark') return darkTheme;
  if (theme === 'light') return lightTheme;
  return theme;
}
