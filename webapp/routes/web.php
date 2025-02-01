<?php

use App\Http\Controllers\ShipController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Redirect to dashboard
Route::get('/', function () {
    return Inertia::render('Livemap');
});

// Ship by IMO render Dashboard
Route::get('/ships/imo/{imo}', [ShipController::class, 'showByImo'])->name('ships.showByImo');

// Ship by MMSI render Dashboard
Route::get('/ships/mmsi/{mmsi}', [ShipController::class, 'showByMmsi'])->name('ships.showByMmsi');

require __DIR__ . '/auth.php';
