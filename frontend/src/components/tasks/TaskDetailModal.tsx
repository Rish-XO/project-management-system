import React from 'react';
import { useQuery } from '@apollo/client';
import { TASK_DETAIL } from '../../graphql/queries';
import { Task } from '../../types';
import Modal from '../common/Modal';
import TaskCommentsPanel from './TaskCommentsPanel';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  onEditTask: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  taskId,
  onEditTask
}) => {
  const { data, loading, error, refetch } = useQuery(TASK_DETAIL, {
    variables: { id: taskId },
    skip: !isOpen || !taskId,
    fetchPolicy: 'cache-and-network', // Always fetch fresh data
    errorPolicy: 'all'
  });

  const task: Task | null = data?.taskDetail || null;

  const handleEditClick = () => {
    onClose();
    onEditTask();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task ? `Task: ${task.title}` : 'Task Details'}
      size="lg"
    >
      <div className="space-y-4">
        {loading && (
          <div className="py-8">
            <LoadingSpinner text="Loading task details..." />
          </div>
        )}

        {error && !task && (
          <ErrorMessage 
            message="Failed to load task details" 
            onRetry={() => refetch()}
          />
        )}

        {task && (
          <>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-gray-700 whitespace-pre-wrap">
                {task.description || 'No description provided'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span className="ml-2">{task.status.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Assignee:</span>
                <span className="ml-2">{task.assigneeEmail || 'Unassigned'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Due Date:</span>
                <span className="ml-2">
                  {task.dueDate 
                    ? new Date(task.dueDate).toLocaleString()
                    : 'No due date'
                  }
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Created:</span>
                <span className="ml-2">{new Date(task.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <TaskCommentsPanel task={task} />

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleEditClick}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Edit Task
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default TaskDetailModal;