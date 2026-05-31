import Markdown from 'react-markdown';

export default function MarkdownRenderer({ children }: { children: string }) {
  return (
    <div className="markdown-content leading-relaxed">
      <Markdown>{children}</Markdown>
    </div>
  );
}
