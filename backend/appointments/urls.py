from django.urls import path
from .views import (
    ChairListCreateView, DoctorScheduleListCreateView, AvailableSlotsView,
    AppointmentListCreateView, AppointmentDetailView, PublicAppointmentRequestView,
    PendingRequestsListView, ConfirmRequestView, DeclineOrRescheduleRequestView,
    AppointmentActionView, WaitlistListCreateView, PublicDoctorListView
)

urlpatterns = [
    path("chairs/", ChairListCreateView.as_view()),
    path("schedules/", DoctorScheduleListCreateView.as_view()),
    path("available-slots/", AvailableSlotsView.as_view()),
    path("public-request/", PublicAppointmentRequestView.as_view()),
    path("pending-requests/", PendingRequestsListView.as_view()),
    path("pending-requests/<int:pk>/confirm/", ConfirmRequestView.as_view()),
    path("pending-requests/<int:pk>/decline/", DeclineOrRescheduleRequestView.as_view()),
    path("waitlist/", WaitlistListCreateView.as_view()),
    path("", AppointmentListCreateView.as_view()),
    path("<int:pk>/", AppointmentDetailView.as_view()),
    path("<int:pk>/<str:action>/", AppointmentActionView.as_view()),
    path("public-doctors/", PublicDoctorListView.as_view()),
]