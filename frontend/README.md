# Frontend - Gestao de Incidentes

Aplicacao React + TypeScript para consumir a API Django/DRF deste projeto.

## Como rodar

```bash
cd frontend
npm install
npm run dev
```

Crie um arquivo `.env` com base em `.env.example` se a API estiver em outra URL.

## Estrutura

- `src/api`: funcoes que fazem requisicoes HTTP para a API.
- `src/auth`: estado de autenticacao, login, logout e protecao de rotas.
- `src/components`: componentes reutilizaveis.
- `src/features`: telas e componentes por funcionalidade.
- `src/types`: contratos TypeScript alinhados aos serializers do backend.
- `src/utils`: formatadores e funcoes auxiliares.
