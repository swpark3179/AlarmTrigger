import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

interface MarkdownViewerProps {
  content: string;
}

const remarkPlugins = [remarkGfm];
const rehypePlugins = [rehypeRaw];
const components = {
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    const isMermaid = match && match[1] === 'mermaid';

    if (isMermaid) {
      return (
        <div className="mermaid-wrapper">
          <div className="mermaid">{String(children).replace(/\n$/, '')}</div>
        </div>
      );
    }

    return !inline ? (
      <pre>
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
};

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      mermaid.contentLoaded();
      // Find all elements with class 'mermaid' and render them if not already rendered
      const mermaidNodes = containerRef.current.querySelectorAll('.mermaid');
      mermaidNodes.forEach((node, idx) => {
        if (node.getAttribute('data-processed')) return;
        const id = `mermaid-${Date.now()}-${idx}`;
        const graphDefinition = node.textContent || '';
        try {
          mermaid.render(id, graphDefinition).then(({ svg }) => {
            node.innerHTML = svg;
            node.setAttribute('data-processed', 'true');
          });
        } catch (error) {
          console.error('Mermaid render error', error);
        }
      });
    }
  }, [content]);

  return (
    <div ref={containerRef} className="markdown-body">
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownViewer;
