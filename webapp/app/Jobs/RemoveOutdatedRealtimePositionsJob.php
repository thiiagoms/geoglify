<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\ShipRealtimePosition;
use Carbon\Carbon;

/**
 * This job is responsible for cleaning up the ShipRealtimePosition table
 * by deleting all entries older than 30 minutes.
 */
class RemoveOutdatedRealtimePositionsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, SerializesModels;

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Calculate the threshold time
        $threshold = Carbon::now()->subMinutes(30);

        // Delete all records in ShipRealtimePosition older than the threshold
        ShipRealtimePosition::where('last_updated', '<=', $threshold)->delete();
    }
}
