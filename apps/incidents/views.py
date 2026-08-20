from django.shortcuts import get_object_or_404

from rest_framework import permissions, viewsets

from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.audit.models import IncidentTimeline

from .models import Incident, IncidentComment
from django.db.models import Q
from .permissions import CanAccessIncident
from .serializers import IncidentSerializer, IncidentCommentSerializer

from django.utils.dateparse import parse_date

class IncidentViewSet(viewsets.ModelViewSet):
    serializer_class = IncidentSerializer
    permission_classes = [CanAccessIncident]
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def registrar_timeline(
        self,
        incident,
        acao,
        descricao,
        valor_anterior='',
        valor_novo='',
    ):
        IncidentTimeline.objects.create(
            incidente=incident,
            usuario=self.request.user,
            acao=acao,
            descricao=descricao,
            valor_anterior=valor_anterior,
            valor_novo=valor_novo,
        )

    def get_queryset(self):
        user = self.request.user
        queryset = Incident.objects.all().order_by('-data_abertura')

        params = self.request.query_params

        data_abertura_inicio = params.get('data_abertura_inicio')
        data_abertura_fim = params.get('data_abertura_fim')

        status = params.get('status')
        criticidade = params.get('criticidade')
        tipo_incidente = params.get('tipo_incidente')
        envolve_dados_sensiveis = params.get('envolve_dados_sensiveis')

        if status and status not in Incident.Status.values:
            raise ValidationError({'status': 'Status invalido.'})

        if criticidade and criticidade not in Incident.Criticidade.values:
            raise ValidationError({'criticidade': 'Criticidade invalida.'})

        if tipo_incidente and tipo_incidente not in Incident.TipoIncidente.values:
            raise ValidationError({'tipo_incidente': 'Tipo de incidente invalido.'})

        if envolve_dados_sensiveis and envolve_dados_sensiveis not in ['true', 'false']:
            raise ValidationError({'envolve_dados_sensiveis': 'Valor invalido. Use true ou false.'})

        if status:
            queryset = queryset.filter(status=status)

        if criticidade:
            queryset = queryset.filter(criticidade=criticidade)

        if tipo_incidente:
            queryset = queryset.filter(tipo_incidente=tipo_incidente)

        if envolve_dados_sensiveis:
            envolve_dados_sensiveis_bool = envolve_dados_sensiveis.lower() == 'true'
            queryset = queryset.filter(envolve_dados_sensiveis=envolve_dados_sensiveis_bool)

        if data_abertura_inicio:
            data_abertura_inicio = parse_date(data_abertura_inicio)

            if not data_abertura_inicio:
                raise ValidationError({'data_abertura_inicio': 'Data de abertura inicio invalida. Use o formato YYYY-MM-DD.'})
            
            queryset = queryset.filter(data_abertura__date__gte=data_abertura_inicio)

        if data_abertura_fim:
            data_abertura_fim = parse_date(data_abertura_fim)

            if not data_abertura_fim:
                raise ValidationError({'data_abertura_fim': 'Data de abertura fim invalida. Use o formato YYYY-MM-DD.'})

            if data_abertura_fim is not None and data_abertura_inicio is not None and data_abertura_fim < data_abertura_inicio:
                raise ValidationError({'data_abertura_fim': 'Data de abertura fim nao pode ser menor que a data de abertura inicio.'})

            queryset = queryset.filter(data_abertura__date__lte=data_abertura_fim)

        search = params.get('search')
        if search:
            queryset = queryset.filter(
                Q(titulo__icontains=search)
                | Q(usuario_reportante__username__icontains=search)
                | Q(analista_responsavel__username__icontains=search)
                | Q(descricao__icontains=search)
            )


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

        self.registrar_timeline(
            incident=incident,
            acao=IncidentTimeline.Acao.ANALISTA_ATRIBUIDO,
            descricao=f'Incidente assumido por {user.username}.',
            valor_novo=user.username,
        )

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

        status_anterior = incident.status
        incident.status = novo_status
        incident.save()

        self.registrar_timeline(
            incident=incident,
            acao=IncidentTimeline.Acao.STATUS_ALTERADO,
            descricao=f'Status alterado de {status_anterior} para {novo_status}.',
            valor_anterior=status_anterior,
            valor_novo=novo_status,
        )

        serializer = self.get_serializer(incident)
        return Response(serializer.data)
        

    def perform_create(self, serializer):
        incident = serializer.save(usuario_reportante=self.request.user)

        self.registrar_timeline(
            incident=incident,
            acao=IncidentTimeline.Acao.INCIDENTE_CRIADO,
            descricao='Incidente criado.',
            valor_novo=incident.status,
        )

class IncidentCommentViewSet(viewsets.ModelViewSet):
    serializer_class = IncidentCommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']

    def user_can_access_incident(self, user, incident):
        return (
            user.is_superuser
            or user.perfil in ['ADMIN', 'ANALISTA_SOC', 'GESTOR', 'AUDITOR']
            or incident.usuario_reportante == user
        )

    def get_incident(self):
        incident = get_object_or_404(Incident, pk=self.kwargs.get('incident_id'))
        user = self.request.user

        if not self.user_can_access_incident(user, incident):
            raise PermissionDenied('Voce nao tem permissao para acessar este incidente.')

        return incident

    def get_queryset(self):
        incident = self.get_incident()
        return IncidentComment.objects.filter(incidente=incident)

    def perform_create(self, serializer):
        user = self.request.user

        if user.perfil == 'AUDITOR':
            raise PermissionDenied('Auditor nao pode adicionar comentarios.')

        incident = self.get_incident()
        comment = serializer.save(incidente=incident, usuario=user)

        IncidentTimeline.objects.create(
            incidente=incident,
            usuario=user,
            acao=IncidentTimeline.Acao.COMENTARIO_ADICIONADO,
            descricao=f'Comentario adicionado por {user.username}.',
            valor_novo=comment.comentario,
        )
