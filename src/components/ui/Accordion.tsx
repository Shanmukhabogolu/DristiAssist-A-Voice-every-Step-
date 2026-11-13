import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface AccordionItem {
  id: string;
  question: string;
  answer: string;
}

interface AccordionProps {
  items: AccordionItem[];
}

export const Accordion: React.FC<AccordionProps> = ({ items }) => {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set([items[0]?.id || '']));

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="w-full divide-y divide-[var(--border)] border-y border-[var(--border)]">
      {items.map((item) => {
        const isOpen = openIds.has(item.id);
        return (
          <div key={item.id} className="py-4">
            <button
              onClick={() => toggle(item.id)}
              className="w-full flex items-center justify-between text-left gap-4 font-semibold text-base sm:text-lg text-[var(--ink)] hover:text-[var(--accent)] transition-colors cursor-pointer"
              aria-expanded={isOpen}
            >
              <span>{item.question}</span>
              <ChevronDown
                className={`w-4 h-4 text-[var(--ink-muted)] shrink-0 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-[var(--accent)]' : ''
                }`}
                aria-hidden="true"
              />
            </button>
            {isOpen && (
              <div className="mt-2.5 pr-8 text-sm sm:text-base text-[var(--ink-muted)] leading-relaxed">
                <p>{item.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
