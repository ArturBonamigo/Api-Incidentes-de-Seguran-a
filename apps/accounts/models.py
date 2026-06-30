from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.

# Criar modelo de usuário
class User(AbstractUser):
    class Perfil(models.TextChoices):
        ADMIN = 'ADMIN', 'Administrador'
        USUARIO_COMUM = 'USUARIO_COMUM', 'Usuário Comum'
        ANALISTA_SOC = 'ANALISTA_SOC', 'Analista SOC'
        GESTOR = 'GESTOR', 'Gestor'
        AUDITOR = 'AUDITOR', 'Auditor'

    perfil = models.CharField(
        max_length=20,
        choices=Perfil.choices,
        default=Perfil.USUARIO_COMUM,
    )

    def __str__(self):
        return self.username


