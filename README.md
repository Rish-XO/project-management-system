# Multi-Tenant Project Management System

A full-stack project management application built with Django GraphQL backend and React TypeScript frontend, featuring organization-based multi-tenancy, drag-and-drop task boards, and real-time collaboration.

## 🚀 Features

### ✨ Core Functionality
- **Multi-tenant Architecture**: Organization-based data isolation
- **Project Management**: Create, edit, and manage projects within organizations
- **Task Tracking**: Kanban-style drag-and-drop task board (To Do, In Progress, Done)
- **Task Comments**: Real-time commenting system for tasks
- **Task Details**: Comprehensive task information with due dates and assignees
- **External Integrations**: Mock email and Slack integrations with professional logging

### 🎨 User Experience
- **Smooth Animations**: Apollo Client optimistic updates for instant feedback
- **Responsive Interface**: TailwindCSS with mobile-first design approach
- **Cross-Platform**: Optimized for both desktop and mobile devices
- **Form Validation**: Real-time validation with user-friendly error messages
- **Loading States**: Smooth loading indicators throughout the application
- **Error Handling**: Comprehensive error handling with retry capabilities
- **Integration Feedback**: Toast notifications for external service interactions

## 🛠 Tech Stack

### Backend
- **Django 4.2.7** - Python web framework
- **GraphQL** - Graphene-Django for API layer
- **PostgreSQL** - Database with proper indexing and relationships
- **Multi-tenancy** - Organization-based data isolation

### Frontend
- **React 19** - Modern React with latest features
- **TypeScript** - Type-safe development
- **Apollo Client** - GraphQL client with caching and optimistic updates
- **TailwindCSS** - Utility-first CSS framework
- **@dnd-kit** - Modern drag-and-drop library

## 🏗 Architecture

```
project-management-system/
├── backend/                    # Django GraphQL API
│   ├── organizations/         # Organization management
│   ├── projects/             # Project CRUD operations
│   ├── tasks/                # Task management & comments
│   └── project_management/   # Main Django project
└── frontend/                  # React TypeScript app
    ├── src/
    │   ├── components/       # Reusable UI components
    │   ├── graphql/         # GraphQL queries & mutations
    │   └── types/           # TypeScript interfaces
    └── public/              # Static assets
```

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL 12+

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment**
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate
   
   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Setup Database and Environment**
   ```bash
   # Create PostgreSQL database
   createdb project_management_db
   
   # Copy environment template and configure
   cp .env.example .env
   # Edit .env file with your database credentials
   ```

5. **Run migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Create superuser (optional)**
   ```bash
   python manage.py createsuperuser
   ```

7. **Start backend server**
   ```bash
   python manage.py runserver
   ```
   Backend will be available at `http://127.0.0.1:8000/`
   GraphiQL interface at `http://127.0.0.1:8000/graphql/`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```
   Frontend will be available at `http://localhost:3000/`

## 📊 GraphQL API

### Key Queries
- `organizationList` - List all organizations
- `projectsByOrganization(organizationSlug)` - Projects for organization
- `tasksByProject(projectId)` - Tasks with comments for project
- `taskDetail(id)` - Single task with full details

### Key Mutations
- `createOrganization`, `updateOrganization` - Organization management
- `createProject`, `updateProject` - Project management  
- `createTask`, `updateTask`, `updateTaskStatus` - Task management
- `addTaskComment` - Comment system

## 🎯 Key Components

### Backend Models
- **Organization**: Multi-tenant data container
- **Project**: Belongs to organization, contains tasks
- **Task**: Belongs to project, has status and comments
- **TaskComment**: Belongs to task, threaded discussions

### Frontend Components
- **TaskBoard**: Drag-and-drop Kanban interface using @dnd-kit
- **TaskDetailModal**: Full task details with comments using TASK_DETAIL query
- **TaskCommentsPanel**: Real-time comment system with null safety
- **Form Components**: Reusable form system with validation

## 🔧 Development

### Running Tests

**Comprehensive test coverage with 40+ tests across backend and frontend:**

```bash
# Backend Tests (25+ tests)
cd backend
python manage.py test                    # All tests
python manage.py test organizations      # Model tests
python manage.py test tests.test_graphql_api  # GraphQL API tests
python manage.py test integrations.tests      # Integration service tests

# Frontend Tests (15+ tests)  
cd frontend
npm test                                 # All tests
npm test -- --coverage --watchAll=false # With coverage report
npm test TaskCard.test.tsx              # Component tests
```

**Test Categories:**
- **Model Tests**: Organizations, Projects, Tasks, Comments
- **GraphQL API Tests**: Queries, mutations, organization isolation
- **Integration Tests**: Mock email/Slack services, orchestration
- **Component Tests**: TaskCard, Toast system, user interactions

### Building for Production
```bash
# Frontend
cd frontend
npm run build
```

### Database Management
```bash
# Create new migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Access Django admin
# Visit http://127.0.0.1:8000/admin/
```

## 🚀 Performance Features

- **Apollo Client Caching**: Intelligent query caching and updates
- **Optimistic Updates**: Instant UI feedback for drag-and-drop
- **Database Indexing**: Optimized queries with proper indexes
- **Component Optimization**: Efficient React rendering patterns
- **Error Boundaries**: Graceful error handling throughout the app

## 🔐 Multi-Tenancy

The application implements organization-based multi-tenancy:
- All data is scoped to organizations
- GraphQL resolvers enforce tenant isolation  
- Frontend enforces organization selection
- Database indexes optimize tenant-specific queries

## 📱 Responsive Design

Built with mobile-first approach using TailwindCSS:
- **Desktop**: Full drag-and-drop Kanban board with three-column layout
- **Mobile**: Optimized single-column view with tab navigation and status controls
- **Adaptive Layouts**: Seamless experience across all screen sizes
- **Touch-Friendly**: Mobile-specific task status controls and navigation
- **Consistent Design**: Unified design system across desktop and mobile

## 🎨 UI/UX Features

- **Smooth Animations**: Apollo optimistic updates for instant feedback
- **Loading States**: Skeleton screens and spinners
- **Error Handling**: User-friendly error messages with retry options
- **Form Validation**: Real-time validation with clear error messages
- **Drag-and-Drop**: Intuitive task status management

## 📄 Documentation

- **CLAUDE.md**: Detailed development guide and project structure
- **GraphQL Schema**: Available at `/graphql/` endpoint
- **Component Documentation**: See individual component files for props and usage

## 🤝 Contributing

This project demonstrates modern full-stack development practices including:
- GraphQL API design
- React component architecture  
- TypeScript integration
- Multi-tenant data modeling
- Responsive UI/UX design
- Performance optimization

---

**Built with ❤️ using Django, GraphQL, React, and TypeScript**