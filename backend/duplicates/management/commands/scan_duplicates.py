from django.core.management.base import BaseCommand
from duplicates.detection import scan_all_patients


class Command(BaseCommand):
    help = "Re-scan all existing patients for potential duplicates"

    def handle(self, *args, **options):
        self.stdout.write("Scanning...")
        total = scan_all_patients()
        self.stdout.write(self.style.SUCCESS(f"Scan complete — {total} patients checked."))