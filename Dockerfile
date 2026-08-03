# Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine
RUN mkdir -p /var/cache/nginx && \
    chown -R 101:101 /var/cache/nginx && \
    chown -R 101:101 /var/log/nginx
COPY nginx.main.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Run as the unprivileged nginx user (uid/gid 101 in the official image).
# The pid file lives in /tmp and the cache/log dirs above are writable by it.
USER 101:101
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
