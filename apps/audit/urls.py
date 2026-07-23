from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import IncidentTimelineViewSet

router = DefaultRouter()
router.register('timeline', IncidentTimelineViewSet, basename='timeline')

urlpatterns = [
    path(
        'incidentes/<int:incident_id>/timeline/',
        IncidentTimelineViewSet.as_view({'get': 'list'}),
        name='incident-timeline'
    )
]

urlpatterns += router.urls