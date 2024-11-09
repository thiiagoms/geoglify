<?php

namespace Database\Seeders;

use App\Models\Port;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class PortsTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Delete all existing records
        Port::query()->delete();

        // Load the GeoJSON file
        $geojson = File::get(database_path('data/ports.geojson'));
        $data = json_decode($geojson);

        // Insert records from the GeoJSON file
        foreach ($data->features as $feature) {
            $properties = collect($feature->properties);

            Port::create([
                'name' => $properties->get('PORT_NAME'),
                'country' => $properties->get('COUNTRY'),
                'geojson' => json_encode($feature),
                'geom' => DB::raw("ST_GeomFromGeoJSON('" . json_encode($feature->geometry) . "')"),

                // Properties
                'index_no' => $properties->get('INDEX_NO'),
                'region_no' => $properties->get('REGION_NO'),
                'latitude' => $properties->get('LATITUDE'),
                'longitude' => $properties->get('LONGITUDE'),
                'lat_deg' => $properties->get('LAT_DEG'),
                'lat_min' => $properties->get('LAT_MIN'),
                'lat_hemi' => $properties->get('LAT_HEMI'),
                'long_deg' => $properties->get('LONG_DEG'),
                'long_min' => $properties->get('LONG_MIN'),
                'long_hemi' => $properties->get('LONG_HEMI'),
                'pub' => $properties->get('PUB'),
                'chart' => $properties->get('CHART'),
                'harborsize' => $properties->get('HARBORSIZE'),
                'harbortype' => $properties->get('HARBORTYPE'),
                'shelter' => $properties->get('SHELTER'),
                'entry_tide' => $properties->get('ENTRY_TIDE'),
                'entryswell' => $properties->get('ENTRYSWELL'),
                'entry_ice' => $properties->get('ENTRY_ICE'),
                'entryother' => $properties->get('ENTRYOTHER'),
                'overhd_lim' => $properties->get('OVERHD_LIM'),
                'chan_depth' => $properties->get('CHAN_DEPTH'),
                'anch_depth' => $properties->get('ANCH_DEPTH'),
                'cargodepth' => $properties->get('CARGODEPTH'),
                'oil_depth' => $properties->get('OIL_DEPTH'),
                'tide_range' => $properties->get('TIDE_RANGE'),
                'max_vessel' => $properties->get('MAX_VESSEL'),
                'holdground' => $properties->get('HOLDGROUND'),
                'turn_basin' => $properties->get('TURN_BASIN'),
                'portofentr' => $properties->get('PORTOFENTR'),
                'us_rep' => $properties->get('US_REP'),
                'eta_message' => $properties->get('ETA_MESSAGE'),
                'pilot_reqd' => $properties->get('PILOT_REQD'),
                'pilotavail' => $properties->get('PILOT_AVAIL'),
                'loc_assist' => $properties->get('LOC_ASSIST'),
                'pilotadvsd' => $properties->get('PILOT_ADVS'),
                'tugsalvage' => $properties->get('TUG_SALVAGE'),
                'tug_assist' => $properties->get('TUG_ASSIST'),
                'pratique' => $properties->get('PRATIQUE'),
                'sscc_cert' => $properties->get('SSCC_CERT'),
                'quar_other' => $properties->get('QUAR_OTHER'),
                'comm_phone' => $properties->get('COMM_PHONE'),
                'comm_fax' => $properties->get('COMM_FAX'),
                'comm_radio' => $properties->get('COMM_RADIO'),
                'comm_vhf' => $properties->get('COMM_VHF'),
                'comm_air' => $properties->get('COMM_AIR'),
                'comm_rail' => $properties->get('COMM_RAIL'),
                'cargowharf' => $properties->get('CARGOWHARF'),
                'cargo_anch' => $properties->get('CARGO_ANCH'),
                'cargmdmoor' => $properties->get('CARGMDMOOR'),
                'carbchmoor' => $properties->get('CARBCHMOOR'),
                'caricemoor' => $properties->get('CARICEMOOR'),
                'med_facil' => $properties->get('MED_FACIL'),
                'garbage' => $properties->get('GARBAGE'),
                'degauss' => $properties->get('DEGAUSS'),
                'drtyballst' => $properties->get('DRTYBALLST'),
                'cranefixed' => $properties->get('CRANEFIXED'),
                'cranemobil' => $properties->get('CRANEMOBIL'),
                'cranefloat' => $properties->get('CRANEFLOAT'),
                'lift_100' => $properties->get('LIFT_100_'),
                'lift50_100' => $properties->get('LIFT50_100'),
                'lift_25_49' => $properties->get('LIFT_25_49'),
                'lift_0_24' => $properties->get('LIFT_0_24'),
                'longshore' => $properties->get('LONGSHORE'),
                'electrical' => $properties->get('ELECTRICAL'),
                'serv_steam' => $properties->get('SERV_STEAM'),
                'nav_equip' => $properties->get('NAV_EQUIP'),
                'elecrepair' => $properties->get('ELECREPAIR'),
                'provisions' => $properties->get('PROVISIONS'),
                'water' => $properties->get('WATER'),
                'fuel_oil' => $properties->get('FUEL_OIL'),
                'diesel' => $properties->get('DIESEL'),
                'deck_supply' => $properties->get('DECK_SUPPLY'),
                'eng_supply' => $properties->get('ENG_SUPPLY'),
                'repaircode' => $properties->get('REPAIRCODE'),
                'drydock' => $properties->get('DRYDOCK'),
                'railway' => $properties->get('RAILWAY'),

                // Audit fields
                'created_by' => null,
                'updated_by' => null,
                'deleted_by' => null,
            ]);
        }
    }
}
