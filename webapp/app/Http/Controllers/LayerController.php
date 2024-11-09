<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Layer;
use Illuminate\Http\Request;

class LayerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('Layers/Index');
    }

    public function list(Request $request)
    {
        try {
            // Validate input with default values
            $validated = $request->validate([
                'page' => 'integer|min:1',
                'itemsPerPage' => 'integer|min:1',
                'search' => 'nullable|string',
            ]);

            $page = $validated['page'] ?? 1;
            $itemsPerPage = $validated['itemsPerPage'] ?? 10;
            $search = strtolower($validated['search'] ?? '');

            // Select specific fields from Layers table
            $layers = Layer::select('id', 'name', 'description', 'created_at', 'updated_at', 'is_active')->get();

            // Filter and map layers using collections
            $filteredLayers = collect($layers)->filter(function ($layer) use ($search) {

                // Apply search filter
                if ($search) {
                    return str_contains(strtolower($layer->name), $search) ||
                        str_contains(strtolower($layer->description), $search);
                }

                return true;
            })->map(function ($layer) {
                // Map user data
                return $layer;
            })->sortBy('id');

            $total = $filteredLayers->count();

            // Manually paginate results
            $paginatedLayers = $filteredLayers->slice(($page - 1) * $itemsPerPage, $itemsPerPage)->values();

            // Response structure
            return response()->json([
                'items' => $paginatedLayers,
                'total' => $total,
                'perPage' => $itemsPerPage,
                'currentPage' => $page,
            ]);
        } catch (ValidationException $e) {

            // Handle validation errors
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (Exception $e) {

            // Handle general errors
            return response()->json([
                'message' => 'An error occurred while processing your request.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Layers/Create');
    }

    public function store(Request $request)
    {
        // 
    }

    /**
     * Display the specified resource.
     */
    public function show(Layer $layer)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Layer $layer)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Layer $layer)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Layer $layer)
    {
        //
    }
}
