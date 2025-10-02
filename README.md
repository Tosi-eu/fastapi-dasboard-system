# Quick Start 

Projeto **FastAPI + Prisma + PostgreSQL + React** com importação de CSVs.

O projeto consiste em um sistema de login e cadastro de usuários, tendo possibilidade visualizar um dashboard em formato tabular.

A estrutura do projeto dispõe de uma API com fastAPI, possuindo as rotas

- GET /login -> permite o usuário fazer login com autenticação JWT e e encoding de senha
- GET /metrics -> permite a obtenção, com paginação, das métricas disponibilizadas no metrics.csv e populadas no banco
- POST /register -> permite a criação de usuário a partir dos que existem na base, além de inserir no banco um novo registro com senha encriptada
- POST /populate?target=? -> permite a leitura e inserção dos dados dos CSV no banco de dados, com paralelismo.

Além disso, dispõe de um banco de dados postgres cointanerizado, onde serão feitas todas interações (GET, POST). O banco possui alguns triggers para impedir ações indevidas, como update de role e usuario padrão cadastrando com email de admin (considerando que o único admin serei eu)

O frontend é feito em React, com estilo simples utilizando tailwind css (bem duvidoso)

A execução do sistema se dará somente pelo docker compose. Ao executar serão criados o banco de dados e seus triggers, o backend e população do banco com a rota /populate, e por fim o frontend.

---

## Pré-requisitos 🛠️

- Clonar o repositório
- Docker
- Docker Compose

---

## Inicialização rápida ⚡

No diretório raiz do projeto, basta executar (e acompanhar os logs):

```bash
docker compose up --build
