import React, { useEffect, useState, ComponentPropsWithoutRef } from 'react';
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

const mermaidCache = new Map<string, string>();

const Mermaid: React.FC<{ chart: string }> = ({ chart }) => {
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const renderChart = async () => {
      try {
        if (mermaidCache.has(chart)) {
          setSvgContent(mermaidCache.get(chart)!);
          return;
        }

        const id = `mermaid-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const { svg } = await mermaid.render(id, chart);
        mermaidCache.set(chart, svg);

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
    <div
      className="mermaid-wrapper"
      role="figure"
      aria-label="다이어그램"
      aria-busy={!svgContent}
    >
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

const remarkPlugins = [remarkGfm];
const rehypePlugins = [rehypeRaw];
const components = {
  code({ node, inline, className, children, ...props }:
  ComponentPropsWithoutRef<'code'> & ExtraProps & { inline?: boolean }) {
    const match = /language-(\w+)/.exec(className || '');
    const isMermaid = match && match[1] === 'mermaid';

    if (isMermaid) {
      return <Mermaid chart={String(children).replace(/\n$/, '')} />;
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
