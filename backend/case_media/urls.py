from django.urls import path
from .views import (
    MediaFileListCreateView, MediaFileDetailView,
    MediaFileNewVersionView, MediaFileSoftDeleteView,
)

urlpatterns = [
    path("<int:patient_id>/", MediaFileListCreateView.as_view()),
    path("file/<int:pk>/", MediaFileDetailView.as_view()),
    path("file/<int:pk>/new-version/", MediaFileNewVersionView.as_view()),
    path("file/<int:pk>/delete/", MediaFileSoftDeleteView.as_view()),
]