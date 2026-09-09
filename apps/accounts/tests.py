from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase


class UserAdminTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        User = get_user_model()
        cls.admin = User.objects.create_user(
            username='admin',
            password='senha-teste',
            perfil=User.Perfil.ADMIN,
        )
        cls.usuario_comum = User.objects.create_user(
            username='usuario_comum',
            password='senha-teste',
            perfil=User.Perfil.USUARIO_COMUM,
        )

    def test_admin_pode_criar_funcionario(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            '/api/users/',
            {
                'username': 'analista_novo',
                'email': 'analista@example.com',
                'first_name': 'Analista',
                'last_name': 'SOC',
                'perfil': 'ANALISTA_SOC',
                'is_active': True,
                'password': 'Senha-Forte-123',
                'password_confirm': 'Senha-Forte-123',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['perfil'], 'ANALISTA_SOC')
        self.assertNotIn('password', response.data)

    def test_usuario_comum_nao_pode_criar_funcionario(self):
        self.client.force_authenticate(user=self.usuario_comum)

        response = self.client.post(
            '/api/users/',
            {
                'username': 'gestor_novo',
                'perfil': 'GESTOR',
                'password': 'Senha-Forte-123',
                'password_confirm': 'Senha-Forte-123',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_nao_cria_usuario_comum_por_rota_de_funcionario(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            '/api/users/',
            {
                'username': 'usuario_novo',
                'perfil': 'USUARIO_COMUM',
                'password': 'Senha-Forte-123',
                'password_confirm': 'Senha-Forte-123',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('perfil', response.data)

    def test_admin_nao_desativa_propria_conta(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.patch(
            f'/api/users/{self.admin.id}/',
            {'is_active': False},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('is_active', response.data)

    def test_admin_nao_remove_proprio_perfil_admin(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.patch(
            f'/api/users/{self.admin.id}/',
            {'perfil': 'GESTOR'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('perfil', response.data)
