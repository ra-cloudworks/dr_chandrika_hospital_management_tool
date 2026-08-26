from django.urls import path
from .views import (
    CaseListCreateView, CaseDetailView, CloseCaseView,
    CaseVisitNoteListCreateView, CaseExportView,
)

urlpatterns = [
    path("<int:patient_id>/", CaseListCreateView.as_view()),
    path("case/<int:pk>/", CaseDetailView.as_view()),
    path("case/<int:pk>/close/", CloseCaseView.as_view()),
    path("case/<int:pk>/export/", CaseExportView.as_view()),
    path("case/<int:case_id>/visits/", CaseVisitNoteListCreateView.as_view()),
]