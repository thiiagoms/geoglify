#!/bin/bash

# mongoimport --username root --password root --host mongodb --port 27017 --db geoglify --mode upsert --upsertFields imo --collection ships --authenticationDatabase=admin --type json --file /mongodb-seed/ships.json --jsonArray

mongoimport --username root --password root --host mongodb --port 27017 --db geoglify --mode upsert --upsertFields code --collection layers --authenticationDatabase=admin --type json --file /mongodb-seed/layers.json --jsonArray

# mongoimport --username root --password root --host mongodb --port 27017 --db geoglify --mode upsert --upsertFields code --collection features --authenticationDatabase=admin --type json --file /mongodb-seed/features.json --jsonArray