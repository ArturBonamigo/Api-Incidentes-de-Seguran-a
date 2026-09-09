from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.audit.models import IncidentTimeline
from apps.incidents.models import Incident


class DashboardWorkflowTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        User = get_user_model()
        cls.analyst = User.objects.create_user(username='analyst', perfil='ANALISTA_SOC')
        cls.reporter = User.objects.create_user(username='reporter', perfil='USUARIO_COMUM')
        cls.other = User.objects.create_user(username='other', perfil='USUARIO_COMUM')
        cls.critical = Incident.objects.create(titulo='Critical', descricao='Evidence',
            impacto=5, urgencia=5, usuario_reportante=cls.reporter)
        cls.closed = Incident.objects.create(titulo='Closed', descricao='Resolved',
            impacto=5, urgencia=5, status='RESOLVIDO', usuario_reportante=cls.reporter)
        cls.assigned = Incident.objects.create(titulo='Assigned', descricao='Investigating',
            impacto=2, urgencia=2, analista_responsavel=cls.analyst, usuario_reportante=cls.other)

    def setUp(self):
        self.client.force_authenticate(self.analyst)

    def test_stats_group_counts_and_active_critical_exclude_closed(self):
        data = self.client.get('/api/incidentes/estatisticas/').data
        self.assertEqual(data['total'], 3)
        self.assertEqual(data['por_status']['ABERTO'], 2)
        self.assertEqual(data['por_criticidade']['CRITICA'], 2)
        self.assertEqual(data['criticos_ativos'], 1)
        self.assertEqual(data['ativos_nao_atribuidos'], 1)
        self.assertEqual([i['id'] for i in data['prioritarios']], [self.critical.id, self.assigned.id])

    def test_stats_respect_reporter_visibility(self):
        self.client.force_authenticate(self.reporter)
        data = self.client.get('/api/incidentes/estatisticas/').data
        self.assertEqual(data['total'], 2)
        self.assertEqual([i['id'] for i in data['prioritarios']], [self.critical.id])
        self.assertEqual(sum(d['total'] for d in data['atividade']), 2)

    def test_activity_has_fourteen_days_and_counts_only_window(self):
        Incident.objects.filter(pk=self.closed.pk).update(data_abertura=timezone.now() - timedelta(days=20))
        data = self.client.get('/api/incidentes/estatisticas/').data
        self.assertEqual(len(data['atividade']), 14)
        self.assertEqual(data['atividade'][0]['total'], 0)
        self.assertEqual(sum(day['total'] for day in data['atividade']), 2)
        self.assertEqual(data['total'], 3)

    def test_queues_filter_active_assignments(self):
        for queue, ids in [('meus', [self.assigned.id]), ('nao_atribuidos', [self.critical.id])]:
            data = self.client.get('/api/incidentes/', {'fila': queue}).data
            self.assertEqual([i['id'] for i in data['results']], ids)
        self.assertEqual(self.client.get('/api/incidentes/', {'fila': 'ativos'}).data['count'], 2)

    def test_invalid_queue_and_calendar_dates_return_400(self):
        for filters in [{'fila': 'invalid'}, {'data_abertura_inicio': '2026-02-30'}, {'data_abertura_fim': '2026-13-01'}]:
            self.assertEqual(self.client.get('/api/incidentes/', filters).status_code, 400)

    def test_empty_start_date_does_not_break_end_date_filter(self):
        response = self.client.get('/api/incidentes/', {'data_abertura_inicio': '',
            'data_abertura_fim': timezone.localdate().isoformat()})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 3)

    def test_assign_does_not_overwrite_an_existing_owner(self):
        url = f'/api/incidentes/{self.critical.id}/assumir/'
        self.assertEqual(self.client.post(url).status_code, 200)
        self.assertEqual(self.client.post(url).status_code, 400)
        self.critical.refresh_from_db()
        self.assertEqual(self.critical.analista_responsavel, self.analyst)
        self.assertEqual(IncidentTimeline.objects.filter(incidente=self.critical, acao='ANALISTA_ATRIBUIDO').count(), 1)

    def test_close_and_reopen_updates_timestamp_and_timeline(self):
        url = f'/api/incidentes/{self.critical.id}/alterar-status/'
        response = self.client.post(url, {'status': 'RESOLVIDO'})
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(response.data['data_fechamento'])
        closed_at = response.data['data_fechamento']
        self.assertEqual(self.client.post(url, {'status': 'RESOLVIDO'}).data['data_fechamento'], closed_at)
        self.assertEqual(IncidentTimeline.objects.filter(incidente=self.critical).count(), 1)
        self.assertIsNone(self.client.post(url, {'status': 'EM_INVESTIGACAO'}).data['data_fechamento'])
        self.assertEqual(IncidentTimeline.objects.filter(incidente=self.critical).count(), 2)

    def test_patch_status_also_records_timeline(self):
        response = self.client.patch(f'/api/incidentes/{self.critical.id}/', {'status': 'RESOLVIDO'})
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(response.data['data_fechamento'])
        self.assertTrue(IncidentTimeline.objects.filter(incidente=self.critical, acao='STATUS_ALTERADO').exists())

    def test_filter_statistics_and_user_names(self):
        data = self.client.get('/api/incidentes/estatisticas/', {'fila': 'meus'}).data
        self.assertEqual(data['total'], 1)
        self.assertEqual(data['recentes'][0]['analista_nome'], 'analyst')
        self.assertEqual(data['recentes'][0]['reportante_nome'], 'other')

    def test_reporter_cannot_close_and_auditor_cannot_mutate(self):
        self.client.force_authenticate(self.reporter)
        self.assertEqual(self.client.post(f'/api/incidentes/{self.critical.id}/alterar-status/', {'status': 'RESOLVIDO'}).status_code, 403)
        auditor = get_user_model().objects.create_user(username='audit', perfil='AUDITOR')
        self.client.force_authenticate(auditor)
        self.assertEqual(self.client.patch(f'/api/incidentes/{self.critical.id}/', {'status': 'RESOLVIDO'}).status_code, 403)
