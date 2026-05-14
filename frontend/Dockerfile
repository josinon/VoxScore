# Build (Vite)
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build-time: ajuste por ambiente (CI/CD). Vazio = URLs relativas `/api/v1` (Ingress no mesmo host).
ARG VITE_API_BASE_URL=
ARG VITE_OAUTH_REDIRECT_ORIGIN=
ARG VITE_REALTIME_ENABLED=true
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_OAUTH_REDIRECT_ORIGIN=$VITE_OAUTH_REDIRECT_ORIGIN
ENV VITE_REALTIME_ENABLED=$VITE_REALTIME_ENABLED

RUN npm run build

# Static SPA
FROM nginx:1.27-alpine
COPY nginx.default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
