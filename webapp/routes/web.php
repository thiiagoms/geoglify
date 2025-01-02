<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\LdapController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\LayerController;
use App\Http\Controllers\PortController;
use App\Http\Controllers\SearouteController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Redirect to dashboard
Route::get('/', function () {
    return redirect('/dashboard');
});

// Dashboard
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Users
    Route::resource('users', UserController::class);
    Route::post('/users/list', [UserController::class, 'list'])->name('users.list');

    // Roles
    Route::resource('/roles', RoleController::class);
    Route::post('/roles/list', [RoleController::class, 'list'])->name('roles.list');

    // LDAP
    Route::get('/ldap', [LdapController::class, 'index'])->name('ldap.index');
    Route::post('/ldap/list', [LdapController::class, 'list'])->name('ldap.list');
    Route::post('/ldap/add', [LdapController::class, 'add'])->name('ldap.add');
    Route::post('/ldap/remove', [LdapController::class, 'remove'])->name('ldap.remove');

    // Layers
    Route::resource('layers', LayerController::class);
    Route::post('/layers/list', [LayerController::class, 'list'])->name('layers.list');

    // Ports
    Route::get('/ports/geojson', [PortController::class, 'geojson'])->name('ports.geojson');
    Route::resource('ports', PortController::class);

    // Searoutes
    Route::get('/searoutes/geojson', [SearouteController::class, 'geojson'])->name('searoutes.geojson');
    Route::resource('searoutes', SearouteController::class);
});

require __DIR__ . '/auth.php';
