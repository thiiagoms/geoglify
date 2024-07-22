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
                envelope geometry;
            BEGIN
                -- Create the tile envelope in 4326 and clip to valid latitudes
                envelope := ST_Transform(ST_TileEnvelope(z, x, y), 4326);
                envelope := ST_Intersection(envelope, ST_MakeEnvelope(-180, -85, 180, 85, 4326));

                -- Generate the MVT data
                SELECT INTO mvt ST_AsMVT(tile, 'geoglify_data', 4096, 'geom') FROM (
                    SELECT
                        ST_AsMVTGeom(
                            ST_Transform(ST_CurveToLine(
                                CASE
                                    WHEN ST_YMin(geom) < -85 OR ST_YMax(geom) > 85 THEN NULL
                                    ELSE geom
                                END
                            ), 3857),
                            ST_Transform(envelope, 3857),
                            4096, 64, true) AS geom, layer_id, geojson->>'properties' as data, id, (select name from layers where id = (query_params->>'layer_id')::integer) as layer_name
                    FROM features
                    WHERE geom && envelope AND deleted_at is null
                ) AS tile WHERE geom IS NOT NULL AND layer_id = (query_params->>'layer_id')::integer;

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
