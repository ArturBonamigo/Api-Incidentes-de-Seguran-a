from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import MeView, RegisterView, UserViewSet


router = DefaultRouter()
router.register('users', UserViewSet, basename='users')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/me/', MeView.as_view(), name='auth-me'),
]

urlpatterns += router.urls