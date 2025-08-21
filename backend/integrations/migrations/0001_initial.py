# Generated manually for integrations app

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='IntegrationLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('service', models.CharField(choices=[('mock_email', 'Mock Email Service'), ('mock_slack', 'Mock Slack Service'), ('email', 'Email Service'), ('slack', 'Slack Service')], max_length=50)),
                ('event_type', models.CharField(choices=[('task_assigned', 'Task Assigned'), ('task_status_changed', 'Task Status Changed'), ('task_completed', 'Task Completed'), ('comment_added', 'Comment Added'), ('overdue_reminder', 'Overdue Reminder'), ('daily_digest', 'Daily Digest'), ('project_update', 'Project Update')], max_length=50)),
                ('status', models.CharField(choices=[('success', 'Success'), ('failed', 'Failed'), ('pending', 'Pending'), ('retrying', 'Retrying')], default='success', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('task_id', models.IntegerField(blank=True, null=True)),
                ('project_id', models.IntegerField(blank=True, null=True)),
                ('organization_id', models.IntegerField(blank=True, null=True)),
                ('recipient', models.EmailField(blank=True, max_length=254)),
                ('subject', models.CharField(blank=True, max_length=255)),
                ('request_data', models.JSONField(default=dict, help_text='Data sent to external service')),
                ('response_data', models.JSONField(default=dict, help_text='Response from external service')),
                ('error_message', models.TextField(blank=True, help_text='Error details if integration failed')),
                ('response_time_ms', models.IntegerField(blank=True, help_text='Response time in milliseconds', null=True)),
            ],
            options={
                'verbose_name': 'Integration Log',
                'verbose_name_plural': 'Integration Logs',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='IntegrationSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('service_name', models.CharField(max_length=50, unique=True)),
                ('is_enabled', models.BooleanField(default=True)),
                ('is_mock_mode', models.BooleanField(default=True, help_text='Use mock services instead of real APIs')),
                ('configuration', models.JSONField(default=dict, help_text='Service-specific configuration (API keys, endpoints, etc.)')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Integration Setting',
                'verbose_name_plural': 'Integration Settings',
            },
        ),
        migrations.AddIndex(
            model_name='integrationlog',
            index=models.Index(fields=['service', 'event_type'], name='integration_service_fb7b1d_idx'),
        ),
        migrations.AddIndex(
            model_name='integrationlog',
            index=models.Index(fields=['status', 'created_at'], name='integration_status_7e2a61_idx'),
        ),
        migrations.AddIndex(
            model_name='integrationlog',
            index=models.Index(fields=['task_id'], name='integration_task_id_c6e456_idx'),
        ),
        migrations.AddIndex(
            model_name='integrationlog',
            index=models.Index(fields=['project_id'], name='integration_project_3e9a44_idx'),
        ),
    ]