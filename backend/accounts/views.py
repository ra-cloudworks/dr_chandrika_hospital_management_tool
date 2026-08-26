from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import generics, permissions
from .models import LoginHistory, User
from .serializers import UserSerializer, StaffCreateSerializer, LoginHistorySerializer
from .permissions import IsChiefDoctor, IsOwnerOrChiefDoctor


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        LoginHistory.objects.create(
            user=self.user,
            ip_address=self.context["request"].META.get("REMOTE_ADDR"),
            device_info=self.context["request"].META.get("HTTP_USER_AGENT", ""),
            status="success",
        )
        data["role"] = self.user.role
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class StaffListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.exclude(role="patient")
    permission_classes = [IsChiefDoctor]

    def get_serializer_class(self):
        return StaffCreateSerializer if self.request.method == "POST" else UserSerializer


class MyProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class LoginHistoryListView(generics.ListAPIView):
    """
    API view to list the login history for the currently logged-in user.
    """
    serializer_class = LoginHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LoginHistory.objects.filter(user=self.request.user).order_by("-login_at")