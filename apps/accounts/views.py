from rest_framework import generics, permissions, viewsets

from .serializers import UserRegisterSerializer, UserSerializer, UserAdminSerializer
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
    http_method_names = ['get', 'patch', 'head', 'options']