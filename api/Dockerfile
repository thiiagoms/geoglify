FROM node:18-slim

LABEL maintainer="Leonel Dias <leoneljdias.github.io>"

WORKDIR /opt/api

COPY .env.example .env

COPY . /opt/api

RUN npm install

EXPOSE 8081