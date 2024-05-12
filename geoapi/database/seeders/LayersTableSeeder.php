<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LayersTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $data = [
            [
                "code" => "EEZS",
                "name" => "Exclusive Economic Zones",
                "description" => "List of Exclusive Economic Zones with corresponding details. Explore this dataset to access information about Exclusive Economic Zones, including economic activities and jurisdictional boundaries.",
                "type" => "polygon",
                "style" => json_encode([
                    "radius" => 1,
                    "lineWidth" => 5,
                    "fillColor" => "#DF950D40",
                    "lineColor" => "#DF950D",
                    "dashArray" => "0,0",
                    "fillPattern" => "none",
                    "fillPatternScale" => 100,
                    "fillPatternOffset" => [0, 0]
                ])
            ],
            [
                "code" => "ECZS",
                "name" => "Exclusive Coastal Zones",
                "description" => "List of Exclusive Coastal Zones with corresponding details. Delve into this dataset to discover Exclusive Coastal Zones, featuring comprehensive information on environmental regulations and coastal management.",
                "type" => "polygon",
                "style" => json_encode([
                    "radius" => 1,
                    "lineWidth" => 5,
                    "fillColor" => "#DF950D40",
                    "lineColor" => "#DF950D",
                    "dashArray" => "0,0",
                    "fillPattern" => "none",
                    "fillPatternScale" => 100,
                    "fillPatternOffset" => [0, 0]
                ])
            ],
            [
                "code" => "PORTS",
                "name" => "Ports",
                "description" => "List of Ports with corresponding details. This dataset provides information about various ports, including facilities and activities.",
                "type" => "point",
                "style" => json_encode([
                    "radius" => 5,
                    "lineWidth" => 4,
                    "fillColor" => "#FF573340",
                    "lineColor" => "#FF5733",
                    "dashArray" => "0,0",
                    "fillPattern" => "none",
                    "fillPatternScale" => 100,
                    "fillPatternOffset" => [0, 0]
                ])
            ],
            [
                "code" => "LIGHTHOUSES",
                "name" => "Lighthouses",
                "description" => "List of Lighthouses with corresponding details. Explore this dataset to discover information about various lighthouses, their locations, and characteristics.",
                "type" => "point",
                "style" => json_encode([
                    "radius" => 3,
                    "lineWidth" => 4,
                    "fillColor" => "#FFFF0040",
                    "lineColor" => "#FFFF00",
                    "dashArray" => "0,0",
                    "fillPattern" => "none",
                    "fillPatternScale" => 100,
                    "fillPatternOffset" => [0, 0]
                ])
            ],
            [
                "code" => "BEACHES",
                "name" => "Beaches",
                "description" => "List of Beaches with corresponding details. This dataset provides information about various beaches, including amenities and recreational activities.",
                "type" => "polygon",
                "style" => json_encode([
                    "radius" => 1,
                    "lineWidth" => 4,
                    "fillColor" => "#F0E68C40",
                    "lineColor" => "#F0E68C",
                    "dashArray" => "0,0",
                    "fillPattern" => "none",
                    "fillPatternScale" => 100,
                    "fillPatternOffset" => [0, 0]
                ])
            ],
            [
                "code" => "COASTAL_STRIP",
                "name" => "Coastal Strips",
                "description" => "List of Coastal Strips with corresponding details. Explore this dataset to access information about coastal strips and their features.",
                "type" => "polygon",
                "style" => json_encode([
                    "radius" => 1,
                    "lineWidth" => 4,
                    "fillColor" => "#00FFFF40",
                    "lineColor" => "#00FFFF",
                    "dashArray" => "0,0",
                    "fillPattern" => "none",
                    "fillPatternScale" => 100,
                    "fillPatternOffset" => [0, 0]
                ])
            ],
            [
                "code" => "WILDLIFE_HABITATS",
                "name" => "Wildlife Habitats",
                "description" => "List of Wildlife Habitats with corresponding details. Delve into this dataset to discover information about various wildlife habitats along the coastlines.",
                "type" => "polygon",
                "style" => json_encode([
                    "radius" => 1,
                    "lineWidth" => 4,
                    "fillColor" => "#00800040",
                    "lineColor" => "#008000",
                    "dashArray" => "0,0",
                    "fillPattern" => "none",
                    "fillPatternScale" => 100,
                    "fillPatternOffset" => [0, 0]
                ])
            ],
            [
                "code" => "MARINAS",
                "name" => "Marinas",
                "description" => "List of Marinas with corresponding details. This dataset provides information about various marinas, including services and facilities.",
                "type" => "point",
                "style" => json_encode([
                    "radius" => 4,
                    "lineWidth" => 4,
                    "fillColor" => "#4682B440",
                    "lineColor" => "#4682B4",
                    "dashArray" => "0,0",
                    "fillPattern" => "none",
                    "fillPatternScale" => 100,
                    "fillPatternOffset" => [0, 0]
                ])
            ],
            [
                "code" => "ESTUARIES",
                "name" => "Estuaries",
                "description" => "List of Estuaries with corresponding details. Explore this dataset to discover information about estuarine environments, their ecological importance, and associated habitats.",
                "type" => "polygon",
                "style" => json_encode([
                    "radius" => 1,
                    "lineWidth" => 4,
                    "fillColor" => "#87CEFA40",
                    "lineColor" => "#87CEFA",
                    "dashArray" => "0,0",
                    "fillPattern" => "none",
                    "fillPatternScale" => 100,
                    "fillPatternOffset" => [0, 0]
                ])
            ],
            [
                "code" => "RIVERS",
                "name" => "Rivers",
                "description" => "List of Rivers with corresponding details. Explore this dataset to discover information about river systems, their courses, and ecological significance.",
                "type" => "line",
                "style" => json_encode([
                    "radius" => 1,
                    "lineWidth" => 4,
                    "fillColor" => "#1E90FF40",
                    "lineColor" => "#1E90FF",
                    "dashArray" => "0,0",
                    "fillPattern" => "none",
                    "fillPatternScale" => 100,
                    "fillPatternOffset" => [0, 0]
                ])
            ],
            [
                "code" => "NAVIGATION_ROUTES",
                "name" => "Navigation Routes",
                "description" => "List of Navigation Routes with corresponding details. Delve into this dataset to explore navigational routes, including shipping lanes, channels, and other designated paths.",
                "type" => "line",
                "style" => json_encode([
                    "radius" => 1,
                    "lineWidth" => 4,
                    "fillColor" => "#32CD3240",
                    "lineColor" => "#32CD32",
                    "dashArray" => "0,0",
                    "fillPattern" => "none",
                    "fillPatternScale" => 100,
                    "fillPatternOffset" => [0, 0]
                ])
            ]
        ];

        DB::table('layers')->insert($data);
    }
}
