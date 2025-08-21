import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { TASKS_BY_PROJECT } from '../../graphql/queries';
import { UPDATE_TASK, UPDATE_TASK_STATUS } from '../../graphql/mutations';
import { Task } from '../../types';
import Modal from '../common/Modal';
import Form from '../common/Form';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  projectId?: string; // Add optional projectId prop for safety
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  projectId
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Use projectId prop or fallback to task.project?.id with null safety
  const safeProjectId = projectId || task.project?.id;

  const [updateTask] = useMutation(UPDATE_TASK, {
    refetchQueries: safeProjectId ? [
      { query: TASKS_BY_PROJECT, variables: { projectId: safeProjectId } }
    ] : []
  });

  const [updateTaskStatus] = useMutation(UPDATE_TASK_STATUS, {
    refetchQueries: safeProjectId ? [
      { query: TASKS_BY_PROJECT, variables: { projectId: safeProjectId } }
    ] : []
  });

  const formFields = [
    {
      name: 'title',
      label: 'Task Title',
      type: 'text' as const,
      required: true,
      placeholder: 'Enter task title',
      validation: (value: string) => {
        if (value.length < 3) return 'Task title must be at least 3 characters';
        if (value.length > 200) return 'Task title must be less than 200 characters';
        return null;
      }
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea' as const,
      placeholder: 'Enter task description'
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'TODO', label: 'To Do' },
        { value: 'IN_PROGRESS', label: 'In Progress' },
        { value: 'DONE', label: 'Done' }
      ]
    },
    {
      name: 'assigneeEmail',
      label: 'Assignee Email',
      type: 'email' as const,
      placeholder: 'Enter assignee email address',
      validation: (value: string) => {
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Please enter a valid email address';
        }
        return null;
      }
    },
    {
      name: 'dueDate',
      label: 'Due Date',
      type: 'datetime-local' as const,
      validation: (value: string) => {
        if (value && new Date(value) < new Date()) {
          return 'Due date cannot be in the past';
        }
        return null;
      }
    }
  ];

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  const initialValues = {
    title: task.title,
    description: task.description,
    status: task.status,
    assigneeEmail: task.assigneeEmail,
    dueDate: formatDateForInput(task.dueDate)
  };

  const handleSubmit = async (values: Record<string, string>) => {
    setIsLoading(true);
    setErrors([]);

    try {
      // Check if only status changed for quick update
      const statusChanged = values.status !== task.status;
      const otherFieldsChanged = 
        values.title !== task.title ||
        values.description !== task.description ||
        values.assigneeEmail !== task.assigneeEmail ||
        formatDateForInput(task.dueDate) !== values.dueDate;

      if (statusChanged && !otherFieldsChanged) {
        // Use quick status update
        const result = await updateTaskStatus({
          variables: {
            id: task.id,
            status: values.status
          }
        });

        if (result.data?.updateTaskStatus?.success) {
          onClose();
        } else {
          setErrors(result.data?.updateTaskStatus?.errors || ['Failed to update task status']);
        }
      } else {
        // Use full task update
        // Convert datetime-local to timezone-aware ISO string
        const dueDate = values.dueDate 
          ? new Date(values.dueDate).toISOString() 
          : null;

        const variables = {
          id: task.id,
          title: values.title,
          description: values.description || '',
          assigneeEmail: values.assigneeEmail || '',
          dueDate: dueDate
        };

        const result = await updateTask({ variables });

        if (result.data?.updateTask?.success) {
          // If status also changed, update it separately
          if (statusChanged) {
            await updateTaskStatus({
              variables: {
                id: task.id,
                status: values.status
              }
            });
          }
          onClose();
        } else {
          setErrors(result.data?.updateTask?.errors || ['Failed to update task']);
        }
      }
    } catch (error) {
      console.error('Update task error:', error);
      setErrors(['Network error. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setErrors([]);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Edit Task: ${task.title}`}
      size="md"
    >
      <Form
        fields={formFields}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        submitLabel="Update Task"
        isLoading={isLoading}
        errors={errors}
      />
    </Modal>
  );
};

export default EditTaskModal;