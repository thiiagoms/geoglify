<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Ship;
use App\Models\ShipRealtimePosition;
use App\Models\ShipHistoricalPosition;

class SaveShipJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $ship;

    /**
     * Create a new job instance.
     */
    public function __construct($ship)
    {
        $this->ship = $ship;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Update or create the ship data in the database (if the data is not empty)
        Ship::updateOrCreate(
            ['mmsi' => $this->ship['mmsi']],
            array_filter([
                'name' => $this->ship['name'] ?? null,
                'dim_a' => $this->ship['dim_a'] ?? null,
                'dim_b' => $this->ship['dim_b'] ?? null,
                'dim_c' => $this->ship['dim_c'] ?? null,
                'dim_d' => $this->ship['dim_d'] ?? null,
                'imo' => $this->ship['imo'] ?? null,
                'callsign' => $this->ship['callsign'] ?? null,
                'draught' => $this->ship['draught'] ?? null,
                'cargo' => $this->ship['cargo'] ?? null,
            ], function ($value) {
                return !is_null($value) && $value !== '';
            })
        );

        // Update or create the ship realtime position in the database (if the data is not empty)
        ShipRealtimePosition::updateOrCreate(
            ['mmsi' => $this->ship['mmsi']],
            array_filter([
                'cog' => $this->ship['cog'] ?? null,
                'sog' => $this->ship['sog'] ?? null,
                'hdg' => $this->ship['hdg'] ?? null,
                'last_updated' => $this->ship['last_updated'] ?? null,
                'eta' => $this->ship['eta'] ?? null,
                'destination' => $this->ship['destination'] ?? null,
                'geojson' => json_encode($this->ship['geojson']),
            ], function ($value) {
                return !is_null($value) && $value !== '';
            })
        );

        // Cria uma nova posição histórica
        ShipHistoricalPosition::create([
            'mmsi' => $this->ship['mmsi'],
            'cog' => $this->ship['cog'] ?? null,
            'sog' => $this->ship['sog'] ?? null,
            'hdg' => $this->ship['hdg'] ?? null,
            'last_updated' => $this->ship['last_updated'] ?? null,
            'eta' => $this->ship['eta'] ?? null,
            'destination' => $this->ship['destination'] ?? null,
            'geojson' => json_encode($this->ship['geojson']),
        ]);
    }
}
