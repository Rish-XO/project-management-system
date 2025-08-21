from django.apps import AppConfig


class IntegrationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'integrations'
    verbose_name = 'External Integrations'

    def ready(self):
        """Import signals when Django starts."""
        try:
            import integrations.signals
        except Exception:
            # Skip during initialization
            pass