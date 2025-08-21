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
import { TASKS_BY_PROJECT } from '../../graphql/queries';
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
      { query: TASKS_BY_PROJECT, variables: { projectId: project.id } }
    ],
    errorPolicy: 'all'
  });

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isDragInProgress, setIsDragInProgress] = useState(false);

  // Configure sensors for desktop drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Require 5px movement before dragging starts
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
    setIsDragInProgress(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Clear drag states immediately for smooth animation
    setActiveTask(null);
    setIsDragInProgress(false);
    
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
      if (currentTask.assignee_email) {
        showIntegrationToast('email', `Status update sent`, currentTask.assignee_email);
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

  // Draggable Task Component
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
        className={`${isDragging ? 'opacity-50' : ''} cursor-grab active:cursor-grabbing`}
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

  // Droppable Column Component
  const TaskColumn = ({ 
    title, 
    tasks, 
    status, 
    bgColor 
  }: {
    title: string;
    tasks: Task[];
    status: string;
    bgColor: string;
  }) => {
    const { isOver, setNodeRef } = useDroppable({
      id: `column-${status}`,
    });

    return (
      <div className="flex-1 bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <span className={`${bgColor} text-white text-sm px-2 py-1 rounded-full`}>
            {tasks.length}
          </span>
        </div>
        
        <div
          ref={setNodeRef}
          className={`
            space-y-3 min-h-[400px] rounded-lg p-3 border-2 border-dashed transition-all duration-200
            ${isOver 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
            }
          `}
        >
          {tasks.map(task => (
            <DraggableTask key={task.id} task={task} />
          ))}
          
          {tasks.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <div className="mb-2">
                <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm font-medium">No {title.toLowerCase()} tasks</p>
              <p className="text-xs mt-1">Drag tasks here</p>
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
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
            <p className="text-gray-600">{project.description}</p>
          </div>
          <button
            onClick={onCreateTask}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Add Task
          </button>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TaskColumn
            title="To Do"
            tasks={todoTasks}
            status="TODO"
            bgColor="bg-gray-500"
          />
          <TaskColumn
            title="In Progress"
            tasks={inProgressTasks}
            status="IN_PROGRESS"
            bgColor="bg-blue-500"
          />
          <TaskColumn
            title="Done"
            tasks={doneTasks}
            status="DONE"
            bgColor="bg-green-500"
          />
        </div>

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tasks Yet</h3>
            <p className="text-gray-600 mb-4">Create your first task to get started</p>
            <button
              onClick={onCreateTask}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
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