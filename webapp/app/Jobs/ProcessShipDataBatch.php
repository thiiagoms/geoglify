<?php

namespace App\Jobs;

use App\Models\CargoType;
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

    protected function processChunk(Collection $chunk)
    {
        $broadcastData = $chunk->map(function ($shipData) {
            $cargoType = null;

            // Check if the 'cargo' field exists and is not empty
            if (isset($shipData['cargo']) && !empty($shipData['cargo'])) {
                $cargoType = CargoType::where('code', (int)($shipData['cargo']))->first();
            }

            // Prepare the 'geojson' field
            $geojson = null;
            if (isset($shipData['location']) && $this->isValidGeoJSON($shipData['location'])) {
                $geojson = json_encode($shipData['location']);
            }

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
                    'cargo_type_id' => is_null($cargoType) ? null : $cargoType->id,
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
                    'geojson' => $geojson, // Only updated if $geojson is not null
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
                'geojson' => $geojson, // Only inserted if $geojson is not null
            ]);

            // Retrieve the latest data from the database
            $updatedShip = Ship::where('mmsi', $shipData['mmsi'])->first();
            $updatedRealtimePosition = ShipRealtimePosition::where('mmsi', $shipData['mmsi'])->first();

            // Prepare data for broadcasting
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
                    'cog' => $updatedRealtimePosition->cog,
                    'sog' => $updatedRealtimePosition->sog,
                    'hdg' => $updatedRealtimePosition->hdg,
                    'last_updated' => $updatedRealtimePosition->last_updated,
                    'eta' => $updatedRealtimePosition->eta,
                    'destination' => $updatedRealtimePosition->destination,
                    'geojson' => $updatedRealtimePosition->geojson,
                    'cargo_name' => $updatedShip->cargo_type_name,
                    'cargo_code' => $updatedShip->cargo_type_code,
                    'category_name' => $updatedShip->cargo_category_name,
                    'category_color' => $updatedShip->cargo_category_color,
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

    /**
     * Validate if the given data is a valid GeoJSON object.
     *
     * @param mixed $data Data to validate
     * @return bool True if the data is a valid GeoJSON object, false otherwise
     */
    protected function isValidGeoJSON($data): bool
    {
        // Check if the data is an array and has the required 'type' key
        if (!is_array($data) || !isset($data['type'])) {
            return false;
        }

        // Validate based on the GeoJSON type
        switch ($data['type']) {
            case 'Point':
                return $this->isValidPoint($data);
            case 'LineString':
                return $this->isValidLineString($data);
            case 'Polygon':
                return $this->isValidPolygon($data);
            case 'MultiPoint':
            case 'MultiLineString':
            case 'MultiPolygon':
            case 'GeometryCollection':
            case 'Feature':
            case 'FeatureCollection':
                // Implement additional validation for other GeoJSON types if needed
                return true; // Placeholder, adjust as needed
            default:
                return false;
        }
    }

    /**
     * Validate if the given data is a valid GeoJSON Point.
     *
     * @param array $data Data to validate
     * @return bool True if the data is a valid Point, false otherwise
     */
    protected function isValidPoint(array $data): bool
    {
        return isset($data['coordinates']) && is_array($data['coordinates']) && count($data['coordinates']) >= 2;
    }

    /**
     * Validate if the given data is a valid GeoJSON LineString.
     *
     * @param array $data Data to validate
     * @return bool True if the data is a valid LineString, false otherwise
     */
    protected function isValidLineString(array $data): bool
    {
        if (!isset($data['coordinates']) || !is_array($data['coordinates'])) {
            return false;
        }

        foreach ($data['coordinates'] as $point) {
            if (!is_array($point) || count($point) < 2) {
                return false;
            }
        }

        return true;
    }

    /**
     * Validate if the given data is a valid GeoJSON Polygon.
     *
     * @param array $data Data to validate
     * @return bool True if the data is a valid Polygon, false otherwise
     */
    protected function isValidPolygon(array $data): bool
    {
        if (!isset($data['coordinates']) || !is_array($data['coordinates'])) {
            return false;
        }

        foreach ($data['coordinates'] as $ring) {
            if (!is_array($ring)) {
                return false;
            }

            foreach ($ring as $point) {
                if (!is_array($point) || count($point) < 2) {
                    return false;
                }
            }
        }

        return true;
    }
}
