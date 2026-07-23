from rest_framework import viewsets

from apps.audit.models import IncidentTimeline
from .serializers import IncidentTimelineSerializer

class IncidentTimelineViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = IncidentTimelineSerializer
    http_method_names = ['get', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        incident_id = self.kwargs.get('incident_id')

        queryset = IncidentTimeline.objects.all().order_by('-criado_em')

        if incident_id is not None:
            queryset = IncidentTimeline.objects.filter(incidente_id=incident_id)

        if user.is_superuser or user.perfil in [
            'ADMIN',
            'ANALISTA_SOC',
            'GESTOR',
            'AUDITOR'
        ]:
            return queryset
        
        return queryset.filter(incidente__usuario_reportante=user)            