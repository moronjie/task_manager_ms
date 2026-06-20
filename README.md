# Task Manager — MERN Microservices

A task manager built as a microservice system. An API Gateway fronts three backend services,
each owning its own datastore, with asynchronous messaging over RabbitMQ.

```
client ──▶ API Gateway (:8080)
              ├─▶ Auth Service    (:4001) ── Postgres + Prisma
              ├─▶ Project Service (:4004) ── Postgres + Prisma   (workspaces, projects, members)
              └─▶ Task Service    (:4002) ── MongoDB + Mongoose
                       │ validates project/membership (sync, internal API)
                       │ publishes events
                       ▼
                  RabbitMQ ──▶ Notification Service (:4003)
```

## Domain model

```
Workspace ──< WorkspaceMember (userId, role: owner|admin|member)
    │
    └──< Project ──< Task (assigneeId must be a workspace member)
```

A user creates a **workspace** (becoming its owner), adds **members**, and creates
**projects** inside it. **Tasks** belong to a project and can only be assigned to members of
that project's workspace.

## Services

| Service              | Port | Datastore           | Responsibility                                  |
| -------------------- | ---- | ------------------- | ----------------------------------------------- |
| Gateway              | 8080 | —                   | Single entry point, JWT verification, routing   |
| Auth Service         | 4001 | Postgres (Prisma)   | Register / login / user profile, issues JWTs    |
| Project Service      | 4004 | Postgres (Prisma)   | Workspaces, members & roles, projects           |
| Task Service         | 4002 | MongoDB (Mongoose)  | Task CRUD, publishes `task.*` events            |
| Notification Service | 4003 | —                   | Consumes `task_events`, logs notifications      |

## API (through the gateway)

| Method & path                              | Auth | Description                          |
| ------------------------------------------ | ---- | ----------------------------------- |
| `POST /api/auth/register` · `/login`       | —    | Returns a JWT                       |
| `GET  /api/auth/me`                        | JWT  | Current user                        |
| `POST /api/workspaces`                     | JWT  | Create workspace (you become owner) |
| `GET  /api/workspaces`                     | JWT  | Workspaces you belong to            |
| `GET  /api/workspaces/:id`                 | JWT  | Workspace (members + projects)      |
| `POST /api/workspaces/:id/members`         | JWT  | Add member (owner/admin)            |
| `GET  /api/workspaces/:id/members`         | JWT  | List members                        |
| `DELETE /api/workspaces/:id/members/:uid`  | JWT  | Remove member (owner/admin)         |
| `POST /api/workspaces/:id/projects`        | JWT  | Create project                      |
| `GET  /api/workspaces/:id/projects`        | JWT  | List projects                       |
| `GET/PATCH/DELETE /api/projects/:id`       | JWT  | Read / update / delete a project    |
| `POST /api/tasks`                          | JWT  | Create task (validates project+member) |
| `GET  /api/tasks?projectId=&workspaceId=&status=&assigneeId=` | JWT | List/filter tasks |
| `GET/PATCH/DELETE /api/tasks/:id`          | JWT  | Read / update / delete a task       |

Cross-service validation: on task create, the task service calls the project service's
internal API (`/internal/...`, private network only) to confirm the project exists and that
the creator and assignee are workspace members. The project service calls the auth service to
confirm a user exists before adding them as a member.

## Architecture notes

- **Auth flow:** the Auth service signs JWTs with a shared `JWT_SECRET`. The Gateway verifies
  the token on protected routes and forwards `x-user-id` / `x-user-role` headers to downstream
  services, so the services trust the gateway and stay simple.
- **Async flow:** the Task service publishes domain events (`task.created`, `task.assigned`)
  to a RabbitMQ topic exchange (`task_events`). The Notification service binds a queue to that
  exchange and consumes them.
- Only the Gateway publishes a host port. Services talk to each other on the internal Docker
  network by service name.

## Running locally

```bash
cp .env.example .env
docker compose up --build
```

Then:

- Gateway health: `GET http://localhost:8080/health`
- RabbitMQ management UI: http://localhost:15672 (guest / guest)

### Smoke test

```bash
# Register (returns a JWT)
curl -s -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@b.com","password":"secret123","name":"Ada"}'

# Login
curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@b.com","password":"secret123"}'

# Create a task (use the token from above) — notification-service logs the event
curl -s -X POST http://localhost:8080/api/tasks \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <JWT>' \
  -d '{"title":"First task","priority":"high"}'

# List tasks
curl -s http://localhost:8080/api/tasks -H 'Authorization: Bearer <JWT>'
```

## Conventions

- **TypeScript** everywhere, compiled to `dist/` via per-service multi-stage Docker
  builds (builder stage compiles, runtime stage ships only prod deps + `dist`).
- **Per-service config module** (`src/config`): every service reads all of its env
  vars in one place and references `config.*` instead of `process.env` directly.
- **Standard response envelope** on every endpoint:
  - success → `{ "success": true, "message": "...", "data": { ... } }`
  - error → `{ "success": false, "message": "...", "code": "VALIDATION_ERROR" }`
  Controllers throw `AppError` (see `src/lib/AppError.ts`); a global error handler in
  `src/lib/http.ts` formats the response.

## Project layout

```
gateway/                  API gateway (Express + http-proxy-middleware)
  src/config/             env config
  src/auth.ts             JWT verification middleware
  src/routes.ts           proxy table (pathFilter + header forwarding)
services/
  auth-service/           Express + Prisma + Postgres
    src/config/  src/lib/ (AppError, http, jwt, prisma, validate)  src/schemas/  src/controllers/
  project-service/        Express + Prisma + Postgres
    src/config/  src/lib/ (access, authClient, prisma, http, validate)  src/schemas/  src/controllers/
  task-service/           Express + Mongoose + MongoDB + amqplib
    src/config/  src/lib/ (mongo, rabbit, projectClient, http, validate)  src/models/  src/controllers/
  notification-service/   Express + amqplib (consumer)
    src/config/  src/consumer.ts
docker-compose.yml        Orchestrates services + 2× Postgres + Mongo + RabbitMQ
```
