from django.contrib import admin
from .models import IncidentTimeline

@admin.register(IncidentTimeline)
class IncidentTimelineAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'incidente',
        'usuario',
        'acao',
        'valor_anterior',
        'valor_novo',
        'criado_em',
    )

    list_filter = (
        'usuario',
        'acao',
        'criado_em',
    )

    search_fields = (
        'incidente__titulo',
        'usuario__username',
        'descricao',
    )

    readonly_fields = (
        'incidente',
        'usuario',
        'acao',
        'descricao',
        'valor_anterior',
        'valor_novo',
        'criado_em',
    )