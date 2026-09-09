from django.shortcuts import get_object_or_404

from rest_framework import permissions, viewsets

from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.audit.models import IncidentTimeline

from .models import Incident, IncidentComment
from django.db.models import Count, Q, Case, When, Value, IntegerField
from django.db.models.functions import TruncDate
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
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
        queryset = Incident.objects.select_related('usuario_reportante', 'analista_responsavel')

        params = self.request.query_params

        data_abertura_inicio = params.get('data_abertura_inicio') or None
        data_abertura_fim = params.get('data_abertura_fim') or None

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
            try:
                data_abertura_inicio = parse_date(data_abertura_inicio)
            except ValueError:
                data_abertura_inicio = None

            if not data_abertura_inicio:
                raise ValidationError({'data_abertura_inicio': 'Data de abertura inicio invalida. Use o formato YYYY-MM-DD.'})
            
            queryset = queryset.filter(data_abertura__date__gte=data_abertura_inicio)

        if data_abertura_fim:
            try:
                data_abertura_fim = parse_date(data_abertura_fim)
            except ValueError:
                data_abertura_fim = None

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

        fila = params.get('fila')
        if fila not in [None, '', 'ativos', 'meus', 'nao_atribuidos']:
            raise ValidationError({'fila': 'Fila invalida.'})
        if fila:
            queryset = queryset.exclude(status__in=['RESOLVIDO', 'FALSO_POSITIVO', 'CANCELADO'])
        if fila == 'meus':
            queryset = queryset.filter(analista_responsavel=user)
        if fila == 'nao_atribuidos':
            queryset = queryset.filter(analista_responsavel__isnull=True)

        if not (
            user.is_superuser
            or user.perfil in ['ADMIN', 'ANALISTA_SOC', 'GESTOR', 'AUDITOR']
        ):
            queryset = queryset.filter(usuario_reportante=user)

        ordenar_por = params.get('ordenar_por')

        ordenacoes = {
            None: '-data_abertura',
            'mais_recentes': '-data_abertura',
            'mais_antigos': 'data_abertura',
        }

        if ordenar_por not in ordenacoes:
            raise ValidationError({'ordenar_por': 'Valor invalido. Use mais_recentes ou mais_antigos'})

        return queryset.order_by(ordenacoes[ordenar_por], 'id')
    
    @action(detail=True, methods=['post'], url_path='assumir')
    @transaction.atomic
    def assumir(self, request, pk=None):
        user = request.user

        if not (user.is_superuser or user.perfil in ['ADMIN', 'ANALISTA_SOC']):
            raise PermissionDenied('Voce nao tem permissao para assumir incidentes.')

        incident = self.get_object()

        updated = Incident.objects.filter(pk=incident.pk, analista_responsavel__isnull=True).update(
            analista_responsavel=user, data_atualizacao=timezone.now())
        if not updated:
            raise ValidationError('Este incidente ja foi assumido por outro analista.')

        incident.refresh_from_db()

        self.registrar_timeline(
            incident=incident,
            acao=IncidentTimeline.Acao.ANALISTA_ATRIBUIDO,
            descricao=f'Incidente assumido por {user.username}.',
            valor_novo=user.username,
        )

        serializer = self.get_serializer(incident)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='alterar-status')
    @transaction.atomic
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
        if novo_status == status_anterior:
            return Response(self.get_serializer(incident).data)
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
        

    @transaction.atomic
    def perform_create(self, serializer):
        incident = serializer.save(usuario_reportante=self.request.user)

        self.registrar_timeline(
            incident=incident,
            acao=IncidentTimeline.Acao.INCIDENTE_CRIADO,
            descricao='Incidente criado.',
            valor_novo=incident.status,
        )

    @transaction.atomic
    def perform_update(self, serializer):
        anterior = serializer.instance.status
        criticidade_anterior = serializer.instance.criticidade
        incident = serializer.save()
        if anterior != incident.status:
            self.registrar_timeline(incident, IncidentTimeline.Acao.STATUS_ALTERADO,
                f'Status alterado de {anterior} para {incident.status}.', anterior, incident.status)
        if criticidade_anterior != incident.criticidade:
            self.registrar_timeline(incident, IncidentTimeline.Acao.CRITICIDADE_ALTERADA,
                'Criticidade recalculada.', criticidade_anterior, incident.criticidade)

    @action(detail=False, methods=['get'], url_path='estatisticas')
    def estatisticas(self, request):
        queryset = self.get_queryset()

        por_status = {
            item['status']: item['total']
            for item in queryset.order_by().values('status').annotate(total=Count('id'))
        }
        por_criticidade = {
            item['criticidade']: item['total']
            for item in queryset.order_by().values('criticidade').annotate(total=Count('id'))
        }

        incidentes_encerrados = [
            Incident.Status.RESOLVIDO,
            Incident.Status.FALSO_POSITIVO,
            Incident.Status.CANCELADO,
        ]

        recentes = queryset.order_by('-data_abertura')[:5]
        ativos = queryset.exclude(status__in=incidentes_encerrados)
        hoje = timezone.localdate()
        inicio = hoje - timedelta(days=13)
        atividade = {
            item['dia']: item['total']
            for item in queryset.filter(data_abertura__date__gte=inicio)
            .order_by().annotate(dia=TruncDate('data_abertura')).values('dia').annotate(total=Count('id'))
        }
        prioridade = Case(When(criticidade='CRITICA', then=Value(0)),
            When(criticidade='ALTA', then=Value(1)), When(criticidade='MEDIA', then=Value(2)),
            default=Value(3), output_field=IntegerField())

        return Response({
            'total': queryset.count(),
            'abertos': queryset.exclude(status__in=incidentes_encerrados).count(),
            'encerrados': queryset.filter(status__in=incidentes_encerrados).count(),
            'nao_atribuidos': queryset.filter(analista_responsavel__isnull=True).count(),
            'com_dados_sensiveis': queryset.filter(envolve_dados_sensiveis=True).count(),
            'criticos_ativos': ativos.filter(criticidade='CRITICA').count(),
            'ativos_nao_atribuidos': ativos.filter(analista_responsavel__isnull=True).count(),
            'por_tipo': {item['tipo_incidente']: item['total'] for item in
                queryset.order_by().values('tipo_incidente').annotate(total=Count('id'))},
            'atividade': [{'data': (inicio + timedelta(days=i)).isoformat(),
                'total': atividade.get(inicio + timedelta(days=i), 0)} for i in range(14)],
            'prioritarios': self.get_serializer(ativos.order_by(prioridade, 'data_abertura')[:4], many=True).data,
            'por_status': por_status,
            'por_criticidade': por_criticidade,
            'recentes': IncidentSerializer(recentes, many=True).data,
        })

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
