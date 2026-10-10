# syntax=docker/dockerfile:1

# ---------- Stage 1: зависимости ----------
FROM node:20-alpine AS deps
WORKDIR /app
# .npmrc обязателен: в нём legacy-peer-deps=true, без него npm ci упадёт на конфликте peer-зависимостей.
# Манифесты копируются отдельно от кода, чтобы слой npm ci кэшировался между сборками.
COPY package.json package-lock.json .npmrc ./
RUN npm ci

# ---------- Stage 2: dev-сервер (используется только docker-compose.dev.yml) ----------
FROM deps AS development
WORKDIR /app
COPY . .
EXPOSE 3000
CMD ["npm", "start"]

# ---------- Stage 3: сборка статики ----------
FROM deps AS build
WORKDIR /app
# CRA подставляет REACT_APP_* на этапе сборки, поэтому это build-arg, а не runtime-переменная.
# Значение по умолчанию /api — относительный путь, который резолвит nginx этого же контейнера.
ARG REACT_APP_API_URL=/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV GENERATE_SOURCEMAP=false
COPY . .
RUN npm run build

# ---------- Stage 4: раздача статики ----------
FROM nginx:alpine AS production
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/build /usr/share/nginx/html

RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx

USER nginx
EXPOSE 8080

# nginx завершается корректно (graceful) именно по SIGQUIT
STOPSIGNAL SIGQUIT

CMD ["nginx", "-g", "daemon off;"]
