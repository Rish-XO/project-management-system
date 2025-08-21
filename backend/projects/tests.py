"""
Tests for projects app models and functionality.
"""

from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import date, timedelta
from organizations.models import Organization
from projects.models import Project


class ProjectModelTest(TestCase):
    """Test cases for Project model."""

    def setUp(self):
        """Set up test data."""
        self.organization = Organization.objects.create(
            name='Test Organization',
            slug='test-org',
            contact_email='contact@testorg.com'
        )
        
        self.project_data = {
            'organization': self.organization,
            'name': 'Test Project',
            'description': 'A test project description',
            'status': 'ACTIVE',
            'due_date': date.today() + timedelta(days=30)
        }

    def test_project_creation(self):
        """Test creating a new project."""
        project = Project.objects.create(**self.project_data)
        
        self.assertEqual(project.name, 'Test Project')
        self.assertEqual(project.description, 'A test project description')
        self.assertEqual(project.status, 'ACTIVE')
        self.assertEqual(project.organization, self.organization)
        self.assertIsNotNone(project.created_at)

    def test_project_string_representation(self):
        """Test the string representation of project."""
        project = Project.objects.create(**self.project_data)
        expected_str = f"{self.organization.name} - Test Project"
        self.assertEqual(str(project), expected_str)

    def test_project_status_choices(self):
        """Test project status field choices."""
        valid_statuses = ['ACTIVE', 'COMPLETED', 'ON_HOLD']
        
        for status in valid_statuses:
            project_data = self.project_data.copy()
            project_data['status'] = status
            project = Project.objects.create(**project_data)
            self.assertEqual(project.status, status)
            project.delete()  # Clean up

    def test_invalid_status_choice(self):
        """Test that invalid status choices are rejected."""
        project_data = self.project_data.copy()
        project_data['status'] = 'INVALID_STATUS'
        
        project = Project(**project_data)
        with self.assertRaises(ValidationError):
            project.full_clean()

    def test_organization_relationship(self):
        """Test the foreign key relationship to Organization."""
        project = Project.objects.create(**self.project_data)
        
        # Test the relationship works both ways
        self.assertEqual(project.organization, self.organization)
        self.assertIn(project, self.organization.projects.all())

    def test_cascade_delete(self):
        """Test that deleting organization cascades to projects."""
        project = Project.objects.create(**self.project_data)
        project_id = project.id
        
        # Delete the organization
        self.organization.delete()
        
        # Project should be deleted too
        with self.assertRaises(Project.DoesNotExist):
            Project.objects.get(id=project_id)

    def test_optional_fields(self):
        """Test that optional fields can be empty."""
        minimal_project = Project.objects.create(
            organization=self.organization,
            name='Minimal Project',
            status='ACTIVE'
            # description and due_date are optional
        )
        
        self.assertEqual(minimal_project.description, '')
        self.assertIsNone(minimal_project.due_date)

    def test_due_date_handling(self):
        """Test due date field handling."""
        # Test with future due date
        future_date = date.today() + timedelta(days=60)
        project_data = self.project_data.copy()
        project_data['due_date'] = future_date
        
        project = Project.objects.create(**project_data)
        self.assertEqual(project.due_date, future_date)

    def test_project_ordering(self):
        """Test project ordering by created_at (descending)."""
        # Create multiple projects with slight delay
        project1 = Project.objects.create(
            organization=self.organization,
            name='First Project',
            status='ACTIVE'
        )
        
        project2 = Project.objects.create(
            organization=self.organization, 
            name='Second Project',
            status='ACTIVE'
        )
        
        # Check ordering (newest first)
        projects = list(Project.objects.all())
        self.assertEqual(projects[0], project2)  # Second project first (newer)
        self.assertEqual(projects[1], project1)  # First project second (older)

    def test_project_task_count_property(self):
        """Test the task_count property if it exists."""
        project = Project.objects.create(**self.project_data)
        
        # Initially should have no tasks
        if hasattr(project, 'task_count'):
            self.assertEqual(project.task_count, 0)

    def test_long_project_name(self):
        """Test handling of long project names."""
        long_name = 'A' * 200  # 200 character name
        project_data = self.project_data.copy()
        project_data['name'] = long_name
        
        project = Project.objects.create(**project_data)
        self.assertEqual(project.name, long_name)

    def test_project_with_special_characters(self):
        """Test project name with special characters."""
        special_name = 'Project™ with "Special" Characters & Symbols!'
        project_data = self.project_data.copy()
        project_data['name'] = special_name
        
        project = Project.objects.create(**project_data)
        self.assertEqual(project.name, special_name)

    def test_multiple_projects_same_organization(self):
        """Test multiple projects can belong to the same organization."""
        project1 = Project.objects.create(
            organization=self.organization,
            name='Project 1',
            status='ACTIVE'
        )
        
        project2 = Project.objects.create(
            organization=self.organization,
            name='Project 2', 
            status='COMPLETED'
        )
        
        # Both projects should belong to the same organization
        org_projects = self.organization.projects.all()
        self.assertIn(project1, org_projects)
        self.assertIn(project2, org_projects)
        self.assertEqual(org_projects.count(), 2)
