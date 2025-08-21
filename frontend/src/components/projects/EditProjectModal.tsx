import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { PROJECTS_BY_ORGANIZATION } from '../../graphql/queries';
import { UPDATE_PROJECT } from '../../graphql/mutations';
import { Project } from '../../types';
import Modal from '../common/Modal';
import Form from '../common/Form';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  project
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [updateProject] = useMutation(UPDATE_PROJECT, {
    refetchQueries: [
      { query: PROJECTS_BY_ORGANIZATION, variables: { organizationSlug: project.organization.slug } }
    ]
  });

  const formFields = [
    {
      name: 'name',
      label: 'Project Name',
      type: 'text' as const,
      required: true,
      placeholder: 'Enter project name',
      validation: (value: string) => {
        if (value.length < 3) return 'Project name must be at least 3 characters';
        if (value.length > 200) return 'Project name must be less than 200 characters';
        return null;
      }
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea' as const,
      placeholder: 'Enter project description'
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'ON_HOLD', label: 'On Hold' },
        { value: 'COMPLETED', label: 'Completed' }
      ]
    },
    {
      name: 'dueDate',
      label: 'Due Date',
      type: 'date' as const,
      validation: (value: string) => {
        if (value && new Date(value) < new Date()) {
          return 'Due date cannot be in the past';
        }
        return null;
      }
    }
  ];

  const initialValues = {
    name: project.name,
    description: project.description,
    status: project.status,
    dueDate: project.dueDate ? project.dueDate.split('T')[0] : ''
  };

  const handleSubmit = async (values: Record<string, string>) => {
    setIsLoading(true);
    setErrors([]);

    try {
      const variables = {
        id: project.id,
        name: values.name,
        description: values.description || '',
        status: values.status,
        dueDate: values.dueDate || null
      };

      const result = await updateProject({ variables });

      if (result.data?.updateProject?.success) {
        onClose();
      } else {
        setErrors(result.data?.updateProject?.errors || ['Failed to update project']);
      }
    } catch (error) {
      console.error('Update project error:', error);
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
      title={`Edit Project: ${project.name}`}
      size="md"
    >
      <Form
        fields={formFields}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        submitLabel="Update Project"
        isLoading={isLoading}
        errors={errors}
      />
    </Modal>
  );
};

export default EditProjectModal;