'use client';

import dynamic from 'next/dynamic';
import { SupportedLanguage } from '@/lib/types';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface MonacoCodeEditorProps {
  value: string;
  language: SupportedLanguage;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export function MonacoCodeEditor({
  value,
  language,
  onChange,
  readOnly,
}: MonacoCodeEditorProps) {
  const monacoLanguage = language === 'other' ? 'plaintext' : language;

  return (
    <div className="h-full min-h-[400px]">
      <Editor
        height="100%"
        language={monacoLanguage}
        value={value}
        theme="vs-dark"
        onChange={(next) => onChange(next ?? '')}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'var(--font-geist-mono), monospace',
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          padding: { top: 12, bottom: 12 },
          roundedSelection: true,
          cursorBlinking: 'smooth',
          smoothScrolling: true,
        }}
      />
    </div>
  );
}
