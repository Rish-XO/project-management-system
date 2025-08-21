import React from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { TASKS_BY_PROJECT } from '../../graphql/queries';
import { UPDATE_TASK_STATUS } from '../../graphql/mutations';
import { Task, Project } from '../../types';
import TaskCard from './TaskCard';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

interface TaskBoardProps {
  project: Project;
  onEditTask: (task: Task) => void;
  onCreateTask: () => void;
  onTaskClick?: (task: Task) => void;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ project, onEditTask, onCreateTask, onTaskClick }) => {
  const { data, loading, error, refetch } = useQuery(TASKS_BY_PROJECT, {
    variables: { projectId: project.id },
    skip: !project.id
  });

  const [updateTaskStatus] = useMutation(UPDATE_TASK_STATUS, {
    refetchQueries: [
      { query: TASKS_BY_PROJECT, variables: { projectId: project.id } }
    ]
  });

  if (loading) return <LoadingSpinner text="Loading tasks..." />;
  if (error) return <ErrorMessage message="Failed to load tasks" onRetry={() => refetch()} />;

  const tasks: Task[] = data?.tasksByProject || [];

  const todoTasks = tasks.filter(task => task.status === 'TODO');
  const inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS');
  const doneTasks = tasks.filter(task => task.status === 'DONE');

  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    // If dropped outside or in the same position, do nothing
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    // Map droppable IDs to task statuses
    const statusMap: { [key: string]: string } = {
      'TODO': 'TODO',
      'IN_PROGRESS': 'IN_PROGRESS', 
      'DONE': 'DONE'
    };

    const newStatus = statusMap[destination.droppableId];
    if (!newStatus) return;

    try {
      await updateTaskStatus({
        variables: {
          id: draggableId,
          status: newStatus
        }
      });
    } catch (error) {
      console.error('Failed to update task status:', error);
      // You could add a toast notification here
    }
  };

  const Column = ({ title, tasks, status, bgColor }: {
    title: string;
    tasks: Task[];
    status: string;
    bgColor: string;
  }) => (
    <div className="flex-1 bg-gray-50 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className={`${bgColor} text-white text-sm px-2 py-1 rounded-full`}>
          {tasks.length}
        </span>
      </div>
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-3 min-h-[200px] rounded-lg transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-blue-200 border-dashed' : ''
            }`}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`${snapshot.isDragging ? 'transform rotate-2 shadow-lg' : ''}`}
                  >
                    <TaskCard
                      task={task}
                      onClick={() => onTaskClick ? onTaskClick(task) : onEditTask(task)}
                      onEdit={() => onEditTask(task)}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {tasks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No {title.toLowerCase()} tasks</p>
                <p className="text-xs mt-1">Drag tasks here</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="space-y-6">
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

        <div className="flex gap-6 overflow-x-auto pb-4">
        <Column
          title="To Do"
          tasks={todoTasks}
          status="TODO"
          bgColor="bg-gray-500"
        />
        <Column
          title="In Progress"
          tasks={inProgressTasks}
          status="IN_PROGRESS"
          bgColor="bg-blue-500"
        />
        <Column
          title="Done"
          tasks={doneTasks}
          status="DONE"
          bgColor="bg-green-500"
        />
      </div>

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
    </DragDropContext>
  );
};

export default TaskBoard;