<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        Schema::create('ship_realtime_positions', function (Blueprint $table) {
            $table->id();
            $table->string('mmsi')->unique();
            $table->decimal('cog', 5, 2)->nullable(); // Course over ground
            $table->decimal('sog', 5, 2)->nullable(); // Speed over ground
            $table->integer('hdg')->nullable(); // Heading
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

            // Indexes
            $table->index('mmsi');
        });

        // Adding the foreign keys
        Schema::table('ship_realtime_positions', function (Blueprint $table) {
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('deleted_by')->references('id')->on('users')->onDelete('set null');
        });

        // Adding the Geometry field
        DB::statement('ALTER TABLE ship_realtime_positions ADD COLUMN geom geometry(Geometry,4326);');

        // Adding the spatial index
        DB::statement(
            '
           CREATE INDEX ship_realtime_positions_geom_idx
           ON ship_realtime_positions
           USING GIST (geom)'
        );

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
        Schema::dropIfExists('ship_realtime_positions');
    }
};
