from django.urls import path
from .views import DuplicateFlagListView, DismissFlagView, MergePatientsView, MergeHistoryListView
from .views import (
    DuplicateFlagListView, DismissFlagView, MergePatientsView,
    MergeHistoryListView, ScanDuplicatesView
)

urlpatterns = [
    path("flags/", DuplicateFlagListView.as_view()),
    path("flags/<int:pk>/dismiss/", DismissFlagView.as_view()),
    path("merge/", MergePatientsView.as_view()),
    path("merge-history/", MergeHistoryListView.as_view()),
    path("scan/", ScanDuplicatesView.as_view())
]