# syntax=docker/dockerfile:1

FROM python:3.11-slim

# PYTHONUNBUFFERED — логи uvicorn уходят в stdout сразу, без буферизации (важно для docker logs)
# PYTHONDONTWRITEBYTECODE — не засорять образ .pyc файлами
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# tini — корректный init-процесс: пробрасывает SIGTERM в uvicorn и собирает зомби-процессы
RUN apt-get update \
    && apt-get install -y --no-install-recommends tini \
    && rm -rf /var/lib/apt/lists/*

# Зависимости копируются ДО исходников: слой с pip install переиспользуется,
# пока requirements.txt не изменился
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Непривилегированный пользователь + права на каталог загрузок (static/uploads пишется приложением).
# chown выполняется ДО объявления volume, поэтому именованный том наследует владельца appuser.
RUN chmod +x /app/docker-entrypoint.sh \
    && useradd --create-home --uid 10001 appuser \
    && mkdir -p /app/static/uploads \
    && chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

# ENTRYPOINT прогоняет миграции Alembic, затем exec'ает CMD (PID 1 остаётся у tini)
ENTRYPOINT ["/usr/bin/tini", "--", "/app/docker-entrypoint.sh"]

# --proxy-headers + --forwarded-allow-ips: uvicorn доверяет X-Forwarded-* от nginx
CMD ["uvicorn", "main:API", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--proxy-headers", \
     "--forwarded-allow-ips", "*"]
