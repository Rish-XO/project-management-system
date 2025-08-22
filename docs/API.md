# GraphQL API Documentation

This document provides comprehensive documentation for the Project Management System GraphQL API.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [Schema Overview](#schema-overview)
- [Queries](#queries)
- [Mutations](#mutations)
- [Types](#types)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Overview

The Project Management System provides a GraphQL API that enables you to manage organizations, projects, tasks, and comments. The API follows GraphQL best practices and provides real-time capabilities for collaborative project management.

**Base URL**: `http://127.0.0.1:8000/graphql/`  
**Interactive Playground**: `http://127.0.0.1:8000/graphql/` (GraphiQL interface)

## Getting Started

### Prerequisites
- Django backend server running on port 8000
- PostgreSQL database configured and migrated

### Making Your First Request

```graphql
query {
  organizationList {
    id
    name
    slug
    contactEmail
    createdAt
  }
}
```

## Authentication

Currently, the API operates without authentication for development purposes. In production, you would typically implement:
- JWT tokens
- Session-based authentication
- API key authentication

## Schema Overview

The API is organized around four main entities:

1. **Organizations** - Multi-tenant containers for projects
2. **Projects** - Containers for tasks within an organization
3. **Tasks** - Individual work items with status tracking
4. **Task Comments** - Discussion threads on tasks

## Queries

### Organization Queries

#### `organizationList`
Retrieves all organizations in the system.

**Query:**
```graphql
query GetOrganizations {
  organizationList {
    id
    name
    slug
    contactEmail
    createdAt
  }
}
```

**Response:**
```json
{
  "data": {
    "organizationList": [
      {
        "id": "1",
        "name": "TechCorp",
        "slug": "techcorp",
        "contactEmail": "contact@techcorp.com",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

#### `organizationDetail`
Retrieves detailed information about a specific organization.

**Parameters:**
- `slug` (String, required): Organization slug identifier

**Query:**
```graphql
query GetOrganization($slug: String!) {
  organizationDetail(slug: $slug) {
    id
    name
    slug
    contactEmail
    createdAt
    projects {
      id
      name
      status
    }
  }
}
```

**Variables:**
```json
{
  "slug": "techcorp"
}
```

### Project Queries

#### `projectsByOrganization`
Retrieves all projects for a specific organization.

**Parameters:**
- `organizationSlug` (String, required): Organization slug

**Query:**
```graphql
query GetProjects($organizationSlug: String!) {
  projectsByOrganization(organizationSlug: $organizationSlug) {
    id
    name
    description
    status
    dueDate
    createdAt
    taskCount
    completedTaskCount
    progress
  }
}
```

**Response:**
```json
{
  "data": {
    "projectsByOrganization": [
      {
        "id": "1",
        "name": "Website Redesign",
        "description": "Complete website overhaul",
        "status": "ACTIVE",
        "dueDate": "2024-03-15T00:00:00Z",
        "createdAt": "2024-01-15T10:30:00Z",
        "taskCount": 15,
        "completedTaskCount": 8,
        "progress": 53.33
      }
    ]
  }
}
```

### Task Queries

#### `tasksByProject`
Retrieves all tasks for a specific project.

**Parameters:**
- `projectId` (ID, required): Project identifier

**Query:**
```graphql
query GetTasks($projectId: ID!) {
  tasksByProject(projectId: $projectId) {
    id
    title
    description
    status
    assigneeEmail
    dueDate
    isOverdue
    createdAt
    updatedAt
    comments {
      id
      content
      authorEmail
      timestamp
    }
  }
}
```

#### `taskDetail`
Retrieves detailed information about a specific task.

**Parameters:**
- `id` (ID, required): Task identifier

**Query:**
```graphql
query GetTaskDetail($id: ID!) {
  taskDetail(id: $id) {
    id
    title
    description
    status
    assigneeEmail
    dueDate
    isOverdue
    createdAt
    updatedAt
    project {
      id
      name
      organization {
        name
        slug
      }
    }
    comments {
      id
      content
      authorEmail
      timestamp
    }
  }
}
```

## Mutations

### Organization Mutations

#### `createOrganization`
Creates a new organization.

**Parameters:**
- `name` (String, required): Organization name
- `slug` (String, required): Unique slug identifier
- `contactEmail` (String, required): Contact email address

**Mutation:**
```graphql
mutation CreateOrganization($name: String!, $slug: String!, $contactEmail: String!) {
  createOrganization(name: $name, slug: $slug, contactEmail: $contactEmail) {
    organization {
      id
      name
      slug
      contactEmail
      createdAt
    }
    success
    errors
  }
}
```

**Variables:**
```json
{
  "name": "TechCorp",
  "slug": "techcorp",
  "contactEmail": "contact@techcorp.com"
}
```

#### `updateOrganization`
Updates an existing organization.

**Parameters:**
- `id` (ID, required): Organization ID
- `name` (String, optional): New organization name
- `contactEmail` (String, optional): New contact email

**Mutation:**
```graphql
mutation UpdateOrganization($id: ID!, $name: String, $contactEmail: String) {
  updateOrganization(id: $id, name: $name, contactEmail: $contactEmail) {
    organization {
      id
      name
      contactEmail
    }
    success
    errors
  }
}
```

### Project Mutations

#### `createProject`
Creates a new project within an organization.

**Parameters:**
- `organizationId` (ID, required): Organization ID
- `name` (String, required): Project name
- `description` (String, optional): Project description
- `dueDate` (DateTime, optional): Project due date

**Mutation:**
```graphql
mutation CreateProject($organizationId: ID!, $name: String!, $description: String, $dueDate: DateTime) {
  createProject(organizationId: $organizationId, name: $name, description: $description, dueDate: $dueDate) {
    project {
      id
      name
      description
      status
      dueDate
      createdAt
    }
    success
    errors
  }
}
```

#### `updateProject`
Updates an existing project.

**Parameters:**
- `id` (ID, required): Project ID
- `name` (String, optional): New project name
- `description` (String, optional): New description
- `status` (String, optional): New status (ACTIVE, COMPLETED, ON_HOLD)
- `dueDate` (DateTime, optional): New due date

**Mutation:**
```graphql
mutation UpdateProject($id: ID!, $name: String, $description: String, $status: String, $dueDate: DateTime) {
  updateProject(id: $id, name: $name, description: $description, status: $status, dueDate: $dueDate) {
    project {
      id
      name
      description
      status
      dueDate
    }
    success
    errors
  }
}
```

### Task Mutations

#### `createTask`
Creates a new task within a project.

**Parameters:**
- `projectId` (ID, required): Project ID
- `title` (String, required): Task title
- `description` (String, optional): Task description
- `assigneeEmail` (String, optional): Assignee email
- `dueDate` (DateTime, optional): Task due date

**Mutation:**
```graphql
mutation CreateTask($projectId: ID!, $title: String!, $description: String, $assigneeEmail: String, $dueDate: DateTime) {
  createTask(projectId: $projectId, title: $title, description: $description, assigneeEmail: $assigneeEmail, dueDate: $dueDate) {
    task {
      id
      title
      description
      status
      assigneeEmail
      dueDate
      createdAt
    }
    success
    errors
  }
}
```

#### `updateTask`
Updates an existing task.

**Parameters:**
- `id` (ID, required): Task ID
- `title` (String, optional): New task title
- `description` (String, optional): New description
- `assigneeEmail` (String, optional): New assignee email
- `dueDate` (DateTime, optional): New due date

**Mutation:**
```graphql
mutation UpdateTask($id: ID!, $title: String, $description: String, $assigneeEmail: String, $dueDate: DateTime) {
  updateTask(id: $id, title: $title, description: $description, assigneeEmail: $assigneeEmail, dueDate: $dueDate) {
    task {
      id
      title
      description
      assigneeEmail
      dueDate
      updatedAt
    }
    success
    errors
  }
}
```

#### `updateTaskStatus`
Updates the status of a task (used for drag-and-drop operations).

**Parameters:**
- `id` (ID, required): Task ID
- `status` (String, required): New status (TODO, IN_PROGRESS, DONE)

**Mutation:**
```graphql
mutation UpdateTaskStatus($id: ID!, $status: String!) {
  updateTaskStatus(id: $id, status: $status) {
    task {
      id
      status
      updatedAt
    }
    success
    errors
  }
}
```

### Comment Mutations

#### `addTaskComment`
Adds a comment to a task.

**Parameters:**
- `taskId` (ID, required): Task ID
- `content` (String, required): Comment content
- `authorEmail` (String, required): Author email

**Mutation:**
```graphql
mutation AddTaskComment($taskId: ID!, $content: String!, $authorEmail: String!) {
  addTaskComment(taskId: $taskId, content: $content, authorEmail: $authorEmail) {
    comment {
      id
      content
      authorEmail
      timestamp
      task {
        id
        title
      }
    }
    success
    errors
  }
}
```

## Types

### Organization Type
```graphql
type Organization {
  id: ID!
  name: String!
  slug: String!
  contactEmail: String!
  createdAt: DateTime!
  projects: [Project!]!
}
```

### Project Type
```graphql
type Project {
  id: ID!
  name: String!
  description: String!
  status: String!  # ACTIVE, COMPLETED, ON_HOLD
  dueDate: DateTime
  createdAt: DateTime!
  organization: Organization!
  tasks: [Task!]!
  taskCount: Int!
  completedTaskCount: Int!
  progress: Float!
}
```

### Task Type
```graphql
type Task {
  id: ID!
  title: String!
  description: String!
  status: String!  # TODO, IN_PROGRESS, DONE
  assigneeEmail: String!
  dueDate: DateTime
  isOverdue: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
  project: Project!
  comments: [TaskComment!]!
}
```

### TaskComment Type
```graphql
type TaskComment {
  id: ID!
  content: String!
  authorEmail: String!
  timestamp: DateTime!
  task: Task!
}
```

### Mutation Response Types
All mutations return response types with these common fields:
- `success: Boolean!` - Indicates if the operation was successful
- `errors: [String!]!` - List of error messages if operation failed
- Entity-specific field (e.g., `organization`, `project`, `task`, `comment`)

## Error Handling

### Common Error Types

1. **Validation Errors**: Invalid input data
2. **Not Found Errors**: Entity doesn't exist
3. **Permission Errors**: Insufficient permissions (future implementation)
4. **Database Errors**: Database operation failures

### Error Response Format
```json
{
  "data": {
    "createTask": {
      "task": null,
      "success": false,
      "errors": [
        "Project not found"
      ]
    }
  }
}
```

### GraphQL Errors
```json
{
  "errors": [
    {
      "message": "Cannot query field 'invalidField' on type 'Task'.",
      "locations": [
        {
          "line": 5,
          "column": 7
        }
      ]
    }
  ]
}
```

## Examples

### Complete Workflow Example

#### 1. Create an Organization
```graphql
mutation {
  createOrganization(
    name: "TechCorp"
    slug: "techcorp"
    contactEmail: "contact@techcorp.com"
  ) {
    organization {
      id
      name
      slug
    }
    success
    errors
  }
}
```

#### 2. Create a Project
```graphql
mutation {
  createProject(
    organizationId: "1"
    name: "Website Redesign"
    description: "Complete website overhaul"
    dueDate: "2024-03-15T00:00:00Z"
  ) {
    project {
      id
      name
      status
    }
    success
    errors
  }
}
```

#### 3. Create Tasks
```graphql
mutation {
  createTask(
    projectId: "1"
    title: "Design new homepage"
    description: "Create mockups for the new homepage design"
    assigneeEmail: "designer@techcorp.com"
    dueDate: "2024-02-15T00:00:00Z"
  ) {
    task {
      id
      title
      status
    }
    success
    errors
  }
}
```

#### 4. Update Task Status (Drag & Drop)
```graphql
mutation {
  updateTaskStatus(
    id: "1"
    status: "IN_PROGRESS"
  ) {
    task {
      id
      status
      updatedAt
    }
    success
    errors
  }
}
```

#### 5. Add a Comment
```graphql
mutation {
  addTaskComment(
    taskId: "1"
    content: "Started working on the homepage mockups. Will have initial designs ready by tomorrow."
    authorEmail: "designer@techcorp.com"
  ) {
    comment {
      id
      content
      timestamp
    }
    success
    errors
  }
}
```

### Real-time Task Board Query
This query retrieves all necessary data for a task board interface:

```graphql
query TaskBoard($projectId: ID!) {
  tasksByProject(projectId: $projectId) {
    id
    title
    description
    status
    assigneeEmail
    dueDate
    isOverdue
    createdAt
    updatedAt
    comments {
      id
      content
      authorEmail
      timestamp
    }
  }
}
```

## Best Practices

### Query Optimization
1. **Request only needed fields** to minimize payload size
2. **Use variables** instead of inline values for reusability
3. **Batch related queries** when possible
4. **Leverage caching** with Apollo Client or similar

### Mutation Patterns
1. **Always check `success` field** before using returned data
2. **Handle `errors` array** for user feedback
3. **Use optimistic updates** for better UX
4. **Implement proper error boundaries**

### Development Tips
1. Use the **GraphiQL interface** for testing and exploration
2. **Validate GraphQL queries** before implementing in frontend
3. **Monitor network requests** for performance optimization
4. **Implement proper loading states** for better UX

---

For additional questions or support, refer to the main project documentation or contact the development team.