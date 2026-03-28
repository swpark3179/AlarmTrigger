import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import MarkdownViewer from './MarkdownViewer';

// Mock Mermaid
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    contentLoaded: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: '<svg>mock</svg>' }),
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
});
