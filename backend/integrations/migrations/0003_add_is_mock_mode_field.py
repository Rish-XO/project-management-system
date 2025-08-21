# Generated manually to restore is_mock_mode field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('integrations', '0002_rename_integration_service_fb7b1d_idx_integration_service_38db09_idx_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='integrationsettings',
            name='is_mock_mode',
            field=models.BooleanField(default=True, help_text='Use mock services instead of real APIs'),
        ),
    ]