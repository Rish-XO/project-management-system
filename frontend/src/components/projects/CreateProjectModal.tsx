import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { PROJECTS_BY_ORGANIZATION } from '../../graphql/queries';
import { CREATE_PROJECT } from '../../graphql/mutations';
import { Organization } from '../../types';
import Modal from '../common/Modal';
import Form from '../common/Form';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  organization
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [createProject] = useMutation(CREATE_PROJECT, {
    refetchQueries: [
      { query: PROJECTS_BY_ORGANIZATION, variables: { organizationSlug: organization.slug } }
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

  const handleSubmit = async (values: Record<string, string>) => {
    setIsLoading(true);
    setErrors([]);

    try {
      const variables = {
        organizationId: organization.id,
        name: values.name,
        description: values.description || '',
        status: values.status || 'ACTIVE',
        dueDate: values.dueDate || null
      };

      const result = await createProject({ variables });

      if (result.data?.createProject?.success) {
        onClose();
      } else {
        setErrors(result.data?.createProject?.errors || ['Failed to create project']);
      }
    } catch (error) {
      console.error('Create project error:', error);
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
      title={`Create New Project for ${organization.name}`}
      size="md"
    >
      <Form
        fields={formFields}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        submitLabel="Create Project"
        isLoading={isLoading}
        errors={errors}
      />
    </Modal>
  );
};

export default CreateProjectModal;