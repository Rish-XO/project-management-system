import React, { useState } from 'react';
import { ApolloProvider, useQuery } from '@apollo/client';
import { apolloClient } from './appollo';
import { TASK_DETAIL } from './graphql/queries';
import { Organization, Project, Task } from './types';
import OrganizationSelector from './components/organizations/OrganizationSelector';
import ProjectList from './components/projects/ProjectList';
import TaskBoard from './components/tasks/TaskBoard';
import CreateProjectModal from './components/projects/CreateProjectModal';
import EditProjectModal from './components/projects/EditProjectModal';
import CreateTaskModal from './components/tasks/CreateTaskModal';
import EditTaskModal from './components/tasks/EditTaskModal';
import TaskDetailModal from './components/tasks/TaskDetailModal';

type View = 'projects' | 'tasks' | 'task-detail';

function ProjectManagementApp() {
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | undefined>();
  const [selectedProject, setSelectedProject] = useState<Project | undefined>();
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();
  const [currentView, setCurrentView] = useState<View>('projects');
  
  // Modal states
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);

  const handleOrganizationSelect = (organization: Organization) => {
    setSelectedOrganization(organization);
    setSelectedProject(undefined);
    setCurrentView('projects');
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setCurrentView('tasks');
  };

  const handleBackToProjects = () => {
    setSelectedProject(undefined);
    setCurrentView('projects');
  };

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
    setSelectedTaskId(task.id);
    setShowTaskDetail(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setShowEditProject(true);
  };

  const closeAllModals = () => {
    setShowCreateProject(false);
    setShowEditProject(false);
    setShowCreateTask(false);
    setShowEditTask(false);
    setShowTaskDetail(false);
    setSelectedTask(undefined);
    setSelectedTaskId(undefined);
  };

  const handleTaskUpdated = () => {
    // The EditTaskModal will trigger Apollo cache updates via awaitRefetchQueries
    // This ensures fresh data is available when the detail modal stays open
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Project Management System
              </h1>
              {currentView === 'tasks' && selectedProject && (
                <button
                  onClick={handleBackToProjects}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  ← Back to Projects
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-64">
                <OrganizationSelector
                  selectedOrganization={selectedOrganization}
                  onSelect={handleOrganizationSelect}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedOrganization ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-2 0H5m14 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select an Organization</h3>
            <p className="text-gray-600">Choose an organization from the dropdown to view projects and tasks</p>
          </div>
        ) : currentView === 'projects' ? (
          <ProjectList
            organization={selectedOrganization}
            onSelectProject={handleProjectSelect}
            onCreateProject={() => setShowCreateProject(true)}
            onEditProject={handleEditProject}
          />
        ) : selectedProject ? (
          <TaskBoard
            project={selectedProject}
            onEditTask={(task: Task) => {
              setSelectedTask(task);
              setShowEditTask(true);
            }}
            onCreateTask={() => setShowCreateTask(true)}
            onTaskClick={handleTaskSelect}
          />
        ) : null}
      </main>

      {/* Modals */}
      {selectedOrganization && (
        <CreateProjectModal
          isOpen={showCreateProject}
          onClose={closeAllModals}
          organization={selectedOrganization}
        />
      )}

      {selectedProject && (
        <>
          <EditProjectModal
            isOpen={showEditProject}
            onClose={closeAllModals}
            project={selectedProject}
          />
          <CreateTaskModal
            isOpen={showCreateTask}
            onClose={closeAllModals}
            project={selectedProject}
          />
        </>
      )}

      {selectedTask && (
        <EditTaskModal
          isOpen={showEditTask}
          onClose={closeAllModals}
          task={selectedTask}
          projectId={selectedProject?.id}
          onTaskUpdated={handleTaskUpdated}
        />
      )}

      {selectedTaskId && (
        <TaskDetailModal
          isOpen={showTaskDetail}
          onClose={closeAllModals}
          taskId={selectedTaskId}
          onEditTask={() => {
            setShowTaskDetail(false);
            setShowEditTask(true);
          }}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <ProjectManagementApp />
    </ApolloProvider>
  );
}

export default App;