import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/lib/types';

const PLACEHOLDER_LANGUAGES = new Set([
  'auto',
  'auto-detected',
  'unknown',
  'n/a',
  '',
]);

const MONACO_LANGUAGE_MAP: Record<string, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  jsx: 'javascript',
  tsx: 'typescript',
  python: 'python',
  java: 'java',
  go: 'go',
  rust: 'rust',
  csharp: 'csharp',
  'c#': 'csharp',
  php: 'php',
  ruby: 'ruby',
  kotlin: 'kotlin',
  swift: 'swift',
  node: 'javascript',
  next: 'typescript',
  express: 'javascript',
  react: 'javascript',
  sql: 'sql',
  shell: 'shell',
  bash: 'shell',
  html: 'html',
  css: 'css',
  cpp: 'cpp',
  'c++': 'cpp',
  c: 'c',
  scala: 'scala',
  dart: 'dart',
  lua: 'lua',
};

export function isPlaceholderLanguage(language?: string | null): boolean {
  const normalized = language?.trim().toLowerCase() ?? '';
  return PLACEHOLDER_LANGUAGES.has(normalized);
}

export function formatReviewLanguage(language?: string | null): string {
  if (isPlaceholderLanguage(language)) {
    return '—';
  }

  const raw = language!.trim();
  return raw
    .split(/[\s_-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function getMonacoLanguage(language?: string | null): string {
  if (isPlaceholderLanguage(language)) {
    return 'plaintext';
  }

  const normalized = language!.trim().toLowerCase();
  if (MONACO_LANGUAGE_MAP[normalized]) {
    return MONACO_LANGUAGE_MAP[normalized];
  }

  if (SUPPORTED_LANGUAGES.includes(normalized as SupportedLanguage)) {
    return normalized === 'other' ? 'plaintext' : normalized;
  }

  return 'plaintext';
}

export function pickTopLanguage(
  languages: { language: string; count: number }[] | undefined,
): string {
  if (!languages?.length) {
    return '—';
  }

  const match = languages.find((item) => !isPlaceholderLanguage(item.language));
  return match ? formatReviewLanguage(match.language) : '—';
}
