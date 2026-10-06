from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import PRIVACY_POLICY_VERSION


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    password_confirm = serializers.CharField(write_only=True, required=True)
    # Privacy & Data Storage Agreement consent — required, must be True
    privacy_consent = serializers.BooleanField(required=True)

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def validate_privacy_consent(self, value):
        if not value:
            raise serializers.ValidationError(
                "You must accept the Privacy & Data Storage Agreement to create an account."
            )
        return value

    def validate(self, attrs):
        password = attrs.get('password')
        password_confirm = attrs.get('password_confirm')

        if password != password_confirm:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})

        # Run Django's configured password validators
        user = User(username=attrs.get('username'), email=attrs.get('email'))
        validate_password(password, user=user)

        return attrs

    def create(self, validated_data):
        # Remove consent fields before creating the User object
        privacy_consent = validated_data.pop('privacy_consent', False)
        validated_data.pop('password_confirm', None)

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
        )
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)
