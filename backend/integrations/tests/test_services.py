"""
Tests for integration services (MockEmailService, MockSlackService).
"""

from django.test import TestCase
from integrations.services import MockEmailService, MockSlackService, IntegrationOrchestrator
from integrations.models import IntegrationLog, IntegrationSettings
from organizations.models import Organization
from projects.models import Project
from tasks.models import Task, TaskComment


class MockEmailServiceTest(TestCase):
    """Test MockEmailService functionality."""

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
            status='TODO',
            assignee_email='assignee@example.com'
        )

    def test_send_task_assignment_email(self):
        """Test sending task assignment email."""
        result = MockEmailService.send_task_assignment_email(
            self.task, 
            'assignee@example.com'
        )
        
        self.assertEqual(result['status'], 'sent')
        self.assertEqual(result['to'], 'assignee@example.com')
        self.assertEqual(result['subject'], f'Task Assigned: {self.task.title}')
        self.assertEqual(result['service'], 'mock_email')
        self.assertIn('timestamp', result)
        self.assertEqual(result['task_id'], self.task.id)

    def test_send_status_change_email(self):
        """Test sending status change email."""
        result = MockEmailService.send_status_change_email(
            self.task,
            'TODO',
            'IN_PROGRESS'
        )
        
        self.assertEqual(result['status'], 'sent')
        self.assertEqual(result['subject'], f'Task Update: {self.task.title}')
        self.assertEqual(result['old_status'], 'TODO')
        self.assertEqual(result['new_status'], 'IN_PROGRESS')
        self.assertIn('timestamp', result)

    def test_send_comment_notification_email(self):
        """Test sending comment notification email."""
        comment = TaskComment.objects.create(
            task=self.task,
            content='Test comment',
            author_email='commenter@example.com'
        )
        
        result = MockEmailService.send_comment_notification_email(comment)
        
        self.assertEqual(result['status'], 'sent')
        self.assertEqual(result['subject'], f'New Comment: {self.task.title}')
        self.assertEqual(result['comment_author'], 'commenter@example.com')
        self.assertEqual(result['task_id'], self.task.id)

    def test_send_overdue_reminder(self):
        """Test sending overdue reminder email."""
        result = MockEmailService.send_overdue_reminder(self.task)
        
        self.assertEqual(result['status'], 'sent')
        self.assertEqual(result['subject'], f'OVERDUE: {self.task.title}')
        self.assertEqual(result['service'], 'mock_email')
        self.assertEqual(result['task_id'], self.task.id)


class MockSlackServiceTest(TestCase):
    """Test MockSlackService functionality."""

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
            status='TODO',
            assignee_email='assignee@example.com'
        )

    def test_post_task_assignment(self):
        """Test posting task assignment to Slack."""
        result = MockSlackService.post_task_assignment(
            self.task,
            'assignee@example.com'
        )
        
        self.assertEqual(result['status'], 'posted')
        self.assertEqual(result['channel'], f'#{self.organization.slug}')
        self.assertEqual(result['service'], 'mock_slack')
        self.assertEqual(result['task_id'], self.task.id)
        self.assertIn('timestamp', result)

    def test_post_task_completion(self):
        """Test posting task completion to Slack."""
        result = MockSlackService.post_task_completion(self.task)
        
        self.assertEqual(result['status'], 'posted')
        self.assertEqual(result['channel'], f'#{self.organization.slug}')
        self.assertEqual(result['service'], 'mock_slack')
        self.assertEqual(result['task_id'], self.task.id)
        self.assertEqual(result['assignee'], self.task.assignee_email)

    def test_post_project_update(self):
        """Test posting project update to Slack."""
        message = 'Project milestone completed'
        result = MockSlackService.post_project_update(self.project, message)
        
        self.assertEqual(result['status'], 'posted')
        self.assertEqual(result['channel'], f'#{self.organization.slug}')
        self.assertEqual(result['service'], 'mock_slack')
        self.assertEqual(result['project_id'], self.project.id)
        self.assertIn('timestamp', result)

    def test_post_daily_digest(self):
        """Test posting daily digest to Slack."""
        result = MockSlackService.post_daily_digest(self.organization, 10, 7)
        
        self.assertEqual(result['status'], 'posted')
        self.assertEqual(result['channel'], f'#{self.organization.slug}')
        self.assertEqual(result['service'], 'mock_slack')
        self.assertEqual(result['organization_id'], self.organization.id)
        self.assertIn('timestamp', result)


