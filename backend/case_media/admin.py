from django.contrib import admin
from .models import MediaFile

@admin.register(MediaFile)
class MediaFileAdmin(admin.ModelAdmin):
    list_display = ["patient", "media_type", "category", "version_number", "is_current", "is_deleted", "uploaded_at"]
    list_filter = ["media_type", "is_current", "is_deleted"]