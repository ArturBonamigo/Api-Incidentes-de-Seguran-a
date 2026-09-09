# Sentinel — Gestão de incidentes de segurança

API Django REST Framework com interface React/TypeScript para registrar, investigar e acompanhar incidentes. Acesso por perfil, autenticação JWT e histórico de ações.

## Executar localmente

Requer Python compatível com Django 6 e Node.js compatível com Vite 7. No Windows, com o ambiente virtual do projeto:

```powershell
venv/Scripts/python.exe -m pip install -r requirements.txt
venv/Scripts/python.exe manage.py migrate
venv/Scripts/python.exe manage.py runserver 127.0.0.1:8000
```

Em outro terminal:

```powershell
cd frontend
npm ci
npm run dev -- --host 127.0.0.1
```

Abra http://127.0.0.1:5173. O Vite encaminha `/api` para a porta 8000. O cadastro público cria usuários comuns; perfis operacionais são administrados pela equipe autorizada.

## Funcionalidades

- Visão geral com indicadores reais, atividade diária dos últimos 14 dias, distribuição por criticidade e fila de prioridades.
- Lista paginada e quadro por etapa. O quadro representa os registros da página atual, com contagem e navegação explícitas.
- Busca global e filtros por status, criticidade, tipo, dados sensíveis e intervalo de abertura. Filtros e visualização ficam na URL, inclusive ao voltar/avançar no navegador.
- Filas de incidentes ativos, atribuídos ao usuário e sem responsável. As filas operacionais excluem resolvidos, falsos positivos e cancelados.
- CSV de todos os resultados filtrados, com UTF-8, separador `;`, escape de aspas e neutralização de células iniciadas por fórmulas.
- Registro com prévia da criticidade, calculada pela mesma regra da API: impacto + urgência + 2 quando há dados sensíveis; baixa até 3, média até 6, alta até 9, crítica acima de 9.
- Atribuição, mudanças de status, notas da investigação e histórico completo, incluindo páginas adicionais da API.
- Data de fechamento ao encerrar; reabertura limpa essa data. Repetir o mesmo status não duplica o histórico. Alterações de status por PATCH também são auditadas.
- Layout responsivo, menu móvel, estados vazios, mensagens de erro, foco de teclado e respeito à preferência por movimento reduzido.

Os indicadores respeitam os registros visíveis ao perfil. A atividade e os filtros de data usam UTC (fuso configurado no backend); datas individuais são exibidas no fuso local do navegador. A taxa de encerramento inclui resolvidos, falsos positivos e cancelados. Não há telemetria de endpoints ou geolocalização: o painel usa apenas informações existentes na API.

Registros encerrados antes desta implementação podem continuar sem data de fechamento; não é possível inferir retroativamente uma data confiável. Nenhuma migração de dados históricos é executada.

## Validação

```powershell
venv/Scripts/python.exe manage.py test --noinput
cd frontend
npm run build
```

Para testar a interface sem alterar `db.sqlite3`, pare a API normal e execute, na raiz:

```powershell
venv/Scripts/python.exe -m apps.incidents.tests.ui_preview
```

Esse utilitário cria um banco temporário com 27 incidentes sintéticos e uma conta `analista.preview`. A senha aleatória aparece no terminal. Usa a porta local 8000, não altera o banco do projeto e remove o banco temporário quando é encerrado normalmente. É exclusivamente uma ferramenta de teste, não um modo de produção. Após validar, encerre com Ctrl+C e reinicie a API normal.

As configurações Django atuais são de desenvolvimento. A execução local não representa publicação em produção.
