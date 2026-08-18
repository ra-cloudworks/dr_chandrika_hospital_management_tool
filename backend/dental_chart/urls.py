from django.urls import path
from .views import (
    ToothRecordListCreateView, ToothRecordDetailView,
    EndodonticDetailCreateView, ImplantDetailCreateView, OrthodonticDetailCreateView,
)

urlpatterns = [
    path("<int:patient_id>/", ToothRecordListCreateView.as_view()),
    path("record/<int:pk>/", ToothRecordDetailView.as_view()),
    path("record/<int:tooth_record_id>/endodontic/", EndodonticDetailCreateView.as_view()),
    path("record/<int:tooth_record_id>/implant/", ImplantDetailCreateView.as_view()),
    path("record/<int:tooth_record_id>/orthodontic/", OrthodonticDetailCreateView.as_view()),
]