# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack project management system with Django/GraphQL backend and React/TypeScript frontend.

## Architecture

### Backend (Django + GraphQL)
- **Framework**: Django 4.2.7 with Graphene-Django for GraphQL API
- **Database**: PostgreSQL (configured in settings.py)
- **Apps**: `organizations`, `projects`, `tasks` (models currently empty, ready for implementation)
- **GraphQL endpoint**: `http://127.0.0.1:8000/graphql/` with GraphiQL interface enabled
- **CORS**: Configured for React frontend at `http://localhost:3000`

### Frontend (React + TypeScript)
- **Framework**: React 19 with TypeScript, bootstrapped with Create React App
- **State Management**: Apollo Client for GraphQL queries/mutations
- **Styling**: TailwindCSS (already configured)
- **GraphQL Client**: Configured in `src/appollo.ts` pointing to Django backend

## Development Commands

### Backend
```bash
cd backend

# Activate virtual environment (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Database migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver

# Run tests
python manage.py test
```

### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Start development server (port 3000)
npm start

# Run tests
npm test

# Build for production
npm run build
```

## Database Configuration

PostgreSQL connection in `backend/project_management/settings.py`:
- Database: `project_management_db`
- User: `postgres`
- Host: `localhost`
- Port: `5432`

## Key Files

- `backend/project_management/schema.py`: Main GraphQL schema definition
- `backend/project_management/urls.py`: URL configuration with GraphQL endpoint
- `frontend/src/appollo.ts`: Apollo Client configuration
- `frontend/src/App.tsx`: Main React component with Apollo Provider

## Development Workflow

1. Start PostgreSQL service
2. Run Django backend: `cd backend && python manage.py runserver`
3. Run React frontend: `cd frontend && npm start`
4. Access GraphiQL at `http://127.0.0.1:8000/graphql/`
5. Access React app at `http://localhost:3000`