import React, { useEffect, useState, ComponentPropsWithoutRef } from 'react';
import ReactMarkdown, { ExtraProps } from 'react-markdown';
import { ExternalLink, Copy, Check } from 'lucide-react';
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

        const id = `mermaid-${Date.now()}-${crypto.randomUUID()}`;
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
    <div className="mermaid-wrapper" role="figure" aria-label="다이어그램" aria-busy={!svgContent} tabIndex={0}>
      {svgContent ? (
        <div
          className="mermaid"
          dangerouslySetInnerHTML={{ __html: svgContent }}
          data-processed="true"
        />
      ) : (
        <div className="mermaid" data-processed="false" aria-hidden="true">
          {chart}
        </div>
      )}
    </div>
  );
};

const CodeBlock: React.FC<{ children: React.ReactNode; className?: string } & ComponentPropsWithoutRef<'code'>> = ({ children, className, ...props }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <pre tabIndex={0} role="region" aria-label="코드 블록">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
      <button
        className="copy-btn"
        onClick={handleCopy}
        aria-label={copied ? "복사 완료" : "코드 복사"}
        title={copied ? "복사 완료" : "코드 복사"}
      >
        {copied ? (
          <>
            <Check size={16} aria-hidden="true" />
            <span>복사됨</span>
          </>
        ) : (
          <Copy size={16} aria-hidden="true" />
        )}
      </button>
    </div>
  );
};

const remarkPlugins = [remarkGfm];
const rehypePlugins = [rehypeRaw];
const components = {
  a({ node, ...props }: ComponentPropsWithoutRef<'a'> & ExtraProps) {
    return (
      <a
        {...props}
        target="_blank"
        rel="noopener noreferrer"
        title="새 창에서 열기"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', ...(props.style || {}) }}
      >
        {props.children}
        <ExternalLink size={12} aria-hidden="true" />
      </a>
    );
  },
  code({ node, inline, className, children, ...props }:
  ComponentPropsWithoutRef<'code'> & ExtraProps & { inline?: boolean }) {
    const match = /language-(\w+)/.exec(className || '');
    const isMermaid = match && match[1] === 'mermaid';

    if (isMermaid) {
      return <Mermaid chart={String(children).replace(/\n$/, '')} />;
    }

    return !inline ? (
      <CodeBlock className={className} {...props}>
        {children}
      </CodeBlock>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  table({ node, ...props }: ComponentPropsWithoutRef<'table'> & ExtraProps) {
    return (
      <div className="table-wrapper" tabIndex={0} role="region" aria-label="표">
        <table {...props} />
      </div>
    );
  },
  img({ node, alt, ...props }: ComponentPropsWithoutRef<'img'> & ExtraProps) {
    return (
      <img
        {...props}
        alt={alt || '이미지'}
        loading="lazy"
        decoding="async"
      />
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
