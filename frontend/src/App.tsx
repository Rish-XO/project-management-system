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
import { ToastProvider, useToast } from './components/common/ToastContainer';

type View = 'projects' | 'tasks' | 'task-detail';

function ProjectManagementApp() {
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | undefined>();
  const [selectedProject, setSelectedProject] = useState<Project | undefined>();
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();
  const [currentView, setCurrentView] = useState<View>('projects');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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
    setIsMobileMenuOpen(false);
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
          <div className="flex justify-between items-center py-3 lg:py-4">
            {/* Logo and Back Button */}
            <div className="flex items-center space-x-2 lg:space-x-4 min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent truncate">
                <span className="hidden sm:inline">Project Management System</span>
                <span className="sm:hidden">PMS</span>
              </h1>
              {currentView === 'tasks' && selectedProject && (
                <button
                  onClick={handleBackToProjects}
                  className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200 flex-shrink-0 touch-manipulation"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">Back to Projects</span>
                  <span className="sm:hidden">Back</span>
                </button>
              )}
            </div>
            
            {/* Desktop Organization Selector */}
            <div className="hidden lg:flex items-center space-x-4">
              <div className="w-64">
                <OrganizationSelector
                  selectedOrganization={selectedOrganization}
                  onSelect={handleOrganizationSelect}
                />
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {!isMobileMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className={`lg:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200">
              <div className="px-3 py-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Organization
                </label>
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
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {!selectedOrganization ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-2 0H5m14 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Select an Organization</h3>
            <p className="text-sm sm:text-base text-gray-600 px-4">
              <span className="hidden sm:inline">Choose an organization from the dropdown to view projects and tasks</span>
              <span className="sm:hidden">Tap the menu button above to select an organization</span>
            </p>
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
      <ToastProvider>
        <ProjectManagementApp />
      </ToastProvider>
    </ApolloProvider>
  );
}

export default App;