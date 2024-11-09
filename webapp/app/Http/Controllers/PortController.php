<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Port;
use Illuminate\Http\Request;

class PortController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('Ports/Index');
    }

    public function geojson(Request $request)
    {
        $ports = Port::select('id', 'name', 'geojson')->get();

        // return geojson multipoint
        return response()->json([
            'type' => 'FeatureCollection',
            'features' => $ports->map(function ($port) {
                return json_decode($port->geojson);
            }),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Ports/Create');
    }

    public function store(Request $request)
    {
        // 
    }

    /**
     * Display the specified resource.
     */
    public function show(Port $port)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Port $port)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Port $port)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Port $port)
    {
        //
    }
}
