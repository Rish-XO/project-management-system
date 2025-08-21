import { gql } from '@apollo/client';

// Reusable GraphQL fragments

export const ORGANIZATION_FIELDS = gql`
  fragment OrganizationFields on OrganizationType {
    id
    name
    slug
    contactEmail
    createdAt
  }
`;

export const PROJECT_FIELDS = gql`
  fragment ProjectFields on ProjectType {
    id
    name
    description
    status
    dueDate
    createdAt
    updatedAt
    taskCount
    completedTasks
    completionPercentage
    organization {
      ...OrganizationFields
    }
  }
  ${ORGANIZATION_FIELDS}
`;

export const TASK_FIELDS = gql`
  fragment TaskFields on TaskType {
    id
    title
    description
    status
    assigneeEmail
    dueDate
    createdAt
    updatedAt
    isOverdue
  }
`;

export const TASK_WITH_PROJECT = gql`
  fragment TaskWithProject on TaskType {
    ...TaskFields
    project {
      id
      name
      status
    }
  }
  ${TASK_FIELDS}
`;

export const COMMENT_FIELDS = gql`
  fragment CommentFields on TaskCommentType {
    id
    content
    authorEmail
    timestamp
  }
`;