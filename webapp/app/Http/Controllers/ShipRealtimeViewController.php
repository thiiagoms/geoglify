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

        // Highlight search term in the results
        $paginatedShips = $paginatedShips->transform(function ($ship) use ($search) {
            $ship->name = $this->highlightString($ship->name, $search);
            $ship->imo = $this->highlightString($ship->imo, $search);
            $ship->callsign = $this->highlightString($ship->callsign, $search);
            $ship->mmsi = $this->highlightString($ship->mmsi, $search);
            $ship->destination = $this->highlightString($ship->destination, $search);
            $ship->country_name = $this->highlightString($ship->country_name, $search);
            $ship->cargo_name = $this->highlightString($ship->cargo_name, $search);
            return $ship;
        });

        // Return JSON response with paginated data
        return response()->json([
            'filtered_items' => $realtimeShips,
            'paginated_items' => $paginatedShips,
            'total' => $total,
        ]);
    }

    // Helper function to highlight search terms in a string
    function highlightString($str, $search_terms)
    {
        if (empty($search_terms)) {
            return $str;
        }

        $terms = explode(' ', $search_terms);

        foreach ($terms as $term) {
            if (!empty($term)) {
                $str = preg_replace('/(' . preg_quote($term, '/') . ')/i', '<em>$1</em>', $str);
            }
        }

        return $str;
    }
}
