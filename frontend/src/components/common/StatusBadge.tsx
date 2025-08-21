import React from 'react';

interface StatusBadgeProps {
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'TODO' | 'IN_PROGRESS' | 'DONE';
  size?: 'small' | 'medium';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium' }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
      case 'DONE':
        return 'bg-green-100 text-green-800';
      case 'ON_HOLD':
      case 'TODO':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDisplayText = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'ON_HOLD':
        return 'On Hold';
      case 'TODO':
        return 'To Do';
      default:
        return status.charAt(0) + status.slice(1).toLowerCase();
    }
  };

  const sizeClasses = size === 'small' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`${getStatusColor(status)} ${sizeClasses} rounded-full font-medium`}>
      {getDisplayText(status)}
    </span>
  );
};

export default StatusBadge;