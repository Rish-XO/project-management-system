"""
Tests for tasks app models and functionality.
"""

from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import datetime, timedelta
from organizations.models import Organization
from projects.models import Project
from tasks.models import Task, TaskComment


class TaskModelTest(TestCase):
    """Test cases for Task model."""

    def setUp(self):
        """Set up test data."""
        self.organization = Organization.objects.create(
            name='Test Organization',
            slug='test-org',
            contact_email='contact@testorg.com'
        )
        
        self.project = Project.objects.create(
            organization=self.organization,
            name='Test Project',
            status='ACTIVE'
        )
        
        self.task_data = {
            'project': self.project,
            'title': 'Test Task',
            'description': 'A test task description',
            'status': 'TODO',
            'assignee_email': 'assignee@example.com',
            'due_date': timezone.now() + timedelta(days=7)
        }

    def test_task_creation(self):
        """Test creating a new task."""
        task = Task.objects.create(**self.task_data)
        
        self.assertEqual(task.title, 'Test Task')
        self.assertEqual(task.description, 'A test task description')
        self.assertEqual(task.status, 'TODO')
        self.assertEqual(task.assignee_email, 'assignee@example.com')
        self.assertEqual(task.project, self.project)
        self.assertIsNotNone(task.created_at)
        self.assertIsNotNone(task.updated_at)

    def test_task_string_representation(self):
        """Test the string representation of task."""
        task = Task.objects.create(**self.task_data)
        expected_str = f"{self.project.name} - Test Task"
        self.assertEqual(str(task), expected_str)

    def test_task_status_choices(self):
        """Test task status field choices."""
        valid_statuses = ['TODO', 'IN_PROGRESS', 'DONE']
        
        for status in valid_statuses:
            task_data = self.task_data.copy()
            task_data['status'] = status
            task_data['title'] = f'Task {status}'  # Unique title
            task = Task.objects.create(**task_data)
            self.assertEqual(task.status, status)

    def test_invalid_status_choice(self):
        """Test that invalid status choices are rejected."""
        task_data = self.task_data.copy()
        task_data['status'] = 'INVALID_STATUS'
        
        task = Task(**task_data)
        with self.assertRaises(ValidationError):
            task.full_clean()

    def test_project_relationship(self):
        """Test the foreign key relationship to Project."""
        task = Task.objects.create(**self.task_data)
        
        # Test the relationship works both ways
        self.assertEqual(task.project, self.project)
        self.assertIn(task, self.project.tasks.all())

    def test_organization_property(self):
        """Test the organization property."""
        task = Task.objects.create(**self.task_data)
        self.assertEqual(task.organization, self.organization)

    def test_is_overdue_property(self):
        """Test the is_overdue property."""
        # Test task that is not overdue
        future_task_data = self.task_data.copy()
        future_task_data['due_date'] = timezone.now() + timedelta(days=1)
        future_task_data['title'] = 'Future Task'
        
        future_task = Task.objects.create(**future_task_data)
        self.assertFalse(future_task.is_overdue)
        
        # Test overdue task
        past_task_data = self.task_data.copy() 
        past_task_data['due_date'] = timezone.now() - timedelta(days=1)
        past_task_data['title'] = 'Past Task'
        past_task_data['status'] = 'TODO'
        
        past_task = Task.objects.create(**past_task_data)
        self.assertTrue(past_task.is_overdue)
        
        # Test completed overdue task (should not be overdue)
        completed_past_task_data = self.task_data.copy()
        completed_past_task_data['due_date'] = timezone.now() - timedelta(days=1)
        completed_past_task_data['title'] = 'Completed Past Task'
        completed_past_task_data['status'] = 'DONE'
        
        completed_past_task = Task.objects.create(**completed_past_task_data)
        self.assertFalse(completed_past_task.is_overdue)
        
        # Test task with no due date
        no_due_date_task_data = self.task_data.copy()
        no_due_date_task_data['due_date'] = None
        no_due_date_task_data['title'] = 'No Due Date Task'
        
        no_due_date_task = Task.objects.create(**no_due_date_task_data)
        self.assertFalse(no_due_date_task.is_overdue)

    def test_cascade_delete(self):
        """Test that deleting project cascades to tasks."""
        task = Task.objects.create(**self.task_data)
        task_id = task.id
        
        # Delete the project
        self.project.delete()
        
        # Task should be deleted too
        with self.assertRaises(Task.DoesNotExist):
            Task.objects.get(id=task_id)

    def test_optional_fields(self):
        """Test that optional fields can be empty."""
        minimal_task = Task.objects.create(
            project=self.project,
            title='Minimal Task',
            status='TODO'
            # description, assignee_email, due_date are optional
        )
        
        self.assertEqual(minimal_task.description, '')
        self.assertEqual(minimal_task.assignee_email, '')
        self.assertIsNone(minimal_task.due_date)


    def test_email_validation(self):
        """Test assignee email field validation."""
        task_data = self.task_data.copy()
        task_data['assignee_email'] = 'invalid-email'
        
        task = Task(**task_data)
        with self.assertRaises(ValidationError):
            task.full_clean()


