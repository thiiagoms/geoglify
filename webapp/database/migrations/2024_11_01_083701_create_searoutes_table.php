<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('searoutes', function (Blueprint $table) {
            $table->id();
            $table->jsonb('geojson');

            // Audit Fields
            $table->timestamps();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->softDeletes();
        });

        // Adding the foreign keys
        Schema::table('searoutes', function (Blueprint $table) {
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('deleted_by')->references('id')->on('users')->onDelete('set null');
        });

        // Adding the Geometry field
        DB::statement('ALTER TABLE searoutes ADD COLUMN geom geometry(Geometry,4326);');

        // Adding the spatial index
        DB::statement(
            '
            CREATE INDEX searoutes_geom_idx
            ON searoutes
            USING GIST (geom)'
        );

        // Adding the trigger to update the Geometry field
        DB::unprepared('
            CREATE OR REPLACE FUNCTION trg_searoutes_geom() RETURNS trigger AS $$
                BEGIN
                    IF NEW.geojson IS NOT NULL THEN
                        NEW.geom = ST_GeomFromGeoJSON(NEW.geojson->\'geometry\');
                    END IF;
                    RETURN NEW;
                END;
            $$ LANGUAGE plpgsql;
            
            CREATE TRIGGER searoutes_geom_trg BEFORE INSERT OR UPDATE ON searoutes
                FOR EACH ROW EXECUTE PROCEDURE trg_searoutes_geom();
        ');

        // First we have to add source and target column, then we run the pgr_createTopology function to create the topology
        DB::statement('ALTER TABLE searoutes ADD COLUMN source integer;');
        DB::statement('ALTER TABLE searoutes ADD COLUMN target integer;');

        // Create the topology
        DB::statement('SELECT pgr_createTopology(\'searoutes\', 0.0001, \'geom\', \'id\');');

        // it’s a good idea to add an index to source and target column.
        DB::statement('CREATE INDEX searoutes_source_idx ON searoutes(source);');
        DB::statement('CREATE INDEX searoutes_target_idx ON searoutes(target);');

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('searoutes');
    }
};
