from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CustomTokenObtainPairView, StaffListCreateView, MyProfileView, LoginHistoryListView

urlpatterns = [
    path("login/", CustomTokenObtainPairView.as_view()),
    path("login/refresh/", TokenRefreshView.as_view()),
    path("staff/", StaffListCreateView.as_view()),
    path("me/", MyProfileView.as_view()),
    path("login-history/", LoginHistoryListView.as_view(), name="login-history"),
]