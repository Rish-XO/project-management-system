import React from 'react';
import { Project } from '../../types';
import StatusBadge from '../common/StatusBadge';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  onEdit?: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, onEdit }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = project.dueDate && new Date(project.dueDate) < new Date();

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer touch-manipulation active:scale-[0.98]"
    >
      <div className="flex justify-between items-start mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate pr-2">{project.name}</h3>
        <div className="flex items-center space-x-2 flex-shrink-0">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="text-gray-400 hover:text-blue-600 transition-colors p-2 -m-2 touch-manipulation"
              title="Edit project"
            >
              <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          <StatusBadge status={project.status} size="small" />
        </div>
      </div>

      <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">{project.description || 'No description'}</p>

      <div className="space-y-2 sm:space-y-3">
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-gray-500">Tasks:</span>
          <span className="font-medium">
            {project.completedTasks}/{project.taskCount}
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${project.completionPercentage}%` }}
          ></div>
        </div>

        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-gray-500">Progress:</span>
          <span className="font-medium">{project.completionPercentage}%</span>
        </div>

        <div className="flex justify-between text-xs sm:text-sm pt-2 border-t border-gray-100">
          <span className="text-gray-500">Due:</span>
          <span className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
            {formatDate(project.dueDate)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;