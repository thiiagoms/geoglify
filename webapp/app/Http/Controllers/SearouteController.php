<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Searoute;
use Illuminate\Http\Request;

class SearouteController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('Searoutes/Index');
    }

    public function geojson(Request $request)
    {
        $routes = Searoute::select('id', 'geojson')->get();

        // return geojson multipoint
        return response()->json([
            'type' => 'FeatureCollection',
            'features' => $routes->map(function ($route) {
                return json_decode($route->geojson);
            }),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Searoutes/Create');
    }

    public function store(Request $request)
    {
        // 
    }

    /**
     * Display the specified resource.
     */
    public function show(Searoute $searoute)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Searoute $searoute)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Searoute $searoute)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Searoute $searoute)
    {
        //
    }
}
