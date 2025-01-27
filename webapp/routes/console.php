<?php

use Illuminate\Support\Facades\Schedule;
use App\Jobs\RemoveOutdatedRealtimePositionsJob;
use App\Jobs\BroadcastShipPositions;

// Schedule the RemoveOutdatedRealtimePositionsJob command to run every minute
Schedule::job(new RemoveOutdatedRealtimePositionsJob)->everyMinute();

// Schedule the BroadcastShipPositions command to run every five seconds
Schedule::job(new BroadcastShipPositions)->everyFiveSeconds();

