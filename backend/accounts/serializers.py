from rest_framework import serializers
from .models import User, LoginHistory


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name",
                  "role", "phone", "status", "mfa_enabled", "biometric_enabled"]
        read_only_fields = ["id", "role", "status"]  # staff can't self-promote their role


class StaffCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "first_name", "last_name", "phone", "role", "password"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)   # hashes it — never store plain text
        user.save()
        return user


class LoginHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LoginHistory
        fields = ["id", "ip_address", "device_info", "login_at", "logout_at", "status"]