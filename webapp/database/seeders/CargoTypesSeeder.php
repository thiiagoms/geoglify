<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CargoTypesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Truncate the table first
        DB::table('cargo_types')->truncate();

        // Cargo types
        $cargoTypes = [
            ["code" => 0, "category" => "No cargo", "description" => "No cargo type specified"],
            ["code" => 20, "category" => "WIG", "description" => "Wing in Ground"],
            ["code" => 29, "category" => "Search and Rescue Aircraft", "description" => "Search and Rescue Aircraft"],
            ["code" => 30, "category" => "Fishing", "description" => "Fishing Vessel"],
            ["code" => 31, "category" => "Towing", "description" => "Towing Vessel"],
            ["code" => 32, "category" => "Towing", "description" => "Towing: length exceeds 200m or breadth exceeds 25m"],
            ["code" => 33, "category" => "Dredger", "description" => "Dredger Vessel"],
            ["code" => 34, "category" => "Dive Ops", "description" => "Diving Operations"],
            ["code" => 35, "category" => "Military Ops", "description" => "Military Operations"],
            ["code" => 36, "category" => "Sailing Vessel", "description" => "Sailing Vessel"],
            ["code" => 37, "category" => "Pleasure Craft", "description" => "Pleasure Craft Vessel"],
            ["code" => 40, "category" => "HSC", "description" => "High-Speed Craft"],
            ["code" => 50, "category" => "Pilot", "description" => "Pilot Vessel"],
            ["code" => 51, "category" => "Search and Rescue Vessel", "description" => "Search and Rescue Vessel"],
            ["code" => 52, "category" => "Tug", "description" => "Tug Vessel"],
            ["code" => 53, "category" => "Port Tender", "description" => "Port Tender Vessel"],
            ["code" => 54, "category" => "Anti-Pollution Vessel", "description" => "Anti-Pollution Vessel"],
            ["code" => 55, "category" => "Law Enforcement", "description" => "Law Enforcement Vessel"],
            ["code" => 56, "category" => "Local Vessel", "description" => "Local Vessel"],
            ["code" => 58, "category" => "Medical Transport", "description" => "Medical Transport Vessel"],
            ["code" => 59, "category" => "Noncombatant", "description" => "Noncombatant Vessel"],
            ["code" => 60, "category" => "Passenger", "description" => "Passenger: All Ships"],
            ["code" => 61, "category" => "Passenger", "description" => "Passenger: Hazardous category A"],
            ["code" => 62, "category" => "Passenger", "description" => "Passenger: Hazardous category B"],
            ["code" => 63, "category" => "Passenger", "description" => "Passenger: Hazardous category C"],
            ["code" => 64, "category" => "Passenger", "description" => "Passenger: Hazardous category D"],
            ["code" => 65, "category" => "Passenger", "description" => "Passenger: Reserved for Future Use"],
            ["code" => 66, "category" => "Passenger", "description" => "Passenger: Reserved for Future Use"],
            ["code" => 67, "category" => "Passenger", "description" => "Passenger: Reserved for Future Use"],
            ["code" => 68, "category" => "Passenger", "description" => "Passenger: Reserved for Future Use"],
            ["code" => 70, "category" => "Cargo", "description" => "Cargo: All Ships"],
            ["code" => 71, "category" => "Cargo", "description" => "Cargo: Hazardous category A"],
            ["code" => 72, "category" => "Cargo", "description" => "Cargo: Hazardous category B"],
            ["code" => 73, "category" => "Cargo", "description" => "Cargo: Hazardous category C"],
            ["code" => 74, "category" => "Cargo", "description" => "Cargo: Hazardous category D"],
            ["code" => 80, "category" => "Tanker", "description" => "Tanker: All Ships"],
            ["code" => 81, "category" => "Tanker", "description" => "Tanker: Hazardous category A"],
            ["code" => 82, "category" => "Tanker", "description" => "Tanker: Hazardous category B"],
            ["code" => 83, "category" => "Tanker", "description" => "Tanker: Hazardous category C"],
            ["code" => 84, "category" => "Tanker", "description" => "Tanker: Hazardous category D"],
            ["code" => 90, "category" => "Other", "description" => "Other: All Ships"],
            ["code" => 91, "category" => "Other", "description" => "Other: Hazardous category A"],
            ["code" => 92, "category" => "Other", "description" => "Other: Hazardous category B"],
            ["code" => 93, "category" => "Other", "description" => "Other: Hazardous category C"],
            ["code" => 94, "category" => "Other", "description" => "Other: Hazardous category D"]
        ];

        DB::table('cargo_types')->insert($cargoTypes);
    }
}
