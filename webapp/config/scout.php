<?php

use App\Models\ShipLatestPositionView;

return [

    /*
    |----------------------------------------------------------------------
    | Default Search Engine
    |---------------------------------------------------------------------- 
    |
    | Defines the default search connection. Typesense is specified 
    | here, but you can use other engines like Algolia or Meilisearch.
    |
    */

    'driver' => env('SCOUT_DRIVER', 'typesense'),

    /*
    |----------------------------------------------------------------------
    | Index Prefix
    |----------------------------------------------------------------------
    |
    | Define a prefix for your search indexes. Useful for multi-tenancy 
    | or shared search infrastructure.
    |
    */

    'prefix' => env('SCOUT_PREFIX', ''),

    /*
    |----------------------------------------------------------------------
    | Queue Data Syncing
    |---------------------------------------------------------------------- 
    |
    | Defines whether operations that sync data with the search engine 
    | are queued. Set to false for direct syncing if performance isn't 
    | critical.
    |
    */

    'queue' =>  [
        'connection' => env('SCOUT_CONNECTION', false),
        'queue' => 'scout',
    ],

    /*
    |----------------------------------------------------------------------
    | Database Transactions
    |---------------------------------------------------------------------- 
    |
    | Defines if data sync with search engine happens only after database 
    | transactions are committed.
    |
    */

    'after_commit' => false,

    /*
    |----------------------------------------------------------------------
    | Chunk Sizes
    |---------------------------------------------------------------------- 
    |
    | Defines chunk sizes for mass importing data. This is important 
    | for performance when syncing large datasets.
    |
    */

    'chunk' => [
        'searchable' => 500,
        'unsearchable' => 500,
    ],

    /*
    |----------------------------------------------------------------------
    | Soft Deletes
    |---------------------------------------------------------------------- 
    |
    | Defines whether soft-deleted records are maintained in the search 
    | index. For read-only views, soft deletes are not needed.
    |
    */

    'soft_delete' => false,

    /*
    |----------------------------------------------------------------------
    | Identify User
    |---------------------------------------------------------------------- 
    |
    | If true, search engines (e.g., Algolia) will identify the user 
    | performing searches. This is useful for analytics, but not 
    | applicable for Typesense.
    |
    */

    'identify' => env('SCOUT_IDENTIFY', false),

    /*
    |----------------------------------------------------------------------
    | Typesense Configuration
    |---------------------------------------------------------------------- 
    |
    | Typesense search engine configuration.
    |
    */

    'typesense' => [
        'client-settings' => [
            'api_key' => env('TYPESENSE_API_KEY', 'xyz'),
            'nodes' => [
                [
                    'host' => env('TYPESENSE_HOST', 'localhost'),
                    'port' => env('TYPESENSE_PORT', '8108'),
                    'path' => env('TYPESENSE_PATH', ''),
                    'protocol' => env('TYPESENSE_PROTOCOL', 'http'),
                ],
            ],
            'nearest_node' => [
                'host' => env('TYPESENSE_HOST', 'localhost'),
                'port' => env('TYPESENSE_PORT', '8108'),
                'path' => env('TYPESENSE_PATH', ''),
                'protocol' => env('TYPESENSE_PROTOCOL', 'http'),
            ],
            'connection_timeout_seconds' => env('TYPESENSE_CONNECTION_TIMEOUT_SECONDS', 2),
            'healthcheck_interval_seconds' => env('TYPESENSE_HEALTHCHECK_INTERVAL_SECONDS', 30),
            'num_retries' => env('TYPESENSE_NUM_RETRIES', 3),
            'retry_interval_seconds' => env('TYPESENSE_RETRY_INTERVAL_SECONDS', 1),
        ],
        'model-settings' => [
            ShipLatestPositionView::class => [
                'collection-schema' => [
                    'fields' => [
                        ['name' => 'id', 'type' => 'string'],
                        ['name' => 'imo', 'type' => 'string'],
                        ['name' => 'mmsi', 'type' => 'string'],
                        ['name' => 'name', 'type' => 'string'],
                        ['name' => 'callsign', 'type' => 'string'],
                        ['name' => 'destination', 'type' => 'string'],
                        ['name' => 'cargo_type_name', 'type' => 'string'],
                        ['name' => 'cargo_category_name', 'type' => 'string'],
                        ['name' => 'country_name', 'type' => 'string'],
                        ['name' => 'country_iso_code', 'type' => 'string'],
                        [
                            'name' => '__soft_deleted',
                            'type' => 'int32',
                            'optional' => true,
                        ],
                    ],
                ],
                'search-parameters' => [
                    'query_by' => 'imo,mmsi,name,callsign,destination,cargo_type_name,cargo_category_name,country_name,country_iso_code',
                ],
            ],
        ],
    ],
];
