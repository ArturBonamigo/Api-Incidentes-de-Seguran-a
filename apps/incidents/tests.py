from datetime import datetime

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Incident


class IncidentFiltersTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        User = get_user_model()

        cls.usuario_a = User.objects.create_user(
            username='usuario_a',
            password='senha-teste',
            perfil=User.Perfil.USUARIO_COMUM,
        )
        cls.usuario_b = User.objects.create_user(
            username='usuario_b',
            password='senha-teste',
            perfil=User.Perfil.USUARIO_COMUM,
        )

        cls.incidente_sensivel = Incident.objects.create(
            titulo='Phishing no e-mail corporativo',
            descricao='Mensagem suspeita recebida.',
            tipo_incidente=Incident.TipoIncidente.PHISHING,
            impacto=3,
            urgencia=2,
            envolve_dados_sensiveis=True,
            status=Incident.Status.ABERTO,
            usuario_reportante=cls.usuario_a,
        )

        cls.incidente_nao_sensivel = Incident.objects.create(
            titulo='Falha em sistema interno',
            descricao='Sistema indisponivel.',
            tipo_incidente=Incident.TipoIncidente.FALHA_SISTEMA,
            impacto=1,
            urgencia=1,
            envolve_dados_sensiveis=False,
            status=Incident.Status.RESOLVIDO,
            usuario_reportante=cls.usuario_a,
        )

        cls.incidente_outro_usuario = Incident.objects.create(
            titulo='Malware detectado',
            descricao='Arquivo malicioso.',
            tipo_incidente=Incident.TipoIncidente.MALWARE,
            impacto=4,
            urgencia=4,
            envolve_dados_sensiveis=True,
            status=Incident.Status.EM_TRIAGEM,
            usuario_reportante=cls.usuario_b,
        )

        Incident.objects.filter(pk=cls.incidente_sensivel.pk).update(
            data_abertura=timezone.make_aware(datetime(2026, 7, 1, 10, 0))
        )
        Incident.objects.filter(pk=cls.incidente_nao_sensivel.pk).update(
            data_abertura=timezone.make_aware(datetime(2026, 7, 10, 10, 0))
        )

    def test_filtra_por_dados_sensiveis_true(self):
        self.client.force_authenticate(user=self.usuario_a)

        response = self.client.get(
            '/api/incidentes/',
            {'envolve_dados_sensiveis': 'true'},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        ids_retornados = {item['id'] for item in response.data}

        self.assertEqual(ids_retornados, {self.incidente_sensivel.id})

    def test_rejeita_valor_invalido_para_dados_sensiveis(self):
        self.client.force_authenticate(user=self.usuario_a)

        response = self.client.get(
            '/api/incidentes/',
            {'envolve_dados_sensiveis': 'talvez'},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('envolve_dados_sensiveis', response.data)

    def test_usuario_comum_ve_apenas_os_proprios_incidentes(self):
        self.client.force_authenticate(user=self.usuario_a)

        response = self.client.get('/api/incidentes/')

        ids_retornados = {item['id'] for item in response.data}

        self.assertEqual(
            ids_retornados,
            {self.incidente_sensivel.id, self.incidente_nao_sensivel.id},
        )

    def test_filtra_por_data_fim(self):
        self.client.force_authenticate(user=self.usuario_a)

        response = self.client.get(
            '/api/incidentes/',
            {'data_abertura_fim': '2026-07-01'},
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        ids_retornados = {item['id'] for item in response.data}

        self.assertEqual(ids_retornados, {self.incidente_sensivel.id})

    def test_rejeita_data_fim_menor_que_data_inicio(self):
        self.client.force_authenticate(user=self.usuario_a)

        response = self.client.get(
            '/api/incidentes/',
            {
                'data_abertura_inicio': '2026-07-10',
                'data_abertura_fim': '2026-07-01',
            },
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('data_abertura_fim', response.data)