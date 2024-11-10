<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ShipDataController;

Route::post('/auth/token', [AuthController::class, 'generateToken']);

Route::post('/ais', [ShipDataController::class, 'store']);

Route::middleware('auth:sanctum')->group(function () {
   
    // Your protected routes here
    
});
