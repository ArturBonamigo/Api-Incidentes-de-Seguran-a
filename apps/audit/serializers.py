from rest_framework import serializers

from .models import IncidentTimeline

class IncidentTimelineSerializer(serializers.ModelSerializer):

    incidente_titulo = serializers.CharField(
        source='incidente.titulo',
        read_only=True,
    )

    usuario_username = serializers.CharField(
        source='usuario.username',
        read_only=True,
    )

    class Meta:
        model = IncidentTimeline
        fields = (
            'id',
            'incidente',
            'incidente_titulo',
            'usuario',
            'usuario_username',
            'acao',
            'descricao',
            'valor_anterior',
            'valor_novo',
            'criado_em'
        )
        read_only_fields = (
            'id',
            'incidente',
            'incidente_titulo',
            'usuario',
            'usuario_username',
            'acao',
            'descricao',
            'valor_anterior',
            'valor_novo',
            'criado_em'
        )