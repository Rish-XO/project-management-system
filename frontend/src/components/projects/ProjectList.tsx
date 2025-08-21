import React from 'react';
import { useQuery } from '@apollo/client';
import { PROJECTS_BY_ORGANIZATION } from '../../graphql/queries';
import { Project, Organization } from '../../types';
import ProjectCard from './ProjectCard';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

interface ProjectListProps {
  organization: Organization;
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
  onEditProject?: (project: Project) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({
  organization,
  onSelectProject,
  onCreateProject,
  onEditProject
}) => {
  const { data, loading, error, refetch } = useQuery(PROJECTS_BY_ORGANIZATION, {
    variables: { organizationSlug: organization.slug },
    skip: !organization.slug
  });

  if (loading) return <LoadingSpinner text="Loading projects..." />;
  if (error) return <ErrorMessage message="Failed to load projects" onRetry={() => refetch()} />;

  const projects: Project[] = data?.projectsByOrganization || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Projects for {organization.name}
        </h2>
        <button
          onClick={onCreateProject}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          Create Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Yet</h3>
          <p className="text-gray-600 mb-4">Create your first project to get started</p>
          <button
            onClick={onCreateProject}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => onSelectProject(project)}
              onEdit={onEditProject ? () => onEditProject(project) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectList;