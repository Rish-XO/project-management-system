"""
Django signals for triggering external integrations.

This module connects Django model events to external service integrations,
providing automatic notifications and updates to external systems.
"""

import logging
from datetime import datetime
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from tasks.models import Task, TaskComment
from .services import IntegrationOrchestrator, MockEmailService, MockSlackService
from .models import IntegrationLog, IntegrationSettings

logger = logging.getLogger(__name__)


def log_integration(service: str, event_type: str, **kwargs):
    """Helper function to log integration attempts."""
    try:
        IntegrationLog.objects.create(
            service=service,
            event_type=event_type,
            status='success',
            task_id=kwargs.get('task_id'),
            project_id=kwargs.get('project_id'),
            organization_id=kwargs.get('organization_id'),
            recipient=kwargs.get('recipient', ''),
            subject=kwargs.get('subject', ''),
            response_data=kwargs.get('response_data', {}),
            request_data=kwargs.get('request_data', {}),
            response_time_ms=kwargs.get('response_time_ms', 0)
        )
    except Exception as e:
        logger.error(f"Failed to log integration: {e}")


@receiver(pre_save, sender=Task)
def track_task_changes(sender, instance, **kwargs):
    """Track task changes to detect status updates and assignments."""
    if instance.pk:  # Task is being updated
        try:
            old_instance = Task.objects.get(pk=instance.pk)
            
            # Store old values for comparison in post_save
            instance._old_status = old_instance.status
            instance._old_assignee = old_instance.assignee_email
            
        except Task.DoesNotExist:
            # New task
            instance._old_status = None
            instance._old_assignee = None
    else:
        # New task
        instance._old_status = None
        instance._old_assignee = None


@receiver(post_save, sender=Task)
def handle_task_changes(sender, instance, created, **kwargs):
    """Handle task creation, assignment, and status changes."""
    
    # Check if integrations are enabled
    if not IntegrationSettings.is_service_enabled('mock_email') and not IntegrationSettings.is_service_enabled('mock_slack'):
        return
    
    orchestrator = IntegrationOrchestrator()
    
    try:
        if created:
            # New task created
            if instance.assignee_email:
                # Task created with assignee
                results = orchestrator.handle_task_assigned(instance, instance.assignee_email)
                
                # Log email integration
                if 'email' in results:
                    log_integration(
                        service='mock_email',
                        event_type='task_assigned',
                        task_id=instance.id,
                        project_id=instance.project.id,
                        organization_id=instance.project.organization.id,
                        recipient=instance.assignee_email,
                        subject=f"Task Assigned: {instance.title}",
                        response_data=results['email']
                    )
                
                # Log Slack integration
                if 'slack' in results:
                    log_integration(
                        service='mock_slack',
                        event_type='task_assigned',
                        task_id=instance.id,
                        project_id=instance.project.id,
                        organization_id=instance.project.organization.id,
                        recipient=f"#{instance.project.organization.slug}",
                        subject=f"Task assigned: {instance.title}",
                        response_data=results['slack']
                    )
        
        else:
            # Task updated - check for changes
            
            # Check for assignment changes
            if hasattr(instance, '_old_assignee') and instance._old_assignee != instance.assignee_email:
                if instance.assignee_email:  # Task assigned to someone
                    results = orchestrator.handle_task_assigned(instance, instance.assignee_email)
                    
                    log_integration(
                        service='mock_email',
                        event_type='task_assigned',
                        task_id=instance.id,
                        project_id=instance.project.id,
                        organization_id=instance.project.organization.id,
                        recipient=instance.assignee_email,
                        subject=f"Task Assigned: {instance.title}",
                        response_data=results.get('email', {})
                    )
                    
                    log_integration(
                        service='mock_slack',
                        event_type='task_assigned',
                        task_id=instance.id,
                        project_id=instance.project.id,
                        organization_id=instance.project.organization.id,
                        recipient=f"#{instance.project.organization.slug}",
                        subject=f"Task assigned: {instance.title}",
                        response_data=results.get('slack', {})
                    )
            
            # Check for status changes
            if hasattr(instance, '_old_status') and instance._old_status != instance.status:
                old_status = instance._old_status or 'NEW'
                
                # Send status change email
                email_result = MockEmailService.send_status_change_email(instance, old_status, instance.status)
                log_integration(
                    service='mock_email',
                    event_type='task_status_changed',
                    task_id=instance.id,
                    project_id=instance.project.id,
                    organization_id=instance.project.organization.id,
                    recipient=instance.assignee_email or "project-team@example.com",
                    subject=f"Task Update: {instance.title}",
                    response_data=email_result
                )
                
                # Special handling for task completion
                if instance.status == 'DONE':
                    results = orchestrator.handle_task_completed(instance)
                    
                    log_integration(
                        service='mock_slack',
                        event_type='task_completed',
                        task_id=instance.id,
                        project_id=instance.project.id,
                        organization_id=instance.project.organization.id,
                        recipient=f"#{instance.project.organization.slug}",
                        subject=f"Task completed: {instance.title}",
                        response_data=results.get('slack', {})
                    )
    
    except Exception as e:
        logger.error(f"Error handling task changes for task {instance.id}: {e}")
        
        # Log failed integration
        IntegrationLog.objects.create(
            service='integration_orchestrator',
            event_type='task_updated',
            status='failed',
            task_id=instance.id,
            project_id=instance.project.id,
            error_message=str(e)
        )


