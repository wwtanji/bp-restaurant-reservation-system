# Docker

Контейнеризация проекта: React (CRA) за nginx, FastAPI под uvicorn, MySQL 8.4.

## Структура

| Файл                     | Назначение                                                        |
| ------------------------ | ----------------------------------------------------------------- |
| `backend/Dockerfile`     | `python:3.11-slim`, non-root `appuser`, tini как PID 1             |
| `backend/docker-entrypoint.sh` | Прогон `alembic upgrade head`, затем `exec` uvicorn          |
| `frontend/Dockerfile`    | Multi-stage: `deps` → `development` / `build` → `production` (nginx) |
| `frontend/nginx.conf`    | SPA-fallback на `index.html`, прокси `/api/` → `backend:8000`      |
| `docker-compose.yml`     | Прод-конфигурация: `db`, `backend`, `frontend`                     |
| `docker-compose.dev.yml` | Оверрайд с hot-reload, применяется явно через `-f`                 |
| `.env.example`           | Шаблон переменных окружения для compose                            |

## Первый запуск

```bash
cp .env.example .env      # PowerShell: Copy-Item .env.example .env
```

Заполни в `.env` как минимум `MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD`, `SECRET_KEY`.
Без них compose откажется стартовать (переменные помечены как обязательные).

## Продакшен-режим

```bash
docker compose build
docker compose up -d
```

Приложение: http://localhost:8080 — nginx отдаёт статику и проксирует `/api/` в FastAPI.
Порт бэкенда наружу не публикуется, MySQL живёт в изолированной сети `backend_net`.

```bash
docker compose logs -f              # логи всех сервисов
docker compose logs -f backend      # только бэкенд
docker compose ps                   # статус + результат healthcheck
docker compose down                 # остановить (тома с данными сохраняются)
docker compose down -v              # остановить и УДАЛИТЬ БД и загруженные файлы
```

## Режим разработки (hot-reload)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Что меняется относительно прод-режима:

- **backend** — `./backend` монтируется в `/app`, uvicorn запускается с `--reload`, порт `8000` публикуется наружу;
- **frontend** — вместо nginx собирается стадия `development` и запускается `npm start` на `3000`;
  `src/`, `public/`, конфиги монтируются с хоста, `WATCHPACK_POLLING=true` включает опрос ФС
  (без него webpack не видит правки в bind-mount на Windows);
- **db** — публикуется на `3307`, чтобы не конфликтовать с локальным XAMPP MySQL.

Фронт открывается на http://localhost:3000 и ходит напрямую в http://localhost:8000/api
(этот origin уже разрешён в CORS `backend/main.py`).

Чтобы каждый раз не писать два `-f`:

```bash
export COMPOSE_FILE=docker-compose.yml:docker-compose.dev.yml     # bash
$env:COMPOSE_FILE = "docker-compose.yml;docker-compose.dev.yml"   # PowerShell
```

## Миграции

Entrypoint бэкенда сам выполняет `alembic upgrade head` при каждом старте контейнера
(отключается через `RUN_MIGRATIONS=false` в `.env`). Вручную:

```bash
docker compose exec backend sh -c "cd app/db && alembic upgrade head"
docker compose exec backend sh -c "cd app/db && alembic revision --autogenerate -m 'описание'"
```

## Stripe webhook

```bash
# dev-режим — порт бэкенда опубликован
stripe listen --forward-to http://localhost:8000/api/payments/webhook

# прод-режим — через nginx
stripe listen --forward-to http://localhost:8080/api/payments/webhook
```

## Доступ к базе

```bash
docker compose exec db mysql -u root -p restaurant_db
```

## Полезное

```bash
docker compose build --no-cache backend    # пересборка без кэша
docker compose restart backend             # рестарт одного сервиса
docker compose exec backend sh             # шелл внутри контейнера
docker compose down && docker compose up -d --build   # применить правки Dockerfile
```

## Замечания

- `REACT_APP_API_URL` подставляется CRA **на этапе сборки** — после его изменения фронт нужно
  пересобрать (`docker compose build frontend`), рестарта недостаточно.
- nginx слушает `8080` внутри контейнера (порты < 1024 недоступны non-root пользователю),
  наружу маппится `FRONTEND_PORT`.
- Загруженные картинки лежат в томе `backend_uploads`; в dev-режиме — в `backend/static/uploads`
  на хосте.
- В dev-режиме внутрь контейнера монтируются только `backend/app` и `backend/main.py`, но не весь
  `backend/`. Иначе туда попадёт хостовый `backend/.env`, и `load_dotenv(override=True)` в
  `app/db/migrations/env.py` перебьёт `DATABASE_URL` из compose на `localhost` — миграции упадут.
  Новые python-файлы в корне `backend/` нужно добавлять в список монтирований.
- В прод-образе `backend/.env` отсутствует (исключён `.dockerignore`) — переменные приходят
  только из compose.
- При деплое за внешним reverse-proxy с HTTPS добавь фактический домен в `origins`
  в `backend/main.py` только если фронт и API будут на разных доменах — при раздаче через
  этот nginx запросы идут с того же origin и CORS не задействуется.
