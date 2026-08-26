from django.urls import path
from .views import PerioExamListCreateView, PerioExamDetailView

urlpatterns = [
    path("<int:patient_id>/", PerioExamListCreateView.as_view()),
    path("exam/<int:pk>/", PerioExamDetailView.as_view()),
]