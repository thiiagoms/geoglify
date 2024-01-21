FROM node:18-slim

LABEL maintainer="Leonel Dias <leoneljdias.github.io>"

WORKDIR /opt/realtime

COPY .env.example .env
COPY . /opt/realtime

RUN npm install

EXPOSE 3001