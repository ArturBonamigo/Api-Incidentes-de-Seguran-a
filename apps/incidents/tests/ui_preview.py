"""Local UI verification with disposable synthetic data. Never uses the project DB.

Run: venv/Scripts/python.exe -m apps.incidents.tests.ui_preview
"""
import os
import secrets
import tempfile
from datetime import timedelta
from pathlib import Path


def main():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'incidentes.settings')
    import django
    from django.conf import settings
    from django.core.management import call_command

    with tempfile.TemporaryDirectory(prefix='sentinel-ui-') as directory:
        settings.DATABASES['default']['NAME'] = str(Path(directory) / 'preview.sqlite3')
        settings.SECRET_KEY = secrets.token_urlsafe(48)
        django.setup()
        call_command('migrate', verbosity=0)
        from django.contrib.auth import get_user_model
        from django.utils import timezone
        from apps.incidents.models import Incident
        from apps.audit.models import IncidentTimeline
        password = secrets.token_urlsafe(18)
        analyst = get_user_model().objects.create_user(username='analista.preview',
            password=password, perfil='ADMIN', first_name='Marina', last_name='Costa')
        titles = [
            ('Tentativa de phishing no e-mail corporativo', 'PHISHING'),
            ('Acesso não autorizado ao servidor de produção', 'ACESSO_INDEVIDO'),
            ('Arquivo suspeito identificado em estação', 'MALWARE'),
            ('Exposição de dados em compartilhamento', 'VAZAMENTO_DADOS'),
            ('Indisponibilidade no serviço de autenticação', 'FALHA_SISTEMA'),
            ('Comportamento anômalo em conta de serviço', 'COMPORTAMENTO_SUSPEITO'),
        ]
        statuses = ['ABERTO', 'EM_TRIAGEM', 'EM_INVESTIGACAO', 'CONTIDO', 'RESOLVIDO', 'FALSO_POSITIVO']
        for index in range(27):
            title, category = titles[index % len(titles)]
            item = Incident.objects.create(titulo=title, tipo_incidente=category,
                descricao='Registro sintético para validação da interface.\nA equipe deve avaliar o contexto e documentar os próximos passos.',
                impacto=index % 5 + 1, urgencia=(index + 2) % 5 + 1,
                envolve_dados_sensiveis=index % 3 == 0,
                status=statuses[index % 6], usuario_reportante=analyst,
                analista_responsavel=analyst if index % 3 else None)
            Incident.objects.filter(pk=item.pk).update(data_abertura=timezone.now() - timedelta(days=index % 14))
            IncidentTimeline.objects.create(incidente=item, usuario=analyst,
                acao='INCIDENTE_CRIADO', descricao='Incidente sintético criado para validação.')
        print(f'PREVIEW ONLY — user: analista.preview | password: {password}', flush=True)
        print('Temporary database. Stop with Ctrl+C after verification.', flush=True)
        try:
            call_command('runserver', '127.0.0.1:8000', use_reloader=False)
        finally:
            from django.db import connections
            connections.close_all()


if __name__ == '__main__':
    main()
