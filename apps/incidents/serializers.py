from rest_framework import serializers

from .models import Incident


class IncidentSerializer(serializers.ModelSerializer):
    USER_RESTRICTED_FIELDS = {
        'status',
        'analista_responsavel',
        'criticidade',
        'data_fechamento',
        'observacoes_finais',
    }

    class Meta:
        model = Incident
        fields = (
            'id',
            'titulo',
            'descricao',
            'tipo_incidente',
            'criticidade',
            'impacto',
            'urgencia',
            'envolve_dados_sensiveis',
            'status',
            'usuario_reportante',
            'analista_responsavel',
            'data_abertura',
            'data_atualizacao',
            'data_fechamento',
            'observacoes_finais',
        )
        read_only_fields = (
            'id',
            'criticidade',
            'usuario_reportante',
            'analista_responsavel',
            'data_abertura',
            'data_atualizacao',
            'data_fechamento',
        )

    def validate_impacto(self, value):
        if value not in range(1, 6):
            raise serializers.ValidationError(
                "O impacto deve ser um valor entre 1 e 5."
            )
        return value

    def validate_urgencia(self, value):
        if value not in range(1, 6):
            raise serializers.ValidationError(
                "A urgencia deve ser um valor entre 1 e 5."
            )
        return value

    def validate(self, attrs):
        request = self.context.get('request')

        if not request or not request.user.is_authenticated:
            return attrs

        if request.user.perfil == 'USUARIO_COMUM':
            blocked_fields = self.USER_RESTRICTED_FIELDS.intersection(attrs.keys())

            if blocked_fields:
                raise serializers.ValidationError({
                    field: "Usuario comum nao pode alterar este campo."
                    for field in blocked_fields
                })

        return attrs
