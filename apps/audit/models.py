from django.db import models
from django.conf import settings

class IncidentTimeline(models.Model):
    class Acao(models.TextChoices):
        INCIDENTE_CRIADO = 'INCIDENTE_CRIADO', 'Incidente criado'
        STATUS_ALTERADO = 'STATUS_ALTERADO', 'Status alterado'
        ANALISTA_ATRIBUIDO = 'ANALISTA_ATRIBUIDO', 'Analista atribuído'
        CRITICIDADE_ALTERADA = 'CRITICIDADE_ALTERADA', 'Criticidade alterada'
        INCIDENTE_ENCERRADO = 'INCIDENTE_ENCERRADO', 'Incidente encerrado'
        INCIDENTE_CANCELADO = 'INCIDENTE_CANCELADO', 'Incidente cancelado'

    incidente = models.ForeignKey(
        'incidents.Incident',
        on_delete=models.CASCADE,
        related_name='timeline',
    )

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='eventos_timeline',
    )

    acao = models.CharField(
        max_length=30,
        choices=Acao.choices,
    )

    descricao = models.TextField()
    valor_anterior = models.CharField(max_length=255, blank=True)
    valor_novo = models.CharField(max_length=255, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-criado_em']

    def __str__(self):
        return f'{self.acao} - {self.incidente}'