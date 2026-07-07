from django.contrib import admin
from .models import Incident    

@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'titulo',
        'tipo_incidente',
        'criticidade',
        'status',
        'usuario_reportante',
        'analista_responsavel',
        'data_abertura',
    )

    list_filter = (
        'status',
        'tipo_incidente',
        'criticidade',
        'envolve_dados_sensiveis',
        'data_abertura',
    )

    search_fields = (
        'titulo',
        'descricao',
        'usuario_reportante__username',
        'analista_responsavel__username',
    )

    readonly_fields = (
        'data_abertura',
        'data_atualizacao',
        'data_fechamento',
    )