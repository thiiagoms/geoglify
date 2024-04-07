FROM node:18-slim

LABEL maintainer="Leonel Dias <leoneljdias.github.io>"

WORKDIR /opt/bot

COPY .env.example .env
COPY . /opt/bot

RUN npm install

EXPOSE 3001