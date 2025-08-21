import { gql } from '@apollo/client';
import { ORGANIZATION_FIELDS, PROJECT_FIELDS, TASK_FIELDS, TASK_WITH_PROJECT, COMMENT_FIELDS } from './fragments';

// Organizations
export const ORGANIZATION_LIST = gql`
  query OrganizationList {
    organizationList {
      ...OrganizationFields
    }
  }
  ${ORGANIZATION_FIELDS}
`;

export const ORGANIZATION_DETAIL = gql`
  query OrganizationDetail($slug: String!) {
    organizationDetail(slug: $slug) {
      ...OrganizationFields
    }
  }
  ${ORGANIZATION_FIELDS}
`;

// Projects
export const PROJECTS_BY_ORGANIZATION = gql`
  query ProjectsByOrganization($organizationSlug: String!) {
    projectsByOrganization(organizationSlug: $organizationSlug) {
      ...ProjectFields
    }
  }
  ${PROJECT_FIELDS}
`;

export const PROJECT_DETAIL = gql`
  query ProjectDetail($id: ID!) {
    projectDetail(id: $id) {
      ...ProjectFields
    }
  }
  ${PROJECT_FIELDS}
`;

export const PROJECT_STATISTICS = gql`
  query ProjectStatistics($projectId: ID!) {
    projectStatistics(projectId: $projectId) {
      projectId
      totalTasks
      completedTasks
      inProgressTasks
      todoTasks
      completionPercentage
    }
  }
`;

// Tasks
export const TASKS_BY_PROJECT = gql`
  query TasksByProject($projectId: ID!) {
    tasksByProject(projectId: $projectId) {
      ...TaskFields
      comments {
        ...CommentFields
      }
    }
  }
  ${TASK_FIELDS}
  ${COMMENT_FIELDS}
`;

export const TASK_DETAIL = gql`
  query TaskDetail($id: ID!) {
    taskDetail(id: $id) {
      ...TaskWithProject
      comments {
        ...CommentFields
      }
    }
  }
  ${TASK_WITH_PROJECT}
  ${COMMENT_FIELDS}
`;