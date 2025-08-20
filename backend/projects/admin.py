from django.contrib import admin
from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'organization', 'status', 'task_count', 'completion_percentage', 'due_date', 'created_at']
    list_filter = ['status', 'organization', 'created_at', 'due_date']
    search_fields = ['name', 'description', 'organization__name']
    readonly_fields = ['created_at', 'updated_at', 'task_count', 'completed_tasks', 'completion_percentage']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('organization', 'name', 'description')
        }),
        ('Status & Dates', {
            'fields': ('status', 'due_date')
        }),
        ('Statistics', {
            'fields': ('task_count', 'completed_tasks', 'completion_percentage'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
