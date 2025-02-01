<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ShipController;

// Authentication and token generation
Route::post('/auth/token', [AuthController::class, 'generateToken'])->name('auth.generateToken');

// Create ship data
Route::post('/ships', [ShipController::class, 'store'])->name('ships.store');

// View specific ship photo
Route::get('/ships/{id}/photo', [ShipController::class, 'photo'])->name('ships.photo');

// Real-time view of all ships
Route::get('/ships/realtime/all', [ShipController::class, 'all'])->name('ships.realtime.all');

// Real-time ship search
Route::get('/ships/realtime/search', [ShipController::class, 'search'])->name('ships.realtime.search');

// Real-time ship details
Route::get('/ships/details/{mmsi}', [ShipController::class, 'details'])->name('ships.details');

// Fetch ship data based on IMO or MMSI
Route::get('/ships/center', [ShipController::class, 'center'])->name('ships.center');

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Your protected routes here
});
