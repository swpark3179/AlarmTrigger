import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import * as tauriApi from '@tauri-apps/api/core';

// Mock the Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    // Prevent the invoke from resolving immediately so we can see the loading state
    vi.mocked(tauriApi.invoke).mockImplementation(
      () => new Promise(() => {})
    );

    render(<App />);
    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
    expect(screen.getByText('데이터를 불러오는 중...')).toBeInTheDocument();
  });

  it('renders alarm data after fetching successfully', async () => {
    const mockData = {
      title: '테스트 알람 제목',
      content: '이것은 테스트 **내용**입니다.',
    };

    vi.mocked(tauriApi.invoke).mockResolvedValueOnce(mockData);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('테스트 알람 제목')).toBeInTheDocument();
    });

    // The markdown viewer should render the content
    // We check for some part of the content text.
    expect(screen.getByText(/이것은 테스트/)).toBeInTheDocument();
  });

  it('handles errors when fetching alarm data', async () => {
    vi.mocked(tauriApi.invoke).mockRejectedValueOnce(new Error('Fetch failed'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('오류')).toBeInTheDocument();
    });

    expect(screen.getByText('알람 데이터를 불러오지 못했습니다.')).toBeInTheDocument();
  });

  it('calls close_app when confirm button is clicked', async () => {
    vi.mocked(tauriApi.invoke).mockResolvedValueOnce({
      title: '제목',
      content: '내용',
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('제목')).toBeInTheDocument();
    });

    const closeBtn = screen.getByRole('button', { name: /확인/ });
    const user = userEvent.setup();
    await user.click(closeBtn);

    expect(tauriApi.invoke).toHaveBeenCalledWith('close_app');
  });

  it('calls close_app when Escape key is pressed', async () => {
    vi.mocked(tauriApi.invoke).mockResolvedValueOnce({
      title: '제목',
      content: '내용',
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('제목')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.keyboard('{Escape}');

    expect(tauriApi.invoke).toHaveBeenCalledWith('close_app');
  });
});
