from django.apps import AppConfig


class IntegrationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'integrations'
    verbose_name = 'External Integrations'

    def ready(self):
        """Import signals when Django starts."""
        import integrations.signals
        
        # Create default integration settings
        try:
            from integrations.signals import create_default_integration_settings
            create_default_integration_settings()
        except Exception:
            # Skip during migrations
            pass