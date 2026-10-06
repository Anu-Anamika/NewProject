"""
Migration: Add UserConsent model.

Creates the UserConsent table which records each user's explicit acceptance
of the Privacy & Data Storage Agreement at registration time.

Existing users will have NO consent record until they register via the new
flow — this is intentional and safe; the backend consent check only applies
to new registrations.
"""
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("predictor", "0003_sleepanalysis"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="UserConsent",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("privacy_consent", models.BooleanField(default=False)),
                (
                    "privacy_consent_at",
                    models.DateTimeField(blank=True, null=True),
                ),
                (
                    "privacy_consent_version",
                    models.CharField(blank=True, default="1.0", max_length=20),
                ),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="consent",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "User Consent",
                "verbose_name_plural": "User Consents",
            },
        ),
    ]
