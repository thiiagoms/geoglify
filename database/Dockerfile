# Use the official pgRouting image with PostgreSQL 16
FROM pgrouting/pgrouting:16-3.4-3.6.1

# Set the default PostgreSQL password (used during container initialization)
ENV POSTGRES_PASSWORD postgres

# Copy the initialization script into the docker-entrypoint-initdb.d folder
# This will be run when the container is initialized
COPY ./initdb.sh /docker-entrypoint-initdb.d/

# Copy custom PostgreSQL configuration file
# Ensure PostgreSQL will use this configuration file
COPY ./config/postgresql.conf /var/tmp/postgresql/postgresql.conf

# Ensure the initdb.sh script is executable
RUN chmod +x /docker-entrypoint-initdb.d/initdb.sh

# Set environment variable for PostgreSQL to use custom config file (optional)
# If you're using a non-default configuration file path, you can specify it here
# Uncomment the line below if you want to make sure PostgreSQL uses your custom config file
# ENV PGDATA /var/lib/postgresql/data
# ENV POSTGRESQL_CONF /var/tmp/postgresql/postgresql.conf

# Expose PostgreSQL default port
EXPOSE 5432