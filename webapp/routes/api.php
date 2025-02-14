<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ShipController;

// Authentication and token generation
Route::post('/auth/token', [AuthController::class, 'generateToken'])->name('auth.generateToken');

// Create ship data
Route::post('/ships', [ShipController::class, 'store'])->name('ships.store');

// Real-time ship search
Route::get('/ships/realtime/search', [ShipController::class, 'search'])->name('ships.realtime.search');

// Real-time ship details
Route::get('/ships/details/{mmsi}', [ShipController::class, 'details'])->name('ships.details');

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Your protected routes here
});
