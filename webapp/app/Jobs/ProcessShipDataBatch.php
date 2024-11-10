<?php

namespace App\Jobs;

use App\Models\Ship;
use App\Models\ShipRealtimePosition;
use App\Models\ShipHistoricalPosition;
use App\Events\ShipPositionUpdated;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class ProcessShipDataBatch implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $batchData;

    /**
     * Create a new job instance.
     *
     * @param array $batchData
     */
    public function __construct(array $batchData)
    {
        $this->batchData = $batchData;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        // Process the batch data in chunks
        $chunkSize = 100; // Number of ships to include per chunk
        collect($this->batchData)
            ->chunk($chunkSize)
            ->each(function (Collection $chunk) {
                // Update ships and broadcast in chunks
                $this->processChunk($chunk);
            });
    }

    /**
     * Process a chunk of ship data and broadcast it.
     *
     * @param \Illuminate\Support\Collection $chunk
     * @return void
     */
    protected function processChunk(Collection $chunk)
    {
        // Prepare the data to be broadcasted
        $broadcastData = $chunk->map(function ($shipData) {

            // Update or create the ship's general information
            Ship::updateOrCreate(
                ['mmsi' => $shipData['mmsi']],
                [
                    'name' => $shipData['name'] ?? null,
                    'dim_a' => $shipData['dim_a'] ?? null,
                    'dim_b' => $shipData['dim_b'] ?? null,
                    'dim_c' => $shipData['dim_c'] ?? null,
                    'dim_d' => $shipData['dim_d'] ?? null,
                    'imo' => $shipData['imo'] ?? null,
                    'callsign' => $shipData['callsign'] ?? null,
                    'draught' => $shipData['draught'] ?? null,
                    'cargo' => $shipData['cargo'] ?? null,
                ]
            );

            // Update or create the real-time position of the ship
            ShipRealtimePosition::updateOrCreate(
                ['mmsi' => $shipData['mmsi']],
                [
                    'cog' => $shipData['cog'] ?? null,
                    'sog' => $shipData['sog'] ?? null,
                    'hdg' => $shipData['hdg'] ?? null,
                    'last_updated' => $shipData['last_updated'] ?? null,
                    'eta' => $shipData['eta'] ?? null,
                    'destination' => $shipData['destination'] ?? null,
                    'geojson' => isset($shipData['location']) ? json_encode($shipData['location']) : null,
                ]
            );

            // Create a new historical position record for tracking
            ShipHistoricalPosition::create([
                'mmsi' => $shipData['mmsi'],
                'cog' => $shipData['cog'] ?? null,
                'sog' => $shipData['sog'] ?? null,
                'hdg' => $shipData['hdg'] ?? null,
                'last_updated' => $shipData['last_updated'] ?? null,
                'eta' => $shipData['eta'] ?? null,
                'destination' => $shipData['destination'] ?? null,
                'geojson' => isset($shipData['location']) ? json_encode($shipData['location']) : null,
            ]);

            // Retrieve the most up-to-date data from the database, including `name` and other fields
            $updatedShip = Ship::where('mmsi', $shipData['mmsi'])->first();
            $updatedRealtimePosition = ShipRealtimePosition::where('mmsi', $shipData['mmsi'])->first();

            // Check if ship is found and merge data
            if ($updatedShip && $updatedRealtimePosition) {
                // Combine data from ship and realtime position
                return [
                    'mmsi' => $updatedShip->mmsi,
                    'name' => $updatedShip->name,
                    'dim_a' => $updatedShip->dim_a,
                    'dim_b' => $updatedShip->dim_b,
                    'dim_c' => $updatedShip->dim_c,
                    'dim_d' => $updatedShip->dim_d,
                    'imo' => $updatedShip->imo,
                    'callsign' => $updatedShip->callsign,
                    'draught' => $updatedShip->draught,
                    'cargo' => $updatedShip->cargo,
                    'cog' => $updatedRealtimePosition->cog,
                    'sog' => $updatedRealtimePosition->sog,
                    'hdg' => $updatedRealtimePosition->hdg,
                    'last_updated' => $updatedRealtimePosition->last_updated,
                    'eta' => $updatedRealtimePosition->eta,
                    'destination' => $updatedRealtimePosition->destination,
                    'geojson' => $updatedRealtimePosition->geojson,
                ];
            }
        });

        // Dispatch the event with the chunk of ships' data
        broadcast(new ShipPositionUpdated($broadcastData->toArray()));
    }
}