class TaskCommentModelTest(TestCase):
    """Test cases for TaskComment model."""

    def setUp(self):
        """Set up test data."""
        self.organization = Organization.objects.create(
            name='Test Organization',
            slug='test-org',
            contact_email='contact@testorg.com'
        )
        
        self.project = Project.objects.create(
            organization=self.organization,
            name='Test Project',
            status='ACTIVE'
        )
        
        self.task = Task.objects.create(
            project=self.project,
            title='Test Task',
            status='TODO'
        )
        
        self.comment_data = {
            'task': self.task,
            'content': 'This is a test comment',
            'author_email': 'commenter@example.com'
        }

    def test_comment_creation(self):
        """Test creating a new task comment."""
        comment = TaskComment.objects.create(**self.comment_data)
        
        self.assertEqual(comment.content, 'This is a test comment')
        self.assertEqual(comment.author_email, 'commenter@example.com')
        self.assertEqual(comment.task, self.task)
        self.assertIsNotNone(comment.timestamp)

    def test_comment_string_representation(self):
        """Test the string representation of task comment."""
        comment = TaskComment.objects.create(**self.comment_data)
        expected_str = f"Comment on {self.task.title} by commenter@example.com"
        self.assertEqual(str(comment), expected_str)

    def test_task_relationship(self):
        """Test the foreign key relationship to Task."""
        comment = TaskComment.objects.create(**self.comment_data)
        
        # Test the relationship works both ways
        self.assertEqual(comment.task, self.task)
        self.assertIn(comment, self.task.comments.all())

    def test_organization_property(self):
        """Test the organization property."""
        comment = TaskComment.objects.create(**self.comment_data)
        self.assertEqual(comment.organization, self.organization)

    def test_cascade_delete(self):
        """Test that deleting task cascades to comments."""
        comment = TaskComment.objects.create(**self.comment_data)
        comment_id = comment.id
        
        # Delete the task
        self.task.delete()
        
        # Comment should be deleted too
        with self.assertRaises(TaskComment.DoesNotExist):
            TaskComment.objects.get(id=comment_id)

    def test_comment_ordering(self):
        """Test comment ordering by timestamp (descending)."""
        comment1 = TaskComment.objects.create(
            task=self.task,
            content='First comment',
            author_email='user1@example.com'
        )
        
        comment2 = TaskComment.objects.create(
            task=self.task,
            content='Second comment',
            author_email='user2@example.com'
        )
        
        # Check ordering (newest first)
        comments = list(TaskComment.objects.all())
        self.assertEqual(comments[0], comment2)  # Second comment first (newer)
        self.assertEqual(comments[1], comment1)  # First comment second (older)

    def test_email_validation(self):
        """Test author email field validation."""
        comment_data = self.comment_data.copy()
        comment_data['author_email'] = 'invalid-email'
        
        comment = TaskComment(**comment_data)
        with self.assertRaises(ValidationError):
            comment.full_clean()

    def test_long_content(self):
        """Test handling of long comment content."""
        long_content = 'A' * 1000  # 1000 character comment
        comment_data = self.comment_data.copy()
        comment_data['content'] = long_content
        
        comment = TaskComment.objects.create(**comment_data)
        self.assertEqual(comment.content, long_content)

    def test_multiple_comments_per_task(self):
        """Test multiple comments can belong to the same task."""
        comment1 = TaskComment.objects.create(
            task=self.task,
            content='First comment',
            author_email='user1@example.com'
        )
        
        comment2 = TaskComment.objects.create(
            task=self.task,
            content='Second comment',
            author_email='user2@example.com'
        )
        
        # Both comments should belong to the same task
        task_comments = self.task.comments.all()
        self.assertIn(comment1, task_comments)
        self.assertIn(comment2, task_comments)
        self.assertEqual(task_comments.count(), 2)
