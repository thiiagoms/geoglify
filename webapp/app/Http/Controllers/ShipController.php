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
     * Show the Livemap with all ships, and a filtered ship by IMO or MMSI
     *
     * @param string|null $imo
     * @param string|null $mmsi
     * @return \Inertia\Response
     */
    public function index($imo = null, $mmsi = null)
    {
        // Capture parameters directly from the route
        $imo = request()->route('imo');   // Explicitly capture the 'imo' parameter from the route
        $mmsi = request()->route('mmsi'); // Explicitly capture the 'mmsi' parameter from the route

        // Query to get all ships
        $ships = ShipLatestPositionView::all();

        // If IMO or MMSI is provided, filter by IMO or MMSI
        if ($imo) {
            $ship = ShipLatestPositionView::where('imo', $imo)->first();
        } elseif ($mmsi) {
            $ship = ShipLatestPositionView::where('mmsi', $mmsi)->first();
        } else {
            $ship = null;
        }

        // Return data to the frontend
        return Inertia::render('Livemap', [
            'ships' => $ships,
            'ship' => $ship,
        ]);
    }

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
        $text = trim($request->input('text', '*') ?? '*'); // Captura o texto de busca
        $perPage = (int)$request->input('per_page', 5); // Quantidade de itens por página

        if ($text === '' || $text === 'null') {
            $text = '*';
        }

        $realtimeShips = ShipLatestPositionView::search($text)->paginate($perPage);

        return response()->json($realtimeShips);
    }
}
