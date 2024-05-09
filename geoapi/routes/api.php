<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\LayerController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Route to login
Route::post('/auth/login', [AuthController::class, 'login']);

Route::group(['middleware' => 'auth:api'], function () {

   // refresh
   Route::post('/auth/refresh', [AuthController::class, 'refresh']);

   // logout
   Route::post('/auth/logout', [AuthController::class, 'logout']);

   // Get the authenticated User
   Route::get('/auth/me', [AuthController::class, 'me']);

   // Route to display all layers
   Route::post('/layers/search', [LayerController::class, 'index']);

   // Route to display a single layer
   Route::get('/layers/{id}', [LayerController::class, 'show']);

   // Route to create a new layer
   Route::post('/layers', [LayerController::class, 'store']);

   // Route to update an existing layer
   Route::put('/layers/{id}', [LayerController::class, 'update']);

   // Route to delete a layer
   Route::delete('/layers/{id}', [LayerController::class, 'destroy']);

   // Route to display all features of a layer
   Route::get('/layers/{id}/features', [LayerController::class, 'features']);
});