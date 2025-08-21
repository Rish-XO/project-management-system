import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ToastProvider, useToast } from '../ToastContainer';

// Test component that uses the toast context
const TestComponent: React.FC = () => {
  const { showToast, showIntegrationToast } = useToast();

  return (
    <div>
      <button
        onClick={() => showToast('success', 'Test Toast', 'Test message')}
      >
        Add Success Toast
      </button>
      
      <button
        onClick={() => showIntegrationToast('email', 'Email sent', 'user@example.com')}
      >
        Show Email Integration
      </button>
    </div>
  );
};

describe('ToastContainer and useToast', () => {
  test('renders toast provider with children', () => {
    render(
      <ToastProvider>
        <div data-testid="child">Child content</div>
      </ToastProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  test('provides toast context functions', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    expect(screen.getByText('Add Success Toast')).toBeInTheDocument();
    expect(screen.getByText('Show Email Integration')).toBeInTheDocument();
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
});