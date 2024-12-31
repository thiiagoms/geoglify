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

class ProcessShipDataBatch implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $batchData;

    /**
     * Create a new job instance.
     *
     * @param array $batchData Array containing ship data in batch
     */
    public function __construct(array $batchData)
    {
        $this->batchData = $batchData;
    }

    /**
     * Execute the job.
     *
     * Process the ship data batch by dividing it into chunks
     * and then process each chunk to update ship data.
     *
     * @return void
     */
    public function handle()
    {
        // Define chunk size for processing the batch in smaller sets
        $chunkSize = 100; // Number of ships per chunk
        collect($this->batchData)
            ->chunk($chunkSize)
            ->each(function (Collection $chunk) {
                // Process each chunk
                $this->processChunk($chunk);
            });
    }

    /**
     * Process a chunk of ship data and broadcast updated information.
     *
     * @param \Illuminate\Support\Collection $chunk Collection of ship data
     * @return void
     */
    protected function processChunk(Collection $chunk)
    {
        // Prepare data for broadcasting
        $broadcastData = $chunk->map(function ($shipData) {

            // Update or create the ship's general information
            Ship::updateOrCreate(
                ['mmsi' => $shipData['mmsi']],
                $this->filterUpdateData([
                    'name' => $shipData['name'] ?? null,
                    'dim_a' => $shipData['dim_a'] ?? null,
                    'dim_b' => $shipData['dim_b'] ?? null,
                    'dim_c' => $shipData['dim_c'] ?? null,
                    'dim_d' => $shipData['dim_d'] ?? null,
                    'imo' => $shipData['imo'] ?? null,
                    'callsign' => $shipData['callsign'] ?? null,
                    'draught' => $shipData['draught'] ?? null,
                    'cargo' => $shipData['cargo'] ?? null,
                ])
            );

            // Update or create the ship's real-time position
            ShipRealtimePosition::updateOrCreate(
                ['mmsi' => $shipData['mmsi']],
                $this->filterUpdateData([
                    'cog' => $shipData['cog'] ?? null,
                    'sog' => $shipData['sog'] ?? null,
                    'hdg' => $shipData['hdg'] ?? null,
                    'last_updated' => $shipData['last_updated'] ?? null,
                    'eta' => $shipData['eta'] ?? null,
                    'destination' => $shipData['destination'] ?? null,
                    'geojson' => isset($shipData['location']) ? json_encode($shipData['location']) : null,
                ])
            );

            // Insert a historical position record for tracking
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

            // Retrieve the latest data from the database
            $updatedShip = Ship::where('mmsi', $shipData['mmsi'])->first();
            $updatedRealtimePosition = ShipRealtimePosition::where('mmsi', $shipData['mmsi'])->first();

            // Merge data for broadcasting
            if ($updatedShip && $updatedRealtimePosition) {
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

        // Dispatch the event with the processed data for broadcasting
        broadcast(new ShipPositionUpdated($broadcastData->toArray()));
    }

    /**
     * Filter the data to include only non-empty and non-null values.
     *
     * @param array $data Array of data to filter
     * @return array Filtered data
     */
    function filterUpdateData($data)
    {
        return array_filter($data, function ($value) {
            return $value !== '' && $value !== null;
        });
    }
}
