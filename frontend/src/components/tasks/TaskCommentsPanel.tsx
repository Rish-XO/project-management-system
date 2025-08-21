import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { TASKS_BY_PROJECT } from '../../graphql/queries';
import { ADD_TASK_COMMENT } from '../../graphql/mutations';
import { Task, TaskComment } from '../../types';

interface TaskCommentsPanelProps {
  task: Task;
}

const TaskCommentsPanel: React.FC<TaskCommentsPanelProps> = ({ task }) => {
  const [newComment, setNewComment] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Early return with loading state if task is not properly loaded
  if (!task || !task.id || !task.project || !task.project.id) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading task details...</p>
        </div>
      </div>
    );
  }

  const [addTaskComment] = useMutation(ADD_TASK_COMMENT, {
    refetchQueries: task.project?.id ? [
      { query: TASKS_BY_PROJECT, variables: { projectId: task.project.id } }
    ] : [],
    errorPolicy: 'all'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !authorEmail.trim()) {
      setError('Both comment and email are required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await addTaskComment({
        variables: {
          taskId: task.id,
          content: newComment.trim(),
          authorEmail: authorEmail.trim()
        }
      });

      if (result.data?.addTaskComment?.success) {
        setNewComment('');
        setAuthorEmail('');
      } else {
        setError(result.data?.addTaskComment?.errors?.[0] || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Add comment error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="font-medium text-gray-900 mb-4">
        Comments ({task.comments?.length || 0})
      </h4>

      {/* Comments List */}
      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
        {task.comments && task.comments.length > 0 ? (
          task.comments.map((comment: TaskComment) => (
            <div key={comment.id} className="bg-white rounded-md p-3 border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-gray-900">
                  {comment.authorEmail}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(comment.timestamp)}
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="authorEmail" className="block text-sm font-medium text-gray-700 mb-1">
            Your Email
          </label>
          <input
            id="authorEmail"
            type="email"
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="newComment" className="block text-sm font-medium text-gray-700 mb-1">
            Add Comment
          </label>
          <textarea
            id="newComment"
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write your comment..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            disabled={isSubmitting}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim() || !authorEmail.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Adding...' : 'Add Comment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskCommentsPanel;