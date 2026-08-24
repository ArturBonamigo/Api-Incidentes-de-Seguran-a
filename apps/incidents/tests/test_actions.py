from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.audit.models import IncidentTimeline
from apps.incidents.models import Incident


class IncidentActionsAndPermissionsTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        User = get_user_model()
        cls.usuario_comum = User.objects.create_user(
            username='usuario_comum', password='senha-teste', perfil=User.Perfil.USUARIO_COMUM
        )
        cls.outro_usuario = User.objects.create_user(
            username='outro_usuario', password='senha-teste', perfil=User.Perfil.USUARIO_COMUM
        )
        cls.analista = User.objects.create_user(
            username='analista', password='senha-teste', perfil=User.Perfil.ANALISTA_SOC
        )
        cls.gestor = User.objects.create_user(
            username='gestor', password='senha-teste', perfil=User.Perfil.GESTOR
        )
        cls.auditor = User.objects.create_user(
            username='auditor', password='senha-teste', perfil=User.Perfil.AUDITOR
        )
        cls.incidente = Incident.objects.create(
            titulo='Acesso suspeito',
            descricao='Tentativas de login fora do horario.',
            tipo_incidente=Incident.TipoIncidente.ACESSO_INDEVIDO,
            impacto=3,
            urgencia=3,
            usuario_reportante=cls.usuario_comum,
        )

    def test_usuario_comum_nao_acessa_incidente_de_outro_usuario(self):
        self.client.force_authenticate(user=self.outro_usuario)
        response = self.client.get(f'/api/incidentes/{self.incidente.id}/')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_auditor_pode_listar_incidentes_mas_nao_criar(self):
        self.client.force_authenticate(user=self.auditor)
        response = self.client.get('/api/incidentes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

        response = self.client.post('/api/incidentes/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_analista_pode_assumir_incidente_e_registra_timeline(self):
        self.client.force_authenticate(user=self.analista)
        response = self.client.post(f'/api/incidentes/{self.incidente.id}/assumir/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.incidente.refresh_from_db()
        self.assertEqual(self.incidente.analista_responsavel, self.analista)
        self.assertTrue(
            IncidentTimeline.objects.filter(
                incidente=self.incidente,
                usuario=self.analista,
                acao=IncidentTimeline.Acao.ANALISTA_ATRIBUIDO,
            ).exists()
        )

    def test_usuario_comum_nao_pode_assumir_incidente(self):
        self.client.force_authenticate(user=self.usuario_comum)
        response = self.client.post(f'/api/incidentes/{self.incidente.id}/assumir/')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_nao_permite_assumir_incidente_ja_atribuido(self):
        self.incidente.analista_responsavel = self.analista
        self.incidente.save()
        self.client.force_authenticate(user=self.analista)

        response = self.client.post(f'/api/incidentes/{self.incidente.id}/assumir/')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_gestor_pode_alterar_status_e_registra_timeline(self):
        self.client.force_authenticate(user=self.gestor)
        response = self.client.post(
            f'/api/incidentes/{self.incidente.id}/alterar-status/',
            {'status': Incident.Status.EM_TRIAGEM},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.incidente.refresh_from_db()
        self.assertEqual(self.incidente.status, Incident.Status.EM_TRIAGEM)
        self.assertTrue(
            IncidentTimeline.objects.filter(
                incidente=self.incidente,
                usuario=self.gestor,
                acao=IncidentTimeline.Acao.STATUS_ALTERADO,
                valor_anterior=Incident.Status.ABERTO,
                valor_novo=Incident.Status.EM_TRIAGEM,
            ).exists()
        )

    def test_usuario_comum_nao_pode_alterar_status(self):
        self.client.force_authenticate(user=self.usuario_comum)
        response = self.client.post(
            f'/api/incidentes/{self.incidente.id}/alterar-status/',
            {'status': Incident.Status.RESOLVIDO},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_rejeita_status_invalido(self):
        self.client.force_authenticate(user=self.analista)
        response = self.client.post(
            f'/api/incidentes/{self.incidente.id}/alterar-status/',
            {'status': 'FINALIZADO'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('status', response.data)
