import React, { useState } from 'react';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'date' | 'datetime-local';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: (value: string) => string | null;
}

interface FormProps {
  fields: FormField[];
  initialValues?: Record<string, string>;
  onSubmit: (values: Record<string, string>) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
  isLoading?: boolean;
  errors?: string[];
}

const Form: React.FC<FormProps> = ({
  fields,
  initialValues = {},
  onSubmit,
  onCancel,
  submitLabel = 'Submit',
  isLoading = false,
  errors = []
}) => {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (name: string, value: string) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach(field => {
      const value = values[field.name] || '';
      
      // Required field validation
      if (field.required && !value.trim()) {
        newErrors[field.name] = `${field.label} is required`;
        return;
      }

      // Custom validation
      if (field.validation && value) {
        const error = field.validation(value);
        if (error) {
          newErrors[field.name] = error;
        }
      }
    });

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const renderField = (field: FormField) => {
    const value = values[field.name] || '';
    const error = fieldErrors[field.name];
    const baseClasses = `mt-1 block w-full px-3 py-3 sm:py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm touch-manipulation ${
      error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
    }`;

    return (
      <div key={field.name} className="mb-4 sm:mb-6">
        <label htmlFor={field.name} className="block text-sm sm:text-sm font-medium text-gray-700 mb-2">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {field.type === 'textarea' ? (
          <textarea
            id={field.name}
            rows={4}
            className={baseClasses}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            disabled={isLoading}
          />
        ) : field.type === 'select' ? (
          <select
            id={field.name}
            className={baseClasses}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            disabled={isLoading}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={field.name}
            type={field.type}
            className={baseClasses}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            disabled={isLoading}
            autoComplete={field.type === 'email' ? 'email' : field.type === 'text' ? 'off' : undefined}
          />
        )}
        
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 sm:p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {errors.length === 1 ? 'Error' : 'Errors'}
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {fields.map(renderField)}

      <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:space-x-3 pt-6 sm:pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-4 py-3 sm:py-2 text-base sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 touch-manipulation"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto px-4 py-3 sm:py-2 text-base sm:text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
        >
          {isLoading ? 'Loading...' : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default Form;