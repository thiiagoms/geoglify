<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Criação da tabela 'ports'
        Schema::create('ports', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('index_no')->nullable();
            $table->unsignedInteger('region_no')->nullable();
            $table->string('name');
            $table->string('country', 2); // Código do país (ISO 3166-1 alpha-2)
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->unsignedInteger('lat_deg')->nullable();
            $table->unsignedInteger('lat_min')->nullable();
            $table->char('lat_hemi', 1)->nullable();
            $table->unsignedInteger('long_deg')->nullable();
            $table->unsignedInteger('long_min')->nullable();
            $table->char('long_hemi', 1)->nullable();
            $table->string('pub', 10)->nullable();
            $table->string('chart')->nullable();
            $table->char('harborsize', 1)->nullable(); // Ex: V
            $table->char('harbortype', 2)->nullable(); // Ex: CN
            $table->char('shelter', 1)->nullable();
            $table->string('entry_tide')->nullable();
            $table->string('entryswell')->nullable();
            $table->string('entry_ice')->nullable();
            $table->string('entryother')->nullable();
            $table->string('overhd_lim')->nullable();
            $table->char('chan_depth', 1)->nullable();
            $table->char('anch_depth', 1)->nullable();
            $table->char('cargodepth', 1)->nullable();
            $table->string('oil_depth')->nullable();
            $table->decimal('tide_range', 5, 2)->nullable();
            $table->string('max_vessel')->nullable();
            $table->string('holdground')->nullable();
            $table->string('turn_basin')->nullable();
            $table->string('portofentr')->nullable();
            $table->string('us_rep')->nullable();
            $table->string('eta_message')->nullable();
            $table->string('pilot_reqd')->nullable();
            $table->string('pilotavail')->nullable();
            $table->decimal('loc_assist', 10, 2)->default(0);
            $table->string('pilotadvsd')->nullable();
            $table->string('tugsalvage')->nullable();
            $table->string('tug_assist')->nullable();
            $table->string('pratique')->nullable();
            $table->decimal('sscc_cert', 10, 2)->default(0);
            $table->string('quar_other')->nullable();
            $table->string('comm_phone')->nullable();
            $table->string('comm_fax')->nullable();
            $table->char('comm_radio', 1)->nullable(); // Ex: Y
            $table->string('comm_vhf')->nullable();
            $table->string('comm_air')->nullable();
            $table->string('comm_rail')->nullable();
            $table->string('cargowharf')->nullable();
            $table->char('cargo_anch', 1)->nullable(); // Ex: Y
            $table->decimal('cargmdmoor', 10, 2)->default(0);
            $table->decimal('carbchmoor', 10, 2)->default(0);
            $table->decimal('caricemoor', 10, 2)->default(0);
            $table->char('med_facil', 1)->nullable(); // Ex: Y
            $table->string('garbage')->nullable();
            $table->decimal('degauss', 10, 2)->default(0);
            $table->string('drtyballst')->nullable();
            $table->string('cranefixed')->nullable();
            $table->string('cranemobil')->nullable();
            $table->string('cranefloat')->nullable();
            $table->decimal('lift_100', 10, 2)->default(0);
            $table->string('lift50_100')->nullable();
            $table->decimal('lift_25_49', 10, 2)->default(0);
            $table->decimal('lift_0_24', 10, 2)->default(0);
            $table->string('longshore')->nullable();
            $table->string('electrical')->nullable();
            $table->decimal('serv_steam', 10, 2)->default(0);
            $table->decimal('nav_equip', 10, 2)->default(0);
            $table->decimal('elecrepair', 10, 2)->default(0);
            $table->string('provisions')->nullable();
            $table->string('water')->nullable();
            $table->string('fuel_oil')->nullable();
            $table->string('diesel')->nullable();
            $table->string('deck_supply')->nullable();
            $table->string('eng_supply')->nullable();
            $table->string('repaircode')->nullable();
            $table->string('drydock')->nullable();
            $table->string('railway')->nullable();

            // Campo GeoJSON
            $table->jsonb('geojson');

            // Campos de auditoria
            $table->timestamps();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->softDeletes();

            // Definições de chaves estrangeiras
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('deleted_by')->references('id')->on('users')->onDelete('set null');
        });

        // Adicionando o campo de geometria
        DB::statement('ALTER TABLE ports ADD COLUMN geom geometry(Point,4326);');

        // Adicionando o índice espacial
        DB::statement(
            '
            CREATE INDEX ports_geom_idx
            ON ports
            USING GIST (geom)'
        );

        // Adicionando o trigger para atualizar o campo de geometria
        DB::unprepared('
            CREATE OR REPLACE FUNCTION trg_ports_geom() RETURNS trigger AS $$ 
                BEGIN 
                    IF NEW.geojson IS NOT NULL THEN 
                        NEW.geom = ST_GeomFromGeoJSON(NEW.geojson->\'geometry\'); 
                    END IF; 
                    RETURN NEW; 
                END; 
            $$ LANGUAGE plpgsql; 
            
            CREATE TRIGGER ports_geom_trg BEFORE INSERT OR UPDATE ON ports 
                FOR EACH ROW EXECUTE PROCEDURE trg_ports_geom();
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ports');
    }
};
