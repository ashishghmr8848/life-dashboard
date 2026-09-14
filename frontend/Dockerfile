# Frontend (React + Vite) - built as static assets, served by nginx which
# also reverse-proxies API calls to the backend container so the SPA can call
# same-origin relative paths (see VITE_API_BASE_URL="" build arg below).
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Empty string (not unset) so lib/api.ts's `?? "http://localhost:8000"`
# fallback doesn't kick in - axios then uses relative URLs, which nginx.conf
# routes to the backend container.
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:1.27-alpine
# nginx's stock entrypoint envsubst's any /etc/nginx/templates/*.template
# file into /etc/nginx/conf.d/ at container start, using whatever env vars
# are actually set - see nginx.conf.template's comment.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
ENV BACKEND_ORIGIN=http://backend:8000
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
