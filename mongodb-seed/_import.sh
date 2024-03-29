#!/bin/bash

mongoimport --username root --password root --host mongodb --port 27778 --db geoglify --collection ships --authenticationDatabase=admin --type csv --file /mongodb-seed/ships.csv --headerline

mongoimport --username root --password root --host mongodb --port 27778 --db geoglify --mode upsert --upsertFields code --collection layers --authenticationDatabase=admin --type json --file /mongodb-seed/layers.json --jsonArray
