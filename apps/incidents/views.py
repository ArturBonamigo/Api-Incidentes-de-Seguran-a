from rest_framework import viewsets

from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import Incident
from .permissions import CanAccessIncident
from .serializers import IncidentSerializer


class IncidentViewSet(viewsets.ModelViewSet):
    serializer_class = IncidentSerializer
    permission_classes = [CanAccessIncident]
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        queryset = Incident.objects.all().order_by('-data_abertura')

        if user.is_superuser or user.perfil in [
            'ADMIN',
            'ANALISTA_SOC',
            'GESTOR',
            'AUDITOR',
        ]:
            return queryset

        return queryset.filter(usuario_reportante=user)
    
    @action(detail=True, methods=['post'], url_path='assumir')
    def assumir(self, request, pk=None):
        user = request.user

        if not (user.is_superuser or user.perfil in ['ADMIN', 'ANALISTA_SOC']):
            raise PermissionDenied('Voce nao tem permissao para assumir incidentes.')

        incident = self.get_object()

        if incident.analista_responsavel is not None:
            raise ValidationError('Este incidente ja foi assumido por outro analista.')

        incident.analista_responsavel = user
        incident.save()

        serializer = self.get_serializer(incident)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='alterar-status')
    def alterar_status(self, request, pk=None):
        user = request.user

        if not (
            user.is_superuser
            or user.perfil in ['ADMIN', 'ANALISTA_SOC', 'GESTOR']
        ):
            raise PermissionDenied('Voce nao tem permissao para alterar status.')

        incident = self.get_object()
        novo_status = request.data.get('status')

        if not novo_status:
            raise ValidationError({'status': 'Este campo e obrigatorio.'})

        if novo_status not in Incident.Status.values:
            raise ValidationError({'status': 'Status invalido.'})

        incident.status = novo_status
        incident.save()

        serializer = self.get_serializer(incident)
        return Response(serializer.data)
        

    def perform_create(self, serializer):
        serializer.save(usuario_reportante=self.request.user)
