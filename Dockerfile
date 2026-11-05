# syntax=docker/dockerfile:1

FROM node:24.22.1-alpine AS build
WORKDIR /app

COPY package.json package-lock.json .npmrc .nvmrc ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/coronel-reclamos/browser /usr/share/nginx/html

EXPOSE 80
