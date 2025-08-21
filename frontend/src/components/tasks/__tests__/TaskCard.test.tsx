import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

    const statusBadge = screen.getByText('TODO');
    expect(statusBadge).toBeInTheDocument();
  });

  test('handles click event', () => {
    render(
      <TaskCard
        task={mockTask}
        onClick={mockOnClick}
        onEdit={mockOnEdit}
      />
    );

    const card = screen.getByRole('button');
    fireEvent.click(card);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
    expect(mockOnClick).toHaveBeenCalledWith(mockTask);
  });

  test('handles edit button click', () => {
    render(
      <TaskCard
        task={mockTask}
        onClick={mockOnClick}
        onEdit={mockOnEdit}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);
    
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });

  test('displays due date when present', () => {
    render(
      <TaskCard
        task={mockTask}
        onClick={mockOnClick}
        onEdit={mockOnEdit}
      />
    );

    // Due date should be formatted and displayed
    expect(screen.getByText(/Dec 31, 2024/)).toBeInTheDocument();
  });

  test('handles task without assignee', () => {
    const taskWithoutAssignee = {
      ...mockTask,
      assigneeEmail: ''
    };

    render(
      <TaskCard
        task={taskWithoutAssignee}
        onClick={mockOnClick}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  test('handles task without due date', () => {
    const taskWithoutDueDate = {
      ...mockTask,
      dueDate: undefined
    };

    render(
      <TaskCard
        task={taskWithoutDueDate}
        onClick={mockOnClick}
        onEdit={mockOnEdit}
      />
    );

    // Should not crash and should show some indication of no due date
    expect(screen.queryByText(/Dec 31, 2024/)).not.toBeInTheDocument();
  });

  test('renders different status badges correctly', () => {
    const statuses: Array<'TODO' | 'IN_PROGRESS' | 'DONE'> = ['TODO', 'IN_PROGRESS', 'DONE'];

    statuses.forEach(status => {
      const taskWithStatus = { ...mockTask, status };
      
      const { unmount } = render(
        <TaskCard
          task={taskWithStatus}
          onClick={mockOnClick}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText(status)).toBeInTheDocument();
      unmount();
    });
  });

  test('truncates long description', () => {
    const taskWithLongDescription = {
      ...mockTask,
      description: 'A'.repeat(200) // Very long description
    };

    render(
      <TaskCard
        task={taskWithLongDescription}
        onClick={mockOnClick}
        onEdit={mockOnEdit}
      />
    );

    const description = screen.getByText(/A+/);
    expect(description.textContent?.length).toBeLessThanOrEqual(150); // Should be truncated
  });

  test('prevents edit button click from triggering card click', () => {
    render(
      <TaskCard
        task={mockTask}
        onClick={mockOnClick}
        onEdit={mockOnEdit}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);
    
    // Only edit should be called, not main click
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  test('renders task without comments', () => {
    render(
      <TaskCard
        task={mockTask}
        onClick={mockOnClick}
        onEdit={mockOnEdit}
      />
    );

    // Should render without errors even with empty comments array
    expect(screen.getByText('Test Task')).toBeInTheDocument();
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