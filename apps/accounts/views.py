from rest_framework import generics, permissions, viewsets

from .serializers import (
    EmployeeCreateSerializer,
    UserAdminSerializer,
    UserRegisterSerializer,
    UserSerializer,
)
from .models import User
from .permissions import IsAdminProfile


class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegisterSerializer
    permission_classes = [permissions.AllowAny]

class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserAdminSerializer
    permission_classes = [IsAdminProfile]
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_serializer_class(self):
        if self.action == 'create':
            return EmployeeCreateSerializer
        return UserAdminSerializer
