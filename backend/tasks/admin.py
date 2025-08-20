from django.contrib import admin
from .models import Task, TaskComment


class TaskCommentInline(admin.TabularInline):
    model = TaskComment
    extra = 0
    readonly_fields = ['timestamp']
    fields = ['content', 'author_email', 'timestamp']


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'project', 'status', 'assignee_email', 'due_date', 'is_overdue', 'created_at']
    list_filter = ['status', 'project__organization', 'project', 'created_at', 'due_date']
    search_fields = ['title', 'description', 'assignee_email', 'project__name']
    readonly_fields = ['created_at', 'updated_at', 'organization', 'is_overdue']
    ordering = ['-created_at']
    inlines = [TaskCommentInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('project', 'title', 'description')
        }),
        ('Assignment & Status', {
            'fields': ('status', 'assignee_email', 'due_date')
        }),
        ('Related Information', {
            'fields': ('organization', 'is_overdue'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ['task', 'author_email', 'content_preview', 'timestamp']
    list_filter = ['timestamp', 'task__project__organization', 'task__project']
    search_fields = ['content', 'author_email', 'task__title']
    readonly_fields = ['timestamp', 'organization']
    ordering = ['-timestamp']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content Preview'
