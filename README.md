# sistema

Aplicação web para importação, tratamento e análise de planilhas de investimentos, com geração de relatórios executivos, auditoria analítica e exportações controladas.

## Visão geral

O projeto foi estruturado em duas camadas:

- Frontend: interface, filtros, modais, visualização dos indicadores e impressão do PDF.
- Backend: upload da planilha, mapeamento de colunas, normalização, regras de negócio, auditoria de qualidade, duplicidades e exportações Word/Excel.

Essa divisão reduz a exposição da lógica principal no navegador e mantém a operação do sistema mais próxima de um ambiente real de produção.

## Principais funcionalidades

- Importação de planilhas `.xlsx`, `.xls` e `.csv`
- Mapeamento manual ou automático de colunas
- Normalização de municípios, territórios, status e valores
- Classificação analítica dos registros
- Filtros por município, território, órgão, status e busca textual
- Visão executiva com indicadores e tabela geral
- Visão analista com auditoria de qualidade e duplicidades
- Geração de resumo para WhatsApp
- Exportação de planilha tratada em Excel
- Geração de relatório Word a partir de template
- Geração de PDF pela visualização da interface

## Estrutura do projeto

- [main.html](main.html): estrutura da interface
- [styles.css](styles.css): estilos complementares
- [tailwind.css](tailwind.css): CSS utilitário gerado localmente
- [app.js](app.js): cliente frontend e bindings da interface
- [word-export.js](word-export.js): integração do botão de exportação Word
- [server.js](server.js): servidor HTTP da aplicação
- [src/server/intelligence-service.js](src/server/intelligence-service.js): processamento central, regras e exportações
- [src/server/security.js](src/server/security.js): hardening, CORS, rate limit e proteção da API
- [SECURITY.md](SECURITY.md): arquitetura de segurança e limitações conhecidas

## Requisitos

- Node.js 20 ou superior
- npm
- Navegador moderno

## Instalação

No diretório do projeto, execute:

```powershell
npm install
```

## Configuração de ambiente

O projeto aceita configuração por arquivo `.env`.

1. Crie um arquivo `.env` na raiz do projeto.
2. Use [\.env.example](.env.example) como base.

Exemplo:

```env
PORT=3000
NODE_ENV=development
APP_BASE_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000
APP_ACCESS_TOKEN=
SESSION_TTL_MINUTES=30
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=120
MAX_UPLOAD_MB=12
```

### Sobre o token de acesso

- Se `APP_ACCESS_TOKEN` estiver vazio, o uso local funciona sem autenticação.
- Se `APP_ACCESS_TOKEN` estiver preenchido, a aplicação solicitará o token ao acionar a API.

## Como rodar

### Desenvolvimento

```powershell
npm run dev
```

Depois abra:

```text
http://localhost:3000
```

### Produção local

```powershell
npm start
```

Esse comando executa o build e sobe o servidor em modo de produção.

## Publicação no Render

O projeto já está preparado para deploy conservador no Render sem alteração de regra de negócio.

### Arquivos e comandos usados

- [render.yaml](render.yaml): definição do serviço web
- `npm run render:build`: instalação e build para o ambiente do Render
- `npm run render:start`: inicialização do servidor em produção sem rebuild duplicado

### Passos no Render

1. Envie o projeto para um repositório Git.
2. No Render, crie um `Web Service` conectado ao repositório.
3. O Render pode ler [render.yaml](render.yaml) automaticamente.
4. Se precisar preencher manualmente:

```text
Build Command: npm run render:build
Start Command: npm run render:start
Health Check Path: /api/health
```

### Variáveis de ambiente recomendadas no Render

```env
NODE_ENV=production
APP_BASE_URL=https://seu-app.onrender.com
ALLOWED_ORIGINS=https://seu-app.onrender.com
APP_ACCESS_TOKEN=defina-um-token-forte-se-quiser-proteger-a-api
SESSION_TTL_MINUTES=30
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=120
MAX_UPLOAD_MB=12
```

### Observações sobre o Render

- O plano gratuito pode colocar a aplicação para dormir após inatividade.
- A sessão da planilha fica em memória. Se a instância reiniciar, a base importada na sessão atual será perdida.
- Isso não quebra o sistema, mas limita persistência temporária de uso remoto.

## Fluxo de uso

1. Abra o sistema em `http://localhost:3000`.
2. Clique em `Importar Nova Planilha`.
3. Selecione o arquivo `.xlsx`, `.xls` ou `.csv`.
4. Revise o mapeamento automático das colunas.
5. Clique em `Processar Planilha`.
6. Use os filtros para refinar o recorte.
7. Gere as saídas necessárias:
   - `Planilha Tratada`
   - `Relatório Word`
   - `PDF Executivo`
   - `Resumo WhatsApp`

## Modos de uso

### Modo Executivo

Focado em leitura gerencial.

- KPIs principais
- visão por secretaria
- tabela geral do recorte atual
- saídas para PDF, Excel, Word e resumo

### Modo Analista

Focado em conferência dos dados.

- completude dos campos
- possíveis duplicidades
- tabela analítica com dados tratados
- auditoria por registro

## Comandos disponíveis

```powershell
npm run dev
npm run build:css
npm run build
npm start
npm run check
```

## Observações importantes

- Não abra [main.html](main.html) diretamente com `file://`.
- O sistema deve ser acessado pelo servidor local.
- O PDF depende da renderização no navegador e da função de impressão.
- A sessão da planilha é mantida em memória no backend e pode expirar conforme a configuração.

## Segurança e operação

Consulte [SECURITY.md](SECURITY.md) para detalhes sobre:

- separação frontend/backend
- gerenciamento de secrets
- autenticação opcional por token
- CORS, rate limiting e headers
- riscos e limitações conhecidas

## Solução de problemas

### O botão de importar ou processar não responde

- atualize a página com `Ctrl+F5`
- confirme que a aplicação foi aberta em `http://localhost:3000`
- confirme que `npm run dev` está em execução

### A porta 3000 já está em uso

Altere `PORT` no `.env` e ajuste `APP_BASE_URL` para a mesma porta.

### O sistema pede token

Verifique se `APP_ACCESS_TOKEN` foi definido no `.env` do servidor.

## Licença

O uso deste projeto está sujeito aos termos definidos em [LICENSE](LICENSE).
