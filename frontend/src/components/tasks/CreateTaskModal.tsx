import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { TASKS_BY_PROJECT } from '../../graphql/queries';
import { CREATE_TASK } from '../../graphql/mutations';
import { Project } from '../../types';
import Modal from '../common/Modal';
import Form from '../common/Form';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  project
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [createTask] = useMutation(CREATE_TASK, {
    refetchQueries: [
      { query: TASKS_BY_PROJECT, variables: { projectId: project.id } }
    ],
    errorPolicy: 'all'
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

  const handleSubmit = async (values: Record<string, string>) => {
    setIsLoading(true);
    setErrors([]);

    try {
      // Convert datetime-local to timezone-aware ISO string
      const dueDate = values.dueDate 
        ? new Date(values.dueDate).toISOString() 
        : null;

      const variables = {
        projectId: project.id,
        title: values.title,
        description: values.description || '',
        assigneeEmail: values.assigneeEmail || '',
        dueDate: dueDate
      };

      const result = await createTask({ variables });

      if (result.data?.createTask?.success) {
        onClose();
      } else {
        setErrors(result.data?.createTask?.errors || ['Failed to create task']);
      }
    } catch (error) {
      console.error('Create task error:', error);
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
      title={`Create New Task for ${project.name}`}
      size="md"
    >
      <Form
        fields={formFields}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        submitLabel="Create Task"
        isLoading={isLoading}
        errors={errors}
      />
    </Modal>
  );
};

export default CreateTaskModal;