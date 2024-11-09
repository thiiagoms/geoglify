FROM pgrouting/pgrouting:16-3.4-3.6.1

ENV POSTGRES_PASSWORD postgres

COPY ./initdb.sh /docker-entrypoint-initdb.d/

COPY ./config/postgresql.conf /var/tmp/postgresql/postgresql.conf

EXPOSE 5432