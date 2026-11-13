import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'typescript',
  filename = 'src/services/alertPriorityEngine.ts',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="w-full rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-[var(--shadow-soft)]">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--surface-subtle)] border-b border-[var(--border)] text-xs">
        <span className="font-mono text-[var(--ink-muted)] font-medium">
          {filename}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-input)] bg-[var(--surface)] border border-[var(--border)] text-[var(--ink)] hover:bg-[var(--surface-hover)] transition text-xs font-mono"
          aria-label={copied ? 'Copied to clipboard' : 'Copy code to clipboard'}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[var(--status-success)]" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <div className="p-4 overflow-x-auto text-xs sm:text-sm leading-relaxed font-mono">
        <pre className="text-[var(--ink)] whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};