@receiver(post_save, sender=TaskComment)
def handle_new_comment(sender, instance, created, **kwargs):
    """Handle new task comments."""
    
    if not created:
        return
    
    # Check if integrations are enabled
    if not IntegrationSettings.is_service_enabled('mock_email'):
        return
    
    try:
        orchestrator = IntegrationOrchestrator()
        results = orchestrator.handle_new_comment(instance)
        
        # Log email integration
        if 'email' in results:
            log_integration(
                service='mock_email',
                event_type='comment_added',
                task_id=instance.task.id,
                project_id=instance.task.project.id,
                organization_id=instance.task.project.organization.id,
                recipient=instance.task.assignee_email or "project-team@example.com",
                subject=f"New Comment: {instance.task.title}",
                response_data=results['email']
            )
    
    except Exception as e:
        logger.error(f"Error handling new comment for task {instance.task.id}: {e}")
        
        # Log failed integration
        IntegrationLog.objects.create(
            service='mock_email',
            event_type='comment_added',
            status='failed',
            task_id=instance.task.id,
            project_id=instance.task.project.id,
            error_message=str(e)
        )


# Management command helper for testing integrations
def test_all_integrations():
    """Helper function to test all integration services (for management commands)."""
    print("🧪 Testing Mock Integration Services...")
    
    try:
        # Test email service
        print("\n📧 Testing Email Service:")
        MockEmailService.send_overdue_reminder(None)  # This will fail gracefully
        
        # Test Slack service  
        print("\n💬 Testing Slack Service:")
        MockSlackService.post_daily_digest(None, 10, 7)  # This will fail gracefully
        
        print("\n✅ Integration test completed!")
        
    except Exception as e:
        print(f"❌ Integration test failed: {e}")


# Initialize default settings
def create_default_integration_settings():
    """Create default integration settings if they don't exist."""
    defaults = [
        {'service_name': 'mock_email', 'is_enabled': True, 'is_mock_mode': True},
        {'service_name': 'mock_slack', 'is_enabled': True, 'is_mock_mode': True},
        {'service_name': 'email', 'is_enabled': False, 'is_mock_mode': False},
        {'service_name': 'slack', 'is_enabled': False, 'is_mock_mode': False},
    ]
    
    for default in defaults:
        IntegrationSettings.objects.get_or_create(
            service_name=default['service_name'],
            defaults=default
        )