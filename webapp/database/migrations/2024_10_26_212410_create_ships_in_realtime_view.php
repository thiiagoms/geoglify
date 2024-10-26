<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // Create a view that includes only ships with real-time data
        DB::statement('
            CREATE VIEW ships_in_realtime AS
            SELECT 
                ships.id,
                ships.mmsi,
                ships.name,
                ships.callsign,
                ships.imo,
                ships.cargo,
                ships.draught,
                ship_realtime_positions.cog,
                ship_realtime_positions.sog,
                ship_realtime_positions.hdg,
                ship_realtime_positions.last_updated,
                ship_realtime_positions.eta,
                ship_realtime_positions.destination,
                ship_realtime_positions.geojson,
                ship_realtime_positions.geom,
                ship_realtime_positions.created_at,
                ship_realtime_positions.updated_at
            FROM ships
            INNER JOIN ship_realtime_positions
            ON ships.mmsi = ship_realtime_positions.mmsi
        ');
    }

    public function down()
    {
        // Drop the view if the migration is rolled back
        DB::statement('DROP VIEW IF EXISTS ships_in_realtime');
    }
};