<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Create the table
        Schema::create('ship_realtime_positions', function (Blueprint $table) {
            $table->id();
            $table->string('mmsi')->unique();
            $table->decimal('cog', 5, 2)->nullable();
            $table->decimal('sog', 5, 2)->nullable();
            $table->integer('hdg')->nullable();
            $table->timestamp('last_updated')->nullable();
            $table->timestamp('eta')->nullable();
            $table->string('destination')->nullable();
            $table->jsonb('geojson')->nullable();

            // Audit Fields
            $table->timestamps();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->softDeletes();

            // Adding foreign keys directly
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('deleted_by')->references('id')->on('users')->onDelete('set null');

            // Indexes
            $table->index('mmsi');
        });

        // Adding the Geometry field
        DB::statement('ALTER TABLE ship_realtime_positions ADD COLUMN geom geometry(Geometry, 4326);');

        // Adding the spatial index
        DB::statement('CREATE INDEX ship_realtime_positions_geom_idx ON ship_realtime_positions USING GIST (geom);');

        // Adding the trigger to update the Geometry field
        DB::unprepared('
            CREATE OR REPLACE FUNCTION trg_ship_realtime_positions_geom() RETURNS trigger AS $$
                BEGIN
                    IF NEW.geojson IS NOT NULL THEN
                        NEW.geom = ST_GeomFromGeoJSON(NEW.geojson);
                    END IF;
                    RETURN NEW;
                END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER ship_realtime_positions_geom_trg BEFORE INSERT OR UPDATE ON ship_realtime_positions
                FOR EACH ROW EXECUTE PROCEDURE trg_ship_realtime_positions_geom();
        ');
    }

    public function down()
    {
        // Drop the trigger and function before dropping the table
        DB::unprepared('DROP TRIGGER IF EXISTS ship_realtime_positions_geom_trg ON ship_realtime_positions;');
        DB::unprepared('DROP FUNCTION IF EXISTS trg_ship_realtime_positions_geom();');

        // Drop the table
        Schema::dropIfExists('ship_realtime_positions');
    }
};
