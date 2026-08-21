from django.urls import path
from .views import (
    TreatmentPlanListCreateView, TreatmentPlanDetailView,
    TreatmentPlanItemListCreateView, TreatmentPlanItemDetailView,
    ProposePlanView, PatientConsentView, RevisePlanView,
)

urlpatterns = [
    path("<int:patient_id>/", TreatmentPlanListCreateView.as_view()),
    path("plan/<int:pk>/", TreatmentPlanDetailView.as_view()),
    path("plan/<int:plan_id>/items/", TreatmentPlanItemListCreateView.as_view()),
    path("item/<int:pk>/", TreatmentPlanItemDetailView.as_view()),
    path("plan/<int:pk>/propose/", ProposePlanView.as_view()),
    path("plan/<int:pk>/consent/", PatientConsentView.as_view()),
    path("plan/<int:pk>/revise/", RevisePlanView.as_view()),
]