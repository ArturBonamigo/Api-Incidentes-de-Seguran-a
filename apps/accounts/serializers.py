from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'perfil',
            'is_active',
            'date_joined',
        )
        read_only_fields = (
            'id',
            'perfil',
            'is_active',
            'date_joined',
        )

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'},
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
    )

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'password',
            'password_confirm',
        )
        read_only_fields = ('id',)

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError(
                {"password_confirm": "As senhas nao coincidem."}
            )
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        return user

class UserAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'perfil',
            'is_active',
            'is_staff',
            'is_superuser',
            'date_joined',
        )
        read_only_fields = (
            'id',
            'username',
            'is_superuser',
            'date_joined',
        )