from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.audit.models import IncidentTimeline
from apps.incidents.models import Incident, IncidentComment


class IncidentCommentsTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        User = get_user_model()
        cls.reportante = User.objects.create_user(
            username='reportante', password='senha-teste', perfil=User.Perfil.USUARIO_COMUM
        )
        cls.outro_usuario = User.objects.create_user(
            username='outro_usuario', password='senha-teste', perfil=User.Perfil.USUARIO_COMUM
        )
        cls.analista = User.objects.create_user(
            username='analista', password='senha-teste', perfil=User.Perfil.ANALISTA_SOC
        )
        cls.auditor = User.objects.create_user(
            username='auditor', password='senha-teste', perfil=User.Perfil.AUDITOR
        )
        cls.incidente = Incident.objects.create(
            titulo='Arquivo suspeito',
            descricao='Arquivo recebido por e-mail.',
            tipo_incidente=Incident.TipoIncidente.MALWARE,
            impacto=3,
            urgencia=4,
            usuario_reportante=cls.reportante,
        )

    def comentarios_url(self):
        return f'/api/incidentes/{self.incidente.id}/comentarios/'

    def test_reportante_pode_adicionar_comentario_e_registra_timeline(self):
        self.client.force_authenticate(user=self.reportante)
        response = self.client.post(
            self.comentarios_url(),
            {'comentario': 'Equipamento isolado para analise.'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(IncidentComment.objects.filter(incidente=self.incidente).count(), 1)
        self.assertEqual(response.data['usuario_username'], self.reportante.username)
        self.assertTrue(
            IncidentTimeline.objects.filter(
                incidente=self.incidente,
                usuario=self.reportante,
                acao=IncidentTimeline.Acao.COMENTARIO_ADICIONADO,
            ).exists()
        )

    def test_outro_usuario_comum_nao_pode_listar_comentarios(self):
        self.client.force_authenticate(user=self.outro_usuario)
        response = self.client.get(self.comentarios_url())

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_auditor_pode_listar_mas_nao_adicionar_comentario(self):
        IncidentComment.objects.create(
            incidente=self.incidente,
            usuario=self.reportante,
            comentario='Comentario existente.',
        )
        self.client.force_authenticate(user=self.auditor)

        response = self.client.get(self.comentarios_url())
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(len(response.data['results']), 1)

        response = self.client.post(
            self.comentarios_url(),
            {'comentario': 'Tentativa de comentario.'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_analista_pode_adicionar_comentario(self):
        self.client.force_authenticate(user=self.analista)
        response = self.client.post(
            self.comentarios_url(),
            {'comentario': 'Analise iniciada pelo SOC.'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['usuario_username'], self.analista.username)
