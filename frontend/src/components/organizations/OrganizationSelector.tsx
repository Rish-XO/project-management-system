import React from 'react';
import { useQuery } from '@apollo/client';
import { ORGANIZATION_LIST } from '../../graphql/queries';
import { Organization } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

interface OrganizationSelectorProps {
  selectedOrganization?: Organization;
  onSelect: (organization: Organization) => void;
}

const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({
  selectedOrganization,
  onSelect
}) => {
  const { data, loading, error, refetch } = useQuery(ORGANIZATION_LIST);

  if (loading) return <LoadingSpinner size="small" />;
  if (error) return <ErrorMessage message="Failed to load organizations" onRetry={() => refetch()} />;

  const organizations: Organization[] = data?.organizationList || [];

  return (
    <div className="relative">
      <select
        value={selectedOrganization?.id || ''}
        onChange={(e) => {
          const org = organizations.find(o => o.id === e.target.value);
          if (org) onSelect(org);
        }}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Select Organization</option>
        {organizations.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
      {selectedOrganization && (
        <div className="mt-1 text-sm text-gray-600">
          {selectedOrganization.contactEmail}
        </div>
      )}
    </div>
  );
};

export default OrganizationSelector;