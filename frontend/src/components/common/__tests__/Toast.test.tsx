import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Toast, { ToastMessage } from '../Toast';

// Mock toast messages
const mockSuccessToast: ToastMessage = {
  id: '1',
  type: 'success',
  title: 'Success!',
  message: 'Task completed successfully',
  duration: 3000
};

const mockErrorToast: ToastMessage = {
  id: '2',
  type: 'error',
  title: 'Error!',
  message: 'Something went wrong',
  duration: 5000
};

const mockInfoToast: ToastMessage = {
  id: '3',
  type: 'info',
  title: 'Info',
  message: 'Information message',
  icon: '📧'
};

describe('Toast Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders toast with correct content', () => {
    render(<Toast toast={mockSuccessToast} onClose={mockOnClose} />);

    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Task completed successfully')).toBeInTheDocument();
  });

  test('renders success toast with correct styling', () => {
    render(<Toast toast={mockSuccessToast} onClose={mockOnClose} />);

    const toastElement = screen.getByText('Success!').closest('div');
    expect(toastElement).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800');
  });

  test('renders error toast with correct styling', () => {
    render(<Toast toast={mockErrorToast} onClose={mockOnClose} />);

    const toastElement = screen.getByText('Error!').closest('div');
    expect(toastElement).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800');
  });

  test('renders info toast with correct styling', () => {
    render(<Toast toast={mockInfoToast} onClose={mockOnClose} />);

    const toastElement = screen.getByText('Info').closest('div');
    expect(toastElement).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-800');
  });

  test('displays default icons based on type', () => {
    render(<Toast toast={mockSuccessToast} onClose={mockOnClose} />);
    
    // Success toast should show checkmark
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  test('displays custom icon when provided', () => {
    render(<Toast toast={mockInfoToast} onClose={mockOnClose} />);
    
    // Should show custom icon instead of default
    expect(screen.getByText('📧')).toBeInTheDocument();
    expect(screen.queryByText('ℹ️')).not.toBeInTheDocument();
  });

  test('handles close button click', () => {
    render(<Toast toast={mockSuccessToast} onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledWith('1');
  });

  test('auto-dismisses after duration', () => {
    render(<Toast toast={mockSuccessToast} onClose={mockOnClose} />);

    // Fast-forward time by the duration
    jest.advanceTimersByTime(3000);
    
    // Should trigger close after duration + fade out time
    jest.advanceTimersByTime(300);
    
    expect(mockOnClose).toHaveBeenCalledWith('1');
  });

  test('uses default duration when not specified', () => {
    const toastWithoutDuration: ToastMessage = {
      id: '4',
      type: 'info',
      title: 'Default Duration'
    };

    render(<Toast toast={toastWithoutDuration} onClose={mockOnClose} />);

    // Fast-forward by default duration (5000ms)
    jest.advanceTimersByTime(5000);
    jest.advanceTimersByTime(300);
    
    expect(mockOnClose).toHaveBeenCalledWith('4');
  });

  test('renders toast without message', () => {
    const titleOnlyToast: ToastMessage = {
      id: '5',
      type: 'warning',
      title: 'Warning Title Only'
    };

    render(<Toast toast={titleOnlyToast} onClose={mockOnClose} />);

    expect(screen.getByText('Warning Title Only')).toBeInTheDocument();
    // Should not crash with missing message
  });

  test('handles warning type correctly', () => {
    const warningToast: ToastMessage = {
      id: '6',
      type: 'warning',
      title: 'Warning!',
      message: 'This is a warning'
    };

    render(<Toast toast={warningToast} onClose={mockOnClose} />);

    const toastElement = screen.getByText('Warning!').closest('div');
    expect(toastElement).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800');
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  test('applies fade-in animation on mount', async () => {
    render(<Toast toast={mockSuccessToast} onClose={mockOnClose} />);

    const toastElement = screen.getByText('Success!').closest('div');
    
    // Initially should have fade-in classes
    await waitFor(() => {
      expect(toastElement).toHaveClass('opacity-100', 'translate-x-0');
    });
  });

  test('applies fade-out animation on close', async () => {
    render(<Toast toast={mockSuccessToast} onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    // Should apply fade-out classes
    const toastElement = screen.getByText('Success!').closest('div');
    expect(toastElement).toHaveClass('opacity-0', 'translate-x-full');
  });

  test('clears timer on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    
    const { unmount } = render(<Toast toast={mockSuccessToast} onClose={mockOnClose} />);
    unmount();
    
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  test('handles multiple toast types correctly', () => {
    const toasts: ToastMessage[] = [
      { id: '1', type: 'success', title: 'Success' },
      { id: '2', type: 'error', title: 'Error' },
      { id: '3', type: 'warning', title: 'Warning' },
      { id: '4', type: 'info', title: 'Info' }
    ];

    const expectedIcons = ['✅', '❌', '⚠️', 'ℹ️'];
    
    toasts.forEach((toast, index) => {
      const { unmount } = render(<Toast toast={toast} onClose={mockOnClose} />);
      
      expect(screen.getByText(toast.title)).toBeInTheDocument();
      expect(screen.getByText(expectedIcons[index])).toBeInTheDocument();
      
      unmount();
    });
  });

  test('handles very long titles and messages', () => {
    const longContentToast: ToastMessage = {
      id: '7',
      type: 'info',
      title: 'A'.repeat(100),
      message: 'B'.repeat(200)
    };

    render(<Toast toast={longContentToast} onClose={mockOnClose} />);

    // Should render without breaking layout
    expect(screen.getByText('A'.repeat(100))).toBeInTheDocument();
    expect(screen.getByText('B'.repeat(200))).toBeInTheDocument();
  });
});