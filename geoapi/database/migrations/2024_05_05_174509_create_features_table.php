<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Creating the table
        Schema::create('features', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('layer_id')->nullable();
            $table->json('geojson');
            $table->timestamps();
            $table->softDeletes();

            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
        });

        // Adding the foreign keys
        Schema::table('features', function (Blueprint $table) {
            $table->foreign('layer_id')->references('id')->on('layers')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('deleted_by')->references('id')->on('users')->onDelete('set null');
        });

        // Adding the Geometry field
        DB::statement('ALTER TABLE features ADD COLUMN geom geometry(Geometry,4326);');

        // Adding the spatial index
        DB::statement('
            CREATE INDEX features_geom_idx
            ON features
            USING GIST (geom)');


        // Adding the trigger to update the Geometry field
        DB::unprepared('
            CREATE OR REPLACE FUNCTION trg_features_geom() RETURNS trigger AS $$
                BEGIN
                    IF NEW.geojson IS NOT NULL THEN
                        NEW.geom = ST_GeomFromGeoJSON(NEW.geojson->\'geometry\');
                    END IF;
                    RETURN NEW;
                END;
            $$ LANGUAGE plpgsql;
            
            CREATE TRIGGER features_geom_trg BEFORE INSERT OR UPDATE ON features
                FOR EACH ROW EXECUTE PROCEDURE trg_features_geom();
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('features');
    }
};
