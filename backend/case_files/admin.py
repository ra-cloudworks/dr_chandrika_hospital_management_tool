from django.contrib import admin
from .models import Case, CaseVisitNote, MaterialUsed

class MaterialUsedInline(admin.TabularInline):
    model = MaterialUsed
    extra = 0

class CaseVisitNoteInline(admin.TabularInline):
    model = CaseVisitNote
    extra = 0
    show_change_link = True

@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    list_display = ["case_number", "patient", "title", "category", "status", "opened_at"]
    list_filter = ["category", "status"]
    inlines = [CaseVisitNoteInline]

@admin.register(CaseVisitNote)
class CaseVisitNoteAdmin(admin.ModelAdmin):
    list_display = ["case", "visit_date", "doctor"]
    inlines = [MaterialUsedInline]

admin.site.register(MaterialUsed)