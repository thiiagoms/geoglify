<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {

    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        $createFunctionSql = "
            CREATE OR REPLACE FUNCTION geoglify_data(z integer, x integer, y integer, query_params json)
            RETURNS bytea AS \$\$
            DECLARE
                mvt bytea;
            BEGIN
                SELECT INTO mvt ST_AsMVT(tile, 'geoglify_data', 4096, 'geom') FROM (
                    SELECT
                        ST_AsMVTGeom(
                            ST_Transform(ST_CurveToLine(geom), 3857),
                            ST_TileEnvelope(z, x, y),
                            4096, 64, true) AS geom, layer_id
                    FROM features
                    WHERE geom && ST_Transform(ST_TileEnvelope(z, x, y), 4326)
                ) as tile WHERE geom IS NOT NULL AND layer_id = (query_params->>'layer_id')::integer;

                RETURN mvt;
            END
            \$\$ LANGUAGE plpgsql IMMUTABLE STRICT PARALLEL SAFE;

            DO \$\$
            BEGIN
                EXECUTE 'COMMENT ON FUNCTION geoglify_data IS \$tj\$' || 
                '{
                    \"description\": \"Generates a Mapbox Vector Tile for a given zoom level and tile coordinates\",
                    \"attribution\": \"Data provided by XYZ Corporation\",
                    \"vector_layers\": [
                        {
                            \"id\": \"geoglify_data\",
                            \"description\": \"Layer containing vector tiles for geospatial data\",
                            \"fields\": {
                                \"geom\": \"Geometry\",
                                \"layer_id\": \"Integer\"
                            }
                        }
                    ],
                    \"version\": \"1.0.0\"
                }'::json || '\$tj\$';
            END
            \$\$;
        ";

        DB::unprepared($createFunctionSql);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        $dropFunctionSql = "DROP FUNCTION IF EXISTS geoglify_data(z integer, x integer, y integer, query_params json);";
        DB::unprepared($dropFunctionSql);
    }
};
