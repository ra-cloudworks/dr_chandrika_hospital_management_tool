from django.apps import AppConfig


class DuplicatesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "duplicates"

    def ready(self):
        from django.db.models.signals import post_save
        from patients.models import Patient
        from .detection import find_duplicates_for

        def run_detection(sender, instance, created, **kwargs):
            find_duplicates_for(instance)

        post_save.connect(run_detection, sender=Patient)