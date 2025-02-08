<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\ShipLatestPositionView;
use App\Events\ShipPositionUpdated;

class BroadcastShipPositions implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle()
    {
        // Processing ships in chunks of 100
        ShipLatestPositionView::chunk(100, function ($chunk) {
            // Map the fields to prepare data for broadcasting
            $mappedChunk = $chunk->map(function ($item) {
                return [
                    'id' => $item->id, 
                    'mmsi' => $item->mmsi, 
                    'imo' => $item->imo,  
                    'name' => $item->name,
                    'geojson' => $item->geojson, 
                    'cog' => $item->cog,  
                    'sog' => $item->sog,  
                    'hdg' => $item->hdg,  
                    'cargo_category_color' => $item->cargo_category_color,  
                ];
            });

            // Broadcasting the chunk of data after mapping
            broadcast(new ShipPositionUpdated($mappedChunk->toArray()));
        });
    }
}
