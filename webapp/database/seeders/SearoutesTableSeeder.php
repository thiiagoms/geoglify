<?php

namespace Database\Seeders;

use App\Models\Searoute;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;

class SearoutesTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Delete all the records
        Searoute::all()->each(function ($port) {
            $port->delete();
        });

        // Load the GeoJSON file
        $geojson = File::get(database_path('data/searoutes.geojson'));
        $data = json_decode($geojson);

        // Insert the records
        foreach ($data->features as $feature) {
            Searoute::create([
                'geojson' => json_encode($feature, true),
            ]);
        }

        // Create the topology
        DB::statement('SELECT pgr_createTopology(\'searoutes\', 0.000001, \'geom\', \'id\');');
    }
}
