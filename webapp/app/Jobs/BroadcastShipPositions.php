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
        ShipLatestPositionView::chunk(200, function ($chunk) {
            // Broadcasting the chunk of data after mapping
            broadcast(new ShipPositionUpdated($chunk->toArray()));
        });
    }
}
