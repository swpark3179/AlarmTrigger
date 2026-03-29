import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import MarkdownViewer from './MarkdownViewer';

// Mock Mermaid
const renderMock = vi.fn().mockResolvedValue({ svg: '<svg>mock</svg>' });
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    contentLoaded: vi.fn(),
    render: (...args: any[]) => renderMock(...args),
  },
}));

describe('MarkdownViewer', () => {
  it('renders markdown content correctly', () => {
    const content = '# Hello World\nThis is a **bold** text.';
    render(<MarkdownViewer content={content} />);

    expect(screen.getByRole('heading', { name: 'Hello World', level: 1 })).toBeInTheDocument();
    // Default style from jest-dom/browser styles might be 'bold' or 'bolder' or 700. We just check element type.
    expect(screen.getByText('bold').tagName).toBe('STRONG');
  });

  it('renders mermaid diagrams correctly', async () => {
    const content = '```mermaid\ngraph TD;\nA-->B;\n```';
    render(<MarkdownViewer content={content} />);

    await waitFor(() => {
      // The wrapper for mermaid
      const wrapper = screen.getByText('graph TD; A-->B;');
      expect(wrapper).toBeInTheDocument();
    });
  });

  it('sanitizes malicious mermaid svg output', async () => {
    // Override the mock for this specific test to return malicious SVG
    renderMock.mockResolvedValueOnce({
      svg: '<svg><script>alert(1)</script><g>mock</g></svg>'
    });

    const content = '```mermaid\ngraph TD;\nA-->B;\n```';
    render(<MarkdownViewer content={content} />);

    await waitFor(() => {
      // Find the element with class mermaid
      // It should contain the sanitized SVG
      const mermaidNode = document.querySelector('.mermaid');
      expect(mermaidNode).toBeInTheDocument();
      expect(mermaidNode?.innerHTML).not.toContain('<script>');
      expect(mermaidNode?.innerHTML).toContain('<g>mock</g>');
    });
  });
});
