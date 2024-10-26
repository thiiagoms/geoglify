<?php

namespace App\Http\Controllers;

use App\Models\ShipRealtimeView;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ShipRealtimeViewController extends Controller
{

    public function all()
    {
        return response()->json(ShipRealtimeView::all());
    }

    /**
     * Returns a paginated list of ships based on search parameters.
     */
    public function search(Request $request)
    {
        // Pagination and search parameters
        $itemsPerPage = $request->input('itemsPerPage', 5);
        $page = $request->input('page', 1);
        $search = $request->input('search', '');

        // Perform the search directly
        $realtimeShips = empty(trim($search))
            ? ShipRealtimeView::all()
            : ShipRealtimeView::search($search)->get();

        // Total count and apply pagination
        $total = $realtimeShips->count();
        $paginatedShips = $realtimeShips->forPage($page, $itemsPerPage)->values();

        // Return JSON response with paginated data
        return response()->json([
            'filtered_items' => $realtimeShips,
            'paginated_items' => $paginatedShips,
            'total' => $total,
        ]);
    }
}
