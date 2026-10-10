#!/bin/sh
set -e

# alembic.ini лежит в app/db со script_location=migrations и prepend_sys_path=.,
# поэтому команда обязана выполняться именно из этого каталога.
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] applying alembic migrations..."
  cd /app/app/db
  alembic upgrade head
  cd /app
fi

# exec — процесс приложения заменяет shell и получает сигналы напрямую
exec "$@"
