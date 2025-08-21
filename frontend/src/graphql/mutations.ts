import { gql } from '@apollo/client';
import { ORGANIZATION_FIELDS, PROJECT_FIELDS, TASK_FIELDS, COMMENT_FIELDS } from './fragments';

// Organization Mutations
export const CREATE_ORGANIZATION = gql`
  mutation CreateOrganization($name: String!, $contactEmail: String!) {
    createOrganization(name: $name, contactEmail: $contactEmail) {
      organization {
        ...OrganizationFields
      }
      success
      errors
    }
  }
  ${ORGANIZATION_FIELDS}
`;

export const UPDATE_ORGANIZATION = gql`
  mutation UpdateOrganization($id: ID!, $name: String, $contactEmail: String) {
    updateOrganization(id: $id, name: $name, contactEmail: $contactEmail) {
      organization {
        ...OrganizationFields
      }
      success
      errors
    }
  }
  ${ORGANIZATION_FIELDS}
`;

// Project Mutations
export const CREATE_PROJECT = gql`
  mutation CreateProject(
    $organizationId: ID!
    $name: String!
    $description: String
    $status: String
    $dueDate: Date
  ) {
    createProject(
      organizationId: $organizationId
      name: $name
      description: $description
      status: $status
      dueDate: $dueDate
    ) {
      project {
        ...ProjectFields
      }
      success
      errors
    }
  }
  ${PROJECT_FIELDS}
`;

export const UPDATE_PROJECT = gql`
  mutation UpdateProject(
    $id: ID!
    $name: String
    $description: String
    $status: String
    $dueDate: Date
  ) {
    updateProject(
      id: $id
      name: $name
      description: $description
      status: $status
      dueDate: $dueDate
    ) {
      project {
        ...ProjectFields
      }
      success
      errors
    }
  }
  ${PROJECT_FIELDS}
`;

// Task Mutations
export const CREATE_TASK = gql`
  mutation CreateTask(
    $projectId: ID!
    $title: String!
    $description: String
    $assigneeEmail: String
    $dueDate: DateTime
  ) {
    createTask(
      projectId: $projectId
      title: $title
      description: $description
      assigneeEmail: $assigneeEmail
      dueDate: $dueDate
    ) {
      task {
        ...TaskFields
      }
      success
      errors
    }
  }
  ${TASK_FIELDS}
`;

export const UPDATE_TASK = gql`
  mutation UpdateTask(
    $id: ID!
    $title: String
    $description: String
    $assigneeEmail: String
    $dueDate: DateTime
  ) {
    updateTask(
      id: $id
      title: $title
      description: $description
      assigneeEmail: $assigneeEmail
      dueDate: $dueDate
    ) {
      task {
        ...TaskFields
      }
      success
      errors
    }
  }
  ${TASK_FIELDS}
`;

export const UPDATE_TASK_STATUS = gql`
  mutation UpdateTaskStatus($id: ID!, $status: String!) {
    updateTaskStatus(id: $id, status: $status) {
      task {
        ...TaskFields
      }
      success
      errors
    }
  }
  ${TASK_FIELDS}
`;

// Comment Mutations
export const ADD_TASK_COMMENT = gql`
  mutation AddTaskComment($taskId: ID!, $content: String!, $authorEmail: String!) {
    addTaskComment(taskId: $taskId, content: $content, authorEmail: $authorEmail) {
      comment {
        ...CommentFields
      }
      success
      errors
    }
  }
  ${COMMENT_FIELDS}
`;