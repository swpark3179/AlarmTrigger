import React, { useEffect, useRef, ComponentPropsWithoutRef } from 'react';
import ReactMarkdown, { ExtraProps } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'strict',
});

interface MarkdownViewerProps {
  content: string;
}

const remarkPlugins = [remarkGfm];
const rehypePlugins = [rehypeRaw];
const components = {
  code({ node, inline, className, children, ...props }:
  ComponentPropsWithoutRef<'code'> & ExtraProps & { inline?: boolean }) {
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

    const renderChart = async () => {
      try {
        const id = `mermaid-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const { svg } = await mermaid.render(id, chart);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (error) {
        console.error('Mermaid render error', error);
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  return (
    <div className="mermaid-wrapper">
      {svgContent ? (
        <div
          className="mermaid"
          dangerouslySetInnerHTML={{ __html: svgContent }}
          data-processed="true"
        />
      ) : (
        <div className="mermaid" data-processed="false">
          {chart}
        </div>
      )}
    </div>
  );
};

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  return (
    <div className="markdown-body">
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
