"""
Integration models for logging and tracking external service interactions.
"""

from django.db import models
from django.utils import timezone
import json


class IntegrationLog(models.Model):
    """
    Logs all external integration attempts for monitoring and debugging.
    """
    
    SERVICE_CHOICES = [
        ('mock_email', 'Mock Email Service'),
        ('mock_slack', 'Mock Slack Service'),
        ('email', 'Email Service'),
        ('slack', 'Slack Service'),
    ]
    
    STATUS_CHOICES = [
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('pending', 'Pending'),
        ('retrying', 'Retrying'),
    ]
    
    EVENT_TYPE_CHOICES = [
        ('task_assigned', 'Task Assigned'),
        ('task_status_changed', 'Task Status Changed'),
        ('task_completed', 'Task Completed'),
        ('comment_added', 'Comment Added'),
        ('overdue_reminder', 'Overdue Reminder'),
        ('daily_digest', 'Daily Digest'),
        ('project_update', 'Project Update'),
    ]
    
    # Basic fields
    service = models.CharField(max_length=50, choices=SERVICE_CHOICES)
    event_type = models.CharField(max_length=50, choices=EVENT_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='success')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Related objects (optional foreign keys)
    task_id = models.IntegerField(null=True, blank=True)
    project_id = models.IntegerField(null=True, blank=True)
    organization_id = models.IntegerField(null=True, blank=True)
    
    # Integration details
    recipient = models.EmailField(blank=True)  # Email recipient or Slack channel
    subject = models.CharField(max_length=255, blank=True)  # Email subject or Slack message preview
    
    # JSON fields for flexible data storage
    request_data = models.JSONField(default=dict, help_text="Data sent to external service")
    response_data = models.JSONField(default=dict, help_text="Response from external service")
    error_message = models.TextField(blank=True, help_text="Error details if integration failed")
    
    # Performance tracking
    response_time_ms = models.IntegerField(null=True, blank=True, help_text="Response time in milliseconds")
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Integration Log'
        verbose_name_plural = 'Integration Logs'
        indexes = [
            models.Index(fields=['service', 'event_type']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['task_id']),
            models.Index(fields=['project_id']),
        ]
    
    def __str__(self):
        return f"{self.service} - {self.event_type} ({self.status})"
    
    @property
    def is_successful(self):
        """Check if integration was successful."""
        return self.status == 'success'
    
    @property
    def formatted_response_data(self):
        """Pretty-formatted JSON response for admin display."""
        return json.dumps(self.response_data, indent=2) if self.response_data else "No response data"
    
    def mark_as_failed(self, error_message: str):
        """Mark integration as failed with error details."""
        self.status = 'failed'
        self.error_message = error_message
        self.updated_at = timezone.now()
        self.save()
    
    def mark_as_success(self, response_data: dict = None):
        """Mark integration as successful with response data."""
        self.status = 'success'
        if response_data:
            self.response_data = response_data
        self.updated_at = timezone.now()
        self.save()


class IntegrationSettings(models.Model):
    """
    Configuration settings for external integrations.
    """
    
    # Service configuration
    service_name = models.CharField(max_length=50, unique=True)
    is_enabled = models.BooleanField(default=True)
    is_mock_mode = models.BooleanField(default=True, help_text="Use mock services instead of real APIs")
    
    # Configuration JSON
    configuration = models.JSONField(
        default=dict,
        help_text="Service-specific configuration (API keys, endpoints, etc.)"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Integration Setting'
        verbose_name_plural = 'Integration Settings'
    
    def __str__(self):
        return f"{self.service_name} ({'Enabled' if self.is_enabled else 'Disabled'})"
    
    @classmethod
    def is_service_enabled(cls, service_name: str) -> bool:
        """Check if a specific service is enabled."""
        try:
            setting = cls.objects.get(service_name=service_name)
            return setting.is_enabled
        except cls.DoesNotExist:
            return False
    
    @classmethod
    def is_mock_mode(cls, service_name: str) -> bool:
        """Check if service should use mock mode."""
        try:
            setting = cls.objects.get(service_name=service_name)
            return setting.is_mock_mode
        except cls.DoesNotExist:
            return True  # Default to mock mode