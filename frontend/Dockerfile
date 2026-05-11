# ---------- Stage 1: build React app ----------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN yarn install --network-timeout 600000

COPY . .

# Empty backend URL => axios calls "/api/..." (proxied by Nginx in stage 2).
# Same image works for local and VPS — no rebuild per environment.
ENV REACT_APP_BACKEND_URL=""
ENV CI=false
RUN yarn build

# ---------- Stage 2: serve via Nginx ----------
FROM nginx:1.27-alpine

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
