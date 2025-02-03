<?php

namespace App\Http\Controllers;

use App\Models\ShipLatestPositionView;
use App\Models\Ship;
use Illuminate\Http\Request;
use App\Jobs\ProcessShipDataBatch;
use Inertia\Inertia;

class ShipController extends Controller
{
    /**
     * Store incoming ship data in batches and dispatch job.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $data = $request->all();

        if (!is_array($data) || empty($data)) {
            return response()->json(['message' => 'Invalid data format or empty batch'], 422);
        }

        // Dispatch the job with the batch of ship data
        ProcessShipDataBatch::dispatch($data);

        return response()->json(['message' => 'Batch processing started'], 202);
    }

    /**
     * Returns a list of all ships in real-time view.
     */
    public function all()
    {
        return response()->json(ShipLatestPositionView::all());
    }

    /**
     * Shows the Livemap with the ship's coordinates based on IMO.
     *
     * @param string $imo
     * @return \Inertia\Response
     */
    public function showByImo($imo)
    {
        // Search for the ship by IMO
        $ship = Ship::where('imo', $imo)->first();

        // If the ship is not found, redirect or return an error message
        if (!$ship) {
            return redirect('/')->with('error', 'IMO not found.');
        }

        // Search for the position of the ship in real-time
        $realtimePosition = ShipLatestPositionView::where('mmsi', $ship->mmsi)->first();

        // If the real-time position is not found, redirect or return an error message
        if (!$realtimePosition) {
            return redirect('/')->with('error', 'Real-time position not found.');
        }

        // Pass the data to the dashboard
        return Inertia::render('Livemap', [
            'ship' => $ship,
            'realtimePosition' => $realtimePosition,
        ]);
    }

    /**
     * Show the Livemap with the ship's coordinates based on MMSI.
     *
     * @param string $mmsi
     * @return \Inertia\Response
     */
    public function showByMmsi($mmsi)
    {
        // Search for the ship by MMSI
        $ship = Ship::where('mmsi', $mmsi)->first();

        // If the ship is not found, redirect or return an error message
        if (!$ship) {
            return redirect('/')->with('error', 'MMSI not found.');
        }

        // Search for the ship's real-time position by MMSI
        $realtimePosition = ShipLatestPositionView::where('mmsi', $mmsi)->first();

        // If the ship or its real-time position is not found, redirect or return an error message
        if (!$realtimePosition) {
            return redirect('/')->with('error', 'MMSI not found.');
        }

        // Pass the data to the dashboard
        return Inertia::render('Livemap', [
            'ship' => $ship,
            'realtimePosition' => $realtimePosition,
        ]);
    }

    /**
     * Returns details of a specific ship based on MMSI number.
     */
    public function details($mmsi)
    {
        $ship = ShipLatestPositionView::where('mmsi', $mmsi)->first();

        return response()->json($ship);
    }

    /**
     * Returns a list of ships based on search text (GET)
     */
    public function search(Request $request)
    {
        // Define pagination parameters
        $text = trim($request->input('text', '') ?? '');
        $perPage = $request->input('per_page', 5); // Default to 5 items per page
        $page = $request->input('page', 1); // Default to the first page

        $searchParameters = [
            'q'         => $text,
            'sort_by'   => 'name:desc',
            'per_page'  => (int)$perPage,
            'page'      => (int)$page,
        ];

        // Perform the search directly
        $realtimeShips = $text === '' || $text === 'null'
            ? ShipLatestPositionView::query()->paginate($perPage, ['*'], 'page', $page)
            : ShipLatestPositionView::search($searchParameters);
            
        // Highlight search term in the results
        $realtimeShips->getCollection()->transform(function ($ship) use ($text) {
            $ship->name = $this->highlightString($ship->name, $text);
            $ship->imo = $this->highlightString($ship->imo, $text);
            $ship->callsign = $this->highlightString($ship->callsign, $text);
            $ship->mmsi = $this->highlightString($ship->mmsi, $text);
            $ship->destination = $this->highlightString($ship->destination, $text);
            $ship->country_name = $this->highlightString($ship->country_name, $text);
            $ship->cargo_name = $this->highlightString($ship->cargo_name, $text);
            return $ship;
        });

        // Customize the response to include the current page explicitly
        $response = [
            'current_page' => $realtimeShips->currentPage(), // Página atual
            'data' => $realtimeShips->items(), // Dados paginados
            'per_page' => $realtimeShips->perPage(), // Itens por página
            'total' => $realtimeShips->total(), // Total de itens
            'last_page' => $realtimeShips->lastPage(), // Última página
            'next_page_url' => $realtimeShips->nextPageUrl(), // URL da próxima página
            'prev_page_url' => $realtimeShips->previousPageUrl(), // URL da página anterior
        ];

        return response()->json($response);
    }

    // Helper function to highlight search terms in a string
    private function highlightString($str, $search_terms)
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
