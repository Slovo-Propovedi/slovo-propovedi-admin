# Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Cap the Node.js heap so the build stays within the Docker build memory limit
# (configured via `slovo_frontend_container_image_build_memory` in the playbook).
ENV NODE_OPTIONS="--max-old-space-size=384"

# Backend API hostname baked into the Vite build; overridable via
# --build-arg. Feeds VITE_API_BASE (see src/lib/api/client.ts) and the
# nginx CSP connect-src below (re-declared in the serve stage since ARGs
# don't cross Docker build stages).
ARG BACKEND_API_HOSTNAME=api.slovo-propovedi.ru
ENV VITE_API_BASE="https://${BACKEND_API_HOSTNAME}"

RUN npm run build

# Serve stage
FROM nginx:alpine
ARG BACKEND_API_HOSTNAME=api.slovo-propovedi.ru
RUN mkdir -p /var/cache/nginx && \
    chown -R 101:101 /var/cache/nginx && \
    chown -R 101:101 /var/log/nginx
COPY nginx.main.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Guard: bare hostname only — no protocol/scheme, no path, no trailing
# slash, no port (mirrors slovo-propovedi-landing/Dockerfile).
RUN set -e; \
    if [ -z "$BACKEND_API_HOSTNAME" ] || ! printf '%s' "$BACKEND_API_HOSTNAME" | grep -Eq '^[A-Za-z0-9][A-Za-z0-9.-]*[A-Za-z0-9]$|^[A-Za-z0-9]$'; then \
      echo "ERROR: BACKEND_API_HOSTNAME must be a bare hostname (no protocol/scheme, no path, no trailing slash, no port): '$BACKEND_API_HOSTNAME'" >&2; \
      exit 1; \
    fi
# `nginx -t` here runs as root (before USER below) and, because
# nginx.main.conf sets `pid /tmp/nginx.pid`, actually creates that pidfile
# as a side effect — owned by root, and root-only-writable, baked into this
# layer. At runtime the container runs as a different (non-root) uid, which
# then can't overwrite that pre-existing root-owned file: "open() ...
# Permission denied", crash-loop. Removing it here keeps /tmp clean for
# whichever uid actually runs the container.
RUN sed -i "s|__BACKEND_API_HOSTNAME__|${BACKEND_API_HOSTNAME}|g" /etc/nginx/conf.d/default.conf && nginx -t && rm -f /tmp/nginx.pid

# Run as the unprivileged nginx user (uid/gid 101 in the official image).
# The pid file lives in /tmp and the cache/log dirs above are writable by it.
USER 101:101
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
