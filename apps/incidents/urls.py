from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import IncidentViewSet

router = DefaultRouter()
router.register('incidentes', IncidentViewSet, basename='incidentes')

urlpatterns = [

]

urlpatterns += router.urls