import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { TASKS_BY_PROJECT, PROJECTS_BY_ORGANIZATION } from '../../graphql/queries';
import { UPDATE_TASK_STATUS } from '../../graphql/mutations';
import { Task, Project } from '../../types';
import TaskCard from './TaskCard';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { useToast } from '../common/ToastContainer';

interface TaskBoardProps {
  project: Project;
  onEditTask: (task: Task) => void;
  onCreateTask: () => void;
  onTaskClick?: (task: Task) => void;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ project, onEditTask, onCreateTask, onTaskClick }) => {
  const { showIntegrationToast } = useToast();
  const { data, loading, error, refetch } = useQuery(TASKS_BY_PROJECT, {
    variables: { projectId: project.id },
    skip: !project.id
  });

  const [updateTaskStatus] = useMutation(UPDATE_TASK_STATUS, {
    refetchQueries: [
      { query: TASKS_BY_PROJECT, variables: { projectId: project.id } },
      { query: PROJECTS_BY_ORGANIZATION, variables: { organizationSlug: project.organization?.slug } }
    ],
    errorPolicy: 'all'
  });

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedMobileColumn, setSelectedMobileColumn] = useState<string>('TODO');

  // Configure sensors for desktop drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Require 3px movement before dragging starts (more sensitive)
        tolerance: 5, // Allow 5px tolerance for pointer movements
        delay: 0, // No delay for activation
      },
    })
  );

  const tasks: Task[] = data?.tasksByProject || [];

  if (loading) return <LoadingSpinner text="Loading tasks..." />;
  if (error) return <ErrorMessage message="Failed to load tasks" onRetry={() => refetch()} />;

  const todoTasks = tasks.filter(task => task.status === 'TODO');
  const inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS');
  const doneTasks = tasks.filter(task => task.status === 'DONE');

  const handleDragStart = (event: DragStartEvent) => {
    const draggedTask = tasks.find(task => task.id === event.active.id);
    setActiveTask(draggedTask || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Clear drag states immediately for smooth animation
    setActiveTask(null);
    
    if (!over || !active) {
      return;
    }

    const taskId = active.id as string;
    const dropZone = over.id as string;

    // Map drop zone IDs to task statuses
    const statusMapping = {
      'column-TODO': 'TODO',
      'column-IN_PROGRESS': 'IN_PROGRESS',
      'column-DONE': 'DONE'
    } as const;

    const newStatus = statusMapping[dropZone as keyof typeof statusMapping];
    
    if (!newStatus) {
      return;
    }

    const currentTask = tasks.find(task => task.id === taskId);
    if (!currentTask || currentTask.status === newStatus) {
      return;
    }

    console.log(`Moving task ${taskId} from ${currentTask.status} to ${newStatus}`);

    // Use Apollo Client's optimistic response for smooth animations
    try {
      await updateTaskStatus({
        variables: {
          id: taskId,
          status: newStatus
        },
        optimisticResponse: {
          updateTaskStatus: {
            __typename: 'UpdateTaskStatus',
            success: true,
            errors: [],
            task: {
              ...currentTask,
              status: newStatus
            }
          }
        },
        update: (cache, { data }) => {
          // Only update cache if the mutation was successful
          if (data?.updateTaskStatus?.success) {
            // Apollo will automatically update the cache based on refetchQueries
            // but the optimisticResponse provides immediate visual feedback
          }
        }
      });
      
      // Show integration notifications
      if (currentTask.assigneeEmail) {
        showIntegrationToast('email', `Status update sent`, currentTask.assigneeEmail);
      }
      
      if (newStatus === 'DONE') {
        showIntegrationToast('slack', `Task completion posted`, `#${project.organization.slug}`);
      } else {
        showIntegrationToast('slack', `Status change posted`, `#${project.organization.slug}`);
      }
      
    } catch (error) {
      console.error('Failed to update task status:', error);
      // Apollo Client will automatically revert optimistic updates on error
    }
  };

  // Mobile Status Change Function
  const handleMobileStatusChange = async (task: Task, newStatus: string) => {
    if (task.status === newStatus) return;

    try {
      await updateTaskStatus({
        variables: {
          id: task.id,
          status: newStatus
        },
        optimisticResponse: {
          updateTaskStatus: {
            __typename: 'UpdateTaskStatus',
            success: true,
            errors: [],
            task: {
              ...task,
              status: newStatus
            }
          }
        }
      });
      
      // Show integration notifications
      if (task.assigneeEmail) {
        showIntegrationToast('email', `Status update sent`, task.assigneeEmail);
      }
      
      if (newStatus === 'DONE') {
        showIntegrationToast('slack', `Task completion posted`, `#${project.organization.slug}`);
      } else {
        showIntegrationToast('slack', `Status change posted`, `#${project.organization.slug}`);
      }
      
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  // Draggable Task Component (Desktop)
  const DraggableTask = ({ task }: { task: Task }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: task.id,
    });

    const style = transform ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`${isDragging ? 'opacity-50' : ''} cursor-grab active:cursor-grabbing hidden md:block`}
        {...listeners}
        {...attributes}
      >
        <div className="relative">
          <TaskCard
            task={task}
            onClick={() => {
              onTaskClick ? onTaskClick(task) : onEditTask(task);
            }}
            onEdit={() => {
              onEditTask(task);
            }}
          />
        </div>
      </div>
    );
  };

  // Mobile Task Component with Status Controls
  const MobileTask = ({ task }: { task: Task }) => {
    const [showStatusMenu, setShowStatusMenu] = useState(false);

    const statusOptions = [
      { key: 'TODO', label: 'To Do', color: 'text-gray-600' },
      { key: 'IN_PROGRESS', label: 'In Progress', color: 'text-blue-600' },
      { key: 'DONE', label: 'Done', color: 'text-green-600' }
    ];

    const currentStatus = statusOptions.find(s => s.key === task.status);

    return (
      <div className="md:hidden relative">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
          <div className="flex justify-between items-start">
            <h4 
              className="font-medium text-gray-900 text-sm flex-1 mr-2 cursor-pointer"
              onClick={() => onTaskClick ? onTaskClick(task) : onEditTask(task)}
            >
              {task.title}
            </h4>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onEditTask(task)}
                className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                title="Edit task"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          </div>

          {task.description && (
            <p className="text-gray-600 text-xs line-clamp-2">{task.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            {task.assigneeEmail && (
              <div className="flex items-center">
                <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                {task.assigneeEmail}
              </div>
            )}

            {task.dueDate && (
              <div className={`flex items-center ${task.isOverdue ? 'text-red-600' : ''}`}>
                <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : ''}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full border-2 ${currentStatus?.color} border-current`}
              >
                <span>{currentStatus?.label}</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showStatusMenu && (
                <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                  {statusOptions.map((status) => (
                    <button
                      key={status.key}
                      onClick={() => {
                        handleMobileStatusChange(task, status.key);
                        setShowStatusMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${
                        task.status === status.key ? status.color + ' font-medium' : 'text-gray-700'
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {task.comments && task.comments.length > 0 && (
              <div className="flex items-center text-xs text-gray-500">
                <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                {task.comments.length}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // To Do Column Component (copied from working columns)
  const ToDoColumn = ({ tasks }: { tasks: Task[] }) => {
    const { isOver, setNodeRef } = useDroppable({
      id: 'column-TODO',
    });

    return (
      <div className="flex-1 bg-gray-50 rounded-lg p-3 sm:p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">To Do</h3>
          <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>
        
        <div
          ref={setNodeRef}
          className={`
            space-y-3 min-h-[300px] sm:min-h-[400px] rounded-lg p-4 sm:p-6 border-2 border-dashed transition-all duration-200
            ${isOver 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
            }
          `}
        >
          {tasks.map(task => (
            <div key={task.id}>
              <DraggableTask task={task} />
              <MobileTask task={task} />
            </div>
          ))}
          
          {tasks.length === 0 && (
            <div className="text-center py-12 sm:py-16 text-gray-500">
              <div className="mb-2">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm font-medium">No to do tasks</p>
              <p className="text-xs mt-1 hidden md:block">Drag tasks here</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // In Progress Column Component (working reference)
  const InProgressColumn = ({ tasks }: { tasks: Task[] }) => {
    const { isOver, setNodeRef } = useDroppable({
      id: 'column-IN_PROGRESS',
    });

    return (
      <div className="flex-1 bg-gray-50 rounded-lg p-3 sm:p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">In Progress</h3>
          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>
        
        <div
          ref={setNodeRef}
          className={`
            space-y-3 min-h-[300px] sm:min-h-[400px] rounded-lg p-4 sm:p-6 border-2 border-dashed transition-all duration-200
            ${isOver 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
            }
          `}
        >
          {tasks.map(task => (
            <div key={task.id}>
              <DraggableTask task={task} />
              <MobileTask task={task} />
            </div>
          ))}
          
          {tasks.length === 0 && (
            <div className="text-center py-12 sm:py-16 text-gray-500">
              <div className="mb-2">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm font-medium">No in progress tasks</p>
              <p className="text-xs mt-1 hidden md:block">Drag tasks here</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Done Column Component (working reference)
  const DoneColumn = ({ tasks }: { tasks: Task[] }) => {
    const { isOver, setNodeRef } = useDroppable({
      id: 'column-DONE',
    });

    return (
      <div className="flex-1 bg-gray-50 rounded-lg p-3 sm:p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Done</h3>
          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>
        
        <div
          ref={setNodeRef}
          className={`
            space-y-3 min-h-[300px] sm:min-h-[400px] rounded-lg p-4 sm:p-6 border-2 border-dashed transition-all duration-200
            ${isOver 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
            }
          `}
        >
          {tasks.map(task => (
            <div key={task.id}>
              <DraggableTask task={task} />
              <MobileTask task={task} />
            </div>
          ))}
          
          {tasks.length === 0 && (
            <div className="text-center py-12 sm:py-16 text-gray-500">
              <div className="mb-2">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm font-medium">No done tasks</p>
              <p className="text-xs mt-1 hidden md:block">Drag tasks here</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{project.name}</h2>
            <p className="text-sm sm:text-base text-gray-600 line-clamp-2">{project.description}</p>
          </div>
          <button
            onClick={onCreateTask}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base flex-shrink-0"
          >
            <span className="hidden sm:inline">Add Task</span>
            <span className="sm:hidden">+ Add</span>
          </button>
        </div>

        {/* Mobile Column Selector */}
        <div className="md:hidden">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-4">
            {[
              { key: 'TODO', title: 'To Do', count: todoTasks.length, color: 'text-gray-600' },
              { key: 'IN_PROGRESS', title: 'In Progress', count: inProgressTasks.length, color: 'text-blue-600' },
              { key: 'DONE', title: 'Done', count: doneTasks.length, color: 'text-green-600' }
            ].map((column) => (
              <button
                key={column.key}
                onClick={() => setSelectedMobileColumn(column.key)}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                  selectedMobileColumn === column.key
                    ? 'bg-white shadow-sm ' + column.color
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="block">{column.title}</span>
                <span className="text-xs opacity-75">({column.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Columns Grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          <ToDoColumn tasks={todoTasks} />
          <InProgressColumn tasks={inProgressTasks} />
          <DoneColumn tasks={doneTasks} />
        </div>

        {/* Mobile Single Column View */}
        <div className="md:hidden">
          {selectedMobileColumn === 'TODO' && <ToDoColumn tasks={todoTasks} />}
          {selectedMobileColumn === 'IN_PROGRESS' && <InProgressColumn tasks={inProgressTasks} />}
          {selectedMobileColumn === 'DONE' && <DoneColumn tasks={doneTasks} />}
        </div>

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No Tasks Yet</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 px-4">Create your first task to get started</p>
            <button
              onClick={onCreateTask}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 rounded-lg transition-colors text-sm sm:text-base"
            >
              Add Task
            </button>
          </div>
        )}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask ? (
          <div className="transform rotate-2 shadow-2xl">
            <TaskCard
              task={activeTask}
              onClick={() => {}}
              onEdit={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default TaskBoard;