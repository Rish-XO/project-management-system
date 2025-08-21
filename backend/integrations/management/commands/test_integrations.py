"""
Django management command to test mock integrations.
"""

from django.core.management.base import BaseCommand
from integrations.services import MockEmailService, MockSlackService, IntegrationOrchestrator
from integrations.models import IntegrationSettings
from tasks.models import Task
from projects.models import Project
from organizations.models import Organization


class Command(BaseCommand):
    help = 'Test mock integration services'

    def add_arguments(self, parser):
        parser.add_argument(
            '--service',
            type=str,
            choices=['email', 'slack', 'all'],
            default='all',
            help='Which service to test'
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('🧪 Testing Mock Integration Services...')
        )

        service = options['service']

        if service in ['email', 'all']:
            self._test_email_service()

        if service in ['slack', 'all']:
            self._test_slack_service()

        if service == 'all':
            self._test_orchestrator()

        self.stdout.write(
            self.style.SUCCESS('\n✅ Integration testing completed!')
        )

    def _test_email_service(self):
        self.stdout.write('\n📧 Testing Email Service:')
        self.stdout.write('-' * 40)

        # Test basic email
        result = MockEmailService.send_overdue_reminder(None)
        self.stdout.write(f"✓ Overdue reminder test: {result.get('status', 'unknown')}")

        # Test with real task if available
        try:
            task = Task.objects.first()
            if task:
                result = MockEmailService.send_task_assignment_email(task, 'test@example.com')
                self.stdout.write(f"✓ Task assignment test: {result.get('status', 'unknown')}")
            else:
                self.stdout.write("ℹ️  No tasks available for testing")
        except Exception as e:
            self.stdout.write(f"⚠️  Task test skipped: {e}")

    def _test_slack_service(self):
        self.stdout.write('\n💬 Testing Slack Service:')
        self.stdout.write('-' * 40)

        # Test basic Slack message
        try:
            org = Organization.objects.first()
            if org:
                result = MockSlackService.post_daily_digest(org, 10, 7)
                self.stdout.write(f"✓ Daily digest test: {result.get('status', 'unknown')}")
            else:
                self.stdout.write("ℹ️  No organizations available for testing")
        except Exception as e:
            self.stdout.write(f"⚠️  Slack test skipped: {e}")

    def _test_orchestrator(self):
        self.stdout.write('\n🔗 Testing Integration Orchestrator:')
        self.stdout.write('-' * 40)

        orchestrator = IntegrationOrchestrator()
        
        try:
            task = Task.objects.first()
            if task:
                results = orchestrator.handle_task_assigned(task, 'test@example.com')
                self.stdout.write(f"✓ Task assignment orchestration: {len(results)} services triggered")
            else:
                self.stdout.write("ℹ️  No tasks available for orchestrator testing")
        except Exception as e:
            self.stdout.write(f"⚠️  Orchestrator test skipped: {e}")

        # Show integration settings
        self.stdout.write('\n⚙️  Current Integration Settings:')
        settings = IntegrationSettings.objects.all()
        for setting in settings:
            status = "✓ Enabled" if setting.is_enabled else "✗ Disabled"
            mode = "Mock" if setting.is_mock_mode else "Live"
            self.stdout.write(f"  {setting.service_name}: {status} ({mode})")

        if not settings.exists():
            self.stdout.write("  No integration settings found")