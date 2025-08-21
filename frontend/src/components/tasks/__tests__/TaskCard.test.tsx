import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskCard from '../TaskCard';
import { Task } from '../../../types';

// Mock task data
const mockTask: Task = {
  id: '1',
  title: 'Test Task',
  description: 'This is a test task description',
  status: 'TODO',
  assigneeEmail: 'test@example.com',
  dueDate: '2024-12-31T23:59:59Z',
  createdAt: '2024-01-01T00:00:00Z',
  project: {
    id: '1',
    name: 'Test Project',
    organization: {
      id: '1',
      name: 'Test Org',
      slug: 'test-org'
    }
  },
  comments: []
};

describe('TaskCard Component', () => {
  const mockOnClick = jest.fn();
  const mockOnEdit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders task information correctly', () => {
    render(
      <TaskCard
        task={mockTask}
        onClick={mockOnClick}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('This is a test task description')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  test('renders status badge correctly', () => {
    render(
      <TaskCard
        task={mockTask}
        onClick={mockOnClick}
        onEdit={mockOnEdit}
      />
    );

    const statusBadge = screen.getByText('To Do');
    expect(statusBadge).toBeInTheDocument();
  });

  test('renders different status badges correctly', () => {
    const statusTests = [
      { status: 'TODO' as const, displayText: 'To Do' },
      { status: 'IN_PROGRESS' as const, displayText: 'In Progress' },
      { status: 'DONE' as const, displayText: 'Done' }
    ];

    statusTests.forEach(({ status, displayText }) => {
      const taskWithStatus = { ...mockTask, status };
      
      const { unmount } = render(
        <TaskCard
          task={taskWithStatus}
          onClick={mockOnClick}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText(displayText)).toBeInTheDocument();
      unmount();
    });
  });

  test('applies correct CSS classes for status', () => {
    const { container } = render(
      <TaskCard
        task={mockTask}
        onClick={mockOnClick}
        onEdit={mockOnEdit}
      />
    );

    // Check that appropriate styling classes are applied
    expect(container.firstChild).toHaveClass('bg-white', 'border', 'rounded-lg');
  });
});