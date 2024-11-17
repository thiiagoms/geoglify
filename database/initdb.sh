#!/bin/bash
set -e

# Ensure the configuration file exists before copying
if [ -f /var/tmp/postgresql/postgresql.conf ]; then
    cp -r /var/tmp/postgresql/postgresql.conf /var/lib/postgresql/data/postgresql.conf
else
    echo "postgresql.conf not found. Exiting..."
    exit 1
fi

# Run SQL commands to setup the database
psql -v ON_ERROR_STOP=1 --username postgres --dbname postgres <<-EOSQL
    -- Create the dbadmin user if it doesn't already exist
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dbadmin') THEN
            CREATE USER dbadmin WITH PASSWORD 'geoglify2024';
        END IF;
    END
    \$\$;

    -- Ensure postgres password is updated
    ALTER USER postgres WITH PASSWORD 'postgres2024';

    -- Create the geoglify database if it doesn't exist
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'geoglify') THEN
            CREATE DATABASE geoglify;
        END IF;
    END
    \$\$;

    -- Grant the necessary privileges
    ALTER USER dbadmin WITH SUPERUSER;
    GRANT ALL PRIVILEGES ON DATABASE geoglify TO postgres;
    GRANT ALL PRIVILEGES ON DATABASE geoglify TO dbadmin;

    -- Create the PostGIS extension if not already installed
    CREATE EXTENSION IF NOT EXISTS postgis;
EOSQL

echo "Database setup completed successfully."