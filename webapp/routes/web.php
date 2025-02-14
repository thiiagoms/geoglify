<?php

use App\Http\Controllers\ShipController;
use Illuminate\Support\Facades\Route;

// Redirect to dashboard
Route::get('/', [ShipController::class, 'index'])->name('dashboard');

// Redirect to dashboard with imo
Route::get('/imo/{imo}', [ShipController::class, 'index'])->name('dashboard.imo');

// Redirect to dashboard with mmsi
Route::get('/mmsi/{mmsi}', [ShipController::class, 'index'])->name('dashboard.mmsi');

require __DIR__ . '/auth.php';
