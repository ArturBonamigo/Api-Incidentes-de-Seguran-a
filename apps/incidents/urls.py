from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import IncidentCommentViewSet, IncidentViewSet

router = DefaultRouter()
router.register('incidentes', IncidentViewSet, basename='incidentes')

urlpatterns = [
    path(
        'incidentes/<int:incident_id>/comentarios/',
        IncidentCommentViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='incident-comments',
    ),
]

urlpatterns += router.urls
