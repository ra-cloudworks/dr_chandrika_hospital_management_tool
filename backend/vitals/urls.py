from django.urls import path
from .views import PatientVitalsListCreateView, MyVitalsListView

urlpatterns = [
    path("<int:patient_id>/", PatientVitalsListCreateView.as_view()),
    path("me/", MyVitalsListView.as_view()),
]