"""
Mock External Integration Services

This module provides mock implementations of external services like email and Slack
for demonstration purposes. In production, these would be replaced with real API calls.
"""

import logging
from datetime import datetime
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class MockEmailService:
    """Mock email service for demonstrating email integrations."""
    
    @staticmethod
    def send_task_assignment_email(task, assignee_email: str) -> Dict[str, Any]:
        """Send email when task is assigned to someone."""
        message = f"📧 [MOCK EMAIL] Task '{task.title}' assigned to {assignee_email}"
        print(message)
        logger.info(f"Mock email sent: Task assignment - {task.title} to {assignee_email}")
        
        return {
            "status": "sent",
            "to": assignee_email,
            "subject": f"Task Assigned: {task.title}",
            "service": "mock_email",
            "timestamp": datetime.now().isoformat(),
            "task_id": task.id,
            "project": task.project.name
        }
    
    @staticmethod
    def send_status_change_email(task, old_status: str, new_status: str) -> Dict[str, Any]:
        """Send email when task status changes."""
        message = f"📧 [MOCK EMAIL] Task '{task.title}' changed from {old_status} to {new_status}"
        print(message)
        logger.info(f"Mock email sent: Status change - {task.title} ({old_status} → {new_status})")
        
        return {
            "status": "sent",
            "to": task.assignee_email or "project-team@example.com",
            "subject": f"Task Update: {task.title}",
            "service": "mock_email",
            "timestamp": datetime.now().isoformat(),
            "task_id": task.id,
            "old_status": old_status,
            "new_status": new_status
        }
    
    @staticmethod
    def send_comment_notification_email(task_comment) -> Dict[str, Any]:
        """Send email when new comment is added."""
        task = task_comment.task
        message = f"📧 [MOCK EMAIL] New comment on task '{task.title}' by {task_comment.author_email}"
        print(message)
        logger.info(f"Mock email sent: New comment - {task.title} by {task_comment.author_email}")
        
        return {
            "status": "sent",
            "to": task.assignee_email or "project-team@example.com",
            "subject": f"New Comment: {task.title}",
            "service": "mock_email",
            "timestamp": datetime.now().isoformat(),
            "task_id": task.id,
            "comment_author": task_comment.author_email
        }
    
    @staticmethod
    def send_overdue_reminder(task) -> Dict[str, Any]:
        """Send overdue task reminder email."""
        message = f"📧 [MOCK EMAIL] OVERDUE: Task '{task.title}' is past due date"
        print(message)
        logger.warning(f"Mock email sent: Overdue reminder - {task.title}")
        
        return {
            "status": "sent",
            "to": task.assignee_email or "project-manager@example.com",
            "subject": f"OVERDUE: {task.title}",
            "service": "mock_email",
            "timestamp": datetime.now().isoformat(),
            "task_id": task.id,
            "due_date": task.due_date.isoformat() if task.due_date else None
        }


class MockSlackService:
    """Mock Slack service for demonstrating team communication integrations."""
    
    @staticmethod
    def post_task_assignment(task, assignee_email: str) -> Dict[str, Any]:
        """Post Slack message when task is assigned."""
        channel = task.project.organization.slug
        message = f"💬 [MOCK SLACK] #{channel}: Task '{task.title}' assigned to {assignee_email}"
        print(message)
        logger.info(f"Mock Slack message: Task assignment - {task.title} to {assignee_email}")
        
        return {
            "status": "posted",
            "channel": f"#{channel}",
            "message": f"📋 Task assigned: *{task.title}* → {assignee_email}",
            "service": "mock_slack",
            "timestamp": datetime.now().isoformat(),
            "task_id": task.id
        }
    
    @staticmethod
    def post_task_completion(task) -> Dict[str, Any]:
        """Post Slack message when task is completed."""
        channel = task.project.organization.slug
        assignee = task.assignee_email or "team member"
        message = f"💬 [MOCK SLACK] #{channel}: Task '{task.title}' completed by {assignee} ✅"
        print(message)
        logger.info(f"Mock Slack message: Task completion - {task.title} by {assignee}")
        
        return {
            "status": "posted",
            "channel": f"#{channel}",
            "message": f"✅ Task completed: *{task.title}* by {assignee}",
            "service": "mock_slack",
            "timestamp": datetime.now().isoformat(),
            "task_id": task.id,
            "assignee": assignee
        }
    
    @staticmethod
    def post_project_update(project, message: str) -> Dict[str, Any]:
        """Post general project update to Slack."""
        channel = project.organization.slug
        slack_message = f"💬 [MOCK SLACK] #{channel}: {message}"
        print(slack_message)
        logger.info(f"Mock Slack message: Project update - {project.name}")
        
        return {
            "status": "posted",
            "channel": f"#{channel}",
            "message": f"📊 Project update: {message}",
            "service": "mock_slack",
            "timestamp": datetime.now().isoformat(),
            "project_id": project.id
        }
    
    @staticmethod
    def post_daily_digest(organization, task_count: int, completed_count: int) -> Dict[str, Any]:
        """Post daily project digest to Slack."""
        channel = organization.slug
        message = f"💬 [MOCK SLACK] #{channel}: Daily digest - {completed_count}/{task_count} tasks completed today"
        print(message)
        logger.info(f"Mock Slack message: Daily digest - {organization.name}")
        
        return {
            "status": "posted",
            "channel": f"#{channel}",
            "message": f"📊 Daily digest: {completed_count}/{task_count} tasks completed today",
            "service": "mock_slack",
            "timestamp": datetime.now().isoformat(),
            "organization_id": organization.id
        }


class IntegrationOrchestrator:
    """Orchestrates multiple integration services."""
    
    def __init__(self):
        self.email_service = MockEmailService()
        self.slack_service = MockSlackService()
    
    def handle_task_assigned(self, task, assignee_email: str) -> Dict[str, Any]:
        """Handle task assignment with multiple integrations."""
        results = {
            "email": self.email_service.send_task_assignment_email(task, assignee_email),
            "slack": self.slack_service.post_task_assignment(task, assignee_email)
        }
        
        print(f"🔗 [INTEGRATION] Task '{task.title}' assignment handled via email & Slack")
        return results
    
    def handle_task_completed(self, task) -> Dict[str, Any]:
        """Handle task completion with multiple integrations."""
        results = {
            "email": self.email_service.send_status_change_email(task, "IN_PROGRESS", "DONE"),
            "slack": self.slack_service.post_task_completion(task)
        }
        
        print(f"🔗 [INTEGRATION] Task '{task.title}' completion handled via email & Slack")
        return results
    
    def handle_new_comment(self, task_comment) -> Dict[str, Any]:
        """Handle new comment with email notification."""
        results = {
            "email": self.email_service.send_comment_notification_email(task_comment)
        }
        
        print(f"🔗 [INTEGRATION] New comment on '{task_comment.task.title}' handled via email")
        return results