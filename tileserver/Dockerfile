FROM node:18-slim

LABEL maintainer="Leonel Dias <leoneljdias.github.io>"

WORKDIR /opt/tileserver

COPY . /opt/tileserver

RUN npm install -g http-server

CMD ["http-server", "--cors", "-p8080", "-d", "false"]