# Frontend - Gestao de Incidentes

Aplicacao React + TypeScript para consumir a API Django/DRF deste projeto.

## Como rodar

```bash
cd frontend
npm install
npm run dev
```

O proxy de desenvolvimento encaminha `/api` para `http://127.0.0.1:8000`.
Para configuração completa, funcionalidades e validação com dados descartáveis,
consulte o [README do projeto](../README.md).

## Verificação

```bash
npm run build
```

O build valida os tipos TypeScript e gera a versão de produção. Use `npm run format`
para formatar o código com Prettier.

## Estrutura

- `src/api`: funcoes que fazem requisicoes HTTP para a API.
- `src/auth`: estado de autenticacao, login, logout e protecao de rotas.
- `src/components`: componentes reutilizaveis.
- `src/features`: telas e componentes por funcionalidade.
- `src/types`: contratos TypeScript alinhados aos serializers do backend.
- `src/utils`: formatadores e funcoes auxiliares.
