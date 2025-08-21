import React from 'react';
import { Task } from '../../types';
import StatusBadge from '../common/StatusBadge';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onEdit?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, onEdit }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-all cursor-pointer touch-manipulation active:scale-[0.98]"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900 text-xs sm:text-sm truncate flex-1 mr-2">{task.title}</h4>
        <div className="flex items-center space-x-1 flex-shrink-0">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="text-gray-400 hover:text-blue-600 transition-colors p-2 -m-2 touch-manipulation"
              title="Edit task"
            >
              <svg className="w-4 h-4 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          <StatusBadge status={task.status} size="small" />
        </div>
      </div>

      {task.description && (
        <p className="text-gray-600 text-xs mb-2 sm:mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="space-y-1 sm:space-y-2">
        {task.assigneeEmail && (
          <div className="flex items-center text-xs text-gray-500 truncate">
            <svg className="h-3 w-3 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            <span className="truncate">{task.assigneeEmail}</span>
          </div>
        )}

        {task.dueDate && (
          <div className={`flex items-center text-xs ${task.isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
            <svg className="h-3 w-3 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span>{formatDate(task.dueDate)}</span>
            {task.isOverdue && <span className="ml-1 text-red-600">•</span>}
          </div>
        )}

        {task.comments && task.comments.length > 0 && (
          <div className="flex items-center text-xs text-gray-500">
            <svg className="h-3 w-3 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            <span>{task.comments.length} comment{task.comments.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;