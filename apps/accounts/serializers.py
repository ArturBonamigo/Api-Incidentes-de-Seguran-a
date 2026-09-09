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
            'is_staff',
            'is_superuser',
            'date_joined',
        )

    def validate(self, attrs):
        request = self.context.get('request')

        if request and self.instance == request.user:
            if attrs.get('is_active') is False:
                raise serializers.ValidationError({
                    'is_active': 'Voce nao pode desativar a propria conta.'
                })

            if attrs.get('perfil') and attrs.get('perfil') != User.Perfil.ADMIN:
                raise serializers.ValidationError({
                    'perfil': 'Voce nao pode remover seu proprio perfil de administrador.'
                })

        return attrs


class EmployeeCreateSerializer(serializers.ModelSerializer):
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
            'perfil',
            'is_active',
            'date_joined',
            'password',
            'password_confirm',
        )
        read_only_fields = ('id', 'date_joined')

    def validate_perfil(self, value):
        if value == User.Perfil.USUARIO_COMUM:
            raise serializers.ValidationError(
                'Use o cadastro publico para usuario comum.'
            )
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError(
                {"password_confirm": "As senhas nao coincidem."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')

        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
