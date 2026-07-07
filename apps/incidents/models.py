from django.db import models
from django.conf import settings

# Criar modelo de incidente

class Incident(models.Model):
    class TipoIncidente(models.TextChoices):
        PHISHING = 'PHISHING', 'Phishing'
        MALWARE = 'MALWARE', 'Malware'
        ACESSO_INDEVIDO = 'ACESSO_INDEVIDO', 'Acesso indevido'
        VAZAMENTO_DADOS = 'VAZAMENTO_DADOS', 'Vazamento de dados'
        FALHA_SISTEMA = 'FALHA_SISTEMA', 'Falha de sistema'
        COMPORTAMENTO_SUSPEITO = 'COMPORTAMENTO_SUSPEITO', 'Comportamento suspeito'
        OUTRO = 'OUTRO', 'Outro'

    class Status(models.TextChoices):
        ABERTO = 'ABERTO', 'Aberto'
        EM_TRIAGEM = 'EM_TRIAGEM', 'Em triagem'
        EM_INVESTIGACAO = 'EM_INVESTIGACAO', 'Em investigação'
        CONTIDO = 'CONTIDO', 'Contido'
        RESOLVIDO = 'RESOLVIDO', 'Resolvido'
        FALSO_POSITIVO = 'FALSO_POSITIVO', 'Falso positivo'
        CANCELADO = 'CANCELADO', 'Cancelado'

    class Criticidade(models.TextChoices):
        BAIXA = 'BAIXA', 'Baixa'
        MEDIA = 'MEDIA', 'Média'
        ALTA = 'ALTA', 'Alta'
        CRITICA = 'CRITICA', 'Crítica'

    titulo = models.CharField(max_length=150)
    descricao = models.TextField()
    tipo_incidente = models.CharField(
        max_length=30,
        choices=TipoIncidente.choices,
        default=TipoIncidente.OUTRO,
    )

    criticidade = models.CharField(
        max_length=10,
        choices=Criticidade.choices,
        default=Criticidade.BAIXA,
    )

    impacto = models.PositiveSmallIntegerField()
    urgencia = models.PositiveSmallIntegerField()
    envolve_dados_sensiveis = models.BooleanField(default=False)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ABERTO,
    )

    usuario_reportante = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='incidentes_reportados',
    )
    
    analista_responsavel = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='incidentes_assumidos',
        null=True,
        blank=True,
    )

    data_abertura = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)
    data_fechamento = models.DateTimeField(null=True, blank=True)
    observacoes_finais = models.TextField(blank=True)

    def calcular_criticidade(self):
        pontuacao = self.impacto + self.urgencia

        if self.envolve_dados_sensiveis:
            pontuacao += 2

        if pontuacao <= 3:
            return self.Criticidade.BAIXA
        if pontuacao <= 6:
            return self.Criticidade.MEDIA
        if pontuacao <= 9:
            return self.Criticidade.ALTA
        return self.Criticidade.CRITICA

    def save(self, *args, **kwargs):
        self.criticidade = self.calcular_criticidade()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.titulo
