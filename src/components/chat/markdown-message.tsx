"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export function MarkdownMessage({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  if (!content.trim()) return null;

  return (
    <div className={cn("saama-markdown", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
            >
              {children}
            </a>
          ),
          pre: ({ children }) => (
            <pre className="my-3 max-w-full overflow-x-auto rounded-xl border border-border/60 bg-muted/40 p-3 text-xs">
              {children}
            </pre>
          ),
          code: ({ children, className: codeClassName }) => {
            const isBlock = codeClassName?.includes("language-");
            if (isBlock) {
              return <code className={codeClassName}>{children}</code>;
            }
            return (
              <code className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[0.85em]">
                {children}
              </code>
            );
          },
          table: ({ children }) => (
            <div className="my-3 -mx-1 max-w-[calc(100%+0.5rem)] overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full min-w-[260px] border-collapse text-left text-xs sm:min-w-[280px] sm:text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-border/60 bg-muted/50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 font-semibold text-foreground">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border-t border-border/40 px-3 py-2 align-top text-foreground/90">
              {children}
            </td>
          ),
          tr: ({ children }) => (
            <tr className="even:bg-muted/20">{children}</tr>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}