"""
Django admin configuration for integration models.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from datetime import timedelta
from .models import IntegrationLog, IntegrationSettings


@admin.register(IntegrationLog)
class IntegrationLogAdmin(admin.ModelAdmin):
    """Admin interface for integration logs."""
    
    list_display = [
        'created_at',
        'service',
        'event_type', 
        'status_badge',
        'recipient',
        'subject_preview',
        'response_time_display'
    ]
    
    list_filter = [
        'service',
        'event_type',
        'status',
        'created_at'
    ]
    
    search_fields = [
        'recipient',
        'subject',
        'error_message',
        'task_id',
        'project_id'
    ]
    
    readonly_fields = [
        'created_at',
        'updated_at',
        'formatted_response_data'
    ]
    
    fieldsets = [
        ('Basic Information', {
            'fields': ['service', 'event_type', 'status', 'recipient', 'subject']
        }),
        ('Related Objects', {
            'fields': ['task_id', 'project_id', 'organization_id']
        }),
        ('Integration Data', {
            'fields': ['request_data', 'response_data', 'error_message'],
            'classes': ['collapse']
        }),
        ('Performance', {
            'fields': ['response_time_ms'],
            'classes': ['collapse']
        }),
        ('Timestamps', {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        })
    ]
    
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    
    def status_badge(self, obj):
        """Display status with colored badge."""
        colors = {
            'success': '#28a745',  # Green
            'failed': '#dc3545',   # Red
            'pending': '#ffc107',  # Yellow
            'retrying': '#17a2b8'  # Blue
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            obj.status.upper()
        )
    status_badge.short_description = 'Status'
    
    def subject_preview(self, obj):
        """Show truncated subject/message."""
        if obj.subject:
            return obj.subject[:50] + ('...' if len(obj.subject) > 50 else '')
        return '-'
    subject_preview.short_description = 'Subject/Message'
    
    def response_time_display(self, obj):
        """Display response time with formatting."""
        if obj.response_time_ms is not None:
            if obj.response_time_ms < 100:
                color = '#28a745'  # Green - fast
            elif obj.response_time_ms < 500:
                color = '#ffc107'  # Yellow - medium
            else:
                color = '#dc3545'  # Red - slow
            
            return format_html(
                '<span style="color: {}; font-weight: bold;">{} ms</span>',
                color,
                obj.response_time_ms
            )
        return '-'
    response_time_display.short_description = 'Response Time'
    
    def get_queryset(self, request):
        """Optimize queryset for admin display."""
        return super().get_queryset(request).select_related()
    
    actions = ['mark_as_successful', 'mark_as_failed', 'delete_old_logs']
    
    def mark_as_successful(self, request, queryset):
        """Bulk action to mark logs as successful."""
        updated = queryset.update(status='success')
        self.message_user(request, f'Marked {updated} logs as successful.')
    mark_as_successful.short_description = 'Mark selected logs as successful'
    
    def mark_as_failed(self, request, queryset):
        """Bulk action to mark logs as failed."""
        updated = queryset.update(status='failed')
        self.message_user(request, f'Marked {updated} logs as failed.')
    mark_as_failed.short_description = 'Mark selected logs as failed'
    
    def delete_old_logs(self, request, queryset):
        """Delete logs older than 30 days."""
        thirty_days_ago = timezone.now() - timedelta(days=30)
        old_logs = queryset.filter(created_at__lt=thirty_days_ago)
        count = old_logs.count()
        old_logs.delete()
        self.message_user(request, f'Deleted {count} logs older than 30 days.')
    delete_old_logs.short_description = 'Delete logs older than 30 days'


# Temporarily disabled due to migration issue
# @admin.register(IntegrationSettings)
class IntegrationSettingsAdmin(admin.ModelAdmin):
    """Admin interface for integration settings."""
    
    list_display = [
        'service_name',
        'status_badge',
        'mode_badge',
        'updated_at'
    ]
    
    list_filter = [
        'is_enabled',
        'is_mock_mode'
    ]
    
    search_fields = ['service_name']
    
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = [
        ('Service Configuration', {
            'fields': ['service_name', 'is_enabled', 'is_mock_mode']
        }),
        ('Advanced Configuration', {
            'fields': ['configuration'],
            'classes': ['collapse'],
            'description': 'JSON configuration for service-specific settings'
        }),
        ('Timestamps', {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        })
    ]
    
    def status_badge(self, obj):
        """Display enabled/disabled status with badge."""
        if obj.is_enabled:
            return format_html(
                '<span style="background-color: #28a745; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">ENABLED</span>'
            )
        else:
            return format_html(
                '<span style="background-color: #dc3545; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">DISABLED</span>'
            )
    status_badge.short_description = 'Status'
    
    def mode_badge(self, obj):
        """Display mock/live mode badge."""
        if obj.is_mock_mode:
            return format_html(
                '<span style="background-color: #17a2b8; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">MOCK</span>'
            )
        else:
            return format_html(
                '<span style="background-color: #28a745; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">LIVE</span>'
            )
    mode_badge.short_description = 'Mode'


# Admin site customization
admin.site.site_header = 'Project Management System - Admin'
admin.site.site_title = 'PM System Admin'
admin.site.index_title = 'Administration Dashboard'