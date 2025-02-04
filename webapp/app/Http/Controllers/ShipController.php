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
        $perPage = (int)$request->input('per_page', 5); // Default to 5 items per page
        $page = (int)$request->input('page', 1); // Default to the first page

        // Perform the search using Laravel Scout
        if ($text === '' || $text === 'null') {
            // If no search text, return all ships with pagination
            $realtimeShips = ShipLatestPositionView::search('*')->paginate($perPage, 'page', $page);
        } else {
            // If search text is provided, use Scout to search
            $realtimeShips = ShipLatestPositionView::search($text)->paginate($perPage, 'page', $page);
        }

        // Customize the response to include the current page explicitly
        $response = [
            'current_page' => $realtimeShips->currentPage(), // Current page
            'data' => $realtimeShips->items(), // Paginated data
            'per_page' => $realtimeShips->perPage(), // Items per page
            'total' => $realtimeShips->total(), // Total items
            'last_page' => $realtimeShips->lastPage(), // Last page
            'next_page_url' => $realtimeShips->nextPageUrl(), // URL for the next page
            'prev_page_url' => $realtimeShips->previousPageUrl(), // URL for the previous page
        ];

        return response()->json($response);
    }
}