class IntegrationOrchestratorTest(TestCase):
    """Test IntegrationOrchestrator functionality."""

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
            status='TODO',
            assignee_email='assignee@example.com'
        )
        
        self.orchestrator = IntegrationOrchestrator()

    def test_handle_task_assigned(self):
        """Test handling task assignment with multiple integrations."""
        results = self.orchestrator.handle_task_assigned(
            self.task,
            'assignee@example.com'
        )
        
        # Should return results from both email and slack services
        self.assertIn('email', results)
        self.assertIn('slack', results)
        
        # Check email result
        email_result = results['email']
        self.assertEqual(email_result['status'], 'sent')
        self.assertEqual(email_result['to'], 'assignee@example.com')
        
        # Check slack result
        slack_result = results['slack']
        self.assertEqual(slack_result['status'], 'posted')
        self.assertEqual(slack_result['channel'], f'#{self.organization.slug}')

    def test_handle_task_completed(self):
        """Test handling task completion with multiple integrations."""
        results = self.orchestrator.handle_task_completed(self.task)
        
        # Should return results from both email and slack services
        self.assertIn('email', results)
        self.assertIn('slack', results)
        
        # Check email result
        email_result = results['email']
        self.assertEqual(email_result['status'], 'sent')
        self.assertIn('Task Update:', email_result['subject'])
        
        # Check slack result  
        slack_result = results['slack']
        self.assertEqual(slack_result['status'], 'posted')
        self.assertEqual(slack_result['assignee'], self.task.assignee_email)

    def test_handle_new_comment(self):
        """Test handling new comment with email notification."""
        comment = TaskComment.objects.create(
            task=self.task,
            content='Test comment',
            author_email='commenter@example.com'
        )
        
        results = self.orchestrator.handle_new_comment(comment)
        
        # Should return email result
        self.assertIn('email', results)
        
        email_result = results['email']
        self.assertEqual(email_result['status'], 'sent')
        self.assertEqual(email_result['comment_author'], 'commenter@example.com')


class IntegrationLogModelTest(TestCase):
    """Test IntegrationLog model."""

    def test_integration_log_creation(self):
        """Test creating an integration log."""
        log = IntegrationLog.objects.create(
            service='mock_email',
            event_type='task_assigned',
            status='success',
            task_id=1,
            project_id=1,
            recipient='test@example.com',
            subject='Test Subject',
            response_data={'status': 'sent'},
            response_time_ms=150
        )
        
        self.assertEqual(log.service, 'mock_email')
        self.assertEqual(log.event_type, 'task_assigned')
        self.assertEqual(log.status, 'success')
        self.assertTrue(log.is_successful)
        self.assertEqual(log.response_time_ms, 150)

    def test_mark_as_failed(self):
        """Test marking integration log as failed."""
        log = IntegrationLog.objects.create(
            service='mock_slack',
            event_type='task_completed',
            status='success'
        )
        
        log.mark_as_failed('Network timeout error')
        
        self.assertEqual(log.status, 'failed')
        self.assertEqual(log.error_message, 'Network timeout error')
        self.assertFalse(log.is_successful)

    def test_mark_as_success(self):
        """Test marking integration log as successful."""
        log = IntegrationLog.objects.create(
            service='mock_email',
            event_type='comment_added',
            status='pending'
        )
        
        response_data = {'status': 'sent', 'message_id': '123'}
        log.mark_as_success(response_data)
        
        self.assertEqual(log.status, 'success')
        self.assertEqual(log.response_data, response_data)
        self.assertTrue(log.is_successful)


class IntegrationSettingsModelTest(TestCase):
    """Test IntegrationSettings model."""

    def test_is_service_enabled(self):
        """Test checking if service is enabled."""
        # Create enabled service
        IntegrationSettings.objects.create(
            service_name='mock_email',
            is_enabled=True
        )
        
        # Create disabled service
        IntegrationSettings.objects.create(
            service_name='mock_slack',
            is_enabled=False
        )
        
        # Test enabled service
        self.assertTrue(IntegrationSettings.is_service_enabled('mock_email'))
        
        # Test disabled service
        self.assertFalse(IntegrationSettings.is_service_enabled('mock_slack'))
        
        # Test non-existent service
        self.assertFalse(IntegrationSettings.is_service_enabled('non_existent'))

        
        # Test non-existent service (should default to mock)
        self.assertTrue(IntegrationSettings.is_mock_mode('non_existent'))

    def test_integration_settings_string_representation(self):
        """Test string representation of IntegrationSettings."""
        setting = IntegrationSettings.objects.create(
            service_name='mock_email',
            is_enabled=True
        )
        
        expected_str = 'mock_email (Enabled)'
        self.assertEqual(str(setting), expected_str)
        
        # Test disabled service
        setting.is_enabled = False
        setting.save()
        
        expected_str = 'mock_email (Disabled)'
        self.assertEqual(str(setting), expected_str)