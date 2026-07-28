from django.urls import path
from .views import (
    PatientListCreateView, PatientDetailView, MyPatientProfileView,
    MedicalHistoryListCreateView, AllergyListCreateView, GuardianListCreateView,
)

urlpatterns = [
    path("", PatientListCreateView.as_view()),
    path("me/", MyPatientProfileView.as_view()),
    path("<int:pk>/", PatientDetailView.as_view()),
    path("<int:patient_id>/medical-history/", MedicalHistoryListCreateView.as_view()),
    path("<int:patient_id>/allergies/", AllergyListCreateView.as_view()),
    path("<int:patient_id>/guardians/", GuardianListCreateView.as_view()),
]