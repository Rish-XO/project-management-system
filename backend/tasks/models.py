from django.db import models
from projects.models import Project


class Task(models.Model):
    TASK_STATUS_CHOICES = [
        ('TODO', 'To Do'),
        ('IN_PROGRESS', 'In Progress'),
        ('DONE', 'Done'),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='tasks'
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=TASK_STATUS_CHOICES,
        default='TODO'
    )
    assignee_email = models.EmailField(blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Task'
        verbose_name_plural = 'Tasks'
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['assignee_email']),
            models.Index(fields=['due_date']),
        ]

    def __str__(self):
        return f"{self.project.name} - {self.title}"

    @property
    def organization(self):
        return self.project.organization

    @property
    def is_overdue(self):
        if not self.due_date:
            return False
        from django.utils import timezone
        return self.due_date < timezone.now() and self.status != 'DONE'


class TaskComment(models.Model):
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    content = models.TextField()
    author_email = models.EmailField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Task Comment'
        verbose_name_plural = 'Task Comments'
        indexes = [
            models.Index(fields=['task', 'timestamp']),
            models.Index(fields=['author_email']),
        ]

    def __str__(self):
        return f"Comment on {self.task.title} by {self.author_email}"

    @property
    def organization(self):
        return self.task.project.organization
