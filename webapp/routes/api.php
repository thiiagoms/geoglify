<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ShipDataController;

// Authentication and token generation
Route::post('/auth/token', [AuthController::class, 'generateToken'])->name('auth.generateToken');

// Create ship data
Route::post('/ships', [ShipDataController::class, 'store'])->name('ships.store');

// View specific ship photo
Route::get('/ships/{id}/photo', [ShipDataController::class, 'photo'])->name('ships.photo');

// Real-time view of all ships
Route::get('/ships/realtime/all', [ShipDataController::class, 'all'])->name('ships.realtime.all');

// Real-time ship search
Route::post('/ships/realtime/search', [ShipDataController::class, 'search'])->name('ships.realtime.search');

// Real-time ship details
Route::get('/ships/details/{mmsi}', [ShipDataController::class, 'details'])->name('ships.details');

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Your protected routes here
});
