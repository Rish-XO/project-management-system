import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ToastProvider, useToast } from '../ToastContainer';

// Test component that uses the toast context
const TestComponent: React.FC = () => {
  const { addToast, showIntegrationToast } = useToast();

  return (
    <div>
      <button
        onClick={() => addToast({
          type: 'success',
          title: 'Test Toast',
          message: 'Test message'
        })}
      >
        Add Success Toast
      </button>
      
      <button
        onClick={() => addToast({
          type: 'error',
          title: 'Error Toast',
          message: 'Error message',
          duration: 2000
        })}
      >
        Add Error Toast
      </button>
      
      <button
        onClick={() => showIntegrationToast('email', 'Email sent', 'user@example.com')}
      >
        Show Email Integration
      </button>
      
      <button
        onClick={() => showIntegrationToast('slack', 'Message posted')}
      >
        Show Slack Integration
      </button>
    </div>
  );
};

// Component to test context error handling
const ComponentWithoutProvider: React.FC = () => {
  const { addToast } = useToast();
  return <div>Should throw error</div>;
};

describe('ToastContainer and useToast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('throws error when useToast is used without provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<ComponentWithoutProvider />);
    }).toThrow('useToast must be used within a ToastProvider');
    
    consoleSpy.mockRestore();
  });

  test('renders toast provider with children', () => {
    render(
      <ToastProvider>
        <div data-testid="child">Child content</div>
      </ToastProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  test('adds and displays toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const addButton = screen.getByRole('button', { name: /add success toast/i });
    fireEvent.click(addButton);

    // Toast should appear
    expect(screen.getByText('Test Toast')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  test('removes toast when close button is clicked', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Add a toast
    const addButton = screen.getByRole('button', { name: /add success toast/i });
    fireEvent.click(addButton);

    expect(screen.getByText('Test Toast')).toBeInTheDocument();

    // Close the toast
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    // Wait for fade out animation
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(screen.queryByText('Test Toast')).not.toBeInTheDocument();
  });

  test('auto-removes toast after duration', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Add a toast with custom duration
    const addButton = screen.getByRole('button', { name: /add error toast/i });
    fireEvent.click(addButton);

    expect(screen.getByText('Error Toast')).toBeInTheDocument();

    // Fast-forward time past the duration
    act(() => {
      jest.advanceTimersByTime(2000); // Duration
      jest.advanceTimersByTime(300);  // Fade out time
    });

    expect(screen.queryByText('Error Toast')).not.toBeInTheDocument();
  });

  test('displays multiple toasts', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Add multiple toasts
    const successButton = screen.getByRole('button', { name: /add success toast/i });
    const errorButton = screen.getByRole('button', { name: /add error toast/i });

    fireEvent.click(successButton);
    fireEvent.click(errorButton);

    expect(screen.getByText('Test Toast')).toBeInTheDocument();
    expect(screen.getByText('Error Toast')).toBeInTheDocument();
  });

  test('shows email integration toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const emailButton = screen.getByRole('button', { name: /show email integration/i });
    fireEvent.click(emailButton);

    expect(screen.getByText('Email Integration')).toBeInTheDocument();
    expect(screen.getByText('Email sent to user@example.com')).toBeInTheDocument();
    expect(screen.getByText('📧')).toBeInTheDocument();
  });

  test('shows slack integration toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const slackButton = screen.getByRole('button', { name: /show slack integration/i });
    fireEvent.click(slackButton);

    expect(screen.getByText('Slack Integration')).toBeInTheDocument();
    expect(screen.getByText('Message posted')).toBeInTheDocument();
    expect(screen.getByText('💬')).toBeInTheDocument();
  });

  test('generates unique IDs for toasts', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const addButton = screen.getByRole('button', { name: /add success toast/i });
    
    // Add multiple toasts quickly
    fireEvent.click(addButton);
    fireEvent.click(addButton);

    const toasts = screen.getAllByText('Test Toast');
    expect(toasts).toHaveLength(2);

    // Each toast should be in its own container (unique IDs)
    expect(toasts[0].closest('div')).not.toBe(toasts[1].closest('div'));
  });

  test('handles integration toast without target', () => {
    const TestIntegrationComponent: React.FC = () => {
      const { showIntegrationToast } = useToast();

      return (
        <button
          onClick={() => showIntegrationToast('email', 'Email sent')}
        >
          Show Email Without Target
        </button>
      );
    };

    render(
      <ToastProvider>
        <TestIntegrationComponent />
      </ToastProvider>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('Email Integration')).toBeInTheDocument();
    expect(screen.getByText('Email sent')).toBeInTheDocument();
  });

  test('applies correct positioning classes to toast container', () => {
    const { container } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Find the toast container
    const toastContainer = container.querySelector('.fixed.top-4.right-4.z-50');
    expect(toastContainer).toBeInTheDocument();
  });

  test('cleans up timers on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    
    const { unmount } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Add a toast to create a timer
    const addButton = screen.getByRole('button', { name: /add success toast/i });
    fireEvent.click(addButton);

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  test('handles toast with minimal props', () => {
    const MinimalToastComponent: React.FC = () => {
      const { addToast } = useToast();

      return (
        <button
          onClick={() => addToast({
            type: 'info',
            title: 'Minimal Toast'
            // No message, duration, or icon
          })}
        >
          Add Minimal Toast
        </button>
      );
    };

    render(
      <ToastProvider>
        <MinimalToastComponent />
      </ToastProvider>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('Minimal Toast')).toBeInTheDocument();
    expect(screen.getByText('ℹ️')).toBeInTheDocument(); // Default info icon
  });
});