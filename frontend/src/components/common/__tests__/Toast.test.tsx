import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Toast, { ToastMessage } from '../Toast';

// Mock toast messages
const mockSuccessToast: ToastMessage = {
  id: '1',
  type: 'success',
  title: 'Success!',
  message: 'Operation completed successfully',
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
  message: 'Here is some information'
};

describe('Toast Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders toast with correct content', () => {
    render(<Toast toast={mockSuccessToast} onClose={mockOnClose} />);
    
    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
  });

  test('applies correct styling for success type', () => {
    const { container } = render(<Toast toast={mockSuccessToast} onClose={mockOnClose} />);
    
    const toastElement = container.firstChild as HTMLElement;
    expect(toastElement).toHaveClass('border-green-200');
  });

  test('applies correct styling for error type', () => {
    const { container } = render(<Toast toast={mockErrorToast} onClose={mockOnClose} />);
    
    const toastElement = container.firstChild as HTMLElement;
    expect(toastElement).toHaveClass('border-red-200');
  });

  test('applies correct styling for info type', () => {
    const { container } = render(<Toast toast={mockInfoToast} onClose={mockOnClose} />);
    
    const toastElement = container.firstChild as HTMLElement;
    expect(toastElement).toHaveClass('border-blue-200');
  });

  test('renders close button', () => {
    render(<Toast toast={mockSuccessToast} onClose={mockOnClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
  });

  test('renders without message', () => {
    const toastWithoutMessage: ToastMessage = {
      id: '5',
      type: 'success',
      title: 'Just a title'
    };

    render(<Toast toast={toastWithoutMessage} onClose={mockOnClose} />);
    
    expect(screen.getByText('Just a title')).toBeInTheDocument();
    expect(screen.queryByText('message')).not.toBeInTheDocument();
  });
});