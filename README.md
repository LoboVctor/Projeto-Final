# Projeto Final — Trainee FGV (Grupo 1)

Sistema de acompanhamento pedagógico para escolas, com controle de turmas, alunos,
educadores, registros diários, relatórios semestrais e agenda de eventos.

## Stack

| Camada | Tecnologia | Versão |
|---|---|---|
| Backend | NestJS | 11 |
| ORM | Prisma | 7 |
| Frontend | Angular | 21 |
| Runtime | Node.js | 22 LTS (recomendado) |
| Linguagem | TypeScript | 5.x |
| Testes | Vitest | 4.x |
| Estilos | Tailwind CSS | 4 |

## Estrutura do monorepo

```
Projeto-Final/
├── apps/
│   ├── api/                      # Backend NestJS
│   │   └── src/
│   │       ├── common/           # guards, decorators, filtros, interceptores
│   │       ├── config/           # configurações de ambiente
│   │       ├── prisma/           # PrismaService/PrismaModule
│   │       └── modulos/          # um diretório por domínio de negócio
│   │           └── <dominio>/
│   │               ├── <dominio>.module.ts
│   │               ├── <dominio>.controller.ts
│   │               ├── <dominio>.service.ts
│   │               ├── <dominio>.repository.ts
│   │               ├── interfaces/
│   │               │   └── I<Dominio>Repositorio.ts
│   │               └── dtos/
│   │
│   └── web/                      # Frontend Angular
│       └── projects/web/src/app/
│           ├── nucleo/           # guards, interceptors, serviços singleton
│           ├── compartilhado/    # componentes, pipes e diretivas reutilizáveis
│           └── funcionalidades/  # um diretório por domínio de negócio
│
└── infra/
    ├── prisma/                   # schema.prisma + seed
    ├── prisma.config.ts          # configuração dinâmica (datasource, output)
    └── generated/prisma/         # cliente Prisma gerado (fora de node_modules)
```

## Arquitetura

**Backend** segue o padrão em camadas `Controller → Service → Repository`:

- **Controller**: recebe a requisição HTTP, valida entrada via DTO e delega ao Service.
- **Service**: orquestra as regras de negócio; depende de uma **interface** de repositório
  (`IUsuarioRepositorio`, `IEstudanteRepositorio`, etc.), nunca do `PrismaService` diretamente.
- **Repository**: única camada que acessa o Prisma; implementa a interface correspondente
  e é injetada via token (`@Inject('IUsuarioRepositorio')`).

Módulos de domínio em `apps/api/src/modulos/`: `auditoria`, `autenticacao`, `educador`,
`estudante`, `estudo-de-caso`, `evento`, `registro-diario`, `relatorio-semestral`,
`responsavel`, `turma`, `usuario`.

**Frontend** segue Signals + `OnPush` em todos os componentes:

- Entradas/saídas via `input()` / `output()` (sem `@Input()`/`@Output()`).
- Estado mutável em `signal()`/`computed()`, nunca em campos de classe simples.
- Templates com a sintaxe de controle de fluxo nativa (`@if`/`@for`), sem `*ngIf`/`*ngFor`.
- `standalone` omitido (padrão desde Angular 19) e `CommonModule` não é importado —
  cada componente importa apenas as diretivas/pipes específicos que usa.

**Prisma**: o cliente é gerado em `infra/generated/prisma` (fora de `node_modules`),
importado via alias `@prisma-client` — nunca diretamente de `@prisma/client`.

## Como rodar

```bash
# instalar dependências (na raiz do monorepo)
npm install

# aplicar migrations e popular o banco
npm run migrate
npm run seed

# subir API e frontend em modo desenvolvimento
npm run dev

# rodar individualmente
npm run dev:api
npm run dev:web
```

## Scripts úteis

| Comando | Descrição |
|---|---|
| `npm run build:api` / `npm run build:web` | build de produção de cada app |
| `npm run test:api` | testes do backend (Vitest) |
| `npm run generate` | regenera o cliente Prisma |
| `npm run migrate` | aplica migrations do Prisma |
| `npm run seed` | popula o banco com dados de exemplo |
