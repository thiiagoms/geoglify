<?php

use Illuminate\Support\Facades\Schedule;
use App\Jobs\RemoveOutdatedRealtimePositionsJob;

// Schedule the RemoveOutdatedRealtimePositionsJob command to run every minute
Schedule::job(new RemoveOutdatedRealtimePositionsJob)->everyMinute();
