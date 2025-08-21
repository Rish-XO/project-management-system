import React, { useState } from 'react';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './appollo';
import { Organization, Project, Task } from './types';
import OrganizationSelector from './components/organizations/OrganizationSelector';
import ProjectList from './components/projects/ProjectList';
import TaskBoard from './components/tasks/TaskBoard';
import CreateProjectModal from './components/projects/CreateProjectModal';
import EditProjectModal from './components/projects/EditProjectModal';
import CreateTaskModal from './components/tasks/CreateTaskModal';
import EditTaskModal from './components/tasks/EditTaskModal';
import TaskCommentsPanel from './components/tasks/TaskCommentsPanel';
import Modal from './components/common/Modal';

type View = 'projects' | 'tasks' | 'task-detail';

function ProjectManagementApp() {
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | undefined>();
  const [selectedProject, setSelectedProject] = useState<Project | undefined>();
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
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
        <>
          <EditTaskModal
            isOpen={showEditTask}
            onClose={closeAllModals}
            task={selectedTask}
          />
          <Modal
            isOpen={showTaskDetail}
            onClose={closeAllModals}
            title={`Task: ${selectedTask.title}`}
            size="lg"
          >
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedTask.description || 'No description provided'}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className="ml-2">{selectedTask.status.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Assignee:</span>
                  <span className="ml-2">{selectedTask.assigneeEmail || 'Unassigned'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Due Date:</span>
                  <span className="ml-2">
                    {selectedTask.dueDate 
                      ? new Date(selectedTask.dueDate).toLocaleString()
                      : 'No due date'
                    }
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <span className="ml-2">{new Date(selectedTask.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <TaskCommentsPanel task={selectedTask} />

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowTaskDetail(false);
                    setShowEditTask(true);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Edit Task
                </button>
              </div>
            </div>
          </Modal>
        </>
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