# Security Architecture

## Visão geral

O projeto `sistema` foi reestruturado para reduzir a exposição de lógica proprietária no navegador.

- Frontend: interface, interação do usuário, envio de arquivo, filtros visuais, renderização do dashboard e impressão do PDF.
- Backend: leitura de planilha, mapeamento de colunas, normalização, classificação, priorização, filtros efetivos, auditoria de qualidade, detecção de duplicidades e geração de exportações Word/Excel.

## O que fica no frontend

- Componentes visuais e eventos da página.
- Abertura de modais, navegação entre modos e atualização dos elementos do dashboard.
- Impressão do PDF já renderizado na interface.
- Download dos arquivos retornados pela API.

## O que fica no backend

- Processamento da planilha importada.
- Normalização de municípios, territórios, status e valores.
- Regras de classificação por área.
- Cálculo de prioridade.
- Filtros aplicados ao conjunto de dados.
- Auditoria de qualidade e detecção de duplicidades.
- Geração do resumo para WhatsApp.
- Geração do Word a partir do template e da planilha tratada em Excel.

## Secrets e variáveis de ambiente

- Nunca armazene segredos em arquivos JavaScript do frontend.
- Use `.env` apenas no servidor.
- Existe um `.env.example` com os nomes esperados.
- O `.env` está excluído do Git via `.gitignore`.
- Se alguma credencial já tiver sido exposta em histórico Git, remova do código atual, revogue a credencial e gere uma nova antes de considerar o incidente encerrado.

## Autenticação e autorização

- A API aceita um token opcional definido por `APP_ACCESS_TOKEN`.
- Quando o token estiver configurado, todas as rotas `/api/` exigem o header `X-App-Access-Token`.
- Em ambiente local, o token pode ficar vazio para simplificar o uso.

## Hardening aplicado

- `helmet` para headers de segurança.
- CSP restritiva compatível com os CDNs atuais usados pelo frontend.
- Rate limiting nas rotas da API.
- CORS restrito à própria origem da aplicação e às origens explicitamente permitidas.
- Tratamento sanitizado de erros, sem stack trace em produção.
- Expiração automática das sessões de planilha mantidas em memória.
- Build de produção minificado, sem source maps públicos.

## Produção

- Execute `npm run build` para gerar os arquivos minificados em `build/`.
- Execute `npm start` para servir a aplicação em modo de produção.
- Defina `APP_ACCESS_TOKEN` em produção quando a aplicação não estiver em ambiente totalmente controlado.
- Restrinja `ALLOWED_ORIGINS` ao domínio oficial.
- Não exponha logs com payloads de planilhas ou credenciais.

## Riscos conhecidos

- O PDF continua sendo renderizado no frontend porque depende do layout visual e da impressão do navegador.
- Usuários autorizados com acesso ao repositório ainda conseguem ler a lógica do backend; esta proteção reduz exposição ao cliente, não substitui governança de acesso ao código.
- Como o projeto usa CDNs no HTML, a política CSP precisa continuar alinhada a essas dependências.

## Limitações

- Não existe DRM confiável para impedir cópia por quem já recebeu os dados finais.
- Minificação ajuda a dificultar leitura casual, mas não substitui a remoção de lógica sensível do navegador.
- Para proteção forte em cenários multiusuário, o próximo passo natural é autenticação de usuários, trilha de auditoria e segregação por perfil.
