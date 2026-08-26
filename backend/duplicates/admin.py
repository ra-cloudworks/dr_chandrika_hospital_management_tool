from django.contrib import admin
from .models import DuplicateFlag, MergeLog

admin.site.register(DuplicateFlag)
admin.site.register(MergeLog)