<?php

namespace App\Jobs;

use App\Models\{CargoType, Ship, ShipRealtimePosition, ShipHistoricalPosition};
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\{InteractsWithQueue, SerializesModels};
use Illuminate\Support\Collection;
use App\Models\ShipLatestPositionView;

class ProcessShipDataBatch implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected array $batchData;

    public function __construct(array $batchData)
    {
        $this->batchData = $batchData;
    }

    public function handle()
    {
        collect($this->batchData)
            ->chunk(100) // Divide os dados em chunks de 100 itens
            ->each(function (Collection $chunk) {
                // Itera sobre cada item no chunk e processa individualmente
                $chunk->each(function (array $shipData) {
                    $this->processChunk($shipData);
                });
            });
    }

    protected function processChunk(array $shipData)
    {
        try {
            // Valida se o item tem a chave 'mmsi'
            if (!isset($shipData['mmsi'])) {
                \Log::warning("Skipping ship data: Missing 'mmsi' key", $shipData);
                return;
            }

            $cargoType = $this->getCargoType($shipData);
            $geojson = $this->prepareGeoJSON($shipData);

            $this->updateOrCreateShip($shipData, $cargoType);
            $this->updateOrCreateRealtimePosition($shipData, $geojson);
            $this->createHistoricalPosition($shipData, $geojson);
            
            // Force Searchable trait to update the index
            ShipLatestPositionView::where('mmsi', $shipData['mmsi'])->searchable();
            
        } catch (\Exception $e) {
            // Loga o erro ou notifica em caso de falha
            \Log::error("Error processing ship data: " . $e->getMessage(), $shipData);
        }
    }

    protected function getCargoType(array $shipData): ?CargoType
    {
        return isset($shipData['cargo'])
            ? CargoType::where('code', (int) $shipData['cargo'])->first()
            : null;
    }

    protected function prepareGeoJSON(array $shipData): ?string
    {
        return isset($shipData['location']) && $this->isValidGeoJSON($shipData['location'])
            ? json_encode($shipData['location'])
            : null;
    }

    protected function updateOrCreateShip(array $shipData, ?CargoType $cargoType): void
    {
        Ship::updateOrCreate(
            ['mmsi' => $shipData['mmsi']],
            $this->filterData([
                'name' => $shipData['name'] ?? null,
                'dim_a' => $shipData['dim_a'] ?? null,
                'dim_b' => $shipData['dim_b'] ?? null,
                'dim_c' => $shipData['dim_c'] ?? null,
                'dim_d' => $shipData['dim_d'] ?? null,
                'imo' => $shipData['imo'] ?? null,
                'callsign' => $shipData['callsign'] ?? null,
                'draught' => $shipData['draught'] ?? null,
                'cargo_type_id' => $cargoType?->id,
            ])
        );
    }

    protected function updateOrCreateRealtimePosition(array $shipData, ?string $geojson): void
    {
        ShipRealtimePosition::updateOrCreate(
            ['mmsi' => $shipData['mmsi']],
            $this->filterData([
                'cog' => $shipData['cog'] ?? null,
                'sog' => $shipData['sog'] ?? null,
                'hdg' => $shipData['hdg'] ?? null,
                'last_updated' => $shipData['last_updated'] ?? null,
                'eta' => $shipData['eta'] ?? null,
                'destination' => $shipData['destination'] ?? null,
                'geojson' => $geojson,
            ])
        );
    }

    protected function createHistoricalPosition(array $shipData, ?string $geojson): void
    {
        ShipHistoricalPosition::create($this->filterData([
            'mmsi' => $shipData['mmsi'],
            'cog' => $shipData['cog'] ?? null,
            'sog' => $shipData['sog'] ?? null,
            'hdg' => $shipData['hdg'] ?? null,
            'last_updated' => $shipData['last_updated'] ?? null,
            'eta' => $shipData['eta'] ?? null,
            'destination' => $shipData['destination'] ?? null,
            'geojson' => $geojson,
        ]));
    }

    protected function filterData(array $data): array
    {
        return array_filter($data, fn($value) => $value !== '' && $value !== null);
    }

    protected function isValidGeoJSON($data): bool
    {
        if (!is_array($data) || !isset($data['type'])) {
            return false;
        }

        return match ($data['type']) {
            'Point' => $this->isValidPoint($data),
            'LineString' => $this->isValidLineString($data),
            'Polygon' => $this->isValidPolygon($data),
            default => true, // Outros tipos são considerados válidos por padrão
        };
    }

    protected function isValidPoint(array $data): bool
    {
        return isset($data['coordinates']) && is_array($data['coordinates']) && count($data['coordinates']) >= 2;
    }

    protected function isValidLineString(array $data): bool
    {
        if (!isset($data['coordinates']) || !is_array($data['coordinates'])) {
            return false;
        }

        return collect($data['coordinates'])->every(fn($point) => is_array($point) && count($point) >= 2);
    }

    protected function isValidPolygon(array $data): bool
    {
        if (!isset($data['coordinates']) || !is_array($data['coordinates'])) {
            return false;
        }

        return collect($data['coordinates'])->every(
            fn($ring) => is_array($ring) && collect($ring)->every(
                fn($point) => is_array($point) && count($point) >= 2
            )
        );
    }
}
